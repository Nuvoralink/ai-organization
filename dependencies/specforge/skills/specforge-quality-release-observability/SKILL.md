---
name: specforge-quality-release-observability
description: Create testing strategy, CI gates, release checklist, rollback plan, monitoring, alerting, and incident response docs.
---

# Quality, Release, and Observability Documentation


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

Produce the quality system that defines how the app proves it works, ships safely, detects failures, and recovers.

## Required research pass

Use this prompt:

```text
Research the newest official guidance for testing, CI/CD, release, observability, and deployment safety for [selected stack/platform/cloud]. Include official framework testing docs, CI provider docs, OWASP CI/CD Security, SLSA, NIST SSDF, and official observability docs if a tool is selected. Capture versions and URLs.
```

## Inputs

- PRD
- Architecture
- Data contracts
- Security design
- Engineering rules
- Existing CI/tests, if any

## Output files

Create or update:

- `docs/app-plan/engineering/13-testing-quality-release-observability.md`

## Testing strategy requirements

Include:

- Quality model
- Unit test strategy
- Integration test strategy
- End-to-end test strategy
- Contract test strategy
- Accessibility checks
- Security checks
- Performance checks
- Regression checks
- Test data rules
- Test environment rules
- Coverage expectations by risk, not arbitrary percentage only

Every acceptance criterion in the PRD must map to at least one test type.

## CI quality gates

Define gates for:

- Lint
- Format check
- Type check
- Unit tests
- Integration tests
- End-to-end tests, if applicable
- Dependency scan
- Secret scan
- Security scan
- Build
- Migration check
- Documentation validation
- Release approval

## Release checklist

Include:

- Scope summary
- Changed components
- Changed data contracts
- Changed security assumptions
- Migration status
- Backup status
- Rollback plan
- Feature flag plan, if applicable
- Monitoring plan
- Known risks
- Post-deploy checks

## Observability plan

Define:

- Logs
- Metrics
- Traces, if applicable
- Dashboards
- Alerts
- Error tracking
- Uptime checks
- Background job monitoring
- Payment or integration monitoring, if applicable
- Security event monitoring
- Privacy-safe logging rules

## Incident response outline

Include:

- Severity levels
- Detection sources
- Initial triage steps
- Rollback or containment
- Communication notes
- Evidence preservation
- Post-incident doc updates

Do not include instructions for hiding or abusing failures. Keep it defensive.

## Existing repo mode

When a repo exists:

- Inspect test files, scripts, CI config, deployment config, monitoring docs, logging setup, and release notes.
- Use actual commands from the repo.
- If commands are missing, propose them as docs requirements instead of pretending they exist.
- Record evidence paths.

## Quality gate

Before finishing, check:

- Tests map to requirements.
- CI gates are explicit.
- Release checklist includes rollback.
- Monitoring covers high-risk workflows.
- Logging avoids secrets and personal data.
- Incident response has severity levels.

