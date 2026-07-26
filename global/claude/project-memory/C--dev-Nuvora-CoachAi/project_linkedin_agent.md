---
name: project-linkedin-agent
description: "User is building a self-hosted agentic LinkedIn outreach system as a personal/non-commercial project, separate from Nuvora CoachAI."
metadata: 
  node_type: memory
  type: project
  originSessionId: 4da20e5e-582d-4599-a093-f11d768fe8ff
---

User is designing a personal/hobby agentic AI for LinkedIn outreach: targeted prospecting from criteria, sending connection requests, then templated/personalized messaging to acceptors with rules they define.

**Why:** Personal lead-gen tool, explicitly non-commercial. Wants self-host on VPS. Recalls a previous conversation where I mentioned an open-source GUI agent model — that was UI-TARS (ByteDance, Apache 2.0).

**How to apply:** This is unrelated to the Nuvora CoachAi repo this session is rooted in. If the user returns to this topic, the recommended stack discussion converged on: Patchright (not vanilla Playwright) + mobile proxy + LinkedIn Voyager API for reads + DOM/GUI for writes + cheap text LLM via OpenRouter or self-hosted Qwen on a budget VPS. Vision model (UI-TARS) is a fallback layer for anomalies, not the primary driver, because pure-vision agents are unnecessarily expensive when LinkedIn's DOM is stable. Closest existing project: eracle/OpenOutreach (GPLv3, Django + Playwright + Bayesian lead ranking).
