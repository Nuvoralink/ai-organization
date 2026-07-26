---
name: marketforge-voice-of-customer
description: Voice-of-customer mining from reviews (Amazon, G2, Capterra, TrustRadius, app stores, subreddits, NPS, support tickets, churn exit interviews). Extracts themes and verbatim language. AI excels at theme extraction; humans pick the language. Use as Phase 1 step 3 of MarketForge full runs.
---

# MarketForge Voice of Customer

Read shared references. Apply V3 guide §2.3 (Review mining & VOC).

## Global quality rules

- 1-star and 2-star reviews of competitors reveal positioning gaps better than 5-star reviews.
- 3-star reviews are often the most honest — use them heavily.
- AI extracts themes (🤖🤖🤖 automatable); humans pick the *specific language* (judgment-only).
- Verbatim quotes are the source for hero copy, ad headlines, objection-handling. Capture them in `auditability/voc-quotes-bank.md`.

## Purpose

Mine the customer's actual language from public and internal sources to produce:

1. Theme analysis (what customers say across many sources).
2. Verbatim quote bank (specific language for copy).
3. Positioning gaps revealed in competitor reviews.
4. Objection / anxiety themes (feeds messaging architecture and sales enablement).
5. Aha-moment language (feeds onboarding + activation messaging).

## Inputs

- `marketing-brief.md` for category context.
- User-supplied internal sources (NPS verbatims, support tickets, churn exit interviews, sales call recordings).
- Browser MCP / WebFetch for public sources.
- Competitor list from `competitive-intel.md` (informs which competitor reviews to mine).

## Sources by business model

| Model | Primary VOC sources |
|---|---|
| **DTC ecom** | Amazon reviews (especially 3-star), Trustpilot, brand subreddit, Reddit threads, Google reviews, TikTok comments on product reviews |
| **SaaS** | G2, Capterra, TrustRadius, internal NPS verbatims, churned-customer exit interviews, sales call recordings, support tickets |
| **Mobile app** | App Store + Play Store reviews (sorted by recency and 2-3 star), Reddit, Discord communities |
| **Local service** | Google reviews, Yelp, Nextdoor, BBB |
| **B2C subscription** | App stores, Trustpilot, Reddit, Twitter mentions |
| **Marketplace** | Both sides — supplier reviews + buyer reviews; Reddit; vertical-specific forums |
| **Creator / content** | Comments on platform, replies on newsletter, Reddit fan communities |
| **Hardware DTC** | Amazon reviews, YouTube reviews, vertical-specific forums (Wirecutter, RTINGS for electronics, etc.) |

## Outputs

- `docs/marketing-plan/01-foundations/voice-of-customer.md`
- `auditability/voc-quotes-bank.md` — verbatim quotes by theme + persona
- DEC-030 to DEC-039 — VOC findings

## Output structure

```markdown
# Voice of Customer

## Sources mined

| Source | N analyzed | Date range | Notes |
|---|---|---|---|
| G2 — our product | 142 | 2024-01 to 2026-04 | Recent + historical |
| G2 — Competitor A | 1,243 | 2024-01 to 2026-04 | Sorted by 1-3 star |
| G2 — Competitor B | 387 | sample of 200 | |
| Amazon reviews (DTC) | 850 | sorted 3-star priority | |
| Brand subreddit | 240 posts | last 12 months | |
| Internal NPS verbatims | 89 | last 12 months | Promoter, passive, detractor split |
| Churn exit interviews | 31 | last 12 months | |
| Sales call recordings | 18 | sample | |
| App Store reviews | (skip if not applicable) | | |

Total: [N] data points.

## Theme analysis

### What customers love (themes from 4-5 star reviews + NPS promoters)
1. [Theme] — N mentions — example quote: "[verbatim]"
2. [Theme] — N — quote
3. ...

### What customers complain about (themes from 1-3 star + detractors + churn)
1. [Theme] — N — quote
2. ...

### Recurring switching language (customers who switched FROM something TO us)
[Theme + quote — feeds positioning + ad copy]

### Recurring switching language (customers who switched FROM us TO something else)
[Theme + quote — high-leverage signal for product / positioning gaps]

### Trigger events mentioned
[The specific moments that drove buying. Feeds outbound + content angles.]

### Closest-call themes (almost didn't buy)
[Feeds objection handling.]

## Competitor review mining

### Competitor A — 1-3 star themes
1. [Theme] — N% of low-star reviews — example: "[quote]"
2. ...

**Positioning gap revealed:** [What competitor weakness becomes our positioning strength?]

### Competitor B — 1-3 star themes
[Similar structure]

## Verbatim quote bank (top 20-30)

Quotes organized by intended use:

### For homepage hero
- "[Quote 1]" — [Source]
- ...

### For ad headlines
- "[Quote]" — [Source]
- ...

### For objection-handling content
- "[Quote about the worry]" — [Source]
- "[Quote about how we addressed the worry]" — [Source]
- ...

### For case studies
- "[Quote about specific outcome]" — [Source]
- ...

### For social proof
- "[Quote with specific number]" — [Source]
- ...

## Implications

### For positioning (cross-cite into marketforge-positioning)
- [Specific gap revealed by competitor reviews → our unique attribute]

### For messaging architecture (cross-cite into marketforge-messaging-architecture)
- Lead with [theme] — supported by N customer mentions.
- Address [objection] explicitly — top 1-3 star theme on us + competitors.

### For ICP refinement (cross-cite into marketforge-icp-persona)
- [Pattern across reviews] suggests sub-segment we hadn't named.

### For content strategy (cross-cite into marketforge-content-strategy)
- Original-research angles: [list]
- Comparison-page angles: [list]

### For lifecycle (cross-cite into marketforge-email-lifecycle)
- Common objection at trial-end: [theme] — addressable via email content.

### For onboarding (cross-cite into marketforge-onboarding-activation)
- The aha-moment in customer's own words: [verbatim].

## Decision cards
[DEC-030 to DEC-039]

## What we are intentionally NOT doing in this layer
- Generating composite "customer voice" that synthesizes verbatim — we preserve exact quotes.
- Cherry-picking only flattering reviews — 1-3 star reviews drive most learning.
- Treating one review as a theme — patterns require N≥3 independent mentions.

## Sources and basis

V3 §2.3 (Review mining & VOC).
Evidence grade: B (large-scale industry source data); customer quotes are A (primary source).
```

## When to delegate to marketing-skills:customer-research

Invoke `marketing-skills:customer-research` for question design when conducting fresh interviews. Wrap output in DEC cards.

## When to use browser MCP

For competitor review mining and Reddit theme extraction, browser MCP (or WebFetch) is required to access content at scale. If not available, mark Source basis: User-supplied only and reduce N.

## Refresh cadence

- Initial run: deep mining (~50-200 sources per competitor per major site).
- Quarterly: refresh — new reviews, new churn data, recent NPS.
- Monthly (agentic mode): incremental refresh + theme drift detection.

## Cross-cites consumed

- DEC-001-DEC-007 (marketing brief, readiness).

## Cross-cites produced

Consumed widely — positioning, messaging, ICP, content strategy, lifecycle, customer marketing, onboarding, web copy.

## Anti-patterns

### Anti-pattern A: Composite synthetic quotes
Generating "Sara from Acme Corp" quotes that synthesize themes. FORBIDDEN. Use real verbatim or omit.

### Anti-pattern B: Theme without N
"Customers love our product" — useless. Specify N=18 of 142 (12.7%) reviews mention this; verbatim quotes attached.

### Anti-pattern C: Skipping competitor 1-star mining
Most positioning insights are in your competitor's complaints, not your praises. Don't skip.

### Anti-pattern D: Treating one churn interview as Universal Truth
A single churn says one customer's story. Patterns need N≥3.

## Sources and basis

V3 §2.3.
