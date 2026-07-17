import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const GIT_TIMEOUT_MS = 3_000;

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

function dirtyCounts(porcelain) {
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

function worktreeRows(porcelain) {
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
    worktrees: worktreeRows(worktrees ?? ''),
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
    lines.push(`- ${worktree.path} [${label}] @ ${worktree.head.slice(0, 12)}`);
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
