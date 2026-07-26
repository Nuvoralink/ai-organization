# Testing Strategy Protocol

Adapted from the `testing-strategy-and-tdd` skill (Anthropic) for marketing-domain output.

MarketForge is a meta-skill — it produces documentation and execution plans. But its validators, scorers, and gates are CODE, and that code must be tested. Equally, the marketing output itself needs testable proofs.

## Core Discipline

> A green suite proves the code reached the assertions. It does not prove the assertions would catch a bug.

Apply mutation tests, paired-condition tests, boundary-value tests, and probe suites on top of regular passing tests.

## Test Layers For MarketForge

### Layer 1: Pure-logic unit tests
For Python scripts:
- `validate_marketing_docs.py` — banned-phrase scanner, DEC-ID format, stale-ref detection, required sections.
- `channel_scorer.py` — 7-factor sum, classification thresholds (12/18/25/30).
- `readiness_check.py` — 5/7 threshold logic, 7/7 vs 3/7 outcomes.
- `evidence_grader.py` — claim detection, grade-presence detection.

### Layer 2: Adapter / fixture tests
For each script that consumes external data:
- Canonical happy-path fixtures.
- Malformed fixtures (missing keys, wrong types, extra unsupported fields).
- Edge fixtures (all-zero, all-max, single-element, hundred-elements).
- Privacy-sensitive fixtures (PII that must not leak into output).

### Layer 3: Integration tests
For the orchestrator + subskill chain:
- Mock skill detection.
- Run minimal greenfield scope.
- Verify file structure produced.
- Verify cross-cite integrity.

### Layer 4: Property-based tests
For generative behaviors:
- Random channel-score inputs → output always produces a 3-leg portfolio.
- Random readiness inputs → output always produces one of 4 recommendation classes.

### Layer 5: Mutation tests
Deliberately break the implementation in small ways and verify at least one test fails.

For MarketForge validator:
- Remove the HARO check → test should fail when validating a doc with HARO reference.
- Remove the banned-phrase check → test should fail on doc with "leverage".
- Lower the readiness threshold from 5 to 3 → test should fail on the 3/7 input that previously got BLOCK.

If any mutation produces a green suite, the test is vacuous.

### Layer 6: Boundary-value tests
For every numeric or temporal threshold:
- 5/7 readiness threshold: test 4/7, 5/7, 6/7.
- Channel score 18/24 / 25/30 thresholds: test 17, 18, 19, 24, 25, 26, 29, 30, 31.
- Kill window thresholds: 30/60/90 days, test ±1 day.
- Budget tier thresholds: $499/500/501; $4999/5000/5001.

### Layer 7: Probe suites for "what we used to guarantee"

When MarketForge subskill is updated (e.g., paid-search subskill DEC range moved from 250-269 to 280-289):
- Pre-migration probe: verify old DEC range was 250-269 in prior outputs.
- Post-migration probe: verify new DEC range is 280-289 in new outputs.
- Migration validator: verify NO outputs straddle both ranges incorrectly.

## Adapter / Parser Proof For VOC Mining

VOC mining is the adapter from "customer interview transcripts" → "verbatim quote bank."

Tests required:

- **Canonical:** clean interview transcript → quote bank with 5+ verbatim quotes correctly attributed.
- **Messy:** rambling transcript with off-topic detours → quote bank only includes ICP-relevant quotes; no nonsense.
- **Malformed:** broken transcript (missing speaker labels, partial sentences) → adapter does not silently fabricate quotes.
- **Privacy:** transcript containing PII (customer email, phone) → quote bank does NOT include PII; redaction applied.
- **Edge:** empty transcript → quote bank is empty (not a fabricated quote).
- **Edge:** transcript in non-English language → adapter handles gracefully or flags as out-of-scope.
- **Aliases:** transcript with informal name variants → adapter normalizes correctly.

The test should fail if the adapter:
- Silently overwrites real quotes with paraphrases.
- Falls back to AI-generated quotes when transcript is sparse.
- Accepts unsafe structure (e.g., synthetic personas presented as real customers).
- Leaks PII into the output.

## Idempotency / Concurrency Proof For Agentic Mode

When agentic mode claims idempotency, test BOTH:

- **Sequential retry:** daily loop fires at 09:00 then again at 09:01 — does it duplicate work?
- **Concurrent duplicate trigger:** two daily loops fire simultaneously at exactly 09:00 — does the second one detect the first and skip?

The implementation must rely on a durable guard:
- File-based concurrency lock with PID + timestamp.
- Provider event ID (e.g., Klaviyo webhook idempotency key).
- Database row lock (when MCP-driven).
- Persisted state transition with claim step.

NOT acceptable:
- UI-disabled controls.
- Pre-read status checks without atomic claim.

## Paired-Condition Rule For Validators

Every "X must not happen" test passes vacuously if the code that produces X is disabled.

Example: "Validator catches HARO references" passes vacuously if there's no HARO reference in the input.

Pair every negative assertion with a positive:
- Test "validator catches HARO" with an INPUT containing HARO + an INPUT not containing HARO; the first must fail, the second must pass.

## Proxy-Assertion Fallacy For MarketForge

A test that asserts "validator exited non-zero" passes when ANY error happens, not only the intentional one.

Example: "Validator catches missing 'What we are NOT doing' section" — if the validator crashes on file read because of an unrelated UnicodeError, the test passes for the wrong reason.

Fix:
- Mock the failure-detection path.
- Assert specific error message contents (`expect(stderr).toMatch(/missing required section/)`).

## Boundary-Value Testing For Readiness Check

The readiness check has 4 outcome bands:
- 7/7 → PROCEED
- 5-6/7 → PROCEED CAPPED
- 3-4/7 → BLOCK
- 0-2/7 → HARD BLOCK

Tests required at every boundary:
- 0/7 → HARD BLOCK
- 2/7 → HARD BLOCK
- 3/7 → BLOCK
- 4/7 → BLOCK
- 5/7 → PROCEED CAPPED
- 6/7 → PROCEED CAPPED
- 7/7 → PROCEED

If any boundary is untested, a future implementation change could silently shift the threshold without test detection.

## Boundary-Value Testing For Channel Scorer

Classification bands:
- 0-11 → Skip
- 12-17 → Deprioritize
- 18-24 → Supporting
- 25-29 → Primary
- 30-35 → Primary heavily

Tests required at every boundary: 7, 11, 12, 17, 18, 24, 25, 29, 30, 35.

## Verification Evidence

A test suite without this evidence is unverified:
- **Mutation log:** what mutations were applied, which tests caught them.
- **Boundary table:** every threshold + the tests covering each side.
- **Probe suite:** when migrations happened, the pre/post evidence.

Record this in `tests/VERIFICATION_EVIDENCE.md` after each test pass.

## Marketing-Output-Quality Tests

MarketForge ALSO needs tests for the marketing output itself, not just the code.

### Test 1: Subskill-citation integrity
Every consumer subskill output must cite at least one DEC-NNN from each upstream producer subskill.

E.g., `marketforge-website-copy` must cite:
- DEC-008-015 (positioning)
- DEC-020-029 (ICP / persona)
- DEC-040-049 (awareness stages)
- DEC-110-129 (messaging architecture)

Validator scans for these cross-cites.

### Test 2: Evidence grade completeness
Every numerical claim (X%, $X, Nx) must have an evidence grade within ±5 lines.

### Test 3: Banned-phrase scan
Anti-slop banned phrases must not appear in any output.

### Test 4: Awareness-stage match
Every page / ad / email declares stage. CTA must match per `message-stage-matrix-template.md`.

### Test 5: Kill criterion presence
Every channel decision must include a kill criterion + reversal trigger + test window.

### Test 6: Concentration risk
No single channel allocated > 50% of new revenue projection.

### Test 7: Brand-vs-performance stage match
Pre-PMF + brand allocation > 20% → violates `brand-vs-performance.md` thresholds → BLOCK.

### Test 8: Compound vs paid kill-window match
Compound channel with 30-day kill window → mismatch → BLOCK.

These are enforced by `marketforge-marketing-qa` + the validator script.

## Required Commands

```bash
# Run all tests
cd ${DEPENDENCY:marketforge} && py -3 -m pytest tests/

# Run with coverage
py -3 -m pytest tests/ --cov=scripts --cov-report=term-missing

# Run only unit tests
py -3 -m pytest tests/unit/

# Run only integration tests
py -3 -m pytest tests/integration/

# Run only boundary tests
py -3 -m pytest tests/boundary/

# Run mutation tests (if mutmut installed)
py -3 -m mutmut run
```

## Sources and basis

- `testing-strategy-and-tdd` skill methodology (Anthropic, adapted).
- V3 Marketing Guide §6.4 (A/B testing discipline — when to test and when not).
