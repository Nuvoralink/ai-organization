import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as evidenceRuntime from '../core/lifecycle/evidence-runtime.mjs';
import * as lifecycleController from '../core/lifecycle/lifecycle-controller.mjs';
import {
  acceptTaskAttempt,
  buildCompletionEvidence,
  claimTaskAttempt,
  collectRepositoryState,
  commitTaskCompletion,
  defaultAssuranceStateDirectory,
  integrationBranchBaseRef,
  isValidIntegrationBranch,
  loadTaskAttempt,
  parseCommandOutput,
  recordCompletionReportReceipt,
  recordReviewReceipt,
  runRequiredProofs,
  sha256,
  signAttestation,
  validateRegisteredAgentRoleProviders,
  validateLifecycleProofBudget,
  validateLifecycleRoleModes,
  validateSafeProofProfile
} from '../core/lifecycle/evidence-runtime.mjs';
import { acceptLifecycleTask, completeLifecycleTask } from '../core/lifecycle/lifecycle-controller.mjs';
import { loadActionAuthority, loadRiskPolicy, validateCompletion, validateTaskContract, validateTaskEvidence } from '../core/lifecycle/task-governor.mjs';

const controlPlaneRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', shell: false });
  assert.equal(result.status, 0, `${result.stderr ?? result.stdout}`);
  return String(result.stdout ?? '').trim();
}

function fixtureRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'assurance-v2-'));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, '.gitignore'), 'tmp/\nsentinel-*\n');
  fs.writeFileSync(path.join(root, 'scripts', 'proof-pass.mjs'), "console.log('CONTROL_PROOF_PASS');\n");
  const fixtureRuntime = path.join(root, '.ai-organization', 'runtime', 'core', 'lifecycle');
  fs.mkdirSync(fixtureRuntime, { recursive: true });
  for (const file of ['evidence-runtime.mjs', 'run-evidence-integrity-mutation.mjs']) fs.copyFileSync(path.join(controlPlaneRoot, 'core', 'lifecycle', file), path.join(fixtureRuntime, file));
  fs.writeFileSync(path.join(root, 'scripts', 'danger.mjs'), "require('node:fs').writeFileSync('sentinel-migrate', 'ran');\n");
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    private: true,
    type: 'module',
    scripts: {
      'proof:pass': 'node scripts/proof-pass.mjs',
      'proof:mutation': 'node .ai-organization/runtime/core/lifecycle/run-evidence-integrity-mutation.mjs',
      migrate: 'node scripts/danger.mjs'
    }
  }, null, 2));
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'user.name', 'Evidence Test');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'fixture');
  const head = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/main', head);
  return root;
}

function contract() {
  return {
    schema_version: 2,
    id: 'ORG-001',
    product_intent: 'Make completion evidence source-bound across vendors.',
    settled_decisions: ['Registered local proof profiles own command execution.'],
    scope: {
      in: ['Shared task contract and completion evidence validation'],
      out: ['Application feature implementation'],
      too_little: 'Trusting a status boolean would permit self-certification.',
      too_much: 'An external signing service is outside this local controller change.'
    },
    execution: { implementer_role: 'codex-backend-implementer' },
    paths: {
      read: ['scripts/**'],
      edit: ['src/**'],
      read_only: ['scripts/**'],
      output: ['tmp/agent-assurance/**']
    },
    risk: { level: 'high', classes: ['control_plane'], reasons: ['completion authority'] },
    authorities: ['schemas/task-assurance.v2.schema.json', 'schemas/task-evidence.v2.schema.json'],
    blast_radius: {
      feeders: ['TaskCreated payload'],
      producers: ['Shared proof runner'],
      transformers: ['Project lifecycle adapters'],
      persistence: ['Ignored assurance attempt store'],
      validators: ['Shared task governor'],
      consumers: ['Claude and Codex orchestration'],
      surfaces: ['Task kickoff and completion'],
      retirements: ['Caller-authored evidence booleans and commands']
    },
    procedure: ['Resolve the registered profile, execute it, parse its artifacts, and validate its attestation.'],
    acceptance: ['Forged, stale, replayed, empty, or human-gated proof execution is rejected.'],
    proofs: [{
      id: 'control-tests',
      profile_id: 'organization-control',
      capability: 'control_plane_completion',
      proves: 'The completion governor rejects unauthenticated evidence.',
      surface: 'control plane',
      authority: 'task governor',
      risk_classes: ['control_plane'],
      mutation: {
        required: true,
        case_id: 'forged-runner-attestation-rejected',
        rationale: 'Tampering with a bound proof receipt must invalidate completion.'
      },
      required: true
    }],
    action_authority: {
      allowed: ['read', 'edit', 'test'],
      conditional: ['commit', 'push', 'pull_request'],
      human_required: ['production_mutation', 'destructive_action', 'billed_action']
    },
    completion: {
      tier: 'review_verified',
      honesty_clause: 'Name every surface not reached by the supplied proof.',
      unreached_surfaces: [],
      doctrine_loop: 'Record the smallest reusable control improvement or none.'
    }
  };
}

function registry() {
  return {
    version: 2,
    integration_branch: 'main',
    lifecycle_hook_timeout_ms: 1_800_000,
    lifecycle_timeout_safety_margin_ms: 60_000,
    lifecycle_roles_by_completion_mode: {
      'read-only': ['codex-backend-implementer'],
      implementation: ['codex-backend-implementer']
    },
    lifecycle_supported_risk_classes: ['control_plane'],
    risk_path_rules: [{ risk_class: 'control_plane', include: ['src/**'] }],
    profiles: [{
      id: 'organization-control',
      version: 1,
      classification: 'local_non_mutating',
      safe_local_only: true,
      capabilities: ['control_plane_completion'],
      env_allowlist: [],
      commands: [{
        id: 'control-proof',
        argv: ['npm', 'run', 'proof:pass'],
        timeout_ms: 30_000,
        parser: { kind: 'patterns', minimum_output_bytes: 1, minimum_executed: 1, required_patterns: ['CONTROL_PROOF_PASS'] }
      }],
      mutation: {
        case_id: 'forged-runner-attestation-rejected',
        argv: ['npm', 'run', 'proof:mutation'],
        timeout_ms: 30_000,
        receipt_marker: 'MUTATION_RECEIPT_JSON:',
        expected_diagnostic: 'forged runner attestation was accepted'
      }
    }]
  };
}

// Simulates a receipt that has already been authenticated by a protected external
// approval provider. Production runtime intentionally exposes no local issuer.
function attachExternallyAuthenticatedHumanGateForTest({ stateDirectory, taskId, gateId, approverId = 'human-approver', approverSessionId = 'human-approval-session', repository }) {
  const attemptsDirectory = path.join(stateDirectory, 'attempts');
  const attemptFile = path.join(attemptsDirectory, fs.readdirSync(attemptsDirectory).find((entry) => entry.endsWith('.json')));
  const attempt = JSON.parse(fs.readFileSync(attemptFile, 'utf8'));
  const unsigned = {
    gate_id: gateId,
    attempt_id: attempt.attempt_id,
    contract_sha256: attempt.contract_sha256,
    approver_id_sha256: sha256(approverId),
    approver_session_sha256: sha256(approverSessionId),
    repository,
    approved_at: new Date().toISOString()
  };
  const receipt = { ...unsigned, attestation_hmac_sha256: signAttestation(unsigned, attempt.secret_hex) };
  attempt.human_gate_receipts = [...(attempt.human_gate_receipts ?? []).filter((candidate) => candidate.gate_id !== gateId), receipt];
  fs.writeFileSync(attemptFile, `${JSON.stringify(attempt)}\n`);
  return receipt;
}

function acceptedFixture({ riskPolicy = loadRiskPolicy(), humanGates = [], claim = true } = {}) {
  const root = fixtureRepository();
  const stateDirectory = defaultAssuranceStateDirectory(root);
  const actionAuthority = loadActionAuthority();
  const profileRegistry = registry();
  const initial = collectRepositoryState(root);
  const attempt = acceptTaskAttempt({
    stateDirectory,
    payloadTaskId: 'ORG-001',
    contract: contract(),
    sessionId: 'implementer-session',
    implementerId: 'implementer',
    completionMode: 'implementation',
    repository: initial.binding,
    profileRegistry,
    riskPolicy,
    actionAuthority
  });
  fs.writeFileSync(path.join(root, 'src', 'change.txt'), 'implementation\n');
  const current = collectRepositoryState(root);
  recordCompletionReportReceipt({
    stateDirectory,
    taskId: 'ORG-001',
    reporterId: 'implementer-run',
    reporterSessionId: 'implementer-session',
    reporterRole: 'codex-backend-implementer',
    repository: current.binding,
    report: { task_id: 'ORG-001', unreached_surfaces: ['external signing service'], doctrine_loop: 'Replaced self-certified booleans with parsed, task-bound receipts.' }
  });
  recordReviewReceipt({
    stateDirectory,
    taskId: 'ORG-001',
    reviewerId: 'independent-reviewer',
    reviewerSessionId: 'review-session',
    role: 'adversarial-reviewer',
    repository: current.binding,
    verdict: 'pass'
  });
  for (const gateId of humanGates) {
    attachExternallyAuthenticatedHumanGateForTest({
      stateDirectory,
      taskId: 'ORG-001',
      gateId,
      approverId: 'human-approver',
      approverSessionId: 'human-approval-session',
      repository: current.binding
    });
  }
  const currentAttempt = claim
    ? claimTaskAttempt({ stateDirectory, taskId: 'ORG-001', sessionId: 'implementer-session' }).attempt
    : loadTaskAttempt(stateDirectory, 'ORG-001');
  return { root, stateDirectory, riskPolicy, actionAuthority, profileRegistry, attempt: currentAttempt, current };
}

function generateValidCompletion(options = {}) {
  const fixture = acceptedFixture(options);
  const result = runRequiredProofs({
    contract: contract(),
    attempt: fixture.attempt,
    profileRegistry: fixture.profileRegistry,
    actionAuthority: fixture.actionAuthority,
    cwd: fixture.root,
    stateDirectory: fixture.stateDirectory
  });
  assert.deepEqual(result.failures, []);
  const evidence = buildCompletionEvidence({
    contract: contract(),
    attempt: fixture.attempt,
    repository: fixture.current.binding,
    changedFiles: fixture.current.changed_files,
    proofReceipts: result.receipts
  });
  const context = {
    attempt: fixture.attempt,
    profileRegistry: fixture.profileRegistry,
    riskPolicy: fixture.riskPolicy,
    actionAuthority: fixture.actionAuthority,
    currentRepository: fixture.current.binding,
    stateDirectory: fixture.stateDirectory
  };
  return { ...fixture, evidence, context };
}

test('Proves: ORG-GOV-001; Test type: contract; Surface: TaskCreated; Authority: risk policy; Killer mutation: omit the policy-required capability; Gated command: npm test', () => {
  assert.deepEqual(validateTaskContract(contract()), []);
  const mutated = contract();
  mutated.proofs[0].capability = 'invented-green-check';
  assert.match(validateTaskContract(mutated).join('\n'), /Risk policy requires proof capability/u);
  const freeForm = contract();
  freeForm.proofs[0].command = 'npm run migrate';
  assert.match(validateTaskContract(freeForm).join('\n'), /unexpected property/u);
  const emptyBlastRadius = contract();
  for (const key of Object.keys(emptyBlastRadius.blast_radius)) emptyBlastRadius.blast_radius[key] = [];
  assert.match(validateTaskContract(emptyBlastRadius).join('\n'), /fewer than 1 items/u);

  const root = fixtureRepository();
  const modeMismatch = acceptLifecycleTask({
    taskId: 'ORG-001',
    contract: contract(),
    sessionId: 'implementer-session',
    implementerId: 'implementer',
    completionMode: 'read-only',
    cwd: root,
    profileRegistry: registry()
  });
  assert.match(modeMismatch.failures.join('\n'), /Completion mode must be implementation/u);

  const underdeclared = contract();
  underdeclared.paths.edit = ['backend/prisma/**'];
  const underdeclaredResult = acceptLifecycleTask({
    taskId: underdeclared.id,
    contract: underdeclared,
    sessionId: 'risk-session',
    implementerId: 'risk-agent',
    completionMode: 'implementation',
    cwd: root,
    profileRegistry: registry()
  });
  assert.match(underdeclaredResult.failures.join('\n'), /undeclared minimum risk class: database/u);

  const unclassified = contract();
  unclassified.paths.edit = ['backend/src/routes/calls.ts'];
  const unclassifiedRegistry = registry();
  unclassifiedRegistry.risk_path_rules = [];
  const unclassifiedResult = acceptLifecycleTask({
    taskId: unclassified.id,
    contract: unclassified,
    sessionId: 'unclassified-session',
    implementerId: 'unclassified-agent',
    completionMode: 'implementation',
    cwd: root,
    profileRegistry: unclassifiedRegistry
  });
  assert.match(unclassifiedResult.failures.join('\n'), /no minimum-risk classification and fails closed/u);

  const unknownDefault = loadRiskPolicy();
  unknownDefault.default_required.push('ceremonial_green_status');
  assert.match(validateTaskContract(contract(), { riskPolicy: unknownDefault }).join('\n'), /has no enforcement mapping/u);
});

test('Proves: ORG-GOV-002; Test type: golden mutation; Surface: TaskCompleted; Authority: runner evidence; Killer mutation: forge legacy booleans without a bound receipt or serialize an omitted optional field as literal undefined; Gated command: npm test', () => {
  const generated = generateValidCompletion();
  const persistedAttemptFile = fs
    .readdirSync(path.join(generated.stateDirectory, 'attempts'))
    .map((name) => path.join(generated.stateDirectory, 'attempts', name))
    .find((file) => file.endsWith('.json'));
  const persistedAttempt = fs.readFileSync(persistedAttemptFile, 'utf8');
  assert.doesNotMatch(persistedAttempt, /:undefined(?:[,}])/u);
  assert.doesNotThrow(() => JSON.parse(persistedAttempt));
  assert.deepEqual(validateCompletion(contract(), generated.evidence, generated.context), []);
  const callerAuthored = {
    task_id: 'ORG-001',
    changed_files: ['src/change.txt'],
    proofs: [{ id: 'control-tests', exit_code: 0, artifact_opened: true, killer_mutation_observed: true }]
  };
  assert.match(validateTaskEvidence(callerAuthored).join('\n'), /schema_version|proof_receipts/u);
  assert.match(validateCompletion(contract(), callerAuthored, generated.context).join('\n'), /schema_version|proof_receipts/u);
});

test('Proves: ORG-GOV-003; Test type: artifact integrity; Surface: proof output; Authority: shared governor; Killer mutation: alter a parsed artifact after its receipt is signed; Gated command: npm test', () => {
  const generated = generateValidCompletion();
  const artifact = generated.evidence.proof_receipts[0].commands[0].artifact;
  fs.appendFileSync(path.join(generated.stateDirectory, ...artifact.path.split('/')), 'tamper');
  assert.match(validateCompletion(contract(), generated.evidence, generated.context).join('\n'), /artifact digest mismatch/u);
});

test('Proves: ORG-GOV-004; Test type: binding mutation; Surface: task attempt; Authority: shared governor; Killer mutation: replay a receipt against another diff or session; Gated command: npm test', () => {
  const generated = generateValidCompletion();
  const stale = structuredClone(generated.evidence);
  stale.repository.diff_sha256 = 'f'.repeat(64);
  assert.match(validateCompletion(contract(), stale, generated.context).join('\n'), /stale/u);
  const selfReview = structuredClone(generated.evidence);
  selfReview.review_receipts[0].reviewer_id_sha256 = selfReview.completion_report_receipt.reporter_id_sha256;
  const { attestation_hmac_sha256: _oldReview, ...unsignedReview } = selfReview.review_receipts[0];
  selfReview.review_receipts[0].attestation_hmac_sha256 = signAttestation(unsignedReview, generated.attempt.secret_hex);
  assert.match(validateCompletion(contract(), selfReview, generated.context).join('\n'), /implementer platform run/u);
});

test('Proves: ORG-GOV-004A; Test type: reporter identity binding; Surface: SubagentStop completion report; Authority: accepted task session and implementer role; Killer mutation: let a foreign run claim or overwrite the implementer report; Gated command: npm test', () => {
  const fixture = acceptedFixture({ claim: false });
  const state = loadTaskAttempt(fixture.stateDirectory, 'ORG-001');
  const withoutReport = { ...state };
  delete withoutReport.completion_report_receipt;
  fs.writeFileSync(path.join(fixture.stateDirectory, 'attempts', fs.readdirSync(path.join(fixture.stateDirectory, 'attempts'))[0]), `${JSON.stringify(withoutReport)}\n`);
  assert.throws(() => recordCompletionReportReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reporterId: 'foreign-run',
    reporterSessionId: 'foreign-session',
    reporterRole: 'codex-backend-implementer',
    repository: fixture.current.binding,
    report: { task_id: 'ORG-001', unreached_surfaces: [], doctrine_loop: 'none' }
  }), /session does not match/u);
  assert.throws(() => recordCompletionReportReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reporterId: 'foreign-run',
    reporterSessionId: 'implementer-session',
    reporterRole: 'adversarial-reviewer',
    repository: fixture.current.binding,
    report: { task_id: 'ORG-001', unreached_surfaces: [], doctrine_loop: 'none' }
  }), /role does not match/u);
  recordCompletionReportReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reporterId: 'implementer-run',
    reporterSessionId: 'implementer-session',
    reporterRole: 'codex-backend-implementer',
    repository: fixture.current.binding,
    report: { task_id: 'ORG-001', unreached_surfaces: [], doctrine_loop: 'none' }
  });
  assert.throws(() => recordCompletionReportReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reporterId: 'second-run',
    reporterSessionId: 'implementer-session',
    reporterRole: 'codex-backend-implementer',
    repository: fixture.current.binding,
    report: { task_id: 'ORG-001', unreached_surfaces: [], doctrine_loop: 'overwrite' }
  }), /same accepted implementer platform run/u);
});

test('Proves: ORG-GOV-004C; Test type: convergent review loop; Surface: completion receipts; Authority: latest repository-bound implementer report and role review; Killer mutation: let an earlier findings receipt permanently poison a later fixed-and-passed state; Gated command: npm test', () => {
  const fixture = acceptedFixture({ claim: false });
  recordReviewReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reviewerId: 'independent-reviewer',
    reviewerSessionId: 'review-session',
    role: 'adversarial-reviewer',
    repository: fixture.current.binding,
    verdict: 'findings',
    findingCount: 1,
    unresolvedFindingCount: 1
  });
  fs.writeFileSync(path.join(fixture.root, 'src', 'change.txt'), 'implementation after findings\n');
  const fixed = collectRepositoryState(fixture.root);
  const report = recordCompletionReportReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reporterId: 'implementer-run',
    reporterSessionId: 'implementer-session',
    reporterRole: 'codex-backend-implementer',
    repository: fixed.binding,
    report: { task_id: 'ORG-001', unreached_surfaces: [], doctrine_loop: 'Fixed the review finding.' }
  });
  assert.ok(report.supersedes_report_id);
  recordReviewReceipt({
    stateDirectory: fixture.stateDirectory,
    taskId: 'ORG-001',
    reviewerId: 'independent-reviewer',
    reviewerSessionId: 'review-session',
    role: 'adversarial-reviewer',
    repository: fixed.binding,
    verdict: 'pass'
  });
  const state = loadTaskAttempt(fixture.stateDirectory, 'ORG-001');
  assert.equal(state.review_receipts.length, 1);
  assert.equal(state.review_receipts[0].verdict, 'pass');
  assert.ok(state.review_receipts[0].supersedes_review_id);
  assert.equal(state.review_history.length, 2);
  assert.equal(state.review_history.at(-1).verdict, 'findings');
});

test('Proves: ORG-GOV-004B; Test type: structural mutation receipt; Surface: mutation artifact; Authority: shared governor; Killer mutation: re-sign a receipt whose restore digest or diagnostic no longer matches the opened artifact; Gated command: npm test', () => {
  const generated = generateValidCompletion();
  const mutated = structuredClone(generated.evidence);
  const receipt = mutated.proof_receipts[0];
  receipt.mutation.restored.digest = 'f'.repeat(64);
  receipt.mutation.mutant.diagnostic_sha256 = 'e'.repeat(64);
  const { attestation_hmac_sha256: _old, ...unsigned } = receipt;
  receipt.attestation_hmac_sha256 = signAttestation(unsigned, generated.attempt.secret_hex);
  const failures = validateCompletion(contract(), mutated, generated.context).join('\n');
  assert.match(failures, /mutation fixture was not restored|mutation artifact disagrees/u);
  assert.match(failures, /different diagnostic/u);
});

test('Proves: ORG-GOV-005; Test type: replay; Surface: attempt state; Authority: attempt controller; Killer mutation: submit TaskCompleted twice; Gated command: npm test', () => {
  const generated = generateValidCompletion();
  assert.deepEqual(validateCompletion(contract(), generated.evidence, generated.context), []);
  const completed = commitTaskCompletion({ stateDirectory: generated.stateDirectory, taskId: 'ORG-001', completionReceipt: generated.evidence });
  assert.equal(completed.state, 'completed');
  const replay = claimTaskAttempt({ stateDirectory: generated.stateDirectory, taskId: 'ORG-001', sessionId: 'implementer-session' });
  assert.equal(replay.already_completed, true);
  const durable = loadTaskAttempt(generated.stateDirectory, 'ORG-001');
  assert.equal(replay.attempt.completion_receipt_sha256, durable.completion_receipt_sha256);
  assert.equal(durable.secret_hex, undefined, 'completed attempts must not retain their signing secret');
  assert.throws(() => claimTaskAttempt({ stateDirectory: generated.stateDirectory, taskId: 'ORG-001', sessionId: 'other-session' }), /session does not match/u);
  const controllerReplay = completeLifecycleTask({ taskId: 'ORG-001', sessionId: 'implementer-session', cwd: generated.root, stateDirectory: generated.stateDirectory, profileRegistry: generated.profileRegistry, riskPolicy: generated.riskPolicy, actionAuthority: generated.actionAuthority });
  assert.equal(controllerReplay.accepted, true);
  assert.equal(controllerReplay.replay, true);
  const driftedRegistry = structuredClone(generated.profileRegistry);
  driftedRegistry.version += 1;
  assert.match(completeLifecycleTask({ taskId: 'ORG-001', sessionId: 'implementer-session', cwd: generated.root, stateDirectory: generated.stateDirectory, profileRegistry: driftedRegistry, riskPolicy: generated.riskPolicy, actionAuthority: generated.actionAuthority }).failures.join('\n'), /proof registry differs/u);
  fs.writeFileSync(path.join(generated.root, 'src', 'post-completion-drift.txt'), 'drift\n');
  assert.match(completeLifecycleTask({ taskId: 'ORG-001', sessionId: 'implementer-session', cwd: generated.root, stateDirectory: generated.stateDirectory, profileRegistry: generated.profileRegistry, riskPolicy: generated.riskPolicy, actionAuthority: generated.actionAuthority }).failures.join('\n'), /repository state differs/u);
});

test('Proves: ORG-GOV-005B; Test type: claim recovery; Surface: attempt state; Authority: bounded completion lease; Killer mutation: strand a killed hook forever or reclaim it before its proof budget expires; Gated command: npm test', () => {
  const fixture = acceptedFixture({ claim: false });
  const claimedAt = new Date('2026-01-01T00:00:00.000Z');
  claimTaskAttempt({ stateDirectory: fixture.stateDirectory, taskId: 'ORG-001', sessionId: 'implementer-session', now: claimedAt });
  assert.throws(() => claimTaskAttempt({ stateDirectory: fixture.stateDirectory, taskId: 'ORG-001', sessionId: 'implementer-session', now: new Date(claimedAt.getTime() + 34 * 60_000) }), /not claimable/u);
  const reclaimed = claimTaskAttempt({ stateDirectory: fixture.stateDirectory, taskId: 'ORG-001', sessionId: 'implementer-session', now: new Date(claimedAt.getTime() + 36 * 60_000) });
  assert.equal(reclaimed.reclaimed_expired_claim, true);
});

test('Proves: ORG-GOV-005C; Test type: malformed mutation recovery; Surface: completion claim; Authority: structural mutation parser and release path; Killer mutation: emit parseable but empty mutation JSON and wedge the task in completion_claimed; Gated command: npm test', () => {
  const fixture = acceptedFixture({ claim: false });
  const pkgFile = path.join(fixture.root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  pkg.scripts['proof:mutation'] = "node -e \"console.log('MUTATION_RECEIPT_JSON:{}')\"";
  fs.writeFileSync(pkgFile, JSON.stringify(pkg));
  const result = completeLifecycleTask({
    taskId: 'ORG-001',
    sessionId: 'implementer-session',
    cwd: fixture.root,
    stateDirectory: fixture.stateDirectory,
    profileRegistry: fixture.profileRegistry
  });
  assert.equal(result.accepted, false);
  assert.match(result.failures.join('\n'), /invalid structure/u);
  assert.equal(loadTaskAttempt(fixture.stateDirectory, 'ORG-001').state, 'accepted');
});

test('Proves: ORG-GOV-005D; Test type: integration-base binding; Surface: repository authority; Authority: project profile registry; Killer mutation: hardcode origin\/main for a project whose integration branch is develop; Gated command: npm test', () => {
  const root = fixtureRepository();
  const profileRegistry = registry();
  profileRegistry.integration_branch = 'develop';
  let observedBaseRef;
  const repositoryProvider = (_cwd, options) => {
    observedBaseRef = options?.baseRef;
    return { binding: { root_sha256: '1'.repeat(64), head: '2'.repeat(40), base: '3'.repeat(40), diff_sha256: '4'.repeat(64) }, changed_files: [] };
  };
  const result = acceptLifecycleTask({
    taskId: 'ORG-001',
    contract: contract(),
    sessionId: 'base-session',
    implementerId: 'base-agent',
    completionMode: 'implementation',
    cwd: root,
    profileRegistry,
    repositoryProvider
  });
  assert.equal(result.accepted, true, result.failures.join('\n'));
  assert.equal(observedBaseRef, 'origin/develop');
});

test('Proves: ORG-GOV-005E; Test type: integration-branch mutation; Surface: repository authority; Authority: project profile registry; Killer mutation: silently fall back to origin/main for a missing or malformed integration branch; Gated command: npm test', () => {
  for (const branch of [undefined, '', '!!!', '-main', 'feature//proof', 'feature/../main', 'HEAD', '.hidden', 'release.lock']) {
    assert.equal(isValidIntegrationBranch(branch), false, `${branch ?? '<missing>'} must fail closed`);
    assert.throws(() => integrationBranchBaseRef({ integration_branch: branch }), /explicit safe Git branch name/u);
    let repositoryCalled = false;
    const result = acceptLifecycleTask({
      taskId: 'ORG-001',
      contract: contract(),
      sessionId: 'invalid-branch-session',
      implementerId: 'invalid-branch-agent',
      completionMode: 'implementation',
      cwd: fixtureRepository(),
      profileRegistry: { ...registry(), integration_branch: branch },
      repositoryProvider: () => {
        repositoryCalled = true;
        throw new Error('repository provider must not be reached');
      }
    });
    assert.equal(result.accepted, false);
    assert.match(result.failures.join('\n'), /explicit safe Git branch name/u);
    assert.equal(repositoryCalled, false);
  }
  for (const branch of ['main', 'develop', 'feature/proof-v2', 'release_2026.07']) assert.equal(isValidIntegrationBranch(branch), true);
});

test('Proves: ORG-GOV-005F; Test type: provider-identity mutation; Surface: generic bootstrap role registry; Authority: agent file frontmatter; Killer mutation: change a registered reviewer file frontmatter name while leaving the registry and file path intact; Gated command: npm test', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'role-provider-'));
  const relative = '.claude/agents/adversarial-reviewer.md';
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '---\nname: adversarial-reviewer\ndescription: Reviews implementation evidence.\n---\n');
  const roles = [{ name: 'adversarial-reviewer', file: relative }];
  assert.deepEqual(validateRegisteredAgentRoleProviders(roles, root), []);
  fs.writeFileSync(file, '---\nname: wrong-provider\ndescription: Reviews implementation evidence.\n---\n');
  assert.match(validateRegisteredAgentRoleProviders(roles, root).join('\n'), /frontmatter name does not match/u);
});

test('Proves: ORG-GOV-005G; Test type: completion-mode mutation; Surface: lifecycle role dispatch; Authority: role provider mode; Killer mutation: let a read-only adversarial reviewer satisfy an implementation task role; Gated command: npm test', () => {
  const profileRegistry = registry();
  profileRegistry.lifecycle_roles_by_completion_mode['read-only'].push('adversarial-reviewer');
  const providerModes = new Map([
    ['codex-backend-implementer', 'implementation'],
    ['adversarial-reviewer', 'read-only']
  ]);
  assert.deepEqual(validateLifecycleRoleModes(profileRegistry.lifecycle_roles_by_completion_mode, providerModes), []);
  const mutatedModes = structuredClone(profileRegistry.lifecycle_roles_by_completion_mode);
  mutatedModes.implementation = ['adversarial-reviewer'];
  assert.match(validateLifecycleRoleModes(mutatedModes, providerModes).join('\n'), /not an implementation-capable provider/u);

  const implementationContract = contract();
  implementationContract.execution.implementer_role = 'adversarial-reviewer';
  const result = acceptLifecycleTask({
    taskId: implementationContract.id,
    contract: implementationContract,
    sessionId: 'reviewer-implementation-session',
    implementerId: 'reviewer-agent',
    completionMode: 'implementation',
    cwd: fixtureRepository(),
    profileRegistry,
    repositoryProvider: () => ({ binding: { root_sha256: '1'.repeat(64), head: '2'.repeat(40), base: '3'.repeat(40), diff_sha256: '4'.repeat(64) }, changed_files: [] })
  });
  assert.equal(result.accepted, false);
  assert.match(result.failures.join('\n'), /No registered platform role permits .* in implementation completion mode/u);
});

test('Proves: ORG-GOV-006; Test type: action-authority mutation; Surface: proof runner; Authority: registered local profile; Killer mutation: register npm run migrate and verify it never executes; Gated command: npm test', () => {
  const root = fixtureRepository();
  const unsafe = {
    id: 'unsafe',
    classification: 'local_non_mutating',
    safe_local_only: true,
    capabilities: ['control_plane_completion'],
    commands: [{ id: 'bad', argv: ['npm', 'run', 'migrate'], timeout_ms: 30_000, parser: { kind: 'nonempty' } }]
  };
  assert.match(validateSafeProofProfile(unsafe, { cwd: root, actionAuthority: loadActionAuthority() }).join('\n'), /human-gated/u);
  assert.equal(fs.existsSync(path.join(root, 'sentinel-migrate')), false);

  const packageFile = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  pkg.scripts['proof:delegates'] = 'npm run migrate';
  pkg.scripts['preproof:pass'] = 'npm run migrate';
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2));
  const delegated = structuredClone(unsafe);
  delegated.commands[0].argv = ['npm', 'run', 'proof:delegates'];
  assert.match(validateSafeProofProfile(delegated, { cwd: root, actionAuthority: loadActionAuthority() }).join('\n'), /human-gated/u);
  assert.match(validateSafeProofProfile(registry().profiles[0], { cwd: root, actionAuthority: loadActionAuthority() }).join('\n'), /human-gated/u);
  const leakedEnvironment = registry().profiles[0];
  leakedEnvironment.env_allowlist = ['DATABASE_URL'];
  assert.match(validateSafeProofProfile(leakedEnvironment, { cwd: root, actionAuthority: loadActionAuthority() }).join('\n'), /cannot inherit additional environment/u);
  const extraArg = registry().profiles[0];
  extraArg.commands[0].argv.push('--anything');
  assert.match(validateSafeProofProfile(extraArg, { cwd: root, actionAuthority: loadActionAuthority() }).join('\n'), /exact three-part/u);
  const missingMutationTimeout = registry().profiles[0];
  delete missingMutationTimeout.mutation.timeout_ms;
  assert.match(validateSafeProofProfile(missingMutationTimeout, { cwd: root, actionAuthority: loadActionAuthority() }).join('\n'), /mutation timeout must be/u);
  const underBudgetedRegistry = registry();
  underBudgetedRegistry.lifecycle_hook_timeout_ms = 60_000;
  assert.match(validateLifecycleProofBudget(contract(), underBudgetedRegistry).join('\n'), /Aggregate proof budget .* exceeds lifecycle hook timeout/u);
  assert.equal(fs.existsSync(path.join(root, 'sentinel-migrate')), false);
});

test('Proves: ORG-GOV-006B; Test type: output liveness mutation; Surface: proof parser; Authority: parsed command artifact; Killer mutation: return exit zero with no stdout or stderr; Gated command: npm test', () => {
  const parsed = parseCommandOutput({ parser: { kind: 'nonempty', minimum_output_bytes: 1 } }, { exitCode: 0, stdout: '', stderr: '' });
  assert.equal(parsed.status, 'fail');
  assert.match(parsed.failures.join('\n'), /proof output is empty/u);
});

test('Proves: ORG-GOV-006C; Test type: TAP structural parser; Surface: proof parser; Authority: top-level TAP plan and summary; Killer mutation: print a fabricated green summary, failed assertion, mismatched plan, or cancellation with exit zero; Gated command: npm test', () => {
  const command = { parser: { kind: 'tap', minimum_output_bytes: 1, minimum_executed: 1, forbid_skips: true } };
  const parse = (stdout) => parseCommandOutput(command, { exitCode: 0, stdout, stderr: '' });
  const valid = ['TAP version 13', 'ok 1 - real assertion', '1..1', '# tests 1', '# pass 1', '# fail 0', '# cancelled 0', '# skipped 0'].join('\n');
  assert.equal(parse(valid).status, 'pass');
  const summarylessNested = ['TAP version 13', '1..1', 'ok 1 - suite {', '    1..2', '    ok 1 - first', '    ok 2 - second', '}'].join('\n');
  assert.equal(parse(summarylessNested).status, 'pass');
  assert.equal(parse(summarylessNested.replace('    ok 2 - second', '    not ok 2 - hidden failure')).status, 'fail');
  const fabricated = ['TAP version 13', '1..1', '# tests 1', '# pass 1', '# fail 0', '# cancelled 0', '# skipped 0'].join('\n');
  assert.equal(parse(fabricated).status, 'fail');
  assert.equal(parse(valid.replace('ok 1', 'not ok 1').replace('# pass 1', '# pass 0').replace('# fail 0', '# fail 1')).status, 'fail');
  assert.equal(parse(valid.replace('1..1', '1..2')).status, 'fail');
  assert.equal(parse(['TAP version 13', 'ok 1 - first', 'ok 1 - duplicate', '1..2'].join('\n')).status, 'fail');
  assert.equal(parse(valid.replace('# cancelled 0', '# cancelled 1')).status, 'fail');
});

test('Proves: ORG-GOV-007; Test type: collision; Surface: TaskCreated; Authority: attempt controller; Killer mutation: reuse a task id with a replacement contract or session; Gated command: npm test', () => {
  const root = fixtureRepository();
  const stateDirectory = defaultAssuranceStateDirectory(root);
  const args = {
    stateDirectory,
    payloadTaskId: 'ORG-001',
    contract: contract(),
    sessionId: 'session-a',
    implementerId: 'agent-a',
    completionMode: 'implementation',
    repository: collectRepositoryState(root).binding,
    profileRegistry: registry(),
    riskPolicy: loadRiskPolicy(),
    actionAuthority: loadActionAuthority()
  };
  const first = acceptTaskAttempt(args);
  assert.equal(acceptTaskAttempt(args).attempt_id, first.attempt_id, 'identical TaskCreated retry is idempotent');
  assert.throws(() => acceptTaskAttempt({ ...args, sessionId: 'session-b' }), /collision or replay/u);
  assert.throws(() => acceptTaskAttempt({ ...args, implementerId: 'agent-b' }), /collision or replay/u);
  assert.throws(() => acceptTaskAttempt({ ...args, completionMode: 'read-only' }), /collision or replay/u);
  const replacementRegistry = structuredClone(args.profileRegistry);
  replacementRegistry.profiles[0].version = 2;
  assert.throws(() => acceptTaskAttempt({ ...args, profileRegistry: replacementRegistry }), /collision or replay/u);
  fs.writeFileSync(path.join(root, 'src', 'retry-drift.txt'), 'drift\n');
  assert.throws(() => acceptTaskAttempt({ ...args, repository: collectRepositoryState(root).binding }), /collision or replay/u);
  const replacement = contract();
  replacement.product_intent = 'Replace the accepted contract after kickoff.';
  assert.throws(() => acceptTaskAttempt({ ...args, contract: replacement }), /collision or replay/u);
});

test('Proves: ORG-GOV-008; Test type: duplicate receipt mutation; Surface: completion aggregation; Authority: shared governor; Killer mutation: count one signed proof or review receipt twice; Gated command: npm test', () => {
  const generated = generateValidCompletion();
  const duplicated = structuredClone(generated.evidence);
  duplicated.proof_receipts.push(structuredClone(duplicated.proof_receipts[0]));
  duplicated.review_receipts.push(structuredClone(duplicated.review_receipts[0]));
  const failures = validateCompletion(contract(), duplicated, generated.context).join('\n');
  assert.match(failures, /Duplicate proof receipt id/u);
  assert.match(failures, /Duplicate proof execution id/u);
  assert.match(failures, /Duplicate review receipt id/u);
});

test('Proves: ORG-GOV-009; Test type: human gate; Surface: completion authority; Authority: risk policy and bound human receipt; Killer mutation: omit the required human approval or reuse the implementer session; Gated command: npm test', () => {
  assert.equal(Object.hasOwn(evidenceRuntime, 'recordHumanGateReceipt'), false);
  assert.equal(Object.hasOwn(lifecycleController, 'recordLifecycleHumanGate'), false);
  const riskPolicy = structuredClone(loadRiskPolicy());
  const gateId = 'destructive_or_irreversible_action';
  riskPolicy.classes.control_plane.human_gate = [gateId];
  const missing = generateValidCompletion({ riskPolicy });
  assert.match(validateCompletion(contract(), missing.evidence, missing.context).join('\n'), /Human approval is required/u);
  const approved = generateValidCompletion({ riskPolicy, humanGates: [gateId] });
  assert.deepEqual(validateCompletion(contract(), approved.evidence, approved.context), []);

  const selfApproved = generateValidCompletion({ riskPolicy });
  const forged = attachExternallyAuthenticatedHumanGateForTest({
    stateDirectory: selfApproved.stateDirectory,
    taskId: 'ORG-001',
    gateId,
    approverId: 'implementer',
    approverSessionId: 'implementer-session',
    repository: selfApproved.current.binding
  });
  selfApproved.evidence.human_gate_receipts = [forged];
  const selfApprovalFailures = validateCompletion(contract(), selfApproved.evidence, selfApproved.context).join('\n');
  assert.match(selfApprovalFailures, /approver identity and session distinct from the implementer/u);
  assert.match(selfApprovalFailures, /Human approval is required/u);
});
