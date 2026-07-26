---
name: marketforge-distinctive-assets
description: Define and protect distinctive brand assets (color, mark, sonic, hashtag, mascot, signature pattern). Romaniuk/Sharp DBA discipline. Cross-references VisualForge if present. Use as Phase 3 step 4.
---

# MarketForge Distinctive Brand Assets

Read `visualforge-bridge.md`. If VisualForge `docs/design-system/02-visual-language/` exists, consume tokens + brand identity as authoritative; add marketing-specific DBA layer here.

## Global quality rules

- DBAs reduce CAC over time when consistent. Inconsistency destroys the asset.
- Don't redesign DBAs every 18 months. Romaniuk: DBA value is in *unchanging* recognition.
- A DBA is only an asset when it's distinctively used by you AND recognizable to ICP.

## Purpose

Define and document:
1. Primary distinctive color (e.g., Cloudflare orange, Linear purple, Stripe purple).
2. Mark / logo system.
3. Sonic signature (if applicable — most B2B SaaS skip; consumer apps + video brands invest).
4. Hashtag / verbal mnemonic.
5. Mascot or signature visual character (if any).
6. Signature pattern (e.g., Mailchimp's Freddie, Notion's pixel art, Linear's gradient style).
7. Voice as DBA — recognizable founder / brand voice.

## Inputs

- `brand-strategy.md`, `messaging-architecture.md`, `naming-and-tagline.md`.
- VisualForge `docs/design-system/02-visual-language/brand-identity.md`, `design-tokens.md`, `iconography.md` if present.
- `competitive-intel.md` (what DBAs do competitors own? to avoid).

## Outputs

- `docs/marketing-plan/03-brand/distinctive-assets.md`
- `docs/marketing-plan/03-brand/brand-imagery-library/` (mood references)
- DEC-140 to DEC-149

## Structure

```markdown
# Distinctive Brand Assets

## DBA inventory

### 1. Color
- Primary distinctive color: [name, hex, OKLCH, HSL]
- Why this color (vs competitors): [analysis]
- Usage rules: [where used; where NOT used]
- Cross-reference: VisualForge tokens / DEC-NNN if present.

### 2. Mark / logo
- Primary mark: [description + file path if asset exists]
- Wordmark: [description + file path]
- Submark / favicon: [description + file path]
- Usage rules: [size minimums, clear space, color treatments]

### 3. Sonic signature (if applicable)
- Brand sound (logo audio, on-hold music identity, ad sting): [description + file]
- Used for: [video ads, podcast hosting open/close, app onboarding]

### 4. Hashtag / verbal mnemonic
- Hashtag: #[name]
- Used for: [campaign, user-generated content amplification]

### 5. Mascot / character (if any)
- Name: [if any]
- Description: [+ file]

### 6. Signature pattern / illustration style
- Description: [the visual element that, when seen, signals it's us]
- Examples: [reference brands — Mailchimp's Freddie, Notion's pixel art]

### 7. Voice as DBA
- Identifiable voice patterns: [list — usually 3-5 specific things]
- Founder personal-brand voice: [if applicable; founder content is a DBA]

## Anti-DBA register
- DBAs we will NOT use because competitors own them:
  - [Color] — owned by [competitor]
  - [Pattern] — owned by [competitor]

## DBA enforcement
- Where DBAs MUST appear: [list — every ad, every email header, every social post, every doc cover]
- Where DBAs MAY appear: [list]
- Where DBAs MUST NOT appear: [list — partner co-branded materials, third-party integrations]

## Refresh discipline
- Refresh interval: [3-5 years minimum, not 18 months]
- Trigger for refresh: [audience shift, competitor encroachment, brand-pivoting product]

## Decision cards
[DEC-140 to DEC-149]

## What we are intentionally NOT doing
- Rebranding every fiscal year.
- Following design trends that compromise distinctiveness.
- Mixing DBAs in ways that dilute recognition (e.g., 5 brand colors).

## Sources and basis
V3 §1.4 (Mental availability, CEPs, Sharp/Romaniuk), §10.6 (Distinctive brand assets).
Romaniuk, *Building Distinctive Brand Assets*, 2018. Evidence grade: C with B-grade EB empirical work.
```

## When VisualForge absent
Produce a minimal DBA layer: pick 1 primary color, 1 mark direction (brief), 1-2 type families. Defer deeper visual work to VisualForge.

## Sources and basis
V3 §1.4, §10.6.
