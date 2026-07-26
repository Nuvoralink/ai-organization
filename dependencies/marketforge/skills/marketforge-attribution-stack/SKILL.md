---
name: marketforge-attribution-stack
description: Build multi-source triangulation attribution. Platform-reported + CAPI + self-report survey + incrementality. Never single-number truth. Includes self-report survey design. Use as Phase 9 step 4.
---

# MarketForge Attribution Stack

Apply V3 §8.1-8.7 + `attribution-protocol.md`.

## Global quality rules

- No single-source attribution claim.
- Triangulate: platform-reported + CAPI + self-report survey + (when budget supports) incrementality.
- Treat platform-reported as directional only.
- Dark social (podcast, community, DM-driven, founder-content-driven) invisible to platforms — self-report captures.
- Report channel performance as ranges, not single numbers.

## Purpose

1. Design the triangulation stack for this user's stage + spend level.
2. Self-report survey design.
3. Platform attribution setup (CAPI, conversion APIs, server-side events).
4. Incrementality testing protocol (when justified).
5. Attribution dashboard structure.

## Inputs
- `marketing-brief.md` (spend level), `channel-strategy.md`, `analytics-stack.md`.

## Outputs
- `docs/marketing-plan/09-cro-measurement/attribution-stack.md`
- DEC-640 to DEC-649

## Structure

```markdown
# Attribution Stack

## Stack design per spend level

[Per `attribution-protocol.md` matrix.]

### <$2K/mo paid
- Platform-reported + CAPI + self-report survey.

### $2-10K/mo paid
- Above + occasional geo holdout.

### $10K+/mo paid
- Above + recurring geo holdouts + occasional MMM (Meta Robyn / Google Meridian when justified).

## Self-report survey design

### Question
"How did you hear about us?" (free-text required, NOT picklist)

### Placement
- Signup (B2B).
- First checkout (DTC).
- First-paid month after trial (SaaS).
- First booked job (local service).

### Frequency
- 100% of conversions.
- If huge volume, sample 10-25%.

### Analysis
- AI-categorize free-text into channels.
- Weight against platform-reported.
- Look for divergence (dark social).
- Track recency bias.

### Reporting
[Monthly attribution dashboard with platform-reported vs self-report vs (when applicable) incrementality lift.]

## Platform attribution setup

### Meta (CAPI)
- Server-side event tracking.
- Match keys: hashed email, phone, IP, user agent.
- Test mode → production.
- Match quality target: >70% per Meta's metric.

### Google (Enhanced Conversions)
- Server-side or first-party data enhancement.
- Match quality target: >50%.

### TikTok (Events API)
- Server-side tracking.

### LinkedIn (Insight Tag + Conversion Tracking)

### ASA / Adjust / AppsFlyer (mobile)

## Incrementality testing protocol

### Geo holdout
- Identify 2-3 representative DMAs / regions.
- Turn off channel in holdout DMAs for 4-6 weeks.
- Measure delta in revenue / conversions.
- Calculate lift (incremental revenue / control revenue).

### Conversion lift studies
- Meta + Google built-in tools.
- Audience randomized to ad vs no-ad.
- Lift = ad-group revenue - control revenue.

### Time-series analysis
- Channel paused → channel resumed.
- Compare period-over-period.

## Attribution dashboard

Monthly view:

| Channel | Platform-reported $ | CAPI-adjusted | Self-report $ | Geo holdout lift (if tested) | Triangulated estimate |
|---|---|---|---|---|---|
| Meta Ads | | | | | |
| Google Search | | | | | |
| Cold email | | | | | |
| Podcast | | | | | |
| Organic / direct | | | | | |

Total triangulated vs actual revenue → identify hangback.

## 20-40% hangback rule (DTC)
- In DTC at meaningful scale (>$50K/mo paid), Meta-reported routinely overstates 20-40%.
- Always compare to total revenue minus baseline.

## Decision cards
[DEC-640 to DEC-649]

## What we are intentionally NOT doing
- Reporting single-source attribution as truth.
- Trusting Google-reported ROAS at face value.
- Treating platform-reported = 0 as channel = 0 (dark social hidden).
- Skipping self-report survey.

## Sources and basis
V3 §8.1-8.7, `attribution-protocol.md`.
```

## When to delegate
- `marketing-skills:analytics` for analytics setup.

## Sources and basis
V3 §8.1-8.7.
