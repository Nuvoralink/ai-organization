---
name: responsive-design
description: Build, redesign, fix, or audit responsive frontend interfaces so they feel native across phone, tablet, desktop, touch, pointer, portrait, and landscape contexts. Use for responsive layout work, mobile UX, tablet adaptation, breakpoint strategy, container queries, fluid type/spacing, touch targets, responsive images, dashboard reflow, data table adaptation, and cross-viewport verification.
---

# Responsive Design

Make interfaces feel native to every screen, not merely scaled down or stretched.

## Core Principle

Responsive does not mean shrinking. Each breakpoint is a redesign opportunity. A mobile layout is not a squished desktop; it has different priorities, gestures, reading patterns, and spatial constraints.

Use content-driven breakpoints where the design actually breaks. As starting anchors:

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

Write mobile-first base styles, then layer up with `min-width` queries. Use container queries for reusable components that should adapt to their parent:

```css
@container (min-width: 480px) {
  /* component adapts to container */
}
```

## Breakpoint Behavior

### Mobile Under 640px

- Single column for content layouts.
- Stack side-by-side elements vertically.
- Use full-width components with about 16 to 20px page padding.
- Put primary actions in the thumb zone, especially bottom anchored actions for task flows.
- Use progressive disclosure: summaries first, details behind accordions, tabs, or bottom sheets.
- Use bottom tab bar for 5 or fewer primary destinations, or a hamburger/full-screen overlay when needed.
- Never use horizontal scrolling nav as the main navigation.
- Body text and inputs must be at least 16px.

### Tablet 640px to 1024px

- Two columns max.
- Adapt to orientation: portrait tends stacked; landscape can support side-by-side.
- Side drawers can be persistent in landscape and collapsible in portrait.
- Keep 44px touch targets, but allow denser information than phone.

### Desktop 1024px Plus

- Use multi-column layouts and persistent navigation.
- Cap content width around 1200 to 1400px; do not stretch across wide displays without intent.
- Hover states, tooltips, previews, and keyboard shortcuts are desktop enhancements, never the only way to act.
- Show more simultaneous information: data tables, comparison layouts, multi-panel dashboards.
- Do not use hamburger navigation as the default desktop pattern.

## Touch Rules

- Minimum touch target: 44 by 44px, or 48 by 48dp for Material-style interfaces.
- Keep at least 8px between adjacent targets.
- Any hover-triggered UI must have a tap alternative.
- Swipe can dismiss, navigate, or reveal list actions when natural.
- Pull-to-refresh belongs to feeds/lists, not forms.
- Long press can open contextual menus, but always provide a visible alternative.
- On phones, avoid putting critical actions in top corners.

## Layout Adaptation Patterns

- Split layout: desktop side-by-side; tablet landscape tighter side-by-side; tablet portrait/mobile stacked, often image first.
- Sticky or scroll-linked sections: desktop/tablet landscape only; shorten or remove on portrait tablet; disable on mobile.
- Grid galleries: desktop 3 to 4 columns; tablet 2 columns; mobile 1 column or intentional snap carousel.
- Data tables: desktop full table; tablet horizontal scroll with frozen first column when possible; mobile cards with stacked label/value pairs.
- Dashboards: desktop multi-panel; tablet 2-column; mobile single column with tabs or segmented controls for panel groups.
- Hero typography: use `clamp()`, tune line-height by breakpoint, and reduce decorative elements on mobile.
- Horizontal carousels: desktop full row or arrows; mobile snap scroll with a visible partial next item.

## Fluid Sizing

Use fluid primitives instead of hardcoding every breakpoint:

```css
font-size: clamp(1rem, 0.5rem + 1.5vw, 1.25rem);
padding: clamp(1rem, 3vw, 3rem);
gap: clamp(0.75rem, 2vw, 2rem);
max-width: min(90vw, 1200px);
```

- Use `clamp()` for type, padding, gaps, and smooth scaling.
- Use `min()`/`max()` for hard limits.
- Use `%` plus `max-width` for flexible containers.
- Use `dvh`, not `vh`, for mobile full-screen sections.
- Never use `vw` alone for font size; clamp it.

## Mobile Performance

- Lazy load below-fold images and heavy components.
- Use `srcset` and `sizes` for responsive images.
- Set explicit `width`/`height` or `aspect-ratio` on media to avoid layout shift.
- Respect `prefers-reduced-motion`; disable parallax, complex scroll animation, and unnecessary autoplay on mobile.
- Reduce expensive decorative effects on mobile.
- Prioritize critical above-the-fold CSS and defer noncritical work.

## Hard Rules

- Never hide core functionality on mobile. Rework it.
- Never rely on hover for essential interactions.
- Never use the same layout at every breakpoint with only smaller sizes.
- Never forget mobile landscape.
- Never serve desktop-sized images to mobile.
- Always use `dvh` instead of `vh` for mobile full-screen sections.
- Inputs must be at least 16px to avoid iOS zoom.
- Avoid horizontal page scroll except intentional carousels or controlled table overflow.

## Verification Checklist

Before shipping responsive work, verify:

- 320px viewport.
- 375px viewport.
- 768px portrait and landscape.
- 1024px to 1440px desktop range.
- No accidental horizontal scroll.
- Touch-only navigation works.
- Core actions work without hover.
- Body text and inputs are readable without zoom.
- Reduced-motion mode disables complex animation.
- Dark mode/prefers-color-scheme still works if supported.
- Images/media keep aspect ratio and do not cause layout shift.

For frontend changes, prefer visual verification with browser screenshots across phone, tablet, and desktop.
