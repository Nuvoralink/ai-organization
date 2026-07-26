---
name: specforge-implementation-task-plan
description: Create an AI-safe implementation task graph from the docs, with feature slices, dependencies, protected areas, acceptance gates, tests, and Codex prompt templates.
---

# AI Implementation Task Plan

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, observable, reversible, and proportional course of action.
- Label every material claim as User-confirmed, Repo-derived with evidence path, Standard-backed with source title and version/date, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, APIs, prices, policies, or platform rules.
- If current research is available, use current official sources. If not, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.
- Apply the anti-slop and document-quality rubrics before finishing.
- Every requirement must have an ID, source, affected role or component, risk level, verification method, and related docs.
- Use `Unknown` with an impact note when information is missing.
- Do not output placeholder tokens such as TODO, TBD, lorem ipsum, `[fill in]`, or fake values as if real.
- Keep naming consistent across docs: roles, features, entities, endpoints, screens, components, events, metrics, risks, controls, and ADRs must reuse the same IDs and names.

## Purpose

Convert the documentation package into small future Codex tasks that preserve scope, minimize blast radius, and force verification before coding work.

## Required research pass

Use this prompt:

```text
Research current official implementation guidance for the selected framework, testing tools, routing, data access, CI, deployment, and code generation guardrails. Prefer official framework docs and repo evidence. Record source title, owner, version or date, URL, stable or draft status, document sections affected, and requirement IDs affected.
```

Record sources in `docs/app-plan/auditability/research-ledger.md` when research affects requirements.

## Inputs

- Docs in `docs/app-plan/`
- Product scope, PRD, architecture, data contracts, API contracts, security design, privacy docs, and testing docs
- Existing repo evidence paths, if any
- Current user answers and assumptions register

## Output files

Create or update:

- `docs/app-plan/implementation/29-ai-implementation-task-plan.md`

## Required sections

Include:

- Implementation principles
- Vertical slice map
- Task dependency graph
- Task contract template
- Feature slice tasks
- High-risk task gates
- Protected files and components
- Required tests per task
- Required docs updates per task
- Rollback or containment per task
- Codex prompt templates
- Do-not-build-yet list
- Assumptions blocking implementation
- Requirement impact map
- Future consumer and foundation seam map

## Existing repo mode

When a repo exists:

- Derive facts from code, config, docs, lockfiles, tests, routes, schemas, migrations, CI, deployment config, and environment templates where relevant.
- Record evidence paths for repo-derived facts.
- Preserve existing naming and conventions unless they conflict, mislead, or create risk.
- Mark recommended changes separately from current behavior.
- Do not change product code.
- Do not expose secret values.

## Quality gate

Before finishing, check:

- The doc uses this app's actual roles, features, data, components, endpoints, screens, events, metrics, and risks.
- Not applicable sections are explicit and justified.
- Unknowns include impact if wrong.
- Every requirement has evidence, risk, verification, and related docs.
- Related docs are updated when names, platforms, features, or task gates change.
- Every architecture/foundation task applies the seam admission test, names a current liveness consumer, forbidden parallel authority, retirement path, and killer mutation. Future-only unknown contracts remain documented extension points, not dead code.

