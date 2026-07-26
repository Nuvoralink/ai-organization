---
name: explicit-subagent-briefs
description: "Amin's standing directive — write every sub-agent/Codex/workflow prompt as if the recipient knows NOTHING beyond the prompt itself; never compress based on the orchestrator's own context"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dacc601b-7d2d-4bb9-8e59-1c3225651b36
---

Amin (2026-07-02): sub-agents and other models are less capable than the orchestrator — be more
specific and detailed in every prompt; don't assume they'll know what to do just because I know it.

**Why:** an implicit expectation the orchestrator "obviously" holds (repo conventions, doctrine terms,
what "done" means, which files are off-limits) simply does not exist for the receiving model. Weaker
models fail exactly at the gap between what the brief says and what the orchestrator meant — and the
failure surfaces late, as a wrong diff or a wasted run. This generalizes the earlier FIX B lesson
([[responsive-build-process-fixes]]): briefs carry spec MUST/MUST-NOTs verbatim, never paraphrased.

**How to apply:** every dispatch (Agent tool, Workflow `agent()` calls, `codex exec` briefs, and the
brief TEMPLATES in the universal bootstrap skill) spells out explicitly:
1. **Context** the agent can't infer — what the project is, what this slice is for, relevant settled
   decisions quoted (not cited by ID alone).
2. **Exact paths** — files to read, files to edit, files it may read but NOT modify, where output goes.
3. **Step-by-step procedure** — numbered, in execution order, including the checks to run and how to
   read their real exit status.
4. **Output contract** — the exact format/fields of the report-back (or the schema, when structured).
5. **Boundaries** — what NOT to do, named concretely (don't commit, don't touch X, don't invent Y),
   plus the escalation path when blocked.
6. **Acceptance criteria** — how the agent itself can tell it's done, verifiable from its own seat.

A prompt that would only work for a model that already shares my context is a defective prompt, even
if it happens to work this time.
