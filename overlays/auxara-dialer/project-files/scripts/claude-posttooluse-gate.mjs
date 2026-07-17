// Claude Code PostToolUse hook — runs the doctrine gates automatically after file edits.
// Wired from .claude/settings.json. Receives the tool-call JSON on stdin; routes the edited
// file to the matching gate(s). Exit 2 feeds the gate failure back to the agent so it must
// fix the violation before moving on ("wire the gate, not the rule").
import { readFileSync } from 'node:fs';
import { runGatesForFiles } from './lib/claudeGateRouter.mjs';

let filePath = '';
try {
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  filePath = payload?.tool_input?.file_path ?? '';
} catch {
  process.exit(0); // unparseable payload — never block on hook plumbing
}
if (!filePath) process.exit(0);

const p = filePath.replace(/\\/g, '/');
const result = runGatesForFiles([filePath]);
for (const failure of result.failures) {
  console.error(
    `[gate-hook] \`npm run ${failure.gate}\` FAILED after editing ${p}.\n` +
      `Fix the violation now — do not proceed or work around the gate.\n${failure.output}`,
  );
}
process.exit(result.failures.length > 0 ? 2 : 0);
