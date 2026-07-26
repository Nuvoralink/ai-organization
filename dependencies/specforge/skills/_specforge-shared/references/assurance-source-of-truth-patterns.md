# Assurance and Source-of-Truth Patterns

These patterns apply to apps where users may act on product claims, statuses, permissions, recommendations, generated output, analytics, workflow state, exports, billing state, or role-specific surfaces.

Do not copy examples from a previous product into a new app. Extract only the reusable pattern, then scale the documentation to the current app's risk.

## Core principle

The hard part is not filling every document. The hard part is deciding which product claims need authority, evidence, validation, a safe failure state, and proof that the final surface uses the right source.

## Applicability tiers

Use the smallest tier that protects the app.

### Tier 0, simple static or low-risk app

Use the normal SpecForge docs. Do not generate the assurance extension unless the app still has meaningful user-visible claims, workflows, payments, sensitive data, roles, or integrations.

### Tier 1, normal app with users, data, workflows, or integrations

Create source-of-truth and surface authority sections. Focus on data ownership, status precedence, permission boundaries, fallback behavior, and test proof.

### Tier 2, high-impact app

Use the full assurance extension. This includes apps with payments, sensitive data, regulated workflows, role-based admin actions, critical workflow status, high-stakes recommendations, generated content, dashboards, exports, or multi-system integrations.

### Tier 3, runtime AI or non-deterministic decisioning

Use the full assurance extension plus AI/model decision matrices, provenance rules, bounded remediation, evals, prompt/version records, and usage metering.

## Pattern 1: product assurance contract before product claims

Before the app can make a claim users may rely on, define:

- what the app is allowed to claim;
- what it must never fake;
- what user trust depends on;
- what evidence is required;
- what happens when evidence is weak, stale, missing, contradictory, or low-confidence;
- which claims require human review or qualified review;
- which claims must show limited, pending, or unavailable states.

## Pattern 2: source of truth before fallback logic

For every important user-visible claim, define the artifact or process that owns truth.

A fallback can help availability, but it must not quietly become a competing policy engine.

Required map for Tier 1 or higher:

```text
Claim or decision -> authority owner -> inputs -> validation -> remediation -> fail state -> persistence -> API/DTO -> UI/export/aggregate -> test proof
```

## Pattern 3: decision owner before validator

Use the right decision owner for the app.

Possible decision owners:

- user-confirmed preference;
- admin or human approval;
- product policy;
- domain rule engine;
- database record;
- external provider;
- integration event;
- analytics pipeline;
- AI/model judgment;
- hybrid workflow with human review.

Deterministic code should own exact checks such as schema validation, authorization, arithmetic, persistence, source freshness, provenance, rate limits, and fail-closed behavior.

For runtime AI features, use the stricter boundary: model or expert judgment may own semantic interpretation, while deterministic code validates grounding, provenance, policy, safety, schema, authorization, persistence, and display behavior.

If deterministic code must make a semantic or domain judgment, create an explicit exception with scope, reason, tests, and a review trigger.

## Pattern 4: decision matrices before validators

Do not write validators before the decision layer has a clear matrix.

A decision matrix needs:

- inputs;
- authority owner;
- allowed outputs;
- disallowed outputs;
- examples;
- counterexamples;
- uncertainty states;
- validation rules;
- remediation rules;
- downstream permissions;
- tests.

For AI or open-world decisions, include positive and negative examples for the same concept so the system does not become a brittle blacklist.

## Pattern 5: bounded remediation instead of silent patching

Do not silently rewrite a failed claim into something that merely looks safe.

When a field, claim, or generated output fails validation:

1. name the failed field or claim;
2. identify the authority source;
3. check source presence, freshness, and applicability;
4. retry, recompute, re-fetch, regenerate, escalate, or fail closed depending on the decision owner;
5. validate again;
6. preserve diagnostics for authorized reviewers;
7. record the remediation attempt.

For AI output, targeted repair may regenerate only the failed field or packet. For deterministic workflows, remediation may recompute, re-read from the canonical source, invalidate a cache, or block the action.

## Pattern 6: source-to-surface proof

A claim is not implemented until it reaches every intended consumer.

Check:

- source or generated decision;
- validation;
- persistence;
- read model;
- API/DTO;
- UI component;
- dashboard/aggregate;
- export/report;
- refresh or retry path;
- docs and tests.

A prompt-only, code-only, or UI-only change is not done until the final visible surface uses the new authority.

## Pattern 7: no surface truth invention

The UI, export, report, notification, dashboard, or API projection may format, group, filter, and label. It must not create product truth because a layout or report has an empty slot.

If the source is missing, show the appropriate state:

- unavailable;
- limited evidence;
- pending review;
- not applicable;
- stale data warning;
- debug-only diagnostics for internal/admin views.

## Pattern 8: first-useful-viewport acceptance

For every high-risk page, dashboard, report, export, or notification, define what the first useful view must answer.

Common questions:

- What happened?
- What matters most?
- What proof supports it?
- What should the user do next?
- What is blocked, missing, or uncertain?
- Which controls apply to this role?

Use screenshots, rendered checks, or exported artifact checks when layout, density, overlap, information priority, or wording affects user trust.

## Pattern 9: object identity and role-specific controls

Large object sets need shared identity and query contracts.

Do not rely only on filenames, IDs, or local labels when users recognize objects by owner, customer, project, date, status, outcome, score, version, environment, or context.

Do not show filters or controls to roles that cannot use them.

## Pattern 10: documentation authority hierarchy

Docs are also a source-of-truth system.

Separate:

- active living architecture;
- active requirements;
- active runbooks;
- generated inventory;
- marketing content;
- historical audits;
- future backlog;
- deprecated or retired plans.

Old plans should not stay active because they contain one useful future idea. Move the useful idea into backlog and retire the stale plan.

## Pattern 11: validation ladder

Use cheaper proof before expensive proof:

1. static contract checks;
2. local replay or deterministic fixtures;
3. synthetic perturbation cases;
4. role/API tests;
5. source-to-surface smoke;
6. screenshot, geometry, or export rendering checks when needed;
7. one production-path or model-runtime proof only after local wiring is clean.

Meter paid or scarce runtime calls with provider, model or service, stage, role, usage units, estimated cost, project/session, and trace/run identity.

## Pattern 12: bounded root-cause passes

Root-cause work should go broad inside a named risk or data-flow boundary, then stop.

Define before work starts:

- current product intent;
- risk/data-flow class;
- high and medium risks in scope;
- required tests;
- what goes to backlog;
- stop condition.
