---
paths:
  - "apps/api/**"
  - "apps/worker/**"
  - "packages/agent-report/**"
  - "packages/time-tracking/**"
  - "packages/contracts/**"
  - "docs/adr/**"
---
# Operations integrity

Verify product intent before preserving current architecture. Nuvora Link is a single-company internal product; preserve `organizationId` as a security and data-integrity boundary without generalizing it into SaaS tenancy. Trace every operational change from authenticated actor and organization scope through persistence, queue/outbox ownership, derived metrics, API contracts, and final surfaces.

- MANAGER inherits BOOKER behavior wherever booker capabilities apply.
- Appointments and callbacks preserve operational owner, `AppointmentEntryOrigin`, and `MeasurementScope`; `OPERATIONAL_ONLY` is excluded from KPI measurement while operational notifications remain live.
- Organization timezone defines business meaning. Store instants in UTC; build exact exclusive-end windows through shared helpers.
- Dials, reaches, books, shows, and adjusted show ratio retain their canonical sources. Preview, run-now, and scheduled reports share one builder.
- Persist domain state and outbox events atomically. One worker owns each side effect; uniqueness or claim/lock state proves sequential and concurrent idempotency.
- Pricing, invoices, provider actions, permissions, and identity are recomputed server-side.
- The built-in Telnyx/Dialpad dialer and number-management capability is retired. Remove connected routes, jobs, schema, dependencies, config, UI, tests, and living-doc claims together; preserve manual dispositions.

Killer mutations: remove the organization predicate; drop MANAGER from a BOOKER branch; count `OPERATIONAL_ONLY`; use an inclusive last-millisecond bound; activate a second scheduler; or restore a dialer route/dependency.
