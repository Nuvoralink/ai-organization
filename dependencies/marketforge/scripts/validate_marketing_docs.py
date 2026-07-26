#!/usr/bin/env python3
"""
MarketForge documentation validator.

Runs validation checks against docs/marketing-plan/ for:
- Decision-card format (DEC-NNN IDs, required fields)
- Anti-slop banned phrases AND AI-cadence patterns
- Required sections ("What we are intentionally NOT doing", "Sources and basis")
- Evidence-grade presence on statistical claims
- Cross-cite validity (DEC-NNN referenced exists in same plan)
- Stage-mismatch (LP / ad / CTA awareness-stage consistency)
- Stale references (HARO, pre-iOS-14 attribution, pre-AIO SEO patterns, Google Optimize)
- Channel-allocation sum checks (no >50% concentration risk)
- Commercial-bias flag presence on D-grade citations

Usage:
  python validate_marketing_docs.py --root docs/marketing-plan [--mid-run | --final] [--strict]
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict

# Make stdout UTF-8 safe on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


# Banned phrases per anti-slop-marketing-rubric.md
BANNED_PHRASES = [
    r"\bleverage\b",
    r"\bbest-in-class\b",
    r"\bindustry-leading\b",
    r"\bgame-changing\b",
    r"\brevolutionary\b",
    r"\bunlock your potential\b",
    r"\bstreamline your workflow\b",
    r"\btake it to the next level\b",
    r"\bworld-class\b",
    r"\bempower\b",
    r"\btransformative\b",
    r"\bcutting-edge\b",
    r"\bnext-generation\b",
    r"\bseamless\b",
    r"^\s*Consider [a-z]",
    r"^\s*You could try",
    r"^\s*It might be worth",
    r"Best practice suggests",
    r"Conventional wisdom holds",
]

# AI cadence patterns (subtler than banned phrases — these signal AI-generated copy)
AI_CADENCE_PATTERNS = [
    # Three-word triplets in titles / headlines: "Bold. Beautiful. Built."
    (r"^([A-Z][a-z]+\. ){2}[A-Z][a-z]+\.\s*$", "Three-word-triplet AI cadence (e.g., 'Bold. Beautiful. Built.')"),
    # "Not just X — Y" pattern (em-dash structure)
    (r"\bNot just \w+(?: \w+){0,3}\s*[—–-]\s*\w", "'Not just X — Y' AI cadence pattern"),
    # "Where X meets Y" pattern (cliche)
    (r"\bWhere [A-Z]?\w+ meets [A-Z]?\w+\b", "'Where X meets Y' cliche pattern"),
    # "Beyond X, beyond Y" pattern
    (r"\bBeyond \w+,? beyond \w+", "'Beyond X, beyond Y' AI cadence"),
]

# Banned dead references
STALE_REFS = [
    (r"\bHARO\b", "HARO shuttered late 2024. Use Qwoted / Help a B2B Writer / Featured.com / SourceBottle."),
    (r"\bConnectively\b", "Connectively (HARO rebrand) shuttered late 2024."),
    (r"\bGoogle Optimize\b", "Google Optimize sunset 2023."),
]

# Statistical claim patterns (require evidence grade nearby)
STAT_PATTERNS = [
    r"\b\d+%\s+(?:conversion|click|reply|open|response|retention|CTR|growth|lift)",
    r"\b\d+x\s+(?:better|higher|lower|more|less|gap|cheaper|more efficient)",
    r"\$\d+(?:\.\d+)?\s+(?:CPM|CPC|CPA|CPI|per click|per acquisition)",
    r"\b\d+%\s+(?:ROAS|LTV|CAC)",
]

# Evidence grade indicators (within ±5 lines)
GRADE_INDICATORS = [
    r"evidence grade[\s:]+[ABCDE]\b",
    r"\(evidence [ABCDE]\)",
    r"Evidence:\s*[ABCDE]\b",
    r"evidence:\s+[ABCDE]\b",
]

# Required sections in subskill outputs
REQUIRED_SECTIONS = [
    "## What we are intentionally NOT doing",
    "## Sources and basis",
]

# DEC-ID pattern
DEC_PATTERN = re.compile(r"\bDEC-(\d{3})\b")

# Awareness stage declarations
STAGE_PATTERNS = {
    "unaware": "Unaware",
    "problem-aware": "Problem-aware",
    "solution-aware": "Solution-aware",
    "product-aware": "Product-aware",
    "most aware": "Most aware",
}

# CTA verb-by-stage (mismatch detection)
MOST_AWARE_CTAS = ["Buy now", "Start trial", "Subscribe", "Sign up", "Get started", "Start free trial"]
PROBLEM_AWARE_CTAS = ["Take the diagnostic", "Read the framework", "Subscribe", "Get the analysis"]

# Files that legitimately contain banned phrases / stale refs as lookup-table content
META_FILES_EXCLUDED = {
    "anti-slop-marketing-rubric.md",
    "commercial-bias-map.md",
    "ai-saturation-watch.md",
    "evidence-grading-rubric.md",
    "glossary.md",
    "MARKETING_GUIDE_V3.md",
    "plan-pressure-test-protocol.md",
    "implementation-review-protocol.md",
    "testing-strategy-protocol.md",
    "producer-reconciliation-matrix.md",
    "trust-harness-protocol.md",
}

# Audit-style docs run STRUCTURAL checks (DEC IDs, required sections, cross-cites)
# but skip CONTENT checks (banned phrases, AI cadence, stale refs, D-grade bias flag).
# By nature these docs REFERENCE banned phrases / stale tools / bias categories
# while documenting their handling — not committing them as marketing copy.
AUDIT_FILE_NAMES = {
    "decision-log.md",
    "bias-audit.md",
    "pressure-test-report.md",
    "marketing-quality-review.md",
    "self-test-report.md",
    "trust-report.md",
    "research-ledger.md",
    "rules-update-log.md",
    "validation-overrides.md",
    "cascade-log.md",
    "overrides-log.md",
}


def is_audit_file(file_path: Path) -> bool:
    """Audit-style files run structural checks but skip content checks."""
    # By name
    if file_path.name in AUDIT_FILE_NAMES:
        return True
    # By path: anything under /auditability/ directory
    parts = file_path.parts
    if "auditability" in parts:
        return True
    return False


def find_md_files(root: Path, exclude_skill_md: bool = False):
    """Find all markdown files under root, excluding self-referential meta-files.

    exclude_skill_md: if True, also skip SKILL.md files (skill instruction files
    inside skills/ folder, vs marketing-plan output files).
    """
    files = []
    for p in root.glob("**/*.md"):
        if p.name in META_FILES_EXCLUDED:
            continue
        if exclude_skill_md and p.name == "SKILL.md":
            continue
        files.append(p)
    return files


# =============================================================================
# META-block awareness (v1.2.1)
#
# Marketing planning docs legitimately reference banned phrases, AI-cadence
# patterns, stale tools, etc. — INSIDE meta-discussions like
# "## What we are intentionally NOT doing" sections or "**Banned:**" inline lists.
#
# The validator must distinguish "actual banned-phrase usage" from "documentation
# of which phrases are banned." Two mechanisms:
#
# 1. Section-level: heading like "## What we are intentionally NOT doing" or
#    "## Anti-patterns" enters a meta-section; any subsequent line is skipped
#    until the next top-level (#) or sibling-level (##) heading.
# 2. Line-level: lines starting with markers like "**Banned:**", "**Avoid:**",
#    "**Anti-pattern to avoid:**" are individually skipped.
# 3. Explicit marker: HTML comment "<!-- validator-skip-line -->" anywhere on
#    the line skips it.
# =============================================================================

META_SECTION_HEADINGS = [
    "what we are intentionally not doing",
    "what we are intentionally not saying",
    "what we are NOT doing",  # case-handled below
    "anti-patterns",
    "anti-pattern register",
    "banned phrases",
    "banned-phrase register",
    "stale references",
    "what not to do",
    "anti-pillar",
    "common false passes",
]

META_LINE_PREFIXES = (
    "**Banned:**",
    "**Banned (",
    "**Avoid:**",
    "**Avoid (",
    "**Not allowed:**",
    "**Not acceptable:**",
    "**Anti-pattern to avoid:**",
    "**Anti-pattern:**",
    "**Anti-pillar:**",
    "**Forbidden:**",
)

META_SKIP_MARKERS = (
    "<!-- validator-skip-line -->",
    "<!-- validator-skip -->",
)


def update_meta_section_state(line: str, in_meta_section: bool) -> bool:
    """Determine whether the next lines are inside a meta-section.

    A meta-section begins at a `## <META_HEADING>` line and continues until the
    next `## ` or `# ` heading.
    """
    stripped = line.lstrip()
    # Top-level heading exits any meta-section (new doc / major reset)
    if stripped.startswith("# ") and not stripped.startswith("## "):
        return False
    # `## ` heading: check if it's a meta-heading or a normal one
    if stripped.startswith("## "):
        heading = stripped[3:].strip().lower()
        for mh in META_SECTION_HEADINGS:
            if mh.lower() in heading:
                return True
        return False
    # `### ` or deeper headings don't change meta-section state
    return in_meta_section


def is_meta_line(line: str, in_meta_section: bool) -> bool:
    """Return True if the line should be skipped by content-checking oracles.

    Skips if:
    - Currently inside a meta-section.
    - Line starts with a meta-prefix (e.g., "**Banned:** ...").
    - Line contains an explicit skip marker.
    """
    if in_meta_section:
        return True
    # Explicit skip marker
    for marker in META_SKIP_MARKERS:
        if marker in line:
            return True
    # Strip leading whitespace + ONE markdown bullet marker (if any) — but
    # NOT `**` (which is inline emphasis, not a bullet)
    s = line.lstrip()
    if s.startswith("- ") or s.startswith("+ "):
        s = s[2:].lstrip()
    elif s.startswith("* ") and not s.startswith("**"):
        s = s[2:].lstrip()
    # Meta-prefix lines (banned/avoid declarations at start of effective content)
    for prefix in META_LINE_PREFIXES:
        if s.startswith(prefix):
            return True
    return False


def is_table_total_row(line: str) -> bool:
    """Detect markdown table rows that represent a TOTAL/SUBTOTAL/SUM.

    Such rows must be skipped by concentration-risk check because the 100%
    in a `| TOTAL paid | $X | 100% |` row is not a single-channel allocation.
    """
    if "|" not in line:
        return False
    # Case-insensitive scan for TOTAL / SUBTOTAL / SUM in the row
    lower = line.lower()
    total_markers = ["total", "subtotal", "sum:", "grand total", "all-in"]
    for marker in total_markers:
        if marker in lower:
            return True
    return False


def check_banned_phrases(content: str, file_path: Path) -> list:
    """Return list of findings. Skips meta-sections, meta-lines, and audit files (v1.2.1)."""
    if is_audit_file(file_path):
        return []
    findings = []
    in_meta = False
    for line_num, line in enumerate(content.splitlines(), 1):
        in_meta = update_meta_section_state(line, in_meta)
        if is_meta_line(line, in_meta):
            continue
        for pattern in BANNED_PHRASES:
            if re.search(pattern, line, re.IGNORECASE):
                findings.append((file_path, line_num, line.strip(), f"Banned phrase: {pattern}", "BLOCK"))
    return findings


def check_ai_cadence(content: str, file_path: Path) -> list:
    """Detect AI-cadence patterns. Skips meta-context + audit files (v1.2.1)."""
    if is_audit_file(file_path):
        return []
    findings = []
    in_meta = False
    for line_num, line in enumerate(content.splitlines(), 1):
        in_meta = update_meta_section_state(line, in_meta)
        if is_meta_line(line, in_meta):
            continue
        for pattern, msg in AI_CADENCE_PATTERNS:
            if re.search(pattern, line):
                findings.append((file_path, line_num, line.strip(), f"AI cadence: {msg}", "BLOCK"))
    return findings


def check_stale_refs(content: str, file_path: Path) -> list:
    """Return list of stale reference findings. Skips meta-context + audit files (v1.2.1)."""
    if is_audit_file(file_path):
        return []
    findings = []
    in_meta = False
    for line_num, line in enumerate(content.splitlines(), 1):
        in_meta = update_meta_section_state(line, in_meta)
        if is_meta_line(line, in_meta):
            continue
        for pattern, msg in STALE_REFS:
            if re.search(pattern, line):
                findings.append((file_path, line_num, line.strip(), f"Stale reference: {msg}", "BLOCK"))
    return findings


def check_required_sections(content: str, file_path: Path) -> list:
    """Check that subskill outputs have required sections."""
    findings = []
    rel_path = str(file_path)
    if "auditability" in rel_path or rel_path.endswith("/00-index.md") or rel_path.endswith("README.md"):
        return findings
    if "_marketforge-shared" in rel_path or "templates" in rel_path:
        return findings

    for section in REQUIRED_SECTIONS:
        if section not in content:
            findings.append((file_path, 0, "", f"Missing required section: {section}", "BLOCK"))
    return findings


def check_evidence_grades(content: str, file_path: Path) -> list:
    """For every stat claim, verify evidence grade present within ±5 lines."""
    findings = []
    lines = content.splitlines()
    for line_num, line in enumerate(lines, 1):
        for pattern in STAT_PATTERNS:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                start = max(0, line_num - 6)
                end = min(len(lines), line_num + 5)
                nearby = "\n".join(lines[start:end])
                has_grade = any(re.search(p, nearby, re.IGNORECASE) for p in GRADE_INDICATORS)
                if not has_grade:
                    findings.append((
                        file_path, line_num, line.strip(),
                        f"Statistical claim without evidence grade: '{match.group(0)}'",
                        "FIX-NEXT",
                    ))
    return findings


def check_dec_ids(content: str, file_path: Path) -> tuple:
    """Return (file_decs, findings) where file_decs is set of DEC-NNN IDs found."""
    findings = []
    decs = set()
    for match in DEC_PATTERN.finditer(content):
        decs.add(match.group(0))

    # Malformed DEC IDs (e.g., DEC-12, DEC-1234)
    for m in re.findall(r"\bDEC-\d{1,2}\b|\bDEC-\d{4,}\b", content):
        findings.append((
            file_path, 0, m,
            f"Malformed DEC ID: {m} (expected DEC-NNN with 3 digits)",
            "BLOCK",
        ))

    return decs, findings


def check_dec_collisions(all_decs: dict) -> list:
    """Detect DEC-NNN IDs that look like declarations in multiple files (collision).

    Heuristic: if a DEC-NNN appears as ### header in two files, it's a collision.
    Cross-cites in body prose are OK.
    """
    findings = []
    declarations = defaultdict(list)  # DEC -> [file paths where declared as ### header]

    for file_path, decs in all_decs.items():
        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for dec in decs:
            # A DEC declaration looks like "### [DEC-NNN] Title" or "### DEC-NNN: Title"
            decl_pattern = rf"^#{{1,4}} (?:\[)?{re.escape(dec)}\]?[\s:]"
            if re.search(decl_pattern, content, re.MULTILINE):
                declarations[dec].append(file_path)

    for dec, files in declarations.items():
        if len(files) > 1:
            findings.append((
                files[0], 0, "",
                f"DEC ID collision: {dec} declared in {len(files)} files: {[str(f) for f in files]}",
                "BLOCK",
            ))
    return findings


def check_cross_cite_validity(content: str, file_path: Path, declared_decs_global: set) -> list:
    """Verify every DEC-NNN referenced in body has a DECLARATION (### [DEC-NNN] header) somewhere.

    Distinguishes between DEC declarations (### [DEC-NNN] Title) and references in body prose.
    A reference is valid only if a matching declaration exists in some file.

    Audit files (decision-log etc.) are skipped — they aggregate references to all DECs
    by audit nature, and structural validity of those references is verified by the
    declaration scan elsewhere.
    """
    if is_audit_file(file_path):
        return []
    findings = []
    seen_in_this_file = set()
    for match in DEC_PATTERN.finditer(content):
        dec = match.group(0)
        if dec in seen_in_this_file:
            continue
        seen_in_this_file.add(dec)
        if dec not in declared_decs_global:
            offset = match.start()
            line_num = content[:offset].count("\n") + 1
            findings.append((
                file_path, line_num, dec,
                f"Cross-cite to {dec} but no declaration found in any file",
                "FIX-NEXT",
            ))
    return findings


def find_declared_decs(md_files: list) -> set:
    """Find DECs that are formally declared via ### [DEC-NNN] header.

    A formal declaration looks like:
      ### [DEC-NNN] Title
      ### DEC-NNN: Title
      #### [DEC-NNN] Title
    """
    declared = set()
    decl_pattern = re.compile(
        r"^#{1,4}\s+(?:\[)?(DEC-\d{3})(?:\])?[\s:]",
        re.MULTILINE,
    )
    for md in md_files:
        try:
            content = md.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for m in decl_pattern.finditer(content):
            declared.add(m.group(1))
    return declared


def check_stage_cta_match(content: str, file_path: Path) -> list:
    """If file declares Unaware/Problem-aware stage, CTAs should not be 'Buy now' / 'Start trial'."""
    findings = []
    lower = content.lower()
    declared_stage = None
    for key, label in STAGE_PATTERNS.items():
        if f"awareness stage:** {label}".lower() in lower or f"primary stage:** {label}".lower() in lower:
            declared_stage = key
            break

    if declared_stage in {"unaware", "problem-aware"}:
        for cta in MOST_AWARE_CTAS:
            if cta.lower() in lower:
                findings.append((
                    file_path, 0, cta,
                    f"Stage-CTA mismatch: stage is {declared_stage} but CTA includes Most-aware '{cta}'",
                    "FIX-NEXT",
                ))
    return findings


# =============================================================================
# Trust-harness multi-oracle validators (per trust-harness-protocol.md)
# =============================================================================

# Indicates a file declares an active marketing channel decision card
CHANNEL_DECISION_INDICATORS = [
    r"### \[?DEC-\d{3}\]?[^\n]*(?:channel|paid-|cold-email|seo|geo|linkedin|tiktok|youtube|reddit|podcast|newsletter|community)",
    r"\*\*Channel:\*\*",
]

KILL_CRITERION_PATTERNS = [
    r"\*\*Kill criterion:?\*\*",
    r"Kill criterion:",
]

REVERSAL_TRIGGER_PATTERNS = [
    r"\*\*Reversal trigger:?\*\*",
    r"Reversal trigger:",
]

TEST_WINDOW_PATTERNS = [
    r"\*\*Test window:?\*\*",
    r"Test window:",
]

# Channel-type → expected kill window range (per kill-criteria-by-channel.md)
COMPOUND_CHANNEL_INDICATORS = [
    "seo-strategy", "geo-llmo", "content-strategy", "community-led-growth",
    "podcast-strategy", "founder-content", "engineering-as-marketing",
    "linkedin-organic", "x-twitter-organic", "youtube-strategy",
]

PAID_CHANNEL_INDICATORS = [
    "paid-search", "paid-social", "paid-mobile", "cold-email",
]


def check_channel_kill_criteria(content: str, file_path: Path) -> list:
    """For files that declare channel decisions, verify kill criterion + reversal + test window are present."""
    findings = []

    # Check if this file is in a channel-decision-relevant subskill
    rel_path = str(file_path).lower().replace("\\", "/")
    is_channel_subskill = any(
        ind in rel_path for ind in COMPOUND_CHANNEL_INDICATORS + PAID_CHANNEL_INDICATORS
    )
    has_channel_decision = any(re.search(p, content, re.IGNORECASE) for p in CHANNEL_DECISION_INDICATORS)

    if not (is_channel_subskill or has_channel_decision):
        return findings  # Not a channel-decision file

    has_kill = any(re.search(p, content) for p in KILL_CRITERION_PATTERNS)
    has_reversal = any(re.search(p, content) for p in REVERSAL_TRIGGER_PATTERNS)
    has_window = any(re.search(p, content) for p in TEST_WINDOW_PATTERNS)

    if not has_kill:
        findings.append((file_path, 0, "", "Channel decision missing 'Kill criterion:'", "BLOCK"))
    if not has_reversal:
        findings.append((file_path, 0, "", "Channel decision missing 'Reversal trigger:'", "FIX-NEXT"))
    if not has_window:
        findings.append((file_path, 0, "", "Channel decision missing 'Test window:'", "FIX-NEXT"))

    return findings


def check_window_type_match(content: str, file_path: Path) -> list:
    """Compound channels (SEO, content, community) must NOT have paid-window kill criteria (30-60 days).

    Paid channels (search, social, mobile, cold-email) must NOT have compound-window kill criteria (6-12 months).
    """
    findings = []
    rel_path = str(file_path).lower().replace("\\", "/")

    is_compound = any(ind in rel_path for ind in COMPOUND_CHANNEL_INDICATORS)
    is_paid = any(ind in rel_path for ind in PAID_CHANNEL_INDICATORS)

    if not (is_compound or is_paid):
        return findings

    # Search for "Test window: X" patterns
    # NB: regex must match "30 day", "30 days", "30-day", "30 d" — use days?\b to handle "days"
    short_window_pattern = re.compile(
        r"(?:test\s+window|kill\s+window|window)[:\s]+[^\n]*?(\d+)[\s-]*(?:days?\b|d\b)",
        re.IGNORECASE,
    )
    long_window_pattern = re.compile(
        r"(?:test\s+window|kill\s+window|window)[:\s]+[^\n]*?(\d+)[\s-]*(?:months?|years?)",
        re.IGNORECASE,
    )

    for m in short_window_pattern.finditer(content):
        days = int(m.group(1))
        if is_compound and days <= 90:
            offset = m.start()
            line_num = content[:offset].count("\n") + 1
            findings.append((
                file_path, line_num, m.group(0),
                f"Window-type mismatch: compound channel has paid-window kill criterion ({days} days). "
                f"Compound channels need 6-12 months per kill-criteria-by-channel.md.",
                "BLOCK",
            ))

    for m in long_window_pattern.finditer(content):
        months_or_years = int(m.group(1))
        # Crude heuristic: if "year" in matched, ignore (>1 year long window for paid is unlikely)
        # If "month" and >= 6, that's a compound-window
        if "month" in m.group(0).lower() and months_or_years >= 6:
            if is_paid:
                offset = m.start()
                line_num = content[:offset].count("\n") + 1
                findings.append((
                    file_path, line_num, m.group(0),
                    f"Window-type mismatch: paid channel has compound-window kill criterion ({months_or_years} months). "
                    f"Paid channels need 14-60 days per kill-criteria-by-channel.md.",
                    "BLOCK",
                ))

    return findings


def check_concentration_risk(content: str, file_path: Path) -> list:
    """In portfolio-construction.md or budget-allocation.md, no single channel should exceed 50% allocation."""
    findings = []
    rel_path = str(file_path).lower().replace("\\", "/")

    # Only check portfolio + budget allocation files
    if not (
        "portfolio-construction" in rel_path
        or "budget-allocation" in rel_path
        or "channel-strategy" in rel_path
    ):
        return findings

    # Pre-compute meta-section state per line
    lines = content.splitlines()
    meta_state_per_line = []
    in_meta = False
    for line in lines:
        in_meta = update_meta_section_state(line, in_meta)
        meta_state_per_line.append(in_meta)

    # Look for percentage allocations in tables / inline.
    # Only flag patterns that look like ACTIVE allocations, not thresholds / hypotheticals.
    pct_pattern = re.compile(r"\b(\d{1,3})\s*%", re.IGNORECASE)
    for m in pct_pattern.finditer(content):
        pct = int(m.group(1))
        if pct <= 50:
            continue
        offset = m.start()
        line_num = content[:offset].count("\n") + 1
        line_start = content.rfind("\n", 0, offset) + 1
        line_end = content.find("\n", offset)
        line = content[line_start:line_end if line_end > -1 else None]
        line_lower = line.lower()

        # Skip if line is in a meta-section or is a meta-line
        in_meta_now = meta_state_per_line[line_num - 1] if line_num - 1 < len(meta_state_per_line) else False
        if is_meta_line(line, in_meta_now):
            continue

        # Skip TOTAL / SUBTOTAL / SUM rows (v1.2.1)
        if is_table_total_row(line):
            continue

        # Skip threshold tables, ranges, hypotheticals, benchmarks
        skip_indicators = [
            "if ", "when ", "exceed", "threshold", "above ", ">=", " ≥ ", " > ",
            "red zone", "yellow zone", "green zone",
            "revenue", "benchmark", "industry",
            "single channel", "range of", "approximately",
            "ios", "android",
        ]
        if any(ind in line_lower for ind in skip_indicators):
            continue
        if re.search(r"\d+\s*[-–]\s*\d+\s*%", line):
            continue

        # Only flag if line looks like an allocation
        allocation_indicators = ["allocation", "allocated", "budget", "spend", "share", "split"]
        is_allocation = any(ind in line_lower for ind in allocation_indicators)
        is_table_row = "|" in line and "%" in line

        if not (is_allocation or is_table_row):
            continue

        findings.append((
            file_path, line_num, line.strip()[:120],
            f"Concentration risk: single allocation {pct}% exceeds 50% threshold. "
            f"Requires explicit override per portfolio-construction.md.",
            "FIX-NEXT",
        ))

    return findings


def check_stage_presence(content: str, file_path: Path) -> list:
    """For copy-producing subskill outputs (website-copy, landing-pages, ad-creative, emails),
    every page/asset must declare its target awareness stage.
    """
    findings = []
    rel_path = str(file_path).lower().replace("\\", "/")

    # Only check files that should declare stages
    stage_required_paths = [
        "website-copy", "landing-pages", "ad-creative-brief",
        "email-lifecycle", "paid-search", "paid-social",
    ]
    if not any(p in rel_path for p in stage_required_paths):
        return findings

    # SKILL.md files inside skills/ are instruction files, not output
    if rel_path.endswith("/skill.md") and "/skills/" in rel_path:
        return findings

    # Detect any awareness-stage declaration
    has_stage = any(
        f"awareness stage" in content.lower() or "primary stage:" in content.lower()
        for _ in [None]  # single check
    )
    has_stage = (
        "awareness stage" in content.lower() or "primary stage:" in content.lower()
    )

    if not has_stage:
        findings.append((
            file_path, 0, "",
            "Copy-producing output missing awareness-stage declaration. "
            "Every page/ad/email must declare target Schwartz 5-stage per awareness-stages.md.",
            "FIX-NEXT",
        ))

    return findings


def check_bias_flag_on_d_grade(content: str, file_path: Path) -> list:
    """Any D-grade citation must have commercial-bias flag within ±5 lines.

    Skips meta-sections + meta-lines + audit files that DISCUSS D-grade handling
    rather than making a D-grade claim (v1.2.1).
    """
    if is_audit_file(file_path):
        return []
    findings = []
    lines = content.splitlines()

    d_grade_patterns = [
        r"evidence\s+grade[\s:]+D\b",
        r"\(evidence\s+D\)",
        r"Evidence:\s*D\b",
        r"D-grade",
    ]
    bias_patterns = [
        r"commercial[\s-]?bias\s+flag",
        r"Commercial-bias flag:",
        r"commercial\s+bias",
        r"vendor[\s-]?adjacenc",
        r"vendor[\s-]?promoted",
        r"bias\s+flag",
    ]

    # Pre-compute meta-section state for each line (single forward scan)
    meta_state_per_line = []
    in_meta = False
    for line in lines:
        in_meta = update_meta_section_state(line, in_meta)
        meta_state_per_line.append(in_meta)

    for line_num, line in enumerate(lines, 1):
        in_meta_now = meta_state_per_line[line_num - 1]
        if is_meta_line(line, in_meta_now):
            continue
        for pat in d_grade_patterns:
            if re.search(pat, line, re.IGNORECASE):
                start = max(0, line_num - 6)
                end = min(len(lines), line_num + 5)
                nearby = "\n".join(lines[start:end])
                has_bias_flag = any(re.search(bp, nearby, re.IGNORECASE) for bp in bias_patterns)
                if not has_bias_flag:
                    findings.append((
                        file_path, line_num, line.strip(),
                        "D-grade citation without commercial-bias flag nearby. "
                        "Per evidence-grading-rubric.md, D-grade requires bias flag + triangulation.",
                        "FIX-NEXT",
                    ))
                break  # one finding per line

    return findings


def check_supersession_stale_refs(content: str, file_path: Path, all_decs_global: set, superseded_decs: set) -> list:
    """If a DEC is marked Superseded, any consumer file still citing it (without "previously" context) is stale.

    Audit files (decision-log, founder-input-log, pressure-test-report, bias-audit, anything under /auditability/)
    BY NATURE list superseded DECs in supersession tables, before/after pairs, and historical notes.
    Skip them per v1.2.1 audit-file leniency pattern.
    """
    findings = []
    if is_audit_file(file_path):
        return findings
    if not superseded_decs:
        return findings

    for match in DEC_PATTERN.finditer(content):
        dec = match.group(0)
        if dec in superseded_decs:
            offset = match.start()
            line_num = content[:offset].count("\n") + 1
            line_start = content.rfind("\n", 0, offset) + 1
            line_end = content.find("\n", offset)
            line = content[line_start:line_end if line_end > -1 else None]
            # Skip if line indicates historical reference ("superseded by", "previously", "old", "deprecated")
            if any(word in line.lower() for word in [
                "superseded", "previously", "former", "old", "deprecated", "supersedes",
            ]):
                continue
            findings.append((
                file_path, line_num, line.strip()[:120],
                f"Stale reference to superseded {dec}. Consumer should reference the new DEC "
                f"or explicitly mark as historical.",
                "FIX-NEXT",
            ))
    return findings


def find_superseded_decs(all_decs_per_file: dict) -> set:
    """Scan files for DEC cards marked Status: Superseded.

    Block-aware: only matches Status: Superseded INSIDE the same DEC card block
    (between `### [DEC-NNN]` and the next `### ` / `## ` / `# ` heading).
    Previous regex was non-greedy DOTALL across blocks which caused false
    "superseded" detection for ACTIVE DECs followed later in the file by
    supersession notes referencing them.
    """
    superseded = set()

    block_split_pattern = re.compile(r"(?=^#{1,4}\s+\[?DEC-\d{3})", re.MULTILINE)
    dec_header_pattern = re.compile(r"^#{1,4}\s+\[?(DEC-\d{3})", re.MULTILINE)
    status_superseded_pattern = re.compile(
        r"(?:Status:\s*Superseded|\*\*Status:\*\*\s*Superseded)", re.IGNORECASE
    )

    for file_path in all_decs_per_file:
        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        # Split into per-DEC blocks (each block starts with a DEC heading)
        blocks = block_split_pattern.split(content)
        for block in blocks:
            m = dec_header_pattern.match(block)
            if not m:
                continue
            dec = m.group(1)
            # Only the block CONTENT (after the heading, before next ### / ## / #) counts.
            # Truncate block at next heading of any level
            next_heading_match = re.search(r"^#{1,6}\s+", block[len(m.group(0)):], re.MULTILINE)
            if next_heading_match:
                block_body = block[: len(m.group(0)) + next_heading_match.start()]
            else:
                block_body = block
            if status_superseded_pattern.search(block_body):
                superseded.add(dec)

    return superseded


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path, help="Root of marketing plan docs")
    parser.add_argument("--mid-run", action="store_true", help="Mid-run validation (subset)")
    parser.add_argument("--final", action="store_true", help="Final validation (full)")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero on any BLOCK finding")
    parser.add_argument("--include-skill-md", action="store_true",
                        help="Include SKILL.md files in scan (default: exclude — these are instruction files)")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    if not args.root.exists():
        print(f"ERROR: Root does not exist: {args.root}", file=sys.stderr)
        sys.exit(2)

    md_files = find_md_files(args.root, exclude_skill_md=not args.include_skill_md)
    all_findings = []
    all_decs_per_file = {}
    all_decs_global = set()

    for md in md_files:
        try:
            content = md.read_text(encoding="utf-8")
        except Exception as e:
            print(f"WARNING: Could not read {md}: {e}", file=sys.stderr)
            continue

        all_findings.extend(check_banned_phrases(content, md))
        all_findings.extend(check_ai_cadence(content, md))
        all_findings.extend(check_stale_refs(content, md))

        if args.final:
            all_findings.extend(check_required_sections(content, md))
            all_findings.extend(check_evidence_grades(content, md))
            all_findings.extend(check_stage_cta_match(content, md))
            # Trust-harness oracles (per trust-harness-protocol.md)
            all_findings.extend(check_channel_kill_criteria(content, md))
            all_findings.extend(check_window_type_match(content, md))
            all_findings.extend(check_concentration_risk(content, md))
            all_findings.extend(check_stage_presence(content, md))
            all_findings.extend(check_bias_flag_on_d_grade(content, md))

        decs, dec_findings = check_dec_ids(content, md)
        all_findings.extend(dec_findings)
        if decs:
            all_decs_per_file[md] = decs
            all_decs_global.update(decs)

    # DEC collisions + supersession checks (final only)
    if args.final:
        all_findings.extend(check_dec_collisions(all_decs_per_file))
        # Find DECs that are formally declared (### [DEC-NNN]) — not just referenced.
        # This is the authoritative set for cross-cite validity.
        declared_decs_global = find_declared_decs(md_files)
        # Find superseded DECs across all files
        superseded_decs = find_superseded_decs(all_decs_per_file)
        # Cross-cite validity + supersession stale references
        for md in md_files:
            try:
                content = md.read_text(encoding="utf-8")
                all_findings.extend(check_cross_cite_validity(content, md, declared_decs_global))
                all_findings.extend(
                    check_supersession_stale_refs(content, md, all_decs_global, superseded_decs)
                )
            except Exception:
                continue

    # Count by severity
    block_count = sum(1 for f in all_findings if f[4] == "BLOCK")
    fix_count = sum(1 for f in all_findings if f[4] == "FIX-NEXT")

    print(f"Files scanned: {len(md_files)}")
    print(f"Total findings: {len(all_findings)} (BLOCK: {block_count}, FIX-NEXT: {fix_count})")
    print()

    if all_findings:
        # Sort: BLOCK first
        all_findings.sort(key=lambda f: (0 if f[4] == "BLOCK" else 1, str(f[0]), f[1]))
        cap = 100 if args.verbose else 50
        for file_path, line, snippet, msg, sev in all_findings[:cap]:
            print(f"  [{sev}] {file_path}:{line}: {msg}")
            if snippet:
                print(f"    > {snippet[:120]}")
        if len(all_findings) > cap:
            print(f"  ... and {len(all_findings) - cap} more.")

    # Exit codes:
    # - strict + any BLOCK: 1
    # - strict + no BLOCK but FIX-NEXT: 0
    # - non-strict: 0
    if args.strict and block_count > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
