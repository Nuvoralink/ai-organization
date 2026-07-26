"""
Integration tests: validator running against full mock marketing-plan structures.

Per testing-strategy-protocol.md:
- Canonical good fixture should produce zero BLOCK findings.
- Canonical slop fixture should produce multiple BLOCK findings.
"""

import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "validate_marketing_docs.py"


def run_validator(root: Path, *args):
    cmd = [sys.executable, str(SCRIPT), "--root", str(root)] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout, result.stderr


# =============================================================================
# Canonical good fixture
# =============================================================================

class TestCanonicalGoodFixture:
    """A complete marketing-plan fixture that should pass validation."""

    def _build_good_plan(self, root: Path) -> Path:
        """Build a minimal but complete marketing-plan structure."""
        plan = root / "marketing-plan"
        plan.mkdir()

        # Foundation
        (plan / "01-foundations").mkdir()
        (plan / "01-foundations" / "marketing-brief.md").write_text("""\
<!-- marketforge: v1.0.0 -->
# Marketing Brief

## Product
- Name: TestProduct
- Stage: Early post-PMF
- Business model: B2B SaaS PLG

### [DEC-001] Business model classification

**Decision:** B2B SaaS PLG with $79/seat pricing.

**Confidence:** High
**Evidence grade:** A

## What we are intentionally NOT doing in this brief

- Defining ICP without dedicated subskill.

## Sources and basis

V3 Marketing Guide §12.1.
""", encoding="utf-8")

        # Auditability
        (plan / "auditability").mkdir()
        (plan / "auditability" / "decision-log.md").write_text("""\
# Decision Log

DEC-001 logged.
""", encoding="utf-8")

        return plan

    def test_good_plan_passes_validator_non_strict(self, tmp_path):
        plan = self._build_good_plan(tmp_path)
        code, out, err = run_validator(plan)
        assert code == 0

    def test_good_plan_passes_validator_strict(self, tmp_path):
        plan = self._build_good_plan(tmp_path)
        code, out, err = run_validator(plan, "--strict")
        assert code == 0, f"Clean fixture failed --strict validation. stdout: {out}, stderr: {err}"

    def test_good_plan_passes_final_strict(self, tmp_path):
        plan = self._build_good_plan(tmp_path)
        code, out, err = run_validator(plan, "--final", "--strict")
        # Final mode adds required-section + evidence-grade checks
        # Our fixture has those, so should still pass
        assert code == 0


# =============================================================================
# Canonical slop fixture
# =============================================================================

class TestCanonicalSlopFixture:
    """A marketing-plan with multiple violations the validator must catch."""

    def _build_slop_plan(self, root: Path) -> Path:
        plan = root / "marketing-plan"
        plan.mkdir()
        (plan / "01-foundations").mkdir()
        (plan / "01-foundations" / "marketing-brief.md").write_text("""\
# Marketing Brief

We leverage our world-class, best-in-class platform to unlock your potential.
Take it to the next level with our revolutionary, game-changing solution.

Pitch journalists via HARO.

Set up A/B tests in Google Optimize.

See DEC-12 for details.

Consider doing X.
""", encoding="utf-8")
        return plan

    def test_slop_plan_fails_strict(self, tmp_path):
        plan = self._build_slop_plan(tmp_path)
        code, out, err = run_validator(plan, "--strict")
        assert code != 0, "Validator did not block slop content"

    def test_slop_plan_surfaces_multiple_findings(self, tmp_path):
        plan = self._build_slop_plan(tmp_path)
        code, out, err = run_validator(plan)
        # Should catch: leverage, world-class, best-in-class, unlock your potential,
        # take it to the next level, revolutionary, game-changing,
        # HARO, Google Optimize, DEC-12 (malformed), Consider doing X (hedge)
        # Count BLOCK findings
        block_count = out.count("[BLOCK]")
        assert block_count >= 8, \
            f"Expected at least 8 BLOCK findings, got {block_count}. stdout: {out}"
