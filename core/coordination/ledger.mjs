import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { defaultAssuranceStateDirectory } from '../lifecycle/evidence-runtime.mjs';
import { COORDINATION_MODES } from './mode.mjs';
import { resourceKind, resourcesOverlap } from './resourceKey.mjs';

const SCHEMA_VERSION = '2';
const SQLITE_BUSY_TIMEOUT_MS = 5_000;
const AGENT_KINDS = new Set(['claude', 'codex', 'other']);
const MODES = new Set(COORDINATION_MODES.filter((mode) => mode !== 'off'));
const MODE_EPOCH_MODES = new Set(COORDINATION_MODES);
const COVERAGE_PATH_KINDS = new Set(['instrumented', 'uninstrumented']);
export const COORDINATION_COVERAGE_METRICS = Object.freeze([
  'dispatches_seen',
  'claims_registered',
  'claims_skipped_no_editpaths',
  'conflicts_observed',
  'coordination_errors',
]);
const COORDINATION_COVERAGE_METRIC_SET = new Set(COORDINATION_COVERAGE_METRICS);

export async function loadDatabaseSync(importer = (specifier) => import(specifier)) {
  try {
    const sqlite = await importer('node:sqlite');
    if (typeof sqlite?.DatabaseSync !== 'function') {
      throw new Error('DatabaseSync export is missing');
    }
    return sqlite.DatabaseSync;
  } catch (cause) {
    throw new Error(
      'Coordination ledger requires a Node.js runtime with the built-in node:sqlite DatabaseSync API',
      { cause },
    );
  }
}

const requireNodeModule = createRequire(import.meta.url);

function loadDatabaseSyncForConnection() {
  try {
    const sqlite = requireNodeModule('node:sqlite');
    if (typeof sqlite?.DatabaseSync !== 'function') {
      throw new Error('DatabaseSync export is missing');
    }
    return sqlite.DatabaseSync;
  } catch (cause) {
    throw new Error(
      'Coordination ledger requires a Node.js runtime with the built-in node:sqlite DatabaseSync API',
      { cause },
    );
  }
}

export class CoordinationLedgerOpenError extends Error {
  constructor(databasePath, cause) {
    super(`Coordination ledger could not open or validate ${databasePath}`, { cause });
    this.name = 'CoordinationLedgerOpenError';
    this.databasePath = databasePath;
  }
}

export class StaleOwnerError extends Error {
  constructor(claimId) {
    super(
      `Claim ${claimId} is not releasable by the supplied token, fencing epoch, and live state`,
    );
    this.name = 'StaleOwnerError';
    this.claimId = claimId;
  }
}

function requireNonEmpty(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function normalizeResources(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    throw new TypeError('resources must be a non-empty array');
  }

  const normalized = [];
  const seen = new Set();
  for (const resource of resources) {
    const key = typeof resource === 'string' ? resource : resource?.key;
    requireNonEmpty(key, 'resource key');
    const kind = typeof resource === 'object' && resource.kind ? resource.kind : resourceKind(key);
    if (resourceKind(key) !== kind) {
      throw new Error(`Resource kind ${kind} does not match key ${key}`);
    }
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ key, kind });
  }
  return normalized;
}

function nowIso() {
  return new Date().toISOString();
}

function requireTimestamp(value, field = 'timestamp') {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${field} must be an ISO-8601 timestamp`);
  }
  return value;
}

function requireModeEpoch(value, field = 'modeEpoch') {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${field} must be a positive safe integer`);
  }
  return value;
}

function requireCounter(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative safe integer`);
  }
  return value;
}

function requireCoverageMode(mode) {
  if (!MODE_EPOCH_MODES.has(mode)) {
    throw new TypeError(`Unsupported coordination coverage mode: ${mode}`);
  }
  return mode;
}

function normalizeCoverageIncrements(increments) {
  if (increments === null || typeof increments !== 'object' || Array.isArray(increments)) {
    throw new TypeError('Coordination coverage increments must be an object');
  }
  const normalized = {};
  for (const [metric, increment] of Object.entries(increments)) {
    if (!COORDINATION_COVERAGE_METRIC_SET.has(metric)) {
      throw new TypeError(`Unknown coordination coverage metric: ${metric}`);
    }
    normalized[metric] = requireCounter(increment, `increments.${metric}`);
  }
  return normalized;
}

function requireCoveragePath(value, field) {
  return requireNonEmpty(value, field).trim();
}

export function defaultCoordinationDatabasePath(cwd) {
  return path.join(defaultAssuranceStateDirectory(cwd), 'coordination.db');
}

export class CoordinationLedger {
  #database;

  constructor({ cwd = process.cwd(), databasePath = defaultCoordinationDatabasePath(cwd) } = {}) {
    this.databasePath = path.resolve(databasePath);
    try {
      fs.mkdirSync(path.dirname(this.databasePath), { recursive: true });
      const DatabaseSync = loadDatabaseSyncForConnection();
      this.#database = new DatabaseSync(this.databasePath, {
        timeout: SQLITE_BUSY_TIMEOUT_MS,
      });
      this.#database.exec('PRAGMA journal_mode=WAL');
      this.#database.exec('PRAGMA foreign_keys=ON');
      const journalMode = this.#database.prepare('PRAGMA journal_mode').get()?.journal_mode;
      const foreignKeys = this.#database.prepare('PRAGMA foreign_keys').get()?.foreign_keys;
      const busyTimeout = this.#database.prepare('PRAGMA busy_timeout').get()?.timeout;
      if (
        journalMode !== 'wal' ||
        foreignKeys !== 1 ||
        Number(busyTimeout) !== SQLITE_BUSY_TIMEOUT_MS
      ) {
        throw new Error('Coordination ledger SQLite safety pragmas did not engage');
      }
      this.#initializeSchema();
    } catch (cause) {
      try {
        this.#database?.close();
      } catch {
        // The original open/validation failure is the actionable result.
      }
      throw new CoordinationLedgerOpenError(this.databasePath, cause);
    }
  }

  #initializeSchema() {
    try {
      this.#database.exec('BEGIN IMMEDIATE');
      this.#database.exec(`
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS claims (
          claim_id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          attempt_id TEXT NOT NULL,
          agent_kind TEXT NOT NULL CHECK (agent_kind IN ('claude', 'codex', 'other')),
          repo_id TEXT NOT NULL,
          branch TEXT NOT NULL,
          worktree_path TEXT NOT NULL,
          state TEXT NOT NULL CHECK (
            state IN ('reserved', 'active', 'releasing', 'retired', 'needs_reconciliation')
          ),
          fencing_epoch INTEGER NOT NULL,
          owner_token TEXT NOT NULL,
          owner_pid INTEGER NOT NULL,
          mode TEXT NOT NULL CHECK (mode IN ('observe', 'enforce')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS claim_resources (
          claim_id TEXT NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
          resource_key TEXT NOT NULL,
          resource_kind TEXT NOT NULL CHECK (
            resource_kind IN ('path', 'glob', 'dir', 'singleton', 'authority-domain')
          ),
          PRIMARY KEY (claim_id, resource_key)
        );

        CREATE TABLE IF NOT EXISTS conflicts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          claim_id TEXT NOT NULL,
          other_claim_id TEXT NOT NULL,
          resource_key TEXT NOT NULL,
          detected_at TEXT NOT NULL,
          mode TEXT NOT NULL CHECK (mode IN ('observe', 'enforce'))
        );

        CREATE INDEX IF NOT EXISTS claim_resources_resource_key_idx
          ON claim_resources(resource_key);
        CREATE INDEX IF NOT EXISTS claims_state_idx ON claims(state);
      `);

      this.#database
        .prepare(`INSERT OR IGNORE INTO meta(key, value) VALUES ('schema_version', '1')`)
        .run();
      this.#database
        .prepare(`INSERT OR IGNORE INTO meta(key, value) VALUES ('fencing_epoch', '0')`)
        .run();

      const version = this.#database
        .prepare(`SELECT value FROM meta WHERE key = 'schema_version'`)
        .get()?.value;
      if (version === '1') this.#migrateSchemaV1ToV2();
      else if (version !== SCHEMA_VERSION) {
        throw new Error(
          `Unsupported coordination ledger schema version ${String(version)}; expected ${SCHEMA_VERSION}`,
        );
      } else {
        this.#ensureCoverageSchema();
      }
      this.#database.exec('COMMIT');
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  #ensureCoverageSchema() {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS coordination_mode_epochs (
        mode_epoch INTEGER PRIMARY KEY,
        mode TEXT NOT NULL CHECK (mode IN ('off', 'observe', 'enforce')),
        started_at TEXT NOT NULL,
        ended_at TEXT
      );

      CREATE TABLE IF NOT EXISTS coordination_coverage (
        mode_epoch INTEGER NOT NULL
          REFERENCES coordination_mode_epochs(mode_epoch) ON DELETE RESTRICT,
        metric TEXT NOT NULL CHECK (
          metric IN (
            'dispatches_seen',
            'claims_registered',
            'claims_skipped_no_editpaths',
            'conflicts_observed',
            'coordination_errors'
          )
        ),
        value INTEGER NOT NULL CHECK (value >= 0),
        updated_at TEXT NOT NULL,
        PRIMARY KEY (mode_epoch, metric)
      );

      CREATE TABLE IF NOT EXISTS coordination_coverage_paths (
        mode_epoch INTEGER NOT NULL
          REFERENCES coordination_mode_epochs(mode_epoch) ON DELETE RESTRICT,
        path_kind TEXT NOT NULL CHECK (path_kind IN ('instrumented', 'uninstrumented')),
        path TEXT NOT NULL CHECK (length(trim(path)) > 0),
        value INTEGER NOT NULL CHECK (value >= 0),
        updated_at TEXT NOT NULL,
        PRIMARY KEY (mode_epoch, path_kind, path)
      );
    `);
  }

  #migrateSchemaV1ToV2() {
    this.#ensureCoverageSchema();
    const timestamp = nowIso();
    this.#database
      .prepare(
        `INSERT OR IGNORE INTO coordination_mode_epochs(
          mode_epoch, mode, started_at, ended_at
        ) VALUES (1, 'off', ?, NULL)`,
      )
      .run(timestamp);
    this.#database
      .prepare(`INSERT OR IGNORE INTO meta(key, value) VALUES ('mode_epoch', '1')`)
      .run();
    const result = this.#database
      .prepare(`UPDATE meta SET value = ? WHERE key = 'schema_version' AND value = '1'`)
      .run(SCHEMA_VERSION);
    if (result.changes !== 1) {
      throw new Error('Coordination ledger schema version changed during v1→v2 migration');
    }
  }

  #nextEpochInTransaction() {
    const row = this.#database.prepare(`SELECT value FROM meta WHERE key = 'fencing_epoch'`).get();
    const currentEpoch = Number(row?.value);
    if (
      !Number.isSafeInteger(currentEpoch) ||
      currentEpoch < 0 ||
      String(currentEpoch) !== row?.value
    ) {
      throw new Error('Coordination ledger fencing counter is corrupt');
    }
    const nextEpoch = currentEpoch + 1;
    if (!Number.isSafeInteger(nextEpoch)) {
      throw new Error('Coordination ledger fencing counter is exhausted');
    }
    const result = this.#database
      .prepare(`UPDATE meta SET value = ? WHERE key = 'fencing_epoch' AND value = ?`)
      .run(String(nextEpoch), row.value);
    if (result.changes !== 1) {
      throw new Error('Coordination ledger fencing counter changed unexpectedly');
    }
    return nextEpoch;
  }

  #rollbackAfter(error) {
    try {
      this.#database.exec('ROLLBACK');
    } catch {
      // Preserve the transaction's original failure.
    }
    throw error;
  }

  #readCurrentModeEpoch() {
    const meta = this.#database.prepare(`SELECT value FROM meta WHERE key = 'mode_epoch'`).get();
    const currentModeEpoch = Number(meta?.value);
    if (
      !Number.isSafeInteger(currentModeEpoch) ||
      currentModeEpoch <= 0 ||
      String(currentModeEpoch) !== meta?.value
    ) {
      throw new Error('Coordination ledger mode epoch is corrupt');
    }
    const current = this.#database
      .prepare(
        `SELECT mode_epoch, mode, started_at, ended_at
         FROM coordination_mode_epochs
         WHERE mode_epoch = ?`,
      )
      .get(currentModeEpoch);
    if (!current || !MODE_EPOCH_MODES.has(current.mode)) {
      throw new Error('Coordination ledger current mode epoch is missing or corrupt');
    }
    return current;
  }

  #modeEpochInTransaction(mode, timestamp) {
    requireCoverageMode(mode);
    requireTimestamp(timestamp);
    const current = this.#readCurrentModeEpoch();
    const currentModeEpoch = Number(current.mode_epoch);
    if (current.mode === mode) return current;

    const nextModeEpoch = currentModeEpoch + 1;
    if (!Number.isSafeInteger(nextModeEpoch)) {
      throw new Error('Coordination ledger mode epoch is exhausted');
    }
    const closed = this.#database
      .prepare(
        `UPDATE coordination_mode_epochs
         SET ended_at = ?
         WHERE mode_epoch = ? AND ended_at IS NULL`,
      )
      .run(timestamp, currentModeEpoch);
    if (closed.changes !== 1) {
      throw new Error('Coordination ledger current mode epoch changed unexpectedly');
    }
    this.#database
      .prepare(
        `INSERT INTO coordination_mode_epochs(mode_epoch, mode, started_at, ended_at)
         VALUES (?, ?, ?, NULL)`,
      )
      .run(nextModeEpoch, mode, timestamp);
    const advanced = this.#database
      .prepare(`UPDATE meta SET value = ? WHERE key = 'mode_epoch' AND value = ?`)
      .run(String(nextModeEpoch), String(currentModeEpoch));
    if (advanced.changes !== 1) {
      throw new Error('Coordination ledger mode epoch changed unexpectedly');
    }
    return {
      mode_epoch: nextModeEpoch,
      mode,
      started_at: timestamp,
      ended_at: null,
    };
  }

  currentModeEpoch({ mode, timestamp = nowIso() }) {
    try {
      this.#database.exec('BEGIN IMMEDIATE');
      const modeEpoch = this.#modeEpochInTransaction(mode, timestamp);
      this.#database.exec('COMMIT');
      return modeEpoch;
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  peekModeEpoch() {
    try {
      this.#database.exec('BEGIN');
      const modeEpoch = this.#readCurrentModeEpoch();
      this.#database.exec('COMMIT');
      return modeEpoch;
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  incrementCoverage({
    mode,
    modeEpoch,
    increments = {},
    dispatchPath,
    uninstrumentedPath,
    timestamp = nowIso(),
  }) {
    requireCoverageMode(mode);
    requireTimestamp(timestamp);
    const normalizedIncrements = normalizeCoverageIncrements(increments);
    if (dispatchPath !== undefined) requireCoveragePath(dispatchPath, 'dispatchPath');
    if (uninstrumentedPath !== undefined) {
      requireCoveragePath(uninstrumentedPath, 'uninstrumentedPath');
    }

    try {
      this.#database.exec('BEGIN IMMEDIATE');
      const targetModeEpoch =
        modeEpoch === undefined
          ? this.#modeEpochInTransaction(mode, timestamp).mode_epoch
          : requireModeEpoch(modeEpoch);
      const target = this.#database
        .prepare(
          `SELECT mode_epoch, mode, started_at, ended_at
           FROM coordination_mode_epochs
           WHERE mode_epoch = ?`,
        )
        .get(targetModeEpoch);
      if (!target || target.mode !== mode) {
        throw new Error(
          `Coordination coverage mode epoch ${targetModeEpoch} does not belong to mode ${mode}`,
        );
      }

      const incrementMetric = this.#database.prepare(`
        INSERT INTO coordination_coverage(mode_epoch, metric, value, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(mode_epoch, metric) DO UPDATE SET
          value = coordination_coverage.value + excluded.value,
          updated_at = excluded.updated_at
      `);
      for (const [metric, increment] of Object.entries(normalizedIncrements)) {
        incrementMetric.run(targetModeEpoch, metric, increment, timestamp);
      }

      const incrementPath = this.#database.prepare(`
        INSERT INTO coordination_coverage_paths(
          mode_epoch, path_kind, path, value, updated_at
        ) VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(mode_epoch, path_kind, path) DO UPDATE SET
          value = coordination_coverage_paths.value + excluded.value,
          updated_at = excluded.updated_at
      `);
      if (dispatchPath !== undefined) {
        incrementPath.run(targetModeEpoch, 'instrumented', dispatchPath.trim(), timestamp);
      }
      if (uninstrumentedPath !== undefined) {
        incrementPath.run(targetModeEpoch, 'uninstrumented', uninstrumentedPath.trim(), timestamp);
      }

      this.#database.exec('COMMIT');
      return this.coverageSnapshot({ modeEpoch: targetModeEpoch });
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  coverageSnapshot({ modeEpoch } = {}) {
    const resolvedModeEpoch =
      modeEpoch === undefined
        ? Number(
            this.#database.prepare(`SELECT value FROM meta WHERE key = 'mode_epoch'`).get()?.value,
          )
        : requireModeEpoch(modeEpoch);
    requireModeEpoch(resolvedModeEpoch);
    const epoch = this.#database
      .prepare(
        `SELECT mode_epoch, mode, started_at, ended_at
         FROM coordination_mode_epochs
         WHERE mode_epoch = ?`,
      )
      .get(resolvedModeEpoch);
    if (!epoch) {
      throw new Error(`Coordination coverage mode epoch ${resolvedModeEpoch} does not exist`);
    }
    const counters = Object.fromEntries(COORDINATION_COVERAGE_METRICS.map((metric) => [metric, 0]));
    for (const row of this.#database
      .prepare(
        `SELECT metric, value
         FROM coordination_coverage
         WHERE mode_epoch = ?
         ORDER BY metric`,
      )
      .all(resolvedModeEpoch)) {
      counters[row.metric] = Number(row.value);
    }
    const pathHits = {
      instrumented: {},
      uninstrumented: {},
    };
    for (const row of this.#database
      .prepare(
        `SELECT path_kind, path, value
         FROM coordination_coverage_paths
         WHERE mode_epoch = ?
         ORDER BY path_kind, path`,
      )
      .all(resolvedModeEpoch)) {
      if (!COVERAGE_PATH_KINDS.has(row.path_kind)) {
        throw new Error(`Coordination coverage path kind is corrupt: ${row.path_kind}`);
      }
      pathHits[row.path_kind][row.path] = Number(row.value);
    }
    return {
      ...counters,
      dispatch_path_hits: pathHits.instrumented,
      uninstrumented_path_hits: pathHits.uninstrumented,
      mode_epoch: Number(epoch.mode_epoch),
      mode: epoch.mode,
      started_at: epoch.started_at,
      ended_at: epoch.ended_at,
      updated_at:
        this.#database
          .prepare(
            `SELECT MAX(updated_at) AS updated_at
             FROM (
               SELECT updated_at
               FROM coordination_coverage
               WHERE mode_epoch = ?
               UNION ALL
               SELECT updated_at
               FROM coordination_coverage_paths
               WHERE mode_epoch = ?
             )`,
          )
          .get(resolvedModeEpoch, resolvedModeEpoch)?.updated_at ?? epoch.started_at,
    };
  }

  nextEpoch() {
    try {
      this.#database.exec('BEGIN IMMEDIATE');
      const epoch = this.#nextEpochInTransaction();
      this.#database.exec('COMMIT');
      return epoch;
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  admit({
    taskId,
    attemptId,
    agentKind,
    repoId,
    branch,
    worktreePath,
    ownerToken,
    ownerPid,
    resources,
    mode,
  }) {
    requireNonEmpty(taskId, 'taskId');
    requireNonEmpty(attemptId, 'attemptId');
    requireNonEmpty(agentKind, 'agentKind');
    requireNonEmpty(repoId, 'repoId');
    requireNonEmpty(branch, 'branch');
    requireNonEmpty(worktreePath, 'worktreePath');
    requireNonEmpty(ownerToken, 'ownerToken');
    if (!AGENT_KINDS.has(agentKind)) throw new TypeError(`Unsupported agentKind: ${agentKind}`);
    if (!MODES.has(mode)) throw new TypeError(`Unsupported coordination mode: ${mode}`);
    if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0) {
      throw new TypeError('ownerPid must be a positive integer');
    }
    const requestedResources = normalizeResources(resources);
    const claimId = crypto.randomUUID();
    const timestamp = nowIso();

    try {
      this.#database.exec('BEGIN IMMEDIATE');
      const liveRows = this.#database
        .prepare(
          `
          SELECT
            c.claim_id,
            c.task_id,
            cr.resource_key,
            cr.resource_kind
          FROM claims c
          JOIN claim_resources cr ON cr.claim_id = c.claim_id
          WHERE c.state IN ('reserved', 'active', 'needs_reconciliation')
          ORDER BY c.claim_id, cr.resource_key
        `,
        )
        .all();
      const liveClaims = new Map();
      for (const row of liveRows) {
        const claim = liveClaims.get(row.claim_id) ?? {
          taskId: row.task_id,
          resources: [],
        };
        claim.resources.push({ key: row.resource_key, kind: row.resource_kind });
        liveClaims.set(row.claim_id, claim);
      }

      const conflicts = [];
      for (const [otherClaimId, otherClaim] of liveClaims) {
        const overlap = resourcesOverlap(requestedResources, otherClaim.resources);
        for (const pair of overlap.pairs) {
          conflicts.push({
            claimId,
            otherClaimId,
            otherTaskId: otherClaim.taskId,
            resourceKey: pair.leftKey,
            otherResourceKey: pair.rightKey,
          });
        }
      }

      const insertConflict = this.#database.prepare(`
        INSERT INTO conflicts(
          claim_id, other_claim_id, resource_key, detected_at, mode
        ) VALUES (?, ?, ?, ?, ?)
      `);
      for (const conflict of conflicts) {
        insertConflict.run(
          conflict.claimId,
          conflict.otherClaimId,
          conflict.resourceKey,
          timestamp,
          mode,
        );
      }

      if (conflicts.length > 0 && mode === 'enforce') {
        this.#database.exec('COMMIT');
        return { admitted: false, claimId, conflicts };
      }

      const fencingEpoch = this.#nextEpochInTransaction();
      this.#database
        .prepare(
          `
          INSERT INTO claims(
            claim_id, task_id, attempt_id, agent_kind, repo_id, branch, worktree_path,
            state, fencing_epoch, owner_token, owner_pid, mode, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
        `,
        )
        .run(
          claimId,
          taskId,
          attemptId,
          agentKind,
          repoId,
          branch,
          worktreePath,
          fencingEpoch,
          ownerToken,
          ownerPid,
          mode,
          timestamp,
          timestamp,
        );
      const insertResource = this.#database.prepare(`
        INSERT INTO claim_resources(claim_id, resource_key, resource_kind)
        VALUES (?, ?, ?)
      `);
      for (const resource of requestedResources) {
        insertResource.run(claimId, resource.key, resource.kind);
      }
      this.#database.exec('COMMIT');
      return { admitted: true, claimId, fencingEpoch, conflicts };
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  release({ claimId, ownerToken, fencingEpoch }) {
    requireNonEmpty(claimId, 'claimId');
    requireNonEmpty(ownerToken, 'ownerToken');
    if (!Number.isSafeInteger(fencingEpoch) || fencingEpoch <= 0) {
      throw new TypeError('fencingEpoch must be a positive integer');
    }
    const result = this.#database
      .prepare(
        `
        UPDATE claims
        SET state = 'retired', updated_at = ?
        WHERE claim_id = ? AND owner_token = ? AND fencing_epoch = ?
          AND state IN ('reserved', 'active', 'releasing')
      `,
      )
      .run(nowIso(), claimId, ownerToken, fencingEpoch);
    if (result.changes !== 1) throw new StaleOwnerError(claimId);
    return { claimId, state: 'retired' };
  }

  reconcile({ isPidAlive }) {
    if (typeof isPidAlive !== 'function') {
      throw new TypeError('isPidAlive must be a function');
    }
    const candidates = this.#database
      .prepare(
        `
        SELECT claim_id, owner_pid, owner_token, fencing_epoch
        FROM claims
        WHERE state IN ('reserved', 'active')
        ORDER BY claim_id
      `,
      )
      .all();
    const dead = candidates.filter((claim) => !isPidAlive(Number(claim.owner_pid)));
    if (dead.length === 0) return { reconciledClaimIds: [] };

    try {
      this.#database.exec('BEGIN IMMEDIATE');
      const update = this.#database.prepare(`
        UPDATE claims
        SET state = 'needs_reconciliation', updated_at = ?
        WHERE claim_id = ?
          AND owner_token = ?
          AND fencing_epoch = ?
          AND state IN ('reserved', 'active')
      `);
      const reconciledClaimIds = [];
      const timestamp = nowIso();
      for (const claim of dead) {
        const result = update.run(
          timestamp,
          claim.claim_id,
          claim.owner_token,
          claim.fencing_epoch,
        );
        if (result.changes === 1) reconciledClaimIds.push(claim.claim_id);
      }
      this.#database.exec('COMMIT');
      return { reconciledClaimIds };
    } catch (error) {
      return this.#rollbackAfter(error);
    }
  }

  getClaim(claimId) {
    return this.#database.prepare(`SELECT * FROM claims WHERE claim_id = ?`).get(claimId) ?? null;
  }

  listConflicts() {
    return this.#database.prepare(`SELECT * FROM conflicts ORDER BY id`).all();
  }

  close() {
    this.#database.close();
  }
}

export function openCoordinationLedger(options) {
  return new CoordinationLedger(options);
}
