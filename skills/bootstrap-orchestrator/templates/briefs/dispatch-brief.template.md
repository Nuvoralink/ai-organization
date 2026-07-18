<!-- TEMPLATE: the 6-part dispatch-brief contract (orchestrator-mode "Dispatch briefs"). The orchestrator fills this for EVERY dispatch
     (Agent tool, Workflow agent() call, codex exec). A brief missing any part is defective — the agent will fail at exactly the gap.
     This is not instantiated into the repo; it's the shape the orchestrator writes each time. Keep as a reference in the repo's agent-prompts dir if useful. -->
# Dispatch brief — <slice/task name>

> A brief that would only work for an agent already sharing the orchestrator's context is a defective brief. Carry all six parts. Spec MUST/MUST-NOTs are quoted VERBATIM, never paraphrased.

## 1. CONTEXT (what the agent can't infer)
- The product/slice goal in plain terms.
- Settled decisions QUOTED inline (not "as discussed", not by bare ID): "<the exact decision text + its ID>".
- The crown-jewel invariant(s) this slice touches, quoted from the domain rule.

## 2. EXACT PATHS
- **Read:** <files the agent must read first, in order>.
- **Edit:** <files the agent will change>.
- **Read but do NOT modify:** <the forbidden-files list, with the cross-consumer reason each is off-limits>.
- **Output goes to:** <where — a report back, a PR, a scratchpad file>.

## 3. NUMBERED PROCEDURE (execution order)
1. <step> … including which checks to run and HOW to read their REAL exit code (`cmd; echo "EXIT: $?"` — never a piped tail's status).
2. …
<!-- If dispatched into a worktree, step 1 is the worktree-paths pre-check (see worktree-slice-preamble.md). -->
<!-- For a REVIEW / AUDIT dispatch, SPECIFY THE DIFF SCOPE EXACTLY in step 1: `git show <sha>` for a single commit, or `git fetch && git diff $(git merge-base origin/main HEAD)..HEAD` for a branch — NEVER a bare `origin/main..HEAD` against a possibly-stale local `origin/main` ref (it injects phantom deletions and the reviewer chases ghosts). Start with `git diff --stat HEAD` too, to catch uncommitted work that would be lost on merge. -->

## 4. OUTPUT CONTRACT (the report's exact sections)
The agent's final report must contain: <the exact fields — for an implementer: what shipped file-by-file, blast-radius declared vs touched, authority classification, gate outputs verbatim with real exit codes, every mid-task decision + basis, anything blocked, docs updated, the mandatory "Doctrine-loop findings" section>.

## 5. BOUNDARIES + escalation
- <concrete boundaries: read-only means read-only; no tree-mutating git for reviewer/auditor lenses; the forbidden-files list>.
- **Escalation path:** if blocked / a brief gap / an unsettled decision surfaces → STOP and report to the orchestrator; do not guess past the gap.

## 6. ACCEPTANCE CRITERIA (the agent can self-verify from its own seat)
- <the specific, checkable conditions that mean the slice is done — a passing gate with its real exit, a rendered surface measured correct, a test that bites named>.
