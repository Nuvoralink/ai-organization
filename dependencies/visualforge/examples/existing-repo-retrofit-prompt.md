# Existing-repo retrofit — VisualForge prompt example

Use this when an app already has frontend code and you want VisualForge to produce the *ideal* design system and a *drift report* showing the gap.

## Example prompt

```
Use $visualforge to retrofit this repo.

The codebase is a React + Tailwind app shipping for about 18 months.
The design has accreted — there's a tailwind.config.js with a custom
palette, ~40 components in src/components/ui/, and a mix of Radix
primitives and bespoke components. No tokens file. Dark mode partially
implemented but inconsistent.

What we want:

1. Inventory what exists (read-only).
2. Design the IDEAL design system independent of what's there.
   Do NOT anchor to the current palette, components, or layout.
3. Produce a drift report showing current vs ideal, and a phased
   migration plan we can execute over several quarters.
4. Build the ideal in Figma (we have Figma MCP).
5. Update agent rules so future contributors follow the ideal and
   don't keep extending the legacy patterns.

Locked constraints (do NOT change):
- Brand primary color #5340FF (legal locked).
- Inter as primary font (we have a perpetual license).
- The product name and logo.

Everything else is fair game.
```

## What VisualForge will do

1. Detect `MODE=retrofit`. Detect Figma MCP available.
2. **Inventory pass (read-only):** crawl `tailwind.config.js`, `src/components/ui/`, theme files, Storybook if present. Record:
   - All color tokens defined.
   - All spacing/radius/shadow tokens.
   - All components with their variants and states (from code).
   - CSS architecture in use.
   - Accessibility state (from observable code patterns).
   - Performance state (if measurable).
   Write to `docs/design-system/retrofit/inventory.md`.
3. **Ideal generation:** run all 22 subskills as if the repo did not exist. Honor only the locked constraints (`#5340FF` becomes a `User-confirmed` source in the brand-identity decision, Inter is the locked typography choice).
4. **Drift computation:** layer by layer, compare current vs ideal. Write `docs/design-system/retrofit/drift-report.md`.
5. **Migration plan:** phased plan (Phase 0 ships zero pixel changes; Phase 1 quiet swaps; Phase 2 visible identity; Phase 3 interaction; Phase 4 component refactor; Phase 5 cleanup). Write `docs/design-system/retrofit/migration-plan.md`.
6. **Figma build:** ideal design system (not the current one).
7. **Design QA:** validate all docs, drift, and migration plan.
8. **Agent rules update:** tell future contributors:
   - Source of truth is `docs/design-system/` (the ideal).
   - Repo is in migration; do not extend legacy patterns.
   - Follow phased migration plan in order.
   - Drift detection runs on every VisualForge regeneration.

## Key behavior

The most important rule in retrofit mode: **the ideal is not constrained by the existing repo.** If the current product uses `#3B82F6` blue and the ideal palette is `#5B6CFF` indigo, VisualForge picks `#5B6CFF`. Migration plan handles the transition.

Anchoring is *only* allowed when the user explicitly locks something (as in the prompt above with `#5340FF` and Inter). Even then, the lock is recorded as a `User-confirmed` constraint with rationale.

## Drift report sample shape

```markdown
## Drift: Primary color

### Current state
`tailwind.config.js` defines `colors.primary` as `#3B82F6` (Tailwind blue-500).

### Ideal state
DEC-115 — Accent / state palette. Primary accent is `#5340FF` (locked by
user). Hover and active states algorithmically derived (OKLCH lightness shifts).

### Delta
- Hue shift from blue to indigo.
- Saturation increase.
- Hover/active programmatically derived in ideal; ad-hoc in current.

### Migration cost
- Effort: Medium (token swap + visual audit).
- Risk: Medium (every screen using primary changes appearance).
- Blast radius: ~80% of components.
- Dependencies: Tokens build pipeline must exist (Phase 0).

### Migration plan
1. Phase 0: introduce `--primary-new` token alongside `--primary`.
2. Phase 2: switch components to `--primary-new` behind a feature flag.
3. Phase 2 ship: flip flag globally.
4. Phase 5: remove `--primary` legacy.

### Reversal plan
Revert flag.
```

## After VisualForge runs

You have:
- A complete ideal design system.
- A full drift inventory.
- A phased migration plan.
- Figma file with the ideal.
- Agent rules telling future work to follow the migration plan, not extend legacy.

Run subsequent VisualForge calls to extend (e.g., new components). Drift detection on each run will flag any code edits that bypassed the design system.
