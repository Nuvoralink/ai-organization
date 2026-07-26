---
name: marketforge-seo-strategy
description: Build post-AIO realistic SEO strategy. Focus on bottom-funnel commercial queries + brand + local + being cited in AI Overviews. NOT "publish 100 AI articles." Use as Phase 4 step 3.
---

# MarketForge SEO Strategy

Read shared references and `ai-saturation-watch.md`. Apply V3 §3.1 (SEO post-AI-Overviews — honest 2025-2026 reality).

## Global quality rules

- The numbers are bleak. AIO crushed position-1 CTR by 58% (Ahrefs Dec 2025); HubSpot lost ~7M monthly visits 2024-2025 from over-publishing top-funnel content.
- What still works: bottom-funnel commercial queries, brand SEO, local SEO, being cited inside AIOs (Seer: 35% higher organic CTR for AIO-cited).
- What's broken: top-funnel "ultimate guide" content; programmatic SEO with thin template-swap pages (Google's March 2024 scaled content abuse policy).
- Do NOT publish 100 AI-generated articles. The HubSpot pattern is the cautionary tale.

## Purpose

Produce:
1. Post-AIO SEO strategy tailored to business model + budget tier.
2. Bottom-funnel commercial keyword targets.
3. Brand SEO + comparison content plan.
4. Local SEO plan (if local business).
5. Topical authority cluster plan (when justified — small number of deep pieces, not large number of shallow).
6. Technical SEO audit (delegate to marketing-skills:seo-audit).

## Inputs

- `marketing-brief.md`, `positioning.md`, `competitive-intel.md`, `voice-of-customer.md`.
- Existing site (Mode B/C): WebFetch + GSC data + Ahrefs data if available.
- `business-model-channel-fit.md` for SEO viability per model.

## Outputs

- `docs/marketing-plan/04-website-content/seo-strategy.md`
- DEC-270 to DEC-289 — SEO decisions.

## Structure

```markdown
# SEO Strategy (Post-AIO Reality)

## Reality check (cite per evidence-grading)
- Position-1 CTR down 58% on AIO queries (Ahrefs Dec 2025; evidence grade B).
- HubSpot organic traffic: 13.5M (Nov 2024) → ~6.1M (Jan 2025) per Semrush/Search Engine Land/Aleyda Solis analyses; evidence grade B.
- Seer Sept 2025 study (3,119 queries, 25.1M impressions): organic CTR -61%, paid CTR -68% on AIO queries; evidence grade B.
- Being cited in AIO: 35% higher organic CTR + 91% higher paid CTR (Seer); evidence grade B.

## SEO viability for this business model
[Per business-model-channel-fit.md. SEO viability varies dramatically by model.]

## Strategy by surface

### Bottom-funnel commercial queries (HIGHEST PRIORITY)
- "[Competitor] alternative" pages (one per primary competitor).
- "[Tool] pricing" — if user is researching us by name.
- "[Tool] vs [Competitor]" — head-to-head.
- "[Category] for [specific ICP]" — sub-segment.
- "[Specific use case] tools" — purchase-intent intent.

For each, document:
- Target query.
- Monthly search volume (with source).
- Current ranking (if any).
- 12-month target rank.
- Page structure (per `marketforge-website-copy` comparison-page guidance).

### Brand SEO
- Ranking #1 on our brand name.
- Ranking #1 on brand-name + common modifiers ("[Brand] login", "[Brand] pricing", "[Brand] alternatives", "[Brand] support").
- Owning brand-name images (Knowledge Panel optimization).

### Local SEO (if applicable)
- Google Business Profile fully optimized.
- Local citations consistent (NAP).
- Local schema markup.
- Reviews engine (every customer → review request).
- "[Service] near me" + "[Service] in [city]" targeting.

### Topical authority (when justified)
- 1-2 topical clusters maximum.
- 10-20 DEEP pieces per cluster (not 100 shallow).
- Original data / POV in cluster content.
- E-E-A-T signals: named authors, dates, credentials.
- AVOID: keyword-stuffed AI-generated content. AVOID: programmatic thin template-swap.

### Programmatic SEO (NARROW conditions)
- Justified only when:
  - Each page has substantially unique data (e.g., Zillow per-address pages).
  - Pages provide genuine user value (not template-swap).
  - Content is not AI-generated boilerplate.
- Delegate to `marketing-skills:programmatic-seo` for execution if justified.

## What's broken / what we will NOT do

- NOT publishing top-funnel "ultimate guide" content.
- NOT publishing 100 AI-generated articles.
- NOT programmatic SEO with thin template-swap pages.
- NOT keyword-stuffing.
- NOT over-optimizing for a single keyword at the cost of usefulness.

## Schema markup (per marketing-skills:schema)
- Organization schema.
- Product schema (DTC + SaaS).
- LocalBusiness schema (if applicable).
- FAQPage schema (for FAQ sections; aids AIO citation).
- Article schema (for blog content with author).

## Technical SEO audit (delegate)
Invoke `marketing-skills:seo-audit` for existing-site audit when Mode B/C.

## GEO/LLMO coordination
This subskill covers traditional SEO. GEO (cited in AI engines) is a sibling subskill: `marketforge-geo-llmo`. Strategy must coordinate — being cited in AIO drives both organic and paid CTR.

## Crawler allow-list (in robots.txt)
- GPTBot
- OAI-SearchBot
- PerplexityBot
- ClaudeBot
- Google-Extended (Google's AI training)

Plus `llms.txt` if user wants explicit AI-engine guidance.

## KPIs (post-AIO)
- Branded search volume (Google Trends, GSC).
- Position 1-3 on bottom-funnel commercial queries.
- Citation share in AI engines (via Profound / Otterly / Peec AI — if T2+ budget for tooling).
- Direct + organic traffic from comparison pages.
- Goal-completion attribution (signups, demos, purchases) from organic + comparison sources.

NOT KPIs:
- "Total organic traffic" — without quality filter, this is vanity.
- "Total keywords ranking" — without intent filter, vanity.
- "Domain authority" — Ahrefs metric, not Google metric.

## Decision cards
[DEC-270 to DEC-289]

## Kill criteria (per kill-criteria-by-channel.md)
- BoFu commercial pages: 6-12 months window; no rankings page 2 + no branded-search lift → kill specific pages.
- Topical authority cluster: 12 months; no compounding traffic curve → cluster killed.

## What we are intentionally NOT doing
- "Publish 4 posts/week to rank for keywords" playbook (cautionary tale: HubSpot).
- AI-generated content at volume (saturation collapse).
- Programmatic SEO with thin pages.
- Treating organic traffic as the primary KPI (revenue from organic is the KPI).

## Sources and basis
V3 §3.1 (SEO post-AI-Overviews), §3.2 (GEO/LLMO).
Pew Research March 2025, Ahrefs Dec 2025, Seer Sept 2025, Semrush AIO 10M+ keyword study — all evidence grade B.
```

## Anti-patterns

- "Just publish daily blog content" — produces HubSpot pattern.
- "Use AI to write 50 articles a month" — sets up scaled-content-abuse policy hit + saturation backfire.
- "Keyword-stuffing" — penalized + buyers see through it.
- "Programmatic SEO with thin pages" — Google March 2024 policy hit.

## When delegating
- `marketing-skills:seo-audit` for technical audit.
- `marketing-skills:schema` for schema markup.
- `marketing-skills:site-architecture` for IA decisions.
- `marketing-skills:programmatic-seo` for justified programmatic.
- `marketing-skills:ai-seo` for AIO-friendly content optimization.

## Sources and basis
V3 §3.1, §3.2.
