---
name: specforge-engineering-rules
description: Create engineering rules, AGENTS.md, repo conventions, dependency policy, PR checklist, protected files, and docs update rules.
---

# Engineering Rules Documentation


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

Produce durable engineering rules that keep Codex and developers aligned with the app documentation, repo conventions, security requirements, and quality gates.

## Required research pass

Use this prompt:

```text
Research the newest official engineering guidance for [selected stack, framework, package manager, language, test framework, linter, deployment platform]. Find official docs for project structure, routing, state/data fetching, security config, dependency management, testing, and deployment. Capture versions and URLs.
```

## Inputs

- Product scope
- Architecture
- Data contracts
- Security design
- Testing and release requirements
- Existing repo conventions, if any

## Output files

Create or update:

- `docs/app-plan/engineering/12-engineering-rules.md`
- `AGENTS.md`, if requested or missing

## Engineering rules sections

Include:

- Repo purpose
- Source of truth docs
- Folder structure
- Naming rules
- Code style
- Type safety rules
- State management rules
- API calling rules
- Error handling rules
- Logging rules
- Environment variable rules
- Secrets rules
- Dependency policy
- Database migration rules
- Background job rules
- Testing rules
- Documentation update policy
- Pull request checklist
- Protected files and high-risk areas
- Allowed and blocked changes for AI coding agents
- Evolutionary architecture rules: future-consumer/seam matrix, seam admission test, one authority per state/decision, current-consumer liveness, no later parallel system, and no speculative framework

## AGENTS.md rules

If creating or updating `AGENTS.md`, include:

- Repo purpose
- Source of truth docs
- Working rules
- Setup commands
- Test commands
- Protected areas
- Documentation rules
- Evolutionary architecture and extension-seam rules
- Security-sensitive change policy
- Dependency approval policy
- How to validate docs

Preserve any existing AGENTS.md instructions unless they conflict with current repo reality or user instructions. When conflicts exist, document the conflict before changing the file.

## Dependency policy

Require:

- No new production dependency without reason
- Alternatives considered
- Security and maintenance check
- License concern check, when relevant
- Lockfile update rule
- No dependency added only to avoid writing simple code
- No deprecated or abandoned package without explicit reason

## Protected change policy

Require explicit approval before changing:

- Auth
- Authorization
- Payments
- Personal data handling
- Database migrations
- Secrets and env config
- CI/CD
- Production deployment config
- Admin tools
- Data deletion or retention behavior

## Existing repo mode

When a repo exists:

- Derive rules from actual files, scripts, lockfiles, lint config, tests, CI, framework conventions, and existing docs.
- Do not overwrite real repo conventions with generic rules.
- Add missing rules only where they improve clarity or safety.
- Record evidence paths.

## Quality gate

Before finishing, check:

- Rules are actionable.
- Commands match the repo.
- Protected areas are listed.
- Dependency policy exists.
- Docs update policy exists.
- AGENTS.md does not exceed useful length and links to detailed docs.
- Architecture/foundation rules require current-consumer proof and later authority reuse while explicitly allowing concrete one-off code when no approved second consumer exists.

