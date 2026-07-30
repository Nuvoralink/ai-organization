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

const rootedInvocation = String(process.env.CLAUDE_PROJECT_DIR ?? '').trim().length > 0;
let projectRoot;
let payload;
try {
  projectRoot = configuredProjectRoot();
  payload = JSON.parse(readFileSync(0, 'utf8'));
} catch (error) {
  if (!rootedInvocation) process.exit(0);
  blockInvalidPayload(`malformed or unrooted PostToolUse payload: ${error.message}`);
}
if (payload?.tool_name !== undefined && !['Edit', 'Write'].includes(payload.tool_name)) {
  process.exit(0);
}
const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath.trim().length === 0) {
  if (payload?.tool_name === undefined && !rootedInvocation) process.exit(0);
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

// A gate that could not RUN is reported as exactly that, never as a violation. Saying
// "FAILED — fix the violation now" when the cause was ETIMEDOUT sends the agent hunting a defect
// that does not exist; it happened twice on 2026-07-29, to two different agents, both on
// `check:layout`, and both confirmed the gate exited 0 when run directly.
//
// It deliberately does NOT block. This hook is an early warning; the authoritative run is
// `npm run verify` before merge, where the same gate runs without the CPU contention that caused
// the timeout. Blocking here would halt every edit precisely when parallel agents load the machine
// — which is exactly when timeouts occur — while adding no safety the real gate does not already
// provide. It is printed loudly rather than swallowed, because an unrun check must never read as a
// pass.
for (const skipped of result.unrunnable) {
  console.error(
    `[gate-hook] \`npm run ${skipped.gate}\` COULD NOT RUN after editing ${p} (${skipped.reason}).\n` +
      `This is NOT a violation — the gate produced no verdict, so there is nothing to fix from it.\n` +
      `Common cause: a timeout under CPU contention from parallel agents.\n` +
      `To get its verdict now, run \`npm run ${skipped.gate}\` directly and read its own exit code.\n` +
      `${skipped.output}`,
  );
}

process.exit(result.failures.length > 0 ? 2 : 0);
