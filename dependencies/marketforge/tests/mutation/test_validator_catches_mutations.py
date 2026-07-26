"""
Mutation tests for validate_marketing_docs.py.

Per testing-strategy-protocol.md:
> After tests pass, deliberately break the implementation in a small, targeted way
> and confirm at least one test fails. If no test fails, the test is vacuous.

These tests verify the validator catches what it's supposed to catch.
For each detection category, we feed the validator a deliberately-bad input
and confirm it surfaces the issue.

If a mutation produces a green suite, the test is vacuous and must be tightened.
"""

import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "validate_marketing_docs.py"


def run_validator(root: Path, *args):
    cmd = [sys.executable, str(SCRIPT), "--root", str(root)] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout, result.stderr


# =============================================================================
# Mutation: each banned phrase must be caught
# =============================================================================

class TestMutationsPerBannedPhrase:
    """For each banned phrase, verify validator catches it.

    If the validator's BANNED_PHRASES list is mutated (e.g., a phrase removed),
    the corresponding test will fail.
    """

    BANNED_TEST_CASES = [
        ("leverage", "We leverage X."),
        ("best-in-class", "Best-in-class platform."),
        ("industry-leading", "Industry-leading results."),
        ("game-changing", "A game-changing approach."),
        ("revolutionary", "Our revolutionary platform."),
        ("unlock your potential", "Unlock your potential today."),
        ("streamline your workflow", "Streamline your workflow."),
        ("take it to the next level", "Take it to the next level."),
        ("world-class", "World-class service."),
        ("transformative", "Transformative growth."),
        ("cutting-edge", "Cutting-edge tech."),
        ("next-generation", "Next-generation product."),
        ("seamless", "A seamless experience."),
    ]

    def test_each_banned_phrase_caught(self, tmp_path):
        """For each banned phrase, validator must surface it."""
        for keyword, content in self.BANNED_TEST_CASES:
            f = tmp_path / f"test_{keyword.replace(' ', '_').replace('-', '_')}.md"
            f.write_text(content, encoding="utf-8")
            code, out, err = run_validator(tmp_path)
            assert keyword.lower() in out.lower(), \
                f"Mutation gap: validator did not catch banned phrase '{keyword}'. stdout: {out}"
            f.unlink()


# =============================================================================
# Mutation: each stale reference must be caught
# =============================================================================

class TestMutationsPerStaleRef:

    STALE_TEST_CASES = [
        ("HARO", "Pitch via HARO."),
        ("Connectively", "Use Connectively."),
        ("Google Optimize", "Set up Google Optimize."),
    ]

    def test_each_stale_ref_caught(self, tmp_path):
        for keyword, content in self.STALE_TEST_CASES:
            f = tmp_path / f"test_{keyword.replace(' ', '_')}.md"
            f.write_text(content, encoding="utf-8")
            code, out, err = run_validator(tmp_path)
            assert "Stale reference" in out, \
                f"Mutation gap: validator did not catch stale ref '{keyword}'. stdout: {out}"
            f.unlink()


# =============================================================================
# Mutation: strict mode must respect BLOCK severity
# =============================================================================

class TestStrictModeMutation:

    def test_strict_blocks_on_banned_phrase(self, tmp_path):
        f = tmp_path / "slop.md"
        f.write_text("Leverage our platform.", encoding="utf-8")
        code, out, err = run_validator(tmp_path, "--strict")
        assert code != 0, \
            "Mutation gap: --strict did not exit non-zero on BLOCK finding."

    def test_strict_blocks_on_stale_ref(self, tmp_path):
        f = tmp_path / "pr.md"
        f.write_text("Pitch via HARO.", encoding="utf-8")
        code, out, err = run_validator(tmp_path, "--strict")
        assert code != 0


# =============================================================================
# Paired-condition: validator does NOT block on clean content
# =============================================================================

class TestPairedConditions:

    def test_strict_passes_clean_content(self, tmp_path):
        f = tmp_path / "clean.md"
        f.write_text(
            "Cut your weekly reporting from 4 hours to 15 minutes.\n"
            "(DEC-005, evidence grade: B)\n",
            encoding="utf-8",
        )
        code, out, err = run_validator(tmp_path, "--strict")
        assert code == 0, f"False positive: validator blocked clean content. stdout: {out}, stderr: {err}"

    def test_strict_passes_paired_with_no_findings(self, tmp_path):
        """Mutation test: if we lower the strictness threshold (e.g., flag all 'a' as banned),
        this test would fail because content contains 'a' frequently.
        """
        f = tmp_path / "clean.md"
        f.write_text("A specific, verifiable, sourced claim.\nGrade: A.", encoding="utf-8")
        code, out, err = run_validator(tmp_path, "--strict")
        assert code == 0, f"Mutation gap: validator flagged clean content. stdout: {out}"
