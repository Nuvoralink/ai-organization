import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  runCapture,
  runCheck,
  runInstall,
  runRollback,
  validateCanonical,
  validateManifest
} from '../scripts/lib/control-plane.mjs';

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

test('Proves: capture and install are deterministic; Test type: mutation; Surface: portable control plane; Authority: manifest; Killer mutation: local-only file must fail check', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Base\r\n');
  const captured = runCapture({ ...f, dryRun: false });
  assert.equal(captured.length, 1);
  assert.deepEqual(runCheck(f), []);
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'local-only.md'), '# hidden drift\n');
  assert.ok(runCheck(f).some((problem) => problem.type === 'local-only'));
});
test('Proves: byte drift cannot hide; Test type: mutation; Surface: installed rule; Authority: canonical hash; Killer mutation: change installed content', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  runInstall({ ...f, dryRun: false });
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), '# Changed locally\n');
  assert.ok(runCheck(f).some((problem) => problem.type === 'drift'));
  assert.throws(() => runInstall({ ...f, dryRun: false }), /Dirty managed target/);
});

test('Proves: dry-run never writes; Test type: negative; Surface: installer; Authority: action plan; Killer mutation: missing destination remains missing', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Canonical\n');
  const target = path.join(f.home, '.claude', 'rules', 'base.md');
  const operations = runInstall({ ...f, dryRun: true });
  assert.equal(operations.length, 1);
  assert.equal(fs.existsSync(target), false);
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

test('Proves: raw absolute destinations and duplicate destinations cannot enter the manifest; Test type: schema mutation; Surface: manifest; Authority: tokenized roots; Killer mutation: use C drive path twice', () => {
  const f = fixture();
  f.manifest.mappings[0].destinations = [["C:", "Users", "example", ".claude", "rules"].join('/'), '${HOME}/.claude/rules', '${HOME}/.claude/rules'];
  const errors = validateManifest(f.manifest, f.repoRoot, f.roots);
  assert.ok(errors.some((message) => message.includes('Path must start with a registered token')));
  assert.ok(errors.some((message) => message.includes('Duplicate destination')));
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
});

test('Proves: tracked files outside mapped trees cannot hide secrets, machine paths, or app-source classes; Test type: repository-boundary mutation; Surface: canonical repository; Authority: tracked content scanner; Killer mutation: force-add unsafe docs and an unclassified source root; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Safe\n');
  fs.mkdirSync(path.join(f.repoRoot, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(f.repoRoot, 'application'), { recursive: true });
  const tokenShape = ['sk', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('-');
  const machinePath = ['C:', 'dev', 'private'].join('\\');
  fs.writeFileSync(path.join(f.repoRoot, 'docs', 'unsafe.md'), `${tokenShape}\n${machinePath}\n`);
  fs.writeFileSync(path.join(f.repoRoot, 'application', 'index.ts'), 'export const copiedAppSource = true;\n');
  assert.equal(spawnSync('git', ['init'], { cwd: f.repoRoot }).status, 0);
  assert.equal(spawnSync('git', ['add', '-A'], { cwd: f.repoRoot }).status, 0);
  const findings = validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest });
  assert.ok(findings.some((finding) => finding.type === 'tracked-secret-shaped-content' && finding.relative === 'docs/unsafe.md'));
  assert.ok(findings.some((finding) => finding.type === 'tracked-absolute-path' && finding.relative === 'docs/unsafe.md'));
  assert.ok(findings.some((finding) => finding.type === 'unclassified-tracked-path' && finding.relative === 'application/index.ts'));
});

test('Proves: capture rejects machine-specific paths before writes; Test type: portability mutation; Surface: capture; Authority: tokenized roots; Killer mutation: import a C drive path; Gated command: npm test', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'unsafe.md'), `Tool: ${['C:', 'dev', 'Some Tool'].join('\\')}\n`);
  assert.throws(() => runCapture({ ...f, dryRun: false }), /Machine-specific absolute path refused/u);
  assert.equal(fs.existsSync(path.join(f.repoRoot, 'canonical', 'rules', 'unsafe.md')), false);
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
  assert.ok(runCheck(f).some((finding) => finding.type === 'unclassified-local-only'));
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
