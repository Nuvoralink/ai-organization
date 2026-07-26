---
name: visualforge-brand-identity
description: Define the brand visual personality — color philosophy, typography philosophy, mood, illustration style, photographic treatment, motion personality, voice direction. The intent layer above design tokens.
---

# Brand Identity

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `visual-default-breakers.md`, `color-theory-and-decision-matrix.md`.
- Use `opinionated-decision-template.md` for every decision.
- No taste-words. No "modern", "clean", "premium", "trustworthy", "warm" without measurable visual mechanism expressing it.
- Every brand attribute must connect to a specific visual mechanism, with a token or pattern that expresses it.
- Label every fact: User-confirmed, Research-backed, Specforge-derived, or Assumption.
- Maintain `decision-log.md` and `research-ledger.md`.

## Purpose

Define *what the product feels like* before *what the product looks like*. Brand identity is the intent layer; design tokens (next subskill) is the implementation. Brand attributes drive token choices, surface treatments, motion language, and content voice. Without an explicit brand, all later decisions become arbitrary.

## Mode-aware behavior

- **Greenfield:** Generate brand identity from product intent + audience + competitive audit + adopted trends.
- **Specforge-enhanced:** Read Specforge brand positioning and voice. Convert into design-actionable brand attributes.
- **Retrofit:**
  - If user locked existing brand: treat as User-confirmed constraints (logo, colors, type). Build the rest of the identity around them.
  - If existing brand is not locked: produce the ideal independent identity. Log a drift entry vs current.

## Required research pass

Only if the brand direction is ambiguous from inputs:

```text
Research the brand identity language of products in the [aesthetic profile] segment with [audience]. Capture: color temperature trends, typography conventions (geometric vs humanist, sans vs serif vs hybrid), illustration vs photography vs abstract treatment, motion personality (restrained vs expressive), voice direction (direct vs warm vs playful). Find 5 reference brands and their underlying brand attributes.
```

## Inputs

- Design brief (`01-design-brief.md`).
- User personas (`02-user-personas.md`).
- Competitive audit (`03-competitive-audit.md`).
- Design trends decisions (`04-design-trends-research.md`).
- User-locked brand assets if any.

## Output files

- `docs/design-system/02-visual-language/brand-identity.md`
- `docs/design-system/brand/mood-board.md` — curated visual references.
- Decision-log entries (DEC-090 to DEC-104, overflow DEC-105 to DEC-109) per `../_visualforge-shared/references/decision-id-allocation.md` — brand decisions are foundational.

## Brand identity sections

### 1. Brand attributes (the foundation)

Pick 4–6 named attributes. Each must:

- Be expressed as a polarity pair (e.g., "precise vs loose: precise-leaning", "warm vs cool: warm-neutral", "restrained vs expressive: 70% restrained / 30% expressive on signature moments").
- Have a specific visual mechanism that expresses it.
- Have an anti-pattern showing what it is *not*.

Example:

```
Attribute: Precise — but not sterile.
Visual mechanism: Tight letter-spacing on display type. 8px grid (not 4px). Optical alignment on icons. Sub-pixel-aware shadows.
Anti-pattern: Brutalist no-grid asymmetry. Wide letter-spacing. Casual visual rhythm.
```

```
Attribute: Warm-neutral.
Visual mechanism: Neutrals biased toward warm OKLCH hue 60° (paper-warm), never cool blue-grey. Accent retains warmth at desaturated states.
Anti-pattern: Cool grey palette (Slate / Zinc) reading as "tech-cold".
```

### 2. Color philosophy

Not the hex values yet — the *philosophy* that the token subskill will implement.

**Required before this section:** read `../_visualforge-shared/references/color-theory-and-decision-matrix.md`. Pick the brand-attribute row from the decision matrix; log the primary scheme + one rejected alternative + an example product + the row's risk-to-avoid. The decision card for color philosophy is incomplete without those four fields. Cultural color meanings cross-check against the meaning table when product targets non-Western audiences.

- **Palette breadth:** monochromatic / duotone / accent + neutral / multi-accent.
- **Saturation strategy:** muted across the board / saturated accent + muted everything else / fully saturated UI / earth-saturated.
- **Hue temperature:** warm / cool / neutral / dual.
- **Neutral character:** warm-paper / cool-fog / pure-grey / tinted-by-accent.
- **Accent role:** UI signal only / UI signal + brand expression / dominant brand surface / sparing high-energy.
- **Color space basis:** OKLCH / HSL / sRGB hex — recommend OKLCH for new systems, sRGB hex compatibility required.
- **Wide-gamut (P3) usage:** yes / no — recommend yes when target devices support.

### 3. Typography philosophy

- **Voice through type:** crisp geometric / humanist warmth / editorial serif / technical mono-display / hybrid sans + serif.
- **Display vs body relationship:** same family with weight differentiation / display contrasts with body / single family across the board.
- **Variable font usage:** yes (weight + optical-size + slant) / no.
- **Weight character:** narrow weight range (400/600 only) / full range (100–900) / specific weight tone (e.g., "always bold for headlines never light").
- **Letter-spacing posture:** tight on display / spaced on uppercase only / never tracked open.
- **Numeric figures:** lining / oldstyle / tabular contexts identified.
- **Font licensing route:** Google Fonts / Fontshare / self-hosted commercial / system font stack.

### 4. Surface and material philosophy

- **Material direction:** flat / soft-shadowed / multi-layer realistic shadow / glass / textured / gradient-rich / mixed (with rules).
- **Depth strategy:** five elevation levels / three / two / none.
- **Edge treatment:** sharp / soft-rounded / mixed (component-specific).
- **Texture / noise:** none / subtle on key surfaces / signature texture.
- **Gradient usage:** never / accent-to-accent transitions only / brand gradient as signature / dynamic gradient backgrounds.

### 5. Iconography philosophy

- **Style direction:** outline / filled / duotone / mixed (with rules).
- **Stroke character:** thin and precise / medium balanced / heavy bold.
- **Corner radius character:** sharp / rounded / matched-to-radius-scale.
- **Custom vs library:** library only / library + custom for brand-specific / fully custom set.
- **Animation posture:** static / subtle (state changes) / expressive (key actions).

### 6. Motion personality

- **Energy:** restrained / moderate / expressive.
- **Physics model:** linear / tween / spring / mixed by context.
- **Choreography:** elements move alone / coordinated stagger / orchestral cascade.
- **Signature moment:** is there one motion that becomes a brand signature (e.g., page entry, success confirmation)? Describe.
- **Reduced-motion stance:** required first-class fallback / acceptable degradation.

### 7. Imagery and illustration direction

- **Primary modality:** photography / illustration / abstract / mixed.
- **Photographic treatment** (if photography used): muted / saturated / desaturated / cinematic / documentary / studio / candid.
- **Illustration style** (if illustration used): line-art / flat-color / dimensional / hand-drawn / vector-precise.
- **AI-generated imagery rules:** allowed / not allowed / curated only.
- **Empty-state imagery:** illustration / icon / typography-only / mixed by surface.

### 8. Voice and tone

- **Voice direction:** Direct/Professional, Warm/Approachable, Playful/Confident, Calm/Technical, Sharp/Editorial.
- **Person:** first-person plural ("we") / second-person ("you") / objective.
- **Formality:** casual / professional / formal.
- **Humor allowed:** never / dry only / earned moments / playful throughout.
- **Brand voice in error states:** ...
- **Brand voice in success states:** ...
- **Brand voice in destructive confirmations:** sober regardless of brand-wide voice.

### 9. Brand-attribute → mechanism map

A summary table connecting every brand attribute to every system it constrains:

| Attribute | Color | Type | Surface | Motion | Icons | Voice |
|---|---|---|---|---|---|---|
| Precise | OKLCH precision | Tight tracking | Sub-pixel shadows | Snap easing | Optical alignment | Direct |
| Warm-neutral | Warm hue bias | Humanist sans | Warm shadow tint | — | — | Approachable |
| ... | ... | ... | ... | ... | ... | ... |

### 10. Mood board references

Curated visual references for downstream subskills. Each entry has:

- Reference source (product / brand / artifact).
- What attribute it expresses.
- What to extract.
- What to *not* extract.

### 11. Hero scale and composition (anti-LLM-default)

Per `visual-default-breakers.md`, every product must commit to **one** primary Hero Scale and one default Hero Composition Anchor before any screen spec is written. This is the single most important anti-slop decision in the visual layer — without it, the orchestrator's downstream subskills default to the LLM's centered / text-left+image-right reflex.

- **Hero Scale (pick one):**
  - **Giant Statement** — massive type, dominant first viewport.
  - **Mid Editorial** — balanced type/image, cinematic but not screen-filling.
  - **Mini Minimalist** — tiny logo + short statement + thin CTA, mostly negative space; restraint, not weakness.
- **Default Hero Composition Anchor (pick one; must not be text-left / image-right unless explicitly justified):** centered statement, bottom-left over background image, bottom-right CTA cluster, top-left lead, stacked center, image-as-canvas, off-grid editorial offset, mini minimalist, right-text / left-image inverted.
- **H1 wrap rule:** ≤ 3 lines. Specify the `max-w` token or fluid clamp that guarantees it. Never let the H1 fall back to whatever container width it lands in.

### 12. Narrative / concept spine

Per `visual-default-breakers.md` §14, pick **one** running concept that threads visuals and short copy across the product: Artifact / Journey / Tool / Living system / Stage / Archive. Downstream subskills (imagery-illustration, motion-design, content-design, screen specs) cite this spine.

### 13. Brand decision cards

Each foundational decision logged with the full template. Examples:

- DEC-091 Brand attributes (4–6 named).
- DEC-092 Color philosophy direction.
- DEC-093 Typography philosophy direction.
- DEC-094 Surface and material direction.
- DEC-095 Iconography style direction.
- DEC-096 Motion personality.
- DEC-097 Voice direction.
- DEC-098 Hero Scale (Giant / Mid / Mini) — required, per VF-FIND-032. *(In allocated range DEC-090–104 per `decision-id-allocation.md`.)*
- DEC-099 Default Hero Composition Anchor — required, per VF-FIND-032.
- DEC-100 Narrative / concept spine — required, per VF-FIND-032.

## Anti-slop brand identity rules

- "Premium" is not an attribute. "Warm-neutral with tight typographic rhythm" is.
- "Modern" is not an attribute. "Precise, restrained motion, signature serif display" is.
- "Trustworthy" is not an attribute. "Stable type with neutral palette and conservative motion" is.
- Any attribute that doesn't connect to a visual mechanism is slop. Remove or replace.
- Recycling competitor's brand attributes verbatim fails the originality test.
- Defaulting to text-left / image-right hero **without explicit justification** fails per `visual-default-breakers.md` §1.
- Skipping Hero Scale, default composition anchor, or narrative spine decisions fails per `visual-default-breakers.md` §2 and §14.

## Quality gate

- 4–6 named brand attributes with mechanism + anti-pattern each.
- Color, type, surface, icon, motion, imagery, voice philosophies all stated.
- Attribute → mechanism map filled.
- Every philosophy is opinionated and specific (not "depends" or "various").
- Hero Scale, default Hero Composition Anchor, and Narrative Spine decisions logged (DEC-098 / DEC-099 / DEC-100).
- Foundational decision cards logged.
- Mood-board references curated.

## Sources and basis

Document each philosophy's basis: user-locked, Specforge-derived, research-backed (with sources), or assumption.
