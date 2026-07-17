/**
 * Proves: ORG-GOV-COACH-001
 * Test type: lifecycle / false-pass mutation
 * Surface: CoachAI Claude TaskCreated and TaskCompleted adapter
 * Authority: accepted task-attempt controller and shared proof runner
 * Product statement: a CoachAI task cannot self-certify proof, replace its kickoff contract, mutate a read-only tree, or replay proof execution.
 * Killer mutation: restore caller-authored artifact/mutation booleans or the AGENT_PROOF_COMMAND override.
 * Gated command: npm run test:organization-control-plane
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validateTaskContract } from '../task-governor.mjs';

const root = process.cwd();
const hook = path.join(root, 'scripts', 'claude-lifecycle-hook.mjs');

function task(id) {
  return {
    schema_version: 2,
    id,
    product_intent: 'Audit CoachAI without changing the accepted repository state.',
    settled_decisions: ['Read-only work uses the built-in repository binding profile.'],
    scope: { in: ['orchestration audit'], out: ['product changes'], too_little: 'Trusting a caller boolean.', too_much: 'Running product proof commands for an audit.' },
    execution: { implementer_role: 'adversarial-reviewer' },
    paths: { read: ['**'], edit: ['scripts/tests/**'], read_only: ['**'], output: ['tmp/agent-assurance/**'] },
    risk: { level: 'low', classes: ['documentation'], reasons: ['read-only assurance audit'] },
    authorities: ['.ai-organization/runtime/core/lifecycle/task-governor.mjs'],
    blast_radius: { feeders: ['TaskCreated'], producers: ['internal runner'], transformers: ['CoachAI hook'], persistence: ['ignored attempt state'], validators: ['shared governor'], consumers: ['TaskCompleted'], surfaces: ['task lifecycle'], retirements: ['caller evidence'] },
    procedure: ['Capture and compare the repository binding.'],
    acceptance: ['Completion blocks if the repository changes.'],
    proofs: [{
      id: 'read-only-binding',
      profile_id: 'internal-read-only',
      capability: 'read_only_integrity',
      proves: 'The repository did not change during the audit.',
      surface: 'repository',
      authority: 'git binding',
      risk_classes: ['documentation'],
      mutation: { required: false, case_id: null, rationale: 'A read-only audit must not execute mutation commands.' },
      required: true
    }],
    action_authority: { allowed: ['read'], conditional: [], human_required: [] },
    completion: { tier: 'analysis', honesty_clause: 'Name unreached runtime surfaces.', unreached_surfaces: [], doctrine_loop: 'none' }
  };
}

function run(payload) {
  return spawnSync(process.execPath, [hook], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', env: process.env });
}

function create(id, session = `session-${id}`) {
  return run({ hook_event_name: 'TaskCreated', task_id: id, task_subject: 'Control-plane audit', task_description: `TASK_CONTRACT_JSON:${JSON.stringify(task(id))}`, session_id: session, teammate_name: 'orchestrator' });
}

function complete(id, session = `session-${id}`, additions = {}) {
  return run({
    hook_event_name: 'TaskCompleted',
    task_id: id,
    session_id: session,
    task_subject: 'Control-plane audit',
    ...additions
  });
}

function report(id, { session = `session-${id}`, agentId = `implementer-run-${id}`, role = 'adversarial-reviewer', doctrine = 'No reusable loophole remained in this fixture.' } = {}) {
  return run({
    hook_event_name: 'SubagentStop',
    session_id: session,
    agent_id: agentId,
    agent_type: role,
    last_assistant_message: [
      'Evidence: repository binding inspected.',
      'Killer mutations: forged completion fields rejected.',
      'Surfaces not reached: live Claude runtime.',
      'Doctrine-loop findings: none.',
      `COMPLETION_REPORT_JSON:${JSON.stringify({ task_id: id, unreached_surfaces: ['live Claude runtime'], doctrine_loop: doctrine })}`
    ].join('\n')
  });
}

test('validates the v2 read-only contract and rejects free-form proof commands', () => {
  const valid = task('COACH-LIFECYCLE-CONTRACT');
  assert.deepEqual(validateTaskContract(valid), []);
  valid.proofs[0].command = 'npm run anything';
  assert.match(validateTaskContract(valid).join('\n'), /unexpected property/u);
});

test('TaskCompleted rejects caller-authored booleans, then accepts runner-generated read-only evidence once', () => {
  const id = `COACH-READONLY-${Date.now()}`;
  assert.equal(create(id).status, 0);
  const forged = complete(id, `session-${id}`, {
    completion_evidence: {
      task_id: id,
      proofs: [{ artifact_opened: true, killer_mutation_observed: true, exit_code: 0 }]
    }
  });
  assert.equal(forged.status, 2);
  assert.match(forged.stderr, /caller-supplied completion evidence/iu);
  assert.equal(report(id).status, 0);
  const accepted = complete(id);
  assert.equal(accepted.status, 0, accepted.stderr);
  const replay = complete(id);
  assert.equal(replay.status, 0, replay.stderr);
});

test('TaskCreated binds payload id, session, contract, and read-only repository state', () => {
  const mismatchId = `COACH-MISMATCH-${Date.now()}`;
  const mismatch = run({ hook_event_name: 'TaskCreated', task_id: mismatchId, session_id: 'mismatch-session', agent_id: 'mismatch-agent', task_description: `TASK_CONTRACT_JSON:${JSON.stringify(task(`${mismatchId}-OTHER`))}` });
  assert.equal(mismatch.status, 2);
  assert.match(mismatch.stderr, /task id/u);

  const id = `COACH-STATE-${Date.now()}`;
  assert.equal(create(id).status, 0);
  assert.equal(report(id).status, 0);
  const mutation = path.join(root, 'scripts', 'tests', `.read-only-mutation-${Date.now()}`);
  fs.writeFileSync(mutation, 'must block\n');
  try {
    const changed = complete(id);
    assert.equal(changed.status, 2);
    assert.match(changed.stderr, /Read-only task changed repository state/u);
  } finally {
    fs.rmSync(mutation, { force: true });
  }
  const acceptedAfterRestore = complete(id);
  assert.equal(acceptedAfterRestore.status, 0, acceptedAfterRestore.stderr);
});

test('TaskCompleted ignores a replacement contract and blocks missing completion-time report evidence', () => {
  const id = `COACH-REPORT-${Date.now()}`;
  assert.equal(create(id).status, 0);
  const missing = run({ hook_event_name: 'TaskCompleted', task_id: id, session_id: `session-${id}`, task_contract: task(`${id}-REPLACEMENT`) });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /completion report receipt/u);
  const invented = complete(id, `session-${id}`, { completion_report: { task_id: id, unreached_surfaces: [], doctrine_loop: 'invented' } });
  assert.equal(invented.status, 2);
  assert.match(invented.stderr, /official event has no report field/u);
  const foreignSession = report(id, { session: 'foreign-session' });
  assert.equal(foreignSession.status, 2);
  assert.match(foreignSession.stderr, /session does not match/u);
  const foreignRole = report(id, { role: 'implementer' });
  assert.equal(foreignRole.status, 2);
  assert.match(foreignRole.stderr, /role does not match/u);
  assert.equal(report(id).status, 0);
  const overwrite = report(id, { agentId: 'foreign-implementer-run', doctrine: 'attempted overwrite' });
  assert.equal(overwrite.status, 2);
  assert.match(overwrite.stderr, /same accepted implementer platform run/u);
  const accepted = complete(id, `session-${id}`, { task_contract: task(`${id}-REPLACEMENT`) });
  assert.equal(accepted.status, 0, accepted.stderr);
});
