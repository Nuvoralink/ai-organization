# FieldLog Focused Docs Index

## Purpose

Provide the routing map for a focused planning package covering product scope, architecture, and implementation readiness for FieldLog.

## Status

Draft; User-confirmed for the app goal; Standard-backed for document quality structure; Assumption for launch scale.

## Inputs used

- User-confirmed: Field technicians need job notes, photos, follow-up tasks, and manager review.
- Assumption: first release is a responsive web app for one regional service company.
- Standard-backed: PRD structure follows product requirements guidance; architecture structure follows C4-style context and container separation.

## Sources and basis

- User-confirmed: app description in the planning prompt.
- Standard-backed: Atlassian PRD guidance for purpose, assumptions, options, success metrics, open questions, and scope boundaries.
- Standard-backed: C4 Model for system context and container-level architecture.
- Standard-backed: ADR guidance for durable decision rationale.

## Assumptions

| Assumption ID | Source type | Assumption | Impact |
| --- | --- | --- | --- |
| ASM-FL-001 | Assumption | FieldLog launches with one tenant and fewer than 250 technicians. | If false, architecture and rate-limit requirements need multi-tenant scale review before implementation. |

## Decisions

See `auditability/decision-log.md` for material decisions and reversal triggers.

## Open questions

| Question ID | Question | Impact |
| --- | --- | --- |
| OQ-FL-001 | Does photo capture require offline draft support on day one? | If yes, add offline storage and sync conflict requirements before coding uploads. |

## Traceability

- Requirements: `REQ-FL-001` through `REQ-FL-005`
- Risks: `RISK-FL-001`, `RISK-FL-002`
- Tasks: `TASK-FL-001` through `TASK-FL-003`

## Document map

| Document | Role | Scope |
| --- | --- | --- |
| `product/02-prd.md` | Product contract | Field technician and manager workflows |
| `architecture/06-architecture.md` | Architecture contract | Web app, API, object storage, database, and background job boundaries |
| `implementation/29-ai-implementation-task-plan.md` | Agent implementation plan | Small slices with tests, docs updates, and rollback |
| `auditability/decision-log.md` | Decision source | Defaults and tradeoffs |
| `auditability/research-ledger.md` | Source ledger | Sources used and rejected |
| `auditability/documentation-quality-review.md` | Review proof | Validation and remaining gaps |

## Source register

| Source ID | Source type | Detail | Affected docs |
| --- | --- | --- | --- |
| SRC-FL-USER-001 | User-confirmed | FieldLog product prompt | `product/02-prd.md` |
| SRC-FL-STD-001 | Standard-backed | C4 Model | `architecture/06-architecture.md` |
| SRC-FL-STD-002 | Standard-backed | ADR guidance | `auditability/decision-log.md` |

## Assumption register

See `ASM-FL-001`.

## Open question register

See `OQ-FL-001`.

## Decision register

See `auditability/decision-log.md`.

## Risk register

| Risk ID | Risk | Mitigation |
| --- | --- | --- |
| RISK-FL-001 | Photo uploads expose customer property images across accounts. | Tenant-scoped object keys, authorization checks, and download URL tests. |
| RISK-FL-002 | Follow-up task status diverges between manager and technician views. | Single task authority table and source-to-surface assertions. |

## Requirement ID map

| Requirement ID | Document |
| --- | --- |
| REQ-FL-001 | `product/02-prd.md` |
| REQ-FL-002 | `product/02-prd.md` |
| REQ-FL-003 | `architecture/06-architecture.md` |
| REQ-FL-004 | `implementation/29-ai-implementation-task-plan.md` |
| REQ-FL-005 | `implementation/29-ai-implementation-task-plan.md` |

## Terminology and ID registry

| Term | Canonical meaning |
| --- | --- |
| Technician | User who records job notes and photos |
| Manager | User who reviews notes and assigns follow-up tasks |
| Job note | Structured record for one service visit |
