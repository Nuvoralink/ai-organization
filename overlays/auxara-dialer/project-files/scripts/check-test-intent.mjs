#!/usr/bin/env node

/**
 * Enforce the `test-intent` rule.
 *
 * Every test file under backend/src, frontend/src, and frontend/e2e must declare in its
 * header what product behavior it proves. See:
 *   .claude/rules/test-intent.md
 *
 * This gate:
 *   1. Skips if backend/src, frontend/src, and frontend/e2e don't exist yet (bootstrap).
 *   2. Walks every *.test.ts(x), *.spec.ts(x), and *Regression*.{ts,mjs} file.
 *   3. Reads the file's top-of-file comment block.
 *   4. Requires: Proves:, Test type:, Surface:, Authority:, and a "What this
 *      test proves about the product:" line.
 *   5. Validates every ID in `Proves:` resolves to a known requirement, NFR,
 *      benchmark, decision-log row, or bug-backlog row.
 *
 * Exit code 0 = pass; 1 = fail.
 *
 * Run: `npm run gate:test-intent`
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

// ----- Bootstrap guard ------------------------------------------------------

const hasBackend = fs.existsSync(path.join(root, 'backend/src'));
const hasFrontend = fs.existsSync(path.join(root, 'frontend/src'));
const hasFrontendE2e = fs.existsSync(path.join(root, 'frontend/e2e'));
if (!hasBackend && !hasFrontend && !hasFrontendE2e) {
  console.log(
    'check-test-intent: backend/src, frontend/src, and frontend/e2e not scaffolded yet — skipping.',
  );
  process.exit(0);
}

// ----- Resolve catalogs of valid IDs ---------------------------------------

function readIfExists(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

const prdText = readIfExists(path.join(root, 'docs/app-plan/product/02-prd.md'));
const benchText = readIfExists(
  path.join(root, 'docs/app-plan/product/30-competitive-benchmarks.md'),
);
const decisionText = readIfExists(path.join(root, 'docs/app-plan/auditability/decision-log.md'));
const backlogText = readIfExists(path.join(root, 'docs/BUG_BACKLOG.md'));
const adrDir = path.join(root, 'docs/app-plan/architecture/adr');
const adrTexts = fs.existsSync(adrDir)
  ? fs
      .readdirSync(adrDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => readIfExists(path.join(adrDir, entry.name)))
  : [];

const validReqIds = new Set();
const validNfrIds = new Set();
const validBenchIds = new Set();
const validDecisionIds = new Set();
const validBacklogIds = new Set();
const validAdrIds = new Set();

if (prdText) {
  for (const m of prdText.matchAll(/\b(REQ-[A-Z]+-\d+)\b/g)) validReqIds.add(m[1]);
  for (const m of prdText.matchAll(/\b(NFR-\d+)\b/g)) validNfrIds.add(m[1]);
}
if (benchText) {
  for (const m of benchText.matchAll(/\b(BENCH-(?:CON|PRO)-[A-Z0-9-]+)\b/g))
    validBenchIds.add(m[1]);
}
if (decisionText) {
  for (const m of decisionText.matchAll(/^\|\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\s*\|/gm)) {
    validDecisionIds.add(m[1]);
  }
}
if (backlogText) {
  for (const m of backlogText.matchAll(/^#{2,6}\s+([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/gm)) {
    validBacklogIds.add(m[1]);
  }
}
for (const adrText of adrTexts) {
  for (const m of adrText.matchAll(/^#\s+(ADR-[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/gm)) {
    validAdrIds.add(m[1]);
  }
}

function isValidId(id) {
  return (
    validReqIds.has(id) ||
    validNfrIds.has(id) ||
    validBenchIds.has(id) ||
    validDecisionIds.has(id) ||
    validBacklogIds.has(id) ||
    validAdrIds.has(id)
  );
}

// ----- Walk test files ------------------------------------------------------

// Per .claude/rules/test-intent.md §5: *.test.ts|tsx, *.spec.ts|tsx, **/*Regression*.{ts,mjs}
// ("Regression" anywhere in the filename — e.g. dialRegressionMatrix.ts — not only as a suffix).
const testPatterns = [/\.test\.tsx?$/, /\.spec\.tsx?$/, /Regression[^/\\]*\.(ts|mjs)$/];

function isTestFile(p) {
  return testPatterns.some((re) => re.test(p));
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      out.push(...walk(full));
    } else if (isTestFile(full)) {
      out.push(full);
    }
  }
  return out;
}

const testFiles = [
  ...walk(path.join(root, 'backend/src')),
  ...walk(path.join(root, 'frontend/src')),
  ...walk(path.join(root, 'frontend/e2e')),
];

if (testFiles.length === 0) {
  console.log(
    'check-test-intent: no test files found — skipping (gate will engage once tests land).',
  );
  process.exit(0);
}

// ----- Parse each test file's intent header --------------------------------

const allowedTypes = new Set([
  'unit',
  'integration',
  'e2e',
  'contract',
  'regression',
  'smoke',
  'source-to-screen',
  'tenant-isolation',
  'compliance-audit',
  'bounded-repair',
]);

const failures = [];

function relPath(p) {
  return path.relative(root, p).replaceAll('\\', '/');
}

function readHeader(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  // Match a leading block comment within the first 200 lines
  const match = text.match(/^﻿?\s*\/\*\*([\s\S]*?)\*\//);
  if (!match) return null;
  return match[1];
}

function extractLineValue(headerBody, key) {
  // Match `key: value` lines, tolerating ` * ` prefix.
  const re = new RegExp(`^\\s*\\*?\\s*${key}\\s*:\\s*(.+?)\\s*$`, 'm');
  const m = headerBody.match(re);
  return m ? m[1].trim() : null;
}

function extractIds(s) {
  const candidates = s.match(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g) ?? [];
  // `Proves:` is an ID-only field. Keep every catalog-shaped token so a typo beside one valid ID
  // cannot disappear before unresolved-ID validation (for example `NFR-011, BUX-999`).
  return [...new Set(candidates)];
}

let passCount = 0;

for (const file of testFiles) {
  const rel = relPath(file);
  const headerBody = readHeader(file);
  if (!headerBody) {
    failures.push(`${rel}: missing leading /** ... */ intent header`);
    continue;
  }

  const proves = extractLineValue(headerBody, 'Proves');
  const testType = extractLineValue(headerBody, 'Test type');
  const surface = extractLineValue(headerBody, 'Surface');
  const authority = extractLineValue(headerBody, 'Authority');
  // The "What this test proves about the product:" line introduces a paragraph;
  // just require the literal label is present.
  const provesProductMatch = headerBody.match(/What this test proves about the product\s*:/i);

  const local = [];
  if (!proves) local.push(`missing "Proves:" line`);
  if (!testType) local.push(`missing "Test type:" line`);
  if (!surface) local.push(`missing "Surface:" line`);
  if (!authority) local.push(`missing "Authority:" line`);
  if (!provesProductMatch) local.push(`missing "What this test proves about the product:" line`);

  if (proves) {
    const ids = extractIds(proves);
    if (ids.length === 0) {
      local.push(`"Proves:" has no requirement, NFR, benchmark, decision, or backlog IDs`);
    } else {
      const unresolved = ids.filter((id) => !isValidId(id));
      if (unresolved.length > 0) {
        local.push(
          `"Proves:" contains unresolved IDs: ${unresolved.join(', ')} (not in PRD, benchmarks, decision log, architecture ADRs, or bug backlog)`,
        );
      }
    }
  }

  if (testType && !allowedTypes.has(testType.toLowerCase())) {
    local.push(
      `"Test type:" value "${testType}" not in allowed set [${[...allowedTypes].join(', ')}]`,
    );
  }

  if (local.length > 0) {
    failures.push(`${rel}:\n  - ${local.join('\n  - ')}`);
  } else {
    passCount += 1;
  }
}

// ----- Report ---------------------------------------------------------------

console.log(`check-test-intent: ${passCount} test file(s) passed, ${failures.length} failed.`);
if (failures.length > 0) {
  console.error('');
  console.error('check-test-intent: the following test files have intent-header issues:');
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  console.error('');
  console.error('See .claude/rules/test-intent.md for the required header format.');
  process.exit(1);
}

process.exit(0);
