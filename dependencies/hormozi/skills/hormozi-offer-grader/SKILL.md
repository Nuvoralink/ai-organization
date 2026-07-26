---
name: hormozi-offer-grader
description: Score and pressure-test an existing or just-built offer against Alex Hormozi's Value Equation from $100M Offers — rate each of the four drivers, compute a value read, name the weakest driver, and prescribe the fix. Use when the user wants to grade, critique, or improve an offer, or as the final gate of the build-offer chain (loop back to the weakest driver).
---

# Hormozi Offer Grader — Score Against the Value Equation

The exit gate of the offer chain, and a standalone "grade my offer" tool. Scores an offer on the four
value drivers, reads the result, and prescribes the highest-leverage fix.

**Method (authority):** `../_hormozi-shared/references/value-equation.md` — use its 1–10 scoring rubric,
Value Index, and verdict bands. (Note: the 1–10 scale is the engine's operationalization of Hormozi's
own binary read — it's a scoring tool, not a book statistic.) Also read `decision-and-fidelity-rubric.md`.

## When to use
- "Grade / critique / improve my offer", `grade-offer`, or the final step of `build-offer`.

## Inputs
- The offer to grade (the value stack, price, guarantee, enhancers, name) — user-provided or from the
  chain — plus the avatar it targets.

## Procedure
1. **Score each driver 1–10** using the rubric's anchored bands: Dream Outcome, Perceived Likelihood of
   Achievement (↑ good), Time Delay, Effort & Sacrifice (↓ good — score reflects how *low* they are).
2. **Compute the Value Index** and read it against the verdict bands.
3. **Name the weakest driver** (the biggest drag on perceived value) and apply the reference's
   diagnostic rules.
4. **Prescribe the fix** — the specific levers to pull, routed to the responsible sub-skill
   (`hormozi-offer-builder` for value stack, `-enhancers`, `-guarantees`, `-pricing`, `-naming`).
5. **In the chain:** if the score is low, loop back to the weakest driver's sub-skill and re-grade.
   Bounded loop — at most 2 passes, then surface the residual (don't spin).

## Output contract
Per-driver scores (1–10) with a one-line basis each, the Value Index + verdict, the weakest driver,
and a prioritized fix list routed to the right sub-skill. Honest scoring — do not inflate to pass.

## What we are intentionally NOT doing
- Not rebuilding the offer itself — it names the fixes; the producing sub-skills apply them.
- Not inventing a Hormozi "score" — the 1–10 scale is the engine's tool, transparently labeled.

## Sources and basis
*$100M Offers* — The Value Equation as an offer test (l.~1101–1330), encoded (with the added 1–10
operational rubric) in `../_hormozi-shared/references/value-equation.md`.
