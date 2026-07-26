#!/usr/bin/env python3
"""
Evidence-grade detection helper.

Scans markdown content for statistical claims missing evidence grades.

Usage:
  python evidence_grader.py --root docs/marketing-plan
"""

import argparse
import re
import sys
from pathlib import Path


# Patterns that indicate a statistical / benchmark claim
STAT_PATTERNS = [
    r"\d+%\s+(?:conversion|click|reply|open|response|retention|growth|CTR|CPM|CPC)",
    r"\d+x\s+(?:better|higher|lower|more|less|gap)",
    r"\$\d+\s+(?:per|CPM|CPC|CPA|CPI)",
    r"\d+[\.,]\d+\s+CTR",
    r"\d+%\s+(?:ROAS|LTV|CAC)",
]

# Indicators of evidence grade nearby (within ±5 lines)
GRADE_INDICATORS = [
    r"evidence grade[\s:]+[ABCDE]",
    r"\(evidence [ABCDE]\)",
    r"Evidence: [ABCDE]",
]


def find_md_files(root: Path):
    return list(root.glob("**/*.md"))


def check_grades(content: str, file_path: Path) -> list:
    findings = []
    lines = content.splitlines()
    for line_num, line in enumerate(lines, 1):
        for pattern in STAT_PATTERNS:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                # Check ±5 lines for grade indicator
                start = max(0, line_num - 6)
                end = min(len(lines), line_num + 5)
                nearby = "\n".join(lines[start:end])
                has_grade = any(re.search(p, nearby, re.IGNORECASE) for p in GRADE_INDICATORS)
                if not has_grade:
                    findings.append((file_path, line_num, line.strip()[:120], match.group(0)))
    return findings


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    args = parser.parse_args()

    md_files = find_md_files(args.root)
    all_findings = []

    for md in md_files:
        try:
            content = md.read_text(encoding="utf-8")
        except Exception:
            continue
        all_findings.extend(check_grades(content, md))

    print(f"Files scanned: {len(md_files)}")
    print(f"Claims missing evidence grade: {len(all_findings)}")
    print()

    for file_path, line, snippet, claim in all_findings[:30]:
        print(f"  {file_path}:{line}")
        print(f"    Claim: {claim}")
        print(f"    Line: {snippet}")
        print()

    if len(all_findings) > 30:
        print(f"  ... and {len(all_findings) - 30} more.")


if __name__ == "__main__":
    main()
