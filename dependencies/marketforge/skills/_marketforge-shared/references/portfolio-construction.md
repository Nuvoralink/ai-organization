# Portfolio Construction — The 3-Leg Model

Most SMB marketing portfolios fail in one of two ways:
1. **Concentration risk:** 80%+ of new revenue from one channel; channel decay kills the business.
2. **Diversification theater:** "We're on 8 channels"; none reach effective velocity.

The 3-leg model splits the difference: enough channels for resilience, few enough to execute well.

## The 3 legs

### Leg 1: One compound channel (12+ months to mature)

A channel where each dollar makes future dollars cheaper. Marginal cost approaches zero. Returns compound non-linearly over time.

**Compound channel candidates:**
- SEO (especially bottom-funnel commercial + brand)
- GEO/LLMO (cited-in-AI-engines)
- Content (POV pieces, original research, podcast)
- Community (forum, Slack, Discord, events)
- Founder personal brand (LinkedIn / X / YouTube / newsletter)
- Free tools / engineering-as-marketing
- Owned email list
- Customer marketing (case studies, reference calls, advocacy)
- Brand SEO + brand awareness compounding

**Why compound matters:** Channel decay is real. Paid search CPCs have risen consistently; cold email reply rates halved; Facebook CAC tripled in 7 years. Without compound channels, every year is a fresh acquisition battle. With compound channels, the business builds an asset.

**Pick ONE compound channel and invest hard.** Two compound channels at half-strength produces less than one at full strength because compound channels need critical mass + sustained investment to compound.

### Leg 2: One to two harvest (linear) channels (work month 1, never get cheaper)

Channels with predictable returns proportional to spend. They convert traffic to revenue at a known unit economic. They scale with budget but don't get cheaper over time.

**Harvest channel candidates:**
- Paid search (Google/Bing) — branded + competitor + commercial-intent + category
- Paid social (Meta, TikTok, LinkedIn TLA) — depending on business model
- Paid mobile (ASA + UAC) — for apps
- Cold email / outbound
- Cold LinkedIn outreach
- Direct mail / ABM dimensional mailers
- Newsletter sponsorships (placing in others')
- Sponsorships (podcast host-read, YouTube integrations)
- Affiliate / partner channels

**Pick 1-2 harvest channels per the channel-scoring matrix.** Two harvest channels are reasonable when:
- Business has multiple ICP segments with different channel preferences.
- Budget tier T2+ permits investment in both.
- Team capacity allows execution.

Don't pick more than 2 at SMB scale. The math: $5K/mo across 2 channels = $2.5K/mo each, enough for signal. Across 5 channels = $1K each, sub-signal.

### Leg 3: One wildcard / contrarian bet (90-day test)

An asymmetric-opportunity channel — typically one your competitors ignore. Capped test budget, crisp kill criterion, run hard for 90 days.

**Wildcard candidates by business model:**
- B2B SaaS: TikTok organic (when ICP is the dev / no-code / AI / sales-ops crowd); Reddit Ads; podcast guest spotlights.
- DTC: B2B affiliate / partner placement; direct mail to top customers' offices; Wholesale via DTC-friendly retailers.
- B2C mobile: SaaS-style content marketing; LinkedIn for an unusual market segment; influencer reactive content.
- Local service: Nextdoor at hyper-local scale; sponsorship of micro-local content creator; PR around community story.
- Marketplace: Supply-side viral mechanic; cross-network partnerships.
- Creator: Cross-platform format experiments; live event series; collaborative original research.
- Agency: Quarterly POV research report distributed to press + LinkedIn.
- Hardware DTC: Engineering-content / "how we built X" YouTube series.

**Wildcard discipline:**
- 90-day test window (not 30, not 12 months).
- Budget cap: 10-20% of total budget.
- Crisp success criterion: revenue signal, audience signal, or asymmetric attention (not vanity).
- Crisp kill criterion: no signal of asymmetric upside in 90 days → kill, rotate to next wildcard.
- Document the thesis: WHY is this a wildcard? What's the asymmetric upside hypothesis?

## Allocation rules

### By budget tier

| Tier | Compound | Harvest | Wildcard | Notes |
|---|---|---|---|---|
| T1 ($0-500/mo) | 60-80% time | 20-40% time | 0-20% time | Mostly free-time/founder-time activities |
| T2 ($500-5K/mo) | 30-50% budget + significant time | 40-60% budget | 10-20% budget | Wildcard is meaningfully funded |
| T3 ($5-25K/mo) | 30-50% budget + dedicated role | 40-60% budget | 10-15% budget | All legs are funded execution |
| T4+ ($25K+/mo) | 40-60% budget | 35-50% budget | 5-15% budget | Wildcard becomes optional as scale grows |

### By stage

- **Pre-PMF:** Compound = founder content + customer interviews. Harvest = none (defer paid). Wildcard = maybe one experiment with a clear hypothesis.
- **Early post-PMF ($500K - $2M ARR):** Compound = SEO BoFu + founder brand. Harvest = paid search branded + competitor. Wildcard = active.
- **Scaling ($2M-$10M ARR):** Full 3-leg in motion. Multiple harvest channels.
- **Mature ($10M+ ARR):** Brand investment (per Binet/Field) becomes defensible; brand is itself a compound asset.

## Concentration risk

**Hard rule: no single channel >50% of new revenue acquisition.**

If yes:
- Channel concentration risk.
- Add buffer channels.
- Define a kill / pivot plan if the channel breaks.

Channel breakage examples:
- Meta Ads CAC doubles (CPMs rising; iOS attribution further degrades).
- Google AI Overviews crush remaining SEO clicks.
- LinkedIn algorithm change demotes the founder's content.
- Cold email deliverability collapses on a domain.
- Newsletter you sponsored goes offline.

If 70%+ of revenue depends on one channel and it breaks, the business has ~6 weeks of runway. The 3-leg model protects against this.

## Anti-patterns

### Anti-pattern A: 8-channel inventory
"We're doing SEO, paid search, paid social, LinkedIn, X, TikTok, YouTube, and podcast."

This is not a portfolio; it's an inventory. None reach effective velocity. Pick 3.

### Anti-pattern B: Two compound channels at half-strength
"We're investing in SEO and community."

If you invest in two compound channels simultaneously, you're below the compounding threshold on each. Pick one. Compound the second when the first matures.

### Anti-pattern C: Skipping the wildcard
"Compound + harvest is enough."

You'll miss asymmetric opportunities. The wildcard slot is cheap insurance against incumbents' inattention.

### Anti-pattern D: Channel-as-identity
"We're a Meta Ads shop." / "We're a content company."

Channels are means, not ends. The business needs revenue. If the channel decays, the business needs the option to pivot. Channel-as-identity prevents that pivot.

### Anti-pattern E: Wildcard = "everything else"
The wildcard slot should be specific. "We're trying TikTok organic with this specific UGC creator collaboration thesis" is a wildcard. "We're trying various social media" is not.

## How MarketForge produces a 3-leg portfolio

1. `marketforge-channel-strategy` scores all candidate channels against the 7-factor matrix.
2. `marketforge-portfolio-construction` selects 1 compound + 1-2 harvest + 1 wildcard from the scored list.
3. Documents allocation (% budget, % time, owner) for each leg.
4. Defines kill criteria for each leg.
5. Defines re-evaluation timeline.
6. Writes `docs/marketing-plan/02-strategy/portfolio-construction.md`.

## Quarterly portfolio review

Every quarter:
- Re-score active channels.
- Confirm compound channel is still on track (showing compounding signals).
- Confirm harvest channels still hit unit economics.
- Wildcard verdict: extend, kill, or replace.
- Adjust allocation per evidence.

## Example portfolio

**Product:** B2B SaaS PLG, $79/seat, dev tool, $2M ARR, T2 budget ($4K/mo paid + founder time).

| Leg | Channel | Allocation | Why |
|---|---|---|---|
| Compound | Bottom-funnel SEO (15 comparison + integration pages) + founder X/Twitter | Founder 6h/week + $500/mo Ahrefs | Highest-scoring compound channel for dev-tool ICP; founder has technical voice |
| Harvest 1 | Paid search competitor terms | $2,500/mo | Captures intent at conversion-ready moment; predictable CAC |
| Harvest 2 | Newsletter sponsorships (1 placement/month in dev newsletters) | $1,000/mo | Reach dev ICP at sponsorship CPM $50-100 vs Meta CPM $8 for same ICP density |
| Wildcard | TikTok organic — series on "how we shipped X" engineering content | Founder 2h/week | Thesis: dev-tool TikTok is under-served; even modest reach builds compound founder brand |

Total allocation: $4,000/mo paid + ~8h/week founder.

Kill criteria:
- SEO: kill BoFu page production if no rankings page 2 in 6 months (sustained).
- Paid search competitor: kill if CPA > $300 sustained for 30 days.
- Newsletter sponsorship: kill specific placement if CAC > 2x blended.
- TikTok wildcard: 90 days; kill if no follower growth + no signups attributable.

Concentration: max single-channel revenue contribution monitored monthly; if newsletter sponsorship becomes >50% in 6 months, diversify.
