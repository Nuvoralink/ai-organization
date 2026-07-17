#!/usr/bin/env node
/**
 * gate:filemap — REPO_FILEMAP.md must equal `buildFilemap()`'s output over the tracked files.
 *
 * WHY THIS EXISTS (2026-07-02, branch refactor/dnc-status-centralization):
 *   REPO_FILEMAP.md was regenerated while a rebase conflict was unresolved. A conflicted
 *   `git ls-files` emits multi-stage (stage 1/2/3) duplicate entries, so a conflicted path was
 *   baked in tripled — the header said "1086 paths" while a clean `git ls-files | wc -l` was 1084.
 *   `npm run verify` was GREEN because NO gate validated the map: only the generator
 *   (scripts/generate-repo-filemap.mjs) ever touched it. This gate closes that hole — it regenerates
 *   the map IN MEMORY (the SAME `buildFilemap` the writer uses, so it can't drift) and byte-compares
 *   it to the committed file. Drift / corruption / staleness → non-zero exit (NFR-011).
 *
 * NOTE ON CLEAN-TREE SEMANTICS: the gate runs `buildFilemap` (i.e. `git ls-files`) in the CURRENT
 *   tree. Run mid-conflict it would regenerate the SAME duplicate-laden output and could match a
 *   corrupt committed file — that is fine, because CI (and any post-resolve run) has a clean index:
 *   there, the fresh output is correct and the committed corruption is caught. The fix message tells
 *   the dev to regenerate on a CLEAN tree.
 *
 * Run: `npm run gate:filemap` (wired into `gates:all`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILEMAP_FILENAME, buildFilemap } from './generate-repo-filemap.mjs';

/**
 * Compare the committed REPO_FILEMAP.md against a fresh `buildFilemap()` over `rootDir`'s tracked
 * files. Pure (no process.exit) so the meta-test can assert on it directly. Returns:
 *   { ok: true }
 *   { ok: false, reason: 'missing-file' }
 *   { ok: false, reason: 'git-failed' }
 *   { ok: false, reason: 'drift', expected, actual }
 */
export function checkFilemap(rootDir = process.cwd()) {
  const filePath = join(rootDir, FILEMAP_FILENAME);
  if (!existsSync(filePath)) return { ok: false, reason: 'missing-file' };

  let expected;
  try {
    expected = buildFilemap({ rootDir });
  } catch {
    return { ok: false, reason: 'git-failed' };
  }

  const actual = readFileSync(filePath, 'utf8');
  if (actual !== expected) return { ok: false, reason: 'drift', expected, actual };
  return { ok: true };
}

/** First line (1-indexed) at which `expected` and `actual` diverge, for a precise error message. */
export function firstDiff(expected, actual) {
  const e = expected.split('\n');
  const a = actual.split('\n');
  const n = Math.max(e.length, a.length);
  for (let i = 0; i < n; i++) {
    if (e[i] !== a[i]) {
      return {
        line: i + 1,
        expected: e[i] ?? '(no line — file is shorter)',
        actual: a[i] ?? '(no line — file is shorter)',
      };
    }
  }
  return null; // identical (shouldn't happen when reason === 'drift')
}

const FIX_HINT =
  '\n  Fix: run `npm run filemap` on a CLEAN tree (no unresolved rebase/merge — a conflicted\n' +
  '  `git ls-files` emits duplicate stage entries that corrupt the map), then commit the result.';

function main() {
  const rootDir = process.cwd();
  const result = checkFilemap(rootDir);

  if (result.ok) {
    console.log(`check-filemap: OK — ${FILEMAP_FILENAME} matches git ls-files.`);
    process.exit(0);
  }

  if (result.reason === 'missing-file') {
    console.error(`check-filemap: FAILED — ${FILEMAP_FILENAME} is missing.` + FIX_HINT);
    process.exit(1);
  }

  if (result.reason === 'git-failed') {
    console.error(
      'check-filemap: FAILED — `git ls-files` failed (not a git working tree?). The filemap gate ' +
        'needs a git checkout to know the tracked files.',
    );
    process.exit(1);
  }

  // reason === 'drift'
  const diff = firstDiff(result.expected, result.actual);
  console.error(
    `check-filemap: FAILED — ${FILEMAP_FILENAME} is stale or corrupt (it does not match ` +
      '`git ls-files`).',
  );
  if (diff) {
    console.error(`  first difference at line ${diff.line}:`);
    console.error(`    committed: ${JSON.stringify(diff.actual)}`);
    console.error(`    expected:  ${JSON.stringify(diff.expected)}`);
  }
  console.error(FIX_HINT);
  process.exit(1);
}

// CLI only when invoked directly (not when imported by the meta-test).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
