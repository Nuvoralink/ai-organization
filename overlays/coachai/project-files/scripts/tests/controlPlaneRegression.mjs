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
});

test('killer mutation: active legacy design authority fails', () => {
  const root = organizationFixture(source);
  fs.appendFileSync(path.join(root, 'AGENTS.md'), '\nUse the approved Figma reference as authority.\n');
  assert.match(checkAgentControlPlane(root).errors.join('\n'), /Figma design authority/i);
});

test('killer mutation: malformed lifecycle authority schema fails', () => {
  const root = organizationFixture(source);
  fs.writeFileSync(path.join(root, '.ai-organization/schemas/task-evidence.v1.schema.json'), '{"type":"object"');
  assert.match(checkAgentControlPlane(root).errors.join('\n'), /invalid JSON authority/i);
});
