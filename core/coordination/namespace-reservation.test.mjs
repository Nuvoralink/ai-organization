/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: core/coordination/namespace-reservation.mjs (project-agnostic reservation core) and
 * core/coordination/reserve-cli.mjs (the shared CLI), driven by a SYNTHETIC namespace config so the
 * managed source is proven with zero dependency on any consuming project.
 *
 * Authority: Git common-directory shared reservation ledger + per-project namespace spec
 *
 * What this test proves about the product:
 * - Two parallel agents that each reserve in the SAME namespace off the SAME base get DISTINCT values,
 *   because the shared ledger floors the second allocation above the first. That is the collision class
 *   this authority exists to prevent (two agents both creating migration 0083).
 * - Sequential allocation = max(existing, outstanding)+1, honouring an optional per-scope sub-namespace;
 *   range allocation = lowest free value avoiding a project's fixed reserved values.
 * - The read-modify-write is atomic (mkdir mutex: held → second acquire times out; crash-stale self-heals).
 * - Reconciliation retires a reservation once its NUMBER lands on the base ref and prunes an abandoned
 *   one past the stale window; range reservations never "land" and are pruned by TTL only.
 * - A corrupt ledger fails CLOSED, never silently reads as empty and hands out a colliding value.
 * - The CLI derives its usage from the PROJECT's namespaces and puts ONLY the claimed value on stdout.
 *
 * Killer mutation: each one below must turn the NAMED case red, not merely redden the suite.
 * - Drop the outstanding-reservations term in `reserve` → "two sequential reserves … are DISTINCT" fails.
 * - Make `allocateInRange` ignore the `excluded` set → "range allocation avoids reserved values" fails.
 * - Make `withReservationLock` ignore EEXIST → "a HELD lock makes a second acquire TIME OUT" fails.
 * - Drop the merged branch in `classifyReservations` → "merged … retired" fails.
 * - Make `readLedger` swallow a JSON parse error → "readLedger fails CLOSED" fails.
 * - Make `runReserveCli` echo human context on stdout → "stdout carries ONLY the claimed value" fails.
 * Gated command: npm run gates:all
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  BASE_REF_ENV_VAR,
  ReservationLockTimeoutError,
  allocateInRange,
  allocateSequential,
  classifyReservations,
  dirEntryNames,
  extractNumbers,
  extractNumbersFromText,
  fileText,
  list,
  readLedger,
  reconcile,
  release,
  reserve,
  resolveAgentId,
  resolveBaseRef,
  withReservationLock,
  writeLedgerAtomic,
} from './namespace-reservation.mjs';
import { helpText, parseArgs, runReserveCli } from './reserve-cli.mjs';

const ISO = (offsetMs = 0) =>
  new Date(Date.parse('2026-08-04T00:00:00.000Z') + offsetMs).toISOString();
const DEFAULT_STALE_MS = 14 * 24 * 60 * 60 * 1000;

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ---------------------------------------------------------------------------------------------------
// A SYNTHETIC project config — deliberately not any real project's paths, so this test proves the
// managed core rather than one consumer's bindings.
// ---------------------------------------------------------------------------------------------------

const SYNTHETIC_DIR = 'db/changes';
const SYNTHETIC_LOG = 'docs/log.md';
const SYNTHETIC_RESERVED_VALUES = [4000, 9999];

const SYNTHETIC_NAMESPACES = Object.freeze({
  change: {
    kind: 'sequential',
    baseRef: 'main',
    scope: null,
    validateLabel: (label) => /^[a-z0-9_]+$/u.test(label),
    occupiedNumbers: (cwd, _scope, { refOnly, baseRef }) =>
      extractNumbers(
        dirEntryNames(cwd, SYNTHETIC_DIR, { baseRef, entryType: 'tree', includeLocal: !refOnly }),
        /^(\d{4,})_/u,
      ),
    formatValue: (_scope, number, label) => `${String(number).padStart(4, '0')}_${label}`,
  },
  record: {
    kind: 'sequential',
    baseRef: 'main',
    scope: { label: 'prefix', validate: (scope) => /^[A-Z]+$/u.test(scope) },
    validateLabel: (label) => /^[a-z-]+$/u.test(label),
    occupiedNumbers: (cwd, scope, { refOnly, baseRef }) =>
      extractNumbersFromText(
        fileText(cwd, SYNTHETIC_LOG, { baseRef, includeLocal: !refOnly }),
        new RegExp(`\\b${scope}-(\\d+)\\b`, 'gu'),
      ),
    formatValue: (scope, number) => `${scope}-${String(number).padStart(3, '0')}`,
  },
  slot: {
    kind: 'range',
    range: [4100, 4109],
    scope: null,
    validateLabel: (label) => /^[a-z]+$/u.test(label),
    reservedValues: () => SYNTHETIC_RESERVED_VALUES,
    formatValue: (_scope, number) => String(number),
  },
});

const SYNTHETIC_CONFIG = {
  NAMESPACE_NAMES: Object.keys(SYNTHETIC_NAMESPACES),
  specFor: (namespace) => SYNTHETIC_NAMESPACES[namespace],
};

// ---------------------------------------------------------------------------------------------------
// Pure allocation + classification
// ---------------------------------------------------------------------------------------------------

test('allocateSequential is one above the max, never back-filling gaps', () => {
  assert.equal(allocateSequential([1, 2, 82]), 83);
  assert.equal(allocateSequential([]), 1);
  assert.equal(allocateSequential([37, 39]), 40); // a gap at 38 is not re-used
});

test('range allocation avoids reserved values and returns the lowest free one', () => {
  assert.equal(allocateInRange([4100, 4109], new Set([4100, 4101])), 4102);
  assert.equal(allocateInRange([4100, 4109], new Set([4000, 9999])), 4100); // out-of-range excludes ignored
  assert.throws(() => allocateInRange([4100, 4101], new Set([4100, 4101])), /no free value/);
});

test('classifyReservations: merged (landed value) retired, stale pruned, live kept', () => {
  const reservations = [
    { value: '0083_a', number: 83, reservedAt: ISO(-1000) },
    { value: '0084_b', number: 84, reservedAt: ISO(-1000) },
    { value: '0085_c', number: 85, reservedAt: ISO(-DEFAULT_STALE_MS - 1000) },
  ];
  const { merged, stalePruned, kept } = classifyReservations({
    reservations,
    landedValues: new Set(['0083_a']),
    now: ISO(),
  });
  assert.deepEqual(
    merged.map((r) => r.value),
    ['0083_a'],
  );
  assert.deepEqual(
    stalePruned.map((r) => r.value),
    ['0085_c'],
  );
  assert.deepEqual(
    kept.map((r) => r.value),
    ['0084_b'],
  );
});

test('a reservation exactly at the stale boundary is KEPT (strictly-greater prune)', () => {
  const { stalePruned, kept } = classifyReservations({
    reservations: [{ value: 'x', number: 1, reservedAt: ISO(-DEFAULT_STALE_MS) }],
    landedValues: new Set(),
    now: ISO(),
  });
  assert.deepEqual(stalePruned, []);
  assert.equal(kept.length, 1);
});

test('extractNumbers / extractNumbersFromText pull group-1 integers', () => {
  assert.deepEqual(
    extractNumbers(['0081_a', '0082_b', 'lock.toml'], /^(\d{4,})_/u).sort(),
    [81, 82],
  );
  assert.deepEqual(extractNumbersFromText('| ARC-010 | ARC-009 | CMP-004 |', /\bARC-(\d+)\b/gu), [
    10, 9,
  ]);
});

// ---------------------------------------------------------------------------------------------------
// Environment resolution — neutral names, no project branding
// ---------------------------------------------------------------------------------------------------

test('resolveAgentId prefers the neutral names in order and ignores blanks', () => {
  assert.equal(resolveAgentId({ NAMESPACE_RESERVATION_AGENT_ID: 'a1', AGENT_ID: 'a2' }), 'a1');
  assert.equal(resolveAgentId({ NAMESPACE_RESERVATION_AGENT_ID: '  ', AGENT_ID: 'a2' }), 'a2');
  assert.equal(resolveAgentId({}), null);
});

test('resolveBaseRef honours the env override and otherwise keeps the project default', () => {
  assert.equal(resolveBaseRef('main', { [BASE_REF_ENV_VAR]: 'origin/main' }), 'origin/main');
  assert.equal(resolveBaseRef('main', {}), 'main');
});

// ---------------------------------------------------------------------------------------------------
// Ledger IO — atomic + fail-closed
// ---------------------------------------------------------------------------------------------------

test('writeLedgerAtomic + readLedger round-trip; a missing ledger reads as empty', () => {
  const dir = tmpDir('nsr-io-');
  try {
    const ledgerFile = path.join(dir, 'ledger.json');
    assert.deepEqual(readLedger(ledgerFile).reservations, []);
    const ledger = {
      schemaVersion: 1,
      reservations: [
        {
          namespace: 'change',
          scope: null,
          value: '0083_a',
          number: 83,
          label: 'a',
          agent: null,
          branch: null,
          worktreePath: null,
          reservedAt: ISO(),
          status: 'reserved',
        },
      ],
    };
    writeLedgerAtomic(ledgerFile, ledger);
    assert.deepEqual(readLedger(ledgerFile), ledger);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('readLedger fails CLOSED on corrupt JSON and unsupported schema (never silently empty)', () => {
  const dir = tmpDir('nsr-corrupt-');
  try {
    const ledgerFile = path.join(dir, 'ledger.json');
    fs.writeFileSync(ledgerFile, '{ not json', 'utf8');
    assert.throws(() => readLedger(ledgerFile), /unreadable JSON/);
    fs.writeFileSync(ledgerFile, JSON.stringify({ schemaVersion: 999, reservations: [] }), 'utf8');
    assert.throws(() => readLedger(ledgerFile), /schemaVersion/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------------
// The atomic mkdir mutex
// ---------------------------------------------------------------------------------------------------

test('withReservationLock runs the critical section and releases the lock', () => {
  const dir = tmpDir('nsr-lock-');
  try {
    const lockDir = path.join(dir, '.lock');
    let ran = false;
    const value = withReservationLock(lockDir, () => {
      ran = true;
      assert.ok(fs.existsSync(lockDir), 'lock dir must exist DURING the critical section');
      return 42;
    });
    assert.equal(ran, true);
    assert.equal(value, 42);
    assert.equal(fs.existsSync(lockDir), false, 'lock dir must be released after');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a HELD lock makes a second acquire TIME OUT (mutual exclusion)', () => {
  const dir = tmpDir('nsr-held-');
  try {
    const lockDir = path.join(dir, '.lock');
    fs.mkdirSync(lockDir); // another process holding it, fresh mtime → not stale
    assert.throws(
      () =>
        withReservationLock(lockDir, () => 'never', {
          timeoutMs: 120,
          staleMs: 60_000,
          pollMs: 10,
        }),
      ReservationLockTimeoutError,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a CRASH-stale lock self-heals: it is stolen and the critical section runs', () => {
  const dir = tmpDir('nsr-stale-');
  try {
    const lockDir = path.join(dir, '.lock');
    fs.mkdirSync(lockDir);
    const past = new Date(Date.now() - 5 * 60_000);
    fs.utimesSync(lockDir, past, past);
    let ran = false;
    withReservationLock(
      lockDir,
      () => {
        ran = true;
      },
      { staleMs: 1000, warn: () => {} },
    );
    assert.equal(
      ran,
      true,
      'a crash-stale lock must be stolen so reservations do not deadlock forever',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------------
// End-to-end against a THROWAWAY git repo driven by the SYNTHETIC config
// ---------------------------------------------------------------------------------------------------

function gitIn(repo, args) {
  return String(
    execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
  );
}

function writeAndCommit(repo, files, message) {
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(repo, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  gitIn(repo, ['add', '-A']);
  gitIn(repo, ['commit', '-m', message, '--no-gpg-sign']);
}

function scaffoldRepo() {
  const repo = tmpDir('nsr-e2e-');
  execFileSync('git', ['-c', 'init.defaultBranch=main', 'init', repo], { stdio: 'ignore' });
  gitIn(repo, ['config', 'user.email', 'test@example.com']);
  gitIn(repo, ['config', 'user.name', 'Test']);
  gitIn(repo, ['config', 'commit.gpgsign', 'false']);
  writeAndCommit(
    repo,
    {
      [`${SYNTHETIC_DIR}/0081_a/change.sql`]: '-- 0081\n',
      [`${SYNTHETIC_DIR}/0082_b/change.sql`]: '-- 0082\n',
      [`${SYNTHETIC_DIR}/lock.toml`]: 'provider = "postgresql"\n',
      [SYNTHETIC_LOG]: '| ARC-010 | ... |\n| CMP-020 | ... |\n',
    },
    'seed',
  );
  return repo;
}

function reserveIn(repo, namespace, args, opts = {}) {
  return reserve({
    cwd: repo,
    namespace,
    spec: SYNTHETIC_CONFIG.specFor(namespace),
    baseRef: 'main',
    now: ISO(opts.offset ?? 0),
    ...args,
  });
}

test('E2E sequential: two sequential reserves off the same base are DISTINCT', () => {
  const repo = scaffoldRepo();
  try {
    const first = reserveIn(repo, 'change', { label: 'first_thing' });
    assert.equal(first.value, '0083_first_thing');
    const second = reserveIn(repo, 'change', { label: 'second_thing' }, { offset: 1000 });
    assert.equal(second.value, '0084_second_thing');
    assert.notEqual(first.value.slice(0, 4), second.value.slice(0, 4));

    // Agent one lands its change on main; reconcile retires that reservation, keeps the other.
    writeAndCommit(repo, { [`${SYNTHETIC_DIR}/0083_first_thing/change.sql`]: '-- 0083\n' }, 'land');
    const rec = reconcile({
      cwd: repo,
      namespace: 'change',
      spec: SYNTHETIC_CONFIG.specFor('change'),
      baseRef: 'main',
      now: ISO(2000),
    });
    assert.deepEqual(
      rec.merged.map((r) => r.value),
      ['0083_first_thing'],
    );
    assert.deepEqual(
      rec.outstanding.map((r) => r.value),
      ['0084_second_thing'],
    );
    // A third agent now correctly allocates 0085 (0084 still reserved, 0083 on main).
    assert.equal(
      reserveIn(repo, 'change', { label: 'third' }, { offset: 3000 }).value,
      '0085_third',
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('E2E scoped sequential: each scope advances independently and a fresh scope starts at 001', () => {
  const repo = scaffoldRepo();
  try {
    assert.equal(reserveIn(repo, 'record', { scope: 'ARC', label: 'a-thing' }).value, 'ARC-011');
    assert.equal(
      reserveIn(repo, 'record', { scope: 'CMP', label: 'c-thing' }, { offset: 1000 }).value,
      'CMP-021',
    );
    assert.equal(
      reserveIn(repo, 'record', { scope: 'OPS', label: 'o-thing' }, { offset: 2000 }).value,
      'OPS-001',
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('E2E range: distinct values, reserved values skipped, and reconcile never marks one merged', () => {
  const repo = scaffoldRepo();
  try {
    const [start] = SYNTHETIC_CONFIG.specFor('slot').range;
    const a = reserveIn(repo, 'slot', { label: 'alpha' });
    const b = reserveIn(repo, 'slot', { label: 'beta' }, { offset: 1000 });
    assert.equal(a.value, String(start));
    assert.equal(b.value, String(start + 1));
    assert.notEqual(a.value, b.value);
    for (const reservedValue of SYNTHETIC_RESERVED_VALUES) {
      assert.notEqual(a.value, String(reservedValue));
      assert.notEqual(b.value, String(reservedValue));
    }
    const rec = reconcile({
      cwd: repo,
      namespace: 'slot',
      spec: SYNTHETIC_CONFIG.specFor('slot'),
      baseRef: 'main',
      now: ISO(2000),
    });
    assert.deepEqual(rec.merged, []);
    assert.equal(rec.outstanding.length, 2);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('E2E cross-namespace: the one shared ledger holds every namespace, and release removes one', () => {
  const repo = scaffoldRepo();
  try {
    reserveIn(repo, 'change', { label: 'mig' });
    reserveIn(repo, 'record', { scope: 'ARC', label: 'a-thing' }, { offset: 1000 });
    reserveIn(repo, 'slot', { label: 'alpha' }, { offset: 2000 });
    const { reservations } = list({ cwd: repo });
    assert.deepEqual(reservations.map((r) => r.namespace).sort(), ['change', 'record', 'slot']);
    release({ cwd: repo, value: '0083_mig' });
    assert.deepEqual(
      list({ cwd: repo })
        .reservations.map((r) => r.namespace)
        .sort(),
      ['record', 'slot'],
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('a label the project would reject is refused BEFORE anything is written to the ledger', () => {
  const repo = scaffoldRepo();
  try {
    assert.throws(
      () => reserveIn(repo, 'change', { label: 'Not A Valid Slug' }),
      /invalid change label/,
    );
    assert.deepEqual(list({ cwd: repo }).reservations, []);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------------
// The shared CLI — usage derived from the project's own namespaces, strict stdout contract
// ---------------------------------------------------------------------------------------------------

test('parseArgs reads flags, the reconcile/list/release commands, and positionals', () => {
  assert.deepEqual(parseArgs(['change', 'my_slug']), {
    json: false,
    baseRef: undefined,
    command: null,
    positionals: ['change', 'my_slug'],
  });
  assert.equal(parseArgs(['--json', '--list']).command, 'list');
  assert.equal(parseArgs(['--base-ref', 'origin/main']).baseRef, 'origin/main');
  assert.throws(() => parseArgs(['--nope']), /unknown flag/);
});

test('helpText is derived from the PROJECT config — a namespace it lacks is never advertised', () => {
  const help = helpText({ config: SYNTHETIC_CONFIG, cliPath: 'scripts/reserve.mjs' });
  assert.match(help, /node scripts\/reserve\.mjs change <label>/);
  assert.match(help, /node scripts\/reserve\.mjs record <prefix> <label>/); // scope label surfaced
  assert.doesNotMatch(help, /\bmigration\b/); // not in this config, so never offered
});

test('CLI stdout carries ONLY the claimed value; human context goes to stderr', () => {
  const repo = scaffoldRepo();
  const cwd = process.cwd();
  try {
    process.chdir(repo);
    const out = [];
    const err = [];
    const code = runReserveCli({
      config: SYNTHETIC_CONFIG,
      argv: ['change', 'from_cli', '--base-ref', 'main'],
      stdout: (line) => out.push(line),
      stderr: (line) => err.push(line),
    });
    assert.equal(code, 0);
    assert.deepEqual(out, ['0083_from_cli'], 'stdout must be command-substitution safe');
    assert.ok(
      err.some((line) => line.includes('Reserved change value 0083_from_cli')),
      'human context belongs on stderr',
    );
  } finally {
    process.chdir(cwd);
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('CLI rejects an unknown namespace, a bad arity, and a config missing its exports', () => {
  const err = [];
  const stderr = (line) => err.push(line);
  const stdout = () => {};
  assert.equal(
    runReserveCli({ config: SYNTHETIC_CONFIG, argv: ['nope', 'x'], stdout, stderr }),
    1,
  );
  assert.equal(runReserveCli({ config: SYNTHETIC_CONFIG, argv: ['record', 'ARC'], stdout, stderr }), 1);
  assert.equal(runReserveCli({ config: {}, argv: ['change', 'x'], stdout, stderr }), 1);
  assert.ok(err.some((line) => line.includes('must export NAMESPACE_NAMES')));
});
