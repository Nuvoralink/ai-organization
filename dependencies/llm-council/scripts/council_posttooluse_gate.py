#!/usr/bin/env python3
"""
PostToolUse gate for the Idea Council (adapted from Nuvo Dialer's
claude-posttooluse-gate.mjs). Reads the tool-call JSON from stdin, routes the
edited file to the relevant checks, and exits 2 with an actionable message on
failure so the agent must fix it before continuing.

Two load-bearing rules copied from the original:
  - Never block on plumbing: unparseable payload or no file path -> exit 0.
  - On failure, stderr says WHAT failed and not to work around it; exit code 2
    is what feeds that back to the agent.
Stdlib only - no dependencies, so the hook can never fail to start.
"""

import json
import os
import sys


def fail(msg: str) -> None:
    sys.stderr.write(
        "Council gate FAILED - fix before continuing (do NOT work around it):\n"
        + msg
        + "\n"
    )
    sys.exit(2)


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    file_path = (payload.get("tool_input") or {}).get("file_path") or ""
    if not file_path:
        sys.exit(0)

    # Only ever gate files inside THIS (council) project. The same session can edit
    # other repos (an additional working directory); never gate those.
    council_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    try:
        in_project = os.path.commonpath([os.path.abspath(file_path), council_root]) == council_root
    except ValueError:
        in_project = False
    if not in_project:
        sys.exit(0)

    p = file_path.replace("\\", "/")
    if not p.endswith(".py"):
        sys.exit(0)

    base = os.path.basename(p)
    # Only gate our own package / scripts / tests
    is_test = base.startswith("test_") or base.endswith("_test.py")
    if "/council/" not in p and "/scripts/" not in p and "/tests/" not in p and not is_test:
        sys.exit(0)

    try:
        with open(file_path, encoding="utf-8") as fh:
            src = fh.read()
    except OSError:
        sys.exit(0)

    problems: list[str] = []

    # 1) Syntax check every edited .py (catch breakage at edit time)
    try:
        compile(src, file_path, "exec")
    except SyntaxError as e:
        fail(f"Syntax error in {p}: line {e.lineno}: {e.msg}")

    # 2) Prompt contract: prompts.py must keep the grounding / anti-injection wiring
    if p.endswith("council/prompts.py"):
        for token in ("GROUNDING_RULES", "INJECTION_GUARD", "grounded", "inferred"):
            if token not in src:
                problems.append(
                    f"prompts.py is missing required contract token '{token}' - the "
                    "grounding / anti-fabrication discipline must stay wired into the prompts."
                )

    # 3) Schema contract: schema.py must keep the memo schema + its single-source renderer
    if p.endswith("council/schema.py"):
        for token in ("MEMO_SCHEMA", "def render_memo"):
            if token not in src:
                problems.append(
                    f"schema.py is missing '{token}' - it is the single source of truth for "
                    "the decision-memo contract and its rendering."
                )

    # 4) Test intent: every test file must declare what it Proves (Nuvo test-intent gate)
    if is_test and "Proves:" not in src:
        problems.append(
            f"{base} has no 'Proves:' header - every test must declare the product decision "
            "it defends and would fail if that behaviour regressed."
        )

    if problems:
        fail("\n".join("- " + x for x in problems))
    sys.exit(0)


if __name__ == "__main__":
    main()
