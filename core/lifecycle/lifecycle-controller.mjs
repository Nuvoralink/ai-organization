#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  acceptTaskAttempt,
  buildCompletionEvidence,
  claimTaskAttempt,
  collectRepositoryState,
  commitTaskCompletion,
  defaultAssuranceStateDirectory,
  digestObject,
  integrationBranchBaseRef,
  isValidIntegrationBranch,
  loadTaskAttempt,
  normalizeProfileRegistry,
  recordCompletionReportReceipt,
  recordReviewReceipt,
  releaseTaskAttempt,
  runRequiredProofs,
  sameRepositoryBinding,
  validateLifecycleProofBudget,
  validateSafeProofProfile
} from './evidence-runtime.mjs';
import { classifyMinimumRiskPaths, loadActionAuthority, loadRiskPolicy, validateCompletion, validateTaskContract } from './task-governor.mjs';

function acceptedRepositoryBaseRef(attempt) {
  const baseRef = attempt?.repository_base_ref;
  const prefix = 'origin/';
  const branch = typeof baseRef === 'string' && baseRef.startsWith(prefix) ? baseRef.slice(prefix.length) : undefined;
  if (!isValidIntegrationBranch(branch)) throw new Error('Accepted task attempt has no valid integration-branch repository binding');
  return baseRef;
}

export function acceptLifecycleTask({
  taskId,
  contract,
  sessionId,
  implementerId,
  completionMode,
  cwd,
  stateDirectory = defaultAssuranceStateDirectory(cwd),
  profileRegistry,
  riskPolicy = loadRiskPolicy(),
  actionAuthority = loadActionAuthority(),
  repositoryProvider = collectRepositoryState
}) {
  const failures = validateTaskContract(contract, { riskPolicy });
  if (contract?.id !== taskId) failures.push('Payload task id must exactly match the task contract id');
  const expectedMode = contract?.completion?.tier === 'analysis' ? 'read-only' : 'implementation';
  if (completionMode !== expectedMode) failures.push(`Completion mode must be ${expectedMode} for contract tier ${contract?.completion?.tier ?? '<missing>'}`);
  const allowedRoles = new Set(profileRegistry?.lifecycle_roles_by_completion_mode?.[expectedMode] ?? []);
  if (!allowedRoles.has(contract?.execution?.implementer_role)) failures.push(`No registered platform role permits ${contract?.execution?.implementer_role ?? '<missing>'} in ${expectedMode} completion mode`);
  if (expectedMode === 'implementation') {
    const pathClassification = classifyMinimumRiskPaths(contract?.paths?.edit, profileRegistry);
    for (const file of pathClassification.unclassified) failures.push(`Editable path has no minimum-risk classification and fails closed: ${file}`);
    for (const risk of pathClassification.risks) if (!(contract?.risk?.classes ?? []).includes(risk)) failures.push(`Editable paths require undeclared minimum risk class: ${risk}`);
    const supported = new Set(profileRegistry?.lifecycle_supported_risk_classes ?? []);
    for (const risk of contract?.risk?.classes ?? []) if (!supported.has(risk)) failures.push(`No lifecycle assurance provider is registered for risk class: ${risk}`);
    failures.push(...validateLifecycleProofBudget(contract, profileRegistry));
  }
  const profiles = new Map(normalizeProfileRegistry(profileRegistry).map((profile) => [profile.id, profile]));
  for (const proof of (contract?.proofs ?? []).filter((candidate) => candidate.required)) {
    const profile = profiles.get(proof.profile_id);
    if (!profile) failures.push(`Registered proof profile is missing: ${proof.profile_id}`);
    else failures.push(...validateSafeProofProfile(profile, { cwd, actionAuthority }).map((failure) => `${proof.id}: ${failure}`));
  }
  if (failures.length > 0) return { accepted: false, failures: [...new Set(failures)] };
  try {
    const baseRef = integrationBranchBaseRef(profileRegistry);
    const repository = repositoryProvider(cwd, { baseRef });
    const attempt = acceptTaskAttempt({
      stateDirectory,
      payloadTaskId: taskId,
      contract,
      sessionId,
      implementerId,
      completionMode,
      repository: repository.binding,
      profileRegistry,
      riskPolicy,
      actionAuthority,
      repositoryBaseRef: baseRef
    });
    return { accepted: true, failures: [], attempt_id: attempt.attempt_id, contract_sha256: attempt.contract_sha256 };
  } catch (error) {
    return { accepted: false, failures: [error.message] };
  }
}

export function completeLifecycleTask({
  taskId,
  sessionId,
  cwd,
  stateDirectory = defaultAssuranceStateDirectory(cwd),
  profileRegistry,
  riskPolicy = loadRiskPolicy(),
  actionAuthority = loadActionAuthority(),
  repositoryProvider = collectRepositoryState
}) {
  let claimed;
  try {
    claimed = claimTaskAttempt({ stateDirectory, taskId, sessionId });
  } catch (error) {
    return { accepted: false, failures: [error.message] };
  }
  if (claimed.already_completed) {
    const replayFailures = [];
    if (claimed.attempt.profile_registry_sha256 !== digestObject(profileRegistry)) replayFailures.push('Completed replay proof registry differs from the accepted attempt');
    if (claimed.attempt.risk_policy_sha256 !== digestObject(riskPolicy)) replayFailures.push('Completed replay risk policy differs from the accepted attempt');
    if (claimed.attempt.action_authority_sha256 !== digestObject(actionAuthority)) replayFailures.push('Completed replay action authority differs from the accepted attempt');
    try {
      const current = repositoryProvider(cwd, { baseRef: acceptedRepositoryBaseRef(claimed.attempt) });
      if (!sameRepositoryBinding(current.binding, claimed.attempt.completion_receipt?.repository)) replayFailures.push('Completed replay repository state differs from the stored completion receipt');
    } catch (error) { replayFailures.push(error.message); }
    if (replayFailures.length > 0) return { accepted: false, replay: false, failures: replayFailures };
    return {
      accepted: true,
      replay: true,
      failures: [],
      receipt_sha256: claimed.attempt.completion_receipt_sha256
    };
  }
  const attempt = claimed.attempt;
  let baseRef;
  const failures = [];
  try { baseRef = acceptedRepositoryBaseRef(attempt); }
  catch (error) { failures.push(error.message); }
  if (!attempt.completion_report_receipt) failures.push('Completion requires a SubagentStop-bound completion report receipt; TaskCompleted does not carry report evidence');
  if (attempt.profile_registry_sha256 !== digestObject(profileRegistry)) failures.push('Proof registry changed after TaskCreated');
  let current;
  if (baseRef) {
    try { current = repositoryProvider(cwd, { baseRef }); }
    catch (error) { failures.push(error.message); }
  }
  const proofResult = current && failures.length === 0
    ? runRequiredProofs({ contract: attempt.contract, attempt, profileRegistry, actionAuthority, cwd, stateDirectory, repositoryProvider, baseRef })
    : { receipts: [], failures: [] };
  failures.push(...proofResult.failures);
  let finalRepository;
  if (baseRef) {
    try { finalRepository = repositoryProvider(cwd, { baseRef }); }
    catch (error) { failures.push(error.message); }
  }
  if (finalRepository && attempt.completion_mode === 'implementation') {
    const pathClassification = classifyMinimumRiskPaths(finalRepository.changed_files, profileRegistry);
    for (const file of pathClassification.unclassified) failures.push(`Changed file has no minimum-risk classification and fails closed: ${file}`);
    for (const risk of pathClassification.risks) {
      if (!(attempt.contract?.risk?.classes ?? []).includes(risk)) failures.push(`Changed files require undeclared minimum risk class: ${risk}`);
    }
  }
  const evidence = finalRepository ? buildCompletionEvidence({
    contract: attempt.contract,
    attempt,
    repository: finalRepository.binding,
    changedFiles: attempt.completion_mode === 'read-only' ? [] : finalRepository.changed_files,
    proofReceipts: proofResult.receipts
  }) : undefined;
  if (evidence) {
    failures.push(...validateCompletion(attempt.contract, evidence, {
      attempt,
      profileRegistry,
      riskPolicy,
      actionAuthority,
      currentRepository: finalRepository.binding,
      stateDirectory
    }));
  }
  const uniqueFailures = [...new Set(failures)];
  if (uniqueFailures.length > 0) {
    try { releaseTaskAttempt({ stateDirectory, taskId, reason: uniqueFailures.join('\n') }); } catch { /* claimed state remains fail-closed */ }
    return { accepted: false, failures: uniqueFailures };
  }
  const completed = commitTaskCompletion({ stateDirectory, taskId, completionReceipt: evidence });
  return { accepted: true, replay: false, failures: [], receipt_sha256: completed.completion_receipt_sha256, evidence };
}

export function recordLifecycleCompletionReport({ taskId, reporterId, reporterSessionId, reporterRole, report, cwd, stateDirectory = defaultAssuranceStateDirectory(cwd), repositoryProvider = collectRepositoryState }) {
  const attempt = loadTaskAttempt(stateDirectory, taskId);
  if (!attempt) throw new Error(`No accepted task attempt exists for ${taskId}.`);
  const repository = repositoryProvider(cwd, { baseRef: acceptedRepositoryBaseRef(attempt) });
  return recordCompletionReportReceipt({ stateDirectory, taskId, reporterId, reporterSessionId, reporterRole, repository: repository.binding, report });
}

export function recordLifecycleReview({ taskId, reviewerId, reviewerSessionId, role, verdict, findingCount, unresolvedFindingCount, cwd, stateDirectory = defaultAssuranceStateDirectory(cwd), repositoryProvider = collectRepositoryState, riskPolicy = loadRiskPolicy() }) {
  const attempt = loadTaskAttempt(stateDirectory, taskId);
  if (!attempt) throw new Error(`No accepted task attempt exists for ${taskId}.`);
  const allowedRoles = new Set((attempt.contract?.risk?.classes ?? []).flatMap((risk) => riskPolicy.classes?.[risk]?.required_roles ?? []));
  if (!allowedRoles.has(role)) throw new Error(`Reviewer role is not required by the accepted contract risk policy: ${role}`);
  const repository = repositoryProvider(cwd, { baseRef: acceptedRepositoryBaseRef(attempt) });
  return recordReviewReceipt({
    stateDirectory,
    taskId,
    reviewerId,
    reviewerSessionId,
    role,
    repository: repository.binding,
    verdict,
    findingCount,
    unresolvedFindingCount
  });
}

function cli(argv) {
  const [command, taskId] = argv;
  const cwd = process.cwd();
  if (command === 'status' && taskId) {
    const attempt = loadTaskAttempt(defaultAssuranceStateDirectory(cwd), taskId);
    console.log(JSON.stringify(attempt ? { task_id: attempt.task_id, attempt_id: attempt.attempt_id, state: attempt.state, contract_sha256: attempt.contract_sha256 } : null));
    return attempt ? 0 : 1;
  }
  console.error('Usage: lifecycle-controller.mjs status <task-id>. Review receipts come only from platform SubagentStop adapters; human gates require an external trusted approval provider.');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = cli(process.argv.slice(2));
