#!/usr/bin/env node
/** Structured kickoff/completion validation shared by tool adapters and tests. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const vague = /^(tbd|todo|none|n\/a|do it|fix it|same|as above|later|unknown)$/i;
const substantive = (value, min = 3) => typeof value === 'string' && value.trim().length >= min && !vague.test(value.trim());
const strings = (value, allowEmpty = false) => Array.isArray(value) && (allowEmpty || value.length > 0) && value.every((v) => substantive(v));

export function validateTaskContract(task) {
  const errors = [];
  if (!task || typeof task !== 'object' || Array.isArray(task)) return ['task contract must be an object'];
  if (!substantive(task.task_id)) errors.push('task_id is missing or vague');
  if (!substantive(task.context, 40)) errors.push('context must quote settled decisions and state a concrete outcome');
  for (const key of ['read', 'edit', 'never_modify']) if (!strings(task.paths?.[key])) errors.push(`paths.${key} must contain exact paths`);
  if (!strings(task.procedure)) errors.push('procedure must contain numbered executable steps');
  if (!substantive(task.output_contract, 30)) errors.push('output_contract is not substantive');
  if (!substantive(task.boundaries, 30)) errors.push('boundaries must name prohibitions and escalation');
  if (!strings(task.acceptance)) errors.push('acceptance must contain self-verifiable criteria');
  if (!['low', 'medium', 'high', 'one_way'].includes(task.risk?.class)) errors.push('risk.class is invalid');
  if (!strings(task.risk?.proof_profiles)) errors.push('risk.proof_profiles is required');
  if (!strings(task.risk?.human_gates, true)) errors.push('risk.human_gates must be an array');
  if (!['implemented_unverified', 'locally_verified', 'independently_verified', 'merged', 'deployed_verified'].includes(task.completion_tier)) errors.push('completion_tier is invalid');
  return errors;
}

export function validateCompletionEvidence(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return ['completion evidence must be an object'];
  if (!substantive(evidence.task_id)) errors.push('task_id is missing');
  if (!substantive(evidence.outcome, 30)) errors.push('outcome is not substantive');
  if (!strings(evidence.changed_paths)) errors.push('changed_paths is required');
  if (!Array.isArray(evidence.proof) || evidence.proof.length === 0) errors.push('proof is required');
  else for (const [index, row] of evidence.proof.entries()) {
    if (!substantive(row?.command) || row?.exit !== 0 || !substantive(row?.proves, 15)) errors.push(`proof[${index}] requires command, exit 0, and a product/system claim`);
  }
  if (!strings(evidence.killer_mutations)) errors.push('killer_mutations is required');
  if (!substantive(evidence.independent_review, 5)) errors.push('independent_review status is required');
  if (!strings(evidence.not_reached, true)) errors.push('not_reached must be an array');
  if (!strings(evidence.decisions, true)) errors.push('decisions must be an array');
  if (typeof evidence.doctrine_loop !== 'string' || evidence.doctrine_loop.trim().length < 4) errors.push('doctrine_loop is required');
  return errors;
}

export function validateAgentReport(report) {
  const required = ['Evidence', 'Killer mutations', 'Surfaces not reached', 'Doctrine-loop findings'];
  return required.filter((heading) => !new RegExp(`(?:^|\\n)#{1,6}\\s*${heading}|(?:^|\\n)${heading}:`, 'i').test(report ?? '')).map((h) => `agent report missing ${h}`);
}

export function extractStructured(payload, key) {
  const candidates = [payload?.[key], payload?.tool_input?.[key], payload?.input?.[key], payload?.metadata?.[key]];
  for (const value of candidates) if (value && typeof value === 'object') return value;
  const text = [payload?.prompt, payload?.description, payload?.tool_input?.description, payload?.result, payload?.report].find((v) => typeof v === 'string');
  if (!text) return null;
  const marker = key === 'task_contract' ? 'TASK_CONTRACT_JSON:' : 'COMPLETION_EVIDENCE_JSON:';
  const index = text.indexOf(marker);
  if (index < 0) return null;
  try { return JSON.parse(text.slice(index + marker.length).trim()); } catch { return null; }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2];
  const file = process.argv[3];
  if (!['task', 'completion'].includes(mode) || !file) {
    console.error('usage: node scripts/task-governor.mjs <task|completion> <json-file>'); process.exit(2);
  }
  const value = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const errors = mode === 'task' ? validateTaskContract(value) : validateCompletionEvidence(value);
  if (errors.length) { console.error(errors.map((e) => `- ${e}`).join('\n')); process.exit(1); }
  console.log(`task-governor: PASS — ${mode}`);
}
