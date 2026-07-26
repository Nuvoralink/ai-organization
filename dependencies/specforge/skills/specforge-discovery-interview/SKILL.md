---
name: specforge-discovery-interview
description: Run SpecForge's product-manager/developer discovery interview when a user gives a vague app idea, client brief, or early product concept. Use to choose the minimal decision-blocking questions, order them, build the decision matrix, recommend defaults, identify risk triggers, and produce confirmed decisions, assumptions, and next documentation scope before generating app docs.
---

# Discovery Interview

Use this skill before SpecForge generates docs from a vague app idea, client brief, or early product concept. The job is to extract the few facts that would change the product, architecture, risk, or implementation plan, then let SpecForge research and recommend defaults for everything else. For broader interviews, load `references/question-repository.md`; do not load it for simple briefs unless the first-pass questions are insufficient.

## Product-manager/developer stance

Think like a product manager and implementation lead at the same time:

- Product manager: clarify user, problem, outcome, MVP boundary, non-goals, value, success, and risk.
- Developer: identify source of truth, data, roles, permissions, integrations, platform constraints, delivery order, testability, and hard-to-reverse choices.
- Do not run a generic questionnaire. Ask only questions where the answer changes scope, risk, architecture, data handling, security, compliance, implementation order, or launch readiness.

## Research basis

This interview model is based on common product discovery patterns:

- GOV.UK Service Manual: discovery should establish user needs and whether to move forward before alpha/build work.
- Atlassian product discovery: discovery should connect customer needs, business context, prioritization, and transparent decision logic.
- SVPG: discovery should assess value, usability, feasibility, and viability risk instead of treating every idea as equally risky.
- Product Talk / Continuous Discovery: start from a clear outcome, use interviews to discover opportunities, map assumptions, and avoid yes/no confirmation traps.

Use these as principles, not as a script. SpecForge still adapts to the user's product, previous answers, repo evidence, and risk profile.

## Infer-before-asking rule

Before asking anything:

1. Extract already-known answers from the current conversation, repo evidence, existing docs, attached files, and prior SpecForge decisions.
2. Build a temporary intake state with four labels: `Known`, `Inferable`, `Ask`, and `Defer`.
3. Ask only the highest-impact `Ask` items.
4. For `Inferable` items, offer a recommended assumption with pros, cons, and reversal trigger instead of asking the user to decide.
5. Never ask a question just because it exists in the repository.

A good interview feels adaptive: each answer should reduce the next question set.

## Interview order

Use this order unless the user already answered a section:

1. Product identity: app one-liner, primary user, problem, desired outcome.
2. MVP boundary: first useful version, must-have workflows, explicit non-goals.
3. Users and authority: roles, protected actions, ownership, source-of-truth expectations.
4. Risk triggers: personal or sensitive data, minors, payments, UGC, messaging, public content, uploads, location, AI, agents, regulated domains, production access.
5. Constraints: platform, stack, providers, launch region, budget ceiling, deadline, existing repo, files not to touch.
6. Success and failure: metrics, biggest failure condition, trust expectations.
7. Implementation readiness: integrations, data migration, operational needs, release/rollback constraints.

Ask the first five only when the app is vague. Ask follow-ups only for high-risk triggers or contradictions.

## Default first interview

When the user gives a general idea, ask at most these five questions:

1. What is the app in one sentence, who is the primary user, and what problem should it solve for them?
2. What must the first useful version do, what are the 3 to 5 must-have features, and what is explicitly out of scope?
3. What user roles exist, and which actions, records, or screens need permissions or ownership rules?
4. Will the app involve payments, minors, sensitive personal data, UGC, messaging, public content, file uploads, location data, AI outputs, agents, tool use, or regulated decisions?
5. Are there hard constraints for platform, stack, providers, launch region, budget ceiling, deadline, existing repo path, or files that must not be touched?

If the user already answered one, skip it. If the app is high risk, ask targeted follow-ups for that risk instead of expanding into a full questionnaire.

## Dynamic question selection

Use `references/question-repository.md` as the large question bank. Select from it by module:

- Always consider product identity, MVP boundary, roles/permissions, risk triggers, and constraints.
- Load follow-up modules only when a trigger is present.
- Skip questions already answered directly or indirectly.
- Collapse related unknowns into one question when possible.
- After each user answer, update the intake state and stop when docs can proceed safely.

## Question scoring matrix

Score candidate questions before asking them:

| Criterion | Score |
| --- | --- |
| Changes product scope, target user, MVP, or non-goals | 0 to 3 |
| Changes data model, permissions, source of truth, or API contract | 0 to 3 |
| Changes security, privacy, compliance, safety, payments, minors, or AI controls | 0 to 3 |
| Changes implementation order, release risk, or rollback plan | 0 to 2 |
| User is the only reliable source | 0 to 3 |
| Current uncertainty is high | 0 to 2 |
| Decision is hard to reverse | 0 to 2 |

Ask when the total is 6 or higher, or when any safety/legal/privacy/payment/minor/AI trigger scores 3. Otherwise, infer, research, recommend a default, and record the assumption with impact.

## Decision matrix

Use this matrix to decide what to ask, default, or defer:

| Decision area | Ask user when | Recommend/default when | Output location |
| --- | --- | --- | --- |
| Product identity | User, problem, or app purpose is ambiguous | Wording can be inferred from brief | product brief, PRD |
| MVP scope | Missing answer changes first release | Details are sequencing, not scope | PRD, feature scope |
| Non-goals | The app could expand into risky or expensive areas | Non-goal is obvious from MVP | product brief, feature scope |
| Roles and permissions | Any protected data/action exists | Simple public/static app | PRD, security, data/API |
| Source of truth | Multiple systems or surfaces could own a decision | Single obvious owner exists | architecture, assurance |
| Data and retention | Personal, sensitive, uploaded, or regulated data exists | Only low-risk transient data exists | data/API, privacy |
| AI and automation | AI output, scoring, ranking, agents, or tool use exists | AI is only Codex assisting development | AI guardrails, assurance |
| Payments and monetization | Users pay, invoices exist, or stores are involved | Monetization is future hypothesis | business, compliance |
| Platform and stack | User has a hard constraint | Standard stack can be researched | architecture, engineering |
| Existing repo boundary | Repo exists or files must not be touched | Greenfield docs-only package | documentation audit, AGENTS |
| Launch region and policy | Region changes law, tax, privacy, or store policy | Region not launch-blocking | compliance, privacy |
| Operations and release | Production data or external integrations exist | Prototype only | runbooks, release docs |

## Follow-up branching

Ask follow-ups only where a risk trigger is present:

- Payments: ask payment model, provider constraints, refund/subscription needs, tax review trigger.
- Minors/students/families: ask age range, guardian/school involvement, data collected, qualified review trigger.
- UGC/messaging/public content: ask moderation needs, reporting, blocking, abuse cases, retention.
- AI/agents: ask what the model may decide, what it may never decide, tools/data it can access, human review needs, final visible surface.
- Sensitive data: ask data types, retention, deletion/export, access roles, audit history.
- Existing repo: ask repo path, docs-only boundary, protected files, current source of truth.

## Recommendation and inference behavior

When a missing answer is not blocking, do not ask for it. Offer a default:

- Recommended default.
- Why it fits this product.
- Pros and cons.
- What could make the default wrong.
- Reversal trigger.
- Source basis: user-confirmed, repo-derived, standard-backed, or assumption.

When a previous answer implies a later answer, use the implication but mark it as inferred. Example: if the user says the app is for students under 13, infer minor/privacy review triggers and ask only the missing high-risk details.

## Recommendation format

For any choice question, use this compact format:

```text
Question: [decision-blocking question]
Why it matters: [product/architecture/risk reason]
Recommended default: [best-fit assumption]
Options: [2 to 3 options with short pros and cons]
Confirmation needed: yes/no
Assumption if unanswered: [what SpecForge will use]
```

Do not ask users to choose routine implementation details such as database, auth provider, test runner, observability tool, or deployment platform unless they gave a hard constraint or the choice materially changes risk. Research and recommend those defaults later.

## Interview output

Before docs generation, return or record:

- Product intent restated.
- Questions asked now.
- User-confirmed decisions.
- AI-recommended defaults to research later.
- Assumptions with impact.
- High-risk triggers and follow-up needs.
- Scope profile recommendation: full package, focused package, existing repo repair, or hybrid.
- Proceed or blocked decision.

If the user answers enough to proceed, stop interviewing and begin docs generation. Do not keep asking for preferences that can be handled by researched defaults.

