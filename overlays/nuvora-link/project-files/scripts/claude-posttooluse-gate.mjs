#!/usr/bin/env node
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const root = fs.realpathSync.native(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
let payload;
try {
  payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('payload must be a JSON object');
} catch (error) {
  console.error(`malformed hook payload: ${error.message}`);
  process.exit(2);
}
const configured = process.env.CLAUDE_PROJECT_DIR;
if (configured && fs.realpathSync.native(path.resolve(configured)).toLowerCase() !== root.toLowerCase()) {
  console.error('CLAUDE_PROJECT_DIR does not match the script-derived repository root');
  process.exit(2);
}
if (!['Edit', 'Write'].includes(payload.tool_name)) process.exit(0);
const filePath = payload.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath.length === 0) {
  console.error('Edit/Write hook payload requires tool_input.file_path');
  process.exit(2);
}
const normalized = path.resolve(filePath).replaceAll('\\', '/');
const gates = new Set();
if (/\/(?:AGENTS|CLAUDE)\.md$/u.test(normalized) || /\/\.claude\/rules\//u.test(normalized)) {
  gates.add('gate:rules-wiring');
  gates.add('gate:agent-context');
}
if (/(?:test|spec)\.[cm]?[jt]sx?$/u.test(normalized)) gates.add('gate:test-intent');
if (/\/(?:\.ai-organization|\.claude\/agents|scripts\/(?:check-|claude-|run-bounded)|package\.json)/u.test(normalized)) gates.add('gate:agent-control-plane');
for (const gate of gates) {
  const result = spawnSync('npm', ['run', gate], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(2);
}
