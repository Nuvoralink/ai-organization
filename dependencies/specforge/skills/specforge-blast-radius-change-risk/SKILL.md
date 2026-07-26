---
name: specforge-blast-radius-change-risk
description: Create blast radius and change risk docs. Maps critical assets, high-risk workflows, protected boundaries, required controls, tests, rollback, and doc impact.
---

# Blast Radius and Change Risk Documentation

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
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.
- Apply the anti-slop rubric at `../_specforge-shared/references/document-quality-rubric.md` before finishing.
- Every requirement must have an ID, source, owner or affected role, verification method, risk level, and related document links.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Do not output placeholder tokens such as TODO, TBD, lorem ipsum, `[fill in]`, or fake example values as if they are real.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, and risks must use the same IDs and names.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.

## Purpose

Create a change-risk map so future Codex work knows which components, workflows, data types, and docs need extra care before modification.

## Required research pass

Use this prompt:

```text
Research current official guidance for secure change management, blast radius analysis, release safety, rollback, incident containment, and supply-chain controls for [stack/platform/cloud/CI]. Include NIST SSDF, CISA Secure by Design, SLSA, OWASP ASVS/MASVS where applicable, and official deployment platform docs. Capture versions, URLs, and how each source affects change-risk documentation.
```

## Inputs

- Product scope
- Architecture
- Data contracts
- Security design
- Threat model
- Engineering rules
- Testing and release docs
- Existing repo evidence, if any

## Output files

Create or update:

- `docs/app-plan/engineering/15-blast-radius-and-change-risk.md`

## Required sections

Include:

- Critical assets
- High-risk workflows
- Protected boundaries
- Change risk levels
- Blast radius by component
- Blast radius by data type
- Required controls by risk level
- Required tests by risk level
- Rollback and containment notes
- Documentation impact matrix

## Change risk levels

Define at least four levels:

- Low: isolated UI/content change with no data, auth, payment, or deployment impact.
- Medium: feature behavior, validation, or non-sensitive API/data changes.
- High: auth, authorization, sensitive data, payments, migrations, admin tools, production config, integrations, or AI tool use.
- Critical: changes that can expose data, break account access, alter retention/deletion, affect payments, bypass safety controls, or impact production availability.

For each level, define:

- Approval needed
- Tests required
- Docs to update
- Rollback plan required
- Monitoring required
- Evidence to preserve

## Component blast radius table

For each component, include:

- Component ID
- Component name
- Data touched
- Users affected
- Dependencies
- Failure mode
- Security impact
- Operational impact
- Change risk level
- Required tests
- Rollback or containment option
- Related docs

## Documentation impact matrix

Map change types to required doc updates.

Examples:

- API change affects PRD, screen map, API contracts, tests, security design, and AI guardrails.
- Data model change affects data contracts, security design, threat model, testing, release checklist, and blast radius.
- Auth change affects PRD permissions, security design, threat model, engineering rules, tests, and AGENTS.md protected areas.

## Existing repo mode

When a repo exists:

- Infer critical components from routes, auth middleware, schemas, migrations, services, CI, deployment config, env templates, tests, and docs.
- Record evidence paths.
- Do not change code.
- Mark unknown blast radius as high until clarified.

## Quality gate

Before finishing, check:

- Every high-risk feature appears in the blast-radius doc.
- Every sensitive data type appears in the blast-radius doc.
- Auth, authorization, payments, admin tools, migrations, CI/CD, production config, and AI tools are protected if present.
- Each change-risk level has required controls and tests.
- The doc maps changes to required documentation updates.

