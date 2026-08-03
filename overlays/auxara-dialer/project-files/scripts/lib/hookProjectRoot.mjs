// Shared project-root resolver for the Claude Code hooks (PostToolUse gate + lifecycle hook).
//
// WHY THIS EXISTS (2026-07-30): both hooks independently rejected a legitimate agent isolation
// worktree. Each derives its own root from the hook file's path and then THREW when
// `CLAUDE_PROJECT_DIR` (the env the harness sets) pointed anywhere else. But when an agent runs in an
// isolation worktree, the harness sets `CLAUDE_PROJECT_DIR` to the MAIN checkout while the hook copy
// runs from the worktree — same repository, different working-tree root. The old guards compared the
// working-tree roots (or `--show-toplevel`, which is per-worktree), so they saw two different paths
// and threw `CLAUDE_PROJECT_DIR does not match ...` — blocking every edit and every self-run `verify`
// the agent attempted from its own worktree. That is exactly the "harness worktree/CLAUDE_PROJECT_DIR
// mismatch" an implementer flagged as "outside my authority to change."
//
// The correct test of "same repository" is the git COMMON dir (`git rev-parse --git-common-dir`),
// which every worktree of a repo shares even though each has its own working-tree root. So: if the
// configured dir and the hook's own root are different paths BUT share one git common dir, they are
// worktrees of one repo — use the hook's own root (the tree where the edit actually happened) and do
// NOT throw. The throw is preserved only for a genuinely different repository, which is the
// misconfiguration the guard was meant to catch.

import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export function pathKey(value) {
  const normalized = path.resolve(value);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

const defaultRunGit = (args) => spawnSync('git', args, { encoding: 'utf8', windowsHide: true });

/**
 * The absolute, realpath-resolved git common dir for `dir`, or null if `dir` is not in a git repo
 * (or git is unavailable). `--git-common-dir` is shared by every worktree of the same repository.
 */
export function gitCommonDir(dir, runGit = defaultRunGit) {
  const result = runGit(['-C', dir, 'rev-parse', '--git-common-dir']);
  if (!result || result.status !== 0) return null;
  const out = String(result.stdout ?? '').trim();
  if (!out) return null;
  const absolute = path.isAbsolute(out) ? out : path.resolve(dir, out);
  try {
    return realpathSync.native(absolute);
  } catch {
    return path.resolve(absolute);
  }
}

/**
 * Resolve the project root a hook should operate on.
 * - No `CLAUDE_PROJECT_DIR` → the hook's own repo root (derived from its file path).
 * - `CLAUDE_PROJECT_DIR` === the hook's own root → that root.
 * - Different path but the SAME git common dir (a sibling worktree, e.g. an agent isolation worktree)
 *   → the hook's own root (the tree the edit happened in). No throw.
 * - Different path AND a different repository → throw (the genuine misconfiguration).
 *
 * `env` and `runGit` are injectable for testing.
 */
export function resolveHookProjectRoot({
  importMetaUrl,
  env = process.env,
  runGit = defaultRunGit,
}) {
  const scriptRoot = realpathSync.native(
    path.resolve(path.dirname(fileURLToPath(importMetaUrl)), '..'),
  );
  const configured = String(env.CLAUDE_PROJECT_DIR ?? '').trim();
  if (!configured) return scriptRoot;

  const configuredRoot = realpathSync.native(path.resolve(configured));
  if (pathKey(configuredRoot) === pathKey(scriptRoot)) return configuredRoot;

  const scriptCommon = gitCommonDir(scriptRoot, runGit);
  const configuredCommon = gitCommonDir(configuredRoot, runGit);
  if (scriptCommon && configuredCommon && pathKey(scriptCommon) === pathKey(configuredCommon)) {
    // Sibling worktrees of one repository — legitimate (agent isolation worktree). Operate on the
    // tree the hook physically lives in, which is where the edited file is.
    return scriptRoot;
  }

  throw new Error(
    'CLAUDE_PROJECT_DIR points to a different repository than the one containing this hook',
  );
}
