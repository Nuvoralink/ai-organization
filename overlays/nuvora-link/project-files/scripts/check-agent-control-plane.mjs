#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateActionPolicySemantics } from '../.ai-organization/runtime/core/authority/assess-action.mjs';
import { validateJsonAgainstSchema } from '../.ai-organization/runtime/core/schema/validate-json-schema.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredEvents = ['SessionStart', 'SubagentStart', 'TaskCreated', 'TaskCompleted', 'SubagentStop', 'PostCompact', 'SessionEnd', 'PostToolUse'];
const requiredFiles = [
  '.ai-organization/policies/action-authority.v1.json',
  '.ai-organization/schemas/action-authority.v1.schema.json',
  '.ai-organization/proof-profiles.json', '.ai-organization/roles.json', '.ai-organization/ownership.json',
  '.ai-organization/overlay-lock.json', 'scripts/claude-lifecycle-hook.mjs', 'scripts/claude-posttooluse-gate.mjs',
  'scripts/run-bounded-agent.mjs', 'scripts/lib/boundedProcess.mjs', 'scripts/lib/dispatchBoundary.mjs',
  'scripts/check-fleet-parity.mjs',
];
const problems = requiredFiles.filter((relative) => !fs.existsSync(path.join(root, relative))).map((relative) => `missing required control file: ${relative}`);
if (problems.length === 0) {
  const action = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'policies', 'action-authority.v1.json'), 'utf8'));
  problems.push(...validateJsonAgainstSchema(path.join(root, '.ai-organization', 'schemas', 'action-authority.v1.schema.json'), action).map((problem) => `action authority schema: ${problem}`));
  problems.push(...validateActionPolicySemantics(action).map((problem) => `action authority semantics: ${problem}`));
}
const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'settings.json'), 'utf8'));
for (const event of requiredEvents) {
  const hooks = settings.hooks?.[event]?.flatMap((entry) => entry.hooks ?? []) ?? [];
  const script = event === 'PostToolUse' ? 'claude-posttooluse-gate.mjs' : 'claude-lifecycle-hook.mjs';
  if (hooks.length !== 1 || hooks[0].command !== 'node' || hooks[0].args?.[0] !== `\${CLAUDE_PROJECT_DIR}/scripts/${script}`) problems.push(`unrooted or malformed hook: ${event}`);
}
const proof = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'proof-profiles.json'), 'utf8'));
if (proof.integration_branch !== 'develop') problems.push('proof registry integration branch must be develop');
const ownership = JSON.parse(fs.readFileSync(path.join(root, '.ai-organization', 'ownership.json'), 'utf8'));
if (!ownership.managed_json_sections?.['package.json']?.includes('scripts.agent:run')) problems.push('package ownership must manage scripts.agent:run');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const name of ['agent:run', 'gate:rules-wiring', 'gate:agent-context', 'gate:agent-control-plane', 'gate:fleet-parity', 'gate:overlay-parity', 'gate:test-intent', 'gates:all']) {
  if (!pkg.scripts?.[name]) problems.push(`package script missing: ${name}`);
}
if (process.argv.includes('--self-test')) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'claude-posttooluse-gate.mjs')], { cwd: root, input: '{not-json', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  if (result.status !== 2) {
    console.error('malformed PostToolUse payload was accepted');
    process.exit(1);
  }
  console.log(`MUTATION_RECEIPT_JSON:${JSON.stringify({ case_id: 'malformed-posttooluse-rejected', baseline_exit: 2, mutation_blocked: true })}`);
  process.exit(0);
}
if (problems.length) {
  console.error(['agent-control-plane: FAIL', ...problems.map((problem) => `- ${problem}`)].join('\n'));
  process.exit(1);
}
console.log('agent-control-plane: PASS');
