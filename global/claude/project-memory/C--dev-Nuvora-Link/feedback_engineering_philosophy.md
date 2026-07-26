---
name: Engineering philosophy and approach preferences
description: User's core engineering principles — product-first thinking, root-cause fixing, architecture audits, no workaround patches
type: feedback
originSessionId: b10dc475-b87e-40e1-a1fd-01f97b2718e7
---
Fix problems at the root and upstream — never add workaround fixes that only address symptoms.

**Why:** User has repeatedly emphasized this across both Codex global AGENTS.md and project AGENTS.md. Workaround patches mask real issues and create tech debt.

**How to apply:** Before proposing any fix, trace the issue upstream through the full pipeline. If pushed back that something feels like a workaround, perform an architecture audit — don't defend the patch. Always ask "Does this fully satisfy the product intent, or did I only patch the current failure?"

Additional principles:
- Think product-first: ideal solution first, then evaluate current architecture gaps
- Consider broader scope — if a fix can be generalized, mention it and ask permission
- Don't defer tasks that need to be done now
- For debugging, use the upstream-cause ladder (5 levels deep)
- For AI/semantic bugs, build decision matrices not hardcoded rules
- Validation failures should feed back into generation via bounded retry, not become the final fix
- Honesty without usefulness is pointless. If you can't back a claim with proof, don't surface it and slap a "no proof available" disclaimer on it — that's not honest, it's useless. Ask why the proof is missing. If it truly doesn't exist, the claim shouldn't be shown at all. Every piece of output (coaching text, UI section, recommendation) must be actionable and grounded. If you can't make it useful, cut it entirely rather than hedging with empty transparency.
