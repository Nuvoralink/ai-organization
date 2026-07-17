import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadOverlay, validateOverlay } from '../scripts/project-overlay.mjs';
import { runCheck, runInstall } from '../scripts/lib/control-plane.mjs';
import { validatePortableOverlayLock } from '../scripts/project-overlay.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fixture(project = 'auxara-dialer') {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `${project}-overlay-`));
  const root = path.join(base, 'project');
  const home = path.join(base, 'home');
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  const rootToken = project === 'coachai' ? 'PROJECT:coachai' : 'PROJECT:auxara-dialer';
  const roots = { [rootToken]: root, HOME: home };
  const { manifest } = loadOverlay(project, roots);
  return { root, roots, manifest };
}

test('Proves: ORG-OVERLAY-002; Test type: install/parity; Surface: project overlay; Authority: overlay manifest; Killer mutation: change or add a managed file; Gated command: npm test', () => {
  const { root, roots, manifest } = fixture();
  fs.writeFileSync(path.join(root, 'PRODUCT.md'), 'project owned\n');
  runInstall({ repoRoot, manifest, roots });
  assert.deepEqual(runCheck({ repoRoot, manifest, roots }), []);
  const runtimeLock = path.join(roots.HOME, '.nuvoralink-control-plane', 'project-locks', 'auxara-dialer', 'overlay-lock.json');
  assert.equal(fs.existsSync(runtimeLock), true);
  assert.equal(fs.readFileSync(runtimeLock, 'utf8').includes(path.resolve(root)), false);
  assert.equal(fs.existsSync(path.join(root, '.ai-organization', 'snapshots')), false);

  const managed = path.join(root, '.ai-organization', 'control-plane', 'project-profile.v1.json');
  fs.appendFileSync(managed, '\nchanged\n');
  assert.ok(runCheck({ repoRoot, manifest, roots }).some((finding) => finding.type === 'drift'));
  assert.throws(() => runInstall({ repoRoot, manifest, roots }), /Dirty managed target/u);
});

test('Proves: ORG-OVERLAY-003; Test type: ownership counterexample; Surface: project-owned files; Authority: overlay ownership; Killer mutation: treat PRODUCT.md as generated; Gated command: npm test', () => {
  const { root, roots, manifest } = fixture('coachai');
  fs.writeFileSync(path.join(root, 'PRODUCT.md'), 'project owned\n');
  runInstall({ repoRoot, manifest, roots });
  fs.writeFileSync(path.join(root, 'PRODUCT.md'), 'project changed independently\n');
  assert.deepEqual(runCheck({ repoRoot, manifest, roots }), []);
});

test('Proves: ORG-OVERLAY-004; Test type: registry mutation; Surface: overlay ownership; Authority: ownership.v1.json; Killer mutation: omit an installable mapping owner; Gated command: npm test', () => {
  assert.deepEqual(validateOverlay('auxara-dialer').map((failure) => failure.message ?? failure), []);
  assert.deepEqual(validateOverlay('coachai').map((failure) => failure.message ?? failure), []);
});

test('Proves: portable overlay locks can contain only normalized paths and SHA-256 integrity hashes without secret-shaped path/hash pairs on one line; Test type: secret-boundary mutation; Surface: project overlay lock; Authority: portable lock schema; Killer mutation: restore a path-keyed hash map or hide a generic API key in a lock entry; Gated command: npm test', () => {
  const valid = { version: 1, source: 'universal-private-orchestrator/overlays/coachai', files: [{ path: 'AGENTS.md', sha256: 'a'.repeat(64) }], json_sections: {} };
  assert.deepEqual(validatePortableOverlayLock(valid), []);
  const unsafe = structuredClone(valid);
  unsafe.files.push({ path: '../generic_api_key', sha256: 'not-a-sha256-secret-value' });
  const failures = validatePortableOverlayLock(unsafe).join('\n');
  assert.match(failures, /non-portable path/u);
  assert.match(failures, /non-SHA-256/u);
  assert.match(validatePortableOverlayLock({ ...valid, files: { 'AGENTS.md': 'a'.repeat(64) } }).join('\n'), /files must be an array/u);
});
