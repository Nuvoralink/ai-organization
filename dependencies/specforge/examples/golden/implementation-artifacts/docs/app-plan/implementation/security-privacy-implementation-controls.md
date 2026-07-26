# Security Privacy Implementation Controls

## Status

Ready. Inputs used: REQ-MVP-1, SEC-REVISION-1, PRIV-REVISION-1, and DEC-ARCH-1. Sources and basis: Standard-backed OWASP ASVS 5.0 and User-confirmed private student draft boundary.

## Related Requirement IDs

REQ-MVP-1, SEC-REVISION-1, and PRIV-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-SEC-1.

## Assumptions With Impact

Assumption: cookie auth is used. Impact: CSRF protection is required for mutation routes.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`src/app/api/revisions/route.ts`, `src/lib/auth/session.ts`, `src/lib/revisions/repository.ts`, `src/lib/logging/redaction.ts`, and `tests/revisions.security.spec.ts`.

## Verification Method

Run auth, authorization, CSRF, input handling, output handling, privacy, retention, and dependency controls tests.

## Rollback Or Containment Notes

Containment disables revision writes if private draft leakage or authorization bypass is detected.

## Traceability

Traceability: REQ-MVP-1 -> SEC-REVISION-1 -> TEST-SEC-1 -> RISK-IMPL-1.

## Authentication

Require an authenticated session for every revision route.

## Authorization

Authorize owner id before read, update, or delete operations.

## CSRF

Protect POST `/api/revisions` when cookie auth is active.

## Input Handling

Validate draft length and strip unsupported content before persistence.

## Output Handling

Return only fields allowed by the DTO and never echo hidden server metadata.

## Secrets

No secrets are read by the revision feature.

## Logging

Logging records event ids and status only; draft text is redacted.

## Privacy

Draft text is private student data with no analytics payload copy.

## Retention

Retention follows the app deletion policy and removes draft text with the revision record.

## Abuse

Rate limits reduce spam submissions and repeated validation failures.

## Dependency Controls

Dependency controls require lockfile review before adding editor or sanitizer packages.
