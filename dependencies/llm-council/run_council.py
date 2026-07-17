#!/usr/bin/env python3
"""
run_council.py - CLI entry for the Idea Council.

Usage:
    uv run python run_council.py "<idea>" [--outcome "..."] [--stakes one-way|two-way] [--fast]
"""

from __future__ import annotations

import argparse
import sys

from dotenv import load_dotenv

from council.council import run_council
from council.schema import render_memo
from council.store import save_run


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convene the Idea Council to pressure-test an idea and return a decision memo.",
    )
    parser.add_argument("idea", nargs="?", default=None,
                        help="the idea / decision to analyze, in quotes")
    parser.add_argument("--idea-file", default=None,
                        help="read the idea / context from a file (for long inputs like a research doc)")
    parser.add_argument("--outcome", default=None,
                        help="what success looks like for you (seeds OC-EMR step 1)")
    parser.add_argument("--stakes", choices=["one-way", "two-way"], default="two-way",
                        help="one-way = irreversible/expensive (heavier rigor); two-way = reversible")
    parser.add_argument("--fast", action="store_true",
                        help="skip the grounded web-research pass (quick inference-only gut-check)")
    args = parser.parse_args()

    load_dotenv()  # pull API keys from .env into the environment

    idea = args.idea
    if args.idea_file:
        with open(args.idea_file, encoding="utf-8") as fh:
            idea = fh.read()
    if not idea or not idea.strip():
        parser.error("provide an idea (positional argument) or --idea-file")

    # Windows consoles default to cp1252; the memo uses emoji/box-drawing.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

    result = run_council(idea, outcome=args.outcome, stakes=args.stakes,
                         grounded=not args.fast)
    memo = result["memo"]
    path = save_run(idea, memo, result.get("raw"))

    print(render_memo(memo))

    if result.get("warnings"):
        print("\n---\n_guardrail notes (deterministic checks):_")
        for w in result["warnings"]:
            print(f"- {w}")
    print(f"\n_run saved: {path}_")


if __name__ == "__main__":
    main()
