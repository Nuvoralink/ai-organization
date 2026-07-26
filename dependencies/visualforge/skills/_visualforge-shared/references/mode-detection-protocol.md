# Mode Detection Protocol

VisualForge runs in one of three modes. Detect the mode at the start of the orchestrator and pass it to every subskill.

## Modes

- `MODE=greenfield` — No existing frontend code and no Specforge docs. Full discovery interview, full research pass, full design generation.
- `MODE=specforge-enhanced` — Specforge docs exist (look for `docs/app-plan/`). Read them as input context for product intent, users, features. Ignore Specforge's UI output (`product/05-ux-ui-content-contract.md`, `product/04-user-flows-and-screen-map.md`) as a design constraint — that file is basic, VisualForge will replace it. Skip questions answered by Specforge.
- `MODE=retrofit` — Existing frontend code is present. Run `drift-and-retrofit-protocol.md`.

Modes are not mutually exclusive: a project can be `MODE=specforge-enhanced + MODE=retrofit` if both signals exist. In that case both protocols apply.

## Detection signals

Run these checks in order at orchestrator start:

### Specforge presence

- `docs/app-plan/product/01-product-brief.md` exists → Specforge mode signal active.
- `docs/app-plan/product/02-prd.md` exists → confirm.
- `docs/app-plan/auditability/decision-log.md` exists → read existing decisions; do not duplicate IDs.

### Frontend code presence

- `package.json` contains any of: `react`, `vue`, `svelte`, `solid-js`, `@angular/core`, `next`, `nuxt`, `astro`, `remix-run`, `qwik`.
- `package.json` contains any of: `tailwindcss`, `styled-components`, `@emotion/react`, `vanilla-extract`, `stitches`.
- Any `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` files exist outside `node_modules`.
- A `tokens.*` file or `theme.*` file is present.

### Existing design system signals

- A `design-system/`, `design-tokens/`, `tokens/`, or `theme/` directory.
- A Storybook configuration (`.storybook/`).
- A `tailwind.config.*` with non-default theme extension.
- A Figma file URL referenced in README or docs.

## Detection report

Write `docs/design-system/auditability/mode-report.md`:

```markdown
# VisualForge Mode Report

- **Date:** YYYY-MM-DD
- **Detected modes:** [greenfield | specforge-enhanced | retrofit | combinations]
- **Specforge signals:** [list of files found, or "none"]
- **Frontend code signals:** [list of files / dirs found, or "none"]
- **Existing design system signals:** [list, or "none"]
- **Figma MCP availability:** available | fallback
- **Online research available:** yes | no

## Implications

- Discovery interview: [will run | partially skipped because Specforge brief covers items 1, 2, 4]
- Retrofit protocol: [will run | not applicable]
- Existing UI docs: [VisualForge will replace Specforge's UI docs | n/a]
- Decision log: [new file | extending existing Specforge log starting at DEC-NNN]
```

## Behavior per mode

### Greenfield

- Run full discovery interview (max 6 questions from `guided-design-interview-protocol.md`).
- Full research pass for every subskill.
- Generate all design docs in `docs/design-system/`.
- Skip retrofit protocol.

### Specforge-enhanced

- Read Specforge docs as input:
  - `01-product-brief.md` → product intent, target audience, brand positioning.
  - `02-prd.md` → feature list (drives component and screen scope).
  - `03-feature-scope.md` → MVP boundary.
  - User roles, permissions → drive permission states in UI.
- Treat Specforge's `04-user-flows-and-screen-map.md` and `05-ux-ui-content-contract.md` as *inventory only* — do not let them constrain VisualForge decisions.
- Skip discovery questions already answered by Specforge.
- Extend Specforge's decision log starting at the next available DEC-NNN.
- Mark every Specforge-derived input with source label `Specforge-derived` in decision cards.

### Retrofit

- Run inventory pass first (see `drift-and-retrofit-protocol.md`).
- Generate ideal design independent of inventory.
- Compute drift report.
- Produce phased migration plan.

## Mode locking

After the mode report is written, mode is locked for the run. If the user wants to change mode mid-run (e.g., "actually treat this as greenfield, ignore the repo"), the orchestrator must:

1. Confirm the change explicitly with the user.
2. Update `mode-report.md` with an entry noting the override and reason.
3. Re-run discovery if changing into greenfield.
4. Discard any prior retrofit or specforge-derived inputs as binding constraints.

## Document path mapping

All modes write design docs under `docs/design-system/` (not `docs/app-plan/` — that namespace belongs to Specforge). Files are organized into thematic sub-folders rather than flat-dumped. Numbered prefixes preserve a reading order across folders.

```
docs/design-system/
├── README.md                          # quick intro + index
├── RULES.md                           # canonical rules for future contributors
├── 00-index.md                        # navigation index across all docs
│
├── 01-foundations/
│   ├── design-brief.md
│   ├── competitive-audit.md
│   ├── design-trends-research.md
│   └── personas/
│       ├── _index.md
│       ├── persona-[slug].md          # one file per persona
│       └── ...
│
├── 02-visual-language/
│   ├── brand-identity.md
│   ├── design-tokens.md               # narrative + decisions; canonical values in tokens/
│   ├── surface-treatments.md
│   └── iconography.md
│
├── 03-structure/
│   ├── information-architecture.md
│   ├── layout-system.md
│   └── site-map.md                    # rendered Mermaid + node annotations
│
├── 04-interaction/
│   ├── ux-flows.md                    # narrative + journey maps
│   ├── content-design.md
│   ├── micro-interactions.md
│   ├── scroll-and-gesture.md
│   ├── imagery-illustration.md
│   └── motion-design.md
│
├── 05-components/
│   ├── _index.md                      # full inventory + dependency graph
│   ├── overview.md                    # narrative + library adopt/extend/replace policy
│   ├── primitives/
│   │   ├── Button.md
│   │   ├── Input.md
│   │   └── ...                        # one file per primitive
│   ├── composites/
│   │   ├── Card.md
│   │   ├── Dialog.md
│   │   └── ...
│   ├── patterns/
│   │   ├── TopBar.md
│   │   ├── DataTable.md
│   │   └── ...
│   └── domain/
│       └── ...                        # product-specific composites
│
├── 06-screens/
│   ├── _index.md                      # screen inventory table
│   ├── SCR-001-[slug].md              # one file per screen with all states
│   └── ...
│
├── 07-quality/
│   ├── accessibility-contract.md
│   ├── frontend-implementation-contract.md
│   └── design-qa-report.md
│
├── auditability/
│   ├── mode-report.md
│   ├── mcp-detection-report.md        # MCP availability + fallback paths used
│   ├── run-state.json                 # persisted run state for resume / checkpointing
│   ├── run-log.md                     # orchestrator status log (every-subskill checkpoint entry)
│   ├── decision-log.md                # canonical index of all decisions; ID ranges per allocation table
│   ├── decisions/                     # optional per-decision detail files for high-stakes DECs
│   │   ├── DEC-001-brand-attributes.md
│   │   └── ...
│   ├── research-ledger.md
│   ├── design-quality-review.md
│   ├── figma-build-log.md
│   ├── rules-update-log.md
│   ├── overrides-log.md               # every user override and its cascade summary
│   ├── pressure-test-iterations.md    # one entry per pressure-test → revise loop iteration
│   ├── drift-detection-report.md      # populated on subsequent runs
│   ├── deferred-findings.md           # IA restructuring items user deferred
│   ├── rejected-findings.md           # IA restructuring items user rejected
│   └── abandoned-runs/                # archived run-state.json files from runs not resumed
│       └── [run-id].json
│
├── retrofit/                          # retrofit mode only
│   ├── inventory.md                   # what exists in the codebase
│   ├── data-inventory.md              # entities + fields from data layer
│   ├── data-crosswalk.md              # screen × entity × field map
│   ├── backend-gaps.md                # fields design needs but backend lacks
│   ├── missing-surfaces.md            # data present but not surfaced anywhere
│   ├── ia-restructuring.md            # page splits / merges / missing / orphans
│   ├── drift-report.md                # current vs ideal across all design layers
│   └── migration-plan.md              # phased migration
│
├── tokens/
│   ├── tokens.json                    # canonical source (DTCG)
│   ├── tokens.css                     # generated
│   ├── tokens.ts                      # generated
│   ├── tokens.figma.json              # generated (Figma Variables import)
│   └── tailwind.config.example.js     # (or framework equivalent stub)
│
├── content/
│   └── microcopy.json                 # structured microcopy library for i18n
│
├── icons/
│   ├── semantic-map.md                # concept → icon mapping
│   └── custom/                        # custom SVGs when library lacks coverage
│
├── imagery/
│   ├── style-guide.md
│   └── examples/                      # reference treatments / do-and-don't
│
├── brand/
│   └── mood-board.md                  # curated visual references
│
└── figma-import-bundle/               # only when Figma MCP unavailable
    ├── variables.json
    ├── styles.json
    ├── components/
    ├── icons/
    └── IMPORT-INSTRUCTIONS.md
```

### Folder-organization rules

- **Never flat-dump.** No file lives at `docs/design-system/` root except `README.md`, `RULES.md`, and `00-index.md`.
- **One file per persona, component, and screen.** Inventory / index files (`_index.md`) summarize and link.
- **Generated artifacts** (`tokens.css`, `tokens.ts`, `tokens.figma.json`) live under `tokens/` and are produced by the build pipeline from `tokens.json`.
- **Auditability and retrofit** stay in their own sub-trees so they don't pollute the canonical design docs.
- **Specforge interop:** Specforge stays at `docs/app-plan/`. VisualForge cross-references it but never writes there.
- **00-index.md** is regenerated on every run with a current map of every file produced.
