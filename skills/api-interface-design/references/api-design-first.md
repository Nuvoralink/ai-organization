---
name: api-design-first
description: Use when designing or building HTTP APIs — spec-first OpenAPI workflow, REST conventions, versioning, auth model, rate limiting, idempotency keys, error envelope, and observability notes. Produces the OpenAPI contract plus error/auth/idempotency/observability artifacts that frontend, mobile, security, and reliability skills consume. For endpoint-level or GraphQL security review load `security-review-hardening`.
metadata:
  portable: true
  compatible_with:
  - claude-code
  - codex
---

# API Design First
Acknowledgement: Shared by Peter Bamuhigire, techguypeter.com, +256 784 464178.

Design APIs as contracts before code. This skill produces the OpenAPI 3.1 contract and its companion auth / error / idempotency / observability artifacts that downstream frontend, mobile, SDK, security, and reliability skills depend on.

<!-- dual-compat-start -->
## Use When

- Designing a new HTTP API (REST or GraphQL decision open), or adding endpoints to an existing API.
- Normalising an existing API against the house contract (envelope, error model, versioning, rate limits).
- Producing the OpenAPI contract that SDK, frontend, mobile, contract-testing, and security skills will consume.
- Choosing an auth method and writing the auth/role matrix for a new service.
- Defining idempotency keys and observability notes handed to `reliability-engineering` and `observability-monitoring`.

## Do Not Use When

- The task is purely client-side consumption of a third-party API (load the relevant SDK or integration skill).
- The task is full threat modelling — load `security-review-hardening`; this skill only records the auth model.
- GraphQL-specific hardening is needed — load `security-review-hardening` and verify version-specific mechanics against the chosen GraphQL implementation's primary documentation.

## Required Inputs

- Context map and critical-flow table from `architecture-saas-design`.
- Access-pattern list from `database-design-engineering`.
- Consumers, trust boundaries, and latency budget for each endpoint.
- Tenancy model (single-tenant, shared schema, schema-per-tenant) so `tenant_id` propagation can be proven.

## Workflow

- Read this reference, then use the relevant self-contained sections below for workflow, auth, idempotency, error, and REST decisions.
- Apply the six-step design workflow before writing any code.
- Produce the OpenAPI contract from the workflow, decision tables, response envelope, and output fields in this document, adapted to the target repository's owning contract format.
- Record the auth model, error model, idempotency map, and observability notes alongside the spec.
- Run the implementation checklist before merging.

## Quality Standards

- Spec is the source of truth; code follows the spec, never the reverse.
- Every endpoint has documented auth, error codes, rate limits, pagination where relevant, and observability notes.
- Tenant scope is derived from the auth token, never from a request body or query string.
- Breaking changes require a new major version; existing versions are frozen except for bug fixes.
- British English, no emojis, language-tagged code fences.

## Anti-Patterns

- Writing code first and "generating" the spec afterwards — the spec loses its role as contract.
- Accepting `tenant_id` from the request body — enables cross-tenant data leaks.
- Returning 403 for wrong-tenant lookups — leaks existence; return 404.
- Wildcard `Access-Control-Allow-Origin: *` with credentials — browsers ignore, auth breaks, security hole opens.
- Storing API keys in plaintext — a database leak becomes an immediate credential leak.
- Mutating an existing version's response schema — every client with hard-coded parsers breaks.

## Outputs

- OpenAPI 3.1 contract covering every endpoint, schema, error, rate-limit header, and example.
- Auth model: selected method, role/scope matrix, token lifetime, revocation strategy.
- Error model conforming to the standard envelope with documented error codes.
- Idempotency map: which endpoints require `Idempotency-Key`, scope, TTL.
- Observability notes: per-endpoint span names, SLO class, log fields, audit events.
- Implementation checklist result.

## Evidence Produced

| Category | Artifact | Format | Example |
|----------|----------|--------|---------|
| Correctness | OpenAPI contract | Markdown doc plus OpenAPI YAML covering paths, schemas, and error responses | `docs/api/openapi-checkout.yml` |
| Correctness | Contract test results | CI log or recorded report from API contract tests against the OpenAPI spec | `docs/api/contract-tests-2026-04-16.md` |

## References

- [API and interface design](api-and-interface-design.md) — interface ownership, compatibility, pagination, errors, and idempotency across API styles.
- [AI metering and billing](ai-metering-billing.md) — metering, quota, and billing-facing API contracts.
- This document contains the OpenAPI workflow, REST conventions, auth choices, response envelope, idempotency map, and review checklist it requires; absent legacy deep dives are not assumed.
<!-- dual-compat-end -->

## Prerequisites

Load these skills first:

- `architecture-saas-design` — produces the context map and critical-flow table consumed below.
- `database-design-engineering` — produces the access-pattern list that shapes resource design.
- Apply the active global engineering doctrine and the target repository's real release gates.

Load alongside:

- `security-review-hardening` for threat modelling of the auth model produced here, including GraphQL-specific review grounded in the implementation's primary documentation.

## When this skill applies

- A new service is being designed and needs its HTTP surface defined.
- A feature adds endpoints to an existing API and must follow the house contract.
- An existing API is being normalised for versioning, error envelope, or rate limits.
- A partner integration requires a published OpenAPI contract.
- Mobile or SDK work is blocked on a stable contract for code generation.

## Inputs

| Artifact                 | Produced by                     | Required? | Why                                                                |
|--------------------------|---------------------------------|-----------|--------------------------------------------------------------------|
| Context map              | `system-architecture-design`    | required  | Defines service/module boundaries the API sits inside              |
| Critical-flow table      | `system-architecture-design`    | required  | Supplies latency/availability targets for endpoints                |
| Access-pattern list      | `database-design-engineering`   | required  | Read/write shapes drive resource model and pagination choices      |
| Failure-mode list        | `system-architecture-design`    | optional  | Informs degradation behaviour on dependency outages                |
| Threat model             | `vibe-security-skill`           | optional  | Informs auth, rate-limit, and abuse-case rules                     |
| Tenancy model            | `database-design-engineering`   | required  | Proves tenant isolation at the API boundary                        |

## Outputs

| Artifact                | Consumed by                                                        | Template                                                                                  |
|-------------------------|--------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| OpenAPI 3.1 contract    | frontend, mobile, SDK, `testing-strategy-and-tdd` (contract tests) | target repository's owning API contract, using the fields in this document                 |
| Error model             | frontend, mobile, `testing-strategy-and-tdd`                       | inline response-envelope contract below                                                     |
| Auth model              | `security-review-hardening`, clients, and tenant auth consumers    | inline in spec (`components.securitySchemes`) plus the role/scope matrix below              |
| Idempotency map         | `observability-release-engineering` and side-effect owners         | inline decision table in this document                                                      |
| Observability notes     | `observability-release-engineering`                                | inline per-endpoint telemetry and audit table                                                |

## Non-negotiables

- OpenAPI spec is written before a single endpoint is implemented.
- Tenant scope comes from the auth token, never from the request body or query string.
- Every response carries the mandatory security headers from `auth-and-security.md`.
- Every POST that causes an external side effect (payment, email, webhook, inventory movement) requires an `Idempotency-Key`.
- Every new endpoint is added to the observability notes table before merge.
- Breaking changes never mutate an existing version; they ship as a new major version.

## Decision rules

### Auth-method selection

| Caller shape                                          | Choose                        | Failure mode if wrong                                                  |
|-------------------------------------------------------|-------------------------------|------------------------------------------------------------------------|
| Server-to-server, trusted partner, long-lived         | API Key (SHA-256 hashed)      | JWT: can't be revoked fast; raw-key storage: leak = instant compromise |
| Web app with user consent, third-party accessed       | OAuth2 Authorization Code     | Implicit flow: token leaks via URL history; ROPC: phishing vector      |
| Service-to-service with scopes, standards-compliant   | OAuth2 Client Credentials     | API key: no standardised scopes or introspection                       |
| First-party mobile app / SPA                          | JWT access + refresh (short)  | Long-lived JWT: revocation impossible; session cookie: breaks on iOS   |
| Legacy / tightly-controlled client with no user flow  | OAuth2 ROPC (last resort)     | Credentials pass through the API surface — avoid when any alternative  |

### Versioning action

| Change                                                | Action                                         | Failure mode if wrong                                         |
|-------------------------------------------------------|------------------------------------------------|---------------------------------------------------------------|
| Adding optional field, endpoint, or enum value        | Ship in current version, mark non-breaking     | Spawning a new version for a safe change: client churn        |
| Removing or renaming a field                          | Ship as new major version, sunset old          | Mutating existing version: silent parsing failures in clients |
| Changing response shape or required params            | Ship as new major version, sunset old          | As above                                                      |
| Bug fix that narrows behaviour clients may depend on  | Ship behind a header flag, deprecate quietly   | Silent fix: clients relying on the bug break in production    |

### Idempotency requirement

| Endpoint class                                | Require `Idempotency-Key`? | TTL      | Failure mode if skipped                      |
|-----------------------------------------------|----------------------------|----------|----------------------------------------------|
| Payment, refund, charge                       | yes                        | 24 h     | Double charges on retry                      |
| Order/invoice creation                        | yes                        | 24 h     | Duplicate orders on network retry            |
| Outbound email / webhook dispatch             | yes                        | 7 d      | Duplicate user-visible side effects          |
| Inventory movement                            | yes                        | 24 h     | Phantom stock changes                        |
| Read-only (GET, HEAD)                         | no                         | n/a      | n/a                                          |
| Partial update without external effect        | optional                   | 1 h      | Benign — but worth enabling on sensitive ops |

### Cache-Control choice

| Resource shape                     | Header                                | Failure mode if wrong                            |
|------------------------------------|---------------------------------------|--------------------------------------------------|
| Public, rarely changes (prices)    | `public, max-age=3600`                | `no-store`: wastes bandwidth, slow clients       |
| Per-user private                   | `private, max-age=300`                | `public`: leaks via shared CDN cache             |
| Sensitive or mutable (auth, cart)  | `no-store`                            | `public`: security incident                      |

### GraphQL vs REST

| Situation                                     | Choose                |
|-----------------------------------------------|-----------------------|
| Multiple clients with diverging field needs   | GraphQL               |
| Public API, webhooks, file uploads            | REST                  |
| Simple CRUD                                   | REST                  |
| Real-time subscriptions                       | GraphQL subscriptions |

Failure mode if wrong: GraphQL-first for simple CRUD buys query-complexity DoS risk with no field-flexibility payoff; REST-first for multi-client heavy-reads pushes clients into over-fetch and N+1 round trips.

## Design workflow (six steps)

1. Define consumers, latency expectations, and trust boundaries.
2. Write the API action plan, then model resources and actions around business concepts, not controller names.
3. Write the OpenAPI contract, including auth, validation, errors, and pagination.
4. Prove tenancy, authorisation, and idempotency rules before implementation.
5. Design observability: request IDs, audit events, deprecation path, rate-limit telemetry.
6. Validate that the API can evolve without breaking current consumers.

The workflow, response-envelope examples, decision tables, and review checklist in this document are the self-contained spec skeleton.
For partner, public, long-lived, or workflow-heavy APIs, apply the lifecycle, compatibility, idempotency, and observability checks in [API and interface design](api-and-interface-design.md).
For consumer ergonomics, endpoint naming, pagination, embedding, versioning, and test expectations, use the design workflow and strategy rules below.

## Response envelope

The canonical envelope produced by this skill — every downstream client depends on it:

```json
{
  "success": true,
  "data": { "id": 123 },
  "meta": { "page": 1, "per_page": 25, "total": 142 }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The amount field is required.",
    "documentation_url": "https://api.example.com/errors#VALIDATION_ERROR",
    "fields": { "amount": ["Required"] }
  }
}
```

The strategy rules and anti-patterns below own the status-code and pagination mechanics for this reference.

## Anti-patterns

- **Spec-after-code.** The team writes endpoints and exports the OpenAPI spec from code annotations. Fix: draft the spec in a PR first, get sign-off from at least one consumer, then implement.
- **Tenant from body.** `POST /api/v1/invoices { "franchise_id": 42, "amount": 100 }`. Fix: derive `franchise_id` from the authenticated token server-side; ignore any tenant field on the wire.
- **403 on wrong-tenant.** `GET /api/v1/invoices/999` returns `403 Forbidden` when invoice 999 belongs to another tenant. Fix: return `404 Not Found` — 403 leaks that the resource exists.
- **Wildcard CORS with credentials.** `Access-Control-Allow-Origin: *` plus `Access-Control-Allow-Credentials: true`. Fix: echo only origins from an allow-list; set credentials true only for those origins.
- **Raw API key storage.** `INSERT INTO api_keys (key) VALUES ('sk_live_abc123')`. Fix: store `key_hash = SHA-256(key)`, return the raw key once on creation, never again.
- **Unversioned breaking change.** The team removes a field from `GET /api/v1/invoices/{id}` because nobody "should" be using it. Fix: ship as `v2`, keep `v1` unchanged, emit `Deprecation` + `Sunset` headers on `v1`.
- **No idempotency on payments.** `POST /api/v1/payments` charges the card. Network retry charges it again. Fix: require `Idempotency-Key` header, store `(tenant, user, key) -> response` for 24 h, replay the stored response on duplicate.
- **Unbounded page size.** `GET /api/v1/invoices?per_page=100000`. Fix: clamp `per_page` to a hard maximum (e.g. 100) server-side.

## Read next

- `observability-release-engineering` — consumes observability, idempotency, versioning, migration, and rollback decisions.
- `security-review-hardening` — consumes the auth model to build the threat model and abuse-case list.
- `testing-strategy-and-tdd` — consumes the API contract for positive, negative, compatibility, and idempotency tests.

## References

- [API and interface design](api-and-interface-design.md) — broader interface contracts and evolution guidance.
- [AI metering and billing](ai-metering-billing.md) — provider usage, quotas, budgets, and billing-facing API contracts.
- The current file is authoritative for its embedded six-step API workflow; no legacy redirect or unbundled reference is required.
