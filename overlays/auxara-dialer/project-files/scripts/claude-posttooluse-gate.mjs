// Claude Code PostToolUse hook — runs the doctrine gates automatically after file edits.
// Wired from .claude/settings.json. Receives the tool-call JSON on stdin; routes the edited
// file to the matching gate(s). Exit 2 feeds the gate failure back to the agent so it must
// fix the violation before moving on ("wire the gate, not the rule").
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGatesForFiles } from './lib/claudeGateRouter.mjs';

function pathKey(value) {
  const normalized = path.resolve(value);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function configuredProjectRoot() {
  const scriptRoot = realpathSync.native(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  );
  const configured = String(process.env.CLAUDE_PROJECT_DIR ?? '').trim();
  if (!configured) return scriptRoot;
  const configuredRoot = realpathSync.native(path.resolve(configured));
  if (pathKey(configuredRoot) !== pathKey(scriptRoot)) {
    throw new Error('CLAUDE_PROJECT_DIR does not match the repository root containing this hook');
  }
  return configuredRoot;
}

function blockInvalidPayload(message) {
  console.error(`[gate-hook] ${message}`);
  process.exit(2);
}

let projectRoot;
let payload;
try {
  projectRoot = configuredProjectRoot();
  payload = JSON.parse(readFileSync(0, 'utf8'));
} catch (error) {
  blockInvalidPayload(`malformed or unrooted PostToolUse payload: ${error.message}`);
}
if (!['Edit', 'Write'].includes(payload?.tool_name)) process.exit(0);
const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath.trim().length === 0) {
  blockInvalidPayload('invalid Edit/Write PostToolUse payload: tool_input.file_path is required');
}

const p = filePath.replace(/\\/g, '/');
const result = runGatesForFiles([filePath], { cwd: projectRoot });
for (const failure of result.failures) {
  console.error(
    `[gate-hook] \`npm run ${failure.gate}\` FAILED after editing ${p}.\n` +
      `Fix the violation now — do not proceed or work around the gate.\n${failure.output}`,
  );
}
process.exit(result.failures.length > 0 ? 2 : 0);
