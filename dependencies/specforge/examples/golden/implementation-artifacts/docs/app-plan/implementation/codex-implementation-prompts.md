# Codex Implementation Prompts

## Status

Ready. Inputs used: REQ-MVP-1, SLICE-MVP-1, and DEC-ARCH-1. Sources and basis: User-confirmed product intent, Assumption with impact for proposed files, and Standard-backed verification gates.

## Related Requirement IDs

REQ-MVP-1 and FR-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-APP-1.

## Assumptions With Impact

Assumption: future Codex work starts from the same repo root. Impact: rerun repo audit if paths differ.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/app/revisions/page.tsx`, `src/app/api/revisions/route.ts`, `src/lib/revisions/repository.ts`, `src/lib/revisions/schema.ts`, and `tests/revisions.spec.ts`.

## Verification Method

Future implementation must run `npm test`, `npm run typecheck`, and `npm run test:e2e`.

## Rollback Or Containment Notes

Rollback proof must show the feature flag disables writes and the final review screen remains stable.

## Traceability

Traceability: REQ-MVP-1 -> SLICE-MVP-1 -> TEST-REVISION-1 -> RISK-IMPL-1.

## Prompt SLICE-MVP-1

Owned files: `src/app/revisions/page.tsx`, `src/app/api/revisions/route.ts`, `src/lib/revisions/repository.ts`, `src/lib/revisions/schema.ts`, and `tests/revisions.spec.ts`.

Blocked files: auth middleware, billing code, unrelated layout, and unrelated analytics code.

Required tests: unit, integration, contract, E2E, accessibility, security, smoke, and migration checks listed in `verification-and-test-harness.md`.

Docs to update: update product, data/API, security, release, and implementation docs in the same coding change.

No-shortcut checks: prove the persisted source of truth drives the final user-visible surface; do not use client-only state as the authority.

Final proof expected: source-to-surface evidence, test command output, screenshot evidence, rollback proof, and documentation update proof.
