---
paths:
  - "**/*"
---

# Decision Discipline — Research, Reason Structurally, Never Decide Silently

Purpose: stop mid-flight coin-flips. When implementation forces a choice the plan didn't settle, the quality of that unplanned decision is what separates durable work from drift. This rule is always-on for every agent (Claude or Codex, implementer or designer) and applies to ANY mid-task choice, not just architecture.

## 1. When this rule fires

Any choice not already settled by an authority: library/dependency selection, schema or contract shape, API design, algorithm or pattern choice, naming a new domain concept, error/retry semantics, storage/queue topology, security-posture details, test strategy for a new surface, UX micro-behavior the mock didn't specify, or any tradeoff with more than one defensible side.

## 2. The decision ladder (in order — skip no rung)

1. **Authorities first.** Check the repo's settled truth before "deciding" anything: the decision log (`docs/app-plan/auditability/decision-log.md`), ADRs, the app-plan product/architecture docs (`docs/app-plan/product/01-product-brief.md`, `02-prd.md`, `03-feature-scope.md`, `architecture/06-architecture.md`), the always-on rules, central registries (centralization-doctrine §1), blast-radius maps, and the brief itself. Most "decisions" are already made — implementing against them is not a decision, and deviating from them is a STOP, not a choice.
2. **Research before inventing.** If genuinely unsettled, research how mature products and industry best practice handle it — web search when the harness provides it; otherwise state explicitly what knowledge the judgment rests on and name the uncertainty. Comparable-product prior art beats your first idea (this is Gate 8's "how do comparable products solve this?" applied mid-flight).
3. **Reason structurally — visible, not vibes.** Work the choice through an explicit decision matrix (options × criteria: correctness, durability, security, compliance, tenant isolation, maintainability, doctrine fit, cost) or a written chain/tree-of-thought that weighs branches before committing. Minimum bar: at least two real options considered, and the rejected option's strongest argument stated honestly — a matrix with one row is theater.
4. **Decide only with sufficient evidence — otherwise ESCALATE.** Escalate to the orchestrator (who researches and decides, or asks Amin) instead of deciding when ANY of these hold: the options stay close after research; the blast radius is high; the choice is one-way/hard to reverse; compliance, security, or billing is implicated; or the choice would contradict ANY settled authority. Hand over the matrix + your recommendation — an escalation with a good matrix costs minutes; a silent wrong guess costs a re-implementation.

## 3. Nothing is decided silently

Every non-trivial mid-task decision appears in the report-back: what was decided, the options considered, the basis (authority / research / matrix), and what would invalidate it later. Architectural decisions additionally go to the decision log / an ADR per sprint-rigor §2c. "I just picked one" is a bug even when the pick happens to be right — an unrecorded decision can't be reviewed, can't be reversed deliberately, and silently becomes load-bearing.

*Fail-state:* an agent picked an approach mid-task without checking the authorities, without research or a visible matrix, and shipped it unannounced — the orchestrator discovered the choice only by reading the diff.
