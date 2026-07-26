# Interview Question Bank

Use these questions as a bank, not as a script. Do not ask all of them. For live interview execution, use `$specforge-discovery-interview` first, then pull from this bank only for needed follow-ups.

## Minimal interview policy

Ask only the questions that materially change product scope, risk, architecture, data handling, security, compliance, or implementation order.

Default budget:

- First round: 3 to 5 questions.
- Follow-up round: 1 to 3 questions.
- Maximum before drafting: 8 questions, unless the app is high-risk or the user asks for a deeper interview.

For any question where the user must choose what to use or what to do, include a short recommendation, why, pros and cons, and the tradeoff.

For non-blocking gaps, research current official sources and choose best-fit defaults. Record them as AI-recommended defaults in `auditability/decision-log.md`.

## Round 0, decision-blocking questions

Use this as the default first round:

1. What is the app in one sentence, and who is the primary user?
2. What must the first working version accomplish?
3. What are the must-have features and explicit non-goals?
4. Does it involve login, permissions, payments, minors, UGC, messaging, public content, sensitive data, AI, agents, tool use, or a regulated domain?
5. Is there an existing repo, and should Codex make documentation-only changes?

## Round 1, product identity

1. What is the app in one sentence?
2. What problem does it solve?
3. Who is the primary user?
4. Who is explicitly not the user?
5. What is the first version supposed to accomplish?
6. What should the app never try to do?
7. What platform is needed: web, mobile, desktop, API, browser extension, internal tool, or something else?
8. Is this a consumer app, business app, marketplace, internal tool, developer tool, content app, AI app, or regulated-domain app?
9. What are the top 3 outcomes that prove the app works?
10. What is the biggest failure condition?

## Round 2, features and scope

1. What are the must-have features?
2. What features are tempting but out of scope?
3. What user journeys must exist from start to finish?
4. What roles exist: guest, user, admin, moderator, vendor, support, developer, other?
5. What permissions does each role need?
6. What integrations are needed?
7. What notifications are needed?
8. What search, filtering, sorting, or recommendation behavior is needed?
9. What content does the app create, store, display, or moderate?
10. What monetization model is expected?

## Round 3, data and risk

1. What personal data will the app collect?
2. What sensitive data might appear?
3. What data must never be stored?
4. What data must users be able to export or delete?
5. What records need audit history?
6. What data retention rules should exist?
7. What are the highest-risk actions in the app?
8. What abuse cases are realistic?
9. What happens if a user account is compromised?
10. What happens if an admin account is compromised?

## Round 4, technical preferences

1. Is there a preferred stack?
2. Is there an existing repo?
3. Are there required frameworks, cloud providers, databases, or auth providers?
4. Should the app support offline mode?
5. What scale should the first production version handle?
6. What performance requirements matter?
7. What environments are needed: local, test, staging, production?
8. Are payments, subscriptions, or invoices needed?
9. Is the app multi-tenant?
10. Does the app include AI, LLMs, agents, RAG, tool use, or generated content?

## Round 5, documentation preferences

1. What docs already exist?
2. Should docs be created in `docs/app-plan/` or another location?
3. Should Codex create or update `AGENTS.md`?
4. Should API contracts be OpenAPI, GraphQL schema, gRPC proto, AsyncAPI, or another format?
5. Should diagrams use Mermaid, PlantUML, text, or another format?
6. Should the docs assume a strict MVP or a more complete V1?
7. What standards or regulations does the app need to consider?
8. What level of detail is required: startup MVP, production SaaS, enterprise-grade, or regulated-grade?
9. What files or folders should not be touched?
10. Are there naming, tone, or branding rules?

## Proceeding without all answers

If the user wants to proceed without answering everything, create an `Assumptions Register` with:

- Assumption
- Reason
- Impact if wrong
- Affected docs
- Risk level
- What to confirm later


## Round 6, business, policy, operations, and analytics

1. What launch regions or countries should the docs assume?
2. Will the app be distributed through the Apple App Store, Google Play, a browser extension store, a marketplace, or direct web access?
3. Will users pay through subscriptions, one-time payments, in-app purchases, invoices, or another method?
4. Does the app target or attract minors, students, families, or schools?
5. Does the app allow user-generated content, public profiles, messaging, comments, reviews, uploads, marketplaces, or AI-generated content?
6. What product analytics are allowed, and what tracking should be forbidden?
7. What cost limits, quota limits, or vendor budget limits matter for the first production version?
8. What environments are required and who may access each one?
9. What secrets, credentials, or production systems must Codex never access?
10. What operational runbooks are required before launch: deploy, rollback, backup, restore, incident, security incident, migration?


# v4 Minimal Interview and Recommendation Rules

Use this section before the older question lists.

## Interview budget

Ask at most 5 initial questions. Ask at most 3 follow-up questions. Ask more only when a missing answer changes safety, legality, privacy, data exposure, payments, minors, production access, or the core product definition.

## Preferred question types

Ask about constraints, not preferences.

Prefer:

- `Do you have a required platform, stack, provider, launch region, or budget ceiling?`
- `Will the app handle minors, payments, sensitive personal data, UGC, messaging, AI outputs, or regulated decisions?`
- `What must the MVP do, and what must it explicitly not do?`

Avoid:

- `What database do you want?`
- `What architecture do you want?`
- `What testing approach do you want?`
- `What security practices should we use?`

For avoided questions, Codex should research and recommend a default.

## Required format for choice questions

When asking the user to choose, use the decision-question format from `guided-interview-and-recommendation-protocol.md`:

- Question ID.
- Why it matters.
- Recommended default.
- Why this default fits the app.
- Options with pros, cons, and when to choose.
- Final recommendation.
- Assumption if unanswered.

## Default first interview

When the app idea is vague, ask these five questions:

1. What is the app in one sentence, who is it for, and what problem does it solve?
2. What are the 3 to 5 must-have MVP features, and what is explicitly out of scope?
3. What user roles exist, and which actions or data need protection?
4. Will the app involve payments, minors, sensitive personal data, UGC, messaging, AI outputs, file uploads, location data, or regulated domains?
5. Are there hard constraints for platform, stack, launch region, providers, budget ceiling, deadline, existing repo, or files that must not be touched?

If the answer to question 4 is yes, ask focused follow-ups only for the high-risk trigger.

## Default behavior after interview

For all non-blocking details, Codex should:

- Research current official sources.
- Pick the best app-specific default.
- Explain pros and cons in the decision and defaults register.
- Mark the default as Standard-backed or Assumption.
- Define reversal triggers.

## Recommendation wrapper for choice questions

When asking a choice question, use this compact format:

```text
Question: [decision-blocking question]
Recommendation: [best-fit default]
Why: [short app-specific reason]
Pros: [1 to 3 pros]
Cons: [1 to 3 cons]
Confirmation needed: yes/no
```

Do not ask users to choose routine implementation details unless their preference changes the product, risk, or constraints. Choose researched defaults and record them.


