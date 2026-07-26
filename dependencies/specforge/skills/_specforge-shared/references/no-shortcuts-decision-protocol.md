# No-Shortcuts Decision Protocol

## Purpose

Prevent shallow documentation, quick fixes, workaround thinking, and generic AI output. Codex must choose the best maintainable, secure, testable, and reversible path for the app's context, not the easiest path to produce a plausible answer.

## Private reasoning rule

Use deep private reasoning before recommendations and revisions. Do not display private chain-of-thought. Show only the concise decision summary, evidence, pros and cons, risks, final recommendation, and verification plan.

## Root-cause rule

Before documenting a fix, rule, guardrail, or repo-doc correction, ask internally:

- What is the root cause?
- What is only a symptom?
- What would fail again if we only patched the symptom?
- Which requirement, contract, control, or doc gap allowed this issue?
- What durable rule prevents recurrence?
- What test, validation, monitor, or review gate proves the fix works?

For existing repos, prefer evidence from code, tests, configs, schemas, CI, and docs. Do not infer repo behavior from file names alone.

## Alternative analysis rule

For every material architecture, data, security, platform, implementation, or AI-agent decision, compare at least two options.

Use this decision shape:

- Context.
- Constraints.
- Option considered.
- Pros.
- Cons.
- Risk if chosen.
- Risk if not chosen.
- Verification method.
- Final recommendation.
- Reversal trigger.

Do not overcomplicate small low-risk apps. The best answer is the strongest fit for the context, not the most complex answer.

## Surface-level work test

Before finishing any doc, ask internally:

1. Does this change what Codex would build or review?
2. Can a developer verify it?
3. Does it define failure behavior?
4. Does it include permissions, data access, and risk where relevant?
5. Does it map to requirements, tests, controls, or ADRs?
6. Does it avoid broad phrases like `use best practices` without specific controls?
7. Did it solve the root cause or just describe the symptom?
8. Did it choose a durable course instead of a shortcut?

If the answer is no, revise before finalizing.

## Shortcut rejection rules

Reject recommendations that:

- Hide the issue instead of fixing it.
- Remove validation, logging, tests, accessibility, or security to make work easier.
- Add a broad dependency without clear need, alternatives, security impact, license check, and maintenance cost.
- Use client-side checks as the only protection for protected actions.
- Store sensitive data because it is convenient.
- Log personal data to make debugging easier.
- Skip schema, migration, or API contract updates.
- Treat compliance, tax, platform policy, child data, or regulated-domain questions as solved without qualified review.
- Create a large refactor when a narrow durable change would work.
- Create a narrow patch when the root cause is a broken contract, permission model, data model, or architecture boundary.

## Best-course selection criteria

Rank options using:

1. Correctness for the product requirement.
2. Security and privacy risk reduction.
3. Maintainability.
4. Testability.
5. Reversibility.
6. Simplicity that does not sacrifice correctness.
7. Fit with repo conventions and existing architecture.
8. Cost and operational burden.
9. User impact and failure blast radius.
10. Compliance or platform-policy risk.

## Required output

Record material decisions in `auditability/decision-log.md` with:

- Decision ID.
- Source: User-confirmed, Repo-derived, Standard-backed, or AI-recommended default.
- Options considered.
- Pros and cons.
- Final recommendation.
- Why not the easier shortcut.
- Root-cause notes, if this responds to an existing issue or doc gap.
- Verification method.
- Reversal trigger.
- Related requirements, risks, controls, ADRs, and docs.

## Existing repo root-cause notes

When updating docs for an existing repo, also record:

- Stale doc or missing doc.
- Evidence path.
- Root cause category: missing doc, outdated doc, code drift, naming drift, missing contract, missing test, missing ownership, missing source-of-truth rule, or unclear product decision.
- Durable correction.
- Guardrail to prevent recurrence.

