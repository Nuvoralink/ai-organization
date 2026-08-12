---
paths:
  - 'packages/platform/**'
  - 'packages/contracts/**'
  - 'registries/**'
  - 'scripts/run-postgres-integration.mjs'
  - 'tests/setup/**'
---

# Security, data, and effect authority

All tenant data is scoped in every query and backed by forced PostgreSQL RLS. External and model output is schema-validated before use. Logs and proof artifacts must not contain secrets, raw audio, transcripts, customer PII, provider payloads, or browser snapshots with lead data.

Effects require proposal, immutable input/precondition digests, authorization, current revocation/writer epochs, a monotonic claim fence, idempotency, and an exact durable terminal receipt. Unknown outcomes stay blocked pending reconciliation. Calendar automation receives typed lead fields and constrained availability—not DOM access or a generic browser tool. Live contact, browser submission, billed calls, deployments, migrations, and secrets remain human-gated.
