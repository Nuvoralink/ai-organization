---
name: hormozi-fidelity-audit
description: Audit a Hormozi-engine deliverable (offer, lead magnet, guarantee, name, lead-gen plan) to confirm it actually follows the book method — right framework, right steps in order, applied to the product, no fabrication, nothing generic, no mandatory element dropped. Run as the exit gate before delivering; report PASS/FAIL with specific fixes.
---

# Hormozi Fidelity Audit

The exit gate. Checks that generated output *is Hormozi's method applied*, not a plausible-looking
paraphrase. Runs after assembly, before delivery. Read `../_hormozi-shared/references/decision-and-fidelity-rubric.md` §5.

## FAIL conditions (any one fails the deliverable)
1. **Wrong/incomplete framework** — skipped or reordered a framework's steps, or invented steps not in
   the book (e.g., an offer built without the 5 steps; a lead magnet that isn't the 7-step process).
2. **Summary, not application** — describes what the chapter says instead of producing the applied
   result for *this* product.
3. **Fabrication** — a statistic, benchmark, price, or $ value with no basis and no `<placeholder>`.
4. **Generic** — the output would read identically for an unrelated product; the avatar isn't specific.
4a. **Category copy in a HOOK** (attention lines only, not body copy) — a call-out, hook, opener or stop-them headline names a CATEGORY
   ("busy agents", "overweight people", "growing teams") or uses lingo a reader can smell
   ("streamline", "maximise", "struggling with", "take it to the next level") instead of a concrete
   MOMENT the prospect lived recently. Per `moment-specificity.md`: no moment list shown in the
   output, or the chosen moment is rare rather than weekly, is a FAIL. A moment that is specific but
   INVENTED (not grounded in transcripts/calls/real experience) is also a FAIL.
4b. **Regurgitation** — the user supplied angles/ideas and the output only polishes those: no divergent
   journey walk, no net-new angles beyond what the user brought (and no stated reason why none exist).
   The engine's divergent pass (rubric §2) is mandatory, not optional when the user "already has ideas."
5. **Dropped mandatory element** — e.g.:
   - Offer that doesn't solve *every* perceived problem, or isn't stacked/incomparable.
   - Guarantee with no "if you don't get X in Y time, we do Z" structure.
   - Name with no Magnetic Reason Why (missing M-A-G-I-C elements).
   - Lead magnet that doesn't reveal a real problem / narrow enough / with a clear CTA to the offer.
   - Lead-gen plan with no Rule-of-100 commitment or no chosen Core Four starting channel.

## Procedure
- Identify which framework the deliverable claims to run; open that reference file.
- Walk its mandatory steps/elements against the output; mark each present/absent/altered.
- Scan every number for a basis or placeholder.
- Judge specificity: swap the product name mentally — does it still fit? If yes → generic → FAIL.
- Report.

## Output
```
Fidelity Audit — <artifact> for <product>
Result: PASS | FAIL
Framework: <name> — steps present: [..]  missing/altered: [..]
Fabrication check: [clean | flag lines ...]
Specificity: [grounded | generic because ...]
Mandatory elements: [all present | missing ...]
Required fixes (if FAIL): [specific, per element]
```

## What we are intentionally NOT doing
- Not re-generating the deliverable — it names the fixes; the producing sub-skill applies them (bounded
  loop, ≤2 passes, then surface).
- Not checking engine wiring (that's `hormozi-self-test`).

## Sources and basis
`../_hormozi-shared/references/decision-and-fidelity-rubric.md` §5; the per-framework reference files.
