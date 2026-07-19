// Claude Code lifecycle hook router. Reads stdin exactly once, then dispatches by hook_event_name.
// Blocking events use exit 2 per the official Claude hooks contract; observation-only events never block.
import { readFileSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
  defaultAssuranceStateDirectory,
  loadTaskAttempt,
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
const REQUIRED_REPORT_SECTIONS = Object.freeze([
  { name: 'Doctrine-loop findings', aliases: ['doctrine-loop findings'] },
  { name: 'Honesty clause', aliases: ['honesty clause'] },
]);
const STDERR_LIMIT = 12_000;
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

export function collectTaskChangedFiles(repoRoot, integrationBranch) {
  if (typeof integrationBranch !== 'string' || integrationBranch.length === 0) throw new Error('Proof registry integration branch is unavailable.');
  const baseRef = `origin/${integrationBranch}`;
  const base = gitOutput(['merge-base', 'HEAD', baseRef], repoRoot).trim();
  if (!base) throw new Error(`Unable to resolve merge-base with ${baseRef}.`);

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

function handleSessionStart(payload, telemetryDir, projectRoot) {
  const state = collectOrchestrationState(projectRoot);
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

function handleSubagentStart(payload, telemetryDir, projectRoot) {
  const state = collectOrchestrationState(projectRoot);
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
  return JSON.parse(readFileSync(path.join(repoRoot, '.ai-organization', 'completion-profiles.json'), 'utf8'));
}

function taskImplementerIdentity(payload) {
  return payload.agent_id ?? payload.agent_type ?? payload.subagent_type ?? payload.session_id;
}

function handleTaskCreated(payload, telemetryDir, projectRoot) {
  const description = typeof payload.task_description === 'string' ? payload.task_description : '';
  const missing = missingExplicitSections(description, REQUIRED_BRIEF_SECTIONS);
  const contract = structuredMarker(description, 'TASK_CONTRACT_JSON:');
  const contractFailures = validateUniversalTaskContract(contract);
  if (contractFailures.length > 0) missing.push(`Universal task contract (${contractFailures.join('; ')})`);
  const tier = completionTier(description);
  if (!tier) missing.push('Completion tier');
  let result = { accepted: false, failures: [] };
  let repoRoot;
  if (missing.length === 0) {
    repoRoot = projectRoot;
    if (!repoRoot) result.failures.push('git worktree unavailable');
    else result = acceptLifecycleTask({
      taskId: payload.task_id,
      contract,
      sessionId: payload.session_id,
      implementerId: taskImplementerIdentity(payload),
      completionMode: tier,
      cwd: repoRoot,
      profileRegistry: assuranceProfileRegistry(repoRoot),
    });
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

function handleTaskCompleted(payload, telemetryDir, projectRoot) {
  const repoRoot = projectRoot;
  if (!repoRoot) {
    safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }), telemetryDir);
    block('[lifecycle-hook] TaskCompleted blocked: git worktree unavailable.');
    return;
  }
  const stateDirectory = defaultAssuranceStateDirectory(repoRoot);
  const attempt = loadTaskAttempt(stateDirectory, payload.task_id);
  if (!attempt) {
    safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }), telemetryDir);
    block('[lifecycle-hook] TaskCompleted blocked: no accepted TaskCreated attempt exists.');
    return;
  }
  const description = typeof payload.task_description === 'string' ? payload.task_description : '';
  const describedTier = completionTier(description);
  if (describedTier && describedTier !== attempt.completion_mode) {
    safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }), telemetryDir);
    block('[lifecycle-hook] TaskCompleted blocked: Completion tier differs from the accepted TaskCreated attempt.');
    return;
  }
  const callerEvidence = payload.completion_evidence ?? structuredMarker(description, 'COMPLETION_EVIDENCE_JSON:');
  if (callerEvidence) {
    safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }), telemetryDir);
    block('[lifecycle-hook] TaskCompleted blocked: caller-supplied completion evidence is not accepted; the shared runner owns evidence generation.');
    return;
  }
  if (payload.completion_report || structuredMarker(description, 'COMPLETION_REPORT_JSON:')) {
    safelyAppendTelemetry(eventTelemetry(payload, { outcome: 'block', failedCheckCount: 1 }), telemetryDir);
    block('[lifecycle-hook] TaskCompleted blocked: the official event has no report field; completion report evidence must be captured from SubagentStop.');
    return;
  }

  const preflightFailures = [];
  let gateResult = { profiles: [], gates: [], failures: [] };
  let changed = { files: [], base: attempt.repository.base };
  const profileRegistry = assuranceProfileRegistry(repoRoot);
  if (attempt.state !== 'completed' && attempt.completion_mode === 'implementation') {
    try {
      changed = collectTaskChangedFiles(repoRoot, profileRegistry.integration_branch);
      preflightFailures.push(...diffCheckFailures(repoRoot, changed.base).map((failure) => `${failure.command} FAILED\n${failure.output}`));
      gateResult = runCompletionProofForFiles(changed.files, { cwd: repoRoot });
      preflightFailures.push(...gateResult.failures.map((failure) => `npm run ${failure.gate} FAILED\n${failure.output}`));
    } catch (error) {
      preflightFailures.push(`Unable to compute changed-file proof floor: ${error.message}`);
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
  if (!result.accepted) {
    block(
      '[lifecycle-hook] TaskCompleted blocked. Fix the completion evidence failures before marking the task complete.\n' +
        result.failures.join('\n'),
    );
  }
}

function handleSubagentStop(payload, telemetryDir, projectRoot) {
  const report =
    typeof payload.last_assistant_message === 'string' ? payload.last_assistant_message : '';
  const missing = missingExplicitSections(report, REQUIRED_REPORT_SECTIONS);
  const completionReport = structuredMarker(report, 'COMPLETION_REPORT_JSON:');
  const reviewReport = structuredMarker(report, 'REVIEW_REPORT_JSON:');
  const receiptFailures = [];
  const repoRoot = projectRoot;
  if ((completionReport || reviewReport) && !repoRoot) receiptFailures.push('git worktree unavailable for report receipt');
  if (repoRoot) {
    try {
      if (completionReport) recordLifecycleCompletionReport({
        taskId: completionReport.task_id,
        reporterId: payload.agent_id,
        reporterSessionId: payload.session_id,
        reporterRole: payload.agent_type,
        report: completionReport,
        cwd: repoRoot,
      });
      if (reviewReport) recordLifecycleReview({
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
  if (missing.length > 0 || receiptFailures.length > 0) {
    block(
      `[lifecycle-hook] SubagentStop blocked. ${receiptFailures.join('; ')} Add explicit, non-empty final-report sections for: ${missing.join(', ')}. ` +
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

const configuredProjectDir = String(process.env.CLAUDE_PROJECT_DIR ?? '').trim();
const scriptProjectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function verifiedProjectRoot() {
  const scriptRoot = resolveGitRoot(scriptProjectDir) ?? scriptProjectDir;
  const scriptReal = path.resolve(realpathSync.native(scriptRoot));
  if (!configuredProjectDir) return scriptReal;
  const configuredRoot = resolveGitRoot(configuredProjectDir) ?? path.resolve(configuredProjectDir);
  const configuredReal = path.resolve(realpathSync.native(configuredRoot));
  const key = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
  if (key(configuredReal) !== key(scriptReal)) throw new Error('CLAUDE_PROJECT_DIR does not match the script-derived repository root');
  return scriptReal;
}
let projectRoot;
try { projectRoot = verifiedProjectRoot(); } catch (error) {
  process.stderr.write(`[lifecycle-hook] blocked: ${error.message}\n`);
  process.exit(2);
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
  process.exit(2);
}

try {
  switch (payload?.hook_event_name) {
    case 'SessionStart':
      handleSessionStart(payload, telemetryDir, projectRoot);
      break;
    case 'SubagentStart':
      handleSubagentStart(payload, telemetryDir, projectRoot);
      break;
    case 'TaskCreated':
      handleTaskCreated(payload, telemetryDir, projectRoot);
      break;
    case 'TaskCompleted':
      handleTaskCompleted(payload, telemetryDir, projectRoot);
      break;
    case 'SubagentStop':
      handleSubagentStop(payload, telemetryDir, projectRoot);
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
