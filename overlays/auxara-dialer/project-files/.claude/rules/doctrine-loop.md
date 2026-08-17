---
paths:
  - "**/*"
---

# Doctrine Loop — Dialer Adapter

**The universal `doctrine-loop` rule governs in full** (always-on at user level; Codex twin in `~/.codex/AGENTS.md`). This adapter does not restate its three arms — it only binds them to the dialer's capture destinations and records this project's founding anchors.

## The dialer's capture destinations (where each arm routes HERE)

- **The single work-tracker (source of truth for ALL outstanding work)** → `docs/WORK_TRACKER.md`. Every outstanding item — bug, feature, request, unbuilt decision — appears there EXACTLY ONCE, with its **status owned there** (Amin directive 2026-08-09: one central location, no scattered or duplicate records). The detail destinations below are *referenced from* the tracker and hold DETAIL only; they never carry a competing status. **Update-on-fix:** the same change that resolves an item flips its tracker row (and the linked detail marker) — never a fix that ships while the row still reads OPEN. **Compound-capture:** every discrete ask inside a multi-part founder message becomes its own tracker row, not just the message's headline.
- **Enforceable behavior** → a rule in `.claude/rules/` (always-on or contextual), with its named fail-state.
- **A procedure** → a runbook under `docs/runbooks/`, referenced from the relevant rule (e.g. `docs/runbooks/prod-migrations.md`).
- **A reusable narrative lesson / the why** → `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md`.
- **A new default / threshold / choice** → the central registry + the decision log / an ADR.
- **A deferred correctness item** → a concrete row in `docs/BUG_BACKLOG.md` with an owner — never a silent skip.
- This hub unifies sprint-rigor §11 ("same class twice → codify"), centralization §5 (CI gates), and the journey doc. Agent-file edits land in `.claude/agents/*.md` ("Learned classes" trailers), per the universal closed-loop wiring.
- **Universal backflow:** a lesson that would bite in ANY project also updates, same turn, the `bootstrap-orchestrator` templates, the global rules/agents (`~/.claude/rules/`, `~/.claude/agents/`), and the CoachAI sibling copy where one exists. (Precedent: the release-verifier's degraded-Sentry-sweep + timezone-correlation classes landed in this repo, CoachAI, AND the template in one pass.)

## Founding anchors (all 2026-06-11, this project)

- **Prevent:** presence-only DB gate wrote test data to live Neon → centralized `dbGate.ts` + a `db-gate.test.ts` scanner that fails the build on any reintroduced raw presence check (it caught a second reintroduction within hours). A `postinstall: prisma generate` hook broke every prod deploy while CI stayed green → Dockerfile copies the schema before `npm ci` + a `docker-build` CI job that builds the real image (journey L5). Stale `origin/main` base → fetch-first wired into the workflow docs.
- **Propagate:** safe prod-migration execution via the Neon MCP at owner level → `docs/runbooks/prod-migrations.md` (readiness only — mutation authority stays with `.ai-organization/policies/action-authority.v1.json`). Refute-the-done adversarial review → the `adversarial-reviewer` agent. Silent mid-task decisions → the `decision-discipline` rule.
- **Keep docs live:** the DEC-001 + docker-fix work reconciled the stale slice-04 brief ("pending" migrations that were applied) and the stale Dockerfile comment in the same PRs that touched those areas.

*Fail-state:* a session ends and the doctrine is no better than it started — a bug-class left ungated, a good method left to evaporate in the chat, or a stale doc left to mislead the next agent.

## A founder/user request is captured DURABLY the turn it is made — chat is not a backlog

A request that lives only in the conversation evaporates at the next compaction, crash, or session
boundary. The next session starts without it, the person has to ask again, and each repetition costs
them trust that anything they say is being tracked. This is the same silent-drop class as an approved
mock with no home — but worse, because the human already believes it is on the list.

**The rule.** Any request that is not being executed in the current turn is written to a durable
authority the same turn it is made — a decision-log row (status `🟡 Requested`), a backlog row with an
owner, or a plan/sprint item. "I'll do it after this" is not capture; the artifact is. If the request
is ambiguous, capture the ambiguity and the question rather than waiting for clarity to capture
anything at all.

**Repetition is a defect signal, not a reminder.** The second time a person asks for the same thing,
the failure is not that they forgot to follow up — it is that nothing recorded it the first time.
Treat a repeat request as a process finding: capture it, and check whether other requests from the
same period were also dropped.

**Recording it is not the same as agreeing to it.** A durable row is a tracking act, not an approval or
a scope commitment. A request that should not be built is recorded and then declined *with a reason*,
which is still a durable record — a request that is silently dropped leaves nothing to disagree with.

**Verify absence before claiming it.** When someone asks "was this built or ignored?", check code AND
decisions AND mocks AND backlog before answering, and say which of those you checked. A word matching
in a different context — a "quick access" row about something else, a "bubble" that means a chat
message — is not evidence the request was captured. Name the near-miss so the answer is falsifiable.

*Fail-state:* a person asked for something more than once, and it existed in no durable artifact — so
every session began without it and each repetition looked to them like being ignored.
