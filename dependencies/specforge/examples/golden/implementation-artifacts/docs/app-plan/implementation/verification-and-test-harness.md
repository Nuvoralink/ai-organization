# Verification And Test Harness

## Status

Ready. Inputs used: REQ-MVP-1, TEST-REVISION-1, and DEC-ARCH-1. Sources and basis: Standard-backed Playwright, OpenAPI 3.1, OWASP ASVS 5.0, and WCAG 2.2 guidance.

## Related Requirement IDs

REQ-MVP-1 and TEST-REVISION-1.

## Related Decisions and ADRs

DEC-ARCH-1 and ADR-TEST-1.

## Assumptions With Impact

Assumption: npm scripts exist. Impact: replace commands with repo-derived commands during implementation if package scripts differ.

## Open Questions

None blocking.

## Affected Files Or Proposed File Locations

`tests/revisions.spec.ts`, `tests/revisions.contract.spec.ts`, `tests/revisions.e2e.ts`, `tests/revisions.security.spec.ts`, and `package.json`.

## Verification Method

Verification method is the command suite below plus source-to-surface assertions.

## Rollback Or Containment Notes

Containment blocks release if any release gate fails.

## Traceability

Traceability: REQ-MVP-1 -> TEST-REVISION-1 -> SLICE-MVP-1 -> RISK-IMPL-1.

## Unit

Unit tests cover schema validation and repository behavior.

## Integration

Integration tests cover persistence and route-to-repository flow.

## Contract

Contract tests cover request DTO, response DTO, status codes, and privacy-safe errors.

## E2E

E2E tests submit a draft and verify the final user-visible review screen.

## Accessibility

Accessibility checks cover labels, focus order, keyboard flow, contrast, and error announcements.

## Security

Security tests cover authentication, authorization, CSRF, rate limits, and logging redaction.

## Performance

Performance checks keep submit and review within the NFR budget.

## Migration

Migration checks run schema creation and rollback in an isolated test database.

## Smoke

Smoke checks run submit, retrieve, unavailable, and rollback flag paths.

## Release Gates

Release gates require unit, integration, contract, E2E, accessibility, security, performance, migration, smoke, and documentation update proof.

## Commands

Commands: `npm test`, `npm run typecheck`, `npm run test:e2e`, `npm run test:security`, and `npm run db:migrate:test`.
