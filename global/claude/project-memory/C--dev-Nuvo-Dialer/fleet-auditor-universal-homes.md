---
name: fleet-auditor-universal-homes
description: Where the fleet auditor/verifier agents actually live across the universal layer — release-verifier et al. are NOT global ~/.claude/agents files
metadata: 
  node_type: memory
  type: reference
  originSessionId: c4f231cd-f273-4843-8e3c-325530f970be
  modified: 2026-07-21T11:23:56.081Z
---

Universal-backflow edits to a fleet AUDITOR/VERIFIER agent (release-verifier, ui-verifier, doctrine-drift, performance-auditor, functionality-parity, user-journey, premise-and-architecture-challenger, sprint-kickoff, test-runner, domain-auditor) do **not** touch `~/.claude/agents/` — that global dir holds only **three** agents: `adversarial-reviewer`, `implementer`, `security-auditor`. The auditor/verifier fleet's universal homes are:

1. **Per-project** `.claude/agents/<name>.md` (dialer worktree + CoachAI `${PROJECT:coachai}/.claude/agents/`).
2. **The bootstrap-orchestrator TEMPLATE** `${HOME}/.codex/skills/bootstrap-orchestrator/templates/agents/<name>.template.md` (this is the "universal layer" for these agents; note that `~/.codex/skills/` is **not a git repo** — template edits are durable plain-file writes, no commit).

So a note/brief that says "update the global `~/.claude/agents/release-verifier.md`" is citing a file that does not exist — the correct targets are the template + the CoachAI sibling. Verified 2026-07-21 (BullMQ deregistration control-gap; the release-verifier's "Learned classes (live log)" trailer is the append target in each). See [[universal-backflow-rule]].

Coordination gotcha: the CoachAI repo (`${PROJECT:coachai}`) is frequently mid-flight on a feature branch with several agent files already dirty (a doctrine batch in progress) — apply the sibling edit but don't sweep it into an unrelated branch's commit; leave it for that batch's owner or path-limit it.
