---
name: marketforge-visual-direction
description: Build art direction brief for marketing visuals — subject, lighting, palette, lens, mood, anti-pattern. Reads VisualForge brand if present. Sources banana briefs. Use as Phase 10 step 1.
---

# MarketForge Visual Direction

Read `banana-bridge.md` and `visualforge-bridge.md`. This subskill produces THE BRIEF; banana produces the image.

## Global quality rules

- The brief matters more than the image. A great brief + mediocre generator > generic prompt + great generator.
- Specific + visceral: describe what the camera sees, not what the ad means.
- AI-saturation defense: real-photo cues, no smooth-AI-faces, founder/customer real photography for human subjects.
- VisualForge token consistency when VF present.

## Purpose

Produce art direction briefs that downstream subskills (ad creative, social imagery, website imagery) consume.

## Inputs
- `brand-strategy.md`, `distinctive-assets.md`, `messaging-architecture.md`, `competitive-intel.md`.
- VisualForge `docs/design-system/02-visual-language/` if present.

## Outputs
- `docs/marketing-plan/10-visual-assets/visual-direction.md`
- DEC-700 to DEC-709

## Structure

```markdown
# Visual Direction

## Brand visual anchor

### From VisualForge (if present)
- Primary color token: [from VF DEC-NNN]
- Type system: [from VF]
- Mood / philosophy: [from VF brand-identity.md]

### Or built here (if no VF)
- Primary color (hex + OKLCH): [value]
- Accent color: [value]
- Neutrals: [palette]
- Type family: [name]
- Mood: [3-5 attributes]

## Photography direction

### Subjects (when human)
- Real founders / customers / employees (with permission).
- Avoid AI-generated faces.
- Demographic representation matches target ICP.

### Composition
- [Rule of thirds / centered / asymmetric — per brand]
- Negative space discipline.
- Foreground focus, background context.

### Lighting
- Natural light preferred over studio for most categories.
- Direction (left / right / overhead / soft fill).
- Color temperature (warm / cool / neutral).

### Lens / framing
- 50mm portrait (people).
- 24-35mm context shots.
- 100mm macro for detail.
- Avoid: ultra-wide that distorts (unless intentional creative).

## Illustration direction (if applicable)

### Style
- [Specific: geometric flat / organic textured / line illustration / generative / collage / mixed-media]
- Reference brands: [list 3-5]

### Color usage
- [Palette adherence rules]

## Anti-pattern register

NOT acceptable:
- Stock-photo handshakes.
- Generic startup-laptop shots.
- AI-smooth-face portraits.
- Overly-polished testimonial cadence.
- Cool blue-grey palettes (when brand is warm).
- Generic illustration packs (Storyset, unDraw without customization).
- Three-word triplet typography compositions.

## Per-surface direction summary

### Ad creative
[Specific direction for paid ads]

### Social organic
[Specific direction per platform]

### Website
[Specific direction]

### Email
[Specific direction — usually simpler / less art direction]

### Video / motion
[Specific direction — pace, cut style, music]

## Decision cards
[DEC-700 to DEC-709]

## What we are intentionally NOT doing
- AI-generated human faces as customers / executives.
- Stock-photo cliches.
- Mixed brand palettes (DBA drift).
- Generic startup imagery.

## Sources and basis
V3 §10.6 (DBAs).
VisualForge tokens (if present).
```

## When to delegate
- `marketing-skills:image` for asset planning.
- `banana-claude:banana` for actual generation.

## Sources and basis
V3 §10.6.
