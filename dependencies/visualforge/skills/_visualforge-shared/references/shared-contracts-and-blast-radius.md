# Shared contracts and blast radius

When a design system is built page-by-page without a shared-contract discipline, every page hardcodes its own copy of every visual decision, copy string, layout chrome, role label, and server-action wiring. The first build ships fine. The first "rename this button across the app" change ships broken — N places need N edits, and the one that's missed becomes a silent regression.

This document names the discipline: for each *category* of content, decide up front whether it has a **single source of truth** (consumed by N places) or whether it's **localized** (lives only in the one place that uses it). The wrong call in either direction has a cost.

- Over-centralizing produces premature abstractions: a one-line "Add client" label gets a key in a content catalog, a typed lookup, a translation hook, and three layers of indirection for zero benefit.
- Under-centralizing produces grep-and-patch maintenance: every shared concept lives in N hardcoded copies, every "small change" is a multi-file refactor, and the build doesn't fail when one copy drifts from the others.

The principle is the same as DRY (Don't Repeat Yourself), but DRY applied dogmatically is its own anti-pattern. The judgment column in the table below is the actual deliverable of this protocol.

## Category-by-category SoT discipline

| Category | SoT? | Authoritative location (typical) | Rationale |
|---|---|---|---|
| Design tokens (colors, spacing, type, motion) | **Required** | `docs/design-system/tokens/tokens.json` → derived `tokens.css` / `tokens.ts` | Visual consistency; one token edit cascades everywhere. |
| UI primitives (Button, Input, Card, Alert, Dialog, …) | **Required** | `src/components/ui/*.tsx` | Behavior consistency, single accessibility contract, override-prop discipline. |
| Domain composites (BillingPlanCard, RenewalCard, status-message, page-header) | **Required** | `src/components/*.tsx` | Multi-consumer by construction; one edit cascades. |
| Server-side view-models (page DATA shape) | **Required** | `src/server/view-models/<route>.ts` | Pages stay dumb consumers; data contract has one home. |
| Server actions (form handlers) | **Required** | `app/<route>/actions.ts` | One form, one handler. Renames are atomic. |
| Role/plan/permission labels | **Required** | `src/server/view-models/shared.ts` (`getRoleCapabilities`, `getPlanLabel`, etc.) | Used in many surfaces; coherent product voice. |
| Nav items / app-shell structure | **Required** | `src/server/view-models/app-shell.ts` | Centralized nav editing. |
| Spec-bound copy (legal / regulatory / compliance / product-safety) | **Required** | `docs/design-system/06-screens/SCR-*.md` with `(spec-bound)` annotation | Edits are contract changes, not copy refinements. |
| Shared casual copy (used in ≥ 2 surfaces, e.g. disclaimers, footer text) | **Required** | `src/server/view-models/shared.ts` or `src/content/*.ts` catalog | Coherent voice; future i18n migration path. |
| Page-specific casual copy (used in exactly 1 surface) | **Localized** | Hardcoded in the page JSX | One-shot strings — SoT overhead exceeds benefit until the string proves it has multiple homes. |
| Per-page section headings (h2, h3 within a page) | **Localized** | Hardcoded in the page JSX | Page-specific by definition; centralizing creates indirection without cascade benefit. |
| Form field labels (inputs, selects, textareas) | **Localized** | Hardcoded in the form component | Tightly coupled to per-form layout and validation; lifting to a catalog adds friction without payoff. |
| Page layout chrome (`<main>` wrapper, default padding, default bg) | **Conditional** | Extract to `<PageShell>` when every page uses the same chrome; until then, inline | Premature `<PageShell>` is a tax on early variation. Once the pattern stabilizes (≥ 4 pages with identical chrome), extracting it pays back. |
| Empty-state illustrations / generic UI | **Conditional** | Extract to a shared component when used ≥ 2 places | Same trigger as PageShell — wait until the second consumer arrives. |

### When to flip a category from Localized to SoT

The signal is the second consumer. The moment a literal string, layout block, or recipe is needed in a second surface, extract it. Until then, inline is fine. Don't pre-extract on the assumption that the second consumer will arrive — premature SoT is its own anti-pattern.

Spec-bound copy is the exception: even single-consumer regulatory text gets a screen-spec home, because its contract value is the spec annotation, not the multi-consumer cascade.

## The content map

Every project that uses VisualForge maintains `docs/design-system/auditability/content-map.md`. This is the audit artifact that records the actual SoT decisions for the project — which surfaces are authoritative, which surfaces consume them, and what the blast radius is for each.

### Required sections

1. **Authoritative sources.** For each SoT category in the project, the file path or module that owns it.
2. **Consumer registry.** For each authoritative source, the list of consumers (route paths, component files, etc.) and the count.
3. **Blast-radius notes.** For each authoritative source, one line on what cascades when it changes (which routes rebuild, which probes re-run).
4. **Localized-by-design surfaces.** A short list of categories the team explicitly decided NOT to centralize, with the rationale. This is the anti-cargo-cult section — it prevents future agents from re-extracting things that were already decided to stay inline.
5. **Pending extractions.** Things the team has noticed should be lifted to SoT but hasn't yet. Useful for tracking second-consumer triggers as they arrive.

A minimal scaffold template lives in `examples/templates/content-map-template.md` (mirror this when generating per-project artifacts).

## The update rule

`content-map.md` is updated as part of the implementation slice — never as an afterthought, never in a separate "documentation pass."

A slice MUST update `content-map.md` when it:

- Adds a new file under `src/components/ui/**` (new UI primitive).
- Adds a new file under `src/components/**` (new domain composite).
- Adds a new `src/server/view-models/<route>.ts` (new page data contract).
- Adds a new `app/<route>/actions.ts` (new server-action module).
- Adds a new `docs/design-system/06-screens/SCR-*.md` (new screen spec).
- Adds a new consumer of an existing authoritative source (route N+1 starts importing an existing component).
- Renames or removes any of the above.
- Promotes a previously localized surface to SoT (e.g. extracting `<PageShell>` from N copies).

A slice does NOT need to update `content-map.md` when it:

- Refactors internal helpers without changing exports.
- Adds page-specific casual copy that has no other consumers.
- Touches per-page layout that does not (yet) repeat across pages.
- Edits component internals without changing the public API.

The rule is "public surface change → content-map change." Internal-only changes don't pollute the audit trail.

## Why update during the slice (not after)

Two failure modes that "documentation pass at the end" produces:

1. **Documentation drift.** The implementation merges, the doc-pass slice gets deprioritized, and the content map silently goes stale. Future agents read a stale map and reason from incorrect blast-radius assumptions.
2. **Lost knowledge.** The slice author knew the cascade reasoning while writing the code. By the time they (or someone else) writes the doc pass, the rationale has decayed. The audit entry becomes "I updated the file" rather than "this surface is consumed by routes X, Y, Z because their view-models all import it."

Updating during the slice keeps the map fresh and keeps the cascade reasoning attached to the implementation that produced it.

## Validation paths

### Manual

Reviewers check that every new file under the SoT-triggering directories has a `content-map.md` entry in the same PR. Missing entry → block merge.

### Automated (recommended)

A `check-content-map.mjs` script (or equivalent) that scans the SoT-triggering directories (`src/components/`, `src/server/view-models/`, `app/**/actions.ts`, `docs/design-system/06-screens/`) and verifies each public surface has a corresponding row in `content-map.md`. Wired into the project's verify gate (e.g. `pnpm verify`) so a missing entry fails fast.

Reference implementation pattern (RR uses this):

```js
// scripts/check-content-map.mjs
const trackedDirs = [
  { glob: "src/components/ui/*.tsx", section: "UI primitives" },
  { glob: "src/components/*.tsx", section: "Domain composites" },
  { glob: "src/server/view-models/*.ts", section: "View-models" },
  { glob: "app/**/actions.ts", section: "Server actions" },
  { glob: "docs/design-system/06-screens/SCR-*.md", section: "Screen specs" },
];
// For each file, assert the file's basename appears in content-map.md
// under the matching section. Exit 1 with file list if any missing.
```

This is a heuristic check, not a full dependency analysis. It catches the most common failure (new file, no map update) without trying to verify consumer counts or blast-radius prose — those remain reviewer concerns.

## What this protocol is NOT

- **Not an i18n system.** The content-map records WHERE strings live, not HOW translation keys are organized. An i18n catalog is a complementary system; the content map describes the catalog's structure when one exists.
- **Not a dependency graph.** Tools like Madge or ts-morph can produce real dependency graphs. The content map is a human-readable summary of the public-surface relationships, not a fine-grained import graph.
- **Not premature.** The discipline kicks in when a project has ≥ 5 routes / ≥ 10 components. Before that, an inline-everything approach has the right complexity floor. Apply this protocol when the team starts saying "we should rename X across the app" — that signal means the SoT decisions are about to matter.

## Cross-cite

- `regeneration-and-cascade-lifecycle.md` — the cascade-lifecycle protocol for the two backbone authorities (tokens.json + decision-log). This document extends the same principle to the broader surface set.
- `implementation-safety-contract.md` — every material decision names its authoritative source; this document operationalizes that as a per-project artifact.
- `test-discipline-and-mutation-protocol.md` § "Page-migration probe checklist" — content-map updates are part of the migration slice's deliverable, alongside the mutation log and the probe suite.
