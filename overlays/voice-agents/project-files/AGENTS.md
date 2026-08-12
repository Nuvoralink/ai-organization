# Voice Agent Platform — Project Router

The inherited user-level engineering doctrine remains authoritative. Project detail is single-sourced under `.claude/rules/`; this file is the compact discovery router for Codex and Claude.

## Product authority

Build a provider-portable voice-agent platform whose deterministic runtime—not a provider prompt—owns session, interaction, safety, action, and vertical state. Phase 1 proves two live shapes: a Nuvo-admitted AIL appointment-booking call and a structurally non-contact sandbox. Read `platform-design/README.md` before architecture or implementation work.

## Project rules

- `.claude/rules/architecture-authority.md` — architecture, contracts, reducers, adapters, and cross-layer changes.
- `.claude/rules/voice-domain-authority.md` — voice timing, AIL booking, objections, Calendly, handoff, and outcome behavior.
- `.claude/rules/security-data-authority.md` — PostgreSQL, tenancy, PII, effects, provider calls, browser execution, and retention.
- `.claude/rules/test-intent.md` — any test, fixture, proof, mutation, or gate change.

## Fleet routing

The orchestrator is the sole dispatcher. Backend/non-visual work routes to Codex; visible work is blocked on a Claude Design reference and user approval. Use the exact crown-jewel owners below; never substitute one aggregate “domain auditor.”

- realtime interaction/playout state → `realtime-interaction-playout-auditor`
- semantic grounding and decision quality → `grounding-decision-quality-auditor`
- AIL booker parity and objection progression → `ail-booker-parity-auditor`
- Nuvo admission, telephony, disclosure, and compliance → `telephony-compliance-integration-auditor`
- browser/calendar effect integrity → `calendar-browser-effect-integrity-auditor`
- privacy, tenant isolation, and corpus readiness → `privacy-security-context-readiness-auditor`
- provider portability, fallback, and metering → `provider-portability-metering-auditor`
- source event through accepted outcome and Nuvo mapping → `source-to-action-outcome-parity-auditor`

Generic lenses remain separate: premise challenger, sprint kickoff, adversarial review, security, performance, functionality parity, user journey, release verification, doctrine drift, and the heavy test runner.

## Operational invariants

- Nuvo owns call admission and compliance authority; the voice runtime consumes an exact one-use grant.
- The sandbox carries structural `false` contact/effect capabilities; it is not a runtime flag that a model can override.
- Only registered reducers mutate runtime state. Events are tenant-bound, ordered, replayable, and writer-fenced.
- A model proposes meaning; deterministic policy validates schema, evidence, authority, safety, and release coordinates.
- Booking requires immutable terms plus a later caller authorization. The model never receives a generic DOM/browser tool.
- Every external provider sits behind a narrow adapter. Every paid attempt—including retries and fallbacks—is reserved and reconciled.
- `docs/WORK_TRACKER.md` is the single source of truth for outstanding-work STATUS — every item recorded once, its status owned there. `platform-design/implementation-plan.md`, `docs/requirements.md`, `docs/decision-log.md`, and `docs/ARCHITECTURE_BLAST_RADIUS.md` are living implementation authorities holding DETAIL, not a competing work status.

## Required gates

Run `pnpm run verify`. Read command-owned exits and nonzero test counts. No push, merge, deployment, production write, live outbound contact, live Calendly submission, billed provider call, or secret change is authorized by a green local gate.
