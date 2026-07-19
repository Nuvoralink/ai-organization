import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assessAction, validateActionPolicySemantics } from '../core/authority/assess-action.mjs';
import { validateActionPolicy } from '../scripts/lib/control-plane.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'policies', 'action-authority.v1.json'), 'utf8'));

test('Proves: ORG-AUTH-002; Test type: semantic mutation; Surface: human action gates; Authority: action policy; Killer mutation: reclassify any human-required action as autonomous; Gated command: npm test', () => {
  assert.deepEqual(validateActionPolicy(policy), []);
  for (const action of policy.human_required) {
    const mutated = structuredClone(policy);
    mutated.human_required = mutated.human_required.filter((candidate) => candidate !== action);
    mutated.autonomous.push(action);
    assert.equal(assessAction(mutated, action).verdict, 'allowed');
    assert.match(validateActionPolicySemantics(mutated).join('\n'), new RegExp(`Required human action is not human_required: ${action}`, 'u'));
  }
  const overlap = structuredClone(policy);
  overlap.human_required.push(overlap.autonomous[0]);
  assert.match(validateActionPolicySemantics(overlap).join('\n'), /multiple authorities/u);
  const unconditionalPush = structuredClone(policy);
  delete unconditionalPush.conditional.push_branch;
  unconditionalPush.autonomous.push('push_branch');
  assert.match(validateActionPolicySemantics(unconditionalPush).join('\n'), /push_branch must be conditional/u);
  for (const predicate of policy.conditional.push_branch.all) {
    const weakenedPush = structuredClone(policy);
    weakenedPush.conditional.push_branch.all = weakenedPush.conditional.push_branch.all.filter((candidate) => candidate !== predicate);
    assert.match(validateActionPolicySemantics(weakenedPush).join('\n'), new RegExp(`missing required predicate: ${predicate}`, 'u'));
  }
});

test('Proves: ORG-AUTH-003; Test type: decision matrix; Surface: action evaluator; Authority: action policy; Killer mutation: treat a Vercel/Netlify/Railway-integrated push as git-only or omit one conditional predicate; Gated command: npm test', () => {
  const pushEvidence = Object.fromEntries(policy.conditional.push_branch.all.map((predicate) => [predicate, true]));
  assert.equal(assessAction(policy, 'push_branch').verdict, 'human_required');
  assert.equal(assessAction(policy, 'push_branch', pushEvidence).verdict, 'conditional_pass');
  for (const predicate of policy.conditional.push_branch.all) {
    const incomplete = { ...pushEvidence };
    delete incomplete[predicate];
    const blockedPush = assessAction(policy, 'push_branch', incomplete);
    assert.equal(blockedPush.verdict, 'human_required');
    assert.deepEqual(blockedPush.missing, [predicate]);
  }
  const autoDeployMutation = { ...pushEvidence, no_preview_or_production_deploy: false };
  assert.equal(assessAction(policy, 'push_branch', autoDeployMutation).verdict, 'human_required');
  assert.equal(assessAction(policy, 'deploy_or_publish').verdict, 'human_required');
  const complete = Object.fromEntries(policy.conditional.merge_pull_request.all.map((predicate) => [predicate, true]));
  assert.equal(assessAction(policy, 'merge_pull_request', complete).verdict, 'conditional_pass');
  delete complete.actual_diff_verified;
  const blocked = assessAction(policy, 'merge_pull_request', complete);
  assert.equal(blocked.verdict, 'human_required');
  assert.deepEqual(blocked.missing, ['actual_diff_verified']);
  assert.equal(assessAction(policy, 'unknown_action').verdict, 'human_required');
  assert.deepEqual(assessAction(policy, 'constructor'), { verdict: 'human_required', action: 'constructor', missing: ['unclassified_action'] });
  assert.deepEqual(assessAction({ default: 'human_required' }, 'push_branch'), { verdict: 'human_required', action: 'push_branch', missing: ['unclassified_action'] });
  assert.deepEqual(assessAction({ default: 'human_required', conditional: { push_branch: {} } }, 'push_branch'), { verdict: 'human_required', action: 'push_branch', missing: ['invalid_conditional_policy'] });
  assert.match(validateActionPolicySemantics({ ...policy, conditional: { ...policy.conditional, push_branch: {} } }).join('\n'), /must declare at least one required predicate/u);
});

test('Proves: ORG-AUTH-005; Test type: executable-consumer mutation; Surface: action evaluator CLI; Authority: semantic policy validator; Killer mutation: evaluate a reclassified human action without validating the policy first; Gated command: npm test', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'action-policy-cli-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const mutated = structuredClone(policy);
  mutated.human_required = mutated.human_required.filter((action) => action !== 'deploy_or_publish');
  mutated.autonomous.push('deploy_or_publish');
  const policyFile = path.join(fixture, 'mutated-policy.json');
  fs.writeFileSync(policyFile, JSON.stringify(mutated));
  const result = spawnSync(process.execPath, [path.join(root, 'core', 'authority', 'assess-action.mjs'), policyFile, 'deploy_or_publish'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Action policy is invalid.*deploy_or_publish/su);
  assert.doesNotMatch(result.stdout, /"verdict"\s*:\s*"allowed"/u);
});
