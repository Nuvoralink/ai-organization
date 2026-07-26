# Specforge-enhanced — VisualForge prompt example

Use this when Specforge has already produced product docs (`docs/app-plan/`) and you want VisualForge to upgrade the design layer.

## Example prompt

```
Use $visualforge for this product. Specforge docs already exist at
docs/app-plan/.

We're keeping the product scope and feature list Specforge defined.
What we want VisualForge to upgrade:

- The basic UI contract Specforge produced — replace it with a real
  design system, not just a screen map.
- Add proper brand identity (Specforge didn't go deep on this).
- Add design tokens, surface treatments, motion, micro-interactions,
  iconography, accessibility contract.
- Build it in Figma if MCP is available.
- Update agent rules so Codex and Claude both follow the new design
  system.

The Specforge brand positioning calls the product "warm, technical,
trustworthy" — VisualForge should turn that into visual mechanisms,
not adjectives.
```

## What VisualForge will do

1. Detect `MODE=specforge-enhanced` (sees `docs/app-plan/`).
2. Read Specforge product brief, PRD, feature scope, user roles.
3. Skip discovery questions already answered by Specforge (product intent, audience, feature scope).
4. Treat Specforge's `04-user-flows-and-screen-map.md` and `05-ux-ui-content-contract.md` as inventory only — VisualForge will produce a deeper replacement.
5. Run all 22 subskills, marking Specforge-derived inputs with source label `Specforge-derived`.
6. Extend Specforge's decision log starting at next free DEC-NNN.
7. Build Figma, run QA, update agent rules.

## Where the docs go

Specforge docs stay at `docs/app-plan/`. VisualForge docs go to `docs/design-system/`. They cross-reference each other.

The agent rules update will tell future contributors:

- For product scope / features / roles / security / data → `docs/app-plan/`.
- For visual / interaction / component / accessibility design → `docs/design-system/`.

## Specforge UI docs after VisualForge runs

VisualForge does not delete or rewrite Specforge's UI docs. It marks them as superseded:

- A note appended to `docs/app-plan/product/05-ux-ui-content-contract.md`: "Superseded by `docs/design-system/12-component-system.md` and `docs/design-system/17-accessibility-contract.md` as of [date]."

## Decision log continuity

VisualForge reads Specforge's `docs/app-plan/auditability/decision-log.md` for the highest DEC-NNN used, then starts at the next available ID. Both forge tools share the same decision log structure.
