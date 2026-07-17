import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bootstrap = path.join(root, 'skills', 'bootstrap-orchestrator');
const read = (relative) => fs.readFileSync(path.join(bootstrap, relative), 'utf8');

function actionAuthorityErrors(policy) {
  const errors = [];
  for (const action of ['create_branch_or_worktree', 'commit_in_scope_changes', 'push_branch', 'open_or_update_pull_request']) {
    if (!policy.autonomous.includes(action)) errors.push(`missing autonomous ${action}`);
  }
  if (!policy.conditional.merge_pull_request.all.includes('no_deploy_or_production_effect')) errors.push('merge lacks production boundary');
  if (policy.conditional.merge_pull_request.on_uncertainty !== 'human_required') errors.push('merge does not fail closed');
  if (!policy.human_required.includes('merge_that_deploys_or_mutates_production')) errors.push('production merge not human gated');
  return errors;
}

test('Proves: ORG-AUTH-001; Test type: mutation; Surface: action-authority template; Authority: policies/action-authority.v1.json; Killer mutation: remove autonomous push and no-production merge condition; Gated command: npm test', () => {
  const policy = JSON.parse(fs.readFileSync(path.join(root, 'policies', 'action-authority.v1.json'), 'utf8'));
  assert.deepEqual(actionAuthorityErrors(policy), []);
  const mutated = structuredClone(policy);
  mutated.autonomous = mutated.autonomous.filter((value) => value !== 'push_branch');
  mutated.conditional.merge_pull_request.all = mutated.conditional.merge_pull_request.all.filter((value) => value !== 'no_deploy_or_production_effect');
  assert.deepEqual(actionAuthorityErrors(mutated), ['missing autonomous push_branch', 'merge lacks production boundary']);
});

test('Proves: ORG-AUTH-004; Test type: authority-retirement mutation; Surface: bootstrap and project gates; Authority: policies/action-authority.v1.json; Killer mutation: restore a legacy authority path or hardcoded runtime action-list constant; Gated command: npm test', () => {
  const files = [
    'templates/gates/check-agent-control-plane.mjs.template',
    path.join(root, 'overlays/auxara-dialer/project-files/scripts/check-agent-control-plane.mjs'),
    path.join(root, 'overlays/coachai/project-files/scripts/check-agent-control-plane.mjs')
  ];
  for (const file of files) {
    const source = path.isAbsolute(file) ? fs.readFileSync(file, 'utf8') : read(file);
    assert.doesNotMatch(source, /docs\/agent-prompts\/action-authority\.json|\.ai-organization\/action-authority\.json|AGENT_ACTIONS|HUMAN_ACTIONS|MERGE_CONDITIONS|expectedAutonomous/u);
    assert.match(source, /validateActionPolicySemantics/u);
  }
});

test('Proves: ORG-PLAN-001; Test type: mutation; Surface: decision-log template; Authority: decision-sprint linkage schema; Killer mutation: restore the obsolete five-column header; Gated command: npm test', () => {
  const source = read('templates/docs/decision-log.md.template');
  const validates = (text) => text.includes('| ID | Title | Area | Phase | Sprint | Status | Notes |');
  assert.equal(validates(source), true);
  assert.equal(validates(source.replace('| ID | Title | Area | Phase | Sprint | Status | Notes |', '| ID | Decision | Basis | Date | Reversal trigger |')), false);
});

test('Proves: ORG-TEST-001; Test type: mutation; Surface: test-intent rule and gate templates; Authority: test-intent doctrine; Killer mutation: remove Killer mutation or Gated command enforcement; Gated command: npm test', () => {
  const rule = read('templates/rules/test-intent.template.md');
  const gate = read('templates/gates/check-test-intent.mjs.template');
  const validates = (ruleText, gateText) => ruleText.includes('Killer mutation:')
    && ruleText.includes('Gated command:')
    && gateText.includes("extractLineValue(h, 'Killer mutation')")
    && gateText.includes("extractLineValue(h, 'Gated command')");
  assert.equal(validates(rule, gate), true);
  assert.equal(validates(rule, gate.replace("if (!extractLineValue(h, 'Killer mutation'))", "if (false)")), false);
});

test('Proves: ORG-FLEET-001; Test type: mutation; Surface: bootstrap roster; Authority: agent-role registry; Killer mutation: omit either kickoff or premise challenger; Gated command: npm test', () => {
  const skill = read('SKILL.md');
  const claude = read('templates/CLAUDE.md.template');
  const agents = read('templates/AGENTS.md.template');
  const validates = (text) => text.includes('premise-and-architecture') && text.includes('sprint-kickoff');
  for (const source of [skill, claude, agents]) assert.equal(validates(source), true);
  assert.equal(validates(skill.replaceAll('sprint-kickoff', 'kickoff-removed')), false);
});

test('Proves: ORG-OVERLAY-001; Test type: mutation; Surface: existing-project bootstrap; Authority: overlay ownership manifest; Killer mutation: permit copy-all or overwrite a dirty managed target; Gated command: npm test', () => {
  const skill = fs.readFileSync(path.join(root, 'skills', 'bootstrap-orchestrator', 'SKILL.md'), 'utf8');
  assert.match(skill, /Existing-project overlay mode/u);
  assert.match(skill, /refuses dirty managed targets/u);
  assert.match(skill, /Never use copy-all discovery as authority/u);
  assert.match(skill, /project-owned product doc must remain outside overlay parity/u);
});

test('Proves: ORG-CONTEXT-001; Test type: mutation; Surface: startup context; Authority: context-engineering; Killer mutation: add a second import path without changing unique bytes; Gated command: npm test', () => {
  const skill = fs.readFileSync(path.join(root, 'skills', 'context-engineering', 'SKILL.md'), 'utf8');
  const gate = read('templates/gates/check-agent-context-budget.mjs.template');
  assert.match(skill, /one import path per authority/u);
  assert.match(gate, /Duplicate startup import/u);
  assert.match(gate, /firstParent/u);
});

test('Proves: ORG-GOV-005; Test type: architecture; Surface: cross-vendor lifecycle; Authority: vendor-neutral task governor; Killer mutation: let one vendor bypass the shared governor; Gated command: npm test', () => {
  const skill = fs.readFileSync(path.join(root, 'skills', 'bootstrap-orchestrator', 'SKILL.md'), 'utf8');
  const governor = fs.readFileSync(path.join(root, 'core', 'lifecycle', 'task-governor.mjs'), 'utf8');
  assert.match(skill, /Claude and Codex adapters/u);
  assert.match(skill, /neither adapter may reduce proof or path checks/u);
  assert.match(governor, /Changed file is outside editable paths/u);
  assert.match(governor, /Killer mutation was not observed/u);
  for (const project of ['auxara-dialer', 'coachai']) {
    const adapter = fs.readFileSync(path.join(root, 'overlays', project, 'project-files', 'scripts', 'claude-lifecycle-hook.mjs'), 'utf8');
    assert.match(adapter, /TaskCompleted[\s\S]*?validate(?:Universal)?Completion\(/u, `${project} TaskCompleted must call the shared completion governor`);
  }
});

test('Proves: ORG-REL-001; Test type: mutation; Surface: release-verifier template; Authority: deployed-verification truth table; Killer mutation: allow DEPLOY-VERIFIED with a skipped check or shell-only core flow; Gated command: npm test', () => {
  const source = read('templates/agents/release-verifier.template.md');
  const validates = (text) => text.includes('There is no DEPLOY-VERIFIED-with-skips state')
    && text.includes('A frontend 200/app shell is reachability evidence only')
    && text.includes('If any required check is named here, the verdict cannot be DEPLOY-VERIFIED');
  assert.equal(validates(source), true);
  assert.equal(validates(source.replace('There is no DEPLOY-VERIFIED-with-skips state.', 'Skipped checks may be disclosed.')), false);
});

test('Proves: ORG-UPTIME-001; Test type: mutation; Surface: uptime probe template; Authority: readiness contract; Killer mutation: treat any 2xx as ready; Gated command: npm test', () => {
  const source = read('templates/ci/uptime-probe.mjs.template');
  const validates = (text) => text.includes('{{READINESS_JSON_ASSERTION}}')
    && text.includes('Never use a generic 2xx')
    && !text.includes('const ready = readiness.ok');
  assert.equal(validates(source), true);
  assert.equal(validates(source.replace('const ready = readinessContract(readiness);', 'const ready = readiness.ok;')), false);
});
