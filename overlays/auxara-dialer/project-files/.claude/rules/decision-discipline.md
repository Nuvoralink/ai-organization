---
paths:
  - "**/*"
---

# Decision Discipline — Dialer Adapter

**The universal `decision-discipline` rule governs in full** — it is always-on at user level for Claude (`~/.claude/rules/decision-discipline.md`, installed by the AI-Organization control plane), and Codex carries its compact twin in `~/.codex/AGENTS.md`. This adapter does not restate the universal ladder (authorities-first → research-before-inventing → visible structural reasoning → escalate-on-thin-evidence, nothing decided silently); it binds that ladder to the dialer's own authorities and escalation triggers. Read it WITH the universal rule, never instead of it.

## Rung 1 — the dialer's authority set (check BEFORE deciding anything)

Most "decisions" are already made. The settled truth for this repo lives in: the decision log (`docs/app-plan/auditability/decision-log.md`), the ADRs (`docs/app-plan/architecture/adr/`), the app-plan product/architecture docs (`docs/app-plan/product/01-product-brief.md`, `02-prd.md`, `03-feature-scope.md`, `architecture/06-architecture.md`), the always-on rules, the central registries (centralization-doctrine §1), the blast-radius maps, and the brief itself. Implementing against these is not a decision, and deviating from them is a STOP, not a choice.

## Rung 4 — escalation triggers specific to this product

Beyond the universal triggers (options still close after research, high blast radius, one-way doors), the dialer adds domains where a silent guess is never acceptable: **compliance** (TCPA/CASL calling hours, DNC, recording disclosure, STIR/SHAKEN, 10DLC), **carrier/number state**, **billing**, and **tenant isolation**. Any choice implicating these escalates to the orchestrator with the decision matrix + your recommendation attached.

## §3 — recording

Every non-trivial mid-task decision appears in the report-back (what was decided, options considered, basis, what would invalidate it later); architectural decisions additionally go to the decision log / an ADR per sprint-rigor §2c.

*Fail-state:* an agent picked an approach mid-task without checking the dialer authorities above, without research or a visible matrix, and shipped it unannounced — the orchestrator discovered the choice only by reading the diff.
