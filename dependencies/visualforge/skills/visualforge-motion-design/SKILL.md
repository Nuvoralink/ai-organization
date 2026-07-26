---
name: visualforge-motion-design
description: Define the motion system — physics model, easing library, duration scale, choreography rules, stagger patterns, page transitions, modal entry/exit, loading motion, reduced-motion fallbacks, motion library choice.
---

# Motion Design

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Source-of-truth role (added per VF-FIND-039)

This subskill is the **source of truth** for duration tokens and easing tokens used anywhere in the design system. Other subskills (`visualforge-micro-interactions`, `visualforge-scroll-and-gesture`, `visualforge-component-system`, `visualforge-surface-treatments`, `visualforge-frontend-contract`) **cite** these tokens by name and must not re-declare numeric values. When a downstream subskill needs a new duration or easing curve, add it here first, then cite from there.

The canonical tokens live in `docs/design-system/tokens/tokens.json` under `duration.*` and `ease.*`. This document describes the system; the JSON is the binding artifact.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md`.
- Every motion decision: trigger, property animated, duration token, easing token (or spring spec), choreography (parallel / staggered), reduced-motion fallback, performance budget.
- Never "subtle animation", "smooth transition", "feels nice".
- Motion is functional first, expressive second. If a motion doesn't communicate state change or relationship, cut it.
- Maintain `decision-log.md`.

## Purpose

Lock the entire motion language: how things enter, exit, change, and respond. Without an explicit motion system, animations feel ad-hoc and inconsistent.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Define motion system from brand motion personality.
- **Retrofit:** Audit existing motion; produce ideal; drift entry.

## Required research pass

```text
Research current motion design practices as of 2026: Material 3 motion (motion-physics, expressive easing), Apple HIG motion, spring physics in UI (Framer Motion, React Spring, Motion One, GSAP), CSS @keyframes vs Web Animations API vs library, View Transitions API, scroll-driven animation, stagger patterns, motion choreography. Identify reference products with notable motion systems (Linear, Arc, Stripe, Apple). Capture sources.
```

## Inputs

- Brand identity — motion personality.
- Design tokens — duration + easing tokens.
- Surface treatments — hover transitions.
- Component system — every interactive component's state transitions.
- Micro-interactions — per-interaction motion specs.
- Scroll and gesture — scroll-driven animation decisions.
- Accessibility — reduced-motion contract.

## Output files

- `docs/design-system/04-interaction/motion-design.md`
- Decision-log entries (DEC-870 to DEC-899, overflow DEC-900 to DEC-904) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Motion philosophy

Pick one as dominant:

- **Restrained / functional:** motion communicates state, never decorates. Short durations, gentle easing. Linear, Stripe, Notion-style.
- **Expressive / brand-led:** motion is a signature. Spring physics, choreography, signature transitions. Material 3 Expressive, Apple, Arc.
- **Mixed (functional default, expressive moments):** most products. Functional for daily UI; expressive for signature moments (page entry, success, key transitions).

### 2. Physics model

- **Tween (duration + easing):** standard CSS / Web Animations approach. Predictable, cheap, well-supported.
- **Spring (mass + stiffness + damping):** physics-based, natural-feeling, requires JS library typically. Used for drag interactions, key brand moments.
- **Mixed:** tween for functional UI, spring for signature interactions and drag.

If spring adopted: specify the parameters.

```
ease.spring-gentle:   stiffness 170, damping 26, mass 1   (slow, soft)
ease.spring-snappy:   stiffness 300, damping 30, mass 1   (responsive, snappy)
ease.spring-bouncy:   stiffness 400, damping 15, mass 1   (energetic, overshooting)
```

### 3. Easing library

Tokenized in design-tokens; this subskill ensures coverage:

- `ease.linear` — `linear`
- `ease.standard` — `cubic-bezier(0.2, 0, 0, 1)` (Material standard)
- `ease.emphasized` — `cubic-bezier(0.3, 0, 0, 1.05)` (Material expressive, slight overshoot)
- `ease.decelerate` — `cubic-bezier(0, 0, 0, 1)` (enter)
- `ease.accelerate` — `cubic-bezier(0.3, 0, 1, 1)` (exit)
- `ease.gentle` — `cubic-bezier(0.4, 0, 0.2, 1)`
- Spring tokens as above.

Rule: every motion references a token. No raw cubic-beziers in component code.

### 4. Duration scale

Tokenized in design-tokens:

- `duration.instant` 0ms (reduced-motion fallback target)
- `duration.fast` 120ms (hover, micro-feedback)
- `duration.base` 200ms (state changes, small transitions)
- `duration.slow` 360ms (panel reveal, modal entry)
- `duration.slower` 600ms (page-level transitions)
- `duration.expressive` 480–720ms (signature moments)
- `duration.enter` 220ms
- `duration.exit` 180ms (exit faster than enter — feels respectful of user)

Rule: exits faster than entries; enters use decelerate; exits use accelerate.

### 5. Property guidance

What to animate, what not to:

- **Always animate:** `opacity`, `transform` (translate, scale, rotate). Cheap on GPU.
- **Animate carefully:** `background-color`, `color`, `border-color`, `box-shadow`, `filter`. Paint cost.
- **Never animate (or rarely):** `width`, `height`, `top`, `left`, `margin`, `padding`. Layout cost; jank risk. Use `transform` + `scale` or container queries instead.
- **Composite layer hint:** `will-change: transform, opacity` only when motion is imminent; remove after.

### 6. Choreography rules

When multiple elements animate together:

- **Parallel (default for hover, state changes):** all elements animate at the same time.
- **Stagger (for list reveal, multi-element entry):** each subsequent element starts 30–60ms after the previous.
- **Cascade (for hierarchical entry):** parent starts, then child, then grandchild, with 50–100ms gaps.
- **Coordinated transform:** elements moving toward a common point share easing and duration.
- **Anti-pattern:** elements moving in different directions, durations, easings simultaneously — feels broken.

### 7. Page transitions

If page transitions adopted:

- **Default within-section:** instant (no transition); native scroll restoration.
- **Between sections / major nav:** 200ms fade + 8px translateY.
- **Modal entry:** background fades to overlay 160ms; modal scales from 0.96 + opacity 0 → 1 in 200ms `ease.standard`.
- **Modal exit:** modal scales to 0.96 + opacity 1 → 0 in 140ms; background fades out.
- **Drawer entry:** slides in from edge in 220ms `ease.decelerate`.
- **Drawer exit:** slides out in 180ms `ease.accelerate`.
- **View Transitions API:** adopt for declarative cross-route transitions if browser support meets target.

### 8. State-change motion

- **Disabled ↔ enabled:** opacity transition 120ms.
- **Loading start:** spinner fades in 80ms; content fades out 80ms.
- **Loading end:** content fades in 120ms with optional translateY(4px) → 0.
- **Error → recovered:** error state fades to recovered state 200ms.
- **Selected:** accent border fades in 120ms; check icon scales 0 → 1 in 160ms `ease.emphasized`.

### 9. List / collection motion

- **Initial render:** stagger 30ms between items, only for above-fold items, skip below.
- **Add item:** new item fades in + translateY(8px) → 0 in 220ms; surrounding items shift via layout transition.
- **Remove item:** item fades out + collapses height in 180ms.
- **Reorder:** FLIP technique or library; spring physics; 300ms typical.
- **Reduced motion:** items snap into place without animation.

### 10. Skeleton and loading motion

- **Skeleton shimmer:** horizontal sweep, 1.6s linear infinite, soft gradient.
- **Spinner:** rotation 800ms linear infinite.
- **Progress bar (indeterminate):** sliding stripe loop.
- **Reduced motion:**
  - Skeleton: static placeholder, no shimmer.
  - Spinner: opacity pulse 1.2s, or static with screen-reader-only "Loading" text.
  - Progress: numeric text only.

### 11. Toast and notification motion

- **Entry:** slide in from edge (top-right standard) + opacity 0 → 1, 220ms.
- **Exit:** slide out + opacity, 180ms.
- **Auto-dismiss:** default 4–6 seconds for non-action toasts; sticky for action toasts.
- **Reduce-motion:** fade only, no slide.

### 12. Signature moments

A short list of moments where motion is deliberately expressive — earns brand attention:

- First-run welcome.
- Major action confirmation (e.g., subscription complete, project published).
- Empty-state-to-first-item transition.
- Achievement / milestone (if applicable).

Document each with a per-moment motion spec; ensure reduced-motion fallback that still confirms the state.

### 13. Motion library choice

- **CSS-only:** when motion is simple and static. No library.
- **Framer Motion (React):** when spring physics, layout animation, drag, gesture coordination needed.
- **Motion One:** when JS animation with Web Animations API performance is needed.
- **GSAP:** complex sequenced motion, marketing pages, hero scenes.
- **Lottie:** illustrated animation (with reduce-motion alternative).
- **Pick one primary; secondary only if a clear gap.**

### 14. Performance budget

- Target 60fps on primary target devices; 120fps if hi-refresh adopted.
- Per-animation paint budget < 1ms.
- Frame jank threshold: any animation that causes a dropped frame on the target device tier is rejected.
- Layer count budget: keep composite layers < 30 active.

### 15. Reduced-motion contract

Every motion has a documented reduced-motion fallback:

| Motion | Default | Reduced-motion |
|---|---|---|
| Hover transform | translateY(-1px) + shadow | shadow only, no transform |
| Modal entry | scale + opacity | opacity only |
| Toast slide-in | slide + fade | fade only |
| Spinner | rotation | opacity pulse or static |
| Skeleton shimmer | sweep | static placeholder |
| Page transition | translate + fade | instant |
| Signature moment | full expressive motion | simplified, still confirms state |

### 16. Decision cards

- DEC-871 Motion philosophy (restrained / expressive / mixed).
- DEC-872 Physics model (tween / spring / mixed).
- DEC-873 Easing library coverage.
- DEC-874 Duration scale lock.
- DEC-875 Choreography rules.
- DEC-876 Page transition strategy.
- DEC-877 Modal / drawer motion.
- DEC-878 List / collection motion.
- DEC-879 Loading motion recipes.
- DEC-880 Signature moments inventory.
- DEC-881 Motion library choice.

## Anti-slop motion rules

- "Smooth transitions" without timing values fails.
- "Tween everything" without easing specification fails.
- Animating layout properties (width, height, top) without a fallback fails performance.
- Missing reduced-motion fallback fails accessibility.
- A signature moment with no fallback fails accessibility.

## Quality gate

- Philosophy and physics model chosen.
- Easing and duration scales tokenized.
- Choreography rules documented.
- Page / modal / drawer / toast / loading motion specified.
- Signature moments listed with full specs.
- Motion library chosen with rationale.
- Reduced-motion contract complete.
- Performance budget set.

## Sources and basis

Per-decision rationale tied to brand motion personality, performance budget, and current motion-system research.
