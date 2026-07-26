---
name: visualforge-design-trends-research
description: Research current design movements (Liquid Glass, Material 3 Expressive, bento, AI-native chrome, spatial UI, soft brutalism, etc.) and make adoption / rejection decisions specific to this product.
---

# Design Trends Research and Adoption Decisions

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-research-rules.md`, `design-decision-quality-protocol.md`, `current-design-source-map.md`.
- Use `opinionated-decision-template.md` for every adopt / reject decision.
- **Every trend must be researched, then trend-fit tested, then decided. Never adopt because it is trendy. Never reject because it is trendy.**
- Label every adoption as Research-backed with sources.

## Purpose

Make explicit adoption or rejection decisions about the current design movements relevant to this product, so all downstream subskills (brand, tokens, surfaces, motion, components) inherit a clear stance instead of accidentally drifting.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Full trend research and decision pass.
- **Retrofit:** Same — produce ideal trend stance regardless of what the existing product does. If existing product already uses a trend, audit whether it is well-implemented and whether to keep or refresh.

## Required research pass

For each candidate trend, find:

1. The defining specification, article, or product that established it.
2. Three shipping products currently using it (named, with URLs).
3. The platform / browser support and fallback story.
4. The performance cost on the target device tier.
5. The accessibility implications.
6. At least one published critique or limitation.

```text
Research the current state of [trend name] as of 2026. Capture: origin / canonical source, three shipping examples with URLs, platform support and known browser / OS limitations, performance cost, accessibility risks, and one critical perspective. Cite sources with dates.
```

Record each trend in `research-ledger.md`.

## Candidate trends to evaluate

Evaluate each. For each, produce an adopt / adapt / reject decision. If you skip a trend, document why.

### Surface and material
- **Liquid Glass (Apple, iOS 26 / macOS 26)** — multi-layer translucent material with environmental light response.
- **Glassmorphism (web)** — backdrop-filter blur with low-opacity fills.
- **Neumorphism / soft UI** — inset+outset shadows simulating physical relief.
- **Soft brutalism** — high-contrast type, exposed structure, with warmth via color and curve.
- **Material 3 Expressive surfaces** — shape variation, emphasis ramp, color-channel-driven elevation.
- **Editorial / publication** — large-type, narrative layouts, generous whitespace.

### Color and theme
- **OKLCH-based palettes** — perceptually uniform, P3-aware.
- **Dynamic color (Material You)** — user-image-derived palettes.
- **Warm-leaning neutrals** — moving away from cool grey.
- **High-saturation accent + neutral canvas** — accent isolation.
- **Multi-mode (light / dark / dim / auto / high-contrast)**.

### Layout and structure
- **Bento grids** — modular tiles of varied sizes.
- **Asymmetric layouts** — intentional imbalance for energy.
- **Subgrid / container-query layouts** — component-driven responsive.
- **Spatial / depth-layered UI** — parallax Z layers.
- **Dense data canvases** — Linear / Notion / Pitch style information density.

### Interaction and motion
- **Spring physics for everything** — replaces tween easing.
- **Scroll-driven animation (CSS)** — `animation-timeline: scroll()`.
- **View Transitions API** — page and same-doc transitions.
- **Magnetic / sticky cursors and hover** — accessibility cost.
- **Streaming / generative chrome** — token-by-token UI for AI.

### Typography
- **Variable fonts with stylistic axes** — single-file, programmatic.
- **Serif comebacks** — display serifs for warmth.
- **Mono-display hybrid** — using mono in display for technical brands.
- **Fluid type with `clamp`** — viewport-adaptive sizing.

### AI / agent surfaces
- **Prompt-first input** — command bar as primary entry.
- **Streaming text UI** — appearing-character animation.
- **Suggestion chips** — inline completion previews.
- **Source-cite chrome** — inline references in generated content.

### Other
- **Cursor design** — custom cursors with hover states.
- **Anchor-positioned tooltips and popovers** — declarative placement.
- **Reduced-motion-first** — motion as enhancement, not foundation.
- **Pointer-coarse adaptations** — touch-first variants of pointer-designed UI.

## Inputs

- Design brief (`01-design-brief.md`).
- User personas (`02-user-personas.md`).
- Competitive audit (`03-competitive-audit.md`).

## Output files

- `docs/design-system/01-foundations/design-trends-research.md`
- Decision-log entries (DEC-070 to DEC-084, overflow DEC-085 to DEC-089) per `../_visualforge-shared/references/decision-id-allocation.md`.
- Research-ledger entries per trend.

## Decision structure

For each trend evaluated, produce:

```markdown
### [DEC-NNN] Trend — [trend name]

**Decision:** Adopt | Adapt (with modifications) | Reject

**Trend-fit test (per anti-slop-design-rubric.md):**
1. Audience expectation: yes / no — [reason]
2. Platform support and performance: yes / no — [reason]
3. Brand fit: yes / no — [reason]
4. Cost vs design lift: justified / not — [reason]
5. Documented fallback exists: yes / no — [reason]

**If adopt or adapt:**
- Surfaces where applied: [list]
- Tokens introduced: [list]
- Fallback behavior: [for unsupported devices, reduced-motion users, low-power mode]
- Performance budget impact: [estimate]
- Accessibility impact: [risks and mitigations]

**If reject:**
- Why considered: [trend's apparent appeal]
- Why rejected: [specific failure of the trend-fit test]
- What we use instead: [the alternative direction]

**Evidence:**
- [3 sources with URLs and dates]
- [3 shipping products using the trend]
- [1 critique]

**Confidence:** ...
**Reversal trigger:** ...
```

## Adoption rules

**Adopt** a trend only when all five trend-fit checks pass. Default to rejection on tie.

**Adapt** a trend when its core idea fits but a property needs modification (e.g., "Liquid Glass surfaces only on top navigation, not on cards; full opacity in low-power mode; high-contrast variant disables glass entirely").

**Reject** a trend when any trend-fit check fails. Rejection is a valid decision and must be recorded — future contributors need to see what was considered and dismissed.

## Multi-trend interaction rules

Some trends conflict or compound. Document conflicts:

- Liquid Glass + bento + heavy shadows → visual noise, perf hit. Pick one dominant surface treatment.
- Spring motion + reduced-motion users → must have spring → tween → none cascade.
- Dynamic color + brand color lock → cannot coexist; pick one.
- AI streaming chrome + accessibility AA — text appearance must announce to screen readers correctly.

For each detected conflict, log a `Conflict resolution` decision.

## Anti-slop trend rules

- "Glassmorphism is back" is not an adoption rationale.
- Citing one tweet or roundup as the source is research-slop.
- Adopting because "it looks cool" fails the trend-fit test.
- Rejecting because "it's trendy" fails the trend-fit test.
- Skipping a trend because it's unfamiliar is rejection without research.

## Quality gate

- Every candidate trend has an explicit adopt / adapt / reject decision.
- Every adoption passes the five-check trend-fit test with evidence.
- Every rejection records why.
- Multi-trend conflicts identified and resolved.
- Trend decisions surface as token additions, component constraints, or motion constraints in downstream subskills.

## Sources and basis

Per-trend sources in research-ledger. Summarize the dominant trends adopted and rejected with confidence levels.
