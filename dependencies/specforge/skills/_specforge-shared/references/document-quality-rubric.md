# App Documentation Quality Rubric

Use this rubric before finishing any generated or updated docs. The goal is to prevent generic AI output and force useful, specific, reviewable documentation.

## Non-negotiable rules

Reject or revise the docs if any of these are true:

- They contain placeholder text such as TODO, TBD, lorem ipsum, `[fill in]`, `<your app>`, or fake values presented as real.
- They use broad advice without mapping it to this app's users, data, roles, screens, endpoints, components, or risks.
- They claim a standard, version, API, package, legal rule, or repo behavior without a source or evidence path.
- They hide missing information instead of listing an assumption or open question.
- They recommend shortcuts, workaround fixes, weak validation, weak auth, broad permissions, silent failures, or security theater.
- They create a huge enterprise process for a small low-risk app without explaining why the risk demands it.
- They create minimal docs for a high-risk app that handles sensitive data, payments, admin actions, children, medical, legal, financial, biometric, or AI-agent workflows.
- They use internal numbered filenames for new focused repo packages when descriptive names would be clearer.
- They only recommend creating an in-scope security, privacy, threat-model, architecture, API, runbook, or quality doc instead of creating/updating the actual doc.
- They drift from the app's product intent, trust model, role model, or source-of-truth hierarchy to generic planning copy.

## Evidence requirements

Every material requirement must include:

- Requirement ID
- Source type: User-confirmed, Repo-derived, Standard-backed, or Assumption
- Source detail: interview answer, evidence path, source title/version/date/URL, or assumption reason
- Affected user role or system component
- Data touched
- Risk level
- Verification method
- Related docs

Repo-derived facts must include file paths. Use line numbers when practical.

Standard-backed facts must include the source title, owner, version or publication date, and URL.

Assumptions must include impact if wrong and what to ask the user later.

## Specificity requirements

A strong section uses this app's nouns. It names exact roles, features, screens, entities, endpoints, jobs, events, and components.

Bad:

```text
The app should validate user input and use secure authentication.
```

Good:

```text
REQ-SEC-004: The Study Session Create API must reject start times in the past, durations outside 10-180 minutes, and subject IDs not owned by the current user. Source: User-confirmed scope + ASVS validation baseline. Risk: medium. Verification: API integration tests for valid, invalid, and cross-user subject IDs.
```

## Cross-document consistency requirements

Check that these names match everywhere:

- Role IDs
- Feature IDs
- Requirement IDs
- Entity names
- API operation IDs
- Event names
- Screen names
- Component names
- Risk IDs
- ADR IDs

If a name changes in one doc, update all related docs or record the mismatch in the open question register.

## Best course of action rule

When multiple options exist, choose the option that is most maintainable, secure, testable, observable, reversible, and proportional to risk.

For each major decision, include:

- Options considered
- Decision
- Why it is the best course
- Tradeoffs
- What would make the decision wrong later
- Reversal trigger

## Completion checklist

Before finishing, verify:

- Required docs exist.
- Required in-scope docs were created or updated, not merely listed as future work.
- Required headings exist.
- Each doc has Purpose, Status, Inputs used, Assumptions, Decisions, Open questions, Sources and basis, and Traceability links.
- Every feature has acceptance criteria, data touched, permissions, UI states, error states, abuse cases, and tests.
- Every sensitive data item has classification, owner, access rule, retention rule, deletion behavior, and logging rule.
- Every protected workflow has threat model entries, controls, and verification.
- Every endpoint or operation has auth, validation, errors, rate limits, idempotency where relevant, and tests.
- Every high-risk component appears in the blast-radius doc.
- The validation script passes or failures are reported clearly.
- Focused repo package filenames are descriptive lowercase kebab-case unless the target repo already established another convention.
- The review states whether product intent was preserved or degraded.


# v4 Decision and Shortcut Checks

Flag and fix:

- User-facing questions that ask for a choice without giving a recommendation.
- More than 5 initial interview questions without a high-risk blocker.
- More than 3 follow-up questions without a high-risk blocker.
- Technical choices made because they are easiest for Codex rather than best for the app.
- Recommendations without options, pros, cons, verification method, and reversal trigger.
- Decisions that solve a symptom while leaving the root cause unaddressed.
- Temporary workarounds that lack risk, proper fix, and removal trigger.
- Stack, auth, database, hosting, analytics, CI/CD, observability, or security decisions without app-specific rationale.

A decision is acceptable only when a future builder can see why it was chosen, what was rejected, how to verify it, and when to reverse it.

## Decision support quality

A score of 4 or 5 requires:

- Minimal interview behavior: only decision-blocking questions are asked.
- Choice questions include recommendations, pros and cons, and confirmation needs.
- Non-blocking unknowns become researched AI-recommended defaults.
- Material decisions include alternatives, tradeoffs, verification, and reversal triggers.
- Existing repo issues include root-cause notes when docs are stale or missing.
- Shortcuts and surface-level fixes are rejected or explained.
