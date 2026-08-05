---
name: agent-final-message-is-the-report
description: "A background agent's completion notification delivers ONLY its FINAL message — a closing appendix ('report stands as delivered above') loses the whole body; briefs must mandate one self-contained final message."
metadata:
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-05T09:42:12.295Z
---

**Harness fact (hit 3× in one session, 2026-08-05):** a background agent's `<task-notification>` carries
ONLY the agent's final message. When an agent writes its full report in one message and then appends a
closing section in a LATER message ("Final report stands as delivered above" + doctrine-loop/honesty
sections), the notification delivers only that appendix — the entire body is invisible to the
orchestrator and must be recovered with a SendMessage re-send round-trip (costly, and the resumed
re-send burns tokens re-generating what was already written).

**The durable fix (put in every research/audit agent brief):** "Your FINAL message must be the COMPLETE
self-contained report — findings + required closing sections in ONE message. Never end with an
appendix-only message or a reference to an earlier message ('as delivered above'); earlier messages are
not delivered."

**Recovery when it happens anyway:** SendMessage the completed agent asking it to re-send the complete
consolidated report as one message (resuming works — the agent keeps its transcript context).

Related: [[agent-liveness-not-from-output-file]] (the sibling harness fact — .output files are
transcripts, not reports). See [[explicit-subagent-briefs]] — this is a mandatory brief element now.
