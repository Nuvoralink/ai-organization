---
name: marketforge-self-test
description: Verify MarketForge skill integrity before orchestrator runs. Checks subskill inventory, DEC-ID range allocation, shared reference completeness, validator scripts executable, no missing template files. Use as Phase 0 (pre-flight) — runs before discovery.
---

# MarketForge Self-Test

Phase 0 (pre-flight) — runs BEFORE the orchestrator invokes any subskill.

## Why this exists

The original MarketForge implementation referenced ~70 subskills but never verified they actually exist before invocation. Per the `implementation-review-against-plan` review, this is partial wiring — the plan references but doesn't validate.

This subskill closes the gap by running a structural integrity check on MarketForge itself.

## Global quality rules

- Self-test is required before every full / focused / audit / agentic run.
- Self-test failures BLOCK the orchestrator.
- Self-test artifacts written to `docs/marketing-plan/auditability/self-test-report.md`.

## Purpose

Verify:
1. Every subskill referenced in `marketforge/SKILL.md` exists at `skills/marketforge-[name]/SKILL.md`.
2. Every shared reference exists at `skills/_marketforge-shared/references/[name].md`.
3. Every template exists at `skills/_marketforge-shared/templates/[name].md`.
4. Every validator script is present at `scripts/[name].py` and executable.
5. DEC-NNN range allocations do not collide across subskill range claims.
6. Required top-level documentation exists (README.md, USAGE_GUIDE.md, ARCHITECTURE.md, MARKETING_GUIDE_V3.md, AGENTS.md).
7. The V3 Marketing Guide source exists and is current.
8. Phase-to-subskill mapping in orchestrator matches actual subskill names.

## Inputs

- `skills/marketforge/SKILL.md` (orchestrator phase list).
- `skills/marketforge-*/SKILL.md` (each subskill).
- `skills/_marketforge-shared/references/*.md`.
- `skills/_marketforge-shared/templates/*.md`.
- `scripts/*.py`.

## Outputs

- `docs/marketing-plan/auditability/self-test-report.md` (PASS / WARN / FAIL).
- Exit code: 0 PASS, 1 FAIL.

## Self-test checks

### Check 1: Subskill inventory completeness
Parse the orchestrator's phase lists. For each referenced subskill name (e.g., `$marketforge-discovery`):
- Verify directory exists: `skills/marketforge-discovery/`.
- Verify SKILL.md inside: `skills/marketforge-discovery/SKILL.md`.
- Verify YAML frontmatter has `name: marketforge-discovery` and `description: ...`.

If ANY subskill is missing → FAIL.

### Check 2: Shared reference inventory
For each shared reference cited in `marketforge/SKILL.md`:
- Verify file exists at `skills/_marketforge-shared/references/[name].md`.

### Check 3: Template inventory
For each template cited in subskill SKILL.md files:
- Verify file exists at `skills/_marketforge-shared/templates/[name].md`.

### Check 4: Script inventory
For each Python script referenced in orchestrator or validator workflow:
- Verify file exists at `scripts/[name].py`.
- Verify it parses (no syntax errors via `py -3 -c "import ast; ast.parse(open(p).read())"`).

### Check 5: DEC-NNN range collisions
Parse the decision-template DEC-NNN range allocation table. For each subskill that declares its DEC range:
- Verify the range does not collide with any other subskill's declared range.
- If `marketforge-paid-search` says DEC-250-269 AND `marketforge-content-strategy` says DEC-300-329, this is OK.
- If two subskills declare overlapping ranges, FAIL.

### Check 6: Top-level documentation
Verify presence of:
- `README.md`
- `USAGE_GUIDE.md`
- `docs/ARCHITECTURE.md`
- `docs/MARKETING_GUIDE_V3.md`
- `agents/AGENTS.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`

### Check 7: V3 Marketing Guide currency
Read the V3 guide source. Flag if:
- "Last updated" date > 12 months old.
- Any sections cite events / data older than 2 years.
- Stale references (HARO, Google Optimize, pre-iOS-14 attribution) appear without "this is now stale" annotation.

### Check 8: Validator script self-test
Run each validator on a known-good fixture and a known-bad fixture:
- `validate_marketing_docs.py` on `examples/marketing-plan-good-fixture/` → exit 0.
- `validate_marketing_docs.py` on `examples/marketing-plan-bad-fixture/` → exit ≥ 1.
- If the validator's behavior matches expectations, PASS; if not, FAIL.

### Check 9: Phase ordering integrity
Verify that:
- Phase 1 subskills are not declared in Phase 11 section.
- Phase 11 subskills are not declared in Phase 1 section.
- Each phase has at least 4 subskills.
- Total subskill count matches the README claim.

### Check 10: Producer-reconciliation matrix completeness
Verify that `producer-reconciliation-matrix.md` lists all 14 producer events and that each cited subskill in the cascade actually exists.

## Self-test report format

```markdown
# MarketForge Self-Test Report

**Run:** [date + time]
**Skill version:** [from CHANGELOG]
**Result:** PASS | WARN | FAIL

## Summary
- Subskills declared: [N]
- Subskills existing: [M]
- Subskills missing: [list]
- Shared references missing: [list]
- DEC-NNN collisions: [list]
- Script issues: [list]
- Documentation gaps: [list]

## Detailed findings

[Per-check pass/fail with file:line evidence.]

## Required actions before orchestrator can proceed

[List of fixes needed.]
```

## When self-test FAILS

The orchestrator must NOT proceed. Surface to user:

> "MarketForge self-test FAILED. [N] subskills missing or [M] documentation gaps. See `docs/marketing-plan/auditability/self-test-report.md` for details. Cannot proceed with marketing plan generation until skill integrity is restored."

In Auto mode, the orchestrator logs the failure and stops.

## When self-test WARNs (not fails)

Acceptable to proceed with notes:
- V3 guide is 6-12 months old (will be refreshed next cycle).
- One template is named but optional.
- One agentic-mode MCP is missing (degrades to draft-only).

These are recorded in the report but do not block.

## Decision cards

- DEC-810: Self-test cadence (before every run).
- DEC-811: Failure escalation (block orchestrator).
- DEC-812: Self-test report retention (always preserved).

## What we are intentionally NOT doing

- Running self-test mid-orchestrator (only before/after).
- Auto-fixing missing subskills (we surface; user/agent decides).
- Verifying subskill output quality (that's `marketforge-marketing-qa`'s job).

## Sources and basis

- `implementation-review-against-plan` skill — partial wiring detection.
- `full-slice-planner` skill — inventory drift check.
