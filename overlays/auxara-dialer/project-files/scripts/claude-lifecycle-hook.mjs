// Claude Code lifecycle hook router. Reads stdin exactly once, then dispatches by hook_event_name.
// Blocking events use exit 2 per the official Claude hooks contract; observation-only events never block.
import crypto from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COORDINATION_DISPATCH_PATHS,
  countDispatch,
  recordCoordinationErrorCoverage,
} from '../.ai-organization/runtime/core/coordination/coverage.mjs';
import { coordinationMode } from '../.ai-organization/runtime/core/coordination/mode.mjs';
import {
  coordinationAdmissionDecision,
  coordinationAdmissionWarning,
  coordinationFailOpenWarning,
  coordinationRefusalMessage,
  reconcileClaims,
  registerClaim,
  releaseClaim,
} from '../.ai-organization/runtime/core/coordination/register.mjs';
import {
  appendTelemetry,
  hashSummary,
  recordSessionStart,
  sessionDurationMs,
  telemetryDirectory,
} from './lib/agentTelemetry.mjs';
import { runCompletionProofForFiles } from './lib/claudeGateRouter.mjs';
import {
  collectOrchestrationState,
  formatOrchestrationState,
  resolveGitRoot,
} from './orchestration-state.mjs';
import { validateTaskContract as validateUniversalTaskContract } from '../.ai-organization/runtime/core/lifecycle/task-governor.mjs';
import {
  acceptLifecycleTask,
  completeLifecycleTask,
  recordLifecycleCompletionReport,
  recordLifecycleReview,
} from '../.ai-organization/runtime/core/lifecycle/lifecycle-controller.mjs';
import {
  checkpointTaskAttempt,
  collectCompletionReadiness,
  defaultAssuranceStateDirectory,
  digestObject,
  listTaskAttempts,
  loadTaskAttempt,
  recordRestartReconciliation,
  recordReplacementDispatch,
  replacementDispatchWouldStall,
} from '../.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs';

const REQUIRED_BRIEF_SECTIONS = Object.freeze([
  { name: 'Context', aliases: ['context'] },
  { name: 'Paths', aliases: ['paths', 'exact paths'] },
  {
    name: 'Procedure',
    aliases: ['procedure', 'numbered procedure'],
    requiresNumberedStep: true,
  },
  { name: 'Output contract', aliases: ['output contract'] },
  { name: 'Boundaries', aliases: ['boundaries'] },
  {
    name: 'Acceptance criteria',
    aliases: ['acceptance criteria', 'self-verifiable acceptance'],
  },
]);
const REQUIRED_IMPLEMENTATION_BRIEF_SECTIONS = Object.freeze([
  { name: 'Authority path', aliases: ['authority path'] },
  { name: 'Lifecycle matrix', aliases: ['lifecycle matrix'] },
  { name: 'Runtime execution', aliases: ['runtime execution'] },
  { name: 'Proof matrix', aliases: ['proof matrix'] },
  { name: 'Current consumer', aliases: ['current consumer'] },
  { name: 'Complexity budget', aliases: ['complexity budget'] },
]);
const REQUIRED_REPORT_SECTIONS = Object.freeze([
  { name: 'Doctrine-loop findings', aliases: ['doctrine-loop findings'] },
  { name: 'Honesty clause', aliases: ['honesty clause'] },
]);
const STDERR_LIMIT = 12_000;

function isProcessAlive(pid, killProcess = process.kill) {
  try {
    killProcess(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    if (error?.code === 'EPERM') return true;
    throw error;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function meaningfulLines(text) {
  const lines = [];
  let fence = null;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (fence === fenceMatch[1]) fence = null;
      continue;
    }
    if (fence || /^\s*>/.test(line)) continue;
    lines.push(line);
  }
  return lines;
}

function structuredMarker(text, marker) {
  const line = String(text ?? '')
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(marker));
  if (!line) return null;
  try {
    return JSON.parse(line.slice(marker.length).trim());
  } catch {
    return null;
  }
}

function isExplicitSectionLine(line, aliases) {
  return aliases.some((alias) => {
    const label = escapeRegex(alias);
    return (
      new RegExp(`^\\s*#{1,6}\\s+(?:\\*\\*)?${label}(?:\\b|\\s|:|\\*)`, 'i').test(line) ||
      new RegExp(`^\\s*\\d{1,2}[.)]\\s+(?:\\*\\*)?${label}(?:\\b|\\s|:|\\*)`, 'i').test(line) ||
      new RegExp(`^\\s*\\*\\*${label}\\*\\*\\s*:`, 'i').test(line) ||
      new RegExp(`^\\s*${label}\\s*:`, 'i').test(line)
    );
  });
}

export function missingExplicitSections(text, requirements) {
  const lines = meaningfulLines(text);
  return requirements
    .filter((requirement) => {
      const start = lines.findIndex((line) => isExplicitSectionLine(line, requirement.aliases));
      if (start < 0) return true;

      const end = lines.findIndex(
        (line, index) =>
          index > start &&
          (requirements.some((candidate) => isExplicitSectionLine(line, candidate.aliases)) ||
            /^\s*(?:[-*+]\s+)?(?:\*\*)?Completion tier(?:\*\*)?\s*:/i.test(line)),
      );
      const sectionLines = lines.slice(start + 1, end < 0 ? lines.length : end);
      const colon = lines[start].indexOf(':');
      const inlineContent = colon >= 0 ? lines[start].slice(colon + 1).trim() : '';
      const hasBody =
        inlineContent.length > 0 ||
        sectionLines.some((line) => {
          const content = line
            .replace(/^\s*(?:[-*+]\s+|\d{1,2}[.)]\s+)/, '')
            .replaceAll('*', '')
            .trim();
          return content.length > 0;
        });
      if (!hasBody) return true;
      if (requirement.requiresNumberedStep) {
        return !sectionLines.some((line) => /^\s*\d{1,2}[.)]\s+\S/.test(line));
      }
      return false;
    })
    .map((requirement) => requirement.name);
}

export function completionTier(text) {
  for (const line of meaningfulLines(text)) {
    const match = line.match(
      /^\s*(?:[-*+]\s+)?(?:\*\*)?Completion tier(?:\*\*)?\s*:\s*(read-only|implementation)\s*$/i,
    );
    if (match) return match[1].toLowerCase();
  }
  return undefined;
}

function eventTelemetry(payload, additions = {}) {
  return {
    eventName: payload?.hook_event_name,
    sessionId: payload?.session_id,
    taskId: payload?.task_id,
    agentType: payload?.agent_type,
    ...additions,
  };
}

function safelyAppendTelemetry(input, directory) {
  try {
    appendTelemetry(input, directory);
  } catch {
    // Telemetry is local observability, never an authority or a reason to block agent work.
  }
}

function safelyRecordSessionStart(sessionId, directory) {
  try {
    recordSessionStart(sessionId, Date.now(), directory);
  } catch {
    // SessionStart context must remain available when local telemetry storage is unavailable.
  }
}

function coordinationOwnerToken(payload) {
  return crypto
    .createHash('sha256')
    .update(`claude-session:${String(payload?.session_id ?? '')}`)
    .digest('hex');
}

function warnCoordination(message) {
  if (typeof message !== 'string' || message.length === 0) return;
  try {
    process.stderr.write(`${message}\n`);
  } catch {
    // A closed diagnostic stream cannot turn coordination into a lifecycle block.
  }
}

async function safelyRegisterTaskClaim({
  payload,
  contract,
  attemptId,
  repoRoot,
  admission,
  modeEpoch,
}) {
  try {
    if (!admission || admission.effectiveMode === 'off') return { skipped: 'mode-off' };
    const editPaths = Array.isArray(contract?.paths?.edit) ? contract.paths.edit : [];
    if (editPaths.length === 0) return { skipped: 'no-edit-paths' };
    return await registerClaim({
      repoRoot,
      taskId: payload.task_id,
      attemptId,
      agentKind: 'claude',
      editPaths,
      readPaths: Array.isArray(contract?.paths?.read) ? contract.paths.read : [],
      ownerToken: coordinationOwnerToken(payload),
      ownerPid: process.ppid > 0 ? process.ppid : process.pid,
      worktreePath: repoRoot,
      persistReceipt: true,
      admission,
      modeEpoch,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

async function safelyReleaseTaskClaim(payload, repoRoot, taskId = payload?.task_id) {
  try {
    if (!repoRoot || !taskId || coordinationMode(repoRoot) === 'off') return;
    await releaseClaim({
      repoRoot,
      taskId,
      ownerToken: coordinationOwnerToken(payload),
    });
  } catch {
    // A release failure is reconciled later; it never changes completion/stop behavior in this slice.
  }
}

async function safelyReconcileCoordination(repoRoot) {
  try {
    if (!repoRoot || coordinationMode(repoRoot) === 'off') return;
    await reconcileClaims({ repoRoot, isPidAlive: isProcessAlive });
  } catch {
    // Restart context must remain available even when coordination telemetry is unavailable.
  }
}

function stateCounts(state) {
  return {
    branchCount: new Set(state.worktrees.map((worktree) => worktree.branch).filter(Boolean)).size,
    worktreeCount: state.worktrees.length,
  };
}

function taskAttemptSummaries(repoRoot) {
  try {
    return listTaskAttempts(defaultAssuranceStateDirectory(repoRoot)).map((attempt) =>
      attempt.corrupt
        ? {
            taskId: null,
            attemptId: null,
            lifecycle: 'needs_reconciliation',
            state: 'indeterminate',
            worktreePath: null,
            needsReconciliation: true,
          }
        : {
            taskId: attempt.task_id,
            attemptId: attempt.attempt_id,
            lifecycle: attempt.lifecycle ?? attempt.state,
            state: attempt.state,
            completionMode: attempt.completion_mode,
            acceptedHead: attempt.repository?.head ?? null,
            checkpointHead: attempt.checkpoint?.head ?? null,
            contractSha256: attempt.contract_sha256,
            branch: attempt.worktree?.branch ?? null,
            worktreePath: attempt.worktree?.worktree_path ?? null,
            needsReconciliation: false,
          },
    );
  } catch {
    return [
      {
        taskId: null,
        attemptId: null,
        lifecycle: 'needs_reconciliation',
        state: 'indeterminate',
        worktreePath: null,
        needsReconciliation: true,
      },
    ];
  }
}

function collectLifecycleState(repoRoot) {
  return {
    ...collectOrchestrationState(repoRoot),
    taskAttempts: taskAttemptSummaries(repoRoot),
  };
}

function stableStateDigest(state) {
  return digestObject({
    worktrees: state.worktrees.map((worktree) => ({
      path: worktree.path,
      head: worktree.head,
      branch: worktree.branch,
      locked: worktree.locked,
      prunable: worktree.prunable,
      dirty: worktree.dirty,
    })),
    task_attempts: state.taskAttempts,
  });
}

/**
 * The DURABLE fingerprint of one task's lifecycle state, used to detect a replacement dispatch that
 * would repeat work instead of advancing it.
 *
 * Volatile working-tree dirtiness (`dirty` counts, `dirtySha256`) is deliberately EXCLUDED. An
 * interrupted agent almost always leaves a dirty tree, so a dirtiness-sensitive fingerprint can
 * essentially never repeat — the stall guard would silently never fire, and the MORE work the
 * interrupted agent did, the LESS likely detection became. Real progress is durable: a new attempt,
 * a lifecycle transition, a checkpoint head, or a moved branch/HEAD. Those are what this hashes.
 */
function durableTaskStateFingerprint(state, taskId) {
  const attempt = state.taskAttempts.find((candidate) => candidate.taskId === taskId) ?? null;
  const normalizedAttemptPath = attempt?.worktreePath
    ? path.resolve(attempt.worktreePath).toLowerCase()
    : null;
  const worktree = normalizedAttemptPath
    ? (state.worktrees.find(
        (candidate) => path.resolve(candidate.path).toLowerCase() === normalizedAttemptPath,
      ) ?? null)
    : null;
  return digestObject({
    attempt: attempt
      ? {
          task_id: attempt.taskId,
          attempt_id: attempt.attemptId,
          lifecycle: attempt.lifecycle,
          state: attempt.state,
          completion_mode: attempt.completionMode,
          accepted_head: attempt.acceptedHead,
          checkpoint_head: attempt.checkpointHead,
          contract_sha256: attempt.contractSha256,
          branch: attempt.branch,
          worktree_path: attempt.worktreePath,
        }
      : null,
    worktree: worktree
      ? {
          path: worktree.path,
          head: worktree.head,
          branch: worktree.branch,
          locked: worktree.locked,
          prunable: worktree.prunable,
        }
      : null,
  });
}

function reconcileRestart(payload, state) {
  if (!state.git.available) return { reconciliation: 'unavailable', unchanged_restart_count: 0 };
  const reconciliation = state.taskAttempts.some((attempt) => attempt.needsReconciliation)
    ? 'indeterminate'
    : 'reconciled';
  return recordRestartReconciliation({
    stateDirectory: defaultAssuranceStateDirectory(state.git.root),
    eventName: payload.hook_event_name,
    sessionId: payload.session_id,
    liveStateSha256: stableStateDigest(state),
    reconciliation,
  });
}

function restartGuidance(reconciliation) {
  const status = reconciliation.reconciliation;
  const guidance = [
    `- Live task-attempt/worktree reconciliation: ${status}.`,
    '- Pause, resume, status, verify-once, and battery-interruption instructions are one-time consumed events; current live state replaces earlier prose.',
    '- Reconcile dependency receipts and registered worktrees before dispatching any replacement.',
    '- Ordinary compaction without a durable-state change is not itself a stall. Only a repeated replacement dispatch for the same task at the same live-state fingerprint must STOP.',
    '- Continue only from the latest durable attempt/worktree state; do not replay compacted instructions.',
  ];
  if (status === 'indeterminate')
    guidance.splice(
      1,
      0,
      '- STOP: corrupt or unreadable task-attempt evidence makes active work indeterminate; reconcile that state before dispatch.',
    );
  return guidance.join('\n');
}

function emitContext(eventName, additionalContext) {
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext,
      },
    })}\n`,
  );
}

function block(message) {
  process.stderr.write(`${message.slice(0, STDERR_LIMIT)}\n`);
  process.exitCode = 2;
}

function runGit(args, cwd, timeout = 10_000) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function gitOutput(args, cwd) {
  const result = runGit(args, cwd);
  if (result.status !== 0 || result.error) {
    const detail = `${result.stdout ?? ''}${result.stderr ?? ''}${
      result.error ? `\n${result.error.message}` : ''
    }`.slice(-3_000);
    throw new Error(detail || `git ${args[0]} failed`);
  }
  return result.stdout;
}

function nulPaths(value) {
  return value.split('\0').filter(Boolean);
}

export function collectTaskChangedFiles(repoRoot, integrationBranch, acceptedHead) {
  if (typeof integrationBranch !== 'string' || integrationBranch.length === 0)
    throw new Error('Proof registry integration branch is unavailable.');
  const baseRef = `origin/${integrationBranch}`;
  const base = acceptedHead ?? gitOutput(['merge-base', 'HEAD', baseRef], repoRoot).trim();
  if (!base) throw new Error(`Unable to resolve merge-base with ${baseRef}.`);

  const files = new Set([
    ...nulPaths(
      gitOutput(['diff', '--no-renames', '--name-only', '-z', `${base}...HEAD`], repoRoot),
    ),
  ]);

  return { base, files: [...files].sort() };
}

function diffCheckFailures(repoRoot, base) {
  const commands = [
    ['diff', '--check', `${base}...HEAD`],
    ['diff', '--cached', '--check'],
    ['diff', '--check'],
  ];
  const failures = [];
  for (const args of commands) {
    const result = runGit(args, repoRoot);
    if (result.status === 0 && !result.error) continue;
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}${
      result.error ? `\n${result.error.message}` : ''
    }`.slice(-3_000);
    failures.push({ command: `git ${args.join(' ')}`, output });
  }
  return failures;
}

async function handleSessionStart(payload, telemetryDir, projectRoot) {
  await safelyReconcileCoordination(projectRoot);
  const state = collectLifecycleState(projectRoot);
  const reconciliation = reconcileRestart(payload, state);
  safelyRecordSessionStart(payload.session_id, telemetryDir);
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: 'observe',
      source: payload.source,
      ...stateCounts(state),
    }),
    telemetryDir,
  );
  emitContext(
    'SessionStart',
    [
      'Restart reconciliation:',
      restartGuidance(reconciliation),
      '',
      'Live local orchestration state (read-only; no fetch):',
      formatOrchestrationState(state),
    ].join('\n'),
  );
}

function handleSubagentStart(payload, telemetryDir, projectRoot) {
  const state = collectLifecycleState(projectRoot);
  safelyAppendTelemetry(
    eventTelemetry(payload, { outcome: 'observe', ...stateCounts(state) }),
    telemetryDir,
  );
  emitContext(
    'SubagentStart',
    [
      'Agent execution context:',
      "- Work only in the assigned worktree/branch and within the brief's allowed paths.",
      '- A dispatch brief must have Context, Paths, Procedure, Output contract, Boundaries, Acceptance criteria, and Completion tier.',
      "- Proof must use each command's own exit code; TaskCompleted supplies a changed-file mechanical floor, while the final report remains the declared acceptance-proof authority.",
      '- The final report must contain explicit Doctrine-loop findings and Honesty clause sections.',
      '',
      'Live local state:',
      formatOrchestrationState(state),
    ].join('\n'),
  );
}

function assuranceProfileRegistry(repoRoot) {
  return JSON.parse(
    readFileSync(path.join(repoRoot, '.ai-organization', 'completion-profiles.json'), 'utf8'),
  );
}

function taskImplementerIdentity(payload) {
  return payload.agent_id ?? payload.agent_type ?? payload.subagent_type ?? payload.session_id;
}

export async function handleTaskCreated(
  payload,
  telemetryDir,
  {
    admissionDecision = coordinationAdmissionDecision,
    projectRoot = resolveGitRoot(payload.cwd ?? process.cwd()),
  } = {},
) {
  const description = typeof payload.task_description === 'string' ? payload.task_description : '';
  const tier = completionTier(description);
  const contract = structuredMarker(description, 'TASK_CONTRACT_JSON:');
  const repoRoot = projectRoot;
  let admission;
  let admissionError;
  if (repoRoot) {
    try {
      admission = admissionDecision({ repoRoot });
      warnCoordination(coordinationAdmissionWarning(admission));
    } catch (error) {
      admissionError = error;
      warnCoordination(coordinationFailOpenWarning(error));
    }
  }
  const mode = admission?.effectiveMode ?? (repoRoot ? coordinationMode(repoRoot) : 'off');
  const editPaths = Array.isArray(contract?.paths?.edit) ? contract.paths.edit : [];
  const dispatchCoverage = repoRoot
    ? countDispatch(mode, {
        repoRoot,
        dispatchPath: COORDINATION_DISPATCH_PATHS.claudeTaskCreated,
        skippedNoEditPaths: editPaths.length === 0,
      })
    : {};
  if (dispatchCoverage.error) {
    warnCoordination(coordinationFailOpenWarning(dispatchCoverage.error));
  }
  if (repoRoot && admissionError) {
    try {
      recordCoordinationErrorCoverage({
        repoRoot,
        mode,
        modeEpoch: dispatchCoverage.modeEpoch,
      });
    } catch (error) {
      warnCoordination(coordinationFailOpenWarning(error));
    }
  }
  const requirements =
    tier === 'implementation'
      ? [...REQUIRED_BRIEF_SECTIONS, ...REQUIRED_IMPLEMENTATION_BRIEF_SECTIONS]
      : REQUIRED_BRIEF_SECTIONS;
  const missing = missingExplicitSections(description, requirements);
  const contractFailures = validateUniversalTaskContract(contract);
  if (contractFailures.length > 0)
    missing.push(`Universal task contract (${contractFailures.join('; ')})`);
  if (!tier) missing.push('Completion tier');
  let result = { accepted: false, failures: [] };
  if (missing.length === 0) {
    if (!repoRoot) result.failures.push('git worktree unavailable');
    else {
      const stateDirectory = defaultAssuranceStateDirectory(repoRoot);
      const beforeState = collectLifecycleState(repoRoot);
      const indeterminateAttemptState = beforeState.taskAttempts.some(
        (attempt) => attempt.needsReconciliation,
      );
      // Pre vs post IS like-for-like here: the state recorded AFTER dispatch n is exactly the state
      // the next dispatch observes BEFORE it, when nothing durable advanced in between. The real
      // defect was never the pre/post choice — it was that the fingerprint hashed volatile working
      // -tree dirtiness, so an interrupted agent (which always leaves a dirty tree) could never
      // produce a repeat. `durableTaskStateFingerprint` fixes that; the pairing stays as it was.
      const dispatchFingerprint = durableTaskStateFingerprint(beforeState, payload.task_id);
      if (indeterminateAttemptState) {
        result.failures.push(
          'Task-attempt state is indeterminate: reconcile corrupt or unreadable attempt evidence before dispatch.',
        );
      } else if (
        replacementDispatchWouldStall({
          stateDirectory,
          taskId: payload.task_id,
          liveStateSha256: dispatchFingerprint,
        })
      ) {
        result.failures.push(
          'Unchanged replacement dispatch stalled: reconcile the existing durable attempt/worktree before redispatching this task.',
        );
      } else {
        const coordinationAttemptId = `att-${crypto.randomBytes(16).toString('hex')}`;
        const registration = await safelyRegisterTaskClaim({
          payload,
          contract,
          attemptId: coordinationAttemptId,
          repoRoot,
          admission,
          modeEpoch: dispatchCoverage.modeEpoch,
        });
        if (registration?.refused) {
          result.failures.push('Coordination admission refused: overlapping task claim.');
          try {
            result.failures[result.failures.length - 1] = coordinationRefusalMessage(
              registration.conflicts,
            );
          } catch (error) {
            recordCoordinationErrorCoverage({
              repoRoot,
              mode,
              modeEpoch: dispatchCoverage.modeEpoch,
            });
            warnCoordination(coordinationFailOpenWarning(error));
          }
        } else {
          if (registration?.error) {
            warnCoordination(coordinationFailOpenWarning(registration.error));
          }
          result = acceptLifecycleTask({
            taskId: payload.task_id,
            contract,
            sessionId: payload.session_id,
            implementerId: taskImplementerIdentity(payload),
            completionMode: tier,
            cwd: repoRoot,
            profileRegistry: assuranceProfileRegistry(repoRoot),
          });
        }
        if (result.accepted) {
          // Record the POST-dispatch state — what the NEXT dispatch will observe pre-dispatch if
          // this attempt makes no durable progress. Now dirtiness-independent, so an interrupted
          // agent's uncommitted output can no longer disguise a repeat as novelty.
          const afterState = collectLifecycleState(repoRoot);
          recordReplacementDispatch({
            stateDirectory,
            taskId: payload.task_id,
            liveStateSha256: durableTaskStateFingerprint(afterState, payload.task_id),
          });
        } else if (registration?.claimId) {
          await safelyReleaseTaskClaim(payload, repoRoot);
        }
      }
    }
  }
  const failures = [...missing, ...result.failures];
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: failures.length === 0 ? 'allow' : 'block',
      completionTier: tier,
      missingSectionCount: missing.length,
      failedCheckCount: result.failures.length,
    }),
    telemetryDir,
  );
  if (failures.length > 0) {
    block(
      `[lifecycle-hook] TaskCreated blocked. ${failures.join('; ')}. ` +
        'Procedure must contain a numbered step; names mentioned only in prose, quotes, or code fences do not satisfy the brief contract.',
    );
  }
}

async function handleTaskCompleted(payload, telemetryDir, projectRoot) {
  const repoRoot = projectRoot;
  if (!repoRoot) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block('[lifecycle-hook] TaskCompleted blocked: git worktree unavailable.');
    return;
  }
  const stateDirectory = defaultAssuranceStateDirectory(repoRoot);
  const attempt = loadTaskAttempt(stateDirectory, payload.task_id);
  if (!attempt) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block('[lifecycle-hook] TaskCompleted blocked: no accepted TaskCreated attempt exists.');
    return;
  }
  const description = typeof payload.task_description === 'string' ? payload.task_description : '';
  const describedTier = completionTier(description);
  if (describedTier && describedTier !== attempt.completion_mode) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block(
      '[lifecycle-hook] TaskCompleted blocked: Completion tier differs from the accepted TaskCreated attempt.',
    );
    return;
  }
  const callerEvidence =
    payload.completion_evidence ?? structuredMarker(description, 'COMPLETION_EVIDENCE_JSON:');
  if (callerEvidence) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block(
      '[lifecycle-hook] TaskCompleted blocked: caller-supplied completion evidence is not accepted; the shared runner owns evidence generation.',
    );
    return;
  }
  if (payload.completion_report || structuredMarker(description, 'COMPLETION_REPORT_JSON:')) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block(
      '[lifecycle-hook] TaskCompleted blocked: the official event has no report field; completion report evidence must be captured from SubagentStop.',
    );
    return;
  }

  const preflightFailures = [];
  let gateResult = { profiles: [], gates: [], failures: [] };
  let changed = { files: [], base: attempt.repository.base };
  let readiness;
  const profileRegistry = assuranceProfileRegistry(repoRoot);
  if (attempt.state !== 'completed' && attempt.completion_mode === 'implementation') {
    try {
      readiness = collectCompletionReadiness(repoRoot, attempt.repository.head);
      if (readiness.dirty.total > 0) {
        preflightFailures.push(
          `Implementation completion is checkpointed/in-progress: worktree has ${readiness.dirty.total} dirty path(s), including ${readiness.dirty.untracked} untracked. Commit the task-attributable work before completion.`,
        );
      }
      if (!readiness.initial_is_ancestor) {
        preflightFailures.push(
          'Implementation completion HEAD no longer descends from the accepted TaskCreated HEAD.',
        );
      }
      if (readiness.attributable_commit_count === 0) {
        preflightFailures.push(
          'Implementation completion requires a committed task-attributable HEAD after TaskCreated.',
        );
      }
      if (readiness.attributable_changed_files.length === 0) {
        preflightFailures.push(
          'Implementation completion has no task-attributable committed changed files.',
        );
      }
    } catch (error) {
      preflightFailures.push(
        `Unable to prove implementation completion readiness: ${error.message}`,
      );
    }
    if (preflightFailures.length > 0 && readiness) {
      try {
        checkpointTaskAttempt({
          stateDirectory,
          taskId: payload.task_id,
          readiness,
          reason: preflightFailures.join('\n'),
        });
      } catch (error) {
        preflightFailures.push(
          `Unable to checkpoint failed implementation completion: ${error.message}`,
        );
      }
    }
    if (preflightFailures.length === 0) {
      try {
        changed = collectTaskChangedFiles(
          repoRoot,
          profileRegistry.integration_branch,
          attempt.repository.head,
        );
        preflightFailures.push(
          ...diffCheckFailures(repoRoot, changed.base).map(
            (failure) => `${failure.command} FAILED\n${failure.output}`,
          ),
        );
        gateResult = runCompletionProofForFiles(changed.files, { cwd: repoRoot });
        preflightFailures.push(
          ...gateResult.failures.map(
            (failure) => `npm run ${failure.gate} FAILED\n${failure.output}`,
          ),
        );
      } catch (error) {
        preflightFailures.push(`Unable to compute changed-file proof floor: ${error.message}`);
      }
    }
  }
  let result = { accepted: false, failures: preflightFailures };
  if (preflightFailures.length === 0) {
    result = completeLifecycleTask({
      taskId: payload.task_id,
      sessionId: payload.session_id,
      cwd: repoRoot,
      stateDirectory,
      profileRegistry,
    });
  }
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: result.accepted ? 'allow' : 'block',
      completionTier: attempt.completion_mode,
      changedFileCount: changed.files.length,
      gateCount: gateResult.gates.length,
      failedCheckCount: result.failures.length,
    }),
    telemetryDir,
  );
  if (result.accepted) await safelyReleaseTaskClaim(payload, repoRoot);
  if (!result.accepted) {
    block(
      '[lifecycle-hook] TaskCompleted blocked. Fix the completion evidence failures before marking the task complete.\n' +
        result.failures.join('\n'),
    );
  }
}

async function handleSubagentStop(payload, telemetryDir, projectRoot) {
  const report =
    typeof payload.last_assistant_message === 'string' ? payload.last_assistant_message : '';
  const missing = missingExplicitSections(report, REQUIRED_REPORT_SECTIONS);
  const completionReport = structuredMarker(report, 'COMPLETION_REPORT_JSON:');
  const reviewReport = structuredMarker(report, 'REVIEW_REPORT_JSON:');
  const receiptFailures = [];
  const repoRoot = projectRoot;
  if ((completionReport || reviewReport) && !repoRoot)
    receiptFailures.push('git worktree unavailable for report receipt');
  if (repoRoot) {
    try {
      if (completionReport)
        recordLifecycleCompletionReport({
          taskId: completionReport.task_id,
          reporterId: payload.agent_id,
          reporterSessionId: payload.session_id,
          reporterRole: payload.agent_type,
          report: completionReport,
          cwd: repoRoot,
        });
      if (reviewReport)
        recordLifecycleReview({
          taskId: reviewReport.task_id,
          reviewerId: payload.agent_id,
          reviewerSessionId: payload.session_id,
          role: payload.agent_type,
          verdict: reviewReport.verdict,
          findingCount: reviewReport.finding_count,
          unresolvedFindingCount: reviewReport.unresolved_finding_count,
          cwd: repoRoot,
        });
    } catch (error) {
      receiptFailures.push(error.message);
    }
  }
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: missing.length === 0 && receiptFailures.length === 0 ? 'allow' : 'block',
      missingSectionCount: missing.length + receiptFailures.length,
    }),
    telemetryDir,
  );
  if (
    repoRoot &&
    completionReport?.task_id &&
    missing.length === 0 &&
    receiptFailures.length === 0
  ) {
    await safelyReleaseTaskClaim(payload, repoRoot, completionReport.task_id);
  }
  if (missing.length > 0 || receiptFailures.length > 0) {
    block(
      `[lifecycle-hook] SubagentStop blocked. ${receiptFailures.join('; ')} Add explicit, non-empty final-report sections for: ${missing.join(', ')}. ` +
        'Quoted prompt text and fenced examples do not satisfy the report contract.',
    );
  }
}

async function handlePostCompact(payload, telemetryDir, projectRoot) {
  const summary = typeof payload.compact_summary === 'string' ? payload.compact_summary : '';
  await safelyReconcileCoordination(projectRoot);
  const state = collectLifecycleState(projectRoot);
  const reconciliation = reconcileRestart(payload, state);
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: 'observe',
      trigger: payload.trigger,
      summaryBytes: Buffer.byteLength(summary, 'utf8'),
      summaryHash: hashSummary(summary),
    }),
    telemetryDir,
  );
  emitContext(
    'PostCompact',
    [
      'Compaction is a restart boundary. The compacted body is not lifecycle authority and was not persisted by this hook.',
      restartGuidance(reconciliation),
      '',
      'Reconciled live local state:',
      formatOrchestrationState(state),
    ].join('\n'),
  );
}

function handleSessionEnd(payload, telemetryDir) {
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: 'observe',
      reason: payload.reason,
      durationMs: sessionDurationMs(payload.session_id, Date.now(), telemetryDir),
    }),
    telemetryDir,
  );
}

const configuredProjectDir = String(process.env.CLAUDE_PROJECT_DIR ?? '').trim();
const scriptProjectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function verifiedProjectRoot() {
  const scriptRoot = resolveGitRoot(scriptProjectDir) ?? scriptProjectDir;
  const scriptReal = path.resolve(realpathSync.native(scriptRoot));
  if (!configuredProjectDir) return scriptReal;
  const configuredRoot = resolveGitRoot(configuredProjectDir) ?? path.resolve(configuredProjectDir);
  const configuredReal = path.resolve(realpathSync.native(configuredRoot));
  const key = (value) => (process.platform === 'win32' ? value.toLowerCase() : value);
  if (key(configuredReal) !== key(scriptReal)) {
    throw new Error('CLAUDE_PROJECT_DIR does not match the script-derived repository root');
  }
  return scriptReal;
}

export async function dispatchLifecyclePayload(
  payload,
  projectRoot,
  telemetryDir = telemetryDirectory(projectRoot),
) {
  const explicitRoot = path.resolve(realpathSync.native(projectRoot));
  const gitRoot = resolveGitRoot(explicitRoot);
  const key = (value) => (process.platform === 'win32' ? value.toLowerCase() : value);
  if (!gitRoot || key(path.resolve(realpathSync.native(gitRoot))) !== key(explicitRoot)) {
    throw new Error('Explicit lifecycle project root must be a Git repository root');
  }
  try {
    switch (payload?.hook_event_name) {
      case 'SessionStart':
        await handleSessionStart(payload, telemetryDir, explicitRoot);
        break;
      case 'SubagentStart':
        handleSubagentStart(payload, telemetryDir, explicitRoot);
        break;
      case 'TaskCreated':
        await handleTaskCreated(payload, telemetryDir, { projectRoot: explicitRoot });
        break;
      case 'TaskCompleted':
        await handleTaskCompleted(payload, telemetryDir, explicitRoot);
        break;
      case 'SubagentStop':
        await handleSubagentStop(payload, telemetryDir, explicitRoot);
        break;
      case 'PostCompact':
        await handlePostCompact(payload, telemetryDir, explicitRoot);
        break;
      case 'SessionEnd':
        handleSessionEnd(payload, telemetryDir);
        break;
      default:
        safelyAppendTelemetry(
          eventTelemetry(payload, {
            eventName: 'Malformed',
            outcome: 'observe',
            malformedCount: 1,
          }),
          telemetryDir,
        );
    }
  } catch (error) {
    // Context/observation hooks must never block due to their own plumbing. Guard hooks fail closed
    // only when their event is known and their deterministic contract cannot be evaluated.
    const blockingEvent = ['TaskCreated', 'TaskCompleted', 'SubagentStop'].includes(
      payload?.hook_event_name,
    );
    safelyAppendTelemetry(
      eventTelemetry(payload, {
        eventName: 'Malformed',
        outcome: blockingEvent ? 'block' : 'observe',
        malformedCount: 1,
      }),
      telemetryDir,
    );
    if (blockingEvent)
      block(`[lifecycle-hook] ${payload.hook_event_name} blocked: lifecycle check failed safely.`);
  }
}

export async function main() {
  let projectRoot;
  try {
    projectRoot = verifiedProjectRoot();
  } catch (error) {
    process.stderr.write(`[lifecycle-hook] blocked: ${error.message}\n`);
    process.exitCode = 2;
    return;
  }
  const telemetryDir = telemetryDirectory(projectRoot);
  let payload;
  try {
    const stdin = readFileSync(0, 'utf8');
    payload = JSON.parse(stdin);
  } catch (error) {
    safelyAppendTelemetry(
      { eventName: 'Malformed', outcome: 'block', malformedCount: 1 },
      telemetryDir,
    );
    process.stderr.write(`[lifecycle-hook] blocked: malformed hook payload: ${error.message}\n`);
    process.exitCode = 2;
    return;
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    safelyAppendTelemetry(
      { eventName: 'Malformed', outcome: 'block', malformedCount: 1 },
      telemetryDir,
    );
    process.stderr.write('[lifecycle-hook] blocked: hook payload must be a JSON object\n');
    process.exitCode = 2;
    return;
  }

  await dispatchLifecyclePayload(payload, projectRoot, telemetryDir);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
