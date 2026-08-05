---
name: agent-liveness-not-from-output-file
description: "A background agent's .output file size/mtime is NOT a liveness signal — do not infer death from a 0-byte/stale output; only the completion/failure notification is authoritative."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-04T18:10:03.329Z
---

**Operational rule (my own recurring error, 2026-08-03 — three times, once fatal):** a background
agent's task `.output` file being **0 bytes or stale (unchanged mtime)** is **NOT** evidence the agent
is dead. Agents ran 80+ minutes, committed full slices, and were healthily mid-`verify` while their
`.output` file sat at 0 bytes the whole time. I wrongly read "0-byte / frozen mtime" as death and:
- twice reported live/committed agents as "died" (Stripe, signup) — corrected embarrassingly,
- **once TaskStop-killed a genuinely healthy integration agent** that was mid-`npm run ci` verify lane
  (the merges were already committed, so no permanent loss — but it was a needless kill).

**The only authoritative liveness signals:**
1. The **completion / failure `<task-notification>`** the harness sends when an agent truly ends. Wait
   for it. It carries the real terminal state (and the agent's final message).
2. **Committed git state** on the agent's branch/worktree (proves work reached a durable point).
3. The worktree **lock** is a weak positive-alive hint but can be stale on abrupt death — never
   override a completion notification with it, and never treat "unlocked" alone as proof of death.

**Do NOT** infer death from the `.output` file's byte-size or mtime — do not `Read`/`wc` it as a
liveness probe, and **never TaskStop an agent** on that basis. If genuinely unsure whether an agent is
alive, **wait for its notification or ask the user** — killing a healthy agent is worse than waiting.
(Docker/connection can crash an agent, but that arrives as a failure notification, not as a 0-byte
file.) Generalizes to any project. See [[commit-before-adversarial-review]], [[gh-pr-checks-watch-gotchas]].
