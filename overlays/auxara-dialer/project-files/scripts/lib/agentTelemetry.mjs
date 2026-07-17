import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const EVENT_NAMES = new Set([
  'SessionStart',
  'SubagentStart',
  'TaskCreated',
  'TaskCompleted',
  'SubagentStop',
  'PostCompact',
  'SessionEnd',
  'Malformed',
]);
const OUTCOMES = new Set(['allow', 'block', 'observe']);
const COMPLETION_TIERS = new Set(['read-only', 'implementation']);
const SESSION_SOURCES = new Set(['startup', 'resume', 'clear', 'compact', 'unknown']);
const COMPACT_TRIGGERS = new Set(['manual', 'auto', 'unknown']);
const SESSION_END_REASONS = new Set([
  'clear',
  'resume',
  'logout',
  'prompt_input_exit',
  'bypass_permissions_disabled',
  'other',
  'unknown',
]);

function finiteNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

function boundedAgentType(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._-]{1,64}$/.test(value)) return 'unknown';
  return value;
}

function enumValue(value, allowed, fallback = undefined) {
  return typeof value === 'string' && allowed.has(value) ? value : fallback;
}

export function hashIdentifier(value) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return createHash('sha256').update('auxara-agent-id\0').update(value).digest('hex');
}

export function hashSummary(value) {
  return createHash('sha256')
    .update(String(value ?? ''), 'utf8')
    .digest('hex');
}

export function telemetryDirectory(cwd = process.cwd()) {
  return path.resolve(cwd, 'tmp', 'agent-telemetry');
}

function telemetryRecord(input) {
  const parsedTimestamp =
    typeof input.timestamp === 'string' && Number.isFinite(Date.parse(input.timestamp))
      ? new Date(input.timestamp).toISOString()
      : new Date().toISOString();
  const record = {
    schema_version: 1,
    event_name: EVENT_NAMES.has(input.eventName) ? input.eventName : 'Malformed',
    timestamp: parsedTimestamp,
  };

  const sessionHash = hashIdentifier(input.sessionId);
  const taskHash = hashIdentifier(input.taskId);
  if (sessionHash) record.session_hash = sessionHash;
  if (taskHash) record.task_hash = taskHash;
  if (input.agentType !== undefined) record.agent_type = boundedAgentType(input.agentType);

  const outcome = enumValue(input.outcome, OUTCOMES);
  const completionTier = enumValue(input.completionTier, COMPLETION_TIERS);
  const source = enumValue(input.source, SESSION_SOURCES, 'unknown');
  const trigger = enumValue(input.trigger, COMPACT_TRIGGERS, 'unknown');
  const reason = enumValue(input.reason, SESSION_END_REASONS, 'unknown');
  if (outcome) record.outcome = outcome;
  if (completionTier) record.completion_tier = completionTier;
  if (input.source !== undefined) record.source = source;
  if (input.trigger !== undefined) record.trigger = trigger;
  if (input.reason !== undefined) record.reason = reason;

  for (const [key, value] of [
    ['branch_count', input.branchCount],
    ['worktree_count', input.worktreeCount],
    ['duration_ms', input.durationMs],
    ['changed_file_count', input.changedFileCount],
    ['gate_count', input.gateCount],
    ['failed_check_count', input.failedCheckCount],
    ['summary_bytes', input.summaryBytes],
    ['missing_section_count', input.missingSectionCount],
    ['malformed_count', input.malformedCount],
  ]) {
    const safeValue = finiteNonNegativeInteger(value);
    if (safeValue !== undefined) record[key] = safeValue;
  }

  if (typeof input.summaryHash === 'string' && /^[a-f0-9]{64}$/.test(input.summaryHash)) {
    record.summary_hash = input.summaryHash;
  }

  return record;
}

export function appendTelemetry(input, directory = telemetryDirectory()) {
  mkdirSync(directory, { recursive: true });
  const record = telemetryRecord(input);
  appendFileSync(path.join(directory, 'events.jsonl'), `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

function sessionStatePath(sessionId, directory) {
  const hash = hashIdentifier(sessionId);
  return hash ? path.join(directory, `session-${hash}.json`) : undefined;
}

function taskStatePath(taskId, directory) {
  const hash = hashIdentifier(taskId);
  return hash ? path.join(directory, `task-${hash}.json`) : undefined;
}

export function recordSessionStart(
  sessionId,
  startedAt = Date.now(),
  directory = telemetryDirectory(),
) {
  const statePath = sessionStatePath(sessionId, directory);
  if (!statePath) return;
  mkdirSync(directory, { recursive: true });
  const state = {
    schema_version: 1,
    session_hash: hashIdentifier(sessionId),
    started_at_ms: finiteNonNegativeInteger(startedAt) ?? Date.now(),
  };
  try {
    writeFileSync(statePath, `${JSON.stringify(state)}\n`, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
  }
}

export function sessionDurationMs(
  sessionId,
  endedAt = Date.now(),
  directory = telemetryDirectory(),
) {
  const statePath = sessionStatePath(sessionId, directory);
  if (!statePath) return undefined;
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    if (!Number.isInteger(state?.started_at_ms) || state.started_at_ms < 0) return undefined;
    return Math.max(0, Math.round(endedAt - state.started_at_ms));
  } catch {
    return undefined;
  }
}

export function recordTaskCompletionTier(
  taskId,
  completionTier,
  directory = telemetryDirectory(),
  worktreeFingerprint,
) {
  const statePath = taskStatePath(taskId, directory);
  const tier = enumValue(completionTier, COMPLETION_TIERS);
  if (!statePath || !tier) return;
  mkdirSync(directory, { recursive: true });
  const state = {
    schema_version: 1,
    task_hash: hashIdentifier(taskId),
    completion_tier: tier,
  };
  if (typeof worktreeFingerprint === 'string' && /^[a-f0-9]{64}$/.test(worktreeFingerprint)) {
    state.worktree_fingerprint = worktreeFingerprint;
  }
  try {
    writeFileSync(statePath, `${JSON.stringify(state)}\n`, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
  }
}

export function taskCompletionTier(taskId, directory = telemetryDirectory()) {
  const statePath = taskStatePath(taskId, directory);
  if (!statePath) return undefined;
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    return enumValue(state?.completion_tier, COMPLETION_TIERS);
  } catch {
    return undefined;
  }
}

export function taskWorktreeFingerprint(taskId, directory = telemetryDirectory()) {
  const statePath = taskStatePath(taskId, directory);
  if (!statePath) return undefined;
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    return typeof state?.worktree_fingerprint === 'string' &&
      /^[a-f0-9]{64}$/.test(state.worktree_fingerprint)
      ? state.worktree_fingerprint
      : undefined;
  } catch {
    return undefined;
  }
}
