# SupportDesk Documentation Authority Lifecycle

## Purpose

Prevent stale documentation from governing future ticket-status implementation.

## Status

Repo-derived.

## Inputs used

- `auditability/documentation-audit.md`
- `assurance/source-of-truth-map.md`
- `assurance/surface-authority-map.md`

## Sources and basis

- Repo-derived: stale architecture doc and current code evidence.
- Standard-backed: SpecForge documentation authority lifecycle pattern.

## Assumptions

`ASM-SD-001` remains active. Impact: more stale docs may be discovered by wider audit.

## Decisions

Living docs in `docs/app-plan/` outrank stale legacy architecture prose after this repair.

## Open questions

No blocking questions.

## Traceability

`RCA-SD-001` and `RISK-SD-001` are governed by this lifecycle.

## Documentation authority hierarchy

1. Current code evidence for existing behavior.
2. Active `docs/app-plan/` source-of-truth docs.
3. Legacy docs marked as stale or historical.

## Active living docs

- `assurance/source-of-truth-map.md`
- `assurance/surface-authority-map.md`
- `auditability/decision-log.md`

## Historical docs

Legacy `docs/architecture.md` status-authority claims must be marked stale or revised.

## Generated inventory rules

Generated file lists cannot prove behavior unless regenerated from current code and checked against source paths.

## Marketing docs rules

Marketing copy may describe queue visibility but cannot define ticket status authority.

## Future backlog routing

Offline ticket state sync belongs in backlog until product scope explicitly requires it.

## Link and file-map sanity checks

Every source-of-truth doc must link to evidence paths or mark the claim as Assumption.

## Code-vs-doc audit rules

When status behavior changes, audit model, API DTO, queue UI, export, and docs in the same task.

## Deletion and retirement rules

Retire stale status-authority prose after the updated source-of-truth map is linked from the docs index.

## Agent instruction routing

Future agents must read `assurance/source-of-truth-map.md` before modifying ticket status, queue filters, exports, or audit history.
