---
name: studio
description: Convene the Marketing Studio to turn an offer into a ready-to-ship creative package (messaging strategy, channel-ready ad variants, landing-page copy + consent block, grounded compliance/policy flags, A/B test plan, next steps). Use when the user wants ad copy, landing-page copy, marketing assets, campaign creative, or to generate/critique/optimize copy for a paid ad, website, or email.
---

# Marketing Studio

Convene a multi-LLM marketing studio (research analyst, strategist, three framework-diverse copywriters, an anonymized peer-critique round, and a grounded ad-policy/compliance check) that researches the audience, drafts in parallel, critiques itself, and synthesizes a usable creative package. Sibling to `/council`; it reuses the same engine layer (provider call layer, grounding guards, schema validation, honest degraded state).

## How to run
Run the engine and show the user the package it prints. Works from any directory:

```
uv run --directory "${DEPENDENCY:council-studio}" python run_studio.py "<the offer, in the user's own words>" [--channel "Meta (Facebook/Instagram)"] [--assets "ad copy,landing page"] [--audience "..."] [--market "United States"] [--voice "..."] [--fast]
```

Pass `--offer-file` and `--context-file` as ABSOLUTE paths (relative paths resolve against the tool's root, not your cwd).

This produces a full researched multi-LLM creative package; for a quick single-asset copy question, the marketing-skills plugin subskills are the lighter fit.

- Put the offer in quotes. `--channel` drives the grounded ad-policy check (e.g. "Meta", "Google Search", "TikTok", "email/cold outreach"). `--assets` is a comma-separated list (e.g. `"ad copy,landing page,email"`); default is `ad copy,landing page`. `--audience` seeds targeting if the user named one.
- `--market` is the target jurisdiction (default "United States"). It writes the copy for that market AND makes the grounded compliance pass check the **right consent/privacy law** — e.g. `--market "Canada"` checks CASL + CRTC telemarketing rules + PIPEDA/Quebec Law 25 (not US TCPA). Use it whenever the ad runs outside the US.
- `--voice` is an optional brand voice/tone (e.g. `"warm, plain-spoken, working-class respect, no jargon"`); if omitted the studio infers a fitting voice. The studio also derives 2-3 **target personas** from the offer and pressure-tests the drafts through a persona panel — all adaptive to whatever offer it's given (nothing hardcoded).
- The default is the GROUNDED pass: a real web-research brief (audience language, competitor angles, proof points, platform policy) **and** a grounded compliance/policy review of the drafted copy. Add `--fast` only for a quick inference-only draft with no research or policy check.
- For a long offer/brief (a pasted doc, a research report), write it to a file and pass `--offer-file <path>`.

Then present the package the script prints to stdout verbatim — the package IS the deliverable, so do not re-summarize or trim it. If a seat came back `unavailable` or research was skipped, the guardrail notes already say so; surface that honestly. The copy is a starting point: tell the user to get one legal/policy review before spending on traffic for regulated offers (insurance, finance, health).

## What it produces
A creative package: a strategy snapshot (audience, awareness stage, big idea, primary angle, CTA), 2-3 distinct channel-ready **ad variants** (hook · primary text · headline · description · visual direction), **landing-page copy** (headline, sections, intent-only form questions, CTA, consent/disclosure block, trust elements), any other requested assets (email/SMS), **compliance & policy flags** (grounded, with fixes), an **A/B test plan**, and **next steps**.

## First-run setup (only if it errors)
Same environment as `/council` (it reuses that engine): `uv sync`; copy `.env.example` to `.env` and fill `GOOGLE_API_KEY` + `DEEPSEEK_API_KEY`; the Claude and Codex seats use the `claude` / `codex` CLI subscription logins (no key). If `claude` is missing: `npm i -g @anthropic-ai/claude-code` then `/login`.
