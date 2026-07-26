---
name: visualforge-surface-treatments
description: Define every surface material in the product — flat fills, multi-layer shadows, glass / backdrop-filter, gradients, noise textures, edges, glow, depth — with concrete recipes, fallbacks, and performance budgets.
---

# Surface Treatments

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `current-design-source-map.md`, `visual-default-breakers.md`, `color-theory-and-decision-matrix.md`.
- Use `opinionated-decision-template.md`.
- Every surface recipe must include: exact values, fallback for unsupported browsers / low-power mode / reduced-transparency, performance budget, accessibility implication, and the components/screens it applies to.
- No "subtle shadow", "soft blur", "modern glass" without recipes.
- Maintain `decision-log.md`.

## Purpose

Decide, surface by surface, what material to use. This is the layer most prone to taste-word slop. VisualForge makes it concrete: every card, every modal, every nav bar, every overlay has a named recipe with bound tokens.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Generate full surface map from brand surface philosophy + adopted trends.
- **Retrofit:** Generate ideal surface map independently; drift report covers transition.

## Required research pass

```text
Research current surface treatment patterns as of 2026 for the [aesthetic profile] segment. Capture: shadow recipes from reference products (Linear, Vercel, Stripe, Arc, Apple HIG examples), Liquid Glass implementation details on iOS 26 / macOS 26, web backdrop-filter performance characteristics on Chromium / WebKit / Gecko, gradient-rich design examples (Pitch, Notion AI), noise-texture usage, edge-treatment conventions (rounded vs sharp vs mixed). Capture sources.
```

## Inputs

- Brand identity (`05-brand-identity.md`) — surface philosophy.
- Design tokens (`06-design-tokens.md`) — shadow / blur / color tokens.
- Adopted trends (`04-design-trends-research.md`) — glass / gradient decisions.
- Performance budget (from design brief).
- Personas — motion sensitivity, low-power devices, contrast needs.

## Output files

- `docs/design-system/02-visual-language/surface-treatments.md`
- Decision-log entries (DEC-170 to DEC-199 range; no allocated overflow — bordered by iconography) per `../_visualforge-shared/references/decision-id-allocation.md`.
- New tokens added to `docs/design-system/tokens/tokens.json` if surface recipes require additional shadow / blur / gradient tokens.

## Surface map — full coverage required

For every surface category, define the recipe. Every recipe uses tokens from `06-design-tokens.md`; if a recipe needs a value not yet tokenized, add the token first.

### Background canvas

- Default page background: surface token + optional noise overlay.
- Subtle pattern / grid background (if any): SVG mask, density, opacity.
- Hero / marketing canvas: gradient or solid + accent.

### Cards (most common surface)

Define per density tier (sparse / balanced / dense):

- **Rest state:** background token, border token (or none), shadow token, radius.
- **Hover state:** elevation delta (+1 level usually), shadow swap, optional border lighten, transform: translateY(-1px to -2px), duration token, easing token.
- **Pressed state:** elevation -1, transform: translateY(1px), shadow reduce, duration token.
- **Selected state:** accent border or 2px accent ring, retain elevation, optional accent-subtle background.
- **Disabled state:** opacity reduce, no shadow, no hover behavior.
- **Loading state:** shimmer overlay or skeleton — reference motion subskill.

### Modals and dialogs

- **Backdrop:** color, opacity, optional blur, click-dismiss policy.
- **Modal surface:** elevated surface token, max-width per modal size (sm/md/lg/xl/fullscreen), radius (usually larger than card), shadow (modal elevation token).
- **Glass modal recipe (if adopted):** opacity, blur, saturation boost, fallback (solid surface) for unsupported / low-power / reduced-transparency.
- **Entry / exit motion:** reference motion-design subskill.

### Popovers, tooltips, menus

- **Surface:** elevated token, shadow (popover elevation), border subtle.
- **Anchor positioning:** CSS Anchor Positioning when supported, fallback to positioning library.
- **Arrow / tail:** included or not (recommend no for clean menus, yes for tooltips on data).
- **Glass treatment:** typically yes for menus on glass-adopting products.

### Navigation surfaces

- **Top bar / global nav:** standard or glass-blurred? Glass with backdrop-filter + warm tint, fallback solid.
- **Side rail / sidebar:** flat or subtle elevation, scroll-shadow on scroll.
- **Tab bars (mobile):** glass on iOS native pattern, solid on Android Material 3.
- **Command palette:** elevated modal with strong shadow, optional glass.

### Form surfaces

- **Input rest:** border-strong on surface-elevated, or filled (surface-subtle with no border).
- **Input focus:** border-focus 2px or focus-ring outside.
- **Input error:** border-danger, optional bg state-danger-subtle.
- **Select / dropdown:** popover surface.
- **Date picker / complex pickers:** elevated card with internal grid.

### Notification surfaces

- **Toast:** elevated, accent border or accent left-bar, semantic color tint subtle, shadow strong (overlay elevation).
- **Banner (in-flow):** subtle accent tint, optional accent border, no shadow.
- **Inline alerts:** state-subtle bg, state-strong border, state icon.

### Marketing / hero surfaces (if applicable)

- **Hero background:** gradient recipe with stops in OKLCH, optional noise overlay.
- **Section dividers:** subtle gradient line, illustration, or empty.
- **CTA card:** elevated with accent border or full accent fill.

### AI / generative surfaces (if AI features)

- **Streaming response container:** subtle bg shift while streaming, citation chip surface, source preview popover.
- **Suggestion chip surface:** small radius, subtle bg, hover accent.
- **Prompt input:** larger radius than standard input, optional glass with command-palette pairing.

## Shadow philosophy detail

Three approaches; pick one as dominant. Don't mix.

### A. Multi-layer realistic shadow
- 3–5 stacked drop-shadows.
- Lower y, smaller blur near the surface (contact shadow).
- Higher y, larger blur for ambient.
- Tinted toward brand neutral (not pure black) to avoid the muddy look.
- Total opacity sum 0.10–0.20.
- Recipe template:
  ```
  shadow.card.rest:
    0 1px 2px 0 rgba(X, 0.05),
    0 2px 4px 0 rgba(X, 0.04),
    0 4px 8px 0 rgba(X, 0.03),
    0 8px 16px 0 rgba(X, 0.02);
  ```
- Best for: premium consumer, creator tools, content products.
- Cost: ~3x paint cost vs single shadow at scale; budget care for dense card lists.

### B. Single soft shadow (legacy Material / business)
- One drop shadow.
- y 2–4px, blur 8–16px, ~10% opacity.
- Best for: enterprise SaaS where shadow signals elevation only, not premium feel.
- Cost: cheap.

### C. Border-only with no shadow
- 1px border, subtle.
- Optional 2px outer ring on focus.
- Best for: data-dense tools (Linear, Notion blocks), where shadows add noise.
- Cost: zero.

### D. Mixed (with rules)
- Allowed only when one approach is dominant and another is reserved (e.g., Approach C for inline cards, Approach A for modals only).
- Document the rule explicitly.

## Glass / backdrop-filter philosophy (if adopted)

Recipe template:

```css
.glass.nav {
  background: color-mix(in oklch, var(--vf-surface-elevated) 70%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid color-mix(in oklch, var(--vf-border-subtle) 50%, transparent);
}

@supports not (backdrop-filter: blur(1px)) {
  .glass.nav {
    background: var(--vf-surface-elevated);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass.nav {
    backdrop-filter: none;
    background: var(--vf-surface-elevated);
  }
}
```

Adopt glass only where it strengthens the brand and where the underlying content benefits from showing through (nav, modal). Avoid glass on cards over textured backgrounds — reads as muddy.

## Edge treatment philosophy

- **Radius scale alignment:** which radius (from tokens) per surface category.
- **Sharp / rounded character:** consistent across product or per-surface variation? Document.
- **Inner highlight:** 1px inner top highlight to suggest light source (signature touch on premium surfaces) — when, where, opacity.
- **Outer glow:** for focus rings, selected states, accent emphasis.

## Gradient usage rules

If gradients are part of the brand:

- **Stops in OKLCH:** linear interpolation through perceptual space avoids muddy mid-range.
- **Direction conventions:** which axis for which surface.
- **Animated gradients:** only on hero / marketing surfaces, never functional UI.
- **Accessibility:** contrast must hold for any text overlay, verified at all points of gradient.

### Allowed gradient patterns (per `visual-default-breakers.md` §6)

Use these confidently:

- Low-chroma palette-matched tonal gradients (ink → graphite, cream → sand, ivory → warm grey).
- Single-hue atmospheric grades behind hero photography.
- Soft vignettes and radial depth that direct the eye.
- Noise-textured gradients adding tactile depth without color noise.
- Editorial color washes matching brand mood.

### Banned gradient patterns (hard failure)

The following gradient patterns are **AI slop** and fail review regardless of context — they are the #1 visual tell of LLM-generated design:

- Rainbow / mesh blob gradients.
- Purple-to-blue "AI" defaults (the canonical AI-product cliché).
- Pink-to-orange "creator" defaults.
- Neon edges and glow halos with no purpose.
- Gradient text as a shortcut for "premium" without a real type-weight or letter-spacing decision.
- Gradients that compete with imagery instead of supporting it.

The doc must enumerate these by name in the gradient decision card so future contributors can't introduce them without an explicit override.

## Noise / texture rules

If noise is part of the brand:

- **Source:** SVG turbulence or pre-baked PNG; specify size and tile.
- **Opacity:** 0.02–0.05 typical.
- **Where applied:** background canvas only, or named surfaces.
- **Dark mode:** noise often needs higher opacity or different source.

## Reduced-transparency, reduced-motion, low-power, high-contrast

For each surface treatment, document the fallback:

| Surface | Default | reduced-transparency | reduced-motion | high-contrast | low-power |
|---|---|---|---|---|---|
| Top nav | glass | solid surface-elevated | (n/a) | solid + 2px border | solid |
| Modal | elevated + shadow | (same) | no entry motion | + 2px border | reduce shadow layers |
| Card hover | translate + shadow | (same) | no translate, no shadow change | + accent border | flat shadow |

## Decision cards

Each surface category + treatment combination logged. Examples:

- DEC-170 Shadow philosophy (Approach A multi-layer warm).
- DEC-175 Card surface recipe (rest / hover / pressed / selected / disabled).
- DEC-180 Modal surface recipe.
- DEC-185 Nav glass recipe + fallback.
- DEC-190 Gradient usage policy.
- DEC-195 Noise / texture usage.
- DEC-171 Edge treatment + radius mapping per surface.
- DEC-172 Reduced-transparency / reduced-motion / high-contrast fallback matrix.

## Anti-slop surface rules

- "Add a subtle drop shadow" without values fails.
- "Glassmorphism on the navbar" without backdrop-filter values, opacity, saturation, and fallback fails.
- "Modern card design" without surface tokens, every state, every transition fails.
- Glass-everywhere is design fashion-following, not design — apply trend-fit test.
- Shadow-tinted-pure-black is the "AI default" — bias toward brand neutral.

## Quality gate

- Every surface category in the inventory above has a recipe.
- Every recipe references tokens (no raw values).
- Every state of every interactive surface is defined.
- Reduced-transparency / reduced-motion / high-contrast / low-power fallbacks for transparency-using surfaces.
- Performance budget impact noted per recipe.

## Sources and basis

Per-recipe source basis: research-backed (with sources), brand-derived, or assumption.
