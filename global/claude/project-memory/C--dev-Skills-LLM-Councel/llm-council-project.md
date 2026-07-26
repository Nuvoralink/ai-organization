---
name: llm-council-project
description: "The Idea Council tool at C:\\dev\\Skills\\LLM Councel - purpose, architecture, locked decisions"
metadata: 
  node_type: memory
  type: project
  originSessionId: a0470bf2-eae0-43a4-909c-bb0ca9886586
---

Building the **Idea Council** at `${DEPENDENCY:council-studio|backslash}` (greenfield, started 2026-06-25): a personal tool to analyze / pressure-test an idea via a multi-LLM "council" and produce a decision-complete memo.

**Locked decisions** (full log in the repo's `docs/DECISIONS.md`):
- Interface: a `/council` Claude Code skill + a standalone Python CLI (`run_council.py`). Engine is deterministic Python; LLMs do only semantic judgment.
- 5 role-seats, each on a different model family for decorrelation: Champion=Claude (`claude -p`, Ultimate sub, $0), Skeptic/devil's-advocate=GPT (`codex exec`, Codex Pro, $0), Red-Teamer/pre-mortem=DeepSeek-R1, Domain-Expert=Gemini, End-User=Fireworks open model. Synthesizer ROTATES across strong providers (no fixed chairman).
- 3-stage flow (Karpathy LLM Council pattern): independent opinions -> anonymized + order-randomized peer critique (no seat judges itself) -> synthesizer fuses rationales into the memo.
- Grounded by default: a real web-research pass (claude/codex web tools + Gemini search) yields sourced "what users want" / security / competitor facts; `--fast` skips it. Every claim tagged grounded[source] or inferred.
- Synthesizer reasons via Tony Robbins **OC-EMR** (Outcomes, Options>=3, Consequences, Evaluate-likelihood, Mitigate, Resolve); optional `--outcome` seeds step 1. Note: we hide the asker's *opinion* (anti-sycophancy) but accept their *desired outcome* (legitimate decision context).
- Memo is decision-complete: bottom line, opportunity-cost (pursue vs focus-elsewhere), grounded user-wants, security risks+fixes, blockers+fixes, pivots, OC-EMR, action plan, scorecard, what-would-change + cheapest-test, evidence gaps, sources.

**Why a council at all:** research showed councils do NOT reliably beat the best single model on accuracy - their value is COVERAGE (blind-spots, risks, diverse lenses) + grounding. Don't oversell accuracy. See [[llm-council-guardrails]].

Provider/CLI invocation contracts (claude -p, codex exec, Gemini/DeepSeek/Fireworks REST) were verified before writing adapters. Single source of truth for output format = `council/schema.py` `render_memo`.
