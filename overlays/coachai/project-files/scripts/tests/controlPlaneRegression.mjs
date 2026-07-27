/**
 * Proves: REQ-ORG-002
 * Test type: regression
 * Surface: organization roles, action authority, lifecycle hooks, design authority, and CI proof wiring
 * Authority: .ai-organization action, role, lifecycle, and proof registries
 * What this test proves about the product: the single-PM organization and human gates cannot silently weaken or acquire an unregistered agent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkAgentControlPlane } from '../check-agent-control-plane.mjs';
import { organizationFixture, writeJson } from './fixture-helpers.mjs';

const source = process.cwd();

test('clean organization authority passes', () => {
  assert.equal(checkAgentControlPlane(organizationFixture(source)).ok, true);
});

test('killer mutations: missing role and unknown installed agent fail', () => {
  const missing = organizationFixture(source);
  const rolesPath = path.join(missing, '.ai-organization/roles.json');
  const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
  roles.project_roles = roles.project_roles.filter((r) => r.name !== 'premise-and-architecture-challenger');
  writeJson(rolesPath, roles);
  assert.match(checkAgentControlPlane(missing).errors.join('\n'), /required role missing|unknown installed agent/i);

  const unknown = organizationFixture(source);
  fs.writeFileSync(path.join(unknown, '.claude/agents/shadow-pm.md'), '---\nname: shadow-pm\n---\n');
  assert.match(checkAgentControlPlane(unknown).errors.join('\n'), /unknown installed agent/i);

  const bodySpoof = organizationFixture(source);
  const reviewerFile = path.join(bodySpoof, '.claude/agents/adversarial-reviewer.md');
  const reviewerSource = fs.readFileSync(reviewerFile, 'utf8');
  fs.writeFileSync(reviewerFile, `${reviewerSource.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/u, '')}\nname: adversarial-reviewer\n`);
  assert.match(checkAgentControlPlane(bodySpoof).errors.join('\n'), /role name\/file mismatch/i);
});

test('killer mutations: overlapping authority and lifecycle hook weakening fail', () => {
  const authority = organizationFixture(source);
  const actionPath = path.join(authority, '.ai-organization/policies/action-authority.v1.json');
  const action = JSON.parse(fs.readFileSync(actionPath, 'utf8'));
  action.human_required.push(action.autonomous[0]);
  writeJson(actionPath, action);
  assert.match(checkAgentControlPlane(authority).errors.join('\n'), /multiple authorities/i);

  const hook = organizationFixture(source);
  const settingsPath = path.join(hook, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  delete settings.hooks.TaskCompleted;
  writeJson(settingsPath, settings);
  assert.match(checkAgentControlPlane(hook).errors.join('\n'), /TaskCompleted/i);

  const relativeHook = organizationFixture(source);
  const relativeSettingsPath = path.join(relativeHook, '.claude/settings.json');
  const relativeSettings = JSON.parse(fs.readFileSync(relativeSettingsPath, 'utf8'));
  relativeSettings.hooks.SessionEnd[0].hooks[0] = {
    type: 'command',
    command: 'node scripts/claude-lifecycle-hook.mjs',
    timeout: relativeSettings.hooks.SessionEnd[0].hooks[0].timeout,
  };
  writeJson(relativeSettingsPath, relativeSettings);
  assert.match(checkAgentControlPlane(relativeHook).errors.join('\n'), /rooted exec-form lifecycle hook/iu);
});

test('killer mutation: active legacy design authority fails', () => {
  const root = organizationFixture(source);
  fs.appendFileSync(path.join(root, 'AGENTS.md'), '\nUse the approved Figma reference as authority.\n');
  assert.match(checkAgentControlPlane(root).errors.join('\n'), /Figma design authority/i);
});

test('killer mutation: malformed lifecycle authority schema fails', () => {
  const root = organizationFixture(source);
  fs.writeFileSync(path.join(root, '.ai-organization/schemas/task-evidence.v2.schema.json'), '{"type":"object"');
  assert.match(checkAgentControlPlane(root).errors.join('\n'), /invalid JSON authority/i);
});

test('killer mutations: missing fleet-parity gate, aggregate bypass, and proof-receipt weakening all fail', () => {
  const missingGate = organizationFixture(source);
  fs.rmSync(path.join(missingGate, 'scripts/check-fleet-parity.mjs'));
  assert.match(checkAgentControlPlane(missingGate).errors.join('\n'), /required control-plane artifact missing: scripts\/check-fleet-parity\.mjs/u);

  const aggregateBypass = organizationFixture(source);
  const packagePath = path.join(aggregateBypass, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.scripts['gate:organization'] = packageJson.scripts['gate:organization']
    .replace(' && npm run gate:fleet-parity', '');
  writeJson(packagePath, packageJson);
  assert.match(checkAgentControlPlane(aggregateBypass).errors.join('\n'), /gate:organization must include gate:fleet-parity/u);

  const receiptWeakening = organizationFixture(source);
  const proofPath = path.join(receiptWeakening, '.ai-organization/proof-profiles.json');
  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
  const organizationGate = proof.profiles
    .find((profile) => profile.id === 'organization-control')
    .assurance.commands
    .find((command) => command.id === 'organization-gates');
  organizationGate.parser.required_patterns = organizationGate.parser.required_patterns
    .filter((marker) => marker !== 'fleet-parity: PASS');
  writeJson(proofPath, proof);
  assert.match(checkAgentControlPlane(receiptWeakening).errors.join('\n'), /aggregate receipt marker: fleet-parity: PASS/u);
});

test('killer mutations: invalid assurance, missing reviewer provider, and timeout drift fail closure', () => {
  const invalidProvider = organizationFixture(source);
  const proofPath = path.join(invalidProvider, '.ai-organization/proof-profiles.json');
  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
  proof.profiles.find((profile) => profile.id === 'organization-control').assurance.commands = [];
  writeJson(proofPath, proof);
  assert.match(checkAgentControlPlane(invalidProvider).errors.join('\n'), /invalid assurance provider/u);

  const missingReviewer = organizationFixture(source);
  const rolesPath = path.join(missingReviewer, '.ai-organization/roles.json');
  const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
  roles.project_roles = roles.project_roles.filter((role) => role.name !== 'adversarial-reviewer');
  writeJson(rolesPath, roles);
  assert.match(checkAgentControlPlane(missingReviewer).errors.join('\n'), /lacks registered role provider/u);

  const timeoutDrift = organizationFixture(source);
  const settingsPath = path.join(timeoutDrift, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  settings.hooks.TaskCompleted[0].hooks[0].timeout -= 1;
  writeJson(settingsPath, settings);
  assert.match(checkAgentControlPlane(timeoutDrift).errors.join('\n'), /exactly match/u);

  const invalidBranch = organizationFixture(source);
  const invalidBranchProofPath = path.join(invalidBranch, '.ai-organization/proof-profiles.json');
  const invalidBranchProof = JSON.parse(fs.readFileSync(invalidBranchProofPath, 'utf8'));
  invalidBranchProof.integration_branch = '!!!';
  writeJson(invalidBranchProofPath, invalidBranchProof);
  assert.match(checkAgentControlPlane(invalidBranch).errors.join('\n'), /explicit safe Git branch name/u);

  const reviewerAsImplementer = organizationFixture(source);
  const reviewerProofPath = path.join(reviewerAsImplementer, '.ai-organization/proof-profiles.json');
  const reviewerProof = JSON.parse(fs.readFileSync(reviewerProofPath, 'utf8'));
  reviewerProof.lifecycle_roles_by_completion_mode.implementation = ['adversarial-reviewer'];
  writeJson(reviewerProofPath, reviewerProof);
  assert.match(checkAgentControlPlane(reviewerAsImplementer).errors.join('\n'), /not an implementation-capable provider/u);
});
