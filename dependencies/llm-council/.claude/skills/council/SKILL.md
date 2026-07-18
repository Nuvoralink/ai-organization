---
name: council
description: Convene the Idea Council to pressure-test an idea or decision and return a decision-complete memo (verdict, opportunity-cost, grounded user-wants, security risks + fixes, blockers + fixes, pivots, Tony Robbins OC-EMR, action plan, scorecard, what-would-change). Use when the user wants to analyze, validate, or stress-test an idea, decide whether to pursue something, or says "ask the council".
---

# Idea Council

Convene a 5-seat multi-LLM council (Champion, Skeptic, Red-Teamer, Domain-Expert, End-User) that researches the idea with real sources, critiques itself, and synthesizes a decision-complete memo via Tony Robbins' OC-EMR decision process.

## How to run
Run the engine and show the user the memo it prints. Works from any directory:

```
uv run --directory "${DEPENDENCY:council-studio}" python run_council.py "<the idea, in the user's own words>" [--outcome "<what success looks like>"] [--stakes one-way|two-way] [--fast]
```

Pass `--idea-file` as an ABSOLUTE path (relative paths resolve against the tool's root, not your cwd).

- Put the idea in quotes. If the user stated a goal / desired outcome, pass it via `--outcome` (this seeds OC-EMR step 1 without revealing their *opinion* of the idea, which the council deliberately withholds to avoid sycophancy).
- The default is the GROUNDED pass (real web research with sources). Add `--fast` only if the user explicitly wants a quick inference-only gut-check.
- Use `--stakes one-way` for irreversible / expensive decisions (the council applies heavier rigor); `--stakes two-way` (default) for reversible ones.
- To analyze a LONG input (a research report, a spec, a pasted document), write it to a file and pass `--idea-file <path>` instead of the positional idea — the council ingests the whole document. Frame the file with the user's constraints + the analysis task at the top, then the document below.

Then present the memo the script prints to stdout verbatim - the memo IS the deliverable, so do not re-summarize, soften, or trim it. If a seat came back `unavailable`, the memo already names it; surface that honestly rather than hiding it.

## First-run setup (only if it errors)
- Missing deps -> `uv sync`.
- Missing keys -> copy `.env.example` to `.env` and fill `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`. The Claude and GPT seats use the `claude` and `codex` CLI subscription logins, so they need no key.
- Missing `claude` command -> `npm i -g @anthropic-ai/claude-code` (the Champion seat uses it on the Ultimate subscription).
