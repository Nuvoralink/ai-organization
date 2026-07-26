---
name: live-council-hackathon
description: "Live Council — Dubai Builder Lab hackathon project (ElevenLabs + context.dev + Devin); docs package done 2026-07-21, next step is solo spike S1"
metadata: 
  node_type: memory
  type: project
  originSessionId: f127d02b-bfbc-4978-b124-712024201255
  modified: 2026-07-21T04:45:04.442Z
---

Amin is entering the Dubai Builder Lab one-day hackathon (5-hour build, teams of 5, judged on demo + codebase health + tool steering; sponsors ElevenLabs / Devin / context.dev). Chosen concept: **Live Council** — the existing Idea Council IP (5 seats: Champion, Skeptic, Red-Teamer, Domain-Expert, End-User + OC-EMR memo) made voice-first: multi-LLM seat briefs at prep time, one ElevenLabs multi-voice agent (Chair) debates live, interruptible, grounded in context.dev crawls, ends with a written memo. Hard constraint: the presenter never performs a skilled activity live (no cold-calling demos).

**Why:** gateway project to learn voice agents; the long-term vision (CoachAI brain + Auxara dialer outbound setter) comes later as a separate build.

Docs package (specforge-validated, both gates green): `${WORKSPACE:dev|backslash}\Voice Agents\live-council\docs\app-plan\` — PRD, architecture, internal contracts (C-1–C-8), verified vendor contracts + verify-on-day list (V-1–V-5), build plan (spike S1–S5, hour-by-hour, Devin briefs), prompts, decision log (D-001–D-010).

**Next step:** solo spike, starting S1 (dashboard-configured multi-voice agent, tune the Chair prompt). Key verified facts: multi-voice = `conversation_config.tts.supported_voices` + `<LABEL>` tags, max 10 voices; context.dev crawl default `stopAfterMs` is 80 s and must be overridden to ~20 s. Related: [[specforge-claude-install]].
