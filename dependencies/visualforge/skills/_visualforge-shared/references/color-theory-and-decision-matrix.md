# Color Theory and Decision Matrix

Authoritative reference for color decisions in VisualForge. Used by `visualforge-brand-identity` (color philosophy direction), `visualforge-design-tokens` (palette construction), `visualforge-data-visualization` (color-blind-safe palettes), and `visualforge-surface-treatments` (gradient discipline).

This file gives the agent **theory + decision rules + verification** so color decisions are evidence-backed instead of taste-driven. Added per VF-FIND-047.

## Why this exists

Before this reference, VisualForge told the agent to pick from a *menu* (palette breadth: monochromatic / duotone / accent + neutral / multi-accent) without explaining:

- **Why** any one option is appropriate for a given brand profile.
- **How** colors actually go together (color harmony).
- **What** different hues mean — across Western default *and* other cultures.
- **How** to derive a concrete palette from an abstract direction.
- **How** to verify the palette is accessible and color-blind-safe.

The result was agents that picked plausibly-sounding palettes that didn't survive a senior designer review. This file fills that gap.

---

## Required research pass

Before producing any color decision card, the agent must run:

```text
Research color theory and decision rules for product UI as of 2026. Capture:

1. Color harmony schemes — monochromatic, analogous (30°-60° spread), complementary
   (180° opposition), split-complementary, triadic (120° spacing), tetradic / square,
   double-split-complementary. For each scheme: composition rules, when it works,
   real product examples, common failure mode.

2. Color meaning — per-hue (red, orange, yellow, green, blue, purple, pink, brown,
   black, white, gray) Western default associations PLUS at least two other cultural
   readings (East Asia, South Asia, Middle East, Africa, Latin America). Note which
   meanings are stable across cultures and which are not.

3. The 60-30-10 composition rule (and its origin in interior design / Itten).

4. Perceptually uniform color spaces — OKLCH, OKLab, CIE Lab, CIE LCh. Why OKLCH
   replaces HSL for design tokens (perceptual uniformity, P3 gamut support, predictable
   luminance laddering). Source: Björn Ottosson 2020 OKLab post + W3C CSS Color 4 spec.

5. Color-blindness types — deuteranopia (~6% of men, red-green), protanopia (~1%,
   red-green), tritanopia (rare, blue-yellow), monochromacy (very rare). Source: WHO
   vision impairment data, Colour Blind Awareness UK.

6. Contrast tooling — WCAG 2.2 contrast formula (luminance-based, 1.4.3 / 1.4.11
   success criteria), APCA / Andrew Somers (perceptually-weighted, used in
   WCAG 3 draft). When to use which.

7. Reference color systems — Material Design 3 dynamic color, Apple HIG color,
   IBM Carbon color tokens, Radix Colors, Tailwind palette, Brewer (ColorBrewer) for
   data viz, Pantone color of the year (cultural signal only, not authoritative).

8. Foundational sources — Itten (*The Art of Color*), Albers (*Interaction of Color*),
   Stone (*A Field Guide to Digital Color*), Hardin (color science), Munsell (system).

Capture all sources in `research-ledger.md` with title, owner, date, URL where applicable.
```

The research pass is not optional when the design brief is silent on palette direction. If the brief locks specific colors, research is still required to verify the locked colors against accessibility and color-blind safety.

---

## Color theory primer

### Color wheel basics

The color wheel arranges hues by angle (0°-360°). The two most-used wheels in design are:

- **RYB (Red-Yellow-Blue)** — traditional artist's wheel; complementary pairs are red↔green, blue↔orange, yellow↔purple. Less common in digital UI.
- **RGB (Red-Green-Blue)** — additive light wheel; complementary pairs are red↔cyan, green↔magenta, blue↔yellow. Default for screens.
- **OKLCH wheel** — perceptually uniform; same chroma value at hue 30° (orange) looks as saturated as hue 250° (blue). Preferred for token systems.

Pick **OKLCH for tokens** unless the project has a Pantone-locked brand identity.

### Six harmony schemes — when each works

For each scheme: the rule, when it works, a real example, and the common failure.

#### 1. Monochromatic

- **Rule:** one hue; vary chroma and luminance only.
- **Composition:** 7-11 step luminance ramp + 0-3 chroma steps.
- **Works when:** the product needs visual restraint (developer tools, dense data, technical brands). Easy to make accessible.
- **Example products:** Linear (warm gray + blue accent), Vercel (cool gray + accent), early Notion.
- **Failure mode:** too narrow; nothing pops. Solve by adding ONE high-chroma accent (becomes "achromatic + accent," next scheme).

#### 2. Achromatic + accent

- **Rule:** near-zero chroma neutrals (black/white/grays) + one high-chroma accent.
- **Composition:** neutral ramp does 90% of the work; accent appears on CTA, links, focus rings, selected states.
- **Works when:** content is the focus — editorial, news, docs, dense product UI.
- **Example products:** Stripe Press, The New Yorker online, Apple HIG-driven apps, Vercel.
- **Failure mode:** the neutral feels cold (cool-bias grays). Solve by tinting neutrals warm (paper / sand / fog) or matching neutral hue to brand-attribute warmth.

#### 3. Analogous

- **Rule:** 2-4 hues adjacent on the wheel (within 30°-60° arc). Same chroma family.
- **Composition:** one dominant hue, others as supporting tones.
- **Works when:** brand wants visual warmth and unity. Common in wellness, nature, lifestyle, hospitality.
- **Example products:** Mailchimp (yellow → orange → coral), Headspace (orange → coral → pink), Etsy (orange → terracotta → cream), Aesop (clay → ochre → sand).
- **Failure mode:** too narrow a range reads as monochromatic; too wide breaks the harmony. Stay within 60°.

#### 4. Complementary

- **Rule:** two hues opposite on the wheel (180° apart).
- **Composition:** one is dominant (60-70%), the other is accent (10-15%). Equal weight = visual vibration / "buzzing" effect that fails readability.
- **Works when:** the brand needs tension or a signature contrast. Sports, energy, gaming, bold consumer.
- **Example products:** Spotify (green + dark with red/magenta accents), Twitch (purple primary).
- **Failure mode:** **never equal-weight complementaries at full saturation** — that's the classic vibrating-text disaster. Always asymmetric weighting and reduced saturation on at least one side.

#### 5. Split-complementary

- **Rule:** base hue + the two hues adjacent to its direct complement (so three hues total, but more balanced than triadic).
- **Composition:** base dominant; the two split-complements share the remaining 30-40% as accent + secondary accent.
- **Works when:** brand wants more variety than analogous but less risk than complementary.
- **Example products:** Slack (purple base + green + red/orange accents), Duolingo (green base + red + yellow accents).
- **Failure mode:** treating all three hues as equal — reads as decorative chaos. Pick a dominant.

#### 6. Triadic

- **Rule:** three hues equally spaced (120° apart).
- **Composition:** dominant 60%, secondary 30%, accent 10% (the 60-30-10 rule). Highly saturated triadic palettes are loud — desaturate at least two to reduce.
- **Works when:** children's, playful consumer products, bold creative brands.
- **Example products:** PBS Kids, classic Pixar marketing, Khan Academy.
- **Failure mode:** all three at full saturation, equal weight — circus / clown read. Always pick a dominant + reduce saturation on at least two.

#### Beyond six: tetradic, double-split-complementary, square

- **Tetradic (rectangle):** four hues forming a rectangle — two complementary pairs. Hard to balance; works in editorial / poster contexts but rarely in product UI.
- **Square:** four hues equally spaced (90° apart). Same risk profile as tetradic; one dominant is required.
- **Double-split-complementary:** two complementary pairs near each other on the wheel. Rare in UI; advanced.

For most VisualForge product runs, the right scheme is **one of #1, #2, #3, or #5**.

### The 60-30-10 composition rule

Origin: interior design (Itten color theory adapted). Modern usage in UI palette composition:

- **60%** of the page area = **dominant** color (often the background neutral).
- **30%** = **secondary** color (sections, cards, supporting blocks).
- **10%** = **accent** color (CTA, link, focus ring, selected state, brand signature).

If the product has more than 3 brand colors, demote them to icons / data viz / illustration and use the 60-30-10 only for *chrome and content surface* tones.

### Color temperature

Independent axis from harmony. Affects perceived warmth:

- **Warm:** red, orange, yellow, warm-bias neutrals (cream / sand / paper).
- **Cool:** blue, green-blue, purple, cool-bias neutrals (slate / fog).
- **Neutral / mixed:** green and magenta sit on the boundary.

Pick a temperature for the **neutral scale** first. Cool neutrals + warm accent reads differently from warm neutrals + cool accent. Most products lock one direction.

---

## Color meaning (with cultural caveats)

**The caveat that must precede the table:** color meaning is **culturally contingent**. Below is a Western-default reading with notable variance in other cultures. The agent must NOT design for global audiences with Western-only color associations — see also `visualforge-i18n-rtl` § "Cultural sensitivity."

| Hue | Western default | East Asia | South Asia | Middle East | Stable across | Avoid in |
|---|---|---|---|---|---|---|
| **Red** | urgency, energy, danger, love | luck, celebration, prosperity (China), wedding (India) | wedding, fertility (India) | danger | "high attention" semantic | mourning contexts (Egypt), corporate-conservative (some EU) |
| **Orange** | warmth, friendliness, autumn, cheap (sometimes) | autumn, prosperity, happiness | sacred (Hinduism — saffron), spirituality | warmth | "energy without aggression" | luxury (often reads as casual) |
| **Yellow** | happiness, energy, caution, cowardice (negative) | imperial / royal (historical China), sacred | sacred (Buddhism), prosperity | (variable) | "attention / caution" | mourning (Egypt, some Latin America), low-end retail |
| **Green** | growth, nature, money (US), success, envy | wealth, harmony (China), youth | (auspicious in some contexts) | sacred (Islam), Paradise | "nature / growth" | "go ahead" semantic in some contexts; not universal as money outside US |
| **Blue** | trust, calm, professional, masculine, cool | immortality (China), femininity in some contexts | (varies) | mourning (Iran), heaven | "calm / cool" | gendered defaults outdated; ALL audiences |
| **Purple** | luxury, royalty, creativity, spirituality, mourning (Catholic) | mourning (Thailand), spirituality | spirituality | (variable) | "luxury / royalty" (where royal context exists) | mourning markets (Brazil, Thailand) |
| **Pink** | romance, femininity (recent Western), youth | feminine (East Asia recent) | (gender-neutral historically) | (variable) | "soft / approachable" | gendered defaults — not universal |
| **Brown** | earth, rustic, organic, dependability, cheap food | earth | earth | earth | "natural / organic" | premium luxury (often) |
| **Black** | sophistication, mourning, formality, power, evil | mourning (East Asia recent — historically WHITE was mourning) | mourning | mourning | "sophistication / formal" | celebration contexts in some cultures |
| **White** | purity, cleanliness, minimalism, weddings | **MOURNING** (East Asia, traditional) | mourning, purity | mourning | "minimal / clean" surface | weddings in East Asia — bride does NOT wear white |
| **Gray** | neutral, sophisticated, calm, can read sterile | balance | (variable) | (variable) | "neutral / sophisticated" | warmth-required contexts |

**Cultural-stable subset** (safe-ish defaults across most cultures):

- Red as attention / high-importance.
- Blue as calm.
- Green as natural growth.
- Brown as earthy / organic.

**Culturally unstable** (avoid relying on for global product without locale-specific override):

- White as celebration (East Asia: mourning).
- Black as sophistication (some cultures: only mourning).
- Yellow as happiness (some Latin America: mourning).
- Purple meaning anything specific (highly variable).

### Color emotion / psychology

Beyond meaning, color affects perceived emotion. Heuristic associations (Western, contested in cross-cultural studies but commonly used):

- **Warm hues (red / orange / yellow):** stimulating, energizing, urgent.
- **Cool hues (blue / green / purple):** calming, sedating, slower-reading.
- **High chroma:** alert, attention-demanding.
- **Low chroma / desaturated:** sophisticated, calm, refined.
- **High luminance contrast (black/white):** stark, formal, editorial.
- **Low luminance contrast (mid-tones only):** soft, muted, premium-quiet.

Use these as starting points; verify with the actual audience.

---

## What goes well together — practical pairing

### Reliable pairings

- **Within analogous (within 60° on the wheel) + same chroma + varied luminance** — high visual unity, low risk. Default safe choice.
- **Neutral + ONE high-chroma accent** — highest legibility. Works for almost every product.
- **Warm neutral + cool accent** (or vice versa) — balanced tension; reads as deliberate.
- **OKLCH luminance-anchored palette** — pick a single L value, vary hue and chroma — produces balanced multi-hue palette with consistent perceived weight.

### Risky pairings (use only with intent)

- **Full-saturation complementaries at equal weight** — visual vibration; eye strain. Reserve for poster / hero accents in very small doses.
- **High-chroma blue on high-chroma red text** (or reverse) — chromatic aberration at small sizes; never use for body copy.
- **Pure yellow on pure white** — fails contrast almost universally. Always darken yellow toward orange or use a tinted background.
- **Three or more high-chroma hues at equal weight** — without 60-30-10 discipline this reads as decoration, not signal.

### Anti-pairings (avoid)

- **Red ↔ green dependency** without dual-encoding — fails for ~8% of male users (red-green color blindness). See "Color-blindness verification" below.
- **Blue ↔ yellow dependency** without dual-encoding — fails for tritanopic users (rare but exists).
- **Brown + olive + mustard at full saturation** — reads as 1970s; only intentional retro brands.

### Pairing for surfaces

- **Background + foreground text:** WCAG 2.2 AA = 4.5:1 for body text, 3:1 for large text (18pt+ regular or 14pt+ bold). AAA = 7:1 / 4.5:1. APCA target Lc 60+ for body.
- **Subtle border on neutral surface:** 1.5:1 minimum contrast (no WCAG floor but below this it disappears).
- **Accent on neutral background:** ≥ 3:1 contrast for the accent to read as deliberate.
- **State colors (success/warning/danger/info):** never the only signal — always paired with an icon (dual-encoding).

---

## Brand-attribute → scheme decision matrix (pressure-tested)

This matrix replaces the original simplistic table. Each row gives **primary scheme + common alternative + real example + risk to avoid**, acknowledging multiple valid patterns per attribute.

| Brand profile | Primary scheme | Common alternative | Example products | Risk to avoid |
|---|---|---|---|---|
| **Precise / technical / developer tool** | Achromatic (near-zero chroma neutrals) + ONE accent | Monochromatic warm | Linear, Vercel, Notion (mostly), Stripe | Tinting neutrals warm reads as "consumer," not "developer" |
| **Warm / human / consumer-lifestyle** | Analogous warm (30-60° in red-orange-amber range) + warm neutral | Single warm accent + cream | Mailchimp, Headspace, Etsy, Airbnb (warm period) | Saturated yellow on white fails contrast |
| **Approachable / friendly (not warm-required)** | Soft mid-saturation palette + rounded geometry | Pastel with high luminance | Notion marketing, Slack onboarding | Pastels can read childish without geometry to balance |
| **Luxurious / editorial (restraint-mode)** | Desaturated neutral + iconic single accent | Mono black / cream | Aesop, COS, MR PORTER, The New Yorker | A second accent breaks restraint |
| **Luxurious (iconic-color-mode)** | Single signature high-chroma hue owning every surface | Achromatic + signature accent | Tiffany blue, Cartier red, Bottega green, Hermès orange | Diluting the signature with secondary brand colors |
| **Playful / energetic consumer** | Split-complementary with ONE dominant (60-30-10) | Saturated mono + bright accent | Duolingo, Slack, Discord | Equal-weight multi-hue = chaos. Dominant required. |
| **Trustworthy / institutional / financial** | Cool low-chroma + narrow chroma range | Conservative red + cream | IBM, LinkedIn, Chase (blue); HSBC, BoA, TD (red/green) | Trendy gradients undermine institutional read |
| **Natural / wellness / outdoor** | Earth analogous (warm grays / clay / sand) + muted biophilic green | Forest-green-dominant achromatic | Aesop, Patagonia, Tracksmith, Whole Foods | Saturated tropical greens read as "tech mint" not "wellness" |
| **Creative / studio / agency / portfolio** | Bold complementary OR single iconic | Mono editorial | Pentagram, Studio Dumbar, Locomotive, Active Theory | Defaulting to safe palettes undermines creative read |
| **AI / model / generative** | Achromatic restraint (avoid purple-blue cliche) | Mono + intentional single accent | Anthropic (ink+cream), Cursor (mono), Linear AI features | Purple-to-blue gradient = AI slop signal |
| **Children's / education (early years)** | Analogous bright with high chroma + rounded forms | Saturated triadic with dominant | PBS Kids, Khan Academy, Duolingo Kids | Saturated yellow + small type = unreadable; clown-palette risk |
| **News / editorial / journalism** | Achromatic + 1 brand accent | Cream + ink | NYT, WSJ, Stripe Press, The Atlantic | Decoration over clarity breaks reading flow |
| **Healthcare / clinical** | Cool low-chroma + state colors reserved for actual state semantics | White + soft blue + restricted state palette | Calm clinical apps, hospital portals | Saturated brand colors compete with state semantics (danger / success) |

**How to use this matrix:**

1. The brand-identity subskill produces brand attributes (DEC-098 region).
2. The agent picks the row(s) that best match.
3. The agent commits to a primary scheme **and** logs one common alternative in the decision card (so the rejected-alternatives field is honest).
4. The agent cites the example product for the chosen scheme as evidence.
5. The agent names the row's risk in the decision card's "anti-pattern" field.

If the brand attributes match multiple rows ambiguously, the agent surfaces the ambiguity to the user instead of guessing.

---

## Palette derivation method (OKLCH-based)

Given a chosen scheme + a chosen accent direction, derive the concrete palette as follows.

### Step 1: anchor the accent hue

Pick the OKLCH hue angle for the brand accent:

- **Red-orange (10°-40°):** warm, energetic, urgent.
- **Amber (50°-70°):** warm, friendly, optimistic.
- **Yellow (80°-100°):** caution, attention. Risky for primary brand.
- **Green-yellow (110°-130°):** fresh, growing.
- **Green (140°-160°):** natural, balanced.
- **Teal-cyan (180°-210°):** calm, technical.
- **Blue (220°-260°):** trust, cool, professional.
- **Purple (270°-300°):** luxury, creative.
- **Magenta-pink (310°-340°):** modern, vibrant, soft (lower chroma).
- **Red (0°-10°):** stop, love, passion.

Set the accent at **OKLCH(0.60, 0.18, hue)** as the mid-point. Adjust luminance and chroma per brand temperature.

### Step 2: derive the accent ramp (11 steps)

Fix the hue. Vary luminance linearly across 11 steps:

| Step | Luminance (L) | Chroma (C) | Use |
|---|---|---|---|
| 50 | 0.97 | 0.02 | wash / tint |
| 100 | 0.94 | 0.04 | subtle background |
| 200 | 0.88 | 0.08 | hover background |
| 300 | 0.78 | 0.12 | disabled border |
| 400 | 0.68 | 0.16 | (rarely used) |
| 500 | 0.60 | 0.18 | **the brand accent** |
| 600 | 0.52 | 0.18 | hover state |
| 700 | 0.44 | 0.16 | active / pressed |
| 800 | 0.36 | 0.12 | (rarely used) |
| 900 | 0.28 | 0.08 | foreground on light surface |
| 950 | 0.20 | 0.04 | deep accent on dark |

These are starting values. Verify contrast at every step that will pair with text or other tokens.

### Step 3: derive neutrals

Two common approaches:

- **Achromatic neutrals:** chroma = 0 across all steps. Pure gray ramp.
- **Tinted neutrals:** chroma = 0.01-0.03 with hue tied to brand temperature (e.g., warm-neutral = chroma 0.02 at hue 60° amber).

For luminance, use the same 11 steps as the accent ramp.

### Step 4: light + dark mode mapping

- **Light mode:** map semantic tokens (surface.background → neutral.50, text.primary → neutral.900, accent.primary → accent.500).
- **Dark mode:** invert luminance (surface.background → neutral.950, text.primary → neutral.100, accent.primary → accent.400). Note: accent in dark mode is *one step lighter* because deep accents read muddy on dark surfaces.
- **High-contrast mode:** clamp text and border luminance to the extreme ends of the ramp; remove mid-tones from accessible-color pairings.

### Step 5: verify

Run `tokens.json` through both:

- **WCAG 2.2 contrast** — every text-on-surface pairing meets the target AA / AAA level.
- **APCA Lc** — verify modern perceptual contrast target.
- **Color-blindness simulators** — see next section.

---

## Color-blindness verification

### Prevalence (cite as `(Research-backed)` with these sources)

- **~8% of male users / ~0.5% of female users have red-green color blindness** (combined deuteranopia + protanopia). Source: Colour Blind Awareness UK; WHO vision impairment data.
- **Tritanopia (blue-yellow)** is rare (<0.01%) but exists.
- **Monochromacy** (total color blindness) is very rare (~0.00003%).
- Globally: ~300M people have some form of color vision deficiency.

### Types to verify

| Type | Affects | Sees | Verify by |
|---|---|---|---|
| Deuteranopia | green-cone deficient; ~6% of men | red and green appear similar / muddy yellow-brown | Stark / Coblis / Chrome DevTools deuteranopia filter |
| Protanopia | red-cone deficient; ~1% of men | red darker; red-green confused | Stark / Coblis / Chrome DevTools protanopia filter |
| Tritanopia | blue-cone deficient; rare | blue-yellow confused | Stark / Coblis / Chrome DevTools tritanopia filter |
| Monochromacy | very rare | grayscale | Apply grayscale filter; verify all content readable |

### The dual-encoding rule

**Color must never be the only signal for meaning.** Every state, status, category, or distinction conveyed by color must ALSO be conveyed by:

- An **icon** (success ✓ / warning ⚠ / danger ✕ / info ⓘ).
- **Text** ("Required" / "Failed" / "Active").
- **Position** (top-right badge vs bottom inline).
- **Shape** (filled vs outlined; rounded vs square).
- **Pattern** (solid vs striped — common in data viz).

Data viz specifically: ColorBrewer (Cynthia Brewer) palettes are designed to remain distinguishable for the major color-blindness types; prefer these for chart series.

### Verification tools

- **Stark** (Figma plugin + browser extension) — runs simulator + contrast checker.
- **Coblis** (`https://www.color-blindness.com/coblis-color-blindness-simulator/`) — web simulator.
- **Chrome DevTools → Rendering → Emulate vision deficiencies** — built-in browser sim.
- **Sim Daltonism** (macOS) — system-wide overlay.

The agent must run at least one simulator pass on the final palette before logging the decision card.

---

## Contrast tooling

### WCAG 2.2 (default)

- **Formula:** relative luminance ratio between two colors. Range 1.0 (no contrast) to 21.0 (black on white).
- **AA targets:** 4.5:1 body text, 3:1 large text (18pt+ regular or 14pt+ bold), 3:1 UI components and graphical objects.
- **AAA targets:** 7:1 body, 4.5:1 large.
- **Use when:** default. Required for WCAG conformance.
- **Limitation:** luminance-only model misunderstands perception at extreme luminance values (very dark or very bright text on mid-tone). Tends to allow some pairings that look muddy and reject some pairings that read fine.

### APCA (Lc) — for perceptually-accurate contrast

- **Formula:** perceptually-weighted contrast (Andrew Somers, used in WCAG 3 working draft).
- **Targets (current 2026 draft):**
  - **Lc 90+** = body text best practice.
  - **Lc 75+** = body text minimum.
  - **Lc 60+** = large text (24px+).
  - **Lc 45+** = non-text UI.
- **Use when:** WCAG passes but the result looks wrong, or when you need finer control on mid-luminance pairings.
- **Tool:** `https://www.myndex.com/APCA/`

### Both — log both numbers

For every accessible pairing in the contrast verification table, log:

```
text.primary on surface.background — light mode:
  WCAG:  16.2:1 (AAA pass)
  APCA:  Lc 105  (body text excellent)
```

Per VF-FIND-002 (claim discipline): label every numeric ratio as `(measured)`, `(computed)`, or `(estimated)`.

---

## Anti-patterns (banned defaults)

Cross-reference `visual-default-breakers.md` § 6 (gradient discipline) — these are color-specific anti-patterns:

- **Pure black `#000000` on text or backgrounds** — fatigue-inducing; use OKLCH near-black like (0.18, 0.01, hue) instead. Apple, Linear, Stripe all use off-blacks.
- **Pure white `#FFFFFF` everywhere** — clinical / sterile read; use off-white like OKLCH(0.98, 0.01, hue) on mid-warmth.
- **Rainbow gradients** — mesh-blob, six-color hue spread, looks like Photoshop default.
- **Purple-to-blue AI gradient** — the canonical AI-product cliche (per `visual-default-breakers.md` §6).
- **Pink-to-orange "creator" gradient** — Instagram-era default; over-used.
- **High-chroma neon edges + glow halos without purpose** — gaming-aesthetic leak into non-gaming products.
- **Gradient text as a shortcut for "premium"** — solve premium via type weight, letter-spacing, and material, not gradient fills.
- **State colors used decoratively** — if green = success in your system, do not use green for non-success accents (creates semantic confusion).
- **Brand color competing with state colors** — if your brand red is also your danger red, every brand-red surface accidentally signals danger. Pick a different brand hue.
- **All-grayscale in product UI** — kills hierarchy; even achromatic palettes need at least one chromatic accent.
- **Three or more brand colors at equal weight** — violates 60-30-10; reads as decoration.

---

## Sources

Cited above; consolidated here for the research-ledger:

- **Itten, Johannes.** *The Art of Color.* — foundational harmony schemes.
- **Albers, Josef.** *Interaction of Color.* — perceptual color theory.
- **Stone, Maureen.** *A Field Guide to Digital Color.* — modern color science for software.
- **Hardin, C. L.** *Color for Philosophers.* — perception fundamentals.
- **Munsell, Albert.** Munsell color system — hue / value / chroma model.
- **Ottosson, Björn.** OKLab / OKLCH posts (2020+) — perceptually uniform color space basis.
- **Brewer, Cynthia.** ColorBrewer — data-viz color-blind-safe palettes.
- **W3C WCAG 2.2** — contrast formulas, success criteria 1.4.3 / 1.4.11.
- **W3C CSS Color 4 spec** — OKLCH, P3, color-mix().
- **Somers, Andrew.** APCA contrast — `https://www.myndex.com/APCA/`.
- **Material Design 3** dynamic color guidance.
- **Apple Human Interface Guidelines** — color section.
- **IBM Carbon Design System** — token / palette structure example.
- **Radix Colors** — perceptually-balanced UI ramp.
- **Tailwind palette** — common reference (defaults).
- **Colour Blind Awareness UK** — color-blindness prevalence data.
- **WHO Vision Impairment** — global prevalence data.

---

## Wired into

This reference is cited from:

- `visualforge-brand-identity` § 2 Color philosophy — agent commits to a scheme (DEC-093 region).
- `visualforge-design-tokens` § Color — agent constructs the OKLCH ramps + contrast table (DEC-111 region).
- `visualforge-data-visualization` — agent picks chart series colors via ColorBrewer / dual-encoding.
- `visualforge-surface-treatments` § Gradient usage — cross-checks the banned-gradient list.
- `visualforge-i18n-rtl` § Cultural sensitivity — cultural color associations cross-check.

## Validator enforcement

`check_color_decision_basis` (v1.8.0, this reference):

- Scans `02-visual-language/design-tokens.md`.
- If the file declares a palette (any hex / OKLCH stops) but does not cite `color-theory-and-decision-matrix.md`, emit WARN.
- If the file's contrast table has fewer than 4 pairings logged, emit WARN.
- Paired-condition fixture under `examples/fixtures/vf-find-047-color-decision-basis/`.

Sabotage-verified: no-op'ing the check fails only the fixture.

---

## Quality gate (when this reference applies)

A color decision card passes review when it:

- Names the chosen harmony scheme by row in the decision matrix.
- Names at least one common alternative considered and rejected.
- Cites at least one example product for the chosen scheme.
- Names the chosen risk-to-avoid from the matrix.
- Includes OKLCH values for primary accent + neutral anchor.
- Includes contrast table with WCAG and APCA both logged for primary pairings.
- Includes color-blindness simulator verification note (which tool, which type).
- Cites at least 2 sources from the bibliography above in `research-ledger.md`.

If any item is missing, the decision card is incomplete.
