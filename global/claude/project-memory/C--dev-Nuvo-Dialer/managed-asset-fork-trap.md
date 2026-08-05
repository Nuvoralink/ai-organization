---
name: managed-asset-fork-trap
description: "Editing a control-plane MANAGED file inside a project forks the digest-pinned source and the next install reverts it — check ownership before editing, and fix at the overlay source."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7a2c7c4e-76ad-45a7-bc78-d3e6920d076a
  modified: 2026-08-05T09:30:05.458Z
---

Control-plane MANAGED files live inside each project looking like ordinary files. Editing one **in the project** forks the digest-pinned source: the parity gate fails and the next `project-overlay.mjs install` silently reverts the work. It bit twice in one session (2026-08-05): a merged commit added a step to a delivered `docs/agent-prompts/orchestration-playbook.md`, and I did the same to CoachAI's delivered `AGENTS.md`. Both were correct content in the wrong place.

**Why:** the overlay source (`${PROJECT:control-plane}`) is canonical; project copies are generated installs. `.ai-organization/ownership.json` (dialer) and `.ai-organization/overlay-lock.json` (CoachAI) list what is managed.

**FIXED AT THE ROOT 2026-08-05: the PreToolUse managed-edit guard.** Every fleet project now runs `scripts/claude-pretooluse-guard.mjs` (logic: delivered runtime `core/authority/managed-edit-guard.mjs`) as a PreToolUse Edit|Write hook: an edit aimed at a managed delivered copy is BLOCKED at edit time with a redirect to the overlay source. It walks up from the EDITED file (cross-repo edits guarded), always allows the control-plane source repo, allows append-only regions (`## Learned classes`), and the settings validators REQUIRE the hook. Deliberate fork: `CLAUDE_MANAGED_EDIT_ACK=1`. Hooks load at session start — a session predating the delivery does not have it active.

**How to apply:** before editing anything control-plane-adjacent — `AGENTS.md`, `CLAUDE.md`, `.claude/**`, `scripts/check-*.mjs`, `.ai-organization/**`, `docs/agent-prompts/**` — check whether it is managed, then edit `overlays/<project>/project-files/...` at the source and re-install. Update the digest in the same change. `install` refuses a locally-evolved target and prints the exact `--reconcile-target` command; only run it after diffing, because reconciling **discards** the local evolution. Two live examples of divergence that must NOT be reconciled away: CoachAI's `.cursor/rules` (2 files), and `~/.codex/skills/bootstrap-orchestrator`, whose installed copy is AHEAD of the source (extra scripts + refinements never captured up).

Related: [[universal-backflow-rule]], [[parity-gates-normalize-line-endings]].
