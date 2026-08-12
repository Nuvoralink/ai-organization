# Safe Continuation Loop

Status: live
Last verified: 2026-08-01

## Authorization boundary

The current transcript and `.ai-organization/policies/action-authority.v1.json` are the authorities for scope and capability. Continue
only already-authorized unfinished work. In-scope branch creation, commit, and PR creation/update are allowed.
Push only after live proof of no preview/production deploy, publish or billed build, production write, or
external contact; a preview counts as a deploy. Merge only when every conditional-merge proof in the capability
matrix is satisfied; otherwise stop for human approval. Never
deploy, mutate production, delete, purchase, contact anyone, change secrets, or close an unresolved
product/design/material-architecture decision. Stop at a human gate.

## Loop contract

- Exit: named evidence proves the authorized work complete; no actionable authorized work remains; or a
  specific blocker/human gate is reached.
- Hard cap: 3 iterations.
- Progress: unresolved authorized checklist items and unverified evidence decrease every iteration.
- Monotonicity: stop on zero progress, regression, oscillation, or a moving target.
- Budget: do not start an iteration that cannot be completed and verified in the remaining turn.

## Numbered procedure

1. Read live transcript authority, git status/branch/diff, relevant artifacts, and read-only external state.
2. Continue one already-authorized item; do not expand scope to make a check green.
3. Run the smallest proof and capture that command's own exit status.
4. Recount progress from actual output; exit or stop on the contract above.

## Required report

Report exit criterion, iterations (`n/3`), progress per iteration, termination reason, command-owned exits,
evidence, not-reached surfaces, and any human gate.
