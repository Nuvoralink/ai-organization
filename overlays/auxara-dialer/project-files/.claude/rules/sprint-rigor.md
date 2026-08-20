---
description: Enforce rigor for every sprint and epic — Definition of Done, blast radius, source-of-truth, downstream doc updates, test ladder with named assertions. NOT "green pass" theater.
paths:
  - "docs/sprints/**/*"
  - "docs/app-plan/**/*"
  - "docs/agent-prompts/**/*"
---

# Sprint Rigor

Purpose: every sprint and epic must produce work that's been proven against product intent, not work that just compiles. A green CI pass that doesn't assert meaningful product behavior is theater — and over time it corrupts the team's sense of what "done" means.

This rule applies on every task that touches a sprint deliverable (any task referenced from `docs/app-plan/implementation/sprints/sprint-X-Y.md` or `docs/app-plan/implementation/29-ai-implementation-task-plan.md`). It also applies retroactively: if a closed sprint has gaps in DoD/blast-radius/SoT/test-ladder, those gaps are bugs to fix.

---

## 1. Before opening a sprint task

**§1.0 — Reconcile BEFORE you plan (kickoff gate; run FIRST).** At sprint kickoff, before ANY planning decision, the orchestrator dispatches the **`sprint-kickoff-auditor`** (read-only) to reconcile the sprint's plan layer against the locked decisions across five dimensions — **completeness** (every ✅Approved decision + enumerated `docs/design-system/locked-surfaces.md` element whose target IS this sprint is captured in its `## Included decision IDs` / scope — nothing silently missing), **consistency** (the plan contradicts no settled decision / ADR / ARC-006 authority tier), **stale-echo** (nothing this sprint's decisions changed or reversed still leaves a future doc / decision / sprint / comment / test calling the OLD thing), **scrapped-guard** (nothing in the decision-log ⛔ Scrapped & Dropped list is creeping back into scope), and **target-validity** (no decision targets a deleted / non-existent sprint). Its mechanical floor is `npm run gate:decision-sprint-linkage`. A **GAPS verdict BLOCKS planning** until the plan layer is reconciled — add the missing ID to the sprint's Included-IDs, file a cited decision-log / `BUG_BACKLOG.md` deferral row, correct the stale echo, or fix the Sprint column; you do not plan a sprint on an un-reconciled base. **GO** means the plan layer is clean and planning can start. This is the OPENING bookend to the `functionality-parity-auditor`'s close-of-sprint delivery-chain sweep (decided → built → wired → reachable). Origin: `PARITY-S13-APPROVED-NOT-BUILT-001` + the 2026-07-14 whole-doctrine linkage audit — ~15 ✅Approved decisions whose target sprint never listed them (the Included-IDs lists froze 2026-06-12 while decisions kept flowing), every one invisible at planning time.

The agent (Codex implementer or Claude designer) MUST read, in order:

1. The sprint doc: `docs/app-plan/implementation/sprints/sprint-X-Y.md`
2. The grounding docs the sprint is based on (named in the sprint doc's **Grounding** line — product brief / PRD / feature scope / architecture / ADRs / decision rows)
3. Every decision-log row this sprint depends on (named in the sprint doc as "Included decision IDs")
4. The competitive benchmarks bound to this sprint (named in the sprint doc as "Tied competitive benchmarks")
5. The PRD requirements (`REQ-*`) this sprint must satisfy
6. `docs/app-plan/assurance/source-of-truth-map.md` for the authorities involved
7. `docs/app-plan/engineering/15-blast-radius-and-change-risk.md` plus `docs/ARCHITECTURE_BLAST_RADIUS.md` for connected surfaces
8. The relevant always-on agent rules

If any of these are missing or stale: STOP and update them first. Do not implement against a stale plan.

**Implementation dispatch floor.** Before editing, the brief must explicitly carry the authority path, lifecycle matrix, runtime execution path, proof matrix, current consumer, and complexity budget/stop condition defined by the lifecycle hook. Slice mutating work by one authority handoff or irreversible lifecycle. Dispatch a dependent child only after the parent has a durable completion/proof receipt; run narrow serialized DB/runtime proof after each high-risk handoff. On restart, reconcile common attempts/worktrees before replacement; unchanged state is a stall. Read-only tasks are exempt from the six implementation-only sections.

## 2. Sprint Definition of Done (3-fold, applies to every sprint)

A sprint is "done" only when ALL THREE of these hold simultaneously:

### a) Product DoD — the user-visible outcome works

- Every `REQ-*` in the sprint's PRD slice has a passing acceptance test that exercises the actual product behavior (not just compile)
- Every competitive benchmark `BENCH-CON-*` (negative) tied to this sprint has a passing regression that proves we don't repeat the incumbent's failure
- Every competitive benchmark `BENCH-PRO-*` (positive) tied to this sprint has a passing assertion that proves our equivalent strength
- The user-visible surface (softphone, wallboard, admin, audit log, billing UI, etc.) shows the right state in the right role × scope
- Honest fail-closed states are exercised (not just happy paths)
- A workflow-loophole audit has been run from the user's seat: the test plan covers not only the code
  diff, but also whether the user can actually perform the intended workflow end-to-end (create/assign,
  discover, act, recover, and change their mind) without duplicating data or relying on hidden defaults.

### b) System DoD — data integrity + source-of-truth preserved

- Every persisted derived row has source-mutation handling for every applicable state (per `engineering/15-blast-radius-and-change-risk.md` lifecycle matrix)
- Every authority claimed in `assurance/source-of-truth-map.md` for surfaces this sprint touches is verified — no surface invents truth that should come from an authority
- If a backend/shared authority now exists for a previously-mocked frontend value, the old placeholder is
  retired or demoted in the same slice. A live surface may render loading/empty/error, but it may not keep
  showing the old fixture as product truth. If a visible editor/admin surface is still mock-gated, document
  that separately from the read-only live consumer.
- Cross-tenant queries are tenant-scoped at app level AND RLS-backstopped (verified by tenant-isolation black-box test)
- Telnyx event idempotency is real (`telnyx_event_id` unique constraint), not happy-path
- Stripe webhook idempotency is real
- Recording authority is durable storage backend, never `STORAGE_DRIVER` env or process state
- Compliance audit row is written for every dial (allowed AND blocked)
- AI usage events written for every paid provider call with stable stage/role/capability/provider/model/tokens/cost

### c) Drift-prevention DoD — docs + map + journey + tests updated

- `docs/ARCHITECTURE_BLAST_RADIUS.md` updated with any new connected surface this sprint introduced
- `docs/app-plan/auditability/decision-log.md` updated for every decision actually made (not just inherited)
- New ADRs written under `docs/app-plan/architecture/adr/` for architectural decisions confirmed in this sprint
- `docs/app-plan/assurance/source-of-truth-map.md` updated if a new authority surface was introduced
- `docs/app-plan/assurance/surface-authority-map.md` updated if a new user-visible surface shipped
- `frontend/docs/FRONTEND_BLAST_RADIUS.md` updated if frontend surfaces were added
- `docs/app-plan/data-and-api/09-api-and-integration-contracts.md` updated for new endpoints
- `docs/app-plan/product/27-glossary-taxonomy.md` updated for new IDs/terms/permissions
- `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md` updated if a reusable pattern surfaced (use the `auxara-dialer-journey-documentation` skill)
- `REPO_FILEMAP.md` regenerated (`npm run filemap`)

If any of those updates were skipped, the sprint is NOT done — re-open and finish.

## 3. Blast radius reasoning (per sprint task)

Before writing code, the agent declares the blast radius explicitly:

```
Blast radius for this task:
- Backend: <routes, services, workers, middleware, lib helpers>
- Frontend: <pages, components, hooks, lib/api, design-system tokens>
- Shared contracts: <DTOs, taxonomy enums, config thresholds>
- DB: <Prisma schema models, migrations, RLS predicates>
- Workers / queues: <BullMQ jobs, retry rows, dispatch rows>
- Telemetry: <events, audit_log rows, AiUsageEvent rows>
- Compliance: <gates touched, audit_log rows written, disclosure-played triggers>
- Provider integrations: <Telnyx, Stripe, calendar, DNC, AI providers>
- External consumers: <CRM webhook outbound, CoachAI handoff>
- Docs: <which docs must update in this commit>
```

If the implementation pass reveals a surface that was NOT named above, STOP. Update the declaration, then update the blast-radius doc + this rule's "lessons" section if recurring.

## 4. Source-of-truth verification (per sprint task)

The agent declares which authorities own each decision the task makes:

| Decision | Authority owning it | How verified |
|---|---|---|
| ... | ... | ... |

Example for a Sprint 1.2 power-dialer task:

| Decision | Authority | How verified |
|---|---|---|
| Did this call connect? | Telnyx `call.answered` event | `call_events` row exists |
| Was recording disclosure played? | Telnyx audio-playback event | `compliance_audit_log.recording_disclosure_played = true` |
| Was disposition correct? | Booker UI confirm | `calls.disposition_source` = `agent` or `ai_draft_accepted` |
| Did calling-hours gate pass? | `services/complianceGate.ts` (TZ math) | `compliance_audit_log.calling_hours_pass = true` |

If a decision is made by a layer that's NOT the authority per `assurance/source-of-truth-map.md`, that's a bug to fix at the authority layer — not patch at the consuming layer.

## 5. Downstream consumer updates (per sprint task)

Every authority surface this sprint creates or changes must explicitly enumerate its downstream consumers AND verify them:

```
Downstream consumers of this surface:
- API/DTO consumer: <which routes return this>
- Frontend consumer: <which pages/components render this>
- Aggregate consumer: <which reports/wallboard counters roll up this>
- External consumer: <CRM sync, CoachAI handoff>
- Audit consumer: <which audit rows reference this>
- Billing consumer: <which usage events meter this>
```

If a consumer is named but not updated, that's a stale-wiring bug.

## 6. Test ladder with named assertions (NOT green-pass theater)

Every sprint task declares, BEFORE implementation, what tests will exist and what each test PROVES. The format:

```
Tests planned for this task:

- <test-file>.test.ts
  Proves: REQ-CMP-004, BENCH-PRO-COMPLIANCE-AUDIT
  Type: integration
  Assertion: Given a power dial to an out-of-window prospect, the compliance gate blocks it before Call Control and writes a compliance_audit_log row with calling_hours_pass=false; an in-window dial proceeds and logs calling_hours_pass=true.
  Three-fold paired (if applicable): normalization (prospect TZ → IANA) + source-invariant (dialerEngine respects the gate in BOTH the allow and block branches) + DTO/mapper (compliance_audit_log carries the TZ + dialed_at_in_tz basis).
  Negative path: stale DNC scrub (>31 days) → dial blocked, reason logged, no dial placed.

- <test-file>.test.ts
  Proves: ...
```

Tests without a "Proves" line are not allowed in this codebase. The `test-intent` rule (loaded alongside this one) enforces the same gate at file level + at CI gate level.

### Test-ladder ranks (apply the smallest that proves the risk):

1. **Schema/static tests** for contracts (DTO shape, enum value, taxonomy presence)
2. **Pure-logic unit tests** for branchy logic (compliance gate math, lifecycle state machine, dials-today counter)
3. **Integration tests** for service handoffs (Telnyx webhook → projection → consumer)
4. **Tenant-isolation black-box** for every read endpoint returning object-scope data
5. **Compliance audit completeness** for every dial-touching path
6. **Three-fold paired assertions** for persisted derived state with visible UI
7. **Bounded-repair trace truth** for every AI path
8. **Source-to-screen smoke** for high-risk user-visible surfaces
9. **One live-provider rerun** post-merge for high-risk integrations (Telnyx live test sub-account, Stripe test mode)

A test that uses fixtures known to produce a passing result without exercising the actual product decision is **theater**. Reviewers must reject.

## 7. Data integrity assertions

Every sprint that writes or modifies persisted state declares the integrity invariants the tests must prove:

- **Uniqueness**: which fields are unique under which scopes
- **Referential integrity**: which FKs cascade and which are protected
- **Temporal integrity**: which timestamps are monotonic, which are immutable after set
- **Idempotency**: which mutations are safe to retry; the durable guard (DB constraint, claim row, event_id) — not UI disable
- **Append-only**: which tables are append-only (`compliance_audit_log`, `audit_log`, `call_events`)
- **Authority precedence**: when two authorities disagree, who wins (per `source-of-truth-map.md` §"Status precedence rules")

Tests must assert each of these against meaningful fixtures, including:
- Concurrent duplicate trigger
- Stale source mutation after derived row was written
- Provider unavailable / provider returning malformed
- Cross-tenant access attempt
- Token-version mismatch
- Compliance gate fail-closed (DNC freshness lapsed, calling-hours overshoot, consent missing)

## 8. Data that makes logical sense (anti-fabrication)

Every sprint that surfaces data to users (booker, manager, tenant admin, compliance viewer, internal admin) must prove that:

- The data shown is sourced from the authority that owns it per `source-of-truth-map.md`
- Honest "Unknown" / "Pending" / "Unavailable" states are exercised in tests, not just happy paths
- Fabricated values (computed from stale state, parsed from prose, made up to fill a card) are forbidden — and a test must exist that would catch a fabrication regression
- The user-visible value is `assertEquals` against a golden expectation derived from realistic fixtures, not against a mock that mirrors the implementation

## 9. Competitive benchmark tie-back

Every sprint declares which `BENCH-CON-*` (incumbent failures we MUST NOT reproduce) and `BENCH-PRO-*` (incumbent strengths we MUST match or exceed) it materially affects. The PRD slice's acceptance criteria reference these benchmarks. Tests prove them.

Example (Sprint 1.4 Compliance Gates):
- `BENCH-PRO-COMPLIANCE-AUDIT` (incumbents — GHL/Convoso/Kixie — surface compliance weakly; we make it the compliance viewer's primary surface) → test proves every dial, allowed AND blocked, writes exactly one immutable `compliance_audit_log` row with the calling-hours + DNC-scrub basis.
- `BENCH-CON-SILENT-SMS-THROTTLE` (GoHighLevel silently throttles SMS at 6% error with no rep notice) → test proves the 10DLC gate BLOCKS A2P SMS when unvetted and surfaces the state — never a silent drop.
- `BENCH-PRO-CONNECTION-BOOST` (Kixie local-presence + reputation) → test proves area-code-match auto-select picks the booker's matching assigned number (NUM-006), with per-call override.

A sprint that doesn't bind to any benchmark is a sprint that's not improving competitive posture — flag in the sprint doc with reason.

## 10. Sprint-task closure checklist

Before marking a sprint task complete, the agent verifies:

- [ ] Grounding docs read (per the sprint doc's Grounding line)
- [ ] Sprint doc read
- [ ] Every included decision-log row read
- [ ] Every tied competitive benchmark read
- [ ] Source-of-truth map consulted for affected authorities
- [ ] Blast radius declared + verified against actual diff
- [ ] Three-fold paired assertions added where persisted derived state hits UI
- [ ] Bounded-repair trace truth honored if AI path
- [ ] Tenant-isolation black-box updated for new read endpoints
- [ ] Compliance audit completeness verified
- [ ] Test ladder declared + every test has a "Proves:" header
- [ ] Negative paths exercised (not just happy)
- [ ] Downstream consumers updated (not stale)
- [ ] Workflow-loophole audit complete: actor roles, owner/assignment changes, single-user vs team-mode,
  empty/retry/exhausted states, and "change my mind later" paths were checked against the actual UI/API.
- [ ] Placeholder-retirement audit complete: any live placeholder whose backend authority now exists is
  replaced by the read model or an honest loading/empty/error state, with a gate/test preventing re-entry.
- [ ] **Locked-surface delivery ledger:** every enumerated element in each `docs/design-system/locked-surfaces.md`
  row this sprint touches maps to a **shipped surface**, a sprint **Included decision ID** (§"Included decision IDs"),
  or a **cited decision-log / `BUG_BACKLOG.md` deferral row** — an approved+locked element that is NONE of those is a
  silent-drop finding. A "pause" that lives only in orchestrator session memory is **NOT a deferral** (see §11).
  (Origin 2026-07-13, first whole-app parity sweep: the CONV-004 "SMS everywhere" set + BUX-016 communicator dock were
  approved+LOCKED 2026-06-18 but absent from S1.3's Included IDs, so 10 mock elements shipped undelivered with nothing
  in the durable record tracking them — `PARITY-S13-APPROVED-NOT-BUILT-001`.)
- [ ] Docs updated (blast-radius, decision-log, ADR, source-of-truth, surface-authority, glossary, journey)
- [ ] `REPO_FILEMAP.md` regenerated
- [ ] Focused implementation/review loops ran the named biting tests plus `npm run proof:changed`; no heavy aggregate was repeatedly spent while fixes or rebase remained.
- [ ] The finished candidate was fetched/rebased onto the freshest known `main`, focused fallout proof passed, and the committed worktree was clean.
- [ ] For any sprint-close, integration-branch, hardened backend-contract, or release-candidate closure claim, exactly one final-candidate `npm run ci` completed with a real exit 0 and exercised `gate:audit`, `verify:merge`, `test:integration`, and `docker build -t auxara-backend:ci .`. A functionality-first feedback deployment may precede this broad closure only after targeted biting proof + deploy safety and explicit human deploy authority; it is not closed until deployed functional proof passes and the queued hardening work later completes.
- [ ] **Authority-tier classified** (ARC-006 + ADR-CMP-001): every acting/contacting feature is labeled Tier **1a** (platform/carrier-enforced no-override — STIR/SHAKEN, 10DLC/toll-free, CASL mechanics, STOP) / Tier **1b** (tenant-owned compliance capability — calling hours, DNC, recording disclosure, PIPEDA, consent — safe-default ON, configurable, tenant-liable; audit logs `tenant_disabled` honestly) / Tier 2 (operational — system recommends, human decides, autonomy only by per-tenant opt-in default off) / Tier 3 (strategy/lead-lifecycle/scheduled-callback — NOT the dialer's job). Any Tier-2/3 behavior autonomous-by-default is a STOP; a 1b capability hard-enforced no-override (or one a tenant disabled but the audit shows a fabricated pass) is also a STOP.
- [ ] **Functionality-first changes remediation order, never auditor cadence.** Matching auditors are required before merge and may run in parallel during root-cause, implementation, deploy-safety, and deployed-proof preparation. Classify every finding before merge: fix BLOCK now; queue only verified bounded fail-safe FIX-NEXT residuals outside every blocker class with durable backlog rows. `release-verifier` runs immediately after every production-affecting merge and makes the original core-flow result the functional-acceptance authority; CI/readiness alone cannot pass it. After acceptance, remediate queued FIX-NEXT findings and run the one broad closure gate. At sprint/phase close, run the whole-app sweep and re-triage every OPEN `docs/BUG_BACKLOG.md` row. A green mechanical gate is neither functional proof nor sufficient broad assurance.
- [ ] GitHub Project item moved to Approved (decision surfaces) or sprint epic checklist item checked off (sprint deliverables)

## 11. When to STOP and audit

STOP the sprint and audit when:

- A test passes without exercising a product decision the test claims to prove — that false-passing test is a **P0: fix it that turn, never backlog it, never `.skip` it to green** (`test-intent.md` §4.1)
- A green CI run hides a stale consumer
- A persisted row's lifecycle wasn't analyzed for "what happens if source changes"
- Compliance gate was made AI-decided instead of deterministic
- AI was made the authority for billing/RBAC/lifecycle
- A "unknown / limited / pending" state was bypassed in favor of fabricated values
- A reviewer says "this feels like a workaround" — DO NOT defend; audit upstream
- A feature has the system autonomously deciding/acting on a Tier-2/3 concern by default (scheduling outbound, auto-mutating a number's state, autonomous SMS, deciding who to pursue) — that's an Authority-Boundary (ARC-006) violation; flag to the user immediately and fix in the same turn, never defer
- The same class of bug catches in two different sprint tasks — codify the pattern before continuing
- An **approved+LOCKED mock element** (a `docs/design-system/locked-surfaces.md` row) is being left unbuilt with **no cited deferral row** — a "pause" that lives only in orchestrator session memory is a **silent drop**, not a deferral. File the decision-log / `BUG_BACKLOG.md` deferral row (or add its decision ID to the sprint's Included IDs) the **same turn** (2026-07-13, `PARITY-S13-APPROVED-NOT-BUILT-001` — the S1.3 parity sweep found 10 such: CONV-004 dock/SMS-everywhere approved+locked 2026-06-18 but absent from the sprint plan). Locking approves the design; only a sprint Included-ID or a cited deferral row schedules/parks the build.
- A **scrapped or dropped** decision (see decision-log §"⛔ Scrapped & Dropped" — e.g. parallel/predictive dialing, AMD-to-bridge, the per-number dial cap, the tentative-hold layer) is being reintroduced into a plan, sprint, schema, prompt, or code — STOP. DLR-014's centralized passive three-state AMD seam is live and does not revive predictive use. Re-expanding killed scope is a **fresh explicit user decision**, never a latent assumption baked back in (ADR-DLR-001 reversal discipline). Deferred ≠ dropped: a parked future feature is fine; a *killed* one is not.

## 12. Sprint-rigor lessons (live log)

When a sprint reveals a recurring DoD/blast-radius/SoT/test failure mode, append a short note here naming the pattern + the prevention rule. Future sprints inherit the lesson.

**L1 — Implementer hangs/collides at the heavy DB phase → fast-check-only implementer plus a mechanical shared-service lease (2026-06-14, S1.2-C2; strengthened 2026-07-16, S1.4 B01/B02).** Two implementer agents originally died/hung around the DB-backed suite. In Sprint 1.4, a brief regression authorized parallel focused DB runs; `scripts/test-db-up.mjs` unconditionally removed fixed-name containers, so B02 recreated the shared database while B01 was testing and invalidated both proof streams. Root factors: (a) verbose integration logs flood long implementer contexts; (b) one shared `auxara-testdb`/`auxara-testredis` pair makes status-only serialization brittle across agents, restarts, and battery loss; (c) unconditional `docker rm -f` turns a coordination miss into destructive interference. **Prevention (wired):** implementers run only fast bounded checks and never invoke DB recovery. `test-db-up.mjs` atomically acquires a lease under Git's common directory before touching containers, labels both containers with its lease ID, fails closed with owner evidence on conflict, releases automatically for `test:integration`, and permits stale recovery only through the explicit orchestrator command after a live-process check. `gate:test-db-lease` proves one winner under concurrent OS processes, wrong-owner rejection, crash-residue fail-closed behavior, and handoff after release. The orchestrator/test-runner still serializes the DB suite; the lease is the mechanical backstop, not permission to dispatch competitors. Codified in `.claude/agents/sprint-implementer.md`, `.claude/agents/test-runner.md`, `docs/agent-prompts/orchestrator-handoff-context.md`, and the test bootstrap.

**L2 — Local CI is the sole broad closure gate (2026-07-31; amended 2026-08-16).** GitHub-hosted CI remains retired. `gate:local-ci-contract` proves the aggregate retains audit, merge verification, DB integration, and Docker. Functional feedback deployments use targeted proof + deploy safety + human authority first; after the deployed journey is accepted and queued findings are remediated, the complete local aggregate supplies sprint/release closure. Do not treat either a GitHub status or a full local CI pass as proof that the original user journey works.

**L2a — Heavy proof belongs at the stable closure boundary, not inside the repair loop (2026-08-15; closure-staged 2026-08-16).** The inbound-voicemail P0 repeatedly paid an 18-minute `verify` plus the full DB lane before the branch was rebased or its review/fix loop was dry; short 10–15 minute wrappers also killed healthy runs and forced restarts. The old implementer text called `gates:all` "fast" even though it includes global/Playwright work. **Prevention (wired):** implementers run exact biting tests plus diff-routed `npm run proof:changed`; the heavy test-runner accepts only a reviewed, clean candidate rebased onto the freshest known main and invokes one `npm run ci` with a 40-minute minimum process budget. `run-local-ci.mjs` mechanically refuses dirty/stale candidates, and `gate:local-ci-contract` mutation-tests that preflight and the focused-proof entrypoint. A failed final CI returns to focused repair and is not immediately replayed.

**L3 — An approved+LOCKED mock element is silently dropped when the sprint doesn't carry its decision ID and the "pause" lives only in session memory (2026-07-13, first whole-app functionality-parity sweep).** The comms/SMS surfacing was approved & LOCKED 2026-06-18 (BUX-016 communicator dock + the CONV-004 "SMS everywhere" set + BUX-019, `locked-surfaces.md` rows 27/30), but **Sprint 1.3's "Included decision IDs" (`sprint-1-3.md:47`) list none of CONV-004 / BUX-016 / BUX-019** — the enumerated mock elements (dock, SMS send-from picker, composer templates, right docked dialer, the manual caller-ID override, …) fell into the gap between the *lock* and the *plan*, and the dock's "pause" existed only in orchestrator session memory, never as a decision-log/sprint/backlog row. Ten elements shipped undelivered; the parity sweep (its first-ever run) caught them (`PARITY-S13-APPROVED-NOT-BUILT-001`). **Why no control saw it:** `gate:endpoint-wiring` sees only registry endpoints — never a locked-mock element with *no* endpoint (dock, from-line, templates), an api-method built-but-never-called (`fromNumberId` never passed), or a stale "no backend yet" shell (the wrap-up SMS limb). **Prevention (wired):** (1) §10 closure now carries the **Locked-surface delivery ledger** check — every enumerated `locked-surfaces.md` element maps to shipped / a sprint Included-ID / a cited deferral row, else it's a silent-drop finding; (2) §11 STOP now names "a pause that lives only in session memory is not a deferral — file the cited row the same turn"; (3) the `functionality-parity-auditor`'s standing checklist gains the same locked-mock-vs-build diff. A "locked" mock is not "scheduled" — locking approves the design; only a sprint Included-ID or a cited deferral row schedules (or honestly parks) the build.
