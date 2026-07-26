# FieldLog Decision and Defaults Register

## Purpose

Record material decisions and defaults for the focused FieldLog package.

## Status

Draft; AI-recommended default with user-confirmed product intent.

## Inputs used

- FieldLog product prompt.
- `product/02-prd.md`
- `architecture/06-architecture.md`

## Sources and basis

- User-confirmed: core app goal.
- Standard-backed: ADR guidance for decision rationale and tradeoffs.
- AI-recommended default: relational database and private object storage split.

## Assumptions

See `ASM-FL-001` through `ASM-FL-004`.

## Decisions

See `DEC-FL-001`.

## Open questions

See `OQ-FL-001` through `OQ-FL-004`.

## Traceability

`DEC-FL-001` supports `REQ-FL-001`, `REQ-FL-002`, `REQ-FL-003`, `RISK-FL-001`, and `TASK-FL-003`.

## Decision support policy

Material decisions must list options considered, pros and cons, final recommendation, source basis, verification method, and reversal trigger.

## Decision-blocking questions

`OQ-FL-004` is blocking for auth-provider-specific smoke tests. Other open questions can be handled through assumptions until they affect implementation.

## User-confirmed decisions

| Decision | Source type | Detail |
| --- | --- | --- |
| Product workflow | User-confirmed | Technicians submit notes and managers review follow-up work. |

## AI-recommended defaults

| Decision ID | Decision area | Final recommendation | Source basis |
| --- | --- | --- | --- |
| DEC-FL-001 | State and storage authority | Use a relational database for job notes, task status, tenant ownership, and attachment metadata; use private object storage only for photo bytes. | AI-recommended default; Standard-backed architecture separation |

## Options considered

For `DEC-FL-001`:

- Option A: relational database plus private object storage.
- Option B: store photo metadata and workflow state only in object metadata.
- Option C: store image bytes in the relational database.

## Pros and cons

For `DEC-FL-001`:

- Option A pro: clear state authority and scalable binary storage. Con: requires upload-intent flow.
- Option B pro: fewer tables. Con: object metadata becomes hidden workflow truth.
- Option C pro: simpler backup story. Con: database growth and poor binary handling.

## Final recommendations

Use Option A for `DEC-FL-001`.

## Source basis

- User-confirmed workflow requires structured status and manager review.
- Standard-backed architecture guidance supports separating system responsibilities.

## Assumptions and impact

`ASM-FL-001` limits launch scale. If scale grows, revisit worker and storage throughput before adding more photo workflows.

## Risks and mitigations

`RISK-FL-001` is mitigated by upload-intent authority, scoped object keys, and signed URL authorization tests.

## Reversal triggers

For `DEC-FL-001`, revisit storage authority if offline sync becomes launch-critical or if object storage provider constraints prevent scoped short-lived access.

## Decisions requiring user confirmation

Auth provider selection remains user-confirmation-needed before final smoke tests.

## No-shortcut review log

Rejected shortcut: direct public object URLs. It would make photo access easy but fails the tenant confidentiality requirement.

## Root-cause review notes, if existing repo mode

Not-applicable-with-reason: this fixture is greenfield and has no repo drift.

## Requirement impact map

| Decision ID | Requirement ID | Risk ID | Task ID |
| --- | --- | --- | --- |
| DEC-FL-001 | REQ-FL-003 | RISK-FL-001 | TASK-FL-003 |
