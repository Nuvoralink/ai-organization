import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { defaultAssuranceStateDirectory, writeJson } from '../lifecycle/evidence-runtime.mjs';
import {
  promotionReadiness,
  recordCoordinationActivityCoverage,
  recordCoordinationErrorCoverage,
  recordRegistrationCoverage,
} from './coverage.mjs';
import { COORDINATION_MODES, coordinationMode, coordinationPolicy } from './mode.mjs';

const COORDINATION_MODE_SET = new Set(COORDINATION_MODES);

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function gitOutput(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function requireNonEmpty(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireStringArray(value, field, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new TypeError(`${field} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  }
  return value.map((entry, index) => requireNonEmpty(entry, `${field}[${index}]`));
}

function receiptKey(taskId) {
  return crypto.createHash('sha256').update(taskId).digest('hex').slice(0, 32);
}

function receiptPath(repoRoot, taskId) {
  return path.join(
    defaultAssuranceStateDirectory(repoRoot),
    'coordination-claim-receipts',
    `task-${receiptKey(taskId)}.json`,
  );
}

function ownerTokenDigest(ownerToken) {
  return crypto.createHash('sha256').update(ownerToken).digest('hex');
}

function persistClaimReceipt({ repoRoot, taskId, claimId, ownerToken, fencingEpoch }) {
  writeJson(receiptPath(repoRoot, taskId), {
    schema_version: 1,
    task_id: taskId,
    claim_id: claimId,
    owner_token_sha256: ownerTokenDigest(ownerToken),
    fencing_epoch: fencingEpoch,
    recorded_at: new Date().toISOString(),
  });
}

function loadClaimReceipt(repoRoot, taskId) {
  const file = receiptPath(repoRoot, taskId);
  if (!fs.existsSync(file)) return null;
  const receipt = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (
    receipt?.schema_version !== 1 ||
    receipt?.task_id !== taskId ||
    typeof receipt?.claim_id !== 'string' ||
    receipt.claim_id.length === 0 ||
    typeof receipt?.owner_token_sha256 !== 'string' ||
    !Number.isSafeInteger(receipt?.fencing_epoch) ||
    receipt.fencing_epoch <= 0
  ) {
    throw new Error(`Coordination claim receipt is corrupt: ${file}`);
  }
  return { file, receipt };
}

function closeLedger(ledger) {
  try {
    ledger?.close();
  } catch {
    // A close failure cannot change the already-recorded dispatch outcome.
  }
}

function requireAdmissionDecision(decision) {
  if (decision === null || typeof decision !== 'object' || Array.isArray(decision)) {
    throw new TypeError('admission must be a coordination admission decision');
  }
  if (!COORDINATION_MODE_SET.has(decision.configuredMode)) {
    throw new TypeError(`Unsupported configured coordination mode: ${decision.configuredMode}`);
  }
  if (!COORDINATION_MODE_SET.has(decision.effectiveMode)) {
    throw new TypeError(`Unsupported effective coordination mode: ${decision.effectiveMode}`);
  }
  const permittedEffectiveModes =
    decision.configuredMode === 'enforce'
      ? new Set(['observe', 'enforce'])
      : new Set([decision.configuredMode]);
  if (!permittedEffectiveModes.has(decision.effectiveMode)) {
    throw new Error(
      `Coordination mode ${decision.configuredMode} cannot resolve to ${decision.effectiveMode}`,
    );
  }
  return decision;
}

export function coordinationAdmissionDecision({
  repoRoot = process.cwd(),
  policy = coordinationPolicy(repoRoot),
} = {}) {
  const configuredMode = COORDINATION_MODE_SET.has(policy?.mode) ? policy.mode : 'off';
  const acceptNotReady = configuredMode === 'enforce' && policy?.acceptNotReady === true;
  if (configuredMode !== 'enforce') {
    return {
      configuredMode,
      effectiveMode: configuredMode,
      acceptNotReady: false,
      demoted: false,
      readiness: null,
    };
  }

  const readiness = promotionReadiness({ repoRoot });
  const demoted = !readiness.ready && !acceptNotReady;
  return {
    configuredMode,
    effectiveMode: demoted ? 'observe' : 'enforce',
    acceptNotReady,
    demoted,
    readiness,
  };
}

function readinessCodes(readiness) {
  if (!Array.isArray(readiness?.reasons)) return [];
  return readiness.reasons
    .map((reason) => reason?.code)
    .filter((code) => typeof code === 'string' && code.length > 0);
}

export function coordinationAdmissionWarning(admission) {
  const decision = requireAdmissionDecision(admission);
  if (decision.configuredMode !== 'enforce' || decision.readiness?.ready !== false) return null;
  const codes = readinessCodes(decision.readiness);
  const reasonSummary = codes.length > 0 ? codes.join(', ') : 'UNKNOWN_READINESS_FAILURE';
  if (decision.demoted) {
    return `[coordination] ENFORCE demoted to OBSERVE for this dispatch because promotion readiness is unmet: ${reasonSummary}.`;
  }
  if (decision.acceptNotReady) {
    return `[coordination] ENFORCE acceptNotReady override is active despite unmet promotion readiness: ${reasonSummary}.`;
  }
  return null;
}

export function coordinationFailOpenWarning(error) {
  return `[coordination] FAIL-OPEN: coordination could not be evaluated (${errorMessage(error)}); dispatch will proceed.`;
}

export function coordinationRefusalMessage(conflicts) {
  if (!Array.isArray(conflicts) || conflicts.length === 0) {
    throw new TypeError('A coordination refusal requires at least one proven conflict');
  }
  const details = conflicts.map((conflict, index) => {
    const otherTaskId = requireNonEmpty(conflict?.otherTaskId, `conflicts[${index}].otherTaskId`);
    const otherClaimId = requireNonEmpty(
      conflict?.otherClaimId,
      `conflicts[${index}].otherClaimId`,
    );
    const resourceKey = requireNonEmpty(conflict?.resourceKey, `conflicts[${index}].resourceKey`);
    const otherResourceKey = requireNonEmpty(
      conflict?.otherResourceKey,
      `conflicts[${index}].otherResourceKey`,
    );
    return `task ${otherTaskId} (claim ${otherClaimId}): ${resourceKey} overlaps ${otherResourceKey}`;
  });
  return `Resource admission refused by ENFORCE: ${details.join('; ')}`;
}

export async function registerClaim({
  repoRoot,
  taskId,
  attemptId,
  agentKind,
  editPaths,
  readPaths = [],
  ownerToken,
  ownerPid,
  branch,
  worktreePath,
  persistReceipt = false,
  admission,
  modeEpoch,
}) {
  let ledger;
  let decision;
  let mode = coordinationMode(repoRoot);
  try {
    decision = requireAdmissionDecision(admission ?? coordinationAdmissionDecision({ repoRoot }));
    mode = decision.effectiveMode;
    if (mode === 'off') return { skipped: 'mode-off' };

    const resolvedRoot = path.resolve(requireNonEmpty(repoRoot, 'repoRoot'));
    const normalizedTaskId = requireNonEmpty(taskId, 'taskId');
    const normalizedAttemptId = requireNonEmpty(attemptId, 'attemptId');
    const normalizedAgentKind = requireNonEmpty(agentKind, 'agentKind');
    const normalizedOwnerToken = requireNonEmpty(ownerToken, 'ownerToken');
    const normalizedEditPaths = requireStringArray(editPaths, 'editPaths');
    requireStringArray(readPaths, 'readPaths', { allowEmpty: true });
    if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0) {
      throw new TypeError('ownerPid must be a positive integer');
    }

    const [{ expandResourceClaims, repoId }, { openCoordinationLedger }, { RESOURCE_CONFIG }] =
      await Promise.all([
        import('./resourceKey.mjs'),
        import('./ledger.mjs'),
        import('./resourceConfig.mjs'),
      ]);
    const resources = [
      ...new Set(
        normalizedEditPaths.flatMap((entry) =>
          expandResourceClaims(resolvedRoot, entry, RESOURCE_CONFIG),
        ),
      ),
    ];
    ledger = openCoordinationLedger({ cwd: resolvedRoot });
    const result = ledger.admit({
      taskId: normalizedTaskId,
      attemptId: normalizedAttemptId,
      agentKind: normalizedAgentKind,
      repoId: repoId(resolvedRoot),
      branch:
        typeof branch === 'string' && branch.trim() !== ''
          ? branch.trim()
          : gitOutput(['rev-parse', '--abbrev-ref', 'HEAD'], resolvedRoot),
      worktreePath:
        typeof worktreePath === 'string' && worktreePath.trim() !== ''
          ? path.resolve(resolvedRoot, worktreePath.trim())
          : path.resolve(gitOutput(['rev-parse', '--show-toplevel'], resolvedRoot)),
      ownerToken: normalizedOwnerToken,
      ownerPid,
      resources,
      mode,
    });

    const coverageResult = recordRegistrationCoverage({
      repoRoot: resolvedRoot,
      mode,
      modeEpoch,
      conflictCount: result.conflicts.length,
      claimRegistered: result.admitted,
    });
    const decisionResult = {
      configuredMode: decision.configuredMode,
      effectiveMode: decision.effectiveMode,
      acceptNotReady: decision.acceptNotReady,
      demoted: decision.demoted,
      readiness: decision.readiness,
    };
    if (!result.admitted) {
      return {
        refused: true,
        conflicts: result.conflicts,
        ...decisionResult,
        ...(coverageResult.error ? { coverageError: coverageResult.error } : {}),
      };
    }
    if (!result.claimId || !result.fencingEpoch) {
      throw new Error(`${mode} ledger admission did not return a live claim`);
    }

    let receiptError;
    if (persistReceipt) {
      try {
        persistClaimReceipt({
          repoRoot: resolvedRoot,
          taskId: normalizedTaskId,
          claimId: result.claimId,
          ownerToken: normalizedOwnerToken,
          fencingEpoch: result.fencingEpoch,
        });
      } catch (error) {
        receiptError = errorMessage(error);
        recordCoordinationErrorCoverage({ repoRoot: resolvedRoot, mode, modeEpoch });
      }
    }
    return {
      claimId: result.claimId,
      fencingEpoch: result.fencingEpoch,
      conflicts: result.conflicts,
      ...decisionResult,
      ...(coverageResult.error ? { coverageError: coverageResult.error } : {}),
      ...(receiptError ? { receiptError } : {}),
    };
  } catch (error) {
    recordCoordinationErrorCoverage({ repoRoot, mode, modeEpoch });
    return { error: errorMessage(error) };
  } finally {
    closeLedger(ledger);
  }
}

export async function releaseClaim({ repoRoot, claimId, taskId, ownerToken, fencingEpoch }) {
  const mode = coordinationMode(repoRoot);
  if (mode === 'off') return { skipped: 'mode-off' };

  let ledger;
  try {
    const resolvedRoot = path.resolve(requireNonEmpty(repoRoot, 'repoRoot'));
    const normalizedOwnerToken = requireNonEmpty(ownerToken, 'ownerToken');
    let resolvedClaimId = claimId;
    let resolvedFencingEpoch = fencingEpoch;
    let receiptFile;
    if (
      (typeof resolvedClaimId !== 'string' || resolvedClaimId.trim() === '') &&
      typeof taskId === 'string' &&
      taskId.trim() !== ''
    ) {
      const loaded = loadClaimReceipt(resolvedRoot, taskId.trim());
      if (!loaded) return { skipped: 'claim-not-found' };
      if (loaded.receipt.owner_token_sha256 !== ownerTokenDigest(normalizedOwnerToken)) {
        throw new Error(`Coordination claim receipt owner does not match task ${taskId}`);
      }
      resolvedClaimId = loaded.receipt.claim_id;
      resolvedFencingEpoch = loaded.receipt.fencing_epoch;
      receiptFile = loaded.file;
    }
    requireNonEmpty(resolvedClaimId, 'claimId');
    if (!Number.isSafeInteger(resolvedFencingEpoch) || resolvedFencingEpoch <= 0) {
      throw new TypeError('fencingEpoch must be a positive integer');
    }

    const { openCoordinationLedger } = await import('./ledger.mjs');
    ledger = openCoordinationLedger({ cwd: resolvedRoot });
    const result = ledger.release({
      claimId: resolvedClaimId,
      ownerToken: normalizedOwnerToken,
      fencingEpoch: resolvedFencingEpoch,
    });
    if (receiptFile) {
      try {
        fs.rmSync(receiptFile);
      } catch (error) {
        recordCoordinationErrorCoverage({ repoRoot: resolvedRoot, mode });
        return { ...result, receiptError: errorMessage(error) };
      }
    }
    const coverageResult = recordCoordinationActivityCoverage({ repoRoot: resolvedRoot, mode });
    return {
      ...result,
      ...(coverageResult.error ? { coverageError: coverageResult.error } : {}),
    };
  } catch (error) {
    recordCoordinationErrorCoverage({ repoRoot, mode });
    return { error: errorMessage(error) };
  } finally {
    closeLedger(ledger);
  }
}

export async function reconcileClaims({ repoRoot, isPidAlive }) {
  const mode = coordinationMode(repoRoot);
  if (mode === 'off') return { skipped: 'mode-off' };

  let ledger;
  try {
    const resolvedRoot = path.resolve(requireNonEmpty(repoRoot, 'repoRoot'));
    if (typeof isPidAlive !== 'function') {
      throw new TypeError('isPidAlive must be a function');
    }
    const { openCoordinationLedger } = await import('./ledger.mjs');
    ledger = openCoordinationLedger({ cwd: resolvedRoot });
    const result = ledger.reconcile({ isPidAlive });
    const coverageResult = recordCoordinationActivityCoverage({ repoRoot: resolvedRoot, mode });
    return {
      ...result,
      ...(coverageResult.error ? { coverageError: coverageResult.error } : {}),
    };
  } catch (error) {
    recordCoordinationErrorCoverage({ repoRoot, mode });
    return { error: errorMessage(error) };
  } finally {
    closeLedger(ledger);
  }
}
