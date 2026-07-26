# Rules Update Protocol

The anti-drift safeguard. After VisualForge produces the design system, future contributors (human designers, frontend engineers, Codex agents, Claude Code agents, Cursor agents) must read the design docs as the source of truth and never silently override them.

This protocol is executed by `visualforge-agent-rules-update` at the end of every run. It updates agent-instruction files in the target repo so design drift is prevented at the agent level.

## Files to update

VisualForge writes or appends to the following, depending on what the repo already has:

- `AGENTS.md` — universal agent instructions (Codex, Claude, Cursor, Continue, Aider). Append a section if exists, create if not.
- `CLAUDE.md` — Claude Code instructions. Append a section if exists, create if not.
- `.cursorrules` or `.cursor/rules/visualforge.mdc` — Cursor IDE rules.
- `.continue/rules/visualforge.md` — Continue.dev rules.
- `.github/copilot-instructions.md` — GitHub Copilot workspace instructions.
- `docs/design-system/RULES.md` — canonical design-system rules referenced by all the above.

If a file does not exist and the repo is small / there's no signal the host uses it, do not create it — only update files that show signal.

## The canonical rules block

Append this block to every agent file (adapted to file syntax):

```markdown
## VisualForge Design System (do not violate)

This repo uses a VisualForge-generated design system located at `docs/design-system/`. Treat it as the source of truth for all visual, interaction, and frontend implementation decisions.

### Hard rules

1. **Never invent a token.** All color, spacing, typography, shadow, motion, and radius values must come from `docs/design-system/tokens/tokens.json` (or the generated `tokens.css` / `tokens.ts`). If a needed value does not exist, add a decision card to `docs/design-system/auditability/decision-log.md` first, then add the token, then use it.
2. **Never override a decision silently.** Every change to a design decision requires either (a) an entry in `decision-log.md` with the override rationale, or (b) running VisualForge again with the new constraint. Drive-by changes to colors, type, shadows, components, or motion are forbidden.
3. **Never bypass a component.** If a component exists in `docs/design-system/12-component-system.md`, use it. Do not implement a parallel component. If a needed component is missing, add a decision card and component spec first.
4. **Never break the token tier rule.** App code references Tier 2 semantic tokens only. Component internals reference Tier 3. Tier 1 primitives are only referenced by token definitions.
5. **Never break the accessibility contract.** Every change must preserve the WCAG 2.2 [level] target documented in `17-accessibility-contract.md`. If you cannot, mark it `Temporary` in the decision log with a removal trigger.
6. **Never break the motion contract.** Honor `prefers-reduced-motion`. Use motion tokens from `tokens.json`. Do not introduce ad-hoc easing curves or durations.
7. **Never break the design QA gates.** Visual regression, a11y check, and perf budget pass before merging changes to design-system files.

### Soft rules

- Prefer to read the relevant design doc before editing a component.
- When unsure, ask the user before deviating; do not assume the design doc is wrong.
- When the repo is in `MODE=retrofit`, follow the migration plan in `docs/design-system/retrofit/migration-plan.md` — do not jump phases.

### Files you may edit freely

- Implementation files that consume tokens and components.
- New routes / screens that assemble existing components.
- Content and copy in microcopy library.

### Files that require a decision card before edit

- `docs/design-system/tokens/tokens.json` and derived token files.
- `docs/design-system/12-component-system.md`.
- `docs/design-system/06-design-tokens.md`.
- `docs/design-system/17-accessibility-contract.md`.
- Anything in `docs/design-system/auditability/`.

### To regenerate or extend the design system

Run VisualForge: `Use $visualforge to extend the design system with [new requirement]`.
Or for a specific subskill: `Use $visualforge-[name] to update [section]`.
```

## `docs/design-system/RULES.md`

This file is the canonical rules document. It contains the rules block above plus:

- A map of every design doc and what it owns.
- A map of every token category and its file location.
- Pointers to the validation script.
- A "how to add a new component" recipe.
- A "how to add a new token" recipe.
- A "how to propose a design change" recipe.
- A list of `Temporary` decisions and their removal triggers.
- A list of all known open questions.

## Rules update log

After updating the rule files, write `docs/design-system/auditability/rules-update-log.md`:

```markdown
# Rules Update Log

## YYYY-MM-DD — VisualForge run [run-id]

- **Mode:** greenfield | specforge-enhanced | retrofit
- **Files updated:**
  - AGENTS.md: created | appended | skipped (not present)
  - CLAUDE.md: created | appended | skipped
  - .cursorrules: appended | skipped
  - docs/design-system/RULES.md: created/regenerated
- **New decision IDs added:** DEC-NNN to DEC-MMM
- **New tokens added:** [count by tier]
- **New components added:** [list]
- **Temporary decisions active:** [list with removal triggers]
- **Open questions surfaced:** [list]
```

## Idempotency

Running VisualForge multiple times must not duplicate the rules block. The subskill must:

1. Search for the marker `## VisualForge Design System (do not violate)` in each target file.
2. If present, replace the block from that marker to the next `## ` (or EOF) with the new block.
3. If absent, append a fresh block.

Never produce two copies of the rules in the same file.

## Conflict resolution

If a target file (e.g., `AGENTS.md`) contains rules that contradict VisualForge's rules, surface the conflict instead of silently overwriting:

1. Read the existing file.
2. Identify contradictions (e.g., existing "use Tailwind defaults" conflicts with VisualForge tokens).
3. Show the user both versions.
4. Ask which wins, then update accordingly.
5. Log the resolution in `rules-update-log.md`.

## Drift detection (later runs)

On subsequent VisualForge runs, the rules-update subskill detects drift:

- Does the codebase use any hex color not in `tokens.json`?
- Does any component file bypass the design-system component for the same purpose?
- Has anyone edited a token without a decision card?

Drift findings go in `docs/design-system/auditability/drift-detection-report.md` for the user to act on.
