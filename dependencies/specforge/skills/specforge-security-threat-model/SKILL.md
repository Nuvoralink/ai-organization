---
name: specforge-security-threat-model
description: Create security design, threat model, abuse cases, trust boundaries, security requirements, and standards mapping.
---

# Security Design and Threat Model Documentation


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

Produce defensive security documentation that makes risks, trust boundaries, controls, and verification requirements explicit.

Do not provide offensive exploit instructions. Keep threat analysis focused on defensive design, risk reduction, testing requirements, and safe controls.

## Required research pass

Use this prompt:

```text
Research the newest official and authoritative security requirements for [app type/platform/stack/data sensitivity]. Include NIST SSDF, CISA Secure by Design, OWASP ASVS for web, OWASP API Security Top 10 for APIs, OWASP MASVS for mobile, OWASP Top 10 for awareness, OWASP Threat Modeling, OWASP SAMM, OWASP LLM Top 10 if AI/LLM features exist, and official security docs for the selected framework/cloud/auth provider. Capture versions, URLs, and how each source affects requirements.
```

## Inputs

- Product scope
- User roles and permissions
- Data model
- API contracts
- Architecture
- UX flows
- Existing repo evidence, if any

## Output files

Create or update:

- `docs/app-plan/security/10-security-design.md`
- `docs/app-plan/security/11-threat-model.md`
- `docs/app-plan/engineering/15-blast-radius-and-change-risk.md`, security sections. Use `$specforge-blast-radius-change-risk` for the complete blast-radius document

## Security design requirements

Include:

- Security goals
- Security non-goals
- Risk level
- Assets
- Trust boundaries
- Authentication model
- Authorization model
- Session management
- Input validation
- Output handling
- File upload rules, if applicable
- Secrets management
- Encryption plan
- Dependency and supply chain controls
- Audit logging
- Abuse prevention
- Rate limiting
- Admin action controls
- Privacy controls
- Security testing requirements
- Standard mapping

## Threat model requirements

Use a structured method such as STRIDE when useful.

Include:

- Assets
- Actors
- Entry points
- Trust boundaries
- Data flow diagram
- Threat list
- Abuse cases
- Existing controls
- Required controls
- Residual risk
- Review triggers

For each threat, define:

- Threat ID
- Component
- Actor
- Scenario summary
- Impact
- Likelihood
- Risk rating
- Required control
- Verification method
- Residual risk

## Auth and authorization rules

Document:

- Identity provider
- Login methods
- Passwordless or password rules, if applicable
- MFA assumptions
- Session lifetime
- Token storage
- Password reset behavior
- Role model
- Permission matrix
- Object-level access control
- Admin controls
- Audit requirements

Every protected object must have an owner and access rule.

## AI app security rules

If the product includes LLMs, agents, RAG, vector stores, generated content, or tool use, include:

- Prompt injection controls
- Tool permission boundaries
- Sensitive data handling
- Output validation
- Retrieval permissions
- System prompt secrecy limits
- Cost and rate limits
- Human approval for high-impact actions
- AI audit logging
- Model and dependency supply chain notes
- Evaluation requirements

Use `$specforge-ai-guardrails` for the full AI guardrails document.

## Existing repo mode

When a repo exists:

- Inspect auth, routes, middleware, permissions, schema, secrets config, logging, CI, dependency files, and tests.
- Record evidence paths.
- Flag missing security docs and mismatches.
- Do not expose secret values.
- Do not modify security-sensitive code unless explicitly asked.

## Quality gate

Before finishing, check:

- All roles have permissions.
- All sensitive data has controls.
- All trust boundaries are documented.
- High-risk workflows have abuse cases.
- Controls have verification methods.
- Security docs map to current app scope and architecture.

