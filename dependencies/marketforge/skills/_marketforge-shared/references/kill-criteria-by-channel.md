# Kill Criteria By Channel

Every channel recommendation in MarketForge includes a kill criterion and a test window. This prevents the two most common channel-portfolio failures:

1. Killing a compound channel before it has time to compound (e.g., killing SEO at 30 days).
2. Continuing a failed paid channel past its kill window because "it's only been a quarter."

**The discipline: paid-performance kill windows (30-60 days) MUST NOT be applied to compound channels (12+ months). Compound kill windows (12+ months) MUST NOT be applied to paid channels.**

## The table

| Channel | Test window | Kill criterion |
|---|---|---|
| **Paid search (Google/Bing)** | 30-60 days | CPA > 150% of target with no improving trend across 2 creative iterations |
| **Paid social — Meta** | 14-21 days per creative cycle | CPM-r rising + CTR falling + CPA stuck across 2 creative refreshes |
| **Paid social — TikTok Ads** | 21-30 days per creative cycle | CPM-r rising + CTR falling + CPI/CPA stuck; or fatigue signal in 3+ Spark Ads variants |
| **Paid social — LinkedIn (Thought Leader Ads)** | 30 days | CTR < 0.5% with $2K+ spent across 3 TLA variants; or CPC > $25 sustained |
| **Paid social — LinkedIn (Single Image)** | 14 days | (Channel inherently underperforms TLA — V3 guide: 6.4x worse CTR at 5.8x higher CPC. Default kill at 14 days unless brand-mandate.) |
| **Paid social — Reddit Ads** | 30 days | CTR < 0.4% sustained; CPC > $5 with no relevance signal in comments |
| **Paid mobile — Apple Search Ads** | 30-45 days | D30 ROAS < 0.6 on a campaign with $5K+ spent; or blended CPI > $8 sustained for 14 days |
| **Paid mobile — Google UAC** | 30-45 days | Failed to reach 30+ daily conversions in 45 days (cannot transition tCPI → tCPA); or tCPA campaign exceeds 150% of target sustained |
| **Cold email** | 4-6 weeks (after warmup) | Reply rate < 1% with deliverability verified (SPF/DKIM/DMARC pass, < 2% bounce, < 0.1% spam complaint) |
| **Cold LinkedIn outreach** | 6-8 weeks | Connection acceptance < 20% on relevant ICP targeting, or no meeting per 100 accepted connections |
| **Direct mail / ABM dimensional mailer** | 6-8 weeks (cycle of 50-200 accounts) | Reply / meeting-book rate < 3% on top-tier accounts; or no closed-won within 1 sales cycle of mail |
| **Cold calling** | 30-60 days (per SDR ramp) | Pickup rate < 1%, or conversation-to-meeting < 5% of pickups sustained |
| **SEO (bottom-funnel commercial)** | 6-12 months | Rankings flat + no compounding in branded search + no traffic compounding curve forming |
| **SEO (top-of-funnel / "ultimate guide")** | (Channel is broken post-AIO. V3 guide: do not pursue.) | N/A — kill before starting unless asymmetric advantage |
| **GEO / LLMO (citation in AI engines)** | 6-12 months | Citation share flat at 0 in tracked engines after 6 months of structured content + entity-recognition work |
| **Content / POV pieces** | 6-12 months | Engagement (saves, shares, named replies) flat + no compounding in inbound + no audience growth |
| **Newsletter sponsorships (placing in others)** | 1-2 placements | CAC > 2x blended channel CAC across two placements in different newsletters |
| **Brand SEO** | 6-12 months | Branded search volume flat after sustained brand-building activity |
| **Podcast hosting (we host)** | 6-12 months | Aided awareness flat + no branded-search lift + no dark-social attribution signal in self-report surveys |
| **Podcast guesting (we appear on others)** | 6-12 months | 10+ guestings without measurable signup lift; no audience response in episode comments / social |
| **YouTube (long-form tutorial)** | 6-12 months | Subscriber growth flat + no assisted-conversion signal in analytics + no inbound mention |
| **TikTok organic** | 3-6 months | Follower growth flat + no measurable signup or DM signal + no virality moments |
| **LinkedIn organic (founder)** | 6-12 months | Follower growth flat + engagement rate < 1% + no DM-based inbound + no brand-search lift |
| **X/Twitter organic (founder)** | 6-12 months | Follower growth flat + engagement rate < 1% + no DM-based inbound + no brand-search lift |
| **Reddit community (organic, non-ad)** | 6-12 months | Subreddit presence built; no measurable signup, DM, or brand-mention lift |
| **Community-led growth (forum, Slack, Discord)** | 12 months | < 30% of new ARR comes via community per self-report attribution; activity is CSAT-themed not acquisition-themed |
| **Engineering-as-marketing (free tool)** | 6-12 months | Tool reaches < 1,000 weekly active uses in 6 months with promotion; conversion from tool → product < 1% |
| **PR / earned media** | 6-12 months | No tier-1 placements + no brand-search lift + no dark-social mentions |
| **Referral program** | 90 days minimum | K-factor < 0.1 after activation-moment-ask optimization + UI prominence + two-sided incentive |
| **Loyalty program** | 6-12 months | Repeat-purchase rate flat or declining among enrolled vs non-enrolled |
| **Affiliate / partner program** | 6 months | Active partners < 10 producing < 5% of new revenue |
| **Influencer (micro)** | 90 days (per cohort of 10 seeds) | Cost-per-attributable-sale > 2x blended CAC sustained |
| **Influencer (macro/sponsored)** | 30-60 days per placement | CAC > 2x blended channel CAC, no brand-search lift |
| **Wildcard / contrarian bet** | 90 days | No signal of asymmetric upside; no improvement curve forming; no defensible thesis for extending |

## How to apply

1. When recommending a channel, include both the test window and the kill criterion in the decision card.
2. When tracking active channels, write to `docs/marketing-plan/operations/channel-status-YYYY-MM-DD.md` whether each channel is within window, approaching window, or past window.
3. When a channel hits kill criterion, do not auto-kill. Surface to the responsible owner with the evidence; recommend kill or one-cycle extension with crisp re-test conditions.
4. When extending past the kill criterion, log the rationale explicitly. "We didn't measure it carefully enough" is not a rationale.

## Why these windows differ

| Channel type | Time to result | Why |
|---|---|---|
| Paid (linear) | 14-60 days | Algorithm has conversion data; CAC is observable; iteration cycle is fast |
| Outbound (linear) | 4-8 weeks | Deliverability + targeting cycle; volume needed for signal |
| Compound (SEO, content, community) | 6-12 months | Earning vs buying attention; compounding takes time |
| Brand / podcast (compound) | 6-12 months | Aided awareness builds slowly; dark social attribution lags |

Applying paid kill criteria (30 days) to compound channels is the most common channel-portfolio mistake. It's why founders give up on SEO at month 4 ("traffic isn't growing") and then 6 months later wish they'd kept investing.

## Anti-pattern

❌ "We tested SEO for 90 days and it didn't work — killing it."

✅ "We've been investing in SEO for 4 months. Compound kill window is 6-12 months. Current signal: 8 of 12 target keywords now ranking on page 2, brand search up 30%, time on page steady. Continue investing through month 9 minimum; re-evaluate then with rigorous metrics review."

## Channels never to kill

Some channels compound so slowly they're effectively never killed once started:

- Owned audience email list (you're not running it; it's an asset).
- Brand SEO on your own name.
- Founder's personal voice (unless founder leaves the company).
- Customer testimonials / case studies (assets accumulate).

These are maintenance, not channels to evaluate kill criteria against.
