# Document Quality Acceptance Tests

Use these checks before a SpecForge document is considered useful for agent-led app development.

## Universal Checks

- The document names the product outcome it protects.
- Every material claim is labeled as User-confirmed, Repo-derived, Standard-backed, Assumption, AI-recommended default, or not-applicable-with-reason.
- Every `Unknown` includes an impact note and a trigger or owner for resolution.
- Every requirement has an ID, affected role or component, risk level, verification method, and related docs.
- Every material decision has options considered, pros and cons, final recommendation, source basis, verification method, and reversal trigger.
- Every implementation-facing statement can be turned into code, tests, configuration, or an explicit non-goal.
- Empty headings are removed or replaced with concrete content.
- Research is used for drift-prone or material decisions, not as generic decoration.
- Focused or existing-repo package filenames are descriptive lowercase kebab-case names; numbered names are only legacy aliases unless the target repo already uses that convention.
- If a required document is in scope, the package creates or updates the actual document instead of only recommending that a later user or agent create it.
- Existing living docs for security, privacy, architecture, API, or runbooks are updated and routed instead of duplicated under a competing name.
- Generated docs preserve the app's product intent, source-of-truth hierarchy, role model, trust contract, and AI/deterministic decision boundary.
- Existing-repo packages create or update a repo instruction rule that prevents docs drift when behavior, architecture, API, data contracts, security/auth, AI, runbooks, verification gates, or user-visible product rules change.

## Product and PRD Docs

- User stories map to concrete acceptance criteria and failure states.
- Scope includes non-goals and scope-creep boundaries.
- Success metrics describe observable product outcomes, not vanity claims.
- Open questions identify what changes if the answer is different.

## Architecture and Data Docs

- Architecture choices map to architecturally significant requirements.
- Diagrams name external actors, systems, containers, data stores, queues, and trust boundaries at the right abstraction level.
- Data ownership, retention, deletion, and access rules are attached to entities.
- API contracts include request, response, error, rate-limit, authorization, and idempotency behavior where relevant.

## Security, Privacy, and Threat Docs

- Assets, actors, entry points, trust boundaries, threats, mitigations, and verification are connected.
- Security controls map to specific threats or requirements.
- Privacy docs state data minimization, collection purpose, retention, deletion, vendor sharing, and review triggers.
- Regulated or sensitive areas are marked review-needed instead of treated as solved.

## Implementation Task Docs

- Every task maps to requirement IDs, risk IDs, tests, docs updates, and rollback or containment.
- Task slices are small enough for an agent to implement and verify independently.
- Protected files and approval gates are named for high-risk changes.
- `Do-not-build-yet` items preserve product boundaries and prevent speculative implementation.
- Architecture/foundation docs include a future-capability map and seam admission decisions. A planted seam has a real current consumer and bypass/retirement/killer-mutation proof; an unknown future contract remains a documented extension point. The reviewer rejects both present-only hardcoding that forces a later parallel system and unused universal abstractions.

## Quality Review Docs

- The review names issues fixed, issues remaining, and validation output.
- Findings distinguish structure failures from evidence, source-of-truth, security, privacy, or implementation-readiness failures.
- The reviewer rejects docs that are complete only because headings exist.
- The reviewer records actual document coverage: created, updated, routed, intentionally omitted, or blocked with impact.
- The reviewer checks naming clarity and product-intent drift, not only validator pass/fail state.
- The reviewer runs `check_repo_doc_quality.py` when available and records the result. This gate catches broken links, missing docs-index routing, legacy focused filenames, audit-only "create this later" recommendations, and missing quality-review sections.

## Behavioral verification tests

Adopted from VisualForge's test-discipline lessons (VF-FIND-023). A passing acceptance test is unfalsifiable unless we know which test would fail if a real bug shipped. Apply to every spec deliverable:

### Boundary value coverage

Any numeric threshold in a spec (SLO, retention window, rate-limit ceiling, validation length, reminder window) must have explicit acceptance tests at:

- The exact boundary value.
- One unit on each side (boundary - 1, boundary + 1).
- A degenerate value (zero, empty, today-as-now, max-int).

A spec with "≤ 7 days reminder window" without acceptance tests at `days=6`, `days=7`, `days=8`, and `days=0` is incomplete. Bugs hide at boundaries (off-by-one, inclusive-vs-exclusive, timezone math).

### Paired-condition rule

An acceptance test of the form "X must not happen" is vacuous when the code that produces X is disabled. Pair it with a positive assertion from the same code path: "the working case Y happens AND the failure case X does not." Both halves must come from one execution path; otherwise the test passes when both halves are independently broken.

### Spec-mutation review (table-top)

Before signing off a spec, perform a one-question review per requirement:

> "If I deleted this clause, would any downstream acceptance test catch the deletion?"

If not, either the test is missing or the requirement is decorative. Document each requirement with at least one verifying downstream artifact (a test ID, an SLO, a runbook step, a validation rule).

### Persona-DEC binding lock

Specforge personas (e.g., `DEC-PERSONA-001` for primary, `DEC-ANTI-PERSONA-001` for the anti-persona) own the identity of each persona. Downstream skills (VisualForge, Implementation) MUST cite by the owned ID. A persona cite that names the wrong persona in the parenthetical is BLOCK-level (mirror of VisualForge VF-FIND-015). Specforge reviewer should record the canonical persona-DEC map at run-start and use it as ground truth.

### Capability-pending aging

Any spec entry deferred as `capability-pending` must carry an `expected-by` date and an owner. The reviewer flags items past their target date. Capability-pending without a date is a parking lot disguised as a plan; review the entry quarterly to ship, escalate, or remove.

### Implementation mutation-log handoff

When a spec hands off to implementation, the implementation deliverable must include a mutation log (per VisualForge `implementation-mutation-log.md`) recording deliberate sabotages of the implementation and which tests caught each. Spec reviewer can require this artifact as part of the implementation acceptance.

### Migration semantic-preservation rule

Adopted from VisualForge VF-FIND-025. When a spec change substitutes one implementation pattern for another (raw element → wrapper component, native control → library widget, in-line text → externalized microcopy), the acceptance test must include explicit assertions about the original contract being preserved.

Concrete examples from the field:

- **Heading hierarchy:** if a spec rewrites a page's heading from "raw `<h1>`" to "use the `<CardTitle>` wrapper," the acceptance test must assert the page still has exactly one h1. CardTitle defaulted to h3, regression went silent through 14 unit tests.
- **Form action wiring:** if a spec rewrites a submit button from raw `<button type="submit">` to a wrapper that defaults `type="button"`, the acceptance test must assert each form's submit button has `type="submit"`. Otherwise the form never submits.
- **ARIA roles:** if a spec replaces a raw `role="alert"` with a wrapper that defaults to `role="status"`, the acceptance test must assert critical announcements still trigger assistive-tech interrupt behavior.
- **Input semantics:** if a spec replaces a raw `<input type="password">` with a wrapper that defaults to `type="text"`, the acceptance test must assert password inputs still mask their value.

The discipline: **every migration acceptance test must include a probe section** that articulates each pre-migration assumption as an explicit test. Phrase each as "ASSUMPTION: <original contract>" — this surfaces invisible defaults that the new wrapper encapsulates.

This is the spec-layer mirror of the VisualForge probe-suite rule in `test-discipline-and-mutation-protocol.md` Rule 6.

## Multi-consumer domain operations: server-workflow SoT

When a spec describes a domain operation that has (or will have) more than one entry point converging on the same source-of-truth change, the spec MUST anticipate a **shared workflow / domain-service layer** rather than letting each entry point ("adapter") grow its own copy of the domain logic.

Why this lives in the spec layer: discovering the duplication at implementation time means each adapter has already shipped a near-identical block of glue (auth narrowing, validation, persistence, post-commit notification). Refactoring after the fact is doable but wasteful, and the second adapter often silently drifts from the first (different error semantics, missing one branch of the outcome contract, different atomic boundary) before anyone notices. The spec is the cheapest place to name the workflow as the single source of truth.

This is a methodology, not a stack-specific pattern. The "workflow" may be a server module, a domain service, a use-case object, a command handler, an RPC, or a script function — whatever the host project's architecture calls a "named piece of domain logic the adapters call into." The adapters likewise vary: HTTP route + form action, message-queue consumer + admin form, CLI + scheduled job, webhook + internal API, etc.

### When the spec must call out a workflow

Trigger the workflow-SoT clause in the spec when ANY of these are true:

- The same domain operation is reachable from two or more entry-point styles (synchronous request, user-driven form action, scheduled job, queue consumer, webhook, CLI, operator console, internal API).
- A scheduled/automated path performs the same write as a user-initiated path.
- An operator/admin path and a self-serve path converge on the same persistence change.
- A future entry point is named in roadmap for an operation that today has only one caller.

If only one entry point exists today AND no second is named in roadmap, workflow extraction is premature — spec it inline against the single adapter and add a deferred review trigger if/when a second consumer appears.

### What the spec must contain when the clause fires

The spec describes the workflow at the language and convention level of the host stack — not in terms of any specific framework, ORM, or queue. The reviewer's job is to see that the six items below are answered; the surface form (file path, type system, transaction primitive, queue) is whatever the project already uses.

1. **Named workflow surface.** The spec names a single canonical location for the shared domain operation, following the host project's existing module-naming conventions. The name is stable enough that downstream consumers and the project's source-of-truth registry (content map, dependency graph, package manifest — whatever artifact the project uses) can reference it without ambiguity. An ad-hoc or unspec'd name forces a docs cascade when a second consumer arrives.
2. **Enumerated outcome contract.** The spec enumerates every outcome of the workflow — success and each refusal branch — as a closed set of named variants. Each adapter's contract becomes "map outcome X to the right protocol response." A spec that says "the action returns an error" without naming the variants is decorative. The variant shape (tagged union, sealed class, result enum, structured error code) follows the host language's idiom.
3. **Adapter responsibilities, explicit.** For each entry point the spec names what that adapter does on top of the workflow. Examples — adapt to the actual surfaces in scope:
   - Synchronous request/response surface → status codes, response shape, idempotency, rate-limit.
   - Browser-driven form/action surface → redirect or flash semantics, progressive-enhancement contract.
   - Scheduled or event-driven surface → idempotency key, retry semantics, dead-letter path.
   - Operator/admin surface → authorization scope, audit-emit, dry-run mode.
4. **Critical vs degraded path split.** The workflow owns what is critical (the persistence change that is the source of truth). Side effects that are notifications, observability, or downstream eventing — anything where a transient failure must not roll back the critical write — belong to the ADAPTER, wrapped per the project's failure-isolation discipline. The spec must state which side effects are degraded and which adapter owns each. A spec that buries notifications inside the workflow forces every future caller (scheduled job, internal API, CLI) to inherit and re-run them.
5. **Transaction (or atomicity-unit) scope.** The spec names what the workflow's atomic boundary covers and what it deliberately does not. Cross-aggregate updates, cascade restoration, and "future" eventual-consistency repairs should be called out as separate flows. The atomicity primitive (DB transaction, saga step, idempotent operation) is whatever the host stack uses.
6. **Gate ordering.** If the workflow has multiple refusal gates, the spec specifies their order and requires an ordering probe per gate-pair in the test suite. Otherwise a refactor can silently reorder gates and present the wrong refusal to the user.

### Acceptance test contract for the workflow

Every workflow spec must require, in language adapted to the host test stack:

- One paired-condition test per outcome variant: the variant is returned AND no persistence side effect occurs when the variant is a refusal.
- Side-effect probes on the success branch: the atomic boundary opens once, each persistence call is invoked with the expected arguments, and degraded-path side effects are NOT invoked from inside the workflow.
- One ordering probe per gate-pair.
- A mutation-log entry recording at least one deliberate sabotage per refusal branch ("delete this gate, which test catches it?").

### Source-of-truth registration

The implementation deliverable must register the workflow in whatever SoT-tracking artifact the consuming project uses (content map, architecture register, module graph). The registration entry names: the workflow location, its consumers, its outcome contract, and the degraded-path side effects each adapter owns. The spec should cite this registration as the implementation handoff artifact; without it, a second adapter can ship its own copy of the domain logic with no audit signal.

### Mutation review for this section

> "If I deleted the workflow-SoT clause from this spec, which acceptance test would catch the resulting duplication?"

Answer: the implementation reviewer's audit pass against the SoT-tracking artifact would catch a missing registration; the implementer's blast-radius review would catch a second adapter shipping its own copy of the domain logic. If neither check is named in the spec, the clause is decorative — strengthen it or remove it.

## Flag spec-bound copy as test-required

When a spec includes literal user-visible text that carries legal, regulatory, compliance, or product-safety meaning, mark it explicitly in the spec so implementers know to write a `textContent` probe asserting the exact string. Examples that have surfaced as real risks:

- Billing/checkout return pages with disclaimers like "Paid access is not granted by this return page." A copy edit to "Your subscription is active" would mislead users into believing their plan is active before payment-provider verification.
- PIPEDA / GDPR right-of-deletion confirmation copy ("Your account is scheduled for deletion in 30 days").
- Tax-threshold status copy where the wording is bound to a regulatory citation.
- Liability disclaimers ("RenewalRadar is a reminder service, not a filing, legal, or tax advice service").

Spec-format suggestion: mark these strings inline with a `(spec-bound)` annotation or pull them into a dedicated "Required strings" section of the screen spec. The acceptance test must include a probe like:

```typescript
it("ASSUMPTION: success page does NOT imply access granted (spec-bound disclaimer)", () => {
  expect(container.textContent).toMatch(/Paid access is not granted/);
});
```

Why this lives in the spec layer: the implementer cannot tell, by reading the code alone, which strings are casually-worded vs contractually-bound. A copy edit during a redesign sweep can violate a regulatory contract silently. The probe is the spec → implementation handoff that protects the contract.

## Source Anchors

These acceptance tests align with:

- C4 Model: architecture docs should use clear system, container, component, and supporting views.
- OWASP Threat Modeling: threat docs should include subject, assumptions, threats, mitigations, validation, and prioritized improvements.
- NIST SSDF SP 800-218: security and release docs should include secure development practices and verification.
- ADR guidance: decision docs should capture architecturally significant choices with rationale, tradeoffs, and consequences.
- Google Developer Documentation Style Guide: docs should prioritize clarity and project-specific reader needs.
- Atlassian PRD guidance: product docs should cover purpose, assumptions, user stories, options, success metrics, supporting context, open questions, and scope boundaries.
