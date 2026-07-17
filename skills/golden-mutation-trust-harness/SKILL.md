---
name: golden-mutation-trust-harness
description: Use when designing, implementing, reviewing, or pressure-testing an end-to-end golden baseline plus mutation test harness for any app surface where users depend on computed data, statistics, rankings, warnings, dashboards, reports, exports, notifications, AI-derived claims, or role-scoped decisions being correct from source data through UI. Trigger when the user asks for a trust test, golden fixture, mutation suite, dashboard/statistics verification, full blast radius test, or wants to challenge whether passing tests are actually testing what matters.
---

# Golden Mutation Trust Harness

Build a reusable trust harness that proves important user-visible claims are correct from authoritative source data through API, UI, exports, reports, and side effects, then mutates the persisted truth to prove the surfaces react correctly.

The default posture is skeptical: a passing test is only useful after proving it would fail for the right wrongness.

## Product Intent First

Start by restating the user outcome in plain language:

- Who depends on this data?
- What decision will they make from it?
- What would be harmful if wrong, stale, overconfident, hidden, or role-leaked?
- Which visible claims must be trusted, and what source authority should drive each one?

Do not start with available test files. Start with the decision the product needs to protect.

## Plan Shape

Create a plan with these sections before implementation:

1. **Trust question**: the exact decision the harness must prove, such as "who needs coaching next and why," "which customer is at risk," or "which metric changed."
2. **Source authority**: source rows, events, artifacts, provider payloads, files, jobs, AI outputs, or material records that are allowed to make the claim.
3. **Blast radius inventory**: every producer, persistence table, read model, cache, API, DTO, mapper, UI route, chart, export, report, notification, job, admin surface, and role boundary that consumes the data.
4. **Golden fixture**: deterministic users/entities with multiple behavioral levels, fixed timestamps/timezone, enough sample size for statistical claims, low-confidence/insufficient-data cases, and expected values.
5. **Expected-values contract**: every visible claim mapped to source artifact, query/API, DTO path, UI locator/text/chart point, export/report row, role visibility, screenshot, and at least one mutation that must break or change it.
6. **Harness architecture**: reset, seed, producer replay, DB oracle, API oracle, UI oracle, export/report oracle, inventory oracle, mutation runner, cleanup, and trust report.
7. **Mutation suite**: persisted data mutations and adversarial corruptions that prove the system reacts, ignores stale data, or fails closed.
8. **Verification gates**: local build/test/browser commands, targeted regressions, doc-code drift, and any existing smoke gates in the repo.
9. **Residual risk**: what this harness proves and what it does not prove, especially live AI semantic quality, provider behavior, production infra, or data migration history.

If the plan only names pages or test commands, it is not complete. It must name claims, source authorities, and mutations.

## Disposable Environment

Prefer a local disposable environment when possible:

- Use Docker/local databases or disposable cloned databases.
- Production is never a valid reset target.
- Require explicit env gates before destructive reset or mutation, such as `DISPOSABLE_DB=1`, `ALLOW_RESET=1`, and `ALLOW_WRITE=1`.
- Dry-run reset by default and print scoped counts before deletion.
- Preserve auth/org/tenant infrastructure unless the fixture owns it.
- Stamp every fixture-owned row with a marker so cleanup is scoped and auditable.
- Use fixed clock/timezone/window rules so trend math is deterministic.

If the app needs live services, mock the smallest external boundary needed to prove persistence wiring, then document the residual live-service risk.

## Golden Fixture Design

Build fixture data as a product truth table, not random sample data.

Include:

- strong performer, struggling performer, medium-risk performer, stable performer with mild drift, volatile performer, improving performer, sparse-data performer, and low-confidence/not-analyzable performer;
- current and prior windows with enough rows for trend denominators;
- out-of-window rows that must not inflate current metrics;
- stale/corrupt read-model rows if the app has derived state;
- role-scoped users such as owner, assigned manager, unassigned manager, rep, admin, outsider;
- generated or mocked producer artifacts if real ingestion normally creates downstream rows;
- edge states such as missing proof, missing recording, stale analysis, failed analysis, completed analysis, limited score authority, and insufficient sample size.

Every fixture entity should have a story and exact expected outcome. Avoid "perfect scenario" fixtures where every subsystem is fresh, confident, and complete.

## Harness Pieces

Implement these pieces as reusable scripts or test commands:

- **Reset**: scoped cleanup with safety gates, dry-run mode, count reporting, and fixture-marker filtering.
- **Seed**: full source and downstream artifacts needed by the surfaces, with deterministic IDs or manifest output.
- **Producer replay**: at least one mocked producer-to-persistence path so the harness does not only prove hand-written rows satisfy hand-written assertions.
- **Baseline checkpoint**: DB oracle that validates exact rows, windows, denominators, timestamps, scores, states, and fixture ownership.
- **API checkpoint**: exact DTO assertions before UI checks, including cache refresh behavior and legacy/current endpoint agreement where relevant.
- **Visual/UI checkpoint**: browser assertions with stable locators, screenshots, console/page-error checks, desktop/mobile critical paths, no `NaN`, no `undefined`, no stuck loading, and chart/tooltip/label checks for important claims.
- **Export/report checkpoint**: CSV/PDF/report/packet/notification assertions for row order, labels, omitted rows, side effects, and sent-record persistence.
- **Inventory checkpoint**: route/export/job/read-model/cache inventory proving every consumer has coverage or an explicit exclusion.
- **Mutation runner**: applies one scenario at a time, restores baseline first, writes real persisted changes, waits boundedly for readiness, then runs API/UI/export assertions.
- **Trust report**: records commands, scenarios, screenshots, assertions, skipped gates, residual risk, and artifact paths.

Do not accept screenshots alone as proof. Pair every important visual claim with DB/API/DOM backing.

## Mutation Suite

Mutations must be realistic wrongness, not only happy-path variants.

Include mutations that:

- move entities over time: one improves, one worsens, one partially improves, one stays volatile, one has a single outlier, one remains sparse, one remains downgraded;
- change trend direction, graph point, denominator, rank, warning severity, coach-next/next-action target, common category, proof artifact, owner/assignee, plan progress, notification count, export order, and cache/read model state;
- swap aggregates between entities to catch cross-entity contamination;
- corrupt derived/read-model rows while source artifacts remain correct, expecting reconciliation, stale-row ignore, or fail-closed behavior;
- add out-of-window or low-confidence data that must not create confident current claims;
- create plausible wrong UI: hidden value, clipped label, stale text, wrong tooltip, wrong chart point, wrong role-scope copy, loading forever, `NaN`, `undefined`, or mismatched label;
- run sequential retries and concurrent duplicate attempts when reset/seed/mutation idempotency is claimed.

For every mutation, ask:

- What exact source changed?
- Which visible claim should change?
- Which visible claim should not change?
- Which test would fail if the app showed the old truth?
- Which test would fail if the app overreacted?

## Oracles

Use multiple independent oracles. Each catches a different class of false pass.

- **DB oracle**: exact source truth, row counts, windows, denominators, statuses, provenance, stale-row behavior, cleanup counts.
- **API oracle**: exact DTOs and role scopes before UI assertions.
- **UI oracle**: visible text, stable locators, charts, tooltips, links, screenshots, responsive checks, console health.
- **Export/report oracle**: row order, labels, omissions, packet/report sections, side-effect records.
- **Role oracle**: owner/manager/rep/admin/outsider visibility and denial behavior.
- **Inventory oracle**: every consumer of the data is covered or explicitly excluded with a reason.
- **Mutation oracle**: tests fail or visible output changes when persisted truth is mutated.

Use exact values for high-risk claims. Use regex only for copy where wording is intentionally flexible, and still assert the underlying DTO value exactly.

## Pressure-Test Passes

After a green run, distrust it.

Run this review loop:

1. **Liveness check**: could the test pass if the page never rendered the target module?
2. **Positive/negative pairing**: every "does not show X" assertion must pair with "does show Y from the same path."
3. **Wrong-source check**: could the UI be reading a fallback, legacy score, stale cache, or hand-written fixture row instead of the intended source?
4. **Mutation adequacy**: did a mutation actually touch the persisted source that production uses?
5. **Threshold check**: do fixture sample sizes clear the same denominator rules the app uses?
6. **Timestamp check**: are latest/current rows unambiguous, with no tied timestamps or clock drift?
7. **Role-scope check**: did the same entity appear correctly for owner, assigned manager, unassigned manager, rep, and outsider?
8. **Visual reality check**: did Playwright inspect real rendered content, screenshots, chart points, and errors, not just API success?
9. **Surface inventory check**: is any route, export, notification, report, admin page, job, or cached summary consuming the data without coverage?
10. **Failure-mode check**: if a dependency is slow, stale, empty, failed, or low-confidence, does the app wait boundedly, show honest limited state, or fail closed?

When a check reveals a bug, fix the root cause in the product or harness. Do not weaken the assertion to make the suite green.

## Common False Passes

Watch for these traps:

- UI test asserts "page loaded" but not the specific decision claim.
- API test passes while UI hides, clips, renames, or stale-renders the value.
- Negative assertion passes because the relevant module never rendered.
- Fixture data is below confidence thresholds, so trend assertions silently fall back to insufficient data.
- Mutation writes a row the app never reads.
- "Latest" data has tied timestamps and nondeterministic ordering.
- Read model is correct only because the seed hand-wrote it; producer replay is untested.
- Export/report uses a different endpoint or cache than dashboard.
- Role-scoped user sees the correct count but wrong member set.
- Chart line exists but points, tooltip labels, or windows are wrong.
- Test uses screenshots as proof without DOM/API backing.
- Retry/idempotency is claimed but concurrent duplicate trigger is not tested.

## Fixing Findings

Classify findings:

- **Trust blocker**: wrong claim, stale graph, misleading rank, wrong warning, hidden proof, bad role scope, bad export, bad limited state, or any issue that can make users decide incorrectly. Fix in the same pass.
- **Harness blocker**: test is brittle, vacuous, underpowered, or anchored to stale UI. Fix before trusting the result.
- **Product improvement**: clearer explanation, richer tooltip, better comparison view, better affordance. Track separately with route/API source, screenshot, expected user value, severity, and whether it came from baseline or mutation testing.

If issue tracking is available and the finding is non-blocking, create a grouped issue. If not, write a local ledger for later sync.

## Done Criteria

The work is done only when:

- reset/seed is safe, scoped, repeatable, and disposable;
- baseline DB/API/UI/export/report oracles pass;
- persisted mutation scenarios pass and prove expected changes;
- at least one producer-to-persistence replay is covered;
- role scopes are covered;
- visual tests include screenshots and invalid-placeholder/console health checks;
- inventory has no unowned consumers;
- existing related regression/build/smoke gates pass or are explicitly documented as out of scope with a reason;
- the trust report says what was proven, what changed under mutation, and what remains residual risk.

End by answering: "Does this fully satisfy the product trust intent, or did I only prove a narrow path?"
