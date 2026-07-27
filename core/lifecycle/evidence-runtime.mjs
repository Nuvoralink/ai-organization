#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const ATTEMPT_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
export const COMPLETION_CLAIM_LEASE_MS = 35 * 60 * 1_000;
export const MIN_PROOF_BUDGET_SAFETY_MARGIN_MS = 60 * 1_000;
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
const SAFE_ENV_NAMES = Object.freeze([
  'PATH',
  'Path',
  'PATHEXT',
  'SystemRoot',
  'COMSPEC',
  'ComSpec',
  'WINDIR',
  'HOME',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'TEMP',
  'TMP',
  'TMPDIR',
  'CI',
  'NO_COLOR',
  'FORCE_COLOR',
]);
const HUMAN_GATED_SCRIPT =
  /(?:^|[:._-])(migrate|migration|deploy|publish|release|production|prod|seed|backfill|cleanup|delete|destroy|drop|truncate|reset)(?:$|[:._-])/iu;
const HUMAN_GATED_BODY =
  /\b(?:prisma\s+(?:migrate|db\s+push)|deploy|publish|release|drop\s+(?:database|table)|truncate\s+table|rm\s+-rf|remove-item\b|production\s+(?:write|config)|vercel\b[^\r\n;&|]*--prod\b|railway\s+(?:up|deploy)\b|kubectl\s+(?:apply|delete|replace|patch)\b|terraform\s+(?:apply|destroy)\b)\b/iu;

export function isValidIntegrationBranch(branch) {
  if (
    typeof branch !== 'string' ||
    branch.length === 0 ||
    branch === '@' ||
    /^head$/iu.test(branch)
  )
    return false;
  if (!/^[A-Za-z0-9._/-]+$/u.test(branch)) return false;
  if (
    branch.startsWith('-') ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.endsWith('.')
  )
    return false;
  if (branch.includes('..') || branch.includes('//') || branch.includes('@{')) return false;
  return branch
    .split('/')
    .every(
      (component) =>
        component.length > 0 && !component.startsWith('.') && !component.endsWith('.lock'),
    );
}

export function integrationBranchBaseRef(profileRegistry) {
  const branch = profileRegistry?.integration_branch;
  if (!isValidIntegrationBranch(branch))
    throw new Error('Proof registry integration_branch must be an explicit safe Git branch name');
  return `origin/${branch}`;
}

export function agentFrontmatterName(text) {
  const frontmatter = String(text ?? '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? '';
  return frontmatter.match(/^name:\s*["']?([^"'\r\n]+?)["']?\s*$/mu)?.[1]?.trim();
}

export function validateRegisteredAgentRoleProviders(roles, root) {
  const failures = [];
  for (const role of roles ?? []) {
    const roleFile = typeof role?.file === 'string' ? path.join(root, role.file) : undefined;
    if (!roleFile || !fs.existsSync(roleFile))
      failures.push(`role file missing for ${role?.name ?? '<unnamed>'}`);
    else if (agentFrontmatterName(fs.readFileSync(roleFile, 'utf8')) !== role.name)
      failures.push(
        `role file frontmatter name does not match registered platform provider: ${role?.name ?? '<unnamed>'}`,
      );
  }
  return failures;
}

export function validateLifecycleRoleModes(roleMap, providerModes) {
  const failures = [];
  const expectedModes = ['read-only', 'implementation'];
  if (!roleMap || typeof roleMap !== 'object' || Array.isArray(roleMap))
    return ['lifecycle roles by completion mode must be an object'];
  const extraModes = Object.keys(roleMap).filter((mode) => !expectedModes.includes(mode));
  for (const mode of extraModes) failures.push(`unknown lifecycle completion mode: ${mode}`);
  for (const mode of expectedModes) {
    const roles = roleMap[mode];
    if (!Array.isArray(roles) || roles.length === 0) {
      failures.push(`lifecycle ${mode} roles must be a non-empty array`);
      continue;
    }
    if (new Set(roles).size !== roles.length)
      failures.push(`lifecycle ${mode} roles contain duplicates`);
    for (const role of roles) {
      if (!providerModes.has(role))
        failures.push(`lifecycle ${mode} role has no registered platform provider: ${role}`);
      else if (mode === 'implementation' && providerModes.get(role) !== 'implementation')
        failures.push(
          `lifecycle implementation role is not an implementation-capable provider: ${role}`,
        );
    }
  }
  return failures;
}

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value
      .map((item) => {
        const serialized = canonicalJson(item);
        return serialized === undefined ? 'null' : serialized;
      })
      .join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .flatMap((key) => {
        const serialized = canonicalJson(value[key]);
        return serialized === undefined ? [] : [`${JSON.stringify(key)}:${serialized}`];
      })
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function digestObject(value) {
  return sha256(canonicalJson(value));
}

export function signAttestation(value, secretHex) {
  return crypto
    .createHmac('sha256', Buffer.from(secretHex, 'hex'))
    .update(canonicalJson(value))
    .digest('hex');
}

export function verifyAttestation(receipt, secretHex) {
  if (
    !receipt ||
    typeof receipt !== 'object' ||
    !/^[a-f0-9]{64}$/u.test(receipt.attestation_hmac_sha256 ?? '')
  )
    return false;
  const { attestation_hmac_sha256: supplied, ...unsigned } = receipt;
  const expected = signAttestation(unsigned, secretHex);
  return crypto.timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
}

function normalizePath(value) {
  return path.resolve(value).replaceAll('\\', '/').toLowerCase();
}

function safeEnvironment(allowlist = []) {
  const names = new Set([...SAFE_ENV_NAMES, ...allowlist]);
  const env = {};
  for (const name of names) {
    if (/secret|token|password|credential|private[_-]?key/iu.test(name))
      throw new Error(`Proof profile cannot inherit sensitive environment variable: ${name}`);
    if (process.env[name] !== undefined) env[name] = process.env[name];
  }
  return env;
}

function executableAndArgs(argv) {
  if (argv[0].toLowerCase() !== 'npm') return { executable: argv[0], args: argv.slice(1) };
  const bundled = path.join(
    path.dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js',
  );
  const npmCli =
    process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)
      ? process.env.npm_execpath
      : bundled;
  if (!fs.existsSync(npmCli))
    throw new Error('npm CLI entrypoint is unavailable for registry-bound proof execution.');
  return { executable: process.execPath, args: [npmCli, ...argv.slice(1)] };
}

function spawn(argv, { cwd, timeoutMs, envAllowlist = [] }) {
  const startedAt = new Date().toISOString();
  const resolved = executableAndArgs(argv);
  const result = spawnSync(resolved.executable, resolved.args, {
    cwd,
    shell: false,
    encoding: 'utf8',
    env: safeEnvironment(envAllowlist),
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: MAX_OUTPUT_BYTES,
  });
  const stdout = String(result.stdout ?? '');
  const stderr = `${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`;
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: Number.isInteger(result.status) ? result.status : 1,
    stdout,
    stderr,
  };
}

function git(argv, cwd) {
  return spawnSync('git', argv, {
    cwd,
    shell: false,
    encoding: 'utf8',
    env: safeEnvironment(),
    timeout: 30_000,
    windowsHide: true,
    maxBuffer: MAX_OUTPUT_BYTES,
  });
}

function gitOutput(argv, cwd) {
  const result = git(argv, cwd);
  if (result.status !== 0 || result.error) {
    const detail =
      `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`.trim();
    throw new Error(`git ${argv.join(' ')} failed${detail ? `: ${detail.slice(-2_000)}` : ''}`);
  }
  return String(result.stdout ?? '');
}

function nulList(value) {
  return String(value).split('\0').filter(Boolean);
}

export function collectRepositoryState(cwd, { baseRef = 'origin/main' } = {}) {
  const root = gitOutput(['rev-parse', '--show-toplevel'], cwd).trim();
  const head = gitOutput(['rev-parse', 'HEAD'], root).trim();
  const base = gitOutput(['merge-base', 'HEAD', baseRef], root).trim();
  const branchResult = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], root);
  const branch =
    branchResult.status === 0 && !branchResult.error
      ? String(branchResult.stdout ?? '').trim() || null
      : null;
  if (!head || !base) throw new Error('Repository HEAD/base identity is unavailable.');

  const changedFiles = new Set([
    ...nulList(gitOutput(['diff', '--no-renames', '--name-only', '-z', `${base}...HEAD`], root)),
    ...nulList(gitOutput(['diff', '--cached', '--no-renames', '--name-only', '-z'], root)),
    ...nulList(gitOutput(['diff', '--no-renames', '--name-only', '-z'], root)),
    ...nulList(gitOutput(['ls-files', '--others', '--exclude-standard', '-z'], root)),
  ]);

  const material = [];
  const append = (label, value) =>
    material.push(`${label.length}:${label}:${Buffer.byteLength(value, 'utf8')}:${value}`);
  append('committed', gitOutput(['diff', '--binary', `${base}...HEAD`], root));
  append('staged', gitOutput(['diff', '--cached', '--binary'], root));
  append('worktree', gitOutput(['diff', '--binary'], root));
  for (const file of nulList(
    gitOutput(['ls-files', '--others', '--exclude-standard', '-z'], root),
  ).sort()) {
    append('untracked-path', file);
    append('untracked-object', gitOutput(['hash-object', '--no-filters', '--', file], root).trim());
  }
  return {
    root,
    worktree: {
      repository_root:
        gitOutput(['worktree', 'list', '--porcelain'], root)
          .split(/\r?\n/u)
          .find((line) => line.startsWith('worktree '))
          ?.slice('worktree '.length) ?? root,
      worktree_path: root,
      branch,
      head,
      base,
      dirty_count: changedFiles.size,
      dirty_sha256: sha256(material.join('\n')),
    },
    changed_files: [...changedFiles].map((file) => file.replaceAll('\\', '/')).sort(),
    binding: {
      root_sha256: sha256(normalizePath(root)),
      head,
      base,
      diff_sha256: sha256(material.join('\n')),
    },
  };
}

export function sameRepositoryBinding(left, right) {
  return Boolean(
    left &&
    right &&
    left.root_sha256 === right.root_sha256 &&
    left.head === right.head &&
    left.base === right.base &&
    left.diff_sha256 === right.diff_sha256,
  );
}

export function defaultAssuranceStateDirectory(root) {
  const commonDirectory = gitOutput(
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    root,
  ).trim();
  return path.join(path.resolve(commonDirectory), 'auxara-agent-assurance');
}

function taskKey(taskId) {
  return sha256(taskId).slice(0, 32);
}

function statePath(stateDirectory, taskId) {
  return path.join(stateDirectory, 'attempts', `task-${taskKey(taskId)}.json`);
}

function lockPath(stateDirectory, taskId) {
  return path.join(stateDirectory, 'locks', `task-${taskKey(taskId)}.lock`);
}

export function writeJson(file, value, { exclusive = false } = {}) {
  const directory = path.dirname(file);
  const temporaryFile = path.join(
    directory,
    `.${path.basename(file)}.tmp-${process.pid}-${crypto.randomBytes(8).toString('hex')}`,
  );
  const body = `${canonicalJson(value)}\n`;
  let handle;
  fs.mkdirSync(directory, { recursive: true });
  try {
    handle = fs.openSync(temporaryFile, 'wx', 0o600);
    fs.writeFileSync(handle, body, { encoding: 'utf8' });
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = undefined;

    if (exclusive) {
      // rename-over-target cannot retain O_EXCL semantics. A same-filesystem hard link publishes
      // the complete temp inode atomically and fails with EEXIST when the target is already present.
      fs.linkSync(temporaryFile, file);
    } else {
      fs.renameSync(temporaryFile, file);
    }
  } finally {
    if (handle !== undefined) fs.closeSync(handle);
    fs.rmSync(temporaryFile, { force: true });
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadTaskAttempt(stateDirectory, taskId) {
  const file = statePath(stateDirectory, taskId);
  return fs.existsSync(file) ? readJson(file) : undefined;
}

export function listTaskAttempts(stateDirectory) {
  const directory = path.join(stateDirectory, 'attempts');
  if (!fs.existsSync(directory)) return [];
  const attempts = [];
  const corrupt = [];
  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^task-[a-f0-9]{32}\.json$/u.test(entry.name));
  for (const entry of entries) {
    try {
      attempts.push(readJson(path.join(directory, entry.name)));
    } catch {
      corrupt.push({ corrupt: true, file: entry.name });
    }
  }
  return [...attempts, ...corrupt];
}

export function recordRestartReconciliation({
  stateDirectory,
  eventName,
  sessionId,
  liveStateSha256,
  reconciliation = 'reconciled',
}) {
  if (!['reconciled', 'indeterminate'].includes(reconciliation))
    throw new Error(`Unsupported restart reconciliation state: ${reconciliation}`);
  const file = path.join(stateDirectory, 'restart', 'reconciliation.json');
  const prior = fs.existsSync(file) ? readJson(file) : undefined;
  const sessionIdSha256 = sha256(sessionId ?? '');
  const epochSha256 =
    eventName === 'SessionStart' || prior?.session_id_sha256 !== sessionIdSha256
      ? sha256(`${sessionIdSha256}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`)
      : prior.epoch_sha256;
  const current = {
    schema_version: 1,
    event_name: eventName,
    event_state: 'consumed',
    reconciliation,
    session_id_sha256: sessionIdSha256,
    epoch_sha256: epochSha256,
    live_state_sha256: liveStateSha256,
    reconciled_at: new Date().toISOString(),
  };
  writeJson(file, current);
  return current;
}

/**
 * Bounded per-task fingerprint history for replacement dispatches.
 *
 * Retaining only the LATEST fingerprint detects sequential identity (S1 -> S1) but is blind to
 * OSCILLATION (S1 -> S2 -> S1), which loop-discipline's "No oscillation" guardrail names explicitly:
 * a loop stuck between two states makes no progress even though consecutive fingerprints differ.
 * A bounded history makes any repeat within the window a stall. The bound keeps the record small and
 * makes the guard honest about its reach — a repeat older than the window is NOT detected, and that
 * window is exactly the claim.
 */
export const MAX_REPLACEMENT_FINGERPRINT_HISTORY = 8;

function replacementDispatchPath(stateDirectory, taskId) {
  return path.join(
    stateDirectory,
    'restart',
    'replacement-dispatches',
    `task-${taskKey(taskId)}.json`,
  );
}

export function readReplacementDispatchHistory(stateDirectory, taskId) {
  const file = replacementDispatchPath(stateDirectory, taskId);
  if (!fs.existsSync(file)) return [];
  let prior;
  try {
    prior = readJson(file);
  } catch {
    return [];
  }
  if (prior?.task_id_sha256 !== sha256(taskId)) return [];
  if (Array.isArray(prior.live_state_sha256_history)) {
    return prior.live_state_sha256_history.filter((value) => typeof value === 'string');
  }
  // schema_version 1 retained only the latest fingerprint; read it as a one-entry history.
  return typeof prior.live_state_sha256 === 'string' ? [prior.live_state_sha256] : [];
}

export function replacementDispatchWouldStall({ stateDirectory, taskId, liveStateSha256 }) {
  return readReplacementDispatchHistory(stateDirectory, taskId).includes(liveStateSha256);
}

export function recordReplacementDispatch({ stateDirectory, taskId, liveStateSha256 }) {
  const history = readReplacementDispatchHistory(stateDirectory, taskId).filter(
    (value) => value !== liveStateSha256,
  );
  const bounded = [...history, liveStateSha256].slice(-MAX_REPLACEMENT_FINGERPRINT_HISTORY);
  writeJson(replacementDispatchPath(stateDirectory, taskId), {
    schema_version: 2,
    task_id_sha256: sha256(taskId),
    live_state_sha256: bounded[bounded.length - 1],
    live_state_sha256_history: bounded,
    event_state: 'consumed',
    recorded_at: new Date().toISOString(),
  });
}

export function acceptTaskAttempt({
  stateDirectory,
  payloadTaskId,
  attemptId = `att-${crypto.randomBytes(16).toString('hex')}`,
  contract,
  sessionId,
  implementerId,
  completionMode,
  repository,
  worktree,
  profileRegistry,
  riskPolicy,
  actionAuthority,
  repositoryBaseRef = 'origin/main',
  now = new Date(),
}) {
  if (!payloadTaskId || contract?.id !== payloadTaskId)
    throw new Error('Payload task id must exactly match the accepted contract id.');
  if (!sessionId) throw new Error('TaskCreated requires a session identity.');
  if (!implementerId) throw new Error('TaskCreated requires an implementer identity.');
  if (!/^att-[a-f0-9]{32}$/u.test(attemptId)) {
    throw new Error('TaskCreated requires a valid preallocated attempt identity.');
  }
  const file = statePath(stateDirectory, payloadTaskId);
  const contractSha256 = digestObject(contract);
  const sessionSha256 = sha256(sessionId);
  const implementerSha256 = sha256(implementerId);
  const implementerRoleSha256 = sha256(contract.execution?.implementer_role ?? '');
  const registrySha256 = digestObject(profileRegistry);
  const riskPolicySha256 = digestObject(riskPolicy);
  const actionAuthoritySha256 = digestObject(actionAuthority);
  if (fs.existsSync(file)) {
    const existing = readJson(file);
    const identicalRetry =
      existing.state === 'accepted' &&
      existing.contract_sha256 === contractSha256 &&
      existing.session_id_sha256 === sessionSha256 &&
      existing.implementer_id_sha256 === implementerSha256 &&
      existing.implementer_role_sha256 === implementerRoleSha256 &&
      existing.completion_mode === completionMode &&
      sameRepositoryBinding(existing.repository, repository) &&
      existing.profile_registry_sha256 === registrySha256 &&
      existing.risk_policy_sha256 === riskPolicySha256 &&
      existing.action_authority_sha256 === actionAuthoritySha256 &&
      existing.repository_base_ref === repositoryBaseRef;
    if (identicalRetry) return existing;
    throw new Error(
      `Task id collision or replay: ${payloadTaskId} already has a non-identical ${existing.state ?? 'unknown'} attempt.`,
    );
  }
  const createdAt = now.toISOString();
  const attempt = {
    schema_version: 2,
    state: 'accepted',
    task_id: payloadTaskId,
    attempt_id: attemptId,
    contract,
    contract_sha256: contractSha256,
    completion_mode: completionMode,
    repository,
    worktree,
    completion_tier: contract.completion?.tier,
    profile_registry_sha256: registrySha256,
    risk_policy_sha256: riskPolicySha256,
    action_authority_sha256: actionAuthoritySha256,
    repository_base_ref: repositoryBaseRef,
    implementer_id_sha256: implementerSha256,
    implementer_role_sha256: implementerRoleSha256,
    session_id_sha256: sessionSha256,
    secret_hex: crypto.randomBytes(32).toString('hex'),
    created_at: createdAt,
    expires_at: new Date(now.getTime() + ATTEMPT_TTL_MS).toISOString(),
    review_receipts: [],
    human_gate_receipts: [],
  };
  writeJson(file, attempt, { exclusive: true });
  return attempt;
}

export function collectCompletionReadiness(cwd, initialHead) {
  const root = gitOutput(['rev-parse', '--show-toplevel'], cwd).trim();
  const head = gitOutput(['rev-parse', 'HEAD'], root).trim();
  const status = gitOutput(['status', '--porcelain=v2', '-z', '--untracked-files=all'], root);
  const records = nulList(status);
  const dirty = { total: 0, staged: 0, unstaged: 0, untracked: 0, conflicted: 0 };
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record.startsWith('? ')) {
      dirty.total += 1;
      dirty.untracked += 1;
    } else if (record.startsWith('u ')) {
      dirty.total += 1;
      dirty.conflicted += 1;
    } else if (record.startsWith('1 ') || record.startsWith('2 ')) {
      const xy = record.split(' ', 3)[1] ?? '..';
      dirty.total += 1;
      if (xy[0] && xy[0] !== '.') dirty.staged += 1;
      if (xy[1] && xy[1] !== '.') dirty.unstaged += 1;
      if (record.startsWith('2 ')) index += 1;
    }
  }
  const initialIsAncestor =
    git(['merge-base', '--is-ancestor', initialHead, head], root).status === 0;
  const attributableCommitCount = initialIsAncestor
    ? Number(gitOutput(['rev-list', '--count', `${initialHead}..${head}`], root).trim())
    : 0;
  const attributableChangedFiles = initialIsAncestor
    ? nulList(
        gitOutput(['diff', '--no-renames', '--name-only', '-z', `${initialHead}..${head}`], root),
      )
        .map((file) => file.replaceAll('\\', '/'))
        .sort()
    : [];
  return {
    root,
    head,
    dirty,
    dirty_sha256: sha256(status),
    initial_head: initialHead,
    initial_is_ancestor: initialIsAncestor,
    attributable_commit_count: attributableCommitCount,
    attributable_changed_files: attributableChangedFiles,
  };
}

export function checkpointTaskAttempt({ stateDirectory, taskId, readiness, reason }) {
  return withTaskLock(stateDirectory, taskId, () => {
    const attempt = loadTaskAttempt(stateDirectory, taskId);
    if (!attempt || attempt.state === 'completed') return attempt;
    const checkpointed = {
      ...attempt,
      state: 'accepted',
      lifecycle: 'checkpointed',
      checkpoint: {
        head: readiness.head,
        dirty: readiness.dirty,
        dirty_sha256: readiness.dirty_sha256,
        attributable_commit_count: readiness.attributable_commit_count,
        checked_at: new Date().toISOString(),
        reason_sha256: sha256(reason),
      },
    };
    writeJson(statePath(stateDirectory, taskId), checkpointed);
    return checkpointed;
  });
}

function withTaskLock(stateDirectory, taskId, action) {
  const file = lockPath(stateDirectory, taskId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let handle;
  try {
    handle = fs.openSync(file, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Task attempt is already claimed: ${taskId}`);
    throw error;
  }
  try {
    return action();
  } finally {
    if (handle !== undefined) fs.closeSync(handle);
    try {
      fs.rmSync(file, { force: true });
    } catch {
      /* stale lock is fail-closed on the next claim */
    }
  }
}

export function claimTaskAttempt({ stateDirectory, taskId, sessionId, now = new Date() }) {
  return withTaskLock(stateDirectory, taskId, () => {
    const attempt = loadTaskAttempt(stateDirectory, taskId);
    if (!attempt) throw new Error(`No accepted TaskCreated attempt exists for ${taskId}.`);
    if (attempt.session_id_sha256 !== sha256(sessionId ?? ''))
      throw new Error('TaskCompleted session does not match TaskCreated.');
    if (attempt.state === 'completed') return { attempt, already_completed: true };
    if (attempt.state === 'completion_claimed') {
      const claimedAt = Date.parse(attempt.claimed_at);
      if (!Number.isFinite(claimedAt) || claimedAt + COMPLETION_CLAIM_LEASE_MS > now.getTime())
        throw new Error(`Task attempt is not claimable from state ${attempt.state}.`);
      const reclaimed = {
        ...attempt,
        claimed_at: now.toISOString(),
        prior_claim_expired_at: new Date(claimedAt + COMPLETION_CLAIM_LEASE_MS).toISOString(),
      };
      writeJson(statePath(stateDirectory, taskId), reclaimed);
      return { attempt: reclaimed, already_completed: false, reclaimed_expired_claim: true };
    }
    if (attempt.state !== 'accepted')
      throw new Error(`Task attempt is not claimable from state ${attempt.state}.`);
    if (Date.parse(attempt.expires_at) <= now.getTime())
      throw new Error('Task attempt expired before completion.');
    const claimed = { ...attempt, state: 'completion_claimed', claimed_at: now.toISOString() };
    writeJson(statePath(stateDirectory, taskId), claimed);
    return { attempt: claimed, already_completed: false };
  });
}

export function releaseTaskAttempt({ stateDirectory, taskId, reason }) {
  return withTaskLock(stateDirectory, taskId, () => {
    const attempt = loadTaskAttempt(stateDirectory, taskId);
    if (!attempt || attempt.state !== 'completion_claimed') return attempt;
    const released = {
      ...attempt,
      state: 'accepted',
      last_failure_sha256: sha256(reason ?? 'unknown'),
      claimed_at: undefined,
    };
    delete released.claimed_at;
    writeJson(statePath(stateDirectory, taskId), released);
    return released;
  });
}

export function commitTaskCompletion({ stateDirectory, taskId, completionReceipt }) {
  return withTaskLock(stateDirectory, taskId, () => {
    const attempt = loadTaskAttempt(stateDirectory, taskId);
    if (!attempt) throw new Error(`No task attempt exists for ${taskId}.`);
    if (attempt.state === 'completed') return attempt;
    if (attempt.state !== 'completion_claimed')
      throw new Error(`Task attempt cannot complete from state ${attempt.state}.`);
    const durableAttempt = { ...attempt };
    delete durableAttempt.secret_hex;
    const completed = {
      ...durableAttempt,
      state: 'completed',
      completed_at: new Date().toISOString(),
      completion_receipt_sha256: digestObject(completionReceipt),
      completion_receipt: completionReceipt,
    };
    writeJson(statePath(stateDirectory, taskId), completed);
    return completed;
  });
}

export function normalizeProfileRegistry(registry) {
  if (!registry || typeof registry !== 'object') return [];
  const effective = (profile) =>
    profile?.assurance ? { id: profile.id, ...profile.assurance } : profile;
  if (Array.isArray(registry.profiles)) return registry.profiles.map(effective);
  if (registry.profiles && typeof registry.profiles === 'object') {
    return Object.entries(registry.profiles).map(([id, profile]) => effective({ id, ...profile }));
  }
  return [];
}

function npmScriptClosure(scriptName, scripts, seen = new Set()) {
  if (seen.has(scriptName)) return [];
  seen.add(scriptName);
  const body = scripts[scriptName];
  if (typeof body !== 'string') return [`npm script is not registered: ${scriptName}`];
  const failures = [];
  if (HUMAN_GATED_SCRIPT.test(scriptName) || HUMAN_GATED_BODY.test(body))
    failures.push(`human-gated npm script cannot be a proof: ${scriptName}`);
  for (const lifecycleName of [`pre${scriptName}`, `post${scriptName}`]) {
    if (typeof scripts[lifecycleName] === 'string')
      failures.push(...npmScriptClosure(lifecycleName, scripts, seen));
  }
  const nested = [...body.matchAll(/\bnpm\s+run\s+([A-Za-z0-9:._-]+)/gu)].map((match) => match[1]);
  for (const child of nested) failures.push(...npmScriptClosure(child, scripts, seen));
  return failures;
}

export function validateSafeProofProfile(profile, { cwd, actionAuthority }) {
  const failures = [];
  if (!profile || typeof profile !== 'object') return ['proof profile is missing'];
  if (profile.id === 'internal-read-only' && profile.classification === 'internal_read_only') {
    const exact =
      profile.safe_local_only === true &&
      profile.capabilities?.length === 1 &&
      profile.capabilities[0] === 'read_only_integrity' &&
      profile.commands?.length === 1 &&
      profile.commands[0]?.id === 'repository-binding' &&
      JSON.stringify(profile.commands[0]?.argv) ===
        JSON.stringify(['internal', 'repository-binding']) &&
      !profile.mutation;
    return exact
      ? []
      : [
          'internal-read-only profile drifted from the built-in non-executing repository-binding proof',
        ];
  }
  if (profile.classification !== 'local_non_mutating' || profile.safe_local_only !== true)
    failures.push(`${profile.id ?? '<unknown>'}: profile is not classified local_non_mutating`);
  if (!actionAuthority?.autonomous?.includes('run_local_tests_and_safe_read_only_checks'))
    failures.push('action-authority policy does not authorize local safe checks');
  if (!Array.isArray(profile.capabilities) || profile.capabilities.length === 0)
    failures.push(`${profile.id ?? '<unknown>'}: capabilities are required`);
  if (!Array.isArray(profile.commands) || profile.commands.length === 0)
    failures.push(`${profile.id ?? '<unknown>'}: at least one command is required`);
  if (!Array.isArray(profile.env_allowlist) || profile.env_allowlist.length !== 0)
    failures.push(
      `${profile.id ?? '<unknown>'}: local non-mutating proof profiles cannot inherit additional environment variables`,
    );
  let scripts = {};
  try {
    scripts = readJson(path.join(cwd, 'package.json')).scripts ?? {};
  } catch {
    failures.push('package.json scripts are unavailable for proof allowlisting');
  }
  for (const command of profile.commands ?? []) {
    if (
      !command?.id ||
      !Array.isArray(command.argv) ||
      command.argv.length !== 3 ||
      command.argv[0] !== 'npm' ||
      command.argv[1] !== 'run'
    ) {
      failures.push(
        `${profile.id ?? '<unknown>'}: proof commands must be exact three-part argv arrays: npm run <registered-script>`,
      );
      continue;
    }
    failures.push(...npmScriptClosure(command.argv[2], scripts));
    if (
      !Number.isInteger(command.timeout_ms) ||
      command.timeout_ms < 1_000 ||
      command.timeout_ms > 30 * 60_000
    )
      failures.push(`${profile.id}:${command.id}: timeout must be 1s..30m`);
    if (!command.parser || !['nonempty', 'tap', 'patterns'].includes(command.parser.kind))
      failures.push(`${profile.id}:${command.id}: a supported output parser is required`);
  }
  if (profile.mutation) {
    const command = profile.mutation;
    if (
      !command.case_id ||
      !Array.isArray(command.argv) ||
      command.argv.length !== 3 ||
      command.argv[0] !== 'npm' ||
      command.argv[1] !== 'run'
    )
      failures.push(`${profile.id}: mutation must be an exact three-part registered npm run argv`);
    else failures.push(...npmScriptClosure(command.argv[2], scripts));
    if (
      !Number.isInteger(command.timeout_ms) ||
      command.timeout_ms < 1_000 ||
      command.timeout_ms > 30 * 60_000
    )
      failures.push(`${profile.id}: mutation timeout must be 1s..30m`);
    if (!command.receipt_marker || !command.expected_diagnostic)
      failures.push(`${profile.id}: mutation receipt marker and expected diagnostic are required`);
  }
  return [...new Set(failures)];
}

export function validateLifecycleProofBudget(contract, profileRegistry) {
  const failures = [];
  const hookTimeoutMs = profileRegistry?.lifecycle_hook_timeout_ms;
  const safetyMarginMs = profileRegistry?.lifecycle_timeout_safety_margin_ms;
  if (!Number.isInteger(hookTimeoutMs) || hookTimeoutMs < MIN_PROOF_BUDGET_SAFETY_MARGIN_MS * 2)
    failures.push(
      'Proof registry lifecycle_hook_timeout_ms must be an integer of at least two minutes',
    );
  if (!Number.isInteger(safetyMarginMs) || safetyMarginMs < MIN_PROOF_BUDGET_SAFETY_MARGIN_MS)
    failures.push('Proof registry lifecycle_timeout_safety_margin_ms must be at least one minute');
  if (
    Number.isInteger(hookTimeoutMs) &&
    Number.isInteger(safetyMarginMs) &&
    hookTimeoutMs + safetyMarginMs > COMPLETION_CLAIM_LEASE_MS
  )
    failures.push('Lifecycle hook timeout plus safety margin exceeds the completion claim lease');
  const profiles = new Map(
    normalizeProfileRegistry(profileRegistry).map((profile) => [profile.id, profile]),
  );
  let aggregateBudgetMs = 0;
  for (const proof of (contract?.proofs ?? []).filter((candidate) => candidate.required)) {
    const profile = profiles.get(proof.profile_id);
    if (!profile) continue;
    for (const command of profile.commands ?? []) {
      if (Number.isInteger(command.timeout_ms)) aggregateBudgetMs += command.timeout_ms;
      else
        failures.push(`${proof.id}: command timeout is unavailable for aggregate proof budgeting`);
    }
    if (proof.mutation?.required === true) {
      if (Number.isInteger(profile.mutation?.timeout_ms))
        aggregateBudgetMs += profile.mutation.timeout_ms;
      else
        failures.push(`${proof.id}: mutation timeout is unavailable for aggregate proof budgeting`);
    }
  }
  if (
    Number.isInteger(hookTimeoutMs) &&
    Number.isInteger(safetyMarginMs) &&
    aggregateBudgetMs + safetyMarginMs > hookTimeoutMs
  )
    failures.push(
      `Aggregate proof budget ${aggregateBudgetMs}ms plus safety margin exceeds lifecycle hook timeout ${hookTimeoutMs}ms`,
    );
  if (
    aggregateBudgetMs +
      (Number.isInteger(safetyMarginMs) ? safetyMarginMs : MIN_PROOF_BUDGET_SAFETY_MARGIN_MS) >
    COMPLETION_CLAIM_LEASE_MS
  )
    failures.push('Aggregate proof budget plus safety margin exceeds the completion claim lease');
  return [...new Set(failures)];
}

function summaryCount(combined, label) {
  const match = new RegExp(`^# ${label}\\s+([0-9]+)\\s*$`, 'mu').exec(combined);
  return match ? Number(match[1]) : undefined;
}

export function parseCommandOutput(command, execution) {
  const combined = [execution.stdout, execution.stderr]
    .filter((value) => value.length > 0)
    .join('\n');
  const bytes = Buffer.byteLength(combined, 'utf8');
  const parser = command.parser ?? { kind: 'nonempty' };
  const requiredPatterns = parser.required_patterns ?? [];
  const observedCases = [];
  let executedCount = bytes > 0 ? 1 : 0;
  let skippedCount = 0;
  const failures = [];
  if (execution.exitCode !== 0) failures.push(`exit ${execution.exitCode}`);
  if (bytes < (parser.minimum_output_bytes ?? 1))
    failures.push('proof output is empty or below the registered minimum');
  for (const pattern of requiredPatterns) {
    if (!new RegExp(pattern, 'mu').test(combined))
      failures.push(`required output pattern was not observed: ${pattern}`);
    else observedCases.push(pattern);
  }
  if (parser.kind === 'tap') {
    const plan = /^1\.\.([0-9]+)\s*$/mu.exec(combined);
    const lines = combined.split(/\r?\n/u);
    const topLevelResults = lines.filter((line) => /^(?:ok|not ok)\s+[0-9]+\b/u.test(line));
    const topLevelIds = topLevelResults.map((line) =>
      Number(/^(?:ok|not ok)\s+([0-9]+)\b/u.exec(line)?.[1] ?? -1),
    );
    const failedAssertions = lines.filter((line) => /^\s*not ok\s+[0-9]+\b/u.test(line));
    const tapSkips = lines.filter((line) => /^\s*ok\s+[0-9]+\b.*#\s*SKIP\b/iu.test(line));
    const tests = summaryCount(combined, 'tests');
    const passed = summaryCount(combined, 'pass');
    const failed = summaryCount(combined, 'fail');
    const cancelled = summaryCount(combined, 'cancelled');
    const skipped = summaryCount(combined, 'skipped');
    const hasSummary = [tests, passed, failed, cancelled, skipped].some(
      (value) => value !== undefined,
    );
    executedCount = tests ?? topLevelResults.length;
    skippedCount = skipped ?? tapSkips.length;
    if (!/^TAP version 13\s*$/mu.test(combined) || !plan)
      failures.push('structured TAP output lacks a TAP 13 header or top-level plan');
    if (topLevelResults.length === 0 || Number(plan?.[1] ?? -1) !== topLevelResults.length)
      failures.push('structured TAP plan and top-level result lines disagree');
    if (
      topLevelIds.some((id, index) => id !== index + 1) ||
      new Set(topLevelIds).size !== topLevelIds.length
    )
      failures.push(
        'structured TAP test-point ids must be unique, contiguous, and match the top-level plan',
      );
    if (
      hasSummary &&
      ([tests, passed, failed, cancelled, skipped].some((value) => value === undefined) ||
        tests !== topLevelResults.length ||
        passed !== tests ||
        failed !== 0 ||
        cancelled !== 0)
    )
      failures.push('structured TAP summary is incomplete or inconsistent');
    if (failedAssertions.length > 0)
      failures.push('structured TAP output reported a failed assertion');
    if (executedCount < (parser.minimum_executed ?? 1))
      failures.push('structured test output reported zero applicable tests');
    if (parser.forbid_skips === true && skippedCount > 0)
      failures.push('structured test output reported skipped tests');
  }
  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    executed_count: executedCount,
    skipped_count: skippedCount,
    observed_cases: observedCases,
    failures,
  };
}

function artifactReference(stateDirectory, executionId, label, artifact) {
  const safeLabel = label.replace(/[^a-zA-Z0-9._-]/gu, '-');
  const relative = path.posix.join('artifacts', `${executionId}-${safeLabel}.json`);
  const file = path.join(stateDirectory, ...relative.split('/'));
  const body = `${canonicalJson(artifact)}\n`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  return { path: relative, sha256: sha256(body), bytes: Buffer.byteLength(body, 'utf8') };
}

export function openEvidenceArtifact(reference, stateDirectory) {
  if (
    !reference?.path ||
    path.posix.isAbsolute(reference.path) ||
    reference.path.includes('\\') ||
    reference.path === '..' ||
    reference.path.startsWith('../')
  )
    throw new Error('Evidence artifact path is not portable or contained.');
  const base = path.resolve(stateDirectory);
  const file = path.resolve(base, ...reference.path.split('/'));
  if (file !== base && !file.startsWith(`${base}${path.sep}`))
    throw new Error('Evidence artifact escapes the assurance state directory.');
  const body = fs.readFileSync(file);
  if (body.length !== reference.bytes || sha256(body) !== reference.sha256)
    throw new Error(`Evidence artifact digest mismatch: ${reference.path}`);
  return JSON.parse(body.toString('utf8'));
}

function commandReceipt(command, execution, stateDirectory, executionId) {
  const parser = parseCommandOutput(command, execution);
  const artifact = {
    schema_version: 1,
    execution_id: executionId,
    command_id: command.id,
    argv: command.argv,
    exit_code: execution.exitCode,
    stdout_sha256: sha256(execution.stdout),
    stderr_sha256: sha256(execution.stderr),
    stdout_bytes: Buffer.byteLength(execution.stdout, 'utf8'),
    stderr_bytes: Buffer.byteLength(execution.stderr, 'utf8'),
    parser: {
      status: parser.status,
      executed_count: parser.executed_count,
      skipped_count: parser.skipped_count,
      observed_cases: parser.observed_cases,
    },
  };
  return {
    receipt: {
      command_id: command.id,
      argv: command.argv,
      started_at: execution.startedAt,
      finished_at: execution.finishedAt,
      exit_code: execution.exitCode,
      stdout_sha256: artifact.stdout_sha256,
      stderr_sha256: artifact.stderr_sha256,
      stdout_bytes: artifact.stdout_bytes,
      stderr_bytes: artifact.stderr_bytes,
      artifact: artifactReference(stateDirectory, executionId, command.id, artifact),
      parser: artifact.parser,
    },
    failures: parser.failures,
  };
}

function mutationReceipt(profileMutation, execution, stateDirectory, executionId, expectedCaseId) {
  const combined = `${execution.stdout}\n${execution.stderr}`;
  const line = combined
    .split(/\r?\n/u)
    .find((candidate) => candidate.startsWith(profileMutation.receipt_marker));
  const failures = [];
  let observed;
  try {
    observed = JSON.parse(line?.slice(profileMutation.receipt_marker.length).trim() ?? '');
  } catch {
    failures.push('registered mutation command did not emit a parseable mutation receipt');
  }
  if (execution.exitCode !== 0) failures.push(`mutation harness exited ${execution.exitCode}`);
  if (observed) {
    const structurallyValid =
      observed.schema_version === 1 &&
      typeof observed.case_id === 'string' &&
      Number.isInteger(observed.baseline?.exit_code) &&
      /^[a-f0-9]{64}$/u.test(observed.baseline?.digest ?? '') &&
      Number.isInteger(observed.mutant?.exit_code) &&
      typeof observed.mutant?.diagnostic === 'string' &&
      /^[a-f0-9]{64}$/u.test(observed.restored?.digest ?? '') &&
      Number.isInteger(observed.post_restore?.exit_code) &&
      /^[a-f0-9]{64}$/u.test(observed.post_restore?.digest ?? '');
    if (!structurallyValid) failures.push('registered mutation receipt has an invalid structure');
    else {
      if (observed.case_id !== expectedCaseId || observed.case_id !== profileMutation.case_id)
        failures.push('mutation case identity does not match the registered case');
      if (observed.baseline.exit_code !== 0) failures.push('mutation baseline did not pass');
      if (observed.mutant.exit_code === 0) failures.push('registered mutant did not fail');
      if (!observed.mutant.diagnostic.includes(profileMutation.expected_diagnostic))
        failures.push('mutant failed for the wrong reason');
      if (observed.restored.digest !== observed.baseline.digest)
        failures.push('mutation fixture was not exactly restored');
      if (
        observed.post_restore.exit_code !== 0 ||
        observed.post_restore.digest !== observed.baseline.digest
      )
        failures.push('post-restore clean proof did not pass against the restored fixture');
    }
  }
  const artifactBody = {
    schema_version: 1,
    execution_id: executionId,
    case_id: expectedCaseId,
    harness_exit_code: execution.exitCode,
    stdout_sha256: sha256(execution.stdout),
    stderr_sha256: sha256(execution.stderr),
    observed: observed ?? null,
    parser_status: failures.length === 0 ? 'pass' : 'fail',
  };
  const artifact = artifactReference(
    stateDirectory,
    executionId,
    `mutation-${expectedCaseId}`,
    artifactBody,
  );
  return {
    receipt:
      observed && !failures.includes('registered mutation receipt has an invalid structure')
        ? {
            case_id: expectedCaseId,
            harness_execution_id: executionId,
            artifact,
            baseline: { exit_code: observed.baseline.exit_code, digest: observed.baseline.digest },
            mutant: {
              exit_code: observed.mutant.exit_code,
              diagnostic_sha256: sha256(observed.mutant.diagnostic),
            },
            restored: { digest: observed.restored.digest },
            post_restore: {
              exit_code: observed.post_restore.exit_code,
              digest: observed.post_restore.digest,
            },
          }
        : null,
    failures,
  };
}

export function runRequiredProofs({
  contract,
  attempt,
  profileRegistry,
  actionAuthority,
  cwd,
  stateDirectory,
  repositoryProvider = collectRepositoryState,
  baseRef = 'origin/main',
}) {
  const profiles = new Map(
    normalizeProfileRegistry(profileRegistry).map((profile) => [profile.id, profile]),
  );
  const receipts = [];
  const failures = [];
  for (const proof of (contract.proofs ?? []).filter((candidate) => candidate.required)) {
    const profile = profiles.get(proof.profile_id);
    const profileFailures = validateSafeProofProfile(profile, { cwd, actionAuthority });
    if (!profile) profileFailures.push(`Proof profile is not registered: ${proof.profile_id}`);
    if (profile && !profile.capabilities?.includes(proof.capability))
      profileFailures.push(`${proof.profile_id} does not provide capability ${proof.capability}`);
    if (profileFailures.length > 0) {
      failures.push(...profileFailures.map((failure) => `${proof.id}: ${failure}`));
      continue;
    }
    const before = repositoryProvider(cwd, { baseRef });
    const executionId = `run-${crypto.randomBytes(16).toString('hex')}`;
    const startedAt = new Date().toISOString();
    const commandReceipts = [];
    for (const command of profile.commands) {
      const execution =
        command.argv[0] === 'internal' &&
        command.argv[1] === 'repository-binding' &&
        profile.id === 'internal-read-only'
          ? {
              startedAt: new Date().toISOString(),
              finishedAt: new Date().toISOString(),
              exitCode: 0,
              stdout: `READ_ONLY_REPOSITORY_BINDING:${digestObject(before.binding)}`,
              stderr: '',
            }
          : spawn(command.argv, {
              cwd,
              timeoutMs: command.timeout_ms,
              envAllowlist: profile.env_allowlist ?? [],
            });
      const result = commandReceipt(command, execution, stateDirectory, executionId);
      commandReceipts.push(result.receipt);
      failures.push(...result.failures.map((failure) => `${proof.id}/${command.id}: ${failure}`));
    }
    let mutation = null;
    if (proof.mutation?.required === true) {
      if (!profile.mutation || profile.mutation.case_id !== proof.mutation.case_id) {
        failures.push(
          `${proof.id}: registered mutation case ${proof.mutation.case_id} is unavailable`,
        );
      } else {
        const execution = spawn(profile.mutation.argv, {
          cwd,
          timeoutMs: profile.mutation.timeout_ms,
          envAllowlist: profile.env_allowlist ?? [],
        });
        const result = mutationReceipt(
          profile.mutation,
          execution,
          stateDirectory,
          executionId,
          proof.mutation.case_id,
        );
        mutation = result.receipt;
        failures.push(
          ...result.failures.map((failure) => `${proof.id}/${proof.mutation.case_id}: ${failure}`),
        );
      }
    }
    const after = repositoryProvider(cwd, { baseRef });
    if (!sameRepositoryBinding(before.binding, after.binding))
      failures.push(`${proof.id}: proof execution changed repository state`);
    const unsigned = {
      proof_id: proof.id,
      profile_id: profile.id,
      profile_sha256: digestObject(profile),
      capability: proof.capability,
      execution_id: executionId,
      attempt_id: attempt.attempt_id,
      contract_sha256: attempt.contract_sha256,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      repository_before: before.binding,
      repository_after: after.binding,
      commands: commandReceipts,
      mutation,
    };
    receipts.push({
      ...unsigned,
      attestation_hmac_sha256: signAttestation(unsigned, attempt.secret_hex),
    });
  }
  return { receipts, failures };
}

export function recordReviewReceipt({
  stateDirectory,
  taskId,
  reviewerId,
  reviewerSessionId,
  role,
  repository,
  verdict,
  findingCount = 0,
  unresolvedFindingCount = 0,
}) {
  return withTaskLock(stateDirectory, taskId, () => {
    const attempt = loadTaskAttempt(stateDirectory, taskId);
    if (!attempt || attempt.state !== 'accepted')
      throw new Error('Review can be recorded only for an accepted, unclaimed task attempt.');
    const reviewerSessionSha256 = sha256(reviewerSessionId ?? '');
    if (!attempt.completion_report_receipt)
      throw new Error('Independent review requires a bound implementer completion report first.');
    if (
      !reviewerId ||
      !reviewerSessionId ||
      sha256(reviewerId) === attempt.completion_report_receipt.reporter_id_sha256
    )
      throw new Error(
        'Independent review requires a different platform run identity from the implementer report.',
      );
    if (
      !role ||
      !['pass', 'findings'].includes(verdict) ||
      !Number.isInteger(findingCount) ||
      findingCount < 0 ||
      !Number.isInteger(unresolvedFindingCount) ||
      unresolvedFindingCount < 0 ||
      unresolvedFindingCount > findingCount
    ) {
      throw new Error(
        'Review receipt requires a role, valid verdict, and consistent non-negative finding counts.',
      );
    }
    const unsigned = {
      review_id: `review-${crypto.randomBytes(16).toString('hex')}`,
      attempt_id: attempt.attempt_id,
      contract_sha256: attempt.contract_sha256,
      reviewer_id_sha256: sha256(reviewerId),
      reviewer_session_sha256: reviewerSessionSha256,
      role,
      repository,
      verdict,
      finding_count: findingCount,
      unresolved_finding_count: unresolvedFindingCount,
      reviewed_at: new Date().toISOString(),
    };
    const priorForRole = (attempt.review_receipts ?? []).find(
      (candidate) => candidate.role === role,
    );
    if (priorForRole) unsigned.supersedes_review_id = priorForRole.review_id;
    const receipt = {
      ...unsigned,
      attestation_hmac_sha256: signAttestation(unsigned, attempt.secret_hex),
    };
    const retained = (attempt.review_receipts ?? []).filter((candidate) => candidate.role !== role);
    const history = priorForRole
      ? [...(attempt.review_history ?? []), priorForRole]
      : [...(attempt.review_history ?? [])];
    const updated = {
      ...attempt,
      review_receipts: [...retained, receipt],
      review_history: history,
    };
    writeJson(statePath(stateDirectory, taskId), updated);
    return receipt;
  });
}

export function recordCompletionReportReceipt({
  stateDirectory,
  taskId,
  reporterId,
  reporterSessionId,
  reporterRole,
  repository,
  report,
}) {
  return withTaskLock(stateDirectory, taskId, () => {
    const attempt = loadTaskAttempt(stateDirectory, taskId);
    if (!attempt || attempt.state !== 'accepted')
      throw new Error(
        'Completion report can be recorded only for an accepted, unclaimed task attempt.',
      );
    if (
      !reporterId ||
      !reporterSessionId ||
      !report ||
      report.task_id !== taskId ||
      !Array.isArray(report.unreached_surfaces) ||
      typeof report.doctrine_loop !== 'string' ||
      report.doctrine_loop.trim().length === 0
    ) {
      throw new Error(
        'Completion report requires the accepted task id, platform run identity, unreached_surfaces, and doctrine_loop.',
      );
    }
    if (sha256(reporterSessionId) !== attempt.session_id_sha256)
      throw new Error('Completion report session does not match the accepted TaskCreated session.');
    if (!reporterRole || sha256(reporterRole) !== attempt.implementer_role_sha256)
      throw new Error('Completion report role does not match the accepted task implementer role.');
    const prior = attempt.completion_report_receipt;
    if (
      prior &&
      (prior.reporter_id_sha256 !== sha256(reporterId) ||
        prior.reporter_session_sha256 !== sha256(reporterSessionId) ||
        prior.reporter_role !== reporterRole)
    ) {
      throw new Error(
        'Completion report can be superseded only by the same accepted implementer platform run.',
      );
    }
    if (
      prior &&
      sameRepositoryBinding(prior.repository, repository) &&
      digestObject(prior.unreached_surfaces) === digestObject(report.unreached_surfaces) &&
      prior.doctrine_loop === report.doctrine_loop
    )
      return prior;
    const unsigned = {
      report_id: `report-${crypto.randomBytes(16).toString('hex')}`,
      attempt_id: attempt.attempt_id,
      contract_sha256: attempt.contract_sha256,
      reporter_id_sha256: sha256(reporterId),
      reporter_session_sha256: sha256(reporterSessionId),
      reporter_role: reporterRole ?? 'implementer',
      repository,
      unreached_surfaces: report.unreached_surfaces,
      doctrine_loop: report.doctrine_loop,
      reported_at: new Date().toISOString(),
    };
    if (prior) unsigned.supersedes_report_id = prior.report_id;
    const receipt = {
      ...unsigned,
      attestation_hmac_sha256: signAttestation(unsigned, attempt.secret_hex),
    };
    writeJson(statePath(stateDirectory, taskId), {
      ...attempt,
      completion_report_receipt: receipt,
    });
    return receipt;
  });
}

export function buildCompletionEvidence({
  contract,
  attempt,
  repository,
  changedFiles,
  proofReceipts,
}) {
  return {
    schema_version: 2,
    task_id: contract.id,
    attempt_id: attempt.attempt_id,
    contract_sha256: attempt.contract_sha256,
    repository,
    changed_files: [...changedFiles],
    proof_receipts: proofReceipts,
    review_receipts: [...(attempt.review_receipts ?? [])],
    human_gate_receipts: [...(attempt.human_gate_receipts ?? [])],
    completion_report_receipt: attempt.completion_report_receipt,
    unreached_surfaces: [...(attempt.completion_report_receipt?.unreached_surfaces ?? [])],
    doctrine_loop: attempt.completion_report_receipt?.doctrine_loop,
  };
}
