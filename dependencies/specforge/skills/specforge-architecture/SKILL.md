---
name: specforge-architecture
description: Create architecture docs, C4 diagrams, ADRs, deployment view, runtime flows, failure modes, blast radius, and tradeoffs.
---

# Architecture Documentation


Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` before drafting or revising docs.
- Read and apply `../_specforge-shared/references/evolutionary-architecture-doctrine.md` before drafting or revising architecture, roadmap, platform, or phase-foundation docs.
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

Produce architecture documentation that explains how the app should be structured, why the structure is the best fit, where failures can happen, and how changes are contained.

## Required research pass

Use this prompt:

```text
Research the newest official architecture and platform guidance for [selected stack/platform/cloud/database/auth provider]. Include C4 and architecture documentation structure references. Find official docs for deployment, routing, data access, caching, background jobs, auth, scaling, and observability. Prefer stable official docs and standards. Capture versions and URLs.
```

Use baked-in baseline sources:

- C4 Model for context, container, component, and code diagrams
- arc42 for architecture document structure
- NIST SSDF and CISA Secure by Design for secure design constraints

## Inputs

- Product brief
- PRD
- UX screen map
- Data requirements
- Security requirements
- Existing repo evidence, if any
- Preferred stack and constraints

## Output files

Create or update:

- `docs/app-plan/architecture/06-architecture.md`
- `docs/app-plan/architecture/07-adr-index.md`
- `docs/app-plan/architecture/adr/ADR-0001-initial-architecture.md`
- `docs/app-plan/engineering/15-blast-radius-and-change-risk.md`, architecture sections. Use `$specforge-blast-radius-change-risk` for the complete blast-radius document

## Architecture document sections

Include:

- Architecture summary
- Goals and constraints
- Architecture principles
- Future capability map
- Evolution and extension strategy
- Bounded-context and authority ownership map
- Extension-point register with activation proofs
- C4 context diagram
- C4 container diagram
- Component map
- Runtime flows
- Deployment view
- Environment model
- Dependency map
- Failure modes
- Performance budgets
- Scalability assumptions
- Security-relevant architecture choices
- Blast radius overview
- Tradeoffs
- Open questions

Use Mermaid for diagrams unless the repo already uses another diagram format.

## Architecture choices

For each major decision, create or update an ADR:

- Stack choice
- Database choice
- Auth choice
- API style
- State management
- Deployment model
- Storage model
- Background jobs
- Observability stack
- AI integration model, if applicable

Each ADR must include:

- Status
- Context
- Decision
- Alternatives considered
- Why this is the best course
- Consequences
- Risks
- Reversal trigger

## Evolutionary architecture requirements

- Inventory approved/expected later capabilities and map each to the existing identity, authority, data, command, event, provider, artifact, and surface boundaries it must extend.
- Apply the seam admission test: known consumer, expensive retrofit, stable domain boundary, and real current exercise. Build now only when all four pass.
- Default to the simplest viable runtime shape, normally a modular monolith decomposed by business capability. Prefer composition and narrow domain ports over inheritance hierarchies or generic framework layers.
- For admitted seams, name the current liveness consumer, migration/retirement path, bypass scan, future consumer, forbidden parallel authority, and killer mutation.
- For non-admitted seams, document the extension point and evidence trigger; do not create dead flags/enums/tables/routes or imagined provider methods.
- If no later capabilities are approved, record `none approved` with evidence and an extraction trigger. Do not invent roadmap scope.

## Blast radius requirements

Identify:

- Critical components
- Data touched by each component
- Users affected by component failure
- Security impact of compromise
- Operational impact of downtime
- Rollback or containment option
- Required tests before changing the component

## Existing repo mode

When a repo exists:

- Derive current architecture from files, imports, routes, services, schemas, and deployment config.
- Do not invent a new architecture unless the user asks for a redesign.
- Mark stale docs and mismatches.
- Use file paths as evidence.
- If architecture is unclear, create a `Current inferred architecture` section and list uncertainty.

## Quality gate

Before finishing, check:

- C4 context and container views exist.
- Main runtime flows exist.
- Major decisions have ADRs.
- Tradeoffs are explicit.
- Failure modes are documented.
- Blast radius is documented for high-risk components.
- Architecture does not contradict product scope, data contracts, or security design.
- Future capabilities extend named authorities; every planted seam has a current consumer and proof; no speculative framework or later parallel authority is authorized.

