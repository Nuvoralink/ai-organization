---
name: hormozi-offers
description: Build a complete Grand Slam Offer for a product end-to-end, running Alex Hormozi's $100M Offers method as a chain — pick the market, maximize the Value Equation, build the 5-step value stack, add scarcity/urgency/bonuses, attach a guarantee, set value-based pricing, name it with M-A-G-I-C, and grade the result. Use when the user wants a full offer built. For one piece only, use the specific hormozi-offer-* sub-skill.
---

# Hormozi Offers — Sub-Orchestrator ($100M Offers)

Runs the full offer-construction chain and assembles the pieces into one finished Grand Slam Offer.
Invoked by `$hormozi build-offer`, or directly when the user wants the whole offer.

**Read first:** `../_hormozi-shared/references/orchestration-protocol.md` and `decision-and-fidelity-rubric.md`.

## Chain (dependency order — each feeds the next)
1. **`hormozi-offer-market`** — confirm the Starving Crowd + avatar (4 indicators; commit to a niche).
   Everything downstream is built for this avatar. Skippable only if the market is already fixed —
   still record it.
2. **`hormozi-offer-value-equation`** — establish which of the 4 value drivers to push hardest for
   this avatar (Dream Outcome ↑, Perceived Likelihood ↑, Time Delay ↓, Effort & Sacrifice ↓).
3. **`hormozi-offer-builder`** — the 5-step engine → the stacked **Final High Value Deliverable**.
4. **`hormozi-offer-enhancers`** — add scarcity + urgency + bonuses.
5. **`hormozi-offer-guarantees`** — attach the right guarantee(s) ("if you don't get X in Y, we do Z").
6. **`hormozi-offer-pricing`** — set the value-based price (charge what it's worth; total value ≫ price).
7. **`hormozi-offer-naming`** — give it a Magnetic Reason Why name (M-A-G-I-C).
8. **`hormozi-offer-grader`** — score the assembled offer against the Value Equation. If it scores low,
   loop back to the weakest driver (bounded: ≤2 refinement passes, then surface the residual).

## Intake
Product, avatar, Dream Outcome, current price/offer, rough economics (or placeholders), constraints.
Ask for anything missing in one batch before starting.

## Assembly
Present the finished offer as the customer would see it: the stacked named bundles with $ values, the
total value vs. the price, the bonuses, the scarcity/urgency, the named guarantee, and the offer name —
followed by an internal appendix (assumptions, placeholders to fill, the Value-Equation score from the
grader). Then run `$hormozi-fidelity-audit` and fix any FAIL before delivering.

## Output contract
One assembled Grand Slam Offer document per the rubric header, plus the appendix. No fabricated values.

## What we are intentionally NOT doing
- Not generating lead magnets or lead-gen plans (that's the Leads chain).
- Not writing sales-page long-form copy — this produces the offer itself; copy is downstream.

## Sources and basis
*$100M Offers* — the full offer-construction arc; each step's method in `../_hormozi-shared/references/`.
