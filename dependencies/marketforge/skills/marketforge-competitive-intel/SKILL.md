---
name: marketforge-competitive-intel
description: Comprehensive competitive intelligence — direct competitors, indirect alternatives, status quo. Uses SimilarWeb (traffic), Ahrefs/Semrush (keywords/backlinks), Apollo (org charts), G2 (SaaS reviews), App Annie/SensorTower (mobile), AdLibrary (Meta/TikTok creative), Wayback Machine (positioning history). Use as Phase 1 step 8 of MarketForge full runs.
---

# MarketForge Competitive Intel

Read shared references. Apply V3 guide §2.6 (Competitive analysis sources by business model).

## Global quality rules

- The most important competitor to characterize is usually "do nothing" / status quo. Treat it like a real competitor.
- Don't mistake the flattering peer set for the real competitive alternative set. See `marketforge-positioning` Box 1.
- Cite every claim about a competitor with source + date. Competitive landscapes shift weekly.
- For every competitor, document their positioning evolution via Wayback Machine. Repositioning patterns reveal market direction.

## Purpose

Produce:
1. Comprehensive competitor map (direct, indirect, status quo).
2. Positioning analysis — how each competitor positions themselves.
3. Channel mix analysis — where each competitor is investing.
4. Ad creative analysis — what's working in paid ads in the category.
5. SEO / GEO competitive landscape.
6. Pricing analysis.
7. Customer-perception gap analysis (combined with VOC mining of competitor reviews).

## Inputs

- `marketing-brief.md` for category context.
- `voice-of-customer.md` (especially competitor 1-2 star reviews).
- `positioning.md` Box 1 competitive alternatives.
- User-supplied competitor list if any.
- Browser MCP / WebFetch for current scrapes.

## Outputs

- `docs/marketing-plan/01-foundations/competitive-intel.md`
- `auditability/competitor-tracking.md` — per-competitor file with refresh date
- DEC-050 to DEC-079 (note: this overlaps strategy DEC range — use DEC-050 to DEC-059 specifically for competitive intel)

## Tool / source map

| Source | What it tells | Available without MCP? |
|---|---|---|
| SimilarWeb | Traffic estimates, channel mix, audience overlap | Free tier limited; paid needed |
| Ahrefs | Organic keywords, backlinks, top pages | Subscription required |
| Semrush | Same as Ahrefs; slightly different data | Subscription required |
| Apollo | Org charts, hiring activity, recent funding | Subscription required |
| G2 | SaaS reviews + comparison data | Free with account |
| Capterra / TrustRadius | SaaS reviews | Free with account |
| App Annie / SensorTower | Mobile app rankings, download estimates | Subscription required |
| Meta Ad Library | Currently-running Meta ads (transparent) | Free |
| TikTok Creative Center | Top-performing TikTok ads | Free |
| Google Ads Transparency | Currently-running Google ads | Free |
| LinkedIn Ad Library | Active LinkedIn ads | Free |
| Wayback Machine | Positioning history (homepage over time) | Free |
| BuiltWith / Wappalyzer | Tech stack | Free |
| Crunchbase | Funding, team size | Free + paid tiers |
| Glassdoor | Internal culture, hiring patterns | Free |

## Output structure

```markdown
# Competitive Intelligence

## Competitor set (with classification)

### Direct competitors (same job, similar product)
- [Competitor A — name, URL, brief description]
- [Competitor B]

### Indirect alternatives (same job, different product category)
- [Tool X — name, URL]

### Status quo (the most important alternative)
- "Do nothing" — what does this look like for the ICP today? What is the cost of inaction?
- "Use a spreadsheet"
- "Internal-built solution"
- "Use a free tool"

### Adjacent / future competitors
- [Players who might enter the category — e.g., big tech expansion, well-funded startup, foreign market entrant]

## Per-competitor profile (one per competitor)

### [Competitor Name]
- **URL:** [primary domain]
- **Founded / Funding:** [year, funding stage, last round date]
- **Team size:** [from LinkedIn / Apollo]
- **Stated ICP:** [from their homepage / pricing / case studies]
- **Pricing:** [tiers, $ ranges, free / freemium]
- **Positioning statement:** [paraphrased + Wayback Machine link to homepage history]

#### Their unique attributes (what they claim)
- [Attribute 1]
- [Attribute 2]

#### Channels they're investing in
- **SEO:** [from Ahrefs — top pages, top keywords, organic traffic estimate]
- **Paid search:** [from Ahrefs Paid / Google Ads Transparency — top ad copy, top keywords]
- **Paid social:** [Meta Ad Library — N active ads, dominant creative themes]
- **Content / blog:** [publishing cadence, top topics]
- **LinkedIn / X organic:** [founder + employee activity]
- **Podcast / video:** [yes/no, frequency]
- **Newsletter sponsorships:** [from Beehiiv, Sparkloop, etc.]
- **Community / events:** [forum, Slack, hosted events]

#### Their messaging
- **Hero headline (current):** [quote]
- **Subhead:** [quote]
- **CTA:** [quote]
- **Stated proof points / social proof:** [list]
- **Voice / tone characterization:** [brief]

#### What customers say (from G2 / Capterra)
- **Average rating:** [N stars, N reviews]
- **Common 5-star praise:** [themes]
- **Common 1-2 star complaints:** [themes — high-leverage for positioning gaps]
- **Direct quotes (low-rated):**
  > "[Verbatim 1-star quote]" — [Source / date]
  > "[Verbatim 2-star quote]" — [Source / date]

#### Recent moves
- **Recent product launches:** [from changelog / press]
- **Recent positioning changes (Wayback):** [observation]
- **Recent hiring:** [from Apollo / LinkedIn — what departments are growing]
- **Recent funding:** [if material]

#### Our positioning advantages vs them
- [Specific attribute we have that they lack — verifiable]
- [Specific ICP they don't serve well that we do]

#### Our positioning vulnerabilities vs them
- [Specific attribute they have that we lack]
- [Specific ICP they serve better]

## Category-level analysis

### Category market size
- [TAM / SAM estimate with source]

### Category growth direction
- [What direction are competitors positioning toward — consolidation, fragmentation, sub-segmentation]

### Category language / terminology evolution
- [Terms entering the category vocabulary, terms leaving]

### Category awareness stage (Schwartz)
- Are buyers Unaware? Problem-aware? Solution-aware?
- The category as a whole has an average awareness stage; new categories require buyer education.

## Cross-competitor synthesis

### Positioning gaps (where no competitor competes well)
- [Gap 1] — N competitors weak here — opportunity
- [Gap 2]

### Common positioning patterns across the set
- All claim to be "easier than [legacy player]" — pattern; how do we differentiate?
- All target "modern teams" — pattern; how do we differentiate?

### Pricing patterns
- Median seat price: $[N]
- Median ACV: $[N]
- Common tiers: [pattern]

### Ad creative patterns (Meta / TikTok)
- Dominant creative format: [9:16 vertical, talking-head, UGC, screen-recording, etc.]
- Dominant message themes: [list]
- What's NOT being done in the category — opportunity.

### SEO landscape
- Most-fought keywords: [list with CPC estimates]
- Undefended bottom-funnel queries: [opportunity]
- AI-Overviews-affected vs unaffected query types in this category

## Decision cards
[DEC-050 to DEC-059]

## What we are intentionally NOT doing in this layer
- Scraping competitor sites in ways that violate their TOS — only use publicly transparent sources.
- Producing fake "anonymous insider" intel — refuse.
- Recommending defamatory comparison content — comparison content must be factually verifiable.
- Engaging in trademark-infringing competitor displacement (e.g., bidding on competitor name without legal review).

## Sources and basis

V3 §2.6 (Competitive analysis sources by business model).
Evidence grade per claim varies — competitor stats from SimilarWeb / Ahrefs are B; competitor positioning claims from homepages are A (primary source); customer-perception from reviews is B; vendor-marketing claims are D.
```

## When to delegate to marketing-skills:competitor-profiling / competitors

For deeper individual competitor profiles, invoke `marketing-skills:competitor-profiling`. For category-level competitor scans, `marketing-skills:competitors`. Wrap outputs in DEC cards.

## Refresh cadence

- Initial run: comprehensive deep-dive (4-8 hours of agent work).
- Quarterly: refresh competitor positioning, ad creative, pricing.
- Monthly (agentic mode): quick scan for major changes (new product launches, major repositioning, funding).
- Daily (agentic mode): alert on category-level news / press.

## Cross-cites produced

- `marketforge-positioning` Box 1 (competitive alternatives).
- `marketforge-channel-strategy` (where are competitors NOT competing?).
- `marketforge-website-copy` (especially comparison pages).
- `marketforge-content-strategy` (uncovered content angles).
- `marketforge-paid-search` (competitor keyword targets).
- `marketforge-paid-social` (competitor creative patterns to differentiate from).
- `marketforge-bias-audit` (any vendor-claim citations).

## Mode-aware behavior

### Greenfield
- Identify competitors from category research + analogue products.
- Less data on direct competitive positioning vs us; more on category-level.

### Existing
- Comprehensive comparison including our existing positioning vs competitors.
- Include G2/Capterra of US vs competitors.

## Refusal scope

If user asks for "competitive intel" via:
- Scraping competitor systems via authentication bypass.
- Reverse-engineering competitor's customer list.
- Encouraging defamation in comparison content.

Refuse and propose legitimate alternatives.

## What we are intentionally NOT doing in this layer

- Treating competitor claims as factual without verification.
- Building competitive intel on insider gossip — public, transparent sources only.
- Skipping the status-quo "do nothing" competitor — that's usually the most important.
- Producing competitive content that violates trademark / advertising law.

## Sources and basis

V3 §2.6.
