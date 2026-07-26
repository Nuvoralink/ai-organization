---
name: decision-defaults
description: "Amin's standing answers to common decision types — apply before asking; only escalate genuine product/scope forks"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c736ed6a-56e0-4496-b3fa-e4b8599be152
---

Amin gave four standing decision-defaults (2026-06-14) to cut round-trips. Apply these BEFORE reaching for AskUserQuestion; only surface a question when none of these resolve it (a genuine product/scope/priority fork).

1. **Out-of-phase build vs defer** → **defer** it to its own phase (build it when its prerequisites x/y/z are ready). Don't build ahead of phase.
2. **"How / which direction" questions** → **research how other apps do it**: dig into customer reviews to see what's working and what's causing complaints, take the best designs, and combine them. (This is the doc-31 UX-benchmark method — apply it, don't ask.)
3. **Architectural questions** → pick **the best / most durable / most secure technique** and do that. Don't ask which approach — choose the strongest one.
4. **Everything else** → **go with my (Claude's) recommendation.**

**Why:** Amin is the PM over the agent fleet ([[user-profile-and-operating-mode]]); he wants decisions he's good at (product/scope/priority/UX-approval), not dev/architecture/how questions he's delegated to me. These defaults encode "decide it yourself the right way and proceed."

**How to apply:** still *report* the decision + basis (decision-discipline — nothing decided silently), but don't *block* on it. Reserve AskUserQuestion for true forks: scope/sequencing tradeoffs with product weight, irreversible/billed actions, or mockup approvals. The nav-rail-defer and SDK-vs-backend-reason calls this session are examples I correctly surfaced; pure how/architecture calls I should just make.
