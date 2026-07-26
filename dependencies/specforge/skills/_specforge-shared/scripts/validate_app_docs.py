#!/usr/bin/env python3
"""Validate SpecForge app planning docs for required files, headings, and common AI-slop markers.

This script checks structure and obvious quality problems. It does not prove the docs are correct.
Use --profile focused for targeted packages that intentionally omit unrelated docs.
Use --assurance when the project triggered the assurance extension docs.
Focused repo packages should use descriptive filenames in the canonical folder
layout. Legacy flat filenames remain accepted as aliases for older packages.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Pattern

REQUIRED: Dict[str, List[str]] = {
    "00-docs-index.md": ["Document map", "Source register", "Assumption register", "Open question register", "Decision register", "Risk register", "Requirement ID map", "Terminology and ID registry"],
    "01-product-brief.md": ["Problem statement", "Target audience", "Product boundaries", "Success metrics", "Explicit non-goals"],
    "02-prd.md": ["User stories", "Acceptance criteria", "Functional requirements", "Non-functional requirements", "Traceability matrix"],
    "03-feature-scope.md": ["MVP features", "V1 features", "Out-of-scope list", "Feature risk rating"],
    "04-user-flows-and-screen-map.md": ["Role-based flows", "Screen inventory", "Navigation map", "State transition map"],
    "05-ux-ui-content-contract.md": ["Typography contract", "Component contract", "State contract", "Accessibility contract"],
    "06-architecture.md": ["Architecture summary", "C4 context diagram", "C4 container diagram", "Future capability map", "Evolution and extension strategy", "Failure modes", "Tradeoffs"],
    "07-adr-index.md": ["ADR list", "Decision status"],
    "08-data-model-and-data-contracts.md": ["Data inventory", "Data classification", "Entity model", "Data dictionary", "Retention and deletion"],
    "09-api-and-integration-contracts.md": ["Endpoint inventory", "Request schemas", "Response schemas", "Error contract", "Rate limit contract"],
    "10-security-design.md": ["Security goals", "Trust boundaries", "Authentication", "Authorization", "Secrets management", "Security testing requirements"],
    "11-threat-model.md": ["Assets", "Actors", "Entry points", "Trust boundaries", "Threat analysis", "Residual risk"],
    "12-engineering-rules.md": ["Repo rules", "Code style", "Dependency policy", "Pull request checklist", "Protected files"],
    "13-testing-quality-release-observability.md": ["Quality model", "CI quality gates", "Release checklist", "Rollback plan", "Monitoring plan"],
    "14-ai-development-guardrails.md": ["AI operating rules", "Codex task contract", "Allowed changes", "Blocked changes", "Approval gates"],
    "15-blast-radius-and-change-risk.md": ["Critical assets", "High-risk workflows", "Change risk levels", "Blast radius by component"],
    "18-privacy-data-protection.md": ["Data minimization rules", "Personal data inventory", "Retention and deletion schedule", "Vendor and third-party data sharing table", "Privacy risk register"],
    "19-business-gtm-monetization.md": ["Business model hypothesis", "Monetization model", "Go-to-market channels", "Activation and retention metrics", "Business risks"],
    "20-compliance-policy-and-review.md": ["Applicability decision", "Jurisdictions and launch regions", "Platform policy map", "Qualified review needed"],
    "21-trust-safety-abuse-prevention.md": ["Applicability decision", "Abuse surface map", "Reporting and appeal flows", "Rate limits and anti-spam controls"],
    "22-environment-config-secrets.md": ["Environment inventory", "Secret inventory", "Secret storage and rotation rules", "Production access rules", "Leak prevention and response"],
    "23-operational-runbooks.md": ["Production readiness checklist", "Deployment runbook", "Rollback runbook", "Backup and restore runbook", "Incident triage runbook"],
    "24-dependency-supply-chain.md": ["Dependency inventory policy", "Dependency approval policy", "Vulnerability scanning requirements", "SBOM plan", "Build provenance plan"],
    "25-cost-capacity-performance.md": ["Capacity assumptions", "Performance budgets", "Rate limits and quotas", "Cost alerts and budget thresholds", "Performance test plan"],
    "26-analytics-events-metrics.md": ["Measurement goals", "Product event taxonomy", "Event naming contract", "Privacy-safe analytics rules", "Data retention for analytics"],
    "27-glossary-taxonomy.md": ["Canonical glossary", "Role ID registry", "Feature ID registry", "Requirement ID registry", "Naming rules"],
    "28-platform-feature-contracts.md": ["Platform applicability matrix", "Web contract", "Mobile contract", "Third-party integration edge cases", "Requirement impact map"],
    "29-ai-implementation-task-plan.md": ["Implementation principles", "Vertical slice map", "Task dependency graph", "Task contract template", "High-risk task gates", "Future consumer and foundation seam map"],
    "30-decision-and-defaults-register.md": ["Decision support policy", "Decision-blocking questions", "User-confirmed decisions", "AI-recommended defaults", "Options considered", "Pros and cons", "Final recommendations", "Source basis", "Assumptions and impact", "Reversal triggers", "No-shortcut review log"],
    "99-research-ledger.md": ["Research status", "Source entries", "Sources rejected or unavailable", "Requirements affected by source", "Date checked"],
}

ASSURANCE_REQUIRED: Dict[str, List[str]] = {
    "31-product-assurance-contract.md": ["Applicability decision", "App claims and decisions", "Claims the app must never fake", "User trust dependencies", "Evidence requirements", "Low-confidence behavior", "Limited, pending, and unavailable states", "Human or qualified review triggers"],
    "32-source-of-truth-map.md": ["Authority inventory", "Decision-to-authority table", "Source freshness rules", "Validation and provenance rules", "Remediation and fail-closed rules", "Downstream consumer map", "Status precedence rules", "Fallback retirement rules"],
    "33-decision-boundary-and-decision-matrix.md": ["Applicability decision", "Decision owner inventory", "Deterministic-owned validations", "Disallowed hidden domain logic", "Domain-determinism exception register", "Decision matrix template", "Bounded remediation rules"],
    "34-surface-and-output-authority-map.md": ["Surface and output inventory", "First-useful-viewport questions", "Source-to-surface table", "DTO, API, report, and export ownership", "Display-copy ownership", "Empty, limited, pending, and unavailable states", "Role and filter rules", "Object identity rules"],
    "35-assurance-fixtures-and-validation.md": ["Validation ladder", "Golden scenario catalog", "Perturbation matrix", "Source-to-surface assertions", "Role, API, browser, and export smoke tests", "Regression ownership", "Stop condition"],
    "36-documentation-authority-lifecycle.md": ["Documentation authority hierarchy", "Active living docs", "Historical docs", "Generated inventory rules", "Marketing docs rules", "Future backlog routing", "Link and file-map sanity checks", "Code-vs-doc audit rules", "Deletion and retirement rules"],
}

FINAL_REQUIRED: Dict[str, List[str]] = {
    "17-document-quality-review.md": ["Review summary", "Validation result", "Anti-slop findings", "Traceability findings", "Remaining gaps"],
}

EXISTING_REPO_REQUIRED: Dict[str, List[str]] = {
    "16-documentation-audit.md": ["Repo scan summary", "Existing docs inventory", "Code-derived facts", "Stale docs found", "Evidence paths"],
}

GLOBAL_SECTIONS = ["Purpose", "Status", "Inputs used", "Sources and basis", "Assumptions", "Decisions", "Open questions", "Traceability"]

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
    re.compile(r"\bbest practices\b", re.I),
    re.compile(r"\bsecure authentication\b", re.I),
    re.compile(r"\bvalidate user input\b", re.I),
    re.compile(r"\bindustry standard\b", re.I),
    re.compile(r"\bproduction ready\b", re.I),
    re.compile(r"\bscalable architecture\b", re.I),
    re.compile(r"\beasiest path\b", re.I),
    re.compile(r"\bquick fix for now\b", re.I),
    re.compile(r"\btemporary fix for now\b", re.I),
    re.compile(r"\bjust hide it in the UI\b", re.I),
    re.compile(r"\badd a quick guard\b", re.I),
    re.compile(r"\bmake the card look complete\b", re.I),
    re.compile(r"\bjust make it work\b", re.I),
]

TRACEABILITY_PATTERNS: List[Pattern[str]] = [
    re.compile(r"\bREQ-[A-Z0-9-]+", re.I),
    re.compile(r"\bFR-[A-Z0-9-]+", re.I),
    re.compile(r"\bNFR-[A-Z0-9-]+", re.I),
    re.compile(r"\bRISK-[A-Z0-9-]+", re.I),
    re.compile(r"\bSEC-[A-Z0-9-]+", re.I),
    re.compile(r"\bDEC-[A-Z0-9-]+", re.I),
    re.compile(r"\bRCA-[A-Z0-9-]+", re.I),
]

SOURCE_LABEL_PATTERNS: List[Pattern[str]] = [
    re.compile(r"\bUser-confirmed\b", re.I),
    re.compile(r"\bRepo-derived\b", re.I),
    re.compile(r"\bStandard-backed\b", re.I),
    re.compile(r"\bAssumption\b", re.I),
    re.compile(r"\bAI-recommended default\b", re.I),
    re.compile(r"\bnot-applicable-with-reason\b", re.I),
]

DECISION_FIELD_NAMES = [
    "Options considered",
    "Pros and cons",
    "Final recommendation",
    "Verification method",
    "Reversal trigger",
]

ASSURANCE_OLD_FILES = [
    "31-product-trust-contract.md",
    "33-ai-decision-boundary-and-prompt-matrix.md",
    "34-surface-authority-and-ui-truth-map.md",
    "35-golden-fixtures-and-trust-testing.md",
]

LEGACY_TO_CANONICAL: Dict[str, str] = {
    "00-docs-index.md": "README.md",
    "16-documentation-audit.md": "documentation-audit.md",
    "17-document-quality-review.md": "documentation-quality-review.md",
    "30-decision-and-defaults-register.md": "decision-log.md",
    "31-product-assurance-contract.md": "product-assurance-contract.md",
    "32-source-of-truth-map.md": "source-of-truth-map.md",
    "33-decision-boundary-and-decision-matrix.md": "decision-boundary-matrix.md",
    "34-surface-and-output-authority-map.md": "surface-authority-map.md",
    "35-assurance-fixtures-and-validation.md": "validation-fixture-plan.md",
    "36-documentation-authority-lifecycle.md": "documentation-lifecycle.md",
    "99-research-ledger.md": "research-ledger.md",
}

CANONICAL_PATHS: Dict[str, str] = {
    "README.md": "README.md",
    "01-product-brief.md": "product/01-product-brief.md",
    "02-prd.md": "product/02-prd.md",
    "03-feature-scope.md": "product/03-feature-scope.md",
    "04-user-flows-and-screen-map.md": "product/04-user-flows-and-screen-map.md",
    "05-ux-ui-content-contract.md": "product/05-ux-ui-content-contract.md",
    "06-architecture.md": "architecture/06-architecture.md",
    "07-adr-index.md": "architecture/07-adr-index.md",
    "08-data-model-and-data-contracts.md": "data-and-api/08-data-model-and-data-contracts.md",
    "09-api-and-integration-contracts.md": "data-and-api/09-api-and-integration-contracts.md",
    "10-security-design.md": "security/10-security-design.md",
    "11-threat-model.md": "security/11-threat-model.md",
    "12-engineering-rules.md": "engineering/12-engineering-rules.md",
    "13-testing-quality-release-observability.md": "engineering/13-testing-quality-release-observability.md",
    "14-ai-development-guardrails.md": "engineering/14-ai-development-guardrails.md",
    "15-blast-radius-and-change-risk.md": "engineering/15-blast-radius-and-change-risk.md",
    "documentation-audit.md": "auditability/documentation-audit.md",
    "documentation-quality-review.md": "auditability/documentation-quality-review.md",
    "18-privacy-data-protection.md": "security/18-privacy-data-protection.md",
    "19-business-gtm-monetization.md": "product/19-business-gtm-monetization.md",
    "20-compliance-policy-and-review.md": "security/20-compliance-policy-and-review.md",
    "21-trust-safety-abuse-prevention.md": "security/21-trust-safety-abuse-prevention.md",
    "22-environment-config-secrets.md": "engineering/22-environment-config-secrets.md",
    "23-operational-runbooks.md": "engineering/23-operational-runbooks.md",
    "24-dependency-supply-chain.md": "engineering/24-dependency-supply-chain.md",
    "25-cost-capacity-performance.md": "engineering/25-cost-capacity-performance.md",
    "26-analytics-events-metrics.md": "product/26-analytics-events-metrics.md",
    "27-glossary-taxonomy.md": "product/27-glossary-taxonomy.md",
    "28-platform-feature-contracts.md": "product/28-platform-feature-contracts.md",
    "29-ai-implementation-task-plan.md": "implementation/29-ai-implementation-task-plan.md",
    "decision-log.md": "auditability/decision-log.md",
    "product-assurance-contract.md": "assurance/product-assurance-contract.md",
    "source-of-truth-map.md": "assurance/source-of-truth-map.md",
    "decision-boundary-matrix.md": "assurance/decision-boundary-matrix.md",
    "surface-authority-map.md": "assurance/surface-authority-map.md",
    "validation-fixture-plan.md": "assurance/validation-fixture-plan.md",
    "documentation-lifecycle.md": "auditability/documentation-lifecycle.md",
    "research-ledger.md": "auditability/research-ledger.md",
}

REVIEW_DOC_NAMES = {"17-document-quality-review.md", "documentation-quality-review.md"}
INDEX_DOC_NAMES = {"00-docs-index.md", "README.md"}
DECISION_DOC_NAMES = {"30-decision-and-defaults-register.md", "decision-log.md"}
RESEARCH_DOC_NAMES = {"99-research-ledger.md", "research-ledger.md"}


def resolve_doc_path(docs_dir: Path, filename: str) -> tuple[Path, str]:
    """Return the preferred path and actual filename for a required document."""
    canonical = LEGACY_TO_CANONICAL.get(filename)
    candidates = []
    if canonical and canonical in CANONICAL_PATHS:
        candidates.append(CANONICAL_PATHS[canonical])
    if filename in CANONICAL_PATHS:
        candidates.append(CANONICAL_PATHS[filename])
    if canonical:
        candidates.append(canonical)
    candidates.append(filename)
    for candidate in candidates:
        path = docs_dir / candidate
        if path.exists():
            return path, path.relative_to(docs_dir).as_posix()

    basename = canonical or filename
    matches = sorted(docs_dir.rglob(basename)) if docs_dir.exists() else []
    if matches:
        path = matches[0]
        return path, path.relative_to(docs_dir).as_posix()

    preferred = CANONICAL_PATHS.get(canonical or filename, canonical or filename)
    return docs_dir / preferred, preferred


def has_heading(text_lower: str, heading: str) -> bool:
    escaped = re.escape(heading.lower())
    return re.search(rf"(^|\n)#+\s+{escaped}(\n|$)", text_lower) is not None or heading.lower() in text_lower


def count_matches(patterns: List[Pattern[str]], text: str) -> List[str]:
    hits: List[str] = []
    for pattern in patterns:
        for match in pattern.finditer(text):
            line_no = text[: match.start()].count("\n") + 1
            excerpt = match.group(0)[:80]
            hits.append(f"line {line_no}: {excerpt}")
    return hits


def has_any(patterns: List[Pattern[str]], text: str) -> bool:
    return any(p.search(text) for p in patterns)


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
            hits.append(f"line {line_no}: {match.group(2)[:80]}")
    return hits


def find_unknown_without_impact(text: str) -> List[str]:
    hits: List[str] = []
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not re.search(r"\bUnknown\b", line, re.I):
            continue
        window = " ".join(lines[index : min(index + 3, len(lines))])
        if not re.search(r"\bimpact\b", window, re.I):
            hits.append(f"line {index + 1}: {line.strip()[:100]}")
    return hits


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs-dir", default="docs/app-plan")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--profile", choices=["full", "focused"], default="full", help="Use focused to validate only recognized docs that exist")
    parser.add_argument("--strict", action="store_true", help="Also fail on weak generic phrases and missing traceability markers")
    parser.add_argument("--final", action="store_true", help="Require the final quality-review document")
    parser.add_argument("--existing-repo", action="store_true", help="Require the existing-repo documentation audit")
    parser.add_argument("--assurance", action="store_true", help="Require assurance extension docs 31-36")
    args = parser.parse_args()

    docs_dir = Path(args.docs_dir)
    report = {
        "docs_dir": str(docs_dir),
        "missing_files": [],
        "missing_headings": {},
        "missing_global_sections": {},
        "placeholder_hits": {},
        "weak_phrase_hits": {},
        "empty_section_hits": {},
        "unknown_without_impact_hits": {},
        "missing_source_labels": [],
        "missing_decision_fields": {},
        "missing_traceability_markers": [],
        "missing_task_traceability": [],
        "legacy_assurance_file_hits": [],
        "passed": True,
    }

    required = dict(REQUIRED)
    if args.final:
        required.update(FINAL_REQUIRED)
    if args.existing_repo:
        required.update(EXISTING_REPO_REQUIRED)
    if args.assurance:
        required.update(ASSURANCE_REQUIRED)

    if args.profile == "focused":
        recognized = dict(REQUIRED)
        recognized.update(FINAL_REQUIRED)
        recognized.update(EXISTING_REPO_REQUIRED)
        recognized.update(ASSURANCE_REQUIRED)
        required = {
            filename: headings
            for filename, headings in recognized.items()
            if resolve_doc_path(docs_dir, filename)[0].exists()
        }
        if not required:
            report["missing_files"].append("No recognized SpecForge docs found for focused validation")

    for filename, headings in required.items():
        path, actual_filename = resolve_doc_path(docs_dir, filename)
        if not path.exists():
            report["missing_files"].append(filename)
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        text_lower = text.lower()

        missing = [h for h in headings if not has_heading(text_lower, h)]
        if missing:
            report["missing_headings"][actual_filename] = missing

        missing_global = [h for h in GLOBAL_SECTIONS if h.lower() not in text_lower]
        if missing_global:
            report["missing_global_sections"][actual_filename] = missing_global

        placeholder_hits = count_matches(PLACEHOLDER_PATTERNS, text)
        if placeholder_hits:
            report["placeholder_hits"][actual_filename] = placeholder_hits

        if args.strict:
            empty_hits = find_empty_leaf_sections(text)
            if empty_hits:
                report["empty_section_hits"][actual_filename] = empty_hits[:20]

            unknown_hits = find_unknown_without_impact(text)
            if unknown_hits:
                report["unknown_without_impact_hits"][actual_filename] = unknown_hits[:20]

            if "not-applicable-with-reason" not in text_lower and not has_any(SOURCE_LABEL_PATTERNS, text):
                report["missing_source_labels"].append(actual_filename)

            actual_name = Path(actual_filename).name

            if actual_name not in INDEX_DOC_NAMES | REVIEW_DOC_NAMES | RESEARCH_DOC_NAMES and re.search(r"\bDEC-[A-Z0-9-]+", text, re.I):
                missing_decision_fields = [field for field in DECISION_FIELD_NAMES if field.lower() not in text_lower]
                if missing_decision_fields:
                    report["missing_decision_fields"][actual_filename] = missing_decision_fields

            weak_hits = count_matches(WEAK_PHRASES, text)
            if weak_hits:
                report["weak_phrase_hits"][actual_filename] = weak_hits[:20]

            if actual_name not in INDEX_DOC_NAMES | REVIEW_DOC_NAMES | DECISION_DOC_NAMES | RESEARCH_DOC_NAMES:
                if "not-applicable-with-reason" not in text_lower and not has_any(TRACEABILITY_PATTERNS, text):
                    report["missing_traceability_markers"].append(actual_filename)

            if filename == "29-ai-implementation-task-plan.md":
                task_trace_terms = [
                    (r"\bREQ-[A-Z0-9-]+", "requirement ID"),
                    (r"\bRISK-[A-Z0-9-]+", "risk ID"),
                    (r"\b(test|verification)\b", "test or verification"),
                    (r"\b(docs update|documentation update|related docs)\b", "documentation linkage"),
                    (r"\b(rollback|containment)\b", "rollback or containment"),
                ]
                missing_terms = [label for pattern, label in task_trace_terms if not re.search(pattern, text, re.I)]
                if missing_terms:
                    report["missing_task_traceability"].append(f"{filename}: {', '.join(missing_terms)}")

    for legacy in ASSURANCE_OLD_FILES:
        if (docs_dir / legacy).exists():
            report["legacy_assurance_file_hits"].append(legacy)

    report["passed"] = not (
        report["missing_files"]
        or report["missing_headings"]
        or report["missing_global_sections"]
        or report["placeholder_hits"]
        or report["legacy_assurance_file_hits"]
        or (args.strict and report["weak_phrase_hits"])
        or (args.strict and report["empty_section_hits"])
        or (args.strict and report["unknown_without_impact_hits"])
        or (args.strict and report["missing_source_labels"])
        or (args.strict and report["missing_decision_fields"])
        or (args.strict and report["missing_traceability_markers"])
        or (args.strict and report["missing_task_traceability"])
    )

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        if report["passed"]:
            print("SpecForge docs validation passed.")
        else:
            print("SpecForge docs validation failed.")
            sections = [
                ("missing_files", "Missing files"),
                ("missing_headings", "Missing headings"),
                ("missing_global_sections", "Missing global sections"),
                ("placeholder_hits", "Placeholder hits"),
                ("weak_phrase_hits", "Weak phrase hits"),
                ("empty_section_hits", "Empty sections"),
                ("unknown_without_impact_hits", "Unknown values without impact notes"),
                ("missing_source_labels", "Missing source labels"),
                ("missing_decision_fields", "Missing decision fields"),
                ("missing_traceability_markers", "Missing traceability markers"),
                ("missing_task_traceability", "Missing task traceability"),
                ("legacy_assurance_file_hits", "Legacy assurance file names"),
            ]
            for key, label in sections:
                value = report[key]
                if not value:
                    continue
                print(f"{label}:")
                if isinstance(value, list):
                    for item in value:
                        print(f"- {item}")
                else:
                    for file, items in value.items():
                        print(f"- {file}: {', '.join(items)}")

    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
