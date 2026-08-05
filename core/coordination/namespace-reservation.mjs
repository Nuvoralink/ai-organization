/* global process */

/**
 * Namespace RESERVATION authority — the PROACTIVE half of shared-namespace coordination.
 *
 * PROBLEM CLASS (project-agnostic). Parallel/swarm agents each work in an isolated worktree branched
 * from the same base. When two agents each independently take "the next value" from a shared sequential
 * namespace — the next migration number, the next ADR number, the next decision-log ID, a free dev
 * port — they collide, and the collision is invisible until integration (or, for ports, at runtime as
 * EADDRINUSE). This authority lets an agent RESERVE a unique value up front, atomically, so the
 * collision is never created; a per-namespace collision GATE remains the mechanical backstop.
 *
 * THIS IS THE CANONICAL MANAGED SOURCE. It lives in the AI-Organization control plane at
 * `core/coordination/namespace-reservation.mjs` and is delivered by the `*-shared-runtime` tree
 * mapping to `.ai-organization/runtime/core/coordination/namespace-reservation.mjs` in every
 * consuming project. DO NOT EDIT A DELIVERED COPY — an edit inside a project forks the digest-pinned
 * managed asset and the next install silently reverts it. Fix it here, then re-install.
 *
 * IT CONTAINS NO PROJECT-SPECIFIC PATHS, PATTERNS, OR RANGES. A project supplies a `spec` per
 * namespace (see `reserve`/`reconcile`) that binds this generic machinery to that project's paths, so
 * each project ships only its own ~1-screen `scripts/reservation-config.mjs`. `tests/namespace-
 * reservation-promotion.test.mjs` in the control plane fails the build if a project literal reappears
 * here.
 *
 * THE SHARED LEDGER LIVES IN THE GIT COMMON DIR, not the working tree. Every worktree of one repo
 * shares ONE `.git` common dir (`git rev-parse --git-common-dir`), so a file written there is instantly
 * visible to every worktree WITHOUT a commit — a committed file would be invisible across branches until
 * merged, defeating the purpose. This mirrors the shared test-DB lease pattern.
 *
 * A `spec` is plain data plus three small closures over the project's paths:
 *   {
 *     kind: 'sequential' | 'range',
 *     scope: null | { label, validate(scopeValue) },   // a sub-namespace (ADR domain, decision prefix)
 *     validateLabel(label) -> boolean,                  // the human slug/title attached to the value
 *     occupiedNumbers(cwd, scope, { refOnly, baseRef }) -> number[],   // sequential: values already taken
 *     formatValue(scope, number, label) -> string,      // the reserved token (e.g. '0083_slug', 'ADR-BIL-4')
 *     pad,                                              // sequential: zero-pad width (display only)
 *     range: [start, end],                              // range only
 *     reservedValues(cwd) -> number[],                  // range only: fixed values agents must never take
 *     baseRef,                                          // sequential: the durable floor + landed source
 *   }
 * `landed` (for reconciliation) is UNIFORM and needs no per-namespace closure: a sequential reservation
 * is landed once its NUMBER appears in the base-ref-only `occupiedNumbers(scope)` scan (the migration/
 * ADR/decision was merged); a range reservation never lands (ports are ephemeral — released or aged out).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const RESERVATION_DIRECTORY = 'namespace-reservations';
export const RESERVATION_LEDGER_FILE = 'ledger.json';
export const RESERVATION_LOCK_DIRECTORY = '.lock';
export const RESERVATION_SCHEMA_VERSION = 1;

/** A reservation older than this that never landed is treated as an abandoned branch/session. */
export const DEFAULT_STALE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
/** Total time to wait for the read-modify-write mutex before giving up (fail-closed). */
export const DEFAULT_LOCK_TIMEOUT_MS = 10_000;
/** A held lock older than this is a crashed critical section (which is milliseconds), not a live one. */
export const DEFAULT_LOCK_STALE_MS = 60_000;

const RESERVED_STATUS = 'reserved';

/**
 * Environment variables consulted for the reserving agent's identity, in order. Provenance only — the
 * value is recorded on the reservation so `--list` can name who holds it; nothing keys off it. Kept
 * neutral so one orchestrator driving several projects sets it once.
 */
export const AGENT_ID_ENV_VARS = Object.freeze(['NAMESPACE_RESERVATION_AGENT_ID', 'AGENT_ID']);

/** Environment variable overriding a sequential namespace's durable floor (testing + rebasing). */
export const BASE_REF_ENV_VAR = 'NAMESPACE_RESERVATION_BASE_REF';

/** First non-empty agent-identity env var, else null. */
export function resolveAgentId(env = process.env) {
  for (const name of AGENT_ID_ENV_VARS) {
    const value = env[name];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return null;
}

/**
 * The base ref a project's sequential namespaces measure against: the env override when set, else the
 * project's own default (its integration target, e.g. `main`). A project config calls this rather than
 * re-reading the environment, so every project honours the same override name.
 */
export function resolveBaseRef(projectDefault, env = process.env) {
  const override = env[BASE_REF_ENV_VAR];
  return typeof override === 'string' && override.trim() !== '' ? override.trim() : projectDefault;
}

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function requireIso(value, field) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${field} must be an ISO-8601 timestamp, got ${JSON.stringify(value)}`);
  }
  return value;
}

// ---------------------------------------------------------------------------------------------------
// Git + filesystem scan helpers — exported so a project config composes them with its own paths.
// They are project-agnostic: every path/pattern is an argument, never a literal.
// ---------------------------------------------------------------------------------------------------

function git(args, { cwd }) {
  return String(
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
  );
}

/** Absolute Git common directory shared by every worktree of this repo. */
export function resolveCommonGitDir(cwd = process.cwd()) {
  const raw = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd }).trim();
  return path.resolve(raw);
}

/** Repository root of the calling worktree. */
export function resolveWorktreeRoot(cwd = process.cwd()) {
  return git(['rev-parse', '--show-toplevel'], { cwd }).trim();
}

/** Current branch name, or `null` when detached — recorded on the reservation for provenance only. */
export function resolveBranch(cwd = process.cwd()) {
  try {
    const name = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd }).trim();
    return name || null;
  } catch {
    return null;
  }
}

/** Every path under the Git-common-dir reservation directory, validated to stay inside it. */
export function reservationPaths(commonGitDir) {
  const commonDir = path.resolve(commonGitDir);
  const dir = path.resolve(commonDir, RESERVATION_DIRECTORY);
  const relative = path.relative(commonDir, dir);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe reservation path outside Git common dir: ${dir}`);
  }
  return {
    commonDir,
    dir,
    ledgerFile: path.join(dir, RESERVATION_LEDGER_FILE),
    lockDir: path.join(dir, RESERVATION_LOCK_DIRECTORY),
  };
}

/**
 * The basenames of the `tree` (directory) or `blob` (file) entries directly under `dir`, from the base
 * ref, from the local worktree, or both (union). `git ls-tree <ref> <dir>/` lines are
 * `<mode> <type> <sha>\t<name>`; the type column distinguishes trees from blobs (so a stray file next to
 * migration DIRECTORIES, or vice-versa, is excluded). A ref that does not resolve contributes nothing.
 */
export function dirEntryNames(
  cwd,
  dir,
  { baseRef, entryType = 'tree', includeRef = true, includeLocal = true } = {},
) {
  const wanted = entryType === 'blob' ? 'blob' : 'tree';
  const names = new Set();
  const posixDir = dir.replaceAll('\\', '/');
  if (includeRef && baseRef) {
    let output = null;
    try {
      output = git(['ls-tree', baseRef, `${posixDir}/`], { cwd });
    } catch {
      output = null; // ref did not resolve — degrade to local-only
    }
    if (output !== null) {
      for (const line of output.split(/\r?\n/u)) {
        const tabIndex = line.indexOf('\t');
        if (tabIndex === -1) continue;
        const [, type] = line.slice(0, tabIndex).trim().split(/\s+/u);
        if (type !== wanted) continue;
        names.add(path.posix.basename(line.slice(tabIndex + 1).trim()));
      }
    }
  }
  if (includeLocal) {
    try {
      for (const entry of fs.readdirSync(path.join(cwd, dir), { withFileTypes: true })) {
        if (wanted === 'tree' ? entry.isDirectory() : entry.isFile()) names.add(entry.name);
      }
    } catch {
      // The directory may not exist yet on this branch — contributes nothing.
    }
  }
  return names;
}

/**
 * The text of `file` from the base ref, the local worktree, or both concatenated. Used to scan a
 * single authority file (e.g. a decision log) for tokens already in use. A missing ref/file contributes
 * an empty string.
 */
export function fileText(cwd, file, { baseRef, includeRef = true, includeLocal = true } = {}) {
  const parts = [];
  const posixFile = file.replaceAll('\\', '/');
  if (includeRef && baseRef) {
    try {
      parts.push(git(['show', `${baseRef}:${posixFile}`], { cwd }));
    } catch {
      // ref/file absent — contributes nothing.
    }
  }
  if (includeLocal) {
    try {
      parts.push(fs.readFileSync(path.join(cwd, file), 'utf8'));
    } catch {
      // absent locally — contributes nothing.
    }
  }
  return parts.join('\n');
}

/** Extract every integer captured by group 1 of `pattern` across `names` (a Set or array of strings). */
export function extractNumbers(names, pattern) {
  const numbers = [];
  for (const name of names) {
    const match = pattern.exec(name);
    if (match && match[1] !== undefined) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isSafeInteger(n)) numbers.push(n);
    }
    pattern.lastIndex = 0; // reset in case a caller passes a /g regex
  }
  return numbers;
}

/** Extract every integer captured by group 1 of a /g `pattern` across the whole `text`. */
export function extractNumbersFromText(text, pattern) {
  const numbers = [];
  const global = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  for (const match of String(text).matchAll(global)) {
    if (match[1] !== undefined) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isSafeInteger(n)) numbers.push(n);
    }
  }
  return numbers;
}

// ---------------------------------------------------------------------------------------------------
// The atomic read-modify-write mutex — a mkdir lock in the Git common dir (the test-db-lease pattern).
// ---------------------------------------------------------------------------------------------------

/** Portable synchronous sleep (no dependency) so the acquire loop can back off without async. */
function sleepSync(ms) {
  if (ms <= 0) return;
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, ms);
}

export class ReservationLockTimeoutError extends Error {
  constructor(lockDir, timeoutMs) {
    super(
      `Could not acquire the namespace-reservation lock at ${lockDir} within ${timeoutMs}ms. ` +
        'Another reservation is in progress; retry shortly. If none is running, the lock is crash ' +
        'residue — it self-clears after the stale window.',
    );
    this.name = 'ReservationLockTimeoutError';
    this.code = 'RESERVATION_LOCK_TIMEOUT';
    this.lockDir = lockDir;
  }
}

/**
 * Run `critical()` while holding an atomic mkdir mutex. `fs.mkdirSync` is atomic on every platform: the
 * creator holds the lock; `EEXIST` means someone else does. The critical section is milliseconds, so a
 * lock older than `staleMs` (default 60s) is a crashed process and is stolen with a warning. The steal
 * is race-safe because `mkdirSync` stays the single arbiter. A merely-paused (not crashed) owner being
 * stolen is bounded by the per-namespace collision gate, which catches any resulting duplicate.
 */
export function withReservationLock(
  lockDir,
  critical,
  {
    timeoutMs = DEFAULT_LOCK_TIMEOUT_MS,
    staleMs = DEFAULT_LOCK_STALE_MS,
    pollMs = 50,
    now = () => Date.now(),
    sleep = sleepSync,
    warn = console.warn,
  } = {},
) {
  fs.mkdirSync(path.dirname(lockDir), { recursive: true });
  const deadline = now() + timeoutMs;
  let held = false;
  while (!held) {
    try {
      fs.mkdirSync(lockDir);
      held = true;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      let ageMs = 0;
      try {
        ageMs = now() - fs.statSync(lockDir).mtimeMs;
      } catch {
        continue; // the lock vanished between mkdir and stat — retry immediately
      }
      if (ageMs > staleMs) {
        warn(
          `[namespace-reservation] stealing a stale lock at ${lockDir} (held ${Math.round(ageMs / 1000)}s ` +
            `> ${Math.round(staleMs / 1000)}s stale window) — the previous reservation almost certainly crashed.`,
        );
        fs.rmSync(lockDir, { recursive: true, force: true });
        continue;
      }
      if (now() >= deadline) throw new ReservationLockTimeoutError(lockDir, timeoutMs);
      sleep(pollMs);
    }
  }
  try {
    return critical();
  } finally {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------------------------------
// Ledger IO — atomic temp+rename writes so a reader never sees a half-written file.
// One ledger holds reservations across ALL namespaces; the mutex serializes every writer.
// ---------------------------------------------------------------------------------------------------

function emptyLedger() {
  return { schemaVersion: RESERVATION_SCHEMA_VERSION, reservations: [] };
}

/** Validate a parsed ledger, fail-closed on anything unexpected (a corrupt ledger is not "empty"). */
export function normalizeLedger(value, { source = 'ledger' } = {}) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${source} is not a JSON object`);
  }
  if (value.schemaVersion !== RESERVATION_SCHEMA_VERSION) {
    throw new Error(
      `${source} schemaVersion ${JSON.stringify(value.schemaVersion)} is unsupported (expected ${RESERVATION_SCHEMA_VERSION})`,
    );
  }
  if (!Array.isArray(value.reservations)) {
    throw new Error(`${source}.reservations must be an array`);
  }
  const reservations = value.reservations.map((row, index) => {
    const where = `${source}.reservations[${index}]`;
    requireNonEmptyString(row?.namespace, `${where}.namespace`);
    requireNonEmptyString(row?.value, `${where}.value`);
    if (!Number.isSafeInteger(row?.number) || row.number < 0) {
      throw new Error(`${where}.number must be a non-negative integer`);
    }
    requireIso(row?.reservedAt, `${where}.reservedAt`);
    return {
      namespace: row.namespace,
      scope: typeof row.scope === 'string' ? row.scope : null,
      value: row.value,
      number: row.number,
      label: typeof row.label === 'string' ? row.label : null,
      agent: typeof row.agent === 'string' ? row.agent : null,
      branch: typeof row.branch === 'string' ? row.branch : null,
      worktreePath: typeof row.worktreePath === 'string' ? row.worktreePath : null,
      reservedAt: row.reservedAt,
      status: RESERVED_STATUS,
    };
  });
  return { schemaVersion: RESERVATION_SCHEMA_VERSION, reservations };
}

export function readLedger(ledgerFile) {
  let raw;
  try {
    raw = fs.readFileSync(ledgerFile, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyLedger();
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`Namespace-reservation ledger at ${ledgerFile} is unreadable JSON`, { cause });
  }
  return normalizeLedger(parsed, { source: ledgerFile });
}

export function writeLedgerAtomic(ledgerFile, ledger) {
  const directory = path.dirname(ledgerFile);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryFile = path.join(
    directory,
    `.${path.basename(ledgerFile)}.tmp-${process.pid}-${crypto.randomBytes(8).toString('hex')}`,
  );
  const body = `${JSON.stringify(ledger, null, 2)}\n`;
  fs.writeFileSync(temporaryFile, body, { encoding: 'utf8', flag: 'wx' });
  try {
    fs.renameSync(temporaryFile, ledgerFile);
  } catch (error) {
    fs.rmSync(temporaryFile, { force: true });
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------------
// PURE allocation + classification — no git, no fs, so the meta-test drives every branch with data.
// ---------------------------------------------------------------------------------------------------

/** Sequential allocation: one above the max occupied value (gaps are never back-filled). */
export function allocateSequential(occupiedNumbers) {
  let max = 0;
  for (const n of occupiedNumbers) if (Number.isSafeInteger(n) && n > max) max = n;
  return max + 1;
}

/** Range allocation: the lowest value in `[start, end]` not in `excluded`. Throws when the range is full. */
export function allocateInRange([start, end], excluded) {
  const taken = excluded instanceof Set ? excluded : new Set(excluded);
  for (let n = start; n <= end; n += 1) {
    if (!taken.has(n)) return n;
  }
  throw new Error(
    `no free value in range [${start}, ${end}] — all ${end - start + 1} are reserved or in use`,
  );
}

/**
 * Split a namespace's reservations into merged (their number has landed on the base ref), stalePruned
 * (older than `staleMs` and not landed — an abandoned branch), and kept. `landedValues` is the set of
 * reservation VALUES whose number the caller found on the base ref (empty for range namespaces).
 */
export function classifyReservations({
  reservations,
  landedValues,
  now,
  staleMs = DEFAULT_STALE_MS,
}) {
  requireIso(now, 'now');
  const nowMs = Date.parse(now);
  const landed = landedValues instanceof Set ? landedValues : new Set(landedValues);
  const kept = [];
  const merged = [];
  const stalePruned = [];
  for (const reservation of reservations) {
    if (landed.has(reservation.value)) {
      merged.push(reservation);
      continue;
    }
    if (nowMs - Date.parse(reservation.reservedAt) > staleMs) {
      stalePruned.push(reservation);
      continue;
    }
    kept.push(reservation);
  }
  return { kept, merged, stalePruned };
}

// ---------------------------------------------------------------------------------------------------
// Spec plumbing — the small amount of glue between the generic core and a project's namespace config.
// ---------------------------------------------------------------------------------------------------

function requireSpec(namespace, spec) {
  if (!spec || typeof spec !== 'object') {
    throw new Error(
      `unknown namespace ${JSON.stringify(namespace)} — no reservation spec is configured`,
    );
  }
  if (spec.kind !== 'sequential' && spec.kind !== 'range') {
    throw new Error(`namespace ${namespace} has an invalid kind ${JSON.stringify(spec.kind)}`);
  }
  return spec;
}

function resolveScope(namespace, spec, scope) {
  if (spec.scope) {
    requireNonEmptyString(scope, `${namespace} scope (${spec.scope.label})`);
    if (typeof spec.scope.validate === 'function' && !spec.scope.validate(scope)) {
      throw new Error(`invalid ${namespace} ${spec.scope.label}: ${JSON.stringify(scope)}`);
    }
    return scope;
  }
  if (scope != null && scope !== '') {
    throw new Error(`namespace ${namespace} takes no scope, but ${JSON.stringify(scope)} was given`);
  }
  return null;
}

/** Reservation VALUES of `nsReservations` whose number is landed on the base ref (sequential only). */
function landedValuesForNamespace(cwd, spec, nsReservations, baseRef) {
  if (spec.kind !== 'sequential') return new Set();
  const landed = new Set();
  const refOccupiedByScope = new Map();
  for (const reservation of nsReservations) {
    const scopeKey = reservation.scope ?? '';
    if (!refOccupiedByScope.has(scopeKey)) {
      refOccupiedByScope.set(
        scopeKey,
        new Set(spec.occupiedNumbers(cwd, reservation.scope, { refOnly: true, baseRef })),
      );
    }
    if (refOccupiedByScope.get(scopeKey).has(reservation.number)) landed.add(reservation.value);
  }
  return landed;
}

function reconcileNamespaceInLedger({ cwd, namespace, spec, ledger, now, staleMs, baseRef }) {
  const nsReservations = ledger.reservations.filter((r) => r.namespace === namespace);
  const otherReservations = ledger.reservations.filter((r) => r.namespace !== namespace);
  const landedValues = landedValuesForNamespace(cwd, spec, nsReservations, baseRef);
  const { kept, merged, stalePruned } = classifyReservations({
    reservations: nsReservations,
    landedValues,
    now,
    staleMs,
  });
  return { otherReservations, kept, merged, stalePruned };
}

// ---------------------------------------------------------------------------------------------------
// High-level operations — the CLI wires git + fs + lock around the pure core.
// ---------------------------------------------------------------------------------------------------

function gatherPaths(cwd) {
  const commonGitDir = resolveCommonGitDir(cwd);
  return {
    commonGitDir,
    worktreeRoot: resolveWorktreeRoot(cwd),
    paths: reservationPaths(commonGitDir),
  };
}

/**
 * Claim the next free value in `namespace`, atomically against concurrent claims. The whole
 * read-modify-write (reconcile → scan occupied → allocate → append) runs inside the mkdir mutex so two
 * simultaneous callers serialize and never compute the same value.
 */
export function reserve({
  cwd = process.cwd(),
  namespace,
  spec,
  scope = null,
  label,
  baseRef,
  staleMs = DEFAULT_STALE_MS,
  now = new Date().toISOString(),
  agent = resolveAgentId(),
  lockOptions = {},
}) {
  requireNonEmptyString(namespace, 'namespace');
  requireSpec(namespace, spec);
  const resolvedScope = resolveScope(namespace, spec, scope);
  requireNonEmptyString(label, 'label');
  if (typeof spec.validateLabel === 'function' && !spec.validateLabel(label)) {
    throw new Error(
      `invalid ${namespace} label ${JSON.stringify(label)} — it would produce a value the collision gate rejects`,
    );
  }
  const effectiveBaseRef = baseRef ?? spec.baseRef;
  const { paths, worktreeRoot } = gatherPaths(cwd);
  const meta = {
    agent: typeof agent === 'string' && agent.trim() !== '' ? agent.trim() : null,
    branch: resolveBranch(cwd),
    worktreePath: worktreeRoot,
  };

  return withReservationLock(
    paths.lockDir,
    () => {
      const ledger = readLedger(paths.ledgerFile);
      const { otherReservations, kept, merged, stalePruned } = reconcileNamespaceInLedger({
        cwd,
        namespace,
        spec,
        ledger,
        now,
        staleMs,
        baseRef: effectiveBaseRef,
      });

      let number;
      if (spec.kind === 'sequential') {
        const scanned = spec.occupiedNumbers(cwd, resolvedScope, {
          refOnly: false,
          baseRef: effectiveBaseRef,
        });
        const outstanding = kept
          .filter((r) => (r.scope ?? null) === resolvedScope)
          .map((r) => r.number);
        number = allocateSequential([...scanned, ...outstanding]);
      } else {
        const reserved = typeof spec.reservedValues === 'function' ? spec.reservedValues(cwd) : [];
        const outstanding = kept.map((r) => r.number);
        number = allocateInRange(spec.range, new Set([...reserved, ...outstanding]));
      }

      const value = spec.formatValue(resolvedScope, number, label);
      // Defensive: allocation is strictly free of every input, so this cannot fire — but a silent
      // collision here would be the exact bug this tool exists to prevent, so assert rather than trust.
      if (kept.some((r) => r.value === value)) {
        throw new Error(
          `computed reservation ${value} unexpectedly collides with an outstanding reservation`,
        );
      }
      const reservation = {
        namespace,
        scope: resolvedScope,
        value,
        number,
        label,
        agent: meta.agent,
        branch: meta.branch,
        worktreePath: meta.worktreePath,
        reservedAt: now,
        status: RESERVED_STATUS,
      };

      writeLedgerAtomic(paths.ledgerFile, {
        schemaVersion: RESERVATION_SCHEMA_VERSION,
        reservations: [...otherReservations, ...kept, reservation],
      });
      return {
        value,
        number,
        reservation,
        merged,
        stalePruned,
        baseRef: effectiveBaseRef,
        ledgerFile: paths.ledgerFile,
      };
    },
    lockOptions,
  );
}

/** Retire merged + stale reservations for ONE namespace without claiming a new value. */
export function reconcile({
  cwd = process.cwd(),
  namespace,
  spec,
  baseRef,
  staleMs = DEFAULT_STALE_MS,
  now = new Date().toISOString(),
  lockOptions = {},
}) {
  requireNonEmptyString(namespace, 'namespace');
  requireSpec(namespace, spec);
  const effectiveBaseRef = baseRef ?? spec.baseRef;
  const { paths } = gatherPaths(cwd);
  return withReservationLock(
    paths.lockDir,
    () => {
      const ledger = readLedger(paths.ledgerFile);
      const { otherReservations, kept, merged, stalePruned } = reconcileNamespaceInLedger({
        cwd,
        namespace,
        spec,
        ledger,
        now,
        staleMs,
        baseRef: effectiveBaseRef,
      });
      writeLedgerAtomic(paths.ledgerFile, {
        schemaVersion: RESERVATION_SCHEMA_VERSION,
        reservations: [...otherReservations, ...kept],
      });
      return {
        merged,
        stalePruned,
        outstanding: kept,
        baseRef: effectiveBaseRef,
        ledgerFile: paths.ledgerFile,
      };
    },
    lockOptions,
  );
}

/** Read-only snapshot of outstanding reservations (no lock — reads are atomic-rename consistent). */
export function list({ cwd = process.cwd() } = {}) {
  const { paths } = gatherPaths(cwd);
  return { ...readLedger(paths.ledgerFile), ledgerFile: paths.ledgerFile };
}

/** Explicitly abandon one reservation by its exact value (the named cleanup for a dropped slice). */
export function release({ cwd = process.cwd(), value, lockOptions = {} }) {
  requireNonEmptyString(value, 'value');
  const { paths } = gatherPaths(cwd);
  return withReservationLock(
    paths.lockDir,
    () => {
      const ledger = readLedger(paths.ledgerFile);
      const released = ledger.reservations.filter((r) => r.value === value);
      const kept = ledger.reservations.filter((r) => r.value !== value);
      writeLedgerAtomic(paths.ledgerFile, {
        schemaVersion: RESERVATION_SCHEMA_VERSION,
        reservations: kept,
      });
      return { released, ledgerFile: paths.ledgerFile };
    },
    lockOptions,
  );
}
