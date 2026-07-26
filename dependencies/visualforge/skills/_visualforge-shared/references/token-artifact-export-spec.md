# Token Artifact Export Specification

VisualForge produces design tokens in four formats, simultaneously, every run. Tokens are the single source of truth: every component reference, every doc value, every Figma variable resolves to a named token.

## Step 0 — Downstream-needs survey (v1.1 — per VF-FIND-006)

Before locking the `size.*` scale (or any other primitive scale), survey what dimensions the downstream subskills will need. The token scale must cover every dimension cited more than once across the design system.

### Survey checklist

For each primitive category, anticipate values the later subskills will need:

**`size.*` (spacing + dimensions)**
- Component-internal spacing: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 — covers margins, padding, gaps.
- Component dimensions: button heights (32, 40, 48), input heights (32, 40), icon sizes (12, 16, 20, 24, 32) — most covered by the same scale.
- Layout-shell dimensions: mobile top-bar height (56), side-rail collapsed (56), side-rail expanded (224) — `size.14` and `size.56` required.
- Pattern-library dimensions: rail widths (240), modal max-widths (320, 400, 480, 720, 960), pane min/max (320–480), container-query thresholds (320, 400, 480) — `size.60`, `size.80`, `size.100`, `size.120`, `size.180`, `size.240` required.
- Reading-prose width: 720 — `size.180` or `container.prose` token.

**Recommended minimum `size.*` coverage:**
`0, px, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 56, 64, 80, 100, 120, 180, 240`

**`duration.*` (motion)**
- Functional state changes: 120ms (fast), 200ms (base), 360ms (slow).
- Page transitions: 220ms (enter), 180ms (exit).
- Loading / progress: 600ms (slower), 800ms (spinner).
- Signature moments: 480ms (expressive).

**`zIndex.*`**
- Base, raised, nav, dropdown, sticky, banner, overlay, modal, popover, tooltip, toast — 11 named layers.

**Color**
- Per-hue 11-step ramps (50, 100, ..., 950) for: gray/neutral + 1 accent + 4 state (success/warning/danger/info).

### Survey output

The design-tokens subskill must emit the survey results as a section in `02-visual-language/design-tokens.md` before locking the scale, with confidence per anticipated value:

| Value | Anticipated by | Source confidence |
|---|---|---|
| `size.14` (56) | layout-shell (mobile top-bar height, side-rail collapsed width) | High (industry-typical) |
| `size.56` (224) | layout-shell (side-rail expanded width) | High (industry-typical) |
| `size.60` (240) | layout-system (filter rail, section nav width) | Medium (verify in component design) |
| ... | ... | ... |

Any value cited later in the design system but missing from `tokens.json` is a token-scale gap. The fix is **always** to extend the scale (with a decision card noting the gap), never to inline a raw px value.

### Validation

`scripts/validate_design_docs.py --mid-run` runs `check_raw_px_in_layout_and_components` which flags layout / component / screen docs with ≥ 3 unlabeled raw px values — a signal the token scale is incomplete.

## Token taxonomy — three tiers

### Tier 1 — Primitives

Raw values with no semantic meaning. Named for what they *are*.

```
color.gray.50 ... color.gray.950
color.blue.50 ... color.blue.950
color.warm.50 ... color.warm.950
size.0 = 0
size.1 = 1px
size.2 = 2px
size.4 = 4px
... (geometric scale)
duration.fast = 120ms
duration.base = 200ms
duration.slow = 360ms
ease.standard = cubic-bezier(0.2, 0, 0, 1)
ease.emphasized = cubic-bezier(0.3, 0, 0, 1.05)
font.sans = "Inter Variable", system-ui, ...
font.serif = "Source Serif Variable", Georgia, ...
font.mono = "JetBrains Mono Variable", ui-monospace, ...
```

### Tier 1 — additional primitives (often missed)

In addition to the color / size / duration / ease / font primitives above:

```
zIndex.0 = 0           # base content
zIndex.10              # raised content (hover lift)
zIndex.100             # navigation
zIndex.1000            # dropdown
zIndex.1100            # sticky
zIndex.1200            # banner
zIndex.1300            # overlay backdrop
zIndex.1400            # modal
zIndex.1500            # popover
zIndex.1600            # tooltip
zIndex.1700            # toast
zIndex.9999            # absolute top (rare; reserve)

opacity.0 = 0
opacity.4 = 0.04
opacity.8 = 0.08
opacity.12 = 0.12
opacity.16 = 0.16
opacity.24 = 0.24
opacity.36 = 0.36
opacity.48 = 0.48
opacity.64 = 0.64
opacity.80 = 0.80
opacity.96 = 0.96
opacity.100 = 1

aspect.square = 1/1
aspect.portrait = 3/4
aspect.landscape = 4/3
aspect.video = 16/9
aspect.wide = 21/9
aspect.golden = 1.618/1

blur.xs = 4px
blur.sm = 8px
blur.md = 16px
blur.lg = 32px
blur.xl = 64px

density.comfortable = 1.0    # spacing multiplier
density.compact = 0.75
density.spacious = 1.25
```

These primitives must appear in `tokens.json` and propagate to all four output formats. Subskills (surface-treatments, layout-system, imagery-illustration, micro-interactions) reference them by token, never raw value.

### Tier 2 — Semantic

Named for what they *mean*. Reference primitives. Have light + dark modes.

```
surface.background       → light: color.warm.50,  dark: color.warm.950
surface.elevated         → light: color.white,    dark: color.warm.900
surface.glass.nav        → light: rgba(...),      dark: rgba(...)
text.primary             → light: color.warm.950, dark: color.warm.50
text.secondary           → light: color.warm.700, dark: color.warm.300
border.subtle            → light: color.warm.200, dark: color.warm.800
border.strong            → light: color.warm.400, dark: color.warm.600
accent.primary           → light: color.blue.600, dark: color.blue.400
state.success            → ...
state.warning            → ...
state.danger             → ...
state.info               → ...
shadow.card.rest         → 4-layer composite
shadow.card.hover        → 4-layer composite (lifted)
shadow.card.pressed      → reduced
shadow.modal             → ...
radius.sm = size.2
radius.md = size.4
radius.lg = size.8
radius.full = 9999px
```

### Tier 3 — Component

Component-scoped values. Reference semantic. Only used inside component definitions, never in app code.

```
button.primary.bg.rest       → accent.primary
button.primary.bg.hover      → accent.primary-hover (computed)
button.primary.fg            → text.on-accent
button.primary.shadow.rest   → shadow.button.rest
input.bg                     → surface.elevated
input.border.rest            → border.strong
input.border.focus           → accent.primary
```

App code references only Tier 2. Component internals reference Tier 3. Tier 1 is referenced only by Tier 2 and 3 token definitions.

## Output formats

All four are produced every run. Each has a specific consumer.

### `tokens.json`

Style Dictionary / DTCG-compatible format. The canonical source.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "gray": {
      "50": { "$value": "#FAFAFA", "$type": "color" },
      "950": { "$value": "#0A0A0A", "$type": "color" }
    }
  },
  "surface": {
    "background": {
      "$value": "{color.warm.50}",
      "$type": "color",
      "$extensions": {
        "vf.modes": {
          "dark": "{color.warm.950}"
        }
      }
    }
  },
  "shadow": {
    "card": {
      "rest": {
        "$type": "shadow",
        "$value": [
          { "color": "#0A0A0A14", "offsetX": "0px", "offsetY": "1px", "blur": "2px", "spread": "0px" },
          { "color": "#0A0A0A10", "offsetX": "0px", "offsetY": "2px", "blur": "4px", "spread": "0px" },
          { "color": "#0A0A0A0C", "offsetX": "0px", "offsetY": "4px", "blur": "8px", "spread": "0px" },
          { "color": "#0A0A0A08", "offsetX": "0px", "offsetY": "8px", "blur": "16px", "spread": "0px" }
        ]
      }
    }
  }
}
```

### `tokens.css`

CSS custom properties with light/dark via `[data-theme="dark"]` and `prefers-color-scheme`.

```css
:root {
  /* Primitives */
  --vf-color-gray-50: #FAFAFA;
  --vf-color-gray-950: #0A0A0A;
  --vf-color-warm-50: #FAF7F2;
  --vf-color-warm-950: #100C08;

  /* Semantic (light) */
  --vf-surface-background: var(--vf-color-warm-50);
  --vf-surface-elevated: #FFFFFF;
  --vf-text-primary: var(--vf-color-warm-950);
  --vf-text-secondary: var(--vf-color-warm-700);
  --vf-border-subtle: var(--vf-color-warm-200);
  --vf-accent-primary: var(--vf-color-blue-600);

  /* Shadows */
  --vf-shadow-card-rest:
    0 1px 2px 0 #0A0A0A14,
    0 2px 4px 0 #0A0A0A10,
    0 4px 8px 0 #0A0A0A0C,
    0 8px 16px 0 #0A0A0A08;

  /* Motion */
  --vf-duration-fast: 120ms;
  --vf-duration-base: 200ms;
  --vf-ease-standard: cubic-bezier(0.2, 0, 0, 1);

  /* Type */
  --vf-font-sans: "Inter Variable", system-ui, -apple-system, sans-serif;
}

[data-theme="dark"], :root[data-theme="auto"] {
  @media (prefers-color-scheme: dark) {
    --vf-surface-background: var(--vf-color-warm-950);
    --vf-surface-elevated: var(--vf-color-warm-900);
    --vf-text-primary: var(--vf-color-warm-50);
    /* ... */
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --vf-duration-fast: 0ms;
    --vf-duration-base: 0ms;
    --vf-duration-slow: 0ms;
  }
}
```

### `tokens.ts`

Typed token export for TS/JS consumers, with type narrowing for autocompletion.

```ts
export const tokens = {
  color: {
    gray: {
      50: "#FAFAFA",
      950: "#0A0A0A",
    },
  },
  surface: {
    background: "var(--vf-surface-background)",
    elevated: "var(--vf-surface-elevated)",
  },
  text: {
    primary: "var(--vf-text-primary)",
    secondary: "var(--vf-text-secondary)",
  },
  shadow: {
    card: {
      rest: "var(--vf-shadow-card-rest)",
      hover: "var(--vf-shadow-card-hover)",
    },
  },
  duration: {
    fast: "var(--vf-duration-fast)",
    base: "var(--vf-duration-base)",
  },
  ease: {
    standard: "var(--vf-ease-standard)",
  },
} as const;

export type Tokens = typeof tokens;
```

### `tokens.figma.json`

Figma Variables Import plugin format. See `figma-mcp-integration-protocol.md` for full spec.

## Property-based token tests (in addition to scalar validation)

Beyond "each token resolves," the token system must hold under properties applied across the *full* product:

### Property 1 — Contrast coverage
For every text token × every surface token × {light mode, dark mode, high-contrast variant}, the computed contrast meets the WCAG target level. Test the product over the *cartesian product* of pairs, not just a sample:

```
for text in [text.primary, text.secondary, text.tertiary, text.disabled, text.inverse, text.on-accent, ...]:
  for surface in [surface.background, surface.subtle, surface.elevated, surface.overlay, ...]:
    for mode in [light, dark]:
      assert contrast(text[mode], surface[mode]) >= target
```

Fail loud on any pair that misses target. Surface unreachable text+surface pairs (intentionally — some pairs are forbidden combinations like `text.disabled` on `surface.disabled`).

### Property 2 — Token resolution depth
Every Tier 3 token resolves to a Tier 2 in ≤ 1 hop. Every Tier 2 resolves to a Tier 1 in ≤ 1 hop. No circular references. No more than 3 hops total in any resolution chain.

### Property 3 — Mode parity
Every Tier 2 semantic token defined in `light` mode has a corresponding value in `dark` mode (and any other modes the product supports). Pairs symmetric.

### Property 4 — Naming consistency
Token names follow the documented convention. Every camelCase / kebab-case / dot-path mapping between the four export formats is reversible.

### Property 5 — Format equivalence
Generating `tokens.css`, `tokens.ts`, `tokens.figma.json` from the same `tokens.json` produces semantically equivalent output. Re-generating produces byte-equivalent output (idempotency).

### Property 6 — Component binding closure
Every token referenced in any component spec file exists in `tokens.json`. Every token defined in `tokens.json` is either:
- Referenced by at least one component, OR
- Marked `unreferenced` in the metadata (a holding slot for future use), OR
- Flagged as orphaned during validation.

### Property 7 — Reduced-motion fallback presence
Every motion token (`duration.*`, `ease.spring-*`) has documented reduced-motion behavior (typically: durations collapse to 0; spring becomes linear-instant).

### Property 8 — Color-blind safety on accent + state pairs
Every `accent.*` and `state.*` token, when displayed against the surface token it's intended for, passes color-blind simulation (deuteranopia / protanopia / tritanopia). For dataviz palettes (`dataviz.qual.*`), every pair within the palette is distinguishable under all three color-blind types.

### Property 9 — Build-pipeline determinism
Running the token build pipeline twice on the same `tokens.json` produces identical output. No timestamps, no environment-dependent variation in derived files.

### Test harness

These properties can be expressed as:

- TypeScript unit tests via `fast-check` (property-based) or hand-rolled exhaustive loops.
- Python via Hypothesis if the validation script grows.
- Or as part of the Storybook a11y addon's interaction tests.

Specify in `07-quality/design-ops.md` which test framework owns these properties, where the tests live (`tests/tokens/properties.test.ts` recommended), and how often CI runs them (every PR that touches `tokens.json` or any token consumer).

## Validation rules

The validation script `scripts/validate_design_docs.py` enforces:

1. Every Tier 2 token resolves to a Tier 1 primitive or another Tier 2 token (no orphans).
2. Every Tier 3 token resolves to a Tier 2 token.
3. Every token mentioned in any design doc exists in `tokens.json`.
4. Every component's bound tokens (in `12-component-system.md`) exist.
5. No raw hex / rgb / px / ms value appears in component docs — must reference tokens.
6. `tokens.css`, `tokens.ts`, `tokens.figma.json` are derivable from `tokens.json` (verify by regeneration).
7. Light and dark mode pairs exist for every `surface.*`, `text.*`, `border.*`, `shadow.*`, `accent.*`.
8. Every motion token has a `prefers-reduced-motion` fallback documented.

## Build pipeline note

Recommend Style Dictionary or a similar build pipeline so the four formats stay in sync from `tokens.json` source. VisualForge generates all four directly in the first pass; the project team should adopt a build pipeline before token edits.

## Naming rules

- Use `kebab-case` in CSS variables: `--vf-surface-background`.
- Use `dot.path` in JSON: `surface.background`.
- Use `camelCase.path` in TS: not used — prefer `surface.background` matching JSON.
- Use `/` in Figma variable names: `surface/background`.
- Prefix everything with `vf-` in CSS to avoid collision; no prefix in JSON/TS (the import provides namespace).
- No abbreviations except established ones: `bg`, `fg`, `lg`, `md`, `sm`.

## What never goes in tokens

- Component prop defaults (those live in component specs).
- Layout-specific spacing (use semantic space tokens or layout-grid tokens).
- One-off colors (always tier into primitives first).
- Brand asset URLs (those live in asset manifest).
- Copy strings (those live in content docs).
