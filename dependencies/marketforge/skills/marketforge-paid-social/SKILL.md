---
name: marketforge-paid-social
description: Build paid social strategy for Meta, TikTok, LinkedIn, Reddit, Pinterest, X — per business model. Format hierarchy (9:16 vertical priority). Creative rotation. CPM-r fatigue signals. LinkedIn TLA discipline. Use as Phase 5 step 2.
---

# MarketForge Paid Social

Apply V3 §4.2-4.7 (Meta, TikTok, LinkedIn, Reddit, X, Pinterest, Programmatic).

## Global quality rules

- 5-10 creative concepts per ad set, refresh 2-4x/month.
- 9:16 vertical priority across Meta Reels / TikTok / IG Reels / YouTube Shorts.
- CPM-r (CPM-reach) is the primary fatigue signal.
- Meta Andromeda (2025): creative diversity matters; "creative is the new targeting" is half-true (also Meta-promoted framing).
- LinkedIn Thought Leader Ads CTR is 2.68% vs 0.42% for Single Image — 6.4x — at $2.29 CPC vs $13.23 (ZenABM 2026). Default to TLA when LinkedIn is in mix.
- AI-disclosure required on AI-generated ad content (Meta, March 2026).
- iOS 14+ attribution: triangulate platform + CAPI + post-purchase survey.

## Purpose

Per platform (subset of Meta / TikTok / LinkedIn / Reddit / Pinterest / X depending on business model):
1. Campaign structure.
2. Audience targeting.
3. Creative concept count + format hierarchy.
4. Budget + bid strategy.
5. Kill criteria + iteration cadence.

## Inputs
- `channel-strategy.md`, `portfolio-construction.md`, `budget-allocation.md`, `messaging-architecture.md`, `awareness-stages.md`, `landing-pages.md`, `icp-and-personas/`.

## Outputs
- `docs/marketing-plan/05-paid/paid-social.md`
- DEC-270 to DEC-299 (paid-social decisions — overlaps with seo-strategy range; adjust to DEC-300+ if collision)

Note: This range collides with content-strategy DEC-300-329 and content-calendar DEC-330-339. Use DEC-280-289 for paid social.

## Per-platform plan

### Meta Ads (Advantage+ default for new accounts)

**Campaign types:**
- Advantage+ Sales (DTC default)
- Advantage+ Leads (B2B lead gen)
- Advantage+ App (mobile install)
- Standard campaigns (when finer control needed)

**Operating rules:**
- 5-10 distinct creative concepts per ad set.
- Refresh 2-4x/month.
- 9:16 vertical priority.
- Broad targeting beats interest-stacks for accounts with conversion history; interest helps new accounts bootstrap.
- CPM-r is fatigue signal.
- CAPI (server-side) required for iOS attribution.

**Benchmarks (eMarketer 2025):**
- Meta avg CPM ~$6.59.
- Instagram CPM $9.46 (Q2 2025).
- SaaS Facebook CPMs run 20-40% above average.

### TikTok Ads

- Spark Ads (promoting organic creator content) = workhorse.
- Direct conversion for: DTC <$80 AOV, mobile apps (gaming, finance, dating), creators.
- CPM ~$6-8 (lower than Meta).
- Sub-30s hooks; UGC; talking-head on a couch.

### LinkedIn Ads (TLA-first discipline)

- **Thought Leader Ads (TLA):** sponsored content from individual employee posts. 6.4x CTR vs Single Image; 77% cheaper per LP click. DEFAULT format.
- Single Image Ads: only when TLA infeasible; expect 0.42% CTR and $13.23 CPC.
- Audience: by job title / company / function / seniority.
- CPC $5.58 global avg; CPMs $40-100+ in tech B2B.
- Math: worth it when ACV × close-rate × marketing-influence-share > ~$200 per click. So $25K+ ACV B2B with mid-double-digit close rates.

### Reddit Ads

- Under-priced for tech / dev tools / finance / gaming / niche B2C.
- CPCs $0.50-3 in many subreddits.
- Best when ads look native (no marketing-speak).

### Pinterest Ads
- Visual products: home, wedding, fashion, food, beauty, DIY.
- Female 60-70%, US-heavy.
- CPM $6-8.
- Long conversion windows (2-3 months common).

### X/Twitter Ads
- Volatile post-2022 ownership changes.
- Works for: SaaS targeting devs/marketers, B2B events.
- Underused: keyword-conversation targeting on competitor mentions.

## Per-platform creative format hierarchy

| Platform | Priority 1 | Priority 2 | Priority 3 |
|---|---|---|---|
| Meta (cold) | 9:16 video (Reels) | 1:1 carousel | 1:1 image |
| Meta (retargeting) | 1:1 image | 9:16 video | 4:5 carousel |
| TikTok | 9:16 talking-head UGC | 9:16 screen-recording | 9:16 product-in-action |
| LinkedIn | TLA from founder/employee | TLA from customer (with permission) | Video TLA |
| Reddit | Native-style image + headline | Native-style video | Conversational comment-style |
| Pinterest | 1000×1500 vertical pin | Video pin | Idea pin (multi-slide) |
| X | Inline thread + native video | Quote-card image | Conversational reply ad |

## Audience targeting (per platform)

### Meta
- Cold (new accounts): broad + interest pyramid.
- Conversion-history (>30 conversions): Advantage+ broad.
- Retargeting: site visitors + email list custom audiences via CAPI.
- Lookalike: source from highest-LTV cohort, 1-3% similarity.

### TikTok
- Interest stacks (TikTok categorizes by content engagement).
- Spark Ads from creator handles (audience inherited).
- Custom audiences from CRM + retargeting.

### LinkedIn
- Job title + company size + seniority + skills.
- Account list targeting (ABM-lite).
- TLA audience reuse from individual's network + LinkedIn-modeled lookalike.

### Reddit
- Subreddit-specific (best signal).
- Keyword-conversation targeting.
- Interest targeting (less granular).

## AI-disclosure compliance (Meta, March 2026)
- Mark AI-generated content per Meta's AI-disclosure feature.
- Do not generate AI faces of named real people.
- Do not generate AI-faked customer testimonials.

## Attribution discipline
- Platform-reported = directional only.
- CAPI improves accuracy 10-30%.
- Self-report survey weighting captures dark social.
- Quarterly geo holdouts when budget supports ($5K+/mo per channel).

## Budget allocation (within paid-social budget)

[Per business model. Example for DTC:]
| Platform | % | Rationale |
|---|---|---|
| Meta | 50-70% | Largest reach, most mature DTC platform |
| TikTok | 15-25% | Lower CPM, younger demos |
| Pinterest | 5-15% | Visual product category |
| Reddit | 0-10% | Wildcard for niche audiences |

## Kill criteria
See `kill-criteria-by-channel.md` per platform.

## Decision cards
[DEC-280 to DEC-289 — paid social per-platform decisions]

## What we are intentionally NOT doing
- Running LinkedIn Single Image as default (6.4x worse).
- Targeting protected categories (housing, employment, credit) without SCA / consent.
- Generating AI faces of real customers / executives.
- Buying inflated platform-reported ROAS as truth.
- Skipping CAPI on iOS-heavy customer bases.

## Sources and basis
V3 §4.2 (Meta), §4.3 (TikTok), §4.4 (LinkedIn), §4.5 (Reddit), §4.6 (X), §4.7 (Pinterest).
ZenABM 2026 LinkedIn Ads Benchmarks (161,256 ads, 211 companies) — evidence B.
eMarketer 2025 US Social Ad CPMs — evidence B.
```

## Sources and basis
V3 §4.2-4.7.
