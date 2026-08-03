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
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { changedFiles, runSelectedProof, selectProof } from '../run-risk-selected-proof.mjs';
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

test('an explicit non-applicable lane passes only after every changed path remains mapped', () => {
  const root = fixture();
  const selected = runSelectedProof(root, ['src/good.ts'], { lane: 'db', dryRun: true });
  assert.equal(selected.ok, true);
  assert.deepEqual(selected.profiles, []);
  assert.deepEqual(selected.commands, []);

  const runner = fileURLToPath(new URL('../run-risk-selected-proof.mjs', import.meta.url));
  const cli = spawnSync(process.execPath, [runner, '--file', 'src/good.ts', '--lane', 'db'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /profiles=none lane=db/u);
  assert.match(cli.stdout, /PASS — no db profile applies; all 1 changed path\(s\) remain mapped/u);

  const unknown = runSelectedProof(root, ['unknown/file.txt'], { lane: 'db', dryRun: true });
  assert.equal(unknown.ok, false);
  assert.match(unknown.errors.join('\n'), /unmapped changed paths/u);
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
  // Project-level gates and operational harnesses must select the proof for the
  // behavior they govern. Killer mutation: remove any exact path from the
  // owning profile and this matrix reports it as unmapped.
  const projectGateCases = [
    ['scripts/check-ui-guardrails.mjs', 'frontend'],
    ['scripts/check-user-cascade-completeness.mjs', 'backend-db'],
    ['scripts/ops/loadtest-debug.mjs', 'backend-static'],
    ['scripts/ops/loadtest-run.mjs', 'backend-static'],
    ['scripts/preflight-security-check.mjs', 'dependency-supply-chain'],
  ];
  for (const [changedPath, expectedProfile] of projectGateCases) {
    const selection = selectProof(process.cwd(), [changedPath]);
    assert.ok(selection.profiles.map((p) => p.id).includes(expectedProfile), `${changedPath} selects ${expectedProfile}`);
    assert.equal(selection.unknown.length, 0, `${changedPath} must not fail closed as unmapped`);
  }
  // Root-level product docs (not under docs/) are documentation, not unmapped fail-closed paths.
  // Killer mutation: drop "*.md" from the documentation profile's include and both assertions fail.
  const rootDocSelection = selectProof(process.cwd(), ['COACHING_ARCHITECTURE.md']);
  assert.ok(rootDocSelection.profiles.map((p) => p.id).includes('documentation'), 'a root-level .md must select the documentation profile');
  assert.equal(rootDocSelection.unknown.length, 0, 'a root-level .md must not fail closed as an unmapped path');
  // Orchestration skills are managed control-plane content. Killer mutation: drop
  // ".agents/skills/**" from organization-control and this path becomes unmapped.
  const skillSelection = selectProof(process.cwd(), ['.agents/skills/coachai-call-audit-rca/SKILL.md']);
  assert.ok(skillSelection.profiles.map((p) => p.id).includes('organization-control'), 'a managed orchestration skill must select organization-control proof');
  assert.equal(skillSelection.unknown.length, 0, 'a managed orchestration skill must not fail closed as an unmapped path');
});

test('killer mutations: unknown path, failed command, and missing DB authority fail', () => {
  assert.match(runSelectedProof(fixture(), ['unknown/file.txt'], { dryRun: true }).errors.join('\n'), /unmapped/i);
  assert.match(runSelectedProof(fixture(`"${process.execPath}" -e "process.exit(9)"`), ['src/bad.ts'], { stdio: 'pipe' }).errors.join('\n'), /command failed/i);
  const old = process.env.ORG_TEST_DB;
  delete process.env.ORG_TEST_DB;
  try { assert.match(runSelectedProof(fixture(), ['db/schema.sql'], { dryRun: true }).errors.join('\n'), /requires one of/i); }
  finally { if (old === undefined) delete process.env.ORG_TEST_DB; else process.env.ORG_TEST_DB = old; }
});

test('changed-file floor derives its base from the proof registry integration branch', () => {
  const root = tempFixture();
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  git('init', '-b', 'develop');
  git('config', 'user.email', 'proof@example.invalid');
  git('config', 'user.name', 'Proof Fixture');
  fs.writeFileSync(path.join(root, 'README.md'), 'base\n');
  git('add', '.');
  git('commit', '-m', 'base');
  git('update-ref', 'refs/remotes/origin/develop', 'HEAD');
  git('checkout', '-b', 'feature/proof');
  fs.writeFileSync(path.join(root, 'README.md'), 'changed\n');
  assert.deepEqual(changedFiles(root, 'develop'), ['README.md']);
  assert.throws(() => changedFiles(root, 'main'), /merge-base/u);
});
