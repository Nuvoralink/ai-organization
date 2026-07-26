---
name: visualforge-micro-interactions
description: Define every micro-interaction — hover physics, focus rings, press feedback, ripples, drag affordances, magnetic hover, cursor states, tooltip / popover behavior, optimistic-update transitions — with exact timing, easing, and accessibility fallbacks.
---

# Micro-Interactions

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md`.
- Every micro-interaction has: trigger, observable change, duration token, easing token, fallback for reduced-motion, fallback for `pointer: coarse` (touch), fallback for keyboard, fallback for screen reader.
- **Timing tokens (duration / easing) source of truth: `visualforge-motion-design`.** This subskill **cites** those tokens by name; never re-declare numeric values. If a new duration or easing is needed, add it in motion-design first, then reference from here (per VF-FIND-039).
- Maintain `decision-log.md`.

## Purpose

The 100ms feedback loop. This is what separates premium products from generic ones. Without explicit micro-interaction specs, components feel inconsistent and unresponsive. This subskill locks every "small thing" you'd otherwise leave to taste.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Define per-component and per-surface micro-interaction recipes.
- **Retrofit:** Inventory existing micro-behaviors; produce ideal; drift entry.

## Required research pass

```text
Research current micro-interaction patterns as of 2026: hover-lift conventions, magnetic / spring hover, focus-ring patterns, press feedback (scale, depression, ripple), cursor design (custom cursors, hover variants), drag affordances (cursor change, ghost preview, drop indicators), tooltip timing (delay, duration, dismissal). Reference Linear, Vercel, Stripe, Arc, Apple HIG, Material 3 motion. Capture sources.
```

## Inputs

- Design tokens — duration + easing tokens.
- Surface treatments — hover-state recipes.
- Component system — every interactive component and its state spec.
- Personas — input mode profile (touch / pointer / keyboard / mixed).

## Output files

- `docs/design-system/04-interaction/micro-interactions.md`
- Decision-log entries (DEC-600 to DEC-634, overflow DEC-635 to DEC-639) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Hover behaviors

Specify per interactive surface category.

#### Buttons
- **Pointer hover:** brightness or background-color step, optional translateY(-1px), shadow lift one elevation step.
- **Duration:** `duration.fast` (120ms) in, `duration.base` (200ms) out (slightly slower out for grace).
- **Easing:** `ease.standard`.
- **Touch:** no hover state; rest = active.
- **Keyboard focus:** distinct focus-visible state (not just hover restyled).

#### Cards
- **Pointer hover:** background-color step (+1 toward elevated), shadow lift, optional border-color shift. Pre-revealed action affordances (e.g., menu button fades in).
- **Duration:** `duration.fast`.
- **Touch:** no hover; pressed state on tap.

#### Links
- **Pointer hover:** underline appears (if not always present), color shift one step toward accent-hover.
- **Duration:** `duration.fast`.

#### Icon-only buttons
- **Pointer hover:** bg fill subtle (use accent.subtle or text.subtle bg), tooltip appears after 400ms.
- **Touch:** no hover; tooltip on long-press or focus.

#### Rows (list / table)
- **Pointer hover:** bg shift to surface.subtle.
- **Inline actions:** opacity 0 → 100% on hover; action buttons render as ghost on row hover.

### 2. Magnetic / spring hover (if adopted)

Magnetic hover is when an element shifts slightly toward the cursor. Premium feel but with cost.

Decision: Adopt | Reject (with rationale per trend-fit test).

If adopted:
- **Magnitude:** 4–8px shift max.
- **Easing:** spring `ease.spring-gentle`.
- **Surfaces:** large CTAs, hero buttons. Never on dense UI (table rows, lists).
- **Accessibility:** reduced-motion disables entirely.
- **Touch:** disabled (no cursor).
- **Cost:** track per-frame paint cost; budget under 1ms paint on target devices.

### 3. Focus rings

Critical for accessibility — the #1 area where products fail WCAG 2.4.7 (focus visible).

- **Visible only on keyboard focus** (`:focus-visible`), never on click.
- **Style:** 2px outline at offset 2px, using `border.focus` (accent-derived). Or 2px box-shadow ring if outline can't accommodate radius.
- **Inset focus** (for inputs): change border to `border.focus` (no outer ring).
- **Within composite components** (DataTable cells, ListItems): row gets `aria-selected` + ring; cell gets inset ring on edit focus.
- **High-contrast variant:** focus ring becomes solid + thicker.
- **Animation:** focus ring appears in 80ms with opacity fade; no scale or grow (reads as jumpy).
- **Touch:** no focus ring shown on tap (only on real keyboard focus).

### 4. Press feedback

When a user clicks or taps a button.

- **Pointer click:** scale 0.97 + slight translateY(0) + reduced shadow, snap back on release.
- **Touch tap:** scale 0.97 with 50ms duration; haptic light tap on supported devices.
- **Material ripple (if Material adopted):** radial fade from press point, 300ms.
- **Reduced motion:** opacity dim only, no transform.
- **Keyboard activate (Space/Enter):** brief press feedback for visual parity with click; no haptic.

### 5. Cursor design

If custom cursors are adopted:

- **Default:** system default.
- **Pointer (interactive):** system `pointer` on links and buttons.
- **Text:** system `text` on text inputs and selectable text.
- **Grab / grabbing:** for draggable.
- **Resize:** for resizable splits.
- **Not-allowed:** for disabled interactive elements.
- **Custom cursors:** only on canvas / spatial / specialty surfaces; document with image, hot-spot, fallback.
- **Hover-derived states:** cursor changes immediately on enter, no delay.

### 6. Tooltip behavior

- **Delay before show:** 400ms on hover (delay so accidental hovers don't fire).
- **Show duration:** appears in 120ms with fade + slight slide.
- **Stay until:** mouse leaves trigger AND tooltip area, or escape pressed.
- **Touch:** show on long-press (500ms hold).
- **Keyboard focus:** show immediately on focus, hide on blur.
- **Placement:** prefer above; flip to below if no space; flip to side if vertical squeezed.
- **Max width:** 240px; wrap text.
- **Content:** plain text only, ≤ 60 chars typical; no interactive content (use Popover instead).
- **Accessibility:** `role="tooltip"`, `aria-describedby` on trigger.

### 7. Popover and menu behavior

- **Open trigger:** click / Enter / Space.
- **Close triggers:** outside click, Escape, item select.
- **Placement:** CSS Anchor Positioning when supported; library fallback otherwise.
- **Open animation:** scale 0.96 → 1 + opacity 0 → 1, 160ms `ease.standard`.
- **Close animation:** 100ms fade out.
- **Focus management:** focus first item or anchor on open; restore focus to trigger on close.
- **Keyboard nav:** arrow keys to move; Home / End to jump; Tab to escape.

### 8. Drag behaviors

If drag is supported:

- **Drag affordance:** cursor → `grab` on hoverable drag handles; → `grabbing` while dragging.
- **Drag start:** delayed to 80ms after mousedown + 4px movement (prevents accidental drag on click).
- **Drag preview / ghost:** clone of element at 80% opacity, follows cursor with slight lag (spring).
- **Drop indicator:** 2px accent line at insertion point; updates as cursor moves.
- **Invalid drop target:** cursor becomes `no-drop`; preview opacity 40%.
- **Drag end:** spring-back if invalid drop; smooth animate into place if valid.
- **Keyboard drag:** alternative reorder pattern (focus item, Cmd+Up/Down to move) — required for a11y.
- **Touch drag:** long-press 300ms to initiate; haptic confirmation.
- **Reduced motion:** instant move (no animation).

### 9. Optimistic UI behaviors

For actions that update server state:

- **Optimistic render:** UI updates immediately on action.
- **Pending indicator:** subtle spinner inline or row-level shimmer.
- **Success confirm:** silent (UI already updated) OR brief toast for important actions.
- **Failure rollback:** revert to prior state with toast "Couldn't save. Reverted." with retry.
- **Conflict resolution:** if server state moved, surface a "Refresh and try again" toast, never silently overwrite.

### 10. Copy-to-clipboard feedback

- **Trigger:** "Copy" button or Cmd+C from selection.
- **Visual feedback:** button icon morphs from copy → check (200ms), label becomes "Copied" for 1.5s, then reverts.
- **Toast:** optional for important copies (sharing tokens, codes). Otherwise icon feedback is enough.
- **Accessibility:** `aria-live="polite"` announcement of "Copied to clipboard".

### 11. Form submission feedback

- **On submit (sync):** button shows spinner + "Saving…" label; disabled during.
- **On submit (network):** if > 2s, secondary message "Still working…".
- **On success:** button reverts; success toast OR redirect.
- **On error:** inline field errors + general error toast if cross-field.
- **Optimistic save indicator (autosave):** dot indicator "Saved" / "Saving…" / "Unsaved changes" near title.

### 12. Scroll-related micro-interactions

Reference `visualforge-scroll-and-gesture` for the full spec. Here, lock the small details:

- **Sticky nav shadow:** appears on scroll > 4px, fades in over 160ms.
- **Back-to-top button:** appears after scroll > 80vh, bottom-right, 200ms fade.
- **Read progress bar:** thin top bar showing % through long content.

### 13. Input affordances

- **Text input on focus:** border becomes `border.focus`, optional 1px subtle accent ring outside.
- **Input value entered:** label can shrink to floating-label or stay static (decide per brand).
- **Clear button (×):** appears when value is non-empty, click clears + focuses input.
- **Search input:** typing triggers debounce (200–300ms) before query.
- **Validation feedback timing:** on blur for fields, on submit attempt for whole form; live for password rules.

### 14. Loading state micro-interactions

- **Skeleton shimmer:** soft horizontal sweep across skeleton bones, 1.6s linear infinite, 160% width travel.
- **Spinner:** continuous rotation, 800ms linear.
- **Progress bar (indeterminate):** sliding stripe loop.
- **Reduced motion:** skeleton holds without shimmer; spinner reduces to opacity pulse; progress shows percent text only.

### 15. Decision cards

- DEC-600 Hover system (per surface category).
- DEC-601 Focus ring system.
- DEC-602 Press feedback pattern.
- DEC-603 Magnetic hover adoption.
- DEC-604 Cursor design.
- DEC-605 Tooltip timing.
- DEC-606 Popover / menu behavior.
- DEC-607 Drag interaction adoption + spec.
- DEC-608 Optimistic-UI policy.
- DEC-609 Copy feedback pattern.
- DEC-610 Form submit feedback.
- DEC-611 Input affordance pattern.
- DEC-612 Loading micro-interaction recipes.
- DEC-613 Skeleton vs spinner usage rule.
- DEC-614 Read-progress / back-to-top adoption.

## Anti-slop micro-interaction rules

- "Smooth hover" without duration / easing / values fails.
- "Subtle press feedback" without scale value, duration, transform property fails.
- Focus ring spec missing or non-distinguishable from hover fails accessibility.
- "Magnetic hover" adopted without trend-fit test fails.
- Optimistic UI without a rollback path is a data-loss risk; document it.

## Quality gate

- Every interactive surface in component-system has hover, focus, press defined.
- Focus rings explicit and pass WCAG 2.4.7.
- Tooltip and popover timing locked.
- Drag interaction either adopted with full spec or explicitly out of scope.
- Loading interaction patterns cover skeleton + spinner + progress.
- Reduced-motion fallback for every animated micro-interaction.

## Sources and basis

Per-interaction rationale tied to research findings and surface treatment philosophy.
