# SupportDesk Repair Docs Index

## Purpose

Route the focused repair package for a repo where ticket status documentation drifted away from code authority.

## Status

Repo-derived for current behavior; Standard-backed for source-of-truth repair structure.

## Inputs used

- Repo-derived: `backend/src/models/ticket.ts` owns ticket status.
- Repo-derived: `frontend/src/pages/TicketQueue.tsx` displays ticket status.
- Repo-derived: old `docs/architecture.md` claimed audit events own status.

## Sources and basis

- Repo-derived: code paths listed above.
- Standard-backed: source-of-truth and documentation authority patterns from SpecForge.

## Assumptions

| Assumption ID | Source type | Assumption | Impact |
| --- | --- | --- | --- |
| ASM-SD-001 | Assumption | The listed code paths are representative of the repo. | If false, run a broader route and schema audit before implementation. |

## Decisions

See `auditability/decision-log.md`.

## Open questions

No open question blocks this documentation repair.

## Traceability

`RCA-SD-001`, `REQ-SD-001`, `REQ-SD-002`, and `RISK-SD-001` are the repair chain.

## Document map

| Document | Purpose |
| --- | --- |
| `auditability/documentation-audit.md` | Record drift and evidence |
| `assurance/source-of-truth-map.md` | Define ticket status authority |
| `assurance/surface-authority-map.md` | Map status to queue UI |
| `auditability/documentation-lifecycle.md` | Prevent stale docs from governing agents |
| `auditability/decision-log.md` | Record the repair decision |
| `auditability/research-ledger.md` | Record source basis |
| `auditability/documentation-quality-review.md` | Review and validation proof |

## Source register

| Source ID | Source type | Detail |
| --- | --- | --- |
| SRC-SD-REPO-001 | Repo-derived | `backend/src/models/ticket.ts` status enum |
| SRC-SD-REPO-002 | Repo-derived | `frontend/src/pages/TicketQueue.tsx` status rendering |
| SRC-SD-REPO-003 | Repo-derived | stale `docs/architecture.md` claim |

## Assumption register

See `ASM-SD-001`.

## Open question register

No blocking questions.

## Decision register

See `auditability/decision-log.md`.

## Risk register

| Risk ID | Risk | Required proof |
| --- | --- | --- |
| RISK-SD-001 | Future agents patch queue display while leaving status authority wrong. | Source-to-surface assertion in `assurance/surface-authority-map.md`. |

## Requirement ID map

| Requirement ID | Document |
| --- | --- |
| REQ-SD-001 | `assurance/source-of-truth-map.md` |
| REQ-SD-002 | `assurance/surface-authority-map.md` |

## Terminology and ID registry

| Term | Canonical meaning |
| --- | --- |
| Ticket status | Database-owned workflow state on `tickets.status` |
| Audit event | Historical record, not current status authority |
