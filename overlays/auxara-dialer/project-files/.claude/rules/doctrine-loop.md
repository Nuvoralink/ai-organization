---
paths:
  - "**/*"
---

# Doctrine Loop — Dialer Adapter

**The universal `doctrine-loop` rule governs in full** — for Claude it is installed at user level (`~/.claude/rules/doctrine-loop.md`, AI-Organization control plane); Codex carries its compact twin in `~/.codex/AGENTS.md`. This adapter does not restate the three arms (PREVENT: failure → gate > rule > doc-fix; PROPAGATE: better method → captured same turn; KEEP DOCS LIVE: stale-on-sight = fix-now), the closed-loop fleet learning wiring, or the universal-backflow discipline. It binds the arms to the dialer's own capture destinations and records this project's founding anchors.

## The dialer's capture destinations (where each arm routes HERE)

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
