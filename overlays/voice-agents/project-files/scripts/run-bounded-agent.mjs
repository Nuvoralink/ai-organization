#!/usr/bin/env node
/**
 * agent:run — the ONLY sanctioned way to launch a bounded local agent/command from this repository.
 *
 * WHY THIS COMMAND EXISTS
 *
 * On 2026-07-20 two `claude -p` delegations were launched through a plain shell. The parent shell
 * timed out at 904s; the `claude.exe` children (PIDs 41880, 33868) survived and kept writing into a
 * shared worktree that the orchestrator believed was idle — one restored a deleted RCA, one edited a
 * rule file between another agent's staging check and its commit. A shell timeout has no authority
 * over descendants, so it produced silent concurrent writers instead of a stopped run.
 *
 * This wrapper makes the correct form the CONVENIENT form: one deadline, one tree termination, one
 * distinct timeout exit code. See `scripts/lib/boundedProcess.mjs` for the termination semantics and
 * their honest limitation.
 *
 * USAGE
 *   npm run agent:run -- --timeout-ms 600000 --label b02-review --brief <path> -- <command> [args...]
 *
 * OPTIONS
 *   --timeout-ms <n>   Hard wall-clock bound. Required.
 *   --label <text>     Human label used in the timeout message and the summary line.
 *   --cwd <path>       Working directory for the child. Defaults to the current directory.
 *   --brief <path>      Dispatch brief whose boundary edit_paths become the coordination claim.
 *   --claim-file <p>   Optional JSON task/edit-path claim descriptor for resource admission.
 *   --quiet            Capture output but do not stream it.
 *   --                 Everything after the first bare `--` is the command and its exact arguments.
 *
 * EXIT CODES
 *   0..123, 126+  the child's own exit code, propagated unchanged.
 *   124           the deadline elapsed and the descendant tree was terminated (GNU `timeout`'s code).
 *   125           refused by resource-admission ENFORCE; no child process was launched.
 *   2             this wrapper was invoked incorrectly, or the tree could NOT be terminated — which
 *                 is a louder failure than a timeout, because processes may still be running.
 *   3             the child itself exited 125 and was remapped so 125 remains refusal-only.
 *
 * For bounded Claude CLI dispatch specifically, the canonical helper
 * `~/.codex/skills/bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` remains the path: it adds
 * the tool allow-list, strict MCP config, and tool-use audit this generic wrapper does not model, and
 * it already bounds and tree-kills identically. Use this command for every OTHER bounded local run,
 * and for a bounded Claude run when that helper is unavailable.
 */

/* global process, console */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import {
  COORDINATION_DISPATCH_PATHS,
  countDispatch,
  recordCoordinationErrorCoverage,
} from '../.ai-organization/runtime/core/coordination/coverage.mjs';
import {
  coordinationAdmissionDecision,
  coordinationAdmissionWarning,
  coordinationFailOpenWarning,
  coordinationRefusalMessage,
  registerClaim,
  releaseClaim,
} from '../.ai-organization/runtime/core/coordination/register.mjs';
import { BOUNDED_OUTCOME, BOUNDED_TIMEOUT_EXIT_CODE, runBounded } from './lib/boundedProcess.mjs';
import {
  DISPATCH_BOUNDARY_PREFIX,
  normalizeDispatchBoundaryPath,
  parseDispatchBoundary,
} from './lib/dispatchBoundary.mjs';

const USAGE_EXIT_CODE = 2;
const CHILD_RESERVED_EXIT_CODE = 3;
const RESOURCE_ADMISSION_REFUSED_EXIT_CODE = 125;

function warnCoordination(message) {
  if (typeof message !== 'string' || message.length === 0) return;
  try {
    process.stderr.write(`${message}\n`);
  } catch {
    // A closed diagnostic stream cannot turn coordination into a dispatch blocker.
  }
}

export function parseArguments(argv) {
  const separatorIndex = argv.indexOf('--');
  if (separatorIndex === -1) {
    throw new Error('missing `--` separator: the command to run must follow a bare `--`');
  }

  const flags = argv.slice(0, separatorIndex);
  const command = argv.slice(separatorIndex + 1);
  if (command.length === 0) {
    throw new Error('no command supplied after `--`');
  }

  const options = { quiet: false };
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    const readValue = (name) => {
      const value = flags[index + 1];
      if (value === undefined) throw new Error(`${name} requires a value`);
      index += 1;
      return value;
    };
    switch (flag) {
      case '--timeout-ms':
        options.timeoutMs = Number(readValue('--timeout-ms'));
        break;
      case '--label':
        options.label = readValue('--label');
        break;
      case '--cwd':
        options.cwd = readValue('--cwd');
        break;
      case '--brief':
        options.brief = readValue('--brief');
        break;
      case '--claim-file':
        options.claimFile = readValue('--claim-file');
        break;
      case '--quiet':
        options.quiet = true;
        break;
      default:
        throw new Error(`unknown option: ${flag}`);
    }
  }

  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error('--timeout-ms is required and must be a positive integer of milliseconds');
  }
  if (options.brief && options.claimFile) {
    throw new Error('--brief and --claim-file are mutually exclusive');
  }

  return {
    ...options,
    claimTaskIdFallback: options.label,
    label: options.label ?? command[0],
    executable: command[0],
    argv: command.slice(1),
  };
}

export function inferAgentKind(executable) {
  const filename = String(executable).split(/[\\/]/u).at(-1) ?? '';
  const stem = filename.replace(/\.(?:exe|cmd|bat|ps1)$/iu, '').toLowerCase();
  if (stem === 'codex') return 'codex';
  if (stem === 'claude') return 'claude';
  return 'other';
}

function requireBoundaryPathArray(value, field, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new TypeError(`${field} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  }
  return value.map((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new TypeError(`${field}[${index}] must be a non-empty string`);
    }
    return normalizeDispatchBoundaryPath(entry.trim());
  });
}

function optionalBoundaryString(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string when present`);
  }
  return value.trim();
}

export function claimDescriptorFromBrief({ briefPath, content, executable, taskIdFallback }) {
  const parsed = parseDispatchBoundary(briefPath, content);
  if (!parsed) {
    throw new Error(`${briefPath}: missing ${DISPATCH_BOUNDARY_PREFIX} row`);
  }
  const boundary = parsed.value;
  if (boundary === null || typeof boundary !== 'object' || Array.isArray(boundary)) {
    throw new TypeError(`${briefPath}:${parsed.line}: dispatch boundary must be a JSON object`);
  }
  const boundaryTaskId = boundary.taskId ?? boundary.task_id;
  const taskId = optionalBoundaryString(boundaryTaskId ?? taskIdFallback, 'taskId');
  if (!taskId) {
    throw new Error(
      `${briefPath}:${parsed.line}: dispatch boundary has no taskId/task_id; pass --label <task-id>`,
    );
  }
  return {
    taskId,
    agentKind: inferAgentKind(executable),
    editPaths: requireBoundaryPathArray(boundary.edit_paths, 'edit_paths'),
    readPaths: requireBoundaryPathArray(boundary.read_paths ?? [], 'read_paths', {
      allowEmpty: true,
    }),
    branch: optionalBoundaryString(boundary.branch, 'branch'),
    worktreePath: optionalBoundaryString(
      boundary.worktreePath ?? boundary.worktree_path,
      'worktreePath',
    ),
  };
}

function resolveRepositoryRoot(cwd) {
  try {
    return path.resolve(
      execFileSync('git', ['rev-parse', '--show-toplevel'], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim(),
    );
  } catch {
    return path.resolve(cwd);
  }
}

async function main() {
  let parsed;
  try {
    parsed = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`agent:run: ${error.message}`);
    console.error(
      'Usage: npm run agent:run -- --timeout-ms <n> [--label <text>] [--cwd <path>] [--brief <path> | --claim-file <path>] [--quiet] -- <command> [args...]',
    );
    process.exit(USAGE_EXIT_CODE);
    return;
  }

  const childCwd = parsed.cwd ?? process.cwd();
  let claim = null;
  let refusalMessage;
  let repoRoot;
  let mode = 'off';
  let modeEpoch;
  try {
    repoRoot = resolveRepositoryRoot(childCwd);
    const admission = coordinationAdmissionDecision({ repoRoot });
    mode = admission.effectiveMode;
    warnCoordination(coordinationAdmissionWarning(admission));
    let descriptor;
    let descriptorError;
    const hasClaimSource = Boolean(parsed.brief || parsed.claimFile);
    if (mode !== 'off' && hasClaimSource) {
      try {
        if (parsed.brief) {
          const briefPath = path.resolve(childCwd, parsed.brief);
          descriptor = claimDescriptorFromBrief({
            briefPath,
            content: fs.readFileSync(briefPath, 'utf8'),
            executable: parsed.executable,
            taskIdFallback: parsed.claimTaskIdFallback,
          });
        } else {
          descriptor = JSON.parse(
            fs.readFileSync(path.resolve(childCwd, parsed.claimFile), 'utf8'),
          );
        }
      } catch (error) {
        descriptorError = error;
      }
    }
    const editPaths = Array.isArray(descriptor?.editPaths) ? descriptor.editPaths : [];
    const dispatchCoverage = countDispatch(mode, {
      repoRoot,
      dispatchPath: COORDINATION_DISPATCH_PATHS.boundedAgent,
      skippedNoEditPaths: !hasClaimSource || (mode !== 'off' && editPaths.length === 0),
    });
    modeEpoch = dispatchCoverage.modeEpoch;
    if (dispatchCoverage.error) {
      warnCoordination(coordinationFailOpenWarning(dispatchCoverage.error));
    }
    if (descriptorError) {
      recordCoordinationErrorCoverage({
        repoRoot,
        mode,
        modeEpoch,
      });
      warnCoordination(coordinationFailOpenWarning(descriptorError));
    } else if (mode !== 'off' && editPaths.length > 0) {
      const ownerToken = crypto.randomUUID();
      const registration = await registerClaim({
        repoRoot,
        taskId: descriptor?.taskId,
        attemptId: crypto.randomUUID(),
        agentKind: descriptor?.agentKind,
        editPaths,
        readPaths: descriptor?.readPaths,
        ownerToken,
        ownerPid: process.pid,
        branch: descriptor?.branch,
        worktreePath: descriptor?.worktreePath ?? repoRoot,
        admission,
        modeEpoch,
      });
      if (registration?.error) {
        warnCoordination(coordinationFailOpenWarning(registration.error));
      } else if (registration?.refused) {
        try {
          refusalMessage = coordinationRefusalMessage(registration.conflicts);
        } catch (error) {
          recordCoordinationErrorCoverage({ repoRoot, mode, modeEpoch });
          warnCoordination(coordinationFailOpenWarning(error));
        }
      } else if (registration?.claimId) {
        claim = {
          repoRoot,
          claimId: registration.claimId,
          ownerToken,
          fencingEpoch: registration.fencingEpoch,
        };
      }
    }
  } catch (error) {
    if (repoRoot) recordCoordinationErrorCoverage({ repoRoot, mode, modeEpoch });
    warnCoordination(coordinationFailOpenWarning(error));
  }

  if (refusalMessage) {
    console.error(`agent:run: ${refusalMessage}.`);
    process.exit(RESOURCE_ADMISSION_REFUSED_EXIT_CODE);
    return;
  }

  let result;
  let boundError;
  try {
    result = await runBounded(parsed.executable, parsed.argv, {
      timeoutMs: parsed.timeoutMs,
      cwd: childCwd,
      label: parsed.label,
      streamTo: parsed.quiet
        ? null
        : (text, stream) => {
            if (stream === 'stderr') process.stderr.write(text);
            else process.stdout.write(text);
          },
    });
  } catch (error) {
    // Reaching here means the spawn failed or — far more seriously — the descendant tree could not
    // be terminated. Never soften this into a timeout: the caller must know processes may survive.
    boundError = error;
  } finally {
    if (claim) {
      try {
        await releaseClaim(claim);
      } catch {
        // Release is best-effort OBSERVE telemetry; a rejection must never mask the child result
        // or turn a successful run into a non-zero wrapper exit.
      }
    }
  }

  if (boundError) {
    console.error(`agent:run: ${parsed.label} FAILED TO BOUND: ${boundError.message}`);
    process.exit(USAGE_EXIT_CODE);
    return;
  }

  if (result.outcome === BOUNDED_OUTCOME.TIMED_OUT) {
    console.error(
      `agent:run: ${parsed.label} TIMED OUT after ${parsed.timeoutMs} ms; descendant tree terminated (pid ${result.pid}).`,
    );
    process.exit(BOUNDED_TIMEOUT_EXIT_CODE);
    return;
  }

  console.error(
    `agent:run: ${parsed.label} completed in ${result.durationMs} ms with exit ${result.code}.`,
  );
  if (result.code === RESOURCE_ADMISSION_REFUSED_EXIT_CODE) {
    console.error(
      `agent:run: child exit ${RESOURCE_ADMISSION_REFUSED_EXIT_CODE} is reserved for resource-admission refusal; remapped to ${CHILD_RESERVED_EXIT_CODE}.`,
    );
    process.exit(CHILD_RESERVED_EXIT_CODE);
    return;
  }
  process.exit(result.code);
}

// Only run when invoked directly, so the argument parser stays unit-testable. pathToFileURL is the
// only correct comparison on Windows: a hand-built `file://C:\...` URL does not match import.meta.url.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
