---
name: marketforge-paid-search
description: Build paid search strategy (Google + Bing). Branded + competitor + commercial-intent + category. PMax discipline (exclude brand). Use as Phase 5 step 1.
---

# MarketForge Paid Search

Apply V3 §4.1 (Google Ads — Search + PMax + Shopping + YouTube).

## Global quality rules

- PMax discipline: enable when conversion data is solid AND exclude brand keywords (PMax cannibalizes branded by default).
- Performance Max is opaque; treat its attribution skeptically (steals credit from organic + brand).
- Cleanest intent channel: still search. Highest-ROI buckets: branded, competitor, BoFu commercial.

## Purpose

Produce:
1. Campaign structure (branded / competitor / category / BoFu / PMax — with exclusions).
2. Keyword target list per bucket.
3. Ad copy briefs (delegate to `marketing-skills:ads` for variants).
4. LP routing decisions (which LP each campaign points to).
5. Budget allocation across buckets.
6. Kill criteria + optimization cadence.

## Inputs
- `channel-strategy.md`, `portfolio-construction.md`, `budget-allocation.md`, `messaging-architecture.md`, `awareness-stages.md`, `landing-pages.md`, `competitive-intel.md`.

## Outputs
- `docs/marketing-plan/05-paid/paid-search.md`
- DEC-250 to DEC-269 (campaign structure decisions)

## Structure

```markdown
# Paid Search Strategy

## Campaign structure
- Branded
- Competitor (each major competitor)
- Category (high-intent purchase queries)
- BoFu commercial ("[product] pricing", "[product] integration")
- PMax (when conversion volume justifies — 30+ conversions/30 days; brand excluded)

## Per-bucket plan

### Branded
- Target queries: brand + variants + common modifiers
- LP: homepage / pricing
- Awareness stage: Most-aware
- CPA target: very low — defensive layer
- Daily budget: small but always-on

### Competitor
- Target: "[Competitor] alternative", "[Competitor] vs [us]", "[Competitor] pricing" (where allowed by trademark)
- LP: comparison page per competitor
- Awareness stage: Solution / Product-aware
- CPA target: ≤ blended CAC × 1.5

### Category (mid-funnel commercial intent)
- Target: "[category] software", "[category] tools"
- LP: features / use-case pages
- Awareness stage: Solution-aware

### BoFu commercial
- Target: pricing-intent, integration-intent, "best [category] for [ICP]"
- LP: pricing / feature / comparison
- Awareness stage: Product-aware

### PMax (conditional)
- Enable only when 30+ conversions/30 days
- BRAND TERMS EXCLUDED (negative)
- Watch for cannibalization of organic + brand search

## Ad copy briefs

For each campaign, brief includes:
- Headline variants (3-5) — stage-matched
- Description variants (3-5)
- Sitelinks
- Callouts
- Structured snippets
- LP URL

Delegate variant generation to `marketing-skills:ads`. Wrap output in DEC cards.

## Negative keyword discipline
Always-on negatives:
- "free" (unless freemium product)
- "tutorial", "how to" (top-funnel, low intent)
- Job-search queries ("[brand] careers", "[brand] jobs")
- "login" / "sign in" (existing users, not new)
- Competitor brand terms (when running branded campaigns)
- Adult / unrelated terms per Google's policy

## LP routing
- Every campaign points to a stage-matched LP.
- Don't route paid search to homepage by default.

## Budget allocation

| Bucket | % of paid-search budget | Rationale |
|---|---|---|
| Branded | 15-25% | Defensive; high ROAS |
| Competitor | 30-40% | High intent; clear conversion path |
| BoFu commercial | 25-35% | Conversion-ready queries |
| Category | 10-20% | Mid-funnel coverage |
| PMax (when active) | 0-30% | Variable; cap until proven incremental |

## Bing Ads (when justified)
- Justified when: B2B (Bing skews older + corporate), older demographic consumer, or low-competition niche where CPC is dramatically cheaper.
- Bing share: ~7-9% of US search; ~3% global.
- Most accounts: enable as 10-20% of Google spend after Google is dialed.

## Optimization cadence
- Daily: budget pacing, exhausted/limited campaigns.
- Weekly: search query report review, negative additions, bid adjustments.
- Biweekly: creative refresh on top campaigns.
- Monthly: bucket-level ROI review.

## Kill criteria (per kill-criteria-by-channel.md)
- 30-60 day window.
- CPA > 150% of target with no improving trend across 2 creative iterations → kill campaign.
- PMax cannibalizing brand → exclude brand keywords; if still problematic, pause PMax.

## Attribution discipline
- Triangulate platform + CAPI + self-report survey.
- PMax especially suspect — note in attribution report.
- Don't trust Google-reported ROAS as truth. See `attribution-protocol.md`.

## Decision cards
[DEC-250 to DEC-269]

## What we are intentionally NOT doing
- Bidding on competitor trademarks in jurisdictions where prohibited.
- Running PMax without brand exclusion.
- Running paid search before readiness gate 7 (conversion path) is closed.
- Treating Google-reported ROAS as ground truth.

## Sources and basis
V3 §4.1, §8.1-8.3.
```

## When to delegate
- `marketing-skills:ads` for ad copy variants.

## Sources and basis
V3 §4.1.
