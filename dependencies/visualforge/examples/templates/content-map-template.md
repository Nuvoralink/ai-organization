# Content map — &lt;project&gt;

Authoritative-source registry and consumer ledger for this project. Required artifact per VisualForge `shared-contracts-and-blast-radius.md`.

**Update rule.** Modify this file in the same slice that adds, renames, or removes a public surface (component, server action, view-model, screen spec) or adds a new consumer of an existing surface. Do NOT save updates for a separate documentation pass — the cascade reasoning decays.

---

## 1. Authoritative sources

For each SoT category active in this project, name the file or module that owns it. If a category does not apply, write "n/a — not in scope" with one-line rationale (don't delete the row — the deliberate-omission record is the audit value).

| Category | Authoritative location | Notes |
|---|---|---|
| Design tokens | `docs/design-system/tokens/tokens.json` → derived `tokens.css`, `tokens.ts` | Edit JSON, regenerate via &lt;script path&gt;. |
| UI primitives | `src/components/ui/*.tsx` | Each primitive has its own DEC reference in `decision-log.md`. |
| Domain composites | `src/components/*.tsx` (non-`ui/` files) | |
| View-model data contracts | `src/server/view-models/<route>.ts` | One file per route. |
| Server actions | `app/<route>/actions.ts` | One file per route's form handlers. |
| Role / plan / permission labels | `src/server/view-models/shared.ts` | Exports `getRoleCapabilities`, `getPlanLabel`, etc. |
| Nav items / app-shell | `src/server/view-models/app-shell.ts` | |
| Spec-bound copy | `docs/design-system/06-screens/SCR-*.md` (with `(spec-bound)` annotation) | |
| Shared casual copy (multi-consumer) | `src/server/view-models/shared.ts` (constants) OR `src/content/*.ts` (catalog) | List per-string in section 2. |

## 2. Consumer registry

For each authoritative source above that has multiple consumers, list them. The count is the blast-radius number — how many surfaces re-render when the source changes.

### UI primitives

| Primitive | Defined in | Consumers (count) | Cascade notes |
|---|---|---|---|
| Button | `src/components/ui/button.tsx` | (list routes) | Token bindings to `--vf-accent-primary*`. Any token edit re-renders every Button. |
| Input | `src/components/ui/input.tsx` | (list routes) | |
| ... | | | |

### Domain composites

| Composite | Defined in | Consumers (count) | Cascade notes |
|---|---|---|---|
| StatusMessage / StatusBadge | `src/components/status-message.tsx` | (list routes) | Tone palette migration cascades to every consumer. |
| PageHeader | `src/components/page-header.tsx` | (list routes) | Eyebrow / back-link / action-slot contract; changes affect every route header. |
| ... | | | |

### View-models

| View-model | Route | Consumes (other view-models, services) |
|---|---|---|
| `getDashboardViewModel` | `/dashboard` | `getAppShellViewModel`, `reminderServiceDisclaimer`, ... |
| `getBillingPageViewModel` | `/billing` | ... |
| ... | | |

### Shared casual copy constants

| Constant | Defined in | Consumers (count) | Spec-bound? |
|---|---|---|---|
| `reminderServiceDisclaimer` | `src/server/view-models/shared.ts` | (count + routes) | Product-safety wording. Treat edits as spec-track. |
| ... | | | |

### Screen specs (spec-bound copy)

| Spec | Path | Bound strings | Acceptance probes (test file) |
|---|---|---|---|
| SCR-BILLING-RETURN | `docs/design-system/06-screens/SCR-BILLING-RETURN.md` | "Paid access is not granted by this return page.", ... | `tests/components/billing-return-pages.test.tsx` |
| ... | | | |

## 3. Localized-by-design surfaces

The team explicitly decided NOT to centralize these. Future agents: do not lift these to SoT without re-discussing.

- Page-specific empty-state copy (e.g. "No clients yet. Add a client...") — one-shot strings; SoT overhead exceeds benefit.
- Per-form field labels — coupled to per-form layout and validation; lifting to a catalog adds friction without payoff.
- Per-page section headings (h2, h3 within a page) — page-specific by definition.
- &lt;add others as decided&gt;

## 4. Pending extractions

Surfaces that have been noticed as potential SoT candidates but have not yet been extracted. Each row records the trigger (second consumer arriving) and the planned extraction location.

| Surface | Current location(s) | Trigger | Planned SoT location |
|---|---|---|---|
| Page chrome (`<main className="min-h-svh bg-... px-6 py-8 text-...">`) | Duplicated across &lt;N&gt; routes | All &lt;N&gt; routes now use identical chrome | `src/components/page-shell.tsx` (slice TBD) |
| ... | | | |

## 5. Blast-radius events (changelog of cascading changes)

When a token, primitive, or domain composite is edited in a way that cascades to multiple consumers, record the event here. This is the cumulative cascade log — the audit trail that links a one-line token edit to the N routes that re-rendered.

| Date | Source changed | Cascade scope | Mutation-log entry |
|---|---|---|---|
| YYYY-MM-DD | `tokens.json:--vf-accent-primary` | All 12 routes consuming Button + every primary-action link | (link to mutation log) |
| ... | | | |
