---
name: studio-tool
description: The /studio Marketing Studio — a sibling tool to /council in the same repo that generates ad/landing/email creative packages
metadata: 
  node_type: memory
  type: project
  originSessionId: 766e5eed-e165-4778-881d-91c588933375
---

The `LLM Councel` repo now holds a SECOND tool besides `/council`: the **Marketing Studio** (`/studio`, `run_studio.py`, `studio/` package), built 2026-06-26. It turns an offer into a ready-to-ship creative package (strategy → channel-ready ad variants → landing-page copy + TCPA-style consent block → grounded ad-policy/compliance flags → A/B plan → next steps).

**Design intent (do not violate):** it REUSES the council engine, it is NOT a parallel system. It imports `council.providers` (uniform multi-LLM call + honest degraded state), `council.validators` (bounded repair + the grounding guard, which was generalized with a `claims_key` param so the studio reuses it for `compliance_flags`), `council.config.PROVIDERS` (transport map), and `council.store.save_run`. Only the marketing roster/prompts/schema/renderer/engine are new. Pipeline mirrors the council: grounded brief → strategist → 3 framework-diverse copywriters (parallel) → anonymized peer critique → grounded compliance web-check → rotating synthesis.

**Skills knowledge:** the seats run with tools OFF (determinism), so they can't load Claude Code skills as live tools. Instead `studio/playbook.py` holds marketing knowledge distilled from the vetted `marketingskills` plugin suite, injected per stage. See [[council-provider-quirks]] for the shared transport gotchas. Decisions logged as ST-1..ST-6 in `docs/DECISIONS.md`.
