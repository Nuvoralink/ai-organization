# Attribution Protocol

Post-iOS 14.5 ATT (April 2021) and progressive cookie deprecation, deterministic last-click attribution is broken. Platform-reported routinely over-attributes 20-50% in DTC. MarketForge never reports a single attribution number as truth.

## The mental model

> "Treat platform numbers as directional. Triangulate with self-report + incrementality. Hold the *mix* responsible for total outcomes."

## The triangulation stack

Every channel's contribution is measured by intersecting 4 sources where applicable. No single source is authoritative.

### Source 1: Platform-reported attribution
- Meta Ads Manager.
- Google Ads + GA4 conversions.
- TikTok Ads Manager.
- LinkedIn Campaign Manager.
- ASA / Adjust / AppsFlyer.

**Bias:** Platforms over-attribute (every platform claims credit for the same conversion); also under-attribute post-iOS 14.5 for iOS users.

**Use as:** Directional channel-by-channel signal. Never as ground truth.

### Source 2: Server-side conversion API (CAPI)
- Meta Conversions API.
- Google Enhanced Conversions.
- TikTok Events API.

**Bias:** Better than client-side for iOS, but still platform-self-reported.

**Use as:** Improves platform-reported accuracy by 10-30%. Use alongside platform-reported.

### Source 3: Self-reported attribution survey
- Free-text "How did you hear about us?" on signup / checkout / first purchase.
- AI-categorized → weighted against platform-reported.

**Biases:**
- Recency (users name last touch).
- Brand-name (users name Google/Instagram even when assist, not source).
- Only-converted-answer (loses non-converter dark social).
- Survivor bias overall.

**Use as:** Surface dark-social and word-of-mouth channels invisible to platforms. SparkToro / Refine Labs evidence shows self-report uncovers significant podcast / community / DM-based attribution that platform data misses entirely.

### Source 4: Incrementality testing
- Geo holdouts (turn off a channel in 2-3 representative DMAs for 4-6 weeks).
- Conversion lift studies (Meta/Google built-in tools).
- Time-series analysis (paused vs. running periods).

**Bias:** Requires meaningful budget ($5K+/mo per channel) and disciplined experimentation. Many SMBs can't run rigorously.

**Use as:** Gold standard for "is this channel actually causing revenue?" — but expensive.

## When to use which

| Stage | Spend level | Recommended attribution stack |
|---|---|---|
| Pre-paid (organic only) | $0/mo paid | Self-report survey + branded-search trend monitoring |
| Light paid | <$2K/mo | Platform-reported + CAPI + self-report survey |
| Mid paid | $2-10K/mo | Platform + CAPI + self-report + occasional geo holdout |
| Heavy paid | $10K+/mo | Full triangulation + recurring geo holdouts + (T3+) MMM |
| Enterprise paid | $50K+/mo | MMM (Meta Robyn or Google Meridian) + incrementality + triangulation |

## The 20-40% hangback rule

In DTC at meaningful scale (>$50K/mo paid), Meta-reported revenue routinely overstates actual revenue by 20-40%. Triangulate with post-purchase survey + total-business-revenue comparison.

If Meta says "$80K attributable last month" but total ecom revenue is $100K and the lifecycle/organic baseline is $50K, Meta's true contribution is closer to $30-40K — and Meta will claim $80K because every platform claims credit.

## Self-report survey design

### Question
> "How did you hear about us?" (free-text required)

NOT a picklist. Picklists bias toward listed channels and miss dark social.

### Where to ask
- At signup (B2B).
- At first checkout (DTC).
- At first booked job (local service).
- At first paid month after free trial (SaaS).

### Frequency
- 100% of conversions (free-text is low friction).
- If conversion volume is huge, sample at 10-25% to manage analysis load.

### Analysis
- AI categorize free-text into channels.
- Weight against platform-reported.
- Look for divergence (dark social).
- Track recency-bias by comparing to assist data.

### Reporting

Sample monthly attribution dashboard:

| Channel | Platform-reported | CAPI-adjusted | Self-report | Geo holdout (Q3) | Triangulated estimate |
|---|---|---|---|---|---|
| Meta Ads | $42K | $38K | $22K | Lift: $30K | $32K |
| Google Search | $18K | $19K | $14K | Lift: $16K | $16K |
| Cold email | $0 (not tracked) | n/a | $8K | (not tested) | $8K |
| Podcast guesting | $0 | n/a | $7K | (not tested) | $7K |
| Organic / direct | n/a | n/a | $18K | (not tested) | $18K |
| Founder LinkedIn | $0 | n/a | $4K | (not tested) | $4K |

Total triangulated: $85K. Compares against actual revenue. Reveals dark social channels (podcast, LinkedIn, cold email) entirely invisible to platform data.

## What MarketForge always does

1. Designs the self-report survey on first run if it doesn't exist.
2. Documents the triangulation stack in `09-cro-measurement/attribution-stack.md`.
3. Reports channel performance as ranges, not single numbers.
4. Flags every single-source attribution claim as suspect.
5. In agentic mode, refreshes the triangulation monthly and surfaces divergence.

## What MarketForge never does

- Report "Meta Ads drove $42K last month" without context.
- Trust platform-reported ROAS at face value.
- Build channel-allocation decisions on a single attribution source.
- Trust last-click attribution as default.
- Ignore dark social / dark funnel.

## Dark social / dark funnel awareness

Chris Walker / Refine Labs research: in their client data, podcast was attributed to 53% of revenue via self-reported but 0% via software-based attribution — the attribution mirage.

Channels typically invisible to platform attribution:
- Podcast (both hosting and guesting).
- Slack / Discord communities.
- LinkedIn DMs.
- Word-of-mouth at events.
- Newsletter sponsorships (depending on UTM hygiene).
- Founder content (often credited to "Google" or "Direct").
- AI search citations (often credited to "Direct" if the user manually navigated).

Treat platform-reported = 0 for these channels by default; rely on self-report.

## Channel-decay reality

| Channel | 2019 baseline | 2026 reality |
|---|---|---|
| Facebook Ads CAC (DTC) | Baseline | ~3x higher |
| Google Search CPCs | Baseline | Consistently up |
| Cold email reply rates | 8.5% (B2B avg) | ~3.43% |
| Position-1 SEO CTR | Baseline | -58% on AIO queries |

Don't model 12-month CAC at today's rate. Expect each channel to decay 10-30% over a year unless creative/targeting iterations counter it.

## Bias inline

When citing platform-reported numbers, flag the source:

> "Meta Ads Manager reports CAC of $42 last month. Platform-self-reported; iOS hangback ~25-35%. CAPI-adjusted: ~$48. Self-report survey weight: 18% of paying customers credit Meta; actual contribution likely $32-38K of $100K revenue."

This honesty is the discipline.
