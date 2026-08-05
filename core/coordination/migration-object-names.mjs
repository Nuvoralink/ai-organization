/* global process, console */

/**
 * gate:migration-object-names engine — the DB-OBJECT-NAME sibling of a migration-numbering gate.
 *
 * THIS IS THE CANONICAL MANAGED SOURCE (`core/coordination/migration-object-names.mjs` in the
 * AI-Organization control plane), delivered to
 * `.ai-organization/runtime/core/coordination/migration-object-names.mjs` in every consuming project.
 * DO NOT EDIT A DELIVERED COPY. A project ships a thin entry script binding its migrations directory.
 *
 * WHY. A migration-NUMBER (or timestamp) gate cannot see this class. Two parallel agents in isolated
 * worktrees can pick DISTINCT migration names yet both create a DB object with the SAME NAME —
 * `CREATE TABLE billing_customers`, `CREATE INDEX idx_x`, `ADD CONSTRAINT c`, `CREATE TRIGGER t`,
 * `CREATE TYPE y`, `CREATE POLICY p ON t`. It is git-clean (different files) and passes the number
 * gate, then fails at APPLY time with `already exists` when the second migration runs against a DB
 * where the first already applied. The namespace-reservation authority does not prevent this (object
 * names are free-form, not a sequential namespace), so this mechanical gate is the backstop. It is the
 * ONLY collision control that applies to a project whose migration directories are timestamp-prefixed,
 * where the number axis cannot collide in the first place.
 *
 * It models APPLY-TIME semantics, not text: migrations apply in directory-name order, and a PLAIN
 * `CREATE` errors only when the object already exists and was not dropped since. So it tolerates
 * exactly what Postgres tolerates — `IF NOT EXISTS`, `CREATE OR REPLACE`, and the common
 * `DROP … ; CREATE …` forward-rebuild pattern. That is also WHY it must be green on already-applied
 * migrations: any real collision would have failed the production deploy.
 *
 * Exit 0 = no same-name object hard-created twice without a drop between. Exit 1 = a collision or an
 * unreadable migrations directory (fail-closed: a gate that cannot see cannot certify).
 */

import fs from 'node:fs';
import path from 'node:path';

/** A (possibly schema-qualified, possibly quoted) SQL identifier. */
const QNAME = String.raw`(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)(?:\.(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*))?`;

/** Fold a raw identifier to its apply-time key: last part, unquoted → lowercased, quoted → verbatim. */
export function normalizeIdent(raw) {
  const parts = String(raw)
    .trim()
    .match(/"[^"]+"|[A-Za-z0-9_$]+/gu);
  if (!parts || parts.length === 0) return String(raw).trim();
  const last = parts[parts.length - 1];
  return last.startsWith('"') ? last.slice(1, -1) : last.toLowerCase();
}

/** Remove SQL comments so commented-out DDL is never parsed. Biases to false-NEGATIVE (safe for a gate). */
export function stripSqlComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//gu, ' ')
    .replace(/--[^\n]*/gu, ' ');
}

const rx = (pattern) => new RegExp(pattern, 'giu');

/**
 * Parse one migration's SQL into ordered object-DDL events. Each event op is 'create-hard' (a plain
 * CREATE that errors on a pre-existing object), 'create-soft' (IF NOT EXISTS / OR REPLACE — never
 * errors), 'drop', or 'rename' (frees the old name AND occupies the new one — the atomic enum-swap
 * `ALTER TYPE x RENAME TO x_legacy; CREATE TYPE x …; DROP TYPE x_legacy`). Table-scoped kinds
 * (constraint/trigger/policy) key by `<table>.<name>` so the same name on different tables is not a
 * false collision.
 */
export function parseObjectEvents(sql) {
  const text = stripSqlComments(sql);
  const events = [];
  const push = (kind, key, op, pos) => events.push({ kind, key, op, pos });
  const pushRename = (kind, fromKey, toKey, pos) =>
    events.push({ kind, op: 'rename', fromKey, toKey, pos });

  const scan = (pattern, handle) => {
    for (const match of text.matchAll(pattern)) handle(match, match.index ?? 0);
  };

  // --- schema-scoped kinds: table, index, type ---
  scan(rx(String.raw`\bCREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(${QNAME})`), (m, pos) =>
    push('table', normalizeIdent(m[2]), m[1] ? 'create-soft' : 'create-hard', pos),
  );
  scan(rx(String.raw`\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(${QNAME})`), (m, pos) =>
    push('table', normalizeIdent(m[1]), 'drop', pos),
  );
  scan(
    rx(
      String.raw`\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(IF\s+NOT\s+EXISTS\s+)?(${QNAME})\s+ON\b`,
    ),
    (m, pos) => push('index', normalizeIdent(m[2]), m[1] ? 'create-soft' : 'create-hard', pos),
  );
  scan(
    rx(String.raw`\bDROP\s+INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+EXISTS\s+)?(${QNAME})`),
    (m, pos) => push('index', normalizeIdent(m[1]), 'drop', pos),
  );
  scan(rx(String.raw`\bCREATE\s+TYPE\s+(${QNAME})`), (m, pos) =>
    push('type', normalizeIdent(m[1]), 'create-hard', pos),
  );
  scan(rx(String.raw`\bDROP\s+TYPE\s+(?:IF\s+EXISTS\s+)?(${QNAME})`), (m, pos) =>
    push('type', normalizeIdent(m[1]), 'drop', pos),
  );

  // --- schema-scoped RENAME (frees old name, occupies new) — the atomic enum-swap + table/index renames ---
  scan(rx(String.raw`\bALTER\s+TYPE\s+(${QNAME})\s+RENAME\s+TO\s+(${QNAME})`), (m, pos) =>
    pushRename('type', normalizeIdent(m[1]), normalizeIdent(m[2]), pos),
  );
  scan(
    rx(
      String.raw`\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(${QNAME})\s+RENAME\s+TO\s+(${QNAME})`,
    ),
    (m, pos) => pushRename('table', normalizeIdent(m[1]), normalizeIdent(m[2]), pos),
  );
  scan(
    rx(String.raw`\bALTER\s+INDEX\s+(?:IF\s+EXISTS\s+)?(${QNAME})\s+RENAME\s+TO\s+(${QNAME})`),
    (m, pos) => pushRename('index', normalizeIdent(m[1]), normalizeIdent(m[2]), pos),
  );

  // --- table-scoped: constraint (associate with the nearest preceding ALTER TABLE <t>) ---
  const alterTables = [];
  scan(rx(String.raw`\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(${QNAME})`), (m, pos) =>
    alterTables.push({ table: normalizeIdent(m[1]), pos }),
  );
  const tableForConstraint = (pos) => {
    let table = null;
    for (const alter of alterTables) if (alter.pos <= pos) table = alter.table;
    return table;
  };
  scan(rx(String.raw`\bADD\s+CONSTRAINT\s+(${QNAME})`), (m, pos) => {
    const table = tableForConstraint(pos);
    if (table) push('constraint', `${table}.${normalizeIdent(m[1])}`, 'create-hard', pos);
  });
  scan(rx(String.raw`\bDROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?(${QNAME})`), (m, pos) => {
    const table = tableForConstraint(pos);
    if (table) push('constraint', `${table}.${normalizeIdent(m[1])}`, 'drop', pos);
  });
  scan(
    rx(
      String.raw`\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(${QNAME})\s+RENAME\s+CONSTRAINT\s+(${QNAME})\s+TO\s+(${QNAME})`,
    ),
    (m, pos) => {
      const table = normalizeIdent(m[1]);
      pushRename(
        'constraint',
        `${table}.${normalizeIdent(m[2])}`,
        `${table}.${normalizeIdent(m[3])}`,
        pos,
      );
    },
  );

  // --- table-scoped: trigger, policy (the ON <table> clause is in the same statement, before ';') ---
  scan(
    rx(
      String.raw`\bCREATE\s+(OR\s+REPLACE\s+)?(?:CONSTRAINT\s+)?TRIGGER\s+(${QNAME})[^;]*?\bON\s+(${QNAME})`,
    ),
    (m, pos) =>
      push(
        'trigger',
        `${normalizeIdent(m[3])}.${normalizeIdent(m[2])}`,
        m[1] ? 'create-soft' : 'create-hard',
        pos,
      ),
  );
  scan(
    rx(String.raw`\bDROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?(${QNAME})\s+ON\s+(${QNAME})`),
    (m, pos) => push('trigger', `${normalizeIdent(m[2])}.${normalizeIdent(m[1])}`, 'drop', pos),
  );
  scan(rx(String.raw`\bCREATE\s+POLICY\s+(${QNAME})\s+ON\s+(${QNAME})`), (m, pos) =>
    push('policy', `${normalizeIdent(m[2])}.${normalizeIdent(m[1])}`, 'create-hard', pos),
  );
  scan(
    rx(String.raw`\bDROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(${QNAME})\s+ON\s+(${QNAME})`),
    (m, pos) => push('policy', `${normalizeIdent(m[2])}.${normalizeIdent(m[1])}`, 'drop', pos),
  );

  return events.sort((a, b) => a.pos - b.pos);
}

/**
 * Simulate applying `migrations` (ordered `{ name, sql }`) and flag every plain CREATE that would hit an
 * object that already exists (and was not dropped since) — the exact `already exists` apply-time failure.
 */
export function analyzeMigrationObjects(migrations) {
  const state = new Map(); // `${kind}\0${key}` -> creating migration name
  const collisions = [];
  for (const migration of migrations) {
    for (const event of parseObjectEvents(migration.sql)) {
      if (event.op === 'rename') {
        // The object leaves its old name (freed) and takes the new one — the atomic enum-swap pattern.
        state.delete(`${event.kind}\0${event.fromKey}`);
        state.set(`${event.kind}\0${event.toKey}`, migration.name);
        continue;
      }
      const stateKey = `${event.kind}\0${event.key}`;
      const existingCreator = state.get(stateKey);
      if (event.op === 'drop') {
        state.delete(stateKey);
      } else if (event.op === 'create-soft') {
        if (existingCreator === undefined) state.set(stateKey, migration.name);
      } else {
        // create-hard
        if (existingCreator !== undefined) {
          collisions.push({
            kind: event.kind,
            key: event.key,
            migration: migration.name,
            priorMigration: existingCreator,
          });
        } else {
          state.set(stateKey, migration.name);
        }
      }
    }
  }
  return { collisions, migrationCount: migrations.length };
}

/**
 * Read migration directories in apply order, each with its concatenated `.sql`. Directory names sort
 * lexicographically, which IS apply order for both zero-padded numeric prefixes and fixed-width
 * timestamp prefixes — the two shapes in the fleet.
 */
export function collectMigrations(dir) {
  const dirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return dirs.map((name) => {
    const migrationDir = path.join(dir, name);
    const sql = fs
      .readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()
      .map((file) => fs.readFileSync(path.join(migrationDir, file), 'utf8'))
      .join('\n');
    return { name, sql };
  });
}

/**
 * Run the gate against one project's migrations directory. Returns the exit code (0 pass / 1 fail)
 * instead of calling `process.exit`, so the meta-test drives every branch in-process.
 */
export function runMigrationObjectNamesGate({
  migrationsDir,
  stdout = (line) => console.log(line),
  stderr = (line) => console.error(line),
} = {}) {
  let migrations;
  try {
    migrations = collectMigrations(migrationsDir);
  } catch (err) {
    stderr(`check-migration-object-names: FAILED — cannot read ${migrationsDir}: ${err.message}`);
    return 1;
  }
  if (migrations.length === 0) {
    stderr(
      `check-migration-object-names: FAILED — no migrations found in ${migrationsDir}. A gate that sees nothing cannot certify.`,
    );
    return 1;
  }
  const { collisions, migrationCount } = analyzeMigrationObjects(migrations);
  if (collisions.length > 0) {
    stderr('check-migration-object-names: FAILED');
    for (const c of collisions) {
      stderr(
        `  - ${c.kind} "${c.key}" is hard-created in ${c.migration} but already exists from ${c.priorMigration} ` +
          `(no DROP between). This applies as "already exists". The branch merging SECOND renames the object ` +
          `(or drops-then-recreates if a rebuild is intended).`,
      );
    }
    return 1;
  }
  stdout(
    `check-migration-object-names: OK — ${migrationCount} migration(s) scanned in ${migrationsDir}; ` +
      'no table/index/constraint/trigger/type/policy is hard-created twice without a drop between. ' +
      'Scope: SQL DDL object NAMES only — it does not certify column-level conflicts, data ' +
      'correctness, or objects created from application code rather than a migration file.',
  );
  return 0;
}
