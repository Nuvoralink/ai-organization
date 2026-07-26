# Auxara Sprint 1.3 recovery hardening closure

As of 2026-07-08 on branch `codex/s13-recovery-hardening`, the non-mock-gated Sprint 1.3 backend recovery slice landed locally: DLR-016 startup/periodic recovery enumerates running dial runs, re-enqueues notify-only wakes, cancels stale pre-provider `team_power` dispatch claims without provider evidence, marks provider-ambiguous claims `indeterminate`, and recovers indeterminate calls only from existing terminal projection evidence or conclusive Telnyx call-status lookup using call-control IDs. The recovery worker must not reserve, dial, or create replacement dispatches.

Shared `appendCallEvent` is now the single call-event append/dedupe/collision-repair helper used by Telnyx webhooks and provider-status recovery. Telnyx `command_id` remains idempotency/duplicate-detection evidence only, not status lookup authority.

The recovery service intentionally narrows stale dispatch repair to `OutboundDispatchKind.team_power` rows with a non-null `runId`; manual prospect/raw dispatches are outside DLR-016 recovery.

Test lessons: the full backend suite runs Redis-backed test files in parallel, and the global rate-limit reset deletes Redis keys process-externally. Do not assert cross-request Redis counter values in a parallel full-suite test; instead observe the middleware's generated key within the test process or use a non-racy seam. Wake-queue tests should filter by deterministic job ID rather than `getDelayedCount()` across the shared Redis queue.

Verification completed: `npm run verify` passed with local Docker Postgres/Redis. The remaining `gate:tx-rollback` output is warn-only and pre-existing outside this slice after the recovery callback was annotated/cleaned.
