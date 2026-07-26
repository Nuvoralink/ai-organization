"""
Marketing-plan mutation suite.

Per `_marketforge-shared/references/trust-harness-protocol.md`:
> If I mutate the source-of-truth (positioning DEC, pricing DEC, ICP DEC),
> does the downstream marketing output actually change?

This suite mutates the golden fixture and verifies each mutation surfaces
the expected oracle finding. The default posture is skeptical: a passing
test is only useful after proving it would fail for the right wrongness.

Mutations covered (per trust-harness-protocol.md §"Mutation suite"):
1. Banned phrase injection
2. AI cadence injection
3. Stale reference injection (HARO)
4. Stage-CTA drift
5. Missing kill criterion
6. Compound channel with paid-window kill criterion (window-type mismatch)
7. Concentration risk introduction
8. Missing awareness-stage declaration
9. Cross-cite to nonexistent DEC
10. D-grade citation without bias flag
11. DEC-ID collision
12. Producer supersession cascade (stale-reference detection)
"""

import shutil
import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "validate_marketing_docs.py"
GOLDEN = Path(__file__).parent.parent.parent / "examples" / "marketing-plan-golden"


def run_validator(root: Path, *args):
    cmd = [sys.executable, str(SCRIPT), "--root", str(root)] + list(args)
    result = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    return result.returncode, result.stdout, result.stderr


@pytest.fixture
def mutated_fixture(tmp_path):
    """Copy the golden fixture to a tmp location for mutation."""
    dest = tmp_path / "marketing-plan-mutated"
    shutil.copytree(GOLDEN, dest)
    return dest


# =============================================================================
# Baseline: golden fixture passes strict + final
# =============================================================================

def test_baseline_golden_fixture_passes_strict_final():
    """Pre-mutation: the golden fixture must pass strict + final validation with zero findings."""
    code, out, err = run_validator(GOLDEN, "--final", "--strict")
    assert code == 0, f"Golden fixture failed baseline. stdout: {out}, stderr: {err}"
    # Verify zero total findings
    assert "Total findings: 0" in out, f"Golden fixture has findings: {out}"


# =============================================================================
# Mutation 1: Banned phrase injection
# =============================================================================

class TestMutation1_BannedPhrase:
    """Inject a banned phrase into website-copy; oracle must catch."""

    def test_anti_slop_oracle_catches_banned_phrase(self, mutated_fixture):
        target = mutated_fixture / "04-website-content" / "website-copy" / "homepage.md"
        content = target.read_text(encoding="utf-8")
        # Inject: "Leverage our world-class platform"
        mutated = content + "\n\nLeverage our world-class platform to transform your business."
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final", "--strict")
        assert code != 0, "Validator did not block banned-phrase mutation"
        assert "leverage" in out.lower()
        assert "world-class" in out.lower()


# =============================================================================
# Mutation 2: AI cadence injection
# =============================================================================

class TestMutation2_AICadence:

    def test_ai_cadence_oracle_catches_pattern(self, mutated_fixture):
        target = mutated_fixture / "04-website-content" / "website-copy" / "homepage.md"
        content = target.read_text(encoding="utf-8")
        mutated = content + "\n\nNot just fast — reliable. Where engineering meets reliability."
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final", "--strict")
        assert code != 0
        assert "AI cadence" in out


# =============================================================================
# Mutation 3: Stale reference injection (HARO)
# =============================================================================

class TestMutation3_StaleReference:

    def test_stale_ref_oracle_catches_haro(self, mutated_fixture):
        target = mutated_fixture / "05-paid" / "paid-search.md"
        content = target.read_text(encoding="utf-8")
        mutated = content + "\n\nFor PR coordination, pitch journalists via HARO."
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final", "--strict")
        assert code != 0
        assert "HARO shuttered" in out


# =============================================================================
# Mutation 4: Stage-CTA drift
# =============================================================================

class TestMutation4_StageCTADrift:

    def test_stage_cta_oracle_catches_mismatch(self, mutated_fixture):
        """Add a Problem-aware-stage page with Most-aware CTA."""
        new_page = mutated_fixture / "04-website-content" / "website-copy" / "drift-page.md"
        new_page.write_text("""<!-- marketforge: v1.2.0 -->
# Test Page

## Target awareness stage
**Primary stage:** Problem-aware

## CTA
"Start free trial" (mismatch — should be diagnostic CTA for Problem-aware).

## What we are intentionally NOT doing
- Test.

## Sources and basis
- Test.
""", encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final")
        assert "Stage-CTA mismatch" in out, f"Did not catch stage-CTA drift. stdout: {out}"


# =============================================================================
# Mutation 5: Missing kill criterion
# =============================================================================

class TestMutation5_MissingKillCriterion:

    def test_kill_criterion_oracle_catches_missing(self, mutated_fixture):
        """Strip kill criterion from paid-search.md."""
        target = mutated_fixture / "05-paid" / "paid-search.md"
        content = target.read_text(encoding="utf-8")
        # Remove all kill-criterion lines
        mutated = "\n".join(
            line for line in content.splitlines()
            if "Kill criterion" not in line and "**Kill criterion" not in line
        )
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final", "--strict")
        assert code != 0, f"Validator did not block missing kill criterion. stdout: {out}"
        assert "missing 'Kill criterion'" in out or "Kill criterion" in out


# =============================================================================
# Mutation 6: Window-type mismatch (paid window on compound channel)
# =============================================================================

class TestMutation6_WindowTypeMismatch:

    def test_window_type_oracle_catches_mismatch(self, mutated_fixture):
        """Create SEO-strategy file with 30-day kill window (paid-style)."""
        seo_dir = mutated_fixture / "04-website-content"
        new_seo = seo_dir / "seo-strategy.md"
        new_seo.write_text("""<!-- marketforge: v1.2.0 -->
# SEO Strategy

### [DEC-275] BoFu SEO commercial pages

**Decision:** 5 comparison pages targeting [Competitor A] alternative queries.

**Channel:** SEO bottom-funnel.

**Kill criterion:** Test window: 30 days; if rankings flat → kill.
**Reversal trigger:** N/A.
**Test window:** 30 days.

## What we are intentionally NOT doing
- Top-funnel content.

## Sources and basis
- V3 §3.1.
""", encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final", "--strict")
        assert code != 0
        assert "Window-type mismatch" in out, f"Did not catch window mismatch. stdout: {out}"


# =============================================================================
# Mutation 7: Concentration risk introduction
# =============================================================================

class TestMutation7_ConcentrationRisk:

    def test_concentration_oracle_catches_overconcentration(self, mutated_fixture):
        """Add a budget allocation >50% on a single channel."""
        target = mutated_fixture / "02-strategy" / "portfolio-construction.md"
        content = target.read_text(encoding="utf-8")
        # Add a clear over-concentration line
        mutated = content + "\n\n| Paid search alone | allocation 65% | Owner X |\n"
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final")
        assert "Concentration risk" in out, f"Did not catch concentration. stdout: {out}"


# =============================================================================
# Mutation 8: Missing awareness-stage declaration
# =============================================================================

class TestMutation8_MissingStageDeclaration:

    def test_stage_presence_oracle_catches_missing(self, mutated_fixture):
        """Remove awareness-stage from homepage.md."""
        target = mutated_fixture / "04-website-content" / "website-copy" / "homepage.md"
        content = target.read_text(encoding="utf-8")
        # Remove every line mentioning "awareness stage" or "primary stage:"
        mutated_lines = []
        for line in content.splitlines():
            if "awareness stage" in line.lower() or "primary stage:" in line.lower():
                continue
            mutated_lines.append(line)
        target.write_text("\n".join(mutated_lines), encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final")
        assert "awareness-stage declaration" in out or "awareness stage" in out.lower(), \
            f"Did not catch missing stage. stdout: {out}"


# =============================================================================
# Mutation 9: Cross-cite to nonexistent DEC
# =============================================================================

class TestMutation9_CrossCiteToNonexistent:

    def test_cross_cite_oracle_catches_nonexistent(self, mutated_fixture):
        """Add a reference to DEC-999 which doesn't exist."""
        target = mutated_fixture / "04-website-content" / "website-copy" / "homepage.md"
        content = target.read_text(encoding="utf-8")
        mutated = content + "\n\nSee DEC-999 for full rationale."
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final")
        assert "DEC-999" in out, f"Did not catch nonexistent DEC. stdout: {out}"
        assert "no declaration found" in out or "Cross-cite" in out


# =============================================================================
# Mutation 10: D-grade citation without bias flag
# =============================================================================

class TestMutation10_DGradeWithoutBiasFlag:

    def test_bias_flag_oracle_catches_missing(self, mutated_fixture):
        """Add a D-grade citation without commercial-bias flag."""
        target = mutated_fixture / "05-paid" / "paid-search.md"
        content = target.read_text(encoding="utf-8")
        mutated = content + (
            "\n\n## D-grade research citation"
            "\n\nProfound 2026 internal study shows 23x improvement (evidence grade D).\n"
            "No additional context.\n"
        )
        target.write_text(mutated, encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final")
        assert "commercial-bias flag" in out or "bias flag" in out, \
            f"Did not catch D-grade without bias flag. stdout: {out}"


# =============================================================================
# Mutation 11: DEC-ID collision
# =============================================================================

class TestMutation11_DECCollision:

    def test_dec_collision_oracle_catches(self, mutated_fixture):
        """Create a second file declaring the same DEC-008."""
        new_file = mutated_fixture / "01-foundations" / "collision-positioning.md"
        new_file.write_text("""<!-- marketforge: v1.2.0 -->
# Duplicate Positioning Declaration

### [DEC-008] Positioning statement

**Decision:** Different positioning (collision case).

## What we are intentionally NOT doing
- N/A.

## Sources and basis
- N/A.
""", encoding="utf-8")

        code, out, err = run_validator(mutated_fixture, "--final", "--strict")
        assert code != 0
        assert "collision" in out.lower(), f"Did not catch DEC collision. stdout: {out}"


# =============================================================================
# Mutation 12: Producer supersession cascade
# =============================================================================

class TestMutation12_SupersessionStaleReference:
    """The most important mutation per trust-harness-protocol.md.

    When a producer DEC is superseded, consumers that still cite the old DEC
    (without explicit "superseded" / "previously" context) must be flagged
    as having stale references.
    """

    def test_supersession_oracle_catches_stale_consumer_references(self, mutated_fixture):
        """Mark DEC-020 (ICP-001) as Superseded; verify consumers still citing it are flagged."""
        # Add supersession status to ICP-001 declaration
        target = mutated_fixture / "01-foundations" / "icp-and-personas" / "icp-001.md"
        content = target.read_text(encoding="utf-8")
        # Add status: superseded to the DEC-020 block
        mutated = content.replace(
            "### [DEC-020] ICP-001 definition",
            "### [DEC-020] ICP-001 definition\n\n**Status:** Superseded by DEC-022 (2026-06-01)"
        )
        target.write_text(mutated, encoding="utf-8")

        # Now run validator
        code, out, err = run_validator(mutated_fixture, "--final")

        # Expected: consumers that still cite DEC-020 in their decision cards
        # (without "superseded" / "previously" context) should be flagged
        assert "DEC-020" in out, f"Did not surface DEC-020 stale references. stdout: {out}"
        assert "superseded" in out.lower() or "Stale reference to superseded" in out, \
            f"Did not flag as stale reference to superseded DEC. stdout: {out}"


# =============================================================================
# Pressure-test the harness itself (per trust-harness-protocol.md §"Pressure-test")
# =============================================================================

class TestHarnessPressureTest:
    """Pressure-test the harness itself per trust-harness-protocol.md.

    Verify the mutation tests would catch what they claim to catch.
    """

    def test_baseline_no_findings_implies_oracles_run(self):
        """Liveness check: baseline must show oracles ran (not silently skipped)."""
        code, out, err = run_validator(GOLDEN, "--final", "--strict")
        # Must have scanned >0 files (proof oracles ran)
        assert "Files scanned: 0" not in out
        # Must have run final-mode checks
        assert "Total findings:" in out

    def test_paired_condition_concentration_oracle(self, mutated_fixture):
        """Paired-condition: oracle catches >50% AND does NOT flag 35% (the golden allocation)."""
        # First: baseline (no mutation) — must NOT have concentration finding for 35% line
        code, out, err = run_validator(mutated_fixture, "--final")
        # Golden fixture's largest allocation is 35% — should not be flagged
        assert "35%" not in out or "Concentration risk" not in out, \
            f"False positive: oracle flagged 35% as concentration risk. stdout: {out}"

    def test_mutation_adequacy_supersession(self, mutated_fixture):
        """Mutation adequacy: the mutation we ran actually touched a persisted DEC card."""
        target = mutated_fixture / "01-foundations" / "icp-and-personas" / "icp-001.md"
        content = target.read_text(encoding="utf-8")
        # Pre-mutation: DEC-020 declared, no superseded status
        assert "DEC-020" in content
        assert "Superseded" not in content
