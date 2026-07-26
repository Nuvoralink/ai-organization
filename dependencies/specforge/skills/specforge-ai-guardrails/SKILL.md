---
name: specforge-ai-guardrails
description: Create AI development guardrails, task contracts, allowed changes, blocked changes, approval gates, research rules, and diff review rules.
---

# AI Development Guardrails Documentation


Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` before drafting or revising docs.
- Read `../_specforge-shared/references/no-shortcuts-decision-protocol.md` before drafting or revising docs.
- Read `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` before asking the user implementation or tooling questions.
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

Produce guardrails that tell Codex and other AI coding agents exactly how to work on the app without inventing features, drifting from docs, weakening security, or making broad unsafe changes.

## Required research pass

Use this prompt:

```text
Research the newest official guidance for Codex skills, AGENTS.md, AI coding agent rules, and the selected repo stack. If the app includes AI product features, include OWASP LLM Top 10 2025 and NIST SP 800-218A. Capture source titles, versions or dates, URLs, and how the guidance affects guardrails.
```

Use OpenAI Codex sources for:

- Skill structure
- Skill descriptions and triggers
- AGENTS.md durable repo instructions
- MCP when external context is needed
- Subagents for specialized workflows

## Inputs

- Product docs
- Architecture docs
- Data contracts
- Security docs
- Engineering rules
- Existing repo instructions, if any

## Output files

Create or update:

- `docs/app-plan/engineering/14-ai-development-guardrails.md`
- `AGENTS.md`, if requested or appropriate

## AI operating rules

Include:

- Read source-of-truth docs before changes.
- Do not invent features.
- Do not change unrelated files.
- Do not broaden scope without updating docs and asking for approval.
- Do not add dependencies without approval and documented reasoning.
- Do not change protected areas without approval.
- Do not weaken validation, security, logging, tests, or accessibility.
- Do not store or reveal secrets.
- Do not log personal data.
- Do not silently ignore failing tests.
- Do not remove tests unless the requirement is removed and documented.
- Do not create temporary workaround fixes when a durable fix is required.
- Do not ask the user to choose routine implementation details when Codex can research and recommend a best-fit default.
- When a choice matters, present options, pros and cons, final recommendation, verification, and reversal trigger.
- For repo issues, identify the root cause before proposing docs, rules, or implementation tasks.


## Allowed changes

Define what Codex may change without extra approval. Examples:

- Documentation files inside `docs/app-plan/`.
- Tests related to an approved implementation task.
- Non-production config for local validation.
- Narrow code changes that match the task contract and avoid protected areas.

For each allowed category, define boundaries and verification.

## Blocked changes

Define what Codex must not change without explicit approval. Include at least:

- Authentication and authorization behavior.
- Payment logic.
- Data retention, deletion, export, or privacy behavior.
- Production secrets, env config, deployment config, or CI/CD.
- Database migrations.
- Admin permissions.
- Dependency changes.
- Security controls, validation, logging, or tests that would be weakened.
- Large refactors hidden inside feature work.

## Codex task contract

Every AI implementation task must include:

- Objective
- Source docs to read
- Files allowed to change
- Files blocked from change
- Acceptance criteria
- Required tests
- Security checks
- Documentation updates required
- Approval gates
- Rollback note

## Research rules

Require Codex to:

- Use current official docs for stack-specific decisions when internet or MCP is available.
- Use baked-in source map when internet is unavailable.
- State research status.
- Cite or list source titles and URLs in docs when research changes a decision.
- Never claim a version or API exists without evidence.

## Diff review rules

Before completion, Codex must report:

- Files changed
- Why each file changed
- Requirements satisfied
- Tests run
- Tests not run and why
- Docs updated
- Security-sensitive areas touched
- Assumptions made

## Approval gates

Require approval before:

- Adding production dependencies
- Running migrations
- Changing auth or permissions
- Touching payments
- Changing data retention or deletion
- Changing CI/CD deployment behavior
- Accessing external services through MCP
- Making production changes
- Deleting files
- Disabling tests or security checks

## AI product feature guardrails

If the app includes LLMs, agents, RAG, generated content, or tool use, include:

- Tool access boundaries
- Retrieval access control
- Prompt injection mitigation
- Output validation
- Human approval for high-impact actions
- Sensitive data filtering
- System prompt exposure limits
- Cost controls
- Rate limits
- Abuse monitoring
- Evaluation plan
- Incident response for unsafe AI behavior

## Prompt templates

Include reusable task prompts:

```text
Use the app documentation as source of truth. Objective: [specific task]. Allowed files: [list]. Blocked files: [list]. Read these docs first: [list]. Acceptance criteria: [list]. Required tests: [list]. Security checks: [list]. Do not broaden scope. Report assumptions before editing.
```

```text
Review this diff against docs/app-plan. Find scope drift, missing tests, security regressions, data contract mismatches, weak error handling, accessibility gaps, and docs that must be updated. Do not rewrite code unless asked.
```



When a repo exists:

- Read existing AGENTS.md and AI-related docs.
- Preserve existing rules unless stale or unsafe.
- Align guardrails to actual repo commands and protected files.
- Record evidence paths.

## Quality gate

Before finishing, check:

- Guardrails are specific enough to constrain AI behavior.
- Protected areas are explicit.
- Approval gates are explicit.
- Research rules are explicit.
- Existing repo commands are accurate.
- Product AI risks are covered if applicable.


## No-shortcut decision protocol

For future Codex implementation work, require:

- Do not choose the fastest code change when it leaves the root cause unresolved.
- For every risky change, produce a short decision card before editing.
- For bugs, stale docs, auth, permissions, data integrity, migrations, security, privacy, production config, and dependency changes, run root-cause analysis before proposing the fix.
- Do not hardcode, weaken validation, broaden permissions, silence errors, skip tests, or remove checks to make progress.
- If a temporary workaround is unavoidable, label it Temporary, state the risk, define the correct fix, and set the removal trigger.
- Do not reveal private reasoning. Show only concise rationale, evidence, decision card, tests, and diff summary.

## No-shortcuts decision rules

Codex must:

- Evaluate whether a proposed action fixes the root cause or only the symptom.
- Compare at least two options for material decisions.
- Prefer durable, testable, secure, maintainable, and reversible solutions.
- Avoid broad refactors hidden inside small tasks.
- Avoid narrow patches when the root cause is a broken contract, permission model, data model, or architecture boundary.
- Record material decisions in `auditability/decision-log.md`.
- Show concise rationale, not private chain-of-thought.


## Runtime AI assurance rules

If the app includes runtime AI, generated recommendations, generated content, scoring, summaries, ranking, or automated decisions:

- Create a decision matrix and AI prompt addendum before validators.
- Include positive and negative examples for the same concept.
- Keep semantic judgment with the model, a human, or an explicit expert layer. Do not let hidden deterministic fallback logic become the product brain.
- Keep deterministic code responsible for schema, grounding, provenance, source freshness, exact policy, arithmetic, persistence, authorization, and display safety.
- Use bounded remediation for failed semantic fields. Do not silently patch meaning.
- Persist the generated decision and the evidence packet that produced it.
- Make accepted decisions drive user-visible output, not audit-only fields.
- If the model is unsure, use a limited, unavailable, pending-review, or fail-closed state.
- Meter paid AI calls by provider, model, stage, role, usage, cost, project/session, and trace/run identity.

