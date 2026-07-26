"""
Unit + boundary tests for channel_scorer.py.

Per testing-strategy-protocol.md:
- Boundary-value tests at every classification threshold (12/18/25/30).
- Property-based tests on score-sum invariant.
- Mutation-design: test that catches each classification band.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).parent.parent.parent / "scripts" / "channel_scorer.py"


def make_channel(name: str, scores: list) -> dict:
    """Build a channel dict with the 7 factors."""
    factor_names = [
        "buyer_channel_match", "economics", "skill_fit",
        "time_to_result", "compounding", "competitive_density",
        "channel_product_fit",
    ]
    return dict(name=name, **dict(zip(factor_names, scores)))


def run_scorer(input_file: Path):
    cmd = [sys.executable, str(SCRIPT), "--input", str(input_file)]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return result.returncode, result.stdout, result.stderr


# =============================================================================
# Boundary-value tests for classification thresholds
# Per channel-scoring-matrix.md:
#   30-35 → Primary heavily
#   25-29 → Primary
#   18-24 → Supporting
#   12-17 → Deprioritize
#   <12   → Skip
# =============================================================================

class TestClassificationBoundaries:

    @pytest.mark.parametrize("score,expected_label", [
        # 30-35 → Primary heavily
        (35, "heavily"),
        (30, "heavily"),
        # 25-29 → Primary
        (29, "invest"),
        (25, "invest"),
        # 18-24 → Supporting
        (24, "Supporting"),
        (18, "Supporting"),
        # 12-17 → Deprioritize
        (17, "Deprioritize"),
        (12, "Deprioritize"),
        # <12 → Skip
        (11, "Skip"),
        (7, "Skip"),
    ])
    def test_classification_at_boundaries(self, tmp_path, score, expected_label):
        """Verify each band boundary is correctly classified."""
        # Distribute the score across 7 factors
        per_factor = score // 7
        remainder = score - (per_factor * 7)
        scores = [per_factor] * 7
        # Add remainder to first factor (cap at 5)
        for i in range(remainder):
            if scores[i] < 5:
                scores[i] += 1
        # Verify sum matches
        actual_sum = sum(scores)
        if actual_sum != score:
            # Adjust: too high or low; rebalance
            diff = score - actual_sum
            scores[0] = max(0, min(5, scores[0] + diff))

        input_data = {
            "business_model": "test",
            "budget_tier": "T2",
            "channels": [make_channel("Test", scores)],
        }
        f = tmp_path / "input.json"
        f.write_text(json.dumps(input_data), encoding="utf-8")
        code, out, err = run_scorer(f)
        assert code == 0
        result = json.loads(out)
        actual_classification = result["scored_channels"][0]["_classification"]
        actual_score = result["scored_channels"][0]["_score"]
        assert expected_label.lower() in actual_classification.lower(), \
            f"Score {actual_score}: expected '{expected_label}' in '{actual_classification}'"

    def test_score_is_sum_of_factors(self, tmp_path):
        """Property: total score = sum of 7 factors."""
        input_data = {
            "business_model": "test",
            "budget_tier": "T2",
            "channels": [make_channel("Test", [3, 4, 5, 2, 1, 3, 4])],  # sum=22
        }
        f = tmp_path / "input.json"
        f.write_text(json.dumps(input_data), encoding="utf-8")
        code, out, err = run_scorer(f)
        result = json.loads(out)
        assert result["scored_channels"][0]["_score"] == 22


# =============================================================================
# Property-based tests
# =============================================================================

class TestProperties:

    def test_score_always_in_valid_range(self, tmp_path):
        """For any valid 1-5 factor inputs, score is 7-35."""
        for s1 in [1, 5]:
            for s2 in [1, 5]:
                input_data = {
                    "business_model": "test",
                    "budget_tier": "T1",
                    "channels": [make_channel("C", [s1, s2, 3, 3, 3, 3, 3])],
                }
                f = tmp_path / "in.json"
                f.write_text(json.dumps(input_data), encoding="utf-8")
                code, out, err = run_scorer(f)
                result = json.loads(out)
                score = result["scored_channels"][0]["_score"]
                assert 7 <= score <= 35, f"Score {score} out of valid range"

    def test_sorted_descending_by_score(self, tmp_path):
        """Output channels are sorted by score, highest first."""
        input_data = {
            "business_model": "test",
            "budget_tier": "T2",
            "channels": [
                make_channel("Low", [1, 1, 1, 1, 1, 1, 1]),
                make_channel("High", [5, 5, 5, 5, 5, 5, 5]),
                make_channel("Mid", [3, 3, 3, 3, 3, 3, 3]),
            ],
        }
        f = tmp_path / "in.json"
        f.write_text(json.dumps(input_data), encoding="utf-8")
        code, out, err = run_scorer(f)
        result = json.loads(out)
        scores = [c["_score"] for c in result["scored_channels"]]
        assert scores == sorted(scores, reverse=True)


# =============================================================================
# Portfolio recommendation tests
# =============================================================================

class TestPortfolioRecommendation:

    def test_compound_pick_has_compounding_4_or_5(self, tmp_path):
        """Compound leg pick should have compounding >= 4."""
        input_data = {
            "business_model": "test",
            "budget_tier": "T2",
            "channels": [
                # High score but compounding=1 (linear)
                make_channel("Paid search", [5, 5, 5, 5, 1, 5, 5]),
                # Medium-high score with high compounding
                make_channel("Founder content", [4, 4, 4, 2, 5, 4, 5]),
            ],
        }
        f = tmp_path / "in.json"
        f.write_text(json.dumps(input_data), encoding="utf-8")
        code, out, err = run_scorer(f)
        result = json.loads(out)
        compound = result["recommended_portfolio"]["compound"]
        if compound:
            assert compound[0]["compounding"] >= 4, \
                f"Compound leg has compounding {compound[0]['compounding']}, expected >=4"
            assert compound[0]["name"] == "Founder content"

    def test_harvest_pick_has_low_compounding(self, tmp_path):
        """Harvest leg should be channels with compounding <= 3."""
        input_data = {
            "business_model": "test",
            "budget_tier": "T2",
            "channels": [
                make_channel("Paid search", [5, 5, 4, 5, 1, 4, 5]),
                make_channel("Cold email", [4, 4, 4, 4, 1, 4, 4]),
            ],
        }
        f = tmp_path / "in.json"
        f.write_text(json.dumps(input_data), encoding="utf-8")
        code, out, err = run_scorer(f)
        result = json.loads(out)
        harvest = result["recommended_portfolio"]["harvest"]
        for h in harvest:
            assert h["compounding"] <= 3, \
                f"Harvest channel '{h['name']}' has compounding {h['compounding']}, expected <=3"
