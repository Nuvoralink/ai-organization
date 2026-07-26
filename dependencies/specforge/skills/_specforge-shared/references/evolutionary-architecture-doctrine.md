# Evolutionary Architecture Doctrine — Build Durable Seams, Not Guesses

Use this doctrine for greenfield architecture, phase foundations, platform work, existing-repo redesigns, and implementation planning. It is a working method, not a sentence to paste into a principles section.

## Product intent

Build one coherent product whose approved later capabilities extend established authorities. Do not optimize only for today's visible feature and force later work to replace its identity model, data ownership, workflow, provider path, or persistence. Also do not invent a universal framework against future contracts that have not been verified.

The target is **evolutionary architecture**: stable domain ownership now, additive feature policy and projections later, and explicit migrations when reality changes.

## Default architecture stance

- Prefer the simplest viable runtime shape, usually a **modular monolith**, until measured scale, compliance isolation, fault isolation, team ownership, or independent release cadence justifies extraction.
- Decompose by business capability and authority, not only by technical layer.
- Keep one owner for each decision, state transition, identity, workflow, and persisted truth.
- Prefer composition over inheritance. Object-oriented classes are optional implementation tools; inheritance trees are not an extensibility strategy.
- Use narrow domain-owned ports/adapters at external-provider and cross-domain seams. Provider implementations share domain contracts without leaking vendor payloads into callers.
- Use registered and versioned commands, events, DTOs, errors, states, capabilities, and configuration where multiple consumers depend on them.
- Make lifecycle, idempotency, failure, reconciliation, observability, and migration/retirement behavior explicit.

## Required future-capability audit

Before deciding architecture or implementation slices:

1. Inventory approved roadmap capabilities and required industry capabilities. Do not treat hypothetical ideas as approved scope.
2. For each capability, trace the authorities it will consume: actor/identity, tenant/workspace, authorization/entitlement, domain data, commands, events, provider/media/storage, jobs, audit, and final surfaces.
3. Find present-only assumptions that would become cross-cutting migrations: one tenant per user, one provider, one actor type, one call leg, one surface, one storage backend, browser-only ownership, direct provider calls, or feature-local state.
4. Classify every candidate seam with the admission test below.
5. Put admitted seams in the earliest phase where a real flow can exercise them. Put non-admitted seams in a documented extension-point register with an activation trigger, not in runtime code.
6. Make every later sprint/slice name the authority it extends, the feature-specific addition it owns, and the parallel authority it is forbidden to create.

## Seam admission test

Plant a seam now only when **all** are true:

1. **Known consumer:** the later capability is approved or an expected product-standard requirement.
2. **Expensive retrofit:** delaying would rewrite persisted history, public/external contracts, identity/tenancy, many callers, compliance/audit evidence, or a cross-cutting provider path.
3. **Stable domain boundary:** the seam can be named in product/domain terms without guessing a future vendor's payload or behavior.
4. **Current exercise:** a real current flow can traverse the seam end to end, so it is live architecture rather than dead scaffolding.

Classification:

| Result | Action |
| --- | --- |
| All four pass | Build the smallest durable seam now and route every current caller through it. |
| Known + expensive, but no verified/current consumer | Document the stable extension point, identities, authority boundary, and activation proof; do not add dead runtime machinery. |
| Future vendor contract is unknown | Keep today's vendor-specific implementation behind a domain boundary; generalize only after reading the real second contract. |
| Retrofit is cheap and local | Build later with the feature; record the trigger if useful. |
| No approved second consumer | Keep the concrete implementation; do not extract a framework for aesthetic symmetry. |

## Required architecture artifacts

### Future capability map

| Future capability / phase | Existing authority it extends | Present-only assumption at risk | Seam now or documented later | Current consumer/proof | Later additive work | Forbidden parallel authority | Migration/retirement path | Killer mutation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

For an app with no approved later capabilities, include the table with `none approved`, the evidence basis, and the trigger that would reopen the audit. Do not invent roadmap scope to fill it.

### Bounded-context ownership map

For each context, name:

- data/tables it owns;
- commands/mutations it owns;
- events/contracts it publishes;
- ports/providers it calls;
- downstream consumers;
- forbidden direct writes or bypasses;
- extraction trigger, if any.

### Extension-point register

Document-only entries include the future consumer, stable authority/identity it will reference, why runtime code is premature, evidence required before activation, and the source files/contracts that must remain additive-friendly. An extension-point register is not permission to add dead flags, enum members, tables, routes, methods, or provider branches.

## Implementation rules

- Every foundation slice identifies the **current liveness consumer**. If no current product path uses the new seam, stop and reclassify it as documentation-only.
- Every later feature slice declares `Existing authority extended`, `Feature-specific addition`, and `Forbidden parallel authority`.
- Move all current callers through the new seam in the same change or an explicit expand/backfill/repoint/retire migration. A steady-state dual writer is a defect.
- Provider capabilities are explicit; do not force all providers into a guessed lowest-common-denominator interface or scatter `if provider` branches through product code.
- Projections, analytics, search, dashboards, and integrations consume domain events/contracts. They do not become operational truth or write around the owning domain service.
- Feature-specific tables may reference shared identities/aggregates/artifacts/commands. They may not copy provider identifiers or own a competing lifecycle.
- Hardcoded present-only relationships are architecture bugs even when the literal is technically correct today. Derive them from the owning registry/context/relationship.

## Proof contract

An evolutionary-architecture claim requires:

1. **Current-consumer liveness:** a real current flow traverses the seam and fails when the seam is removed.
2. **Bypass scan:** repo-wide search or structured dependency check shows current callers do not reach the old/direct/parallel path.
3. **Retirement proof:** any superseded field, writer, helper, provider call, route, or state owner is removed or explicitly bounded to migration compatibility with an expiry trigger.
4. **Future-consumer contract:** later work names the existing authority and cannot silently create a sibling owner.
5. **Killer mutation:** deliberately bypass the seam, restore the present-only assumption, or add a second writer; a named test/gate/review must fail.
6. **Counterexample:** prove the doctrine does not force an unused abstraction where no approved second consumer or verified contract exists.

## Fail-states

- The architecture says “scalable” or “extensible” but has no future-capability map, authority owner, current consumer, or bypass proof.
- A known future feature is scheduled to create its own user model, state machine, event stream, provider client, storage pipeline, conference/session model, permissions, or data owner beside Phase 1.
- A present-only relationship is copied into many callers because it is true today.
- A generic interface contains imagined methods for an unread/unavailable future provider.
- Dead flags, enum values, tables, routes, or branches are added only so the code “looks future-proof.”
- Two writers remain after consolidation and the plan calls the duplicate a compatibility layer without an expiry and retirement proof.

## Regression mutation and counterexample

**Regression mutation:** remove the `Future capability map` or `Existing authority extended` section from an architecture/implementation package, or change a later slice to call a provider/persistence path directly. SpecForge validation/review must fail.

**Counterexample that must remain allowed:** a small app has no approved later consumers. Its architecture keeps one concrete implementation, records `none approved` plus an extraction trigger, and adds no plugin framework, unused provider interface, dead state, or speculative table. This is compliant.

## Completion questions

Before calling architecture or phase-foundation work ready, answer:

1. Which approved later capabilities were audited?
2. Which expensive assumptions were corrected now, and which real current flows exercise the seams?
3. Which extension points remain documentation-only, and what proof activates them?
4. What old/direct paths were retired?
5. Which test or gate catches a later parallel system?
6. Did this produce durable domain ownership, or merely more abstraction?
