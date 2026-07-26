# Repo Change Map

## Status

Ready. Inputs used: REQ-MVP-1, DEC-ARCH-1, and SLICE-MVP-1. Sources and basis: Assumption with impact for greenfield paths, Standard-backed test layout guidance, and User-confirmed product boundaries.

## Related Requirement IDs

REQ-MVP-1, FR-REVISION-1, NFR-MAINT-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-APP-1.

## Assumptions With Impact

Assumption: app code lives under `src/`. Impact: adjust paths before implementation if the scaffold uses another root.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/app/revisions/page.tsx`, `src/app/api/revisions/route.ts`, `src/lib/revisions/repository.ts`, `src/lib/revisions/schema.ts`, `db/migrations/001_revision_guidance.sql`, `tests/revisions.spec.ts`.

## Verification Method

Run `npm test`, `npm run typecheck`, and `npm run test:e2e`.

## Rollback Or Containment Notes

Rollback removes the route flag and reverses `db/migrations/001_revision_guidance.sql`.

## Traceability

Traceability: REQ-MVP-1 -> SLICE-MVP-1 -> DEC-ARCH-1 -> RISK-IMPL-1.

## File Ownership

Revision domain owns `src/lib/revisions/*`; route handlers only translate HTTP contracts into domain calls.

## Protected Areas

Do not change auth middleware, billing code, or unrelated layout files during SLICE-MVP-1.

## New Files

Create `src/lib/revisions/schema.ts`, `src/lib/revisions/repository.ts`, and `tests/revisions.spec.ts`.

## Changed Files

Change `src/app/revisions/page.tsx` and `src/app/api/revisions/route.ts` only for this slice.

## Generated Files

Generated files are limited to `db/migrations/001_revision_guidance.sql`.

## Boundaries Not To Cross

Do not invent a second revision source of truth in UI state or local storage.

## Blast Radius

Blast radius includes revision submit, revision retrieval, private draft storage, and final review screen rendering.
