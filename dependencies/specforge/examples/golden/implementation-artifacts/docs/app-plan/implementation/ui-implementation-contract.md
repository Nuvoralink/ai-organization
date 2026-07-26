# UI Implementation Contract

## Status

Ready. Inputs used: REQ-MVP-1, UX-REVISION-1, and DEC-ARCH-1. Sources and basis: Standard-backed WCAG 2.2 and User-confirmed student review workflow.

## Related Requirement IDs

REQ-MVP-1, UX-REVISION-1, and NFR-ACCESS-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-UI-1.

## Assumptions With Impact

Assumption: the first UI is web. Impact: mobile-native contracts must be added if platform scope changes.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/app/revisions/page.tsx`, `src/components/revisions/RevisionForm.tsx`, `src/components/revisions/RevisionResult.tsx`, and `tests/revisions.e2e.ts`.

## Verification Method

Run `npm run test:e2e`, accessibility checks, and screenshot gate for desktop and mobile viewport states.

## Rollback Or Containment Notes

Containment hides the submit control behind `revisionGuidance.enabled=false` while retaining read-only saved results.

## Traceability

Traceability: REQ-MVP-1 -> UX-REVISION-1 -> TEST-UI-1 -> RISK-IMPL-1.

## Screen

The revision screen accepts a draft and renders the saved final user-visible surface.

## Component

`RevisionForm` owns input collection; `RevisionResult` only renders persisted API output.

## State Model

States are empty, editing, loading state, saved, validation error state, unavailable, and limited.

## Loading State

Loading shows progress without replacing the previous saved result.

## Empty State

Empty state guides the student to submit a draft without fake sample output.

## Error State

Error state describes validation, forbidden, unavailable, and retryable failures.

## Accessibility

Labels, focus order, keyboard submit, contrast, and error announcements must pass WCAG 2.2 AA checks.

## Responsive Behavior

The review screen fits mobile and desktop without text overlap.

## First-Useful-Viewport

First-useful-viewport shows draft status, guidance summary, and next action.

## Screenshot Gate

Screenshot gate captures empty, loading, error, saved, and unavailable states.
