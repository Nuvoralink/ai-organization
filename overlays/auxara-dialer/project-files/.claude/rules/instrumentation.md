---
paths:
  - "backend/src/routes/**/*"
  - "frontend/src/pages/**/*"
  - "frontend/src/components/**/*"
---
# Instrumentation Rules

Purpose: keep product analytics consistent enough to support phase gates, rollout evaluation, and churn signals.

## 1. Instrument user-facing features

- New user-facing features must emit tracking events before they ship.
- Use the centralized `AnalyticsEvent` service / table, not ad-hoc logs. `AnalyticsEvent.metadata` must pass through `safeAnalyticsMetadata`.
- Events do not store transcript content, raw audio, or extra PII.

## 2. Event naming convention

- Use `noun_past_tense_verb` event names such as:
  - `upload_completed`
  - `fix_expanded`
  - `annotation_created`
- Use past tense only.
- Do not invent alternate styles like camelCase or handler-like names.

## 3. Metadata discipline

- Each event type has a defined metadata shape in shared contracts (`EventMetadataMap`).
- Required metadata must be present for that event type.
- Unknown event types should be rejected rather than silently stored.

## 4. Avoid duplicate event meaning

- Do not emit the same event from frontend and backend unless that duplication is deliberate and documented.
- Backend pipeline events and frontend interaction events are different concepts; keep them separate.

## 5. Operational observability

- API requests should carry a request ID in logs and response headers so user-visible failures can be traced through backend logs.
- Error responses should include stable machine-readable codes where clients or operators need to distinguish validation, auth, database, readiness, and unexpected failures.
- Readiness checks belong in `/api/ready`; liveness belongs in `/api/health`. Do not use a process-only health response to decide whether traffic can safely route to a deploy. Storage readiness must actively call the configured driver health check; reporting `STORAGE_DRIVER` without probing the backend is not enough for production traffic.
- Queue, upload, analysis, auth, admin, and billing paths should log structured operational events without raw auth tokens, payment payloads, full transcripts, raw audio, or secrets.
- Runtime logs, API error envelopes, backend Sentry context, perf logs, audit metadata, AI usage metadata, analysis trace summaries/admin views, product-feedback diagnostics, and smoke artifacts must route through `backend/src/lib/telemetry.ts` or `scripts/lib/diagnosticRedaction.mjs`. Do not add route-local redaction wrappers when the shared authority can own the pattern.
- Live Sentry/log-drain validation is a production-evidence step, separate from local proof: local redaction regressions prove code behavior, but they do not prove production sink retention, access, scrubber settings, or received payload shape — verify against the live sink itself. *(An earlier revision cited an `srp-004-production-ops-closure-ledger.md` carried over from CoachAI; that ledger does not exist in this repo — corrected 2026-07-02.)*
- API errors should expose safe codes/messages/request IDs only. Do not return raw provider errors, Prisma `meta`, stack details, payload paths, query values, headers, cookies, tokens, transcripts, prompts, or storage paths in dev, test, or production.
- Frontend Sentry must use opaque user IDs plus safe org/role tags only; never email or full names. Frontend console diagnostics should use `logClientDiagnostic`, not `console.error(error)`.
- Security-sensitive events such as logout, password changes, invite sends, role changes, and admin actions should be auditable from backend-side records or structured logs.

## 6. AI usage metering is operational telemetry

- Paid AI usage belongs in `AiUsageEvent`, not generic `AnalyticsEvent`.
- Do not create direct provider SDK clients for paid calls. Use metered provider adapters so token usage, latency, provider/model, status, model role, capability, stage, session, trace, org, and cost estimates are captured.
- Stage names must be stable product/pipeline names, not stack traces. If the admin usage report shows `modelRole: "unknown"` or `at.someFunction.file...`, add explicit `AiUsageContext` or update stage inference.
- `AiUsageEvent.metadata` must pass through `safeAiUsageMetadata` at the shared `recordAiUsage` boundary. It is a flat typed allowlist containing only fields used by audited production callers, with prompt versions sourced from `aiPromptPolicy.ts`; unknown/speculative keys, identity/UUID keys, duplicated top-level attribution, arrays, objects, and nested provider payloads are rejected. It reuses `telemetry.ts`'s one secret/PII value-pattern registry and never carries raw prompts, transcript text, raw audio, customer content, identity, API keys, auth tokens, secrets, passwords, provider payloads, or payment payloads.
- Cost estimates are only as current as `AI_PRICE_TABLE_JSON`; keep `source` and `version` meaningful whenever deployed prices are updated.
