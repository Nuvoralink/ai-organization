---
name: read-commit-messages-before-declaring-work-unfinished
description: "Before briefing an agent that prior work is 'unfinished/missed', read the COMMIT MESSAGES of the commits that landed it — a documented deviation is authority and outranks the brief's framing."
metadata:
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-05T12:25:13.520Z
---

**My error, 2026-08-05 (cost: a full 259k-token / 42-min dispatch).** A slice-1 agent died from a
network error right after committing. I diffed its branch, saw `endpoints.ts` had no new rows, and
dispatched a follow-up agent briefed as: *"a prior agent died before finishing one task… the missing
task: endpoint registry rows."*

**It had not missed the task — it deliberately deferred it, and said so in its commit message:**

> *Deviation: the endpoints.ts registry rows for the not-yet-built routes are NOT added here.
> `gate:backend-endpoint-parity` blocks any registry key without a mounted backend route
> (pending_backend is a failing classification, proven by experiment), so those rows land in slice 2
> with their routes, in one change.*

The second agent re-derived the same conclusion by measuring all five gate paths, refused to write a
false `deferred` classification to get green, and escalated. Correct — but entirely avoidable.

**The rule:** file-state absence is a LEAD, never proof of incompleteness. Before a brief asserts that
prior work is unfinished/missed/broken, run `git log --format="%h%n%B" <range>` over the commits that
landed it and read them in full. An agent's documented deviation is a decision record — it outranks my
inference from the diff. If the brief still disputes it, say so explicitly: *"the prior agent deferred
this deliberately for reason X — verify or refute that reason before implementing,"* so the agent
starts from the real question instead of re-discovering it.

Generalizes to any project and any "finish what X started" dispatch. Compose with
[[agent-final-message-is-the-report]] (the death lost the REPORT, not the work — the commit message
was the only surviving record) and [[explicit-subagent-briefs]].

*Fail-state:* I briefed an agent to redo work that was correctly deferred, because I read the diff and
not the commit message that explained it.
