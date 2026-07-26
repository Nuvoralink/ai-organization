---
name: marketforge-budget-planning
description: Build the monthly + quarterly marketing budget allocation across channels, brand, and operational reserves. Respects T1/T2/T3 tiers and channel selection. Use as Phase 2 step 4.
---

# MarketForge Budget Planning

Read shared references: `scope-modes-and-budget-tiers.md`, `portfolio-construction.md`. Apply tier-aware constraints.

## Purpose

Produce:
1. Total monthly + quarterly budget envelope.
2. Channel-by-channel allocation.
3. Brand vs performance allocation.
4. Tool / platform / agency cost lines.
5. Reserve for opportunistic spend.
6. Quarterly re-allocation review.

## Inputs

- `marketing-brief.md` (budget tier, total budget).
- `channel-strategy.md` + `portfolio-construction.md` (the 3 legs).
- `brand-vs-performance.md` (the split).
- `readiness-check.md` (whether paid is even authorized).

## Outputs

- `docs/marketing-plan/02-strategy/budget-allocation.md`
- DEC-085 to DEC-089 — budget allocation

## Structure

```markdown
# Budget Allocation

## Budget envelope
- Total monthly budget: $[N]
- Total quarterly budget: $[3N]
- Budget tier: [T1 / T2 / T3 / T4+]

## Per-channel allocation

| Channel | Monthly $ | Quarterly $ | % of total | Notes |
|---|---|---|---|---|
| [Compound channel] | $[N] paid + tools | $[N] | X% | [allocation reasoning] |
| [Harvest 1] | $[N] | $[N] | X% | |
| [Harvest 2] | $[N] | $[N] | X% | |
| [Wildcard] | $[N] | $[N] | X% | 90-day test budget |
| Tools / platforms | $[N] | $[N] | X% | [list tools] |
| Agencies / contractors | $[N] | $[N] | X% | [list scope] |
| Creative production | $[N] | $[N] | X% | [briefs + asset gen] |
| Operational reserve | $[N] | $[N] | 10-15% | Opportunistic spend |
| **Total** | $[N] | $[N] | 100% | |

## Brand vs performance breakdown

| Bucket | Monthly $ | % |
|---|---|---|
| Performance-attributed channels | $[N] | X% |
| Brand-attributed channels | $[N] | Y% |

## Tool / platform line items

| Tool | Monthly cost | Owner | Purpose |
|---|---|---|---|
| [Ahrefs / Semrush] | $[N] | SEO lead | Keyword + competitor research |
| [Klaviyo / Customer.io] | $[N] | Lifecycle lead | ESP |
| [Apollo / Clay] | $[N] | Outbound lead | Enrichment |
| [Plausible / Mixpanel / etc.] | $[N] | Analytics lead | Events |
| [GA4 + GSC] | Free | | Free defaults |
| ... | | | |

## 90-day execution detail

Month 1: $[N] — focus: ramp [channels]; allow time for [channel] to baseline.
Month 2: $[N] — focus: optimize [channels]; iterate creative on [channel]; first kill-criterion check on [channel].
Month 3: $[N] — focus: scale winners; wildcard 90-day verdict.

## Quarterly re-allocation gates

- Channel hits kill criterion → reallocate budget per portfolio rules.
- Channel performance exceeds target by 50% → propose scaled budget (with concentration-risk check).
- New ICP segment discovered with separate channel needs → propose budget for second harvest channel.

## Decision cards

[DEC-085 to DEC-089]

## What we are intentionally NOT doing in this layer
- Allocating beyond the budget envelope.
- Allocating to channels not selected in portfolio-construction.
- Skipping the operational reserve (it's how we respond to anomalies).
- Allocating brand spend that exceeds what stage justifies (see brand-vs-performance).

## Sources and basis

V3 §1.5, §12.5. Industry-standard SMB budget allocation patterns per practitioner consensus (evidence grade C).
```

## Anti-patterns

### Anti-pattern A: Allocating to too many channels at low spend each
$2K/mo split across 5 channels = $400 each = sub-signal. Concentrate on 2-3.

### Anti-pattern B: 100% paid, 0% tools
Tools enable scale and measurement. Underspending on tools forces founder time to substitute, which is more expensive.

### Anti-pattern C: No reserve
First anomaly burns through everything. Always reserve 10-15%.

### Anti-pattern D: Treating tier budget as commitment
Budget is a maximum, not a minimum. If channel signal is weak, spending less is better.

## Sources and basis

V3 §1.5, §12.5. Practitioner SMB budgeting consensus.
