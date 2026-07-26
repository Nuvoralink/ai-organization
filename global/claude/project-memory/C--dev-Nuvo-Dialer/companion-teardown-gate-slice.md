---
name: companion-teardown-gate-slice
description: "Journey-L13 teardown-gate work — FULLY CLOSED 2026-07-03: PR #171 (migration) + PR #176 (the doctrine gate bundle) both merged + deploy-verified; nothing owed"
metadata:
  node_type: memory
  type: project
  originSessionId: 8d9f1a7e-01ce-44ba-a75e-5569bdeb1d2e
---

Journey-**L13** ("a call-drop handler must route through the ONE shared teardown gate — else it orphans the prospect's SERVER leg, ARC-006/TCPA") is **FULLY CLOSED** — both the migration (PR #171, merged `556a637`, 2026-07-03) and the owed STOP-and-codify doctrine bundle (**PR #176, merged `baa10bd`, 2026-07-03, Amin-approved merge, DEPLOY-VERIFIED**: Railway api SUCCESS 2s post-merge + `/api/ready` all-green + Vercel production READY carrying the literal merge SHA + 0 new Sentry issues frontend AND backend).

**What now exists (all in-repo — the repo is the authority; this memory is just the closure record):**
- `CallProvider` owns TWO teardown primitives: `teardownActiveCall()` (drop both legs + CLEAR `activeCallId` — droppers leaving to IDLE) and `cancelActiveLegs()` (drop both legs, KEEP the id — WRAP_UP droppers that still disposition). The context deliberately exposes NO flat `hangup` — the ban is structural.
- `check:call-drop-gate` (WARN-only in `gates:all`; **STRICT via `CALL_DROP_GATE_STRICT=1` in the PostToolUse hook** — the hook's success path swallows WARN output, so strict exit-1 is what makes edit-time visibility real). Meta-test incl. the LOCALITY fixture (a marker in another fn must not sanction a naked hangup).
- Doctrine: blocking frontend rule ("Call teardown routes through the ONE shared gate"), Learned-classes rows on adversarial-reviewer (L13 class + deleted-symbol-in-allowlist + scaffold-probe technique) + compliance-auditor + release-verifier (3 rows + orchestrator-can-sweep-Sentry op-note), testing-guardrails §8 (scanner-gate scope-property fixture), journey L13 closure addendum, centralization §5 row.
- Universal backflow landed same-turn: global `~/.claude` adversarial-reviewer, bootstrap templates (reviewer + release-verifier + the PostToolUse hook template's swallowed-WARN/strict-env seam), CoachAI echo merged (Nuvora-CoachAi#124, `216e551a`).
- Backlogged with rows (not owed to memory): ESLINT-EXHAUSTIVE-DEPS-001, RELEASE-VERIFIER-SENTRY-FALLBACK-001.

**Reusable op-facts proven this closure:** the auto-mode classifier blocks the orchestrator merging its OWN PR to main (human-gated merge — hand it to Amin with evidence + arm a `gh pr view --json state` Monitor to auto-resume post-merge); `release-verifier` was NOT registered as a dispatchable agent type in the session (registry listed only 7 of the 9 `.claude/agents/` files) → run its procedure from the main loop, where the Railway MCP + Sentry MCP (org `nuvora-link`, projects `auxara-dialer-{frontend,backend}`, region us.sentry.io) + Vercel MCP (project `prj_4O7TqLS1XcumQK7OAsY03JqacktS`, team `team_XP930f4yA8rGYMvwy6CUXCVv`) are all reachable.

See [[sprint-1-3-active]], [[commit-before-adversarial-review]].
