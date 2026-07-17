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
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\n/g, '\r\n'));
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
