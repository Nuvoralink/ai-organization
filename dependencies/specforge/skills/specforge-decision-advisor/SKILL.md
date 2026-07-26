---
name: specforge-decision-advisor
description: Guide minimal user interviews, recommend best-fit defaults with pros and cons, and create decision records that avoid shortcuts and surface-level AI work.
---

# SpecForge Decision Advisor

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` before interviewing or recommending defaults.
- Read `../_specforge-shared/references/no-shortcuts-decision-protocol.md` before making recommendations.
- Ask only decision-blocking questions. Research and recommend non-blocking defaults.
- Give the user useful choices, not open-ended burden. Include pros, cons, and a final recommendation when asking about tooling, architecture, platform, scope, or risk decisions.
- Use deep private reasoning, but never display private chain-of-thought. Show concise rationale, evidence, tradeoffs, recommendation, risks, and verification plan.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose quick fixes, workaround fixes, or vague placeholders.
- Keep the recommendation proportional to the app's risk, data sensitivity, expected scale, and user impact.
- Label every decision source as User-confirmed, Repo-derived, Standard-backed, Assumption, or AI-recommended default.
- If current research is available, use current official sources. If not, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, policies, or API capabilities.

## Purpose

Help the main SpecForge workflow and section skills make strong decisions without overwhelming the user.

This skill decides what must be asked, what can be inferred, what must be researched, and what should become an AI-recommended default.

## Inputs

- App idea.
- User answers.
- Existing repo evidence, if available.
- Risk triggers from product, data, security, compliance, AI, payments, minors, UGC, and operations.
- Shared source map and document specification.

## Outputs

Create or update:

- `docs/app-plan/auditability/decision-log.md`
- `docs/app-plan/README.md` Decision register
- `docs/app-plan/README.md` Assumption register
- `docs/app-plan/README.md` Open question register
- Any ADRs needed for major technical decisions

## Minimal interview process

1. Extract known facts from the user's app idea and repo evidence.
2. Identify unknowns that would materially change the docs.
3. Ask only the top 3 to 5 decision-blocking questions.
4. For each question involving a choice, include a recommended default, pros, cons, and why.
5. If the user answers enough to proceed, stop interviewing and draft docs.
6. For remaining unknowns, research and choose AI-recommended defaults.
7. Record high-impact assumptions and ask for later confirmation only when needed.

## Question priority

Ask only when the answer changes product definition, safety, architecture, data, compliance, security, or implementation order.

Highest priority:

- What is the app and who is it for?
- What must the first working version do?
- What is explicitly out of scope?
- Does it involve login, payments, minors, UGC, messaging, public content, sensitive data, AI, agents, tools, or regulated-domain decisions?
- Is there an existing repo, and must the work be docs-only?

## Recommendation process

When making a recommendation:

1. Define the decision.
2. State app-specific context.
3. Research current official sources where available.
4. Compare at least two realistic options.
5. Explain pros and cons.
6. Recommend one option.
7. Explain why the easier or shortcut option is not enough, when relevant.
8. Define verification.
9. Define reversal trigger.
10. Record the decision.

## Decision register format

Each decision in `auditability/decision-log.md` must include:

- Decision ID.
- Decision area.
- Status: User-confirmed, AI-recommended default, Repo-derived, Standard-backed, Assumption, or Needs-user-confirmation.
- Decision question.
- Context.
- Options considered.
- Pros and cons.
- Final recommendation.
- Why this is the best course.
- Why not the easiest shortcut, when relevant.
- Source basis.
- Risks and mitigations.
- Verification method.
- Reversal trigger.
- Related requirement IDs, risk IDs, ADR IDs, and docs.

## Interview response format

When interviewing the user, respond like this:

```text
I only need the decisions that would change the docs materially.

1. [Question].
   Recommendation: [recommended default].
   Why: [short reason].
   Main tradeoff: [short tradeoff].

2. [Question].
   Recommendation: [recommended default].
   Why: [short reason].
   Main tradeoff: [short tradeoff].

For everything else, I will research and use best-fit defaults, then record assumptions and reversal triggers.
```

## Quality gate

Before finishing, check:

- The user was not asked non-blocking questions.
- Every choice question includes guidance and a recommendation.
- AI-recommended defaults are recorded and labeled.
- High-risk assumptions are visible.
- Material decisions compare options.
- The recommendation chooses durable correctness over shortcuts.
- Private reasoning is not displayed.

