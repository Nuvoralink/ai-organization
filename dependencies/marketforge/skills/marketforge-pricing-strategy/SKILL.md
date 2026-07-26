---
name: marketforge-pricing-strategy
description: Build pricing strategy. Ramanujam WTP research, Simon value-based pricing. Anchoring, decoy, tier design, charm pricing. Pricing is a marketing decision, not a finance decision. Use as Phase 9 step 2.
---

# MarketForge Pricing Strategy

Apply V3 §6.3.

## Global quality rules

- Pricing is a marketing decision, not a finance decision.
- Value-based > cost-plus > competitor-based pricing.
- Anchoring (expensive plan first), decoy (middle plan), tier design (3 not 5).
- Charm pricing ($X9): real lift in B2C consumer; less for B2B/SaaS.
- Specific over round ($47 > $50): Schindler-Yalch 2006, evidence B.

## Purpose

1. Pricing-strategy decision (value-based vs other).
2. Plan tier design (3 plans, anchoring, decoy).
3. Price points (charm pricing applicability, specific numbers).
4. WTP research design (if not done).
5. Free tier / freemium decision.
6. Pricing-page copy (delegate to `marketing-skills:pricing`).

## Inputs
- `marketing-brief.md` (current pricing), `voice-of-customer.md` (price-sensitivity signals), `competitive-intel.md` (competitor pricing), `icp-and-personas/`, `positioning.md`.

## Outputs
- `docs/marketing-plan/09-cro-measurement/pricing-strategy.md`
- DEC-620 to DEC-629

## Structure

```markdown
# Pricing Strategy

## Methodology

### Value-based (recommended)
- Research WTP from interviews + surveys.
- Set price as % of customer-perceived value.
- Test elasticity within ranges.

### Cost-plus (avoid except for true-cost businesses)
- Margin + cost.
- Floor, not ceiling.

### Competitor-based (rarely best)
- Track competitor prices.
- Position relative (lower / similar / premium).
- Use as data, not primary basis.

## WTP research (Ramanujam method)

If not done:
- Van Westendorp Price Sensitivity Meter (Q1-Q4 question set).
- Conjoint analysis (mature products).
- "What would you pay?" interviews (qualitative).

## Tier design

### Recommended: 3 plans
- Starter / Growth / Scale (or Personal / Team / Business).
- Anchor with highest plan first (left-to-right read).
- Middle plan as decoy: designed to make top plan look obvious.

### Plan structure rules
- Each plan unlocks specific capability or seat count.
- No "Contact us" on first 2 tiers (kills self-serve conversion).
- Featured plan: 1 plan visually distinguished as recommended.

## Price points

### B2B SaaS (typical patterns)
- $20-50/seat: SMB self-serve.
- $50-200/seat: mid-market.
- $200-500/seat: enterprise (often custom).

### B2C consumer
- $4.99 / $9.99 / $14.99 — charm pricing standard.
- $X9 endings: real B2C lift.

### Specific over round (Schindler-Yalch)
- B2C: "$47" reads more credible than "$50."
- B2B: charm pricing less effective; round + specific both work.

## Free tier / freemium

### When freemium works
- Low marginal cost of free users (cloud-native software).
- Strong activation loop.
- Free-to-paid path within product.

### When freemium fails
- High support cost per free user.
- No clear paid trigger.
- Free tier is too generous (cannibalizes paid).

### Free-trial alternative
- 14-day or 30-day full-product trial.
- Card-required vs no-card decision (impacts trial conversion and signup volume).

## Annual vs monthly

- Annual discount: typical 15-25%.
- Annual reduces churn (locked-in).
- Monthly higher CAC payback risk.

## Pricing page CRO
Per `marketforge-landing-cro` and delegate to `marketing-skills:pricing`.

## Decision cards
[DEC-620 to DEC-629]

## Anti-patterns

- 5+ plans (paralysis of choice).
- "Contact us" on entry plan (kills self-serve).
- Hiding prices entirely (B2B can be OK if true enterprise; SMB SaaS hidden pricing = bounce).
- Aggressive annual-only with no monthly option.
- Pricing changes without communication to existing customers.

## What we are intentionally NOT doing
- Cost-plus pricing as primary methodology.
- Treating pricing as finance decision.
- Hidden pricing for SMB self-serve.

## Sources and basis
V3 §6.3.
Ramanujam, *Monetizing Innovation*, 2016. Evidence C.
Simon, *Confessions of the Pricing Man*. Evidence C.
Schindler-Yalch 2006 specific-pricing research — evidence B.
```

## When to delegate
- `marketing-skills:pricing` for pricing-page copy + structure.

## Sources and basis
V3 §6.3.
