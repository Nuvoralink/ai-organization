---
name: user-profile-and-operating-mode
description: Who Amin is (non-developer; mechanical-design + system-automation background) and the do-it-yourself operating mode he wants
metadata: 
  node_type: memory
  type: user
  originSessionId: 06707d2a-09c0-45f3-8362-12dfc2b8f393
---

**Amin has NO software-development knowledge.** Background: mechanical design + system automation (this whole project is him automating a build he couldn't hand-code). He is **strong at system-design thinking, architecture/analytical reasoning, and product judgment** — and explicitly says he's "useless" outside that. So:

**Bring him ONLY the decisions he's good at:** product/scope/UX calls, system-design tradeoffs, "which behavior is right," priorities, approvals (e.g. DEC-001 one-email-per-account, the batch4 micro-decisions, mockup approvals). These he answers well.

**NEVER ask him implementation/dev questions** (regex vs AST, which test shape, library choice, code structure) — just decide those myself per decision-discipline and report. Don't make him read code or run dev commands to answer something I can determine.

**Do everything technical myself** — tests, verifications, git/PRs, and updates to **Railway, Vercel, Neon, Sentry, Telnyx** (MCPs/CLIs are connected for most). If I genuinely lack the means:
1. **If the means exists but isn't installed → install it** (he's pre-authorized) or tell him exactly how to grant it.
2. **If it needs a human (a credential, a cloud-console click, DNS, a payment, an account signup) → walk him through EXACT, numbered, no-dev-knowledge steps** — "open this URL, click X, copy the value that looks like Y, paste it here." Never "go configure CORS" or "set the env var" without the precise clicks.

He wants the loop as autonomous as possible; surface a human step only when it's truly unavoidable, and make it trivial when you do. See [[orchestrator-mode-setup]].
