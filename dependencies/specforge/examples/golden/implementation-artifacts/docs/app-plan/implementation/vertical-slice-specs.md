# Vertical Slice Specs

## Status

Ready. Inputs used: REQ-MVP-1, FR-REVISION-1, DEC-ARCH-1, and RISK-IMPL-1. Sources and basis: User-confirmed product intent, Standard-backed WCAG 2.2, and Assumption with impact: proposed path `src/app/revisions/page.tsx` may change with repo scaffold.

## Related Requirement IDs

REQ-MVP-1 and FR-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-APP-1.

## Assumptions With Impact

Assumption: one student owns one submitted draft. Impact: collaborative editing is outside this slice.

## Open Questions

None blocking for SLICE-MVP-1.

## Affected Files Or Proposed File Locations

`src/app/revisions/page.tsx`, `src/app/api/revisions/route.ts`, `src/lib/revisions/repository.ts`, `src/lib/revisions/schema.ts`, `tests/revisions.spec.ts`.

## Verification Method

Run `npm test`, `npm run test:e2e`, and API contract assertions for POST and GET revision flows.

## Rollback Or Containment Notes

Containment: disable the route with `revisionGuidance.enabled=false` and keep existing drafts read-only.

## Traceability

Traceability: REQ-MVP-1 -> SLICE-MVP-1 -> TEST-REVISION-1 -> RISK-IMPL-1.

## Slice SLICE-MVP-1 Revision Guidance

Slice ID: SLICE-MVP-1.

Implementation outcome: a student submits a draft and sees a saved revision plan on the final user-visible review screen.

Root source of truth: the persisted revision record owned by `src/lib/revisions/repository.ts`.

Existing authority extended: the revision repository and its versioned API contract; this slice adds no second draft or guidance authority.

Forbidden parallel authority: client-only draft/guidance state, a second repository for the review screen, or an AI-provider-owned product status.

Current consumer proof: submit a draft through POST, reload through GET, and render the same persisted revision on the final review screen; removing the repository handoff must fail the E2E test.

Killer mutation: return generated guidance directly to the browser without persistence and reload it from local state. The source-to-surface/reload assertion must fail.

Upstream dependencies: product requirement REQ-MVP-1, data schema `src/lib/revisions/schema.ts`, and DEC-ARCH-1.

Downstream consumers: API response from `src/app/api/revisions/route.ts`, UI review screen `src/app/revisions/page.tsx`, audit logs, and release smoke tests.

Data touched: draft text, revision status, guidance summary, timestamps, and owner id.

Permission and privacy impact: only the owning student can read or mutate their draft; private draft text is never logged.

UX or API states affected: loading state, empty state, validation error state, saved state, unavailable state, and final output surface.

Tests to add or update: unit repository tests, API contract tests, E2E submit-and-review flow, accessibility checks, and smoke proof.

Docs to update: `docs/app-plan/product/02-prd.md`, `docs/app-plan/data-and-api/09-api-and-integration-contracts.md`, and this implementation pack.

Stop condition: stop when source-to-surface proof shows the persisted record reaches the final review screen with correct permissions and rollback proof.

Shortcuts rejected: rejected shortcut is a client-only generated card because it skips source of truth, persistence, API contract, and final surface verification.
