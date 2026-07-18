# Idea Council

Ask a council of frontier LLMs to pressure-test an idea or decision and hand you a **decision-complete memo** - not a chat, a memo you can act on: a clear verdict, the opportunity-cost call (pursue vs. focus elsewhere), what real users want (with sources), security risks and how to fix them, blockers and how to clear them, concrete pivots, a full Tony Robbins **OC-EMR** decision walkthrough, an action plan, a scorecard, and exactly what would change the verdict.

## How it works
A deterministic Python engine runs the [Karpathy LLM Council](https://github.com/karpathy/llm-council) pattern, specialized for *idea analysis*:

1. **Research (grounded by default)** - a real web-research pass gathers competitor reviews, what users want, and security facts *with sources*. `--fast` skips it for a quick gut-check.
2. **Independent opinions** - five seats, each a different model family and a different role, answer independently (no anchoring):

   | Seat | Role | Model family | Billing |
   |------|------|--------------|---------|
   | Champion | steelman + upside | Claude (`claude -p`) | Ultimate subscription |
   | Skeptic | hard devil's advocate | GPT (`codex exec`) | Codex Pro subscription |
   | Red-Teamer | pre-mortem | DeepSeek-R1 | API |
   | Domain-Expert | feasibility / market | Gemini | API |
   | End-User | "would I use / pay?" | Fireworks open model | API |

3. **Anonymized peer critique** - responses are relabeled + order-randomized; each seat rates the others for rigor and grounding (no seat judges its own).
4. **Synthesis (OC-EMR)** - a rotating synthesizer (no fixed chairman) fuses the rationales into the memo and works Tony Robbins' Outcomes -> Options -> Consequences -> Evaluate -> Mitigate -> Resolve.

Deterministic code owns orchestration, anonymization, grounding checks, and schema validation; the LLMs only ever do semantic judgment.

> Honest note: research shows a council does **not** reliably beat the single best model on raw accuracy. Its value is *coverage* - diverse lenses, surfaced blind-spots and risks - plus grounding. This tool is built for that, not for "more models = more correct".

### Trust guardrails (so it doesn't confidently make things up)
- **Grounding-ID validator** - every "what users want" claim tagged *grounded* must cite a source that actually exists; otherwise it is downgraded to *inferred*, never dropped or fabricated.
- **Schema-validate every stage** with one bounded repair pass; unrepairable output is marked `rejected`, never back-filled.
- **Honest degraded state** - a seat that fails is recorded `unavailable` and named in the memo; the roster is never silently shrunk.
- A read-only `council-integrity-auditor` agent and a `PostToolUse` gate hook enforce these on the code itself.

## Setup
This machine runs Python via the **`py`** launcher and **`uv`** (the bare `python` alias is the Windows Store stub - don't use it).

1. Standalone Claude CLI + **log it in** (the Champion and web-research seats use it on your Ultimate subscription):
   ```
   npm i -g @anthropic-ai/claude-code
   claude            # then type /login and pick your Claude subscription account
   ```
   The standalone CLI does NOT inherit the desktop app's login — you must log it in once, or those two seats stay `unavailable`.
2. Dependencies: `uv sync`
3. Copy `.env.example` to `.env` and fill `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`. The Claude and GPT seats use the `claude` / `codex` CLI logins - no keys needed.

## Usage
```
uv run python run_council.py "your idea here" --outcome "what success looks like" --stakes two-way
```
or just type `/council <idea>` inside Claude Code.

Runs are saved under `data/runs/` so an idea can be re-opened or re-run when new evidence arrives.

## Layout
```
council/
  schema.py      # the memo + stage contracts and render_memo (single source of truth for output)
  prompts.py     # role definitions + per-stage prompts (grounding, anti-injection, OC-EMR)
  providers.py   # uniform call layer: claude -p / codex exec / Gemini / DeepSeek / Fireworks
  council.py     # the 3-stage engine
  validators.py  # grounding-ID validator, schema validation + bounded repair, degraded state
  store.py       # persists each run under data/runs/
run_council.py             # CLI entry
.claude/skills/council/    # the /council skill
.claude/agents/            # council-integrity-auditor
docs/DECISIONS.md          # locked decisions
```

## Sibling tool: Marketing Studio (`/studio`)
Where the Council *evaluates* an idea, the **Marketing Studio** *builds the campaign for it*. Same engine, different deliverable: it turns an **offer** into a ready-to-ship **creative package** — messaging strategy, channel-ready ad variants (hook · primary text · headline · description · visual direction), landing-page copy with an intent-only form + consent block, **grounded ad-policy/compliance flags** (with fixes and sources), an A/B test plan, and next steps.

It reuses the council's engine wholesale — the `providers` call layer, the `validators` grounding/bounded-repair guards, the `PROVIDERS` transport map, and `store` — and adds only the marketing roster, prompts, schema, and renderer (`studio/`). The pipeline mirrors the council's proven shape: grounded brief (incl. a **swipe file of real proven ads** in the niche to study and beat) → strategist (which also **derives 2-3 target personas** from the offer) → **three premium framework-diverse copywriters** — Claude Opus + GPT-5 + Gemini Pro, no cheap seats — (parallel) → anonymized peer critique **+ a target-reader persona panel** (concurrent) → grounded compliance check → **Opus-first synthesis**. The copy-critical roles all run on the best models, and the writers are hard-banned from generic/regulation/cliché copy. The same anti-fabrication rule applies (no invented stats/testimonials/guarantees), and `compliance_flags` tagged *grounded* are bound to real sources by the same grounding guard. A `--market` flag makes the grounded compliance pass check the **correct jurisdiction's** consent/privacy regime (US TCPA/FTC vs Canada's CASL+CRTC+PIPEDA vs UK/EU GDPR) and writes market-correct copy; an optional `--voice` sets brand tone. Personas, angles, voice, and jurisdiction are all derived or supplied — nothing is hardcoded to one offer.

The seats run with tools disabled (for deterministic, schema-valid output), so they can't load Claude Code *skills* as live tools. Instead, `studio/playbook.py` holds expert marketing knowledge **distilled from the vetted `marketingskills` plugin suite** (copywriting, ad-creative, ads, marketing-psychology, cro, ab-testing, customer-research, signup, emails, copy-editing) and injects the relevant block into each stage's prompt — the only mechanism that reaches every provider. The knowledge is rewritten in our own words, so any third-party injection text becomes inert data, never an instruction. Update a block, every seat inherits it.

```
uv run python run_studio.py "your offer here" --channel "Meta (Facebook/Instagram)" --assets "ad copy,landing page" --audience "who it's for"
```
or just type `/studio <offer>` inside Claude Code. Add `--fast` for a quick inference-only draft (no research or policy check).
