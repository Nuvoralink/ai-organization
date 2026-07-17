---
name: full-slice-planner
description: Use when AUTHORING or refining an implementation plan for slices, architecture changes, product features, bug-fix plans, or refactors that needs full blast radius, product intent, source-of-truth tracing, definitions of done, test ladders, docs impact, assumption discipline, decision locking, and root-cause prevention. Trigger when the user asks for a plan or full implementation plan. To review or pressure-test a plan that already exists, use plan-pressure-test.
---

# Full Slice Planner

Use this skill to produce implementation plans that are product-intent first, source-of-truth driven, testable, scoped, and hard to misunderstand.

## The Standing Gauntlet — run on every plan (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. If the plan can't satisfy a gate, it is not ready — keep tightening or flag which gate fails.

1. **Verify, never assume.** Every load-bearing claim the plan rests on is traced to the actual code/data/output; a report, doc, recalled fact, or status line is a *lead*, not proof (see "Verify Load-Bearing Claims").
2. **Outputs over statuses.** Proof comes from the real artifact (persisted row, rendered surface, raw model response); distrust a green test or a grep returning 0 and re-check a different way.
3. **Tests must bite.** Each planned test must FAIL if the behavior regresses — name the mutation that should break it; reject vacuous or stale tests (see "Testing And Proof Quality Discipline").
4. **Whole blast radius — trace every caller and every feeder, in every file.** Trace the dependency graph both ways — every consumer/caller AND every input/feeder of the behavior, grepped repo-wide — and update each (see the matrices). Fixing a function = updating every call site in every file, not just the definition.
5. **Replace, don't layer.** A new central/unified authority deletes or demotes the old path it supersedes; the plan greps the old symbol to prove it's gone, not orphaned (see "Retirement Sweep Discipline").
6. **No parallel system.** Confirm the thing isn't already built somewhere unchecked; extend the existing abstraction instead of standing up a second one.
7. **Best, most durable way.** Weigh an alternative; choose the stable/durable/secure/scalable root fix over the convenient symptom patch.
8. **Pressure-test the thing itself.** Does it need to exist? Could it live elsewhere for better UX? Already built? How do comparable products solve it? Over-engineered, or too loose/sloppy? Security and other load-bearing concerns weighed?
9. **Stop before you quick-fix.** Any bug found mid-build: verify it's real → check if already fixed/mis-wired or legacy-to-delete → pressure-test its purpose → hypothesize → verify the fix is best → verify assumptions → run the rest of the gauntlet → then implement or flag. Never patch in place on reflex.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## What This Skill Must Prevent

The first draft must not be a "reasonable feature plan" that later becomes a different architecture after pressure testing. It must force the architecture questions early enough that the first implementation-ready plan already names:

- the actual trust, timing, data, or decision backbone, not only the visible route or UI
- every producer that can create, update, cancel, or stale a downstream row
- every downstream consumer that can display, notify, export, aggregate, or act on the result
- exact unavailable/error/unknown states instead of silent fallbacks
- exact state transitions, terminal evidence, retry behavior, and history preservation
- exact lifecycle handling for persisted derived rows in every actionable state, not only the happy-path or currently-visible state
- realistic adapter/input fixture coverage when external or user-supplied data enters the system, not only clean canonical examples
- concurrent duplicate-trigger safety for any mutation that claims idempotency, not only retry-after-success behavior
- route/API/job/export inventory drift checks when implementation paths or public contracts change
- provider/platform limits that could invalidate the product promise
- proof scenarios that would catch a source-of-truth bypass, not just helper existence

If pressure testing would likely change the architecture, the plan is not ready.

## Core Posture

Start with the product intent in plain language. Do not begin from the current code shape.

Before proposing work, inspect or request the relevant source docs/code. A plan is not ready until it traces intended behavior through:

source data -> decision logic -> validation -> persistence -> API/DTO -> mapper/adapter -> final UI/output -> downstream consumers -> tests/docs.

If the plan only fixes the visible symptom, keep working.

Do not produce a plan that relies on the implementation agent to "figure it out" for product-critical behavior. A good plan should make the correct implementation path narrower than the wrong one.

For any time-sensitive, provider-backed, async, billing, messaging, file, import, export, AI, analytics, or compliance behavior, first decide the root authority/backbone. Do not assume the most convenient platform feature is the product backbone until its limits have been checked against the user or system promise.

## Work Tracking

For feature work, big slices, cross-session work, or audit-remediation passes, use `github-project-work-tracking` when GitHub Projects are available. Keep tracking separate from planning: the project item records status, but the plan owns product intent, scope, definition of done, tests, and pressure-test results. Do not mark work `Done` from the first implementation pass; use `Review/Verification` until proof and acceptance are clear.

## Required Planning Inputs

Cross-check the relevant available sources before finalizing:

- PRD/product intent
- data model and API contracts
- security/privacy docs
- source-of-truth map
- surface authority map
- runtime/background-flow docs
- blast-radius/change-risk docs
- verification/test harness docs
- existing code paths and current tests
- docs/rules that will need updating
- official provider/platform constraints when the feature depends on scheduler precision, messaging, payment, storage, auth, quotas, webhooks, regions, or external delivery

If one source is missing, say so and make the safest assumption explicitly.

## Mandatory Pressure-Test And Revision Discipline

Planning is not complete after the first plausible architecture. Before the final plan, run a pressure-test pass that challenges the plan's assumptions, not only its missing files.

The pressure-test pass must ask:

- What is the easiest wrong implementation a competent agent could build while still "following" this plan?
- Which sentence, omitted decision, or vague phrase would allow that wrong implementation?
- Which upstream/downstream surface would make the mistake visible to a user, operator, or future agent?
- What test, fixture, smoke, mutation probe, or final-output proof would fail if that wrong path were taken?
- Are any assumptions binary when reality is continuous, probabilistic, provider-dependent, or layer-specific?

When revising a plan after pressure testing:

- Produce a complete replacement plan, not a smaller delta unless the user explicitly asks for a delta.
- Preserve every still-valid detail from the previous plan; do not make the new plan less detailed than the earlier one.
- Fold pressure-test findings into the actual phases, tests, docs, and definitions of done; do not leave them as commentary only.
- Turn "good catch" observations into locked implementation requirements or explicit open questions.
- Re-check that new corrections did not create a new false assumption elsewhere.

Plans that compare alternatives must avoid false binaries. Prefer per-surface, per-layer, per-role, per-state, or per-user-segment decisions when a global decision would hide meaningful differences.

## Verify Load-Bearing Claims

A plan inherits the correctness of the facts it rests on. Any claim the plan's correctness DEPENDS ON — a `file:line`, "X is the only caller," "this is already wired," "the trace already populates Y," "removing X leaves the fallback intact," "this symbol isn't used elsewhere," "the field exists on that type" — must be confirmed against the ACTUAL code before the plan is final. Do not take a load-bearing fact on faith from a sub-agent's exploration, a teammate's summary, a doc, recalled memory, or a prior plan.

A sub-agent's exploration is a lead, not proof: agents miss callers, over-claim dead code, quote stale line numbers, and confidently paraphrase. The danger is asymmetric — a wrong load-bearing claim produces a confident, internally-consistent plan that is wrong in a way the plan's own review will NOT catch, because every later step trusts the bad fact.

Practical rule: for each load-bearing claim, do the cheap direct check yourself — read the exact lines, grep for the callers/symbol, confirm the type/field exists, run the one-line probe. Reserve this for the claims the plan actually leans on (the surgical boundary, the "safe to delete," the "already populated," the "only place it's gated"); you do not need to re-verify every incidental detail. If a load-bearing claim cannot be verified, mark it an open question and do not let the plan depend on it.

## Testing And Proof Quality Discipline

Tests must prove the behavior that matters, not only that code executed or output was generated.

Every non-trivial plan's test ladder must distinguish:

- shape validity from semantic correctness
- a helper being called from the final output consuming the right authority
- a successful fallback from the intended primary behavior
- current behavior matching from current behavior being correct
- generated output from accepted, validated, useful output

For generated, AI, parser, adapter, import/export, provider, or user-visible derived output, include an oracle policy:

- Hand-labeled golden fixtures are primary truth when available.
- Validators prove schema, grounding, provenance, policy, redaction, and contract safety, but not full semantic quality by themselves.
- Current production output is a baseline for regression and diffing, not automatic truth.
- LLM-as-judge can be secondary evidence, not the sole promotion/acceptance authority.
- Human review is required before promoting high-impact generated prose, recommendations, rankings, or coaching quality changes when golden truth is missing.

Use the smallest useful tests first, then add broader proof where risk crosses boundaries:

- Unit tests for deterministic logic, scoring, selectors, validators, cost math, and state transitions.
- Adapter/contract tests for provider payloads, usage extraction, malformed envelopes, unsupported fields, missing usage, and redaction.
- Fixture/golden tests for realistic positive cases, counterexamples, paraphrases, omissions, malformed structure, conflicting evidence, fabricated evidence, and repair failure.
- Integration tests when persistence, queues, usage rows, DTOs, provider evidence, or downstream consumers are affected.
- Browser/API/smoke tests when the final user-visible output changes.

Verify the tests are not vacuous:

- Pair every negative assertion with a positive liveness assertion from the same execution path.
- Avoid proxy assertions that only prove "some throw/log/fallback happened"; assert the specific marker and call arguments.
- Test boundary values for every threshold: below, exactly at, above, zero/empty/null, and list cardinalities `[]`, `[one]`, and `[many]`.
- Include mutation probes for non-trivial plans: deliberately break the key decision, cost, redaction, routing, validator, or consumer path and confirm at least one test fails.
- Record what mutation/probe was tried and which test caught it.

If a plan's tests would still pass when the primary path is disabled, the tests are not acceptable.

## AI, Provider, And Cost Evaluation Discipline

When a plan involves AI providers, model routing, model evaluation, generated coaching, or cost optimization, cost and quality must be evaluated at the layer/result level, not by provider brand or sticker price alone.

Required evaluation unit:

```
layer/stage + modelRole + output contract + validator + repair policy + fallback policy + cost profile
```

Do not plan a global "use provider X" switch as the main decision unless every layer has the same quality, latency, privacy, and cost behavior. Prefer per-layer candidate ladders.

Cost plans must optimize for effective cost per accepted result:

```
effective_cost =
  initial_call_cost
  + app_repair_call_costs
  + metered_provider_retry_costs
  + fallback_current_model_cost_when_candidate_fails
  + provider_tooling_or_schema_overhead_cost
```

Track at minimum:

- initial pass rate
- malformed output rate
- schema/validator failure rate
- repair rate and repair success rate
- fallback-to-current rate
- accepted result rate
- effective cost per accepted result
- output token expansion
- p50/p95 latency
- timeout, rate-limit, and provider-error rate

A cheaper model that needs repeated retries or falls back often is not cheaper. A more expensive model can be the correct lower-cost choice if it produces accepted results with fewer repairs, lower fallback rate, and acceptable latency.

Promotion rules for model/provider changes must require:

- quality threshold passes for that exact layer
- effective accepted-result cost beats the current model for that layer
- p95 latency stays within the layer budget
- fallback and repair rates stay within threshold
- privacy/redaction/grounding guarantees hold
- production remains unchanged by default until promotion is explicitly approved

For high-reasoning or user-visible prose layers, JSON validity or validator pass is not enough. The plan must include golden fixtures, rubric checks, final-output inspection, or human review before recommending promotion.

## Required Plan Shape

Every full implementation plan must include:

1. Summary
   - Plain-language product intent.
   - What user-visible or system-visible behavior will be true after the slice.
   - Explicit non-goals.

2. Source Of Truth
   - Which persisted row, provider event, user input, config, or decision document owns each important claim.
   - Which surfaces must consume that truth.
   - Which fallbacks, caches, UI reconstructions, stale fields, or compatibility paths must not become authority.
   - For time-sensitive or async behavior, which persisted record owns the schedule/status, which job/event is only a trigger, and which evidence is required before a success claim.

3. Scope And Blast Radius
   - Owned files/modules.
   - Protected/high-risk files.
   - Adjacent surfaces affected.
   - Explicitly out-of-scope work.
   - Privacy, security, auth, RBAC, billing, data, async, and compliance impact.
   - Rollback or containment strategy.

4. Domain Behavior
   - Rules, roles, plan gates, state transitions, idempotency, concurrency, and edge cases.
   - Limited/error/unavailable states.
   - Transaction boundaries and audit evidence.
   - What must be impossible after the change.
   - Producer/reconciliation matrix: every mutation, import, webhook, settings change, membership change, archive/delete, retry, backfill, or provider callback that must update or intentionally not update derived rows.
   - State machine matrix: states, allowed transitions, transition trigger, source authority, terminal or mutable status, retry policy, display meaning, and what must preserve history.
   - Persisted derived state lifecycle matrix when derived rows, queues, jobs, projections, caches, provider evidence, or retryable side effects exist.

5. Interfaces
   - API routes, DTOs, server actions, jobs, events, webhooks, exports, or UI contracts.
   - Request/response schemas and stable error codes.
   - Redaction rules and fields that must never leave the server.

6. UI Or Output Behavior
   - First useful screen/output state.
   - Empty, loading, limited, invalid, forbidden, not found, failed, and success states.
   - Copy boundaries: no unsupported product claims.
   - Accessibility expectations.

7. Observability And Analytics
   - What should be logged.
   - What must never be logged.
   - Metrics/events allowed.
   - Provider monitoring or alerting if in scope.
   - Explicitly say if observability is deferred and why.

8. Tests And Proof Ladder
   - Source-level tests.
   - Domain/unit tests.
   - Contract/API/DTO tests.
   - Integration tests with real persistence where relevant.
   - Negative-path/security/privacy tests.
   - Browser/UI smoke for user-visible changes.
   - Background job/replay/idempotency tests for async flows.
   - Stateful side-effect tests for fresh eligible rows, stale rows after source changes, retryable failed rows, terminal evidence rows, duplicate triggers, source-revoked-after-creation paths, and unavailable/disabled provider states where applicable.
   - External adapter tests for realistic messy inputs, aliases or descriptive field names, malformed structure, duplicate or normalized-duplicate keys, missing required structure, size/count limits, unsupported formats or encodings, and privacy leakage where applicable.
   - Idempotency tests must distinguish sequential retry from concurrent duplicate triggers; include both when a mutation can be submitted, replayed, retried, or delivered twice.
   - Route/API/job/export inventory checks when paths, callbacks, public URLs, or implementation artifacts change.
   - Docs validators or doc-quality gates.
   - Exact commands to run.
   - Tests must map to every matrix row that matters: source authority, producer/reconciliation, state transitions, unavailable states, provider evidence, idempotency, final UI/output, and docs.
   - Oracle policy for generated, semantic, provider, or adapter output: golden fixture, validator-only, current-baseline diff, LLM-judge secondary, or human-review-required.
   - Mutation/probe evidence for non-trivial logic proving the tests would fail if the key source-of-truth, routing, validation, redaction, cost, or downstream-consumer path were broken.

9. Documentation Updates
   - Exact docs/rules/runbooks to update.
   - Decision-log updates if choices changed.
   - Blast-radius doc update if risk/test/control surface changed.
   - Verification harness update if scripts/tests changed.

10. Definition Of Done
   - Behavior is proven at final output, not just helper level.
   - Tests pass.
   - Docs are reconciled.
   - No placeholders.
   - No hidden unsupported claims.
   - Remaining risks are named.

## Risk Profile Classifier

Before choosing plan depth, classify the slice by the behavior it actually changes. Do not force irrelevant matrices. A plan should be proportional: deep where the slice can mislead, expose, lose, charge, notify, delete, or incorrectly decide; lighter where the slice is local and low-risk.

Use all profiles that apply:

- **Pure presentation**: layout, copy, styling, non-authoritative UI formatting. Requires source/output proof, accessibility checks when user-visible, and copy/claim boundaries. Does not require producer, state, scheduler, or provider matrices unless the UI changes authority, permissions, or persisted state.
- **Synchronous CRUD or settings**: direct create/read/update/delete or preference changes. Requires source-of-truth, validation, persistence, authorization, DTO/mapper, final-surface, negative-path, and docs coverage. Requires a producer matrix only for the mutations that exist. Does not require scheduler/provider matrices unless async/provider behavior exists.
- **Derived state or aggregate**: counts, summaries, rankings, statuses, projections, denormalized rows, cached views, or computed outputs. Requires producer/reconciliation and consumer/surface matrices because stale or duplicated truth is the main risk.
- **Lifecycle/state machine**: approvals, invitations, subscriptions, attempts, reviews, workflow steps, import batches, moderation, or any persisted status. Requires state/evidence matrix and transition tests.
- **External data adapter**: imports, parsers, webhooks, uploads, exports, file/feed serializers, provider payload mappers, or any boundary that maps outside/user-supplied structure into app truth. Requires realistic fixture matrix, malformed-structure tests, duplicate-key/normalized-key tests where applicable, explicit unsafe-fallback behavior, redaction checks, and source-to-output proof.
- **Async/scheduled/background**: jobs, queues, retries, webhooks, backfills, reprocess flows, outboxes, scheduled actions, or eventual consistency. Requires backbone, producer/reconciliation, persisted derived state lifecycle where rows can stale or retry, state/evidence if persisted lifecycle exists, idempotency, replay/catch-up, and failure proofs.
- **Provider-backed side effect**: payment, notification, file storage, identity, external API mutation, model call, or any external irreversible/actionable effect. Requires provider boundary, evidence, unavailable/unknown behavior, redaction, retries, and provider-failure tests.
- **Authorization/privacy/compliance boundary**: auth, RBAC, tenancy, consent, policy, tax/legal, data residency, PII/business-sensitive data, exports, public links. Requires server-side enforcement, redaction, abuse/negative tests, and docs/runbook updates.
- **AI or semantic judgment**: classification, generation, ranking, recommendation, summarization, scoring, matching, or meaning-based decisions. Requires decision matrix, grounded evidence, provenance, repair/validation flow, and final-output consumption proof.
- **Retirement / cleanup / deletion-sweep**: slices that remove modules, providers, features, environment variables, scripts, configs, or persisted-state classes. Requires a **non-typechecker discovery sweep** (see "Retirement Sweep Discipline" below) because the most common failure mode of a cleanup slice is that the type system gives a false all-clear while string-literal unions, hardcoded enum allowlists, env files, scripts that read `process.env`, test mocks, and docs still reference the retired surface. Type-bound discovery alone is insufficient.

If a profile does not apply, explicitly say it is not applicable and why. Do not include irrelevant requirements just to look thorough.

## Retirement Sweep Discipline

When a slice retires a surface (module, provider, feature, env var, script, table, enum/union member, configured behavior), the discovery sweep MUST cover both type-bound AND non-type-bound surfaces. A passing `tsc --noEmit` is necessary but not sufficient evidence that the retirement is complete.

The failure mode this prevents: a deletion sweep that removed every TypeScript import of `StripeProvider` but left `STRIPE_*` env vars in `.env.example`, a `setup-stripe-products.mjs` script, a `STRIPE_SECRET_KEY` check in a launch-readiness script, hardcoded `"billing_invoices"` string members in a `ROLE_ALLOWLIST` union, and test mocks asserting the old shape. The typechecker found zero errors; the product still claimed to deliver retired data.

### Required sweep targets

For every retired surface, grep across the entire repo (not only files under `tsconfig` coverage):

1. **TypeScript import graph** — caught by `tsc --noEmit`. Necessary but not sufficient.
2. **String-literal unions, enums, and allowlists** — hardcoded string members like `type Resource = "renewals" | "billing_invoices"` and `const ALLOWLIST: Record<Role, string[]> = { OWNER: ["billing_invoices", ...] }`. The typechecker accepts these as valid strings even when their referent tables/modules are gone.
3. **Environment variable files** — `.env`, `.env.example`, `.env.local`, deployment env templates. Removed-feature env vars still listed here will mislead future devs and may still gate deploys.
4. **Scripts and runtime configs** — anything in `scripts/`, `bin/`, `Makefile`, `package.json` scripts, Dockerfiles, GitHub Actions YAML, infra-as-code. These often read `process.env.STRIPE_*` or call retired endpoints by name and are invisible to `tsc`.
5. **Test fixtures, mocks, and assertions** — mock responses still shaped like the retired data; assertions still expecting retired fields. Tests that pass against retired shapes are vacuous after retirement.
6. **Documentation** — content-map, decision-log, screen specs, runbooks, PRD, architecture docs. Docs that promise retired capabilities are now lies.
7. **Persisted derived-state classes** — retired-surface row classes that may still exist in the dev/prod DB (covered by the persisted-derived-state-lifecycle lens) need an explicit disposition (`prisma migrate reset`, archival flow, or migration to a new shape).

### Required sweep procedure (concrete)

For each retired keyword (provider name, env-var prefix, model name, route name, enum member), run:

```
grep -rni "<keyword>" \
  src/ app/ tests/ scripts/ docs/ prisma/ \
  .env* .github/ package.json next.config.* tsconfig*.json README* AGENTS*
```

Every hit must be either fixed in this slice or explicitly justified as out-of-scope with a tracking task. "TypeScript didn't flag it" is not a justification.

### Plan-shape requirement

A retirement slice's plan MUST include a **Retirement Sweep Checklist** section enumerating:

- the retired keyword(s) (provider name, env prefix, model name, etc.),
- the grep command(s) used,
- the hit count before and after the slice,
- explicit out-of-scope hits with their tracking task,
- the post-slice grep verification proving zero unintended hits remain.

This belongs alongside the Producer/Consumer matrices, not in place of them.

### Pressure-test gate

The pressure-test pass on a retirement slice MUST explicitly re-run the keyword greps. If hits remain that the plan did not account for, the slice is incomplete regardless of whether `tsc`, lint, and tests pass.

## Two-Pass Pre-Done Discipline

Every slice — retirement or new-build — must pass BOTH of the following before being called done:

### Pass 1 — Retirement sweep

Per the "Retirement Sweep Discipline" section above. Applies to any slice that retires a surface.

### Pass 2 — Plan-deliverable trace (via `implementation-review-against-plan`)

A keyword sweep cannot catch "you didn't build a file you promised to build" — that's an unbuilt-deliverable defect, not a leftover-reference defect. The two failure modes are orthogonal:

| Defect | Caught by |
|---|---|
| Retired identifier still referenced (string in env file, hardcoded enum member, doc text) | Retirement sweep |
| Promised deliverable not built (a route file, a page, a test, a domain helper) | Plan-deliverable trace |
| Test mocks shaped like retired data | Either, depending on the keyword |
| Route built but no consumer wired to it | Plan-deliverable trace (the "partial wiring" check) |
| Flash param emitted but unrendered | Plan-deliverable trace |

Concretely, before declaring a slice done:

1. List every file/module/test the plan promised.
2. Verify each one exists on disk and has at least one test that exercises its primary path.
3. Trace the source→output path for every new authority (DTO leaks, UI consumes the right truth, server action redirects render properly).
4. Check for orphaned flash params, orphaned redirects, unconsumed log fields, routes with no test, server actions called by no UI.
5. Re-grep for the slice's retired keywords.

If any of those checks surfaces a gap, the slice is incomplete regardless of whether the verify-gate (typecheck + lint + tests + build) passes. The verify-gate proves "what's there compiles and behaves;" it does not prove "everything the plan promised is there."

The failure mode this prevents (real, caught in RenewalRadar Slice 1): `/clients/page.tsx` shipped with a `<Link href="/clients/${id}">` to a detail page that was promised in the plan but never built. The verify-gate passed (the link is valid JSX, the URL is valid, the destination 404s at runtime — Next handles it gracefully). The pressure-test pass caught the missing file by tracing the plan's deliverable list against the file system.

## Mandatory Matrices By Profile

Include only the matrices required by the applied profiles:

- Backbone Decision Matrix: required for async/scheduled/background, provider-backed side effects where platform constraints affect the promise, and AI/semantic flows where model-vs-code authority matters.
- Producer And Reconciliation Matrix: required for derived state/aggregates and async/background flows; required for synchronous CRUD only when multiple producers can affect the same output; optional for single-producer local CRUD.
- State And Evidence Matrix: required for lifecycle/state machine and provider-backed side effects; optional for simple boolean settings if transitions are trivial and named directly.
- Persisted Derived State Lifecycle Matrix: required when a feature creates or changes persisted derived rows, dispatch rows, retry rows, queue/outbox rows, status projections, caches, aggregates, provider evidence rows, or any row that can later cause a side effect or user-visible claim.
- Consumer And Surface Matrix: required for derived state, provider-backed side effects, AI/semantic outputs, authorization/privacy boundaries, and any user-visible behavior with more than one connected surface; optional but useful for small presentation-only changes.

If a matrix is not used, the plan must still name the simpler replacement proof. Example: a single synchronous settings form may only need "form input -> validation -> persisted setting -> DTO -> settings page displays saved value -> API/browser tests."

### Backbone Decision Matrix

Define:

- user/product promise
- candidate backbones
- official/provider/platform constraints
- authority source for each candidate
- failure modes
- latency/precision/reliability implications
- cost/quota implications
- security/privacy implications
- chosen backbone
- fallback/repair mechanism
- why other candidates were rejected
- reversal trigger
- proof required before calling it implemented

The chosen backbone must match the user or system promise. Example pattern: if the promise requires precise timing, ordering, durability, or evidence, a best-effort trigger cannot be the authority; it can only be a trigger, catch-up path, or repair path unless the promise is explicitly reduced.

### Producer And Reconciliation Matrix

List every source that can create, modify, cancel, stale, or resurrect downstream truth:

- direct create/update/archive/delete mutation
- settings/preference change
- membership/team/invite change
- plan/billing change
- webhook/provider callback
- import/backfill/reprocess
- retry/catch-up job
- admin/manual repair
- account/workspace deletion

For each producer, specify:

- source input
- validation
- persistence changes
- derived rows to create/update/skip/cancel
- transaction boundary
- idempotency key or uniqueness rule
- downstream enqueue/retry behavior
- tests proving it

If a producer is out of scope, say whether that makes the slice incomplete or whether the downstream state is intentionally unaffected until a later slice.

### Persisted Derived State Lifecycle Matrix

When persisted derived state exists, enumerate how each source mutation affects every existing row state. Do not treat "scheduled", "visible", or "current" rows as the whole blast radius.

For each relevant row/status class, define:

- source authority that created it
- whether it can still cause a future side effect or user-visible claim
- what happens when source input changes
- what happens when eligibility is revoked
- what happens when the parent record is archived/deleted
- what happens after provider failure if retry remains possible
- what happens after terminal evidence exists
- whether the row is updated, canceled, skipped, superseded, preserved, or ignored
- what historical evidence must never be overwritten
- what final surface should display
- test proving the behavior

At minimum, consider these state classes when applicable:

- new or pending
- scheduled or queued
- processing or claimed
- retryable failed
- terminal failed
- sent or completed
- unknown or ambiguous provider result
- canceled or skipped
- test-only or dry-run

The durable rule: stale or ineligible rows must not create future side effects, while historical evidence must remain traceable.

### State And Evidence Matrix

For any persisted lifecycle, define:

- state name
- meaning in plain language
- who/what may set it
- allowed previous states
- allowed next states
- terminal vs mutable
- retry/backoff behavior
- user-visible copy/status
- provider/audit evidence required
- fields that must never be overwritten
- cleanup/retention rule

Success states must require the accepted evidence source. Unknown/unavailable states must be first-class states when the app cannot honestly know the outcome. Reconciliation must not erase terminal evidence unless the plan explicitly defines a safe archival/replacement flow.

### Consumer And Surface Matrix

For every important output, list:

- UI page/component
- API/DTO
- notification/export/feed/report/dashboard/analytics consumer
- background job consumer
- support/admin/runbook consumer
- exact authority consumed
- forbidden reconstruction/fallback
- empty/error/unavailable state
- test proving final output consumes the authority

If there is no final-output proof, the plan is not complete.

## Implementation Safety Contract

A plan is not implementation-ready unless it removes dangerous ambiguity for the coding agent.

For every material behavior, specify:

- exact source of truth
- exact owned files or allowed file areas
- blocked files and blocked product scope
- required route names, page paths, job names, model names, event names, and DTO names where known
- allowed dependencies and forbidden dependencies
- allowed provider calls and forbidden provider calls
- exact role/permission rules
- exact state machine or lifecycle states
- exact validation rules and stable error codes
- exact privacy/redaction rules
- exact analytics/logging allowlist
- exact transaction/idempotency requirements, including whether sequential retry, concurrent duplicate trigger, provider replay, or user double-submit can happen and what durable guard prevents duplicates
- exact external-adapter fixture requirements if outside/user-supplied structure is parsed, mapped, imported, exported, uploaded, or consumed from a provider
- exact rollback or containment method
- exact test commands and required scenarios
- exact docs that must be updated
- exact producer/reconciliation rows if derived state is involved
- exact persisted derived state lifecycle rows if derived state can stale, retry, dispatch, display, aggregate, or outlive the source mutation
- exact state/evidence matrix if lifecycle state is involved
- exact scheduler/provider/backbone decision if timing or external delivery is involved

If the plan uses words like "maybe", "probably", "etc.", "as needed", "some", "basic", "simple", "appropriate", or "handle edge cases", rewrite it into concrete requirements or mark it as an open question.

Do not let the implementation agent choose between product-critical options silently. If there are multiple valid approaches, the plan must either choose the recommended approach and explain why, or mark the choice as an open question and block implementation of that part.

## Assumption Discipline

Allowed assumptions must be explicit, low-risk, reversible, consistent with existing docs/code, and tested or documented.

Unsafe assumptions must become open questions. Unsafe assumptions include:

- auth/RBAC behavior
- billing/tax behavior
- legal/privacy/compliance copy
- data residency
- provider side effects
- schema deletion/renames
- public API shape
- scheduled or provider-backed dispatch timing
- scheduler, trigger, or platform precision limits
- provider delivery success/failure semantics
- missing provider configuration behavior
- retry, catch-up, and unknown outcome behavior
- customer-visible deadline logic
- analytics payloads containing business or personal data
- any behavior that could charge, message, expose, delete, or mislead a user

## Decision Locking

Before implementation, lock decisions in one of these forms:

- Founder-confirmed
- Existing-doc authority
- Existing-code authority
- Recommended default
- Open question / blocked

Every Recommended default must include:

- options considered
- chosen option
- why it best fits this product now
- what would reverse it
- how it will be verified

## Anti-Ambiguity Rewrite Rules

Replace vague requirements with concrete ones:

- Instead of "add tests", list exact test files or scenarios.
- Instead of "parse/import/map input", list canonical fixtures, realistic messy fixtures, malformed structure, duplicate/normalized-duplicate keys, limits, unsupported formats, and privacy leakage checks.
- Instead of "secure the route", list auth, RBAC, origin/CSRF, validation, and redaction checks.
- Instead of "update docs", list exact docs.
- Instead of "handle errors", list exact error states and stable codes.
- Instead of "add observability", list log events, allowed fields, forbidden fields, metrics/events, and what is out of scope.
- Instead of "schedule a job", name the scheduler or trigger, precision requirements, persisted authority, enqueue payload, retry/outbox behavior, catch-up path, and why it can satisfy the product or system promise.
- Instead of "send a provider message", name the provider boundary, send gate, unavailable state, evidence required for success, retry/unknown behavior, and redaction constraints.
- Instead of "reconcile derived data", list every producer and exactly what each producer creates, updates, cancels, preserves, or leaves untouched.
- Instead of "cancel old rows", list which states are actionable, retryable, terminal, historical, test-only, or already safe; define whether each is canceled, skipped, superseded, preserved, or ignored.
- Instead of "show status", list the persisted status source, DTO mapper, final surfaces, and forbidden UI recomputation.
- Instead of "support roles", list each role and allowed/blocked actions.
- Instead of "use templates", say whether templates prefill, validate, persist, override, or only display.
- Instead of "mark complete", specify persisted state changes, audit events, UI output, and downstream effects.
- Instead of "make idempotent", specify the durable uniqueness/lock/claim/provider-event guard and tests for both retry-after-success and concurrent duplicate triggers.

## Pressure-Test Checklist

Before calling a plan ready, ask:

- Did the accepted source of truth actually drive the final output?
- Is the same truth used by every connected surface?
- Did any stale fallback, duplicated logic, cache, UI reconstruction, or compatibility route bypass it?
- Are error and limited states honest?
- Are unavailable, unknown, and provider-disabled states honest and persisted where needed?
- Are tests proving the intended behavior, not only that a helper exists?
- Are tests proving realistic messy inputs and malformed structures, not only clean canonical examples?
- Are tests proving every producer/reconciliation path, not only the first create path?
- If idempotency is claimed, are sequential retry and concurrent duplicate trigger both proven?
- Are tests proving stale derived rows and retryable failed rows cannot produce future side effects after the source changes or eligibility is revoked?
- Are tests proving terminal evidence cannot be overwritten by repair/reconciliation?
- Are authorization and privacy enforced server-side?
- Are DTOs mapped from authority instead of leaking raw persistence/provider models?
- Are docs/rules/runbooks now truthful?
- Did the route/API/job/export inventory in docs match the actual files or build output?
- Did we check adjacent layers for the same mistake pattern?
- Did we check provider/platform limits against the product promise?
- Did we avoid making a trigger, cache, UI state, browser/client state, or validator output the accidental authority?
- Does each new thing the plan adds actually need to exist — or could it be reused, relocated to a different surface/layer/step for better UX, or shaped from how comparable products solve this (Gate 8)?
- Is the plan over-engineering (machinery the product doesn't need yet) or too loose/sloppy (skipping durability, security, or edge handling it needs)? Did we name the durable-but-minimal middle (Gate 8)?
- Does this fully satisfy product intent, or only patch the current failure?

## Spider Model

For every concern found:

1. Name the bug or concern.
2. Identify the mistake pattern.
3. Search nearby layers for the same pattern.
4. Fix at the earliest reliable source.
5. Add tests/docs/rules so it is less likely to recur.

## AI/Semantic Judgment Clause

If AI or semantic judgment is involved:

- AI should make semantic judgments from grounded evidence.
- Deterministic code should validate schema, grounding, provenance, permissions, source authority, persistence, arithmetic, and display safety.
- Do not hardcode phrase-level meaning unless the issue is purely contract/security/display validation.
- Validation should feed bounded repair when regeneration is possible.
- Generated, suggested, approved, and persisted outputs must be labeled correctly.
- Final user-visible output must consume the validated/approved source, not an earlier draft.

## Pre-Implementation Gate

Before giving a plan to an implementation agent, answer:

- Could a different competent agent implement the wrong thing while still technically following this plan?
- Are there any product-critical choices left to interpretation?
- Would the first implementation still be correct if a downstream producer runs later, a provider is unavailable, a job fires twice, a job never fires, or a user changes settings after data already exists?
- Would retryable failed, stale, queued, or test-only persisted rows remain safe when the source of truth changes?
- Would the final UI/notification/export/status still be honest if the accepted source is missing, unknown, disabled, stale, archived, forbidden, or outside the authorized boundary?
- Are downstream consumers named?
- Are negative paths named?
- Are forbidden shortcuts named?
- Are tests strong enough to catch a source-of-truth bypass?
- Is the definition of done tied to final user-visible/system-visible behavior?

If the answer exposes ambiguity, tighten the plan before implementation.

## Review Output Format

When reviewing a plan, lead with findings:

- What is missing or risky.
- Why it matters.
- Root mistake pattern.
- Concrete fix to the plan.

Then give:

- Updated scope/blast radius.
- Updated test ladder.
- Updated definition of done.
- Remaining open questions.

When writing a plan from scratch, give the full plan directly and include all required sections above.

## Required Self-Audit Before Final Plan

Before finalizing a plan, include an internal or visible pressure-test pass that answers:

1. What would be the easiest wrong implementation someone could build from this plan?
2. Which exact sentence or missing matrix would allow that wrong implementation?
3. What did I add to close that ambiguity?
4. What final-output proof would fail if the implementation took that wrong path?

If the answer is vague, keep tightening the plan.
