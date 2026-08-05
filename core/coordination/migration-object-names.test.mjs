/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: core/coordination/migration-object-names.mjs — `parseObjectEvents` /
 * `analyzeMigrationObjects` (the pure apply-time simulator) and `runMigrationObjectNamesGate` (the
 * runner a project's thin entry script binds to its own migrations directory).
 *
 * Authority: the project's migrations directory, applied in directory-name order
 *
 * What this test proves about the product:
 * - Two migrations that HARD-create the same table/index/constraint/trigger/type/policy FAIL — the
 *   exact `already exists` collision two parallel agents can create with distinct migration names.
 *   This is the ONLY collision control that applies when migration names are timestamps, where the
 *   number axis cannot collide.
 * - The gate models APPLY-TIME semantics, so it tolerates exactly what Postgres tolerates: IF NOT
 *   EXISTS, CREATE OR REPLACE, a DROP-then-recreate rebuild, and the atomic
 *   `ALTER TYPE … RENAME TO …_legacy` enum-swap. Table-scoped kinds don't collide across tables.
 * - The runner is FAIL-CLOSED: an unreadable or empty migrations directory exits 1 rather than
 *   certifying a tree it never saw.
 *
 * Killer mutation: each one below must turn the NAMED case red, not merely redden the suite.
 * - Treat every create as create-hard (ignore the IF NOT EXISTS / OR REPLACE flag) → the tolerated cases fail.
 * - Drop the rename handling → the atomic enum-swap case fails (the gate's own origin false-positive).
 * - Key trigger/policy/constraint by name only (drop the table scope) → the different-tables case fails.
 * - Stop stripping comments → the commented-out-DDL case fails.
 * - Make the runner return 0 on an unreadable/empty directory → the fail-closed cases fail.
 * Gated command: npm run gates:all
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  analyzeMigrationObjects,
  collectMigrations,
  parseObjectEvents,
  runMigrationObjectNamesGate,
} from './migration-object-names.mjs';

const mig = (name, sql) => ({ name, sql });
const silent = { stdout: () => {}, stderr: () => {} };

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Scaffold a throwaway migrations directory: `{ '<dir-name>': '<sql>' }`. */
function scaffoldMigrations(entries) {
  const root = tmpDir('mig-obj-');
  for (const [name, sql] of Object.entries(entries)) {
    fs.mkdirSync(path.join(root, name), { recursive: true });
    fs.writeFileSync(path.join(root, name, 'migration.sql'), sql, 'utf8');
  }
  return root;
}

test('two migrations hard-creating the same TABLE collide (the parallel-agent class)', () => {
  const { collisions } = analyzeMigrationObjects([
    mig('0083_a', 'CREATE TABLE billing_customers (id uuid);'),
    mig('0084_b', 'CREATE TABLE billing_customers (id uuid);'),
  ]);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].kind, 'table');
  assert.equal(collisions[0].key, 'billing_customers');
  assert.equal(collisions[0].migration, '0084_b');
  assert.equal(collisions[0].priorMigration, '0083_a');
});

test('the same class is caught with TIMESTAMP-named migrations (the CoachAI shape)', () => {
  const { collisions } = analyzeMigrationObjects([
    mig('20260803090000_agent_a', 'CREATE TABLE coaching_runs (id uuid);'),
    mig('20260803104500_agent_b', 'CREATE TABLE coaching_runs (id uuid);'),
  ]);
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].key, 'coaching_runs');
  assert.equal(collisions[0].priorMigration, '20260803090000_agent_a');
});

test('index, constraint, type, trigger, and policy collisions are all caught', () => {
  const cases = [
    ['CREATE INDEX idx_x ON t (a);', 'CREATE INDEX idx_x ON t (b);', 'index'],
    [
      'ALTER TABLE t ADD CONSTRAINT c CHECK (a > 0);',
      'ALTER TABLE t ADD CONSTRAINT c CHECK (a > 1);',
      'constraint',
    ],
    ["CREATE TYPE mood AS ENUM ('a');", "CREATE TYPE mood AS ENUM ('b');", 'type'],
    [
      'CREATE TRIGGER trg BEFORE INSERT ON t FOR EACH ROW EXECUTE FUNCTION f();',
      'CREATE TRIGGER trg AFTER INSERT ON t FOR EACH ROW EXECUTE FUNCTION g();',
      'trigger',
    ],
    ['CREATE POLICY p ON t USING (true);', 'CREATE POLICY p ON t USING (false);', 'policy'],
  ];
  for (const [first, second, kind] of cases) {
    const { collisions } = analyzeMigrationObjects([mig('0083_a', first), mig('0084_b', second)]);
    assert.equal(collisions.length, 1, `${kind} collision expected`);
    assert.equal(collisions[0].kind, kind);
  }
});

test('IF NOT EXISTS and CREATE OR REPLACE are tolerated (they never error at apply)', () => {
  assert.deepEqual(
    analyzeMigrationObjects([
      mig('0083_a', 'CREATE TABLE t (id uuid);'),
      mig('0084_b', 'CREATE TABLE IF NOT EXISTS t (id uuid);'),
    ]).collisions,
    [],
  );
  assert.deepEqual(
    analyzeMigrationObjects([
      mig('0083_a', 'CREATE OR REPLACE TRIGGER trg BEFORE INSERT ON t EXECUTE FUNCTION f();'),
      mig('0084_b', 'CREATE OR REPLACE TRIGGER trg BEFORE INSERT ON t EXECUTE FUNCTION g();'),
    ]).collisions,
    [],
  );
});

test('a DROP-then-recreate rebuild across migrations is tolerated', () => {
  assert.deepEqual(
    analyzeMigrationObjects([
      mig('0067_a', 'ALTER TABLE t ADD CONSTRAINT c CHECK (a > 0);'),
      mig(
        '0069_b',
        'ALTER TABLE t DROP CONSTRAINT c;\nALTER TABLE t ADD CONSTRAINT c CHECK ((a > 0) IS TRUE);',
      ),
    ]).collisions,
    [],
  );
});

test('the atomic ALTER TYPE … RENAME TO …_legacy enum-swap is tolerated', () => {
  assert.deepEqual(
    analyzeMigrationObjects([
      mig('0007_a', "CREATE TYPE \"AiUsageStatus\" AS ENUM ('success', 'failed');"),
      mig(
        '0043_b',
        'ALTER TYPE "AiUsageStatus" RENAME TO "AiUsageStatus_legacy";\n' +
          "CREATE TYPE \"AiUsageStatus\" AS ENUM ('pending', 'success', 'failed');\n" +
          'DROP TYPE "AiUsageStatus_legacy";',
      ),
    ]).collisions,
    [],
  );
});

test('table-scoped kinds do NOT collide across different tables (name reuse is legal)', () => {
  for (const [a, b] of [
    [
      'CREATE TRIGGER trg BEFORE INSERT ON t1 EXECUTE FUNCTION f();',
      'CREATE TRIGGER trg BEFORE INSERT ON t2 EXECUTE FUNCTION f();',
    ],
    ['CREATE POLICY p ON t1 USING (true);', 'CREATE POLICY p ON t2 USING (true);'],
    ['ALTER TABLE t1 ADD CONSTRAINT c CHECK (a);', 'ALTER TABLE t2 ADD CONSTRAINT c CHECK (a);'],
  ]) {
    assert.deepEqual(analyzeMigrationObjects([mig('0083_a', a), mig('0084_b', b)]).collisions, []);
  }
});

test('commented-out DDL never counts (comment stripping)', () => {
  assert.deepEqual(
    analyzeMigrationObjects([
      mig('0083_a', 'CREATE TABLE t (id uuid);'),
      mig('0084_b', '-- CREATE TABLE t (id uuid);\n/* CREATE TABLE t (id uuid); */\nSELECT 1;'),
    ]).collisions,
    [],
  );
  assert.deepEqual(parseObjectEvents('-- CREATE TABLE t (id uuid);\nSELECT 1;'), []);
});

test('collectMigrations reads directories in apply order and concatenates their SQL', () => {
  const root = scaffoldMigrations({
    '0002_b': 'CREATE TABLE b (id uuid);',
    '0001_a': 'CREATE TABLE a (id uuid);',
  });
  try {
    assert.deepEqual(
      collectMigrations(root).map((m) => m.name),
      ['0001_a', '0002_b'],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runner: a real duplicate in a scaffolded tree EXITS 1 and names both migrations', () => {
  const root = scaffoldMigrations({
    '0083_a': 'CREATE TABLE billing_customers (id uuid);',
    '0084_b': 'CREATE TABLE billing_customers (id uuid);',
  });
  const err = [];
  try {
    const code = runMigrationObjectNamesGate({
      migrationsDir: root,
      stdout: () => {},
      stderr: (line) => err.push(line),
    });
    assert.equal(code, 1);
    assert.ok(err.join('\n').includes('0084_b'));
    assert.ok(err.join('\n').includes('0083_a'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runner: a clean scaffolded tree EXITS 0 and its OK line states the scope it does NOT certify', () => {
  const root = scaffoldMigrations({ '0001_a': 'CREATE TABLE a (id uuid);' });
  const out = [];
  try {
    assert.equal(
      runMigrationObjectNamesGate({
        migrationsDir: root,
        stdout: (line) => out.push(line),
        stderr: () => {},
      }),
      0,
    );
    assert.match(out.join('\n'), /1 migration\(s\) scanned/);
    assert.match(out.join('\n'), /Scope: SQL DDL object NAMES only/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runner is FAIL-CLOSED on an unreadable directory and on an empty one', () => {
  assert.equal(
    runMigrationObjectNamesGate({
      migrationsDir: path.join(os.tmpdir(), 'definitely-not-a-real-migrations-dir-xyz'),
      ...silent,
    }),
    1,
  );
  const empty = tmpDir('mig-obj-empty-');
  try {
    assert.equal(runMigrationObjectNamesGate({ migrationsDir: empty, ...silent }), 1);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
