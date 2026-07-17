---
paths:
{{ENGINEERING_RULE_PATHS_YAML}}
---
<!-- TEMPLATE: the stack-level engineering rule. Save as {{RULES_DIR}}/engineering-rules.md (or .mdc). ADAPTS the global gauntlet to this stack — doesn't restate it. FILL/prune. -->

# {{PROJECT}} Engineering Rules

Purpose: keep development correct, safe, maintainable, consistent, and fast across {{WORKSPACES}}. This is the stack-level expression of the global gauntlet — it adapts the doctrine to this repo's structure; it does not restate the always-on rules.

Before any non-trivial backend, shared-contract, {{DB_TERM}}, security, {{PROVIDER_INTEGRATION_TERM}}, {{BILLING_TERM}}, queue, storage, deploy, or cross-layer change, read {{ARCH_BLAST_RADIUS_DOC}} and use it to identify connected producers, validators, persistence/read models, API contracts, jobs/scripts, {{EVENT_HANDLER_TERM}}, frontend consumers, docs, and verification gates. If a miss reveals a missing relation, update the blast-radius doc in the same turn.

When a change creates/modifies persisted derived rows, retry/outbox rows, queue/dispatch rows, cache/projection rows, aggregates, or provider-evidence rows — anything that can later act or make a visible claim — a **persisted derived state lifecycle matrix** is mandatory: for every source-of-truth mutation and every applicable row state (pending, queued, processing, retryable-failed, terminal-failed, completed, ambiguous, canceled, test-only), answer which authority created it, whether it can still act, what happens when the source changes / eligibility is revoked / the parent is archived, what evidence must never be overwritten, what the final surface should show, and which test proves it.

## Core priorities (in order)
1. correctness · 2. safety ({{SAFETY_INVARIANTS}} + tenant isolation) · 3. maintainability · 4. consistency · 5. speed. Never optimize short-term convenience over architectural drift.

## Repo architecture + file responsibilities
- Respect workspace boundaries ({{WORKSPACES}}). Don't move logic into a different workspace because it's faster to patch there.
- Routes stay thin; validation in schema modules; business logic in services/domain helpers/workers; pure transforms separate from transport handlers. Event handlers translate the event and hand off to a domain service.

## Reuse before create
Before adding a component/hook/helper/endpoint/mapper: search for an existing equivalent, extend it if it's the same concept, create new only when genuinely new. No near-duplicate helpers with slightly different names.

## Evolutionary architecture — seams, not guesses
For architecture/foundation work, inventory the approved future consumers and map each to the identity, authority, data, command, event, provider, artifact, and surface boundaries it must extend. Plant an extension seam now only when retrofit would be cross-cutting/expensive, the boundary is stable in domain terms, and a real current path exercises it. Otherwise document the extension point and extraction trigger; do not add dead flags/enums/tables or guessed provider methods. Prefer the repo's simplest viable runtime shape (normally a modular monolith), business-capability ownership, composition over inheritance, narrow domain ports/adapters, registered/versioned contracts/events, and explicit expand/backfill/repoint/retire migrations. A later feature may add policy/projections but may not create a parallel source of truth or provider/workflow path. Every planted seam needs liveness proof, a bypass scan, a retirement plan for the assumption it replaces, and a killer mutation; a concrete one-off with no approved second consumer remains concrete.

## Type safety + contracts
- Strict typing end to end; no `any` in production code (localize + comment if temporarily required). Explicit DTOs/domain types for machine-consumed data.
- API + persistence shapes used by the frontend, {{BILLING_TERM}}, audit, or an external consumer are contracts: additive changes preferred; don't rename machine-consumed fields casually; update producer AND consumer in the same change.

## Database + migrations
Schema changes are product-level changes: consider migration impact, old data, nullable transitions, defaults, {{RLS_TERM}} impact, rollback. Keep {{SCHEMA_FILE}} + the matching migration + runtime config in sync. {{MIGRATION_RUNBOOK_CLAUSE}}

## Quality gates (no task is complete until these pass for the touched area)
- **Run `npm run verify` before committing** — it mirrors CI exactly ({{VERIFY_SEQUENCE}}). `npm run gates:all` ALONE is NOT enough — it omits lint/format/typecheck, which is how a banned import + unformatted files reach a RED CI. The full `verify` surfaces the whole cascade locally, before the commit.
- No dead code or placeholder logic left behind. When touching {{HOT_SUBSYSTEMS}}, run the relevant regression scripts and confirm contract compatibility with existing persisted rows.

## Refactor + cleanup discipline
Small composable refactors over rewrites; preserve behavior unless the task changes it. When replacing legacy code, remove the dead path (grep the old symbol repo-wide to confirm it's gone, not orphaned); mark any compatibility bridge with why it exists and when it can go.

## Logging + observability + metering
Log enough to diagnose; never log secrets/tokens/payment payloads/{{PII_KINDS}}/audio-or-file paths in unbounded contexts. {{METERING_CLAUSE}} <!-- FILL if the product has paid provider calls: "All paid provider calls go through metered adapters with stable stage/role/capability/provider/model/tokens/cost; usage rows never persist raw prompts/transcripts/customer content/secrets; provider routing centralized in {{PROVIDER_POLICY_MODULE}}." Delete if none. -->

## Definition of done
Blast-radius doc checked (+ updated if a relation was exposed); architecture still coherent; no duplicate abstraction; architecture/foundation work carries a future-consumer/seam matrix and proves every planted seam through a current path; no speculative framework or later parallel authority is authorized; types coherent; contracts stable; tests/regressions considered; security/privacy/tenant-isolation considered; {{SAFETY_INVARIANTS}} preserved where applicable; deferred follow-ups named with a reason, never silently dropped.
