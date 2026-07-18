---
name: persisted-derived-state-lifecycle
description: Use when designing, reviewing, or fixing persisted derived state, queues, jobs, dispatch rows, retry rows, outboxes, projections, caches, aggregates, provider evidence, lifecycle status, stale rows, reconciliation, or side-effect rows that can act after their source changes. Trigger when source mutations must cancel, preserve, update, supersede, or reconcile existing rows across states.
---

# Persisted Derived State Lifecycle

Use this skill when a row can outlive the source truth that created it.

## Core Rule

A fresh/current/scheduled row is not the full blast radius. Any persisted row that can retry, dispatch, aggregate, display, or make a claim later needs lifecycle handling when the source changes.

## Mandatory Matrices

Create a producer/reconciliation matrix:

- mutation,
- import,
- webhook,
- settings change,
- membership or permission change,
- archive/delete,
- retry/catch-up job,
- backfill/repair script,
- provider callback,
- test or dry-run path.

Create a persisted derived state lifecycle matrix for every applicable state:

- new or pending,
- scheduled or queued,
- processing or claimed,
- retryable failed,
- terminal failed,
- sent or completed,
- indeterminate or ambiguous provider result,
- canceled or skipped,
- test-only or dry-run.

## Per-Row Questions

For each state row, answer:

- Which source authority created it?
- Can it still cause a side effect or user-visible claim?
- What happens when the source input changes?
- What happens when eligibility is revoked?
- What happens when the parent is archived or deleted?
- What happens after provider failure if retry remains possible?
- What happens after terminal evidence exists?
- Is the row updated, canceled, skipped, superseded, preserved, or intentionally ignored?
- What historical evidence must never be overwritten?
- What final UI/API/report/notification should show?
- Which test proves it?

## Durable Invariants

- Stale or ineligible rows must not create future side effects.
- Retryable failed rows must become safe after source changes.
- Terminal evidence remains traceable through repair and reconciliation.
- When a mutable current-state projection and an append-only event/history table coexist, keep their
  provenance roles distinct. The projection may carry the latest source while the event log preserves
  each historical source; never enforce every historical event equals the projection's current source.
  Prove a real cross-source transition, not only same-source insert/update structure.
- A terminal-success row is not terminal with respect to eligibility of a referenced artifact, secret,
  membership, provider object, or other dependency. Define whether later dependency loss invalidates,
  repairs, supersedes, or preserves the success, and prove one atomic owner plus concurrent-loser
  convergence when repair may spend money or create side effects.
- Idempotent replay must not duplicate rows, charges, notifications, or claims.
- Idempotency must be proven for both sequential retry and concurrent duplicate triggers when either can happen. A durable guard such as a unique key, row lock, claim step, provider event ID, or equivalent persisted evidence must own the protection.
- Final surfaces must display current authority or an honest limited/unavailable state.

## Tests

Map tests to every relevant matrix row:

- source authority,
- producer/reconciliation path,
- state transition,
- unavailable/disabled provider state,
- provider evidence,
- idempotency,
- concurrent duplicate-trigger behavior when a row can be claimed, committed, replayed, or dispatched twice,
- stale row after source change,
- cross-source current-projection transition with immutable per-event provenance,
- retryable failed row,
- terminal evidence preservation,
- terminal-success dependency loss and the exact invalidation/repair/supersession outcome,
- final UI/API/output,
- docs or runbook update.

## Required Regression Mutations

- **Projection/history mutation:** make the projection's origin fields immutable or require every event's
  source to equal the projection's current source. A sequence such as source A add, revoke, then source B
  reactivate/reaffirm must fail the mutated implementation while preserving truthful A/A/B history.
- **Terminal-success mutation:** remove the `succeeded -> repairing|invalidated|superseded` edge after a
  referenced dependency becomes provably unavailable. The test must fail because the row would otherwise
  remain permanently successful-but-unusable or trigger duplicate concurrent repair work.

Fail-state: structural checks and happy-path success are green, but a later source or dependency change
cannot be represented truthfully, becomes unrecoverable, overwrites history, or permits duplicate spend.

Counterexamples: immutable creation identity may remain immutable when the current projection has a
separate latest-source field or history is fully event-derived; a terminal success with a deliberately
self-contained immutable payload and no revocable dependency does not need a repair edge.

Validation: execute the full persisted sequence against the real database/claim boundary, inspect the
current row and every history/attempt row, then run a barrier-concurrent duplicate trigger. Re-run the
same assertions with each regression mutation and require them to fail.

## Output

Return the matrices, invariants, implementation obligations, tests/proofs, and any states intentionally out of scope with a reason.
