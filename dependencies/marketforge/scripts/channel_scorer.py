#!/usr/bin/env python3
"""
MarketForge channel-scoring helper.

Scores marketing channels against the 7-factor matrix per channel-scoring-matrix.md.

Usage:
  python channel_scorer.py --input channels.json [--output scores.json]

Input format (channels.json):
{
  "business_model": "B2B SaaS PLG",
  "budget_tier": "T2",
  "channels": [
    {
      "name": "Bottom-funnel SEO",
      "buyer_channel_match": 5,
      "economics": 5,
      "skill_fit": 4,
      "time_to_result": 2,
      "compounding": 5,
      "competitive_density": 4,
      "channel_product_fit": 5
    },
    ...
  ]
}

Output: scored + sorted + recommended portfolio.
"""

import argparse
import json
import sys
from pathlib import Path


def score_channel(channel: dict) -> int:
    """Sum 7 factors. Each 1-5; total max 35."""
    factors = [
        "buyer_channel_match",
        "economics",
        "skill_fit",
        "time_to_result",
        "compounding",
        "competitive_density",
        "channel_product_fit",
    ]
    return sum(channel.get(f, 0) for f in factors)


def classify(score: int) -> str:
    """Score → classification per channel-scoring-matrix.md."""
    if score >= 30:
        return "Primary — invest heavily"
    elif score >= 25:
        return "Primary — invest"
    elif score >= 18:
        return "Supporting — modest invest, monitor"
    elif score >= 12:
        return "Deprioritize — only if asymmetric"
    else:
        return "Skip"


def recommend_portfolio(scored: list) -> dict:
    """Pick 1 compound + 1-2 harvest + 1 wildcard from scored channels.

    Heuristics:
    - Compound = highest score among channels with compounding ≥ 4.
    - Harvest = highest scoring channels with compounding ≤ 3.
    - Wildcard = honest pick by user; here we suggest one with score 18-24 + asymmetric thesis.
    """
    compound_candidates = [c for c in scored if c.get("compounding", 0) >= 4]
    harvest_candidates = [c for c in scored if c.get("compounding", 0) <= 3]

    compound = sorted(compound_candidates, key=lambda c: c["_score"], reverse=True)[:1]
    harvest = sorted(harvest_candidates, key=lambda c: c["_score"], reverse=True)[:2]
    # Wildcard candidates: 18-24 score range
    wildcard_candidates = [c for c in scored if 18 <= c["_score"] <= 24]
    wildcard = sorted(wildcard_candidates, key=lambda c: c["_score"], reverse=True)[:1]

    return {
        "compound": compound,
        "harvest": harvest,
        "wildcard": wildcard,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path, help="Input JSON")
    parser.add_argument("--output", type=Path, help="Output JSON")
    args = parser.parse_args()

    data = json.loads(args.input.read_text(encoding="utf-8"))
    channels = data.get("channels", [])

    # Score each
    for c in channels:
        c["_score"] = score_channel(c)
        c["_classification"] = classify(c["_score"])

    # Sort by score
    scored = sorted(channels, key=lambda c: c["_score"], reverse=True)

    # Portfolio recommendation
    portfolio = recommend_portfolio(scored)

    result = {
        "business_model": data.get("business_model"),
        "budget_tier": data.get("budget_tier"),
        "scored_channels": scored,
        "recommended_portfolio": portfolio,
    }

    output_text = json.dumps(result, indent=2)

    if args.output:
        args.output.write_text(output_text, encoding="utf-8")
        print(f"Wrote {args.output}")
    else:
        print(output_text)


if __name__ == "__main__":
    main()
