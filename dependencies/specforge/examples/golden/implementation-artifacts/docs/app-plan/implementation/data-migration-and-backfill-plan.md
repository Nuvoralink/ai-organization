# Data Migration And Backfill Plan

## Status

Ready. Inputs used: REQ-MVP-1, DATA-REVISION-1, and DEC-ARCH-1. Sources and basis: Standard-backed migration ordering guidance and Assumption with impact: `db/migrations/001_revision_guidance.sql` is proposed.

## Related Requirement IDs

REQ-MVP-1 and DATA-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-DATA-1.

## Assumptions With Impact

Assumption: relational persistence is used. Impact: if the repo chooses document storage, preserve the same validation and rollback contract.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`db/migrations/001_revision_guidance.sql`, `src/lib/revisions/schema.ts`, and `src/lib/revisions/repository.ts`.

## Verification Method

Run `npm run db:migrate:test`, repository unit tests, and data validation fixtures.

## Rollback Or Containment Notes

Rollback or restore: reverse the migration before enabling writes, or restore from the pre-migration backup if production data has changed.

## Traceability

Traceability: REQ-MVP-1 -> DATA-REVISION-1 -> TEST-DATA-1 -> RISK-IMPL-1.

## Schema Changes

Create `revision_requests` with owner id, draft text, revision status, guidance summary, created timestamp, and updated timestamp.

## Migration Order

Add table, add indexes, run data validation, enable API write path, then enable UI.

## Backfill Strategy

No existing records in greenfield mode; not-applicable-with-reason for backfill rows until existing drafts are imported.

## Data Validation

Validate owner id, draft length, status enum, and non-empty guidance summary before persistence.

## Idempotency

Migration must be repeat-safe in test by checking table existence and unique migration id.

## Privacy Constraints

Draft text is private student data and must not be written to logs or analytics events.
