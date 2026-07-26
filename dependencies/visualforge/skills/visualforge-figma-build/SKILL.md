---
name: visualforge-figma-build
description: Build the design system in Figma — variables, styles, components, screens — using Figma MCP when available; export a Figma-importable bundle when not. Verify parity with the markdown design docs.
---

# Figma Build

Shared references at `../_visualforge-shared/references/`. Use them when needed. Especially `figma-mcp-integration-protocol.md`.

## Global quality rules

- Read `figma-mcp-integration-protocol.md` carefully.
- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Never destructively modify an existing Figma file without confirmation.
- Always log every Figma operation to `auditability/figma-build-log.md`.
- Tag every node created with `visualforge:[DEC-ID]` so future runs can identify and update.
- Maintain `decision-log.md`.

## Purpose

Make the design system real and editable in Figma so designers can use it. The markdown docs are the source of truth; Figma is a rendered mirror that designers extend, with VisualForge providing the initial scaffold.

## Mode-aware behavior

- **Figma MCP available:** Build directly into a Figma file via MCP tools.
- **Figma MCP unavailable:** Export a `figma-import-bundle/` directory with Variables JSON, styles JSON, component specs, icon SVGs, and an `IMPORT-INSTRUCTIONS.md` for a human to import.

## Detection

At start, detect Figma MCP tools per `figma-mcp-integration-protocol.md`. Common tool prefixes:

- `mcp__Figma__*`
- `mcp__9fab7e35-1142-425d-bd8f-1c7fdeba1c7e__*` (host-specific)
- `mcp__figma__*`

Search for tools matching `use_figma`, `create_design_system_rules`, `create_new_file`, `get_variable_defs`, `get_metadata`. If any are present, MCP is available.

Before any `use_figma` call, **invoke the `figma-use` skill first** per host protocol — this is mandatory in environments that have it (it prevents common MCP failures).

## Inputs

- All produced design docs.
- All produced token files (`tokens.json`, `tokens.figma.json`).
- User-provided Figma file URL (if existing target) — otherwise create new.
- Brand asset files (logos, marks).

## Output files

- `docs/design-system/auditability/figma-build-log.md` — full log.
- If MCP unavailable: `docs/design-system/figma-import-bundle/` directory.
- Decision-log entries (DEC-965 to DEC-979, overflow DEC-980 to DEC-984) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Execution order (MCP available)

### Step 0: Confirm target file
1. If user provided a Figma URL, confirm it.
2. Else: create a new file named `[product] — Design System`.
3. Confirm with user before proceeding if file has > 10 existing pages.
4. Log target in `figma-build-log.md`.

### Step 1: Page structure
Create or update pages:
- `🎨 Cover`
- `📐 Foundations` (variables overview, type, spacing, radius)
- `🎨 Colors` (palette swatches)
- `📝 Typography` (type scale samples)
- `🖼 Surfaces & Shadows` (elevation samples)
- `🧩 Icons` (icon set)
- `🧱 Components` (one frame per component)
- `📱 Screens` (representative screen mocks per UX flow)
- `📝 Notes` (decisions, drift, change log)

### Step 2: Variables (collections + modes)

Read `tokens.figma.json`. Create collections in this order to allow references to resolve:

1. `Primitives` collection — Default mode. Colors, spacing, sizes, durations.
2. `Semantic` collection — `Light` and `Dark` modes. Aliases to primitives.
3. `Component` collection — Default mode. Aliases to semantic.

For each variable, set name, type, value(s) per mode.

### Step 3: Styles

Create text styles from typography scale (display/heading/body/mono variants).

Create effect styles from shadow recipes (rest/hover/pressed/modal levels) and glass blur (if adopted).

Create grid styles from layout system (mobile / tablet / desktop column grids).

### Step 4: Icon library

Import icon set from chosen library + custom icons (see iconography subskill).

Place each icon as a component on the Icons page in semantic groups.

### Step 5: Components

For each component in the component inventory:

1. Create a main component frame.
2. Apply auto-layout per component spec.
3. Bind props to variables (fills, text styles, sizing).
4. Create variant matrix (variant × size × state).
5. Add component description with `visualforge:DEC-NNN` tag.
6. Document slots and props in the component description.

Recommended order (dependency-aware):

- Primitives first: Button, Input, Checkbox, Radio, Switch, Avatar, Badge, Tag, Icon.
- Composites next: Tabs, Accordion, Tooltip, Popover, Menu, Dialog, Drawer, Toast.
- Patterns last: TopBar, SideBar, Card variants, DataTable, FilterBar, EmptyState.

### Step 6: Screens

For each persona × primary task, build one example screen frame using the components. These are not exhaustive — they are reference compositions.

### Step 7: Notes page

Insert:
- Decision log summary linked to docs.
- Drift report summary (if retrofit).
- Migration plan summary (if retrofit).
- Design QA outcome.
- Last regeneration date.

### Step 8: Verification

Run a read-back pass:

- For every Tier 1, 2, 3 token in `tokens.json`, verify the variable exists in Figma with the same value.
- For every component in the inventory, verify a Figma component exists.
- For every shadow recipe, verify an effect style exists.

Mismatches are blockers — fix or document.

### Step 9: Log
- Write `figma-build-log.md` with every action taken, node IDs created or updated, time stamps.

## Execution order (MCP unavailable — fallback bundle)

Produce a complete bundle in `docs/design-system/figma-import-bundle/`:

```
figma-import-bundle/
├── variables.json                # Figma Variables Import plugin format
├── styles.json                   # Text styles + effect styles
├── icons/
│   ├── lucide-action-add.svg
│   ├── (every icon used)
├── components/
│   ├── Button.spec.md            # detailed spec for designer to build
│   ├── Input.spec.md
│   └── (every component)
├── screens/
│   ├── workspace-overview.spec.md
│   └── (every example screen)
└── IMPORT-INSTRUCTIONS.md
```

`IMPORT-INSTRUCTIONS.md` includes:

1. Recommended Figma plugins: "Variables Import", "Style Importer", "SVG Importer".
2. Step-by-step: create file → import variables.json → import styles.json → import icon SVGs → build components per specs.
3. Component build order (same as MCP path).
4. Validation checklist.
5. How to re-sync after VisualForge regenerates docs.

## Safety rules

- **Never delete** existing Figma nodes unless explicitly tagged `visualforge:` and the user confirms.
- **Never replace** existing variables / styles without preserving names and adding `vf/` prefix if user wants to coexist.
- **Confirm before destructive actions:** clearing pages, replacing components.
- **On detected conflict** (file already has a design system): ask user to choose:
  - (a) Augment with `vf/` prefix on all VisualForge-created nodes.
  - (b) Replace only nodes tagged `visualforge:` (no-op for first run).
  - (c) Create a new Figma file instead.
  - Default recommendation: (c).

## Decision cards

- DEC-966 Figma build mode (MCP / fallback).
- DEC-967 Target file (new or existing URL).
- DEC-968 Conflict resolution mode (augment / replace-tagged / new-file).
- DEC-969 Verification result (parity confirmed / discrepancies listed).
- DEC-970 Asset import (icons, brand mark).
- DEC-971 Update cadence (one-off / re-sync on regeneration).
- DEC-972 Hand-off notes.

## Quality gate

- Detection result logged.
- Page structure created.
- All variables, styles, components, icons exist (built or bundled).
- Screen example frames built per persona × primary task.
- Verification parity pass.
- `figma-build-log.md` complete.

## Sources and basis

Per-build action logged; Figma MCP protocol followed; conflict-handling per protocol.
