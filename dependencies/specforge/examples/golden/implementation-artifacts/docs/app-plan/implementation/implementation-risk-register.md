# Implementation Risk Register

## Status

Ready. Inputs used: REQ-MVP-1, RISK-IMPL-1, and DEC-ARCH-1. Sources and basis: User-confirmed privacy boundary, Standard-backed OWASP ASVS 5.0, and Assumption with impact for proposed repo files.

## Related Requirement IDs

REQ-MVP-1, SEC-REVISION-1, PRIV-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-SEC-1.

## Assumptions With Impact

Assumption: no existing production records. Impact: backfill risk is low until existing drafts are imported.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/app/api/revisions/route.ts`, `src/lib/revisions/repository.ts`, `src/lib/logging/redaction.ts`, and `tests/revisions.security.spec.ts`.

## Verification Method

Run security tests, contract tests, migration checks, and source-to-surface smoke proof.

## Rollback Or Containment Notes

Containment disables writes and preserves read-only access to already validated records.

## Traceability

Traceability: RISK-IMPL-1 -> SEC-REVISION-1 -> TEST-SEC-1 -> SLICE-MVP-1.

## Risk ID

RISK-IMPL-1: private draft content could leak or render from the wrong authority.

## Root Cause

Root cause would be bypassing repository ownership, logging draft text, or treating UI state as source of truth.

## Blast Radius

Blast radius includes private draft storage, API response, final review screen, logs, and support workflow.

## Mitigation

Mitigation uses owner authorization, logging redaction, DTO allow-listing, and source-to-surface tests.

## Verification

Verification uses `npm run test:security`, `npm run test:e2e`, and log redaction assertions.

## Owner Or Affected Role

Owner or affected role: student, support operator, and release owner.

## Reversal Trigger

Reversal trigger: privacy leak, wrong-owner access, failed rollback proof, or final surface mismatch.
