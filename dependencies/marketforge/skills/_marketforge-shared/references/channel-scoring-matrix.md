# Channel Scoring Matrix

Every channel recommendation in MarketForge is scored against 7 factors on a 1-5 scale. This prevents "throw spaghetti at the wall" channel inventories.

## The 7 factors

For each channel under consideration, score 1-5:

### 1. Buyer-channel match (1-5)

Does the ICP actually use this channel?

- 5: ICP demonstrably present at high density (90%+) on this channel; we can name specific accounts/handles.
- 4: ICP heavily present; competitive density confirms.
- 3: ICP present but mixed with non-buyers; targeting cost matters.
- 2: ICP partially present; less than half engage with this channel meaningfully.
- 1: ICP absent or unknown on this channel.

### 2. Economics (1-5)

Does channel CAC fit the LTV math?

- 5: CAC/LTV ratio < 0.2 (very healthy) for this product's economics.
- 4: CAC/LTV ratio < 0.33 (LTV:CAC ≥ 3:1).
- 3: CAC/LTV ratio < 0.5 (LTV:CAC ≥ 2:1).
- 2: CAC/LTV ratio > 0.5 (worse than 2:1).
- 1: Channel CAC inherently incompatible with LTV (e.g., LinkedIn Ads for $20/mo SaaS).

### 3. Skill fit (1-5)

Does the team have craft to execute?

- 5: Team has senior-level experience; played the channel before successfully.
- 4: Team has working knowledge; has executed similar channels.
- 3: Learnable; team can pick up with documentation and experimentation in 60 days.
- 2: Major skill gap; would require hiring or contractor.
- 1: Team has no experience; channel requires deep craft (creative, performance, copy) the team doesn't have.

### 4. Time to result (1-5)

Does timeline match business urgency?

- 5: Working in 30 days or less (paid search, paid social with mature attribution).
- 4: Working in 60-90 days.
- 3: Working in 90-180 days.
- 2: 6-12 months to material results.
- 1: 12-24 months (most compound channels — but see Factor 5).

### 5. Compounding (1-5)

Does each dollar make future dollars cheaper?

- 5: Highly compound — SEO/GEO, content, community, founder brand, owned audience email list.
- 4: Strongly compound — podcast, free tools, customer marketing, brand SEO.
- 3: Mildly compound — referral, affiliate (compounds as partner base grows).
- 2: Lightly compound — retargeting (compounds within a customer cohort).
- 1: Linear — paid search, paid social, cold outbound, sponsorships (works month 1, never gets cheaper).

A healthy channel portfolio mixes compound and linear (see `portfolio-construction.md`).

### 6. Competitive density (1-5)

Are we outbid by deep-pocketed competitors?

- 5: Low competition; we can win attention or rankings without massive spend.
- 4: Moderate competition; we can compete with creative or content differentiation.
- 3: Heavy competition; CAC is high but winnable with focus.
- 2: Very heavy competition; we're a tier below incumbents.
- 1: Saturated; competitors will outbid us indefinitely (e.g., generic SaaS terms on Google when Salesforce/HubSpot are bidding).

### 7. Channel-product fit (1-5)

Does the product nature suit the channel?

- 5: Native fit (DTC product with strong visual on TikTok; dev tool on HackerNews; B2B SaaS founder content on LinkedIn).
- 4: Strong fit; product can be naturally demonstrated on the channel.
- 3: Workable fit; requires creative work to bridge product and channel.
- 2: Mediocre fit; channel doesn't naturally show the product.
- 1: Wrong fit (LinkedIn Ads for impulse DTC; TikTok for $100K-ACV enterprise).

## Scoring + interpretation

Total possible: 35 (5 × 7).

| Total score | Recommendation |
|---|---|
| 30-35 | Primary channel — invest heavily |
| 25-29 | Primary channel — invest |
| 18-24 | Supporting channel — modest invest, monitor |
| 12-17 | Deprioritize — only consider if asymmetric opportunity |
| 7-11 | Skip |

The 3-leg portfolio model (see `portfolio-construction.md`):

- 1 compound channel (high on Factor 5)
- 1-2 harvest channels (high on Factor 4)
- 1 wildcard (asymmetric upside, scored opportunistically)

## Worked example

**Product:** B2B SaaS PLG, $50/seat, dev tool for senior backend engineers, $1M ARR, T2 budget.

| Channel | Buyer-channel | Economics | Skill | Time | Compound | Competition | Product-fit | TOTAL |
|---|---|---|---|---|---|---|---|---|
| Bottom-funnel SEO (comparison pages) | 5 | 5 | 4 | 2 | 5 | 4 | 5 | **30** |
| Paid search competitor terms | 4 | 4 | 3 | 5 | 1 | 3 | 5 | **25** |
| HackerNews / Show HN | 5 | 5 | 3 | 4 | 4 | 4 | 5 | **30** |
| Founder X/Twitter | 5 | 4 | 4 | 2 | 5 | 4 | 5 | **29** |
| LinkedIn Ads | 3 | 1 | 3 | 5 | 1 | 2 | 2 | **17** |
| TikTok organic | 2 | 3 | 2 | 3 | 4 | 4 | 2 | **20** |
| Direct mail to top 50 accounts | 1 | 1 | 2 | 4 | 2 | 4 | 1 | **15** |
| Engineering-as-marketing (free tool) | 5 | 5 | 3 | 2 | 5 | 4 | 5 | **29** |

**Read-out:**

- Primary (compound): bottom-funnel SEO + engineering-as-marketing.
- Primary (harvest): paid search competitor terms.
- Supporting: founder X/Twitter + Show HN.
- Skip: LinkedIn Ads (economics fail at $50/seat), direct mail (product fit fail), TikTok organic (skill + product fit).

This is a much sharper recommendation than "use SEO, paid search, content, social media, and email."

## Score discipline

- Score every candidate channel before recommending. Don't skip and "intuit."
- Show the scores in the channel-strategy doc. The reader should see the math.
- A channel score can change as conditions change (founder hires a content lead → Skill rises). Re-score quarterly.
- A score of 1 is allowed and important — it documents why the channel was excluded.

## Adjustments by business model

The scoring matrix is constant; the channel candidate set varies. See `business-model-channel-fit.md` for the primary/supporting/skip starting set per business model — that's the candidate list to score, not the answer.

## When a channel scores 25+ but is rejected

Sometimes a high-scoring channel is rejected for non-quantitative reasons:

- Founder refuses (will not execute consistently). E.g., introverted agency owner refusing LinkedIn — the next-best channel will underperform massively, but forcing the founder doesn't work either.
- Brand-safety conflict.
- Regulatory restriction in the user's jurisdiction.
- Concentration risk (already at 50%+ of revenue on one channel).

When rejected despite a 25+ score, log the rationale explicitly in the decision card.

## When a channel scores <18 but is selected

Sometimes a low-scoring channel is selected because:

- Asymmetric opportunity (founder has unique audience, viral mechanic, partnership).
- Counter-positioning (the channel competitors ignore).
- Wildcard slot in the 3-leg portfolio (90-day test budget).

When selected despite a <18 score, treat it as a wildcard, cap test budget, and define crisp kill criteria.
