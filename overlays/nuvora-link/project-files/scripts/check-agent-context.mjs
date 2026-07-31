#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'context-budget.json'), 'utf8'));
const seen = new Set();
let bytes = 0;
function visit(relative) {
  const normalized = relative.replaceAll('\\', '/');
  if (seen.has(normalized)) throw new Error(`Duplicate startup import: ${normalized}`);
  seen.add(normalized);
  const text = fs.readFileSync(path.join(root, normalized), 'utf8');
  bytes += Buffer.byteLength(text);
  for (const match of text.matchAll(/^@([^\s]+)$/gmu)) visit(match[1]);
}
try {
  visit(config.entrypoint);
  const rulesRoot = path.join(root, '.claude', 'rules');
  for (const name of fs.readdirSync(rulesRoot).filter((entry) => entry.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(rulesRoot, name), 'utf8');
    if (!/^---\r?\n[\s\S]*?^paths:\s*$/mu.test(text)) throw new Error(`unscoped startup rule: .claude/rules/${name}`);
  }
  const tokens = Math.ceil(bytes / 4);
  if (tokens > config.maximum_tokens) throw new Error(`startup context ${tokens} exceeds maximum ${config.maximum_tokens}`);
  console.log(`agent-context: PASS — files=${seen.size} bytes=${bytes} estimated_tokens=${tokens}/${config.maximum_tokens}`);
} catch (error) {
  console.error(`agent-context: FAIL — ${error.message}`);
  process.exit(1);
}
