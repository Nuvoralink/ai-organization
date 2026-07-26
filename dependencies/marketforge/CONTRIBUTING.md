# Contributing to MarketForge

Thanks for extending MarketForge. This guide documents how to add subskills, shared references, validators, and tests without breaking the rest of the skill.

## Quick start

```bash
# Install dependencies
py -3 -m pip install pytest

# Run tests
cd ${DEPENDENCY:marketforge}
py -3 -m pytest tests/

# Run validator against your changes
py -3 scripts/validate_marketing_docs.py --root skills --strict
```

## Repository structure

```
MarketForge/
├── README.md                            ← user-facing intro
├── USAGE_GUIDE.md                       ← user-facing usage
├── CHANGELOG.md                         ← version history
├── CONTRIBUTING.md                      ← this file
├── agents/AGENTS.md                     ← future-agent instructions
├── docs/                                ← architecture + V3 source
├── examples/                            ← example outputs + fixtures
├── scripts/                             ← Python helpers
├── tests/                               ← pytest suite
└── skills/                              ← the actual skill files
    ├── marketforge/                     ← orchestrator
    ├── marketforge-self-test/           ← Phase 0 integrity check
    ├── _marketforge-shared/             ← shared references + templates
    └── marketforge-[name]/              ← 71+ subskills
```

## How to add a new subskill

### 1. Decide the phase
Which of the 11 phases does it belong to? Check `marketforge/SKILL.md` orchestration flow.

### 2. Allocate DEC-NNN range
Per `_marketforge-shared/references/opinionated-marketing-decision-template.md`:
- Phase 1 (Foundation): DEC-001 to 049
- Phase 2 (Strategy): DEC-050 to 099
- Phase 3 (Brand): DEC-100 to 149
- Phase 4 (Website + Content): DEC-150 to 249
- Phase 5 (Paid): DEC-250 to 349
- Phase 6 (Outbound): DEC-350 to 399
- Phase 7 (Organic & Social): DEC-400 to 499
- Phase 8 (Lifecycle): DEC-500 to 599
- Phase 9 (CRO & Measurement): DEC-600 to 699
- Phase 10 (Visual assets): DEC-700 to 749
- Phase 11 (Launch + Execution): DEC-750 to 799
- Operations: DEC-800 to 899
- Audit / drift: DEC-900 to 999

Find an unused sub-range within the phase. Self-test validator catches collisions, but it's good to check first.

### 3. Create the subskill directory + SKILL.md

```
mkdir -p skills/marketforge-[name]
touch skills/marketforge-[name]/SKILL.md
```

### 4. Follow the subskill template

Every subskill SKILL.md follows this structure:

```markdown
---
name: marketforge-[name]
description: [What this does, when to trigger, where in phase sequence]
---

# MarketForge [Name]

[Brief on global quality rules specific to this subskill]

## Global quality rules
[3-7 rules]

## Purpose
[What it produces]

## Inputs
[Files / decisions consumed]

## Outputs
[Files written + DEC-NNN range allocated]

## Mode-aware behavior
[Greenfield / existing / drift / launch-imminent / continuous variations]

## Structure (template)
[The output template — markdown, decision cards, sections]

## Decision cards
[DEC-NNN range and what each decision card captures]

## What we are intentionally NOT doing in this layer
[Explicit prohibitions]

## Sources and basis
[V3 sections + cited frameworks with evidence grades]
```

### 5. Register in the orchestrator

Edit `skills/marketforge/SKILL.md` and add your subskill to the relevant phase's list.

### 6. Add cross-cite references

If your subskill consumes outputs from other subskills, add a "Cross-cites consumed" section listing those DEC-NNN ranges. The validator checks these in `--final` mode.

### 7. Add tests

Add at least:
- A unit test in `tests/unit/` if your subskill ships a script.
- A boundary test in `tests/boundary/` if it has thresholds.
- A mutation test in `tests/mutation/` for any detection logic.

### 8. Run self-test

```bash
py -3 -m pytest tests/
py -3 scripts/validate_marketing_docs.py --root skills --strict
```

### 9. Update CHANGELOG

Add an entry under the next unreleased version.

## How to add a shared reference

### 1. Create the file

```
touch skills/_marketforge-shared/references/[name].md
```

### 2. Follow the reference structure

Most shared references have:
- Header with one-line purpose.
- Global quality rules.
- The actual content (matrix / protocol / template).
- "What we are intentionally NOT doing."
- "Sources and basis."

### 3. Cross-link from consuming subskills

Update the subskills that should read this reference; add to their "Inputs" or "Read shared references" line.

### 4. Update orchestrator if foundational

If the reference is foundational (read by orchestrator on every run), add to the "Read X before doing Y" rules at the top of `marketforge/SKILL.md`.

## How to add a banned phrase / stale reference

### 1. Update the validator

Edit `scripts/validate_marketing_docs.py`:
- Add regex to `BANNED_PHRASES` for banned terms.
- Add `(pattern, message)` to `STALE_REFS` for dead tools / sites.
- Add `(pattern, message)` to `AI_CADENCE_PATTERNS` for AI cadence.

### 2. Update the rubric

Edit `skills/_marketforge-shared/references/anti-slop-marketing-rubric.md` to document the new banned phrase.

### 3. Add tests

In `tests/unit/test_validate_marketing_docs.py`:
- Add a positive test (validator catches it).
- Add a paired-condition test (no false positive on clean content).

In `tests/mutation/test_validator_catches_mutations.py`:
- Add to the appropriate `TEST_CASES` list.

### 4. Verify

```bash
py -3 -m pytest tests/
```

## How to add a new producer event

For the producer-reconciliation matrix:

### 1. Edit `producer-reconciliation-matrix.md`

Add a new "Producer NN: [event name]" section with:
- Source.
- Trigger event.
- Re-run subskills (ordered).
- Forbidden actions.
- Verification.

### 2. Update self-test

The self-test checks that producer-reconciliation matrix lists subskills that actually exist. Make sure your new cascade only references existing subskills.

### 3. Document in CHANGELOG

## How to update the V3 Marketing Guide

The V3 guide is the doctrinal source. To update:

### 1. Update the source

`docs/MARKETING_GUIDE_V3.md` is a synthesized summary. The full source is the deep-research document the user originally supplied.

### 2. Update affected subskills

For each section that changed, identify which subskills cite that section. Update their "Sources and basis" to reflect the new version.

### 3. Run producer-reconciliation

If material changes (e.g., new channel-decay event, new framework, new vendor), update `producer-reconciliation-matrix.md`.

### 4. Run validator

```bash
py -3 scripts/validate_marketing_docs.py --root skills --strict --final
```

Should still pass.

### 5. Update CHANGELOG with the date of V3 refresh

## Test discipline

Per `_marketforge-shared/references/testing-strategy-protocol.md`:

- Every detection rule has a positive test AND a paired-condition test.
- Every threshold has boundary tests at boundary-1, boundary, boundary+1.
- Every banned phrase has a mutation test.
- Verification evidence updated after each test pass.

### Anti-patterns to avoid

- Adding a banned phrase without a corresponding test.
- Tests that pass vacuously (no actual assertion).
- Snapshot-only tests (assert the validator output matches a snapshot — doesn't prove correctness).
- Mocking the validator itself in integration tests.

## Validator extension example

To add detection of a new banned phrase ("synergy"):

```python
# In scripts/validate_marketing_docs.py
BANNED_PHRASES = [
    r"\bleverage\b",
    # ...
    r"\bsynergy\b",  # NEW
]
```

```python
# In tests/unit/test_validate_marketing_docs.py
def test_catches_synergy(self, tmp_path):
    f = tmp_path / "test.md"
    f.write_text("Look for synergy between teams.", encoding="utf-8")
    code, out, err = run_validator(tmp_path)
    assert "synergy" in out.lower()

def test_paired_no_false_positive_no_synergy(self, tmp_path):
    f = tmp_path / "clean.md"
    f.write_text("Cross-team collaboration improves outcomes.", encoding="utf-8")
    code, out, err = run_validator(tmp_path)
    assert "synergy" not in out.lower() or "Banned phrase" not in out
```

```python
# In tests/mutation/test_validator_catches_mutations.py
BANNED_TEST_CASES = [
    # ...
    ("synergy", "Look for synergy between teams."),  # NEW
]
```

## How to add an MCP integration

(For when wiring agentic mode for a new platform.)

### 1. Document in `examples/agentic-mode/mcp-wiring-example.md`

Add the new MCP to the platform table + required-vs-optional list.

### 2. Update `agentic-operations-protocol.md`

Add the MCP to "Tools the agentic mode expects."

### 3. Update the orchestrator's `agentic=on` gate

If the MCP is required for an agentic action, ensure Gate E (pre-flight check) detects its presence.

### 4. Document approval-queue routing

Update the `approval-queue-template.md` to show what items route to the new MCP.

## Pull request checklist

Before submitting:

- [ ] All tests pass: `py -3 -m pytest tests/`
- [ ] Validator passes: `py -3 scripts/validate_marketing_docs.py --root skills --strict`
- [ ] Self-test passes (manually verify your subskill is invokable).
- [ ] CHANGELOG updated with new entry.
- [ ] Cross-cites added to consuming subskills.
- [ ] If new banned phrase: positive + paired + mutation tests added.
- [ ] If new threshold: boundary tests added.
- [ ] If new MCP: documented in agentic-mode examples.

## Style

- Markdown, kebab-case filenames.
- Decision IDs: `DEC-NNN` (3 digits, never 2 or 4).
- Avoid taste-words per anti-slop rubric.
- Cite V3 sections explicitly.
- Always include "What we are intentionally NOT doing" section.

## Code style (Python)

- Python 3.10+.
- Standard library preferred (no heavy dependencies for validators).
- pytest for tests.
- Type hints where it helps (not religious about it).
- One-line docstrings.
- f-strings for formatting.

## Questions?

The doctrinal source is the V3 Marketing & Customer Acquisition Operating Guide.
The architecture is documented in `docs/ARCHITECTURE.md`.
The decision discipline is in `_marketforge-shared/references/opinionated-marketing-decision-template.md`.
