---
name: specforge-privacy-compliance
description: Create privacy, data protection, consent, retention, deletion, analytics, vendor sharing, and compliance review docs.
---

# Privacy and Data Protection Documentation

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` and `../_specforge-shared/references/document-quality-rubric.md` before drafting or revising docs.
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
- Keep the scope proportional to the app's risk, data sensitivity, expected scale, and user impact. Avoid both under-specification and needless enterprise bloat.
- Label every material claim as User-confirmed, Repo-derived with evidence path, Standard-backed with source title and version/date, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and say that online research was unavailable.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.

## Purpose

Create defensive privacy and data protection documentation. Do not give legal advice. Do not claim compliance. Flag when legal, privacy, or qualified domain review is needed.

## Required research pass

Use this prompt:

```text
Research current official privacy, data protection, platform, and developer-policy requirements for [app type/domain/platform/target users/regions/data sensitivity]. Include official app store policies, framework or cloud privacy docs, and relevant government or regulator overview pages when applicable. Extract design requirements for data minimization, consent, analytics, tracking, retention, deletion, export, age or child data, vendor sharing, and breach/incident documentation. Capture source title, owner, version or date, URL, and affected requirements.
```

If current research is unavailable, use the baked-in source map and clearly mark privacy-law items as review-needed.

## Inputs

- Product brief
- PRD
- Data model
- API contracts
- Security design
- UX screen map
- Third-party integrations
- Target regions, if known
- Existing repo evidence, if any

## Output files

Create or update:

- `docs/app-plan/security/18-privacy-data-protection.md`

## Required sections

Include:

- Purpose
- Status
- Inputs used
- Sources and basis
- Data minimization rules
- Personal data inventory
- Sensitive data inventory
- Data not to collect
- Collection purpose by data type
- Consent and notice points
- User access, export, correction, and deletion behavior
- Retention and deletion schedule
- Analytics and tracking rules
- Cookie or local storage rules, if applicable
- Vendor and third-party data sharing table
- Cross-border or hosting assumptions, if applicable
- Age and child-data screening
- Privacy risk register
- Review-needed items
- Traceability links

## Privacy requirement format

For each privacy requirement, include:

- Requirement ID.
- Data involved.
- User role affected.
- Purpose.
- Collection point.
- Storage location.
- Retention rule.
- Deletion behavior.
- User-facing notice or consent requirement.
- Verification method.
- Source basis.

## Existing repo mode

When a repo exists:

- Inspect schemas, migrations, analytics setup, cookies, local storage usage, env examples, third-party SDKs, auth provider config, and privacy docs.
- Record evidence paths.
- Do not expose secrets.
- Do not claim legal compliance from code evidence alone.

## Quality gate

Before finishing, check:

- Every personal data type has a purpose.
- Every sensitive data type has a control.
- Every data type has retention and deletion behavior.
- Every third-party service has data sent, data received, and exit plan.
- Tracking and analytics are explicit.
- Child-data and age assumptions are explicit.
- Legal review flags are clear where needed.

