---
name: codex-dispatch-windows-form
description: "Dispatching Codex through the bounded dispatcher on Windows: spawn `node <npm-global>/node_modules/@openai/codex/bin/codex.js exec ...` — bare `codex` hits ENOENT and `codex.cmd` hits EINVAL (Node CVE-2024-27980 hardening refuses .cmd without shell)."
metadata: 
  node_type: memory
  type: reference
  originSessionId: df04f33d-909b-4f44-877d-61cb96ab4ccc
  modified: 2026-07-22T08:43:20.961Z
---

The canonical bounded Codex dispatch on this machine is:

`npm run agent:run -- --timeout-ms <n> --label <text> -- node "${HOME}/AppData/Roaming/npm/node_modules/@openai/codex/bin/codex.js" exec --cd "<worktree>" --sandbox danger-full-access -o "<outfile>" "<prompt>"`

**Why:** `run-bounded-agent.mjs` spawns without a shell (correct — tree-termination authority). On Windows, bare `codex` → `spawn codex ENOENT` (the PATH entry is an npm `.cmd` shim), and pointing at `codex.cmd` → `spawn EINVAL` (Node ≥18.20/20.12 refuses `.cmd`/`.bat` without `shell:true` per CVE-2024-27980). The fix is bypassing the shim: the package bin is plain JS (`bin/codex.js`), so spawn `node <codex.js>` directly. Verified working 2026-07-22 (both the invite + doc-graph slices launched and ran).

**Also:** each new worktree path needs its own `[projects.'${WORKSPACE:dev|backslash+lowercase-drive}\<worktree-name>']` `trust_level = "trusted"` entry in `${HOME}/.codex/config.toml` (lowercase path form) BEFORE dispatch, and headless Codex logs benign `AuthRequired` errors for OAuth MCPs (Neon/Railway/Sentry) — ignore them unless the slice needs those MCPs. Relates to [[codex-claude-division-of-labor]].
