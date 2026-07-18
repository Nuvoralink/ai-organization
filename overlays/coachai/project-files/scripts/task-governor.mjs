#!/usr/bin/env node
/** CoachAI adapter: extraction/report helpers plus the generated universal task governor authority. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  validateCompletion,
  validateTaskContract,
  validateTaskEvidence
} from '../.ai-organization/runtime/core/lifecycle/task-governor.mjs';

export { validateCompletion, validateTaskContract, validateTaskEvidence };

export function validateAgentReport(report) {
  const required = ['Evidence', 'Killer mutations', 'Surfaces not reached', 'Doctrine-loop findings'];
  return required.filter((heading) => !new RegExp(`(?:^|\\n)#{1,6}\\s*${heading}|(?:^|\\n)${heading}:`, 'i').test(report ?? '')).map((heading) => `agent report missing ${heading}`);
}

export function extractStructured(payload, key) {
  const candidates = [payload?.[key], payload?.tool_input?.[key], payload?.input?.[key], payload?.metadata?.[key]];
  for (const value of candidates) if (value && typeof value === 'object') return value;
  const text = [payload?.prompt, payload?.description, payload?.task_description, payload?.tool_input?.description, payload?.result, payload?.report].find((value) => typeof value === 'string');
  if (!text) return null;
  const marker = key === 'task_contract'
    ? 'TASK_CONTRACT_JSON:'
    : key === 'completion_report'
      ? 'COMPLETION_REPORT_JSON:'
      : 'COMPLETION_EVIDENCE_JSON:';
  const index = text.indexOf(marker);
  if (index < 0) return null;
  try { return JSON.parse(text.slice(index + marker.length).trim()); } catch { return null; }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2];
  const file = process.argv[3];
  if (!['task', 'evidence'].includes(mode) || !file) {
    console.error('usage: node scripts/task-governor.mjs <task|evidence> <json-file>');
    process.exit(2);
  }
  const value = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const errors = mode === 'task' ? validateTaskContract(value) : validateTaskEvidence(value);
  if (errors.length) { console.error(errors.map((error) => `- ${error}`).join('\n')); process.exit(1); }
  console.log(`task-governor adapter: PASS — ${mode}`);
}
