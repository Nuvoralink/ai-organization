#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateJsonAgainstSchema } from '../schema/validate-json-schema.mjs';
import { assuranceSchemaFile, validateTaskAssuranceSchema } from '../schema/task-assurance.mjs';
import { detectCycles, detectOrphans, validateRequires } from '../coordination/dependencyGraph.mjs';
import {
  digestObject,
  normalizeProfileRegistry,
  openEvidenceArtifact,
  sameRepositoryBinding,
  sha256,
  verifyAttestation,
} from './evidence-runtime.mjs';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const RISK_CLASSES = new Set([
  'frontend',
  'auth',
  'security',
  'privacy',
  'billing',
  'database',
  'data_migration',
  'provider',
  'ai_semantics',
  'production',
  'destructive',
  'external_contact',
  'architecture',
  'documentation',
  'control_plane',
]);
const REVIEW_TIERS = new Set(['review_verified', 'deployed_verified']);
const DEFAULT_REQUIRED_CONTROLS = new Set([
  'task_assurance_contract',
  'blast_radius_both_directions',
  'test_with_killer_mutation',
  'actual_diff_review',
  'doctrine_loop_closure',
]);
const BUILTIN_RISK_PATH_RULES = Object.freeze([
  {
    riskClass: 'control_plane',
    pattern:
      /(?:^|\/)(?:\.ai-organization|\.claude|\.cursor\/rules|core\/lifecycle|scripts\/claude-lifecycle-hook|scripts\/task-governor)(?:\/|$)|(?:^|\/)(?:task-assurance|task-evidence|risk-controls|action-authority)[^/]*$/iu,
  },
  { riskClass: 'database', pattern: /(?:^|\/)(?:prisma|migrations?)(?:\/|$)|\.sql$/iu },
  { riskClass: 'frontend', pattern: /(?:^|\/)(?:frontend|app|pages|components)(?:\/|$)/iu },
  {
    riskClass: 'auth',
    pattern: /(?:^|\/)[^/]*(?:auth|rbac|permission|session|cookie)[^/]*(?:\/|$)/iu,
  },
  {
    riskClass: 'security',
    pattern: /(?:^|\/)[^/]*(?:security|secret|encryption|upload)[^/]*(?:\/|$)/iu,
  },
  { riskClass: 'privacy', pattern: /(?:^|\/)[^/]*(?:privacy|retention|redaction)[^/]*(?:\/|$)/iu },
  {
    riskClass: 'provider',
    pattern: /(?:^|\/)[^/]*(?:provider|webhook|telnyx|dialpad|stripe)[^/]*(?:\/|$)/iu,
  },
  {
    riskClass: 'ai_semantics',
    pattern: /(?:^|\/)[^/]*(?:prompt|semantic|coaching|analysis)[^/]*(?:\/|$)/iu,
  },
  { riskClass: 'documentation', pattern: /(?:^|\/)docs(?:\/|$)|\.md$/iu },
]);

function installedFile(relativeCandidates) {
  const found = relativeCandidates
    .map((candidate) => path.resolve(moduleDirectory, candidate))
    .find((candidate) => fs.existsSync(candidate));
  if (!found)
    throw new Error(
      `Required assurance authority is not installed: ${relativeCandidates.join(' | ')}`,
    );
  return found;
}

export function loadRiskPolicy() {
  return JSON.parse(
    fs.readFileSync(
      installedFile([
        '../../policies/risk-controls.v1.json',
        '../../../policies/risk-controls.v1.json',
      ]),
      'utf8',
    ),
  );
}

export function loadActionAuthority() {
  return JSON.parse(
    fs.readFileSync(
      installedFile([
        '../../policies/action-authority.v1.json',
        '../../../policies/action-authority.v1.json',
      ]),
      'utf8',
    ),
  );
}

function normalize(value) {
  return String(value).replaceAll('\\', '/').replace(/^\.\//u, '').replace(/\/+/gu, '/');
}

function patternRegex(pattern) {
  const normalized = normalize(pattern);
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/gu, '\\$&');
  const globbed = escaped
    .replaceAll('**', '\u0000')
    .replaceAll('*', '[^/]*')
    .replaceAll('\u0000', '.*');
  return new RegExp(`^${globbed}${normalized.endsWith('/') ? '.*' : ''}$`, 'u');
}

export function matchesAny(file, patterns) {
  const normalized = normalize(file);
  return patterns.some((pattern) => patternRegex(pattern).test(normalized));
}

export function deriveMinimumRiskClasses(paths, profileRegistry = {}) {
  return classifyMinimumRiskPaths(paths, profileRegistry).risks;
}

export function classifyMinimumRiskPaths(paths, profileRegistry = {}) {
  const risks = new Set();
  const unclassified = [];
  const normalizedPaths = (paths ?? []).map(normalize);
  const rawProfiles = Array.isArray(profileRegistry?.profiles)
    ? new Map(profileRegistry.profiles.map((profile) => [profile.id, profile]))
    : new Map(
        Object.entries(profileRegistry?.profiles ?? {}).map(([id, profile]) => [
          id,
          { id, ...profile },
        ]),
      );
  for (const file of normalizedPaths) {
    let matched = false;
    for (const rule of BUILTIN_RISK_PATH_RULES) {
      if (!rule.pattern.test(file)) continue;
      risks.add(rule.riskClass);
      matched = true;
    }
    for (const rule of profileRegistry?.risk_path_rules ?? []) {
      const include = Array.isArray(rule?.include)
        ? rule.include
        : rawProfiles.get(rule?.profile_id)?.include;
      if (
        !RISK_CLASSES.has(rule?.risk_class) ||
        !Array.isArray(include) ||
        !matchesAny(file, include)
      )
        continue;
      risks.add(rule.risk_class);
      matched = true;
    }
    if (!matched) unclassified.push(file);
  }
  return { risks: [...risks].sort(), unclassified: [...new Set(unclassified)].sort() };
}

function nonEmptyStrings(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function policyRequirements(contract, riskPolicy) {
  const roles = new Set();
  const proofs = new Set();
  const humanGates = new Set();
  const failures = [];
  if (contract?.completion?.tier === 'analysis') return { roles, proofs, humanGates, failures };
  for (const risk of contract?.risk?.classes ?? []) {
    const row = riskPolicy?.classes?.[risk];
    if (!row) {
      failures.push(`Risk policy has no enforced row for: ${risk}`);
      continue;
    }
    for (const role of row.required_roles ?? []) roles.add(role);
    for (const proof of row.required_proofs ?? []) proofs.add(proof);
    for (const gate of row.human_gate ?? []) humanGates.add(gate);
  }
  return { roles, proofs, humanGates, failures };
}

export function validateTaskDependencyGraph(tasks, knownTaskIds) {
  if (!Array.isArray(tasks)) return ['Task dependency graph must be an array'];
  const failures = [];
  const known = new Set(
    tasks
      .map((task) => task?.id)
      .filter((taskId) => typeof taskId === 'string' && taskId.length > 0),
  );
  if (typeof knownTaskIds?.[Symbol.iterator] === 'function')
    for (const taskId of knownTaskIds) known.add(taskId);
  for (const task of tasks)
    failures.push(
      ...validateRequires(task?.requires).map(
        (failure) => `${task?.id ?? '<missing task id>'}: ${failure}`,
      ),
    );
  const cycle = detectCycles(tasks);
  if (cycle)
    failures.push(`Task dependency graph contains a cycle: ${cycle.cyclePath.join(' -> ')}`);
  const orphan = detectOrphans(tasks, known);
  if (orphan)
    failures.push(
      `Task ${orphan.taskId ?? '<missing task id>'} requires unknown task id ${orphan.edge.task_id}`,
    );
  return [...new Set(failures)];
}

export function validateTaskContract(contract, { riskPolicy = loadRiskPolicy() } = {}) {
  const failures = validateTaskAssuranceSchema(contract);
  if (!contract || typeof contract !== 'object') return ['Task contract must be an object'];
  if (contract.schema_version === 3) {
    failures.push(...validateRequires(contract.requires));
    const selfCycle = detectCycles([contract]);
    if (selfCycle)
      failures.push(`Task dependency graph contains a cycle: ${selfCycle.cyclePath.join(' -> ')}`);
  }
  if (typeof contract.id !== 'string' || contract.id.length < 2)
    failures.push('Task id is required');
  if (typeof contract.product_intent !== 'string' || contract.product_intent.trim().length < 10)
    failures.push('Product intent must be substantive');
  if (!contract.paths || !nonEmptyStrings(contract.paths.edit))
    failures.push('At least one editable path is required');
  if (!Array.isArray(contract.paths?.read_only)) failures.push('Read-only paths must be declared');
  if (!contract.risk || !nonEmptyStrings(contract.risk.classes))
    failures.push('At least one risk class is required');
  for (const risk of contract.risk?.classes ?? [])
    if (!RISK_CLASSES.has(risk)) failures.push(`Unknown risk class: ${risk}`);
  if (!Array.isArray(contract.proofs) || contract.proofs.length === 0)
    failures.push('At least one proof is required');
  const declaredDefaults = new Set(riskPolicy?.default_required ?? []);
  for (const control of DEFAULT_REQUIRED_CONTROLS)
    if (!declaredDefaults.has(control))
      failures.push(`Risk policy default control is missing: ${control}`);
  for (const control of declaredDefaults)
    if (!DEFAULT_REQUIRED_CONTROLS.has(control))
      failures.push(`Risk policy default control has no enforcement mapping: ${control}`);

  const proofIds = new Set();
  const coveredRisks = new Set();
  const coveredCapabilities = new Set();
  for (const proof of contract.proofs ?? []) {
    if (!proof?.id || proofIds.has(proof.id))
      failures.push(`Duplicate or missing proof id: ${proof?.id ?? '<missing>'}`);
    proofIds.add(proof?.id);
    if (
      !proof?.profile_id ||
      !proof?.capability ||
      !proof?.proves ||
      !proof?.authority ||
      !proof?.surface
    )
      failures.push(
        `Proof ${proof?.id ?? '<missing>'} lacks profile/capability/proves/authority/surface`,
      );
    if (!nonEmptyStrings(proof?.risk_classes))
      failures.push(`Proof ${proof?.id ?? '<missing>'} lacks risk-class coverage`);
    for (const risk of proof?.risk_classes ?? [])
      if (!(contract.risk?.classes ?? []).includes(risk))
        failures.push(`Proof ${proof.id} claims undeclared risk class: ${risk}`);
    if (
      !proof?.mutation ||
      typeof proof.mutation.required !== 'boolean' ||
      !proof.mutation.rationale
    )
      failures.push(
        `Proof ${proof?.id ?? '<missing>'} lacks an explicit mutation applicability decision`,
      );
    if (proof?.mutation?.required === true && !proof.mutation.case_id)
      failures.push(`Proof ${proof.id} requires a registered mutation case id`);
    if (proof?.mutation?.required === false && proof.mutation.case_id !== null)
      failures.push(
        `Proof ${proof.id} must use a null mutation case when mutation is not applicable`,
      );
    if (proof?.required) {
      for (const risk of proof.risk_classes ?? []) coveredRisks.add(risk);
      if (proof.capability) coveredCapabilities.add(proof.capability);
    }
  }
  for (const risk of contract.risk?.classes ?? [])
    if (!coveredRisks.has(risk)) failures.push(`Risk class has no required proof: ${risk}`);
  const policy = policyRequirements(contract, riskPolicy);
  failures.push(...policy.failures);
  for (const capability of policy.proofs)
    if (!coveredCapabilities.has(capability))
      failures.push(`Risk policy requires proof capability: ${capability}`);
  if (contract.completion?.tier === 'analysis') {
    const readOnlyProof = (contract.proofs ?? []).find(
      (proof) =>
        proof.required &&
        proof.profile_id === 'internal-read-only' &&
        proof.capability === 'read_only_integrity',
    );
    if (!readOnlyProof || readOnlyProof.mutation?.required !== false)
      failures.push(
        'Analysis completion requires the non-mutating internal read-only integrity profile',
      );
    const readOnlyActions = new Set(['read', 'analyze', 'test', 'safe_read_only_check']);
    for (const action of contract.action_authority?.allowed ?? [])
      if (!readOnlyActions.has(action))
        failures.push(`Analysis completion cannot authorize state-changing action: ${action}`);
    if ((contract.action_authority?.conditional ?? []).length > 0)
      failures.push('Analysis completion cannot carry conditional state-changing authority');
  }
  if (
    contract.completion?.tier !== 'analysis' &&
    (contract.risk?.classes ?? []).includes('control_plane')
  ) {
    const controlProof = (contract.proofs ?? []).find(
      (proof) => proof.required && proof.capability === 'control_plane_completion',
    );
    if (!controlProof?.mutation?.required)
      failures.push('Control-plane completion requires an executed registered mutation receipt');
  }
  if (
    contract.completion?.tier === 'deployed_verified' &&
    !(contract.risk?.classes ?? []).includes('production')
  )
    failures.push('deployed_verified completion must declare production risk');
  return [...new Set(failures)];
}

export function validateTaskEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return ['Evidence must be an object'];
  return validateJsonAgainstSchema(assuranceSchemaFile('task-evidence.v2.schema.json'), evidence);
}

function profileMap(registry) {
  return new Map(normalizeProfileRegistry(registry).map((profile) => [profile.id, profile]));
}

function validateCommandReceipt(actual, expected, context, label) {
  const failures = [];
  if (
    actual.command_id !== expected.id ||
    JSON.stringify(actual.argv) !== JSON.stringify(expected.argv)
  )
    failures.push(`${label}: command argv drifted from the registered profile`);
  if (actual.exit_code !== 0)
    failures.push(`${label}: command failed with exit ${actual.exit_code}`);
  if (
    actual.parser?.status !== 'pass' ||
    actual.parser?.executed_count < (expected.parser?.minimum_executed ?? 1)
  )
    failures.push(`${label}: parsed output did not prove an applicable execution`);
  if (expected.parser?.forbid_skips === true && actual.parser?.skipped_count !== 0)
    failures.push(`${label}: required execution contained skipped cases`);
  try {
    const artifact = openEvidenceArtifact(actual.artifact, context.stateDirectory);
    for (const field of [
      'command_id',
      'argv',
      'exit_code',
      'stdout_sha256',
      'stderr_sha256',
      'stdout_bytes',
      'stderr_bytes',
      'parser',
    ]) {
      if (digestObject(artifact[field]) !== digestObject(actual[field]))
        failures.push(`${label}: opened artifact disagrees with command receipt field ${field}`);
    }
  } catch (error) {
    failures.push(`${label}: output artifact could not be opened and verified (${error.message})`);
  }
  return failures;
}

function validateMutationReceipt(actual, expectedProof, profile, context, label) {
  const failures = [];
  if (!actual) return [`${label}: registered mutation receipt is missing`];
  if (
    actual.case_id !== expectedProof.mutation.case_id ||
    profile.mutation?.case_id !== actual.case_id
  )
    failures.push(`${label}: mutation case id drifted`);
  if (actual.baseline?.exit_code !== 0) failures.push(`${label}: mutation baseline did not pass`);
  if (!Number.isInteger(actual.mutant?.exit_code) || actual.mutant.exit_code === 0)
    failures.push(`${label}: mutant did not fail`);
  if (actual.restored?.digest !== actual.baseline?.digest)
    failures.push(`${label}: mutation fixture was not restored`);
  if (
    actual.post_restore?.exit_code !== 0 ||
    actual.post_restore?.digest !== actual.baseline?.digest
  )
    failures.push(`${label}: post-restore proof did not pass on the original fixture`);
  try {
    const artifact = openEvidenceArtifact(actual.artifact, context.stateDirectory);
    if (
      artifact.parser_status !== 'pass' ||
      artifact.case_id !== actual.case_id ||
      artifact.execution_id !== actual.harness_execution_id ||
      artifact.harness_exit_code !== 0
    )
      failures.push(`${label}: mutation artifact parser did not validate the registered case`);
    if (
      artifact.observed?.baseline?.digest !== actual.baseline?.digest ||
      artifact.observed?.restored?.digest !== actual.restored?.digest
    )
      failures.push(`${label}: mutation artifact disagrees with the receipt`);
    if (artifact.observed?.mutant?.exit_code !== actual.mutant?.exit_code)
      failures.push(`${label}: mutation failure result disagrees with the opened artifact`);
    if (
      sha256(artifact.observed?.mutant?.diagnostic ?? '') !== actual.mutant?.diagnostic_sha256 ||
      !String(artifact.observed?.mutant?.diagnostic ?? '').includes(
        profile.mutation?.expected_diagnostic ?? '',
      )
    )
      failures.push(
        `${label}: mutation failed for a different diagnostic than the registered case`,
      );
  } catch (error) {
    failures.push(
      `${label}: mutation artifact could not be opened and verified (${error.message})`,
    );
  }
  return failures;
}

function validateReviewReceipts(contract, evidence, context, policy) {
  const failures = [];
  const ids = new Set();
  const validRoles = new Set();
  for (const review of evidence.review_receipts ?? []) {
    if (ids.has(review.review_id))
      failures.push(`Duplicate review receipt id: ${review.review_id}`);
    ids.add(review.review_id);
    if (!verifyAttestation(review, context.attempt.secret_hex))
      failures.push(`Review receipt attestation is invalid: ${review.review_id}`);
    if (
      review.attempt_id !== context.attempt.attempt_id ||
      review.contract_sha256 !== context.attempt.contract_sha256
    )
      failures.push(`Review receipt is bound to another task attempt: ${review.review_id}`);
    if (review.reviewer_id_sha256 === evidence.completion_report_receipt?.reporter_id_sha256)
      failures.push(`Independent review reused the implementer platform run: ${review.review_id}`);
    if (!sameRepositoryBinding(review.repository, evidence.repository))
      failures.push(
        `Review receipt is stale for the completed repository state: ${review.review_id}`,
      );
    if (review.verdict !== 'pass' || review.unresolved_finding_count !== 0)
      failures.push(`Review receipt has unresolved findings: ${review.review_id}`);
    if (review.verdict === 'pass' && review.unresolved_finding_count === 0)
      validRoles.add(review.role);
  }
  for (const role of policy.roles)
    if (!validRoles.has(role))
      failures.push(`Risk policy requires a bound independent review from role: ${role}`);
  if (REVIEW_TIERS.has(contract.completion?.tier) && validRoles.size === 0)
    failures.push('Review-verified completion requires a bound independent review receipt');
  return failures;
}

function validateCompletionReportReceipt(evidence, context) {
  const receipt = evidence.completion_report_receipt;
  const failures = [];
  if (!receipt) return ['Bound completion report receipt is missing'];
  if (!verifyAttestation(receipt, context.attempt.secret_hex))
    failures.push('Completion report receipt attestation is invalid');
  if (
    receipt.attempt_id !== context.attempt.attempt_id ||
    receipt.contract_sha256 !== context.attempt.contract_sha256
  )
    failures.push('Completion report receipt belongs to another task attempt');
  if (!sameRepositoryBinding(receipt.repository, evidence.repository))
    failures.push('Completion report receipt is stale for the completed repository state');
  if (
    digestObject(receipt.unreached_surfaces) !== digestObject(evidence.unreached_surfaces) ||
    receipt.doctrine_loop !== evidence.doctrine_loop
  )
    failures.push('Completion evidence does not match the bound SubagentStop report');
  return failures;
}

function validateHumanGateReceipts(evidence, context, policy) {
  const failures = [];
  const approved = new Set();
  for (const receipt of evidence.human_gate_receipts ?? []) {
    const validAttestation = verifyAttestation(receipt, context.attempt.secret_hex);
    if (!validAttestation)
      failures.push(`Human-gate receipt attestation is invalid: ${receipt.gate_id}`);
    const validBinding =
      receipt.attempt_id === context.attempt.attempt_id &&
      receipt.contract_sha256 === context.attempt.contract_sha256 &&
      sameRepositoryBinding(receipt.repository, evidence.repository);
    if (!validBinding)
      failures.push(
        `Human-gate receipt is stale or belongs to another attempt: ${receipt.gate_id}`,
      );
    const independentApprover =
      receipt.approver_id_sha256 !== context.attempt.implementer_id_sha256 &&
      receipt.approver_session_sha256 !== context.attempt.session_id_sha256;
    if (!independentApprover)
      failures.push(
        `Human-gate receipt must come from an approver identity and session distinct from the implementer: ${receipt.gate_id}`,
      );
    if (validAttestation && validBinding && independentApprover) approved.add(receipt.gate_id);
  }
  for (const gate of policy.humanGates)
    if (!approved.has(gate)) failures.push(`Human approval is required before completion: ${gate}`);
  return failures;
}

export function validateCompletion(contract, evidence, context = {}) {
  const riskPolicy = context.riskPolicy ?? loadRiskPolicy();
  const failures = validateTaskContract(contract, { riskPolicy });
  if (!evidence || typeof evidence !== 'object') return [...failures, 'Evidence must be an object'];
  failures.push(...validateTaskEvidence(evidence));
  if (
    !context.attempt ||
    !context.profileRegistry ||
    !context.actionAuthority ||
    !context.currentRepository ||
    !context.stateDirectory
  ) {
    failures.push(
      'Trusted completion context is required; caller-authored evidence alone is never authoritative',
    );
    return [...new Set(failures)];
  }
  const { attempt } = context;
  if (!['completion_claimed', 'completed'].includes(attempt.state))
    failures.push(`Task attempt is not claimed for completion: ${attempt.state}`);
  if (
    attempt.contract_sha256 !== digestObject(contract) ||
    evidence.contract_sha256 !== attempt.contract_sha256
  )
    failures.push('Contract digest does not match the accepted TaskCreated contract');
  if (
    evidence.task_id !== contract.id ||
    evidence.task_id !== attempt.task_id ||
    evidence.attempt_id !== attempt.attempt_id
  )
    failures.push('Evidence task/attempt identity does not match the accepted contract');
  if (attempt.profile_registry_sha256 !== digestObject(context.profileRegistry))
    failures.push('Proof registry changed after TaskCreated');
  if (attempt.risk_policy_sha256 !== digestObject(riskPolicy))
    failures.push('Risk policy changed after TaskCreated');
  if (attempt.action_authority_sha256 !== digestObject(context.actionAuthority))
    failures.push('Action-authority policy changed after TaskCreated');
  if (!sameRepositoryBinding(evidence.repository, context.currentRepository))
    failures.push('Completion evidence is stale for the current repository state');
  if (
    attempt.completion_mode === 'read-only' &&
    !sameRepositoryBinding(evidence.repository, attempt.repository)
  )
    failures.push('Read-only task changed repository state after TaskCreated');
  if (attempt.completion_mode === 'implementation' && (evidence.changed_files ?? []).length === 0)
    failures.push('Implementation completion cannot claim success with zero changed files');
  for (const file of evidence.changed_files ?? []) {
    if (!matchesAny(file, contract.paths.edit))
      failures.push(`Changed file is outside editable paths: ${normalize(file)}`);
    if (matchesAny(file, contract.paths.read_only ?? []))
      failures.push(`Changed file is read-only: ${normalize(file)}`);
  }

  const profiles = profileMap(context.profileRegistry);
  const proofIds = new Set();
  const runIds = new Set();
  const evidenceById = new Map();
  for (const receipt of evidence.proof_receipts ?? []) {
    if (proofIds.has(receipt.proof_id))
      failures.push(`Duplicate proof receipt id: ${receipt.proof_id}`);
    if (runIds.has(receipt.execution_id))
      failures.push(`Duplicate proof execution id: ${receipt.execution_id}`);
    proofIds.add(receipt.proof_id);
    runIds.add(receipt.execution_id);
    evidenceById.set(receipt.proof_id, receipt);
  }
  const contractProofIds = new Set((contract.proofs ?? []).map((proof) => proof.id));
  for (const id of evidenceById.keys())
    if (!contractProofIds.has(id))
      failures.push(`Unexpected proof receipt is not declared by the contract: ${id}`);

  for (const proof of (contract.proofs ?? []).filter((candidate) => candidate.required)) {
    const actual = evidenceById.get(proof.id);
    const profile = profiles.get(proof.profile_id);
    if (!actual) {
      failures.push(`Required proof was not run: ${proof.id}`);
      continue;
    }
    if (!profile) {
      failures.push(`Required proof profile is not registered: ${proof.profile_id}`);
      continue;
    }
    if (!verifyAttestation(actual, attempt.secret_hex))
      failures.push(`Runner attestation is invalid: ${proof.id}`);
    if (
      actual.attempt_id !== attempt.attempt_id ||
      actual.contract_sha256 !== attempt.contract_sha256
    )
      failures.push(`Proof receipt belongs to another task attempt: ${proof.id}`);
    if (
      actual.profile_id !== profile.id ||
      actual.profile_sha256 !== digestObject(profile) ||
      actual.capability !== proof.capability ||
      !profile.capabilities?.includes(proof.capability)
    )
      failures.push(`Proof receipt does not match the registered profile/capability: ${proof.id}`);
    if (
      !sameRepositoryBinding(actual.repository_before, evidence.repository) ||
      !sameRepositoryBinding(actual.repository_after, evidence.repository)
    )
      failures.push(
        `Proof receipt is stale or proof execution mutated repository state: ${proof.id}`,
      );
    if ((actual.commands ?? []).length !== (profile.commands ?? []).length)
      failures.push(`Proof command count drifted: ${proof.id}`);
    for (
      let index = 0;
      index < Math.min(actual.commands?.length ?? 0, profile.commands?.length ?? 0);
      index += 1
    ) {
      failures.push(
        ...validateCommandReceipt(
          actual.commands[index],
          profile.commands[index],
          context,
          `${proof.id}/${profile.commands[index].id}`,
        ),
      );
    }
    if (proof.mutation?.required)
      failures.push(...validateMutationReceipt(actual.mutation, proof, profile, context, proof.id));
    else if (actual.mutation !== null)
      failures.push(
        `Mutation evidence was supplied for a proof declared non-applicable: ${proof.id}`,
      );
  }

  const policy = policyRequirements(contract, riskPolicy);
  failures.push(...validateCompletionReportReceipt(evidence, context));
  failures.push(...validateReviewReceipts(contract, evidence, context, policy));
  failures.push(...validateHumanGateReceipts(evidence, context, policy));
  if (typeof evidence.doctrine_loop !== 'string' || evidence.doctrine_loop.trim().length === 0)
    failures.push('Doctrine-loop result is required from completion-time evidence');
  if (!Array.isArray(evidence.unreached_surfaces))
    failures.push('Unreached surfaces must be explicit at completion time');
  return [...new Set(failures)];
}

function printResult(label, failures) {
  if (failures.length === 0) {
    console.log(`${label} passed`);
    return 0;
  }
  console.error(`${label} failed`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  return 1;
}

function cli(argv) {
  const [command, contractFile] = argv;
  if (command !== 'validate' || !contractFile) {
    console.error(
      'Usage: task-governor.mjs validate <contract.json>. Completion is authorized only through an accepted task-attempt controller.',
    );
    return 2;
  }
  const contract = JSON.parse(fs.readFileSync(path.resolve(contractFile), 'utf8'));
  return printResult('task contract validation', validateTaskContract(contract));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = cli(process.argv.slice(2));
