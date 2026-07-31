---
paths:
  - "apps/api/src/modules/auth/**"
  - "apps/api/src/middleware/**"
  - "apps/api/src/modules/accounting/**"
  - "apps/api/src/modules/integrations/**"
  - "apps/api/src/modules/payment-agreements/**"
  - "apps/api/src/modules/notifications/**"
  - "apps/api/src/app.ts"
  - "apps/api/prisma/**"
---
# Security and organization boundaries

Authenticate and authorize on the server. Scope every object lookup and mutation by organization plus permitted relationship; client state and hidden UI are UX only. This is an internal security, data-isolation, test, and import-integrity boundary, not a product requirement for tenant onboarding or generalized SaaS infrastructure. Normalize and schema-validate untrusted input before business logic. Verify webhook signatures and replay resistance before effects.

Secrets remain environment-managed and never enter code, logs, telemetry, errors, or the overlay. Minimize provider scopes and model/tool output fields. Treat uploads, documents, provider payloads, and AI output as untrusted. Redact PII from logs and retain only the minimum required under the accepted retention policy.

Money and entitlement inputs are server-derived. External actions and production writes follow the action-authority policy.

Killer mutations: remove an organization predicate, trust a body user id, log a provider payload, skip webhook replay protection, or use a client-supplied price.
