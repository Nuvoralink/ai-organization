import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assessAction } from '../core/authority/assess-action.mjs';
import { validateActionPolicy } from '../scripts/lib/control-plane.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'policies', 'action-authority.v1.json'), 'utf8'));

test('Proves: ORG-AUTH-002; Test type: semantic mutation; Surface: human action gates; Authority: action policy; Killer mutation: remove any human-required action; Gated command: npm test', () => {
  assert.deepEqual(validateActionPolicy(policy), []);
  for (const action of policy.human_required) {
    const mutated = structuredClone(policy);
    mutated.human_required = mutated.human_required.filter((candidate) => candidate !== action);
    assert.match(validateActionPolicy(mutated).join('\n'), new RegExp(action, 'u'));
  }
});

test('Proves: ORG-AUTH-003; Test type: decision matrix; Surface: action evaluator; Authority: action policy; Killer mutation: omit one conditional merge predicate; Gated command: npm test', () => {
  assert.equal(assessAction(policy, 'push_branch').verdict, 'allowed');
  assert.equal(assessAction(policy, 'deploy_or_publish').verdict, 'human_required');
  const complete = Object.fromEntries(policy.conditional.merge_pull_request.all.map((predicate) => [predicate, true]));
  assert.equal(assessAction(policy, 'merge_pull_request', complete).verdict, 'conditional_pass');
  delete complete.actual_diff_verified;
  const blocked = assessAction(policy, 'merge_pull_request', complete);
  assert.equal(blocked.verdict, 'human_required');
  assert.deepEqual(blocked.missing, ['actual_diff_verified']);
  assert.equal(assessAction(policy, 'unknown_action').verdict, 'human_required');
});
