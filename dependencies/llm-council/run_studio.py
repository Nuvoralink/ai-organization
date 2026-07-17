#!/usr/bin/env python3
"""
run_studio.py - CLI entry for the Marketing Studio.

Usage:
    uv run python run_studio.py "<offer>" [--channel "Meta"] [--assets "ad copy,landing page"]
                                          [--audience "..."] [--fast]

The default is the GROUNDED pass (real web research for the brief + an ad-policy /
compliance check). --fast skips both for a quick inference-only draft.
"""

from __future__ import annotations

import argparse
import sys

from dotenv import load_dotenv

from council.store import save_run  # reuse the council's run persistence
from studio.studio import run_studio
from studio.schema import render_package


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convene the Marketing Studio to turn an offer into a creative package.",
    )
    parser.add_argument("offer", nargs="?", default=None,
                        help="what is being marketed, in quotes")
    parser.add_argument("--offer-file", default=None,
                        help="read the offer / context from a file (for long inputs)")
    parser.add_argument("--channel", default="Meta (Facebook/Instagram)",
                        help="the ad/marketing channel (drives the policy check)")
    parser.add_argument("--assets", default="ad copy,landing page",
                        help="comma-separated asset types to produce")
    parser.add_argument("--audience", default=None,
                        help="the target audience, if known")
    parser.add_argument("--market", default="United States",
                        help="target market/jurisdiction (drives copy + which consent/privacy "
                             "law the compliance check uses, e.g. \"Canada\", \"United Kingdom\")")
    parser.add_argument("--voice", default=None,
                        help="optional brand voice/tone (e.g. \"warm, plain-spoken, no jargon\")")
    parser.add_argument("--context", default=None,
                        help="operator-provided swipe file / extra context (real example ads, "
                             "notes) injected for the writers to study and beat")
    parser.add_argument("--context-file", default=None,
                        help="read --context from a file (for a long swipe file)")
    parser.add_argument("--fast", action="store_true",
                        help="skip the grounded brief + compliance pass (quick draft)")
    args = parser.parse_args()

    load_dotenv()

    offer = args.offer
    if args.offer_file:
        with open(args.offer_file, encoding="utf-8") as fh:
            offer = fh.read()
    if not offer or not offer.strip():
        parser.error("provide an offer (positional argument) or --offer-file")

    asset_types = [a.strip() for a in args.assets.split(",") if a.strip()]

    context = args.context
    if args.context_file:
        with open(args.context_file, encoding="utf-8") as fh:
            context = fh.read()

    # Windows consoles default to cp1252; the package uses emoji/box-drawing.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

    result = run_studio(offer, channel=args.channel, asset_types=asset_types,
                        audience=args.audience, market=args.market, voice=args.voice,
                        grounded=not args.fast, context=context)
    package = result["package"]
    path = save_run(offer, package, result.get("raw"))

    print(render_package(package))

    if result.get("warnings"):
        print("\n---\n_guardrail notes (deterministic checks):_")
        for w in result["warnings"]:
            print(f"- {w}")
    print(f"\n_run saved: {path}_")


if __name__ == "__main__":
    main()
