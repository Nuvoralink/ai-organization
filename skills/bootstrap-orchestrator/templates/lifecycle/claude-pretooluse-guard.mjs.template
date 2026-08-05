// Claude Code PreToolUse hook — the managed-edit guard, killing the fork trap at EDIT time.
// Wired from .claude/settings.json (matcher Edit|Write). Receives the tool-call JSON on stdin.
// Exit 2 blocks the tool call and feeds the redirect back to the agent; exit 0 allows.
//
// THIN ENTRY: all logic is the MANAGED shared asset
// `.ai-organization/runtime/core/authority/managed-edit-guard.mjs` (canonical source:
// `core/authority/` in the AI-Organization repo). Never edit the delivered copy — that is the exact
// defect this hook exists to prevent; fix it at the control-plane source and re-install.
//
// The guard resolves the ownership manifest by walking up from the EDITED FILE, so it also protects
// OTHER overlay projects edited from this session (two of the three founding fork traps were exactly
// that cross-repo shape). It allows edits inside the control-plane SOURCE repo, edits confined to
// append-only regions (the learned-classes live log), and everything not classified as managed.
// The parity gate remains the fail-closed authority; this hook is the shift-left warning.
import { readFileSync } from 'node:fs';

let evaluateToolCall;
try {
  ({ evaluateToolCall } = await import(
    new URL('../.ai-organization/runtime/core/authority/managed-edit-guard.mjs', import.meta.url)
  ));
} catch (error) {
  // Fail open, loudly: a missing/broken runtime is a DELIVERY gap, not a verdict. Exit 1 is a
  // non-blocking hook error (visible), never a block on every edit.
  console.error(
    `[managed-edit-guard] shared runtime could not load (${error.message}) — no verdict; re-install the overlay runtime.`,
  );
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // no payload → nothing to judge
}

const verdict = evaluateToolCall({
  toolName: payload?.tool_name,
  toolInput: payload?.tool_input,
});

if (verdict.verdict === 'deny') {
  console.error(
    `[managed-edit-guard] BLOCKED ${payload?.tool_name} of ${payload?.tool_input?.file_path}: ${verdict.reason}.\n${verdict.redirect}`,
  );
  process.exit(2);
}
process.exit(0);
