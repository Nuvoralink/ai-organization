/**
 * Proves: REQ-ORG-004
 * Test type: regression
 * Surface: agent task kickoff, completion, report, proof, and privacy lifecycle
 * Authority: shared task-assurance and task-evidence schemas plus lifecycle-policy.json
 * What this test proves about the product: vague work and unproved completion are blocked and lifecycle telemetry never stores task content.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateAgentReport, validateCompletion, validateTaskContract } from '../task-governor.mjs';
import { organizationFixture } from './fixture-helpers.mjs';

const goodTask = {
  id: 'ORG-TEST',
  product_intent: 'The orchestrator remains the single PM while completion is proven deterministically.',
  settled_decisions: ['Use the generated universal governor as the completion authority.'],
  scope: { in: ['Organization lifecycle proof'], out: ['Product behavior'], too_little: 'Schema spot checks only.', too_much: 'Application rewrites.' },
  paths: { read: ['AGENTS.md'], edit: ['scripts/**'], read_only: ['backend/**'], output: ['scripts/tests/**'] },
  risk: { level: 'medium', classes: ['control_plane'], reasons: ['Completion authority changes.'] },
  authorities: ['.ai-organization/runtime/core/lifecycle/task-governor.mjs'],
  blast_radius: { feeders: ['task payload'], producers: ['orchestrator'], transformers: ['CoachAI adapter'], persistence: ['content-free telemetry'], validators: ['universal governor'], consumers: ['Claude lifecycle hook'], surfaces: ['task completion'], retirements: ['legacy CoachAI validator'] },
  procedure: ['1. Read authorities.', '2. Seed a mutation and capture its real exit.'],
  acceptance: ['The clean fixture passes.', 'The killer mutation fails.'],
  proofs: [{ id: 'organization-control', proves: 'Lifecycle refusal and acceptance behavior.', command: 'npm run proof:changed', surface: 'task completion', authority: 'universal governor', risk_classes: ['control_plane'], killer_mutation: 'Make selected proof exit nonzero.', required: true }],
  action_authority: { allowed: ['branch'], conditional: ['merge_pull_request'], human_required: ['deploy_or_publish'] },
  completion: { tier: 'locally_verified', honesty_clause: 'Do not claim unproved surfaces.', unreached_surfaces: ['deployed surface'], doctrine_loop: 'none' }
};
const goodEvidence = {
  task_id: 'ORG-TEST',
  changed_files: ['scripts/tests/taskLifecycleRegression.mjs'],
  proofs: [{ id: 'organization-control', command: 'npm run proof:changed', exit_code: 0, artifact_opened: true, killer_mutation_observed: true }],
  independent_review: { required: false, reviewer: null, verdict: 'not_required' },
  unreached_surfaces: ['deployed surface'],
  doctrine_loop: 'none'
};

test('structured contracts accept substantive evidence and reject vague placeholders', () => {
  assert.deepEqual(validateTaskContract(goodTask), []);
  assert.deepEqual(validateCompletion(goodTask, goodEvidence), []);
  assert.ok(validateTaskContract({ ...goodTask, product_intent: 'TBD' }).length > 0);
  assert.ok(validateCompletion(goodTask, { ...goodEvidence, proofs: [] }).length > 0);
  assert.ok(validateAgentReport('Evidence: yes\nKiller mutations: yes').length > 0);
});

test('killer mutation: TaskCompleted blocks a failing selected proof and accepts a passing one', () => {
  const root = organizationFixture(process.cwd());
  const script = path.join(root, 'scripts/claude-lifecycle-hook.mjs');
  const payload = JSON.stringify({ hook_event_name: 'TaskCompleted', task_contract: goodTask, completion_evidence: goodEvidence, prompt: 'SUPER-SECRET-TASK-CONTENT' });
  const failed = spawnSync(process.execPath, [script], { cwd: root, input: payload, encoding: 'utf8', env: { ...process.env, AGENT_PROOF_COMMAND: `"${process.execPath}" -e "process.exit(7)"` } });
  assert.equal(failed.status, 2);
  assert.match(failed.stderr, /risk-selected proof failed/i);
  const passed = spawnSync(process.execPath, [script], { cwd: root, input: payload, encoding: 'utf8', env: { ...process.env, AGENT_PROOF_COMMAND: `"${process.execPath}" -e "process.exit(0)"` } });
  assert.equal(passed.status, 0);
  const telemetry = fs.readFileSync(path.join(root, 'tmp/agent-telemetry/lifecycle.jsonl'), 'utf8');
  assert.doesNotMatch(telemetry, /SUPER-SECRET-TASK-CONTENT/);
  assert.match(telemetry, /payload_sha256/);
});
