// Claude Code lifecycle hook router. Reads stdin exactly once, then dispatches by hook_event_name.
// Blocking events use exit 2 per the official Claude hooks contract; observation-only events never block.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  appendTelemetry,
  hashSummary,
  hashIdentifier,
  recordTaskCompletionTier,
  recordSessionStart,
  sessionDurationMs,
  taskCompletionTier,
  taskWorktreeFingerprint,
  telemetryDirectory,
} from './lib/agentTelemetry.mjs';
import { runCompletionProofForFiles } from './lib/claudeGateRouter.mjs';
import {
  collectOrchestrationState,
  formatOrchestrationState,
  resolveGitRoot,
} from './orchestration-state.mjs';
import {
  validateCompletion as validateUniversalCompletion,
  validateTaskContract as validateUniversalTaskContract,
} from '../.ai-organization/runtime/core/lifecycle/task-governor.mjs';

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
const REQUIRED_REPORT_SECTIONS = Object.freeze([
  { name: 'Doctrine-loop findings', aliases: ['doctrine-loop findings'] },
  { name: 'Honesty clause', aliases: ['honesty clause'] },
]);
const STDERR_LIMIT = 12_000;
const ASSURANCE_STATE_VERSION = 1;

function assuranceStatePath(taskId, telemetryDir) {
  const taskHash = hashIdentifier(taskId);
  return taskHash ? path.join(path.dirname(telemetryDir), 'agent-task-assurance', `task-${taskHash}.json`) : undefined;
}

function recordUniversalTaskContract(taskId, contract, telemetryDir) {
  const statePath = assuranceStatePath(taskId, telemetryDir);
  if (!statePath) throw new Error('task id is unavailable');
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify({ schema_version: ASSURANCE_STATE_VERSION, contract })}\n`, { encoding: 'utf8', mode: 0o600 });
}

function universalTaskContract(taskId, telemetryDir) {
  const statePath = assuranceStatePath(taskId, telemetryDir);
  if (!statePath) return undefined;
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    return state?.schema_version === ASSURANCE_STATE_VERSION ? state.contract : undefined;
  } catch {
    return undefined;
  }
}

function clearUniversalTaskContract(taskId, telemetryDir) {
  const statePath = assuranceStatePath(taskId, telemetryDir);
  if (statePath) rmSync(statePath, { force: true });
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
  const line = String(text ?? '').split(/\r?\n/).find((candidate) => candidate.startsWith(marker));
  if (!line) return null;
  try { return JSON.parse(line.slice(marker.length).trim()); } catch { return null; }
}

function npmGateFromProofCommand(command) {
  return /^npm run ([A-Za-z0-9:_-]+)$/u.exec(command ?? '')?.[1];
}

function validateAdapterProofCommands(contract, tier) {
  const failures = [];
  for (const proof of (contract?.proofs ?? []).filter((candidate) => candidate.required)) {
    if (proof.command === 'internal:read-only-worktree-fingerprint') {
      if (tier !== 'read-only') failures.push(`${proof.id}: internal read-only proof is valid only for read-only tasks`);
      continue;
    }
    if (!npmGateFromProofCommand(proof.command)) failures.push(`${proof.id}: proof command must be "npm run <script>" or the read-only internal proof`);
  }
  if (tier === 'read-only' && !(contract?.proofs ?? []).some((proof) => proof.required && proof.command === 'internal:read-only-worktree-fingerprint')) {
    failures.push('read-only tasks require internal:read-only-worktree-fingerprint');
  }
  return failures;
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

function safelyRecordTaskCompletionTier(taskId, tier, directory, worktreeFingerprint) {
  try {
    recordTaskCompletionTier(taskId, tier, directory, worktreeFingerprint);
  } catch {
    // A deterministic brief check can still run when local lifecycle state is unavailable.
  }
}

function stateCounts(state) {
  return {
    branchCount: new Set(state.worktrees.map((worktree) => worktree.branch).filter(Boolean)).size,
    worktreeCount: state.worktrees.length,
  };
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

function runNpmGate(gate, cwd, timeout = 120_000) {
  const executable = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', 'run', gate] : ['run', gate];
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CALL_DROP_GATE_STRICT: '1' },
    timeout,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`.slice(-3_000),
  };
}

function runUniversalContractProofs(contract, { cwd, projectGateResult, readOnlyFingerprintPassed = false }) {
  const proofEvidence = [];
  const failures = [];
  const projectFailures = new Map((projectGateResult?.failures ?? []).map((failure) => [failure.gate, failure]));
  for (const proof of (contract?.proofs ?? []).filter((candidate) => candidate.required)) {
    let status;
    let output = '';
    if (proof.command === 'internal:read-only-worktree-fingerprint') {
      status = readOnlyFingerprintPassed ? 0 : 1;
      if (status !== 0) output = 'read-only worktree fingerprint did not match the accepted baseline';
    } else {
      const gate = npmGateFromProofCommand(proof.command);
      if (!gate) {
        status = 1;
        output = 'unsupported proof command';
      } else if (projectGateResult?.gates?.includes(gate)) {
        const failed = projectFailures.get(gate);
        status = failed ? (failed.status ?? 1) : 0;
        output = failed?.output ?? '';
      } else {
        const result = runNpmGate(gate, cwd);
        status = result.status;
        output = result.output;
      }
    }
    proofEvidence.push({
      id: proof.id,
      command: proof.command,
      exit_code: status,
      artifact_opened: true,
      killer_mutation_observed: status === 0,
    });
    if (status !== 0) failures.push(`Universal proof ${proof.id} FAILED (${proof.command})\n${output}`);
  }
  return { proofEvidence, failures };
}

function universalCompletionEvidence(contract, changedFiles, proofEvidence) {
  const reviewRequired = ['review_verified', 'deployed_verified'].includes(contract.completion?.tier);
  return {
    task_id: contract.id,
    changed_files: changedFiles,
    proofs: proofEvidence,
    independent_review: {
      required: reviewRequired,
      reviewer: null,
      verdict: reviewRequired ? 'findings' : 'not_required',
    },
    unreached_surfaces: contract.completion?.unreached_surfaces ?? [],
    doctrine_loop: contract.completion?.doctrine_loop ?? 'none',
  };
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

export function collectTaskChangedFiles(repoRoot) {
  const base = gitOutput(['merge-base', 'HEAD', 'origin/main'], repoRoot).trim();
  if (!base) throw new Error('Unable to resolve merge-base with origin/main.');

  const files = new Set([
    ...nulPaths(
      gitOutput(['diff', '--no-renames', '--name-only', '-z', `${base}...HEAD`], repoRoot),
    ),
    ...nulPaths(gitOutput(['diff', '--cached', '--no-renames', '--name-only', '-z'], repoRoot)),
    ...nulPaths(gitOutput(['diff', '--no-renames', '--name-only', '-z'], repoRoot)),
    ...nulPaths(gitOutput(['ls-files', '--others', '--exclude-standard', '-z'], repoRoot)),
  ]);

  return { base, files: [...files].sort() };
}

export function collectWorktreeFingerprint(repoRoot) {
  const hash = createHash('sha256');
  const add = (label, value) => {
    const text = String(value ?? '');
    hash.update(`${label.length}:${label}:${Buffer.byteLength(text, 'utf8')}:`);
    hash.update(text, 'utf8');
  };

  add('head', gitOutput(['rev-parse', 'HEAD'], repoRoot));
  const branch = runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], repoRoot);
  add('branch', branch.status === 0 && !branch.error ? branch.stdout : 'detached');
  add('head_to_worktree', gitOutput(['diff', '--binary', 'HEAD', '--'], repoRoot));
  add('head_to_index', gitOutput(['diff', '--cached', '--binary', 'HEAD', '--'], repoRoot));
  add('index_to_worktree', gitOutput(['diff', '--binary', '--'], repoRoot));

  const untracked = nulPaths(
    gitOutput(['ls-files', '--others', '--exclude-standard', '-z'], repoRoot),
  ).sort();
  for (const file of untracked) {
    add('untracked_path', file);
    add('untracked_hash', gitOutput(['hash-object', '--no-filters', '--', file], repoRoot));
  }
  return hash.digest('hex');
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

function handleSessionStart(payload, telemetryDir) {
  const state = collectOrchestrationState(payload.cwd ?? process.cwd());
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
    `Live local orchestration state (read-only; no fetch or snapshot persisted):\n${formatOrchestrationState(state)}`,
  );
}

function handleSubagentStart(payload, telemetryDir) {
  const state = collectOrchestrationState(payload.cwd ?? process.cwd());
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

function handleTaskCreated(payload, telemetryDir) {
  const description = typeof payload.task_description === 'string' ? payload.task_description : '';
  const missing = missingExplicitSections(description, REQUIRED_BRIEF_SECTIONS);
  const universalContract = structuredMarker(description, 'TASK_CONTRACT_JSON:');
  const universalFailures = validateUniversalTaskContract(universalContract);
  if (universalFailures.length > 0) missing.push(`Universal task contract (${universalFailures.join('; ')})`);
  const tier = completionTier(description);
  if (!tier) missing.push('Completion tier');
  if (universalFailures.length === 0 && tier) {
    const proofCommandFailures = validateAdapterProofCommands(universalContract, tier);
    if (proofCommandFailures.length > 0) missing.push(`Universal proof commands (${proofCommandFailures.join('; ')})`);
  }

  let worktreeFingerprint;
  let baselineError;
  if (missing.length === 0 && tier === 'read-only') {
    try {
      const repoRoot = resolveGitRoot(payload.cwd ?? process.cwd());
      if (!repoRoot) throw new Error('git worktree unavailable');
      worktreeFingerprint = collectWorktreeFingerprint(repoRoot);
    } catch (error) {
      baselineError = error;
    }
  }

  let assuranceError;
  if (missing.length === 0 && !baselineError) {
    try { recordUniversalTaskContract(payload.task_id, universalContract, telemetryDir); }
    catch (error) { assuranceError = error; }
  }

  const outcome = missing.length === 0 && !baselineError && !assuranceError ? 'allow' : 'block';
  if (outcome === 'allow') {
    safelyRecordTaskCompletionTier(payload.task_id, tier, telemetryDir, worktreeFingerprint);
  }
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome,
      completionTier: tier,
      missingSectionCount: missing.length,
    }),
    telemetryDir,
  );
  if (missing.length > 0) {
    block(
      `[lifecycle-hook] TaskCreated blocked. Add explicit, non-empty sections for: ${missing.join(', ')}. ` +
        'Procedure must contain a numbered step; names mentioned only in prose, quotes, or code fences do not satisfy the brief contract.',
    );
  }
  if (baselineError) {
    block(
      `[lifecycle-hook] TaskCreated blocked: unable to capture the read-only worktree baseline. ${baselineError.message}`,
    );
  }
  if (assuranceError) {
    block(`[lifecycle-hook] TaskCreated blocked: unable to persist the validated universal task contract for completion. ${assuranceError.message}`);
  }
}

function handleTaskCompleted(payload, telemetryDir) {
  const description = typeof payload.task_description === 'string' ? payload.task_description : '';
  const describedTier = completionTier(description);
  const recordedTier = taskCompletionTier(payload.task_id, telemetryDir);
  const recordedWorktreeFingerprint = taskWorktreeFingerprint(payload.task_id, telemetryDir);
  if (describedTier && recordedTier && describedTier !== recordedTier) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block(
      '[lifecycle-hook] TaskCompleted blocked: Completion tier differs from the tier accepted at TaskCreated.',
    );
    return;
  }
  const tier = recordedTier ?? describedTier;
  if (!tier) {
    safelyAppendTelemetry(
      eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }),
      telemetryDir,
    );
    block('[lifecycle-hook] TaskCompleted blocked: task description has no valid Completion tier.');
    return;
  }
  const universalContract = universalTaskContract(payload.task_id, telemetryDir);
  const storedContractFailures = validateUniversalTaskContract(universalContract);
  if (storedContractFailures.length > 0) {
    safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', completionTier: tier, failedCheckCount: 1 }), telemetryDir);
    block(`[lifecycle-hook] TaskCompleted blocked: validated universal task contract is missing or corrupt. ${storedContractFailures.join('; ')}`);
    return;
  }

  if (tier === 'read-only') {
    let currentWorktreeFingerprint;
    let repoRoot;
    try {
      repoRoot = resolveGitRoot(payload.cwd ?? process.cwd());
      if (!repoRoot) throw new Error('git worktree unavailable');
      currentWorktreeFingerprint = collectWorktreeFingerprint(repoRoot);
    } catch (error) {
      safelyAppendTelemetry(
        eventTelemetry(payload, {
          outcome: 'block',
          completionTier: tier,
          failedCheckCount: 1,
        }),
        telemetryDir,
      );
      block(
        `[lifecycle-hook] TaskCompleted blocked: unable to compare the read-only task with its accepted baseline. ${error.message}`,
      );
      return;
    }
    if (!recordedWorktreeFingerprint) {
      safelyAppendTelemetry(
        eventTelemetry(payload, {
          outcome: 'block',
          completionTier: tier,
          gateCount: 0,
          failedCheckCount: 1,
        }),
        telemetryDir,
      );
      block(
        '[lifecycle-hook] TaskCompleted blocked: the accepted read-only task has no recorded worktree baseline.',
      );
      return;
    }
    if (currentWorktreeFingerprint !== recordedWorktreeFingerprint) {
      safelyAppendTelemetry(
        eventTelemetry(payload, {
          outcome: 'block',
          completionTier: tier,
          gateCount: 0,
          failedCheckCount: 1,
        }),
        telemetryDir,
      );
      block(
        '[lifecycle-hook] TaskCompleted blocked: the branch/worktree changed after the read-only task baseline. ' +
          'Restore that task-time state or re-dispatch the task with Completion tier: implementation.',
      );
      return;
    }
    const universalProof = runUniversalContractProofs(universalContract, {
      cwd: repoRoot,
      readOnlyFingerprintPassed: true,
    });
    const completionEvidence = universalCompletionEvidence(universalContract, [], universalProof.proofEvidence);
    const universalCompletionFailures = validateUniversalCompletion(universalContract, completionEvidence);
    if (universalProof.failures.length > 0 || universalCompletionFailures.length > 0) {
      safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', completionTier: tier, failedCheckCount: universalProof.failures.length + universalCompletionFailures.length }), telemetryDir);
      block([
        '[lifecycle-hook] TaskCompleted blocked: universal completion evidence failed.',
        ...universalProof.failures,
        ...universalCompletionFailures.map((failure) => `Universal evidence: ${failure}`),
      ].join('\n'));
      return;
    }
    safelyAppendTelemetry(
      eventTelemetry(payload, {
        outcome: 'allow',
        completionTier: tier,
        changedFileCount: 0,
        gateCount: 0,
        failedCheckCount: 0,
      }),
      telemetryDir,
    );
    clearUniversalTaskContract(payload.task_id, telemetryDir);
    return;
  }

  let changed;
  let repoRoot;
  try {
    repoRoot = resolveGitRoot(payload.cwd ?? process.cwd());
    if (!repoRoot) throw new Error('git worktree unavailable');
    changed = collectTaskChangedFiles(repoRoot);
  } catch (error) {
    safelyAppendTelemetry(
      eventTelemetry(payload, {
        outcome: 'block',
        completionTier: tier,
        failedCheckCount: 1,
      }),
      telemetryDir,
    );
    block(
      `[lifecycle-hook] TaskCompleted blocked: unable to compute origin/main changed-file truth. ${error.message}`,
    );
    return;
  }

  const diffFailures = diffCheckFailures(repoRoot, changed.base);
  const gateResult = runCompletionProofForFiles(changed.files, { cwd: repoRoot });
  const universalProof = runUniversalContractProofs(universalContract, { cwd: repoRoot, projectGateResult: gateResult });
  const completionEvidence = universalCompletionEvidence(universalContract, changed.files, universalProof.proofEvidence);
  const universalCompletionFailures = validateUniversalCompletion(universalContract, completionEvidence);
  const failedCheckCount = diffFailures.length + gateResult.failures.length + universalProof.failures.length + universalCompletionFailures.length;
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: failedCheckCount === 0 ? 'allow' : 'block',
      completionTier: tier,
      changedFileCount: changed.files.length,
      gateCount: gateResult.gates.length,
      failedCheckCount,
    }),
    telemetryDir,
  );

  if (failedCheckCount === 0) {
    clearUniversalTaskContract(payload.task_id, telemetryDir);
    return;
  }

  const details = [
    ...diffFailures.map((failure) => `${failure.command} FAILED\n${failure.output}`),
    `Completion proof profiles: ${gateResult.profiles.join(', ')}`,
    ...gateResult.failures.map((failure) => `npm run ${failure.gate} FAILED\n${failure.output}`),
    ...universalProof.failures,
    ...universalCompletionFailures.map((failure) => `Universal evidence: ${failure}`),
  ].join('\n\n');
  block(
    '[lifecycle-hook] TaskCompleted blocked. Fix the changed-file completion checks before marking the task complete.\n' +
      details,
  );
}

function handleSubagentStop(payload, telemetryDir) {
  const report =
    typeof payload.last_assistant_message === 'string' ? payload.last_assistant_message : '';
  const missing = missingExplicitSections(report, REQUIRED_REPORT_SECTIONS);
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: missing.length === 0 ? 'allow' : 'block',
      missingSectionCount: missing.length,
    }),
    telemetryDir,
  );
  if (missing.length > 0) {
    block(
      `[lifecycle-hook] SubagentStop blocked. Add explicit, non-empty final-report sections for: ${missing.join(', ')}. ` +
        'Quoted prompt text and fenced examples do not satisfy the report contract.',
    );
  }
}

function handlePostCompact(payload, telemetryDir) {
  const summary = typeof payload.compact_summary === 'string' ? payload.compact_summary : '';
  safelyAppendTelemetry(
    eventTelemetry(payload, {
      outcome: 'observe',
      trigger: payload.trigger,
      summaryBytes: Buffer.byteLength(summary, 'utf8'),
      summaryHash: hashSummary(summary),
    }),
    telemetryDir,
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

const telemetryDir = telemetryDirectory(process.cwd());
let payload;
try {
  const stdin = readFileSync(0, 'utf8');
  payload = JSON.parse(stdin);
} catch {
  safelyAppendTelemetry(
    { eventName: 'Malformed', outcome: 'observe', malformedCount: 1 },
    telemetryDir,
  );
  process.exit(0);
}

try {
  switch (payload?.hook_event_name) {
    case 'SessionStart':
      handleSessionStart(payload, telemetryDir);
      break;
    case 'SubagentStart':
      handleSubagentStart(payload, telemetryDir);
      break;
    case 'TaskCreated':
      handleTaskCreated(payload, telemetryDir);
      break;
    case 'TaskCompleted':
      handleTaskCompleted(payload, telemetryDir);
      break;
    case 'SubagentStop':
      handleSubagentStop(payload, telemetryDir);
      break;
    case 'PostCompact':
      handlePostCompact(payload, telemetryDir);
      break;
    case 'SessionEnd':
      handleSessionEnd(payload, telemetryDir);
      break;
    default:
      safelyAppendTelemetry(
        eventTelemetry(payload, { eventName: 'Malformed', outcome: 'observe', malformedCount: 1 }),
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
