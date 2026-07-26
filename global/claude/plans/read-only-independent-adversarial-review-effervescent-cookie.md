# Adversarial review — 7d87935a + 2084bf01 (execution-system controls)

**Mode:** READ-ONLY. No edits, no staging, no commits, no pushes, no destructive commands.
**Scope:** control-plane closure claims only. Product/backend slices (B00-B09, M01-M10) out of scope.

## Context

Commits `7d87935a` (gate registry, restart stall detection, worktree reclaim/disk, filemap hook,
Redis test-namespace guard, dispatch boundaries) and `2084bf01` (bounded process-tree termination,
CP-10) claim closure of the execution-control classes catalogued in
`docs/agent-prompts/sprint-1-4/sprint-1-4-implementation-rca.md`. This review tries to **refute**
each closure claim from the actual code, not from the commit message or the RCA table.

## Findings (orchestrator's own pass — agent findings folded in below)

_(populated during the review; see the chat report for the ranked list)_

## Verified-true (survived refutation)

- `agent:run` and `gate:bounded-agent` exist in `package.json:27,43`; `gates:all` is inside
  `verify` (`package.json:95`); `gate:bounded-agent` sits immediately after `gate:test-db-lease`
  in `scripts/run-gates-all.mjs` and the ordering is asserted **relationally** in
  `scripts/run-gates-all.test.mjs`.
- All five new scripts are Git-tracked (`git ls-files --error-unmatch` clean).
- The canonical dispatcher `dispatch-claude-cli.mjs` really exists on this machine
  (`${HOME}/.codex/skills/bootstrap-orchestrator/scripts/`, 134 KB, dated 2026-07-20) — the
  rule does not route to a dead path.
- `.claude/rules/loop-discipline.md` is `@`-imported by `CLAUDE.md` and routed from `AGENTS.md`, so
  the bounded-dispatch prohibition is genuinely loaded each session.
- `scripts/bounded-process.test.mjs` uses a **detached** grandchild + a bystander tree + heartbeat-
  flatness, and its header openly documents that an earlier attached-grandchild fixture was theater.
  This test bites.
