# SupportDesk Surface and Output Authority Map

## Purpose

Map ticket status authority to user-visible queue surfaces.

## Status

Repo-derived.

## Inputs used

- `assurance/source-of-truth-map.md`
- `frontend/src/pages/TicketQueue.tsx`

## Sources and basis

- Repo-derived: queue rendering path.
- Standard-backed: source-to-surface proof pattern.

## Assumptions

`ASM-SD-001` remains active. Impact: exports or dashboards not inspected here may need added rows.

## Decisions

Queue surfaces must render current status from `tickets.status`.

## Open questions

No question blocks the UI authority repair.

## Traceability

`REQ-SD-001`, `REQ-SD-002`, and `RISK-SD-001` are covered.

## Surface and output inventory

| Surface | User-visible claim | Authority |
| --- | --- | --- |
| Ticket queue card | Current ticket status | `tickets.status` |
| Ticket history panel | Past status changes | audit events |

## First-useful-viewport questions

- Can the manager see which tickets need action without reading history?
- Does the first queue view avoid showing audit-history labels as current truth?

## Source-to-surface table

| Surface | Source | API or DTO | Requirement ID |
| --- | --- | --- | --- |
| Ticket queue card | `tickets.status` | `TicketListItem.status` | REQ-SD-001 |
| Ticket history panel | audit events | `TicketHistoryEvent[]` | REQ-SD-002 |

## DTO, API, report, and export ownership

`TicketListItem.status` owns queue status display. Reports and exports must use the same field for current status.

## Display-copy ownership

Display copy must distinguish "Current status" from "Status history".

## Empty, limited, pending, and unavailable states

If current status is unavailable, show an unavailable state and block status filters instead of deriving status from history.

## Role and filter rules

Managers can filter by current status. Agents without tenant access receive permission denied without ticket details.

## Object identity rules

Ticket identity uses stable ticket ID plus customer-visible ticket number. Filenames or audit event IDs are not user-facing identity.

## Screenshot, geometry, or export rendering checks

Browser smoke should assert that the queue card status equals the API current-status field.

## Debug label policy

Debug labels must not appear in production UI.
