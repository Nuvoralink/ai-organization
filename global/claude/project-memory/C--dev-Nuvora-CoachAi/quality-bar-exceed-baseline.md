---
name: quality-bar-exceed-baseline
description: "Don't treat the existing/reference output (current model, incumbent, \"what gpt-5 does today\") as the quality ceiling — judge against an absolute elite bar and pursue exceeding the baseline, not mere parity."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 72cdc28d-460a-4655-9c29-9a1c20fde6db
---

When evaluating or improving output quality, do NOT anchor the bar to the current/reference version (e.g. "match gpt-5", "match the incumbent"). The reference is a floor / comparison point, not a ceiling — the user reads gpt-5's coaching as "mid level." Judge against an ABSOLUTE elite standard, and if a change (e.g. a model-specific tailored prompt for a cheaper model) can EXCEED the reference, pursue that. Parity-and-cheaper is the floor; better-and-cheaper is the target.

**Why:** the user aims for elite, not "good enough vs the baseline"; capping at the reference leaves quality on the table. Pairs with [[user_decision_framing]] (capability/ambition over caution).

**How to apply:** in any eval / quality loop, set the bar at "is this elite, absolutely?" + "can we beat the reference?" — not "does it match X?". Flag where the reference ITSELF is only mid (an opportunity to lift it too — e.g. lessons from tailoring a new model's prompt can feed back to improve the incumbent's prompt). Surfaced 2026-06-14 in the Haiku coaching-prompt eval (`coachingGoldenEval.ts`); see [[coachplus-seat-audit-findings]] for the surrounding session.
