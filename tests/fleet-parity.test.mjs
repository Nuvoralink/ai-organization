/**
 * Proves: ORG-FLEET-PARITY-001
 * Test type: gate meta-regression
 * Surface: universal plus project effective fleet, project agent charters, and fleet projection
 * Authority: registries/agent-roles.v1.json plus agent-roles.project.v1.json
 * What this test proves about the product: a project cannot silently drift among its effective roles, installed agent files, and executable projection.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalGate = fs.readFileSync(path.join(repoRoot, 'scripts', 'check-fleet-parity.mjs'), 'utf8');
const canonicalMergeHelper = fs.readFileSync(
  path.join(repoRoot, 'core', 'roles', 'agent-role-registry.mjs'),
  'utf8',
);

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function role(id, mode = 'review_read_only') {
  return {
    id,
    purpose: `Exercise the ${id} fleet-parity contract without inventing another authority.`,
    trigger: ['fleet parity fixture'],
    mode,
    strength: mode === 'implement' ? 'implementation' : 'strongest_available',
    vendor_preference: 'either',
    incompatible_with: ['implementer-for-same-slice'],
    required_outputs: ['fleet parity evidence'],
  };
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-parity-'));
  const gateFile = path.join(root, 'scripts', 'check-fleet-parity.mjs');
  const helperFile = path.join(
    root,
    '.ai-organization',
    'runtime',
    'core',
    'roles',
    'agent-role-registry.mjs',
  );
  fs.mkdirSync(path.dirname(gateFile), { recursive: true });
  fs.mkdirSync(path.dirname(helperFile), { recursive: true });
  fs.writeFileSync(gateFile, canonicalGate);
  fs.writeFileSync(helperFile, canonicalMergeHelper);

  const universal = {
    $schema: '../schemas/agent-role-registry.v1.schema.json',
    version: '1.0.0',
    roles: [
      role('orchestrator', 'orchestrate'),
      role('codex-backend-implementer', 'implement'),
      role('universal-reviewer'),
    ],
  };
  const extension = {
    $schema: 'https://nuvoralink.internal/schemas/agent-role-project-extension.v1.schema.json',
    version: '1.0.0',
    roles: [role('project-auditor')],
  };
  writeJson(
    path.join(root, '.ai-organization', 'registries', 'agent-roles.v1.json'),
    universal,
  );
  writeJson(
    path.join(root, '.ai-organization', 'registries', 'agent-roles.project.v1.json'),
    extension,
  );
  writeJson(path.join(root, '.ai-organization', 'roles.json'), {
    version: 1,
    dispatch_authority: 'orchestrator',
    global_roles: universal.roles.map((entry) => ({ name: entry.id })),
    project_roles: extension.roles.map((entry) => ({ name: entry.id })),
  });
  fs.mkdirSync(path.join(root, '.claude', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude', 'agents', 'universal-reviewer.md'), '# Universal reviewer\n');
  fs.writeFileSync(path.join(root, '.claude', 'agents', 'project-auditor.md'), '# Project auditor\n');
  return { root, gateFile, universal, extension };
}

function runGate(root) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'check-fleet-parity.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}

test('clean effective fleet passes while universal orchestrator and implementer modes need no project agent file', () => {
  const { root } = fixture();
  const result = runGate(root);
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /4 effective roles, 2 project agent files/u);
});

test('missing registry row and an extra project agent file both fail closed and name the orphan', () => {
  const missingRow = fixture();
  missingRow.extension.roles = [];
  writeJson(
    path.join(missingRow.root, '.ai-organization', 'registries', 'agent-roles.project.v1.json'),
    missingRow.extension,
  );
  const missingResult = runGate(missingRow.root);
  assert.equal(missingResult.status, 1);
  assert.match(output(missingResult), /agent file has no effective-role row: .*project-auditor\.md/u);

  const extraFile = fixture();
  fs.writeFileSync(path.join(extraFile.root, '.claude', 'agents', 'shadow-auditor.md'), '# Shadow\n');
  const extraResult = runGate(extraFile.root);
  assert.equal(extraResult.status, 1);
  assert.match(output(extraResult), /agent file has no effective-role row: .*shadow-auditor\.md/u);
});

test('every effective project role needs an agent file and a universal reviewer needs either a file or a named extension exception', () => {
  const missingProject = fixture();
  fs.rmSync(path.join(missingProject.root, '.claude', 'agents', 'project-auditor.md'));
  const missingProjectResult = runGate(missingProject.root);
  assert.equal(missingProjectResult.status, 1);
  assert.match(output(missingProjectResult), /effective project role has no agent file: project-auditor/u);

  const inheritedUniversal = fixture();
  fs.rmSync(path.join(inheritedUniversal.root, '.claude', 'agents', 'universal-reviewer.md'));
  const missingUniversalResult = runGate(inheritedUniversal.root);
  assert.equal(missingUniversalResult.status, 1);
  assert.match(output(missingUniversalResult), /no agent file or explicit project exception: universal-reviewer/u);

  inheritedUniversal.extension.agent_file_exceptions = [{
    role_id: 'universal-reviewer',
    source: 'inherited_global_agent',
    reason: 'The universal reviewer is installed by the global agent layer.',
  }];
  writeJson(
    path.join(inheritedUniversal.root, '.ai-organization', 'registries', 'agent-roles.project.v1.json'),
    inheritedUniversal.extension,
  );
  const exceptionResult = runGate(inheritedUniversal.root);
  assert.equal(exceptionResult.status, 0, output(exceptionResult));
});

test('agents.json and roles.json must agree when both projections exist', () => {
  const { root } = fixture();
  writeJson(path.join(root, '.ai-organization', 'agents.json'), {
    schemaVersion: 1,
    orchestrator: { id: 'orchestrator' },
    agents: [
      { id: 'codex-backend-implementer' },
      { id: 'universal-reviewer' },
    ],
  });
  const result = runGate(root);
  assert.equal(result.status, 1);
  assert.match(output(result), /roles\.json lists role absent from .*agents\.json: project-auditor/u);
});

test('killer mutation: dropping effectiveRoles and using only universal roles turns the project-role fixture red', () => {
  const { root, gateFile } = fixture();
  const mutated = canonicalGate.replace(
    'roles = effectiveRoles(universal, projectExtension);',
    'roles = universal.roles;',
  );
  assert.notEqual(mutated, canonicalGate, 'the effective-merge mutation must modify the gate source');
  fs.writeFileSync(gateFile, mutated);
  const result = runGate(root);
  assert.equal(result.status, 1);
  assert.match(output(result), /agent file has no effective-role row: .*project-auditor\.md/u);
  assert.match(output(result), /roles\.json lists role absent from effective roles: project-auditor/u);
});
