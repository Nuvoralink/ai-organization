# Data Review Checklist

Use this checklist for schema, migration, and persistence-boundary reviews. Evidence must come from
the actual DDL, generated model, query, fixture, or runtime output.

## Authority and integrity

- Name the one table or service that owns each state transition.
- Trace every producer, reader, worker, projection, export, and cleanup path.
- Enforce tenant and object scope with predicates plus an RLS or equivalent durable backstop.
- Encode total constraints: invalid `NULL` values must fail instead of escaping through SQL UNKNOWN.
- Prefer foreign keys, uniqueness, checks, and compare-and-swap versions over application convention.
- Separate immutable evidence from mutable work/projection state and document retention for each.

## Migration and rollout

- State expand, backfill, dual-read/write (if unavoidable), cutover, contract, and rollback phases.
- Prove the migration from a clean base and from realistic legacy rows, including malformed edge data.
- Verify every generated client/type and every old/new caller during rolling compatibility.
- Make backfills bounded, restartable, observable, tenant-scoped, and concurrency-safe.
- Define the retirement sweep for old columns, functions, flags, env vars, docs, fixtures, and indexes.

## Queries and operations

- Register the top access paths and prove matching indexes with realistic cardinality.
- Bound pagination, batches, lock waits, retries, retention jobs, and provider effects.
- Prove sequential retry and concurrent duplicate behavior for every idempotent mutation.
- Define backup/restore, deletion, archive, legal hold, and derived-state rebuild behavior.

## Required killer mutations

- Remove the tenant predicate or RLS policy: the cross-tenant test must fail without revealing existence.
- Remove the uniqueness/CAS guard: a barrier-concurrent duplicate test must produce two winners and fail.
- Change a total CHECK so `NULL` yields UNKNOWN: the invalid-null fixture must be accepted and fail the test.
- Bypass the owning repository with a sibling raw write: the authority gate must reject it.
- Delete a rolling-compatibility reader before cutover: the mixed-version fixture must fail.

Counterexamples: a static lookup table with no tenant scope does not need a tenant predicate; a truly
one-off local cache does not need an outbox; a migration that only adds an unused nullable column may
not need a data backfill, but still needs generated-client and retirement ownership.
