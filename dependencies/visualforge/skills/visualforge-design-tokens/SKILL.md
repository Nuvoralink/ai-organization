---
name: visualforge-design-tokens
description: Produce the full design token system (color, type, spacing, shadow, motion, radius, z-index, breakpoint, blur) in Tier 1 primitives, Tier 2 semantic, Tier 3 component, exported as tokens.json / tokens.css / tokens.ts / tokens.figma.json.
---

# Design Tokens

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `token-artifact-export-spec.md`, `color-theory-and-decision-matrix.md`.
- Use `opinionated-decision-template.md`.
- Every token is justified: derived from brand identity, computed by formula, or research-backed.
- Every Tier 2 semantic token has a light and dark mode pair.
- Every motion token has a reduced-motion fallback.
- Every color token has documented contrast pairings.
- No hex / rgb / px / ms / cubic-bezier value appears outside `tokens.json` and direct-export files.
- Maintain `decision-log.md` and `research-ledger.md`.

## Purpose

Implement the brand philosophy as a concrete, multi-format token system. Tokens are the single source of truth for all design values. Every subsequent subskill references tokens by name.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Generate full token system from brand philosophy.
- **Retrofit:** Generate ideal token system independently. Compute drift vs existing tokens in `retrofit/drift-report.md`. Migration plan handles transition.

## Required research pass

```text
Research current best practices for design tokens as of 2026: tier structure, naming conventions, color space (OKLCH adoption), variable typography integration, motion tokens, container query breakpoints, dark-mode strategy, P3 wide-gamut, accessibility contrast tooling, DTCG (Design Tokens Community Group) format. Identify popular pipelines: Style Dictionary, Tokens Studio, Specify, Theo. Capture sources.
```

## Inputs

- Brand identity (`05-brand-identity.md`).
- Design brief (theming, accessibility level, platform).
- Adopted trends (`04-design-trends-research.md`).
- Personas accessibility profile.
- Retrofit inventory if applicable.

## Output files

- `docs/design-system/02-visual-language/design-tokens.md` — narrative + decision cards (categories, philosophy, naming, validation).
- `docs/design-system/tokens/tokens.json` — DTCG-compatible canonical source.
- `docs/design-system/tokens/tokens.css` — CSS custom properties (generated).
- `docs/design-system/tokens/tokens.ts` — typed TS (generated).
- `docs/design-system/tokens/tokens.figma.json` — Figma Variables import format (generated).
- Decision-log entries (DEC-110 to DEC-159, overflow DEC-160 to DEC-169) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Token categories — full coverage required

### Color

**Construct palette per `../_visualforge-shared/references/color-theory-and-decision-matrix.md` § "Palette derivation method".** Use the OKLCH-based 5-step process (anchor accent, derive ramp, derive neutrals, light/dark map, verify). Every token must cite its OKLCH triplet `(L, C, hue)` not just hex.

- **Tier 1 primitives:** 11-step ramps for each hue (gray/neutral/blue/green/yellow/orange/red/violet/pink/etc.) using OKLCH for perceptual uniformity. Steps 50/100/200/300/400/500/600/700/800/900/950. Include neutral / warm-neutral / cool-neutral ramps as needed.
- **Tier 2 semantic:**
  - `surface.background`, `surface.subtle`, `surface.elevated`, `surface.overlay`, `surface.inverse`.
  - `surface.glass.nav`, `surface.glass.modal` (if glass adopted).
  - `text.primary`, `text.secondary`, `text.tertiary`, `text.disabled`, `text.inverse`, `text.on-accent`, `text.on-danger`, etc.
  - `border.subtle`, `border.default`, `border.strong`, `border.focus`.
  - `accent.primary`, `accent.primary-hover`, `accent.primary-active`, `accent.subtle`, `accent.subtle-hover`.
  - `state.success`, `state.success-subtle`, `state.warning`, `state.warning-subtle`, `state.danger`, `state.danger-subtle`, `state.info`, `state.info-subtle`.
  - Each with light + dark mode pair.
- **Contrast verification table:** for every pairing (text-on-surface, border-on-surface, accent-on-surface, state-on-surface), document WCAG 2.2 contrast ratio in both modes. Per `color-theory-and-decision-matrix.md` § "Contrast tooling", also log APCA Lc for the primary pairings (body text, large text, UI components). Label every numeric ratio per VF-FIND-002 claim discipline: `(measured)` / `(computed)` / `(estimated)`. All must meet target a11y level.
- **Color-blindness verification:** run at least one simulator pass (Stark / Coblis / Chrome DevTools) per `color-theory-and-decision-matrix.md` § "Color-blindness verification". Log the result. State colors (success / warning / danger / info) must follow the dual-encoding rule — never color-only.

### Typography
- **Font family stacks:** sans, serif (if used), mono (if used), display (if separate).
- **Variable font axis values:** weight ranges actually used.
- **Type scale:** 8–14 steps named (xs, sm, base, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, display-sm, display-md, display-lg). For each: font-size, line-height, letter-spacing, weight default, weight bold.
- **Type ramp basis:** modular scale ratio (1.125 / 1.2 / 1.25 / 1.333 / golden) and base size, with formula documented.
- **Fluid type:** if adopted, `clamp()` formulas per step.
- **Numeric figures:** when to use tabular-nums.

### Spacing
- **Base unit:** 4px or 8px. Recommend 4px with 8px-aligned grid for finer control.
- **Scale:** 0, 0.5 (2px), 1 (4px), 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96. Use a consistent t-shirt naming layer over numeric.
- **Layout-specific spacing:** distinct tokens for layout gutters vs component padding when scale needs to differ.

### Radius
- **Scale:** none (0), xs (2), sm (4), md (8), lg (12), xl (16), 2xl (24), 3xl (32), full (9999).
- **Component-radius mapping:** which radius for buttons, inputs, cards, modals, badges, avatars, etc.

### Shadow / elevation
- **Elevation levels:** 0 (flat), 1 (resting card), 2 (hover card), 3 (popover), 4 (modal), 5 (top-level overlay).
- **Shadow recipe per level:** multi-layer composition per `opinionated-decision-template.md` example. Warm or cool tint per brand attribute.
- **Light + dark mode shadow variants:** dark mode shadows usually require additional luminance border highlight to read as elevation.

### Blur / glass (if adopted)
- **Blur amounts:** `blur.xs` 4px, `blur.sm` 8px, `blur.md` 16px, `blur.lg` 32px, `blur.xl` 64px.
- **Glass surface tokens:** opacity, blur amount, saturation boost, border luminance highlight.
- **Browser fallback:** for `backdrop-filter` unsupported.

### Motion
- **Duration scale:** instant (0), fast (120ms), base (200ms), slow (360ms), slower (600ms), enter (220ms), exit (180ms), expressive (480ms).
- **Easing curves:**
  - `ease.linear`
  - `ease.standard` — cubic-bezier(0.2, 0, 0, 1)
  - `ease.emphasized` — cubic-bezier(0.3, 0, 0, 1.05) (Material 3 expressive)
  - `ease.decelerate` — cubic-bezier(0, 0, 0, 1)
  - `ease.accelerate` — cubic-bezier(0.3, 0, 1, 1)
  - `ease.spring-gentle`, `ease.spring-snappy`, `ease.spring-bouncy` — spring physics specs (stiffness / damping / mass).
- **Reduced-motion fallback:** all durations → 0ms when `prefers-reduced-motion: reduce`.

### Breakpoints
- **Scale:** xs (default), sm (≥640), md (≥768), lg (≥1024), xl (≥1280), 2xl (≥1536), 3xl (≥1920).
- **Container query thresholds:** for component-driven responsive.
- **Density breakpoint:** if dense / comfortable / spacious density modes apply, document trigger points.

### Z-index scale
- Tokens for explicit stacking layers: base (0), raised (10), nav (100), dropdown (1000), sticky (1100), banner (1200), overlay (1300), modal (1400), popover (1500), tooltip (1600), toast (1700), max (9999).

### Opacity scale
- 0, 4, 8, 12, 16, 24, 36, 48, 64, 80, 96, 100 — for overlays, disabled states, hover tints, etc.

## Naming rules

- Tier 1 primitives: descriptive (`color.gray.500`, `size.4`, `duration.fast`).
- Tier 2 semantic: role-based (`surface.elevated`, `text.primary`).
- Tier 3 component: scoped (`button.primary.bg.rest`).
- No skin/theme names at Tier 2 (`bg-light`, `dark-text` forbidden); modes handle that.
- Kebab-case in CSS variables (`--vf-surface-background`).
- Dot.path in JSON / TS.
- Slash/notation in Figma (`surface/background`).

## Export discipline

Every token defined in `tokens.json` must:

- Appear in `tokens.css` as a custom property.
- Appear in `tokens.ts` as a typed export.
- Appear in `tokens.figma.json` for Figma Variables import.
- Be derivable from `tokens.json` by a generator (Style Dictionary or equivalent).

VisualForge generates all four directly in the first pass; the project should adopt a build pipeline afterward.

## Decision cards required

At minimum:

- DEC-111 Color space + primitive ramp algorithm.
- DEC-112 Semantic surface system.
- DEC-110 Semantic text system + contrast verification.
- DEC-115 Accent / state palette.
- DEC-120 Type scale + variable font configuration.
- DEC-125 Spacing scale.
- DEC-130 Radius scale + component mapping.
- DEC-135 Shadow / elevation system.
- DEC-140 Blur / glass system (or rejection).
- DEC-145 Motion duration + easing system.
- DEC-150 Breakpoint and container query strategy.
- DEC-155 Z-index scale.
- DEC-160 Dark mode algorithm.
- DEC-165 P3 wide-gamut policy.

## Validation

Run `scripts/validate_design_docs.py` after generation. Verify:

- All Tier 2 tokens resolve to Tier 1 or other Tier 2.
- All four export formats are present and equivalent.
- Light/dark pairs exist for all semantic tokens.
- Contrast table passes target a11y level.
- No raw values in component docs (forward check).

## Anti-slop token rules

- "Use a 4px base unit" without showing the full scale fails.
- "Modern typography" without specifying family, weight range, scale, and stack fails.
- Color ramps without contrast verification fail.
- Dark mode tokens without an algorithm (auto-derived / hand-tuned / inverted) fail.
- Motion tokens without reduced-motion fallback fail.
- Tier 2 token whose name describes appearance instead of role fails (`color.lightblue` bad; `accent.subtle` good).

## Quality gate

- All token categories produced with full scales.
- All four export formats written and equivalent.
- Light + dark + reduced-motion variants complete.
- Contrast verification table passes target a11y level.
- Decision cards complete.

## Sources and basis

Per-category source labels and rationale tied to brand identity and adopted trends.
