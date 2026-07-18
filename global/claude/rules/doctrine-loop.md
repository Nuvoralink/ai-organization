---
paths:
  - ".claude/**/*"
  - ".github/**/*"
  - "docs/**/*"
  - "scripts/**/*"
  - "AGENTS.md"
  - "CLAUDE.md"
---

# Doctrine Loop — Every Session Leaves the Rules & Docs Better

Purpose: the rules, gates, docs, and runbooks are a **living system**, not a fixed spec. Work continuously teaches us things — failures to prevent AND better ways to do things — and every one must flow back into the doctrine so the *next* agent inherits it by default. A lesson learned and not captured is a lesson the next session pays for again. Always-on for every agent (Claude or Codex; implementer, reviewer, or orchestrator). This is the enforcement hub unifying "same class of bug twice → codify", the global "wire the gate, not just the rule", and the journey/lessons doc. The loop runs in **both directions** and keeps docs honest while doing it.

## Arm 1 — PREVENT: a failure/footgun → a control so the class can't recur
When a bug, review finding, drift, or footgun traces to a **missing or weak control**, the same turn strengthens the upstream control. A pattern (2+ instances across tasks/files/agents) is a STOP-and-codify, not a quiet third fix.

Fires when: a review catches the **same class** of issue a second time; a bug's root cause is "no rule/gate/doc would have caught this," not a local typo; an agent **drifted** because guidance was missing/stale/ambiguous (the drift proves the control is weak); a footgun bit that a mechanical control could prevent (a secret/PII leak, a stale base, a presence-only gate, a raw literal at a leaf, an unreported decision).

Fix, highest-leverage that fits: **a mechanical gate** (CI check / hook / scanner that fails the build — *preferred*) > **a sharpened/new always-on rule** with a named fail-state > **a doc/registry correction + the drift-check that keeps it true** > **a brief/template change** so future agents inherit it at dispatch. Prefer the gate over the rule, the rule over the reminder — vigilance erodes; wired controls don't.

**The fleet itself is a control surface — agents learn in a closed loop (Amin directive 2026-07-02).** When the recurrence-cause is "the auditor/reviewer that should own this class had no checklist row for it" — or an agent's standing prompt or a brief template was ambiguous — the control fix EDITS that agent file/template: the class becomes a checklist row or an entry in the agent's **"Learned classes (live log)"** trailer, so each lens grows with every catch AND every miss. To make the loop mechanical rather than remembered: every agent's output contract carries a mandatory **"Doctrine-loop findings"** section (per finding: the two-question RCA lead + the smallest control fix the agent can name; plus any reusable lesson from the run; an explicit "none" when empty), and the orchestrator routes every item to a destination same-turn (gate > rule > agent-file edit > test > doc fix > backlog row with owner) — an unrouted item is a dropped lesson. Full wiring: orchestrator-mode §"Closed-loop learning".

**Orchestrator discipline — every reviewer/auditor finding gets a ROOT-CAUSE pass, not just a code fix (always — one instance is enough, not only on the 2nd).** When a review, audit, or adversarial pass surfaces a finding, the orchestrator's job is NOT done at "fixed the code." For EACH finding, ask two questions and act on the answers: *(1) why was this introduced?* and *(2) why did nothing catch it earlier?* Trace it to its **actual** cause — whatever KIND it turns out to be. The categories here are common **examples, not a closed menu to pick from**: an **unclear/contradictory brief** (the dispatch instruction was wrong, paraphrased a spec loosely, lost a spec MUST/MUST-NOT, or added an instruction that contradicts the spec); a **stale/ambiguous design-file or spec**; a **blast-radius miss** (a consumer / variant / call-site / shared-component mode not on the map); a **file-mapping / registry gap**; a **missing gate** (no static check — or no *rendered/visual* check — could see this class of bug); a **rule gap**. And if the real cause is **none of those** — a tooling/environment gap, a missing test fixture, a flawed sequencing/process step, a wrong default, an agent- or model-capability limit the workflow must route around, an unvalidated assumption, a verification blind spot, anything at all — **name the real cause and fix THAT**. The taxonomy is a prompt to look, never a box to tick; the only requirement is that the true recurrence-cause is found and removed. Then FIX THAT CAUSE per the ladder above (a brief-template change, a spec/blast-radius doc fix, a new gate, a sharpened rule) and **name the cause + the fix in the report**, alongside the code fix. The reviewer already proved the control was weak — a single finding is sufficient evidence; waiting for a 2nd instance is how the class recurs. *Fail-state (orchestrator):* a reviewer finding was fixed in code while its cause (the brief, the doc, the missing gate) was left in place — so the next agent reintroduces the same class.

## Arm 2 — PROPAGATE: a good practice / better method → captured so it's reused by default
The loop is not only about bugs. When a session discovers a **better way** — a cleaner method, a reusable technique, a sharper sequence, a tool used well, a default that should change — capture it so the next agent doesn't reinvent it (or do it worse). Capturing wins is as mandatory as preventing losses.

Fires when: a method worked notably well and should be the standard; a technique generalizes beyond the task that produced it; a default should change because a better option proved out; anything an agent would want to *tell the next agent* — "do it this way, it's better."

Capture, by durability: **enforceable behavior** → a rule (always-on or contextual); **a procedure** → a runbook, referenced from the relevant rule; **a reusable narrative lesson / the *why*** → the journey/lessons doc; **a new default value/threshold/choice** → the central registry + the decision log/ADR. A good practice that lives only in one session's chat is lost — propagate it the same turn you prove it.

## Arm 3 — KEEP DOCS LIVE: docs are verified-not-trusted, fixed stale-on-sight
A stale doc actively misleads the next agent. Treat docs the way "verify, don't assume" treats code:
- **Verify before relying.** A doc is a *lead*, not proof. When you read a doc to inform work, sanity-check its load-bearing claims against the code/state/git. Stale = you've found a bug.
- **Stale-on-sight = fix-now.** Small/safe: fix it in the same change; bigger: flag it (file:line) and file it. Never knowingly leave a doc lying to the next agent.
- **Behavior change → same-PR doc update.** Grep for the docs/comments/briefs that describe changed behavior and update them in the same commit.
- **Authority docs carry a freshness signal** (`Status:` live/stub/historical, `Last verified:`), so staleness is visible. A doc still marked stub must not be cited as settled authority.
- **Planning docs are dated, not eternal.** Reconcile a brief/plan against what actually shipped (git, decision log, schema) before acting on it — don't trust "pending"/"locked"/"next" labels history may have overtaken.

## Discipline (all three arms)
- The fix/capture **lands with the work** (or is explicitly filed with an owner — a backlog row, a spawned task, a named follow-up — never silently skipped).
- **A project lesson that generalizes updates the UNIVERSAL layer in the same turn (Amin directive 2026-07-02).** When a control fix or captured practice improves a project's *structure* — an agent/auditor prompt, a rule, a gate shape, a brief template, a doc skeleton, a process step — ask: is this class project-specific, or would it bite in ANY project? If it generalizes, the same turn ALSO updates the universal layer: the `bootstrap-orchestrator` skill's templates (`~/.codex/skills/bootstrap-orchestrator/templates/`), the global rules (`~/.claude/rules/`), and the global agents (`~/.claude/agents/`) — plus the sibling project's copy where one exists. The universal setup is a **living system, not a snapshot**: a lesson captured only in the project that learned it is re-learned from scratch by every project bootstrapped after it. *Fail-state:* a project's auditor/rule/template got smarter while the universal template that generates it stayed byte-identical — the next bootstrapped project inherits the stale version.
- **Name it in the report:** for a *prevent* — the `file:line` of the instance(s), the missing control, the control added; for a *propagate* — the practice and where it's now captured (including the universal-layer files when it generalized); for a *doc fix* — what was stale and what's now true.
- **This rule is recursive:** if agents keep missing one of these arms, strengthen *this* rule.

*Fail-state:* a session ends and the doctrine is no better than it started — a bug-class left ungated, a good method left to evaporate in the chat, or a stale doc left to mislead the next agent.
