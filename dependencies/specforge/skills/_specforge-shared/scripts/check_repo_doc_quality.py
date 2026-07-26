#!/usr/bin/env python3
"""Run repo-level SpecForge documentation quality gates.

This script is intentionally broader than validate_app_docs.py. The validator
checks a SpecForge package's structure; this gate also checks the surrounding
repo documentation hygiene that agents commonly miss during existing-repo doc
repair.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List
from urllib.parse import unquote

DEFAULT_DOC_DIRS = ["docs", "frontend/docs", "backend/docs", ".cursor/plans", ".cursor/rules"]
DEFAULT_ROOT_DOCS = [
    "README.md",
    "AGENTS.md",
    "AGENTS.override.md",
    "CLAUDE.md",
    "PRODUCT.md",
    "DESIGN.md",
    "COACHING_ARCHITECTURE.md",
    "MVP_CONTRACTS.md",
    "MVP_VERTICAL_ARCHITECTURE.md",
]

LEGACY_FOCUSED_FILENAMES = [
    "00-docs-index.md",
    "16-documentation-audit.md",
    "17-document-quality-review.md",
    "30-decision-and-defaults-register.md",
    "31-product-assurance-contract.md",
    "32-source-of-truth-map.md",
    "33-decision-boundary-and-decision-matrix.md",
    "34-surface-and-output-authority-map.md",
    "35-assurance-fixtures-and-validation.md",
    "36-documentation-authority-lifecycle.md",
    "99-research-ledger.md",
]

QUALITY_REVIEW_SECTION_MARKERS = [
    "Actual document coverage",
    "Naming findings",
    "Standard-backed alignment",
    "Product intent preservation",
]

AUDIT_ONLY_RECOMMENDATION = re.compile(
    r"\b(?:should|need(?:s)?\s+to|must)\s+create\s+(?:a|an|the)?[^.\n|]*"
    r"\b(?:security|privacy|threat[- ]model|architecture|api|runbook|quality|document(?:ation)?)\b"
    r"[^.\n|]*(?:doc|document|file)\b",
    re.I,
)

MARKDOWN_LINK = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")


def normalize_rel(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def iter_doc_files(repo_root: Path, doc_dirs: Iterable[str], root_docs: Iterable[str]) -> List[Path]:
    files: List[Path] = []
    seen = set()

    def add(path: Path) -> None:
        if not path.exists() or not path.is_file():
            return
        if path.suffix.lower() not in {".md", ".mdc", ".html"}:
            return
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            files.append(resolved)

    for rel in root_docs:
        add(repo_root / rel)

    for rel_dir in doc_dirs:
        base = repo_root / rel_dir
        if not base.exists():
            continue
        for path in base.rglob("*"):
            add(path)

    return sorted(files)


def strip_markdown_title(target: str) -> str:
    target = target.strip().strip("<>")
    if not target:
        return target
    if target[0] in {"'", '"'}:
        return target
    # Handles common `[label](path "title")` form without trying to parse all Markdown.
    match = re.match(r"([^\"'\s]+)(?:\s+[\"'].+[\"'])?$", target)
    return match.group(1) if match else target


def is_external_target(target: str) -> bool:
    return bool(re.match(r"^(?:https?:|mailto:|tel:|#|app://|plugin://)", target, re.I))


def check_links(repo_root: Path, files: List[Path]) -> List[str]:
    hits: List[str] = []
    for file in files:
        text = file.read_text(encoding="utf-8", errors="replace")
        for match in MARKDOWN_LINK.finditer(text):
            raw_target = match.group(1)
            target = strip_markdown_title(raw_target).split("#", 1)[0]
            if not target or is_external_target(target):
                continue
            if re.match(r"^[A-Za-z]:[\\/]", target):
                continue
            target = unquote(target)
            resolved = (file.parent / target).resolve()
            if not resolved.exists():
                hits.append(f"{normalize_rel(file, repo_root)} -> {raw_target}")
    return hits


def check_index_coverage(repo_root: Path, doc_dirs: Iterable[str], index_path: Path) -> List[str]:
    if not index_path.exists():
        return []
    index_text = index_path.read_text(encoding="utf-8", errors="replace")
    unlisted: List[str] = []
    for rel_dir in doc_dirs:
        base = repo_root / rel_dir
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.md")):
            if path.resolve() == index_path.resolve():
                continue
            rel = normalize_rel(path, repo_root)
            index_rel = path.resolve().relative_to(index_path.parent.resolve()).as_posix()
            if rel not in index_text and index_rel not in index_text:
                unlisted.append(rel)
    return unlisted


def check_legacy_filenames(repo_root: Path, docs_dir: Path, files: List[Path]) -> Dict[str, List[str]]:
    existing = [name for name in LEGACY_FOCUSED_FILENAMES if (docs_dir / name).exists()]
    references: List[str] = []
    pattern = re.compile("|".join(re.escape(name) for name in LEGACY_FOCUSED_FILENAMES))
    for file in files:
        # Skip the package specification itself when this gate is run inside the skill repo.
        if file.name == "document-specification.md":
            continue
        text = file.read_text(encoding="utf-8", errors="replace")
        for match in pattern.finditer(text):
            line_no = text[: match.start()].count("\n") + 1
            references.append(f"{normalize_rel(file, repo_root)}:{line_no}: {match.group(0)}")
    return {"existing_files": existing, "references": references}


def check_audit_only_recommendations(repo_root: Path, docs_dir: Path) -> List[str]:
    hits: List[str] = []
    if not docs_dir.exists():
        return hits
    for file in sorted(docs_dir.rglob("*.md")):
        text = file.read_text(encoding="utf-8", errors="replace")
        for match in AUDIT_ONLY_RECOMMENDATION.finditer(text):
            line_no = text[: match.start()].count("\n") + 1
            excerpt = " ".join(match.group(0).split())[:160]
            hits.append(f"{normalize_rel(file, repo_root)}:{line_no}: {excerpt}")
    return hits


def check_quality_review_sections(docs_dir: Path) -> List[str]:
    candidates = [
        docs_dir / "auditability" / "documentation-quality-review.md",
        docs_dir / "documentation-quality-review.md",
        docs_dir / "17-document-quality-review.md",
    ]
    review = next((path for path in candidates if path.exists()), None)
    if review is None:
        return ["missing quality review document"]
    text = review.read_text(encoding="utf-8", errors="replace").lower()
    return [marker for marker in QUALITY_REVIEW_SECTION_MARKERS if marker.lower() not in text]


def run_validator(args: argparse.Namespace, docs_dir: Path) -> Dict[str, Any]:
    script = Path(__file__).resolve().with_name("validate_app_docs.py")
    command = [sys.executable, str(script), "--docs-dir", str(docs_dir), "--profile", args.profile, "--json"]
    if args.strict:
        command.append("--strict")
    if args.final:
        command.append("--final")
    if args.existing_repo:
        command.append("--existing-repo")
    if args.assurance:
        command.append("--assurance")
    proc = subprocess.run(command, text=True, capture_output=True)
    try:
        parsed = json.loads(proc.stdout)
    except json.JSONDecodeError:
        parsed = {"passed": False, "stdout": proc.stdout, "stderr": proc.stderr}
    parsed["returncode"] = proc.returncode
    return parsed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--docs-dir", default="docs/app-plan")
    parser.add_argument("--profile", choices=["full", "focused"], default="focused")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--final", action="store_true")
    parser.add_argument("--existing-repo", action="store_true")
    parser.add_argument("--assurance", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--allow-legacy-filenames", action="store_true")
    parser.add_argument("--skip-validator", action="store_true")
    parser.add_argument("--skip-index-coverage", action="store_true")
    parser.add_argument("--skip-quality-review-sections", action="store_true")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    docs_dir = (repo_root / args.docs_dir).resolve()
    doc_files = iter_doc_files(repo_root, DEFAULT_DOC_DIRS, DEFAULT_ROOT_DOCS)
    app_plan_index = docs_dir / "README.md"
    if app_plan_index.exists():
        index_path = app_plan_index
        coverage_dirs = [args.docs_dir]
    else:
        index_path = repo_root / "docs" / "DOCUMENTATION_INDEX.md"
        coverage_dirs = ["docs", "frontend/docs", "backend/docs"]

    report: Dict[str, Any] = {
        "repo_root": str(repo_root),
        "docs_dir": str(docs_dir),
        "validator": None,
        "broken_links": check_links(repo_root, doc_files),
        "unlisted_docs": [] if args.skip_index_coverage else check_index_coverage(repo_root, coverage_dirs, index_path),
        "legacy_focused_filenames": check_legacy_filenames(repo_root, docs_dir, doc_files),
        "audit_only_doc_recommendations": check_audit_only_recommendations(repo_root, docs_dir),
        "missing_quality_review_sections": [] if args.skip_quality_review_sections else check_quality_review_sections(docs_dir),
    }
    if not args.skip_validator:
        report["validator"] = run_validator(args, docs_dir)

    failed = bool(
        (report["validator"] and not report["validator"].get("passed"))
        or report["broken_links"]
        or report["unlisted_docs"]
        or (not args.allow_legacy_filenames and (report["legacy_focused_filenames"]["existing_files"] or report["legacy_focused_filenames"]["references"]))
        or report["audit_only_doc_recommendations"]
        or report["missing_quality_review_sections"]
    )
    report["passed"] = not failed

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        if report["passed"]:
            print("SpecForge repo documentation quality gate passed.")
        else:
            print("SpecForge repo documentation quality gate failed.")
            labels = [
                ("validator", "Validator"),
                ("broken_links", "Broken links"),
                ("unlisted_docs", "Unlisted docs"),
                ("legacy_focused_filenames", "Legacy focused filenames"),
                ("audit_only_doc_recommendations", "Audit-only doc recommendations"),
                ("missing_quality_review_sections", "Missing quality review sections"),
            ]
            for key, label in labels:
                value = report[key]
                if not value:
                    continue
                if key == "validator" and value.get("passed"):
                    continue
                print(f"{label}:")
                if isinstance(value, list):
                    for item in value[:50]:
                        print(f"- {item}")
                elif isinstance(value, dict):
                    print(json.dumps(value, indent=2))
                else:
                    print(value)

    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
