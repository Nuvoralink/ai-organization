#!/usr/bin/env python3
"""
MarketForge readiness-check helper.

Applies the 7-gate readiness check per readiness-check-protocol.md.

Usage:
  python readiness_check.py --input readiness.json

Input format (readiness.json):
{
  "business_model": "B2B SaaS",
  "gates": {
    "customer_interviews": {"count": 32, "recent_months": 6, "methodology": "Moesta", "pass": true},
    "retention_curve": {"d30_retention_percent": 88, "monthly_churn_percent": 3, "pass": true},
    "icp_articulable": {"pass": true, "notes": "..."},
    "unit_economics": {"ltv_cac_ratio": 3.2, "ltv_basis": "contribution_margin", "pass": true},
    "paying_revenue": {"customers": 80, "pass": true},
    "capacity": {"founder_hours_per_week": 12, "process_documented": true, "pass": true},
    "conversion_path": {"signup_completion_percent": 65, "activation_measured": true, "pass": true}
  }
}

Output: composite score + recommendation + blocking gates.
"""

import argparse
import json
import sys
from pathlib import Path


GATES = [
    "customer_interviews",
    "retention_curve",
    "icp_articulable",
    "unit_economics",
    "paying_revenue",
    "capacity",
    "conversion_path",
]


def evaluate(data: dict) -> dict:
    gates = data.get("gates", {})

    results = {}
    pass_count = 0
    failed = []

    for gate_name in GATES:
        gate_data = gates.get(gate_name, {})
        passed = gate_data.get("pass", False)
        results[gate_name] = {
            "pass": passed,
            "data": gate_data,
        }
        if passed:
            pass_count += 1
        else:
            failed.append(gate_name)

    # Recommendation
    if pass_count == 7:
        recommendation = "PROCEED — Full paid acquisition planning"
    elif pass_count >= 5:
        recommendation = "PROCEED CAPPED — Cap initial spend at T1 ($0-500/mo) until failing gates close"
    elif pass_count >= 3:
        recommendation = "BLOCK PAID SCALING — Branded paid search defensive only; focus on closing gates"
    else:
        recommendation = "HARD BLOCK — Run discovery + research; revisit in 30-60 days"

    return {
        "score": f"{pass_count}/7",
        "recommendation": recommendation,
        "failing_gates": failed,
        "gate_details": results,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args()

    data = json.loads(args.input.read_text(encoding="utf-8"))
    result = evaluate(data)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
