# Drift and Retrofit Protocol

How VisualForge handles existing repos. The core principle: **design the ideal first, then compute the drift.** Never anchor the new design to legacy decisions unless the user explicitly locks them.

## Trigger conditions

This protocol applies when the target working directory contains a frontend codebase. Signals:

- `package.json` with frontend dependencies (React, Vue, Svelte, Solid, Angular, Astro, Next, Nuxt, Remix, etc.).
- `tailwind.config.*`, `tokens.json`, `theme.ts`, `theme.css`, `styles/` directory.
- Component files (`*.tsx`, `*.jsx`, `*.vue`, `*.svelte`).
- Existing Figma file URL provided by the user.
- Existing design tokens file in any format.

When triggered, mode `MODE=retrofit` is set. Otherwise `MODE=greenfield` or `MODE=specforge-enhanced` per `mode-detection-protocol.md`.

## Step 1 — Inventory pass (read-only)

Before any design decisions, inventory what exists. **Inventory is not constraint.** Capture:

- **Tokens:** colors, typography, spacing, shadows, radii, motion values, breakpoints — any named design value.
- **Components:** list of components with paths, their variant props, their states.
- **Layout system:** grid, breakpoints, container widths.
- **Icon usage:** which library, custom icons, weight conventions.
- **Motion usage:** animation library in use, transitions defined, easing curves.
- **Asset strategy:** images, fonts, image formats, loading patterns.
- **Accessibility state:** ARIA usage, focus management, contrast known issues.
- **Performance state:** existing budgets, known issues.
- **CSS architecture:** Tailwind, CSS Modules, styled-components, vanilla extract, Sass, etc.
- **Existing pages / routes:** list of routes, titles, top-level data displayed, components present, roles served. (Drives IA restructuring in Step 1b.)

Record everything in `docs/design-system/retrofit/inventory.md` with file path evidence for each entry.

## Step 1a — Data inventory (mandatory in retrofit)

Run `data-inventory-protocol.md`. Read the data layer (OpenAPI / GraphQL / Prisma / Drizzle / migrations / fixtures / API call samples) and produce:

- `docs/design-system/retrofit/data-inventory.md` — every entity + every field with display classification.

This MUST happen before screen specs are produced. Without it, the design will invent fields and miss fields.

## Step 1b — IA restructuring analysis (mandatory in retrofit)

Run `ia-restructuring-protocol.md`. Analyze every existing page and identify:

- **Pages to split** (mixed roles, mixed task domains, mixed data scopes, high cognitive load).
- **Pages to merge** (fragmented same-task pages, single-setting pages that should be sections).
- **Missing pages** (gaps vs the task inventory derived from personas, competitive audit, and data crosswalk).
- **Misplaced content** (sitting in the wrong nav section).
- **Orphan pages** (unlinked from main nav).
- **Dead-end pages** (no clear next action).
- **Permission / role leaks** (mixed-role content on one page).

Use the canonical example from user input: a page mixing team-level statistics with individual member records mixes two task domains (analyze team vs. manage member) and two data scopes (aggregate vs. record) — split it.

Findings are surfaced to the user with three response paths per finding: accept / defer / reject. Accepted findings flow into the ideal IA in Step 2 and into the migration plan in Step 4.

Output: `docs/design-system/retrofit/ia-restructuring.md`.

## Step 2 — Generate the ideal design

Run all VisualForge subskills as if the repo did not exist. The ideal design must be derived from:

- Product intent (from Specforge, repo README, user answer).
- User research (personas, target audience).
- Competitive audit.
- Current design trends research.
- Brand identity.

It must *not* be derived from:

- The existing token names.
- The existing component palette.
- The existing layout grid.
- "What would be easy to migrate to."

Exception: if the user has explicitly locked a constraint (e.g., "we must keep the existing brand color #FF5500"), that constraint enters the design as a `User-confirmed` source and is honored.

## Step 3 — Compute the drift

After the ideal design is complete, compute the delta:

| Layer | Current | Ideal | Drift type | Migration cost |
| --- | --- | --- | --- | --- |
| Primary color | `#3B82F6` | `#5B6CFF` | Value change | Low — token swap |
| Type scale | 12/14/16/18/24/32 | OKLCH-derived 13/15/17/20/26/35 | Scale change | Medium — typography pass |
| Shadows | single drop shadow | 4-layer warm shadow | System change | Medium — shadow token + every elevated component |
| Button component | 2 variants | 6 variants × 5 states | Expansion | High — component refactor |
| Motion | ad-hoc | tokenized + reduced-motion | Architectural | High — motion library + audit |

Record in `docs/design-system/retrofit/drift-report.md` with one section per design layer:

```markdown
## Drift: [layer name]

### Current state
[Inventory excerpt with file paths]

### Ideal state
[Reference to the relevant decision in decision-log.md]

### Delta
[Specific differences, value by value]

### Migration cost
- **Effort:** Low | Medium | High
- **Risk:** Low | Medium | High
- **Blast radius:** [which screens / components affected]
- **Dependencies:** [other drift items that must move first]

### Migration plan
1. [step]
2. [step]

### Reversal plan
[How to roll back if migration regresses experience]
```

## Step 4 — Produce a phased migration plan

Drift report alone is not enough. Produce a migration plan in `docs/design-system/retrofit/migration-plan.md`:

**Phase 0 — Foundation (low risk, high enablement):**

- Introduce new tokens alongside existing ones (don't replace).
- Add design system files: `tokens.json`, `tokens.css`, `tokens.ts`.
- Set up token build pipeline.
- No visible changes yet.

**Phase 1 — Quiet swaps (visible but low-risk):**

- Spacing scale alignment.
- Type scale alignment.
- Shadow system swap (per-component, behind feature flag if possible).

**Phase 2 — Visible visual identity:**

- Color system swap.
- Iconography swap.
- Surface treatments (glass, gradients, edges).

**Phase 3 — Interaction & motion:**

- Motion token adoption.
- Micro-interaction polish.
- Scroll / gesture treatments.

**Phase 4 — Component refactor:**

- Component-by-component migration to ideal specs.
- State coverage expansion.

**Phase 5 — Cleanup:**

- Remove legacy tokens.
- Remove deprecated components.
- Update Figma to match.

For each phase, document:

- Acceptance criteria.
- Test plan.
- Rollback trigger.
- Estimated effort range.
- Dependencies on prior phases.

## Step 5 — Decision log entries for forced compromises

If migration would be impossible or prohibitively expensive for a specific ideal decision, log a `Temporary` decision:

```markdown
## DEC-NNN — [Temporary] [decision name]

- **Status:** Temporary compromise
- **Ideal:** [the ideal decision]
- **Compromise:** [what we're doing instead]
- **Reason:** [migration cost or risk]
- **Proper fix:** [the path to the ideal]
- **Removal trigger:** [signal that should cause the migration to happen]
- **Risk if not fixed:** [what gets worse over time]
```

Temporary compromises must be visible in the design QA report and in agent rules.

## Anti-anchoring rules

These behaviors are forbidden during retrofit:

- Picking the new primary color "close to the existing one to reduce migration cost." Pick the right color, then plan the migration.
- Using the existing spacing scale as the basis for the new scale. Derive the new scale from type and rhythm, then map old→new.
- Keeping a 2018-era shadow system because changing it is "a lot of work." If multi-layer realistic shadows are right, plan the work.
- Limiting the new component inventory to what already exists. If a needed component is missing, add it to the spec; migration is a separate concern.
- Letting the existing accessibility state (e.g., known contrast failures) bound the new accessibility target. Set the right target, then plan the fixes.

## Anchoring is allowed only when

- The user has explicitly said "this is locked": brand color, brand typography, partnership requirement, regulatory constraint.
- The constraint is platform-imposed and cannot be overridden (e.g., a vendor SDK that ships its own UI).
- The migration cost would exceed the product's runway and the user has confirmed.

In each case, the anchor is logged as a `User-confirmed` constraint with reason, not silently absorbed.

## Verification

Before completing retrofit mode, verify:

- Every entry in `inventory.md` appears in `drift-report.md` (covered or explicitly out of scope).
- Every ideal decision in `decision-log.md` either matches current or has a drift entry.
- Every drift entry has a migration plan or a Temporary decision card.
- The migration plan's Phase 0 can be done without changing any rendered pixel.
- The agent rules update flags the design system as "in migration" and points to the migration plan.
