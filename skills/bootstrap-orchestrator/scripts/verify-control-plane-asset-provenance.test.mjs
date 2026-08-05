/**
 * Proves: BOOTSTRAP-ASSET-PROVENANCE-001
 * Test type: unit and killer mutation
 * Surface: bootstrap control-plane asset manifest
 * Authority: bootstrap-orchestrator Step 2 canonical asset installation
 * What this test proves about the product: an installed canonical byte can be reproduced from the exact commit checked out at the explicitly supplied canonical root while detached HEAD and unrelated working-tree dirtiness remain allowed.
 * Killer mutation: hash a dirty managed source, use a stale checkout, or substitute a tree object while retaining a plausible manifest and this test must turn red.
 * Gated command: npm test
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateControlPlaneAssetProvenance } from './verify-control-plane-asset-provenance.mjs';

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'bootstrap-asset-provenance-'));
  git(root, ['init']);
  git(root, ['config', 'user.email', 'bootstrap@example.test']);
  git(root, ['config', 'user.name', 'Bootstrap Test']);
  const source = 'core/authority.mjs';
  const committed = 'export const authority = 1;\n';
  writeFileSync(path.join(root, 'authority.tmp'), 'unrelated\n');
  const sourcePath = path.join(root, ...source.split('/'));
  mkdirSync(path.dirname(sourcePath), { recursive: true });
  writeFileSync(sourcePath, committed);
  git(root, ['add', source]);
  git(root, ['commit', '-m', 'seed authority']);
  const commit = git(root, ['rev-parse', 'HEAD']);
  return {
    root,
    source,
    sourcePath,
    committed,
    manifest: {
      canonical_commit: commit,
      assets: [{ source, target: '.ai-organization/runtime/core/authority.mjs', sha256: digest(committed) }],
    },
  };
}

test('accepts exact committed asset bytes despite unrelated working-tree dirtiness', () => {
  const value = fixture();
  writeFileSync(path.join(value.root, 'unrelated.txt'), 'dirty but outside the manifest\n');
  assert.deepEqual(
    validateControlPlaneAssetProvenance({ canonicalRoot: value.root, manifest: value.manifest }),
    [],
  );
});

test('accepts the exact manifest commit from a detached canonical checkout', () => {
  const value = fixture();
  git(value.root, ['checkout', '--detach', value.manifest.canonical_commit]);
  assert.deepEqual(
    validateControlPlaneAssetProvenance({ canonicalRoot: value.root, manifest: value.manifest }),
    [],
  );
});

test('rejects a dirty managed asset hash attributed to the older commit', () => {
  const value = fixture();
  const dirty = 'export const authority = 2;\n';
  writeFileSync(value.sourcePath, dirty);
  value.manifest.assets[0].sha256 = digest(dirty);
  assert.match(
    validateControlPlaneAssetProvenance({
      canonicalRoot: value.root,
      manifest: value.manifest,
    }).join('\n'),
    /not reproducible from canonical_commit/u,
  );
});

test('rejects a stale canonical checkout even when the manifest commit object still exists', () => {
  const value = fixture();
  writeFileSync(path.join(value.root, 'unrelated.txt'), 'new checked-out commit\n');
  git(value.root, ['add', 'unrelated.txt']);
  git(value.root, ['commit', '-m', 'advance canonical checkout']);
  assert.match(
    validateControlPlaneAssetProvenance({
      canonicalRoot: value.root,
      manifest: value.manifest,
    }).join('\n'),
    /checkout HEAD does not equal manifest canonical_commit/u,
  );
});

test('rejects a tree object that git show could otherwise use as a source tree', () => {
  const value = fixture();
  value.manifest.canonical_commit = git(value.root, ['rev-parse', 'HEAD^{tree}']);
  assert.match(
    validateControlPlaneAssetProvenance({
      canonicalRoot: value.root,
      manifest: value.manifest,
    }).join('\n'),
    /does not resolve to a commit object/u,
  );
});
