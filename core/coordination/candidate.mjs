/**
 * Vendor-neutral exact-candidate construction and human landing-package primitives.
 *
 * This module may fetch objects and inspect refs, but it never pushes, merges into, checks out, or
 * updates a shared branch/ref. Candidate construction retains the exact result under its private
 * local refs/candidates/<sha> authority; construction and proof otherwise use detached throwaway
 * worktrees, and every worktree is removed in a finally block.
 */

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const GIT_TIMEOUT_MS = 120_000;
const INSTALL_TIMEOUT_MS = 10 * 60_000;
const PROOF_TIMEOUT_MS = 30 * 60_000;
const COMMAND_BUFFER_BYTES = 64 * 1024 * 1024;
const LOG_TAIL_LINES = 80;
const TARGET_FETCH_ATTEMPTS = 3;
const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const PROFILE_SCRIPT_PATTERN = /^[A-Za-z0-9:_-]+$/u;
const CANDIDATE_REF_PREFIX = 'refs/candidates';
const CRITERIA_SOURCE = 'caller_worktree_at_packaging_time';
const CANDIDATE_CLEANUP_CONDITION =
  'Run only after the remote target is independently verified at the candidate SHA.';

export const DEFAULT_KNOWN_BASELINE_FAILURES = Object.freeze([]);

function commandOutput(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
}

function commandFailure(command, result) {
  const outcome = result.error
    ? result.error.message
    : result.signal
      ? `signal ${result.signal}`
      : `exit ${result.status}`;
  const output = commandOutput(result);
  return new Error(`${command} failed with ${outcome}${output ? `\n${output}` : ''}`);
}

function runGit(repoRoot, args, { cwd = repoRoot, timeout = GIT_TIMEOUT_MS } = {}) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    timeout,
    maxBuffer: COMMAND_BUFFER_BYTES,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function requireGitSuccess(repoRoot, args, options) {
  const result = runGit(repoRoot, args, options);
  if (result.error || result.signal || result.status !== 0) {
    throw commandFailure(`git ${args.join(' ')}`, result);
  }
  return String(result.stdout ?? '').trim();
}

function validateBranchName(repoRoot, branch, label) {
  if (typeof branch !== 'string' || !branch.trim()) {
    throw new TypeError(`${label} must be a non-empty branch name`);
  }
  const result = runGit(repoRoot, ['check-ref-format', '--branch', branch]);
  if (result.error || result.signal || result.status !== 0) {
    throw new Error(`${label} is not a valid Git branch name: ${branch}`);
  }
  return branch;
}

function requireCommit(repoRoot, revision, label) {
  const resolved = requireGitSuccess(repoRoot, ['rev-parse', '--verify', `${revision}^{commit}`]);
  if (!SHA_PATTERN.test(resolved)) {
    throw new Error(`${label} did not resolve to a full commit SHA`);
  }
  return resolved;
}

function candidateRefForSha(candidateSha) {
  if (!SHA_PATTERN.test(candidateSha ?? '')) {
    throw new Error('candidateSha must be a full commit SHA');
  }
  return `${CANDIDATE_REF_PREFIX}/${candidateSha}`;
}

function parseRemoteTip(output, targetRef) {
  const matches = String(output)
    .split(/\r?\n/u)
    .map((line) => line.trim().split(/\s+/u))
    .filter(([sha, ref]) => SHA_PATTERN.test(sha ?? '') && ref === targetRef);
  if (matches.length !== 1) {
    throw new Error(`origin did not advertise exactly one ${targetRef} tip`);
  }
  return matches[0][0];
}

/**
 * Fetch the target's objects without updating refs/remotes/origin/*, then return the advertised tip.
 *
 * The bounded retry closes the small fetch/advertisement race: the returned SHA is accepted only
 * after its commit object is present locally. A later target move is deliberately handled by the
 * final freshness check and the landing command's force-with-lease compare-and-swap.
 */
function fetchTargetTip(repoRoot, targetBranch) {
  const targetRef = `refs/heads/${targetBranch}`;
  for (let attempt = 1; attempt <= TARGET_FETCH_ATTEMPTS; attempt += 1) {
    requireGitSuccess(repoRoot, [
      'fetch',
      '--no-tags',
      '--no-write-fetch-head',
      'origin',
      targetRef,
    ]);
    const advertised = requireGitSuccess(repoRoot, [
      'ls-remote',
      '--exit-code',
      'origin',
      targetRef,
    ]);
    const tip = parseRemoteTip(advertised, targetRef);
    const available = runGit(repoRoot, ['cat-file', '-e', `${tip}^{commit}`]);
    if (!available.error && !available.signal && available.status === 0) return tip;
  }
  throw new Error(
    `origin/${targetBranch} moved during ${TARGET_FETCH_ATTEMPTS} target snapshots; retry later`,
  );
}

function normalizedPathWithin(root, candidate, label) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} must resolve to a child of workRoot`);
  }
  return resolvedCandidate;
}

function validateWorkRoot(repoRoot, workRoot) {
  if (typeof workRoot !== 'string' || !workRoot.trim()) {
    throw new TypeError('workRoot must be a non-empty path');
  }
  const repository = path.resolve(repoRoot);
  const workspace = path.resolve(workRoot);
  const relative = path.relative(repository, workspace);
  if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('workRoot must be outside the caller repository worktree');
  }
  fs.mkdirSync(workspace, { recursive: true });
  return workspace;
}

function newWorktreePath(workRoot, purpose) {
  return normalizedPathWithin(
    workRoot,
    path.join(workRoot, `auxara-${purpose}-${process.pid}-${crypto.randomUUID()}`),
    `${purpose} worktree`,
  );
}

function cleanupDetachedWorktree(repoRoot, workRoot, worktreePath) {
  const exactPath = normalizedPathWithin(workRoot, worktreePath, 'cleanup worktree');
  const removal = runGit(repoRoot, ['worktree', 'remove', '--force', '--', exactPath]);
  if (fs.existsSync(exactPath)) {
    fs.rmSync(exactPath, { recursive: true, force: true });
  }
  if (removal.error || removal.signal || (removal.status !== 0 && fs.existsSync(exactPath))) {
    throw commandFailure(`git worktree remove --force -- ${exactPath}`, removal);
  }
  if (removal.status !== 0) {
    // A partially-added worktree may leave administrative residue even when its path is absent.
    requireGitSuccess(repoRoot, ['worktree', 'prune']);
  }
}

function splitNullDelimited(output) {
  return String(output)
    .split('\0')
    .filter(Boolean)
    .map((entry) => entry.replaceAll('\\', '/'))
    .sort();
}

/**
 * Construct the exact rebased candidate commit without updating source or target refs. The exact
 * result is retained under a private local refs/candidates/<sha> ref until verified landing cleanup.
 */
export function buildCandidate({ repoRoot, sourceBranch, targetBranch = 'main', workRoot }) {
  const repository = path.resolve(repoRoot);
  const workspace = validateWorkRoot(repository, workRoot);
  const source = validateBranchName(repository, sourceBranch, 'sourceBranch');
  const target = validateBranchName(repository, targetBranch, 'targetBranch');
  const sourceSha = requireCommit(repository, `refs/heads/${source}`, 'sourceBranch');
  const baseSha = fetchTargetTip(repository, target);
  const mergeBase = requireGitSuccess(repository, ['merge-base', baseSha, sourceSha]);
  const worktreePath = newWorktreePath(workspace, 'candidate-build');
  let worktreeAdded = false;

  try {
    requireGitSuccess(repository, ['worktree', 'add', '--detach', '--', worktreePath, baseSha]);
    worktreeAdded = true;

    const rebase = runGit(repository, ['rebase', '--onto', baseSha, mergeBase, sourceSha], {
      cwd: worktreePath,
    });
    if (rebase.error || rebase.signal || rebase.status !== 0) {
      const files = splitNullDelimited(
        String(
          runGit(repository, ['diff', '--name-only', '--diff-filter=U', '-z'], {
            cwd: worktreePath,
          }).stdout ?? '',
        ),
      );
      if (files.length > 0) {
        runGit(repository, ['rebase', '--abort'], { cwd: worktreePath });
        return {
          ok: false,
          reason: 'conflict',
          files,
          baseSha,
          sourceSha,
          sourceBranch: source,
          targetBranch: target,
          repoRoot: repository,
          workRoot: workspace,
          worktreePath,
        };
      }
      throw commandFailure('git rebase candidate', rebase);
    }

    const candidateSha = requireCommit(worktreePath, 'HEAD', 'candidate');
    const isFastForward = runGit(repository, [
      'merge-base',
      '--is-ancestor',
      baseSha,
      candidateSha,
    ]);
    if (isFastForward.error || isFastForward.signal || isFastForward.status !== 0) {
      throw new Error('candidate is not a fast-forward descendant of the recorded target base');
    }
    const changedFiles = splitNullDelimited(
      requireGitSuccess(repository, ['diff', '--name-only', '-z', baseSha, candidateSha]),
    );
    const commitCountText = requireGitSuccess(repository, [
      'rev-list',
      '--count',
      `${baseSha}..${candidateSha}`,
    ]);
    const commitCount = Number.parseInt(commitCountText, 10);
    if (!Number.isSafeInteger(commitCount) || commitCount < 0) {
      throw new Error(`invalid candidate commit count: ${commitCountText}`);
    }
    const candidateRef = candidateRefForSha(candidateSha);
    requireGitSuccess(repository, ['update-ref', candidateRef, candidateSha]);

    return {
      ok: true,
      baseSha,
      candidateSha,
      sourceSha,
      sourceBranch: source,
      targetBranch: target,
      candidateRef,
      repoRoot: repository,
      workRoot: workspace,
      worktreePath,
      changedFiles,
      commitCount,
    };
  } finally {
    // Call the Git worktree remover even after add/rebase failure; never strand a throwaway tree.
    if (worktreeAdded || fs.existsSync(worktreePath)) {
      cleanupDetachedWorktree(repository, workspace, worktreePath);
    } else {
      runGit(repository, ['worktree', 'remove', '--force', '--', worktreePath]);
    }
  }
}

function resolveNpmCliPath(env = process.env) {
  if (typeof env.npm_execpath === 'string' && fs.existsSync(env.npm_execpath)) {
    return env.npm_execpath;
  }
  const adjacent = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js',
  );
  if (fs.existsSync(adjacent)) return adjacent;
  throw new Error('npm JavaScript CLI is unavailable for the candidate proof profile');
}

function npmExitCode(result) {
  return Number.isInteger(result.status)
    ? result.status
    : result.error?.code === 'ETIMEDOUT'
      ? 124
      : 1;
}

function runNpm(npmCliPath, args, cwd, timeout) {
  return spawnSync(process.execPath, [npmCliPath, ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    timeout,
    maxBuffer: COMMAND_BUFFER_BYTES,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function normalizeProfile(profile = 'npm run verify') {
  const raw = String(profile).trim();
  const npmRun = /^npm\s+run\s+([A-Za-z0-9:_-]+)$/u.exec(raw);
  const script = npmRun ? npmRun[1] : raw;
  if (!PROFILE_SCRIPT_PATTERN.test(script)) {
    throw new Error('profile must be one npm script name or `npm run <script>`');
  }
  return { script, rendered: `npm run ${script}` };
}

function logTail(log) {
  return String(log).split(/\r?\n/u).slice(-LOG_TAIL_LINES).join('\n').trim();
}

function canonicalFailureName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^check[:-]/u, '')
    .replace(/^gate[:-]/u, '')
    .replace(/-gate$/u, '');
}

function classifyProofFailure(log, exitCode, knownBaselineFailures) {
  if (exitCode === 0) {
    return {
      knownBaselineOnly: false,
      observedBaselineFailures: [],
      unexpectedFailures: [],
    };
  }

  const known = new Map(
    knownBaselineFailures.map((name) => [canonicalFailureName(name), String(name)]),
  );
  const observed = new Set();
  const unexpected = new Set();
  const lines = String(log).split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const aggregatePropagation =
      /^gates:all:\s*FAILED\s+—\s+([A-Za-z0-9][A-Za-z0-9:_-]*)\s+failed with exit\s+[0-9]+\s*$/iu.exec(
        trimmed,
      );
    if (aggregatePropagation) {
      const canonical = canonicalFailureName(aggregatePropagation[1]);
      if (known.has(canonical)) observed.add(known.get(canonical));
      // This line attributes the aggregate runner's exit to its named child. The child's own
      // FAILED line remains the classification authority, so propagation is never a second failure.
      continue;
    }

    const namedFailure = /^([A-Za-z0-9][A-Za-z0-9:_-]*):\s*FAILED\b/iu.exec(trimmed);
    if (namedFailure) {
      const canonical = canonicalFailureName(namedFailure[1]);
      if (known.has(canonical)) observed.add(known.get(canonical));
      else unexpected.add(namedFailure[1]);
      continue;
    }

    if (/^not ok\b/iu.test(trimmed)) {
      unexpected.add(trimmed);
      continue;
    }
    if (
      /\berror TS\d+\b/iu.test(trimmed) ||
      /\bAssertionError\b/iu.test(trimmed) ||
      /^\s*[✖×]\s/u.test(line)
    ) {
      unexpected.add(trimmed);
    }
  }

  if (observed.size === 0 && unexpected.size === 0) {
    unexpected.add(`unclassified non-zero exit ${exitCode}`);
  }

  return {
    knownBaselineOnly: observed.size > 0 && unexpected.size === 0,
    observedBaselineFailures: [...observed].sort(),
    unexpectedFailures: [...unexpected].sort(),
  };
}

/**
 * Run one npm proof profile in a fresh detached worktree at the exact candidate SHA.
 */
export function proveCandidate({
  candidate,
  profile = 'npm run verify',
  knownBaselineFailures = DEFAULT_KNOWN_BASELINE_FAILURES,
}) {
  if (!candidate?.ok || !SHA_PATTERN.test(candidate.candidateSha ?? '')) {
    throw new Error('proveCandidate requires a successful candidate');
  }
  if (!Array.isArray(knownBaselineFailures) || knownBaselineFailures.some((item) => !item)) {
    throw new TypeError('knownBaselineFailures must be a list of non-empty names');
  }

  const repository = path.resolve(candidate.repoRoot);
  const workspace = validateWorkRoot(repository, candidate.workRoot);
  const proofWorktreePath = newWorktreePath(workspace, 'candidate-proof');
  const normalizedProfile = normalizeProfile(profile);
  let worktreeAdded = false;

  try {
    requireCommit(repository, candidate.candidateSha, 'candidate');
    requireGitSuccess(repository, [
      'worktree',
      'add',
      '--detach',
      '--',
      proofWorktreePath,
      candidate.candidateSha,
    ]);
    worktreeAdded = true;

    const npmCliPath = resolveNpmCliPath();
    const preparationCommand = 'npm ci --no-audit --no-fund';
    const preparationResult = runNpm(
      npmCliPath,
      ['ci', '--no-audit', '--no-fund'],
      proofWorktreePath,
      INSTALL_TIMEOUT_MS,
    );
    const preparationOutput = commandOutput(preparationResult);
    const preparationExitCode = npmExitCode(preparationResult);
    const preparation = {
      command: preparationCommand,
      exitCode: preparationExitCode,
      logTail: logTail(preparationOutput),
    };
    if (preparationExitCode !== 0) {
      return {
        passed: false,
        exitCode: preparationExitCode,
        profile: normalizedProfile.rendered,
        stage: 'dependency_install',
        logTail: logTail(preparationOutput),
        candidateSha: candidate.candidateSha,
        proofWorktreePath,
        preparation,
        knownBaselineFailures: [...knownBaselineFailures],
        knownBaselineOnly: false,
        observedBaselineFailures: [],
        unexpectedFailures: [`${preparationCommand} failed with exit ${preparationExitCode}`],
      };
    }

    const result = runNpm(
      npmCliPath,
      ['run', normalizedProfile.script],
      proofWorktreePath,
      PROOF_TIMEOUT_MS,
    );
    const output = commandOutput(result);
    const exitCode = npmExitCode(result);
    const classification = classifyProofFailure(output, exitCode, knownBaselineFailures);

    return {
      passed: exitCode === 0 || classification.knownBaselineOnly,
      exitCode,
      profile: normalizedProfile.rendered,
      stage: 'profile',
      logTail: logTail(output),
      candidateSha: candidate.candidateSha,
      proofWorktreePath,
      preparation,
      knownBaselineFailures: [...knownBaselineFailures],
      ...classification,
    };
  } finally {
    if (worktreeAdded || fs.existsSync(proofWorktreePath)) {
      cleanupDetachedWorktree(repository, workspace, proofWorktreePath);
    } else {
      runGit(repository, ['worktree', 'remove', '--force', '--', proofWorktreePath]);
    }
  }
}

function requireReadiness(readiness) {
  if (!readiness || typeof readiness !== 'object') {
    throw new TypeError('readiness must carry the action-authority criteria');
  }
  if (!Array.isArray(readiness.criteria) || readiness.criteria.some((item) => !item)) {
    throw new TypeError('readiness.criteria must be a list of non-empty criteria');
  }
  return {
    ...readiness,
    criteria: [...readiness.criteria],
    humanRequired: Array.isArray(readiness.humanRequired) ? [...readiness.humanRequired] : [],
  };
}

/**
 * Render the human-only landing package. This function returns command text; it never executes it.
 */
export function landingPackage({ candidate, proof, readiness }) {
  if (!candidate?.ok || !SHA_PATTERN.test(candidate.candidateSha ?? '')) {
    throw new Error('landingPackage requires a successful candidate');
  }
  const expectedCandidateRef = candidateRefForSha(candidate.candidateSha);
  if (candidate.candidateRef !== expectedCandidateRef) {
    throw new Error('candidate retention ref is not bound to the supplied candidate SHA');
  }
  if (proof?.candidateSha !== candidate.candidateSha) {
    throw new Error('proof is not bound to the supplied candidate SHA');
  }
  const authority = requireReadiness(readiness);
  const landingCommand =
    `git push origin ${candidate.candidateSha}:${candidate.targetBranch} ` +
    `--force-with-lease=${candidate.targetBranch}:${candidate.baseSha}`;
  const changedFileCount = candidate.changedFiles.length;
  const readyForHumanExecution = proof.passed && authority.current === true;
  const cleanupCommand = `git update-ref -d ${candidate.candidateRef} ${candidate.candidateSha}`;
  const criteriaLines =
    authority.criteria.length > 0
      ? authority.criteria.map((criterion) => `  - ${criterion}`)
      : ['  - No criteria were supplied; DO NOT LAND.'];
  const summary = [
    'CANDIDATE LANDING PACKAGE — HUMAN EXECUTION REQUIRED',
    `Target: ${candidate.targetBranch}`,
    `Recorded base SHA: ${candidate.baseSha}`,
    `Exact candidate SHA: ${candidate.candidateSha}`,
    `Retained candidate ref: ${candidate.candidateRef}`,
    `Changed files: ${changedFileCount}`,
    `Candidate commits: ${candidate.commitCount}`,
    `Proof: ${proof.profile} (real exit ${proof.exitCode}; passed=${proof.passed})`,
    `Known baseline was the only failure: ${proof.knownBaselineOnly}`,
    `Target still current at packaging: ${authority.current === true}`,
    'Criteria source: caller worktree at packaging time; re-derive from landing-time evidence.',
    '',
    'Before landing, the human MUST independently re-derive every action-authority criterion:',
    ...criteriaLines,
    '',
    'Human-only leased fast-forward command (Git refuses if the target moved):',
    landingCommand,
    '',
    readyForHumanExecution
      ? 'Package state: ready for a human to re-derive criteria and execute.'
      : 'Package state: NOT READY; do not execute the command.',
    '',
    'Candidate-retention cleanup (only after the remote target is independently verified):',
    cleanupCommand,
    'This package did not push, merge, or update a shared branch/ref.',
  ].join('\n');

  return {
    version: 1,
    targetBranch: candidate.targetBranch,
    baseSha: candidate.baseSha,
    candidateSha: candidate.candidateSha,
    changedFiles: [...candidate.changedFiles],
    changedFileCount,
    commitCount: candidate.commitCount,
    proof: { ...proof },
    readiness: {
      ...authority,
      rederiveRequired: true,
      criteriaSource: CRITERIA_SOURCE,
    },
    candidateRetention: {
      ref: candidate.candidateRef,
      cleanupCommand,
      cleanupCondition: CANDIDATE_CLEANUP_CONDITION,
    },
    landingCommand,
    readyForHumanExecution,
    summary,
  };
}

/**
 * Re-fetch without advancing a remote-tracking ref and compare the current target to the base.
 */
export function verifyStillCurrent({ repoRoot, targetBranch, baseSha }) {
  if (!SHA_PATTERN.test(baseSha ?? '')) {
    throw new Error('baseSha must be a full commit SHA');
  }
  const repository = path.resolve(repoRoot);
  const target = validateBranchName(repository, targetBranch, 'targetBranch');
  const actualTip = fetchTargetTip(repository, target);
  return {
    current: actualTip === baseSha,
    actualTip,
  };
}
