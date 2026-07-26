---
name: specforge-data-contracts
description: Create data model, data dictionary, API contracts, validation rules, error contracts, privacy notes, and integration contracts.
---

# Data and API Contract Documentation


Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` before drafting or revising docs.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Every important requirement must be specific, testable, and traceable to a user answer, repo evidence, official source, or explicit assumption.
- Every requirement must have an ID, source, affected role or component, data touched, risk level, verification method, and related docs.
- Every generated document must include `Sources and basis`, even when the source is only user input or repo evidence.
- Do not use placeholders, filler text, generic best-practice language, or broad claims that do not change implementation behavior.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Maintain a research ledger at `docs/app-plan/auditability/research-ledger.md` when research affects requirements.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, and risks must use the same IDs and names.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose shortcuts, workaround fixes, or vague placeholders.
- Apply the guided interview protocol in `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` and no-shortcuts protocol in `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material choices, recommendations, and user-facing questions.
- Use private multi-option deliberation for material decisions. Do not reveal private reasoning; output only decision cards, concise rationale, pros and cons, recommendation, confidence, and reversal triggers.
- Run root-cause analysis for conflicts, stale docs, missing requirements, weak decisions, risky shortcuts, and repo-document mismatches before proposing fixes.
- Prefer durable, standard-aligned solutions over quick fixes. If a temporary workaround is unavoidable, label it `Temporary`, explain the risk, define the proper fix, and set the removal trigger.
- Keep the scope proportional to the app. Avoid both under-specification and needless enterprise bloat.
- Label facts as User-confirmed, Repo-derived, Standard-backed, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and say that online research was unavailable.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.


## Purpose

Produce precise data and integration contracts so frontend, backend, database, jobs, and external services do not drift.

## Required research pass

Use this prompt:

```text
Research the newest official guidance for data modeling, API contracts, validation, error handling, auth declaration, and schema evolution for [selected framework/database/API style]. Include OpenAPI or the selected contract standard. Check official docs for the framework, ORM, database, auth provider, and third-party integrations. Capture versions and URLs.
```

Use OpenAPI for HTTP APIs unless the app clearly uses GraphQL, gRPC, AsyncAPI, or another standard. If online research is unavailable, use OpenAPI 3.2.0 as the baked-in HTTP API baseline from the shared source map. For public or authenticated APIs, include OWASP API Security Top 10 and OWASP REST or GraphQL Cheat Sheet guidance in the research pass.

## Inputs

- Product scope
- User roles and permissions
- Screen map
- Architecture
- Security design
- Existing schema or API code, if any

## Output files

Create or update:

- `docs/app-plan/data-and-api/08-data-model-and-data-contracts.md`
- `docs/app-plan/data-and-api/09-api-and-integration-contracts.md`
- API schema file if appropriate, such as `docs/app-plan/data-and-api/openapi.yaml`

## Data model requirements

Include:

- Data inventory
- Data classification
- Entity relationship model
- Data dictionary
- Field-level validation rules
- Required and optional fields
- Uniqueness rules
- Index assumptions
- Ownership and access rules
- Data lifecycle
- Retention and deletion
- Export requirements
- Backup and restore notes
- Migration rules
- Audit logging needs
- Privacy notes

For each entity, define:

- Entity name
- Purpose
- Owner
- Fields
- Types
- Validation
- Sensitive data flag
- Access rules
- Creation source
- Update source
- Deletion behavior
- Audit requirements

## API contract requirements

For each endpoint or operation, define:

- Operation ID
- Purpose
- User role allowed
- Auth required
- Request schema
- Response schema
- Error responses
- Validation rules
- Rate limits
- Idempotency rules
- Pagination rules
- Sorting and filtering rules
- Side effects
- Events emitted
- Logging rules
- Security notes
- Test cases

## Error contract

Define one consistent error shape:

- Error code
- User-safe message
- Developer detail, if safe
- Request ID
- Field errors
- Retry hint
- Rate limit metadata, if applicable

Never expose secrets, internal stack traces, tokens, database queries, or sensitive personal data in errors.

## Integration contracts

For every third-party service:

- Service name
- Purpose
- Data sent
- Data received
- Auth method
- Required scopes
- Rate limits
- Failure behavior
- Retry strategy
- Timeout strategy
- Webhook verification
- Data retention concern
- Exit plan

## Existing repo mode

When a repo exists:

- Infer contracts from routes, controllers, schemas, types, validators, migrations, models, tests, and generated clients.
- Prefer existing source-of-truth schema files over prose docs.
- Record evidence paths.
- Flag mismatches between docs and implementation.
- Do not change schema or code unless explicitly asked.

## Quality gate

Before finishing, check:

- Every major feature has data mapped.
- Every role has data access rules.
- Every API operation has auth and error behavior.
- Sensitive data is classified.
- Retention and deletion are documented.
- API docs do not contradict architecture or security design.

