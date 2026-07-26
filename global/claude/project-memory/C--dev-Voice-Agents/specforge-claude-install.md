---
name: specforge-claude-install
description: "Specforge skills live at ${DEPENDENCY:specforge}; its installer only targets Codex (.agents/skills), Claude copy installed manually to ~/.claude/skills on 2026-07-21"
metadata: 
  node_type: memory
  type: reference
  originSessionId: f127d02b-bfbc-4978-b124-712024201255
  modified: 2026-07-21T04:44:56.083Z
---

The Specforge skill suite (28 skills + `_specforge-shared`) lives at `${DEPENDENCY:specforge}/skills/`. Its `scripts/install_manual.py` installs only into `<target>/.agents/skills/` — the **Codex** convention — which is why it never appeared in Claude Code. Fixed 2026-07-21 by copying all skill folders into `${HOME}/.claude/skills/` (Claude-compatible SKILL.md format as-is).

Upgrade path: re-copy from `${DEPENDENCY:specforge}/skills/` after pulling changes; the Claude copy does not auto-sync. Validation scripts live at `~/.claude/skills/_specforge-shared/scripts/` (`validate_app_docs.py`, `check_repo_doc_quality.py`, `validate_implementation_artifacts.py`) — run with `py` (bare `python` is not on PATH on this machine). Related: [[live-council-hackathon]].
