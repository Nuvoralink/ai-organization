# Live Data Evolution

Use expand-contract when application versions and workers may overlap. The database change is complete
only when the final authoritative reader and writer use the new shape and the superseded path is retired.

## Sequence

1. Inventory current writers, readers, jobs, constraints, indexes, exports, and retention behavior.
2. Expand with backward-compatible nullable/defaulted structure and new total constraints where safe.
3. Deploy code that understands both shapes while preserving exactly one decision authority.
4. Backfill in bounded, restartable, tenant-scoped batches with progress and reconciliation evidence.
5. Verify row counts, invariants, representative artifacts, query plans, and mixed-version behavior.
6. Cut all producers and consumers to the new authority; stop or drain incompatible workers first.
7. Contract old columns/functions/indexes only after a repo-wide bypass and runtime-usage scan is clean.
8. Re-run clean-base, legacy-upgrade, rollback, backup/restore, and application verification.

## Safety rules

- Never infer backfill completion only from a job status; query the resulting rows and exceptions.
- Never use an application default as a substitute for a durable database default during overlap.
- Do not dual-write two independent authorities. If a compatibility projection is required, derive it
  transactionally from the canonical write and give it an explicit retirement condition.
- Preserve append-only provenance when correcting derived state; supersede or invalidate rather than edit.
- Treat provider submission as a point of no blind retry: persist pre-submit intent, post-submit status,
  idempotency/correlation keys, and indeterminate reconciliation evidence.
- Rollback must state what happens to writes made by the newer version. Code rollback without data-shape
  compatibility is not a rollback plan.

## Proof matrix

| Proof | Required evidence | Killer mutation |
| --- | --- | --- |
| Clean install | Every migration applies from zero | Break a referenced enum/function order |
| Legacy upgrade | Representative old rows become valid new rows | Remove one alias/backfill branch |
| Mixed versions | Old reader/new writer and new reader/old writer remain honest | Contract early |
| Concurrent backfill | Replays converge with no duplicate winner | Remove uniqueness/CAS |
| Tenant isolation | Cross-tenant IDs cannot read/write or reveal existence | Drop tenant predicate/RLS |
| Cutover liveness | Final user/worker output consumes the new authority | Repoint one caller to old field |
| Retirement | Old symbol/path has no live references | Reintroduce a bypassing writer |

Counterexamples: a maintenance-window migration with every process stopped may use a direct contract
change when downtime is explicit and verified; an additive index can often use an online/concurrent build
without application compatibility code; a small immutable seed correction may use one atomic migration
when every dependent value is updated in the same transaction.
