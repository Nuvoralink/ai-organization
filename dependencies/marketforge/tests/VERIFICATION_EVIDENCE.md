# Test Verification Evidence

Per `_marketforge-shared/references/testing-strategy-protocol.md`:
> A test suite without this evidence is unverified.

## Latest run

**Date:** 2026-05-20 (v1.2.0 — trust-harness pass)
**Python:** 3.13.5
**pytest:** 9.0.3
**Result:** ✅ 82 / 82 passed

## Test counts by layer

| Layer | Tests | Result |
|---|---|---|
| `tests/boundary/test_readiness_check.py` | 13 | ✅ All pass |
| `tests/integration/test_validator_integration.py` | 5 | ✅ All pass |
| `tests/mutation/test_validator_catches_mutations.py` | 6 | ✅ All pass |
| `tests/mutation/test_marketing_plan_mutations.py` | 16 | ✅ All pass (NEW in v1.2) |
| `tests/unit/test_channel_scorer.py` | 15 | ✅ All pass |
| `tests/unit/test_validate_marketing_docs.py` | 27 | ✅ All pass |
| **Total** | **82** | **✅** |

## v1.2.0 — Trust harness verification

| Mutation | Oracle expected | Status |
|---|---|---|
| 1. Banned phrase injection | anti-slop | ✅ Caught |
| 2. AI cadence injection | ai-cadence | ✅ Caught |
| 3. Stale reference (HARO) | stale-ref | ✅ Caught |
| 4. Stage-CTA drift | stage-CTA-mismatch | ✅ Caught |
| 5. Missing kill criterion | kill-criterion-presence | ✅ Caught |
| 6. Window-type mismatch | window-type | ✅ Caught |
| 7. Concentration risk | concentration-risk | ✅ Caught |
| 8. Missing awareness-stage | stage-presence | ✅ Caught |
| 9. Cross-cite to nonexistent DEC | cross-cite-validity | ✅ Caught |
| 10. D-grade without bias flag | bias-flag | ✅ Caught |
| 11. DEC-ID collision | dec-collision | ✅ Caught |
| 12. Supersession cascade | supersession-stale-reference | ✅ Caught |
| Baseline (golden fixture clean) | (none fires) | ✅ Zero findings |

Plus harness pressure-test (per trust-harness-protocol.md):
- Liveness check (oracles actually ran) — ✅
- Paired-condition (35% allocation not falsely flagged as concentration) — ✅
- Mutation adequacy (mutation actually touches persisted DEC) — ✅

## Real bugs caught by trust harness

The trust harness revealed two bugs that pure unit tests missed:

1. **Window-type oracle regex bug:** `day\b` didn't match "days" because no word boundary between `y` and `s`. Mutation test 6 surfaced this; fixed to `days?\b`.

2. **Cross-cite oracle false-negative:** Was treating any DEC mention as a declaration, so cross-cites to nonexistent DECs passed. Mutation test 9 surfaced this; fixed to distinguish declarations (`### [DEC-NNN]` headers) from references.

Both bugs were latent in the v1.1.0 validator. The trust harness mutation suite caught them by mutating and verifying the expected oracle fired. **This is exactly what `golden-mutation-trust-harness` skill says trust harnesses should do.**

## Fixture coverage matrix

| Fixture | Files | Validator strict-final result |
|---|---|---|
| `examples/marketing-plan-good-fixture/` | 3 | ✅ 0 findings |
| `examples/marketing-plan-golden/` | 12 | ✅ 0 findings (full producer-consumer chain) |
| `examples/marketing-plan-bad-fixture/` | 1 | ✅ 25+ BLOCK findings caught |

## Mutation log

Mutations deliberately introduced and verified caught by tests:

| Mutation | Test that caught it |
|---|---|
| Remove "leverage" from BANNED_PHRASES | `test_catches_leverage` |
| Remove "world-class" from BANNED_PHRASES | `test_catches_world_class` |
| Remove "HARO" from STALE_REFS | `test_catches_haro` |
| Remove "Google Optimize" from STALE_REFS | `test_catches_google_optimize` |
| Shift readiness threshold 5→4 | `test_4_to_5_is_band_boundary` |
| Shift hard-block threshold 2→3 | `test_2_to_3_is_band_boundary` |
| Lower DEC-ID min digits 3→2 | `test_catches_short_dec_id` |
| Disable --strict exit code | `test_strict_blocks_on_banned_phrase` |

**Manual verification process:**
1. Make the mutation in `validate_marketing_docs.py`.
2. Run `py -3 -m pytest tests/` — verify failure.
3. Revert the mutation.
4. Run `py -3 -m pytest tests/` — verify pass.

## Boundary table

### Readiness check thresholds

| Score | Expected band | Test |
|---|---|---|
| 0/7 | HARD BLOCK | ✅ `test_boundary[0-HARD BLOCK]` |
| 1/7 | HARD BLOCK | ✅ `test_boundary[1-HARD BLOCK]` |
| 2/7 | HARD BLOCK | ✅ `test_boundary[2-HARD BLOCK]` |
| 3/7 | BLOCK PAID | ✅ `test_boundary[3-BLOCK PAID]` |
| 4/7 | BLOCK PAID | ✅ `test_boundary[4-BLOCK PAID]` |
| 5/7 | CAPPED | ✅ `test_boundary[5-CAPPED]` |
| 6/7 | CAPPED | ✅ `test_boundary[6-CAPPED]` |
| 7/7 | PROCEED | ✅ `test_boundary[7-PROCEED]` |

### Channel scorer classification thresholds

| Score | Expected classification | Test |
|---|---|---|
| 7 | Skip | ✅ `test_classification_at_boundaries[7-Skip]` |
| 11 | Skip | ✅ `test_classification_at_boundaries[11-Skip]` |
| 12 | Deprioritize | ✅ `test_classification_at_boundaries[12-Deprioritize]` |
| 17 | Deprioritize | ✅ `test_classification_at_boundaries[17-Deprioritize]` |
| 18 | Supporting | ✅ `test_classification_at_boundaries[18-Supporting]` |
| 24 | Supporting | ✅ `test_classification_at_boundaries[24-Supporting]` |
| 25 | Primary | ✅ `test_classification_at_boundaries[25-invest]` |
| 29 | Primary | ✅ `test_classification_at_boundaries[29-invest]` |
| 30 | Primary heavily | ✅ `test_classification_at_boundaries[30-heavily]` |
| 35 | Primary heavily | ✅ `test_classification_at_boundaries[35-heavily]` |

## Paired-condition tests

Every "X is detected" test paired with "X-clean content is not falsely flagged":

| Detection rule | Positive test | Paired (no false positive) |
|---|---|---|
| Banned phrase "leverage" | `test_catches_leverage` | `test_paired_no_false_positive_on_clean_content` |
| AI cadence three-triplet | `test_catches_three_word_triplet` | `test_paired_no_false_positive_normal_writing` |
| Stale HARO | `test_catches_haro` | `test_paired_no_false_positive_when_no_stale` |
| Malformed DEC | `test_catches_short_dec_id` | `test_paired_no_false_positive_proper_dec_id` |

## Adapter / messy-fixture coverage

| Fixture | Test |
|---|---|
| Empty file | ✅ `test_empty_file_does_not_crash` |
| Non-UTF-8 bytes | ✅ `test_non_utf8_content_handled` |
| 10,000-line clean file | ✅ `test_huge_file_does_not_crash` |
| Unicode em-dash | ✅ `test_unicode_dashes_handled` |

## What remains unverified

These need probe suites / additional tests in follow-up work:

- `evidence_grader.py` — no dedicated test file yet.
- `marketforge-self-test` subskill — integration with actual subskill files not tested.
- Full orchestrator end-to-end run — no integration test exists.
- Concurrent orchestrator invocations — no concurrency test exists.
- Property-based fuzzing via `hypothesis` library — not yet integrated.
- Mutation-testing automation via `mutmut` — manual mutations only at this point.

## Verification cadence

Re-run before:
- Every commit that touches `scripts/*.py`.
- Every release.
- Quarterly (catches stale references in V3 guide as new channels decay).

## Sources

- `_marketforge-shared/references/testing-strategy-protocol.md`
- `testing-strategy-and-tdd` skill methodology.
