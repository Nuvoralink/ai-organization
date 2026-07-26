# Figma MCP Integration Protocol

How VisualForge subskills detect, use, and gracefully fall back from the Figma MCP server.

## Three paths, not two

The Figma build subskill has three execution paths, not two:

### Path A — MCP available, team uses Figma
Build the design system directly in the user's Figma file via Figma MCP. Full sync. Live editing.

### Path B — No MCP but team uses Figma
Produce `figma-import-bundle/` directory. Designer uses Figma plugins to import.

### Path C — Team does not use Figma at all
Common cases:
- Team uses Penpot, Sketch, Lunacy, Affinity Designer.
- Team designs in code only (Storybook + token files; no design tool).
- Solo developer with no design tool.

For Path C:
- Skip the Figma artifact entirely. Do not produce `figma-import-bundle/`.
- Produce instead: `docs/design-system/handoff/design-tool-agnostic.md` describing the tokens, components, and patterns in tool-agnostic prose with code samples, so the team can re-implement in their chosen tool (or none).
- Storybook becomes the primary visual reference (Path C teams already use Storybook or similar).
- `figma-build-log.md` records: "Team does not use Figma. Skipped. Storybook + handoff doc cover the visual reference need."

### Detection of Path C
Ask the user during Step 0a (MCP detection) or Step 0c (mode detection):

```
Does your team use Figma?
(a) Yes — and I have Figma MCP installed [Path A]
(b) Yes — but no Figma MCP available [Path B]
(c) No, we use [other tool / code only / nothing] [Path C]
```

If the user is in Auto mode and no Figma MCP is detected, default to Path B but log it; users in Path C should explicitly state so the skill doesn't waste effort producing an unused bundle.

## Detection

At the start of any subskill that may write to Figma, detect MCP availability by checking for Figma MCP tools in the available toolset. Expected tool names include any of:

- `mcp__Figma__*` (current naming as of 2026)
- `mcp__figma__*`
- Any tool whose name contains `figma` and supports write actions like `create_design_system_rules`, `create_new_file`, `use_figma`.

If detected, set mode `FIGMA_MCP=available`. If not detected, set mode `FIGMA_MCP=fallback`.

Record the detection result at the top of `docs/design-system/auditability/figma-build-log.md`:

```markdown
# Figma Build Log

- **MCP detection result:** available | fallback
- **Detected tools:** [list]
- **Date:** YYYY-MM-DD
```

## Subskills that interact with Figma

The Figma build pass happens in `visualforge-figma-build`, but the following subskills produce artifacts that are Figma-ready and must conform to the export spec:

- `visualforge-design-tokens` — exports `tokens.figma.json` (Figma Variables plugin format).
- `visualforge-iconography` — exports icon set as Figma-importable SVGs.
- `visualforge-component-system` — exports component specs as Figma-component-buildable definitions.
- `visualforge-brand-identity` — exports color and typography styles.
- `visualforge-motion-design` — exports motion tokens as Figma variables (since variables now support time values).

Each subskill must produce its Figma-format artifact regardless of MCP availability. The MCP path *applies* the artifact; the fallback path *exports* it for manual import.

## Mode: available

When MCP is detected, `visualforge-figma-build` performs:

1. **Read VisualForge metadata** — pull all decision IDs, token names, and component specs from the design docs.
2. **Read or create the target Figma file** — ask the user for an existing file URL or create a new one.
3. **Apply variables** — primitive color variables → semantic color variables → component variables, in that order so references resolve.
4. **Apply text styles** — type scale.
5. **Apply effect styles** — shadows, glass blurs.
6. **Create grid styles** — layout grid presets.
7. **Build component frames** — one per component in the inventory, with all states as variants.
8. **Build screen frames** — example screens from the UX flows document.
9. **Verify** — run a read-back pass: every named token in the design docs must exist in Figma with the same value.
10. **Log** every action in `figma-build-log.md` with the Figma node ID created or updated.

Before running any write action, the subskill must invoke the `figma-use` skill (or its equivalent) per the host environment's protocol. Do not skip this — it prevents the most common MCP failures.

## Mode: fallback

When MCP is not detected, `visualforge-figma-build` performs:

1. Produce `figma-import-bundle/` directory with:
   - `variables.json` — Figma Variables plugin import format.
   - `styles.json` — Figma styles (colors, text, effects).
   - `components/` — one `.svg` or `.fig`-importable JSON per component spec.
   - `icons/` — icon SVG set.
   - `screens/` — example screen mockups as SVG or PNG specs.
   - `IMPORT-INSTRUCTIONS.md` — exact steps for a human to import using the Figma Variables Import plugin and Figma's component duplication tooling.
2. Log the fallback path taken and the reason ("MCP unavailable") in `figma-build-log.md`.
3. Do not silently skip — every Figma deliverable must exist in one form or another.

## Format: `variables.json` (Figma Variables import)

Use the Figma Variables Import plugin format:

```json
{
  "collections": [
    {
      "name": "Primitives",
      "modes": ["Default"],
      "variables": [
        {
          "name": "color/blue/500",
          "type": "color",
          "values": { "Default": "#3B82F6" }
        }
      ]
    },
    {
      "name": "Semantic",
      "modes": ["Light", "Dark"],
      "variables": [
        {
          "name": "color/surface/primary",
          "type": "color",
          "values": {
            "Light": { "type": "alias", "ref": "color/white" },
            "Dark":  { "type": "alias", "ref": "color/gray/950" }
          }
        }
      ]
    }
  ]
}
```

## Format: `styles.json`

```json
{
  "textStyles": [
    {
      "name": "Display/2XL",
      "fontFamily": "Inter",
      "fontWeight": 700,
      "fontSize": 72,
      "lineHeight": 1.0,
      "letterSpacing": "-0.04em"
    }
  ],
  "effectStyles": [
    {
      "name": "Shadow/Card/Rest",
      "type": "DROP_SHADOW",
      "layers": [
        { "x": 0, "y": 1, "blur": 2, "spread": 0, "color": "#0A0A0A14" },
        { "x": 0, "y": 2, "blur": 4, "spread": 0, "color": "#0A0A0A10" },
        { "x": 0, "y": 4, "blur": 8, "spread": 0, "color": "#0A0A0A0C" },
        { "x": 0, "y": 8, "blur": 16, "spread": 0, "color": "#0A0A0A08" }
      ]
    }
  ]
}
```

## Component spec format

Each component exported for Figma must include:

- Component name and slug.
- Variant matrix: every prop × every state.
- Auto-layout configuration (direction, gap, padding, alignment).
- Constraints (resizing behavior).
- Bound variables (which tokens drive which properties).
- Interactive state recipes (Figma prototype rules for hover, press, etc.).

## Verification pass

Whether MCP-built or fallback-bundled, the build subskill must run a verification pass:

- Every token in `tokens.json` has a matching entry in `variables.json` or in the live Figma file.
- Every component in `component-inventory.md` has a Figma component or bundled spec.
- Every screen in `ux-flows.md` has a mockup or spec.
- Every shadow / blur / gradient in `surface-treatments.md` has an effect style.

Mismatches block completion. Either fix the mismatch or document it in `figma-build-log.md` with the reason and remediation owner.

## Multi-host MCP variants

VisualForge runs under Claude Code and Codex. Figma MCP tool names may differ across hosts. The build subskill must:

1. Search for any tool with `figma` in the name and write capabilities.
2. Try the canonical names first (`mcp__Figma__create_design_system_rules`, `mcp__Figma__use_figma`).
3. If found under a different prefix, use the host-namespaced version.
4. Record the discovered tool prefix in `figma-build-log.md` so subsequent calls in the same session use the same.

## Safety rules

- Never destroy an existing Figma file. Always create new pages or new components, or update only nodes explicitly tagged with the VisualForge metadata.
- Tag every node VisualForge creates with a description containing `visualforge:DEC-NNN` so future runs can identify and update them.
- Confirm with the user before applying to a Figma file with > 10 existing pages.
- If a Figma file already has a design system, ask the user to choose: (a) augment with prefix `vf/`, (b) replace VisualForge-managed nodes only, or (c) create a new file. Default recommendation: option (c).
