# Implementation Artifact Index

## Generation Context

Status: Ready for implementation planning validation. Inputs used: `docs/app-plan/product/02-prd.md`, `docs/app-plan/architecture/06-architecture.md`, and `docs/app-plan/auditability/decision-log.md`. Sources and basis: User-confirmed REQ-MVP-1, Standard-backed OWASP ASVS 5.0 control mapping, and Assumption with impact: greenfield file paths are proposed until the repo is scaffolded.

## Product Intent

Build a focused learning app where a student submits a draft, receives structured revision guidance, and sees the final improvement plan on the review screen without losing source attribution or privacy controls.

## Research Status

Research status: online research unavailable, baked-in baseline used. Standard-backed source entries used OWASP ASVS 5.0, WCAG 2.2, OpenAPI 3.1, and official Playwright documentation as implementation baselines.

## Source Package Version

Source package version: SpecForge fixture package v1.2.0. Traceability links: REQ-MVP-1, DEC-ARCH-1, RISK-IMPL-1.

## Artifact Map

- `implementation-roadmap.md`: release sequencing.
- `vertical-slice-specs.md`: SLICE-MVP-1 build contract.
- `repo-change-map.md`: proposed file ownership.
- `data-migration-and-backfill-plan.md`: schema and seed-data path.
- `api-and-contract-implementation.md`: endpoint and DTO contract.
- `ui-implementation-contract.md`: screen and state contract.
- `state-jobs-and-runtime-flow.md`: runtime state and queue policy.
- `security-privacy-implementation-controls.md`: security and privacy controls.
- `verification-and-test-harness.md`: commands and release gates.
- `release-rollout-runbook.md`: deployment, monitoring, and rollback.
- `codex-implementation-prompts.md`: safe future prompts.
- `implementation-risk-register.md`: implementation risk controls.

## Omitted Artifact Register

The AI decision matrix is omitted with not-applicable-with-reason: this fixture does not include runtime AI, generated content, semantic ranking, or model-owned decisions. Reactivation trigger: any feature using runtime AI, model prompts, scoring, classification, ranking, or generated content.

## Execution Order

1. Confirm source of truth in product and architecture docs.
2. Build persistence and API contracts.
3. Build UI states and final output surface.
4. Add verification harness and release gates.
5. Run rollback and documentation update checks.

## Quality Gate

Validation result: expected pass under strict implementation-artifact validation. The pack covers product intent, source of truth, data model, persistence, API integration, UI final surface, runtime state, validation and error states, security, privacy, permissions, tests, release, rollback, observability, and documentation update path.
