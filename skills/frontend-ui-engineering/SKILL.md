---
name: frontend-ui-engineering
description: Use when building, redesigning, auditing, or polishing frontend UI, React/Next.js components, responsive layouts, dashboards, forms, motion, 3D web scenes, design systems, accessibility, interaction states, visual craft, or frontend performance. Consolidates frontend engineering, React best practices, web design guidelines, anti-AI design slop, responsive design, polish, and purposeful Three.js guidance.
---

# Frontend UI Engineering

Build interfaces that are useful, responsive, accessible, performant, and intentionally designed.

## Product-First UI Workflow

1. Identify the user job and primary action before choosing layout.
2. Map the needed states: loading, empty, success, error, disabled, long content, missing data, and permission limits.
3. Design responsive behavior as different experiences per breakpoint, not a scaled copy.
4. Use existing design tokens, component conventions, icons, and typography patterns first.
5. Implement clean React boundaries: minimal client state, stable effects, accessible semantics, and predictable data flow.
6. Verify with browser screenshots for meaningful UI work.

## Built-In Lenses

- React quality: `references/react-best-practices.md`
- General frontend engineering: `references/frontend-ui-engineering.md`
- Web design craft: `references/web-design-guidelines.md`
- Avoid generated-looking UI: `references/anti-ai-design-slop.md`
- Responsive layouts: `references/responsive-design.md`
- Final polish pass: `references/polish.md`
- Purposeful Three.js scenes: `references/3d-web-experience.md`

## Hard Rules

- Do not hide core functionality on mobile.
- Do not rely on hover for essential actions.
- Do not use generic AI-builder design patterns by default.
- Do not add 3D unless depth or interaction earns its place.
- Do not call UI done until it has meaningful states, responsive behavior, keyboard/focus handling, and no obvious layout overlap.
