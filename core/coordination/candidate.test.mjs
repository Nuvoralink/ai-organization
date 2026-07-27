/**
 * Proves: NFR-011
 * Test type: regression
 * Surface: .ai-organization/runtime/core/coordination/candidate.mjs exact candidate, proof binding, freshness, and landing CAS
 * Authority: remote target tip + detached candidate SHA + action-authority human landing boundary
 *
 * What this test proves about the product:
 * - A rebased candidate contains the exact target-plus-source tree, proof runs only at that SHA,
 *   and every construction/proof worktree is removed.
 * - Target movement is detected without changing the original lease, conflicts are useful outcomes,
 *   only the named baseline may be accepted, and no operation advances the fixture main ref.
 *
 * Negative path covered:
 * - Rebase conflict, moved target, proof on the source tree, unexpected proof failure, malformed CLI
 *   options, and every distinct operator exit all fail closed in os.tmpdir-only repositories.
 *
 * Killer mutations:
 * - Skip worktree cleanup; drop or rewrite the lease base; prove the source branch instead of the
 *   candidate; skip the candidate dependency install; swallow a non-baseline failure; update main;
 *   remove the target side of the rebase; remove the retained candidate ref before forced GC; or
 *   collapse conflict/proof-failed/target-moved to one exit. Each mutation turns a named assertion
 *   red.
 *
 * Real `npm run verify` cascade fixture (captured verbatim):
 * check-agent-context-budget: FAILED
 * gates:all: FAILED — gate:agent-context failed with exit 1
 */

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildCandidate,
  DEFAULT_KNOWN_BASELINE_FAILURES,
  landingPackage,
  proveCandidate,
  verifyStillCurrent,
} from './candidate.mjs';
import {
  LANDING_PACKAGE_EXIT,
  parseLandingPackageArgs,
  PROJECT_KNOWN_BASELINE_FAILURES,
  runLandingPackageCli,
} from '../../../../scripts/coordination-landing-package.mjs';

// This file lives at .ai-organization/runtime/core/coordination/ — the repo root is FOUR levels up.
const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
);
const CLI_PATH = path.join(REPOSITORY_ROOT, 'scripts', 'coordination-landing-package.mjs');
const FULL_SHA_A = 'a'.repeat(40);
const FULL_SHA_B = 'b'.repeat(40);

function git(cwd, ...args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.stdout || error.message || '').trim();
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function writeFile(root, relativePath, contents) {
  const file = path.join(root, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function commitAll(repoRoot, message) {
  git(repoRoot, 'add', '.');
  git(repoRoot, 'commit', '-m', message);
  return git(repoRoot, 'rev-parse', 'HEAD');
}

function actionAuthorityPolicy() {
  return {
    version: 'fixture-1',
    default: 'human_required',
    conditional: {
      merge_pull_request: {
        all: ['target_tip_matches', 'candidate_proof_bound'],
      },
    },
    human_required: ['deploy_or_publish', 'external_message_or_contact'],
  };
}

function createFixture(t, { conflict = false } = {}) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'auxara-candidate-fixture-'));
  const repoRoot = path.join(parent, 'source');
  const remoteRoot = path.join(parent, 'origin.git');
  const workRoot = path.join(parent, 'worktrees');
  fs.mkdirSync(repoRoot, { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  git(parent, 'init', '--bare', '-q', remoteRoot);
  git(repoRoot, 'init', '-q', '-b', 'main');
  git(repoRoot, 'config', 'user.email', 'candidate-test@example.invalid');
  git(repoRoot, 'config', 'user.name', 'Candidate Test');

  writeFile(repoRoot, 'README.md', '# candidate fixture\n');
  writeFile(
    repoRoot,
    'package.json',
    `${JSON.stringify(
      {
        name: 'candidate-landing-fixture',
        version: '1.0.0',
        private: true,
        scripts: {
          postinstall: 'node install-sentinel.mjs',
          'proof:pass': 'node proof-pass.mjs',
          'proof:sentinel': 'node proof-sentinel.mjs',
          'proof:baseline': 'node proof-baseline.mjs',
          'proof:other': 'node proof-other.mjs',
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFile(
    repoRoot,
    'package-lock.json',
    `${JSON.stringify(
      {
        name: 'candidate-landing-fixture',
        version: '1.0.0',
        lockfileVersion: 3,
        requires: true,
        packages: {
          '': {
            name: 'candidate-landing-fixture',
            version: '1.0.0',
          },
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFile(
    repoRoot,
    'install-sentinel.mjs',
    "import fs from 'node:fs';\nfs.writeFileSync('.candidate-proof-installed', 'installed\\n');\n",
  );
  writeFile(repoRoot, 'proof-pass.mjs', "console.log('candidate proof passed');\n");
  writeFile(
    repoRoot,
    'proof-sentinel.mjs',
    `import fs from 'node:fs';
const required = ['feature-only.txt', 'target-only.txt', '.candidate-proof-installed'];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error(\`candidate-sentinel: FAILED missing=\${missing.join(',')}\`);
  process.exit(41);
}
console.log('candidate sentinel passed');
`,
  );
  writeFile(
    repoRoot,
    'proof-baseline.mjs',
    "console.error('check-agent-context-budget: FAILED');\nconsole.error('gates:all: FAILED — gate:agent-context failed with exit 1');\nprocess.exit(1);\n",
  );
  writeFile(
    repoRoot,
    'proof-other.mjs',
    "console.error('check-agent-context-budget: FAILED');\nconsole.error('gates:all: FAILED — gate:agent-context failed with exit 1');\nconsole.error('other-gate: FAILED');\nprocess.exit(1);\n",
  );
  writeFile(
    repoRoot,
    '.ai-organization/policies/action-authority.v1.json',
    `${JSON.stringify(actionAuthorityPolicy(), null, 2)}\n`,
  );
  if (conflict) writeFile(repoRoot, 'conflict.txt', 'base\n');
  const initialSha = commitAll(repoRoot, 'fixture base');
  git(repoRoot, 'remote', 'add', 'origin', remoteRoot);
  git(repoRoot, 'push', '-u', 'origin', 'main');

  git(repoRoot, 'switch', '-c', 'feature');
  if (conflict) writeFile(repoRoot, 'conflict.txt', 'feature\n');
  else writeFile(repoRoot, 'feature-only.txt', 'feature\n');
  const sourceSha = commitAll(repoRoot, 'feature change');
  git(repoRoot, 'push', '-u', 'origin', 'feature');

  git(repoRoot, 'switch', 'main');
  if (conflict) writeFile(repoRoot, 'conflict.txt', 'target\n');
  else writeFile(repoRoot, 'target-only.txt', 'target\n');
  const targetSha = commitAll(repoRoot, 'target change');
  git(repoRoot, 'push', 'origin', 'main');
  git(repoRoot, 'switch', 'feature');

  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  return {
    parent,
    repoRoot,
    remoteRoot,
    workRoot,
    initialSha,
    sourceSha,
    targetSha,
  };
}

function mainTip(fixture) {
  return git(fixture.repoRoot, 'rev-parse', 'refs/heads/main');
}

function sourceTip(fixture) {
  return git(fixture.repoRoot, 'rev-parse', 'refs/heads/feature');
}

function remoteTip(fixture, branch) {
  const output = git(
    fixture.repoRoot,
    'ls-remote',
    '--exit-code',
    'origin',
    `refs/heads/${branch}`,
  );
  const [sha, ref] = output.split(/\s+/u);
  assert.equal(ref, `refs/heads/${branch}`, `remote ${branch} lookup returned the wrong ref`);
  return sha;
}

function assertFixtureRefsUnchanged(
  fixture,
  expectedMain,
  expectedSource,
  operation,
  { expectedRemoteMain = expectedMain, expectedRemoteSource = expectedSource } = {},
) {
  assert.equal(mainTip(fixture), expectedMain, `${operation} changed fixture main`);
  assert.equal(sourceTip(fixture), expectedSource, `${operation} changed fixture feature`);
  assert.equal(remoteTip(fixture, 'main'), expectedRemoteMain, `${operation} changed remote main`);
  assert.equal(
    remoteTip(fixture, 'feature'),
    expectedRemoteSource,
    `${operation} changed remote feature`,
  );
}

function treeFiles(repoRoot, revision) {
  return git(repoRoot, 'ls-tree', '-r', '--name-only', revision)
    .split(/\r?\n/u)
    .filter(Boolean)
    .sort();
}

function buildHappyCandidate(t) {
  const fixture = createFixture(t);
  const expectedMain = mainTip(fixture);
  const expectedSource = sourceTip(fixture);
  const candidate = buildCandidate({
    repoRoot: fixture.repoRoot,
    sourceBranch: 'feature',
    targetBranch: 'main',
    workRoot: fixture.workRoot,
  });
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'buildCandidate');
  return { fixture, candidate, expectedMain, expectedSource };
}

function proofRecord(candidate, overrides = {}) {
  return {
    passed: true,
    exitCode: 0,
    profile: 'npm run proof:pass',
    logTail: 'candidate proof passed',
    candidateSha: candidate.candidateSha,
    knownBaselineOnly: false,
    observedBaselineFailures: [],
    unexpectedFailures: [],
    ...overrides,
  };
}

function readiness(current, actualTip) {
  return {
    current,
    actualTip,
    policyVersion: 'fixture-1',
    criteria: ['target_tip_matches', 'candidate_proof_bound'],
    humanRequired: ['deploy_or_publish'],
  };
}

function advanceRemoteMain(fixture) {
  const publisher = path.join(fixture.parent, 'publisher');
  git(fixture.parent, 'clone', '-q', '--branch', 'main', fixture.remoteRoot, publisher);
  git(publisher, 'config', 'user.email', 'publisher@example.invalid');
  git(publisher, 'config', 'user.name', 'Fixture Publisher');
  writeFile(publisher, 'target-moved.txt', 'moved\n');
  const movedSha = commitAll(publisher, 'move target');
  git(publisher, 'push', 'origin', 'main');
  return movedSha;
}

test('happy path builds the exact target-plus-feature tree and removes its worktree', (t) => {
  const { fixture, candidate, expectedMain, expectedSource } = buildHappyCandidate(t);

  assert.equal(candidate.ok, true);
  assert.equal(candidate.baseSha, fixture.targetSha);
  assert.equal(candidate.sourceSha, fixture.sourceSha);
  assert.equal(candidate.commitCount, 1);
  assert.deepEqual(candidate.changedFiles, ['feature-only.txt']);
  assert.equal(candidate.candidateRef, `refs/candidates/${candidate.candidateSha}`);
  assert.equal(
    git(fixture.repoRoot, 'rev-parse', '--verify', candidate.candidateRef),
    candidate.candidateSha,
  );
  assert.equal(fs.existsSync(candidate.worktreePath), false);
  assert.deepEqual(treeFiles(fixture.repoRoot, candidate.candidateSha), [
    '.ai-organization/policies/action-authority.v1.json',
    'README.md',
    'feature-only.txt',
    'install-sentinel.mjs',
    'package-lock.json',
    'package.json',
    'proof-baseline.mjs',
    'proof-other.mjs',
    'proof-pass.mjs',
    'proof-sentinel.mjs',
    'target-only.txt',
  ]);
  assert.equal(
    git(fixture.repoRoot, 'show', `${candidate.candidateSha}:feature-only.txt`),
    'feature',
  );
  assert.equal(
    git(fixture.repoRoot, 'show', `${candidate.candidateSha}:target-only.txt`),
    'target',
  );
  git(fixture.repoRoot, 'reflog', 'expire', '--expire=now', '--all');
  git(fixture.repoRoot, 'gc', '--prune=now');
  assert.equal(
    git(fixture.repoRoot, 'rev-parse', '--verify', `${candidate.candidateSha}^{commit}`),
    candidate.candidateSha,
    'the retained candidate ref must keep the exact commit alive across immediate GC',
  );
  assert.equal(
    git(fixture.repoRoot, 'rev-parse', '--verify', candidate.candidateRef),
    candidate.candidateSha,
  );
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'tree inspection');
});

test('target movement is detected and the command retains the original base lease', (t) => {
  const { fixture, candidate, expectedMain, expectedSource } = buildHappyCandidate(t);
  const movedSha = advanceRemoteMain(fixture);
  const movedRemoteRefs = { expectedRemoteMain: movedSha };
  assertFixtureRefsUnchanged(
    fixture,
    expectedMain,
    expectedSource,
    'fixture target advance',
    movedRemoteRefs,
  );

  const freshness = verifyStillCurrent({
    repoRoot: fixture.repoRoot,
    targetBranch: 'main',
    baseSha: candidate.baseSha,
  });
  assert.deepEqual(freshness, { current: false, actualTip: movedSha });
  assertFixtureRefsUnchanged(
    fixture,
    expectedMain,
    expectedSource,
    'verifyStillCurrent',
    movedRemoteRefs,
  );

  const output = landingPackage({
    candidate,
    proof: proofRecord(candidate),
    readiness: readiness(false, movedSha),
  });
  assert.equal(
    output.landingCommand,
    `git push origin ${candidate.candidateSha}:main --force-with-lease=main:${candidate.baseSha}`,
  );
  assert.match(output.summary, new RegExp(`--force-with-lease=main:${candidate.baseSha}`, 'u'));
  assert.equal(output.landingCommand.includes(movedSha), false);
  assert.equal(output.readyForHumanExecution, false);
  assertFixtureRefsUnchanged(
    fixture,
    expectedMain,
    expectedSource,
    'landingPackage',
    movedRemoteRefs,
  );
});

test('overlapping edits return a useful conflict without throwing and clean the worktree', (t) => {
  const fixture = createFixture(t, { conflict: true });
  const expectedMain = mainTip(fixture);
  const expectedSource = sourceTip(fixture);

  const candidate = buildCandidate({
    repoRoot: fixture.repoRoot,
    sourceBranch: 'feature',
    targetBranch: 'main',
    workRoot: fixture.workRoot,
  });

  assert.equal(candidate.ok, false);
  assert.equal(candidate.reason, 'conflict');
  assert.deepEqual(candidate.files, ['conflict.txt']);
  assert.equal(fs.existsSync(candidate.worktreePath), false);
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'conflict build');
});

test('proof is bound to the exact candidate worktree, not the source branch', (t) => {
  const { fixture, candidate, expectedMain, expectedSource } = buildHappyCandidate(t);
  const sourceProof = spawnSync(
    process.execPath,
    [process.env.npm_execpath, 'run', 'proof:sentinel'],
    {
      cwd: fixture.repoRoot,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  assert.equal(
    sourceProof.status,
    41,
    'liveness: the sentinel must fail on source or this cannot distinguish proof binding',
  );

  const proof = proveCandidate({ candidate, profile: 'proof:sentinel' });
  assert.equal(proof.passed, true);
  assert.equal(proof.exitCode, 0);
  assert.equal(proof.stage, 'profile');
  assert.equal(proof.preparation.command, 'npm ci --no-audit --no-fund');
  assert.equal(proof.preparation.exitCode, 0);
  assert.equal(proof.candidateSha, candidate.candidateSha);
  assert.match(proof.logTail, /candidate sentinel passed/u);
  assert.equal(fs.existsSync(proof.proofWorktreePath), false);
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'proveCandidate');
});

test('the real two-line verify cascade attributes gates:all to its baseline leaf', (t) => {
  const { fixture, candidate, expectedMain, expectedSource } = buildHappyCandidate(t);
  assert.deepEqual(
    DEFAULT_KNOWN_BASELINE_FAILURES,
    [],
    'the reusable engine must not silently inherit a project-specific baseline exception',
  );

  const baseline = proveCandidate({
    candidate,
    profile: 'proof:baseline',
    knownBaselineFailures: PROJECT_KNOWN_BASELINE_FAILURES,
  });
  assert.equal(baseline.exitCode, 1);
  assert.equal(baseline.passed, true);
  assert.equal(baseline.knownBaselineOnly, true);
  assert.deepEqual(baseline.observedBaselineFailures, ['agent-context-budget-gate']);
  assert.deepEqual(baseline.unexpectedFailures, []);
  assert.match(baseline.logTail, /check-agent-context-budget: FAILED/u);
  assert.match(baseline.logTail, /gates:all: FAILED — gate:agent-context failed with exit 1/u);
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'baseline proof');

  const unexpected = proveCandidate({
    candidate,
    profile: 'proof:other',
    knownBaselineFailures: PROJECT_KNOWN_BASELINE_FAILURES,
  });
  assert.equal(unexpected.exitCode, 1);
  assert.equal(unexpected.passed, false);
  assert.equal(unexpected.knownBaselineOnly, false);
  assert.deepEqual(unexpected.observedBaselineFailures, ['agent-context-budget-gate']);
  assert.deepEqual(unexpected.unexpectedFailures, ['other-gate']);
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'non-baseline proof');
});

test('current target and rendered package remain read-only and candidate-bound', (t) => {
  const { fixture, candidate, expectedMain, expectedSource } = buildHappyCandidate(t);
  const proof = proveCandidate({ candidate, profile: 'proof:pass' });
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'passing proof');

  const freshness = verifyStillCurrent({
    repoRoot: fixture.repoRoot,
    targetBranch: 'main',
    baseSha: candidate.baseSha,
  });
  assert.deepEqual(freshness, { current: true, actualTip: fixture.targetSha });
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'current verification');

  const output = landingPackage({
    candidate,
    proof,
    readiness: readiness(true, freshness.actualTip),
  });
  assert.equal(output.readyForHumanExecution, true);
  assert.equal(output.proof.candidateSha, candidate.candidateSha);
  assert.equal(output.readiness.rederiveRequired, true);
  assert.equal(output.readiness.criteriaSource, 'caller_worktree_at_packaging_time');
  assert.equal(output.candidateRetention.ref, candidate.candidateRef);
  assert.equal(
    output.candidateRetention.cleanupCommand,
    `git update-ref -d ${candidate.candidateRef} ${candidate.candidateSha}`,
  );
  assert.match(
    output.candidateRetention.cleanupCondition,
    /remote target is independently verified/u,
  );
  assert.match(output.summary, new RegExp(candidate.candidateRef, 'u'));
  assert.match(output.summary, /caller worktree at packaging time/u);
  assert.match(output.summary, /only after the remote target is independently verified/u);
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'package rendering');
});

test('the real CLI prints JSON from a local-only fixture and leaves main unchanged', (t) => {
  const fixture = createFixture(t);
  const expectedMain = mainTip(fixture);
  const expectedSource = sourceTip(fixture);
  const result = spawnSync(
    process.execPath,
    [CLI_PATH, '--source', 'feature', '--target', 'main', '--profile', 'proof:sentinel', '--json'],
    {
      cwd: fixture.repoRoot,
      env: process.env,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  assert.equal(result.status, LANDING_PACKAGE_EXIT.SUCCESS, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.readyForHumanExecution, true);
  assert.equal(output.baseSha, fixture.targetSha);
  assert.match(output.landingCommand, /--force-with-lease=main:[0-9a-f]{40}$/u);
  assertFixtureRefsUnchanged(fixture, expectedMain, expectedSource, 'real CLI');
});

test('CLI parsing and distinct conflict/proof/target-moved exits fail closed', (t) => {
  const fixture = createFixture(t);
  const terminalFailureCodes = [
    LANDING_PACKAGE_EXIT.CONFLICT,
    LANDING_PACKAGE_EXIT.PROOF_FAILED,
    LANDING_PACKAGE_EXIT.TARGET_MOVED,
  ];
  assert.ok(terminalFailureCodes.every((code) => Number.isInteger(code) && code !== 0));
  assert.equal(
    new Set(terminalFailureCodes).size,
    terminalFailureCodes.length,
    'conflict, proof-failed, and target-moved must remain distinct process outcomes',
  );
  assert.deepEqual(parseLandingPackageArgs([]), {
    source: undefined,
    target: 'main',
    profile: 'verify',
    json: false,
    help: false,
  });
  assert.throws(() => parseLandingPackageArgs(['--source']), /requires a value/u);
  assert.throws(() => parseLandingPackageArgs(['--unknown']), /unknown option/u);

  const candidate = {
    ok: true,
    baseSha: FULL_SHA_A,
    candidateSha: FULL_SHA_B,
    sourceSha: FULL_SHA_B,
    sourceBranch: 'feature',
    targetBranch: 'main',
    candidateRef: `refs/candidates/${FULL_SHA_B}`,
    changedFiles: ['feature-only.txt'],
    commitCount: 1,
  };
  const writes = [];
  const errors = [];
  const proofInputs = [];
  const invoke = ({ built = candidate, proof = proofRecord(candidate), current = true } = {}) =>
    runLandingPackageCli({
      argv: ['--source', 'feature', '--json'],
      repoRoot: fixture.repoRoot,
      stdout: (text) => writes.push(text),
      stderr: (text) => errors.push(text),
      operations: {
        buildCandidate: () => built,
        proveCandidate: (input) => {
          proofInputs.push(input);
          return proof;
        },
        verifyStillCurrent: () => ({ current, actualTip: current ? FULL_SHA_A : 'c'.repeat(40) }),
        landingPackage,
      },
    });

  assert.equal(
    invoke({
      built: {
        ok: false,
        reason: 'conflict',
        files: ['conflict.txt'],
        baseSha: FULL_SHA_A,
        sourceSha: FULL_SHA_B,
        sourceBranch: 'feature',
        targetBranch: 'main',
      },
    }),
    LANDING_PACKAGE_EXIT.CONFLICT,
  );
  assert.equal(
    invoke({ proof: proofRecord(candidate, { passed: false, exitCode: 9 }) }),
    LANDING_PACKAGE_EXIT.PROOF_FAILED,
  );
  assert.equal(invoke({ current: false }), LANDING_PACKAGE_EXIT.TARGET_MOVED);
  assert.equal(invoke(), LANDING_PACKAGE_EXIT.SUCCESS);
  assert.deepEqual(errors, []);
  assert.ok(writes.length >= 4, 'liveness: every terminal path must print an operator result');
  assert.ok(proofInputs.length >= 3, 'liveness: proof must run on every non-conflict path');
  for (const input of proofInputs) {
    assert.deepEqual(input.knownBaselineFailures, PROJECT_KNOWN_BASELINE_FAILURES);
  }
});
