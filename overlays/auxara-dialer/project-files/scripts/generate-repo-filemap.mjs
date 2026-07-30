/**
 * REPO_FILEMAP.md generator + the shared `buildFilemap()` the gate reuses.
 *
 * ONE code path builds the map: this writer AND `scripts/check-filemap.mjs`
 * both call `buildFilemap()`, so the gate can never drift from the generator.
 * Run from repo root: `npm run filemap` (or `node scripts/generate-repo-filemap.mjs`).
 *
 * WHY THE GATE EXISTS (2026-07-02, branch refactor/dnc-status-centralization):
 *   the filemap was regenerated while a rebase conflict was unresolved. A conflicted
 *   `git ls-files` emits the same path THREE times (stage 1/2/3), so a conflicted row
 *   (REPO_FILEMAP.md itself) was baked in tripled — the header said "1086 paths" while a
 *   clean `git ls-files | wc -l` was 1084. `npm run verify` was GREEN because NO gate diffed
 *   the committed map against tracked files (only this generator ever touched it). Two fixes
 *   landed together: (a) `buildFilemap` now DEDUPES the `git ls-files` output, so a
 *   mid-conflict run can't triple a row at the source; (b) `scripts/check-filemap.mjs` fails
 *   the build when the committed map drifts from `buildFilemap`'s output (NFR-011).
 */
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The committed artifact this module owns. Shared with the gate — one literal, one source (Gate 11). */
export const FILEMAP_FILENAME = 'REPO_FILEMAP.md';

/**
 * The tree's root label. Deliberately a STABLE CONSTANT, NOT derived from `basename(rootDir)`:
 * REPO_FILEMAP.md is a committed artifact compared byte-for-byte by `check:filemap` across machines
 * and CI, whose checkout directory name varies (a CI runner may clone into `Nuvo-Dialer/`). A derived
 * label would make the gate false-fail wherever the folder name differs; a constant keeps it portable.
 */
export const PROJECT_ROOT_LABEL = 'Nuvo Dialer';

function addPath(tree, parts) {
  if (parts.length === 1) {
    tree.files.push(parts[0]);
    return;
  }
  const [head, ...rest] = parts;
  if (!tree.dirs.has(head)) {
    tree.dirs.set(head, { dirs: new Map(), files: [] });
  }
  addPath(tree.dirs.get(head), rest);
}

function walk(node, lines, prefix) {
  const dirEntries = [...node.dirs.entries()].sort(([a], [b]) => a.localeCompare(b));
  const fileEntries = [...node.files].sort((a, b) => a.localeCompare(b));
  const items = [
    ...dirEntries.map(([name, child]) => ({ kind: 'dir', name, child })),
    ...fileEntries.map((name) => ({ kind: 'file', name })),
  ];

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const line = `${prefix}${branch}${item.name}${item.kind === 'dir' ? '/' : ''}`;
    lines.push(line);
    if (item.kind === 'dir') {
      const ext = isLast ? '    ' : '│   ';
      walk(item.child, lines, prefix + ext);
    }
  });
}

/** Default source of tracked paths: `git ls-files` run in `rootDir`. Throws if it is not a git tree. */
export function gitLsFiles(rootDir) {
  return execSync('git ls-files', { cwd: rootDir, encoding: 'utf8' });
}

/**
 * Build the full REPO_FILEMAP.md contents (a string, LF line endings, single trailing newline) from
 * the Git-tracked paths in `rootDir`. `listTrackedFiles(rootDir) -> string` is injectable for tests;
 * it defaults to `git ls-files`. The raw list is DEDUPED before use, so a mid-rebase-conflict
 * `git ls-files` (which emits stage-1/2/3 duplicates of a conflicted path) can never triple a row.
 */
export function buildFilemap({ rootDir = process.cwd(), listTrackedFiles = gitLsFiles } = {}) {
  const listed = listTrackedFiles(rootDir);

  const paths = [
    ...new Set(
      listed
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]
    .filter((p) => existsSync(join(rootDir, p)))
    .sort((a, b) => a.localeCompare(b));

  const tree = { dirs: new Map(), files: [] };
  for (const p of paths) {
    addPath(tree, p.split('/'));
  }

  const lines = [];
  lines.push('# Repository file map');
  lines.push('');
  lines.push(
    'Auto-generated listing of **Git-tracked paths that exist in the current working tree**. Regenerate after adding, renaming, or removing files:',
  );
  lines.push('');
  lines.push('```bash');
  lines.push('npm run filemap');
  lines.push('# or: node scripts/generate-repo-filemap.mjs');
  lines.push('```');
  lines.push('');
  // NO PATH COUNT HERE, deliberately (2026-07-26). A `— N paths.` suffix changes on EVERY branch that
  // adds or removes ANY tracked file anywhere, so it is the one line two otherwise-unrelated branches
  // are GUARANTEED to conflict on — and it conflicted on essentially every parallel branch this
  // project ran. It is also duplicated derived state: the tree below IS the list, so the count only
  // restates what the file already says and can only ever disagree with it. It has already caused one
  // real corruption: regenerating mid-conflict baked a tripled path in, and the header read
  // "1086 paths" against a true 1084 (see scripts/check-filemap.mjs's header). `gate:filemap` now
  // byte-compares the whole file against a fresh in-memory build, so the count's diagnostic value is
  // superseded by a strictly stronger check. For the number, `git ls-files | wc -l` is the source.
  lines.push('_Generated from `git ls-files`, filtered to existing paths._');
  lines.push('');
  lines.push('```');
  lines.push(`${PROJECT_ROOT_LABEL}/`);
  walk(tree, lines, '');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ── CLI: write REPO_FILEMAP.md ─────────────────────────────────────────────────────────────────────
function main() {
  const rootDir = process.cwd();
  let contents;
  try {
    contents = buildFilemap({ rootDir });
  } catch {
    console.error('generate-repo-filemap: git ls-files failed (not a git repo?)');
    process.exit(1);
  }
  const outPath = join(rootDir, FILEMAP_FILENAME);
  writeFileSync(outPath, contents, 'utf8');
  console.log(`Wrote ${outPath}`);
}

// Run as CLI only when invoked directly (NOT when imported by the gate or the meta-test — importing
// must be side-effect-free, or `import { buildFilemap }` would run git + overwrite the file).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
