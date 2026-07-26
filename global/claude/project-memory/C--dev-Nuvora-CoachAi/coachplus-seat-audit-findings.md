---
name: coachplus-seat-audit-findings
description: Coach+ per-seat 4-auditor pass (2026-06-14) found 2 Gate-4 blast-radius misses (new SeatEntitlement authority not wired into member-delete lifecycle + not reusing manager-scope authZ); fixed; pattern to sweep repo-wide.
metadata: 
  node_type: memory
  type: project
  originSessionId: 72cdc28d-460a-4655-9c29-9a1c20fde6db
---

The 4-auditor pass on the **Coach+ per-seat add-on** (commit `d5b70b67`) found two real bugs, both the **same class**: a new persisted authority (`SeatEntitlement`) was added without wiring it into the **existing** lifecycle + authZ paths — a Gate-4 blast-radius miss (fix the definition, miss the feeders/consumers in files you never opened).

**Findings (all fixed + regression-verified this session, 2026-06-14):**
- **H-1 (HIGH — security-auditor):** `backend/src/routes/coachPlusSeats.ts` grant/revoke authorized "any manager" (`assertCanUseManagerDashboard`) but never scoped the *target* userId to the manager's assigned reps — a scoped manager could mutate paid seats (real Stripe $) for another manager's reps. The codebase already enforces this scope for reads (`team.ts:704` → `MANAGER_SCOPE_EXCEEDED`); the write skipped it. Fix: `getScopedMemberIds` scope gate on GET/POST/DELETE + `adminActionRateLimiter` (M-1).
- **#1 (BLOCKING — source-to-screen-auditor) + F-1 (HIGH — adversarial re-audit):** THREE seat-holder-removal paths leave `SeatEntitlement` rows without calling the revoke+reconcile cleanup FIRST → Stripe over-bills a removed seat + no `auto_revoked_seat_removed` audit. The hook had **zero callers** despite `schema.prisma:1355` + the plan mandating it. Two are HARD deletes (`team.ts` DELETE /members/:memberId, `admin.ts` DELETE /users/:userId); the THIRD (`user.ts` DELETE /account self-service) is a **SOFT delete** (`user.update` anonymize — no cascade) that my first-pass `.delete(` grep MISSED, so the **re-audit** caught it (a self-deleted rep's seat bills the owner *forever* — strictly worse than the cascade paths). Fix: centralized into ONE helper `revokeAndReconcileMembershipSeats` (stripe.ts) called by all three paths before removal, + a wiring-guard test that bites if any path drops it.
- **M-1 (MED):** no rate limit on the Stripe-mutating seat endpoint. **L-2 (LOW):** `reconcileSeatEntitlementBilling` could throw despite its "never throws" doc — wrapped the Stripe retrieve/update in try/catch → fail-safe result.
- **CLEAN:** ai-decision-boundary (entitlement gate is honest, not a coaching-meaning judgment; openai.ts JSON-compaction is metering-intact + data-preserving) + adversarial-reviewer (ACCEPT — perf parallelization byte-identical, `formatTenure` consolidation truly replaced, no orphans).

**The pattern a follow-up orchestrator should sweep for** — a newly-added persisted authority / derived row usually misses two existing-path integrations:
1. **Lifecycle wiring:** is the new row revoked / reconciled / cleaned on EVERY parent removal path? Search BOTH hard deletes (`.delete(` / `.deleteMany`) AND **soft deletes** (`.update` that anonymizes / deactivates / sets a `deleted`/`CANCELLED`/`archived` status) — the syntactic `.delete(` grep missed the self-delete soft-delete (F-1), the re-audit's semantic "seat-holder removal" search caught it. Confirm the cleanup hook has *callers*, not zero; centralize it in ONE helper so a new path can't skip it (+ a wiring-guard test). A gate flagging any seat-holder-removal path lacking the cleanup call would enforce it.
2. **AuthZ reuse:** does the row's mutation route reuse the existing object-scope authority (`getScopedMemberIds` / object-scope helpers), or re-invent a weaker check that authorizes the action but not the target?

Candidate sweep targets: other recently-added authorities + their parent-delete paths + mutation-route scoping — uploadIntent, voiceSample, sandbox, annotation, dispatch/retry/projection rows, any per-seat/per-org derived row.

Operational note for the next orchestrator: the CoachAI domain auditors (`ai-decision-boundary-auditor`, `source-to-screen-auditor`) + global (`adversarial-reviewer`, `security-auditor`) live in `.claude/agents/` — but agents added mid-session don't register until a restart; if they're not in the Agent tool's type list, run them as `general-purpose` with the agent file's instructions embedded. See [[agent-fleet-setup]]. Full write-up to land in `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md`.
