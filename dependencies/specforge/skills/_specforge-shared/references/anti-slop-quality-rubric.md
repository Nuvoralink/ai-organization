# Anti-Slop Quality Rubric

Use this rubric before, during, and after every documentation pass.

## Purpose

Prevent generic AI output. Good documentation must constrain product, design, architecture, data, security, engineering, and AI-agent behavior in a way that is specific, testable, and traceable.

## Hard failure patterns

Do not ship documentation that contains any of these:

- Placeholder text such as `TBD`, `TODO`, `FIXME`, `lorem ipsum`, `[app name]`, `[selected stack]`, or unfinished bracketed fields.
- Generic claims like `secure`, `scalable`, `robust`, `production-ready`, `user-friendly`, or `best practice` without concrete controls, budgets, thresholds, owners, or source basis.
- Feature names without acceptance criteria.
- Requirements without source labels.
- Security controls without verification methods.
- Architecture decisions without alternatives and tradeoffs.
- API operations without auth, validation, error, and rate-limit behavior.
- Data entities without ownership, access rules, retention, and deletion behavior.
- Repo-derived claims without file-path evidence.
- Research-backed claims without a source entry in `auditability/research-ledger.md`.
- Large vague sections that do not change what Codex would build.

## Required quality properties

Every important requirement must have:

- Stable ID.
- Source label: User-confirmed, Repo-derived, Standard-backed, or Assumption.
- Specific behavior.
- Acceptance criteria.
- Failure or edge case.
- Data touched.
- Permission or security note, when relevant.
- Test or verification method.
- Related screen, API, component, or repo path when applicable.

## Specificity test

For each section, ask:

1. Could two developers read this and build the same behavior?
2. Does it say what is out of scope?
3. Does it define failure behavior?
4. Does it define permissions and data access?
5. Does it define verification, not just intent?
6. Does it avoid invented facts?
7. Does it point to source docs, repo evidence, or assumptions?

If the answer is no, rewrite the section.

## Evidence test

Every factual claim about the app must come from one of:

- The user answer.
- The repository.
- A standard or official source.
- A clearly labeled assumption.

Evidence format:

- User-confirmed: short quote or answer summary.
- Repo-derived: exact file path and, if useful, symbol, route, config key, command, or line clue.
- Standard-backed: source title, owner, version or date, URL, and requirement affected.
- Assumption: assumption ID, reason, risk if wrong, and what to confirm.

## Contradiction test

Before finishing, compare:

- Product scope against PRD.
- PRD against screen map.
- Screen map against data and API contracts.
- Data contracts against security design.
- Architecture against data, security, and release docs.
- Engineering rules against actual repo commands and configs.
- AI guardrails against protected files and high-risk workflows.

Record unresolved conflicts in `auditability/documentation-quality-review.md`.

## Risk fit test

Do not create enterprise bloat for a small app, but do not under-specify high-risk apps.

Increase documentation strictness when the app includes:

- Payments.
- Authentication.
- Admin tools.
- Multi-tenancy.
- Personal or sensitive data.
- Children or students.
- Medical, legal, financial, education, employment, housing, or insurance decisions.
- AI, LLMs, agents, RAG, tool use, or generated content.
- Public user-generated content.
- Marketplaces or seller-buyer disputes.

## Final quality report

Create or update `auditability/documentation-quality-review.md` with:

- Quality review status.
- Files reviewed.
- Slop issues found and fixed.
- Remaining gaps.
- Contradictions found.
- Missing evidence.
- Assumptions that affect implementation.
- High-risk docs that need human review.
- Validation command result.


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

## Decision slop patterns

Also reject:

- Asking the user to pick tools, stacks, security controls, analytics, testing, or architecture without giving recommendations.
- Asking more questions than needed when research-backed defaults would be safer and faster.
- Calling a decision `best` without options, tradeoffs, evidence, and verification.
- Choosing the easiest implementation path when it increases future bugs, drift, security risk, privacy risk, or maintenance cost.
- Fixing a symptom while leaving the broken requirement, contract, ownership model, permission boundary, data model, or test gap unchanged.

## Decision quality test

For every material decision, verify:

1. Is the decision specific to this app?
2. Were at least two realistic options considered?
3. Are pros and cons concrete?
4. Is there a final recommendation?
5. Is the source basis clear?
6. Is the verification method clear?
7. Is the reversal trigger clear?
8. Does the choice avoid shortcuts while staying proportional to the app's risk?
9. Is the decision recorded in `auditability/decision-log.md`?

