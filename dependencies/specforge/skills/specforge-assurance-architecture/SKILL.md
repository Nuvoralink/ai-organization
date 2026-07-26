---
name: specforge-assurance-architecture
description: Build proportional assurance docs for source-of-truth, decision ownership, surface authority, validation fixtures, and documentation lifecycle. Use when user-visible claims, workflow state, roles, payments, integrations, exports, dashboards, generated content, or AI can drift.
---

# SpecForge Assurance Architecture

Use this skill when the app has user-visible claims or decisions that could mislead users if wrong.

Trigger examples:

- workflow status;
- permissions or role-based controls;
- payments, subscriptions, invoices, quotas, or billing state;
- dashboards, analytics, scores, rankings, or reports;
- exports or external integrations;
- generated content, recommendations, summaries, or runtime AI;
- admin actions;
- sensitive data;
- multiple sources that can disagree;
- existing repo docs or UI surfaces that disagree with code.

Do not run the full extension for a simple low-risk static site unless the user asks for it. Keep scope proportional to risk.

Shared references:

- `../_specforge-shared/references/assurance-source-of-truth-patterns.md`
- `../_specforge-shared/references/source-of-truth-layer-template.md`
- `../_specforge-shared/references/decision-matrix-template.md`
- `../_specforge-shared/references/prompt-decision-matrix-template.md`
- `../_specforge-shared/references/surface-authority-map-template.md`
- `../_specforge-shared/references/golden-fixture-catalog-template.md`
- `../_specforge-shared/references/docs-authority-lifecycle.md`
- `../_specforge-shared/references/bounded-remediation-and-validation-protocol.md`
- `../_specforge-shared/references/first-viewport-acceptance-template.md`

## Core rule

Do not import product-specific examples from past projects into the new app. Extract only reusable patterns, then scale them to this app.

## Applicability decision

Before creating extension docs, choose an assurance tier.

- Tier 0: simple low-risk app. Record not-applicable-with-reason in `README.md` and `auditability/decision-log.md`.
- Tier 1: normal app with users, data, workflows, or integrations. Create source-of-truth and surface authority docs, or add those sections to existing docs if separate docs would create bloat.
- Tier 2: high-impact app with payments, sensitive data, admin actions, dashboards, exports, critical statuses, or regulated review needs. Create the full assurance extension.
- Tier 3: runtime AI or non-deterministic decisions. Create the full extension plus AI/model prompt matrices, evals, provenance, bounded remediation, and usage metering.

## Required output when the extension is triggered

Create or update these docs:

- `docs/app-plan/assurance/product-assurance-contract.md`
- `docs/app-plan/assurance/source-of-truth-map.md`
- `docs/app-plan/assurance/decision-boundary-matrix.md`
- `docs/app-plan/assurance/surface-authority-map.md`
- `docs/app-plan/assurance/validation-fixture-plan.md`
- `docs/app-plan/auditability/documentation-lifecycle.md`

If the app has no runtime AI, do not fake an AI section. In `assurance/decision-boundary-matrix.md`, write `Runtime AI: not-applicable-with-reason`, then document non-AI decision owners such as user input, admin approval, product policy, database state, external providers, or rule engines.

Do not create assurance docs that only say another document needs to be created.
If an in-scope security, privacy, API, architecture, runbook, or quality doc is
missing, create the actual doc or update the existing living authority that owns
that topic.

## Process

1. Restate the assurance risk in plain language.
2. Identify every user-visible claim, status, score, recommendation, generated output, dashboard metric, role-controlled action, export, admin decision, and integration state that could mislead users if wrong.
3. Build the product assurance contract: what the app may claim, what it must never fake, what user trust depends on, and what happens when evidence is weak.
4. Build the source-of-truth map: claim -> authority owner -> inputs -> validation -> remediation -> fail state -> persistence -> API/DTO -> UI/export/aggregate -> test.
5. Build the decision boundary: what humans, product policy, rule engines, external providers, deterministic code, and AI/model stages own.
6. Build decision matrices for each high-risk AI, automated, or rule-driven stage. Use prompt matrices only for runtime AI/model stages.
7. Build the surface and output authority map: each important page/card/report/export/notification, its primary user question, source fields, role rules, first-useful-viewport acceptance, and limited/unavailable states.
8. Build the fixture and validation plan: local replay, deterministic fixtures, perturbation cases, source-to-surface assertions, role/API checks, screenshots/export checks when needed, and one production-path/model run only when justified.
9. Build the documentation authority lifecycle: active docs, generated docs, marketing docs, historical docs, future backlog, retired plans, and code-vs-doc audit rules.
10. Add requirements, risks, tests, and decisions back into `README.md`, `auditability/decision-log.md`, and the relevant living quality, guardrails, blast-radius, or implementation-task docs where they exist.

## Anti-shortcut checks

Before finishing, ask:

- Did any surface invent truth because it had a slot?
- Did any fallback outrank a stronger authority layer?
- Did deterministic code become a semantic or domain-policy brain without an explicit exception?
- Did a prompt-only, code-only, or UI-only change fail to reach the final visible output?
- Did an old doc stay active because it had one useful future idea?
- Did a role see filters or controls it cannot use?
- Did an object selector rely on filenames, IDs, or weak labels when better human identity exists?
- Did validation silently patch meaning instead of using bounded remediation or fail-closed behavior?
- Did tests prove only rendering, or did they prove source-to-surface truth?
- Is broad root-cause work bounded by a named risk or data-flow boundary?
- Did the assurance extension become bigger than the app needs?

## Completion standard

Do not mark the assurance docs ready unless each high-risk claim has:

- authority owner;
- evidence requirement;
- validation or provenance rule;
- fail-closed, limited, pending, or unavailable state;
- downstream consumer list;
- test proof;
- documentation authority status.
