import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateJsonAgainstSchema } from '../core/schema/validate-json-schema.mjs';
import {
  classifyTrackedScope,
  computeInstalledTreeDigest,
  loadRoots,
  parseControlPlaneArgs,
  runCapture,
  runCheck,
  runDigest,
  runInstall,
  runRollback,
  validateCanonical,
  validateManifest
} from '../scripts/lib/control-plane.mjs';
import { runControlPlaneCli } from '../scripts/control-plane.mjs';
import { reconcileTrackedScope } from '../scripts/refresh-tracked-scope.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orgctl-'));
  const repoRoot = path.join(root, 'repo');
  const home = path.join(root, 'home');
  fs.mkdirSync(path.join(repoRoot, 'canonical', 'rules'), { recursive: true });
  fs.mkdirSync(path.join(home, '.claude', 'rules'), { recursive: true });
  const manifest = {
    version: '1.0.0',
    deny: {
      segments: ['.git', 'sessions', 'logs', 'cache', '__pycache__'],
      filenames: ['.credentials.json', 'auth.json', 'credentials.json', 'config.toml', 'default.rules'],
      prefixes: ['.env'],
      extensions: ['.pem', '.key', '.log', '.db', '.pyc']
    },
    mappings: [{
      id: 'claude-rules',
      source: 'canonical/rules',
      captureFrom: '${HOME}/.claude/rules',
      destinations: ['${HOME}/.claude/rules'],
      mode: 'tree',
      ownership: 'canonical',
      allowedExtensions: ['.md'],
      exclude: [],
      detectLocalOnly: true,
      allowRootLink: false,
      lock: '${HOME}/.nuvoralink-control-plane/lock.json'
    }]
  };
  return { root, repoRoot, home, roots: { HOME: home }, manifest };
}

function cliContext(f) {
  const stdout = [];
  const stderr = [];
  return {
    context: { ...f, stdout: (line) => stdout.push(line), stderr: (line) => stderr.push(line) },
    stdout,
    stderr,
  };
}

function thrownError(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  assert.fail('expected operation to throw');
}

function targetStateDigests(error) {
  const message = error?.message ?? '';
  const current = /current-target-sha256=([a-f0-9]{64})/u.exec(message)?.[1];
  const locked = /locked-sha256=([a-f0-9]{64})/u.exec(message)?.[1];
  const incoming = /incoming-sha256=([a-f0-9]{64})/u.exec(message)?.[1];
  assert.match(current ?? '', /^[a-f0-9]{64}$/u, message);
  assert.match(locked ?? '', /^[a-f0-9]{64}$/u, message);
  assert.match(incoming ?? '', /^[a-f0-9]{64}$/u, message);
  return { current, locked, incoming };
}

test('Proves: one machine root registry is reused by linked worktrees while an explicit worktree-local registry wins; Test type: resolution mutation; Surface: root-registry loader; Authority: primary checkout machine binding; Killer mutation: remove the git-common-directory fallback and the linked worktree loses every dependency token; Gated command: npm test', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orgctl-worktree-roots-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  const primaryRoot = path.join(root, 'primary');
  const linkedRoot = path.join(root, 'linked');
  const primaryRegistryDirectory = path.join(primaryRoot, 'registries');
  const linkedRegistryDirectory = path.join(linkedRoot, 'registries');
  const gitCommonDirectory = path.join(primaryRoot, '.git');
  fs.mkdirSync(primaryRegistryDirectory, { recursive: true });
  fs.mkdirSync(linkedRegistryDirectory, { recursive: true });
  fs.mkdirSync(gitCommonDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(primaryRegistryDirectory, 'project-roots.local.json'),
    JSON.stringify({ HOME: path.join(root, 'primary-home'), 'DEPENDENCY:example': path.join(root, 'dependency') }),
  );

  assert.deepEqual(loadRoots(linkedRoot, undefined, { gitCommonDirectory }), {
    HOME: path.join(root, 'primary-home'),
    'DEPENDENCY:example': path.join(root, 'dependency'),
  });

  fs.writeFileSync(
    path.join(linkedRegistryDirectory, 'project-roots.local.json'),
    JSON.stringify({ HOME: path.join(root, 'linked-home') }),
  );
  assert.deepEqual(loadRoots(linkedRoot, undefined, { gitCommonDirectory }), {
    HOME: path.join(root, 'linked-home'),
  });
});

test('Proves: the clean-machine example defines every root token required by the canonical manifest; Test type: bootstrap inventory mutation; Surface: example root registry; Authority: manifest path templates; Killer mutation: add a manifest token without adding its example binding and clean bootstrap becomes unresolvable; Gated command: npm test', () => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'control-plane.manifest.json'), 'utf8'));
  const example = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'registries', 'project-roots.example.json'), 'utf8'));
  const requiredTokens = new Set();
  for (const mapping of manifest.mappings) {
    for (const template of [...(mapping.destinations ?? []), mapping.captureFrom, mapping.lock]) {
      const token = /^\$\{([^}]+)\}/u.exec(template ?? '')?.[1];
      if (token) requiredTokens.add(token);
    }
  }
  assert.deepEqual(
    [...requiredTokens].filter((token) => !(token in example)).sort(),
    [],
    'project-roots.example.json must bind every manifest path token',
  );
});

test('Proves: capture and install are deterministic; Test type: mutation; Surface: portable control plane; Authority: manifest; Killer mutation: local-only file must fail check', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Base\r\n');
  const captured = runCapture({ ...f, dryRun: false });
  assert.equal(captured.length, 1);
  assert.deepEqual(runCheck(f), []);
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'local-only.md'), '# hidden drift\n');
  assert.ok(runCheck(f).some((problem) => problem.type === 'local-only'));
});
test('Proves: CAPTURED-DATA-LOSS-001 captured ownership can never overwrite its newer live authority while canonical mappings still install and detect drift; Test type: data-loss, mode, and regression mutation; Surface: install/check/CLI; Authority: mapping ownership; Killer mutations: let captured install write, count captured content drift as failure, ignore a missing captured source, or bypass canonical install/drift checks; Gated command: npm test', () => {
  const captured = fixture();
  const canonicalFile = path.join(captured.repoRoot, 'canonical', 'rules', 'base.md');
  const liveRoot = path.join(captured.home, '.claude', 'rules');
  const liveFile = path.join(liveRoot, 'base.md');
  const liveAuthority = Buffer.from('# Newer live authority\r\n');
  fs.writeFileSync(canonicalFile, liveAuthority);
  runInstall(captured);
  captured.manifest.mappings[0].ownership = 'captured';
  fs.writeFileSync(canonicalFile, '# Older captured backup\n');

  const beforeInstall = fs.readFileSync(liveFile);
  const installIo = cliContext(captured);
  assert.equal(runControlPlaneCli(['install'], installIo.context), 0);
  assert.deepEqual(fs.readFileSync(liveFile), beforeInstall);
  assert.ok(installIo.stdout.includes('skipped-by-mode\tclaude-rules\t.'));
  assert.ok(installIo.stdout.includes('operations=1 dryRun=false'));

  const informationalEntries = [];
  assert.deepEqual(runCheck({ ...captured, informationalEntries }), []);
  assert.deepEqual(informationalEntries, [{
    type: 'captured-backup-behind',
    mapping: 'claude-rules',
    source: '${HOME}/.claude/rules',
    difference: 'drift',
    relative: 'base.md',
  }]);

  fs.rmSync(liveRoot, { recursive: true });
  assert.deepEqual(runCheck(captured).filter((problem) => problem.type === 'missing-captured-source'), [{
    type: 'missing-captured-source',
    mapping: 'claude-rules',
    source: '${HOME}/.claude/rules',
  }]);

  const canonical = fixture();
  const canonicalFilePath = path.join(canonical.repoRoot, 'canonical', 'rules', 'base.md');
  const canonicalLivePath = path.join(canonical.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonicalFilePath, '# Canonical\n');
  runInstall(canonical);
  assert.equal(fs.readFileSync(canonicalLivePath, 'utf8'), '# Canonical\n');
  fs.writeFileSync(canonicalLivePath, '# Changed locally\n');
  assert.ok(runCheck(canonical).some((problem) => problem.type === 'drift'));
  assert.throws(() => runInstall(canonical), /Locally evolved managed target refused/u);
});

test('Proves: canonically retired managed files are transactionally removed and rollback-restorable; Test type: lifecycle mutation; Surface: installer retirement; Authority: prior install lock; Killer mutation: leave an obsolete locked file installed or delete it without snapshot recovery; Gated command: npm test', () => {
  const f = fixture();
  const canonicalBase = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const canonicalRetired = path.join(f.repoRoot, 'canonical', 'rules', 'retired.md');
  const installedRetired = path.join(f.home, '.claude', 'rules', 'retired.md');
  fs.writeFileSync(canonicalBase, '# Base\n');
  fs.writeFileSync(canonicalRetired, '# Retire me\n');
  runInstall({ ...f, dryRun: false });

  fs.unlinkSync(canonicalRetired);
  const retirement = runInstall({ ...f, dryRun: false });
  assert.ok(retirement.some((operation) => operation.type === 'retire' && operation.relative === 'retired.md'));
  assert.equal(fs.existsSync(installedRetired), false);
  assert.deepEqual(runCheck(f), []);

  runRollback({ manifest: f.manifest, roots: f.roots, installId: retirement.installId });
  assert.equal(fs.readFileSync(installedRetired, 'utf8'), '# Retire me\n');
});

test('Proves: retirement never deletes a locally modified formerly managed file; Test type: destructive-boundary mutation; Surface: installer retirement; Authority: prior install lock; Killer mutation: delete a retired target whose bytes no longer match the last installed hash; Gated command: npm test', () => {
  const f = fixture();
  const canonicalBase = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const canonicalRetired = path.join(f.repoRoot, 'canonical', 'rules', 'retired.md');
  const installedRetired = path.join(f.home, '.claude', 'rules', 'retired.md');
  fs.writeFileSync(canonicalBase, '# Base\n');
  fs.writeFileSync(canonicalRetired, '# Retire me\n');
  runInstall({ ...f, dryRun: false });

  fs.unlinkSync(canonicalRetired);
  fs.writeFileSync(installedRetired, '# Local improvement\n');
  assert.throws(() => runInstall({ ...f, dryRun: false }), /Locally evolved managed target refused/u);
  assert.equal(fs.readFileSync(installedRetired, 'utf8'), '# Local improvement\n');
});

test('Proves: retirement requires exact raw-byte identity even when normalized parity is equal; Test type: destructive-boundary mutation; Surface: installer retirement; Authority: prior install raw hash; Killer mutation: change only LF to CRLF and allow deletion through the normalized portability hash; Gated command: npm test', () => {
  const f = fixture();
  const canonicalBase = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const canonicalRetired = path.join(f.repoRoot, 'canonical', 'rules', 'retired.md');
  const installedRetired = path.join(f.home, '.claude', 'rules', 'retired.md');
  fs.writeFileSync(canonicalBase, '# Base\n');
  fs.writeFileSync(canonicalRetired, '# Retire me\n');
  runInstall({ ...f, dryRun: false });

  fs.unlinkSync(canonicalRetired);
  fs.writeFileSync(installedRetired, '# Retire me\r\n');
  assert.throws(() => runInstall({ ...f, dryRun: false }), /Local-only managed file: claude-rules\/retired\.md/u);
  assert.equal(fs.readFileSync(installedRetired, 'utf8'), '# Retire me\r\n');
});

test('Proves: legacy normalized-only locks gain exact-byte provenance while the canonical source still exists; Test type: migration; Surface: installer lock; Authority: current installed bytes plus canonical parity; Killer mutation: leave rawHash absent so a later retirement must guess; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const lockPath = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(canonical, '# Base\n');
  runInstall({ ...f, dryRun: false });

  const legacyLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  for (const entry of Object.values(legacyLock.files)) delete entry.rawHash;
  fs.writeFileSync(lockPath, `${JSON.stringify(legacyLock, null, 2)}\n`);

  const migration = runInstall({ ...f, dryRun: false });
  assert.ok(migration.some((operation) => operation.type === 'refresh-lock' && operation.relative === 'base.md'));
  const migratedLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  assert.match(Object.values(migratedLock.files)[0].rawHash, /^[a-f0-9]{64}$/u);
});

test('Proves: a source-absent legacy lock without exact-byte provenance fails closed; Test type: destructive-boundary mutation; Surface: installer retirement; Authority: prior install raw hash; Killer mutation: authorize deletion from a normalized-only historical lock after the canonical source disappears; Gated command: npm test', () => {
  const f = fixture();
  const canonicalBase = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const canonicalRetired = path.join(f.repoRoot, 'canonical', 'rules', 'retired.md');
  const installedRetired = path.join(f.home, '.claude', 'rules', 'retired.md');
  const lockPath = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(canonicalBase, '# Base\n');
  fs.writeFileSync(canonicalRetired, '# Retire me\n');
  runInstall({ ...f, dryRun: false });

  const legacyLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  for (const entry of Object.values(legacyLock.files)) delete entry.rawHash;
  fs.writeFileSync(lockPath, `${JSON.stringify(legacyLock, null, 2)}\n`);
  fs.unlinkSync(canonicalRetired);

  assert.throws(() => runInstall({ ...f, dryRun: false }), /Local-only managed file: claude-rules\/retired\.md/u);
  assert.equal(fs.readFileSync(installedRetired, 'utf8'), '# Retire me\n');
});

test('Proves: dry-run never writes; Test type: negative; Surface: installer; Authority: action plan; Killer mutation: missing destination remains missing', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  const target = path.join(f.home, '.claude', 'rules', 'base.md');
  const operations = runInstall({ ...f, dryRun: true });
  assert.equal(operations.length, 1);
  assert.equal(fs.existsSync(target), false);
});

test('Proves: exact mapping rollout excludes unrelated installed drift while canonical validation stays repo-wide; Test type: selection mutation; Surface: install and parity check; Authority: mapping registry; Killer mutation: ignore --mapping for installed targets, skip canonical safety, or accept an unknown mapping; Gated command: npm test', () => {
  const f = fixture();
  const secondarySource = path.join(f.repoRoot, 'canonical', 'secondary');
  const secondaryDestination = path.join(f.home, '.claude', 'secondary');
  fs.mkdirSync(secondarySource, { recursive: true });
  fs.mkdirSync(secondaryDestination, { recursive: true });
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Selected canonical\n');
  fs.writeFileSync(path.join(secondarySource, 'other.md'), '# Secondary canonical\n');
  fs.writeFileSync(path.join(secondaryDestination, 'other.md'), '# Unrelated local drift\n');
  f.manifest.mappings.push({
    ...structuredClone(f.manifest.mappings[0]),
    id: 'secondary-rules',
    source: 'canonical/secondary',
    captureFrom: '${HOME}/.claude/secondary',
    destinations: ['${HOME}/.claude/secondary'],
  });

  const operations = runInstall({ ...f, mappingIds: ['claude-rules'] });
  assert.equal(operations.every((operation) => operation.mapping === 'claude-rules'), true);
  assert.equal(fs.readFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), 'utf8'), '# Selected canonical\n');
  assert.equal(fs.readFileSync(path.join(secondaryDestination, 'other.md'), 'utf8'), '# Unrelated local drift\n');
  assert.deepEqual(runCheck({ ...f, mappingIds: ['claude-rules'] }), []);
  assert.ok(runCheck(f).some((problem) => problem.mapping === 'secondary-rules' && problem.type === 'drift'));
  const tokenShape = ['ghp', 'abcdefghijklmnopqrstuvwxyz123456'].join('_');
  fs.writeFileSync(path.join(secondarySource, 'other.md'), `token=${tokenShape}\n`);
  assert.ok(runCheck({ ...f, mappingIds: ['claude-rules'] }).some((problem) =>
    problem.mapping === 'secondary-rules' && problem.type === 'secret-shaped-content'));
  assert.equal(fs.readFileSync(path.join(secondaryDestination, 'other.md'), 'utf8'), '# Unrelated local drift\n');
  assert.throws(() => runInstall({ ...f, mappingIds: ['unknown-mapping'] }), /Unknown install mapping\(s\): unknown-mapping/u);
  assert.throws(() => runCheck({ ...f, mappingIds: ['unknown-mapping'] }), /Unknown check mapping\(s\): unknown-mapping/u);
});

test('Proves: baseline capture skips canonical generated mappings that are not installed yet; Test type: bootstrap counterexample; Surface: existing-project overlay; Authority: capture planner; Killer mutation: require every future generated destination to pre-exist before baseline import; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Generated later\n');
  assert.deepEqual(runCapture({ ...f, dryRun: true }), []);
});

test('Proves: project-to-canonical promotion requires an explicit update flag; Test type: authority mutation; Surface: universal backflow; Authority: capture planner; Killer mutation: silently overwrite canonical orchestration from a changed project copy; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Canonical\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Reviewed project improvement\n');
  assert.throws(() => runCapture({ ...f, dryRun: false }), /Canonical source differs; capture refused/u);
  const operations = runCapture({ ...f, dryRun: false, updateExisting: true });
  assert.equal(operations[0].type, 'update-capture');
  assert.equal(fs.readFileSync(canonical, 'utf8'), '# Reviewed project improvement\n');
});

test('Proves: a reviewed backflow can target exact mappings without scanning unrelated rendered local copies; Test type: selection mutation; Surface: universal backflow; Authority: mapping registry; Killer mutation: capture an unselected unsafe mapping or accept an unknown mapping id; Gated command: npm test', () => {
  const f = fixture();
  const selected = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  fs.writeFileSync(selected, '# Canonical\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Reviewed improvement\n');

  const unsafeSource = path.join(f.repoRoot, 'canonical', 'unsafe');
  const unsafeInstalled = path.join(f.home, '.claude', 'unsafe');
  fs.mkdirSync(unsafeSource, { recursive: true });
  fs.mkdirSync(unsafeInstalled, { recursive: true });
  fs.writeFileSync(path.join(unsafeSource, 'local.md'), '# Canonical safe copy\n');
  fs.writeFileSync(path.join(unsafeInstalled, 'local.md'), `Machine path: ${['C:', 'dev', 'private'].join('\\')}\n`);
  f.manifest.mappings.push({
    ...f.manifest.mappings[0],
    id: 'unsafe-rendered-copy',
    source: 'canonical/unsafe',
    captureFrom: '${HOME}/.claude/unsafe',
    destinations: ['${HOME}/.claude/unsafe'],
    lock: '${HOME}/.nuvoralink-control-plane/unsafe-lock.json'
  });

  const operations = runCapture({ ...f, dryRun: true, updateExisting: true, mappingIds: ['claude-rules'] });
  assert.deepEqual(operations.map(({ mapping }) => mapping), ['claude-rules']);
  const fileOperations = runCapture({ ...f, dryRun: true, updateExisting: true, fileSelectors: ['claude-rules:base.md'] });
  assert.deepEqual(fileOperations.map(({ mapping, relative }) => `${mapping}:${relative}`), ['claude-rules:base.md']);
  assert.throws(() => runCapture({ ...f, dryRun: true, mappingIds: ['missing-mapping'] }), /Unknown capture mapping/u);
  assert.throws(() => runCapture({ ...f, dryRun: true, fileSelectors: ['claude-rules:../escape.md'] }), /Unsafe capture file selector/u);
});

test('Proves: sensitive files are denied before capture; Test type: security mutation; Surface: importer; Authority: deny policy; Killer mutation: seed .credentials.json', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', '.credentials.json'), '{"token":"should-never-open"}');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'safe.md'), '# Safe\n');
  const operations = runCapture({ ...f, dryRun: true });
  assert.equal(operations.length, 1);
  assert.equal(operations[0].relative, 'safe.md');
});

test('Proves: secret-shaped values are rejected with no value in output; Test type: security mutation; Surface: importer; Authority: content scanner; Killer mutation: seed a GitHub token shape', () => {
  const f = fixture();
  const tokenShape = ['ghp', 'abcdefghijklmnopqrstuvwxyz123456'].join('_');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'unsafe.md'), `token=${tokenShape}`);
  assert.throws(() => runCapture({ ...f, dryRun: true }), /Secret-shaped content refused \(pattern 2\)/);
});

test('Proves: environment references are not secrets; Test type: counterexample; Surface: importer; Authority: content scanner; Killer mutation: a process.env reference remains importable', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'safe.md'), 'const API_KEY = process.env.PROVIDER_API_KEY;\n');
  const operations = runCapture({ ...f, dryRun: true });
  assert.equal(operations.length, 1);
});

test('Proves: raw/duplicate destinations and empty non-captured destination sets cannot enter the manifest while captured mappings may be destination-free; Test type: schema mutation; Surface: manifest; Authority: tokenized roots and ownership mode; Killer mutations: use a C drive path twice or allow canonical ownership with zero destinations; Gated command: npm test', () => {
  const f = fixture();
  f.manifest.mappings[0].destinations = [["C:", "Users", "example", ".claude", "rules"].join('/'), '${HOME}/.claude/rules', '${HOME}/.claude/rules'];
  const errors = validateManifest(f.manifest, f.repoRoot, f.roots);
  assert.ok(errors.some((message) => message.includes('Invalid destination path for mapping')));
  assert.ok(errors.some((message) => message.includes('Duplicate destination')));
  assert.doesNotMatch(JSON.stringify(errors), /C:\/Users\/example/u);

  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const schemaFile = path.join(repositoryRoot, 'schemas', 'control-plane-manifest.v1.schema.json');
  const schemaFixture = fixture();
  const canonicalWithoutDestinations = structuredClone(schemaFixture.manifest);
  canonicalWithoutDestinations.mappings[0].destinations = [];
  assert.ok(validateJsonAgainstSchema(schemaFile, canonicalWithoutDestinations).some((failure) =>
    failure.includes('destinations: fewer than 1 items')));
  assert.ok(validateManifest(
    canonicalWithoutDestinations,
    schemaFixture.repoRoot,
    schemaFixture.roots,
  ).some((failure) => failure.includes('Ownership canonical requires at least one destination')));

  const capturedWithoutDestinations = structuredClone(canonicalWithoutDestinations);
  capturedWithoutDestinations.mappings[0].ownership = 'captured';
  assert.deepEqual(validateJsonAgainstSchema(schemaFile, capturedWithoutDestinations), []);
});

test('Proves: line-ending-only differences remain portable; Test type: counterexample; Surface: parity; Authority: normalized hash; Killer mutation: CRLF versus LF is not drift', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Same\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Same\r\n');
  assert.deepEqual(runCheck(f), []);
});

test('Proves: allowed non-text assets do not create false secret findings; Test type: counterexample; Surface: importer; Authority: extension allowlist; Killer mutation: a benign binary asset remains importable', () => {
  const f = fixture();
  f.manifest.mappings[0].allowedExtensions.push('.png');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'asset.png'), Buffer.from([0, 1, 2, 3]));
  const operations = runCapture({ ...f, dryRun: true });
  assert.equal(operations.length, 1);
});

test('Proves: extension allowlists classify files without pruning safe nested directories; Test type: portability mutation; Surface: skill metadata capture; Authority: importer traversal; Killer mutation: treat an extensionless agents directory as a disallowed file and silently omit openai.yaml; Gated command: npm test', () => {
  const f = fixture();
  f.manifest.mappings[0].allowedExtensions.push('.yaml');
  const nested = path.join(f.home, '.claude', 'rules', 'agents');
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(nested, 'openai.yaml'), 'interface:\n  display_name: Example\n');
  const operations = runCapture({ ...f, dryRun: true });
  assert.equal(operations.length, 1);
  assert.equal(operations[0].relative, 'agents/openai.yaml');
});

test('Proves: canonical validation does not require machine-specific roots; Test type: portability; Surface: CI; Authority: canonical repository; Killer mutation: remove all local root registrations', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Portable\n');
  assert.deepEqual(validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest }), []);
});

test('Proves: forbidden canonical files fail instead of hiding; Test type: security mutation; Surface: canonical repository; Authority: deny policy; Killer mutation: force-add .env inside a mapped source; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Safe\n');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', '.env'), 'DO_NOT_READ=secret\n');
  const findings = validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest });
  assert.ok(findings.some((finding) => finding.type === 'source' && /denied filename prefix/u.test(finding.message)));
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(f.repoRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('Proves: every canonical deny class reports only mapping-relative inventory paths; Test type: disclosure matrix; Surface: runCheck canonical inventory; Authority: portable inventory errors; Killer mutation: interpolate the resolved canonical entry path for any deny reason; Gated command: npm test', () => {
  const cases = [
    ['.credentials.json', 'file', 'denied filename'],
    ['.env.local', 'file', 'denied filename prefix'],
    ['private.key', 'file', 'denied extension'],
    ['logs', 'directory', 'denied path segment'],
  ];
  for (const [relative, kind, reason] of cases) {
    const f = fixture();
    const canonicalRoot = path.join(f.repoRoot, 'canonical', 'rules');
    fs.writeFileSync(path.join(canonicalRoot, 'base.md'), '# Canonical\n');
    if (kind === 'directory') fs.mkdirSync(path.join(canonicalRoot, relative));
    else fs.writeFileSync(path.join(canonicalRoot, relative), 'DO_NOT_EMIT');

    const findings = runCheck(f);
    assert.ok(findings.some((finding) => finding.type === 'source' && finding.message === `Canonical source contains ${reason}: ${relative}`));
    const serialized = JSON.stringify(findings);
    assert.doesNotMatch(serialized, new RegExp(f.repoRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.doesNotMatch(serialized, new RegExp(f.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    assert.doesNotMatch(serialized, /DO_NOT_EMIT/u);
  }
});

test('Proves: tracked files outside mapped trees cannot hide secrets, machine paths, or app-source classes; Test type: repository-boundary mutation; Surface: canonical repository; Authority: exact tracked-scope registry; Killer mutation: force-add unsafe docs plus app source at top level and beneath otherwise allowed roots; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Safe\n');
  fs.mkdirSync(path.join(f.repoRoot, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'application'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'overlays', 'copied-app'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'overlays', 'auxara-dialer', 'project-files', 'backend', 'src'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'artifacts', 'copied-app'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'registries'), { recursive: true });
  const tokenShape = ['sk', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('-');
  const machinePath = ['C:', 'dev', 'private'].join('\\');
  fs.writeFileSync(path.join(f.repoRoot, 'docs', 'unsafe.md'), `${tokenShape}\n${machinePath}\n`);
  fs.writeFileSync(path.join(f.repoRoot, 'docs', 'copied-app.ts'), 'export const copiedAppSource = true;\n');
  fs.writeFileSync(path.join(f.repoRoot, 'overlays', 'copied-app', 'index.ts'), 'export const copiedAppSource = true;\n');
  fs.writeFileSync(path.join(f.repoRoot, 'overlays', 'copied-app', 'index.js'), 'export const copiedAppSource = true;\n');
  fs.writeFileSync(path.join(f.repoRoot, 'overlays', 'auxara-dialer', 'project-files', 'backend', 'src', 'index.js'), 'export const copiedAppSource = true;\n');
  fs.writeFileSync(path.join(f.repoRoot, 'artifacts', 'copied-app', 'index.ts'), 'export const copiedAppSource = true;\n');
  fs.writeFileSync(path.join(f.repoRoot, 'application', 'index.ts'), 'export const copiedAppSource = true;\n');
  fs.writeFileSync(path.join(f.repoRoot, 'registries', 'tracked-scope.v1.json'), `${JSON.stringify({
    version: '1.0.0',
    scope: 'orchestration-only',
    files: [
      { path: 'docs/unsafe.md', class: 'documentation' },
      { path: 'registries/tracked-scope.v1.json', class: 'scope-registry' }
    ]
  }, null, 2)}\n`);
  assert.equal(spawnSync('git', ['init'], { cwd: f.repoRoot }).status, 0);
  assert.equal(spawnSync('git', ['add', '-A'], { cwd: f.repoRoot }).status, 0);
  const findings = validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest });
  assert.ok(findings.some((finding) => finding.type === 'tracked-secret-shaped-content' && finding.relative === 'docs/unsafe.md'));
  assert.ok(findings.some((finding) => finding.type === 'tracked-absolute-path' && finding.relative === 'docs/unsafe.md'));
  for (const relative of ['application/index.ts', 'docs/copied-app.ts', 'overlays/copied-app/index.ts', 'artifacts/copied-app/index.ts']) {
    assert.ok(findings.some((finding) => finding.type === 'unsupported-tracked-scope-path' && finding.relative === relative), relative);
  }
  assert.ok(findings.some((finding) => finding.type === 'unsupported-tracked-scope-path' && finding.relative === 'overlays/copied-app/index.js'));
  assert.ok(findings.some((finding) => finding.type === 'unclassified-tracked-path' && finding.relative === 'overlays/auxara-dialer/project-files/backend/src/index.js'));
});

test('Proves: allowed-extension overlay files require an explicit reviewed registry declaration; Test type: approval-boundary mutation; Surface: tracked-scope refresh; Authority: exact tracked-scope registry; Killer mutation: auto-register copied application JavaScript under project-files from its filename; Gated command: npm test', () => {
  const existing = { version: '1.0.0', scope: 'orchestration-only', files: [{ path: 'README.md', class: 'repository-metadata' }] };
  const copiedSource = 'overlays/auxara-dialer/project-files/backend/src/index.js';
  const files = ['README.md', copiedSource];
  assert.throws(() => reconcileTrackedScope(files, existing), /Unreviewed new path/u);
  const approved = reconcileTrackedScope(files, existing, { approvals: new Map([[copiedSource, 'project-orchestration-overlay']]) });
  assert.deepEqual(approved.files.at(-1), { path: copiedSource, class: 'project-orchestration-overlay' });
});

test('Proves: an approved untracked orchestration file is validated before commit; Test type: repository-inventory mutation; Surface: canonical tracked-scope validation; Authority: shared repository candidate inventory; Killer mutation: remove --others from repositoryCandidatePaths and the approved untracked row becomes stale; Gated command: npm test', () => {
  const f = fixture();
  const registryRelative = 'registries/tracked-scope.v1.json';
  const baseRelative = 'canonical/rules/base.md';
  const freshRelative = 'docs/fresh-control-note.md';
  fs.mkdirSync(path.join(f.repoRoot, 'registries'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(f.repoRoot, baseRelative), '# Canonical\n');
  fs.writeFileSync(path.join(f.repoRoot, freshRelative), '# Fresh control note\n');
  fs.writeFileSync(path.join(f.repoRoot, registryRelative), `${JSON.stringify({
    version: '1.0.0',
    scope: 'orchestration-only',
    files: [baseRelative, freshRelative, registryRelative].sort().map((relative) => ({
      path: relative,
      class: classifyTrackedScope(relative),
    })),
  }, null, 2)}\n`);
  assert.equal(spawnSync('git', ['init'], { cwd: f.repoRoot }).status, 0);
  assert.equal(
    spawnSync('git', ['add', baseRelative, registryRelative], { cwd: f.repoRoot }).status,
    0,
  );

  const findings = validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest });
  assert.deepEqual(
    findings.filter((finding) => ['stale-tracked-scope-entry', 'unclassified-tracked-path'].includes(finding.type)),
    [],
  );
});

test('Proves: ORG-BOUNDARY-DEPENDENCY-001; Test type: source-shape boundary; Surface: tracked dependency mirrors; Authority: orchestration dependency classifier; Killer mutation: remove an admitted marketplace format or broaden exact PDF/TSX assets to arbitrary dependency binaries/application source; Gated command: npm test', () => {
  const portableDependencyFiles = [
    'dependencies/specforge/skills/specforge/SKILL.md',
    'dependencies/specforge/.agents/skills/specforge/openai.yaml',
    'dependencies/specforge/scripts/validate.py',
    'dependencies/visualforge/.codex-plugin/plugin.json',
    'dependencies/visualforge/examples/fixtures/_base/.visualforge.lock',
    'dependencies/visualforge/examples/fixtures/vf-find-025-wrapper-semantic-drift/app/sign-in/page.tsx',
    'dependencies/marketforge/Marketing Guide V3.pdf',
    'dependencies/hormozi/LICENSE',
  ];
  for (const relative of portableDependencyFiles) {
    assert.equal(classifyTrackedScope(relative), 'orchestration-dependency', relative);
  }
  for (const relative of [
    'dependencies/marketforge/unreviewed-guide.pdf',
    'dependencies/visualforge/application/page.tsx',
    'dependencies/specforge/bin/runner.exe',
  ]) {
    assert.equal(classifyTrackedScope(relative), undefined, relative);
  }
});

test('Proves: ORG-BOUNDARY-CODEX-STATE-001; Test type: source-shape boundary; Surface: curated Codex state; Authority: tracked-scope classifier; Killer mutation: omit TOML automation instances, omit retired Markdown skills, or admit arbitrary automation/retired binaries; Gated command: npm test', () => {
  const expected = new Map([
    ['automations/instances/daily/automation.toml', 'automation-instance'],
    ['automations/instances/daily/memory.md', 'automation-instance'],
    ['skills-retired/ai-build-lessons-capture/SKILL.md', 'retired-skill'],
  ]);
  for (const [relative, classification] of expected) {
    assert.equal(classifyTrackedScope(relative), classification, relative);
  }
  for (const relative of [
    'automations/instances/daily/payload.json',
    'skills-retired/archive.exe',
  ]) {
    assert.equal(classifyTrackedScope(relative), undefined, relative);
  }
});

test('Proves: ORG-BOUNDARY-CLAUDE-SETTINGS-001; Test type: secret-boundary liveness and mutation; Surface: Claude settings template; Authority: unmanaged local settings plus placeholder-only canonical shape; Killer mutation: copy any live MCP environment value into canonical or add an install/capture mapping for settings.json; Gated command: npm test', () => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const template = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'global', 'claude', 'settings.template.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'control-plane.manifest.json'), 'utf8'));
  const environmentValues = Object.values(template.mcpServers ?? {})
    .flatMap((server) => Object.values(server?.env ?? {}));

  assert.ok(environmentValues.length > 0, 'template must exercise the secret-bearing MCP environment shape');
  assert.ok(environmentValues.every((value) => value === '<SET-LOCALLY>'));
  assert.ok(manifest.mappings.every((mapping) =>
    mapping.source !== 'global/claude/settings.template.json'
      && mapping.captureFrom !== '${HOME}/.claude/settings.json'
      && !(mapping.destinations ?? []).includes('${HOME}/.claude/settings.json')));
});

test('Proves: ORG-BOUNDARY-CLAUDE-MEMORY-001; Test type: source-boundary liveness and ownership mutation; Surface: curated agent memory; Authority: exact captured-memory mapping set; Killer mutation: capture the projects root, include a non-Markdown format, omit tokenized path round-trip, capture the wrong mapping, or leave a memory mapping install-authoritative; Gated command: npm test', () => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'control-plane.manifest.json'), 'utf8'));
  const memoryMappings = manifest.mappings.filter((mapping) => mapping.id.startsWith('claude-project-memory-'));
  const expectedCapturedIds = [
    'global-codex-memories',
    'claude-project-memory-nuvo-dialer',
    'claude-project-memory-coachai',
    'claude-project-memory-nuvora-link',
    'claude-project-memory-llm-councel',
    'claude-project-memory-voice-agents',
  ].sort();

  assert.ok(memoryMappings.length > 0, 'at least one current project memory root must be live');
  for (const mapping of memoryMappings) {
    assert.match(mapping.source, /^global\/claude\/project-memory\/[^/]+$/u);
    assert.match(mapping.captureFrom, /^\$\{HOME\}\/\.claude\/projects\/[^/]+\/memory$/u);
    assert.deepEqual(mapping.allowedExtensions, ['.md']);
    assert.equal(mapping.renderContentTokens, true);
    assert.equal(mapping.tokenizeRegisteredPathsOnCapture, true);
  }
  assert.deepEqual(
    manifest.mappings.filter((mapping) => mapping.ownership === 'captured').map((mapping) => mapping.id).sort(),
    expectedCapturedIds,
  );
  assert.ok(manifest.mappings
    .filter((mapping) => !expectedCapturedIds.includes(mapping.id))
    .every((mapping) => mapping.ownership === 'canonical'));
  assert.ok(manifest.mappings.every((mapping) => mapping.captureFrom !== '${HOME}/.claude/projects'));
});

test('Proves: capture rejects machine-specific paths before writes; Test type: portability mutation; Surface: capture; Authority: tokenized roots; Killer mutation: import a C drive path; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'unsafe.md'), `Tool: ${['C:', 'dev', 'Some Tool'].join('\\')}\n`);
  assert.throws(() => runCapture({ ...f, dryRun: false }), /Machine-specific absolute path refused/u);
  assert.equal(fs.existsSync(path.join(f.repoRoot, 'canonical', 'rules', 'unsafe.md')), false);
});

test('Proves: ORG-CAPTURE-PORTABILITY-001; Test type: registered-path round trip; Surface: dependency capture and installed parity; Authority: root registry plus manifest token-render contract; Killer mutation: stop inverse-tokenizing a registered path, lose exact Windows drive casing, tokenize an unregistered path, or allow tokenization while install rendering is disabled; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'portable.md');
  const registeredHome = f.home;
  const alternateSeparatorHome = f.home.replaceAll('\\', '/');
  f.roots['WORKSPACE:dev'] = 'C:\\dev';
  fs.writeFileSync(installed, `Exact ${registeredHome}\\.claude\\rules\nAlternate ${alternateSeparatorHome}/.claude/rules\nLower drive c:\\dev\\worktree\n`);
  f.manifest.mappings[0].tokenizeRegisteredPathsOnCapture = true;
  f.manifest.mappings[0].renderContentTokens = true;

  const operations = runCapture({ ...f, dryRun: false });
  assert.equal(operations.length, 1);
  assert.equal(
    fs.readFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'portable.md'), 'utf8'),
    'Exact ${HOME}\\.claude\\rules\nAlternate ${HOME|forward-slash}/.claude/rules\nLower drive ${WORKSPACE:dev|lowercase-drive}\\worktree\n',
  );
  assert.deepEqual(runCheck(f), []);

  fs.writeFileSync(installed, `See ${['C:', 'Users', 'unregistered', 'private', 'rules'].join('/')}\n`);
  assert.throws(() => runCapture({ ...f, dryRun: true, updateExisting: true }), /Machine-specific absolute path refused/u);

  f.manifest.mappings[0].renderContentTokens = false;
  assert.ok(validateManifest(f.manifest, f.repoRoot, f.roots).some((message) =>
    message === 'Capture path tokenization requires rendered install parity: claude-rules'));
});

test('Proves: overlapping destination roots cannot race; Test type: collision mutation; Surface: manifest; Authority: destination planner; Killer mutation: nest one managed destination under another; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Safe\n');
  f.manifest.mappings.push({ ...f.manifest.mappings[0], id: 'nested-rules', destinations: ['${HOME}/.claude/rules/nested'] });
  assert.ok(validateManifest(f.manifest, f.repoRoot, f.roots).some((message) => message.includes('Overlapping destination roots')));
});

test('Proves: non-allowlisted local files inside a dedicated managed root are visible; Test type: local-only mutation; Surface: parity; Authority: manifest allowlist; Killer mutation: add helper.exe beside managed rules; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Safe\n');
  runInstall({ ...f, dryRun: false });
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'helper.exe'), Buffer.from([0, 1]));
  assert.ok(runCheck(f).some((finding) => finding.type === 'unsafe-installed-entry' && finding.reason === 'extension not allowlisted'));
});

test('Proves: registered path tokens render on install and still pass parity; Test type: portability; Surface: generated copy; Authority: local root registry; Killer mutation: leave a registered HOME token literal in installed output', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), 'Home: ${HOME}\n');
  runInstall({ ...f, dryRun: false });
  const installed = fs.readFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), 'utf8');
  assert.equal(installed, `Home: ${f.home}\n`);
  assert.deepEqual(runCheck(f), []);
});

test('Proves: portable tracked specs can preserve registered tokens while their destination path still resolves; Test type: portability mutation; Surface: project automation spec; Authority: mapping render policy; Killer mutation: expand a project token into machine-specific tracked JSON; Gated command: npm test', () => {
  const f = fixture();
  f.manifest.mappings[0].renderContentTokens = false;
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), 'Root: ${HOME}\n');
  runInstall({ ...f, dryRun: false });
  const installed = fs.readFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), 'utf8');
  assert.equal(installed, 'Root: ${HOME}\n');
  assert.deepEqual(runCheck(f), []);
});

test('Proves: one-time baseline adoption is explicit; Test type: migration mutation; Surface: installer; Authority: dirty-target policy; Killer mutation: overwrite a pre-existing target without --adopt-existing', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Imported baseline\n');
  assert.throws(() => runInstall({ ...f, dryRun: false }), /Dirty managed target/);
  runInstall({ ...f, dryRun: false, adoptExisting: true });
  assert.equal(fs.readFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), 'utf8'), '# Canonical\n');
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 row 1 target equals lock; Test type: state-matrix liveness; Surface: shared installer chokepoint; Authority: last-installed target state; Killer mutation: reject a clean target when incoming canonical changes; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Locked\n');
  runInstall(f);
  fs.writeFileSync(canonical, '# Incoming\n');

  const operations = runInstall(f);

  assert.ok(operations.some((operation) => operation.type === 'update' && operation.relative === 'base.md'));
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Incoming\n');
  assert.deepEqual(runCheck(f), []);
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 row 2 target differs from lock and equals incoming; Test type: state-matrix liveness; Surface: shared installer chokepoint; Authority: canonical target identity; Killer mutation: refuse an already-canonical target or rewrite it instead of refreshing only the lock; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Locked\n');
  runInstall(f);
  fs.writeFileSync(canonical, '# Incoming\n');
  fs.writeFileSync(installed, '# Incoming\n');

  const operations = runInstall(f);

  assert.deepEqual(
    operations.map(({ type, relative }) => ({ type, relative })),
    [{ type: 'refresh-lock', relative: 'base.md' }],
  );
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Incoming\n');
  assert.deepEqual(runCheck(f), []);
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 row 3 target differs from lock while incoming equals lock; Test type: state-matrix refusal; Surface: shared installer chokepoint; Authority: three-state target identity; Killer mutation: restore unconditional overwrite, adoption, or installed-tree reconciliation of a locally evolved target when canonical is unchanged; Gated command: npm test', () => {
  for (const adoptExisting of [false, true]) {
    const f = fixture();
    const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
    const installed = path.join(f.home, '.claude', 'rules', 'base.md');
    fs.writeFileSync(canonical, '# Locked\n');
    runInstall(f);
    fs.writeFileSync(installed, '# Local evolution\n');

    const error = thrownError(() => runInstall({ ...f, adoptExisting }));
    const digests = targetStateDigests(error);

    assert.equal(digests.locked, digests.incoming, error.message);
    assert.notEqual(digests.current, digests.locked, error.message);
    assert.match(error.message, /Locally evolved managed target refused: mapping=claude-rules/u);
    assert.match(
      error.message,
      new RegExp(`Exact reconciliation command: install --mapping claude-rules --reconcile-target claude-rules:${digests.current}`, 'u'),
    );
    assert.equal(fs.readFileSync(installed, 'utf8'), '# Local evolution\n');
  }

  const reviewedTree = fixture();
  const reviewedCanonical = path.join(reviewedTree.repoRoot, 'canonical', 'rules', 'base.md');
  const reviewedInstalled = path.join(reviewedTree.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(reviewedCanonical, '# Locked\n');
  runInstall(reviewedTree);
  fs.writeFileSync(reviewedInstalled, '# Local evolution\n');
  const reviewedDigest = computeInstalledTreeDigest({
    root: path.dirname(reviewedInstalled),
    manifest: reviewedTree.manifest,
    mapping: reviewedTree.manifest.mappings[0],
  }).sha256;
  assert.throws(() => runInstall({
    ...reviewedTree,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', reviewedDigest]]),
  }), /Locally evolved managed target refused/u);
  assert.equal(fs.readFileSync(reviewedInstalled, 'utf8'), '# Local evolution\n');
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 row 4 target, lock, and incoming all differ; Test type: state-matrix refusal; Surface: shared installer chokepoint; Authority: three-state target identity; Killer mutation: restore unconditional overwrite or adoption when target and canonical both moved; Gated command: npm test', () => {
  for (const adoptExisting of [false, true]) {
    const f = fixture();
    const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
    const installed = path.join(f.home, '.claude', 'rules', 'base.md');
    fs.writeFileSync(canonical, '# Locked\n');
    runInstall(f);
    fs.writeFileSync(canonical, '# Incoming\n');
    fs.writeFileSync(installed, '# Local evolution\n');

    const error = thrownError(() => runInstall({ ...f, adoptExisting }));
    const digests = targetStateDigests(error);

    assert.equal(new Set(Object.values(digests)).size, 3, error.message);
    assert.match(error.message, /Locally evolved managed target refused: mapping=claude-rules/u);
    assert.match(
      error.message,
      new RegExp(`Exact reconciliation command: install --mapping claude-rules --reconcile-target claude-rules:${digests.current}`, 'u'),
    );
    assert.equal(fs.readFileSync(installed, 'utf8'), '# Local evolution\n');
  }
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 row 5 exact target reconciliation proceeds and receipts the reviewed digest; Test type: state-matrix reviewed write; Surface: shared installer transaction; Authority: exact current target state; Killer mutation: ignore the reviewed digest, omit it from the operation log, or omit it from the snapshot receipt; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const lockPath = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(canonical, '# Locked\n');
  runInstall(f);
  fs.writeFileSync(canonical, '# Incoming\n');
  fs.writeFileSync(installed, '# Local evolution\n');
  const refused = thrownError(() => runInstall({ ...f, adoptExisting: true }));
  const reviewedDigest = targetStateDigests(refused).current;

  const operations = runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileTarget: new Map([['claude-rules', reviewedDigest]]),
  });

  assert.ok(operations.some((operation) =>
    operation.type === 'reconcile-target-update'
      && operation.relative === 'base.md'
      && operation.reviewedTargetDigest === reviewedDigest));
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Incoming\n');
  assert.deepEqual(runCheck(f), []);
  const receipt = JSON.parse(fs.readFileSync(
    path.join(path.dirname(lockPath), 'snapshots', operations.installId, 'snapshot.json'),
    'utf8',
  ));
  assert.equal(receipt.entries[0].reviewedTargetDigest, reviewedDigest);
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 row 6 a stale reviewed target digest refuses again; Test type: state-matrix stale-review mutation; Surface: shared installer preflight; Authority: exact current target state; Killer mutation: accept any SHA-256-shaped reconciliation value after the target moves; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Locked\n');
  runInstall(f);
  fs.writeFileSync(canonical, '# Incoming\n');
  fs.writeFileSync(installed, '# Reviewed local evolution\n');
  const firstRefusal = thrownError(() => runInstall({ ...f, adoptExisting: true }));
  const reviewedDigest = targetStateDigests(firstRefusal).current;
  fs.writeFileSync(installed, '# Moved after review\n');

  const staleRefusal = thrownError(() => runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileTarget: new Map([['claude-rules', reviewedDigest]]),
  }));
  const currentDigest = targetStateDigests(staleRefusal).current;

  assert.notEqual(currentDigest, reviewedDigest, staleRefusal.message);
  assert.match(staleRefusal.message, new RegExp(`stale-reviewed-target-sha256=${reviewedDigest}`, 'u'));
  assert.match(
    staleRefusal.message,
    new RegExp(`Exact reconciliation command: install --mapping claude-rules --reconcile-target claude-rules:${currentDigest}`, 'u'),
  );
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Moved after review\n');
});

test('Proves: OVERLAY-HYBRID-COMPAT-001 captured memory mappings bypass target reconciliation and remain untouched; Test type: ownership counterexample; Surface: shared installer chokepoint; Authority: captured live state; Killer mutation: hash, lock, or write a captured mapping while evaluating target evolution; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const live = path.join(f.home, '.claude', 'rules', 'base.md');
  f.manifest.mappings[0].id = 'claude-project-memory-fixture';
  f.manifest.mappings[0].ownership = 'captured';
  fs.writeFileSync(canonical, '# Captured backup\n');
  fs.writeFileSync(live, '# Newer live memory\n');
  const before = fs.readFileSync(live);

  const operations = runInstall({
    ...f,
    mappingIds: ['claude-project-memory-fixture'],
    reconcileTarget: new Map([['claude-project-memory-fixture', 'a'.repeat(64)]]),
  });

  assert.deepEqual(operations.map(({ type, mapping }) => ({ type, mapping })), [{
    type: 'skipped-by-mode',
    mapping: 'claude-project-memory-fixture',
  }]);
  assert.deepEqual(fs.readFileSync(live), before);
  assert.equal(fs.existsSync(path.join(f.home, '.nuvoralink-control-plane', 'lock.json')), false);
});

test('Proves: declared legacy junctions are verified and retained without being treated as writes; Test type: regression; Surface: installer apply phase; Authority: manifest link policy; Killer mutation: remove the retain-operation skip and attempt to write undefined bytes', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Canonical\n');
  const link = path.join(f.home, '.claude', 'rules-link');
  fs.symlinkSync(path.join(f.home, '.claude', 'rules'), link, 'junction');
  f.manifest.mappings[0].destinations.push('${HOME}/.claude/rules-link');
  f.manifest.mappings[0].allowInstalledRootLink = true;
  const operations = runInstall({ ...f, dryRun: false, adoptExisting: true });
  assert.ok(operations.some((operation) => operation.type === 'retain-legacy-link'));
  assert.equal(fs.readFileSync(path.join(link, 'base.md'), 'utf8'), '# Canonical\n');
});

test('Proves: a successful install can be rolled back to the prior lock and bytes; Test type: recovery; Surface: installer; Authority: snapshot journal; Killer mutation: overwrite without a restorable snapshot; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Version one\n');
  runInstall({ ...f, dryRun: false });
  const firstLock = fs.readFileSync(path.join(f.home, '.nuvoralink-control-plane', 'lock.json'), 'utf8');
  fs.writeFileSync(canonical, '# Version two\n');
  const second = runInstall({ ...f, dryRun: false });
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Version two\n');
  runRollback({ manifest: f.manifest, roots: f.roots, installId: second.installId });
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Version one\n');
  assert.equal(fs.readFileSync(path.join(f.home, '.nuvoralink-control-plane', 'lock.json'), 'utf8'), firstLock);
});

test('Proves: rollback refuses a line-ending-only byte change after installation; Test type: destructive-boundary mutation; Surface: rollback; Authority: snapshot raw hash; Killer mutation: validate rollback with the normalized portability hash and overwrite CRLF-modified bytes; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Version one\n');
  runInstall({ ...f, dryRun: false });
  fs.writeFileSync(canonical, '# Version two\n');
  const second = runInstall({ ...f, dryRun: false });

  fs.writeFileSync(installed, '# Version two\r\n');
  assert.throws(
    () => runRollback({ manifest: f.manifest, roots: f.roots, installId: second.installId }),
    /Rollback refused; installed target is dirty/u
  );
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Version two\r\n');
});

test('Proves: a mid-install failure restores every prior byte; Test type: failure injection; Surface: installer transaction; Authority: snapshot journal; Killer mutation: throw after the first write; Gated command: npm test', () => {
  const f = fixture();
  const canonicalRoot = path.join(f.repoRoot, 'canonical', 'rules');
  const installedRoot = path.join(f.home, '.claude', 'rules');
  fs.writeFileSync(path.join(canonicalRoot, 'a.md'), 'a1\n');
  fs.writeFileSync(path.join(canonicalRoot, 'b.md'), 'b1\n');
  runInstall({ ...f, dryRun: false });
  fs.writeFileSync(path.join(canonicalRoot, 'a.md'), 'a2\n');
  fs.writeFileSync(path.join(canonicalRoot, 'b.md'), 'b2\n');
  assert.throws(() => runInstall({ ...f, dryRun: false, failAfter: 1 }), /Injected install failure/u);
  assert.equal(fs.readFileSync(path.join(installedRoot, 'a.md'), 'utf8'), 'a1\n');
  assert.equal(fs.readFileSync(path.join(installedRoot, 'b.md'), 'utf8'), 'b1\n');
  assert.deepEqual(runCheck(f), [
    { type: 'drift', relative: 'a.md', mapping: 'claude-rules', destination: '${HOME}/.claude/rules' },
    { type: 'drift', relative: 'b.md', mapping: 'claude-rules', destination: '${HOME}/.claude/rules' }
  ]);
});

test('Proves: a reviewed divergent installed tree can reconcile and return to ordinary parity; Test type: migration and liveness; Surface: selected installer mapping; Authority: reviewed whole-tree digest; Killer mutation: require adoptExisting or leave the lock dependent on reconciliation mode; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Canonical merged authority\n');
  fs.writeFileSync(installed, '# Reviewed installed authority\n');
  const reviewed = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] });

  const operations = runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]),
  });
  assert.ok(operations.some((operation) => operation.type === 'reconcile-update'));
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Canonical merged authority\n');
  assert.deepEqual(runCheck({ ...f, mappingIds: ['claude-rules'] }), []);
  assert.equal(runInstall({ ...f, mappingIds: ['claude-rules'] }).filter((operation) => !['refresh-lock', 'retain-legacy-link'].includes(operation.type)).length, 0);
});

test('Proves: reviewed tree identity binds raw bytes; Test type: digest mutation; Surface: reconciliation preflight; Authority: reviewed whole-tree digest; Killer mutation: change one byte without changing the digest; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Canonical\n');
  fs.writeFileSync(installed, '# Reviewed\n');
  const reviewed = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] });
  assert.equal(reviewed.fileCount, 1);
  fs.appendFileSync(installed, '!');

  assert.throws(() => runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]),
  }), /reviewed tree digest mismatch/u);
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Reviewed\n!');
});

test('Proves: reviewed tree identity binds normalized relative paths independently of bytes and count; Test type: path-only digest mutation; Surface: reconciliation preflight; Authority: reviewed whole-tree digest; Killer mutation: rename a reviewed file while preserving bytes and count without invalidating reconciliation; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const reviewedPath = path.join(installedRoot, 'base.md');
  const renamedPath = path.join(installedRoot, 'renamed.md');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(reviewedPath, '# Identical bytes\n');
  const reviewed = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] });
  fs.renameSync(reviewedPath, renamedPath);

  assert.throws(() => runInstall({ ...f, mappingIds: ['claude-rules'], reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]) }), /reviewed tree digest mismatch/u);
  assert.equal(fs.existsSync(reviewedPath), false);
  assert.equal(fs.readFileSync(renamedPath, 'utf8'), '# Identical bytes\n');
});

test('Proves: reviewed local-only files retire only as part of the reviewed whole tree; Test type: retirement migration; Surface: reconciliation planner; Authority: reviewed whole-tree digest; Killer mutation: retain a reviewed obsolete file or require a prior lock entry; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, 'base.md'), '# Old\n');
  fs.writeFileSync(path.join(installedRoot, 'installed-only.md'), '# Reviewed retirement\n');
  const reviewed = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] });

  const operations = runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]),
  });
  assert.ok(operations.some((operation) => operation.type === 'retire' && operation.relative === 'installed-only.md'));
  assert.equal(fs.existsSync(path.join(installedRoot, 'installed-only.md')), false);
});

test('Proves: an unreviewed local-only addition invalidates reconciliation before any write; Test type: local-only mutation; Surface: reconciliation preflight; Authority: reviewed whole-tree digest; Killer mutation: digest only canonical-overlapping files and silently retire the surprise file; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, 'base.md'), '# Reviewed old\n');
  const reviewed = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] });
  fs.writeFileSync(path.join(installedRoot, 'surprise.md'), '# Not reviewed\n');

  assert.throws(() => runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]),
  }), /reviewed tree digest mismatch/u);
  assert.equal(fs.readFileSync(path.join(installedRoot, 'base.md'), 'utf8'), '# Reviewed old\n');
  assert.equal(fs.existsSync(path.join(installedRoot, 'surprise.md')), true);
});

test('Proves: reconciliation input and mapping selection are exact and fail before mutation; Test type: input-boundary mutation; Surface: install API; Authority: selected mapping plus reviewed digest pair; Killer mutation: accept malformed, empty, unknown, unselected, or duplicate selections; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const secondarySource = path.join(f.repoRoot, 'canonical', 'secondary');
  const secondaryInstalled = path.join(f.home, '.claude', 'secondary');
  fs.mkdirSync(secondarySource, { recursive: true });
  fs.mkdirSync(secondaryInstalled, { recursive: true });
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(installed, '# Old\n');
  fs.writeFileSync(path.join(secondarySource, 'secondary.md'), '# Secondary canonical\n');
  fs.writeFileSync(path.join(secondaryInstalled, 'secondary.md'), '# Secondary old\n');
  f.manifest.mappings.push({
    ...structuredClone(f.manifest.mappings[0]),
    id: 'secondary-rules',
    source: 'canonical/secondary',
    captureFrom: '${HOME}/.claude/secondary',
    destinations: ['${HOME}/.claude/secondary'],
  });
  const old = fs.readFileSync(installed, 'utf8');
  const digest = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;
  const secondaryDigest = computeInstalledTreeDigest({ root: secondaryInstalled, manifest: f.manifest, mapping: f.manifest.mappings[1] }).sha256;
  assert.throws(() => runInstall({ ...f, mappingIds: ['claude-rules'], reconcileInstalled: new Map() }), /at least one mapping digest/u);
  assert.throws(() => runInstall({ ...f, mappingIds: ['claude-rules'], reconcileInstalled: new Map([['claude-rules', 'bad']]) }), /Invalid reviewed installed-tree digest/u);
  assert.throws(() => runInstall({ ...f, mappingIds: ['claude-rules'], reconcileInstalled: new Map([['unknown-mapping', digest]]) }), /Unknown reconciliation mapping/u);
  assert.throws(() => runInstall({ ...f, mappingIds: ['claude-rules'], reconcileInstalled: new Map([['secondary-rules', secondaryDigest]]) }), /must exactly match selected mappings/u);
  assert.throws(() => runInstall({ ...f, reconcileInstalled: new Map([['claude-rules', digest]]) }), /explicit --mapping/u);
  assert.throws(() => runInstall({ ...f, mappingIds: ['claude-rules', 'claude-rules'], reconcileInstalled: new Map([['claude-rules', digest]]) }), /Duplicate --mapping/u);
  assert.equal(fs.readFileSync(installed, 'utf8'), old);
});

test('Proves: reconciliation is incompatible with baseline adoption; Test type: authority-boundary mutation; Surface: installer modes; Authority: distinct adoption and reviewed-tree contracts; Killer mutation: let adoptExisting bypass a reviewed digest mismatch; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Old\n');
  const digest = computeInstalledTreeDigest({ root: path.join(f.home, '.claude', 'rules'), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;
  assert.throws(() => runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    adoptExisting: true,
    reconcileInstalled: new Map([['claude-rules', digest]]),
  }), /cannot be combined/u);
});

test('Proves: approved installed junctions remain links while each physical destination is digest-checked; Test type: link counterexample; Surface: reconciliation planner; Authority: manifest link policy plus reviewed physical tree; Killer mutation: traverse or replace the junction, or skip the physical digest; Gated command: npm test', () => {
  const f = fixture();
  const physical = path.join(f.home, '.claude', 'rules');
  const link = path.join(f.home, '.claude', 'rules-link');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(physical, 'base.md'), '# Reviewed old\n');
  fs.symlinkSync(physical, link, 'junction');
  f.manifest.mappings[0].destinations.push('${HOME}/.claude/rules-link');
  f.manifest.mappings[0].allowInstalledRootLink = true;
  const digest = computeInstalledTreeDigest({ root: physical, manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;

  const operations = runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', digest]]),
  });
  assert.ok(operations.some((operation) => operation.type === 'retain-legacy-link'));
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.equal(fs.readFileSync(path.join(link, 'base.md'), 'utf8'), '# Canonical\n');
});

test('Proves: reconciliation dry-run plans without touching installed bytes or locks; Test type: no-write mutation; Surface: reconciliation dry-run; Authority: dry-run contract; Killer mutation: write the canonical bytes or lock during planning; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const lock = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(installed, '# Reviewed old\n');
  const digest = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;

  const operations = runInstall({
    ...f,
    dryRun: true,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', digest]]),
  });
  assert.ok(operations.some((operation) => operation.type === 'reconcile-update'));
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Reviewed old\n');
  assert.equal(fs.existsSync(lock), false);
});

test('Proves: reconciliation writes use the existing transaction and roll back every changed byte; Test type: failure injection; Surface: reconciliation transaction; Authority: snapshot journal; Killer mutation: bypass applyInstallTransaction for reviewed dirty overwrites; Gated command: npm test', () => {
  const f = fixture();
  const canonicalRoot = path.join(f.repoRoot, 'canonical', 'rules');
  const installedRoot = path.join(f.home, '.claude', 'rules');
  fs.writeFileSync(path.join(canonicalRoot, 'a.md'), 'new-a\n');
  fs.writeFileSync(path.join(canonicalRoot, 'b.md'), 'new-b\n');
  fs.writeFileSync(path.join(installedRoot, 'a.md'), 'old-a\n');
  fs.writeFileSync(path.join(installedRoot, 'b.md'), 'old-b\n');
  const digest = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;

  assert.throws(() => runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', digest]]),
    failAfter: 1,
  }), /Injected install failure/u);
  assert.equal(fs.readFileSync(path.join(installedRoot, 'a.md'), 'utf8'), 'old-a\n');
  assert.equal(fs.readFileSync(path.join(installedRoot, 'b.md'), 'utf8'), 'old-b\n');
});

test('Proves: install reconciliation preserves exact mapping selections; Test type: parser liveness; Surface: control-plane install argument parser; Authority: argv-to-options contract; Killer mutation: omit or alter the selected mapping in parsed options; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  const parsed = parseControlPlaneArgs(['install', '--dry-run', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`]);
  assert.equal(parsed.command, 'install');
  assert.equal(parsed.dryRun, true);
  assert.deepEqual(parsed.mappingIds, ['claude-rules']);
  assert.deepEqual(parsed.reconcileInstalled, new Map([['claude-rules', digest]]));
});

test('Proves: target reconciliation preserves exact mapping selections; Test type: parser liveness; Surface: control-plane install argument parser; Authority: argv-to-options contract; Killer mutation: omit or alter the reviewed target mapping/digest in parsed options; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  const parsed = parseControlPlaneArgs(['install', '--dry-run', '--mapping', 'claude-rules', '--reconcile-target', `claude-rules:${digest}`]);
  assert.equal(parsed.command, 'install');
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.adoptExisting, false);
  assert.deepEqual(parsed.mappingIds, ['claude-rules']);
  assert.deepEqual(parsed.reconcileTarget, new Map([['claude-rules', digest]]));
});

test('Proves: target reconciliation is exact-mapping, install-only, and mutually exclusive with blanket or installed-tree migration modes; Test type: parser boundary mutation; Surface: control-plane argument parser; Authority: reviewed-target command grammar; Killer mutation: accept a stale-shaped value broadly, omit explicit selection, or combine independent overwrite authorities; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  const invalid = [
    ['check', '--reconcile-target', `claude-rules:${digest}`],
    ['install', '--reconcile-target'],
    ['install', '--reconcile-target', 'claude-rules:ABC'],
    ['install', `--reconcile-target=claude-rules:${digest}`],
    ['install', '--reconcile-targetX', `claude-rules:${digest}`],
    ['install', '--reconcile-target', `claude-rules:${digest}`, '--reconcile-target', `claude-rules:${digest}`],
    ['install', '--reconcile-target', `claude-rules:${digest}`],
    ['install', '--mapping', 'claude-rules', '--reconcile-target', `other-rules:${digest}`],
    ['install', '--mapping', 'claude-rules', '--reconcile-target', `claude-rules:${digest}`, '--adopt-existing'],
    ['install', '--mapping', 'claude-rules', '--reconcile-target', `claude-rules:${digest}`, '--reconcile-installed', `claude-rules:${digest}`],
  ];
  for (const argv of invalid) assert.throws(() => parseControlPlaneArgs(argv), undefined, argv.join(' '));
});

test('Proves: install reconciliation defaults adoption off; Test type: parser mode liveness; Surface: control-plane install argument parser; Authority: migration-mode contract; Killer mutation: force adoptExisting true when only reconciliation is requested; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  assert.equal(parseControlPlaneArgs(['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`]).adoptExisting, false);
});

test('Proves: unqualified install preserves undefined all-mapping selection; Test type: parser counterexample; Surface: control-plane install argument parser; Authority: selection contract; Killer mutation: collapse absent mapping selection to an empty array; Gated command: npm test', () => {
  assert.equal(parseControlPlaneArgs(['install']).mappingIds, undefined);
});

test('Proves: reconciliation is install-command-only at the public parser boundary; Test type: parser command mutation; Surface: control-plane argument parser; Authority: command compatibility contract; Killer mutation: accept --reconcile-installed on check; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  assert.throws(() => parseControlPlaneArgs(['check', '--reconcile-installed', `claude-rules:${digest}`]), /not valid for check/u);
});

test('Proves: reconciliation cannot silently become baseline adoption; Test type: parser mode mutation; Surface: control-plane install argument parser; Authority: mutually exclusive migration modes; Killer mutation: accept --adopt-existing with --reconcile-installed; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  assert.throws(() => parseControlPlaneArgs(['install', '--mapping', 'claude-rules', '--adopt-existing', '--reconcile-installed', `claude-rules:${digest}`]), /accepts only/u);
});

test('Proves: reconciliation arguments obey the exact mapping-to-lowercase-SHA256 grammar; Test type: parser grammar mutation; Surface: control-plane install argument parser; Authority: reconciliation argument grammar; Killer mutation: accept missing, uppercase, inline-equals, near-prefix, or duplicate values; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  assert.throws(() => parseControlPlaneArgs(['install', '--reconcile-installed']), /Missing value/u);
  assert.throws(() => parseControlPlaneArgs(['install', '--reconcile-installed', 'claude-rules:ABC']), /Invalid/u);
  assert.throws(() => parseControlPlaneArgs(['install', `--reconcile-installed=claude-rules:${digest}`]), /not valid for install/u);
  assert.throws(() => parseControlPlaneArgs(['install', '--reconcile-installedX', `claude-rules:${digest}`]), /not valid for install/u);
  assert.throws(() => parseControlPlaneArgs(['install', '--reconcile-installed', `claude-rules:${digest}`, '--reconcile-installed', `claude-rules:${digest}`]), /Duplicate/u);
});

test('Proves: every control-plane argument is consumed once by its command grammar; Test type: parser boundary mutation; Surface: scripts/lib/control-plane.mjs parseControlPlaneArgs; Authority: command-specific option grammar; Killer mutation: ignore a stray token, incompatible flag, or duplicate option; Gated command: npm test', () => {
  const digest = 'a'.repeat(64);
  const invalid = [
    [],
    ['unknown'],
    ['validate', '--dry-run'],
    ['validate', 'stray'],
    ['check', '--dry-run'],
    ['check', '--mapping'],
    ['check', '--mapping', 'claude-rules', 'stray'],
    ['capture', '--adopt-existing'],
    ['capture', '--install-id', 'id'],
    ['capture', '--dry-run', '--dry-run'],
    ['capture', '--file', 'claude-rules:base.md', '--file', 'claude-rules:base.md'],
    ['install', '--file', 'claude-rules:base.md'],
    ['install', '--update-existing'],
    ['install', '--install-id', 'id'],
    ['install', '--dry-run', '--dry-run'],
    ['install', '--mapping', 'claude-rules', '--mapping', 'claude-rules'],
    ['install', '--mapping', 'claude-rules', 'stray'],
    ['inventory', '--mapping', 'claude-rules'],
    ['rollback', '--dry-run'],
    ['rollback', '--install-id', 'one', '--install-id', 'two'],
    ['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`, '--adopt-existing'],
    ['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`, '--file', 'claude-rules:base.md'],
    ['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`, '--update-existing'],
    ['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`, '--install-id', 'id'],
    ['install', '--mapping', 'claude-rules', '--reconcile-installed', `other-rules:${digest}`],
    ['install', '--mapping', 'claude-rules', '--reconcile-target', `claude-rules:${digest}`, '--adopt-existing'],
    ['install', '--mapping', 'claude-rules', '--reconcile-target', `claude-rules:${digest}`, '--reconcile-installed', `claude-rules:${digest}`],
  ];
  for (const argv of invalid) assert.throws(() => parseControlPlaneArgs(argv), undefined, argv.join(' '));

  const parsed = parseControlPlaneArgs([
    'install', '--dry-run',
    '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`,
    '--mapping', 'other-rules', '--reconcile-installed', `other-rules:${'b'.repeat(64)}`,
  ]);
  assert.deepEqual(parsed.mappingIds, ['claude-rules', 'other-rules']);
  assert.deepEqual(parsed.reconcileInstalled, new Map([['claude-rules', digest], ['other-rules', 'b'.repeat(64)]]));
  assert.equal(parsed.dryRun, true);
});

test('Proves: the executable target reconciliation refuses local evolution with an exact command, then forwards and logs the reviewed digest; Test type: entrypoint end-to-end mutation; Surface: scripts/control-plane.mjs runControlPlaneCli; Authority: shared target-evolution guard plus public command wiring; Killer mutation: drop reconcileTarget at the entrypoint, preserve --adopt-existing as a bypass, or omit the reviewed digest from output; Gated command: npm test', () => {
  const f = fixture();
  const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(canonical, '# Locked\n');
  runInstall(f);
  fs.writeFileSync(canonical, '# Incoming\n');
  fs.writeFileSync(installed, '# Local evolution\n');
  const refusedIo = cliContext(f);

  assert.equal(runControlPlaneCli(['install', '--adopt-existing'], refusedIo.context), 1);
  const refusal = refusedIo.stderr.join('\n');
  const reviewedDigest = targetStateDigests(new Error(refusal)).current;
  assert.match(
    refusal,
    new RegExp(`Exact reconciliation command: npm run control:install -- --mapping claude-rules --reconcile-target claude-rules:${reviewedDigest}`, 'u'),
  );
  assert.deepEqual(refusedIo.stdout, []);
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Local evolution\n');

  const reconciledIo = cliContext(f);
  assert.equal(runControlPlaneCli([
    'install',
    '--mapping',
    'claude-rules',
    '--reconcile-target',
    `claude-rules:${reviewedDigest}`,
  ], reconciledIo.context), 0, reconciledIo.stderr.join('\n'));
  assert.ok(reconciledIo.stdout.some((line) =>
    line.includes(`reconcile-target-update\tclaude-rules\tbase.md\treviewed-target-sha256=${reviewedDigest}`)));
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Incoming\n');
});

test('Proves: executable reconciliation rejects incompatible or stray argv before changing bytes; Test type: entrypoint boundary mutation; Surface: scripts/control-plane.mjs runControlPlaneCli; Authority: consuming reconciliation grammar; Killer mutation: silently ignore one incompatible or stray CLI token; Gated command: npm test', () => {
  const forbiddenTails = [
    ['--file', 'claude-rules:base.md'],
    ['--update-existing'],
    ['--adopt-existing'],
    ['--install-id', 'id'],
    ['--unknown'],
    ['stray'],
    ['--dry-run', '--dry-run'],
  ];
  for (const tail of forbiddenTails) {
    const f = fixture();
    const installed = path.join(f.home, '.claude', 'rules', 'base.md');
    const lock = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
    fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
    fs.writeFileSync(installed, '# Reviewed old\n');
    const digest = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;
    const io = cliContext(f);
    const argv = ['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`, ...tail];
    assert.equal(runControlPlaneCli(argv, io.context), 1, argv.join(' '));
    assert.equal(fs.readFileSync(installed, 'utf8'), '# Reviewed old\n');
    assert.equal(fs.existsSync(lock), false);
    assert.equal(io.stdout.length, 0);
  }
});

test('Proves: the executable install entrypoint preserves dry-run through reconciliation planning; Test type: entrypoint mutation; Surface: scripts/control-plane.mjs runControlPlaneCli; Authority: argv-to-install wiring; Killer mutation: wire dryRun false into runInstall; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const lock = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(installed, '# Reviewed old\n');
  const digest = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['install', '--dry-run', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`], io.context), 0);
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Reviewed old\n');
  assert.equal(fs.existsSync(lock), false);
  assert.ok(io.stdout.some((line) => line === 'operations=1 dryRun=true'));
});

test('Proves: the executable install entrypoint forwards the exact mapping and reconciliation pair; Test type: entrypoint selection mutation; Surface: scripts/control-plane.mjs runControlPlaneCli; Authority: selected reviewed-tree migration; Killer mutation: omit mappingIds or reconcileInstalled when invoking runInstall; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const secondarySource = path.join(f.repoRoot, 'canonical', 'secondary');
  const secondaryInstalled = path.join(f.home, '.claude', 'secondary');
  fs.mkdirSync(secondarySource, { recursive: true });
  fs.mkdirSync(secondaryInstalled, { recursive: true });
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(installed, '# Reviewed old\n');
  fs.writeFileSync(path.join(secondarySource, 'secondary.md'), '# Secondary canonical\n');
  fs.writeFileSync(path.join(secondaryInstalled, 'secondary.md'), '# Secondary untouched\n');
  f.manifest.mappings.push({ ...structuredClone(f.manifest.mappings[0]), id: 'secondary-rules', source: 'canonical/secondary', captureFrom: '${HOME}/.claude/secondary', destinations: ['${HOME}/.claude/secondary'] });
  const digest = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['install', '--dry-run', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`], io.context), 0);
  assert.ok(io.stdout.some((line) => line.startsWith('reconcile-update\tclaude-rules\t')));
  assert.equal(io.stdout.some((line) => line.includes('secondary-rules')), false);
  assert.equal(fs.readFileSync(path.join(secondaryInstalled, 'secondary.md'), 'utf8'), '# Secondary untouched\n');
});

test('Proves: the executable inventory entrypoint renders the injected fixture manifest; Test type: entrypoint liveness; Surface: scripts/control-plane.mjs runControlPlaneCli inventory; Authority: manifest inventory command; Killer mutation: bypass the injected manifest and read the repository manifest instead; Gated command: npm test', () => {
  const f = fixture();
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['inventory'], io.context), 0);
  assert.deepEqual(JSON.parse(io.stdout.join('\n')), {
    mappings: [{ id: 'claude-rules', source: 'canonical/rules', destinations: ['${HOME}/.claude/rules'], ownership: 'canonical' }],
  });
});

test('Proves: digest CLI emits stable JSON for one physical destination; Test type: entrypoint liveness; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: installed-tree digest command; Killer mutation: omit a contract field or produce a different digest for unchanged bytes; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const installed = path.join(installedRoot, 'base.md');
  fs.writeFileSync(installed, '# Installed\n');
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], io.context), 0);
  assert.equal(io.stdout.length, 1);
  const result = JSON.parse(io.stdout[0]);
  assert.deepEqual(Object.keys(result), ['mapping', 'physicalDestination', 'sha256', 'fileCount']);
  assert.equal(result.mapping, 'claude-rules');
  assert.equal(result.physicalDestination, '${HOME}/.claude/rules');
  assert.match(result.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(result.fileCount, 1);
  const repeated = cliContext(f);
  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], repeated.context), 0);
  assert.equal(repeated.stdout[0], io.stdout[0]);
});

test('Proves: digest CLI never writes installed bytes or lock state; Test type: no-write mutation; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: read-only digest command; Killer mutation: write, normalize, or lock the installed tree while hashing it; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const content = '# Preserve exact bytes\r\n';
  fs.writeFileSync(installed, content);
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], io.context), 0);
  assert.equal(fs.readFileSync(installed, 'utf8'), content);
  assert.equal(fs.existsSync(path.join(f.home, '.nuvoralink-control-plane', 'lock.json')), false);
});

test('Proves: digest CLI output contains neither installed content nor absolute machine paths; Test type: disclosure mutation; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: portable metadata-only output contract; Killer mutation: emit the resolved destination or a file-content preview; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# PRIVATE_BUT_ALLOWED_CONTENT\n');
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], io.context), 0);
  assert.doesNotMatch(io.stdout[0], new RegExp(f.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(io.stdout[0], /PRIVATE_BUT_ALLOWED_CONTENT/u);
});

test('Proves: digest CLI skips an approved root junction and identifies the physical destination token; Test type: link counterexample; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: physical installed-tree identity; Killer mutation: traverse, hash, replace, or emit the approved junction as the physical destination; Gated command: npm test', () => {
  const f = fixture();
  const physical = path.join(f.home, '.claude', 'rules');
  const link = path.join(f.home, '.claude', 'rules-link');
  fs.writeFileSync(path.join(physical, 'base.md'), '# Installed\n');
  fs.symlinkSync(physical, link, 'junction');
  f.manifest.mappings[0].destinations.push('${HOME}/.claude/rules-link');
  f.manifest.mappings[0].allowInstalledRootLink = true;
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], io.context), 0);
  assert.equal(JSON.parse(io.stdout[0]).physicalDestination, '${HOME}/.claude/rules');
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
});

test('Proves: digest CLI requires one valid explicit mapping and rejects every unrelated mode option; Test type: argument-boundary mutation; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: read-only digest grammar; Killer mutation: accept absent, duplicate, unknown, adoption, reconciliation, file-selector, dry-run, or unknown options; Gated command: npm test', () => {
  const f = fixture();
  const digest = 'a'.repeat(64);
  const invalidArgv = [
    ['digest'],
    ['digest', '--mapping', 'claude-rules', '--mapping', 'claude-rules'],
    ['digest', '--mapping', 'unknown'],
    ['digest', '--mapping', 'claude-rules', '--adopt-existing'],
    ['digest', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`],
    ['digest', '--mapping', 'claude-rules', '--file', 'claude-rules:base.md'],
    ['digest', '--mapping', 'claude-rules', '--dry-run'],
    ['digest', '--mapping', 'claude-rules', '--unknown'],
  ];
  for (const argv of invalidArgv) {
    const io = cliContext(f);
    assert.equal(runControlPlaneCli(argv, io.context), 1, argv.join(' '));
    assert.equal(io.stdout.length, 0);
  }
});

test('Proves: digest CLI rejects unsafe installed entries with relative metadata and no bytes or machine path; Test type: unsafe-tree mutation; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: installed inventory deny boundary; Killer mutation: hash, read, or disclose a denied installed file; Gated command: npm test', () => {
  const f = fixture();
  const sentinel = 'SECRET_CONTENT_MUST_NOT_APPEAR';
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', '.credentials.json'), sentinel);
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], io.context), 1);
  assert.deepEqual(io.stdout, []);
  assert.match(io.stderr.join('\n'), /Managed tree contains denied filename: \.credentials\.json/u);
  assert.doesNotMatch(io.stderr.join('\n'), new RegExp(f.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(io.stderr.join('\n'), new RegExp(sentinel, 'u'));
});

test('Proves: reconciliation refuses every denied or unclassified installed entry before reading or mutating managed bytes; Test type: unsafe-tree mutation; Surface: reviewed-tree digest and install preflight; Authority: manifest deny and extension boundaries; Killer mutation: add an unallowlisted file, denied filename, or denied extension without changing the reviewed digest; Gated command: npm test', () => {
  const hostileCases = [
    ['helper.exe', Buffer.from([0, 1, 2])],
    ['.credentials.json', Buffer.from('content must never be emitted')],
    ['private.key', Buffer.from('content must never be emitted')],
  ];
  for (const [relative, bytes] of hostileCases) {
    const f = fixture();
    const canonical = path.join(f.repoRoot, 'canonical', 'rules', 'base.md');
    const installedRoot = path.join(f.home, '.claude', 'rules');
    const installed = path.join(installedRoot, 'base.md');
    fs.writeFileSync(canonical, '# Canonical\n');
    fs.writeFileSync(installed, '# Reviewed old\n');
    const reviewed = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] });
    fs.writeFileSync(path.join(installedRoot, relative), bytes);

    assert.throws(
      () => computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] }),
      /Managed tree contains (?:extension not allowlisted|denied filename|denied extension)/u,
    );
    assert.throws(() => runInstall({
      ...f,
      mappingIds: ['claude-rules'],
      reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]),
    }), /Managed tree contains (?:extension not allowlisted|denied filename|denied extension)/u);
    assert.equal(fs.readFileSync(installed, 'utf8'), '# Reviewed old\n');
    assert.equal(fs.existsSync(path.join(installedRoot, relative)), true);
  }
});

test('Proves: explicit mapping exclusions remain unmanaged counterexamples during strict reconciliation; Test type: exclusion counterexample; Surface: reviewed-tree digest and install preflight; Authority: mapping.exclude; Killer mutation: reject or retire an explicitly excluded subtree because it contains an unallowlisted file; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const excludedRoot = path.join(installedRoot, 'declared-unmanaged');
  fs.mkdirSync(excludedRoot, { recursive: true });
  f.manifest.mappings[0].exclude = ['declared-unmanaged'];
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, 'base.md'), '# Reviewed old\n');
  fs.writeFileSync(path.join(excludedRoot, 'ignored.exe'), Buffer.from([0, 1, 2]));
  const reviewed = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] });

  runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]),
  });
  assert.equal(fs.readFileSync(path.join(installedRoot, 'base.md'), 'utf8'), '# Canonical\n');
  assert.equal(fs.existsSync(path.join(excludedRoot, 'ignored.exe')), true);
  assert.deepEqual(runCheck({ ...f, mappingIds: ['claude-rules'] }), []);
});

test('Proves: ordinary parity reports every unsafe installed entry without reading or emitting its content; Test type: unsafe-inventory mutation; Surface: installed-tree check; Authority: manifest deny and extension boundaries; Killer mutation: silently skip a denied filename, extension, prefix, or directory segment; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const sentinel = 'SECRET_CONTENT_MUST_NOT_APPEAR';
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, '.credentials.json'), sentinel);
  fs.writeFileSync(path.join(installedRoot, 'private.key'), sentinel);
  fs.writeFileSync(path.join(installedRoot, '.env.local'), sentinel);
  fs.mkdirSync(path.join(installedRoot, 'logs'), { recursive: true });
  fs.writeFileSync(path.join(installedRoot, 'logs', 'nested.md'), sentinel);

  const findings = runCheck(f);
  assert.deepEqual(
    findings.filter((finding) => finding.type === 'unsafe-installed-entry').map(({ relative, reason }) => ({ relative, reason })),
    [
      { relative: '.credentials.json', reason: 'denied filename' },
      { relative: '.env.local', reason: 'denied filename prefix' },
      { relative: 'logs', reason: 'denied path segment' },
      { relative: 'private.key', reason: 'denied extension' },
    ],
  );
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(sentinel, 'u'));
  assert.equal(findings.some((finding) => finding.relative === 'logs/nested.md'), false);
});

test('Proves: exact installed-only deny exceptions stay local while canonical deny protection remains fail-closed; Test type: security boundary and liveness; Surface: installed parity plus canonical inventory; Authority: mapping.installedIgnore and repository deny policy; Killer mutation: apply installedIgnore to canonical inventory or stop applying it to installed inventory; Gated command: npm test', () => {
  const f = fixture();
  const canonicalRoot = path.join(f.repoRoot, 'canonical', 'rules');
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const installedEnvironment = path.join(installedRoot, '.env');
  const localOnlyBytes = 'LOCAL_ONLY_VALUE=fixture\n';
  f.manifest.mappings[0].installedIgnore = ['.env'];
  fs.writeFileSync(path.join(canonicalRoot, 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, 'base.md'), '# Canonical\n');
  fs.writeFileSync(installedEnvironment, localOnlyBytes);

  const skippedInstalledEntries = [];
  assert.deepEqual(runCheck({ ...f, skippedInstalledEntries }), []);
  assert.deepEqual(skippedInstalledEntries, [{
    type: 'skipped-installed-entry',
    mapping: 'claude-rules',
    destination: '${HOME}/.claude/rules',
    relative: '.env',
    reason: 'denied filename prefix',
  }]);
  assert.doesNotThrow(() => runInstall({ ...f, dryRun: true }));
  assert.equal(fs.readFileSync(installedEnvironment, 'utf8'), localOnlyBytes);

  fs.writeFileSync(path.join(installedRoot, '.env.local'), 'UNLISTED_VALUE=fixture\n');
  assert.ok(runCheck(f).some((finding) =>
    finding.type === 'unsafe-installed-entry'
      && finding.relative === '.env.local'
      && finding.reason === 'denied filename prefix'));
  fs.unlinkSync(path.join(installedRoot, '.env.local'));

  fs.writeFileSync(path.join(canonicalRoot, '.env'), 'CANONICAL_VALUE=forbidden\n');
  const canonicalFindings = validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest });
  assert.ok(canonicalFindings.some((finding) =>
    finding.type === 'source' && finding.message === 'Canonical source contains denied filename prefix: .env'));
});

test('Proves: the check CLI reports an installed-only skip without disclosing content and still exits green; Test type: executable-boundary liveness; Surface: scripts/control-plane.mjs check output; Authority: skippedInstalledEntries collector; Killer mutation: remove the CLI skipped-entry emission loop; Gated command: npm test', () => {
  const f = fixture();
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const canonicalRoot = path.join(repoRoot, 'docs');
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const sentinel = 'LOCAL_ONLY_VALUE_MUST_NOT_APPEAR';
  fs.cpSync(canonicalRoot, installedRoot, { recursive: true });
  fs.writeFileSync(path.join(installedRoot, '.env'), `${sentinel}=fixture\n`);
  f.manifest.mappings[0].source = 'docs';
  f.manifest.mappings[0].installedIgnore = ['.env'];
  const io = cliContext({ ...f, repoRoot });

  assert.equal(runControlPlaneCli(['check'], io.context), 0);
  assert.deepEqual(JSON.parse(io.stdout[0]), {
    type: 'skipped-installed-entry',
    mapping: 'claude-rules',
    destination: '${HOME}/.claude/rules',
    relative: '.env',
    reason: 'denied filename prefix',
  });
  assert.equal(io.stdout[1], 'control-plane check passed');
  assert.deepEqual(io.stderr, []);
  assert.doesNotMatch(io.stdout.join('\n'), new RegExp(sentinel, 'u'));
});

test('Proves: installed-only deny exceptions are exact denied tree paths, never globs or ordinary local-only bypasses; Test type: manifest boundary mutation; Surface: mapping.installedIgnore; Authority: exact installed inventory exception contract; Killer mutation: accept helper.md, traversal, glob syntax, or a file mapping; Gated command: npm test', () => {
  const cases = [
    { value: ['helper.md'], message: /must match a global deny rule/u },
    { value: ['../.env'], message: /Invalid installedIgnore path/u },
    { value: ['*.env'], message: /Invalid installedIgnore path/u },
  ];
  for (const { value, message } of cases) {
    const f = fixture();
    fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
    f.manifest.mappings[0].installedIgnore = value;
    assert.ok(validateManifest(f.manifest, f.repoRoot, f.roots).some((failure) => message.test(failure)));
  }

  const fileMapping = fixture();
  const canonicalFile = path.join(fileMapping.repoRoot, 'canonical', 'rule.md');
  fs.writeFileSync(canonicalFile, '# Canonical\n');
  fileMapping.manifest.mappings[0] = {
    ...fileMapping.manifest.mappings[0],
    source: 'canonical/rule.md',
    mode: 'file',
    installedIgnore: ['.env'],
  };
  assert.ok(validateManifest(fileMapping.manifest, fileMapping.repoRoot, fileMapping.roots)
    .some((failure) => /valid only for tree mappings/u.test(failure)));
});

test('Proves: default and adoption installs refuse unsafe installed entries before any mutation; Test type: no-write security mutation; Surface: ordinary installer preflight; Authority: managed-root deny boundary; Killer mutation: let ordinary or adoptExisting mode overwrite managed bytes while a denied file persists; Gated command: npm test', () => {
  for (const adoptExisting of [false, true]) {
    const f = fixture();
    const installedRoot = path.join(f.home, '.claude', 'rules');
    const installed = path.join(installedRoot, 'base.md');
    fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
    fs.writeFileSync(installed, '# Old\n');
    fs.writeFileSync(path.join(installedRoot, '.credentials.json'), 'SECRET_CONTENT_MUST_NOT_APPEAR');

    assert.throws(() => runInstall({ ...f, adoptExisting }), /Managed tree contains denied filename: \.credentials\.json/u);
    assert.equal(fs.readFileSync(installed, 'utf8'), '# Old\n');
    assert.equal(fs.existsSync(path.join(f.home, '.nuvoralink-control-plane', 'lock.json')), false);
  }
});

test('Proves: denied filename, prefix, extension, and segment rules prune directories before descendants are read and block every install mode; Test type: directory-boundary mutation; Surface: installed inventory traversal; Authority: manifest deny policy; Killer mutation: apply filename, prefix, or extension rules only to files; Gated command: npm test', () => {
  const hostileDirectories = [
    ['.credentials.json', 'denied filename'],
    ['.env.local', 'denied filename prefix'],
    ['private.key', 'denied extension'],
    ['logs', 'denied path segment'],
  ];
  for (const [relative, reason] of hostileDirectories) {
    const f = fixture();
    const installedRoot = path.join(f.home, '.claude', 'rules');
    const installed = path.join(installedRoot, 'base.md');
    const hostile = path.join(installedRoot, relative);
    fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
    fs.writeFileSync(installed, '# Old\n');
    const reviewed = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] });
    fs.mkdirSync(hostile);
    fs.writeFileSync(path.join(hostile, 'SECRET_DESCENDANT.md'), 'SECRET_DESCENDANT');

    const findings = runCheck(f);
    assert.ok(findings.some((finding) => finding.type === 'unsafe-installed-entry' && finding.relative === relative && finding.reason === reason));
    assert.equal(findings.some((finding) => String(finding.relative).includes('SECRET_DESCENDANT')), false);
    for (const options of [{}, { adoptExisting: true }, { mappingIds: ['claude-rules'], reconcileInstalled: new Map([['claude-rules', reviewed.sha256]]) }]) {
      assert.throws(() => runInstall({ ...f, ...options }), new RegExp(`Managed tree contains ${reason.replace('/', '\\/')}`, 'u'));
      assert.equal(fs.readFileSync(installed, 'utf8'), '# Old\n');
    }
  }
});

test('Proves: nested installed links are reported path-relatively, pruned, and never hide independent parity drift; Test type: link traversal mutation; Surface: check and install inventory; Authority: physical managed-tree boundary; Killer mutation: throw from check, traverse the link, or stop before reporting ordinary drift; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const outside = path.join(f.home, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'secret.md'), 'DO_NOT_READ');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(installedRoot, 'base.md'), '# Drift\n');
  fs.symlinkSync(outside, path.join(installedRoot, 'nested-link'), 'junction');

  const findings = runCheck(f);
  assert.ok(findings.some((finding) => finding.type === 'unsafe-installed-entry' && finding.relative === 'nested-link' && finding.reason === 'link/junction'));
  assert.ok(findings.some((finding) => finding.type === 'drift' && finding.relative === 'base.md'));
  assert.equal(findings.some((finding) => String(finding.relative).includes('secret.md')), false);
  let thrown;
  try { runInstall(f); } catch (error) { thrown = error; }
  assert.match(thrown?.message ?? '', /Managed tree contains link\/junction: nested-link/u);
  assert.doesNotMatch(thrown?.message ?? '', new RegExp(installedRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.equal(fs.readFileSync(path.join(installedRoot, 'base.md'), 'utf8'), '# Drift\n');
});

test('Proves: destination and approved-link capture resolution failures are findings scoped to one destination; Test type: resolution failure; Surface: runCheck destination loop; Authority: per-destination parity reporting; Killer mutation: resolve tokens or capture realpaths outside the per-destination error boundary; Gated command: npm test', () => {
  const unresolved = fixture();
  fs.writeFileSync(path.join(unresolved.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  unresolved.manifest.mappings[0].destinations = ['${MISSING}/rules'];
  assert.ok(runCheck(unresolved).some((finding) => finding.type === 'installed-path' && finding.destination === '${MISSING}/rules'));

  const missingCapture = fixture();
  const physical = path.join(missingCapture.home, '.claude', 'rules');
  const link = path.join(missingCapture.home, '.claude', 'rules-link');
  fs.writeFileSync(path.join(missingCapture.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(physical, 'base.md'), '# Canonical\n');
  fs.symlinkSync(physical, link, 'junction');
  missingCapture.manifest.mappings[0].destinations = ['${HOME}/.claude/rules-link'];
  missingCapture.manifest.mappings[0].captureFrom = '${HOME}/missing-capture';
  missingCapture.manifest.mappings[0].allowInstalledRootLink = true;
  assert.ok(runCheck(missingCapture).some((finding) => finding.type === 'installed-path' && finding.destination === '${HOME}/.claude/rules-link'));
});

test('Proves: a non-link destination does not depend on captureFrom resolution; Test type: lazy-resolution counterexample; Surface: runCheck destination loop; Authority: root-link validation boundary; Killer mutation: resolve captureFrom before checking rootIsLink; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Canonical\n');
  f.manifest.mappings[0].captureFrom = '${UNREGISTERED}/capture';

  const findings = runCheck(f);
  assert.equal(findings.some((finding) => finding.type === 'installed-path'), false);
});

test('Proves: installed destination type mismatches use only the destination template; Test type: disclosure mutation; Surface: runCheck installed inventory; Authority: portable inventory errors; Killer mutation: expose rootInput from the expected-tree failure; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.rmSync(installedRoot, { recursive: true });
  fs.writeFileSync(installedRoot, 'wrong node type');

  const findings = runCheck(f);
  assert.ok(findings.some((finding) => finding.type === 'installed-path'
    && finding.destination === '${HOME}/.claude/rules'
    && finding.message === 'Expected tree mapping inventory: ${HOME}/.claude/rules'));
  const serialized = JSON.stringify(findings);
  assert.doesNotMatch(serialized, new RegExp(f.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.doesNotMatch(serialized, new RegExp(f.repoRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('Proves: malformed canonical source resolution remains mapping-scoped and does not suppress unrelated drift; Test type: continuation mutation; Surface: runCheck mapping loop; Authority: per-mapping canonical resolution; Killer mutation: resolve source outside the mapping try; Gated command: npm test', () => {
  const f = fixture();
  const secondarySource = path.join(f.repoRoot, 'canonical', 'secondary');
  const secondaryInstalled = path.join(f.home, '.claude', 'secondary');
  fs.mkdirSync(secondarySource, { recursive: true });
  fs.mkdirSync(secondaryInstalled, { recursive: true });
  fs.writeFileSync(path.join(secondarySource, 'secondary.md'), '# Canonical\n');
  fs.writeFileSync(path.join(secondaryInstalled, 'secondary.md'), '# Drift\n');
  f.manifest.mappings[0].source = '../outside-repo';
  f.manifest.mappings.push({ ...structuredClone(f.manifest.mappings[0]), id: 'secondary-rules', source: 'canonical/secondary', captureFrom: '${HOME}/.claude/secondary', destinations: ['${HOME}/.claude/secondary'] });

  const findings = runCheck(f);
  assert.ok(findings.some((finding) => finding.type === 'manifest' && finding.mapping === 'claude-rules' && finding.message === 'Canonical source resolution failed'));
  assert.ok(findings.some((finding) => finding.type === 'drift' && finding.mapping === 'secondary-rules' && finding.relative === 'secondary.md'));
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(f.repoRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('Proves: a captured mapping with no destinations remains checkable through captureFrom rather than throwing; Test type: absent-list counterexample; Surface: runCheck mapping loop; Authority: captured ownership; Killer mutation: iterate mapping.destinations without the empty-array fallback or skip captureFrom inspection; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  f.manifest.mappings[0].ownership = 'captured';
  f.manifest.mappings[0].destinations = [];

  assert.doesNotThrow(() => runCheck(f));
});

test('Proves: digest refuses multiple physical destinations with a portable observed count; Test type: layout-precondition mutation; Surface: scripts/control-plane.mjs runControlPlaneCli digest; Authority: single-physical reconciliation contract; Killer mutation: omit the count or emit resolved physical destination paths; Gated command: npm test', () => {
  const f = fixture();
  const second = path.join(f.home, '.claude', 'rules-second');
  fs.mkdirSync(second, { recursive: true });
  f.manifest.mappings[0].destinations.push('${HOME}/.claude/rules-second');
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['digest', '--mapping', 'claude-rules'], io.context), 1);
  assert.deepEqual(io.stdout, []);
  assert.deepEqual(io.stderr, ['digest requires exactly one physical destination for claude-rules; found 2']);
  assert.doesNotMatch(io.stderr[0], new RegExp(f.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('Proves: digest and reconciliation share one pre-write layout classifier and reject duplicate physical aliases; Test type: layout authority mutation; Surface: installed destination layout; Authority: single physical reviewed tree; Killer mutation: classify only digest or deduplicate two declared physical aliases before counting; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const installed = path.join(installedRoot, 'base.md');
  const lock = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(installed, '# Reviewed old\n');
  f.roots.ALIAS = f.home;
  f.manifest.mappings[0].destinations.push('${ALIAS}/.claude/rules');
  const digest = computeInstalledTreeDigest({ root: installedRoot, manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;

  assert.throws(() => runDigest({ manifest: f.manifest, roots: f.roots, mappingIds: ['claude-rules'] }), /exactly one physical destination.*found 2/u);
  assert.throws(() => runInstall({
    ...f,
    mappingIds: ['claude-rules'],
    reconcileInstalled: new Map([['claude-rules', digest]]),
  }), /Installed-tree reconciliation requires exactly one physical destination for claude-rules; found 2/u);
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Reviewed old\n');
  assert.equal(fs.existsSync(lock), false);
});

test('Proves: a nested canonical link yields one relative source finding while checks continue through other mappings; Test type: source traversal mutation; Surface: runCheck mapping loop; Authority: canonical physical-tree boundary; Killer mutation: throw, disclose the canonical absolute path, duplicate the source finding, or stop before another mapping drift; Gated command: npm test', () => {
  const f = fixture();
  const outside = path.join(f.root, 'outside-source');
  const secondarySource = path.join(f.repoRoot, 'canonical', 'secondary');
  const secondaryInstalled = path.join(f.home, '.claude', 'secondary');
  fs.mkdirSync(outside);
  fs.mkdirSync(secondarySource, { recursive: true });
  fs.mkdirSync(secondaryInstalled, { recursive: true });
  fs.writeFileSync(path.join(outside, 'outside.md'), '# Outside\n');
  fs.symlinkSync(outside, path.join(f.repoRoot, 'canonical', 'rules', 'nested-link'), 'junction');
  fs.writeFileSync(path.join(secondarySource, 'secondary.md'), '# Canonical\n');
  fs.writeFileSync(path.join(secondaryInstalled, 'secondary.md'), '# Drift\n');
  f.manifest.mappings.push({ ...structuredClone(f.manifest.mappings[0]), id: 'secondary-rules', source: 'canonical/secondary', captureFrom: '${HOME}/.claude/secondary', destinations: ['${HOME}/.claude/secondary'] });

  const findings = runCheck(f);
  const sources = findings.filter((finding) => finding.type === 'source' && finding.mapping === 'claude-rules');
  assert.deepEqual(sources, [{ type: 'source', mapping: 'claude-rules', message: 'Canonical source contains link/junction: nested-link' }]);
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(f.repoRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  assert.ok(findings.some((finding) => finding.type === 'drift' && finding.mapping === 'secondary-rules' && finding.relative === 'secondary.md'));
  assert.throws(
    () => runCapture({ ...f, dryRun: true, mappingIds: ['claude-rules'] }),
    (error) => {
      assert.match(error.message, /Canonical source contains link\/junction: nested-link/u);
      assert.doesNotMatch(error.message, new RegExp(f.repoRoot.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
      return true;
    },
  );
});

test('Proves: a junction cannot approve itself when captureFrom and destination resolve to the same path; Test type: authority mutation; Surface: junction approval; Authority: independent physical capture root; Killer mutation: compare realpath of one lexical path to itself; Gated command: npm test', () => {
  const f = fixture();
  const installedRoot = path.join(f.home, '.claude', 'rules');
  const unrelatedRoot = path.join(f.root, 'unrelated-rules');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.mkdirSync(unrelatedRoot);
  fs.writeFileSync(path.join(unrelatedRoot, 'base.md'), '# Unrelated\n');
  fs.rmSync(installedRoot, { recursive: true });
  fs.symlinkSync(unrelatedRoot, installedRoot, 'junction');
  f.manifest.mappings[0].allowInstalledRootLink = true;

  assert.throws(() => runInstall(f), (error) => {
    assert.equal(error.message, 'Install refused unexpected installed link/junction: ${HOME}/.claude/rules');
    assert.doesNotMatch(error.message, new RegExp(f.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    return true;
  });
});

test('Proves: canonical mapping exclusions are intentionally unmanaged across validation and install; Test type: exclusion counterexample; Surface: canonical inventory; Authority: mapping.exclude; Killer mutation: reject mapping exclusion under rejectDenied; Gated command: npm test', () => {
  const f = fixture();
  const excluded = path.join(f.repoRoot, 'canonical', 'rules', 'excluded');
  fs.mkdirSync(excluded);
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(excluded, 'ignored.md'), '# Unmanaged\n');
  f.manifest.mappings[0].exclude = ['excluded'];

  assert.deepEqual(validateManifest(f.manifest, f.repoRoot, f.roots), []);
  runInstall(f);
  assert.equal(fs.existsSync(path.join(f.home, '.claude', 'rules', 'base.md')), true);
  assert.equal(fs.existsSync(path.join(f.home, '.claude', 'rules', 'excluded', 'ignored.md')), false);
});

test('Proves: install resolves captureFrom only when a destination is a link; Test type: feeder-laziness mutation; Surface: installer destination loop; Authority: junction approval feeder; Killer mutation: resolve captureFrom before rootIsLink; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  let captureReads = 0;
  f.manifest.mappings[0].captureFrom = '${CAPTURE}/rules';
  const roots = {
    HOME: f.home,
    get CAPTURE() {
      captureReads += 1;
      return path.join(f.root, 'capture');
    },
  };

  runInstall({ ...f, roots });
  assert.equal(captureReads, 1, 'validateManifest is the sole non-link captureFrom resolution');
});

test('Proves: digest treats an absent destinations list as zero physical destinations and refuses portably; Test type: absent-list mutation; Surface: installed-tree digest; Authority: counted physical-destination precondition; Killer mutation: iterate undefined destinations; Gated command: npm test', () => {
  const f = fixture();
  delete f.manifest.mappings[0].destinations;
  assert.throws(() => runDigest({ manifest: f.manifest, roots: f.roots, mappingIds: ['claude-rules'] }), /found 0/u);
});

test('Proves: dirty install and rollback refusals disclose only portable managed labels; Test type: disclosure mutation; Surface: install and rollback errors; Authority: tokenized destination identity; Killer mutation: interpolate target or lockPath; Gated command: npm test', () => {
  const dirtyInstall = fixture();
  fs.writeFileSync(path.join(dirtyInstall.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(path.join(dirtyInstall.home, '.claude', 'rules', 'base.md'), '# Local\n');
  assert.throws(() => runInstall(dirtyInstall), (error) => {
    assert.match(error.message, /Dirty managed target: claude-rules\/base\.md/u);
    assert.doesNotMatch(error.message, new RegExp(dirtyInstall.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    return true;
  });

  const dirtyRollback = fixture();
  const installed = path.join(dirtyRollback.home, '.claude', 'rules', 'base.md');
  fs.writeFileSync(path.join(dirtyRollback.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  const installedOperations = runInstall(dirtyRollback);
  fs.writeFileSync(installed, '# Changed after install\n');
  assert.throws(() => runRollback({ manifest: dirtyRollback.manifest, roots: dirtyRollback.roots, installId: installedOperations.installId }), (error) => {
    assert.equal(error.message, 'Rollback refused; installed target is dirty: ${HOME}/.claude/rules/base.md');
    assert.doesNotMatch(error.message, new RegExp(dirtyRollback.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    return true;
  });

  const missing = fixture();
  assert.throws(() => runRollback({ manifest: missing.manifest, roots: missing.roots }), (error) => {
    assert.equal(error.message, 'No install snapshots found for ${HOME}/.nuvoralink-control-plane/lock.json');
    assert.doesNotMatch(error.message, new RegExp(missing.home.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
    return true;
  });
});

test('Proves: the executable reconciliation install writes reviewed bytes and lock state; Test type: entrypoint write liveness; Surface: scripts/control-plane.mjs runControlPlaneCli; Authority: reviewed-tree CLI contract; Killer mutation: force dryRun or drop reconciliation at the executable boundary; Gated command: npm test', () => {
  const f = fixture();
  const installed = path.join(f.home, '.claude', 'rules', 'base.md');
  const lock = path.join(f.home, '.nuvoralink-control-plane', 'lock.json');
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  fs.writeFileSync(installed, '# Reviewed old\n');
  const digest = computeInstalledTreeDigest({ root: path.dirname(installed), manifest: f.manifest, mapping: f.manifest.mappings[0] }).sha256;
  const io = cliContext(f);

  assert.equal(runControlPlaneCli(['install', '--mapping', 'claude-rules', '--reconcile-installed', `claude-rules:${digest}`], io.context), 0);
  assert.equal(fs.readFileSync(installed, 'utf8'), '# Canonical\n');
  assert.equal(fs.existsSync(lock), true);
  assert.ok(io.stdout.some((line) => line === 'operations=1 dryRun=false'));
});
