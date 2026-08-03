/**
 * Proves: ARC-010
 * Test type: unit
 * Surface: scripts/lib/hookProjectRoot.mjs (shared by claude-posttooluse-gate.mjs + claude-lifecycle-hook.mjs)
 * Authority: git common dir as the "same repository" identity across worktrees
 *
 * What this test proves about the product:
 * - A hook running from an agent isolation worktree, with CLAUDE_PROJECT_DIR pointing at the MAIN
 *   checkout, resolves to the worktree's own root instead of throwing — so an agent can edit and run
 *   its own verify from its isolation worktree. Before this, both hooks threw
 *   "CLAUDE_PROJECT_DIR does not match ...", blocking exactly that (2026-07-30).
 *
 * Killer mutation: revert resolveHookProjectRoot to a strict `pathKey(configured) !== pathKey(script)
 * → throw` (drop the git-common-dir acceptance). The same-repo-worktree cases below go red.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { resolveHookProjectRoot } from './hookProjectRoot.mjs';

const HERE = realOf(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const REPO_ROOT = path.resolve(HERE, '..');

function realOf(p) {
  return fs.realpathSync.native(p);
}
function key(p) {
  const r = path.resolve(p);
  return process.platform === 'win32' ? r.toLowerCase() : r;
}
// A fake `git rev-parse --git-common-dir` that reports each dir's common dir from a lookup table.
function fakeGit(commonByDir) {
  return (args) => {
    const dir = args[args.indexOf('-C') + 1];
    const common = commonByDir[key(dir)];
    return common
      ? { status: 0, stdout: `${common}\n` }
      : { status: 128, stdout: '', stderr: 'not a git repo' };
  };
}

test('no CLAUDE_PROJECT_DIR → the hook’s own repo root', () => {
  const root = resolveHookProjectRoot({
    importMetaUrl: import.meta.url,
    env: {},
    runGit: fakeGit({}),
  });
  assert.equal(key(root), key(HERE));
});

test('CLAUDE_PROJECT_DIR equal to the hook root → that root, no git needed', () => {
  const root = resolveHookProjectRoot({
    importMetaUrl: import.meta.url,
    env: { CLAUDE_PROJECT_DIR: HERE },
    runGit: () => {
      throw new Error('git must not be consulted when the paths already match');
    },
  });
  assert.equal(key(root), key(HERE));
});

test('KILLER: a different path sharing one git common dir → the hook root, NO throw', () => {
  // HERE (script root) and os.tmpdir() (configured) are different real dirs; the fake git reports the
  // SAME common dir for both → they are worktrees of one repo → accept, return the hook's own root.
  const other = realOf(os.tmpdir());
  const commonDir = path.join(HERE, '.git');
  const root = resolveHookProjectRoot({
    importMetaUrl: import.meta.url,
    env: { CLAUDE_PROJECT_DIR: other },
    runGit: fakeGit({ [key(HERE)]: commonDir, [key(other)]: commonDir }),
  });
  assert.equal(key(root), key(HERE), 'a sibling worktree must resolve to the hook’s own root');
});

test('a different path in a DIFFERENT repository → throws', () => {
  const other = realOf(os.tmpdir());
  assert.throws(
    () =>
      resolveHookProjectRoot({
        importMetaUrl: import.meta.url,
        env: { CLAUDE_PROJECT_DIR: other },
        runGit: fakeGit({
          [key(HERE)]: path.join(HERE, '.git'),
          [key(other)]: path.join(other, '.git'),
        }),
      }),
    /different repository/,
  );
});

test('INTEGRATION (real git): a real worktree with CLAUDE_PROJECT_DIR=main resolves to the worktree', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hookroot-'));
  const main = path.join(base, 'main');
  const wt = path.join(base, 'wt');
  const git = (args) => execFileSync('git', ['-C', main, ...args], { stdio: 'pipe' });
  try {
    fs.mkdirSync(main);
    execFileSync('git', ['-C', main, 'init', '-q'], { stdio: 'pipe' });
    git(['config', 'user.email', 't@t.test']);
    git(['config', 'user.name', 'test']);
    fs.writeFileSync(path.join(main, 'seed.txt'), 'x');
    git(['add', '.']);
    git(['commit', '-q', '-m', 'seed']);
    git(['worktree', 'add', '-q', wt]);

    // The hook file lives at <wt>/scripts/hook.mjs; the file need not exist (only <wt> is realpath'd).
    const importMetaUrl = pathToFileURL(path.join(wt, 'scripts', 'hook.mjs')).href;
    const root = resolveHookProjectRoot({
      importMetaUrl,
      env: { CLAUDE_PROJECT_DIR: main },
      // real default git
    });
    assert.equal(key(root), key(realOf(wt)), 'real sibling worktree resolves to the worktree root');
  } finally {
    try {
      execFileSync('git', ['-C', main, 'worktree', 'remove', '--force', wt], { stdio: 'pipe' });
    } catch {
      /* best effort */
    }
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('KILLER: both Claude hooks consume the shared resolver instead of carrying parallel root logic', () => {
  for (const relative of [
    'scripts/claude-lifecycle-hook.mjs',
    'scripts/claude-posttooluse-gate.mjs',
  ]) {
    const source = fs.readFileSync(path.join(REPO_ROOT, relative), 'utf8');
    assert.match(
      source,
      /import \{ resolveHookProjectRoot \} from '\.\/lib\/hookProjectRoot\.mjs';/u,
    );
    assert.match(source, /resolveHookProjectRoot\(\{ importMetaUrl: import\.meta\.url \}\)/u);
    assert.doesNotMatch(source, /function gitCommonDirKey|CLAUDE_PROJECT_DIR does not match/u);
  }
});
