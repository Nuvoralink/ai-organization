# Banana-Claude Bridge

All image generation in MarketForge delegates to the `banana-claude:banana` skill. MarketForge produces the **brief**; banana produces the **image**.

## The split

| MarketForge produces | Banana produces |
|---|---|
| Visual direction (mood, palette, lighting, lens, subject, anti-pattern) | The image |
| Asset specifications (dimensions, format, file naming) | |
| Brand-aligned prompt (reads VisualForge brand identity if present) | |
| Variant strategy (how many variants, what dimensions of variance) | |
| Approval queue placement (image goes to human approval before publishing) | |
| Cost tracking integration (banana logs costs; MarketForge sums them per campaign) | |

## Asset categories MarketForge requests from banana

### Ad creative (paid social)

- 9:16 vertical (priority — TikTok, Meta Reels, IG Reels, YouTube Shorts).
- 1:1 (Meta feed, IG feed).
- 4:5 (Meta feed alt).
- 16:9 (Meta Stories alt, YouTube ads).

MarketForge subskill `marketforge-ad-creative-production` produces the brief per concept × format × variant.

### Social organic imagery

- LinkedIn: 1200×627 (link share), 1200×1200 (square), carousel slides 1080×1080.
- X/Twitter: 1600×900 (link share), 1200×675 (in-feed).
- Instagram: 1080×1080 (feed), 1080×1920 (Story / Reel).
- TikTok: 1080×1920 (post).
- Pinterest: 1000×1500 (pin).
- Facebook: 1200×630 (link share).

MarketForge subskill `marketforge-social-imagery` produces the brief per post.

### Website imagery

- Hero (typically 1920×1080 or 2560×1440 depending on layout).
- OG card (1200×630).
- Twitter card (1200×675).
- Feature illustrations (variable, per design system).
- Product shots (variable; product-mode + lifestyle-mode).
- Customer photos (rarely AI-generated; prefer real customer photography).
- Founder photos (rarely AI-generated; prefer real founder photography).

MarketForge subskill `marketforge-website-imagery` produces the brief per asset.

### Email imagery

- Header banners (typically 600×200).
- Product imagery in emails (variable).
- Lifestyle imagery in emails (variable).

MarketForge subskill `marketforge-email-lifecycle` requests these as part of the flow.

### Blog / content imagery

- Article hero (1200×630 minimum).
- In-article images (variable).
- Quote cards for social repurposing (1080×1080).

MarketForge subskill `marketforge-content-strategy` requests these.

### Brand imagery library

- Brand color swatches, gradient samples, texture references.
- Style guide visual examples.

MarketForge subskill `marketforge-distinctive-assets` requests these.

## How MarketForge constructs a brief for banana

Every visual brief includes:

1. **Subject** — what the camera sees, not what the ad means.
2. **Composition** — framing, rule of thirds, focal point.
3. **Lighting** — direction, quality, color temperature.
4. **Lens** — focal length suggestion (50mm portrait, 24mm wide, 100mm macro).
5. **Mood** — palette, atmosphere, time of day.
6. **Brand alignment** — colors, type-mockup, distinctive assets from VisualForge or `marketforge-distinctive-assets`.
7. **Format and dimension** — explicit pixel size + aspect ratio.
8. **Anti-pattern** — what to avoid (e.g., "no stock-photo-handshake", "no AI smooth-face", "no generic-startup-laptop").
9. **Variant strategy** — if requesting multiple variants, what dimensions of variance to explore.

## Example brief (passed to banana)

```
Mode: Editorial / Product hybrid
Subject: Hands holding a worn leather wallet, mid-shot from above, soft natural light from a window-left angle. Wallet shows organic patina suggesting daily use. One hand is gently opening the wallet's billfold. A subtle Apple Card-style metal card is half-visible, brand-neutral. Hands are racially ambiguous, no rings, no watches.
Composition: 1:1 square, wallet centered, ~70% of frame.
Lighting: Soft northern window light, cool-warm temperature mix, gentle highlight on leather surface, no harsh shadows.
Lens: 50mm equivalent, slight depth-of-field falloff, sharp on wallet surface.
Mood: Editorial-still, calm, premium, not luxury-aggressive. Should read "I treat my money with care."
Brand alignment: Use warm-neutral palette (DEC-104 distinctive color: #D4A574 / OKLCH warm-paper). Background should be subtle textured fabric or aged paper, NOT pure white.
Format: 1080×1080, square, 1:1, sRGB.
Anti-pattern: NO stock-photo-business-meeting feel. NO laptop in frame. NO obvious "money" symbols. NO AI smooth-skin. NO generic-finance-product feel.
Variants requested: 4 — vary the wallet style (1 minimalist black leather, 1 worn brown leather, 1 navy canvas, 1 vintage cordovan). Same lighting and composition.
```

## How MarketForge calls banana

When the brief is ready, MarketForge invokes:

```
<Skill skill="banana-claude:banana" args="generate [the brief above as input]" />
```

Banana applies its 5-component formula, selects domain mode (Editorial for the example above), selects the Gemini model and image size, calls the MCP, and returns the file path.

MarketForge then:
1. Logs the file path in the relevant decision card.
2. Routes the image to the approval queue (in agentic mode) or surfaces to user for review.
3. Saves the image to `docs/marketing-plan/10-visual-assets/[category]/[asset-id].png` (or whatever extension banana produced).

## When banana is unavailable

If banana is not installed:

1. MarketForge produces the brief as a written specification document.
2. The image asset path in the decision card is marked `STATUS: brief-only, external generation required`.
3. The execution calendar includes a TODO to generate externally (Midjourney, ChatGPT, Photoshop, designer).
4. The orchestrator notes the dependency in `skill-detection-report.md`.

## Approval discipline (agentic mode)

In agentic mode, generated images do not go live without approval:

- Ad creative variants → approval queue with thumbnail + brief.
- Social post imagery → approval queue.
- Email hero imagery → approval queue.
- Website hero / new pages → approval queue.

The approval surface is a simple table in `docs/marketing-plan/operations/approval-queue.md`:

| Date | Asset ID | Category | Brief excerpt | Thumbnail path | Approve/Reject |
|---|---|---|---|---|---|
| 2026-05-20 | ASSET-AD-042 | Paid social - Meta Reels 9:16 | "Hands using product in cafe, morning light..." | path/thumb-042.png | PENDING |

A human marks Approve / Reject before the asset can be added to any active campaign or post.

## Visual brand consistency

If `docs/design-system/` exists (VisualForge output), the visual brief MUST consume:

- Brand color tokens.
- Type system (when type appears in image).
- Distinctive brand assets (logo, mark, mascot if any).
- Photo/illustration philosophy (DEC-NNN in `02-visual-language/brand-identity.md`).

This produces visual consistency across MarketForge-generated marketing assets and the product UI.

## Cost tracking

Banana logs cost per generation. MarketForge sums these per:

- Campaign (CMP-NNN).
- Channel (paid-social, social-organic, etc.).
- Month.

The sum is included in the monthly operations journal and the channel budget review.

## What MarketForge does NOT do

- MarketForge does NOT directly call Gemini, OpenAI image, Midjourney, or any image API. All goes through banana (or external if banana absent).
- MarketForge does NOT modify generated images post-hoc (no compositing, no overlays). If overlays/composites are needed, the brief specifies a multi-pass approach or the asset is handed to a designer.
- MarketForge does NOT generate AI-generated faces of named real people (founders, customers, executives) — uses real photography for those.
- MarketForge does NOT generate images that imply false endorsement, fake testimonials, or deceptive social proof.

## What this looks like in practice

**User asks:** "Generate the hero image for our homepage."

**MarketForge sequence:**

1. `marketforge-website-imagery` reads positioning, ICP, voice, distinctive assets.
2. Constructs the brief (subject, composition, lighting, lens, mood, brand alignment, anti-pattern, dimensions).
3. Invokes `banana-claude:banana` with the brief.
4. Receives image file path.
5. Logs in DEC card.
6. Saves to `docs/marketing-plan/10-visual-assets/website-imagery/hero-homepage-v1.png`.
7. (Agentic mode) Routes to approval queue.

The brief is more important than the image. A great brief plus a mediocre generator beats a generic prompt plus a great generator.
