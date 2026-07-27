/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: .ai-organization/runtime/core/coordination resource identity, overlap, config, and SQLite ledger
 * Authority: Git common-directory repository identity + coordination.db claim/coverage state machine
 *
 * What this test proves about the product:
 * - Parallel-agent resources have one worktree-independent canonical identity, and observe-mode
 *   admission records overlaps without blocking work while enforce refuses only proven overlaps.
 * - Files governed by one configured cross-file authority expand to the same semantic key, while
 *   corrupt or missing project registry data degrades to physical-path coordination.
 * - Durable fencing rejects stale release, dead owners require reconciliation, live owners stay active,
 *   and unavailable/corrupt SQLite fails loudly instead of fabricating an empty claim set.
 * - Schema v1 migrates additively to v2 without changing existing claims, and coverage increments
 *   serialize inside BEGIN IMMEDIATE transactions keyed by mode epoch.
 *
 * Negative path covered:
 * - Lexical and symlink/reparse escapes, every disjoint resource-kind pair, stale fencing epochs,
 *   reconciled claims, unavailable node:sqlite, and a corrupt database are rejected or classified
 *   fail-closed; a mode change starts a fresh counter epoch.
 *
 * Killer mutations:
 * - Drop injectable case-folding; remove dir/glob or glob/glob intersection; stop singleton-path
 *   folding; stop authority-domain expansion; duplicate the singleton vocabulary outside project
 *   config; throw on a corrupt authority registry; skip reconciliation conflicts; let release retire
 *   reconciled claims; drop the epoch predicate; auto-retire by time; or swallow node:sqlite/open
 *   failures; overwrite rather than increment a coverage row; or reuse one epoch across a mode
 *   change; or insert an enforce-refused claim. Each named mutation turns a corresponding assertion
 *   red.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  authorityDomainsForPath,
  canonicalizeResource,
  expandResourceClaims,
  globsCanIntersect,
  repoId,
  resourcesOverlap,
} from './resourceKey.mjs';
import {
  CoordinationLedger,
  CoordinationLedgerOpenError,
  StaleOwnerError,
  loadDatabaseSync,
} from './ledger.mjs';
import {
  AUTHORITY_DOMAINS,
  RESOURCE_CONFIG,
  SINGLETON_RESOURCE_KEYS,
  SINGLETON_RESOURCE_PATHS,
  loadAuthorityDomains,
} from './resourceConfig.mjs';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function createRepository() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-coordination-resource-'));
  const root = path.join(parent, 'primary');
  const sibling = path.join(parent, 'sibling');
  fs.mkdirSync(path.join(root, 'frontend', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'frontend', 'src', 'x.ts'), 'export const x = 1;\n');
  git(root, 'init');
  git(root, 'config', 'user.email', 'coordination-test@example.invalid');
  git(root, 'config', 'user.name', 'Coordination Test');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'fixture');
  git(root, 'worktree', 'add', '-b', 'coordination-sibling', sibling);
  return { parent, root, sibling };
}

function withLedger(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-coordination-ledger-'));
  const databasePath = path.join(directory, 'coordination.db');
  const ledger = new CoordinationLedger({ databasePath });
  try {
    return run(ledger, databasePath);
  } finally {
    ledger.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function claimInput(overrides = {}) {
  return {
    taskId: crypto.randomUUID(),
    attemptId: crypto.randomUUID(),
    agentKind: 'codex',
    repoId: 'fixture-repo',
    branch: 'fixture-branch',
    worktreePath: 'C:/fixture',
    ownerToken: crypto.randomUUID(),
    ownerPid: 1234,
    resources: [{ key: 'a/x.ts', kind: 'path' }],
    mode: 'observe',
    ...overrides,
  };
}

test('canonical resource identity is separator/case/worktree independent and rejects escapes', () => {
  const fixture = createRepository();
  const otherFixture = createRepository();
  const outside = path.join(fixture.parent, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'secret.txt'), 'not in repository\n');
  const link = path.join(fixture.root, 'escape-link');
  fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');

  try {
    const slash = canonicalizeResource(fixture.root, 'frontend/src/x.ts');
    const backslash = canonicalizeResource(fixture.root, 'frontend\\src\\x.ts');
    assert.equal(slash, backslash);
    assert.equal(
      canonicalizeResource(fixture.root, 'Frontend/SRC/x.ts', { fold: true }),
      'frontend/src/x.ts',
      'Killer mutation: dropping injected case-folding must fail on every host platform',
    );
    assert.equal(
      canonicalizeResource(fixture.root, 'Frontend/SRC/x.ts', { fold: false }),
      'Frontend/SRC/x.ts',
      'The unfolded branch must remain independently testable on every host platform',
    );

    assert.equal(
      canonicalizeResource(fixture.root, path.join(fixture.root, 'frontend/src/x.ts')),
      canonicalizeResource(fixture.root, path.join(fixture.sibling, 'frontend/src/x.ts')),
    );
    assert.equal(repoId(fixture.root), repoId(fixture.sibling));
    assert.notEqual(repoId(fixture.root), repoId(otherFixture.root));
    assert.throws(
      () => canonicalizeResource(fixture.root, '../outside/secret.txt'),
      /escapes|different Git repository|not inside a Git worktree/u,
    );
    assert.throws(
      () => canonicalizeResource(fixture.root, path.join(link, 'future.txt')),
      /resolves outside/u,
    );
    assert.equal(canonicalizeResource(fixture.root, 'future//nested/../file.ts'), 'future/file.ts');
    assert.equal(canonicalizeResource(fixture.root, 'future/dir/'), 'future/dir/');
    assert.equal(canonicalizeResource(fixture.root, 'frontend/**'), 'frontend/**');
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
    fs.rmSync(otherFixture.parent, { recursive: true, force: true });
  }
});

test('resource overlap handles directory, glob, exact, singleton, and negative pairs', () => {
  assert.equal(resourcesOverlap(['a/x.ts'], ['a/x.ts']).overlap, true);
  assert.equal(resourcesOverlap(['a/b/'], ['a/b/c.ts']).overlap, true);
  assert.equal(resourcesOverlap(['frontend/**'], ['frontend/x.ts']).overlap, true);
  assert.equal(
    resourcesOverlap(['backend/src/'], ['backend/**/*.ts']).overlap,
    true,
    'Killer mutation: removing dir-vs-glob intersection misses backend/src/foo.ts',
  );
  assert.equal(
    resourcesOverlap(['frontend/'], ['**/x.ts']).overlap,
    true,
    'A leading globstar can consume the claimed directory segment',
  );
  assert.equal(
    resourcesOverlap(['src/'], ['*/config.ts']).overlap,
    true,
    'A single-segment wildcard can share src/config.ts with the directory',
  );
  assert.equal(
    resourcesOverlap(['frontend/**'], ['frontend/components/**']).overlap,
    true,
    'Killer mutation: removing glob-vs-glob intersection misses the shared subtree',
  );
  assert.equal(
    resourcesOverlap(['frontend/**'], ['backend/**']).overlap,
    false,
    'Disjoint literal roots must not be converted into a noisy overlap',
  );
  assert.equal(
    resourcesOverlap(['frontend/foo**bar/**'], ['frontend/x/**']).overlap,
    true,
    'Unsupported embedded globstars are ambiguous and must fail closed',
  );
  assert.equal(resourcesOverlap(['a/x.ts'], ['a/y.ts']).overlap, false);
  assert.equal(
    resourcesOverlap(['singleton:prisma-schema'], ['singleton:prisma-schema']).overlap,
    true,
  );
  assert.equal(resourcesOverlap(['authority:contracts'], ['authority:contracts']).overlap, true);
  assert.deepEqual(resourcesOverlap(['a/b/'], ['a/b/c.ts']).keys, ['a/b/']);
});

test('configured singleton paths fold exact files and every migration namespace member', () => {
  const fixture = createRepository();
  try {
    assert.equal(
      canonicalizeResource(fixture.root, 'package-lock.json', RESOURCE_CONFIG),
      'singleton:root-lockfile',
      'Killer mutation: ignoring singletonPaths leaves the root lockfile as a plain path',
    );
    assert.equal(
      canonicalizeResource(fixture.root, 'backend/prisma/schema.prisma', RESOURCE_CONFIG),
      'singleton:prisma-schema',
    );
    const firstMigration = canonicalizeResource(
      fixture.root,
      'backend/prisma/migrations/202607260001_first/migration.sql',
      RESOURCE_CONFIG,
    );
    const secondMigration = canonicalizeResource(
      fixture.root,
      'backend/prisma/migrations/202607260002_second/migration.sql',
      RESOURCE_CONFIG,
    );
    assert.equal(firstMigration, 'singleton:migration-namespace');
    assert.equal(secondMigration, 'singleton:migration-namespace');
    assert.equal(
      resourcesOverlap([firstMigration], [secondMigration]).overlap,
      true,
      'Killer mutation: two parallel migration files must collide through the namespace singleton',
    );
    assert.throws(
      () =>
        canonicalizeResource(fixture.root, 'package-lock.json', {
          singletonKeys: ['singleton:root-lockfile', 'singleton:gate-registry'],
          singletonPaths: {
            'singleton:root-lockfile': 'package-lock.json',
            'singleton:gate-registry': 'package-lock.json',
          },
        }),
      /multiple configured singleton paths/u,
      'Ambiguous project config must fail closed instead of depending on map insertion order',
    );
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test('overlap kind-pair matrix covers every ordered intersectable pair with a named witness', () => {
  const fixture = createRepository();
  try {
    const schemaPath = canonicalizeResource(
      fixture.root,
      'backend/prisma/schema.prisma',
      RESOURCE_CONFIG,
    );
    const migrationPath = canonicalizeResource(
      fixture.root,
      'backend/prisma/migrations/202607260003_matrix/migration.sql',
      RESOURCE_CONFIG,
    );
    const cases = [
      {
        pair: 'path->path',
        left: 'frontend/src/x.ts',
        right: 'frontend/src/x.ts',
        witness: 'frontend/src/x.ts',
        disjointLeft: 'frontend/src/x.ts',
        disjointRight: 'backend/src/x.ts',
      },
      {
        pair: 'path->dir',
        left: 'frontend/components/x.ts',
        right: 'frontend/components/',
        witness: 'frontend/components/x.ts',
        disjointLeft: 'backend/components/x.ts',
        disjointRight: 'frontend/components/',
      },
      {
        pair: 'path->glob',
        left: 'frontend/components/x.ts',
        right: 'frontend/**/*.ts',
        witness: 'frontend/components/x.ts',
        disjointLeft: 'backend/components/x.ts',
        disjointRight: 'frontend/**/*.ts',
      },
      {
        pair: 'dir->path',
        left: 'frontend/components/',
        right: 'frontend/components/x.ts',
        witness: 'frontend/components/x.ts',
        disjointLeft: 'frontend/components/',
        disjointRight: 'backend/components/x.ts',
      },
      {
        pair: 'dir->dir',
        left: 'frontend/',
        right: 'frontend/components/',
        witness: 'frontend/components/x.ts',
        disjointLeft: 'frontend/',
        disjointRight: 'backend/',
      },
      {
        pair: 'dir->glob',
        left: 'backend/src/',
        right: 'backend/**/*.ts',
        witness: 'backend/src/x.ts',
        disjointLeft: 'frontend/src/',
        disjointRight: 'backend/**/*.ts',
      },
      {
        pair: 'glob->path',
        left: 'frontend/**/*.ts',
        right: 'frontend/components/x.ts',
        witness: 'frontend/components/x.ts',
        disjointLeft: 'frontend/**/*.ts',
        disjointRight: 'backend/components/x.ts',
      },
      {
        pair: 'glob->dir',
        left: 'backend/**/*.ts',
        right: 'backend/src/',
        witness: 'backend/src/x.ts',
        disjointLeft: 'backend/**/*.ts',
        disjointRight: 'frontend/src/',
      },
      {
        pair: 'glob->glob',
        left: 'frontend/**',
        right: 'frontend/components/**',
        witness: 'frontend/components/x.ts',
        disjointLeft: 'frontend/**',
        disjointRight: 'backend/**',
      },
      {
        pair: 'singleton->singleton',
        left: 'singleton:prisma-schema',
        right: schemaPath,
        witness: 'backend/prisma/schema.prisma',
        disjointLeft: 'singleton:prisma-schema',
        disjointRight: 'singleton:root-lockfile',
      },
      {
        pair: 'singleton->path',
        left: 'singleton:migration-namespace',
        right: migrationPath,
        witness: 'backend/prisma/migrations/202607260003_matrix/migration.sql',
        disjointLeft: 'singleton:migration-namespace',
        disjointRight: schemaPath,
      },
      {
        pair: 'path->singleton',
        left: migrationPath,
        right: 'singleton:migration-namespace',
        witness: 'backend/prisma/migrations/202607260003_matrix/migration.sql',
        disjointLeft: schemaPath,
        disjointRight: 'singleton:migration-namespace',
      },
      {
        pair: 'authority-domain->authority-domain',
        left: 'authority:endpoints',
        right: 'authority:endpoints',
        witness: 'backend/src/routes/calls.ts + frontend/src/lib/api.ts',
        disjointLeft: 'authority:endpoints',
        disjointRight: 'authority:roles',
      },
    ];
    assert.deepEqual(
      cases.map(({ pair }) => pair),
      [
        'path->path',
        'path->dir',
        'path->glob',
        'dir->path',
        'dir->dir',
        'dir->glob',
        'glob->path',
        'glob->dir',
        'glob->glob',
        'singleton->singleton',
        'singleton->path',
        'path->singleton',
        'authority-domain->authority-domain',
      ],
      'The matrix must not silently lose an ordered resource-kind pair',
    );

    for (const entry of cases) {
      assert.equal(
        resourcesOverlap([entry.left], [entry.right]).overlap,
        true,
        `${entry.pair} must overlap at witness ${entry.witness}`,
      );
      assert.equal(
        resourcesOverlap([entry.disjointLeft], [entry.disjointRight]).overlap,
        false,
        `${entry.pair} disjoint counterexample must stay non-overlapping`,
      );
    }
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test('resource config is the sole singleton vocabulary and loads a small authority registry', () => {
  const expectedSingletonPaths = {
    'singleton:root-lockfile': 'package-lock.json',
    'singleton:prisma-schema': 'backend/prisma/schema.prisma',
    'singleton:migration-namespace': 'backend/prisma/migrations/',
    'singleton:gate-registry': 'scripts/run-gates-all.mjs',
  };
  const expectedSingletonKeys = Object.keys(expectedSingletonPaths);

  assert.deepEqual(SINGLETON_RESOURCE_PATHS, expectedSingletonPaths);
  assert.deepEqual(
    SINGLETON_RESOURCE_KEYS,
    expectedSingletonKeys,
    'Killer mutation: a second hardcoded singleton vocabulary must drift from configured paths',
  );
  assert.deepEqual(RESOURCE_CONFIG.singletonKeys, expectedSingletonKeys);
  assert.deepEqual(RESOURCE_CONFIG.singletonPaths, expectedSingletonPaths);
  assert.equal(RESOURCE_CONFIG.authorityDomains, AUTHORITY_DOMAINS);
  assert.ok(Object.keys(AUTHORITY_DOMAINS).length >= 4);
  assert.ok(Object.keys(AUTHORITY_DOMAINS).length <= 6);
});

test('configured authority domains fold cross-file endpoint work and preserve disjoint paths', () => {
  const fixture = createRepository();
  try {
    const backend = expandResourceClaims(
      fixture.root,
      'backend/src/routes/calls.ts',
      RESOURCE_CONFIG,
    );
    const frontend = expandResourceClaims(fixture.root, 'frontend/src/lib/api.ts', RESOURCE_CONFIG);
    assert.deepEqual(backend, ['backend/src/routes/calls.ts', 'authority:endpoints']);
    assert.deepEqual(frontend, ['frontend/src/lib/api.ts', 'authority:endpoints']);
    assert.equal(
      resourcesOverlap(backend, frontend).overlap,
      true,
      'Killer mutation: returning only canonical paths must miss this semantic collision',
    );
    assert.deepEqual(
      expandResourceClaims(fixture.root, 'scripts/run-gates-all.mjs', RESOURCE_CONFIG),
      ['singleton:gate-registry', 'authority:gate-registry'],
      'A singleton-folded file must retain matching semantic authority expansion',
    );
    assert.deepEqual(
      expandResourceClaims(
        fixture.root,
        '.ai-organization/policies/authority-domains.v1.json',
        RESOURCE_CONFIG,
      ),
      ['.ai-organization/policies/authority-domains.v1.json'],
      'The registry remains an ordinary physical claim until enforcement adds self-edit CAS',
    );

    const unrelated = expandResourceClaims(fixture.root, 'README.md', RESOURCE_CONFIG);
    assert.deepEqual(unrelated, [canonicalizeResource(fixture.root, 'README.md', RESOURCE_CONFIG)]);
    assert.equal(resourcesOverlap(backend, unrelated).overlap, false);
    assert.deepEqual(
      authorityDomainsForPath('Backend/SRC/Routes/calls.ts', RESOURCE_CONFIG.authorityDomains, {
        fold: true,
      }),
      ['authority:endpoints'],
      'Killer mutation: Windows case folding must be applied to both paths and owns patterns',
    );
    assert.deepEqual(
      authorityDomainsForPath('Backend/SRC/Routes/calls.ts', RESOURCE_CONFIG.authorityDomains, {
        fold: false,
      }),
      [],
      'The case-sensitive authority matcher branch must remain independently executable',
    );
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test('every authority owns pattern resolves to at least one real repository file', () => {
  const repositoryFiles = execFileSync('git', ['ls-files', '-z'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .split('\0')
    .filter(Boolean);

  for (const [domain, definition] of Object.entries(AUTHORITY_DOMAINS)) {
    assert.ok(definition.owns.length >= 2, `${domain} must remain genuinely cross-file`);
    for (const ownsPattern of definition.owns) {
      assert.ok(
        repositoryFiles.some(
          (file) =>
            fs.statSync(path.join(REPOSITORY_ROOT, file)).isFile() &&
            globsCanIntersect(ownsPattern, file),
        ),
        `${domain} owns pattern must resolve to a real tracked file: ${ownsPattern}`,
      );
    }
  }
});

test('missing or corrupt authority registry warns, returns empty data, and keeps file overlap live', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-authority-registry-'));
  const corruptPath = path.join(directory, 'corrupt.json');
  const missingPath = path.join(directory, 'missing.json');
  const warnings = [];
  fs.writeFileSync(corruptPath, '{"version":1,"domains":');

  try {
    assert.deepEqual(
      loadAuthorityDomains(corruptPath, { warn: (message) => warnings.push(message) }),
      {},
    );
    assert.deepEqual(
      loadAuthorityDomains(missingPath, { warn: (message) => warnings.push(message) }),
      {},
    );
    assert.deepEqual(
      loadAuthorityDomains(corruptPath, {
        warn: () => {
          throw new Error('closed diagnostic stream');
        },
      }),
      {},
      'Killer mutation: a warning transport failure must not escape corrupt-registry fallback',
    );
    assert.equal(warnings.length, 2);
    assert.match(warnings[0], /authority-domain registry/u);

    const fallbackConfig = {
      singletonKeys: SINGLETON_RESOURCE_KEYS,
      singletonPaths: SINGLETON_RESOURCE_PATHS,
      authorityDomains: loadAuthorityDomains(corruptPath, { warn: () => {} }),
    };
    const fixture = createRepository();
    try {
      const first = expandResourceClaims(fixture.root, 'frontend/src/x.ts', fallbackConfig);
      const second = expandResourceClaims(fixture.root, 'frontend/src/x.ts', fallbackConfig);
      assert.deepEqual(first, ['frontend/src/x.ts']);
      assert.equal(
        resourcesOverlap(first, second).overlap,
        true,
        'Killer mutation: safe registry fallback must not disable physical-path overlap',
      );
    } finally {
      fs.rmSync(fixture.parent, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('root, backend, and lockfile require the node:sqlite DatabaseSync runtime floor', () => {
  const rootManifest = JSON.parse(
    fs.readFileSync(path.join(REPOSITORY_ROOT, 'package.json'), 'utf8'),
  );
  const backendManifest = JSON.parse(
    fs.readFileSync(path.join(REPOSITORY_ROOT, 'backend/package.json'), 'utf8'),
  );
  const lockfile = JSON.parse(
    fs.readFileSync(path.join(REPOSITORY_ROOT, 'package-lock.json'), 'utf8'),
  );

  assert.equal(rootManifest.engines?.node, '>=22.5');
  assert.equal(backendManifest.engines?.node, '>=22.5');
  assert.equal(lockfile.packages?.['']?.engines?.node, '>=22.5');
  assert.equal(
    lockfile.packages?.backend?.engines?.node,
    '>=22.5',
    'Killer mutation: lowering only a workspace/lockfile floor must fail coordination proof',
  );
});

test('SQLite schema, indexes, version, and persisted WAL match the ledger contract', () => {
  withLedger((_ledger, databasePath) => {
    const inspector = new DatabaseSync(databasePath);
    try {
      const tableNames = inspector
        .prepare(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
        )
        .all()
        .map(({ name }) => name);
      assert.deepEqual(tableNames, [
        'claim_resources',
        'claims',
        'conflicts',
        'coordination_coverage',
        'coordination_coverage_paths',
        'coordination_mode_epochs',
        'meta',
      ]);
      assert.deepEqual(
        inspector
          .prepare(`PRAGMA table_info(claims)`)
          .all()
          .map(({ name }) => name),
        [
          'claim_id',
          'task_id',
          'attempt_id',
          'agent_kind',
          'repo_id',
          'branch',
          'worktree_path',
          'state',
          'fencing_epoch',
          'owner_token',
          'owner_pid',
          'mode',
          'created_at',
          'updated_at',
        ],
      );
      assert.deepEqual(
        inspector
          .prepare(`PRAGMA table_info(claim_resources)`)
          .all()
          .map(({ name }) => name),
        ['claim_id', 'resource_key', 'resource_kind'],
      );
      assert.deepEqual(
        inspector
          .prepare(`PRAGMA table_info(conflicts)`)
          .all()
          .map(({ name }) => name),
        ['id', 'claim_id', 'other_claim_id', 'resource_key', 'detected_at', 'mode'],
      );
      assert.deepEqual(
        inspector
          .prepare(
            `SELECT name FROM sqlite_master WHERE type = 'index' AND name IN (
              'claim_resources_resource_key_idx', 'claims_state_idx'
            ) ORDER BY name`,
          )
          .all()
          .map(({ name }) => name),
        ['claim_resources_resource_key_idx', 'claims_state_idx'],
      );
      assert.deepEqual(
        inspector
          .prepare(`PRAGMA table_info(coordination_mode_epochs)`)
          .all()
          .map(({ name }) => name),
        ['mode_epoch', 'mode', 'started_at', 'ended_at'],
      );
      assert.deepEqual(
        inspector
          .prepare(`PRAGMA table_info(coordination_coverage)`)
          .all()
          .map(({ name }) => name),
        ['mode_epoch', 'metric', 'value', 'updated_at'],
      );
      assert.deepEqual(
        inspector
          .prepare(`PRAGMA table_info(coordination_coverage_paths)`)
          .all()
          .map(({ name }) => name),
        ['mode_epoch', 'path_kind', 'path', 'value', 'updated_at'],
      );
      assert.equal(
        inspector.prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get().value,
        '2',
      );
      assert.equal(inspector.prepare(`PRAGMA journal_mode`).get().journal_mode, 'wal');
      const foreignKey = inspector.prepare(`PRAGMA foreign_key_list(claim_resources)`).get();
      assert.deepEqual(
        { ...foreignKey },
        {
          id: 0,
          seq: 0,
          table: 'claims',
          from: 'claim_id',
          to: 'claim_id',
          on_update: 'NO ACTION',
          on_delete: 'CASCADE',
          match: 'NONE',
        },
      );
    } finally {
      inspector.close();
    }
  });
});

test('schema v1 migrates additively to v2 without changing existing claim rows', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-coordination-migrate-'));
  const databasePath = path.join(directory, 'coordination.db');
  const legacy = new DatabaseSync(databasePath);
  try {
    legacy.exec(`
      CREATE TABLE meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE claims (
        claim_id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        agent_kind TEXT NOT NULL,
        repo_id TEXT NOT NULL,
        branch TEXT NOT NULL,
        worktree_path TEXT NOT NULL,
        state TEXT NOT NULL,
        fencing_epoch INTEGER NOT NULL,
        owner_token TEXT NOT NULL,
        owner_pid INTEGER NOT NULL,
        mode TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE claim_resources (
        claim_id TEXT NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
        resource_key TEXT NOT NULL,
        resource_kind TEXT NOT NULL,
        PRIMARY KEY (claim_id, resource_key)
      );
      CREATE TABLE conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id TEXT NOT NULL,
        other_claim_id TEXT NOT NULL,
        resource_key TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        mode TEXT NOT NULL
      );
      INSERT INTO meta(key, value) VALUES ('schema_version', '1'), ('fencing_epoch', '7');
      INSERT INTO claims(
        claim_id, task_id, attempt_id, agent_kind, repo_id, branch, worktree_path,
        state, fencing_epoch, owner_token, owner_pid, mode, created_at, updated_at
      ) VALUES (
        'legacy-claim', 'legacy-task', 'legacy-attempt', 'codex', 'legacy-repo',
        'legacy-branch', 'C:/legacy', 'active', 7, 'legacy-owner', 1234, 'observe',
        '2026-07-26T00:00:00.000Z', '2026-07-26T00:00:00.000Z'
      );
      INSERT INTO claim_resources(claim_id, resource_key, resource_kind)
      VALUES ('legacy-claim', 'scripts/**', 'glob');
    `);
  } finally {
    legacy.close();
  }

  const ledger = new CoordinationLedger({ databasePath });
  try {
    assert.equal(
      ledger.getClaim('legacy-claim').task_id,
      'legacy-task',
      'Killer mutation: rebuilding instead of additively migrating the ledger loses live claims',
    );
  } finally {
    ledger.close();
  }

  const inspector = new DatabaseSync(databasePath, { readOnly: true });
  try {
    assert.equal(
      inspector.prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get().value,
      '2',
    );
    assert.equal(
      inspector.prepare(`SELECT value FROM meta WHERE key = 'fencing_epoch'`).get().value,
      '7',
    );
    assert.deepEqual(
      inspector
        .prepare(`SELECT mode_epoch, mode, ended_at FROM coordination_mode_epochs`)
        .all()
        .map((row) => ({ ...row })),
      [{ mode_epoch: 1, mode: 'off', ended_at: null }],
    );
  } finally {
    inspector.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('coverage rows increment transactionally and a mode change starts a fresh epoch', () => {
  withLedger((ledger) => {
    const first = ledger.incrementCoverage({
      mode: 'off',
      increments: { dispatches_seen: 1 },
      dispatchPath: 'run-bounded-agent',
    });
    const second = ledger.incrementCoverage({
      mode: 'off',
      modeEpoch: first.mode_epoch,
      increments: { dispatches_seen: 2, claims_registered: 2 },
      dispatchPath: 'run-bounded-agent',
    });
    assert.equal(second.mode_epoch, first.mode_epoch);
    assert.equal(
      second.dispatches_seen,
      3,
      'Killer mutation: replacing the SQL increment with an overwrite loses prior attempts',
    );
    assert.equal(second.claims_registered, 2);
    assert.equal(second.dispatch_path_hits['run-bounded-agent'], 2);

    const observe = ledger.incrementCoverage({
      mode: 'observe',
      increments: { dispatches_seen: 1 },
      dispatchPath: 'claude-lifecycle-hook',
    });
    assert.equal(
      observe.mode_epoch,
      first.mode_epoch + 1,
      'Killer mutation: retaining one epoch across off→observe pollutes the observe denominator',
    );
    assert.equal(observe.mode, 'observe');
    assert.equal(observe.dispatches_seen, 1);
    assert.equal(observe.claims_registered, 0);
    assert.deepEqual(observe.dispatch_path_hits, { 'claude-lifecycle-hook': 1 });

    const prior = ledger.coverageSnapshot({ modeEpoch: first.mode_epoch });
    assert.equal(prior.mode, 'off');
    assert.equal(prior.dispatches_seen, 3);
    assert.ok(prior.ended_at);
  });
});

test('observe admission records overlap and still admits the second claim', () => {
  withLedger((ledger) => {
    const first = ledger.admit(claimInput());
    const second = ledger.admit(
      claimInput({
        taskId: 'task-2',
        attemptId: 'attempt-2',
        ownerToken: 'owner-2',
        ownerPid: 5678,
      }),
    );

    assert.equal(first.admitted, true);
    assert.equal(second.admitted, true, 'observe mode must never block');
    assert.equal(second.conflicts.length, 1);
    assert.equal(second.conflicts[0].otherClaimId, first.claimId);
    assert.equal(second.conflicts[0].resourceKey, 'a/x.ts');
    assert.deepEqual(
      ledger.listConflicts().map((row) => ({
        claim_id: row.claim_id,
        other_claim_id: row.other_claim_id,
        resource_key: row.resource_key,
        mode: row.mode,
      })),
      [
        {
          claim_id: second.claimId,
          other_claim_id: first.claimId,
          resource_key: 'a/x.ts',
          mode: 'observe',
        },
      ],
      'Killer mutation: skipping the overlap scan must leave this durable row absent',
    );
    assert.ok(second.fencingEpoch > first.fencingEpoch);
  });
});

test('enforce admission refuses only a proven live overlap and inserts no claim row', () => {
  withLedger((ledger) => {
    const first = ledger.admit(claimInput({ taskId: 'enforce-ledger-first', mode: 'enforce' }));
    const refused = ledger.admit(
      claimInput({
        taskId: 'enforce-ledger-refused',
        attemptId: 'enforce-ledger-refused-attempt',
        ownerToken: 'enforce-ledger-refused-owner',
        ownerPid: 5678,
        mode: 'enforce',
      }),
    );

    assert.equal(first.admitted, true);
    assert.equal(
      refused.admitted,
      false,
      'Killer mutation: admitting despite a proven enforce overlap must turn this red',
    );
    assert.equal(refused.conflicts.length, 1);
    assert.deepEqual(
      {
        otherClaimId: refused.conflicts[0].otherClaimId,
        otherTaskId: refused.conflicts[0].otherTaskId,
        resourceKey: refused.conflicts[0].resourceKey,
        otherResourceKey: refused.conflicts[0].otherResourceKey,
      },
      {
        otherClaimId: first.claimId,
        otherTaskId: 'enforce-ledger-first',
        resourceKey: 'a/x.ts',
        otherResourceKey: 'a/x.ts',
      },
    );
    assert.equal(
      ledger.getClaim(refused.claimId),
      null,
      'Killer mutation: a refused dispatch must leave no claim row',
    );
    assert.ok(
      ledger
        .listConflicts()
        .some(
          ({ claim_id: claimId, other_claim_id: otherClaimId, mode }) =>
            claimId === refused.claimId && otherClaimId === first.claimId && mode === 'enforce',
        ),
      'Refusal evidence must survive even though the refused claim does not',
    );
  });
});

test('stale fencing epoch cannot release or retire a claim', () => {
  withLedger((ledger) => {
    const prior = ledger.admit(
      claimInput({
        taskId: 'prior-task',
        attemptId: 'prior-attempt',
        ownerToken: 'prior-owner',
        resources: [{ key: 'a/prior.ts', kind: 'path' }],
      }),
    );
    const admitted = ledger.admit(claimInput({ ownerToken: 'current-owner' }));
    assert.throws(
      () =>
        ledger.release({
          claimId: admitted.claimId,
          ownerToken: 'current-owner',
          fencingEpoch: prior.fencingEpoch,
        }),
      StaleOwnerError,
      'Killer mutation: dropping the epoch predicate makes the stale release succeed',
    );
    assert.equal(ledger.getClaim(admitted.claimId).state, 'active');
    assert.deepEqual(
      ledger.release({
        claimId: admitted.claimId,
        ownerToken: 'current-owner',
        fencingEpoch: admitted.fencingEpoch,
      }),
      { claimId: admitted.claimId, state: 'retired' },
    );
    assert.equal(ledger.getClaim(admitted.claimId).state, 'retired');
  });
});

test('reconcile marks only dead owners as needs_reconciliation and never auto-retires', () => {
  withLedger((ledger) => {
    const deadOwnerToken = 'dead-owner';
    const dead = ledger.admit(claimInput({ ownerPid: 111, ownerToken: deadOwnerToken }));
    const live = ledger.admit(
      claimInput({
        taskId: 'live-task',
        attemptId: 'live-attempt',
        ownerToken: 'live-owner',
        ownerPid: 222,
        resources: [{ key: 'a/y.ts', kind: 'path' }],
      }),
    );

    const result = ledger.reconcile({ isPidAlive: (pid) => pid === 222 });
    assert.deepEqual(result.reconciledClaimIds, [dead.claimId]);
    assert.equal(ledger.getClaim(dead.claimId).state, 'needs_reconciliation');
    assert.equal(
      ledger.getClaim(live.claimId).state,
      'active',
      'Killer mutation: wall-clock auto-retirement must not retire a live owner',
    );
    assert.throws(
      () =>
        ledger.release({
          claimId: dead.claimId,
          ownerToken: deadOwnerToken,
          fencingEpoch: dead.fencingEpoch,
        }),
      StaleOwnerError,
      'Killer mutation: release must not erase a needs_reconciliation signal',
    );
    assert.equal(ledger.getClaim(dead.claimId).state, 'needs_reconciliation');
  });
});

test('admission records conflicts against needs_reconciliation claims', () => {
  withLedger((ledger) => {
    const dead = ledger.admit(
      claimInput({
        ownerPid: 111,
        ownerToken: 'dead-owner',
        resources: [{ key: 'backend/src/x.ts', kind: 'path' }],
      }),
    );
    ledger.reconcile({ isPidAlive: () => false });
    assert.equal(ledger.getClaim(dead.claimId).state, 'needs_reconciliation');

    const admitted = ledger.admit(
      claimInput({
        taskId: 'replacement-task',
        attemptId: 'replacement-attempt',
        ownerPid: 222,
        ownerToken: 'replacement-owner',
        resources: [{ key: 'backend/src/x.ts', kind: 'path' }],
      }),
    );
    assert.equal(admitted.admitted, true, 'observe mode must still admit');
    assert.ok(
      admitted.conflicts.some(({ otherClaimId }) => otherClaimId === dead.claimId),
      'Killer mutation: excluding needs_reconciliation claims makes admission fail open',
    );
    assert.ok(
      ledger
        .listConflicts()
        .some(
          ({ claim_id: claimId, other_claim_id: otherClaimId }) =>
            claimId === admitted.claimId && otherClaimId === dead.claimId,
        ),
      'The fail-closed decision must remain auditable in the durable conflict log',
    );
  });
});

test('node:sqlite absence and a corrupt database fail loudly', async () => {
  await assert.rejects(
    loadDatabaseSync(async () => {
      throw new Error('simulated unavailable builtin');
    }),
    /requires a Node\.js runtime with the built-in node:sqlite DatabaseSync API/u,
  );

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-coordination-corrupt-'));
  const databasePath = path.join(directory, 'coordination.db');
  fs.writeFileSync(databasePath, 'not a sqlite database');
  try {
    assert.throws(
      () => new CoordinationLedger({ databasePath }),
      (error) =>
        error instanceof CoordinationLedgerOpenError &&
        /could not open or validate/u.test(error.message),
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('a corrupt fencing counter fails closed instead of resetting the epoch', () => {
  withLedger((ledger, databasePath) => {
    const mutator = new DatabaseSync(databasePath);
    try {
      mutator.prepare(`UPDATE meta SET value = 'not-an-epoch' WHERE key = 'fencing_epoch'`).run();
    } finally {
      mutator.close();
    }
    assert.throws(
      () => ledger.nextEpoch(),
      /fencing counter is corrupt/u,
      'Killer mutation: casting malformed meta to zero would silently reuse an old epoch',
    );
  });
});
