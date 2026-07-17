/**
 * Proves: REQ-ORG-005
 * Test type: regression
 * Surface: changed-path risk selection and proof execution
 * Authority: .ai-organization/proof-profiles.json
 * What this test proves about the product: a task cannot complete without the proof selected by its changed paths and persistence risk.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runSelectedProof, selectProof } from '../run-risk-selected-proof.mjs';
import { tempFixture, writeJson } from './fixture-helpers.mjs';

function fixture(command = `"${process.execPath}" -e "process.exit(0)"`) {
  const root = tempFixture();
  fs.mkdirSync(path.join(root, '.ai-organization'), { recursive: true });
  writeJson(path.join(root, '.ai-organization/proof-profiles.json'), {
    version: 1,
    profiles: [
      { id: 'static', lane: 'static', risk: 'code', include: ['src/**'], commands: [command] },
      { id: 'db', lane: 'db', risk: 'persistence', include: ['db/**'], requires_env_any: ['ORG_TEST_DB'], commands: [command] }
    ],
    unknown_path_policy: 'fail'
  });
  return root;
}

test('clean changed path selects and runs its exact profile', () => {
  const root = fixture();
  const selected = selectProof(root, ['src/good.ts']);
  assert.deepEqual(selected.profiles.map((p) => p.id), ['static']);
  assert.equal(runSelectedProof(root, ['src/good.ts'], { stdio: 'pipe' }).ok, true);
});

test('CoachAI paths select semantic, DB, and supply-chain proof rather than generic status checks', () => {
  const semantic = selectProof(process.cwd(), ['backend/src/lib/analysis/semanticJudgment.ts']).profiles.map((p) => p.id);
  assert.ok(semantic.includes('backend-static'));
  assert.ok(semantic.includes('ai-semantic'));
  const route = selectProof(process.cwd(), ['backend/src/routes/analysis.ts']).profiles.map((p) => p.id);
  assert.ok(route.includes('backend-static'));
  assert.ok(route.includes('backend-db'));
  const dependency = selectProof(process.cwd(), ['package-lock.json']).profiles.map((p) => p.id);
  assert.deepEqual(dependency, ['dependency-supply-chain']);
});

test('killer mutations: unknown path, failed command, and missing DB authority fail', () => {
  assert.match(runSelectedProof(fixture(), ['unknown/file.txt'], { dryRun: true }).errors.join('\n'), /unmapped/i);
  assert.match(runSelectedProof(fixture(`"${process.execPath}" -e "process.exit(9)"`), ['src/bad.ts'], { stdio: 'pipe' }).errors.join('\n'), /command failed/i);
  const old = process.env.ORG_TEST_DB;
  delete process.env.ORG_TEST_DB;
  try { assert.match(runSelectedProof(fixture(), ['db/schema.sql'], { dryRun: true }).errors.join('\n'), /requires one of/i); }
  finally { if (old === undefined) delete process.env.ORG_TEST_DB; else process.env.ORG_TEST_DB = old; }
});
