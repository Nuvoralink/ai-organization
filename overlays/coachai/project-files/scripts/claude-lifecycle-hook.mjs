#!/usr/bin/env node
/** Claude adapter for the vendor-neutral task lifecycle. Persists hashes/counts/outcomes only. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { extractStructured, validateAgentReport, validateCompletion, validateTaskContract } from './task-governor.mjs';

const root = process.cwd();
let payload = {};
try { payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { payload = {}; }
const event = payload.hook_event_name ?? payload.event ?? process.env.CLAUDE_HOOK_EVENT ?? 'Unknown';
const raw = JSON.stringify(payload);
const errors = [];

function roleNames() {
  try {
    const roles = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'roles.json'), 'utf8'));
    return new Set([...(roles.global_roles ?? []), ...(roles.project_roles ?? [])].map((r) => r.name));
  } catch { return new Set(); }
}

if (event === 'TaskCreated') {
  const task = extractStructured(payload, 'task_contract');
  errors.push(...validateTaskContract(task));
}
if (event === 'SubagentStart') {
  const role = payload.agent_type ?? payload.subagent_type ?? payload.tool_input?.subagent_type;
  if (!role || !roleNames().has(role)) errors.push(`unknown or missing registered role: ${role ?? '<missing>'}`);
  const task = extractStructured(payload, 'task_contract');
  errors.push(...validateTaskContract(task));
}
if (event === 'TaskCompleted') {
  const task = extractStructured(payload, 'task_contract');
  const evidence = extractStructured(payload, 'completion_evidence');
  errors.push(...validateCompletion(task, evidence));
  if (errors.length === 0) {
    const command = process.env.AGENT_PROOF_COMMAND || 'npm run proof:changed';
    const proof = spawnSync(command, { cwd: root, shell: true, stdio: 'inherit', env: process.env });
    if (proof.status !== 0) errors.push(`risk-selected proof failed with exit ${proof.status}`);
  }
}
if (event === 'SubagentStop') {
  const report = payload.report ?? payload.result ?? payload.agent_output ?? '';
  errors.push(...validateAgentReport(report));
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
  console.error([`lifecycle ${event}: BLOCKED`, ...errors.map((e) => `- ${e}`)].join('\n'));
  process.exit(2);
}
console.log(`lifecycle ${event}: ACCEPTED`);
