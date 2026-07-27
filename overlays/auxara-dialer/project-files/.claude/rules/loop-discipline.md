---
paths:
  - "**/*"
---

# Loop Discipline — Iterate to Convergence, Never to Infinity

Purpose: a loop (do → verify against a bar → refine → repeat until the bar is met) is the highest-leverage way to reach quality — a review→fix→re-verify loop, a find-until-dry bug hunt, a converge-on-a-spec/golden/visual-match refinement, a bounded self-repair. **Default to looping whenever iterating beats one-shot.** But an *unbounded* loop is a footgun: it burns budget, thrashes in place, oscillates between two states, chases a moving target, or exits by trusting an unverified "done." This rule makes loops a standard tool **and wires the guardrails so no loop ever runs away.** Always-on for every agent — orchestrator, implementer, reviewer (Claude or Codex).

This is the **execution-loop** sibling of `doctrine-loop.md` (which loops *the rules/docs* better each session). Same spirit, different target: doctrine-loop improves the system; this rule governs how any *task* loop converges safely.

## When to loop (reach for it)
Use an explicit loop whenever the work has a **measurable convergence criterion** and iterating beats a single pass:
- **Review → fix → re-verify** until 0 blockers (PR review loops, audit remediation, the implement → adversarial-review → reconcile loop).
- **Find-until-dry** for unknown-size discovery (bug hunts, dead-code/stale-wiring sweeps, edge-case enumeration) — keep finding until K consecutive rounds surface nothing new.
- **Converge-on-a-target** — iterate an artifact until it meets a spec / a named gate goes green / it `assertEquals` a golden baseline / a visual matches the locked mock.
- **Bounded self-repair** — generate → validate → repair only the failed field → re-validate.

"Anything that benefits from a loop, loop it" — but every loop carries the contract + guardrails below. No exceptions.

## The loop contract — declare these UP FRONT (a loop without them is forbidden)
1. **Exit criterion — explicit + *measurable*.** The "done": 0 blockers / 0 *new* findings / a named gate green / equality to a golden. The loop EXITS the instant it's met. A loop with no measurable exit may not be started — define one or don't loop.
2. **Max iterations — a hard integer cap.** Default **3–5**, scale with stakes. Reaching the cap *without* convergence → **STOP and escalate** with the residual findings — never silently iterate past it. The cap is the backstop for when the exit criterion is never reached.
3. **Progress requirement.** Each iteration must make *measurable* progress on the convergence metric (findings↓, new-findings→0, gate closer). **An iteration that makes zero progress ENDS the loop** (stall → escalate). No re-running the same step hoping for a different result.
4. **Budget bound.** The loop is also bounded by the turn's token/time budget; when the budget nears exhaustion, converge or escalate — don't open another iteration.

## Anti-infinite-loop guardrails (non-negotiable — these are what "tight guardrails" means)
- **Bounded, always.** No loop without BOTH a hard iteration cap AND a measurable exit. Belt and suspenders.
- **Monotonic progress or stop.** Track the convergence metric across iterations. Strictly improving → continue. Flat → STOP (stall). Worse → STOP (you're regressing — back out the last change).
- **No oscillation.** Track what's been tried. If a change is reverted then re-applied, or a finding is fixed then re-flagged (A→B→A) → STOP — the loop is stuck between two states; escalate, don't ping-pong.
- **Dedup against everything seen.** In find/discover loops, dedup each round against *all prior findings*, not just the last round — else the same item reappears forever and "dry" never arrives. Exit on **K consecutive dry rounds** (K≈2), not a fixed total.
- **Don't chase a moving target.** If the exit criterion itself keeps shifting (the spec, the base branch, a dependency) → STOP, re-baseline **once**, then resume — never iterate against a target that moves every round.
- **Verify the critic — the loop is only as good as the honesty of its feedback.** A reviewer / gate / sub-agent reporting "0 findings / STOP / merge / clean" is a **lead, not proof.** A critic fails in *two* distinct ways and a trusted-but-unchecked "clean" hides both: (1) **confidently wrong** — it clears a real blocker on a false premise (the PR #39 buy-cart footer, 2026-06-13: mis-resolved a PR number + diffed only against `main`, blind to an in-flight correction); (2) **incomplete** — it reports "clean" having only inspected *part* of the surface (the *same* review found 2 inline-copy literals and called it done — blind to the other **5 of 7**). Catch both the same way: **re-derive the load-bearing claim from the actual code** — recount the findings against the real diff; don't accept the critic's summary. An exit is only as trustworthy as its *independently verified* criterion. A *gate/command's own exit status is part of this:* a command piped through `| tail` / `| tee` / `| grep` reports the **last stage's** exit code, not the command's — so `npm run verify | tail` can print "exit 0" while `verify` itself failed (2026-06-13: a `format:check` failure read as green this way; the same masking hid a real exit behind a background-task notification's "exit 0," which is the *sequence's* last command, not the one you care about). Read the real result, not a piped status: `set -o pipefail`, capture the command's own `$?` *before* any pipe, or echo an explicit sentinel (`cmd; rc=$?; echo "EXIT: $rc"; exit $rc`) and read **that**. A green you didn't independently confirm is a lead, not proof.
- **Escalate, don't spin.** Cap hit / progress stalled / oscillating / criterion unstable / a blocker you can't auto-resolve → hand back to the orchestrator/human with the residual + what was tried. **Escalation is a successful loop termination, not a failure.**
- **Apply the centralized action boundary — this is what makes autonomous iteration safe.** `.ai-organization/policies/action-authority.v1.json` is authoritative. Branch creation, commit, and pull-request creation/update are allowed inside the authorized task. Push requires live proof that it cannot trigger a preview/production deploy, publish or billed build, production write, or external contact; a preview counts as a deploy and uncertainty stops for a human. Merge is allowed only when every conditional-merge criterion is independently proven; otherwise it stops for a human. Production-affecting push/merge, production mutation/deploy/config/migration, destructive, billed, external-message/contact, secrets, and product/design/material-architecture actions always stop for a human. No critic's unverified "clean" can satisfy an independent-verification condition.

## Cadence (the orchestrator picks per task)
- **Auto-converge (default):** run iterations to the exit criterion *within the cap*, then surface the final result + the iteration log. Best when the criterion is crisp (gate-green, 0-blockers). "Auto" still means *bounded* auto — never open-ended.
- **Pause-per-iteration:** surface after each iteration for a human checkpoint. Use when the criterion is fuzzy, the blast radius is high, or each iteration is expensive/irreversible.

## Report (every loop names its shape)
The report states: the exit criterion, iterations run (**n / cap**), the convergence metric per iteration, and how it terminated — **converged / escalated-at-cap / escalated-on-stall / escalated-on-oscillation**. A loop that "just finished" without naming its criterion + iteration count is a black box — name them, so the next agent can trust (or distrust) the exit.

*Fail-state:* an agent ran a "keep going until it's good" loop with no measurable exit and no iteration cap — and it spun, oscillated, chased a moving criterion, merged without satisfying every conditional criterion, or crossed a human-gated action on a critic's unverified "clean."
