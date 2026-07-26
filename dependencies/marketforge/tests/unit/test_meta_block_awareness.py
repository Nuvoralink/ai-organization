"""
Unit tests for v1.2.1 META-block awareness + TOTAL-row skip.

Per `_marketforge-shared/references/testing-strategy-protocol.md`:
- Paired-condition: every "X is detected outside meta" paired with "X is NOT detected inside meta."
- Mutation tests: if META-skip logic is removed, these tests must fail.
- Boundary tests: section-boundary detection (entering / exiting meta-sections).
"""

import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "validate_marketing_docs.py"


def run_validator(root: Path, *args):
    cmd = [sys.executable, str(SCRIPT), "--root", str(root)] + list(args)
    result = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    return result.returncode, result.stdout, result.stderr


# =============================================================================
# META-section heading skip
# =============================================================================

class TestMetaSectionSkip:
    """Lines inside `## What we are intentionally NOT doing` (and similar)
    sections must not trigger banned-phrase / AI-cadence / stale-ref oracles.
    """

    def test_banned_phrase_inside_meta_section_skipped(self, tmp_path):
        """A `## What we are intentionally NOT doing` section can document
        banned phrases without triggering the oracle.
        """
        f = tmp_path / "plan.md"
        f.write_text(
            "# My Plan\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Using leverage to streamline workflows.\n"
            "- Calling ourselves best-in-class.\n"
            "- Promising transformative results.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out, \
            f"Validator flagged banned phrase in meta-section. stdout: {out}"

    def test_banned_phrase_outside_meta_section_still_caught(self, tmp_path):
        """Paired condition: same banned phrase OUTSIDE meta-section IS caught."""
        f = tmp_path / "plan.md"
        f.write_text(
            "# My Plan\n\n"
            "## Strategy\n\n"
            "We will leverage our best-in-class platform.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" in out, \
            f"Validator failed to catch banned phrase outside meta. stdout: {out}"

    def test_anti_patterns_section_skips_banned_phrase(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "## Anti-patterns\n\n"
            "- Don't use words like 'revolutionary' or 'transformative'.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out

    def test_exit_meta_section_resumes_checking(self, tmp_path):
        """After a meta-section ends, the next `## ` heading exits meta and
        subsequent banned-phrase usage IS caught.
        """
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Use leverage in copy.\n\n"
            "## Strategy\n\n"
            "We leverage our position.\n",  # this SHOULD trigger
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" in out, \
            f"Validator should catch banned phrase after exiting meta. stdout: {out}"

    def test_top_level_heading_exits_meta(self, tmp_path):
        """A `# ` top-level heading after a meta-section exits meta."""
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan One\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Avoid leverage.\n\n"
            "# Plan Two\n\n"
            "We leverage our position.\n",  # SHOULD trigger
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" in out


# =============================================================================
# META-line prefix skip
# =============================================================================

class TestMetaLinePrefix:
    """Lines starting with `**Banned:**`, `**Avoid:**`, `**Anti-pattern to avoid:**`,
    etc. are skipped from banned-phrase / AI-cadence checks.
    """

    def test_banned_prefix_in_bullet_skipped(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "Some copy guidance:\n\n"
            "- **Banned:** leverage, best-in-class, transformative\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out, \
            f"`**Banned:**` line should be skipped. stdout: {out}"

    def test_anti_pattern_to_avoid_line_skipped(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "**Anti-pattern to avoid:** Saying our platform is world-class or revolutionary.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out

    def test_avoid_prefix_skipped(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "**Avoid:** leverage, cutting-edge, next-generation, seamless\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out

    def test_meta_line_paired_no_false_positive_on_clean_line(self, tmp_path):
        """Paired: a clean line that doesn't start with a meta-prefix and has
        no banned phrase produces no finding.
        """
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "Our value: cut close from 8 days to 3.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out


# =============================================================================
# Explicit skip marker
# =============================================================================

class TestExplicitSkipMarker:
    def test_validator_skip_line_marker_works(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "We leverage the situation <!-- validator-skip-line -->\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out, \
            f"<!-- validator-skip-line --> should skip the line. stdout: {out}"

    def test_validator_skip_marker_works(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "We leverage the situation <!-- validator-skip -->\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Banned phrase" not in out


# =============================================================================
# AI cadence + stale-ref also respect meta-context
# =============================================================================

class TestMetaSkipExtendsToOtherOracles:
    def test_ai_cadence_in_meta_section_skipped(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Three-word triplet headlines like 'Bold. Beautiful. Built.'\n"
            "- Not just X — Y patterns.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "AI cadence" not in out, \
            f"AI cadence patterns in meta-section should be skipped. stdout: {out}"

    def test_haro_in_meta_section_skipped(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Using HARO (it shuttered late 2024).\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "Stale reference" not in out, \
            f"HARO in meta-section should be skipped. stdout: {out}"

    def test_paired_ai_cadence_outside_meta_caught(self, tmp_path):
        f = tmp_path / "plan.md"
        f.write_text(
            "# Plan\n\n"
            "## Headlines\n\n"
            "Bold. Beautiful. Built.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path)
        assert "AI cadence" in out


# =============================================================================
# TOTAL-row skip in concentration-risk oracle
# =============================================================================

class TestTotalRowSkip:
    """Markdown table rows containing TOTAL / SUBTOTAL / SUM are not single-channel
    allocations and must be skipped by the concentration-risk oracle.
    """

    def test_total_row_with_100_percent_not_flagged(self, tmp_path):
        plan = tmp_path / "marketing-plan"
        plan.mkdir()
        (plan / "02-strategy").mkdir()
        f = plan / "02-strategy" / "budget-allocation.md"
        f.write_text(
            "# Budget Allocation\n\n"
            "## Allocation table\n\n"
            "| Line | $ | % of paid |\n"
            "|---|---|---|\n"
            "| Paid search | $200 | 40% |\n"
            "| Tools | $100 | 20% |\n"
            "| Founder content | $200 | 40% |\n"
            "| **TOTAL paid** | $500 | 100% |\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(plan, "--final")
        assert "Concentration risk" not in out, \
            f"TOTAL row should not trigger concentration risk. stdout: {out}"

    def test_subtotal_row_skipped(self, tmp_path):
        plan = tmp_path / "marketing-plan"
        plan.mkdir()
        (plan / "02-strategy").mkdir()
        f = plan / "02-strategy" / "budget-allocation.md"
        f.write_text(
            "# Budget\n\n"
            "| Channel | Spend |\n"
            "|---|---|\n"
            "| Paid search | 30% |\n"
            "| **Subtotal paid** | 60% |\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(plan, "--final")
        assert "Concentration risk" not in out

    def test_paired_actual_concentration_still_caught(self, tmp_path):
        """Paired condition: a non-TOTAL row with >50% allocation IS caught."""
        plan = tmp_path / "marketing-plan"
        plan.mkdir()
        (plan / "02-strategy").mkdir()
        f = plan / "02-strategy" / "portfolio-construction.md"
        f.write_text(
            "# Portfolio\n\n"
            "| Channel | Spend |\n"
            "|---|---|\n"
            "| Paid search alone | allocation 65% |\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(plan, "--final")
        assert "Concentration risk" in out, \
            f"Real 65% concentration should be flagged. stdout: {out}"


# =============================================================================
# Mutation tests — if META-skip helpers are removed, these MUST fail
# =============================================================================

class TestMetaSkipMutationProof:
    """If a future change removes the meta-skip helpers, these tests will fail
    because they expect meta-context skipping to work.

    This proves the test suite catches accidental regressions of the skip behavior.
    """

    def test_full_meta_workflow(self, tmp_path):
        """A doc with: clean copy + meta-section listing banned + clean copy.
        Validator should pass without findings.
        """
        f = tmp_path / "plan.md"
        f.write_text(
            "# Marketing Plan\n\n"
            "Our hero: cut close from 8 days to 3.\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Using leverage, best-in-class, world-class, transformative.\n"
            "- AI cadence patterns like three-word triplets or 'Not just X — Y'.\n"
            "- Stale references like HARO.\n\n"
            "## Sources and basis\n\n"
            "Real customer interviews.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path, "--strict")
        assert code == 0, f"Clean doc with proper meta should pass strict. stdout: {out}"


# =============================================================================
# Audit-file leniency for supersession stale refs (v1.2.1)
# =============================================================================

class TestAuditFileSupersessionLeniency:
    """Audit files (decision-log, founder-input-log, pressure-test-report,
    bias-audit, or any file under /auditability/) BY NATURE list superseded
    DECs in supersession tables, before/after pairs, and historical notes.

    The check_supersession_stale_refs oracle must skip audit files —
    they are the canonical place to RECORD supersession, not stale references.
    """

    def _build_plan(self, root):
        (root / "auditability").mkdir(parents=True)
        (root / "01-foundations").mkdir()
        # Declare DEC-001 (Superseded by DEC-002)
        (root / "01-foundations" / "brief.md").write_text(
            "<!-- marketforge: v1.2.1 run-id=test scope=focused generated=2026-05-20 -->\n\n"
            "# Brief\n\n"
            "### [DEC-001] Old thing\n\n"
            "**Decision:** Old.\n"
            "**Status:** Superseded by DEC-002 (2026-05-20).\n\n"
            "### [DEC-002] New thing\n\n"
            "**Decision:** New.\n\n"
            "## What we are intentionally NOT doing\n\n"
            "- Nothing.\n\n"
            "## Sources and basis\n\n"
            "- Test.\n",
            encoding="utf-8",
        )

    def test_decision_log_can_list_superseded_decs_without_flag(self, tmp_path):
        self._build_plan(tmp_path)
        (tmp_path / "auditability" / "decision-log.md").write_text(
            "# Decision Log\n\n"
            "| DEC-001 | Old | brief.md | 2026-05-20 | High | A | superseded |\n\n"
            "## Sources\n\n- Test.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path, "--strict", "--final")
        assert "DEC-001" not in out or "Stale reference" not in out, (
            f"Audit file decision-log.md should not flag superseded DEC refs. stdout: {out}"
        )

    def test_consumer_file_still_flagged_for_stale_refs(self, tmp_path):
        """Paired condition: non-audit files MUST still be flagged."""
        self._build_plan(tmp_path)
        (tmp_path / "02-strategy").mkdir()
        (tmp_path / "02-strategy" / "channel.md").write_text(
            "<!-- marketforge: v1.2.1 run-id=test scope=focused generated=2026-05-20 -->\n\n"
            "# Channel\n\n"
            "**Cross-cites consumed:** DEC-001 (stage assessment).\n\n"
            "## What we are intentionally NOT doing\n\n- Nothing.\n\n"
            "## Sources and basis\n\n- Test.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path, "--strict", "--final")
        assert "Stale reference to superseded DEC-001" in out, (
            f"Consumer file should still be flagged for stale superseded ref. stdout: {out}"
        )

    def test_founder_input_log_lenient(self, tmp_path):
        self._build_plan(tmp_path)
        (tmp_path / "auditability" / "founder-input-log.md").write_text(
            "# Founder Input Log\n\n"
            "Input #1 superseded DEC-001 — see decision-log for details.\n"
            "Original DEC-001 framing is now replaced.\n\n"
            "## Sources\n\n- Test.\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path, "--strict", "--final")
        # Check there's no Stale-reference-to-DEC-001 finding for this file
        assert "founder-input-log.md" not in out or "Stale reference" not in out, (
            f"founder-input-log.md (under /auditability/) should not flag stale refs. stdout: {out}"
        )
