/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: core/coordination/adr-numbering.mjs — `analyzeAdrNames` (the pure core) and
 * `runAdrNumberingGate` (the runner a project's thin entry script binds to its own ADR directory and
 * naming convention).
 *
 * Authority: the project's ADR directory + its configured ADR naming convention
 *
 * What this test proves about the product:
 * - Two ADR files sharing one number key FAIL under BOTH shipped conventions — the git-clean collision
 *   (separate files, no merge conflict) two parallel agents create when each takes "the next ADR number".
 * - Each convention keys the collision on the right thing: `domain-numbered` is per-DOMAIN (so
 *   ADR-ARC-001 and ADR-BIL-001 coexist), `sequential` is one global sequence.
 * - A malformed ADR-shaped filename FAILS; a non-ADR file (a README) is ignored rather than flagged.
 * - The runner is FAIL-CLOSED: an unknown convention id, an unreadable directory, or an ADR directory
 *   with no ADR files exits 1 rather than certifying something it never scanned.
 *
 * Killer mutation: each one below must turn the NAMED case red, not merely redden the suite.
 * - Key `domain-numbered` on the number alone (drop the domain) → "different DOMAINS may share a number" fails.
 * - Make `isCandidate` accept every file → "a README is not an ADR" fails.
 * - Make `conventionFor` fall back to a default instead of throwing → "unknown convention" fails.
 * - Make the runner return 0 when the directory is empty/unreadable → the fail-closed cases fail.
 * Gated command: npm run gates:all
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ADR_CONVENTION_IDS,
  analyzeAdrNames,
  collectAdrNames,
  conventionFor,
  runAdrNumberingGate,
} from './adr-numbering.mjs';

const silent = { stdout: () => {}, stderr: () => {} };
const domain = conventionFor('domain-numbered');
const sequential = conventionFor('sequential');

function scaffoldAdrs(names) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-num-'));
  for (const name of names) fs.writeFileSync(path.join(root, name), `# ${name}\n`, 'utf8');
  return root;
}

test('both shipped conventions are registered and resolvable', () => {
  assert.deepEqual([...ADR_CONVENTION_IDS].sort(), ['domain-numbered', 'sequential']);
});

test('domain-numbered: two ADRs sharing DOMAIN+number collide (the parallel-agent class)', () => {
  const { errors } = analyzeAdrNames(
    ['ADR-BIL-004-invoices.md', 'ADR-BIL-004-tax-lines.md'],
    domain,
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate ADR number BIL-4/);
  assert.match(errors[0], /ADR-BIL-004-invoices\.md AND ADR-BIL-004-tax-lines\.md/);
});

test('domain-numbered: different DOMAINS may share a number (per-domain sequences)', () => {
  const { errors, uniqueKeys } = analyzeAdrNames(
    ['ADR-ARC-001-a.md', 'ADR-BIL-001-b.md', 'ADR-COMPANION-RAW-DIAL-001-c.md'],
    domain,
  );
  assert.deepEqual(errors, []);
  assert.equal(uniqueKeys, 3, 'a multi-segment domain must resolve to its own key, not ARC/BIL');
});

test('sequential: two ADRs sharing the global number collide; distinct numbers pass', () => {
  assert.equal(analyzeAdrNames(['003-a.md', '003-b.md'], sequential).errors.length, 1);
  assert.deepEqual(analyzeAdrNames(['000-template.md', '001-a.md'], sequential).errors, []);
});

test('sequential: zero-padding is not part of the key — 007 and 7 are the SAME ADR number', () => {
  const { errors } = analyzeAdrNames(['007-a.md', '7-b.md'], sequential);
  assert.equal(errors.length, 1, 'padding must not hide a real duplicate');
  assert.match(errors[0], /duplicate ADR number 7/);
});

test('a malformed ADR-shaped filename FAILS under each convention', () => {
  assert.match(analyzeAdrNames(['ADR-BIL-invoices.md'], domain).errors[0], /malformed/);
  assert.match(analyzeAdrNames(['12_snake_case.md'], sequential).errors[0], /malformed/);
});

test('a README is not an ADR: it is ignored, never counted and never flagged as malformed', () => {
  const domainResult = analyzeAdrNames(['README.md', 'ADR-ARC-001-a.md'], domain);
  assert.deepEqual(domainResult.errors, []);
  assert.equal(domainResult.count, 1);
  const sequentialResult = analyzeAdrNames(['README.md', '001-a.md'], sequential);
  assert.deepEqual(sequentialResult.errors, []);
  assert.equal(sequentialResult.count, 1);
});

test('collectAdrNames reads only .md files from the directory', () => {
  const root = scaffoldAdrs(['ADR-ARC-001-a.md', 'README.md']);
  try {
    fs.writeFileSync(path.join(root, 'notes.txt'), 'x', 'utf8');
    assert.deepEqual(collectAdrNames(root).sort(), ['ADR-ARC-001-a.md', 'README.md']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runner: a real duplicate in a scaffolded directory EXITS 1 with the reserve hint', () => {
  const root = scaffoldAdrs(['ADR-BIL-004-a.md', 'ADR-BIL-004-b.md']);
  const err = [];
  try {
    const code = runAdrNumberingGate({
      adrDir: root,
      convention: 'domain-numbered',
      reserveCli: 'scripts/reserve.mjs',
      stdout: () => {},
      stderr: (line) => err.push(line),
    });
    assert.equal(code, 1);
    assert.match(err.join('\n'), /node scripts\/reserve\.mjs adr BIL <title>/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runner: a clean directory EXITS 0 and its OK line states the scope it does NOT certify', () => {
  const root = scaffoldAdrs(['ADR-ARC-001-a.md', 'ADR-BIL-002-b.md']);
  const out = [];
  try {
    assert.equal(
      runAdrNumberingGate({
        adrDir: root,
        convention: 'domain-numbered',
        stdout: (line) => out.push(line),
        stderr: () => {},
      }),
      0,
    );
    assert.match(out.join('\n'), /2 ADR\(s\) under the domain-numbered convention/);
    assert.match(out.join('\n'), /does not certify ADR CONTENT/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('runner is FAIL-CLOSED on an unknown convention, an unreadable dir, and an empty dir', () => {
  assert.throws(() => conventionFor('made-up'), /unknown ADR naming convention/);
  const root = scaffoldAdrs(['ADR-ARC-001-a.md']);
  try {
    assert.equal(runAdrNumberingGate({ adrDir: root, convention: 'made-up', ...silent }), 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  assert.equal(
    runAdrNumberingGate({
      adrDir: path.join(os.tmpdir(), 'definitely-not-a-real-adr-dir-xyz'),
      convention: 'sequential',
      ...silent,
    }),
    1,
  );
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-num-empty-'));
  try {
    assert.equal(runAdrNumberingGate({ adrDir: empty, convention: 'sequential', ...silent }), 1);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
