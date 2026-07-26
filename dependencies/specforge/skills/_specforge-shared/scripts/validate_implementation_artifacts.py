#!/usr/bin/env python3
"""Validate SpecForge post-docs implementation artifacts.

This gate is intentionally stricter than a markdown shape check. It looks for
the root-level implementation planning evidence that keeps a future coding pass
from becoming a vague, surface-only task list.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Pattern


REQUIRED_ARTIFACTS = {
    "README.md": [
        "implementation artifact index",
        "generation context",
        "product intent",
        "research status",
        "source package version",
        "artifact map",
        "omitted artifact register",
        "execution order",
        "quality gate",
    ],
    "implementation-roadmap.md": [
        "release slices",
        "dependency order",
        "sequencing rationale",
        "future capability map",
        "foundation seams",
        "risk levels",
        "acceptance gates",
        "blocked work",
        "rollback triggers",
        "shortcuts rejected",
    ],
    "vertical-slice-specs.md": [
        "slice id",
        "implementation outcome",
        "root source of truth",
        "existing authority extended",
        "forbidden parallel authority",
        "current consumer proof",
        "killer mutation",
        "upstream dependencies",
        "downstream consumers",
        "data touched",
        "permission and privacy impact",
        "ux or api states affected",
        "tests to add or update",
        "docs to update",
        "stop condition",
        "shortcuts rejected",
    ],
    "repo-change-map.md": [
        "file ownership",
        "protected areas",
        "new files",
        "changed files",
        "generated files",
        "boundaries not to cross",
        "blast radius",
    ],
    "data-migration-and-backfill-plan.md": [
        "schema changes",
        "migration order",
        "backfill strategy",
        "data validation",
        "idempotency",
        "privacy constraints",
        "rollback or restore",
    ],
    "api-and-contract-implementation.md": [
        "endpoint inventory",
        "dto",
        "schemas",
        "auth",
        "permission",
        "error states",
        "idempotency",
        "rate limits",
        "contract tests",
    ],
    "ui-implementation-contract.md": [
        "screen",
        "component",
        "state model",
        "loading state",
        "empty state",
        "error state",
        "accessibility",
        "responsive behavior",
        "first-useful-viewport",
        "screenshot gate",
    ],
    "state-jobs-and-runtime-flow.md": [
        "state ownership",
        "background jobs",
        "queues",
        "retries",
        "concurrency",
        "cache invalidation",
        "consistency",
        "observability",
    ],
    "security-privacy-implementation-controls.md": [
        "authentication",
        "authorization",
        "csrf",
        "input handling",
        "output handling",
        "secrets",
        "logging",
        "privacy",
        "retention",
        "abuse",
        "dependency controls",
    ],
    "verification-and-test-harness.md": [
        "unit",
        "integration",
        "contract",
        "e2e",
        "accessibility",
        "security",
        "performance",
        "migration",
        "smoke",
        "release gates",
        "commands",
    ],
    "release-rollout-runbook.md": [
        "feature flags",
        "deployment steps",
        "migration order",
        "monitoring",
        "alerting",
        "rollback",
        "support playbook",
        "post-release checks",
    ],
    "codex-implementation-prompts.md": [
        "owned files",
        "blocked files",
        "required tests",
        "docs to update",
        "no-shortcut checks",
        "final proof expected",
    ],
    "implementation-risk-register.md": [
        "risk id",
        "root cause",
        "blast radius",
        "mitigation",
        "verification",
        "owner or affected role",
        "reversal trigger",
    ],
}

AI_ARTIFACT = "ai-decision-implementation-matrix.md"

AI_ARTIFACT_CONCEPTS = [
    "source authority",
    "allowed outputs",
    "disallowed outputs",
    "provenance",
    "prompt",
    "model",
    "validators",
    "bounded retries",
    "eval fixtures",
    "cost controls",
    "final surface consumption",
]

GLOBAL_CONCEPTS = [
    "status",
    "inputs used",
    "sources and basis",
    "related requirement ids",
    "related decisions and adrs",
    "assumptions with impact",
    "open questions",
    "affected files or proposed file locations",
    "verification method",
    "rollback or containment notes",
    "traceability",
]

PACK_SURFACE_CONCEPTS: Dict[str, List[Pattern[str]]] = {
    "product intent": [re.compile(r"\bproduct intent\b", re.I)],
    "root source of truth": [re.compile(r"\bsource of truth\b", re.I), re.compile(r"\bauthority\b", re.I)],
    "data and persistence": [re.compile(r"\bdata model\b", re.I), re.compile(r"\bpersistence\b", re.I), re.compile(r"\bschema\b", re.I), re.compile(r"\bdatabase\b", re.I)],
    "api and integration": [re.compile(r"\bapi\b", re.I), re.compile(r"\bintegration\b", re.I), re.compile(r"\bendpoint\b", re.I), re.compile(r"\bcontract\b", re.I)],
    "ui or final output surface": [re.compile(r"\bui\b", re.I), re.compile(r"\bscreen\b", re.I), re.compile(r"\bcomponent\b", re.I), re.compile(r"\bfinal (user-visible )?surface\b", re.I), re.compile(r"\boutput surface\b", re.I)],
    "state jobs and runtime": [re.compile(r"\bstate\b", re.I), re.compile(r"\bjob\b", re.I), re.compile(r"\bruntime\b", re.I), re.compile(r"\bqueue\b", re.I)],
    "security privacy and permissions": [re.compile(r"\bsecurity\b", re.I), re.compile(r"\bprivacy\b", re.I), re.compile(r"\bpermission\b", re.I), re.compile(r"\bauth", re.I)],
    "validation and error states": [re.compile(r"\bvalidation\b", re.I), re.compile(r"\berror state", re.I), re.compile(r"\bfail state", re.I)],
    "tests and verification": [re.compile(r"\btest", re.I), re.compile(r"\bverification\b", re.I), re.compile(r"\bharness\b", re.I)],
    "release and deployment": [re.compile(r"\brelease\b", re.I), re.compile(r"\bdeployment\b", re.I), re.compile(r"\brollout\b", re.I)],
    "rollback or containment": [re.compile(r"\brollback\b", re.I), re.compile(r"\bcontainment\b", re.I), re.compile(r"\breversal trigger\b", re.I)],
    "observability": [re.compile(r"\bobservability\b", re.I), re.compile(r"\bmonitoring\b", re.I), re.compile(r"\balerting\b", re.I), re.compile(r"\blogging\b", re.I)],
    "documentation update path": [re.compile(r"\bdocs? to update\b", re.I), re.compile(r"\bdocumentation update\b", re.I), re.compile(r"\bdocumentation update path\b", re.I)],
}

PLACEHOLDER_PATTERNS: List[Pattern[str]] = [
    re.compile(r"\bTODO\b", re.I),
    re.compile(r"\bTBD\b", re.I),
    re.compile(r"\bFIXME\b", re.I),
    re.compile(r"lorem ipsum", re.I),
    re.compile(r"\[\s*(fill|insert|add|your|placeholder)[^\]]*\]", re.I),
    re.compile(r"<\s*(your|app|project|name|todo|placeholder)[^>]*>", re.I),
]

WEAK_PHRASES: List[Pattern[str]] = [
    re.compile(r"\bas needed\b", re.I),
    re.compile(r"\bwhere appropriate\b", re.I),
    re.compile(r"\bimplement best practices\b", re.I),
    re.compile(r"\buse best practices\b", re.I),
    re.compile(r"\bindustry standard\b", re.I),
    re.compile(r"\bproduction ready\b", re.I),
    re.compile(r"\bscalable architecture\b", re.I),
    re.compile(r"\bprobably\b", re.I),
    re.compile(r"\bmaybe\b", re.I),
    re.compile(r"\bquick fix\b", re.I),
    re.compile(r"\btemporary fix for now\b", re.I),
    re.compile(r"\bjust hide\b", re.I),
    re.compile(r"\bjust patch\b", re.I),
    re.compile(r"\bjust make it work\b", re.I),
    re.compile(r"\badd a quick guard\b", re.I),
    re.compile(r"\bfuture (agent|developer) (can|should|must) (figure out|discover)\b", re.I),
]

TRACEABILITY_PATTERNS: List[Pattern[str]] = [
    re.compile(r"\bREQ-[A-Z0-9-]+", re.I),
    re.compile(r"\bFR-[A-Z0-9-]+", re.I),
    re.compile(r"\bNFR-[A-Z0-9-]+", re.I),
    re.compile(r"\bRISK-[A-Z0-9-]+", re.I),
    re.compile(r"\bIMPL-RISK-[A-Z0-9-]+", re.I),
    re.compile(r"\bSEC-[A-Z0-9-]+", re.I),
    re.compile(r"\bDEC-[A-Z0-9-]+", re.I),
    re.compile(r"\bADR-[A-Z0-9-]+", re.I),
    re.compile(r"\bSLICE-[A-Z0-9-]+", re.I),
]

SOURCE_LABEL_PATTERNS: List[Pattern[str]] = [
    re.compile(r"\bUser-confirmed\b", re.I),
    re.compile(r"\bRepo-derived\b", re.I),
    re.compile(r"\bStandard-backed\b", re.I),
    re.compile(r"\bAssumption\b", re.I),
    re.compile(r"\bAI-recommended default\b", re.I),
    re.compile(r"\bnot-applicable-with-reason\b", re.I),
]

AI_TRIGGER_PATTERNS: List[Pattern[str]] = [
    re.compile(r"\bruntime AI\b", re.I),
    re.compile(r"\bLLM\b", re.I),
    re.compile(r"\blarge language model\b", re.I),
    re.compile(r"\bmodel provider\b", re.I),
    re.compile(r"\bOpenAI\b", re.I),
    re.compile(r"\bAnthropic\b", re.I),
    re.compile(r"\bGemini\b", re.I),
    re.compile(r"\bembedding\b", re.I),
    re.compile(r"\bRAG\b", re.I),
    re.compile(r"\bmodel prompt\b", re.I),
    re.compile(r"\bprompt template\b", re.I),
    re.compile(r"\bgenerated content\b", re.I),
    re.compile(r"\bsemantic decision\b", re.I),
    re.compile(r"\bclassification\b", re.I),
    re.compile(r"\branking\b", re.I),
    re.compile(r"\bscoring\b", re.I),
    re.compile(r"\brecommendation engine\b", re.I),
    re.compile(r"\bnon-deterministic\b", re.I),
]

PATH_OR_COMMAND_PATTERN = re.compile(
    r"`[^`]*(?:/|\\|\.(?:ts|tsx|js|jsx|py|rb|go|rs|java|cs|php|sql|md|yml|yaml|json|toml|env))[^`]*`"
    r"|(?:^|\s)(?:src|app|pages|server|client|components|tests|test|scripts|db|prisma|migrations|api|docs)/[A-Za-z0-9_.\-/]+"
    r"|(?:npm|pnpm|yarn|pytest|python|ruff|go test|cargo test|dotnet test|mvn test|gradle test)\s+[A-Za-z0-9:_.\-/]*",
    re.I | re.M,
)


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", text.lower())).strip()


def has_concept(text_norm: str, concept: str) -> bool:
    words = normalize(concept)
    aliases = {
        "related requirement ids": ["related requirement ids", "requirements covered", "requirement ids", "related requirements"],
        "related decisions and adrs": ["related decisions and adrs", "related decisions", "adrs", "decision links"],
        "assumptions with impact": ["assumptions with impact", "assumptions", "impact"],
        "affected files or proposed file locations": ["affected files", "proposed file locations", "proposed paths", "files likely touched", "file locations"],
        "rollback or containment notes": ["rollback or containment notes", "rollback", "containment", "reversal trigger"],
        "implementation artifact index": ["implementation artifact index", "artifact index", "implementation index"],
        "source package version": ["source package version", "source package", "source docs package"],
        "omitted artifact register": ["omitted artifact register", "omitted artifacts"],
        "quality gate": ["quality gate", "validation result"],
        "slice id": ["slice id", "slice ids", "slice"],
        "owner or affected role": ["owner or affected role", "affected role", "owner"],
        "ux or api states affected": ["ux or api states affected", "ui states", "api states", "states affected"],
        "shortcuts rejected": ["shortcuts rejected", "rejected shortcuts", "shortcut rejected"],
        "rollback or restore": ["rollback or restore", "restore", "rollback"],
        "auth": ["auth", "authentication", "authorization"],
        "dto": ["dto", "request schema", "response schema"],
        "schemas": ["schema", "schemas"],
        "screen": ["screen", "surface", "view"],
        "component": ["component", "components"],
        "background jobs": ["background jobs", "scheduled work", "jobs"],
        "queues": ["queues", "queue", "not applicable with reason"],
        "csrf": ["csrf", "cross site request forgery", "not applicable with reason"],
        "commands": ["commands", "command"],
        "final proof expected": ["final proof expected", "final proof", "proof expected"],
        "final surface consumption": ["final surface consumption", "final user visible surface", "downstream consumer"],
        "eval fixtures": ["eval fixtures", "evaluation fixtures", "evals"],
        "bounded retries": ["bounded retries", "bounded remediation"],
    }.get(words, [words])
    return any(normalize(alias) in text_norm for alias in aliases)


def count_matches(patterns: Iterable[Pattern[str]], text: str) -> List[str]:
    hits: List[str] = []
    for pattern in patterns:
        for match in pattern.finditer(text):
            line_no = text[: match.start()].count("\n") + 1
            hits.append(f"line {line_no}: {match.group(0)[:100]}")
    return hits


def has_any(patterns: Iterable[Pattern[str]], text: str) -> bool:
    return any(pattern.search(text) for pattern in patterns)


def find_empty_leaf_sections(text: str) -> List[str]:
    headings = list(re.finditer(r"(?m)^(#{1,6})\s+(.+?)\s*$", text))
    hits: List[str] = []
    for index, match in enumerate(headings):
        level = len(match.group(1))
        next_match = headings[index + 1] if index + 1 < len(headings) else None
        body_end = next_match.start() if next_match else len(text)
        body = text[match.end() : body_end]
        has_content = any(line.strip() and not line.lstrip().startswith("#") for line in body.splitlines())
        if has_content:
            continue
        next_level = len(next_match.group(1)) if next_match else 0
        if next_match is None or next_level <= level:
            line_no = text[: match.start()].count("\n") + 1
            hits.append(f"line {line_no}: {match.group(2)[:100]}")
    return hits


def find_unknown_without_impact(text: str) -> List[str]:
    hits: List[str] = []
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not re.search(r"\bUnknown\b", line, re.I):
            continue
        window = " ".join(lines[index : min(index + 3, len(lines))])
        if not re.search(r"\bimpact\b", window, re.I):
            hits.append(f"line {index + 1}: {line.strip()[:120]}")
    return hits


def implementation_dir_from_args(docs_dir: Path, implementation_dir: str | None) -> Path:
    if implementation_dir:
        return Path(implementation_dir)
    if docs_dir.name == "implementation":
        return docs_dir
    return docs_dir / "implementation"


def read_markdown(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def detect_ai_required(docs_dir: Path, implementation_dir: Path, force: bool) -> bool:
    if force:
        return True
    if (implementation_dir / AI_ARTIFACT).exists():
        return True
    search_root = docs_dir if docs_dir.exists() and docs_dir != implementation_dir else implementation_dir
    texts: List[str] = []
    if search_root.exists():
        for path in sorted(search_root.rglob("*.md")):
            try:
                path.relative_to(implementation_dir)
                if search_root != implementation_dir:
                    continue
            except ValueError:
                pass
            if path.name in {"14-ai-development-guardrails.md", AI_ARTIFACT, "codex-implementation-prompts.md"}:
                continue
            try:
                texts.append(read_markdown(path))
            except OSError:
                continue
    combined = "\n".join(texts)
    return has_any(AI_TRIGGER_PATTERNS, combined)


def extract_slice_blocks(text: str) -> List[str]:
    headings = list(re.finditer(r"(?m)^(#{2,6})\s+.*?(?:slice|SLICE-[A-Z0-9-]+).*?$", text, re.I))
    blocks: List[str] = []
    for index, match in enumerate(headings):
        level = len(match.group(1))
        body_end = len(text)
        for next_match in re.finditer(r"(?m)^(#{2,6})\s+.+$", text[match.end() :]):
            absolute = match.end() + next_match.start()
            next_level = len(next_match.group(1))
            if next_level <= level:
                body_end = absolute
                break
        blocks.append(text[match.start() : body_end])
    if blocks:
        return blocks
    if re.search(r"\bSLICE-[A-Z0-9-]+", text, re.I):
        return [text]
    return []


def validate_slice_blocks(text: str) -> List[str]:
    required = [
        "implementation outcome",
        "root source of truth",
        "upstream dependencies",
        "downstream consumers",
        "data touched",
        "permission and privacy impact",
        "ux or api states affected",
        "tests to add or update",
        "docs to update",
        "stop condition",
        "shortcuts rejected",
    ]
    blocks = extract_slice_blocks(text)
    if not blocks:
        return ["No slice blocks or SLICE-* IDs found"]
    misses: List[str] = []
    for index, block in enumerate(blocks, start=1):
        block_norm = normalize(block)
        missing = [concept for concept in required if not has_concept(block_norm, concept)]
        if missing:
            slice_id = re.search(r"\bSLICE-[A-Z0-9-]+", block, re.I)
            name = slice_id.group(0) if slice_id else f"slice block {index}"
            misses.append(f"{name}: {', '.join(missing)}")
    return misses


def validate_verification_matrix(text: str, ai_required: bool) -> List[str]:
    categories = [
        "unit",
        "integration",
        "contract",
        "e2e",
        "accessibility",
        "security",
        "performance",
        "migration",
        "smoke",
        "release gates",
        "commands",
    ]
    if ai_required:
        categories.append("eval fixtures")
    text_norm = normalize(text)
    return [category for category in categories if not has_concept(text_norm, category)]


def validate_pack_surfaces(combined: str) -> List[str]:
    misses: List[str] = []
    for concept, patterns in PACK_SURFACE_CONCEPTS.items():
        if not has_any(patterns, combined):
            misses.append(concept)
    return misses


def validate_file(
    artifact: str,
    text: str,
    concepts: List[str],
    strict: bool,
    existing_repo: bool,
    ai_required: bool,
) -> dict[str, object]:
    text_norm = normalize(text)
    result: dict[str, object] = {
        "missing_concepts": [concept for concept in concepts if not has_concept(text_norm, concept)],
        "missing_global_concepts": [],
        "placeholder_hits": count_matches(PLACEHOLDER_PATTERNS, text),
        "weak_phrase_hits": [],
        "empty_section_hits": [],
        "unknown_without_impact_hits": [],
        "missing_source_label": False,
        "missing_traceability": False,
        "missing_evidence_paths_or_commands": False,
        "slice_block_misses": [],
        "verification_category_misses": [],
    }

    if artifact != "README.md":
        result["missing_global_concepts"] = [
            concept for concept in GLOBAL_CONCEPTS if not has_concept(text_norm, concept)
        ]

    if strict:
        result["weak_phrase_hits"] = count_matches(WEAK_PHRASES, text)
        result["empty_section_hits"] = find_empty_leaf_sections(text)[:20]
        result["unknown_without_impact_hits"] = find_unknown_without_impact(text)[:20]
        result["missing_source_label"] = not has_any(SOURCE_LABEL_PATTERNS, text)
        result["missing_traceability"] = (
            artifact != "README.md"
            and "not-applicable-with-reason" not in text_norm
            and not has_any(TRACEABILITY_PATTERNS, text)
        )
        if artifact != "README.md":
            result["missing_evidence_paths_or_commands"] = not PATH_OR_COMMAND_PATTERN.search(text)

    if artifact == "vertical-slice-specs.md":
        result["slice_block_misses"] = validate_slice_blocks(text)

    if artifact == "verification-and-test-harness.md":
        result["verification_category_misses"] = validate_verification_matrix(text, ai_required)

    if existing_repo and artifact != "README.md" and "repo derived" not in text_norm:
        result["missing_source_label"] = True

    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs-dir", default="docs/app-plan")
    parser.add_argument("--implementation-dir", help="Override implementation artifact directory")
    parser.add_argument("--profile", choices=["full", "focused"], default="full")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--existing-repo", action="store_true")
    parser.add_argument("--require-ai-matrix", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    docs_dir = Path(args.docs_dir)
    implementation_dir = implementation_dir_from_args(docs_dir, args.implementation_dir)
    ai_required = detect_ai_required(docs_dir, implementation_dir, args.require_ai_matrix)

    report: dict[str, object] = {
        "docs_dir": str(docs_dir),
        "implementation_dir": str(implementation_dir),
        "profile": args.profile,
        "ai_matrix_required": ai_required,
        "missing_files": [],
        "file_results": {},
        "missing_pack_surfaces": [],
        "passed": True,
    }

    artifact_concepts = dict(REQUIRED_ARTIFACTS)
    if ai_required:
        artifact_concepts[AI_ARTIFACT] = AI_ARTIFACT_CONCEPTS

    if args.profile == "focused":
        required_files = [
            artifact for artifact in artifact_concepts if (implementation_dir / artifact).exists()
        ]
        if (implementation_dir / "README.md").exists() and "README.md" not in required_files:
            required_files.insert(0, "README.md")
        if not required_files:
            report["missing_files"] = ["No recognized SpecForge implementation artifacts found"]
    else:
        required_files = list(artifact_concepts)

    combined_parts: List[str] = []
    file_results: dict[str, object] = {}

    for artifact in required_files:
        path = implementation_dir / artifact
        if not path.exists():
            report["missing_files"].append(artifact)  # type: ignore[union-attr]
            continue
        text = read_markdown(path)
        combined_parts.append(text)
        file_results[artifact] = validate_file(
            artifact=artifact,
            text=text,
            concepts=artifact_concepts[artifact],
            strict=args.strict,
            existing_repo=args.existing_repo,
            ai_required=ai_required,
        )

    combined = "\n".join(combined_parts)
    if required_files:
        report["missing_pack_surfaces"] = validate_pack_surfaces(combined)

    report["file_results"] = file_results

    failing_file_results = {}
    for artifact, result in file_results.items():
        failures = {
            key: value
            for key, value in result.items()  # type: ignore[union-attr]
            if value not in (False, [], {}, None)
        }
        if failures:
            failing_file_results[artifact] = failures

    report["passed"] = not (
        report["missing_files"]
        or report["missing_pack_surfaces"]
        or failing_file_results
    )

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        if report["passed"]:
            print("SpecForge implementation artifact validation passed.")
        else:
            print("SpecForge implementation artifact validation failed.")
            if report["missing_files"]:
                print("Missing files:")
                for item in report["missing_files"]:  # type: ignore[union-attr]
                    print(f"- {item}")
            if report["missing_pack_surfaces"]:
                print("Missing pack-level implementation surfaces:")
                for item in report["missing_pack_surfaces"]:  # type: ignore[union-attr]
                    print(f"- {item}")
            for artifact, failures in failing_file_results.items():
                print(f"{artifact}:")
                for key, value in failures.items():
                    if isinstance(value, list):
                        print(f"- {key}: {', '.join(str(v) for v in value)}")
                    else:
                        print(f"- {key}: {value}")

    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
