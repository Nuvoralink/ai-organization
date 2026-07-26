---
name: marketforge-influencer-program
description: Build influencer program — micro vs macro, vetting (engagement-rate floor 1.5%, fake-follower verification), FTC disclosure, unique codes/UTMs for attribution. Use as Phase 5 step 5.
---

# MarketForge Influencer Program

Apply V3 §4.11 (Influencer marketing). 

## Global quality rules

- 15-30% of mid-tier influencer follower bases are inactive/bot. Verify with engagement-to-follower ratio (>1.5% real engagement is the floor) using Modash or HypeAuditor.
- Micro (10K-100K) typically delivers 2-5x better CAC per follower; harder to scale.
- FTC disclosure required: #ad, paid partnership tags.
- Attribution: unique discount codes + UTMs + dedicated LP per cohort.

## Purpose

1. Tier selection (micro / mid / macro) per budget + business model.
2. Vetting protocol.
3. Brief template + content guidelines.
4. Attribution per partnership.
5. FTC + platform compliance.

## Inputs
- `channel-strategy.md`, `budget-allocation.md`, `icp-and-personas/`, `messaging-architecture.md`, `brand-strategy.md`.

## Outputs
- `docs/marketing-plan/05-paid/influencer-program.md`
- DEC-330 to DEC-339

## Structure

```markdown
# Influencer Program

## Tier strategy

| Tier | Followers | When justified | Typical CAC | Scale |
|---|---|---|---|---|
| Nano | <10K | Niche communities; low budget | Low $ but high effort | Low |
| Micro | 10K-100K | Most SMB / DTC programs | Best ratio | Moderate (5-20 partners) |
| Mid | 100K-500K | When micro saturated | Higher absolute, lower ratio | Low (3-8 partners) |
| Macro | 500K-1M | Reach-driven brand campaigns; T3+ | High absolute | Very low (1-3) |
| Mega | >1M | Brand-marquee partnerships; T4+ | Premium | One per campaign |

## Vetting protocol

For each candidate creator:
- **Engagement-to-follower ratio:** ≥1.5% real (likes + comments) / followers. <1.5% = inactive/bot suspicion.
- **Audience demo match:** Modash / HypeAuditor authentic-audience scan; ICP overlap %.
- **Brand-safety check:** recent posts, controversies, conflicting endorsements.
- **Content-quality match:** does their style match our brand voice?
- **Previous brand partnerships:** evidence of legitimate completed deals.
- **Verification tools:** Modash, HypeAuditor, CreatorIQ.

## Brief template

For each partnership:
- Product samples / access provided
- Talking points (NOT required scripts — creator's voice)
- Specific CTAs to include
- Unique discount code: [CREATOR-NAME10]
- UTM URL: utm_source=influencer&utm_medium=instagram&utm_campaign=[creator-handle]
- FTC disclosure required: #ad / "Paid partnership" / "Sponsored"
- Content review process: [pre-publish review yes/no]
- Usage rights: organic + paid Spark Ads usage on Meta/TikTok
- Posting cadence: [N posts over X weeks]
- Compensation: [flat fee + commission per code use]

## Compensation models

| Model | When |
|---|---|
| Free product / gifting | Nano + early micro; lowest commitment |
| Flat fee | Most partnerships; predictable cost |
| Flat fee + affiliate commission | Performance-aligned; common at scale |
| Pure affiliate (rev share) | High-volume creators; lower-risk for brand |
| Equity (rare) | Mega-tier, multi-year deals |

## Attribution stack

- Unique discount code per creator (DTC).
- UTM per creator-platform combination.
- Dedicated LP per creator (when partnership is significant).
- Post-purchase survey: "Which creator brought you here?" question.
- Spark Ads usage rights: track paid amplification of organic creator content.

## Spark Ads strategy (TikTok)

- Get usage rights upfront for organic creator content.
- Amplify top-performing organic creator posts as paid Spark Ads.
- Spark Ads typically outperform brand-generated TikTok Ads.
- Pay per spike: amplify content that hit organic 5x+ baseline.

## FTC + platform compliance

- **FTC:** Clear #ad / "Paid partnership" disclosure. Even gifted product = endorsement.
- **Meta:** Paid Partnership tag (not just hashtag).
- **TikTok:** Branded Content tag.
- **YouTube:** Description + tag for paid promotion.

## Anti-patterns

- Buying followers / engagement for owned accounts.
- Pretending gifted content is organic without disclosure.
- Working with creators whose audience is bot-inflated.
- Generic "use code BRAND10" without creator authenticity.
- One-off macro partnerships without dedicated LP / attribution.

## Decision cards
[DEC-330 to DEC-339]

## Kill criteria
- Specific creator: 90 days; cost-per-attributable-sale > 2x blended CAC sustained → drop.
- Tier strategy: 6 months; tier not producing target CAC → re-allocate.

## What we are intentionally NOT doing
- Buying followers.
- Skipping FTC disclosure.
- Working with bot-inflated creators (vetting required).
- Treating influencer as one-touch (most influencer-driven sales require multi-touch nurture).

## Sources and basis
V3 §4.11 (Influencer marketing).
Modash + HypeAuditor industry data — evidence C/B with vendor caveat.
```

## When to delegate
- `marketing-skills:ad-creative` for ad-creative briefs.

## Sources and basis
V3 §4.11.
