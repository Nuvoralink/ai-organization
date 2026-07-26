---
name: specforge-cost-capacity-performance
description: Create cost, capacity, performance budget, traffic, storage growth, quotas, external API cost, budget alert, scaling trigger, and performance test documentation.
---

# Cost, Capacity, and Performance Documentation

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose shortcuts, workaround fixes, or vague placeholders.
- Apply the guided interview protocol in `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` and no-shortcuts protocol in `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material choices, recommendations, and user-facing questions.
- Use private multi-option deliberation for material decisions. Do not reveal private reasoning; output only decision cards, concise rationale, pros and cons, recommendation, confidence, and reversal triggers.
- Run root-cause analysis for conflicts, stale docs, missing requirements, weak decisions, risky shortcuts, and repo-document mismatches before proposing fixes.
- Prefer durable, standard-aligned solutions over quick fixes. If a temporary workaround is unavoidable, label it `Temporary`, explain the risk, define the proper fix, and set the removal trigger.
- Keep the scope proportional to the app's risk, data sensitivity, expected scale, and user impact. Avoid both under-specification and needless enterprise bloat.
- Label every material claim as User-confirmed, Repo-derived with evidence path, Standard-backed with source title and version/date, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, policies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.
- Apply the anti-slop and document-quality rubrics before finishing.
- Every requirement must have an ID, source, owner or affected role, verification method, risk level, and related document links.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Do not output placeholder tokens such as TODO, TBD, lorem ipsum, `[fill in]`, or fake example values as if they are real.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, environments, metrics, and risks must use the same IDs and names.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.


## Purpose

Cost, Capacity, and Performance Documentation.

## Required research pass

Use this prompt:

```text
Research current official pricing, quota, rate-limit, performance, scaling, load-testing, database, cloud, deployment, and AI provider guidance for [stack/cloud/vendors]. Prefer official provider docs. Record dates checked because pricing and quotas change. Do not invent prices; use formulas or mark Unknown when current prices are unavailable.
```

Record sources in `docs/app-plan/auditability/research-ledger.md` when research affects requirements.

## Inputs

- Product scope
- Architecture
- API contracts
- Data model
- Release and observability docs
- Business model
- Existing repo evidence, if any

## Output files

Create or update:

- `docs/app-plan/engineering/25-cost-capacity-performance.md`

## Required sections

Include:

- Capacity assumptions
- Traffic and usage model
- Performance budgets
- Rate limits and quotas
- Storage growth model
- Background job capacity
- AI or external API cost controls, if applicable
- Cloud and vendor cost drivers
- Cost alerts and budget thresholds
- Scaling triggers
- Performance test plan

## Rules

- Do not invent vendor prices. Use formulas, current researched prices, or Unknown with impact.
- Performance budgets must be measurable.
- AI, email, SMS, storage, file processing, maps, payments, and search providers need cost-control rules when present.

## Existing repo mode

When a repo exists:

- Prefer repo evidence over assumptions for current behavior.
- Record file paths for repo-derived claims.
- Do not change product code.
- Do not expose secret values or private customer data.
- Mark unverified behavior as Assumption or Unknown with impact.

## Quality gate

Before finishing, check:

- The document is specific to this app, not generic.
- Each material claim has a source, repo path, user answer, or explicit assumption.
- Each requirement has a verification method.
- Not-applicable sections include reasons and reactivation triggers.
- Cross-document names and IDs match the rest of `docs/app-plan/`.

