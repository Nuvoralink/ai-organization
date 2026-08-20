# Nuvora Link agent router

Nuvora Link is a single-company internal appointment-setting and team-operations product for the NuvoraLink business. Existing `organizationId` scoping remains a required security, data-isolation, test, and import-integrity boundary; it is not a mandate to build tenant onboarding, self-service tenancy, or generalized SaaS infrastructure. Treat current implementation as evidence, not architecture to preserve. Re-derive product intent from accepted ADRs, governance, persisted contracts, and user-visible flows; fix the earliest wrong authority rather than patching the visible symptom.

The universal orchestration doctrine applies. The single orchestrator owns decomposition, delegation, evidence reconciliation, and the final conclusion. Material architecture or workaround-shaped work starts with `premise-and-architecture-challenger`; a large slice starts with `sprint-kickoff-auditor`.

## Read-first product authority

- `docs/PRODUCT_AND_CAPABILITIES.md` routes product intent but is verified against code and the latest ADR.
- `docs/adr/` owns accepted architecture decisions. `docs/adr/ADR-006-retire-built-in-dialer.md` permanently retires built-in telephony while preserving manual outcome entry.
- `docs/nuvo/NUVO_GOVERNANCE_RULEBOOK.md`, `NUVO_PERMISSION_MATRIX.md`, and `NUVO_TOOL_REGISTRY.md` govern Nuvo.
- `apps/api/prisma/schema.prisma` owns persisted domain shapes.
- `.ai-organization/policies/action-authority.v1.json` governs state-changing and external actions.

## Project crown jewels

- Organization and object scope are server-authoritative. MANAGER inherits BOOKER behavior wherever booker capabilities apply.
- Appointments and callbacks preserve operational ownership, `AppointmentEntryOrigin`, and `MeasurementScope`; operational-only work must not affect KPIs.
- Business windows use organization timezone and exact exclusive UTC end bounds. Metrics retain their actual source of record.
- Each side effect has one worker/outbox owner and durable idempotency for retry and concurrency.
- Money, provider, and Nuvo actions remain server-authoritative, confirmed and audited where required.
- Telnyx/Dialpad calling, softphone, provider call history, phone-number management, reputation/cooling, and number-change flows are retired and must stay absent. Manual call results and dispositions remain active.

## Rule routing

- `.claude/rules/operations-integrity.md` — appointments, callbacks, analytics, schedules, time, queues, notifications, accounting, providers, and retirement work.
- `.claude/rules/nuvo-governance.md` — Nuvo code, tools, policy, prompts, Telegram behavior, and governance docs.
- `.claude/rules/security-rules.md` — auth, organization-scoped data, uploads, billing, provider, webhook, and secrets surfaces.
- `.claude/rules/frontend-rules.md` — visible web work; Claude Design approval is blocking before implementation.
- `.claude/rules/centralization-doctrine.md` — registries, shared contracts, configuration, duplicated decisions, and replacement work.
- `.claude/rules/test-intent.md` — every test-bearing path.
- `.claude/rules/functionality-first-delivery.md` — functional/product-behavior code: prove intended behavior on the deployed Nuvora Link site before broad hardening; applicable independent auditors are required before merge and classify BLOCK versus verified durably-backlogged FIX-NEXT; docs/mocks/planning are exempt.

## Fleet

Project specialists are `operations-integrity-auditor`, `doctrine-drift-auditor`, and `test-runner`. Universal premise, kickoff, adversarial, functionality-parity, performance, journey, UI, release, and security lenses remain active. Every read-only lens reports per-criterion evidence and surfaces not reached. Reviewers never edit or run tree-mutating git.

For implementation, use a self-contained bounded brief and `npm run agent:run -- --timeout-ms <n> --label <task-id> --brief <path> -- <command> ...`. The brief's single `CLAUDE_DISPATCH_BOUNDARY_JSON` row owns the coordination claim.

Every report ends with `Doctrine-loop findings: none` or routes each finding to the smallest controlling gate, rule, test, brief, or agent checklist.
