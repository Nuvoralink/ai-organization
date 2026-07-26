---
name: marketforge-social-imagery
description: Produce platform-sized social imagery via banana. LinkedIn 1200×627 / 1200×1200, X 1600×900, IG 1080×1080 / 1080×1920, TikTok 1080×1920, FB 1200×630, Pinterest 1000×1500. Use as Phase 10 step 3.
---

# MarketForge Social Imagery

Read `banana-bridge.md` and `visual-direction.md`.

## Global quality rules

- Platform-specific dimensions (avoid one-size-fits-all crops).
- Founder/customer real photography for human subjects.
- Quote cards from podcast / interview clips work well.
- VisualForge token consistency.

## Purpose

1. Per-post brief for organic social.
2. Brand-asset library (logos, OG cards, founder portraits).
3. Quote-card templates for repurposing.

## Inputs
- `linkedin-organic.md` / `x-twitter-organic.md` / `tiktok-organic.md` / `youtube-strategy.md` (the channel cadence + topic mix).
- `content-calendar.md` (specific posts).
- `visual-direction.md`.

## Outputs
- `docs/marketing-plan/10-visual-assets/social-imagery/[platform]/[post-id].png`
- DEC-720 to DEC-724

## Dimensions reference

| Platform | Size | Use |
|---|---|---|
| LinkedIn link share | 1200×627 | Posts with link |
| LinkedIn square | 1200×1200 | Native content |
| LinkedIn carousel | 1080×1080 per slide | Multi-slide content |
| X link share | 1600×900 | Posts with link |
| X in-feed | 1200×675 | Native image |
| IG feed | 1080×1080 | Standard post |
| IG Story / Reel | 1080×1920 | Story / Reel |
| TikTok post | 1080×1920 | Video post |
| Pinterest pin | 1000×1500 | Standard pin |
| FB link share | 1200×630 | Posts with link |
| YouTube thumbnail | 1280×720 | Video thumbnail |

## Process

For each social post in the content calendar:
1. Read the content + voice + brand.
2. Build banana brief (subject + composition + dimensions for platform).
3. Generate.
4. Save to path.
5. Route to approval queue (agentic mode).

## Quote-card templates

For podcast snippets / customer quotes / founder posts:
- Background: brand color or texture.
- Type: brand wordmark + body type.
- Layout: large quote + small attribution.
- Dimensions: 1080×1080 (multi-platform).

## Decision cards
[DEC-720 to DEC-724]

## What we are intentionally NOT doing
- Generic stock imagery.
- Wrong dimensions for platform.
- AI-faces of real people.

## Sources and basis
V3 §3.4-3.7 (organic social channels). `banana-bridge.md`.
