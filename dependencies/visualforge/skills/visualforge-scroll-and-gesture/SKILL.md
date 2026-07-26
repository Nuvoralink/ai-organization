---
name: visualforge-scroll-and-gesture
description: Scroll physics, smooth-scroll, snap, parallax, scroll-driven animation, sticky and pinned behavior, scrollbar styling, pull-to-refresh, swipe and touch gestures, scroll-restoration policy.
---

# Scroll and Gesture

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md`.
- Every scroll behavior has: trigger, observable effect, performance budget (paint cost, frame target), accessibility fallback, reduced-motion fallback, platform variations.
- Never override native scroll without a strong reason — scroll-jacking ruins accessibility and feel.
- **Timing tokens (duration / easing) source of truth: `visualforge-motion-design`.** Cite by name; never re-declare numeric values (per VF-FIND-039).
- Maintain `decision-log.md`.

## Purpose

Scroll is the most-used interaction in the product. Custom scroll effects can elevate or destroy feel. This subskill makes every scroll-related decision explicit, including the decision to keep things native.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Decide scroll philosophy, then specify per-surface behavior.
- **Retrofit:** Audit existing scroll effects; produce ideal; drift entry.

## Required research pass

```text
Research current scroll patterns as of 2026: CSS scroll-snap, scroll-driven animation (animation-timeline: scroll()), View Transitions API, anchor-positioning for sticky elements, scrollbar styling (scrollbar-width, scrollbar-color, ::-webkit-scrollbar), pull-to-refresh implementations, gesture libraries (use-gesture, framer-motion gestures), Apple-style elastic scroll, momentum scroll. Capture sources.
```

## Inputs

- Brand identity — motion personality (restrained vs expressive).
- Personas — motion sensitivity, primary input mode.
- Adopted trends (`04-design-trends-research.md`) — parallax / scroll-driven animation decisions.
- Layout system — sticky regions, scroll containers.
- Performance budget.

## Output files

- `docs/design-system/04-interaction/scroll-and-gesture.md`
- Decision-log entries (DEC-640 to DEC-664, overflow DEC-665 to DEC-669) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Scroll philosophy

Pick one as primary:

- **Native everywhere:** trust the platform. Native scroll, native scrollbars, native momentum. Best for: utility tools, accessibility-first, anything where speed is the priority.
- **Native + light enhancements:** native scroll, custom scrollbar styling, smooth-scroll for in-page anchors. Best for: most products.
- **Native + scroll-driven decorations:** native scroll plus opt-in scroll-driven animation on specific surfaces (hero, reveal-on-scroll). Best for: marketing-heavy products.
- **Custom scroll (scroll-jacked):** Reject by default. Only acceptable for specific spatial / portfolio experiences where the experience *is* the scroll. Document the trade-offs (a11y cost, keyboard hostile, momentum unfamiliar).

### 2. Smooth scroll behavior

- **In-page anchor links (#section):** `scroll-behavior: smooth` on root; honors `prefers-reduced-motion`.
- **Programmatic scroll (e.g., scroll-to-element after action):** smooth by default with reduced-motion fallback.
- **Scroll restoration on route change:** SPA must implement; restore previous position on back, scroll to top on forward.

### 3. Scroll-snap (if adopted)

- **Where:** carousels, horizontal section paginations, mobile bottom-sheet stops.
- **Snap type:** mandatory / proximity.
- **Snap stop alignment:** start / center / end.
- **Per-carousel spec:** items per view, snap point, momentum behavior.
- **Reduced-motion:** snap still works (it's positioning, not animation).
- **Touch:** native momentum honors snap.

### 4. Sticky regions

- **Top nav:** `position: sticky; top: 0` with `z-index: nav`.
- **Sub-nav / tab bar:** sticky below top nav when scrolled past.
- **Side rail:** sticky and full-height with internal scroll.
- **Section titles in long pages:** sticky for orientation.
- **Sticky shadow on scroll:** sticky element gains shadow when content scrolls beneath (use IntersectionObserver or scroll-driven animation).

### 5. Scrollbar styling

For products on platforms where scrollbars are visible (web desktop primarily):

- **Decision:** native scrollbars / styled scrollbars / overlay-only.
- **Styled spec:**
  ```css
  /* Modern */
  scrollbar-width: thin;
  scrollbar-color: var(--vf-border-strong) transparent;

  /* WebKit fallback */
  &::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--vf-border-strong);
    border-radius: 8px;
    border: 3px solid transparent;
    background-clip: content-box;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--vf-text-tertiary);
  }
  ```
- **Accessibility:** ensure scrollbar is still discoverable; minimum 12px wide for pointer; never hide if scroll is the only way to reveal content.
- **Touch:** native overlay scrollbars; no custom styling needed on touch-primary platforms.

### 6. Scroll-driven animation (if adopted)

Modern CSS `animation-timeline: scroll()` and `animation-timeline: view()` enable native scroll-driven effects.

- **Where to use:** hero entry, reveal-on-scroll for marketing sections, progress indicators.
- **Where NOT to use:** functional UI (forms, dashboards), dense content (lists, tables).
- **Performance:** native scroll-driven anim runs on compositor thread — cheap. JS-based scroll listeners are not — avoid.
- **Fallback:** for browsers without support, elements render at final state (no animation).
- **Reduced motion:** all scroll-driven animations disable; final state renders immediately.

Recipe template:

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.reveal-on-scroll {
  animation: reveal both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll {
    animation: none;
  }
}

@supports not (animation-timeline: view()) {
  .reveal-on-scroll {
    /* IntersectionObserver fallback handled in JS */
  }
}
```

### 7. Parallax (if adopted)

Parallax is a trend that fails the accessibility test for most products. Adopt only when:

- Audience expects an immersive / spatial experience.
- Performance budget allows.
- Reduced-motion users get a complete static fallback.
- Vestibular-disorder personas are not in the primary audience.

If adopted:

- **Magnitude:** max 30% of the element's height in offset.
- **Smoothness:** use CSS transform translateY; avoid scroll-event listeners.
- **Fallback:** static positioning with reduced-motion.

### 8. View Transitions (if web-platform target supports)

Cross-document and same-document view transitions enable smooth route transitions.

- **Where:** route changes between thematic sections, modal open/close.
- **Recipe:** mark transition elements with `view-transition-name`; define `::view-transition-*` styles.
- **Fallback:** instant route change (no transition).
- **Reduced motion:** disable.

### 9. Touch gestures

For touch-primary surfaces:

- **Tap:** primary action. Standard.
- **Long-press (500ms):** secondary action / context menu / drag-start affordance.
- **Swipe-left / right on list items:** reveal inline actions (delete, archive). Spec: threshold 60px, snap-back if released before threshold.
- **Swipe-down on top of sheet:** dismiss sheet.
- **Pinch-zoom:** allowed on content (images, maps) where useful; disabled on UI surfaces.
- **Two-finger pan:** on canvases / maps; disabled elsewhere.
- **Haptic feedback:** light tap on button press (iOS / Android), medium for confirmations, heavy reserved for warnings.

### 10. Pull-to-refresh

- **Where:** mobile feeds with new content possible.
- **Threshold:** 80px pull with progress indicator.
- **Release behavior:** snap back + spinner overlay, fetch + replace.
- **Failure:** spinner pulses red briefly, returns; show toast.
- **Disabled on:** non-content surfaces (settings, forms).

### 11. Infinite scroll vs pagination

- **Pagination:** preferred when users may need to find specific positions, return to a page, or share a link.
- **Infinite scroll:** preferred for casual browsing (feeds, social).
- **Cursor-based load more button:** middle-ground; user-controlled.
- **Per-surface decision:** documented in UX flows.
- **Accessibility:** infinite scroll must have keyboard equivalent (load more button) and clear "end of list" state.

### 12. Custom scroll containers

When a surface scrolls independently from page (e.g., side rail, modal body, table):

- **Indicate scrollability:** top/bottom fade or shadow when scrolled content is hidden.
- **Scrollbar:** styled per scrollbar decision; ensure visible on hover even if overlay.
- **Keyboard scroll:** PageUp / PageDown / Home / End / arrow keys must work; focus must enter scroll container.

### 13. Scroll-locking (when modal open)

- **Body scroll locked:** while modal / drawer / sheet is open.
- **Locking method:** `position: fixed` on body OR `overflow: hidden` with scroll-position preserved.
- **Restore:** previous scroll position when modal closes.
- **iOS Safari quirk:** ensure no rubber-band scroll on body while modal open.

### 14. Reduced-motion / accessibility / low-power matrix

| Behavior | Default | reduced-motion | low-power | a11y notes |
|---|---|---|---|---|
| Smooth in-page scroll | smooth | instant | (same) | always allow Tab navigation |
| Sticky shadow | fade in | (same) | (same) | n/a |
| Scroll-snap | mandatory | (same) | (same) | snap points must be reachable by keyboard |
| Scroll-driven animation | animated | static at end-state | static | n/a |
| Parallax | offset translate | none | none | none |
| View transitions | animated | instant | instant | preserve focus across transition |
| Swipe gestures | enabled | (same) | (same) | keyboard equivalent required |
| Pull-to-refresh | enabled | (same) | (same) | refresh button must also exist |

### 15. Decision cards

- DEC-640 Scroll philosophy.
- DEC-641 Smooth-scroll adoption.
- DEC-642 Scroll-snap usage.
- DEC-643 Sticky regions.
- DEC-644 Scrollbar styling.
- DEC-645 Scroll-driven animation adoption.
- DEC-646 Parallax adoption (default: reject).
- DEC-647 View Transitions adoption.
- DEC-648 Touch gesture vocabulary.
- DEC-649 Pull-to-refresh adoption.
- DEC-650 Infinite scroll vs pagination policy.
- DEC-651 Custom scroll container affordances.
- DEC-652 Scroll-lock implementation.

## Anti-slop scroll rules

- "Smooth scroll" without smooth-scroll polyfill question + reduced-motion is incomplete.
- "We'll add parallax" without trend-fit test fails.
- Hidden scrollbars without an alternative discoverability signal is a usability failure.
- Custom scroll wheel handling (scroll-jacking) is rejected by default.
- "Infinite scroll" without a keyboard equivalent fails a11y.

## Quality gate

- Scroll philosophy locked.
- Scrollbar styling decided with fallback.
- Sticky regions documented.
- Scroll-driven animation, parallax, View Transitions decided (adopt or reject).
- Touch gesture vocabulary covers product needs.
- Reduced-motion / a11y fallback for every effect.

## Sources and basis

Per-decision tied to brand motion philosophy, personas (motion sensitivity), and platform / browser capability research.
