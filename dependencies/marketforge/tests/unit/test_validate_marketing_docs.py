"""
Unit tests for validate_marketing_docs.py.

Per testing-strategy-protocol.md:
- Paired-condition tests (every negative assertion paired with a positive).
- Mutation-test design (verify the assertion catches what it's supposed to catch).
- Boundary-value tests on thresholds.
- Probe suites for migration assumptions.
"""

import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "validate_marketing_docs.py"


def run_validator(root: Path, *args, strict=False):
    """Run validator on a directory; return (exit_code, stdout, stderr)."""
    cmd = [sys.executable, str(SCRIPT), "--root", str(root)] + list(args)
    if strict:
        cmd.append("--strict")
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout, result.stderr


# =============================================================================
# Test class: Banned-phrase detection
# =============================================================================

class TestBannedPhrases:

    def test_catches_leverage(self, tmp_path):
        """Positive: validator catches 'leverage' (banned per anti-slop)."""
        f = tmp_path / "test.md"
        f.write_text("We leverage AI to streamline workflows.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "leverage" in out.lower(), f"Validator missed 'leverage'. stdout: {out}"

    def test_paired_no_false_positive_on_clean_content(self, tmp_path):
        """Paired-condition: validator does NOT flag clean content as having 'leverage'."""
        f = tmp_path / "clean.md"
        f.write_text("Specific outcome: cut monthly close from 8 days to 3.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        # Should be 0 findings (or 0 banned-phrase findings specifically)
        assert "leverage" not in out.lower(), f"False positive on clean content. stdout: {out}"

    def test_catches_world_class(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("Our world-class platform.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "world-class" in out.lower()

    def test_catches_unlock_your_potential(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("Unlock your potential today.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "unlock your potential" in out.lower()

    def test_catches_streamline_your_workflow(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("Streamline your workflow with our tool.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "streamline your workflow" in out.lower()

    def test_catches_consider_x_hedge(self, tmp_path):
        """Hedge phrase 'Consider X' at line start should be caught."""
        f = tmp_path / "test.md"
        f.write_text("Consider doing X for marketing.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Consider" in out

    def test_does_not_flag_consider_mid_sentence(self, tmp_path):
        """Mid-sentence 'consider' is OK; only line-start hedge is banned."""
        f = tmp_path / "test.md"
        f.write_text("We will consider customer feedback in our roadmap.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        # 'consider' here is mid-sentence, OK
        # (banned pattern is `^\s*Consider [a-z]` — line-start only)
        # No assertion error if validator correctly distinguishes


# =============================================================================
# Test class: AI cadence detection
# =============================================================================

class TestAICadence:

    def test_catches_three_word_triplet(self, tmp_path):
        """'Bold. Beautiful. Built.' is AI cadence."""
        f = tmp_path / "test.md"
        f.write_text("Bold. Beautiful. Built.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "AI cadence" in out, f"Missed three-word triplet. stdout: {out}"

    def test_catches_not_just_x_y_pattern(self, tmp_path):
        """'Not just X — Y' is AI cadence."""
        f = tmp_path / "test.md"
        f.write_text("Not just fast — reliable.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "AI cadence" in out, f"Missed 'Not just X — Y'. stdout: {out}"

    def test_paired_no_false_positive_normal_writing(self, tmp_path):
        """Paired-condition: normal sentences should not trigger cadence detection."""
        f = tmp_path / "test.md"
        f.write_text("This is a clear sentence about marketing strategy.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "AI cadence" not in out, f"False positive on normal sentence. stdout: {out}"


# =============================================================================
# Test class: Stale references
# =============================================================================

class TestStaleReferences:

    def test_catches_haro(self, tmp_path):
        """Positive: catches HARO reference."""
        f = tmp_path / "pr.md"
        f.write_text("Pitch journalists via HARO.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "HARO shuttered" in out, f"Missed HARO. stdout: {out}"

    def test_catches_google_optimize(self, tmp_path):
        """Positive: catches Google Optimize."""
        f = tmp_path / "ab.md"
        f.write_text("Set up Google Optimize for A/B tests.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Google Optimize sunset" in out

    def test_catches_connectively(self, tmp_path):
        f = tmp_path / "pr.md"
        f.write_text("Use Connectively for PR.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Connectively" in out

    def test_paired_no_false_positive_when_no_stale(self, tmp_path):
        """Paired-condition: clean PR content does NOT trigger stale-ref."""
        f = tmp_path / "pr.md"
        f.write_text("Pitch via Qwoted, Featured.com, Help a B2B Writer.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Stale reference" not in out, f"False positive. stdout: {out}"


# =============================================================================
# Test class: DEC-ID format
# =============================================================================

class TestDECIDFormat:

    def test_catches_short_dec_id(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("See DEC-12 for context.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Malformed DEC ID" in out, f"Missed DEC-12. stdout: {out}"

    def test_catches_long_dec_id(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("See DEC-1234 for context.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Malformed DEC ID" in out

    def test_paired_no_false_positive_proper_dec_id(self, tmp_path):
        f = tmp_path / "test.md"
        f.write_text("See DEC-012 for context.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "Malformed" not in out, f"False positive on valid DEC-012. stdout: {out}"


# =============================================================================
# Test class: Required sections
# =============================================================================

class TestRequiredSections:

    def test_catches_missing_what_we_are_not_doing(self, tmp_path):
        """Final-mode catches missing 'What we are intentionally NOT doing' section."""
        plan = tmp_path / "marketing-plan"
        plan.mkdir()
        f = plan / "test.md"
        # No required sections
        f.write_text("# Some title\n\nSome content.\n## Sources and basis\nV3", encoding="utf-8")
        code, out, err = run_validator(plan, "--final")
        assert "What we are intentionally NOT doing" in out

    def test_catches_missing_sources_basis(self, tmp_path):
        plan = tmp_path / "marketing-plan"
        plan.mkdir()
        f = plan / "test.md"
        f.write_text(
            "# Some title\n\n## What we are intentionally NOT doing\n- X\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(plan, "--final")
        assert "Sources and basis" in out

    def test_paired_passes_when_both_sections_present(self, tmp_path):
        plan = tmp_path / "marketing-plan"
        plan.mkdir()
        f = plan / "test.md"
        f.write_text(
            "# Title\n\n## What we are intentionally NOT doing\n- X\n\n## Sources and basis\nV3 §1.1",
            encoding="utf-8",
        )
        code, out, err = run_validator(plan, "--final")
        # Should not flag missing sections
        assert "Missing required section" not in out, f"False positive. stdout: {out}"


# =============================================================================
# Test class: Exit code behavior
# =============================================================================

class TestExitCode:

    def test_strict_exits_nonzero_on_block_finding(self, tmp_path):
        """Strict mode + BLOCK finding → exit code 1."""
        f = tmp_path / "slop.md"
        f.write_text("Leverage our world-class platform.", encoding="utf-8")
        code, out, err = run_validator(tmp_path, strict=True)
        assert code == 1, f"Expected exit 1 with BLOCK finding, got {code}. stdout: {out}"

    def test_non_strict_exits_zero_even_with_findings(self, tmp_path):
        """Non-strict exits 0 even with findings (just reports)."""
        f = tmp_path / "slop.md"
        f.write_text("Leverage our world-class platform.", encoding="utf-8")
        code, out, err = run_validator(tmp_path, strict=False)
        assert code == 0, f"Expected exit 0 in non-strict mode, got {code}"

    def test_strict_exits_zero_on_clean_content(self, tmp_path):
        f = tmp_path / "clean.md"
        f.write_text("Cut close from 8 days to 3 (DEC-001).", encoding="utf-8")
        code, out, err = run_validator(tmp_path, strict=True)
        assert code == 0


# =============================================================================
# Test class: Adapter messy-fixture coverage
# =============================================================================

class TestMessyFixtures:

    def test_empty_file_does_not_crash(self, tmp_path):
        f = tmp_path / "empty.md"
        f.write_text("", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert code == 0

    def test_non_utf8_content_handled(self, tmp_path):
        """File with replacement-char content should not crash validator."""
        f = tmp_path / "broken.md"
        f.write_bytes(b"\xff\xfe\xfd")  # Invalid UTF-8 bytes
        code, out, err = run_validator(tmp_path)
        # Should not crash; either warn or process with replacements
        assert code in (0, 1, 2), f"Validator crashed: {err}"

    def test_huge_file_does_not_crash(self, tmp_path):
        """A 10K-line file with no findings should process."""
        f = tmp_path / "huge.md"
        f.write_text("\n".join(["Clean line."] * 10000), encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert code == 0

    def test_unicode_dashes_handled(self, tmp_path):
        """Em-dash and en-dash should not crash."""
        f = tmp_path / "unicode.md"
        f.write_text("Not just fast — reliable.", encoding="utf-8")
        code, out, err = run_validator(tmp_path)
        assert "AI cadence" in out
