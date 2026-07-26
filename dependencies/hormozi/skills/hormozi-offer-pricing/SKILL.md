---
name: hormozi-offer-pricing
description: Set the price for an offer using Alex Hormozi's pricing method from $100M Offers — charge what it's worth (value-based, not cost-plus), the price-to-value discrepancy, the virtuous cycle of price, and why a premium price raises the actual delivered value. Use to price a Grand Slam Offer. Part of the build-offer chain (after the value stack + guarantee).
---

# Hormozi Offer Pricing — Charge What It's Worth

Price on **value, not cost**. The goal is a large **price-to-value discrepancy** — the customer
perceives far more value than the price. Charging a premium isn't greed: it funds better delivery,
which raises results, which justifies the premium (the **virtuous cycle of price**); discounting spins
the vicious cycle the other way.

**Method (authority):** `../_hormozi-shared/references/pricing.md`. Read it first. Also read
`decision-and-fidelity-rubric.md`.

## When to use
- "What should I charge", "price my offer", or the pricing step of `build-offer`.

## Inputs
- The assembled offer + its **total stacked value** (from `hormozi-offer-builder` + enhancers).
- The market/avatar (from `hormozi-offer-market`) and their purchasing power.
- The user's delivery economics (cost to fulfill) — for margin sanity, not to set price cost-plus.

## Procedure
1. **Anchor on value, not cost.** Start from the total stacked value and the dream outcome's worth to
   the buyer — not a markup on cost.
2. **Set a large price-to-value discrepancy** — the price should feel like a steal against the value
   (the reference's "total value ≫ price" pattern).
3. **Price premium enough to fund great delivery** (virtuous cycle) — and to create the psychological
   "this must be good" signal (higher price can raise perceived and actual results).
4. **Sanity-check margin** against fulfillment cost, and note the value-to-price ratio.
5. Avoid the discount reflex — add bonuses/urgency instead (hand to `hormozi-offer-enhancers`).

## Output contract
A recommended price (or price options), the value-to-price ratio, the value-based rationale (why this
over cost-plus/competitor pricing), and a margin sanity note. No fabricated market prices — reason from
the offer's value and mark the user's real costs as `<placeholder>` where unknown.

## What we are intentionally NOT doing
- Not cost-plus or competitor-matching as the primary basis.
- Not designing pricing-page layout/tiers (out of scope for this engine) — this sets the offer's price.

## Sources and basis
*$100M Offers* — Pricing / Charge What It's Worth / Virtuous Cycle of Price (l.~921–1065), encoded in
`../_hormozi-shared/references/pricing.md`.
