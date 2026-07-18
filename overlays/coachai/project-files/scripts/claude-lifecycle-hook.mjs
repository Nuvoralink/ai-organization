#!/usr/bin/env node
/** Claude adapter for the vendor-neutral, stateful task lifecycle. Persists hashes/counts/outcomes only. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { acceptLifecycleTask, completeLifecycleTask, recordLifecycleCompletionReport, recordLifecycleReview } from '../.ai-organization/runtime/core/lifecycle/lifecycle-controller.mjs';
import { extractStructured, validateAgentReport, validateTaskContract } from './task-governor.mjs';

const root = process.cwd();
let payload = {};
try { payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { payload = {}; }
const event = payload.hook_event_name ?? payload.event ?? process.env.CLAUDE_HOOK_EVENT ?? 'Unknown';
const raw = JSON.stringify(payload);
const errors = [];

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

function roleNames() {
  try {
    const roles = readJson(path.join('.ai-organization', 'roles.json'));
    return new Set([...(roles.global_roles ?? []), ...(roles.project_roles ?? [])].map((role) => role.name));
  } catch { return new Set(); }
}

function identities() {
  return {
    taskId: payload.task_id ?? payload.task?.id,
    sessionId: payload.session_id,
    implementerId: payload.agent_id ?? payload.agent_type ?? payload.subagent_type ?? payload.session_id
  };
}

function profileRegistry() {
  return readJson(path.join('.ai-organization', 'proof-profiles.json'));
}

if (event === 'TaskCreated') {
  const task = extractStructured(payload, 'task_contract');
  errors.push(...validateTaskContract(task));
  if (errors.length === 0) {
    const identity = identities();
    const result = acceptLifecycleTask({
      ...identity,
      contract: task,
      completionMode: task.completion?.tier === 'analysis' ? 'read-only' : 'implementation',
      cwd: root,
      profileRegistry: profileRegistry()
    });
    errors.push(...result.failures);
  }
}
if (event === 'SubagentStart') {
  const role = payload.agent_type ?? payload.subagent_type ?? payload.tool_input?.subagent_type;
  if (!role || !roleNames().has(role)) errors.push(`unknown or missing registered role: ${role ?? '<missing>'}`);
  const task = extractStructured(payload, 'task_contract');
  errors.push(...validateTaskContract(task));
}
if (event === 'TaskCompleted') {
  const identity = identities();
  const callerEvidence = extractStructured(payload, 'completion_evidence');
  if (callerEvidence) errors.push('Caller-supplied completion evidence is not accepted; the shared proof runner generates evidence from the accepted TaskCreated attempt');
  if (extractStructured(payload, 'completion_report')) errors.push('TaskCompleted cannot supply a completion report; the official event has no report field and the receipt must come from SubagentStop');
  if (errors.length === 0) {
    const result = completeLifecycleTask({
      taskId: identity.taskId,
      sessionId: identity.sessionId,
      cwd: root,
      profileRegistry: profileRegistry()
    });
    errors.push(...result.failures);
  }
}
if (event === 'SubagentStop') {
  const report = payload.report ?? payload.result ?? payload.agent_output ?? payload.last_assistant_message ?? '';
  errors.push(...validateAgentReport(report));
  const completionReport = extractStructured({ report }, 'completion_report');
  const reviewMarker = 'REVIEW_REPORT_JSON:';
  const reviewLine = String(report).split(/\r?\n/u).find((line) => line.startsWith(reviewMarker));
  let reviewReport = null;
  try { reviewReport = reviewLine ? JSON.parse(reviewLine.slice(reviewMarker.length).trim()) : null; } catch { errors.push('Malformed REVIEW_REPORT_JSON marker'); }
  try {
    if (completionReport) recordLifecycleCompletionReport({
      taskId: completionReport.task_id,
      reporterId: payload.agent_id,
      reporterSessionId: payload.session_id,
      reporterRole: payload.agent_type,
      report: completionReport,
      cwd: root
    });
    if (reviewReport) recordLifecycleReview({
      taskId: reviewReport.task_id,
      reviewerId: payload.agent_id,
      reviewerSessionId: payload.session_id,
      role: payload.agent_type,
      verdict: reviewReport.verdict,
      findingCount: reviewReport.finding_count,
      unresolvedFindingCount: reviewReport.unresolved_finding_count,
      cwd: root
    });
  } catch (error) { errors.push(error.message); }
}

const telemetryDir = path.join(root, 'tmp', 'agent-telemetry');
try {
  fs.mkdirSync(telemetryDir, { recursive: true });
  const record = {
    event,
    at: new Date().toISOString(),
    payload_sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    payload_bytes: Buffer.byteLength(raw),
    outcome: errors.length ? 'blocked' : 'accepted',
    finding_count: errors.length
  };
  fs.appendFileSync(path.join(telemetryDir, 'lifecycle.jsonl'), `${JSON.stringify(record)}\n`);
} catch { /* telemetry cannot override the policy verdict */ }

if (errors.length) {
  console.error([`lifecycle ${event}: BLOCKED`, ...errors.map((error) => `- ${error}`)].join('\n'));
  process.exit(2);
}
console.log(`lifecycle ${event}: ACCEPTED`);
