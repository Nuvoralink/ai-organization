# SupportDesk Source-of-Truth Map

## Purpose

Define the authority chain for ticket status so future agents preserve the correct source of truth.

## Status

Repo-derived.

## Inputs used

- `auditability/documentation-audit.md`
- `backend/src/models/ticket.ts`
- `frontend/src/pages/TicketQueue.tsx`

## Sources and basis

- Repo-derived: ticket model and queue UI paths.
- Standard-backed: SpecForge source-of-truth acceptance pattern.

## Assumptions

`ASM-SD-001` remains active. Impact: additional status producers must be added here if found.

## Decisions

Current-status authority stays with `tickets.status`; audit events remain historical proof.

## Open questions

No open question blocks this map.

## Traceability

`REQ-SD-001` and `RISK-SD-001` depend on this authority map.

## Authority inventory

| Authority ID | Data | Owner | Source type |
| --- | --- | --- | --- |
| AUTH-SD-001 | Current ticket status | `tickets.status` | Repo-derived |
| AUTH-SD-002 | Status change history | audit events | Repo-derived |

## Decision-to-authority table

| Decision | Authority | Requirement ID |
| --- | --- | --- |
| Render current queue status | AUTH-SD-001 | REQ-SD-001 |
| Explain why status changed | AUTH-SD-002 | REQ-SD-002 |

## Source freshness rules

`tickets.status` is fresh after the transaction that changes status commits. Audit events can lag for explanation but cannot override current status.

## Validation and provenance rules

Status writes require a valid transition, actor ID, tenant ID, and audit event. The audit event proves history but does not own current state.

## Remediation and fail-closed rules

If status and audit history disagree, user-visible current status comes from `tickets.status` and the mismatch is logged for repair.

## Downstream consumer map

| Consumer | Source | Requirement ID |
| --- | --- | --- |
| Ticket queue card | `tickets.status` via API DTO | REQ-SD-001 |
| Ticket history panel | audit events | REQ-SD-002 |

## Status precedence rules

Database status outranks audit-derived status for current UI, exports, filters, and counters.

## Fallback retirement rules

Remove any display fallback that derives current status from latest audit event after DTO coverage is verified.

## Test proof map

| Requirement ID | Test |
| --- | --- |
| REQ-SD-001 | API test: queue DTO uses `tickets.status` |
| REQ-SD-002 | UI test: history panel labels audit events as history |
