/**
 * Proves: REQ-ORG-003
 * Test type: regression
 * Surface: universal-to-CoachAI orchestration overlay ownership and drift detection
 * Authority: .ai-organization/ownership.json and overlay-lock.json
 * What this test proves about the product: managed orchestration drift fails while project product/source content stays outside universal ownership.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkOverlayParity, writeOverlayLock } from '../check-overlay-parity.mjs';
import { organizationFixture } from './fixture-helpers.mjs';

const source = process.cwd();

test('clean overlay parity passes', () => {
  assert.equal(checkOverlayParity(organizationFixture(source)).ok, true);
});

test('killer mutations: modified, missing, and newly added managed files fail', () => {
  const modified = organizationFixture(source);
  fs.appendFileSync(path.join(modified, 'AGENTS.md'), '\ndrift\n');
  assert.match(checkOverlayParity(modified).errors.join('\n'), /managed file modified/i);

  const missing = organizationFixture(source);
  fs.rmSync(path.join(missing, '.claude/agents/ui-verifier.md'));
  assert.match(checkOverlayParity(missing).errors.join('\n'), /managed file missing/i);

  const added = organizationFixture(source);
  fs.writeFileSync(path.join(added, '.claude/agents/shadow.md'), 'shadow');
  assert.match(checkOverlayParity(added).errors.join('\n'), /unlocked file added/i);

  const missingJsonSection = organizationFixture(source);
  const packageFile = path.join(missingJsonSection, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  delete packageJson.scripts['test:evidence-integrity-mutation'];
  fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2));
  assert.doesNotThrow(() => checkOverlayParity(missingJsonSection));
  assert.match(checkOverlayParity(missingJsonSection).errors.join('\n'), /managed JSON section modified or missing/i);
  assert.throws(() => writeOverlayLock(missingJsonSection), /managed JSON section modified or missing/i);
  assert.equal(checkOverlayParity(missingJsonSection).ok, false);
});

test('project product and source files are ignored by overlay parity', () => {
  const root = organizationFixture(source);
  fs.mkdirSync(path.join(root, 'backend/src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'backend/src/project-owned.ts'), 'export const value = 1;');
  fs.mkdirSync(path.join(root, 'docs/app-plan/product'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/app-plan/product/project-owned.md'), '# Project');
  assert.equal(checkOverlayParity(root).ok, true);
});

test('checkout line-ending convention does not create false overlay drift', () => {
  const root = organizationFixture(source);
  const file = path.join(root, 'AGENTS.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\r?\n/g, '\r\n'));
  assert.equal(checkOverlayParity(root).ok, true);
});

test('explicit lock refresh records the current declared managed surface', () => {
  const root = organizationFixture(source);
  const file = path.join(root, 'AGENTS.md');
  fs.appendFileSync(file, '\nintentional managed update\n');
  assert.equal(checkOverlayParity(root).ok, false);
  writeOverlayLock(root);
  assert.equal(checkOverlayParity(root).ok, true);
});

test('append-only learned-classes region is excluded from parity, and the exclusion is load-bearing', () => {
  const root = organizationFixture(source);
  const agentFile = path.join(root, '.claude/agents/adversarial-reviewer.md');
  assert.match(fs.readFileSync(agentFile, 'utf8'), /^## Learned classes/m, 'fixture agent file must carry the append-only marker');

  // The closed-loop-learning flow appends learned-class rows over a project's life; that must NOT trip
  // overlay parity — the overlay owns control-plane STRUCTURE, not accumulated project content.
  fs.appendFileSync(agentFile, '\n- 2026-07-24: a newly learned class row.\n');
  assert.equal(checkOverlayParity(root).ok, true, 'a learned-classes append must stay clean');

  // Killer mutation — drop the marker declaration and relock the current file as an honest baseline;
  // a further learned-classes append must now trip parity, proving the exclusion (not incidental slack)
  // is what kept the append above clean.
  const ownershipFile = path.join(root, '.ai-organization/ownership.json');
  const ownership = JSON.parse(fs.readFileSync(ownershipFile, 'utf8'));
  ownership.append_only_markers = [];
  fs.writeFileSync(ownershipFile, `${JSON.stringify(ownership, null, 2)}\n`);
  writeOverlayLock(root);
  assert.equal(checkOverlayParity(root).ok, true, 'relock under empty markers is a clean baseline');
  fs.appendFileSync(agentFile, '\n- 2026-07-24: another row after relock.\n');
  assert.match(
    checkOverlayParity(root).errors.join('\n'),
    /managed file modified: \.claude\/agents\/adversarial-reviewer\.md/,
    'with the marker removed, the same learned-classes append must trip parity',
  );
});

test('structural change ABOVE the append-only marker still trips overlay parity', () => {
  const root = organizationFixture(source);
  const agentFile = path.join(root, '.claude/agents/adversarial-reviewer.md');
  const text = fs.readFileSync(agentFile, 'utf8');
  const markerIdx = text.search(/^## Learned classes/m);
  assert.ok(markerIdx > 0, 'marker present with structure above it');
  // Mutate a line in the managed structure above the marker — excluding the live-log must not blind
  // the file's governed role/tools/procedure content.
  fs.writeFileSync(agentFile, `${text.slice(0, markerIdx).replace(/\n/, ' STRUCTURAL-DRIFT\n')}${text.slice(markerIdx)}`);
  assert.match(
    checkOverlayParity(root).errors.join('\n'),
    /managed file modified: \.claude\/agents\/adversarial-reviewer\.md/,
    'structure above the marker must remain parity-protected',
  );
});
