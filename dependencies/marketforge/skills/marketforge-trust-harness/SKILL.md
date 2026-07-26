---
name: marketforge-trust-harness
description: Mutation-based trust harness — proves downstream marketing output reacts to source-of-truth changes. Multi-oracle validation + 12 mutation scenarios. Phase 11 step 7 (between pressure-test and agent-rules-update).
---

# MarketForge Trust Harness

Phase 11 step 7. Runs AFTER pressure-test passes. Before declaring the marketing plan ready.

Read `_marketforge-shared/references/trust-harness-protocol.md`.

## Why this exists

The pressure-test catches structural gaps. The bias-audit catches commercial-bias drift. The marketing-qa catches anti-slop. None of those answer the trust question:

> "If I mutate the source-of-truth, does the downstream marketing output actually change?"

This subskill builds and runs the mutation harness that proves it.

## Global quality rules

- Default posture: skeptical. A passing test is only useful after proving it would fail for the right wrongness.
- Use multiple independent oracles. No single-oracle pass.
- Every important visible claim must be paired with at least one mutation that breaks it.
- Liveness check required: confirm the test would catch a silent failure mode.
- Don't accept screenshots / file-existence as proof. Verify content.

## Purpose

1. Build the golden fixture mapping (every claim → source authority → consumer paths → mutation).
2. Run multi-oracle validation against current marketing plan.
3. Execute mutation suite (12 scenarios).
4. Generate trust report.
5. BLOCK orchestrator completion if any mutation reveals brittle downstream.

## Inputs

- Complete `docs/marketing-plan/` from prior phases.
- `_marketforge-shared/references/trust-harness-protocol.md` (the methodology).
- `_marketforge-shared/references/producer-reconciliation-matrix.md` (the cascade map).
- `scripts/validate_marketing_docs.py` (the multi-oracle validator).
- `tests/mutation/test_marketing_plan_mutations.py` (the mutation suite).

## Outputs

- `docs/marketing-plan/auditability/trust-report.md` (passed mutations, surfaced findings, residual risk).
- DEC-820 to DEC-829 — trust-harness decisions.
- If mutations reveal brittle downstream → BLOCK orchestrator completion until fixed.

## Pre-flight check (HARD GATE)

Before running mutation suite, verify:
1. `marketforge-marketing-qa` returned PASS or PASS-WITH-NOTES.
2. `marketforge-pressure-test` returned GOOD or GOOD-WITH-NOTES.
3. `marketforge-bias-audit` complete.
4. `marketforge-self-test` PASSED.

If any prerequisite fails, REFUSE to run mutation suite (it would test against a broken plan).

## Trust-harness workflow

### Step 1: Build expected-values contract

For every important claim in the marketing plan, record:
- The claim (e.g., "Homepage hero says 'Cut close from 8 days to 3'").
- Source authority (e.g., "DEC-014 — VOC verbatim quote from interview JT-007").
- Path in docs (e.g., `04-website-content/website-copy/homepage.md` section "Above the fold").
- At least one mutation that should break or change it.

Write to `auditability/expected-values-contract.md`.

### Step 2: Run baseline oracles

Confirm current plan passes:
- Cross-cite oracle (validator `--final` mode).
- Kill-criterion oracle.
- Concentration-risk oracle.
- Stage-presence oracle.
- Bias-flag oracle.
- Required-section oracle.
- Anti-slop oracle.

If any baseline fails, BLOCK — fix before mutating.

### Step 3: Run mutation suite (12 scenarios)

Per `trust-harness-protocol.md` mutation suite:

1. ICP definition change → verify downstream stale-detection.
2. Pricing change → verify pricing-page + ads + email reflect.
3. Positioning pivot → verify 12 downstream consumers update or stale-detect.
4. Stage-CTA drift → verify stage-CTA oracle catches.
5. Concentration-risk introduction → verify concentration oracle catches.
6. Banned-phrase injection → verify anti-slop oracle catches.
7. Missing kill criterion → verify kill-criterion oracle catches.
8. D-grade citation without bias flag → verify bias-flag oracle catches.
9. Window-type mismatch (paid window on compound channel) → verify window-type oracle catches.
10. Missing awareness-stage declaration → verify stage-presence oracle catches.
11. Cross-cite to nonexistent DEC → verify cross-cite oracle catches.
12. Producer-supersession cascade → verify producer-reconciliation matrix cascade fires.

For each mutation:
1. Apply mutation to fixture or current plan (in a copy).
2. Run multi-oracle validator.
3. Verify expected oracle fires with expected message.
4. Restore baseline (or use git-revert pattern on copy).
5. Log result.

### Step 4: Producer-replay verification

The most important mutation — verify the producer-reconciliation matrix is operational:

1. Pick one producer DEC (e.g., DEC-020 ICP definition).
2. Add a supersession card: `Status: Superseded by DEC-NNN, Date: YYYY-MM-DD`.
3. Run validator + producer-reconciliation oracle.
4. Verify: every consumer subskill that cites the superseded DEC is flagged as having stale reference.
5. Verify: `auditability/cascade-log.md` records the required revision cascade (12 subskills for ICP change per matrix).

If the cascade doesn't fire, the producer-reconciliation matrix is documentation theater, not operational. BLOCK until the cascade machinery works.

### Step 5: Pressure-test the harness itself

Distrust the green run. Run these checks:

- **Liveness:** Did the mutation actually touch a source DEC card, or just edit body prose?
- **Positive/negative pairing:** Does every "X must not be present" oracle pair with "Y must be present"?
- **Wrong-source check:** Could the consumer subskill be reading from "best practices" instead of the producer DEC?
- **Mutation adequacy:** Did the mutation touch the persisted DEC the consumer reads?
- **Threshold check:** Did fixture sample size (number of consumer subskills) clear the denominator?
- **Surface inventory:** Is any subskill output unowned by an oracle?

If any check exposes brittleness, fix at root — strengthen the oracle or the harness.

### Step 6: Write trust report

Format:

```markdown
# Trust Report

**Run:** [date + time]
**Marketing plan version:** [from run-state.json]
**Verdict:** TRUST / PARTIAL TRUST / FAIL

## Baseline oracles
- Cross-cite oracle: PASS / FAIL
- Kill-criterion oracle: PASS / FAIL
- Concentration-risk oracle: PASS / FAIL
- Stage-presence oracle: PASS / FAIL
- Bias-flag oracle: PASS / FAIL
- Required-section oracle: PASS / FAIL
- Anti-slop oracle: PASS / FAIL

## Mutation suite (12 scenarios)

[Per mutation: setup, mutation applied, oracle expected, oracle fired, restored baseline.]

## Producer-replay verification
[Did the cascade fire? Which subskills surfaced as stale?]

## Pressure-test of the harness itself
[Liveness, paired conditions, wrong-source check, mutation adequacy, surface inventory.]

## Surfaced findings
- [Finding 1] — [severity] — [location] — [fix]
- ...

## Residual risk
- Live customer interview transcripts not tested (fixture-only).
- Live ad-platform performance not tested.
- Live AI semantic judgment quality not tested.
- Production marketing campaign outcomes not tested.

## Final answer
"Does this fully satisfy product trust intent, or did I only prove a narrow path?"
```

## Verdict logic

- **TRUST:** All baseline oracles PASS. All 12 mutations surface expected oracle. Producer-replay cascade fires. Pressure-test of harness passes.
- **PARTIAL TRUST:** Baseline PASS but ≥1 mutation reveals brittle downstream OR the harness itself has gaps. Marketing plan still shippable with documented residual risk.
- **FAIL:** Baseline oracles fail OR producer-replay cascade doesn't fire OR pressure-test reveals vacuous oracles. BLOCK orchestrator completion until fixed.

## Decision cards

- DEC-820: Trust harness verdict.
- DEC-821: Producer-replay cascade verified operational.
- DEC-822: Residual risk acceptance.

## When verdict is FAIL

Surface to user:

> "Trust harness FAILED. [N] mutations did not surface expected oracle [list]. The marketing plan has been built but the harness cannot confirm downstream output will react correctly to source changes. Specifically: [example]. Cannot declare marketing plan READY until the harness is operational."

In Auto mode: log and STOP.

## What we are intentionally NOT doing

- Live API integration testing (residual risk).
- Testing on production marketing data (use fixtures).
- Replacing pressure-test or marketing-qa (this is additive — Phase 11 step 7).
- Auto-fixing harness gaps (we surface; user decides remediation).

## Sources and basis

- `golden-mutation-trust-harness` skill methodology (Anthropic, adapted).
- `trust-harness-protocol.md` (the operational protocol).
- `producer-reconciliation-matrix.md` (the cascade map).
