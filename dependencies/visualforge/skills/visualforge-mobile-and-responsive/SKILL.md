---
name: visualforge-mobile-and-responsive
description: Mobile UX patterns (bottom sheets, thumb zones, safe areas, predictive back), iOS/Android native specifics, foldables, tablet, sub-360 small phones, landscape phone, ultra-wide and 4K/5K monitors, Windows display scaling, browser zoom 200%/400% (WCAG 1.4.10), multi-window, hi-DPI.
---

# Mobile and Responsive Depth

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `visual-default-breakers.md`.
- Use `opinionated-decision-template.md`.
- Every device class has a concrete contract: layout behavior, input mode, gestures, performance budget.
- Browser zoom contract: 200% and 400% (WCAG 1.4.10) reflows correctly.
- Maintain `decision-log.md`.

## Purpose

The base layout subskill covers breakpoints. This subskill covers what happens at the *edges* — the screens that break naïve responsive design: small phones, foldables, tablets, ultra-wide, hi-DPI, zoomed-in viewports, multi-window browsers. This is where most products break visibly.

## Mode-aware behavior

- All modes: produce explicit device-class contracts.
- **Retrofit:** Inventory existing breakpoint behavior across these classes; produce ideal; drift entries.

## Required research pass

```text
Research current responsive design conventions as of 2026: iOS safe area insets (Dynamic Island devices, iPad), Android edge-to-edge + predictive back gesture, foldable / dual-screen layouts (Samsung Z Fold, Pixel Fold, Surface Duo), tablet UX (iPad Stage Manager, multi-window), browser zoom requirements (WCAG 1.4.10 reflow at 400%), Windows display scaling, container queries, CSS env(safe-area-inset-*), interactionhint media queries (pointer:coarse, hover:hover). Capture sources.
```

## Inputs

- Personas device matrix.
- Layout system breakpoints.
- Component system responsive behavior.
- Brand identity (motion / surface tolerance on mobile vs desktop).
- Accessibility contract.

## Output files

- `docs/design-system/03-structure/mobile-and-responsive.md`
- Decision-log entries (DEC-280 to DEC-304, overflow DEC-305 to DEC-309) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Section 0 — Platform mode lock (anti-LLM-default, added per VF-FIND-034)

Before any device class is contracted, lock the **platform mode**. This is the highest-leverage anti-slop decision in the mobile layer — without it, every screen drifts into an unowned hybrid that reads neither iOS-native nor Android-native nor cross-platform-neutral.

### Choose one

1. **iOS-native premium** — biases toward elegant restraint and native-feeling hierarchy.
   - Clean top areas, tab-bar clarity, safe-area awareness, restrained chrome, calm spacing.
   - Native-feeling sheets / cards / pickers; SF Symbols or matched icon family.
   - Dynamic Island awareness on supported devices.
2. **Android-native premium** — biases toward stronger component rhythm and explicit state.
   - Material 3 navigation bar at bottom; FAB for one primary action per screen.
   - Explicit app-bar / sheet logic; firmer layout framing.
   - Edge-to-edge with explicit window-inset handling; predictive back (Android 14+).
3. **Cross-platform premium neutral** — biases toward universal patterns that read clean on either OS.
   - Clean safe-area handling on both platforms.
   - Universal mobile navigation patterns (bottom tab + sheets); less platform-specific ornament.
   - Premium but broadly buildable visual language.

### Anti-pattern: phone-shaped website

The most common mobile design failure is producing a layout that's a desktop website squeezed into a phone frame. This fails platform-mode review regardless of which mode is chosen. Mobile screens must read **app-native**:

- No website-style hero with multi-line marketing tagline above the fold.
- Tab bar or bottom nav present where the app archetype calls for it (not a hamburger drawer hiding everything).
- Touch targets ≥ 44×44 (iOS) / 48×48 (Android).
- Safe areas respected (top status bar, bottom home indicator).
- First viewport has one primary focal point — not 12 widgets fighting for attention.

### First-screen cleanliness rule

The first screen the user sees (welcome / home / dashboard / sign-in) must be **calm and immediately readable**:

- One primary focal point.
- Headline ≤ 3 short lines.
- Concise supporting text.
- One clear next action.
- No cluttering pills, fake stats, micro-labels, or stacked cards.

### Mockup presentation default

When generating mobile screens for review (in design docs, prototypes, or design-system showcase), present the UI inside a **clean phone mockup** with a visible but subtle device frame. The mockup should support the content, not overpower it:

- One coherent device style across the whole screen set.
- Consistent device scale across screens.
- Balanced outer canvas margins (top, bottom, left, right).
- Soft, controlled shadows.
- Focus stays on the UI content inside the phone.

Raw screen-only output (no device frame) is acceptable when the user explicitly asks for it or the concept demonstrably benefits from edge-to-edge framing.

### Decision cards

- DEC-302 Platform mode lock (iOS-native / Android-native / cross-platform-neutral) — required, per VF-FIND-034. *(In allocated range DEC-280–304 per `decision-id-allocation.md`.)*
- DEC-303 First-screen cleanliness rule cite (applies to welcome / home / sign-in) — required.
- DEC-304 Mockup presentation default for design-system artifacts — required when design docs include mobile mockups.

## Device class contract

For each class, document layout shell, primary navigation, input expectations, gestures, performance ceiling, and known traps.

### Small phone (≤ 360 CSS px wide)
- Layout: single column, large touch targets, every primary action thumb-reachable.
- Nav: bottom tab bar (3–4 items max) OR hamburger drawer.
- Type: floor sizes; do not shrink body below 14px.
- Tables: convert to stacked cards.
- Modals: full-screen sheet, not centered card.

### Mainstream phone portrait (361–430 CSS px)
- Default mobile layout.
- Bottom tab bar (4–5 items).
- Safe area top + bottom respected.
- Bottom sheets from bottom edge.

### Phone landscape
- Top bar may collapse height.
- Bottom tab bar lifts to side (rail) on landscape ≥ 600px width.
- Single column may become 2-column for content-light screens.
- Watch for keyboard covering inputs.

### Tablet portrait (≥ 600 effective)
- Not phone, not desktop.
- Side rail can show (collapsed by default in tablet portrait).
- Multi-pane patterns: list + detail side-by-side.
- Modals: medium centered, not full-screen.
- Touch primary input still — keep targets ≥ 44.
- Stage Manager / split-view: container queries handle gracefully.

### Tablet landscape (≥ 900)
- Closer to desktop.
- Side rail expanded.
- Multi-pane native.
- Optional support for external keyboard (Cmd/Ctrl shortcuts).

### Foldables (dual-screen / hinge)
- **Hinge avoidance:** detect hinge via `env(viewport-segments)` / Window Segments API; avoid placing primary content / CTAs over the hinge.
- **Dual-screen layouts:** content on one half, controls on the other.
- **Continuity:** state preserves when folding / unfolding.

### Laptop (1024–1439)
- Standard desktop layout.
- Mouse + keyboard primary.
- Hover affordances active.

### Desktop (1440–2559)
- Default reference design.
- Container max-width caps growth.

### Ultra-wide (≥ 2560 width / 21:9 / 32:9)
- Container max-width prevents stretching.
- Optionally: 2-column body for content, 3-column for dashboards.
- Reserved chrome (e.g., command palette, secondary panels) may live on the side.

### 4K / 5K hi-DPI
- Pixel density 2x–3x.
- Use SVG and 2x raster assets.
- Test typography at high density; type that looks crisp on 1x may feel thin on 3x.

### Windows display scaling 125 / 150 / 175 %
- CSS px adapts automatically — but verify layout doesn't break (some apps test only 100%).
- Test at each scaling level.

### Browser zoom 200% (WCAG 1.4.10 mandatory)
- Layout reflows; no horizontal scroll except for data tables, code blocks, full-screen media.
- Fixed-position elements (modals, sticky nav) remain usable.
- Text scales with the browser, not capped.

### Browser zoom 400% (WCAG 1.4.10 mandatory)
- Effective viewport at 1280×1024 base becomes ~320 wide CSS px — basically a phone layout.
- Layout must reflow to small-phone class.
- Verify primary tasks remain completable.

### Browser zoom — text-only (WCAG 1.4.4)
- 200% text-only zoom (Firefox supports) without breaking layout.
- Use `rem` for type, not `px`.

### Multi-window / resizable browser
- Component design adapts via container queries, not just viewport queries.
- Test at 480 / 600 / 800 / 1000 wide windows independently.

### Small popout / extension window
- Some product surfaces run in a 360×600 popout (browser extension, side panel).
- Verify essential flows work in popout.

## Mobile-specific UX patterns

### Bottom sheet
- Initial peek height typical 30–50% viewport.
- Drag to expand / dismiss.
- Snap points: peek / mid / full.
- Backdrop scrim when expanded.
- Spring physics.
- iOS native sheet style available via `dialog` + sheet styling; Android Material sheet.

### Drawer (side)
- 80–85% viewport wide on mobile.
- Slide in 220ms ease-decelerate.
- Backdrop scrim.
- Swipe-from-edge to open (when not conflicting with browser back-swipe).
- Dismiss on backdrop tap.

### Thumb zone
- Designed for thumb reach.
- Primary actions in lower 60% of viewport.
- Top bar reserved for header / status, not primary tap targets.
- Test: "could the user one-handed-thumb-tap every primary action?"

### Safe areas (iOS)
- `env(safe-area-inset-top / right / bottom / left)`.
- Bottom: home indicator area.
- Top: notch / Dynamic Island.
- Honored on full-bleed surfaces.

### Predictive back gesture (Android 14+)
- Swipe-from-edge previews the back destination.
- Requires opting in via root activity; affects animation timing.
- Cross-document View Transitions support predictive back when adopted.

### Pull to refresh
- 80px threshold; spring snap-back.
- Only on content surfaces; never on settings/forms.
- Alternative refresh button always present for keyboard a11y.

### iOS-specific
- Large title at top that shrinks on scroll.
- Sheet presentation styles (page sheet, form sheet).
- Refresh control (UIKit-style spinner from top).
- Dynamic Island activity indicators (for apps that integrate).

### Android-specific
- Edge-to-edge with explicit window inset handling.
- FAB (floating action button) for one primary action; one per screen max.
- Material 3 navigation bar at bottom.
- Snackbar for transient feedback.

## Container queries everywhere

Mobile-responsive is no longer just viewport queries. Components query their own container:

- Card resizes its internal layout when placed in a narrow column.
- Filter bar collapses to icon-only when its container is < 400px.
- Data table converts to stacked rows when container < 600px.

Document the container-query strategy: which components use container queries, what break points each uses.

## Hover and pointer queries

- `@media (hover: hover) and (pointer: fine)`: pointer devices — full hover state.
- `@media (hover: none) and (pointer: coarse)`: touch — no hover, focus on tap.
- `@media (any-hover: hover)`: at least one input method supports hover — useful for hybrid (laptop with touchscreen).

Components respect these media queries.

## Reduced-motion / data / transparency in mobile context

- Reduced motion on mobile is more common than desktop (battery / vestibular).
- Reduced data: defer non-essential network on `Save-Data: on` header.
- Reduced transparency: glass → opaque.

## Performance on mobile

- Target: 60fps on 3-year-old mid-range Android (e.g., Pixel 6a, Samsung A series).
- LCP budget: target tier from design brief; mobile typically 2.5s on 4G.
- Layout shifts: zero CLS on initial load.
- Bundle size: aggressive split for mobile-only routes.

## Decision cards

- DEC-281 Device class matrix and per-class contract.
- DEC-282 Foldable / hinge handling.
- DEC-283 Tablet pattern (multi-pane / single-pane / hybrid).
- DEC-284 Mobile primary nav (bottom tab vs drawer vs hybrid).
- DEC-285 Bottom sheet adoption + spec.
- DEC-286 Thumb-zone enforcement.
- DEC-287 Safe-area handling.
- DEC-288 Predictive back adoption.
- DEC-289 Browser zoom 200% + 400% reflow contract.
- DEC-290 Ultra-wide / hi-DPI / multi-window contract.

## Anti-slop responsive rules

- "It's responsive" without device-class contracts — fails.
- "Mobile-first" without small-phone (≤ 360) treatment — fails.
- "We'll test on phone and desktop" without foldable / tablet / ultra-wide / zoomed — fails.
- Hamburger menu on desktop without justification — usually slop.
- No safe-area inset handling on iOS full-bleed — fails.
- WCAG 1.4.10 reflow at 400% not verified — fails AA.
- No Platform Mode lock (Section 0) — fails per VF-FIND-034.
- Mobile screens read as "phone-shaped website" — fails per Section 0.
- First-screen specification overloads the first viewport — fails per Section 0.

## Quality gate

- Every device class has a contract.
- Mobile UX patterns documented with spec.
- Container query strategy explicit.
- Hover / pointer query handling.
- Browser zoom 200% + 400% verified for layout reflow.
- Foldable and tablet treated as first-class.

## Sources and basis

Per-decision tied to device class research, persona device matrix, WCAG 2.2, and current platform conventions (Apple HIG, Material 3).
