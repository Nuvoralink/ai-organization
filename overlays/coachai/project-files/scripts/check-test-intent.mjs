#!/usr/bin/env node

/**
 * Enforce the `test-intent` rule for Nuvora CoachAI.
 *
 * Every NEW or CHANGED test file must declare, in a top-of-file `/** ... *\/`
 * block comment, what product behavior it proves:
 *   Proves: <CQ-### / REQ-AREA-### / G-### / GROUND-### / #issue IDs>
 *   Test type: <unit | integration | contract | regression | ...>
 *   Surface: <the user-visible or system surface under test>
 *   Authority: <which source-of-truth owns the asserted decision>
 *   What this test proves about the product: <one line; the regression it defends>
 *
 * Doctrine: ~/.claude/rules/test-intent.md + .cursor/rules/testing-guardrails.mdc.
 *
 * Scoping — why not all files: CoachAI has ~300 legacy test files with no header.
 * Forcing a header on all of them at once is a retrofit, not a gate. So enforcement
 * is GRANDFATHERED: by default we only check test files CHANGED vs the base ref, and
 * the PostToolUse hook checks exactly the file just edited (--file). New + touched
 * tests must comply; untouched legacy stays grandfathered. The whole surface can be
 * audited (and the retrofit driven to zero) with `--all` / `--all --strict`.
 *
 * Modes:
 *   (default)              check test files changed vs origin/main (+ staged/unstaged/untracked)
 *   --file <p> [--file ..] check exactly the given file(s); used by the edit-time hook (ratchet-on-touch)
 *   --all                  audit every test file; print compliant/legacy counts; exit 0 (informational)
 *   --all --strict         audit every test file; exit 1 if any are noncompliant (full-retrofit milestone)
 *
 * Exit 0 = pass; 1 = fail.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { isTestFile } from './lib/test-file-match.mjs';

const root = process.cwd();
const argv = process.argv.slice(2);
const flagAll = argv.includes('--all');
const flagStrict = argv.includes('--strict');
const explicitFiles = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--file' && argv[i + 1]) {
    explicitFiles.push(argv[i + 1]);
    i += 1;
  }
}

// ----- Test-file matching ---------------------------------------------------
// `isTestFile` / `TEST_PATTERNS` are single-sourced in scripts/lib/test-file-match.mjs so this gate
// and the PostToolUse hook (scripts/claude-posttooluse-gate.mjs) can never drift on what is a test.
// (*.test|spec.ts|tsx, or a basename ending in `Regression.ts|mjs` — the suffix anchor keeps helper
// /source files that merely contain "regression" out of the gate.)

// Test roots walked in --all mode (frontend + backend src/tests + backend regression scripts + shared).
const TEST_ROOTS = ['frontend/src', 'backend/src', 'backend/scripts', 'shared/src', 'scripts/tests'];

function walk(dir) {
  const abs = path.join(root, dir);
  const out = [];
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      out.push(...walk(rel));
    } else if (isTestFile(rel)) {
      out.push(rel);
    }
  }
  return out;
}

// ----- Changed-file detection (default mode) --------------------------------
function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function changedTestFiles() {
  // Resolve a base ref to diff against, most-specific first.
  let base = null;
  for (const ref of ['origin/main', 'main']) {
    const mb = git(['merge-base', ref, 'HEAD']);
    if (mb && mb.trim()) {
      base = mb.trim();
      break;
    }
  }
  const out = new Set();
  const collect = (text) => {
    if (!text) return;
    for (const line of text.split(/\r?\n/)) {
      const f = line.trim();
      if (f && isTestFile(f)) out.add(f.replace(/\\/g, '/'));
    }
  };
  if (base) collect(git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]));
  collect(git(['diff', '--name-only', '--diff-filter=ACMR'])); // unstaged
  collect(git(['diff', '--name-only', '--cached', '--diff-filter=ACMR'])); // staged
  collect(git(['ls-files', '--others', '--exclude-standard'])); // untracked
  // Only files that still exist on disk (a renamed/deleted path can show up in diffs).
  return [...out].filter((f) => fs.existsSync(path.join(root, f)));
}

// ----- Header parsing + validation (shared with the dialer's proven design) ---
const ALLOWED_TYPES = new Set([
  'unit',
  'integration',
  'e2e',
  'contract',
  'regression',
  'smoke',
  'source-to-screen',
  'tenant-isolation',
  'three-fold-paired',
  'bounded-repair',
  'visual',
  'permissions',
]);

// CoachAI ID shapes: CQ-### (coaching-quality), REQ-AREA-###, NFR-###, GROUND-### (grounding-guard
// backlog, docs/COACHING_BUG_BACKLOG.md), BENCH-(CON|PRO)-..., a GitHub issue ####, the UX/UI
// redesign-audit finding families in docs/design-system/00-UX-UI-AUDIT.md — G-### plus the surface
// prefixes IA/MGR/OWN/REP/ADM-### (e.g. MGR-8 = the /team roster-count fix) — and the page-design
// audit family in docs/design-system/02-PAGE-DESIGN-AUDIT.md — PD-<SURFACE>-### (PD-G-7, PD-CR-12,
// PD-MGR-4, PD-PUB-1, PD-REP-1, …). All those prefixes are one audit's real IDs; recognizing only G-
// rejected legitimate Proves: refs to its siblings. The `PD-[A-Z]+-\d+` branch is listed BEFORE the
// bare `(?:G|IA|MGR|…)-` branch so `PD-MGR-4` is captured as ONE PD token — not mis-read as `MGR-4`
// against the 00-audit catalog (the inner `MGR-4` is consumed by the PD match).
// NOTE: `#\d+` sits OUTSIDE the leading \b group — `#` is a non-word char, so `\b#` never matches
// after a space and the advertised #issue form was structurally unmatchable (caught 2026-07-03 when
// the first `Proves: #125` was rejected by the gate that documents that exact form).
const ID_RE = /\b(?:CQ-\d+|REQ-[A-Z]+-\d+|NFR-\d+|PD-[A-Z]+-\d+|(?:G|IA|MGR|OWN|REP|ADM)-\d+|GROUND-\d+|BENCH-(?:CON|PRO)-[A-Z0-9-]+)\b|#\d+\b/g;

// ----- ID RESOLUTION (typo guard) -------------------------------------------
// Presence-only ("does it look like an ID?") lets a typo'd `CQ-9999` sail through. So for the ID
// families that HAVE a source-of-truth catalog on disk, we RESOLVE each cited ID against that catalog
// and fail with the unresolved list. Families WITHOUT a per-ID register stay presence-only ON PURPOSE:
//   - REQ-*/NFR-*: CoachAI has no single machine-readable requirement register (REQ-DAI/SEC/PRICE/…
//     live scattered across regression headers + docs), so there is nothing to resolve against; a
//     future REQ register can be wired here.
//   - #\d+ GitHub issues: resolving these needs a network call to GitHub — out of scope for a fast,
//     offline, deterministic CI gate.
//   - BENCH-*: no benchmark catalog defined in CoachAI (would resolve if one is added).
// The catalog is loaded lazily + tolerantly: a missing catalog file degrades that family to
// presence-only (never a false CI failure), so the gate stays robust if a doc is renamed.
const CATALOG_SPECS = [
  { label: 'CQ-*', prefixRe: /^CQ-\d+$/, file: 'docs/app-plan/implementation/coaching-quality-upgrade-plan.md', idRe: /\bCQ-\d+\b/g },
  { label: 'GROUND-*', prefixRe: /^GROUND-\d+$/, file: 'docs/COACHING_BUG_BACKLOG.md', idRe: /\bGROUND-\d+\b/g },
  {
    label: 'G-/IA-/MGR-/OWN-/REP-/ADM-* (UX/UI audit)',
    prefixRe: /^(?:G|IA|MGR|OWN|REP|ADM)-\d+$/,
    file: 'docs/design-system/00-UX-UI-AUDIT.md',
    idRe: /\b(?:G|IA|MGR|OWN|REP|ADM)-\d+\b/g,
  },
  {
    label: 'PD-* (page-design audit)',
    prefixRe: /^PD-[A-Z]+-\d+$/,
    file: 'docs/design-system/02-PAGE-DESIGN-AUDIT.md',
    idRe: /\bPD-[A-Z]+-\d+\b/g,
  },
];

// Build one resolvable-ID set per catalog spec whose file exists on disk.
const catalogs = CATALOG_SPECS.map((spec) => {
  const abs = path.join(root, spec.file);
  let ids = null; // null = catalog absent → that family degrades to presence-only
  if (fs.existsSync(abs)) {
    ids = new Set([...fs.readFileSync(abs, 'utf8').matchAll(spec.idRe)].map((m) => m[0]));
  }
  return { ...spec, ids };
});

// Returns the unresolved IDs among `ids` for families that HAVE a loaded catalog. IDs whose family
// has no catalog (or whose catalog file is absent) are treated as resolved (presence-only fallback).
function unresolvedIds(ids) {
  const unresolved = [];
  for (const id of ids) {
    const cat = catalogs.find((c) => c.prefixRe.test(id));
    if (cat && cat.ids && !cat.ids.has(id)) unresolved.push(id);
  }
  return unresolved;
}

function readHeaderBody(absPath) {
  const text = fs.readFileSync(absPath, 'utf8');
  const m = text.match(/^﻿?\s*\/\*\*([\s\S]*?)\*\//);
  return m ? m[1] : null;
}

function field(headerBody, key) {
  const m = headerBody.match(new RegExp(`^\\s*\\*?\\s*${key}\\s*:\\s*(.+?)\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}

function validateFile(relRaw) {
  const abs = path.isAbsolute(relRaw) ? relRaw : path.join(root, relRaw);
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  if (!fs.existsSync(abs)) return { rel, skipped: 'missing' };
  if (!isTestFile(rel)) return { rel, skipped: 'not-a-test' };

  const body = readHeaderBody(abs);
  if (!body) return { rel, problems: ['missing a leading `/** ... */` intent header'] };

  const problems = [];
  const proves = field(body, 'Proves');
  if (!proves) problems.push('missing `Proves:` line');
  if (!field(body, 'Test type')) problems.push('missing `Test type:` line');
  if (!field(body, 'Surface')) problems.push('missing `Surface:` line');
  if (!field(body, 'Authority')) problems.push('missing `Authority:` line');
  if (!/What this test proves about the product\s*:/i.test(body))
    problems.push('missing `What this test proves about the product:` line');

  if (proves) {
    const ids = [...proves.matchAll(ID_RE)].map((m) => m[0]);
    if (ids.length === 0)
      problems.push('`Proves:` has no ID (need a CQ-###, REQ-AREA-###, G-###, or #issue)');
    else {
      const unresolved = unresolvedIds(ids);
      if (unresolved.length)
        problems.push(
          `\`Proves:\` cites ID(s) not found in the source-of-truth catalog: ${unresolved.join(', ')} ` +
            '(typo, or the ID does not exist — a cataloged CQ/GROUND/UX-audit ID must resolve)',
        );
    }
  }
  const testType = field(body, 'Test type');
  if (testType && !ALLOWED_TYPES.has(testType.toLowerCase()))
    problems.push(
      `\`Test type:\` "${testType}" not in [${[...ALLOWED_TYPES].join(', ')}]`,
    );

  return problems.length ? { rel, problems } : { rel, ok: true };
}

// ----- Select the files to check --------------------------------------------
let files;
let modeLabel;
if (explicitFiles.length) {
  files = explicitFiles;
  modeLabel = 'changed file(s) [--file]';
} else if (flagAll) {
  files = TEST_ROOTS.flatMap(walk);
  modeLabel = `all test files (audit${flagStrict ? ', strict' : ''})`;
} else {
  files = changedTestFiles();
  modeLabel = 'test files changed vs base';
}

// ----- Run + report ---------------------------------------------------------
const results = files.map(validateFile);
const checked = results.filter((r) => !r.skipped);
const failed = checked.filter((r) => r.problems);
const passed = checked.filter((r) => r.ok);

if (flagAll && !flagStrict) {
  // Informational audit: never blocks; shows the retrofit surface.
  console.log(
    `check-test-intent (audit): ${passed.length} compliant, ${failed.length} legacy/noncompliant of ${checked.length} test files.`,
  );
  console.log('  Run with `--all --strict` to fail on the remaining legacy files once retrofitted.');
  process.exit(0);
}

if (checked.length === 0) {
  console.log(`check-test-intent: no ${modeLabel} to check — passing.`);
  process.exit(0);
}

if (failed.length === 0) {
  console.log(`check-test-intent: ${passed.length}/${checked.length} ${modeLabel} have a valid intent header. ✓`);
  process.exit(0);
}

console.error(`check-test-intent: ${failed.length} of ${checked.length} ${modeLabel} are missing a valid test-intent header:\n`);
for (const r of failed) {
  console.error(`  ${r.rel}`);
  for (const p of r.problems) console.error(`    - ${p}`);
}
console.error(
  '\nAdd the header (see ~/.claude/rules/test-intent.md / .cursor/rules/testing-guardrails.mdc). Example:\n' +
    '  /**\n' +
    '   * Proves: CQ-009\n' +
    '   * Test type: bounded-repair\n' +
    '   * Surface: Call Review coaching footer\n' +
    '   * Authority: semanticJudgment bounded-repair trace\n' +
    '   * What this test proves about the product: a 2nd-pass repair that still fails\n' +
    '   *   traces `rejected` (not `repaired`) and the coaching line is stripped from output.\n' +
    '   */\n',
);
process.exit(1);
