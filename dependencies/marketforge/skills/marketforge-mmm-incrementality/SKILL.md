---
name: marketforge-mmm-incrementality
description: Marketing Mix Modeling (Meta Robyn / Google Meridian) and incrementality testing (geo holdouts). Need $50K+/mo total spend + 2-3 years weekly data for stable MMM. Geo holdouts feasible at $5K+/mo per channel. Use as Phase 9 step 5.
---

# MarketForge MMM + Incrementality

Apply V3 §8.3-8.4.

## Global quality rules

- MMM democratized: Meta Robyn (open-source R/Python; ridge regression + Prophet + Nevergrad) and Google Meridian (Bayesian).
- Robyn: easier when most spend is Meta. Meridian: easier when most is Google.
- Need 2-3 years of weekly data on spend + revenue + seasonality.
- SMBs with <$50K/mo total spend usually too few data points for stable models.
- Geo holdouts: gold standard for incrementality; feasible at $5K+/mo per channel.

## Purpose

1. Decide whether MMM is justified for current spend level.
2. Set up MMM if justified.
3. Geo holdout protocol design.
4. Conversion lift studies via platform-built-in tools.
5. Output interpretation discipline.

## Inputs
- `attribution-stack.md`, `budget-allocation.md`, `analytics-stack.md`, historical spend + revenue data.

## Outputs
- `docs/marketing-plan/09-cro-measurement/mmm-incrementality.md`
- DEC-650 to DEC-655

## Structure

```markdown
# MMM + Incrementality

## MMM justification

### When MMM is worth it
- $50K+/mo total marketing spend.
- 2-3 years of weekly data.
- 3+ active channels.
- Want budget-allocation recommendations + saturation curves.

### When MMM is NOT worth it
- <$50K/mo spend (insufficient data points).
- <1 year of history.
- Single dominant channel (no mix to model).

## MMM platform decision

| Platform | Best for |
|---|---|
| Meta Robyn | Most spend on Meta; R / Python ecosystem; open-source |
| Google Meridian | Most spend on Google; Bayesian approach |
| Other vendors (Mass Analytics, Lifesight, Recast) | Premium / SMB-friendly; paid |

## MMM setup (when justified)

### Data preparation
- Weekly spend by channel (paid + estimated organic-investment hours × hourly rate as proxy).
- Weekly revenue.
- Weekly events (holidays, promotions, launches).
- Macro variables (category seasonality, competitive activity, economic indicators).

### Model variables
- Saturation curves per channel.
- Adstock (carryover effect) per channel.
- Time-decay weighting.

### Output
- Budget-allocation recommendations.
- Marginal-effectiveness curves.
- Incrementality estimates.

## Incrementality testing (always-on protocol)

### Geo holdout design
1. Identify 2-3 representative DMAs.
2. Pause channel in holdout DMAs.
3. Run for 4-6 weeks.
4. Compare holdout revenue vs control revenue (or vs holdout baseline).
5. Calculate incremental revenue.

### Conversion lift studies
- Meta: Brand Lift / Conversion Lift studies.
- Google: Conversion lift studies via experiments.
- Audience randomized to ad vs no-ad.

### Time-series pauses
- Channel pause for 4 weeks then resume.
- Measure delta.

## Cadence

- Geo holdouts: quarterly per channel at $5K+ spend.
- MMM model run: quarterly when active.
- Conversion lift studies: monthly when budget supports.

## Output discipline

- Report ranges, not single numbers.
- Document model assumptions + limits.
- Don't trust MMM blindly — triangulate with self-report + incrementality.
- Saturation curves help spot "we're maxed on this channel" moments.

## Decision cards
[DEC-650 to DEC-655]

## What we are intentionally NOT doing
- MMM at insufficient spend (unstable).
- MMM as ground truth (it's a model; triangulate).
- Geo holdouts at insufficient spend per channel.
- Trusting single-vendor MMM-as-a-service without sanity-checking against incrementality.

## Sources and basis
V3 §8.3, §8.4.
Meta Robyn (open-source) + Google Meridian (open-source) — evidence A (academic + transparent methodology).
```

## Sources and basis
V3 §8.3-8.4.
