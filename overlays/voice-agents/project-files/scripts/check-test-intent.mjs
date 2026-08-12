#!/usr/bin/env node
/**
 * gate:test-intent — every test file declares what product decision it proves, and the `Proves:` IDs resolve.
 *
 * The requirement catalog is `docs/requirements.md`; the rule is
 * `.claude/rules/test-intent.md`. Exit 0 = pass; 1 = fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { isTestFile } from './lib/test-file-match.mjs';

const root = process.cwd();
const failures = [];

// ----- src dirs to walk -----
const SRC_DIRS = ['packages', 'tests', 'scripts/tests'];
const existingSrc = SRC_DIRS.filter((d) => fs.existsSync(path.join(root, d)));
if (existingSrc.length === 0) {
  console.error(
    `check-test-intent: FAILED — no source dirs found (${SRC_DIRS.join(', ')}); proof discovery cannot be empty.`,
  );
  process.exit(1);
}

// ----- resolve typed catalogs of valid proof IDs -----
const readIfExists = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
};
const COMPLETE_EXECUTABLE_ID_SOURCE_FILES = ['docs/requirements.md'];
const RESOLUTION_ONLY_ID_SOURCE_FILES = [];
const executableIds = new Set();
const resolutionOnlyIds = new Set();
const executableOrigins = new Map();
const catalogIdPattern = '[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+';
const executableRow = new RegExp('^\\s*-\\s+`(' + catalogIdPattern + ')`\\s+—\\s+\\S.*$', 'u');
const catalogBullet = /^\s*-\s+/u;
const broadCatalogId = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/g;

if (COMPLETE_EXECUTABLE_ID_SOURCE_FILES.length === 0) {
  failures.push('no complete executable ID source is configured');
}
for (const source of COMPLETE_EXECUTABLE_ID_SOURCE_FILES) {
  const absolute = path.join(root, source);
  let text;
  try {
    text = fs.readFileSync(absolute, 'utf8');
  } catch {
    failures.push(`complete executable ID source is missing or unreadable: ${source}`);
    continue;
  }
  let exactRows = 0;
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    if (!catalogBullet.test(line)) continue;
    const match = line.match(executableRow);
    if (!match) {
      failures.push(
        `${source}:${String(index + 1)}: malformed executable catalog row; expected - \`ID\` — description`,
      );
      continue;
    }
    exactRows += 1;
    const id = match[1];
    if (executableIds.has(id)) {
      failures.push(
        `duplicate executable catalog ID ${id}: ${executableOrigins.get(id)} and ${source}:${String(index + 1)}`,
      );
    } else {
      executableIds.add(id);
      executableOrigins.set(id, `${source}:${String(index + 1)}`);
    }
  }
  if (exactRows === 0) {
    failures.push(
      `complete executable ID source contains zero exact executable ID rows: ${source}`,
    );
  }
}
for (const source of RESOLUTION_ONLY_ID_SOURCE_FILES) {
  const absolute = path.join(root, source);
  let text;
  try {
    text = fs.readFileSync(absolute, 'utf8');
  } catch {
    failures.push(`resolution-only ID source is missing or unreadable: ${source}`);
    continue;
  }
  for (const match of text.matchAll(broadCatalogId)) resolutionOnlyIds.add(match[1]);
}
for (const id of executableIds) {
  if (resolutionOnlyIds.has(id)) {
    failures.push(`catalog ID ${id} is classified as both complete executable and resolution-only`);
  }
}
if (executableIds.size === 0) {
  failures.push('configured complete executable catalogs contain zero executable IDs');
}
const validIds = new Set([...executableIds, ...resolutionOnlyIds]);
const isValidId = (id) => validIds.has(id);

// ----- allowed test types -----
const allowedTypes = new Set([
  'unit',
  'integration',
  'e2e',
  'contract',
  'regression',
  'smoke',
  'source-to-screen',
  'tenant-isolation',
  'bounded-repair',
  'mutation',
  'concurrency',
  'replay',
]);

// ----- walk test files -----
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      out.push(...walk(full));
    } else if (isTestFile(full)) out.push(full);
  }
  return out;
}
const testFiles = existingSrc.flatMap((d) => walk(path.join(root, d)));
if (testFiles.length === 0) {
  console.error(
    'check-test-intent: FAILED — no test files discovered; proof execution cannot be empty.',
  );
  process.exit(1);
}

// ----- parse each header -----
const packageManifest = JSON.parse(readIfExists(path.join(root, 'package.json')) || '{}');
const packageScripts = packageManifest.scripts ?? {};
const rootProofLanes = Object.keys(packageScripts).filter((scriptName) =>
  /^(?:test(?::|$)|verify$|ci$|gates:all$)/u.test(scriptName),
);
const scriptCallPattern = /\b(?:npm|pnpm|yarn)(?:\.cmd)?\s+run\s+([A-Za-z0-9:._-]+)\b/gu;

function referencedPackageScripts(command) {
  return [...String(command).matchAll(scriptCallPattern)].map((match) => match[1]);
}

function inspectProofLane(rootScript) {
  const visited = new Set();
  const active = [];

  function visit(scriptName) {
    const cycleStart = active.indexOf(scriptName);
    if (cycleStart !== -1) {
      failures.push(
        `package.json#scripts.${rootScript}: cyclic proof lane ${[
          ...active.slice(cycleStart),
          scriptName,
        ].join(' -> ')}`,
      );
      return;
    }
    if (visited.has(scriptName)) return;
    const command = packageScripts[scriptName];
    if (typeof command !== 'string') {
      failures.push(
        `package.json#scripts.${rootScript}: unresolved package-script runner ${scriptName}`,
      );
      return;
    }
    visited.add(scriptName);
    active.push(scriptName);
    if (/(?:--passWithNoTests|passWithNoTests)/u.test(command)) {
      failures.push(
        `package.json#scripts.${rootScript}: ignore-empty test execution is forbidden via scripts.${scriptName}`,
      );
    }
    for (const referenced of referencedPackageScripts(command)) visit(referenced);
    active.pop();
  }

  visit(rootScript);
}
for (const rootScript of rootProofLanes) inspectProofLane(rootScript);
const relPath = (p) => path.relative(root, p).replaceAll('\\', '/');
const readHeader = (fp) => {
  const t = fs.readFileSync(fp, 'utf8');
  const m = t.match(/^\uFEFF?\s*\/\*\*([\s\S]*?)\*\//);
  return m ? m[1] : null;
};
const extractLineValue = (h, k) => {
  const m = h.match(new RegExp(`^\\s*\\*?\\s*${k}\\s*:\\s*(.+?)\\s*$`, 'm'));
  return m ? m[1].trim() : null;
};
// Keep every catalog-shaped candidate. Filtering to known IDs here would make an unresolved typo
// disappear before the validation below (for example `NFR-011, BUX-999`).
const extractIds = (s) => [...new Set(s.match(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g) ?? [])];
const claimedIds = new Set();

for (const file of testFiles) {
  const rel = relPath(file);
  const h = readHeader(file);
  if (!h) {
    failures.push(`${rel}: missing leading /** ... */ intent header`);
    continue;
  }
  const local = [];
  const proves = extractLineValue(h, 'Proves');
  if (!proves) local.push('missing "Proves:" line');
  if (!extractLineValue(h, 'Test type')) local.push('missing "Test type:" line');
  if (!extractLineValue(h, 'Surface')) local.push('missing "Surface:" line');
  if (!extractLineValue(h, 'Authority')) local.push('missing "Authority:" line');
  if (!h.match(/What this test proves about the product\s*:/i))
    local.push('missing "What this test proves about the product:" line');
  if (!extractLineValue(h, 'Killer mutation')) local.push('missing "Killer mutation:" line');
  if (!extractLineValue(h, 'Gated command')) local.push('missing "Gated command:" line');
  if (proves) {
    const ids = extractIds(proves);
    if (ids.length === 0) local.push('"Proves:" has no catalog-shaped requirement/decision IDs');
    else {
      for (const id of ids) claimedIds.add(id);
      const bad = ids.filter((id) => !isValidId(id));
      if (bad.length) local.push(`"Proves:" contains unresolved IDs: ${bad.join(', ')}`);
    }
  }
  const tt = extractLineValue(h, 'Test type');
  if (tt && !allowedTypes.has(tt.toLowerCase()))
    local.push(`"Test type:" value "${tt}" not in allowed set [${[...allowedTypes].join(', ')}]`);
  if (local.length) failures.push(`${rel}:\n  - ${local.join('\n  - ')}`);
}

for (const id of executableIds) {
  if (!claimedIds.has(id)) {
    failures.push(
      `complete executable ID has no discovered test-file claim: ${id} (${executableOrigins.get(id)})`,
    );
  }
}

if (failures.length) {
  console.error(`check-test-intent: FAILED — ${failures.length} invariant violation(s):\n`);
  for (const f of failures) console.error('  x ' + f);
  console.error('\nSee .claude/rules/test-intent.md for the required header.');
  process.exit(1);
}
console.log(
  `check-test-intent: OK — test_files=${String(testFiles.length)} executable_ids=${String(executableIds.size)} covered_executable_ids=${String([...executableIds].filter((id) => claimedIds.has(id)).length)} resolution_only_ids=${String(resolutionOnlyIds.size)}`,
);
process.exit(0);
