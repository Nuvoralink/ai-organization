import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  runCapture,
  runCheck,
  runInstall,
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
  fs.writeFileSync(path.join(f.home, '.claude', 'rules', 'unsafe.md'), 'token=ghp_abcdefghijklmnopqrstuvwxyz123456');
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
  f.manifest.mappings[0].destinations = ['C:/Users/example/.claude/rules', '${HOME}/.claude/rules', '${HOME}/.claude/rules'];
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

test('Proves: canonical validation does not require machine-specific roots; Test type: portability; Surface: CI; Authority: canonical repository; Killer mutation: remove all local root registrations', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), '# Portable\n');
  assert.deepEqual(validateCanonical({ repoRoot: f.repoRoot, manifest: f.manifest }), []);
});

test('Proves: registered path tokens render on install and still pass parity; Test type: portability; Surface: generated copy; Authority: local root registry; Killer mutation: leave a registered HOME token literal in installed output', () => {
  const f = fixture();
  fs.writeFileSync(path.join(f.repoRoot, 'canonical', 'rules', 'base.md'), 'Home: ${HOME}\n');
  runInstall({ ...f, dryRun: false });
  const installed = fs.readFileSync(path.join(f.home, '.claude', 'rules', 'base.md'), 'utf8');
  assert.equal(installed, `Home: ${f.home}\n`);
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
