#!/usr/bin/env python3
"""
ground_compliance.py - run JUST the grounded ad-policy/compliance check against a
saved Studio run's shipping copy, for a given market.

Why this exists: the full grounded pipeline is ~18 min (two web stages); when the
session can't hold that long, the COPY is still done and saved - and copy doesn't
need web-grounding, only the compliance/policy claims do. This re-verifies the
compliance section alone (one foreground web call) and prints market-correct flags
with real sources, reusing the studio's own prompt + schema + copy extractor (no
parallel logic).

Usage:
    uv run python scripts/ground_compliance.py <run.json> "<market>" [timeout_s]
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from council import providers
from council.validators import OK
from studio import prompts
from studio import schema as S
from studio.studio import _collect_copy_text  # reuse the engine's copy extractor


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: ground_compliance.py <run.json> \"<market>\" [timeout_s]")
    run_path = sys.argv[1]
    market = sys.argv[2] if len(sys.argv) > 2 else "United States"
    timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 540

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

    load_dotenv()
    rec = json.load(open(run_path, encoding="utf-8"))
    package = rec.get("memo", {})       # studio.store saves the package under "memo"
    offer = rec.get("idea", "")
    channel = package.get("meta", {}).get("channel", "Meta (Facebook/Instagram)")
    # the package carries ad_variants/landing_page/other_assets at top level - the same
    # shape _collect_copy_text reads from a draft, so wrap it as a single-item list.
    copy_text = _collect_copy_text([package])
    if not copy_text.strip():
        sys.exit("no shippable copy found in that run")

    from studio.config import RESEARCH_SEAT
    res = providers.run_seat(
        RESEARCH_SEAT["provider"], RESEARCH_SEAT["model"],
        prompts.build_compliance_prompt(offer, channel, copy_text, market),
        json_schema=S.COMPLIANCE_SCHEMA, allow_web=True, timeout=timeout,
    )
    if res.status != OK or not res.data:
        sys.exit(f"grounded compliance unavailable: {res.error}")

    flags = res.data.get("flags", [])
    sev = {"blocker": "\U0001F534 Blocker", "high": "\U0001F7E0 High",
           "medium": "\U0001F7E1 Medium", "low": "\U0001F7E2 Low"}
    seen: dict[str, int] = {}
    print(f"## \U0001F512 Grounded compliance - {market}\n")
    print("| Risk | Severity | Fix |")
    print("|---|---|---|")
    for f in flags:
        refs = ""
        for s in f.get("sources", []):
            url = s.get("url")
            if url and url not in seen:
                seen[url] = len(seen) + 1
            if url:
                refs += f"[{seen[url]}]"
        print(f"| {f.get('risk','')} {refs} | {sev.get(f.get('severity'),'')} | {f.get('fix','')} |")
    if seen:
        print("\n### Sources")
        for url, i in sorted(seen.items(), key=lambda kv: kv[1]):
            print(f"[{i}] {url}")


if __name__ == "__main__":
    main()
