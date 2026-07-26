#!/usr/bin/env python3
"""Run SpecForge quality fixtures through the docs validator.

Golden fixtures must pass. Bad fixtures must fail. This catches regressions where
the validator becomes too weak or the golden examples drift out of shape.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC_VALIDATOR = ROOT / "skills" / "_specforge-shared" / "scripts" / "validate_app_docs.py"
IMPLEMENTATION_VALIDATOR = ROOT / "skills" / "_specforge-shared" / "scripts" / "validate_implementation_artifacts.py"

CASES = [
    {
        "name": "golden greenfield focused",
        "validator": DOC_VALIDATOR,
        "docs_dir": ROOT / "examples" / "golden" / "greenfield-focused" / "docs" / "app-plan",
        "args": ["--profile", "focused", "--final", "--strict"],
        "expect_pass": True,
    },
    {
        "name": "golden existing repo repair",
        "validator": DOC_VALIDATOR,
        "docs_dir": ROOT / "examples" / "golden" / "existing-repo-repair" / "docs" / "app-plan",
        "args": ["--profile", "focused", "--final", "--strict", "--existing-repo"],
        "expect_pass": True,
    },
    {
        "name": "bad surface-level docs",
        "validator": DOC_VALIDATOR,
        "docs_dir": ROOT / "examples" / "fixtures" / "bad" / "surface-level-docs" / "docs" / "app-plan",
        "args": ["--profile", "focused", "--final", "--strict"],
        "expect_pass": False,
    },
    {
        "name": "golden implementation artifacts",
        "validator": IMPLEMENTATION_VALIDATOR,
        "docs_dir": ROOT / "examples" / "golden" / "implementation-artifacts" / "docs" / "app-plan",
        "args": ["--strict"],
        "expect_pass": True,
    },
    {
        "name": "bad implementation artifacts",
        "validator": IMPLEMENTATION_VALIDATOR,
        "docs_dir": ROOT / "examples" / "fixtures" / "bad" / "implementation-artifacts" / "docs" / "app-plan",
        "args": ["--strict"],
        "expect_pass": False,
    },
]


def run_case(case: dict[str, object]) -> tuple[bool, str]:
    command = [
        sys.executable,
        str(case["validator"]),
        "--docs-dir",
        str(case["docs_dir"]),
        *case["args"],
    ]
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    passed = result.returncode == 0
    expected = bool(case["expect_pass"])
    ok = passed == expected
    status = "PASS" if passed else "FAIL"
    expectation = "expected pass" if expected else "expected fail"
    output = (result.stdout + result.stderr).strip()
    return ok, f"{case['name']}: {status} ({expectation})\n{output}"


def run_evolutionary_architecture_mutations() -> list[tuple[bool, str]]:
    """Prove the validators reject the old present-only planning shape.

    The unmodified golden fixtures are the counterexample: they explicitly say no
    later capability is approved and therefore keep the implementation concrete.
    """

    results: list[tuple[bool, str]] = []
    with tempfile.TemporaryDirectory(prefix="specforge-evolution-") as temp_dir:
        temp_root = Path(temp_dir)

        architecture_docs = temp_root / "architecture" / "docs" / "app-plan"
        shutil.copytree(
            ROOT / "examples" / "golden" / "greenfield-focused" / "docs" / "app-plan",
            architecture_docs,
        )
        architecture_file = architecture_docs / "architecture" / "06-architecture.md"
        architecture_text = architecture_file.read_text(encoding="utf-8")
        architecture_text = architecture_text.replace("## Future capability map", "## Roadmap notes")
        architecture_text = architecture_text.replace("## Evolution and extension strategy", "## Change notes")
        architecture_file.write_text(architecture_text, encoding="utf-8")
        architecture_result = subprocess.run(
            [
                sys.executable,
                str(DOC_VALIDATOR),
                "--docs-dir",
                str(architecture_docs),
                "--profile",
                "focused",
                "--final",
                "--strict",
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        architecture_output = f"{architecture_result.stdout}\n{architecture_result.stderr}".lower()
        architecture_expected = ["future capability map", "evolution and extension strategy"]
        architecture_ok = architecture_result.returncode != 0 and all(
            concept in architecture_output for concept in architecture_expected
        )
        results.append(
            (
                architecture_ok,
                "mutation missing future-capability/evolution strategy: "
                + ("FAIL caught (expected)" if architecture_ok else "FALSE PASS"),
            )
        )

        implementation_docs = temp_root / "implementation" / "docs" / "app-plan"
        shutil.copytree(
            ROOT / "examples" / "golden" / "implementation-artifacts" / "docs" / "app-plan",
            implementation_docs,
        )
        slice_file = implementation_docs / "implementation" / "vertical-slice-specs.md"
        slice_text = slice_file.read_text(encoding="utf-8")
        for concept in [
            "Existing authority extended",
            "Forbidden parallel authority",
            "Current consumer proof",
            "Killer mutation",
        ]:
            slice_text = slice_text.replace(concept, "Removed architecture claim")
        slice_file.write_text(slice_text, encoding="utf-8")
        implementation_result = subprocess.run(
            [
                sys.executable,
                str(IMPLEMENTATION_VALIDATOR),
                "--docs-dir",
                str(implementation_docs),
                "--strict",
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        implementation_output = f"{implementation_result.stdout}\n{implementation_result.stderr}".lower()
        implementation_expected = [
            "existing authority extended",
            "forbidden parallel authority",
            "current consumer proof",
            "killer mutation",
        ]
        implementation_ok = implementation_result.returncode != 0 and all(
            concept in implementation_output for concept in implementation_expected
        )
        results.append(
            (
                implementation_ok,
                "mutation missing authority/parallel/liveness/killer proof: "
                + ("FAIL caught (expected)" if implementation_ok else "FALSE PASS"),
            )
        )

    return results


def main() -> int:
    for validator in [DOC_VALIDATOR, IMPLEMENTATION_VALIDATOR]:
        if not validator.exists():
            print(f"Missing validator: {validator}")
            return 1

    failures: list[str] = []
    for case in CASES:
        ok, message = run_case(case)
        print(message)
        print()
        if not ok:
            failures.append(str(case["name"]))

    for ok, message in run_evolutionary_architecture_mutations():
        print(message)
        print()
        if not ok:
            failures.append(message)

    if failures:
        print("SpecForge quality self-test failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("SpecForge quality self-test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
