---
name: hormozi-offer-builder
description: Build the core of a Grand Slam Offer for a product using Alex Hormozi's 5-step process from $100M Offers — Dream Outcome, list Problems, turn them into Solutions, brainstorm Delivery Vehicles, then Trim & Stack into a Final High Value Deliverable. Use when the user wants to create or rebuild an offer's value stack. For scarcity/urgency/bonuses use hormozi-offer-enhancers; for the guarantee use hormozi-offer-guarantees; for the name use hormozi-offer-naming; to score an existing offer use hormozi-offer-grader.
---

# Hormozi Offer Builder — the 5-Step Value Stack

Runs the core Grand Slam Offer engine: turn a product into a stacked, incomparable deliverable that
makes the buyer decide on value, not price. This is the heart of the Offers chain; the enhancers,
guarantee, pricing, and name are added by sibling sub-skills after this produces the stack.

**Method (authority):** `../_hormozi-shared/references/offer-creation-5-step.md`. Read it before
building. Follow the 5 steps in order — never skip or reorder. Also read
`../_hormozi-shared/references/decision-and-fidelity-rubric.md` and `value-equation.md`.

## When to use
- "Build my offer", "make a Grand Slam Offer", "rebuild the value stack for <product>."
- As step 3 of the `build-offer` chain (after market + value-equation, before enhancers).

**Use a sibling instead when:** the ask is only the guarantee (`hormozi-offer-guarantees`), only the
name (`hormozi-offer-naming`), only scarcity/urgency/bonuses (`hormozi-offer-enhancers`), or scoring
an existing offer (`hormozi-offer-grader`).

## Inputs
- Product: what it is, the mechanism, what it can deliver.
- Avatar / market (from `hormozi-offer-market` if run) and the **Dream Outcome**.
- Rough economics (cost to deliver each possible component) — or mark `<placeholder>` values.
If Dream Outcome or avatar is missing, ask for it first (bounded intake).

## Procedure
1. **Dream Outcome** — state the destination the customer wants to *experience*, as *big outcome +
   reduced time delay* (e.g., "Lose 20 lbs in 6 weeks"). Sell the vacation, not the plane flight.
2. **List Problems** — walk the customer's journey; list every core "must-do" in sequence, and for
   each, every reason they can't do it / keep doing it. Bucket each by the 4 value drivers (Dream
   Outcome, Perceived Likelihood, Effort & Sacrifice, Time). Aim for 30–60+ problems. More = better.
3. **Solutions List** — transform every problem with "How to…" + reverse the problem. Solve *every*
   one. Name each solution.
4. **Delivery Vehicles ("The How")** — for each solution, brainstorm divergently everything you could
   do, grouped by personal attention (1:1 / small group / one-to-many). Apply the Product Delivery
   Cheat Codes (attention · DIY/DWY/DFY · medium · format · speed · 10x/¹⁄₁₀ test). Over-deliver.
5. **Trim & Stack** — cut high-cost/low-value then low-cost/low-value; keep low-cost/high-value and
   high-cost/high-value; prioritize high-value one-to-many. Stack survivors into the **Final High
   Value Deliverable**: each bundle as *Problem → Solution Wording → Sexy Bundle Name* with a $ value;
   show **total value vs. price**.

Then hand the stack to `hormozi-offer-enhancers` → `-guarantees` → `-pricing` → `-naming` → `-grader`.

## Output contract
Per the rubric header, produce: Dream Outcome · sequenced+bucketed Problem list · Solutions list ·
Delivery-vehicle brainstorm · Trim decisions (cost/value quadrant) · the **Final High Value
Deliverable** (named bundles, $ values, total value vs. price). Every $ value is derived from real
economics or marked `<placeholder>` — never fabricated. Flag all assumptions.

## Worked example (shape only)
For a "healthy meal-prep coaching" product: Dream Outcome "Lose 20 lbs in 6 weeks eating food you
like." Problems bucketed across buying/cooking/eating/exercise/travel/consistency/social. Solutions
each "How to…". Delivery vehicles grouped 1:1 / group / one-to-many. Stack → "Foolproof Bargain
Grocery System" ($1,000) + "Ready-in-5-Min Busy-Parent Cooking Guide" ($600) + … = total value vs.
the price. (Full pattern in the reference file.)

## What we are intentionally NOT doing
- Not adding scarcity/urgency/bonuses (that's `hormozi-offer-enhancers`).
- Not writing the guarantee (`hormozi-offer-guarantees`) or the name (`hormozi-offer-naming`).
- Not setting the final price (`hormozi-offer-pricing`) beyond showing total value vs. a target price.
- Not fabricating $ values — derive or mark as placeholders.

## Sources and basis
*$100M Offers* — the Grand Slam Offer creation process (l.1373–1925), encoded in
`../_hormozi-shared/references/offer-creation-5-step.md`.
