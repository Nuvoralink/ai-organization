---
description: Keep agent work anchored to product intent, business value, UX, psychology, and root-cause fixes
paths:
  - "backend/src/**/*"
  - "frontend/src/**/*"
  - "shared/src/**/*"
  - "docs/app-plan/**/*"
  - "docs/sprints/**/*"
---

# Agent Product Intent Rules

Purpose: keep implementation work outcome-oriented, valuable, and durable instead of technically correct but low-signal.

## 1. Start from intent

- Before applying a fix, adding a feature, or wiring a flow, ask what the original intention was.
- Identify the user outcome, business outcome, or product risk the change is supposed to improve.
- Do not optimize only for "request completed"; optimize for the reason the request exists.

## 2. Prefer value over output volume

- Favor changes that improve clarity, trust, conversion, usability, maintainability, or decision quality.
- Do not turn the product into an information dump.
- Prefer focused, actionable experiences that help the user understand what matters and what to do next.
- If extra information does not improve action, confidence, or understanding, it is probably noise.

## 2.1 Product Value Beats Graceful Failure

**Honesty is the rare real-outage case, not a substitute for building it to work.** A degraded/honest state ("stale — reconnecting", "unavailable", "no draft", "fall back to manual entry") is for the genuine edge case where the system *truly cannot* succeed — it is **never** the default you reach for instead of making the feature reliably work. Build it to refresh/succeed properly first; the honest fallback is the narrow exception, not the design. This applies beyond AI — real-time surfaces, sync, error states, degraded modes. (Surfaced 2026-05-29, MGR-001 wallboard: a "stale" label is not a substitute for a wallboard that reconnects and stays current.)

- The dialer's bounded AI value is concrete: an accurate AI disposition draft the booker accepts in one keystroke, a battlecard that fires on the right objection, a clean lead context-pop. The booker should spend attention on the conversation, not on data entry — that is the value the AI exists to deliver.
- Honest, limited, unavailable, or degraded states are required when evidence is truly missing, unsafe, stale, or unauthorized (no transcript, call too short, low ASR confidence, transcription unavailable). They protect trust; they do not replace product value.
- If transcript/keyword evidence exists and the AI output is blank, generic, or wrong, treat that as a product defect. Repair the upstream source, AI contract, validation/repair loop, persistence, DTO, mapper, or UI consumer instead of accepting a graceful failure.
- Do not call an AI feature done because it avoided fabricating. It is done when it reliably produces a usable draft/card/context (that the human then confirms, per ARC-003/ARC-006), or proves with evidence why it cannot and falls back to manual entry cleanly.
- (Coaching itself — scorecards, rubrics, behavior-change feedback — is the separate CoachAI product, not the dialer. This rule is about the dialer's own bounded AI surfaces.)

## 3. Keep UX and psychology in mind

- Reduce confusion, friction, cognitive load, and unnecessary choice overload.
- Prefer wording and flows that feel clear, reassuring, and motivating.
- Surface the right amount of information at the right moment, not everything at once.
- Protect user trust: avoid misleading states, fake precision, or technically correct but confusing UX.

## 4. Fix the cause, not the symptom

- When fixing a bug, look for the root cause and solve that cause directly.
- Do not ship lazy workarounds or brittle patches that only hide the current symptom.
- Do not hardcode logic around one failing case if the same underlying issue can appear in similar scenarios.
- Prefer generic, durable fixes that address the broader failure mode without overengineering.

## 5. Definition of a good solution

- A good solution is technically sound and meaningfully improves the product outcome.
- The best fix is usually the smallest change that solves the real problem well for this case and related cases.
- If a requested approach adds complexity without clear business or user value, say so and prefer a better alternative.

## 6. Calibrate scope before acting

- Before planning or implementing a fix, feature, edit, or architecture addition, define the target product outcome, the proper blast radius, and what "good work done" means.
- Check whether the radius should stay local or expand upstream/downstream to contracts, source-of-truth registries, persistence, tests, UI states, docs, or guardrails.
- Explicitly avoid both undershoot (symptom patch, stale consumers, duplicated local logic) and overshoot (unrelated rewrites, one-note visual swings, complexity without user value).
- Add tests, smokes, or guardrails that prove the work makes logical sense for the user, not just code sense for the compiler.
