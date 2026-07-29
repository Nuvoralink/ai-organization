#!/usr/bin/env node
/**
 * Branch reconciliation by CONTENT, not by commit identity.
 *
 * WHY THIS EXISTS (2026-07-29, measured on CoachAI):
 * Four different "is this merged?" signals each lied about the same branches,
 * because each answers a narrower question than the one being asked:
 *
 *   - `git log base..branch` counts commit REACHABILITY by SHA. Any rebase or
 *     squash rewrites SHAs, so merged work reads as "ahead" forever.
 *   - `git cherry` hashes the PATCH-ID (diff + context). Rebasing onto a
 *     different base, squashing, or resolving a conflict changes the patch, so
 *     merged work reads as "+" (absent).
 *   - Commit-SUBJECT matching is defeated by squash-merge, which replaces every
 *     subject with the PR title.
 *   - Raw FILE-PRESENCE conflates "the branch added this file" with "the base
 *     deleted this file after the branch forked" (retired scope).
 *
 * A repo with a mixed merge strategy defeats all four at once. CoachAI had 41
 * merge commits in its last 60 — the rest rebased or squashed.
 *
 * The reliable question is per-file and directional: for each file the branch's
 * OWN commits touched, is the branch's content already in the base, or did the
 * base deliberately delete it? Anything else is a real difference a human reads.
 *
 * VERDICTS (conservative by construction — the cost of keeping a merged branch
 * is clutter; the cost of deleting unmerged work is losing it):
 *   SAFE     every touched file is identical in base, or was deleted from base
 *            after the fork point (deliberate retirement). Deletable.
 *   REVIEW   some touched file differs. Could be the base moving on, could be
 *            unlanded work. A human decides; --apply never touches these.
 *   UNMERGED the branch has a file the base has never had and never deleted.
 *
 * KNOWN LIMIT of the blob-history test: if a branch deliberately REVERTS a file
 * to a state the base held earlier, that blob is found in the base's history and
 * the file reads as landed. A branch whose whole point is a revert can therefore
 * be classified SAFE. Deleting it loses no content the base has never seen, but
 * it does lose the intent. Branch refs are recoverable from the PR record and
 * from reflog, so the failure is recoverable rather than destructive — but a
 * revert-only branch should be merged or escalated before any sweep, not left to
 * be classified.
 *
 * MSYS NOTE: this deliberately uses `git diff <ref> <ref> -- <path>` and never
 * `git show <ref>:<path>`. On Git-for-Windows the latter is mangled by MSYS path
 * conversion when the path is dot-prefixed (`origin/main:.claude/x` becomes
 * `origin\main;.claude\x`), git fails, and a piped `grep -c` reports 0 — which
 * reads as "absent" and is indistinguishable from a real absence.
 *
 * Usage:
 *   node scripts/sweep-merged-branches.mjs                 # report remote branches
 *   node scripts/sweep-merged-branches.mjs --local         # report local branches
 *   node scripts/sweep-merged-branches.mjs --apply         # delete SAFE branches
 *   node scripts/sweep-merged-branches.mjs --base main --remote origin
 */
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const BASE = val('--base', 'main');
const REMOTE = val('--remote', 'origin');
const LOCAL = has('--local');
const APPLY = has('--apply');
const PROTECTED = new Set([BASE, 'master', 'HEAD']);

function git(args, { allowFail = true } = {}) {
  const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 && !allowFail) {
    throw new Error(`git ${args.join(' ')} failed: ${r.stderr?.trim()}`);
  }
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

// A git invocation that MUST have succeeded for its empty output to mean
// "nothing", rather than "the command failed and I am reading its silence".
function gitStrict(args) {
  const r = git(args, { allowFail: false });
  return r.out;
}

const baseRef = LOCAL ? BASE : `${REMOTE}/${BASE}`;
if (!git(['rev-parse', '--verify', baseRef]).ok) {
  console.error(`sweep-merged-branches: base ref '${baseRef}' does not exist.`);
  process.exit(2);
}

function listBranches() {
  if (LOCAL) {
    return gitStrict(['branch', '--format=%(refname:short)'])
      .split('\n').map((s) => s.trim()).filter(Boolean)
      .filter((b) => !PROTECTED.has(b));
  }
  return gitStrict(['branch', '-r', '--format=%(refname:short)'])
    .split('\n').map((s) => s.trim()).filter(Boolean)
    // A bare remote name can appear here (a stray refs/remotes/<remote> ref).
    // It is not a branch, and `push <remote> --delete <remote>` is not something
    // to hand to --apply. Require a real <remote>/<branch> shape.
    .filter((b) => b.startsWith(`${REMOTE}/`) && b.slice(REMOTE.length + 1).length > 0)
    .filter((b) => !b.endsWith('/HEAD') && b !== `${REMOTE}/${BASE}`);
}

/** Did the base DELETE this path at some point after the fork? (retired scope) */
function deletedFromBase(file, forkPoint) {
  const out = git(['log', '--format=%H', '--diff-filter=D', '-1', `${forkPoint}..${baseRef}`, '--', file]).out;
  return out.length > 0;
}

function existsIn(ref, file) {
  // `git ls-tree <ref> -- <path>` keeps ref and path as SEPARATE argv entries.
  // `git cat-file -e <ref>:<path>` would join them with a colon, which MSYS
  // rewrites for dot-prefixed paths — the silent-false-negative documented above.
  return blobOf(ref, file) !== null;
}

/** Blob SHA of <file> at <ref>, or null when the path does not exist there. */
function blobOf(ref, file) {
  const out = git(['ls-tree', ref, '--', file]).out;
  if (!out) return null;
  const m = out.match(/^\d+ blob ([0-9a-f]{40})\t/m);
  return m ? m[1] : null;
}

/**
 * Did this EXACT content ever exist in the base's history for this path?
 *
 * A file that differs between base and branch is ambiguous on its own: either
 * the branch holds unlanded work, or the branch's work landed and the base kept
 * evolving the file afterwards. Walking the base's commits for this path and
 * comparing blob SHAs separates the two — if the branch's blob appears anywhere
 * in the base's history, the branch's version of this file is already in.
 */
function blobEverInBaseHistory(file, blob) {
  if (!blob) return false;
  // `--find-object` asks git to search its own history for commits whose diff
  // touches this exact object. One process, versus one `ls-tree` per commit that
  // ever touched the path — which made a 62-branch sweep exceed ten minutes.
  return git(['log', '--format=%H', '-1', `--find-object=${blob}`, baseRef, '--', file]).out.length > 0;
}

function classify(branch) {
  const forkPoint = git(['merge-base', baseRef, branch]).out;
  if (!forkPoint) return { verdict: 'REVIEW', reason: 'no merge-base with base', files: [] };

  // Only files the BRANCH'S OWN commits touched. Everything else differing is
  // just the base moving on, which says nothing about this branch.
  const touched = git(['diff', '--name-only', forkPoint, branch]).out
    .split('\n').map((s) => s.trim()).filter(Boolean)
    .filter((f) => !/(^|\/)node_modules\//.test(f) && !/package-lock\.json$/.test(f));

  if (touched.length === 0) return { verdict: 'SAFE', reason: 'no files touched vs base', files: [] };

  const unmerged = [];
  const diverged = [];
  for (const f of touched) {
    // Identical content in base and branch => landed (however it was merged).
    if (git(['diff', '--quiet', baseRef, branch, '--', f]).ok) continue;

    const inBase = existsIn(baseRef, f);
    const inBranch = existsIn(branch, f);

    if (!inBase && inBranch) {
      if (deletedFromBase(f, forkPoint)) continue; // retired on purpose
      unmerged.push(f);
    } else if (inBase && !inBranch) {
      continue; // branch deleted it, base still has it => base is ahead
    } else if (blobEverInBaseHistory(f, blobOf(branch, f))) {
      continue; // the branch's exact content landed; the base evolved it since
    } else {
      diverged.push(f);
    }
  }

  if (unmerged.length) return { verdict: 'UNMERGED', reason: `${unmerged.length} file(s) base never had`, files: unmerged };
  if (diverged.length) return { verdict: 'REVIEW', reason: `${diverged.length} touched file(s) differ`, files: diverged };
  return { verdict: 'SAFE', reason: 'every touched file landed or was retired', files: [] };
}

/**
 * Branch refs currently checked out in ANY worktree of this repo.
 *
 * WHY (2026-07-29, measured): this tool answers "is the content landed", NOT "is
 * anyone using this branch". A branch whose work HAS merged but that an agent is
 * mid-slice on classifies SAFE — and `--apply` would delete it out from under
 * them, including uncommitted work. Measured live on the Auxara Dialer: four
 * branches were checked out in parallel worktrees, two with uncommitted changes,
 * and every one was eligible for deletion.
 *
 * `git worktree list --porcelain` is EXACT — git knows and reports it in one
 * command. Deliberately NOT a heuristic (running processes, file mtimes, dirty
 * trees): "is this branch checked out" has a precise answer, and importing
 * heuristics into a precise question only adds false positives and negatives. A
 * sibling guard in the dialer answers the ADJACENT question — "is this DIRECTORY
 * in use" — which genuinely does need heuristics. Different questions, kept in
 * different tools on purpose; this stays inline here rather than becoming a
 * second `worktree-*.mjs` module competing with that one.
 */
function checkedOutRefs() {
  let out = '';
  try {
    // gitStrict, not git: an empty result here must mean "no worktrees", never
    // "the command failed and I am reading its silence" — the precise false
    // green this guard exists to prevent.
    out = gitStrict(['worktree', 'list', '--porcelain']);
  } catch {
    console.error('sweep: `git worktree list` failed; cannot prove no branch is checked out.');
    console.error('       Refusing to treat that as safe. Re-run where worktrees can be enumerated.');
    process.exit(2);
  }
  const refs = new Set();
  const dirs = new Map();
  // Blocks are separated by a blank line; each carries `worktree <path>` and,
  // when a branch (not a detached HEAD) is checked out, `branch refs/heads/<x>`.
  for (const block of out.split(/\r?\n\r?\n/)) {
    const dir = block.match(/^worktree (.+)$/m)?.[1]?.trim();
    const ref = block.match(/^branch\s+refs\/heads\/(.+)$/m)?.[1]?.trim();
    if (ref) {
      refs.add(ref);
      if (dir) dirs.set(ref, dir);
    }
  }
  return { refs, dirs };
}

const { refs: CHECKED_OUT, dirs: WORKTREE_DIR } = checkedOutRefs();

const branches = listBranches();
const buckets = { SAFE: [], REVIEW: [], UNMERGED: [], CHECKED_OUT: [] };

for (const b of branches) {
  let r = classify(b);
  // A checked-out branch gets its OWN verdict, never a silent exclusion: a
  // refusal you cannot see is indistinguishable from a branch never considered.
  // Carry the original verdict so the report explains which signal fired.
  // `b` is `origin/feat/x` in remote mode but plain `feat/x` in --local mode, and
  // a blind prefix-strip mangles the latter into `x`. Resolve the ref ONCE and
  // reuse it, so the verdict and its diagnostic can never disagree — the first
  // version stripped separately and the worktree path silently never printed,
  // leaving a refusal with no stated location.
  const wtRef = CHECKED_OUT.has(b) ? b : CHECKED_OUT.has(b.replace(/^[^/]+\//, '')) ? b.replace(/^[^/]+\//, '') : null;
  if (wtRef) {
    r = {
      verdict: 'CHECKED_OUT',
      reason: `checked out in a worktree (would otherwise be ${r.verdict})`,
      files: [],
    };
  }
  buckets[r.verdict].push({ branch: b, ...r });
  const tag = r.verdict.padEnd(8);
  console.log(`${tag} ${b}${r.verdict === 'SAFE' ? '' : ` — ${r.reason}`}`);
  if (r.verdict === 'CHECKED_OUT') {
    const dir = WORKTREE_DIR.get(wtRef);
    // A refusal must name WHERE, or it is only half-diagnosable.
    console.log(`           worktree: ${dir ?? '(path unavailable)'}`);
  }
  if (r.files.length && r.verdict !== 'SAFE') {
    for (const f of r.files.slice(0, 4)) console.log(`           ${f}`);
    if (r.files.length > 4) console.log(`           …and ${r.files.length - 4} more`);
  }
}

console.log('');
console.log(`sweep-merged-branches: ${branches.length} branch(es) vs ${baseRef}`);
console.log(`  SAFE     ${buckets.SAFE.length}  (fully landed — deletable)`);
console.log(`  REVIEW   ${buckets.REVIEW.length}  (touched files differ — human decides)`);
console.log(`  UNMERGED ${buckets.UNMERGED.length}  (base never had these files)`);
if (buckets.CHECKED_OUT.length) {
  console.log(
    `  CHECKED_OUT ${buckets.CHECKED_OUT.length}  (checked out in a worktree — NEVER deleted, whatever the content says)`,
  );
}

if (!APPLY) {
  console.log('');
  console.log('Dry run. Re-run with --apply to delete only the SAFE branches.');
  process.exit(0);
}

if (buckets.SAFE.length === 0) {
  console.log('\nNothing SAFE to delete.');
  process.exit(0);
}

console.log('');
for (const { branch } of buckets.SAFE) {
  if (LOCAL) {
    const r = git(['branch', '-D', branch]);
    console.log(r.ok ? `deleted local  ${branch}` : `FAILED  ${branch}: ${r.err}`);
  } else {
    const short = branch.startsWith(`${REMOTE}/`) ? branch.slice(REMOTE.length + 1) : branch;
    const r = git(['push', REMOTE, '--delete', short]);
    console.log(r.ok ? `deleted remote ${short}` : `FAILED  ${short}: ${r.err}`);
  }
}
