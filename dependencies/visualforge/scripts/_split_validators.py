#!/usr/bin/env python3
"""One-shot script that splits scripts/validate_design_docs.py into a package
under scripts/validators/. Idempotent: deletes and rewrites the package each run.

Extracts function and constant blocks by line range from the original file,
prefixes each module with the right imports, and writes the new entry point.

Verify with:
    py -3 scripts/validate_design_docs.py --self-test
"""
from __future__ import annotations
import ast
import re
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "validate_design_docs.py"
PKG = ROOT / "scripts" / "validators"

# Read the source.
source = SRC.read_text(encoding="utf-8")
tree = ast.parse(source)
lines = source.split("\n")  # 0-indexed; ast uses 1-indexed lineno

# Build {name: (start_line, end_line, kind)} from AST.
# end_line: use node.end_lineno; for module-level Assign, use node.end_lineno too.
blocks: dict[str, tuple[int, int, str]] = {}
for node in tree.body:
    name = None
    kind = ""
    if isinstance(node, ast.FunctionDef):
        name = node.name
        kind = "func"
    elif isinstance(node, ast.ClassDef):
        name = node.name
        kind = "class"
    elif isinstance(node, ast.Assign):
        # Only single-target name assignments.
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            name = node.targets[0].id
            kind = "const"
    if not name:
        continue
    start = node.lineno
    end = node.end_lineno
    blocks[name] = (start, end, kind)


def grab(name: str) -> str:
    """Return the source lines for a top-level definition by name, INCLUDING any
    leading decorator (@dataclass etc.) and comment lines that immediately precede
    it (separated by no blank lines)."""
    start, end, _ = blocks[name]
    # Walk backwards to capture leading decorator AND comment lines.
    leading_start = start
    i = start - 2  # 0-indexed line just before the start
    while i >= 0:
        s = lines[i].strip()
        is_decorator = s.startswith("@")
        is_comment = s.startswith("#") and not s.startswith("# ====")
        if is_decorator or is_comment:
            leading_start = i + 1  # 1-indexed
            i -= 1
        else:
            break
    return "\n".join(lines[leading_start - 1:end])


# Group definitions into modules.
MODULES: dict[str, list[str]] = {
    "_common": [
        # Findings + shared constants
        "Findings",
        "SLOP_WORDS",
        "FORBIDDEN_AMBIGUITY_PHRASES",
        "REQUIRED_DOCS",
        "REQUIRED_AUDITABILITY",
        "REQUIRED_TOKENS",
        "REQUIRED_DIRS_WITH_CONTENT",
        "ROOT_ALLOWED",
        "RETROFIT_REQUIRED",
        "HEX_PATTERN",
        "RAW_PX_PATTERN",
        "RAW_MS_PATTERN",
        "CUBIC_PATTERN",
        "DEC_HEADING_PATTERN",
        "REF_PATTERN",
        "DEC_ID_PATTERN",
        "STRICT_DEC_OK",
        "STRICT_DEC_BAD",
        "STRICT_DEC_SUBDEC",
        "VERSION_STAMP_PATTERN",
        "CONTRAST_RATIO_PATTERN",
        "NUMERIC_LABEL_PATTERN",
        "HEDGE_ON_NUMBER_PATTERN",
        "CROSS_CUT_TERMS",
        "PERSONA_TEMPLATE_A_HEADINGS",
        "PERSONA_TEMPLATE_B_HEADINGS",
        "PERSONA_TEMPLATE_C_HEADINGS",
        "_TIMING_TOKEN_DECL_PATTERN",
        "SUBSKILL_DEC_RANGES",
        "SKILL_DEC_CROSS_REFS",
        # Helpers
        "load_tokens",
        "flatten_tokens",
        "_strip_excluded_contexts",
        "_strip_jsx_comments",
        "_extract_h2_headings",
        "_heading_matches_required",
    ],
    "structural": [
        "check_required_files",
        "check_persona_files",
        "check_concurrency_lock",
        "check_figma_artifacts",
        "check_version_stamps",
        "check_whats_missing",
        "check_retrofit_data_awareness",
    ],
    "tokens": [
        "check_token_integrity",
        "check_no_raw_values_in_components",
        "check_dark_mode_coverage",
    ],
    "dec_integrity": [
        "check_strict_dec_shape",
        "check_decision_log",
        "check_decision_id_resolution",
        "check_decision_id_singleton",
        "check_per_dec_metadata",
        "check_persona_dec_consistency",
        "check_dec_range_allocation",
    ],
    "claim_discipline": [
        "check_forbidden_ambiguity",
        "check_numeric_claim_labels",
        "check_raw_px_in_layout_and_components",
        "check_hedge_on_known_values",
        "check_cross_subskill_cites",
    ],
    "semantic_drift": [
        "check_implementation_mutation_log",
        "check_wrapper_semantic_drift",
    ],
    "visual_defaults": [
        "check_visual_default_breakers",
        "check_image_art_direction",
        "check_platform_mode_lock",
        "check_visual_direction_lock_complete",
        "check_react_quality_discipline",
        "check_assumption_persona_validation",
        "check_pressure_test_reviewer_coverage",
        "check_timing_token_drift",
    ],
    "state_pages": [
        "check_state_page_cross_cites",
    ],
    "plugin_contracts": [
        "check_plugin_source_contracts",
    ],
    "color": [
        "check_color_decision_basis",
    ],
    "slop": [
        "scan_slop",
    ],
    "harness": [
        "_run_self_test",
    ],
}

# Imports each module needs from _common. For simplicity, import everything used.
# We'll generate a star import for non-private modules and a deep import for _common helpers.
MODULE_HEADER = '''"""{description}

Generated by scripts/_split_validators.py. Do not hand-edit module structure;
update the source and re-run the splitter.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from ._common import (  # noqa: F401  # re-exported helpers are intentional
{imports}
)
'''

# Which names from _common does each module need? Pragmatic: import everything except Findings
# and a small set of helpers. We compute by scanning grab(name) for usage.
COMMON_NAMES = set(MODULES["_common"])

def needed_from_common(module_src: str) -> list[str]:
    found = []
    for name in sorted(COMMON_NAMES):
        # Word-boundary check
        if re.search(rf"\b{re.escape(name)}\b", module_src):
            found.append(name)
    return found


DESCRIPTIONS = {
    "_common": "Shared types, constants, regexes, and helpers used by all validator modules.",
    "structural": "File/dir presence checks: required files, persona files, concurrency lock, figma, version stamps, what's-missing, retrofit data awareness.",
    "tokens": "Token integrity, raw-value scanning in components, dark-mode coverage.",
    "dec_integrity": "DEC-ID shape, decision-log integrity, cross-tree dupes, ID resolution, per-DEC metadata, persona-DEC consistency, range allocation.",
    "claim_discipline": "Forbidden ambiguity phrases, numeric claim labels, raw px in layout/components, hedges, cross-subskill cites.",
    "semantic_drift": "Implementation mutation log, wrapper-encapsulated semantic drift (h1 -> h3, button-type, etc.).",
    "visual_defaults": "v1.8.0 visual-default-breaker checks: hero scale, image art direction, platform mode, lock completeness, React quality, persona validation, pressure-test reviewers, timing-token drift.",
    "state_pages": "v1.8.0 state-page-patterns cross-cite check.",
    "plugin_contracts": "v1.8.0 plugin-source contract walker: ensures SKILL.md files cite required shared references and contain required subsections.",
    "color": "v1.8.0 color-decision-basis check: palette declarations must cite the color theory + decision matrix reference.",
    "slop": "Slop-word scanner across docs.",
    "harness": "Regression fixture self-test harness.",
}


def write_module(name: str, names: list[str]) -> None:
    body_parts = [grab(n) for n in names if n in blocks]
    body = "\n\n\n".join(body_parts)

    if name == "_common":
        # _common doesn't import from itself; just needs json/re/Path/dataclass.
        header = '''"""Shared types, constants, regexes, and helpers used by all validator modules.

Generated by scripts/_split_validators.py.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

'''
        path = PKG / f"{name}.py"
        path.write_text(header + body + "\n", encoding="utf-8")
        return

    needed = needed_from_common(body)
    imports = "\n".join(f"    {n}," for n in needed)
    header = MODULE_HEADER.format(description=DESCRIPTIONS[name], imports=imports)
    path = PKG / f"{name}.py"
    path.write_text(header + "\n" + body + "\n", encoding="utf-8")


def build_init() -> None:
    # __init__.py re-exports every check + run lists.
    all_checks = []
    for mod_name, names in MODULES.items():
        if mod_name == "_common":
            continue
        for n in names:
            if n.startswith("check_") or n in {"scan_slop"}:
                all_checks.append((mod_name, n))

    lines = ['"""VisualForge validator package.',
             "",
             "Re-exports all check functions and provides run_mid_run_checks and",
             "run_full_checks orchestrators. The entry point in scripts/validate_design_docs.py",
             "imports from here.",
             "",
             "Generated by scripts/_split_validators.py — do not hand-edit structure.",
             '"""',
             "from __future__ import annotations",
             "",
             "from pathlib import Path",
             "",
             "from ._common import (",
             "    Findings,",
             "    REQUIRED_DOCS,",
             "    REQUIRED_AUDITABILITY,",
             "    REQUIRED_TOKENS,",
             "    ROOT_ALLOWED,",
             "    SUBSKILL_DEC_RANGES,",
             "    SKILL_DEC_CROSS_REFS,",
             ")"]
    for mod_name, name in all_checks:
        lines.append(f"from .{mod_name} import {name}")
    # Harness
    lines.append("from .harness import _run_self_test")
    lines.append("")
    lines.append("")
    # run_mid_run_checks
    mid_run_order = [
        "check_strict_dec_shape", "check_decision_log",
        "check_decision_id_resolution", "check_decision_id_singleton",
        "check_per_dec_metadata", "check_persona_dec_consistency",
        "check_forbidden_ambiguity", "check_raw_px_in_layout_and_components",
        "check_hedge_on_known_values", "check_cross_subskill_cites",
        "check_concurrency_lock", "check_implementation_mutation_log",
        "check_wrapper_semantic_drift",
        # v1.8.0
        "check_visual_default_breakers", "check_image_art_direction",
        "check_platform_mode_lock", "check_visual_direction_lock_complete",
        "check_react_quality_discipline", "check_assumption_persona_validation",
        "check_pressure_test_reviewer_coverage", "check_timing_token_drift",
        "check_state_page_cross_cites", "check_dec_range_allocation",
        "check_plugin_source_contracts",
        "check_color_decision_basis",
    ]
    lines.append("def run_mid_run_checks(root: Path, findings: Findings) -> None:")
    lines.append('    """Fast checks for between-subskill validation. No file-existence enforcement."""')
    for c in mid_run_order:
        lines.append(f"    {c}(root, findings)")
    lines.append("")
    lines.append("")
    # run_full_checks
    full_order_pre_slop = [
        "check_required_files",  # special: needs flat_tokens? No.
        # token integrity returns the flat map for dark mode
        # We'll handle it inline below.
    ]
    lines.append("def run_full_checks(root: Path, findings: Findings, strict: bool) -> None:")
    lines.append('    """All checks plus slop scan. Use post-completion."""')
    lines.append("    check_required_files(root, findings)")
    lines.append("    flat = check_token_integrity(root, findings)")
    lines.append("    check_dark_mode_coverage(flat, findings)")
    lines.append("    check_no_raw_values_in_components(root, findings)")
    lines.append("    check_strict_dec_shape(root, findings)")
    lines.append("    check_decision_log(root, findings)")
    lines.append("    check_decision_id_resolution(root, findings)")
    lines.append("    check_decision_id_singleton(root, findings)")
    lines.append("    check_per_dec_metadata(root, findings)")
    lines.append("    check_persona_dec_consistency(root, findings)")
    lines.append("    check_persona_files(root, findings)")
    lines.append("    check_figma_artifacts(root, findings)")
    lines.append("    check_retrofit_data_awareness(root, findings)")
    lines.append("    check_forbidden_ambiguity(root, findings)")
    lines.append("    check_numeric_claim_labels(root, findings)")
    lines.append("    check_raw_px_in_layout_and_components(root, findings)")
    lines.append("    check_hedge_on_known_values(root, findings)")
    lines.append("    check_cross_subskill_cites(root, findings)")
    lines.append("    check_version_stamps(root, findings)")
    lines.append("    check_whats_missing(root, findings)")
    lines.append("    check_concurrency_lock(root, findings)")
    lines.append("    check_implementation_mutation_log(root, findings)")
    lines.append("    check_wrapper_semantic_drift(root, findings)")
    lines.append("    # v1.8.0")
    lines.append("    check_visual_default_breakers(root, findings)")
    lines.append("    check_image_art_direction(root, findings)")
    lines.append("    check_platform_mode_lock(root, findings)")
    lines.append("    check_visual_direction_lock_complete(root, findings)")
    lines.append("    check_react_quality_discipline(root, findings)")
    lines.append("    check_assumption_persona_validation(root, findings)")
    lines.append("    check_pressure_test_reviewer_coverage(root, findings)")
    lines.append("    check_timing_token_drift(root, findings)")
    lines.append("    check_state_page_cross_cites(root, findings)")
    lines.append("    check_dec_range_allocation(root, findings)")
    lines.append("    check_plugin_source_contracts(root, findings)")
    lines.append("    check_color_decision_basis(root, findings)")
    lines.append("    scan_slop(root, findings, strict)")
    lines.append("")
    (PKG / "__init__.py").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    if PKG.exists():
        shutil.rmtree(PKG)
    PKG.mkdir(parents=True)

    for mod_name, names in MODULES.items():
        write_module(mod_name, names)

    build_init()
    print(f"Wrote {PKG} with modules:")
    for p in sorted(PKG.iterdir()):
        print(f"  {p.name}: {len(p.read_text(encoding='utf-8').splitlines())} lines")


if __name__ == "__main__":
    main()
