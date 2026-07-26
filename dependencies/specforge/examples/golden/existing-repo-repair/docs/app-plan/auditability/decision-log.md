# SupportDesk Decision and Defaults Register

## Purpose

Record the ticket status authority repair decision.

## Status

Repo-derived.

## Inputs used

- `auditability/documentation-audit.md`
- `assurance/source-of-truth-map.md`

## Sources and basis

- Repo-derived: current ticket model and queue UI.
- AI-recommended default: keep current status and historical audit events as separate authorities.

## Assumptions

See `ASM-SD-001`.

## Decisions

See `DEC-SD-001`.

## Open questions

No decision-blocking questions remain.

## Traceability

`DEC-SD-001` maps to `REQ-SD-001`, `REQ-SD-002`, `RISK-SD-001`, and `RCA-SD-001`.

## Decision support policy

Material repair decisions must include options considered, pros and cons, final recommendation, source basis, verification method, and reversal trigger.

## Decision-blocking questions

No questions block this repair.

## User-confirmed decisions

Not-applicable-with-reason: this fixture is repo-repair focused and uses repo evidence.

## AI-recommended defaults

| Decision ID | Decision area | Final recommendation | Source basis |
| --- | --- | --- | --- |
| DEC-SD-001 | Ticket status authority | Use `tickets.status` for current status and audit events for history only. | Repo-derived evidence plus source-of-truth repair pattern |

## Options considered

For `DEC-SD-001`:

- Option A: database current status owns UI and filters.
- Option B: derive current status from latest audit event.
- Option C: let each UI surface choose status source.

## Pros and cons

For `DEC-SD-001`:

- Option A pro: one current-status authority. Con: requires keeping audit history synchronized.
- Option B pro: easy to explain history. Con: stale or missing events can misstate current state.
- Option C pro: local UI speed. Con: creates split-brain product truth.

## Final recommendations

Use Option A.

## Source basis

Repo-derived `backend/src/models/ticket.ts` shows current status on `tickets.status`.

## Assumptions and impact

`ASM-SD-001` may miss other status producers. Impact: run a wider audit before code edits.

## Risks and mitigations

`RISK-SD-001` is mitigated by source-to-surface assertions and documentation authority routing.

## Reversal triggers

Revisit `DEC-SD-001` only if the codebase intentionally moves to event-sourced current state with projection tests and migration docs.

## Decisions requiring user confirmation

No user confirmation required for documenting current repo behavior.

## No-shortcut review log

Rejected shortcut: changing only the queue label. It would hide the drift while leaving the wrong authority in docs.

## Root-cause review notes, if existing repo mode

`RCA-SD-001`: old docs described an intended event-history model, but code evolved to a current-status column and docs were not updated.

## Requirement impact map

| Decision ID | Requirement ID | Risk ID |
| --- | --- | --- |
| DEC-SD-001 | REQ-SD-001 | RISK-SD-001 |
