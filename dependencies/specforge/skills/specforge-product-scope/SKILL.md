---
name: specforge-product-scope
description: Create product brief, PRD, feature scope, non-goals, user roles, acceptance criteria, monetization, positioning, and traceability.
---

# Product Scope Documentation


Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` before drafting or revising docs.
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

Produce the product foundation that defines what the app is, what it is not, who it serves, what it must do, and what is out of scope.

## Required research pass

Research current product documentation and requirements best practices only when useful. For app-specific domains, research authoritative domain constraints and platform rules. For regulated or sensitive domains, research official compliance overview sources enough to identify review needs, but do not give legal advice.

Use this prompt:

```text
Research current authoritative product requirements and domain constraints for [app type/domain/platform]. Find official platform policies, developer docs, and relevant standards. Extract requirements that affect scope, user roles, permissions, monetization, content, data, safety, or launch constraints. Prefer official sources.
```

## Inputs

- App idea
- Interview answers
- Existing repo evidence, if any
- Current docs, if any
- Assumptions Register

## Output files

Create or update:

- `docs/app-plan/product/01-product-brief.md`
- `docs/app-plan/product/02-prd.md`
- `docs/app-plan/product/03-feature-scope.md`

## Product brief requirements

Include:

- One sentence app definition
- Problem statement
- Target audience
- Non-target audience
- User roles
- Core value proposition
- Product boundaries
- Success metrics
- Failure metrics
- Monetization hypothesis
- Marketing positioning
- Competitor and alternative categories
- Explicit non-goals
- Assumptions and open questions

## PRD requirements

For every feature, include:

- Feature ID
- Feature name
- Purpose
- User story
- Acceptance criteria
- Functional requirements
- Non-functional requirements
- Permissions
- Data touched
- API or integration touched
- UI states
- Empty states
- Error states
- Abuse or misuse cases
- Security and privacy notes
- Analytics events
- Test requirements
- Dependencies
- Out-of-scope behavior

## Scope rules

Classify features into:

- MVP
- V1
- Future
- Explicitly out of scope

Do not put a feature in MVP unless it is required for the core app to work.

Do not include vague features such as `AI recommendations`, `admin dashboard`, or `analytics` without exact behavior, data, permissions, and acceptance criteria.

## Traceability matrix

Create a matrix with:

- Requirement ID
- Source: user, repo, standard, assumption
- Feature
- User role
- Data touched
- Security concern
- UI screen
- API endpoint
- Test case
- Status

## Anti-slop rules

Do not write generic PRD content. Every feature must mention the exact user role, data touched, screen or non-UI path, permission rule, and acceptance criteria. If details are unknown, add an assumption or open question with risk impact.

## Quality gate

Before finishing, check:

- The app has clear non-goals.
- Each feature has acceptance criteria.
- Each user role has permissions.
- Each requirement has a source.
- Risky features are flagged for security design.
- Assumptions are explicit.

