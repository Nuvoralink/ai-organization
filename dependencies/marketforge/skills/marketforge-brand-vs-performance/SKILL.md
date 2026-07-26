---
name: marketforge-brand-vs-performance
description: Calibrate the brand vs performance budget split honestly for stage and ARR. 60/40 is for established brands; pre-PMF SaaS is 80-100% performance. References Binet/Field with honest caveats from Sharp's critique and the B2B 46/54 refinement. Use as Phase 2 step 3.
---

# MarketForge Brand vs Performance

Read shared references. Apply V3 guide §1.5 (Brand vs Performance — Binet & Field's 60/40, pressure-tested).

## Global quality rules

- The 60/40 prescription was derived from established brands. Applying it to a 12-person startup is malpractice.
- Cite Binet/Field with the three caveats: dataset is award submissions (selection bias); Sharp publicly disputed the framework; B2B refinement shifted to 46/54.
- Brand investment without retention solid is wasted (refer to `readiness-check.md`).

## Purpose

Set an honest, evidence-graded brand-vs-performance split for the user's stage, ARR, and product type.

## Inputs

- `marketing-brief.md` (stage, ARR / revenue, budget tier).
- `readiness-check.md` (retention curve quality).
- `channel-strategy.md` (selected channels — brand-leaning vs performance-leaning).

## Outputs

- `docs/marketing-plan/02-strategy/brand-vs-performance.md`
- DEC-080 to DEC-084 — brand/performance split decision

## The honest table

```markdown
| Stage | ARR / revenue | Recommended split |
|---|---|---|
| Pre-PMF | <$500K ARR / <$500K/yr DTC | 80-100% performance, 0-20% brand |
| Early post-PMF | $500K-$5M | 70/30 performance/brand drift |
| Scaling with healthy retention | $5M+ | 50/50 to 60/40 brand/performance defensible |
| Mature | $20M+ | 60/40 brand/performance per Binet/Field |
```

For B2B specifically (Binet/Field/LinkedIn 2019 refinement): ~46/54 brand/performance at maturity.

## Structure

```markdown
# Brand vs Performance Split

## Current stage assessment
- Stage: [from marketing-brief]
- ARR / annual revenue: $[N]
- Retention quality (gate 2 of readiness check): [PASS / FAIL]
- Founder POV on brand investment: [user-supplied]

## Recommended split
- **Performance: [X]%**
- **Brand: [Y]%**

Total marketing spend: $[N] / month → Performance = $[N], Brand = $[N].

## Why this split (decision card)

### [DEC-080] Brand vs performance split

**Decision:** Allocate [Y]% to brand-building (defined as: founder content, original research, podcast hosting, brand-name SEO, PR / earned media, paid social brand campaigns measured by aided awareness rather than CAC) and [X]% to direct-response performance.

**Why this:**
1. [Stage] + [ARR]: Binet/Field's 60/40 was derived from established brands with multi-million-dollar budgets and existing market presence; applying it to [our stage] is malpractice. Sharp's public dispute of the framework is on-record.
2. [Retention status]: With [readiness gate 2 status], brand investment compounds (or fails to compound) based on whether the underlying product retains.

**Why not the alternatives:**
- 60/40 brand/performance (the "best practice" default): inappropriate for [our stage]; would underspend performance and waste brand on a still-forming category.
- 100% performance: Some brand investment is defensible at [our ARR] to capture compound returns; pure performance is short-term-optimal but channel-decay-vulnerable.
- 46/54 brand/performance (B2B mature): also inappropriate; pre-mature.

**Confidence:** High
**Evidence grade:** B (Binet/Field IPA database) with caveats per V3 §1.5
**Source basis:** Research-backed (with stage-adjusted application)
**Commercial-bias flag:** Medium — 60/40 framework is heavily promoted by agencies selling brand work and LinkedIn B2B Institute (which sells reach).

**Evidence:**
- Binet & Field, *The Long and the Short of It*, IPA 2013; B2B refinement with LinkedIn 2019: 46% brand / 54% activation at mature stage.
- Byron Sharp public dispute (Mi3-LinkedIn B2B Next Summit, Aug 2022): "60:40 really is terrible, very misleading."
- John Dawes (95-5): heuristic, not literal rule.

**Asset / channel / metric bindings:**
- Brand-attributed channels in our portfolio: [list]
- Performance-attributed channels: [list]
- KPIs: For brand — aided awareness, branded search volume trend, dark-social attribution signal; for performance — CAC, ROAS, payback period.

**Kill criterion:** If brand-attributed channels show no aided-awareness lift or branded-search lift after 12 months, reduce brand allocation by half.

**Reversal trigger:** Retention curve deteriorates (gate 2 fails) → reduce brand spend until product fixed.

**Anti-pattern:** Copying the 60/40 prescription wholesale from companies 100x bigger. Or 0% brand spend at $10M+ ARR — leaving compound returns on the table.

**Cross-cites consumed:** DEC-001-007 (marketing brief), DEC-067 (readiness check), DEC-050-079 (channel strategy).

## What "brand" means in our context
Specific brand activities we'll invest in:
- [Channel + activity]
- [Channel + activity]

Specific brand activities we WILL NOT invest in (because of stage / budget):
- [Channel + reason]

## How we'll measure brand

Because brand is not last-click attributable, we measure via:
- **Aided awareness surveys** (quarterly if T3+; otherwise self-report attribution surveys).
- **Branded search volume trend** (Google Trends / GSC weekly).
- **Direct traffic trend** (GA4 monthly).
- **Self-report attribution** post-conversion ("How did you hear about us?").
- **Dark-social signal in podcast / community / DM-driven inbound**.

NOT measured by: ROAS in 30-day window (brand doesn't work on 30-day windows).

## Re-evaluation cadence
- Quarterly re-check.
- ARR threshold breach triggers re-balance (e.g., crossing $5M ARR).
- Retention regression triggers immediate brand cut.

## What we are intentionally NOT doing in this layer
- Copying 60/40 because consultants said so — calibrated to our stage.
- Treating "brand" as wishful thinking — every brand activity has a measurable signal even if not last-click.
- Allocating brand budget while retention is failing — fix the product first.

## Sources and basis

V3 §1.5 (Brand vs Performance — Binet & Field, pressure-tested).
Binet & Field, IPA 2013. B2B refinement 2019. Sharp public dispute Aug 2022. Evidence grade: B with caveats.
```

## Anti-patterns

### Anti-pattern A: 60/40 cargo-cult
Applying without considering stage. See V3 guide §1.5.

### Anti-pattern B: 0% brand at $10M+ ARR
Leaving compound returns on the table. Once retention is solid and revenue is meaningful, brand is the moat.

### Anti-pattern C: Pre-PMF brand spend
Brand awareness for an unfinished product. Refuse the allocation; recommend fixing product first.

### Anti-pattern D: Measuring brand by 30-day ROAS
Brand doesn't work on 30-day windows. Refuse the KPI and substitute aided awareness + branded search trends.

## Sources and basis

V3 §1.5.
