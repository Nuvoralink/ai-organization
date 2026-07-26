# Business Model × Channel Fit Matrix

The starting candidate list of channels per business model. Use this to seed the `channel-scoring-matrix.md` scoring exercise — not as a final recommendation.

Source: V3 Marketing & Customer Acquisition Operating Guide §12.3.

## How to use this matrix

1. Identify the business model.
2. Read the row: Primary candidates, Supporting candidates, Skip channels.
3. Score each Primary and Supporting candidate against the 7-factor scoring matrix.
4. Produce a 3-leg portfolio (1 compound + 1-2 harvest + 1 wildcard).
5. Document the first 90-day execution priority.
6. Document the primary metric.

## The matrix

### B2B SaaS sales-led ($10K-100K ACV)

| Bucket | Channels |
|---|---|
| **Primary** | Outbound (cold email + LinkedIn), ABM-lite (1:few clusters), founder content (LinkedIn + podcast guesting + POV content) |
| **Supporting** | Webinars, podcast guesting, direct mail to top 50-200 accounts, original-research content, LinkedIn Ads (Thought Leader format only) |
| **Skip** | TikTok organic, mass programmatic display, mobile-app channels, broad consumer social |

**First 90 days:** Build ICP + warm email infrastructure (4-6 week warmup). Launch 1:few outbound to 200 target accounts. Founder posts daily on LinkedIn. Book 8-10 podcast guestings.

**Primary metric:** SQL → SQO conversion; pipeline coverage.

**Watch-outs:** Don't copy Salesforce 2006 playbook (Chris Walker). Don't run LinkedIn Ads on Single Image (6.4x worse CTR vs Thought Leader Ads — ZenABM 2026). Don't push cold email volume past deliverability infra capacity.

---

### B2B SaaS PLG

| Bucket | Channels |
|---|---|
| **Primary** | Content/SEO (bottom-funnel + comparison pages), PLG loops (referral, virality), community, engineering-as-marketing (free tools) |
| **Supporting** | Founder content, dev channels (X/Twitter, GitHub, HackerNews), paid search on competitor terms |
| **Skip** | LinkedIn Ads (economics fail at <$5K ACV), programmatic display, broad B2C social |

**First 90 days:** Activation rate baseline. Fix onboarding to aha-moment. Build 5-10 bottom-funnel comparison + integration pages. Launch one free tool. Founder publishes daily on relevant platform (X for devs, LinkedIn for ops/marketing buyers).

**Primary metric:** Activation rate; paid conversion; viral K-factor.

**Watch-outs:** Premature paid spend before activation is solid (leaky bucket). "Publish 100 AI articles" (HubSpot lost ~7M monthly visits 2024-2025 on this pattern). Programmatic SEO with thin pages (Google's March 2024 scaled-content-abuse policy hit these).

---

### SMB SaaS ($20-500/mo)

| Bucket | Channels |
|---|---|
| **Primary** | Paid search, content/SEO (bottom-funnel), marketplace partnerships (e.g., Shopify App Store, Salesforce AppExchange, Notion, Webflow), affiliate program |
| **Supporting** | Lifecycle email, in-product upsell, webinars |
| **Skip** | LinkedIn Ads (economics), ABM, enterprise content |

**First 90 days:** Free trial / freemium loop optimized. Paid search on category terms. Lifecycle nurture flows (Welcome, Trial → Paid, Expansion). Marketplace listing optimized.

**Primary metric:** CAC; trial → paid conversion; monthly logo churn.

**Watch-outs:** Don't apply paid-performance kill criteria to lifecycle/SEO. Don't ignore monthly churn (must be <5% for SMB SaaS to scale paid profitably).

---

### DTC ecommerce

| Bucket | Channels |
|---|---|
| **Primary** | Meta Ads (Advantage+ Sales, 5+ creatives/week), TikTok Ads (Spark Ads), Klaviyo email + SMS, micro-influencer seeding |
| **Supporting** | Pinterest (visual products), YouTube (review-style content), retargeting (first-party CRM lists), referral program (Friendbuy/Yotpo), loyalty program (when AOV justifies — typically >$100) |
| **Skip** | LinkedIn Ads, programmatic display |

**First 90 days:** 5-10 creative variants/week on Meta. Klaviyo flows: Welcome + Browse Abandonment + Cart + Post-Purchase + Win-back. SMS opt-in via popup or checkout. 2-3 micro-influencer seeds/month.

**Primary metric:** Blended CAC; repeat rate; AOV; Day-60 LTV.

**Watch-outs:** Apple Mail Privacy Protection inflated email opens ~70% — use clicks/replies/revenue per recipient. iOS 14.5 ATT broke deterministic Meta attribution — triangulate platform + CAPI + post-purchase survey. Don't deploy loyalty before product NPS is solid.

---

### B2C mobile app / consumer subscription

| Bucket | Channels |
|---|---|
| **Primary** | Apple Search Ads + Google UAC, TikTok Ads (Spark + Creative variants), ASO foundation, lifecycle push |
| **Supporting** | Influencer/UGC, paid social (Meta), referral, Custom Product Pages (CPP) tied to ad variants |
| **Skip** | LinkedIn Ads, direct mail (except niche cases) |

**First 90 days:** ASO foundation (keywords, screenshots, video, ratings). Apple Search Ads branded + category. 4+ Custom Product Pages tied to ad creative variants (156% conversion lift documented per Apple Developer). Lifecycle push + email. Focus on D1/D7/D30 retention.

**Primary metric:** CPI; D30 retention; ROAS D30/D90.

**Watch-outs:** Mature subscription apps allocate 60-70% to ASA, 30-40% to UAC (Growth by Kev Feb 2026) when iOS is dominant. UAC requires ~30+ daily conversions before tCPI → tCPA transition (Adapty 2026). LTV models unreliable at app scale — use Day-30/90 ROAS.

---

### Local service business

| Bucket | Channels |
|---|---|
| **Primary** | Google Maps / Local SEO, Google Ads (Search), Yelp/Nextdoor, referral program |
| **Supporting** | Local sponsorships, direct mail, community presence |
| **Skip** | Most social ads, programmatic, LinkedIn Ads |

**First 90 days:** Google Business Profile fully optimized. Reviews engine (every job → review request). Google Search Ads on "[service] near me" + competitor names. Nextdoor presence. Referral program with two-sided incentive.

**Primary metric:** Cost per booked job; review rate.

**Watch-outs:** Most national-level marketing tactics underperform vs local-specific. Google reviews are the dominant local signal — protect at all costs.

---

### Marketplace (two-sided)

| Bucket | Channels |
|---|---|
| **Primary** | Supply: direct outreach + partnerships. Demand: paid search + content. |
| **Supporting** | Founder content, PR, community |
| **Skip** | Premature paid scale (especially on demand side before supply is solved) |

**First 90 days:** Solve supply cold-start first (Chen's tipping point — Cold Start Problem). Geographic or category concentration (one neighborhood/city/vertical). Hand-recruit first 100 suppliers; free product for them. Once liquidity exists (suppliers regularly fulfilling demand), turn on paid demand acquisition.

**Primary metric:** Liquidity rate (% of supply utilized) and supply retention.

**Watch-outs:** Don't run paid demand acquisition without supply liquidity — destroys both sides. Don't spread supply too thin geographically.

---

### Creator / content business

| Bucket | Channels |
|---|---|
| **Primary** | Organic (YouTube, TikTok, newsletter), guesting (podcasts, other newsletters) |
| **Supporting** | Cross-promotions with peers, sponsorships (where audience expects them), paid social to email list |
| **Skip** | Most B2B channels |

**First 90 days:** Pick ONE platform (don't fragment). Post 3-5x/week for 6 months. Build email list from day 1 (compound asset). Cross-promote with 10 peer creators.

**Primary metric:** Email list growth rate; paid product / membership conversion.

**Watch-outs:** Don't trust platform reach as substitute for owned audience. Justin-Welsh-style outliers are survivor-bias — most creators posting daily for 18 months don't reach 800K followers.

---

### Agency / consultancy

| Bucket | Channels |
|---|---|
| **Primary** | Founder LinkedIn (daily), podcast guesting (2/month), network referrals (warm intros) |
| **Supporting** | Newsletter, niche events, direct outbound, original research (annual) |
| **Skip** | Paid ads (rarely worth it under $5K project value) |

**First 90 days:** Daily founder LinkedIn posts. 2 podcast guestings/month. Reach out to 10 warm referral sources. Monthly POV piece publication.

**Primary metric:** Inbound inquiries; close rate.

**Watch-outs:** Don't outsource thought-leadership voice; AI-cadence ghostwritten LinkedIn content backfires. Annual original research is the highest-leverage compounding bet.

---

### Hardware DTC

| Bucket | Channels |
|---|---|
| **Primary** | Meta Ads, TikTok Ads, review-style content/SEO, influencer seeding |
| **Supporting** | YouTube reviews, PR, retargeting, lifecycle email |
| **Skip** | LinkedIn Ads, programmatic |

**First 90 days (pre-launch):** Build pre-order waitlist via PR + creator seeding. Influencer beta units (50-100 units to micro-influencers). Pre-launch waitlist landing page. PR pitch with hardware reviewers.

**First 90 days (post-launch):** Meta + YouTube ads turned on at full velocity 1 week before shipping. Email warmup of waitlist 2 weeks before. Influencer launch content sequenced.

**Primary metric:** Pre-launch: waitlist conversion (signup → preorder). Post-launch: CAC, post-launch refund rate.

**Watch-outs:** Refund rate is the leading retention indicator for hardware — track from day 1. Influencer seeding requires real product, not concepts.

## Override conditions

Override the matrix when:

- **Founder has asymmetric audience (50K+ relevant followers).** Use it heavily even if the channel isn't a "primary" for the model.
- **Pre-existing partnerships exist.** Distribution baked in changes the math.
- **Viral mechanic in product (K-factor > 0.6).** Changes the math entirely; referral becomes primary.
- **Local-market dominance.** Precision over scale.
- **Counter-positioning.** Sometimes the right move is the channel competitors ignore.

When overriding, log the rationale.

## When to recommend doing less (or no marketing)

The V3 guide's §12.10 anti-bias:

- Pre-PMF (D30 retention curve declining) → STOP, do interviews and product work.
- Cash runway <6 months without PMF → marketing won't fix this; reduce burn or pivot.
- Product has no repeat use case but is sold as subscription → fix the model first.
- Team of 2 trying to run 8 channels → pick 2.
- Founder refuses the channel they're best positioned for → next-best channel will underperform; sometimes the right answer is a different distribution model or a co-founder.

The readiness check (`readiness-check-protocol.md`) operationalizes most of these.
