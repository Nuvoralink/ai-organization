# Implementation Roadmap

## Status

Ready. Inputs used: REQ-MVP-1 and DEC-ARCH-1. Sources and basis: User-confirmed product intent, Standard-backed WCAG 2.2, and Assumption with impact: `src/app/revisions/page.tsx` is proposed until scaffolded.

## Related Requirement IDs

REQ-MVP-1, FR-REVISION-1, NFR-ACCESS-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-APP-1 select a simple server-rendered app with explicit API contracts.

## Assumptions With Impact

Assumption: the first implementation uses `src/app/api/revisions/route.ts`. Impact: route naming must be updated if the repo uses a different framework convention.

## Open Questions

None blocking. If the repo already has auth, align the implementation with that source of truth before editing.

## Affected Files Or Proposed File Locations

Proposed paths: `src/app/revisions/page.tsx`, `src/app/api/revisions/route.ts`, `src/lib/revisions/schema.ts`, `tests/revisions.spec.ts`, and `docs/app-plan/implementation/README.md`.

## Verification Method

Run `npm test`, `npm run test:e2e`, and contract checks against the revision API.

## Rollback Or Containment Notes

Rollback uses the release flag `revisionGuidance.enabled=false` and reverts schema migration `db/migrations/001_revision_guidance.sql`.

## Traceability

Traceability: REQ-MVP-1 -> SLICE-MVP-1 -> TEST-REVISION-1 -> RISK-IMPL-1.

## Release Slices

SLICE-MVP-1 delivers draft submission, persisted revision guidance, and the student review screen.

## Dependency Order

Data schema first, API contract second, UI state third, verification and rollout gates last.

## Sequencing Rationale

The source of truth is the saved revision record, so persistence and contract validation must exist before the UI consumes the result.

## Future Capability Map

No post-MVP capability is approved. Collaborative editing and alternate AI providers remain non-goals until a product decision and verified contract exist. They do not justify dead roles, provider methods, or plugin infrastructure now.

## Foundation Seams

The persisted revision repository and explicit API contract are exercised by the current submit-and-review flow and are the only planted seams. A later approved consumer must extend those authorities. It may not create a second draft store or client-only guidance owner. Killer mutation: route the review screen around the repository through browser-only state; source-to-surface and reload tests must fail.

## Risk Levels

RISK-IMPL-1 is medium because privacy and final output correctness affect student trust.

## Acceptance Gates

Acceptance requires persisted data proof, API contract proof, UI screenshot proof, accessibility proof, and rollback proof.

## Blocked Work

No blocked work. If auth ownership is absent, block private draft storage until DEC-SEC-1 is added.

## Rollback Triggers

Rollback trigger: failed migration validation, private draft leakage, or final surface mismatch.

## Shortcuts Rejected

Rejected shortcut: rendering guidance from client-only state because it bypasses persistence, auditability, and rollback verification.
