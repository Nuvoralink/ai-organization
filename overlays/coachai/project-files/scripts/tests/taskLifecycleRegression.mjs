/**
 * Proves: REQ-ORG-004
 * Test type: regression
 * Surface: agent task kickoff, completion, report, proof, and privacy lifecycle
 * Authority: task-contract.schema.json, completion-evidence.schema.json, and lifecycle-policy.json
 * What this test proves about the product: vague work and unproved completion are blocked and lifecycle telemetry never stores task content.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateAgentReport, validateCompletionEvidence, validateTaskContract } from '../task-governor.mjs';
import { organizationFixture } from './fixture-helpers.mjs';

const goodTask = {
  task_id: 'ORG-TEST', context: 'The orchestrator remains the single PM. Implement a bounded deterministic organization-control regression.',
  paths: { read: ['AGENTS.md'], edit: ['scripts/tests'], never_modify: ['backend/src'] },
  procedure: ['1. Read authorities.', '2. Seed a mutation and capture its real exit.'],
  output_contract: 'Report changed paths, proof exits, mutations, remaining gaps, and doctrine-loop findings.',
  boundaries: 'Do not change product source, deploy, mutate production, contact users, or make product/design decisions.',
  acceptance: ['The clean fixture passes.', 'The killer mutation fails.'],
  risk: { class: 'low', proof_profiles: ['organization-control'], human_gates: [] }, completion_tier: 'locally_verified'
};
const goodEvidence = {
  task_id: 'ORG-TEST', outcome: 'The deterministic organization control regression is implemented and locally proven.',
  changed_paths: ['scripts/tests/taskLifecycleRegression.mjs'],
  proof: [{ command: 'node --test', exit: 0, proves: 'Lifecycle refusal and acceptance behavior.' }],
  killer_mutations: ['Make selected proof exit one; completion blocks.'], independent_review: 'pending',
  not_reached: ['deployed surface'], decisions: [], doctrine_loop: 'none'
};

test('structured contracts accept substantive evidence and reject vague placeholders', () => {
  assert.deepEqual(validateTaskContract(goodTask), []);
  assert.deepEqual(validateCompletionEvidence(goodEvidence), []);
  assert.ok(validateTaskContract({ ...goodTask, context: 'TBD' }).length > 0);
  assert.ok(validateCompletionEvidence({ ...goodEvidence, proof: [] }).length > 0);
  assert.ok(validateAgentReport('Evidence: yes\nKiller mutations: yes').length > 0);
});

test('killer mutation: TaskCompleted blocks a failing selected proof and accepts a passing one', () => {
  const root = organizationFixture(process.cwd());
  const script = path.join(root, 'scripts/claude-lifecycle-hook.mjs');
  const payload = JSON.stringify({ hook_event_name: 'TaskCompleted', completion_evidence: goodEvidence, prompt: 'SUPER-SECRET-TASK-CONTENT' });
  const failed = spawnSync(process.execPath, [script], { cwd: root, input: payload, encoding: 'utf8', env: { ...process.env, AGENT_PROOF_COMMAND: `"${process.execPath}" -e "process.exit(7)"` } });
  assert.equal(failed.status, 2);
  assert.match(failed.stderr, /risk-selected proof failed/i);
  const passed = spawnSync(process.execPath, [script], { cwd: root, input: payload, encoding: 'utf8', env: { ...process.env, AGENT_PROOF_COMMAND: `"${process.execPath}" -e "process.exit(0)"` } });
  assert.equal(passed.status, 0);
  const telemetry = fs.readFileSync(path.join(root, 'tmp/agent-telemetry/lifecycle.jsonl'), 'utf8');
  assert.doesNotMatch(telemetry, /SUPER-SECRET-TASK-CONTENT/);
  assert.match(telemetry, /payload_sha256/);
});
