# Release Rollout Runbook

## Status

Ready. Inputs used: REQ-MVP-1, REL-REVISION-1, and RISK-IMPL-1. Sources and basis: Standard-backed release gate guidance and Assumption with impact: feature flag storage exists.

## Related Requirement IDs

REQ-MVP-1 and REL-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-REL-1.

## Assumptions With Impact

Assumption: release flag `revisionGuidance.enabled` exists. Impact: create the flag before deploying write paths.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/config/features.ts`, `db/migrations/001_revision_guidance.sql`, `src/app/api/revisions/route.ts`, and `docs/app-plan/implementation/release-rollout-runbook.md`.

## Verification Method

Run release gate commands and observe monitoring before increasing exposure.

## Rollback Or Containment Notes

Rollback disables `revisionGuidance.enabled`, pauses writes, verifies read-only access, and starts restore if migration validation fails.

## Traceability

Traceability: REQ-MVP-1 -> REL-REVISION-1 -> TEST-RELEASE-1 -> RISK-IMPL-1.

## Feature Flags

Use `revisionGuidance.enabled` for controlled rollout and rollback.

## Deployment Steps

Deploy migration, deploy API, deploy UI disabled, run smoke, enable flag for internal users, then enable general access.

## Migration Order

Migration runs before API write enablement and after backup confirmation.

## Monitoring

Monitoring tracks submission volume, validation failures, unavailable state, latency, and rollback flag changes.

## Alerting

Alerting triggers on authorization failures, private data logging, elevated errors, and latency breach.

## Rollback

Rollback deactivates writes first, then evaluates migration reversal or restore.

## Support Playbook

Support confirms user id, revision id, status, and timestamp without asking for private draft text.

## Post-Release Checks

Post-release checks verify final output surface, permissions, metrics, logs, and documentation update path.
