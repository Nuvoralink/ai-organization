/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: coordination/freeze.mjs authority-domain manifests and Git-common-dir freeze store
 * Authority: authority-domains.v1.json bundle membership + lifecycle writeJson atomic publication
 *
 * What this test proves about the product:
 * - An authority domain freezes as a canonical sha256 manifest that can satisfy the v3
 *   contract_digest_active edge and remains valid only while its declared bundle is unchanged.
 * - Freeze lifecycle state is explicit, corrupt persistence fails loudly, and diagnostics name the
 *   changed, missing, or added member without treating unrelated repository changes as drift.
 *
 * Negative path covered:
 * - Member content and membership drift, an unknown bundle, an implicit digest-changing re-freeze,
 *   retired/proposed state, and a corrupt store all fail closed without touching the live tree.
 *
 * Killer mutations:
 * - Compare memberCount instead of manifestDigest -> content drift stays green and this suite turns red.
 * - Exclude members from canonical digest input -> membership drift stays green and this suite turns red.
 * - Change or remove the sha256: prefix -> v3 contract_digest_active parity turns red.
 * - Scan the live worktree or include out-of-bundle files -> isolation/scoped-validity assertions turn red.
 * - Swallow corrupt JSON or default it to an empty store -> corrupt-store assertions turn red.
 * Gated command: npm run gates:all
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { validateRequires } from './dependencyGraph.mjs';
import {
  FREEZE_STATES,
  computeContractManifest,
  freezeBundle,
  freezeStorePath,
  isFreezeValid,
  readFreezeStore,
  retireBundle,
} from './freeze.mjs';

const FIXTURE_FILES = Object.freeze({
  'README.md': '# fixture\n',
  'backend/src/routes/calls.ts': 'export const callsRoute = "/calls";\n',
  'backend/src/routes/health.ts': 'export const healthRoute = "/health";\n',
  'frontend/src/lib/api.ts': 'export const api = { calls: "/calls" };\n',
  'shared/src/contracts/endpoints.ts': 'export const endpoints = { calls: "/calls" };\n',
  'shared/src/taxonomy/permissions.ts': 'export const permissions = ["calls.read"];\n',
  'shared/src/taxonomy/roles.ts': 'export const roles = ["booker"];\n',
});

const AUTHORITY_REGISTRY = Object.freeze({
  version: 1,
  domains: {
    endpoints: {
      owns: [
        'shared/src/contracts/endpoints.ts',
        'backend/src/routes/**',
        'frontend/src/lib/api.ts',
      ],
      note: 'Endpoint declarations, handlers, and client adapter evolve together.',
    },
    routing: {
      owns: ['backend/src/routes/**', 'frontend/src/lib/api.ts'],
      note: 'Route implementations and their client adapter are one semantic authority.',
    },
    roles: {
      owns: ['shared/src/taxonomy/roles.ts', 'shared/src/taxonomy/permissions.ts'],
      note: 'Roles and permissions evolve together.',
    },
  },
});

function writeFixtureFile(root, relativePath, contents) {
  const file = path.join(root, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function writeFixtureJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-contract-freeze-'));
  for (const [relativePath, contents] of Object.entries(FIXTURE_FILES)) {
    writeFixtureFile(root, relativePath, contents);
  }
  writeFixtureJson(
    path.join(root, '.ai-organization', 'policies', 'authority-domains.v1.json'),
    AUTHORITY_REGISTRY,
  );
  execFileSync('git', ['init', '-q'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('canonical manifest includes declared content, authorities, toolchain, extras, and v3 digest parity', (t) => {
  const repoRoot = createFixture(t);
  const { manifest, manifestDigest } = computeContractManifest({
    repoRoot,
    bundleId: 'endpoints',
  });

  assert.deepEqual(FREEZE_STATES, ['proposed', 'active', 'retired']);
  assert.equal(manifest.manifestVersion, 1);
  assert.equal(manifest.bundleId, 'endpoints');
  assert.equal(manifest.memberCount, manifest.members.length);
  assert.deepEqual(
    manifest.members.map((member) => member.path),
    [
      'backend/src/routes/calls.ts',
      'backend/src/routes/health.ts',
      'frontend/src/lib/api.ts',
      'shared/src/contracts/endpoints.ts',
    ],
  );
  assert.deepEqual(manifest.declaredAuthorities, ['endpoints', 'routing']);
  assert.deepEqual(manifest.toolchain, { node: process.version });
  for (const member of manifest.members) {
    assert.equal(typeof member.bytes, 'number');
    assert.match(member.sha256, /^[0-9a-f]{64}$/u);
  }
  assert.match(manifestDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.deepEqual(
    validateRequires([
      {
        task_id: 'ENDPOINTS-PRODUCER',
        edge_type: 'contract_digest_active',
        bound_value: manifestDigest,
      },
    ]),
    [],
    'Killer mutation: digest format drift must be rejected by the real v3 edge validator',
  );

  const withExtra = computeContractManifest({
    repoRoot,
    bundleId: 'endpoints',
    extraMembers: ['shared\\src\\taxonomy\\roles.ts', 'shared/src/future-contract.ts'],
  }).manifest;
  assert.ok(withExtra.members.some((member) => member.path === 'shared/src/taxonomy/roles.ts'));
  assert.deepEqual(
    withExtra.members.find((member) => member.path === 'shared/src/future-contract.ts'),
    { path: 'shared/src/future-contract.ts', missing: true },
  );
  assert.deepEqual(withExtra.declaredAuthorities, ['endpoints', 'roles', 'routing']);
});

test('freeze is valid, content drift names the member, and digest-changing re-freeze is explicit', (t) => {
  const repoRoot = createFixture(t);
  const first = freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' });
  assert.equal(first.changed, true);
  assert.equal(first.entry.state, 'active');

  const storeAfterFirstFreeze = readFreezeStore({ repoRoot });
  const frozenAt = storeAfterFirstFreeze.frozen.endpoints.frozenAt;
  assert.equal(storeAfterFirstFreeze.frozen.endpoints.manifest.bundleId, 'endpoints');
  assert.ok(
    freezeStorePath(repoRoot).startsWith(repoRoot),
    'The disposable fixture must own the assurance store; the live worktree is never a fixture',
  );

  const repeated = freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' });
  assert.equal(repeated.changed, false);
  assert.equal(readFreezeStore({ repoRoot }).frozen.endpoints.frozenAt, frozenAt);
  assert.deepEqual(isFreezeValid({ repoRoot, bundleId: 'endpoints' }).drift, []);
  assert.equal(isFreezeValid({ repoRoot, bundleId: 'endpoints' }).valid, true);

  writeFixtureFile(
    repoRoot,
    'backend/src/routes/calls.ts',
    'export const callsRoute = "/calls-v2";\n',
  );
  const invalid = isFreezeValid({ repoRoot, bundleId: 'endpoints' });
  assert.equal(
    invalid.valid,
    false,
    'Killer mutation: comparing only memberCount cannot detect this same-membership content drift',
  );
  assert.deepEqual(invalid.drift, ['backend/src/routes/calls.ts']);
  assert.throws(
    () => freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' }),
    /explicit re-freeze/u,
  );

  const replacement = freezeBundle({
    repoRoot,
    bundleId: 'endpoints',
    owner: 'slice-6',
    refreeze: true,
  });
  assert.equal(replacement.entry.state, 'active');
  assert.equal(replacement.entry.supersedes, first.entry.manifestDigest);
  assert.equal(isFreezeValid({ repoRoot, bundleId: 'endpoints' }).valid, true);
});

test('bundle membership removal invalidates the freeze and names the removed member', (t) => {
  const repoRoot = createFixture(t);
  freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' });

  fs.rmSync(path.join(repoRoot, 'backend', 'src', 'routes', 'health.ts'));
  const result = isFreezeValid({ repoRoot, bundleId: 'endpoints' });

  assert.equal(
    result.valid,
    false,
    'Killer mutation: excluding the membership set from the digest must leave this case green',
  );
  assert.deepEqual(result.drift, ['backend/src/routes/health.ts']);
});

test('an out-of-bundle file change leaves the active freeze valid', (t) => {
  const repoRoot = createFixture(t);
  freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' });

  writeFixtureFile(repoRoot, 'README.md', '# unrelated change\n');
  const result = isFreezeValid({ repoRoot, bundleId: 'endpoints' });

  assert.equal(
    result.valid,
    true,
    'Killer mutation: hashing the whole repository instead of the declared bundle must fail here',
  );
  assert.deepEqual(result.drift, []);
});

test('proposed and retired bundles are explicitly not active', (t) => {
  const repoRoot = createFixture(t);
  freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' });

  const storeFile = freezeStorePath(repoRoot);
  const proposedStore = readFreezeStore({ repoRoot });
  proposedStore.frozen.endpoints.state = 'proposed';
  writeFixtureJson(storeFile, proposedStore);
  assert.deepEqual(isFreezeValid({ repoRoot, bundleId: 'endpoints' }), {
    valid: null,
    reason: 'proposed',
    state: 'proposed',
    storedDigest: proposedStore.frozen.endpoints.manifestDigest,
  });

  const retired = retireBundle({ repoRoot, bundleId: 'endpoints', owner: 'orchestrator' });
  assert.equal(retired.changed, true);
  assert.equal(retired.entry.state, 'retired');
  assert.equal(typeof retired.entry.retiredAt, 'string');
  assert.deepEqual(isFreezeValid({ repoRoot, bundleId: 'endpoints' }), {
    valid: null,
    reason: 'retired',
    state: 'retired',
    storedDigest: retired.entry.manifestDigest,
  });
});

test('a corrupt freeze store fails loudly and no operation overwrites it', (t) => {
  const repoRoot = createFixture(t);
  freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' });
  const storeFile = freezeStorePath(repoRoot);
  const corruptBody = '{"version":1,"frozen":';
  fs.writeFileSync(storeFile, corruptBody);

  assert.throws(() => readFreezeStore({ repoRoot }), /frozen-contracts\.json.*corrupt/u);
  assert.throws(
    () => freezeBundle({ repoRoot, bundleId: 'endpoints', owner: 'slice-6' }),
    /frozen-contracts\.json.*corrupt/u,
  );
  assert.equal(
    fs.readFileSync(storeFile, 'utf8'),
    corruptBody,
    'Killer mutation: defaulting corrupt JSON to an empty store would overwrite this evidence',
  );
});

test('unknown bundle ids fail closed through the authority-domain registry', (t) => {
  const repoRoot = createFixture(t);
  assert.throws(
    () => computeContractManifest({ repoRoot, bundleId: 'unknown-bundle' }),
    /Unknown contract bundle "unknown-bundle"/u,
  );
});
