---
paths:
  - "**/*"
---

# Loop Discipline — Dialer Adapter

**The universal `loop-discipline` rule governs in full** — always-on at user level for Claude (`~/.claude/rules/loop-discipline.md`, installed by the AI-Organization control plane); Codex carries its compact twin in `~/.codex/AGENTS.md`. This adapter does not restate the universal loop contract (measurable exit + hard cap + monotonic progress + budget bound), the anti-infinite-loop guardrails (no oscillation, dedup-vs-everything-seen, no moving targets, verify-the-critic, escalate-don't-spin), the terminal-state rule, or the cadence/report shapes. It binds them to the dialer's action boundary and records the anchors this project learned them from.

## The dialer's action boundary (what makes autonomous iteration safe HERE)

`.ai-organization/policies/action-authority.v1.json` is authoritative. Branch creation, commit, and pull-request creation/update are allowed inside the authorized task. **Push** requires live proof that it cannot trigger a preview/production deploy, publish or billed build, production write, or external contact — a preview counts as a deploy, and uncertainty stops for a human. **Merge** is allowed only when every conditional-merge criterion is independently proven; otherwise it stops for a human. Production-affecting push/merge, production mutation/deploy/config/migration, destructive, billed, external-message/contact, secrets, and product/design/material-architecture actions always stop for a human. No critic's unverified "clean" can satisfy an independent-verification condition, and the state-changing action lives in its own tool call after its sensor result has been read — never `check; act`.

## Project anchors (why verify-the-critic is non-negotiable in this repo)

- **Confidently-wrong critic** — PR #39 buy-cart footer (2026-06-13): a review mis-resolved a PR number, diffed only against `main`, and cleared a real blocker on a false premise.
- **Incomplete critic** — the same review found 2 inline-copy literals and called it done, blind to the other 5 of 7. Recount findings against the real diff; never accept the summary.
- **Piped-status masking** — `npm run verify | tail` printed "exit 0" while `format:check` had failed (2026-06-13); the same masking hid a real exit behind a background-task notification's "exit 0". Read the command's own `$?` before any pipe, or emit the sentinel (`cmd; rc=$?; echo "EXIT: $rc"; exit $rc`).

*Fail-state:* an agent ran a "keep going until it's good" loop with no measurable exit and no cap — or merged without satisfying every conditional criterion of the dialer's action authority, or crossed a human-gated action on a critic's unverified "clean."
