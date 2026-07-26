---
name: universal-backflow-rule
description: "Amin standing directive (2026-07-02): any project lesson that improves structure/design/auditor prompts must ALSO update the universal layer (bootstrap-orchestrator templates + global rules/agents + sibling project) in the same turn"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dacc601b-7d2d-4bb9-8e59-1c3225651b36
---

Amin (2026-07-02): "any project, if they learn something new and add or improve the structures design
or auditors prompts, the universal also needs to be updated."

**Why:** the bootstrap-orchestrator skill generates every future project's fleet from its templates.
A lesson captured only in the project that learned it leaves the templates stale — every project
bootstrapped afterward inherits the pre-lesson version and re-learns the class from scratch. The
universal setup must be a living system, not a snapshot of the reference repos at generation time.

**How to apply:** whenever a doctrine-loop routing lands a structure improvement (agent/auditor prompt,
rule, gate shape, brief template, doc skeleton, process step), ask "would this class bite in ANY
project?" — if yes, the SAME turn also updates: `~/.codex/skills/bootstrap-orchestrator/templates/`
(the matching template), `~/.claude/rules/` + `~/.claude/agents/` (global layer), and the sibling
project's copy (dialer ↔ CoachAI). Codified in: global [[doctrine-loop]] Discipline +
orchestrator-mode §Closed-loop learning + `~/.codex/AGENTS.md` + bootstrap SKILL.md ("Living
templates — the backflow contract", incl. the maintainer recency check: a reference repo that has
outgrown a template IS the rule having been missed) + the dialer's project doctrine-loop.md.
Precedent the same day: release-verifier degraded-Sentry-sweep + timezone-correlation classes landed
in dialer + CoachAI + template in one pass; the responsive doctrine landed in dialer + CoachAI +
frontend-rules/ui-verifier templates. Related: [[doctrine-upgrade-2026-07-02]],
[[explicit-subagent-briefs]].
