# FieldLog PRD

## Purpose

Define the focused product contract for technician job capture and manager follow-up review.

## Status

Draft; User-confirmed for the core workflow; Assumption-heavy for exact device and offline constraints.

## Inputs used

- User-confirmed: technicians capture job notes, photos, and follow-up tasks.
- User-confirmed: managers review submitted work.
- Assumption: first release supports browser-based upload from mobile devices.

## Sources and basis

- User-confirmed: initial FieldLog prompt.
- Standard-backed: Atlassian PRD guidance for purpose, assumptions, user stories, options, success metrics, open questions, and scope boundaries.

## Assumptions

| Assumption ID | Source type | Assumption | Impact |
| --- | --- | --- | --- |
| ASM-FL-002 | Assumption | Technicians have mobile browser connectivity at job closeout. | If false, offline draft sync becomes a launch requirement. |

## Decisions

The product decision records live in `auditability/decision-log.md`.

## Open questions

| Question ID | Question | Impact |
| --- | --- | --- |
| OQ-FL-002 | Are customer signatures required for job completion? | If yes, add signature consent, storage, and audit requirements before implementation. |

## Traceability

`REQ-FL-001`, `REQ-FL-002`, `RISK-FL-001`, and `TASK-FL-001` trace into architecture and implementation docs.

## Product overview

FieldLog helps technicians submit complete job closeout records and helps managers review follow-up work from one source of truth.

## Scope

In scope for this focused package:

- Technician job-note creation.
- Photo attachment to job notes.
- Manager review and follow-up task assignment.

Outside this focused package:

- Offline sync.
- Customer billing.
- Dispatch scheduling.
- Payroll or time tracking.

## User stories

| Story ID | Role | Story | Source type |
| --- | --- | --- | --- |
| US-FL-001 | Technician | As a technician, I need to record what happened on a job so the manager can review completion evidence. | User-confirmed |
| US-FL-002 | Manager | As a manager, I need to assign a follow-up task from a submitted note so unresolved work does not disappear. | User-confirmed |

## Acceptance criteria

| Requirement ID | Criteria | Verification method |
| --- | --- | --- |
| REQ-FL-001 | A technician can create a job note with customer name, site label, work summary, and completion status. | Browser form test and API contract test |
| REQ-FL-002 | A manager can create one or more follow-up tasks from a submitted job note. | Role-based integration test |

## Functional requirements

| Requirement ID | Requirement | Source type | Affected role | Risk level | Related docs |
| --- | --- | --- | --- | --- | --- |
| REQ-FL-001 | Store each job note with technician owner, job date, status, summary, and tenant ID. | User-confirmed | Technician | Medium | `architecture/06-architecture.md` |
| REQ-FL-002 | Store follow-up tasks with a single status authority and manager assignee. | User-confirmed | Manager | High | `implementation/29-ai-implementation-task-plan.md` |

## Non-functional requirements

| Requirement ID | Requirement | Source type | Verification method | Risk level |
| --- | --- | --- | --- | --- |
| REQ-FL-003 | Photo URLs must be tenant-scoped and expire after a short retrieval window. | Standard-backed | Authorization and object-key tests | High |

## Feature-by-feature edge cases

- `REQ-FL-001`: empty summary blocks submit and explains the missing field.
- `REQ-FL-002`: deleted job notes cannot accept new follow-up tasks.

## Empty states

- Technician dashboard shows no job notes until the first note is submitted.
- Manager review queue shows no pending reviews when all submitted notes are reviewed.

## Error states

- Photo upload failure preserves the text draft and marks the image attachment failed.
- Unauthorized manager access returns a permission-denied state without exposing job details.

## Permissions

| Action | Technician | Manager |
| --- | --- | --- |
| Create own job note | Allowed | Not applicable |
| Review submitted note | Not allowed | Allowed |
| Assign follow-up task | Not allowed | Allowed |

## Analytics events

Analytics are outside this focused package. If added later, event payloads must not include customer names, addresses, photo URLs, or note bodies.

## Abuse and misuse cases

- Technician uploads unrelated images.
- Manager accesses another team account.
- User tries to infer customer details from object URLs.

## Security and privacy notes

`RISK-FL-001` requires tenant-scoped object storage and role checks before any photo download URL is issued.

## Traceability matrix

| Requirement ID | Risk ID | Test | Task |
| --- | --- | --- | --- |
| REQ-FL-001 | RISK-FL-002 | API and browser form test | TASK-FL-001 |
| REQ-FL-002 | RISK-FL-002 | Manager role integration test | TASK-FL-002 |
| REQ-FL-003 | RISK-FL-001 | Object authorization test | TASK-FL-003 |
