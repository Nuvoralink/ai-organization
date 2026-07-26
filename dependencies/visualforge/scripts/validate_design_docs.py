#!/usr/bin/env python3
"""VisualForge — Design Documentation Validation Script (entry point).

Validates that the design system documentation at ``docs/design-system/`` meets
the VisualForge anti-slop and token integrity contract. Designed to run in CI as
a quality gate before merging design-system changes.

This file is a thin entry point. All check implementations live in the
``scripts/validators/`` package (split per VF-FIND-045). To find a check:

- File presence / required-artifact discipline    -> validators/structural.py
- Token integrity / raw-value detection            -> validators/tokens.py
- DEC-ID shape, log, range allocation              -> validators/dec_integrity.py
- Forbidden ambiguity, numeric labels, hedges      -> validators/claim_discipline.py
- Wrapper semantic drift, mutation log             -> validators/semantic_drift.py
- v1.8.0 visual-default-breaker checks             -> validators/visual_defaults.py
- v1.8.0 state-page cross-cite check               -> validators/state_pages.py
- v1.8.0 plugin-source contract walker             -> validators/plugin_contracts.py
- Slop word scan                                   -> validators/slop.py
- Self-test fixture harness                        -> validators/harness.py

Shared types, constants, regexes, and helpers      -> validators/_common.py
Per-mode run lists                                 -> validators/__init__.py

Exit code 0 on PASS, non-zero on FAIL. Prints findings to stdout.

Usage:
    py -3 scripts/validate_design_docs.py [--root <path>] [--strict] [--mid-run] [--format {text,json}] [--self-test]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Make scripts/ importable so `from validators import ...` resolves when this
# file is run directly via `py -3 scripts/validate_design_docs.py`.
_THIS_DIR = Path(__file__).resolve().parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

from validators import (  # noqa: E402
    Findings,
    run_mid_run_checks,
    run_full_checks,
    _run_self_test,
)


def _emit_text(findings: Findings) -> None:
    if findings.errors:
        print(f"FAIL: {len(findings.errors)} error(s)")
        for e in findings.errors:
            print(f"  ERROR: {e}")
    else:
        print("PASS: no errors.")
    if findings.warnings:
        print(f"WARN: {len(findings.warnings)} warning(s)")
        for w in findings.warnings:
            print(f"  WARN: {w}")


def _emit_json(findings: Findings) -> None:
    out = {
        "verdict": "PASS" if findings.ok else "FAIL",
        "errors": findings.errors,
        "warnings": findings.warnings,
        "counts": {"errors": len(findings.errors), "warnings": len(findings.warnings)},
    }
    print(json.dumps(out, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate VisualForge design docs.")
    parser.add_argument(
        "--root",
        default="docs/design-system",
        help="Root of the design-system docs (default: docs/design-system).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat slop warnings as errors.",
    )
    parser.add_argument(
        "--mid-run",
        action="store_true",
        help=(
            "Mid-run mode: run only fast structural checks suitable for between-subskill "
            "validation in the orchestrator's checkpoint hook. Skips slow checks "
            "(full slop scan, figma artifact verification, retrofit data awareness)."
        ),
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format: text (default, human-readable) or json (machine-readable for CI).",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help=(
            "Run the regression fixture harness in examples/fixtures/. "
            "Each fixture merges over the _base/ corpus, runs the validator, and "
            "asserts the findings match expected.json. Returns non-zero on any mismatch."
        ),
    )
    args = parser.parse_args()

    # VF-FIND-016: force UTF-8 stdout/stderr on Windows so unicode characters in error
    # messages (em-dash, arrows, etc.) don't crash the validator on cp1252 consoles.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

    if args.self_test:
        return _run_self_test()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"FAIL: design-system root not found: {root}", file=sys.stderr)
        return 2

    findings = Findings()

    if args.mid_run:
        run_mid_run_checks(root, findings)
    else:
        run_full_checks(root, findings, args.strict)

    if args.format == "json":
        _emit_json(findings)
        return 0 if findings.ok else 1

    _emit_text(findings)
    return 0 if findings.ok else 1


if __name__ == "__main__":
    sys.exit(main())
