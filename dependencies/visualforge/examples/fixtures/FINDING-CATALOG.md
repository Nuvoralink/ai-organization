# VisualForge finding catalog

Every validator check, what it catches, the corresponding `VF-FIND-NNN` plugin finding,
and (when available) the fixture under `examples/fixtures/` that proves it works.

For full root-cause history of each finding, see `PLUGIN-FINDINGS.md` at plugin root.

## Structural checks

| Check function | VF-FIND | Catches | Severity | Fixture |
|---|---|---|---|---|
| `check_required_files` | core | Missing required docs / tokens / audit files | FAIL | — |
| `check_token_integrity` | core | tokens.json invalid; tokens.css / .ts / .figma.json drift | FAIL | — |
| `check_dark_mode_coverage` | core | Semantic Tier-2 token without dark variant | WARN | — |
| `check_no_raw_values_in_components` | core | Raw hex / px / ms in component specs | FAIL | — |
| `check_strict_dec_shape` | VF-FIND-005 | `DEC-CATEGORY-NNN` / `DEC-NNN-tmp` / `DEC-NNN-ish` | FAIL | `vf-find-005-malformed-dec-id` |
| `check_decision_log` | VF-FIND-001 + VF-FIND-011 | Cross-tree dupe `### DEC-NNN` (sub-decisions exempted) | FAIL | `vf-find-001-cross-tree-dupe`, `vf-find-011-sub-decision-allowed` |
| `check_decision_id_resolution` | VF-FIND-010 | `DEC-NNN` cited but never defined and not annotated | FAIL | `vf-find-010-dangling-cite` |
| `check_decision_id_singleton` | VF-FIND-014 + VF-FIND-020 | Same DEC cited with disjoint themes (normalized) | WARN | `vf-find-020-theme-normalization` |
| `check_per_dec_metadata` | VF-FIND-010 + VF-FIND-019 | Missing Cross-cites / Confidence / Reversal trigger OR typo near-miss | WARN / FAIL | `vf-find-019-typo-near-miss` |
| `check_persona_dec_consistency` | VF-FIND-015 + VF-FIND-017 | Persona name in cite parens or surrounding context disagrees with DEC owner | FAIL / WARN | `vf-find-015-persona-dec-paren` |
| `check_persona_files` | VF-FIND-004 + VF-FIND-021 | Persona Template A/B/C missing required sections (prefix-match) | FAIL | `vf-find-021-persona-heading-prefix` |
| `check_figma_artifacts` | core | Missing figma-build-log.md or MCP detection | FAIL / WARN | — |
| `check_retrofit_data_awareness` | core | Retrofit mode missing inventory / drift-report / migration-plan | FAIL | — |

## Slop / content discipline

| Check function | VF-FIND | Catches | Severity |
|---|---|---|---|
| `check_forbidden_ambiguity` | core | "where appropriate", "if applicable", "as needed" | FAIL |
| `check_numeric_claim_labels` | VF-FIND-002 | `N.N:1` ratios without `(measured)` / `(estimated)` / `(target)` | WARN |
| `check_raw_px_in_layout_and_components` | VF-FIND-006 + VF-FIND-012 | Raw `Npx` without token pairing or label | WARN |
| `check_hedge_on_known_values` | VF-FIND-008 | "approximately N" / "~N" near fixed-count contexts | WARN |
| `check_cross_subskill_cites` | VF-FIND-007 + VF-FIND-013 | Cross-cut term without DEC cite in same paragraph | WARN |
| `scan_slop` | core | Adjective slop ("modern", "clean", "premium" without concrete behavior) | WARN |
| `check_version_stamps` | core | Files missing version stamp header | WARN |
| `check_whats_missing` | core | Missing WHATS-MISSING.md | FAIL |
| `check_concurrency_lock` | core | Stale `.visualforge.lock` | WARN |

## Reserved finding IDs

| VF-FIND-NNN | Status | Topic |
|---|---|---|
| VF-FIND-001 | Fixed v1.1.0 | Cross-tree DEC dupe |
| VF-FIND-002 | Fixed v1.1.0 | Numeric claim labels |
| VF-FIND-003 | Fixed v1.1.0 | Mini pressure-test protocol |
| VF-FIND-004 | Fixed v1.1.0 | Persona template enforcement |
| VF-FIND-005 | Fixed v1.1.0 | Strict DEC-ID shape |
| VF-FIND-006 | Fixed v1.1.0 | Raw-px density |
| VF-FIND-007 | Fixed v1.1.0 | Cross-cut term cites |
| VF-FIND-008 | Fixed v1.1.0 | Hedge on known values |
| VF-FIND-009 | Fixed v1.1.0 | Session-state edge cases |
| VF-FIND-010 | Fixed v1.2.0 | Mini protocol must hard-gate validator + 3 new checks |
| VF-FIND-011 | Fixed v1.3.0 | Sub-decision regex distinguishes DEC-NNN.M |
| VF-FIND-012 | Fixed v1.3.0 | Px-token-pair tolerance |
| VF-FIND-013 | Fixed v1.3.0 | Cross-cut term per-paragraph windowing |
| VF-FIND-014 | Fixed v1.3.0 | Annotation-only theme skip |
| VF-FIND-015 | Fixed v1.3.0 | Persona-DEC paren-scope consistency |
| VF-FIND-016 | Fixed v1.3.0 | Windows UTF-8 console |
| VF-FIND-017 | Fixed v1.3.0 | Persona-DEC context-scope consistency |
| VF-FIND-018 | Fixed v1.4.0 | Mini-protocol → full-validator escalation guidance |
| VF-FIND-019 | Fixed v1.4.0 | Per-DEC field typo near-miss |
| VF-FIND-020 | Fixed v1.4.0 | Theme normalization for disjoint check |
| VF-FIND-021 | Fixed v1.4.0 | Persona heading prefix match |
| VF-FIND-022 | Fixed v1.5.0 | Regression fixture harness (this catalog) |

## Adding new findings

When real-world use surfaces a new failure class:

1. Log to `PLUGIN-FINDINGS.md` using the template at the bottom of that file.
2. Implement the fix in `scripts/validate_design_docs.py`.
3. Add a fixture under `examples/fixtures/vf-find-NNN-slug/` with `expected.json`.
4. Add a row to this catalog.
5. Run `python scripts/validate_design_docs.py --self-test` — must PASS.
