import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  defaultAssuranceStateDirectory,
  listTaskAttempts,
} from '../.ai-organization/runtime/core/lifecycle/evidence-runtime.mjs';

const GIT_TIMEOUT_MS = 3_000;
const WORKTREE_DISK_ENTRY_LIMIT = 20_000;

function runGit(args, cwd, timeout = GIT_TIMEOUT_MS) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout,
    windowsHide: true,
  });
}

function successfulOutput(result) {
  return result.status === 0 && !result.error ? result.stdout.trim() : undefined;
}

export function resolveGitRoot(cwd = process.cwd()) {
  const result = runGit(['rev-parse', '--show-toplevel'], cwd);
  const output = successfulOutput(result);
  return output ? path.resolve(output) : undefined;
}

export function dirtyCounts(porcelain) {
  const counts = { total: 0, staged: 0, unstaged: 0, untracked: 0, conflicted: 0 };
  const records = porcelain.split('\0');
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    if (record.startsWith('? ')) {
      counts.total += 1;
      counts.untracked += 1;
      continue;
    }
    if (record.startsWith('u ')) {
      counts.total += 1;
      counts.conflicted += 1;
      continue;
    }
    if (!record.startsWith('1 ') && !record.startsWith('2 ')) continue;
    const xy = record.split(' ', 3)[1] ?? '..';
    counts.total += 1;
    if (xy[0] && xy[0] !== '.') counts.staged += 1;
    if (xy[1] && xy[1] !== '.') counts.unstaged += 1;
    if (record.startsWith('2 ')) index += 1; // porcelain-v2 -z emits the original path next
  }
  return counts;
}

export function worktreeRows(porcelain) {
  return porcelain
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const row = {
        path: '',
        head: '',
        branch: null,
        detached: false,
        locked: false,
        prunable: false,
      };
      for (const line of block.split(/\r?\n/)) {
        const separator = line.indexOf(' ');
        const key = separator === -1 ? line : line.slice(0, separator);
        const value = separator === -1 ? '' : line.slice(separator + 1);
        if (key === 'worktree') row.path = value;
        if (key === 'HEAD') row.head = value;
        if (key === 'branch') row.branch = value.replace(/^refs\/heads\//, '');
        if (key === 'detached') row.detached = true;
        if (key === 'locked') row.locked = true;
        if (key === 'prunable') row.prunable = true;
      }
      return row;
    });
}

function sha256(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

/**
 * Bounded, COMPARABLE reclaimable-disk observation for one worktree.
 *
 * Two properties this figure must have to support a "which tree can I reclaim?" budget decision:
 *
 * 1. `.git` is excluded UNIFORMLY. In the primary checkout `.git` is a directory holding the shared
 *    object store; in a linked worktree it is a small file pointing back at it. Walking it in one
 *    and not the other made the primary's number include hundreds of MB of NON-reclaimable shared
 *    storage and silently incomparable to its siblings — the opposite of what the decision needs.
 * 2. Ignored content (`node_modules`, build caches) IS counted. It is genuinely per-worktree
 *    reclaimable disk, which is exactly the quantity being budgeted; `topLevelHotspots` shows where
 *    it sits. The figure is therefore "reclaimable bytes excluding shared Git storage", not a
 *    tracked-content size.
 *
 * `truncated` is set from the limit condition ITSELF — true iff at least one entry went
 * unaccounted. The old `stack.length > 0` was a false NEGATIVE whenever the limit was reached while
 * the stack happened to be empty, and the formatter then dropped its "(bounded lower bound)"
 * qualifier from a number that really was a lower bound. At the exact bound (a tree with precisely
 * `WORKTREE_DISK_ENTRY_LIMIT` entries) nothing is missed, so it stays false.
 */
function worktreeDiskUsage(worktreePath) {
  const stack = [{ directory: worktreePath, topLevel: '.' }];
  let bytes = 0;
  let entryCount = 0;
  let fileCount = 0;
  let truncated = false;
  const topLevelBytes = new Map();
  while (stack.length > 0) {
    if (entryCount >= WORKTREE_DISK_ENTRY_LIMIT) {
      truncated = true;
      break;
    }
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entryCount >= WORKTREE_DISK_ENTRY_LIMIT) {
        truncated = true;
        break;
      }
      // Shared, non-reclaimable Git storage — a directory in the primary checkout and a file in a
      // linked worktree. Skipped in BOTH shapes so sibling figures are comparable.
      if (current.topLevel === '.' && entry.name === '.git') continue;
      entryCount += 1;
      const fullPath = path.join(current.directory, entry.name);
      const topLevel = current.topLevel === '.' ? entry.name : current.topLevel;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        stack.push({ directory: fullPath, topLevel });
        continue;
      }
      try {
        const size = lstatSync(fullPath).size;
        bytes += size;
        fileCount += 1;
        topLevelBytes.set(topLevel, (topLevelBytes.get(topLevel) ?? 0) + size);
      } catch {
        // A concurrently changing path remains an incomplete bounded observation.
      }
    }
  }
  return {
    available: true,
    fileCount,
    entryCount,
    bytes,
    truncated,
    excludesSharedGitStorage: true,
    includesIgnoredContent: true,
    entryLimit: WORKTREE_DISK_ENTRY_LIMIT,
    topLevelHotspots: [...topLevelBytes.entries()]
      .map(([name, hotspotBytes]) => ({ name, bytes: hotspotBytes }))
      .sort((left, right) => right.bytes - left.bytes || left.name.localeCompare(right.name))
      .slice(0, 8),
  };
}

function enrichWorktree(row) {
  const status = successfulOutput(
    runGit(['status', '--porcelain=v2', '-z', '--untracked-files=all'], row.path),
  );
  return {
    ...row,
    dirty: dirtyCounts(status ?? ''),
    dirtySha256: sha256(status ?? ''),
    diskUsage: worktreeDiskUsage(row.path),
  };
}

function indeterminateTaskAttemptSummary(file) {
  return {
    taskId: null,
    attemptId: null,
    lifecycle: 'needs_reconciliation',
    state: 'indeterminate',
    completionMode: null,
    completionTier: null,
    repositoryRoot: null,
    worktreePath: null,
    branch: null,
    acceptedHead: null,
    checkpointHead: null,
    checkpointDirty: null,
    contractSha256: null,
    corrupt: true,
    file,
    needsReconciliation: true,
  };
}

function taskAttemptSummaries(repoRoot) {
  try {
    return listTaskAttempts(defaultAssuranceStateDirectory(repoRoot))
      .map((attempt) =>
        attempt.corrupt
          ? indeterminateTaskAttemptSummary(attempt.file)
          : {
              taskId: attempt.task_id,
              attemptId: attempt.attempt_id,
              lifecycle: attempt.lifecycle ?? attempt.state,
              state: attempt.state,
              completionMode: attempt.completion_mode,
              completionTier: attempt.completion_tier,
              repositoryRoot: attempt.worktree?.repository_root ?? null,
              worktreePath: attempt.worktree?.worktree_path ?? null,
              branch: attempt.worktree?.branch ?? null,
              acceptedHead: attempt.repository?.head ?? null,
              checkpointHead: attempt.checkpoint?.head ?? null,
              checkpointDirty: attempt.checkpoint?.dirty ?? null,
              contractSha256: attempt.contract_sha256,
            },
      )
      .sort((left, right) =>
        String(left.taskId ?? left.file ?? '').localeCompare(
          String(right.taskId ?? right.file ?? ''),
        ),
      );
  } catch {
    return [indeterminateTaskAttemptSummary('<attempt-directory>')];
  }
}

function sprintStatuses(repoRoot) {
  const sprintDirectory = path.join(repoRoot, 'docs', 'app-plan', 'implementation', 'sprints');
  try {
    return readdirSync(sprintDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^sprint-\d+-\d+\.md$/i.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((entry) => {
        const content = readFileSync(path.join(sprintDirectory, entry.name), 'utf8');
        const statusLine = content.split(/\r?\n/).find((line) => /^\s*\*\*Status:\*\*/i.test(line));
        return {
          file: entry.name,
          statusLine: statusLine?.trim() ?? null,
        };
      });
  } catch {
    return [];
  }
}

export function collectOrchestrationState(cwd = process.cwd()) {
  const root = resolveGitRoot(cwd);
  if (!root) {
    return {
      generatedAt: new Date().toISOString(),
      git: { available: false, error: 'git_unavailable' },
      worktrees: [],
      taskAttempts: [],
      sprintStatuses: sprintStatuses(path.resolve(cwd)),
    };
  }

  const branch =
    successfulOutput(runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], root)) ??
    successfulOutput(runGit(['rev-parse', '--short', 'HEAD'], root)) ??
    'unknown';
  const upstream = successfulOutput(
    runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], root),
  );
  let ahead = null;
  let behind = null;
  if (upstream) {
    const counts = successfulOutput(
      runGit(['rev-list', '--left-right', '--count', `${upstream}...HEAD`], root),
    );
    const match = counts?.match(/^(\d+)\s+(\d+)$/);
    if (match) {
      behind = Number(match[1]);
      ahead = Number(match[2]);
    }
  }

  const status = successfulOutput(
    runGit(['status', '--porcelain=v2', '-z', '--untracked-files=all'], root),
  );
  const worktrees = successfulOutput(runGit(['worktree', 'list', '--porcelain'], root));

  return {
    generatedAt: new Date().toISOString(),
    git: {
      available: true,
      root,
      branch,
      upstream: upstream ?? null,
      ahead,
      behind,
      dirty: dirtyCounts(status ?? ''),
    },
    worktrees: worktreeRows(worktrees ?? '').map(enrichWorktree),
    taskAttempts: taskAttemptSummaries(root),
    sprintStatuses: sprintStatuses(root),
  };
}

export function formatOrchestrationState(state) {
  const lines = [];
  if (!state.git.available) {
    lines.push('git: unavailable (read-only state collection continued)');
  } else {
    const tracking = state.git.upstream
      ? ` -> ${state.git.upstream} (ahead ${state.git.ahead ?? '?'}, behind ${state.git.behind ?? '?'})`
      : ' (no upstream)';
    const dirty = state.git.dirty;
    lines.push(
      `git: ${state.git.branch}${tracking}; dirty ${dirty.total} ` +
        `(staged ${dirty.staged}, unstaged ${dirty.unstaged}, untracked ${dirty.untracked}, conflicted ${dirty.conflicted})`,
    );
  }

  lines.push(`worktrees: ${state.worktrees.length}`);
  for (const worktree of state.worktrees) {
    const label = worktree.branch ?? (worktree.detached ? 'detached' : 'unknown');
    lines.push(
      `- ${worktree.path} [${label}] @ ${worktree.head.slice(0, 12)}; dirty ${worktree.dirty.total}; ` +
        `reclaimable ${worktree.diskUsage.bytes} bytes/${worktree.diskUsage.fileCount} files ` +
        `(excl. shared .git, incl. ignored caches${worktree.diskUsage.truncated ? '; bounded lower bound' : ''}); ` +
        `${worktree.locked ? 'locked' : 'unlocked'}, ${worktree.prunable ? 'prunable' : 'registered'}`,
    );
  }

  lines.push(`task attempts (Git common dir): ${state.taskAttempts.length}`);
  for (const attempt of state.taskAttempts) {
    if (attempt.needsReconciliation) {
      lines.push(
        `- ${attempt.file}: needs_reconciliation/indeterminate (corrupt or unreadable task-attempt state; reconcile before dispatch)`,
      );
      continue;
    }
    lines.push(
      `- ${attempt.taskId}: ${attempt.lifecycle}/${attempt.completionMode} @ ${(attempt.checkpointHead ?? attempt.acceptedHead ?? '').slice(0, 12)} ` +
        `[${attempt.branch ?? 'unknown'}] ${attempt.worktreePath ?? 'unknown worktree'}`,
    );
  }

  lines.push(`sprint status lines: ${state.sprintStatuses.length}`);
  for (const sprint of state.sprintStatuses) {
    lines.push(`- ${sprint.file}: ${sprint.statusLine ?? 'Status line missing'}`);
  }
  return lines.join('\n');
}

function isMainModule() {
  return (
    Boolean(process.argv[1]) &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  );
}

if (isMainModule()) {
  const state = collectOrchestrationState(process.cwd());
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatOrchestrationState(state)}\n`);
  }
}
