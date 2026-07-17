---
paths:
  - "**/*"
---

# Doctrine Loop — Every Session Leaves the Rules & Docs Better

Purpose: the rules, gates, docs, and runbooks are a **living system**, not a fixed spec. Work continuously teaches us things — failures to prevent AND better ways to do things — and every one of those lessons must flow back into the doctrine so the *next* agent inherits it by default. A lesson learned and not captured is a lesson the next session pays for again. Always-on for every agent (Claude or Codex, implementer, reviewer, or orchestrator).

This is the enforcement hub that unifies: sprint-rigor §11 ("same class of bug twice → codify"), the user-global "wire the gate, not just the rule", centralization §5 (CI gates), and the journey doc (`docs/Journey/AI_BUILD_JOURNEY_LESSONS.md`). The loop runs in **both directions** — prevent failures, propagate successes — and keeps the docs honest while doing it.

---

## Arm 1 — PREVENT: a failure/footgun → a control so the class can't recur

When a bug, review finding, drift, or footgun traces to a **missing or weak control**, the same turn strengthens the upstream control. A pattern (2+ instances across tasks/files/agents) is a STOP-and-codify, not a quiet third fix.

Fires when:
- A review/audit catches the **same class** of issue a second time.
- A bug's root cause is "no rule/gate/doc would have caught this," not a local typo.
- An agent **drifted** because guidance was missing, stale, or ambiguous (the drift proves the control is weak).
- A footgun bit that a mechanical control could prevent (fresh-worktree setup miss, secret/PII leak, stale base, presence-only gate, raw literal at a leaf, an unreported decision, a postinstall that breaks the container build).

Fix, highest-leverage that fits: **a mechanical gate** (CI check / hook / scanner that fails the build — *preferred*) > **a sharpened/new always-on rule** with a named fail-state > **a doc/registry correction + the drift-check that keeps it true** > **a brief/template change** so future agents inherit it at dispatch. Prefer the gate over the rule, the rule over the reminder — vigilance erodes; wired controls don't.

**The fleet itself is a control surface — agents learn in a closed loop (Amin directive 2026-07-02).** When the recurrence-cause is "the auditor/reviewer that should own this class had no checklist row for it" — or an agent's standing prompt or a dispatch-brief template was ambiguous — the control fix EDITS that agent file (`.claude/agents/*.md`) / template: the class becomes a checklist row, or an entry in the agent's **"Learned classes (live log)"** trailer, so each lens grows with every catch AND every miss instead of re-learning by luck. To make the loop mechanical rather than remembered, two wirings are always-on across the fleet: (1) every agent's output contract carries a mandatory **"Doctrine-loop findings"** section — per finding, the two-question RCA lead (*why was it introduced?* and *why did no existing control catch it earlier?*) plus the smallest CONTROL fix the agent can name (a gate / rule / test shape / brief template / agent checklist), any reusable lesson from the run, and an explicit "none" when empty (never omitted); and (2) the orchestrator ROUTES every such item to a destination the same turn (gate > rule > agent-file edit > test > doc fix > backlog row with a named owner) — an unrouted item is a dropped lesson. An agent's RCA is a lead the orchestrator verifies, not a verdict. Full wiring: the user-level `orchestrator-mode.md` §"Closed-loop learning".

## Arm 2 — PROPAGATE: a good practice / better method → captured so it's reused by default

The loop is not only about bugs. When a session discovers a **better way to do something** — a cleaner method, a reusable technique, a sharper sequence, a tool used well, a decision that should become the default — that is captured too, so the next agent doesn't reinvent it (or do it a worse way). Capturing wins is as mandatory as preventing losses.

Fires when:
- An agent finds a **method that worked notably well** and should be the standard going forward (e.g. how to apply a prod migration safely without exposing a credential → `docs/runbooks/prod-migrations.md`).
- A **technique generalizes** beyond the task that produced it (a verification trick, an adversarial-review angle, a fixture pattern, a prompt shape, a tool invocation that saved real time).
- A **default should change** because a better option proved out (a tool, a sequence, a library, an interaction pattern).
- Anything an agent would want to *tell the next agent* — "do it this way, it's better."

Capture, by durability:
- **Enforceable behavior** → a rule (always-on or contextual) so it's followed, not just known.
- **A procedure** (multi-step how-to) → a runbook under `docs/runbooks/`, referenced from the relevant rule.
- **A reusable narrative lesson / the *why*** → `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md`.
- **A new default value / threshold / choice** → the central registry + the decision log/ADR.

A good practice that lives only in one session's chat is lost. Propagate it the same turn you prove it.

## Arm 3 — KEEP DOCS LIVE: docs are verified-not-trusted, fixed stale-on-sight

Docs are part of the doctrine; a stale doc actively misleads the next agent. (This session alone hit: a sprint brief that mislabeled already-applied migrations as "pending"; a gate doc claiming "WARN-only" when it always hard-failed; a Dockerfile comment naming the wrong generator output path; an API-contract doc listing error codes that don't exist; a CLAUDE.md note calling a connected MCP a "parity gap.") Treat docs the way "Verify, don't assume" treats code:

- **Verify before relying.** A doc is a *lead*, not proof. When you read a doc to inform work, sanity-check its load-bearing claims against the code/state/git. If it's stale, you've found a bug.
- **Stale-on-sight = fix-now.** Fixing a stale doc you passed through is part of the task, not a someday — small/safe: fix it in the same change; bigger: flag it (file:line) and file it. Never knowingly leave a doc lying to the next agent.
- **Behavior change → same-PR doc update.** When you change behavior, grep for the docs/comments/briefs that describe it and update them in the same commit (project-rules §16, sprint-rigor §2c). A fixed behavior with a stale doc is half-done.
- **Authority docs carry a freshness signal.** A doc claiming to be live authority makes its currency checkable — a `Status:` (live / stub / historical) and/or `Last verified:` marker — so staleness is visible, not silent. A doc still marked stub / "to be populated" must not be cited as settled authority.
- **Planning docs are dated, not eternal.** A brief/plan describes intent at a point in time; before acting on one, reconcile it against what actually shipped (git, the decision log, the schema) — don't trust "pending"/"locked"/"next" labels that history may have overtaken.

## Discipline (all three arms)

- **The fix/capture lands with the work** (or is explicitly filed with an owner — `docs/BUG_BACKLOG.md` / a spawned task / a named follow-up — never silently skipped).
- **A lesson that generalizes beyond this project updates the UNIVERSAL layer in the same turn (Amin directive 2026-07-02).** When a control fix or captured practice improves this project's *structure* — an agent/auditor prompt, a rule, a gate shape, a brief template, a doc skeleton — ask: is this class dialer-specific, or would it bite in ANY project? If it generalizes, the same turn ALSO updates the universal layer: the `bootstrap-orchestrator` skill's templates (`~/.codex/skills/bootstrap-orchestrator/templates/`), the global rules/agents (`~/.claude/rules/`, `~/.claude/agents/`), and the CoachAI sibling copy where one exists. The universal setup is a living system, not a snapshot — a lesson captured only here is re-learned from scratch by every project bootstrapped after it. (Precedent, same day: the release-verifier's degraded-Sentry-sweep + timezone-correlation classes landed in this repo, CoachAI, AND the bootstrap template in one pass.) *Fail-state:* this repo's auditor/rule/template got smarter while the universal template that generates it stayed byte-identical.
- **Name it in the report:** for a *prevent* — the `file:line` of the instance(s), the missing control, the control added; for a *propagate* — the practice and where it's now captured (including the universal-layer files when it generalized); for a *doc fix* — what was stale and what's now true.
- **This rule is recursive:** if agents keep missing one of these arms, strengthen *this* rule.

*Fail-state:* a session ends and the doctrine is no better than it started — a bug-class left ungated, a good method left to evaporate in the chat, or a stale doc left to mislead the next agent.

## Anchor examples (all 2026-06-11, this project)

**Prevent:**
- Presence-only DB gate wrote test data to live Neon → centralized `dbGate.ts` + `db-gate.test.ts` scanner that fails the build on any reintroduced raw presence check (it then caught a *second* reintroduction within hours).
- A `postinstall: prisma generate` hook broke every prod deploy (container build copies manifests before source) while CI stayed green → Dockerfile copies the schema before `npm ci` + a new `docker-build` CI job that builds the real image, so the class fails CI not prod (journey L5).
- Stale `origin/main` base → fetch-first wired into the workflow doc + CLAUDE.md + AGENTS.md.

**Propagate:**
- Safe production-migration execution via the Neon MCP at owner level (no credential exposure) + a correct Prisma ledger row + read-only verification → captured as `docs/runbooks/prod-migrations.md`; the runbook proves readiness after the human authorization required by `.ai-organization/policies/action-authority.v1.json` and never grants mutation authority itself.
- Refute-the-done-claim adversarial review with repo-wide greps + named killer-mutations → the `adversarial-reviewer` agent.
- Silent mid-task decisions → the `decision-discipline.md` always-on rule.

**Keep docs live:**
- The DEC-001 + docker-fix work reconciled the stale slice-04 brief (0002–0004 were already applied, not "pending") and the stale "into node_modules" Dockerfile comment in the same PRs that touched those areas.
