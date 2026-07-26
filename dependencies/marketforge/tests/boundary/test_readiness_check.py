"""
Boundary-value tests for readiness_check.py.

Per testing-strategy-protocol.md:
The readiness check has 4 outcome bands:
- 7/7 → PROCEED
- 5-6/7 → PROCEED CAPPED
- 3-4/7 → BLOCK
- 0-2/7 → HARD BLOCK

Boundary tests at every threshold: 0, 2, 3, 4, 5, 6, 7.
Mutation-design: each test would fail if the implementation shifted the threshold.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "readiness_check.py"


def make_input(pass_count: int) -> dict:
    """Build a readiness input with exactly N gates passing."""
    gate_names = [
        "customer_interviews", "retention_curve", "icp_articulable",
        "unit_economics", "paying_revenue", "capacity", "conversion_path",
    ]
    gates = {}
    for i, name in enumerate(gate_names):
        gates[name] = {"pass": i < pass_count, "data": "test"}
    return {"business_model": "Test", "gates": gates}


def run_check(input_file: Path):
    cmd = [sys.executable, str(SCRIPT), "--input", str(input_file)]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout, result.stderr


# =============================================================================
# Boundary-value tests at every threshold
# =============================================================================

@pytest.mark.parametrize("pass_count,expected_keyword", [
    # 7/7 → PROCEED (no caps)
    (7, "PROCEED"),
    # 5-6/7 → PROCEED CAPPED
    (6, "CAPPED"),
    (5, "CAPPED"),
    # 3-4/7 → BLOCK (paid scaling)
    (4, "BLOCK PAID"),
    (3, "BLOCK PAID"),
    # 0-2/7 → HARD BLOCK
    (2, "HARD BLOCK"),
    (1, "HARD BLOCK"),
    (0, "HARD BLOCK"),
])
def test_boundary(tmp_path, pass_count, expected_keyword):
    """Each readiness band must produce the expected recommendation."""
    f = tmp_path / "readiness.json"
    f.write_text(json.dumps(make_input(pass_count)), encoding="utf-8")
    code, out, err = run_check(f)
    assert code == 0, f"Script failed: {err}"
    result = json.loads(out)
    assert expected_keyword in result["recommendation"], \
        f"At {pass_count}/7, expected '{expected_keyword}' in '{result['recommendation']}'"
    assert result["score"] == f"{pass_count}/7"


# =============================================================================
# Failing-gates list correctness
# =============================================================================

def test_failing_gates_list_correct(tmp_path):
    """When only 5 gates pass, the failing 2 should be listed."""
    data = make_input(5)
    # Override to make specific gates fail
    data["gates"]["capacity"]["pass"] = False
    data["gates"]["conversion_path"]["pass"] = False
    # Make sure others pass
    for i, name in enumerate([
        "customer_interviews", "retention_curve", "icp_articulable",
        "unit_economics", "paying_revenue",
    ]):
        data["gates"][name]["pass"] = True

    f = tmp_path / "readiness.json"
    f.write_text(json.dumps(data), encoding="utf-8")
    code, out, err = run_check(f)
    result = json.loads(out)
    assert "capacity" in result["failing_gates"]
    assert "conversion_path" in result["failing_gates"]
    assert "customer_interviews" not in result["failing_gates"]


# =============================================================================
# Mutation-design: each band transition is independently tested
# =============================================================================

class TestBandTransitions:
    """If implementation shifts a threshold (e.g., 5→6), these tests must catch it."""

    def test_5_to_6_transition(self, tmp_path):
        """5/7 → CAPPED, 6/7 → CAPPED. Mutation: shifting 5→4 would break this."""
        for n in [5, 6]:
            f = tmp_path / f"r{n}.json"
            f.write_text(json.dumps(make_input(n)), encoding="utf-8")
            code, out, err = run_check(f)
            assert "CAPPED" in json.loads(out)["recommendation"]

    def test_3_to_4_transition(self, tmp_path):
        """3/7 and 4/7 both → BLOCK PAID."""
        for n in [3, 4]:
            f = tmp_path / f"r{n}.json"
            f.write_text(json.dumps(make_input(n)), encoding="utf-8")
            code, out, err = run_check(f)
            assert "BLOCK" in json.loads(out)["recommendation"]

    def test_4_to_5_is_band_boundary(self, tmp_path):
        """The critical transition: 4/7 BLOCKS, 5/7 PROCEEDS (capped)."""
        f4 = tmp_path / "r4.json"
        f4.write_text(json.dumps(make_input(4)), encoding="utf-8")
        f5 = tmp_path / "r5.json"
        f5.write_text(json.dumps(make_input(5)), encoding="utf-8")

        code4, out4, _ = run_check(f4)
        code5, out5, _ = run_check(f5)

        assert "BLOCK" in json.loads(out4)["recommendation"]
        assert "PROCEED" in json.loads(out5)["recommendation"]
        # And they're not the same recommendation
        assert json.loads(out4)["recommendation"] != json.loads(out5)["recommendation"]

    def test_2_to_3_is_band_boundary(self, tmp_path):
        """2/7 HARD BLOCK; 3/7 BLOCK PAID (not hard). They differ."""
        f2 = tmp_path / "r2.json"
        f2.write_text(json.dumps(make_input(2)), encoding="utf-8")
        f3 = tmp_path / "r3.json"
        f3.write_text(json.dumps(make_input(3)), encoding="utf-8")

        code2, out2, _ = run_check(f2)
        code3, out3, _ = run_check(f3)

        r2 = json.loads(out2)["recommendation"]
        r3 = json.loads(out3)["recommendation"]
        assert "HARD" in r2
        assert "HARD" not in r3
        assert r2 != r3
