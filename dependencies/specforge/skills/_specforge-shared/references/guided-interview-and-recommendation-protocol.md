# Guided Interview and Recommendation Protocol

## Purpose

Collect only the information that is truly needed from the user, then use research, repo evidence, and app-specific reasoning to choose strong defaults for everything else. For the active interview workflow, use `$specforge-discovery-interview`; this file is the supporting protocol.

The goal is not to bombard the user with a questionnaire. The goal is to remove ambiguity that would materially change product scope, risk, architecture, data handling, security, compliance, or implementation order.

## Core rule

Ask the fewest questions needed to avoid building the wrong app. Research and recommend the rest.

Do not ask the user to decide something Codex can responsibly infer from:

- The app idea.
- The target users.
- The platform.
- Existing repo evidence.
- Official documentation.
- Widely accepted standards.
- The app's risk level and data sensitivity.

## Question budget

Use this budget unless the user requests a deeper interview:

- First round: 3 to 5 questions maximum.
- Follow-up round: 1 to 3 questions maximum.
- Never ask more than 8 total questions before drafting docs unless the app is high-risk or the user asks for it.

High-risk triggers can justify more questions:

- Payments.
- Authentication or admin permissions.
- Personal or sensitive data.
- Minors, students, schools, families, or age gating.
- User-generated content, messaging, public profiles, uploads, reviews, marketplaces, or moderation.
- Medical, legal, financial, education, employment, housing, insurance, biometric, or safety-impacting use.
- AI, LLMs, agents, RAG, tool use, generated content, or autonomous actions.
- Existing repo behavior that conflicts with user intent.

## First-round question design

Ask questions that collapse many downstream decisions.

Prefer this pattern:

1. One sentence app definition and target user.
2. MVP outcome: what must the first working version accomplish?
3. Must-have features and explicit non-goals.
4. Risk/data/platform triggers: login, payments, AI, minors, UGC, sensitive data, launch regions, integrations.
5. Existing repo details: repo path, docs location, protected files, and whether docs-only changes are required.

## Do not ask passive choice questions

Bad:

- What database do you want?
- What auth provider should we use?
- Should we use web or mobile?
- What testing strategy should we use?
- What security controls should we add?

Better:

- Based on your app, I recommend PostgreSQL because it fits relational user, permission, and transaction data. Main tradeoff: migrations need discipline. Alternatives are SQLite for a small local-first MVP or MongoDB if the data model is document-heavy. Do you have a hard constraint against PostgreSQL?

## Recommendation format

When the user must choose or when Codex is choosing a default, provide:

- Decision needed.
- Context from the app idea or repo.
- Option A: strongest default.
- Option B: reasonable alternative.
- Option C: only if meaningfully different.
- Pros and cons for each option.
- Final recommendation.
- Why this is the best fit.
- Risks and mitigations.
- When to revisit the decision.
- Whether user confirmation is required.

Keep it short in the interview. Put the full decision record in `auditability/decision-log.md`.

## Confirmation rules

Require user confirmation before finalizing decisions that are hard to reverse or high impact:

- App purpose or target user.
- Must-have MVP features.
- Explicit non-goals.
- Launch region when it changes legal, privacy, tax, or platform policy scope.
- Payment model.
- Whether minors are target users or likely users.
- Whether user-generated content, messaging, marketplaces, or public sharing exists.
- Whether AI agents can take actions or access tools.
- Data types collected, especially sensitive data.
- Existing repo protected files or docs-only boundary.

Do not require confirmation for ordinary defaults unless the user asked to control them. Record them as AI-recommended defaults with evidence and reversal triggers.

## Defaulting rules

If a detail is missing and not decision-blocking:

1. Research current official guidance when available.
2. Use repo evidence when a repo exists.
3. Choose the best durable, secure, maintainable default for the app's risk level.
4. Record the default, source basis, assumption risk, and reversal trigger.
5. Do not pretend the user chose it.

## Good default examples

Examples, not universal rules:

- Use a relational database when the app has users, roles, permissions, payments, audit logs, or structured entities.
- Use strict API contracts when frontend and backend boundaries exist.
- Use server-side authorization checks even when the UI hides actions.
- Use staged environments when production data, payments, or external services exist.
- Use feature flags for risky releases or AI behavior changes.
- Use privacy-safe analytics with no sensitive payloads by default.
- Mark compliance and tax questions as qualified-review-needed instead of inventing legal conclusions.

## Interview output

After the interview, create or update these sections:

- `README.md` Decision register.
- `README.md` Assumption register.
- `README.md` Open question register.
- `auditability/decision-log.md`.

The user-facing summary must include:

- Questions asked.
- Decisions confirmed by the user.
- Decisions Codex will recommend by default.
- High-risk assumptions that need review.


