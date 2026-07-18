---
name: product-development-workflow
description: Use when turning a vague product idea into a spec, decomposing scoped work into dependency-ordered slices, or sequencing phased incremental delivery. Trigger for product specs, task decomposition, phased delivery, and avoiding big-bang rewrites. For deep single-plan rigor (blast radius, test ladders, decision locking) use full-slice-planner; this skill owns the surrounding spec-and-slicing workflow.
---

# Product Development Workflow

Use this skill to move from idea to shipped change with a clear spec, ordered plan, and incremental implementation path.

## Core Workflow

1. Clarify the product outcome, user value, constraints, and non-goals.
2. Write or infer the smallest useful spec: behavior, interfaces, data, states, edge cases, and acceptance checks.
3. Break work into dependency-ordered slices that each leave the system coherent.
4. Implement incrementally: contracts first, then core logic, then consumers, then tests and verification.
5. Keep a visible task list for multi-step work and update it as reality changes.
6. Avoid deferring required work. If a slice depends on a schema, DTO, route, migration, prompt, or test, include it in the same coherent change.

## Work Tracking

For feature work, big slices, cross-session work, or audit-remediation passes, use `github-project-work-tracking` when GitHub Projects are available. The board tracks state only; it does not replace the spec, plan, pressure test, implementation review, or proof ladder.

## Use References

- For specification structure and acceptance criteria, read `references/spec-driven-development.md`.
- For decomposition and sequencing, read `references/planning-and-task-breakdown.md`.
- For small safe implementation slices, read `references/incremental-implementation.md`.

## Output Expectations

For planning requests, produce a crisp plan with phases, risks, dependencies, and verification gates. For implementation requests, execute the next coherent slice rather than stopping at planning unless the user asks not to edit.
