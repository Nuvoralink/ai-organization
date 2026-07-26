---
name: specforge-implementation-artifacts
description: After SpecForge docs are complete and validated, build concrete implementation artifacts from them, including file-level plans, slice specs, contracts, tests, migration plans, rollout gates, and Codex execution prompts.
---

# Implementation Artifacts

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Use this skill after `$specforge` has generated or repaired `docs/app-plan/`, `$specforge-reviewer` has run, and strict validation has passed or all remaining validation failures are explicitly understood and recorded.

## Purpose

Convert the completed SpecForge documentation package into implementation documents that a future coding pass can execute safely.

This skill does not write product code unless the user explicitly asks for code changes. Its job is to turn product intent, source-of-truth decisions, architecture, contracts, risks, and verification requirements into concrete implementation artifacts.

The output must close the gap between "what should happen" and "what needs to be built":

- Which files, modules, routes, screens, migrations, jobs, prompts, policies, and tests are likely affected.
- Which source of truth owns each behavior or decision.
- Which contracts must be created, changed, or preserved.
- Which verification gates prove the implementation reached the final user-visible or machine-consumed output.
- Which shortcuts were rejected and why.
- Which unknowns block implementation and which can be handled with researched defaults.

## Trigger

Use this skill when the user asks for implementation documents, implementation artifacts, build docs, coding handoff docs, issue/task specs, engineering execution docs, or a post-SpecForge implementation pack.

Do not run this skill before the core docs exist unless the user explicitly asks for a draft. If the docs are missing or stale, run or repair `$specforge` first.

## Root-level implementation protocol

Before generating artifacts:

1. Restate the product intent in plain language.
2. Identify the intended source of truth for each feature, workflow, user-visible claim, AI decision, data state, and permission boundary.
3. Audit the whole relevant implementation pipeline end to end:
   - product requirement;
   - domain decision owner;
   - data model and persistence;
   - API or integration contract;
   - background jobs, queues, or scheduled work;
   - frontend surface or exported output;
   - validation and error states;
   - tests, observability, release, and rollback;
   - documentation update path.
4. Find the earliest stage where implementation could drift from the product intent.
5. Design the artifact around the root implementation architecture, not a narrow workaround for the first visible task.
6. Use validators, smoke tests, fixtures, and review gates as backstops. Do not make a validator the primary source of product intelligence when the product decision belongs upstream.
7. Apply `../_specforge-shared/references/evolutionary-architecture-doctrine.md`: inventory approved later consumers, classify candidate seams, and refuse both a present-only implementation that forces a later parallel system and an unused abstraction with no current liveness consumer.

If an existing repo is present, inspect repo evidence before finalizing artifacts. Use actual paths, commands, route names, schema names, component names, test conventions, environment files, CI files, deployment files, and lockfiles where available. Mark unverified paths as `Assumption` with impact.

## Required research pass

Research current official and authoritative implementation guidance for the selected stack and risk profile before choosing artifact shape or implementation defaults.

Prefer:

- official framework documentation;
- official database, ORM, migration, and API docs;
- official test-runner, browser-testing, accessibility, and CI docs;
- OWASP, NIST, CISA, W3C, OpenAPI, AsyncAPI, OAuth/OIDC, and platform policy docs where relevant;
- official deployment, observability, secrets, and cloud provider docs;
- official AI SDK, model provider, eval, prompt, safety, and metering docs when the app has AI behavior.

Use this research prompt internally:

```text
Research the newest official implementation best practices for [stack/workflow/artifact] for this app type, launch environment, data sensitivity, and risk level. Prefer official sources and standards over blog posts. Record source title, owner, version or date, URL, stable or draft status, affected implementation artifacts, affected requirement IDs, recommended implementation defaults, risks, verification method, and reversal trigger. Compare credible options. Reject quick fixes that only patch a visible symptom when the root source of truth or downstream consumer would still drift.
```

Record sources in `docs/app-plan/auditability/research-ledger.md` when research affects an implementation decision. If current internet access is unavailable, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.

## Inputs

Use the completed docs in `docs/app-plan/`, especially:

- docs index or `README.md`;
- product brief, PRD, feature scope, user flows, and UX/UI contract;
- architecture, ADRs, data model, API and integration contracts;
- security design, threat model, privacy, compliance, trust and safety;
- engineering rules, AI guardrails, blast-radius and change-risk docs;
- testing, quality, release, observability, runbooks, environment, dependency, cost, analytics, glossary, and platform contracts;
- assurance docs when present: product assurance contract, source-of-truth map, decision-boundary matrix, surface-authority map, validation-fixture plan, and documentation lifecycle;
- `auditability/decision-log.md`, `auditability/research-ledger.md`, `auditability/documentation-audit.md`, and `auditability/documentation-quality-review.md`.

If the implementation-task-plan doc exists, use it as an input, but do not treat it as sufficient. This skill must create concrete build artifacts and verification gates.

## Output location

Create or update implementation artifacts under:

```text
docs/app-plan/implementation/
```

Use descriptive lowercase kebab-case filenames. Do not create filler files. If an artifact is not applicable, record that in `docs/app-plan/implementation/README.md` with the reason and reactivation trigger.

## Required output artifacts

Create or update the artifacts that are in scope:

- `README.md`: implementation artifact index, generation context, research status, source package version, artifact map, omitted artifact register, and execution order.
- `implementation-roadmap.md`: release slices, dependency order, sequencing rationale, risk levels, acceptance gates, rollback triggers, blocked work, future capability map, and foundation-seam ownership.
- `vertical-slice-specs.md`: one buildable slice per feature or workflow, including requirement IDs, user-visible outcome, source of truth, existing authority extended, feature-specific addition, forbidden parallel authority, current-consumer proof for any planted seam, files/modules likely touched, data/API/UI/test/doc impacts, killer mutation, acceptance criteria, and stop condition.
- `repo-change-map.md`: actual or proposed file/module ownership, protected areas, new files, changed files, generated files, boundaries not to cross, and blast-radius notes.
- `data-migration-and-backfill-plan.md`: schema changes, migration order, backfill strategy, data validation, rollback/restore notes, idempotency, privacy constraints, and test data rules when persistence changes.
- `api-and-contract-implementation.md`: endpoints, DTOs, schemas, events, webhooks, auth/permission checks, error states, idempotency, rate limits, versioning, and contract tests.
- `ui-implementation-contract.md`: screen/component work, state model, loading/empty/error/limited/unavailable states, accessibility, responsive behavior, first-useful-viewport checks, and visual regression or screenshot gates.
- `state-jobs-and-runtime-flow.md`: client/server state ownership, background jobs, queues, schedules, retries, concurrency, cache invalidation, consistency, and observability.
- `security-privacy-implementation-controls.md`: concrete auth, RBAC, CSRF, input/output handling, secrets, logging, privacy, retention, abuse, and dependency controls mapped to implementation tasks.
- `ai-decision-implementation-matrix.md`: required only when AI or non-deterministic decisions exist; include source authority, allowed outputs, disallowed outputs, provenance, prompt/model stages, validators, bounded retries, eval fixtures, cost controls, and final surface consumption.
- `verification-and-test-harness.md`: unit, integration, contract, E2E, accessibility, security, performance, migration, eval, smoke, and release gates with commands when repo evidence exists.
- `release-rollout-runbook.md`: feature flags, deployment steps, migration order, monitoring, alerting, rollback, support playbook, and post-release checks.
- `codex-implementation-prompts.md`: safe future Codex prompts per slice, each with owned files, blocked files, required tests, docs to update, no-shortcut checks, and final proof expected.
- `implementation-risk-register.md`: implementation risks, root cause, blast radius, mitigation, verification, owner or affected role, and reversal trigger.

## Artifact quality rules

Every implementation artifact must include:

- status;
- inputs used;
- sources and basis;
- related requirement IDs;
- related decisions and ADRs;
- assumptions with impact;
- open questions;
- affected files or proposed file locations;
- verification method;
- rollback or containment notes;
- traceability links to related docs.

Every slice or task must include:

- implementation outcome;
- root source of truth;
- upstream dependencies;
- downstream consumers;
- data touched;
- permission and privacy impact;
- UX or API states affected;
- tests to add or update;
- docs to update in the same coding change;
- stop condition;
- shortcuts explicitly rejected.
- existing authority extended and forbidden parallel authority;
- seam classification (`build-now`, `document-only`, or `build-with-feature`) with admission-test evidence;
- current-consumer liveness and killer mutation when a foundation seam is built.

For existing repos, each concrete claim about current implementation must cite repo evidence paths. For greenfield plans, mark file paths as proposed and explain the convention used.

## AI and semantic decision work

When an implementation involves AI, scoring, ranking, matching, generated content, recommendations, classification, or semantic decisions:

- Build a decision matrix rather than a phrase-level deterministic rule.
- Define decision inputs, authority hierarchy, allowed outputs, disallowed output classes, provenance requirements, examples, and counterexamples.
- Put semantic intelligence in the model or intended decision owner.
- Use deterministic code for schema, grounding, provenance, safety, permission, and contract validation.
- Add bounded remediation: failed validation should feed back into regeneration of only the failed fields or lines, then merge repaired fields into the validated-good payload.
- Verify that the validated decision reaches the final user-visible surface, export, API response, persisted record, or downstream consumer.

## Conflict handling

If docs conflict with each other or with repo evidence:

1. Identify the conflict and affected downstream artifacts.
2. Determine the source of truth using `assurance/source-of-truth-map.md`, `auditability/decision-log.md`, repo evidence, and user-confirmed requirements.
3. Update the owning docs first if the conflict blocks implementation artifacts.
4. Record the correction in `auditability/decision-log.md`, `auditability/documentation-audit.md` when existing repo mode applies, and the implementation artifact index.
5. Continue only after the implementation artifact reflects the corrected source of truth.

Do not hide conflicts by writing generic tasks.

## Quality gate

Before finishing:

- Confirm the core docs exist and either passed strict validation or list the exact validation blockers.
- Confirm implementation artifacts map product intent through data, API, UI, persistence, validation, tests, release, and final output.
- Confirm each high-risk workflow has source-of-truth ownership, downstream consumers, fail states, test proof, rollback, and observability.
- Confirm no artifact says only "implement best practices" without concrete controls and verification.
- Confirm no task asks a future agent to discover the whole architecture again.
- Confirm shortcuts and temporary workarounds are rejected or explicitly labeled `Temporary` with removal triggers.
- Confirm every approved later capability maps to a foundation authority or a documented activation trigger; every planted seam is exercised by a current flow; and no artifact invents dead framework/provider machinery.
- Confirm all repo-derived paths and commands were checked or marked as assumptions.
- Run the implementation-artifact validator from the active skill pack:
  - Plugin/local skill path: `../_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict`.
  - Manual repo install path: `.agents/skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict`.
  - Add `--existing-repo` when artifacts claim repo-derived implementation evidence.
  - Add `--require-ai-matrix` when the app has runtime AI, semantic decisions, scoring, ranking, classification, recommendations, generated content, or model-owned outputs.
- Fix validator failures before marking the implementation pack ready. Do not downgrade the gate by calling the package "focused" unless the user explicitly requested a targeted implementation artifact subset; if focused mode is used, record omitted artifacts with not-applicable-with-reason and reactivation triggers.

## Final response format

Return:

- Product intent restated.
- Implementation artifacts created or updated.
- Research status and key sources used.
- Highest-risk implementation decisions.
- Blockers or assumptions.
- Validation and quality-gate result.
- Recommended first implementation slice.
- Suggested next safe Codex prompt.
