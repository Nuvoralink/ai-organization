---
name: visualforge-agent-rules-update
description: Anti-drift safeguard — update AGENTS.md, CLAUDE.md, .cursorrules, .continue/rules, .github/copilot-instructions.md, and create RULES.md so future AI agents and human contributors treat the design system as source of truth and never silently override it.
---

# Agent Rules Update

Shared references at `../_visualforge-shared/references/`. Use them when needed. Especially `rules-update-protocol.md`.

## Global quality rules

- Read `rules-update-protocol.md` carefully.
- Idempotent: re-running VisualForge must update the rules block in-place, not duplicate it.
- Never destroy existing rules. Detect conflicts and surface them to the user.
- Match host-specific syntax (Markdown vs MDC vs YAML).
- Maintain `decision-log.md`.

## Purpose

The final subskill. After the design system is built, this updates agent-instruction files so future contributors (human and AI) read the design docs as source of truth, never invent tokens, never override decisions silently, and follow the migration plan if retrofitting.

Without this step, VisualForge is just docs — drift starts on day two. With this step, the design system is load-bearing in the development workflow.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Create rules from scratch, append to existing agent files if any.
- **Retrofit:** Same, but also include migration-plan reference in rules.

## Inputs

- All produced design docs (paths, decisions, token files).
- Existing `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.continue/rules/*`, `.github/copilot-instructions.md` if present.
- Mode report (to determine retrofit-specific rules).

## Output files

- `docs/design-system/RULES.md` — canonical design-system rules document.
- Updates to: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.continue/rules/visualforge.md`, `.github/copilot-instructions.md` (only those already present, or warranted by host signal).
- `docs/design-system/auditability/rules-update-log.md` — log of what was updated.
- Decision-log entries (DEC-1220 to DEC-1239, overflow DEC-1240 to DEC-1244) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Execution

### Step 1: Detect existing agent files

Check for:
- `AGENTS.md` at repo root.
- `CLAUDE.md` at repo root.
- `.cursorrules` at repo root or `.cursor/rules/` directory.
- `.continue/rules/` directory.
- `.github/copilot-instructions.md`.

For each: record presence, last modification date if accessible.

### Step 2: Build the canonical rules block

Use the template from `rules-update-protocol.md` and parameterize with:

- WCAG level target.
- Mode (greenfield / specforge-enhanced / retrofit).
- Migration plan reference (retrofit only).
- List of `Temporary` decisions with removal triggers.
- Open questions.

### Step 3: Update each agent file (idempotent)

For each target file present:

1. Read existing content.
2. Search for marker `## VisualForge Design System (do not violate)`.
3. If found: replace block from marker to next `## ` heading or EOF.
4. If not found: append the block.
5. Adapt syntax (e.g., MDC frontmatter for Cursor rules, YAML for Continue).
6. Write the file.

### Step 4: Create `docs/design-system/RULES.md`

The canonical rules doc, generated fresh every run. Contains:

```markdown
# Design System Rules

Last regenerated: [date] by VisualForge.

## Source of truth

The design system at `docs/design-system/` is the source of truth for:
- All visual values (color, spacing, type, shadow, motion, radius).
- All component specifications.
- All accessibility guarantees.
- All micro-interaction behavior.
- The frontend implementation contract.

## Document map

```
docs/design-system/
├── 00-index.md                                # generated file map
├── 01-foundations/
│   ├── design-brief.md                        # platform, audience, a11y level, theming
│   ├── competitive-audit.md                   # conventions + differentiation
│   ├── design-trends-research.md              # adopted / rejected trends
│   └── personas/                              # one file per persona
├── 02-visual-language/
│   ├── brand-identity.md                      # attributes + visual mechanisms
│   ├── design-tokens.md                       # narrative; canonical values in tokens/
│   ├── surface-treatments.md                  # materials, shadows, glass
│   └── iconography.md
├── 03-structure/
│   ├── information-architecture.md
│   ├── layout-system.md
│   └── site-map.md
├── 04-interaction/
│   ├── ux-flows.md
│   ├── content-design.md
│   ├── micro-interactions.md
│   ├── scroll-and-gesture.md
│   ├── imagery-illustration.md
│   └── motion-design.md
├── 05-components/                             # one file per component
│   ├── _index.md
│   ├── overview.md
│   ├── primitives/  composites/  patterns/  domain/
├── 06-screens/                                # one file per screen
│   ├── _index.md
│   └── SCR-NNN-[slug].md
├── 07-quality/
│   ├── accessibility-contract.md
│   ├── frontend-implementation-contract.md
│   └── design-qa-report.md
├── tokens/                                    # tokens.json is canonical
├── content/microcopy.json
├── icons/  imagery/  brand/
├── auditability/                              # decision-log, research-ledger, etc.
└── retrofit/                                  # only in retrofit mode
    ├── data-inventory.md                      # entities + fields
    ├── ia-restructuring.md                    # page splits / merges / missing
    ├── drift-report.md
    └── migration-plan.md
```

## Token tier rules

- Tier 1 (primitives): only referenced by Tier 2 and 3 token definitions.
- Tier 2 (semantic): referenced by app code.
- Tier 3 (component-scoped): referenced only inside component internals.
- App code references Tier 2 only.

## Hard rules (do not violate)

1. **Never invent a token.** Add to `tokens.json` first via decision card.
2. **Never override a decision silently.** Use the decision log or re-run VisualForge.
3. **Never bypass a component.** Use the existing one or add a new one with a spec.
4. **Never break the accessibility contract.** Target: WCAG 2.2 [level].
5. **Never break the motion contract.** Honor `prefers-reduced-motion`. Use motion tokens.
6. **Never break the design QA gates.** Run validation before merge.

## Soft rules

- Read the relevant design doc before editing related code.
- When unsure, surface the question rather than assume the design doc is wrong.

## Files requiring a decision card before edit

- `docs/design-system/tokens/tokens.json` and derived files.
- Any file under `docs/design-system/05-components/`.
- `docs/design-system/02-visual-language/design-tokens.md`.
- `docs/design-system/07-quality/accessibility-contract.md`.
- Anything in `docs/design-system/auditability/`.
- Anything in `docs/design-system/retrofit/` (the drift report and migration plan are load-bearing for staged rollout).

## How to add a new component

1. Add a decision card to `auditability/decision-log.md` (DEC-NNN, justify why this component is needed and why no existing component fits).
2. Add a per-component spec to `components/[ComponentName].md` (use the template in `12-component-system.md`).
3. Define any new Tier 3 tokens needed in `tokens.json`.
4. Implement following the spec.
5. Add Storybook story per variant × state.
6. Run validation script.

## How to add a new token

1. Decision card.
2. Add to `tokens.json` (correct tier).
3. Run token build pipeline to regenerate `tokens.css`, `tokens.ts`, `tokens.figma.json`.
4. Sync Figma variables (via Figma build subskill or import plugin).
5. Run validation script.

## How to propose a design change

1. Open a decision card describing the change, alternatives, why this is better.
2. Run `Use $visualforge-[affected-subskill] to update [section] with [change]`.
3. Affected docs and tokens regenerate; drift detection identifies the cascade.
4. Run design QA.
5. Merge.

## Temporary decisions

[populated from decision log entries marked Temporary, with removal triggers]

## Open questions

[populated from open questions across docs]

## Validation

Run `scripts/validate_design_docs.py` before merging design system changes.

## Regeneration

To regenerate from a higher-level constraint change (e.g., new audience, new platform):
`Use $visualforge to update the design system: [change]`

To extend a single subskill:
`Use $visualforge-[name] to [task]`
```

### Step 5: Conflict resolution

If an existing agent file has rules contradicting VisualForge's rules (e.g., existing rule says "use Tailwind defaults" but VisualForge tokens override Tailwind), surface the conflict:

1. Show user both versions.
2. Ask which wins.
3. Apply chosen resolution.
4. Log the resolution in `rules-update-log.md`.

### Step 6: Drift detection (on subsequent runs)

On regeneration:

1. Detect any hex / rgb / px values in source code that bypass tokens (grep + flag).
2. Detect any UI built without a referenced component (heuristic: check for raw `<button>` outside of the design system component).
3. Detect any token edited without a corresponding decision card.

Write findings to `docs/design-system/auditability/drift-detection-report.md`.

### Step 7: Rules-update log

```markdown
# Rules Update Log

## YYYY-MM-DD — VisualForge run [id]

- Mode: [mode]
- Files updated:
  - AGENTS.md: created | appended | skipped (not present)
  - CLAUDE.md: created | appended | skipped
  - .cursorrules: appended | skipped
  - .continue/rules/visualforge.md: created | skipped
  - .github/copilot-instructions.md: appended | skipped
  - docs/design-system/RULES.md: created/regenerated
- New decision IDs: DEC-NNN to DEC-MMM
- New tokens: [count]
- New components: [list]
- Temporary decisions active: [list]
- Open questions: [list]
- Conflicts resolved: [list with chosen resolution]
- Drift findings (subsequent runs): [list]
```

## Anti-slop rules-update rules

- Updating one agent file without others (when present) fails consistency.
- Rules block without specific file paths (uses placeholder "your-design-system" instead of actual) fails.
- Generic "follow the design system" rules without specifics fail.
- Duplicate rules blocks fail idempotency.

## Quality gate

- All present agent files updated idempotently.
- `RULES.md` regenerated with current state.
- `rules-update-log.md` written.
- Conflict resolutions confirmed with user.
- Drift findings (if regeneration) reported.

## Sources and basis

Rules derived from `rules-update-protocol.md` parameterized with this run's outputs.
