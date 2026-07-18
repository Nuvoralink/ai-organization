# Loop Discipline — Iterate to Convergence, Never to Infinity

Purpose: a loop (do → verify against a bar → refine → repeat until the bar is met) is the highest-leverage way to reach quality — a review→fix→re-verify loop, a find-until-dry bug hunt, a converge-on-a-spec/golden/visual-match refinement, a bounded self-repair. **Default to looping whenever iterating beats one-shot.** But an *unbounded* loop is a footgun: it burns budget, thrashes in place, oscillates between two states, chases a moving target, or exits by trusting an unverified "done." This rule makes loops a standard tool **and wires the guardrails so no loop ever runs away.** Always-on for every agent. It is the execution-loop sibling of the doctrine-loop rule (which loops *the rules/docs* better each session).

## When to loop
Whenever the work has a **measurable convergence criterion** and iterating beats a single pass: review → fix → re-verify until 0 blockers; find-until-dry for unknown-size discovery (keep finding until K consecutive rounds surface nothing new); converge-on-a-target (iterate until a named gate is green / it equals a golden / it matches the locked mock); bounded self-repair (generate → validate → repair only the failed field → re-validate).

## The loop contract — declare these UP FRONT (a loop without them is forbidden)
1. **Exit criterion — explicit + measurable.** 0 blockers / 0 *new* findings / a named gate green / equality to a golden. The loop EXITS the instant it's met. No measurable exit → don't loop.
2. **Max iterations — a hard integer cap.** Default **3–5**, scale with stakes. Reaching the cap *without* convergence → **STOP and escalate** with the residual — never silently iterate past it.
3. **Progress requirement.** Each iteration makes *measurable* progress on the metric. An iteration with zero progress ENDS the loop (stall → escalate). No re-running the same step hoping for a different result.
4. **Budget bound.** Bounded by the turn's token/time budget; when it nears exhaustion, converge or escalate — don't open another iteration.

## Anti-infinite-loop guardrails (non-negotiable)
- **Bounded, always** — both a hard cap AND a measurable exit.
- **Monotonic progress or stop.** Improving → continue. Flat → STOP (stall). Worse → STOP (back out the last change).
- **No oscillation.** Track what's been tried; if a change is reverted then re-applied, or a finding fixed then re-flagged (A→B→A) → STOP and escalate; don't ping-pong.
- **Dedup against everything seen.** In find/discover loops, dedup each round against *all* prior findings, not just the last; exit on **K consecutive dry rounds** (K≈2), not a fixed total.
- **Don't chase a moving target.** If the exit criterion itself keeps shifting (spec, base branch, dependency) → STOP, re-baseline **once**, then resume.
- **Verify the critic — the loop is only as good as the honesty of its feedback.** A reviewer/gate/sub-agent reporting "0 findings / clean / merge" is a **lead, not proof.** A critic fails two distinct ways and a trusted-but-unchecked "clean" hides both: (1) **confidently wrong** — it clears a real blocker on a false premise (e.g. reviewing the wrong diff/base); (2) **incomplete** — it reports clean having inspected only *part* of the surface (clears 2 of 7 issues, blind to the other 5). Catch both the same way: **re-derive the load-bearing claim from the actual code** — recount findings against the real diff; don't accept the summary. A *command's own exit status is part of this:* a command piped through `| tail`/`| tee`/`| grep` reports the **last stage's** exit code, not the command's — so `verify | tail` can print "exit 0" while `verify` failed. Read the real result: `set -o pipefail`, capture `$?` *before* any pipe, or echo an explicit sentinel (`cmd; echo "EXIT: $?"`) and read **that**.
- **Escalate, don't spin.** Cap hit / stalled / oscillating / criterion unstable / a blocker you can't auto-resolve → hand back with the residual + what was tried. **Escalation is a successful termination, not a failure.**
- **Apply the action-authority matrix at the state-changing step.** Branch/commit/push/PR may proceed inside the authorized scope. Merge is conditional: every listed proof must be re-derived from the actual diff, including no deployment/production effect; uncertainty requires a human. Production-affecting merge, publish, prod-write/config, data migration, delete, send/external contact, deploy, billed action, and unresolved product/design/material-architecture decisions remain human-gated. The action lives in a separate tool call after its sensor result has been read; never chain `check; act`.

## Cadence (the orchestrator picks per task)
- **Auto-converge (default):** run to the exit criterion *within the cap*, then surface the result + iteration log. Best when the criterion is crisp. "Auto" still means *bounded* auto.
- **Pause-per-iteration:** surface after each iteration for a human checkpoint. Use when the criterion is fuzzy, the blast radius is high, or each iteration is expensive/irreversible.

## Report
State: the exit criterion, iterations run (**n / cap**), the convergence metric per iteration, and how it terminated — **converged / escalated-at-cap / escalated-on-stall / escalated-on-oscillation**. A loop that "just finished" without naming its criterion + iteration count is a black box.

*Fail-state:* an agent ran a "keep going until it's good" loop with no measurable exit and no cap — and it spun on the same finding, oscillated, chased a moving criterion, merged without satisfying every conditional proof, or crossed a human-gated action on a critic's unverified "clean".
