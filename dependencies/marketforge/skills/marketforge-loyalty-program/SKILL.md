---
name: marketforge-loyalty-program
description: Build loyalty program (DTC primary). Points / tiered / paid. Yotpo / Smile.io / LoyaltyLion. Deploy AFTER product NPS is solid, not before. Use as Phase 8 step 6.
---

# MarketForge Loyalty Program

Apply V3 §7.4.

## Global quality rules

- Many startups deploy loyalty prematurely when they should focus on product NPS.
- Points = simple, low cognitive cost, works in mature DTC categories.
- Tiered = higher LTV via aspirational tiers; works at $100+ AOV.
- Paid (Prime, Sephora Beauty Pass) = most powerful retention tool when value is clear.

## Purpose

1. Readiness check (NPS healthy enough to warrant loyalty?).
2. Model selection (points / tiered / paid).
3. Tier design.
4. Rewards economy.
5. Platform selection.

## Inputs
- `voice-of-customer.md` (NPS + repeat rate signals readiness), `pricing-strategy.md`, `retention-churn.md`, `marketing-brief.md` (AOV).

## Outputs
- `docs/marketing-plan/08-lifecycle/loyalty-program.md`
- DEC-550 to DEC-553

## Structure

```markdown
# Loyalty Program

## Readiness check

- NPS healthy (>30 promoters, low detractors): [yes/no]
- Repeat rate >30% within 6 months: [yes/no]
- AOV justifies program economics: [yes/no]
- Customer base >5,000 paying: [yes/no]

If <3 of 4 → defer loyalty; focus on product NPS.

## Model selection

### Points
- Simple: 1 point per $1; 100 points = $5 reward.
- Works for: mature DTC; <$50 AOV; high repeat rate.
- Platform: Smile.io, Yotpo, LoyaltyLion.

### Tiered
- Bronze (entry) / Silver / Gold (aspirational).
- Each tier unlocks better rewards.
- Works for: $100+ AOV; status-conscious category (beauty, fashion).

### Paid (membership)
- Annual fee unlocks benefits.
- Free shipping, exclusive access, members-only pricing.
- Highest-leverage when value is obvious.
- Examples: Amazon Prime, Sephora Beauty Pass.
- Works for: $1B+ DTC at scale; high purchase frequency.

## Tier design (if tiered)

### Bronze
- Entry. Basic loyalty rewards.

### Silver
- After [N orders or $Y spent in 12 months].
- Better rewards (% discount, early access).

### Gold
- After [higher threshold].
- Best rewards (free shipping, exclusive products, VIP support).

### Reset rules
- Annual reset vs lifetime.
- Lifetime more aspirational; annual more achievable.

## Rewards economy

- Cost-per-reward < margin gain from incremental purchase.
- Avoid rewards that cannibalize regular purchases (e.g., free product when customer would have bought anyway).

## Platform selection

| Platform | Best for |
|---|---|
| Smile.io | Shopify DTC; simple |
| Yotpo Loyalty | Shopify + WooCommerce; combined with reviews |
| LoyaltyLion | Mid-large DTC |
| Annex Cloud | Enterprise DTC |

## KPIs

- LTV: enrolled vs non-enrolled.
- Repeat purchase rate: enrolled vs non-enrolled.
- Enrollment rate (% of customers).
- Reward redemption rate.

## Decision cards
[DEC-550 to DEC-553]

## Kill criteria
- 6-12 months; repeat rate flat or declining among enrolled vs non-enrolled → re-evaluate.

## Anti-patterns

- Deploying loyalty pre-NPS-health (papering over product issues).
- Tier thresholds set too high (no one reaches Gold).
- Rewards that cannibalize regular sales.
- Paid membership without obvious value.
- Complex point math (cognitive friction).

## What we are intentionally NOT doing
- Loyalty as default before product retention is solid.
- Over-complex tier structures.
- "Loyalty" that's actually just a discount program.

## Sources and basis
V3 §7.4.
```

## Sources and basis
V3 §7.4.
