# Safe Continuation Loop

Status: live
Last verified: 2026-07-14

## Authorization boundary

The current transcript is the only authority for work scope. Continue only unfinished work that is already
explicitly authorized there. This loop never authorizes a new product initiative, a broader refactor, or a
new issue merely because the queue is idle.

`.ai-organization/action-authority.json` is the canonical boundary. Inside the already-authorized task the
loop may branch, commit, push, and open or update pull requests. Conditional merge is permitted only when
the change is low-risk, additive or isolated, conflict-free, independently verified, and has no production
or deploy effect. Production mutation/deploy/config/migrations, destructive or billed actions, external
messages/contact, secrets, and product/design/material-architecture decisions remain human-gated. Stop and
hand any such proposed action to the human as a separate approval decision.

## Loop contract

- Exit criterion: the already-authorized work is complete with its named evidence; or no actionable
  authorized work remains; or a specific blocker/human gate is reached.
- Hard cap: maximum 3 iterations per invocation.
- Progress metric: unresolved authorized checklist items and unverified named evidence must decrease on
  every iteration.
- Monotonicity: stop immediately on zero progress, regression, oscillation, or a moving target. Re-baseline
  at most once from live read-only state; never spin.
- Budget: do not begin another iteration when the remaining turn cannot complete and verify it.

## Iteration procedure

1. Inspect live state first: current transcript authorization, `git status`, `git branch --show-current`,
   `git diff`, relevant local artifacts, and read-only GitHub issue/PR/check state. Outputs are proof; status
   summaries and stale handoffs are leads.
2. Continue only an already-authorized unfinished task. Tend current PR checks, review comments, and conflict
   evidence read-only. File edits are permitted only when they are inside the exact existing task scope and
   allowlist; do not expand scope to make a check green.
3. Run the smallest relevant proof and capture the command's own exit status before any formatting or pipe.
   Name the killer mutation when tests or gates changed.
4. Recount the progress metric from actual output. Exit on completion; stop and report on stall, regression,
   oscillation, cap, missing authority, or a human gate.

## Idle behavior

If no already-authorized work is unfinished, perform exactly one read-only drift inspection of live repo and
GitHub state, stale handoffs/docs/rules/gates, and backlog claims. Report evidence-backed discrepancies and
exact next actions, then exit. Do not implement the findings and do not start a new initiative.

## Required report

Report the exit criterion, iterations run (`n/<hard cap>`), progress metric per iteration, termination reason
(`converged`, `idle-after-read-only-inspection`, `stalled`, `regressed`, `oscillated`, `blocked`, or
`cap-reached`), exact command-owned exit codes, evidence, not-reached surfaces, and the human gate required.
