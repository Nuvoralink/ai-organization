---
name: visualforge-design-ops
description: Design operations contract — Storybook configuration, design token build pipeline, design review workflow, versioning policy, deprecation policy, migration guides, design system health metrics, contribution guide for humans + agents.
---

# Design Ops

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md`.
- Design ops makes the design system load-bearing in the actual workflow. Without it, the system becomes shelfware.
- Maintain `decision-log.md`.

## Purpose

A design system that no one updates is dead in six months. This subskill specifies the operational contract: how the design system stays current, who reviews changes, how versioning works, how the team measures health.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Set up design ops from scratch.
- **Retrofit:** Inventory existing ops (Storybook? token build? review process?); produce ideal; drift entry.

## Required research pass

```text
Research current design system ops as of 2026: Storybook 8+ with stories format, Chromatic visual regression, design token pipelines (Style Dictionary, Tokens Studio Sync, Specify, Theo, Cobalt), Figma-code sync (Figma Variables API, Figma Tokens plugin, code-connect), semver for design systems, design system health metrics (token adoption %, component coverage, drift), design review tooling. Capture sources.
```

## Inputs

- Frontend contract (framework, build pipeline).
- Design tokens (token file structure).
- Component system (component inventory).
- Figma build (sync direction).
- Team size and process maturity.

## Output files

- `docs/design-system/07-quality/design-ops.md` — narrative + decisions.
- `docs/design-system/ops/CONTRIBUTING.md` — contribution guide for humans + AI agents.
- `docs/design-system/ops/VERSIONING.md` — versioning policy.
- `docs/design-system/ops/DEPRECATION.md` — deprecation policy + active deprecations.
- `docs/design-system/ops/CHANGELOG.md` — design system changelog (semver-aligned).
- `docs/design-system/ops/HEALTH-METRICS.md` — what to measure.
- Decision-log entries (DEC-935 to DEC-959, overflow DEC-960 to DEC-964) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Storybook configuration

- **Storybook 8+** (or current version) — configured.
- **Stories format:** CSF 3 + MDX for docs.
- **One story per variant × state.**
- **Addons:**
  - `@storybook/addon-a11y` — axe-core integration.
  - `@storybook/addon-interactions` — interaction testing.
  - `@storybook/addon-viewport` — responsive testing.
  - `@storybook/addon-themes` — light / dark / high-contrast toggle.
  - Pseudo-localization addon for i18n testing.
- **Visual regression:** Chromatic / Percy / Playwright snapshot — pick one. CI integration.
- **Coverage:** every component has stories; PR check blocks components without stories.

### 2. Token build pipeline

- **Source of truth:** `tokens.json` (DTCG format).
- **Build tool:** Style Dictionary / Tokens Studio Sync / custom.
- **Outputs:** `tokens.css`, `tokens.ts`, `tokens.figma.json`, framework config stub.
- **Build trigger:** on commit to `tokens.json` and on PR; CI enforces all outputs are current.
- **Watch mode for dev:** running token edits regenerate derivatives in dev.
- **Figma sync:** one-way (code → Figma) or two-way (with conflict resolution rules).

### 3. Design review workflow

For changes to anything under `docs/design-system/`:

- **PR template** includes:
  - Decision ID(s) being added or modified.
  - What artifacts change (tokens / components / screens / docs).
  - Migration impact (breaking / minor / patch).
  - Visual regression status.
  - a11y check status.
- **Required reviewers:**
  - For token / component / accessibility changes: design system lead + a11y reviewer.
  - For screen / flow changes: product designer + frontend lead.
  - For brand identity changes: brand owner + design system lead.
- **Acceptance criteria:** validation script passes; visual regression passes; a11y check passes; decision log entry present.

### 4. Versioning policy

Semver for design system as a package (when published as `@org/design-system`):

- **Major:** breaking changes — removed tokens, renamed components, removed component props, changed component contract.
- **Minor:** additive — new tokens, new components, new variants, new props.
- **Patch:** non-breaking fixes — value tweaks within token (e.g., 0.05 opacity adjustment), bug fixes.

When token / component changes are batched:

- Changelog entry per change with category (breaking / added / changed / fixed / deprecated).
- Migration guide for every breaking change.

### 5. Deprecation policy

A token or component cannot be removed in less than two minor versions:

1. **Mark deprecated** in a release; emit warning when used (build-time or runtime warning).
2. **Migrate consumers** with codemod where possible.
3. **Remove** in next minor (or major if breaking).

Active deprecations live in `ops/DEPRECATION.md` with: token / component name, deprecated in version, removal target version, replacement, migration command if codemod available.

### 6. Migration guides

For every breaking change, produce `ops/migrations/[version].md` with:

- What changed.
- Why.
- Codemod or manual migration steps.
- Estimated effort.
- Test plan.

### 7. Contribution guide

`ops/CONTRIBUTING.md` covers:

- **For humans:** how to propose a token, how to propose a component, how to update content, how to file an issue with the design system.
- **For AI agents:** explicit rules referencing `RULES.md` and `rules-update-protocol.md`. How an agent should invoke `$visualforge-[subskill]` instead of editing the design system directly.
- **Style:** code style for stories, naming conventions, file organization.
- **Testing requirements:** stories, a11y, visual regression, type checks.

### 8. Health metrics

Surface in `ops/HEALTH-METRICS.md`:

- **Token coverage:** % of values in source code that come from tokens (vs raw values).
- **Component adoption:** % of in-product surfaces using design system components.
- **Drift count:** open drift findings in `auditability/drift-detection-report.md`.
- **Accessibility CI:** % of stories passing axe.
- **Visual regression:** # of pending visual changes.
- **Documentation freshness:** date of last regeneration; warn if > 90 days without VisualForge re-run.
- **Decision-log activity:** new DECs per quarter.

Run as a dashboard or scheduled report.

### 9. Tooling stack

Recommend the team adopt:

- Storybook (component dev + docs).
- Chromatic / Percy / Playwright (visual regression).
- axe-core / Pa11y (a11y CI).
- Style Dictionary (token pipeline).
- Knip / depcheck (unused tokens / components detection).
- Figma + Figma Tokens / Variables (design source).

### 10. Integration with VisualForge

`ops/CONTRIBUTING.md` documents that:

- Major design changes invoke `$visualforge-[subskill]` to regenerate affected docs.
- Drift detection runs on every VisualForge run; findings surface in PR.
- The design system rules in `RULES.md` are authored by VisualForge and edited only via VisualForge.

### 11. Decision cards

- DEC-936 Storybook stack + addons.
- DEC-937 Visual regression tool.
- DEC-938 Token build pipeline tool.
- DEC-939 Figma sync direction + cadence.
- DEC-940 PR review workflow.
- DEC-941 Versioning policy (semver).
- DEC-942 Deprecation timeline.
- DEC-943 Migration guide template.
- DEC-944 Health metric set.
- DEC-945 Contribution guide approach (humans + agents).

## Anti-slop design ops rules

- "We'll set up Storybook later" — fails. Component subskill demands it.
- "Token pipeline TBD" — fails. Components reference tokens; pipeline must work.
- Design review without explicit reviewer roles — fails.
- Versioning "we'll figure out" — fails. Lock now, even if pre-1.0.
- Removing a token in a patch release — fails policy.

## Quality gate

- Storybook configured with addons + visual regression.
- Token build pipeline works end-to-end.
- PR review workflow documented.
- Versioning and deprecation policies in place.
- Health metrics defined.
- Contribution guide for humans + agents.

## Sources and basis

Per-decision tied to current design ops practices and the team's process maturity.
