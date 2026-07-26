# VisualForge fixtures

Regression-test corpora for the validator. Each fixture under `examples/fixtures/<name>/`
is a delta over `_base/` that introduces exactly one defect (or absence thereof) and
asserts the validator's expected response in `expected.json`.

## Run

```bash
python scripts/validate_design_docs.py --self-test
```

The harness merges each fixture over the base into a tmp dir, runs the validator, and
asserts the actual findings match the fixture's `expected.json`. Returns exit code 0 on
all-pass; 1 on any mismatch; 2 on harness error.

## Fixture inventory

| Fixture | Type | Asserts |
|---|---|---|
| `vf-find-001-cross-tree-dupe` | negative | DEC-300 defined as `### DEC-300` in two files → FAIL with `Cross-tree duplicate DEC-300` |
| `vf-find-005-malformed-dec-id` | negative | `DEC-CATEGORY-001` without Specforge context → FAIL with `Malformed DEC-ID` |
| `vf-find-010-dangling-cite` | negative | `DEC-999` cited without annotation → FAIL with `Dangling cross-cite DEC-999` |
| `vf-find-011-sub-decision-allowed` | positive control | `DEC-300` parent + `DEC-300.1` sub-decision in different files → no cross-tree dupe |
| `vf-find-015-persona-dec-paren` | negative | `DEC-210 (Alex anti-persona)` where DEC-210 is Mallory's → FAIL with `Persona-DEC misattribution` |
| `vf-find-019-typo-near-miss` | negative | `Reversal thrigger` typo in per-DEC metadata → FAIL with `typo near-miss` |
| `vf-find-020-theme-normalization` | positive control | `(personas)` / `(binding)` / `(persona binding)` → no disjoint-themes warning |
| `vf-find-021-persona-heading-prefix` | positive control | `## Identity (with parenthetical)` → no missing-Template-B error |
| `vf-find-024-mutation-log-required` | negative | `src/components/ui/Button.tsx` exists + spec at `05-components/primitives/Button.md`, log missing → WARN |
| `vf-find-025-wrapper-semantic-drift` | negative | `<CardTitle>` without `as=` AND no raw `<h1>` → WARN |
| `vf-find-032-visual-default-breakers` | negative | brand-identity missing Hero Scale + Composition Anchor + Narrative spine; layout-system missing anchor inventory + variety; surface-treatments missing banned-gradient list → 6 WARNs |
| `vf-find-033-image-art-direction` | negative | imagery-illustration.md without Section 0 (background-mode inventory) → WARN |
| `vf-find-034-platform-mode-lock` | negative | mobile-and-responsive.md without Section 0 platform-mode lock → WARN |
| `vf-find-035-visual-direction-lock-incomplete` | negative | visual-direction-lock.md missing Second-read commitment + unresolved `[...]` placeholder → 2 WARNs |
| `vf-find-036-react-quality-missing` | negative | frontend-implementation-contract.md without React-quality discipline section → WARN |
| `vf-find-037-assumption-persona-no-method` | negative | persona with `**Source basis:** Assumption` + Validation plan without a research-method ladder method → WARN |
| `vf-find-038-pressure-test-reviewer-missing` | negative | design-pressure-test-report.md with Pass L but no Visual-direction critic / React-product-fit critic rows → WARN |
| `vf-find-039-timing-token-drift` | negative | motion-design.md declares `` `duration.fast` `` 120ms; micro-interactions.md redeclares 150ms → WARN |
| `vf-find-040-state-page-not-cited` | negative | auth-flows.md without citing `state-page-patterns.md` → WARN |
| `vf-find-046-slop-scan-coverage` | negative (full mode) | brand-identity.md contains slop-word "modern" → WARN. Only fixture in full mode; closes scan_slop coverage gap from VF-FIND-045 mutation 3. |
| `vf-find-047-color-decision-basis` | negative | design-tokens.md declares OKLCH + hex palette but does NOT cite color-theory-and-decision-matrix.md → WARN |

## Adding a new fixture

1. **Create a directory** under `examples/fixtures/<vf-find-NNN-slug>/`.
2. **Write deltas only** — files that introduce the targeted condition. The base corpus
   provides minimum-required scaffolding (`auditability/decision-log.md`, one persona file).
3. **Write `expected.json`:**
   ```json
   {
     "description": "Plain-English summary of the fixture's assertion.",
     "mode": "mid-run" | "full",
     "errors_include": ["substring1", "substring2"],
     "errors_exclude": ["substring that must NOT appear"],
     "warnings_include": [],
     "warnings_exclude": []
   }
   ```
   Each `*_include` / `*_exclude` is a list of substrings — order-independent, substring
   match against the actual finding text.
4. **Run** `python scripts/validate_design_docs.py --self-test` — your fixture must PASS.

## Base corpus (`_base/`)

Minimal contents that every fixture inherits:
- `auditability/decision-log.md` — one canonical `DEC-100`.
- `01-foundations/personas/persona-alex-primary.md` — one fixture persona (DEC-200).

Add to `_base/` only when a check's minimum precondition is missing across multiple fixtures.

## Positive vs negative fixtures

- **Negative** (most): introduce a defect; assert the matching finding fires.
- **Positive control**: assert that a known-tricky pattern (sub-decision, normalized theme,
  parenthetical heading) does NOT fire its sibling check. Catches over-firing regressions.

## CI integration

Add to `.github/workflows/visualforge-validator.yml`:

```yaml
- run: python scripts/validate_design_docs.py --self-test
```

Self-test runs in < 3 seconds on the current 21 fixtures (10 pre-v1.8.0 + 11 new in v1.8.0).

## Sabotage verification (v1.8.0)

Per the v1.5.1 sabotage-test discipline (VF-FIND-023): each new check must produce ONLY its target fixture's failure when the check is no-op'd. Verified manually after v1.8.0:

```
OK   sabotaging check_visual_default_breakers       fails ONLY vf-find-032
OK   sabotaging check_image_art_direction           fails ONLY vf-find-033
OK   sabotaging check_platform_mode_lock            fails ONLY vf-find-034
OK   sabotaging check_visual_direction_lock_complete fails ONLY vf-find-035
OK   sabotaging check_react_quality_discipline      fails ONLY vf-find-036
OK   sabotaging check_assumption_persona_validation fails ONLY vf-find-037
OK   sabotaging check_pressure_test_reviewer_coverage fails ONLY vf-find-038
OK   sabotaging check_timing_token_drift            fails ONLY vf-find-039
OK   sabotaging check_state_page_cross_cites        fails ONLY vf-find-040
OK   sabotaging scan_slop                            fails ONLY vf-find-046
OK   sabotaging check_color_decision_basis           fails ONLY vf-find-047
```

If you add a new fixture, also add a sabotage test row to this list.
