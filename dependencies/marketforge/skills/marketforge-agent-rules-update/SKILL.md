---
name: marketforge-agent-rules-update
description: Update AGENTS.md, CLAUDE.md, .cursorrules, and RULES.md to prevent marketing-doc drift. The "make sure future agents follow this" subskill. Use as Phase 11 step 6.
---

# MarketForge Agent Rules Update

## Purpose

Update repo agent instructions so future runs / future contributors / future agents preserve marketing-plan integrity:

- Don't edit decision logs except via supersession protocol.
- Don't bypass anti-slop discipline.
- Update marketing plan when product / pricing / positioning changes.
- Honor approval queue in agentic mode.

## Inputs
- Existing AGENTS.md / CLAUDE.md / .cursorrules / RULES.md.
- `docs/marketing-plan/` structure.

## Outputs
- Updates to AGENTS.md / CLAUDE.md / .cursorrules in target repo.
- `docs/marketing-plan/RULES.md`.
- `docs/marketing-plan/auditability/rules-update-log.md`.

## Rules to add

```markdown
# Marketing Operating Rules

## For future agents working on marketing artifacts

### Anti-slop discipline
- Read `docs/marketing-plan/_marketforge-shared/references/anti-slop-marketing-rubric.md` before writing any marketing copy.
- Banned phrases: see `anti-slop-marketing-rubric.md` pattern 1-10.
- Every claim has evidence grade.
- Every decision has DEC-NNN ID per `opinionated-marketing-decision-template.md`.

### Stage discipline
- Every page / ad / email declares awareness stage.
- Copy + CTA match stage.

### Attribution discipline
- Triangulate platform-reported + CAPI + self-report + (when supported) incrementality.
- Never single-source attribution as truth.

### Evidence-grade discipline
- A/B grade citations OK as primary.
- C grade flag as practitioner consensus.
- D grade requires commercial-bias flag.
- E grade is folklore; never cited as fact.

### Approval queue (agentic mode)
- Posts / sends / publishes go through approval queue.
- Never auto-execute without approval unless explicitly whitelisted.

### Updating the marketing plan
- Product changes (pricing, positioning, ICP) require revision-mode pass.
- Don't edit decision logs in place; use supersession protocol.
- Quarterly OKR / channel review is the regular re-strategy moment.

### When in doubt
- Read the subskill SKILL.md for that area.
- Check `docs/marketing-plan/auditability/decision-log.md` for prior decisions.
- Read `docs/marketing-plan/RULES.md`.
```

## Per-file updates

### AGENTS.md (top-level repo file for future agents)
- Add section: "Marketing artifacts are at `docs/marketing-plan/`. Read MarketForge rules in `docs/marketing-plan/RULES.md`."

### CLAUDE.md (per-project Claude instructions)
- Add section similar to AGENTS.md.

### .cursorrules (Cursor IDE rules)
- Add similar section for Cursor-using contributors.

### docs/marketing-plan/RULES.md
- Full content above.

## Update protocol

- Don't overwrite existing rules.
- Preserve project-specific instructions.
- Append marketing rules at end of files (or in dedicated section).
- Log every change in `rules-update-log.md`.

## What we are intentionally NOT doing
- Replacing all existing agent rules.
- Forcing AGENTS.md creation in repos that don't have one.
- Bloating agent instructions unnecessarily.

## Sources and basis
Drift-prevention discipline from SpecForge / VisualForge precedent.
