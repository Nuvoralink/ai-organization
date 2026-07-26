# API And Contract Implementation

## Status

Ready. Inputs used: REQ-MVP-1, API-REVISION-1, and DEC-ARCH-1. Sources and basis: Standard-backed OpenAPI 3.1 contract guidance and Assumption with impact: API path `src/app/api/revisions/route.ts` is proposed.

## Related Requirement IDs

REQ-MVP-1 and API-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-API-1.

## Assumptions With Impact

Assumption: JSON over HTTPS is the first API contract. Impact: if server actions are chosen, keep the same DTO and error contract.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/app/api/revisions/route.ts`, `src/lib/revisions/schema.ts`, `src/lib/revisions/repository.ts`, and `tests/revisions.contract.spec.ts`.

## Verification Method

Run API contract tests for request schema, response schema, auth, permission, validation error state, rate limits, and idempotency.

## Rollback Or Containment Notes

Rollback disables POST while allowing GET to read already saved revision plans.

## Traceability

Traceability: REQ-MVP-1 -> API-REVISION-1 -> TEST-API-1 -> RISK-IMPL-1.

## Endpoint Inventory

POST `/api/revisions` creates a revision request. GET `/api/revisions/:id` returns the saved final output surface payload.

## DTO

Request DTO includes `draftText`. Response DTO includes `revisionId`, `status`, `guidanceSummary`, and `updatedAt`.

## Schemas

Schemas live in `src/lib/revisions/schema.ts` and are shared by route validation and contract tests.

## Auth

Authentication is required before accessing the route.

## Permission

Authorization checks owner id before read or update.

## Error States

Return explicit validation, unauthorized, forbidden, unavailable, and not-found error states.

## Idempotency

Use client request id for duplicate submissions.

## Rate Limits

Limit draft submissions per owner and record limit failures without storing draft text in logs.

## Contract Tests

Contract tests assert DTO shape, status codes, privacy-safe errors, and final surface payload.
