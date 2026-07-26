# SupportDesk Documentation Audit

## Purpose

Identify and repair documentation drift for ticket status authority.

## Status

Repo-derived.

## Inputs used

- `backend/src/models/ticket.ts`
- `frontend/src/pages/TicketQueue.tsx`
- `docs/architecture.md`

## Sources and basis

- Repo-derived: code and stale documentation paths.
- Standard-backed: source-of-truth repair pattern from SpecForge assurance guidance.

## Assumptions

`ASM-SD-001` says the sampled paths are representative. Impact: a wider grep is required before product-code changes.

## Decisions

The repair decision is recorded in `auditability/decision-log.md`.

## Open questions

No question blocks the documentation repair.

## Traceability

`RCA-SD-001` causes `REQ-SD-001` and `REQ-SD-002`.

## Repo scan summary

The repo scan found a mismatch: code persists current ticket status on `tickets.status`, while old architecture docs say status is derived from audit events.

## Existing docs inventory

| File | Status |
| --- | --- |
| `docs/architecture.md` | Stale authority claim |
| `docs/app-plan/assurance/source-of-truth-map.md` | Updated by this repair |
| `docs/app-plan/assurance/surface-authority-map.md` | Updated by this repair |

## Code-derived facts

| Fact ID | Source type | Evidence path | Fact |
| --- | --- | --- | --- |
| FACT-SD-001 | Repo-derived | `backend/src/models/ticket.ts` | `tickets.status` stores current workflow status. |
| FACT-SD-002 | Repo-derived | `frontend/src/pages/TicketQueue.tsx` | Queue cards render status from the ticket API DTO. |

## Stale docs found

| Drift ID | Stale claim | Current evidence |
| --- | --- | --- |
| RCA-SD-001 | Audit events own current status. | `tickets.status` owns current status; audit events only explain history. |

## Missing docs found

The old docs lacked a source-to-surface map proving how status reaches the queue UI.

## Conflicts between docs and code

`docs/architecture.md` conflicted with `backend/src/models/ticket.ts`.

## Updated docs

- `assurance/source-of-truth-map.md`
- `assurance/surface-authority-map.md`
- `auditability/documentation-lifecycle.md`

## Remaining gaps

Run a wider grep for `audit status` before changing product code.

## Evidence paths

See `FACT-SD-001` and `FACT-SD-002`.

## Commands run

Fixture evidence is illustrative. Real repo repair should record actual search and validation commands here.
