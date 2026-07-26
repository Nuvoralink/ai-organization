---
name: visualforge-iconography
description: Select icon library, define stroke weight / corner radius / grid size, set sizing scale, build semantic icon map (which icon means what), and define icon animation rules.
---

# Iconography

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `current-design-source-map.md`, `visual-default-breakers.md`.
- Use `opinionated-decision-template.md`.
- Library + version locked, not "use icons that match the design."
- Every common UI need has a specific icon assigned, not "use whatever fits."
- Icon style is part of visual taste — must align with `brand-identity.md` DEC-095 (iconography style direction) and the narrative spine (DEC-100). Generic developer-library icon defaults fail per `visual-default-breakers.md` §9 (decoration without purpose).
- Maintain `decision-log.md`.

## Purpose

Icons are functional + brand. They must be: consistent in style, readable at size, semantically stable (one concept → one icon, always), and accessible (never icon-only without a label, except where conventions make meaning unambiguous).

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Choose library, define style and scale, map icons to semantic needs.
- **Retrofit:** Inventory existing icons (file paths, sizes, weights). Decide whether to swap library or keep. If keep: lock current convention. If swap: drift entry.

## Required research pass

```text
Research current icon library options as of 2026: Lucide, Phosphor, Heroicons, Tabler, Radix Icons, Material Symbols, SF Symbols, Iconoir. Capture: licensing, weight options, count, grid size, stylistic character, animation capability, language support (RTL mirroring conventions), tree-shaking, framework integrations. Identify which library best matches [brand iconography philosophy] from the brand identity doc.
```

## Inputs

- Brand identity (`05-brand-identity.md`) — iconography philosophy.
- Design tokens — sizing scale.
- Platform (web / iOS / Android / multi) — determines library compatibility (SF Symbols only for Apple).

## Output files

- `docs/design-system/02-visual-language/iconography.md` — narrative, library decision, style parameters, sizing, animation rules.
- `docs/design-system/icons/semantic-map.md` — comprehensive icon-to-concept mapping table.
- `docs/design-system/icons/custom/` — custom icon SVGs if any.
- Decision-log entries (DEC-200 to DEC-219, overflow DEC-220 to DEC-224) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Library decision

- **Library:** Lucide / Phosphor / Heroicons / Tabler / Radix / Material Symbols / SF Symbols / Iconoir / custom-only / library + custom.
- **Version:** lock to a specific version.
- **License:** confirmed compatible with product license.
- **Why this library:** matches stroke character + weight options + count + framework integration.
- **Why not the alternatives:** one line each.

### 2. Style parameters

- **Weight (stroke width):** if outline-style, exact stroke width (e.g., Lucide default 2px, Phosphor regular).
- **Fill posture:** outline / solid / duotone / mixed. If mixed, what triggers which.
- **Corner radius:** matches global radius character.
- **Grid size:** native grid of the library (e.g., 24×24 for most web libraries).
- **Optical alignment:** every icon centered on its optical center, not its bounding box.

### 3. Sizing scale

| Token | px | Use case |
|---|---|---|
| `icon.xs` | 12 | dense lists, badges |
| `icon.sm` | 16 | inline with body text, default UI |
| `icon.md` | 20 | larger UI, primary buttons |
| `icon.lg` | 24 | feature icons, larger touch targets |
| `icon.xl` | 32 | empty states, hero accents |
| `icon.2xl` | 48 | empty-state illustrations (icon-only) |

Rules:

- Icons at 16px and 20px should be hairline-precise (1.5px stroke equivalent).
- Below 16px, prefer Material Symbols Mini, Heroicons Mini, or a dedicated mini set.
- Above 32px, consider switching to illustration.

### 4. Color rules

- Default icon color: `text.secondary` or `text.tertiary`.
- Active / selected: `accent.primary`.
- Disabled: `text.disabled`.
- State icons (success / warning / danger / info): semantic state tokens.
- Brand-color icons (signature only): allowed in specific brand moments.

### 5. Touch target rules

- Tappable icons get ≥ 44×44 (iOS) / 48×48 (Android) / 24×24 effective (WCAG 2.5.5 target).
- Visual icon may be smaller (16/20/24), with padding to reach target size.
- Icon-only buttons: always include `aria-label` and visible tooltip on hover or focus.

### 6. RTL handling

- Directional icons (arrow, chevron, undo/redo, back, forward) mirror in RTL by default.
- Non-directional icons (search, settings, gear, heart) do not mirror.
- Icons containing numerals or text in glyph form: do not mirror, replace with localized version.
- Document the per-icon RTL behavior in the semantic map.

### 7. Semantic icon map

The single source of truth for "which icon for what concept." For every common UI concept, lock one icon:

| Concept | Icon (library) | Outline / Filled | Use |
|---|---|---|---|
| Navigation: home | `house` | outline default, filled active | top-level nav |
| Navigation: search | `search` | outline | global search |
| Navigation: settings | `settings` | outline | settings |
| Navigation: account | `user-circle` | outline | profile / account |
| Action: add | `plus` | outline | primary add |
| Action: edit | `pencil` | outline | inline edit |
| Action: delete | `trash-2` | outline | destructive |
| Action: more | `more-horizontal` | outline | overflow menu |
| Action: filter | `sliders-horizontal` | outline | filter UI |
| Action: sort | `arrow-up-down` | outline | sort UI |
| State: success | `check-circle-2` | filled | success state |
| State: warning | `alert-triangle` | filled | warning |
| State: error | `alert-circle` | filled | error |
| State: info | `info` | filled | info |
| State: loading | `loader` | spinner | loading state |
| Direction: back | `arrow-left` | outline | back nav (mirror RTL) |
| Direction: forward | `arrow-right` | outline | forward nav (mirror RTL) |
| Direction: expand | `chevron-down` | outline | expandable |
| Direction: external | `arrow-up-right` | outline | external link (mirror RTL) |
| Content: image | `image` | outline | image placeholder |
| Content: file | `file` | outline | generic file |
| Content: link | `link` | outline | hyperlink |
| Comms: notify | `bell` | outline default, filled active | notifications |
| Comms: message | `message-square` | outline | chat / message |
| Status: online | `circle` filled | filled `state.success` | online indicator |
| Visibility: shown | `eye` | outline | show |
| Visibility: hidden | `eye-off` | outline | hide |
| Auth: lock | `lock` | outline | locked |
| Auth: unlock | `lock-open` | outline | unlocked |

Extend this map exhaustively for the product's domain. Every domain-specific concept gets one icon, locked.

### 8. Icon-only button labeling rules

- Mandatory `aria-label`.
- Mandatory visible tooltip on hover and focus.
- Mandatory exception list: a small set of universally-recognized icons (search, close, menu) may omit visible tooltip — but never omit aria-label.

### 9. Custom icons

When a needed concept has no library match:

- Design at the library's native grid (typically 24×24).
- Match the library's stroke weight / corner radius / optical character exactly.
- Test at all sizes in the sizing scale.
- Place in `docs/design-system/icons/custom/[concept].svg`.
- Register in the semantic map.

### 10. Icon animation rules

- **Allowed animations:**
  - State-change morph (heart fill on like, menu → close on toggle, plus → check on add-confirmed).
  - Spinner / loader.
  - Subtle hover scale (≤ 1.05) for icon-only buttons with strong affordance need.
- **Forbidden animations:**
  - Continuous looping animation on idle icons.
  - Bounce on hover for non-action icons.
- **Reduced-motion:** all animations except spinner reduce to instant. Spinner reduces to subtle opacity pulse or static "Loading…" text.
- **Implementation:** SVG line animation for morphs, CSS transform for hover, library spinner for loaders.

### 11. Performance rules

- Tree-shake the icon library (import per-icon, not the whole library).
- Inline-SVG for icons in critical path; sprite-sheet for high-count repeat icons in lists.
- Cache via build pipeline; never load icons from a CDN at runtime for primary UI.

## Decision cards

- DEC-200 Icon library + version.
- DEC-201 Style parameters (weight, fill, radius).
- DEC-202 Sizing scale + tokens.
- DEC-203 Semantic icon map (the full table).
- DEC-204 RTL behavior policy.
- DEC-205 Icon animation policy.
- DEC-206 Custom-icon design rules.

## Anti-slop iconography rules

- "Use clean modern icons" fails.
- "We'll choose icons as we build" fails — semantic map locks before component-system runs.
- A different icon for the same concept in two places fails.
- Library mix-and-match (Lucide for some, Material for others) is a brand failure.
- Icon-only buttons without aria-label fail a11y gate.

## Quality gate

- Library chosen with version lock and license confirmed.
- Style parameters specified with exact values.
- Sizing scale tokenized.
- Semantic map covers all common UI concepts plus domain-specific.
- RTL behavior specified per icon class.
- Animation policy explicit.
- Custom-icon files (if any) match library character.

## Sources and basis

Library research with sources, RTL conventions per W3C / platform docs, animation guidance from Material 3 / Apple HIG.
