---
paths:
  - "backend/src/**/*.test.ts"
  - "backend/src/__tests__/**/*"
  - "backend/scripts/*Regression*"
  - "frontend/src/**/*.test.ts"
  - "scripts/**/*.test.mjs"
  - "scripts/check-*.mjs"
  - "scripts/mock-handoff-proof.mjs"
  - "scripts/lib/**/*.mjs"
---
# Testing Guardrails

Purpose: require the right kind of test for the kind of logic being changed.

> Note: the examples below are dialer-grounded. The underlying patterns were proven on the Nuvora CoachAI repo; here they are re-expressed in dialer terms (Telnyx events, number lifecycle, AI disposition drafts, compliance gates, recordings) so implementers reason about artifacts that actually exist in this product.

## Mock factories must mirror the mocked module's export surface

When you ADD an export to a lib module, its consumers include every test file's `vi.mock('<module>', factory)` — grep for those factories and extend each in the same change. A closed factory missing the new export does NOT fail as an import error: vitest's mock guard throws at the property ACCESS ("No X export is defined on the mock"), which — when the access sits in Express middleware outside a try — becomes an **unhandled rejection + a request that never responds**, so the whole test file reads as inscrutable 5s timeouts. (Canonical: `redisRequestConnection` added to `lib/redis.ts` while `telnyx-webhook-idempotency` + `dlr-014-amd-signal` mocked it with `{ redisConnection: null }` only — 18 tests timed out in CI, 2026-07-03, PR #174.) Keep such factories explicit (they exist to avoid the real module's import side effects — `importOriginal` would construct real connections), which is exactly why they must be swept on every export addition.

## HTTP integration test bootstrapping

Any test that boots a real HTTP server on an OS-assigned ephemeral port (Express `app.listen(0, cb)`, or a bare `createServer().listen(0, cb)`) MUST go through `backend/src/__tests__/helpers/listenEphemeral.ts` — never call `.listen(0, ...)` directly. `npm run gate:ephemeral-listen` (in `gates:all`) enforces this.

Why: the WHATWG Fetch standard refuses to connect to a fixed list of ~80 "bad ports" (https://fetch.spec.whatwg.org/#port-blocking), enforced by Node's built-in `fetch` (undici). `.listen(0)` asks the OS for any free ephemeral port, and on a machine whose configured TCP dynamic-port range dips into that list (this dev box: 1024-65535 — not the 49152-65535 some platforms default to), the OS occasionally hands one back. Every `fetch()` the test then makes fails with `TypeError: fetch failed` / `Error: bad port` — not a bug in the server under test, a bad ephemeral port pick (root cause of the 2026-07-01 `sms-send-raw-number.test.ts` flake, found duplicated unguarded across 7 files). `listenEphemeral()` retries with a fresh port whenever the OS lands on a bad one; the shared `startTestServer()`/`startAuthedClient()` harness already uses it.

## The mock-handoff proof suite is a gated browser lane, not a fast unit test

`backend/src/__tests__/mock-handoff-proof.test.ts` contains fast helper/runtime checks and a heavy real-Chromium trust-boundary block. The heavy block is gated behind `MOCK_PROOF_BROWSER_LANE=1`; default `npm test` and `npm run verify` skip it while retaining the fast lane and single-launch browser primitives. Run `npm run test:mock-proof` for the complete 16-capture/15-recipe evidence lane. Sprint-close or release-candidate changes to `scripts/mock-handoff-proof.mjs`, its imported helper, or this test file MUST include that dedicated lane in addition to `npm run verify`; the guard test must prove default skip and flagged execution, with hardcoding the flag as the killer mutation.

## Rendering the softphone cockpit in tests — use the shared `renderSoftphone` helper

Any test that mounts `<SoftphonePage>` (the power-dialer cockpit) MUST render it through the shared helper `frontend/src/pages/softphone/__tests__/renderSoftphone.tsx` — never hand-roll the provider stack per file. Two exports:

- `renderSoftphone(opts?)` — renders `<SoftphonePage>` (or `opts.ui`) inside the full cockpit provider stack. `opts.routerProps` sets MemoryRouter props (chiefly `initialEntries` for the Lists "Start dialing" `listId` handoff); `opts.auth` overrides the test auth session (e.g. `{ can: () => true }` for team-run permissions). This is the default — a suite's `renderCockpit()`/`renderPage()`/`renderWithList()` should just delegate to it.
- `SoftphoneProviders({ children, auth?, routerProps? })` — the provider stack alone, for the rare case needing custom children (e.g. `CallProvider.singleton.test.tsx` mounts `<SoftphonePage>` AND `<Companion>` under one shared `CallProvider`).

**Why this is a rule (the cascade it prevents):** the cockpit's provider dependencies are a moving target. When SoftphonePage gained a new PAGE-LEVEL context dependency — DLR-016 added `useAuth` (via `useDialRun`) — SEVEN test files broke at once (`useAuth must be used within <AuthProvider>`) and each had to be patched with the SAME `vi.mock('AuthContext', …)`. A page-level provider/context dependency belongs in ONE place, not cascaded across every file that renders the page. The helper provides `AuthContext` as REAL context (an `<AuthContext.Provider>`, NOT a `vi.mock` — `AuthContext` is exported from `context/AuthContext.tsx` for exactly this), so the NEXT context dependency the page gains is satisfied by the helper alone, with zero per-suite edits.

**Scope line (deliberate — do not "fix" it):** the helper owns the PROVIDER STACK only (auth + router + toast + call). Each suite KEEPS its own `vi.mock(...)` for the hooks / SDK / api it drives (`usePreShiftGate`, `useWebRTC`/`useCallSocket` or `@telnyx/webrtc`/`socket.io-client`, `../../lib/api`, `useHotkeys`). Those are hoisted per-file, vary meaningfully per suite (captured hotkey handlers, mutable gate/socket holders, different api subsets, the singleton's deliberate SDK-level mocks that must NOT mock the hooks), and were NOT the cascade source — unifying them would flatten real per-suite differences. Keep per-case overrides in each test (that is the point of the `overrides`/`opts` params); only the shared provider stack is centralized.

*Fail-state:* a new cockpit test (or a migrated one) hand-rolls `<MemoryRouter><ToastProvider><CallProvider>` (or a `vi.mock('AuthContext')`) inline instead of routing through `renderSoftphone`/`SoftphoneProviders` — so the next page-level provider dependency breaks it along with every other file that copied the pattern.

## 1. Pure logic needs unit tests

- Use pure unit tests for branchy, I/O-free logic, e.g.:
  - recording-disclosure trigger (prospect area code → all-party-consent state → disclosure required?)
  - calling-hours TZ math (prospect-local 8am–9pm window)
  - DNC scrub freshness check (≤ 31 days federal)
  - callback-tail elapsed check (tail elapsed AND `last_inbound_at` cold AND no open conversation)
  - area-code-match outbound-number selection (destination area code → matching assigned number, with fallback)
  - AI-edit-rate calc (booker-edited vs one-keystroke-accepted disposition drafts)
  - pickup-likelihood priority ordering

## 2. Mappers need contract tests

- `CallSummaryMapper`, `RecordingMapper`, `DispositionMapper`, and the **CoachAI-handoff DTO mapper** need contract-focused tests.
- Validate DTO shape, version fields, null handling, and **historical-call compatibility** — saved calls/dispositions/recordings must stay readable for as long as they're retained (a mapper change must not break a call persisted last year). Retention is tiered + the tenant's obligation, not "forever" — see `auxara-dialer-project-rules.md` §13.

## 3. Pipeline changes need integration coverage

- Stage handoff changes need integration tests or regression scripts that prove one stage feeds the next correctly — e.g. **Telnyx Call Control event → `call_events` projection → `calls` row → Call DTO → softphone UI**.
- **Provider-boundary ref-FORMAT bridge (a value one stage WRITES and a later provider FETCHES).** When a slice changes what's stored in a field a provider call later fetches (Telnyx `audio_url` for the recording-disclosure clip, a webhook URL, a media/recording ref), a green producer-store test + a green consumer test that uses a DIFFERENT fixture format hides a dead seam — the value persists but is dead-on-arrival at the provider boundary. Add a **bridge test** that runs the PRODUCED value through the REAL consumer resolver and asserts a FETCHABLE (e.g. playable signed-URL) value reaches the provider boundary — not just that the ref persisted. (Origin: INT-D1 B-1 — the recording-disclosure clip stored a ref the resolver couldn't turn into a playable `audio_url`, dead-on-arrival at Telnyx `playbackStart`; a producer-store test + a format-mismatched consumer test were both green. Bridge: `backend/src/__tests__/disclosure-audio-resolution.test.ts`.)
- `not_transcribable` / low-confidence transcript inputs must prove **no fabricated AI disposition draft is produced** (the rep falls back to manual entry; nothing is invented to fill the gap).
- AI-disposition-quality changes need dual-lens proof:
  - **system correctness:** the accepted draft flows through AI decision → validation/repair → persistence → DTO/API → mapper → softphone wrap-up UI → analytics aggregates → reruns → tests;
  - **product quality:** the booker gets a *usable* one-keystroke-acceptable draft (correct disposition code + grounded notes), OR an honest manual-entry fallback when the transcript is too poor — never a plausible-but-fabricated disposition.
- A test that proves the app fails honestly is incomplete when safe evidence exists and a reasonable repair path should have produced a usable draft. Add a negative assertion for the shallow/empty-but-safe output AND a positive assertion for the correct, behavior-driving final output.

## Three-fold paired assertion for persisted derived state with visible UI

When a slice changes persisted derived state that has visible UI consequences (number-health/reputation status, dials-today count, lifecycle badges, wallboard counts, progress labels), one test must assert ALL THREE of:

1. **Normalization layer** — the function under test produces the expected normalized value (e.g. reputation monitoring disabled produces `healthState === 'not_monitored'`, not a pseudo-flag or stale calculation).
2. **Source-invariant layer** — the downstream consumer's branch logic respects the normalized value (e.g. State A reputation monitoring performs no provider calls, emits no health events/notifications, and cannot trigger auto-rest).
3. **DTO/mapper output layer** — the final user-visible string/value is exactly as expected (e.g. `NumberDTO.healthState === 'not_monitored'` and `reputationMonitoringEnabled === false` when no provider is configured).

Single-layer assertions silently drift: tests at the normalization layer pass while the downstream consumer or the mapper diverges. Paired assertions catch this drift class. Required for any test touching derived state that reaches the booker, manager, or admin UI.

Canonical example (dialer): the **number-reputation State A fixture** — no configured reputation provider asserts disabled monitoring AT normalization (`healthState === 'not_monitored'`), no State-A side effects AT source invariant (no provider calls, no health-event rows, no notifications, no auto-rest), AND DTO truth (`NumberDTO.reputationMonitoringEnabled === false`) at the mapper. (Number lifecycle is NUM-001; `numberHealthMonitor` only checks reputation when a concrete provider is configured.)

## Bounded-repair trace truth

When AI output goes through a bounded-repair flow (validate → regenerate failed fields → re-validate → reject if still invalid), the trace MUST reflect what the product actually rendered, not what the repair attempted. (Validation status taxonomy: `PASSED` / `REPAIRED` / `REJECTED`.)

If repair output is still invalid and gets stripped from product output:
- Product output: empty / repair stripped (the booker enters that field manually)
- Trace: `validationStatus: 'rejected'` (NOT `'repaired'`)
- Warning row: `<feature>_repair_rejected:<reason>` so downstream debugging can distinguish "repair never tried" from "repair tried + accepted" from "repair tried + still invalid + stripped"

A trace that says "repaired" while product output is empty is a debugging lie. "Repair attempted" ≠ "repair accepted" — those are different trace states with different downstream implications.

Required regression: for any feature with bounded repair, add a no-LIVE_AI test that forces the repair output to also fail validation, then asserts product output is empty AND trace status is `'rejected'` AND the warning entry is present.

Canonical example (dialer): the **AI disposition draft repair-rejected fixture** — a drafted disposition whose `disposition_code` fails taxonomy validation, where the bounded repair regenerates only that field and the repair ALSO fails validation. The test asserts: the disposition field is empty in product output (booker enters it manually), the trace is `validationStatus: 'rejected'` (not `'repaired'`), and a `ai_disposition_repair_rejected:<reason>` warning row exists. (AI disposition draft = AI-001/AI-002; the booker always confirms the final disposition per ARC-003 + ARC-006.)

Required regression for **field-scoped repair**: when a first pass has more than one invalid/missing field, repairing the first failed field is not enough to mark the whole product output `repaired`. After merging the repaired field into the first pass's good fields, re-validate the final merged object; if any required field remains missing/invalid, the final trace is `rejected` and the product output is empty. Canonical mutation: AI disposition first pass invents a disposition code AND omits the required summary; code-only repair must still reject with `missing_summary`.

Required blast-radius check for **new required AI output fields**: update the producer validator, worker fixtures, public read seam, write/provenance seam, and adjacent route/save tests together. A `passed/repaired` persisted row that lacks any newly required product field must not become a `ready` public DTO or count as AI-accepted provenance.

## Trust Testing Ladder

Choose the smallest test ladder that proves the risk:

- schema/static tests for contracts,
- synthetic matrices for source-of-truth logic (e.g. a calling-hours × prospect-TZ grid; a recording-disclosure × prospect-state grid),
- local replay from persisted artifacts (recorded Telnyx event fixtures) before live model/provider spend,
- mapper/DTO consumer tests for downstream consumption,
- browser/source-to-UI smoke when the final surface matters (softphone, wallboard),
- one final authority rerun only after local proof is clean and the question requires a live provider (Telnyx test sub-account, Stripe test mode) or deployed behavior.

Do not require every rung for every change. Do require enough proof that a sloppy version of the same fix would fail.

When persisted derived state, queues, dispatch rows, retryable provider side effects, projections, aggregates, or lifecycle statuses are involved (Telnyx CDR ingestion, recording-rehoming jobs, SMS send rows, 10DLC vetting status, DNC scrub timestamps, number-health events), tests must cover the row-state matrix. Include fresh eligible rows, stale rows after source changes, retryable failed rows, terminal evidence rows, duplicate triggers (same `telnyx_event_id`), source revoked after row creation (number flagged spam mid-sequence), and provider unavailable/disabled states where applicable. Map tests to every relevant source authority, producer/reconciliation path, state transition, unavailable/disabled provider state, provider evidence, idempotency path, final UI/output, and docs. Prove stale or retryable rows cannot produce future side effects after source changes, and prove terminal evidence (a finalized recording, a written `compliance_audit_log` row) cannot be overwritten by repair/reconciliation.

**Redis-backed counters/limiters are derived state too — their TTL is their lifecycle (security audit 2026-07-03, MEDIUM-1).** A rate-limit window, a dials-today counter, a claim key: the TTL IS the row's expiry semantics, and the classic INCR-then-EXPIRE pair is non-atomic — if the INCR lands and the EXPIRE is lost (timeout-abandoned, rejected, process restart between the two), the key lives forever and a fixed window never resets (a whole office NAT 429'd on login until an ops key-delete). Tests for any Redis-backed counter must prove **TTL exists after every failure path** (incr-lands-late, expire-abandoned, restart mid-pair) — the strongest shape seeds a TTL-less key against a real Redis and asserts the next request self-heals it. Prefer an atomic Lua op (INCR + set-TTL-if-absent) or `EXPIRE … NX` over the split pair; canonical fixture: `rate-limit-fail-closed.test.ts` §"TTL self-healing against a real Redis (MEDIUM-1)".

**BullMQ custom job IDs are an encoding boundary for arbitrary provider input (production incident 2026-07-10; review closure 2026-07-11).** BullMQ reserves `:` and rejects colon-bearing custom IDs, but external/provider IDs may legitimately contain colons, Unicode, or extreme lengths. Never reject a valid webhook solely because an internal queue delimiter disagrees. Every producer uses `lib/bullmqJobId.ts`, which deterministically hashes byte-length-prefixed arbitrary parts to one bounded colon-free key; producer tests make their fake reject a colon in the FINAL built ID and feed the real builder messy provider values. `gate:bullmq-job-ids` enumerates production `jobId` properties and rejects dynamic helpers that bypass the builder. Killer mutations: restore `system:<job>:<tenant>`, reject `provider:event:id` at the builder, or bypass the builder; gate + messy-input liveness tests go red.

**A TTL exclusion that guards an external side effect needs renewal, an immediately-before-side-effect fence, and a bounded operation (review closure 2026-07-11).** Acquire+TTL+release alone is unsafe: preparation or network delay can outlive the TTL, allowing pause/revoke to acknowledge before the stale owner submits. The owner must CAS-renew while active, atomically prove/extend ownership immediately before the irreversible request, and bound that request strictly below the restored TTL. Loss of ownership fails before submission. A timeout after possible provider receipt remains indeterminate evidence; never rewrite it as a definite failure. Tests use fake time/controlled concurrency to expire or replace the owner and prove zero provider commands begin after acknowledgement. This pattern is sound ONLY when the process cannot pause beyond the TTL unobserved AND the provider offers a reconciliation/fencing handle (e.g. Telnyx Call Control's `retrieveCallStatus` by call-control-id, used by `dialRunRecovery`) — so a stale owner's effect can still be discovered and reconciled.

**When a process can be arbitrarily SUSPENDED past the TTL AND the provider exposes no idempotency/fencing key, a TTL lease CANNOT be the durable safety authority — use a durable DB marker released only by proof (2026-07-17, Sprint 1.4 B01, Journey L25).** A VM pause / battery-resume / OS stall / `SIGSTOP` between the fence and the side effect (or between provider acceptance and the settlement write) can outlive ANY TTL, and the holder cannot detect it. If the external effect has no idempotency/fencing key to reject a late send (Telnyx **Messaging** — unlike Call Control — offers none), a revocation can acquire the expired lease, acknowledge, and commit while the stale process then submits *after* the acknowledgement, and nothing at the provider boundary can undo it. When "no first effect after an acknowledgement" is a hard invariant here, the blocker must be **durable DB state that outlives any process pause** (a row, not a lease — `sms_tcr_submission_handoffs`), inserted in a short authorization transaction before the effect, observed under the same tenant lock by every revocation writer (which refuses to acknowledge while it exists), and cleared ONLY by proof of settlement or conclusive signed/provider terminal evidence — NEVER on elapsed time. Elapsed time makes the marker `indeterminate` (preserve the blocker, reconcile from terminal callback/provider/operator evidence), never fabricates success, and never auto-clears. Release of the shared marker is gated on the owned row's own state transition, so a failed cleanup cannot discard the ownership evidence a deferred revocation depends on. Tests prove BOTH interleavings (revocation-first → denied, zero provider; marker-first → writer defers, exactly one provider attempt, revocation applies after settle), the post-authorization/pre-provider suspension (indeterminate → marker preserved), and stale recovery (marker preserved, honest indeterminate, no auto-clear). The killer mutations: clear the marker on the indeterminate/stale path, drop the writer's `refuse-while-marker` check, or reintroduce a TTL lease as the safety authority.

**A database authorization lock that commits before provider I/O does not fence the post-commit/pre-effect gap (B02 review closure 2026-07-17).** Keep provider calls outside database transactions, but persist an exact, write-once effect handoff in the same short authorization transaction. Every release, replacement, revocation, and generation writer locks the same durable authority row and refuses acknowledgement while that handoff remains `submitting` or `indeterminate`; Redis TTL/liveness must never erase or solely represent it, and Redis/provider awaits never occur inside that database transaction. Test both interleavings for every provider target: release-first leaves the target mock untouched with definite no-effect evidence; handoff-first remains unacknowledged across owner death and Redis expiry until provider settlement or conclusive reconciliation, with exactly one attempt. A stale generation may receive an already-inactive acknowledgement, but it must not cancel work owned by a newer generation. Killer mutations: clear the marker on claim expiry, authorize from Redis alone, or let issuance/election/revocation bypass the shared row lock.

## 4. Permissions need explicit tests

- Test booker vs manager visibility.
- Test manager-only surfaces do not leak to a booker — e.g. a booker cannot read another booker's recordings; a manager with only `monitoring.listen` cannot barge; a Compliance Viewer cannot delete a recording.
- Test removed-team-member access is blocked (and `auth_token_version` revocation kills the old session).
- Test cross-tenant probes return 404 (do not reveal object existence) AND the RLS predicate is the backstop.

## 5. Seed data needs validation

- Seed scripts (system roles + permission keys, default compliance-as-config, demo tenant) should have validation checks for expected counts, states, and conflict scenarios.

## 6. Visual surfaces need regression coverage

- State-heavy and real-time surfaces should have visual regression coverage once the UI exists:
  - call-state transitions (idle / dialing / ringing / connected / wrap-up)
  - wallboard live states + the "stale — reconnecting" state (a frozen counter must announce itself, never silently lie)
  - number-health / lifecycle badges (not_monitored / calculating / clean / flagged / unknown; active / cooling / inbound_only / released)
  - AI-drafted vs booker-edited disposition distinction (provenance must be visible)

## 7. Security, reliability, and deployment gates

- Auth/session changes need the dialer's security/auth-hardening regression + a preflight security check (once those scripts exist; until then, document the manual check performed).
- RBAC or tenant-scope changes need the focused RBAC/role-policy regressions + the **tenant-isolation black-box suite** (cross-tenant probe, pooled-connection reuse per ADR-AUTH-005) and, when UI-visible, an authenticated manager smoke.
- Telnyx-event ingestion, recording finalization, queue, or realtime wallboard changes need a regression that proves the final user-visible state is driven by the intended source of truth (Telnyx events / `recordingStorageAuthority`), not only by a helper or fallback.
- Deployment-safety changes need a build plus the relevant pre-deploy guard (`/api/ready` covering DB + queue + Telnyx WebRTC signaling reachability) or a documented reason why the guard is not applicable.

## 8. Scanner-gate meta-tests must prove the gate's SCOPE property, not only its flag/pass branches

A meta-test for a `scripts/check-*.mjs` scanner gate that only enumerates the gate's visible branches (flags a seeded violation / passes a sanctioned shape / honors the escape hatch / honors the mask) can stay green while the gate's **scope property** — the thing that distinguishes it from a naive whole-file grep — silently regresses. (Caught 2026-07-03 on `check:call-drop-gate`: mutating `enclosingFunctionBody` to always fall back to the whole-file scan kept all branch fixtures green, while the gate would never again flag anything in a marker-rich file like `SoftphonePage.tsx` — the site of most L13 instances.)

- Every scanner-gate meta-test includes at least one **scope-boundary fixture**: the sanctioning condition present in the file but OUTSIDE the scope the gate claims (another function / another block / another config section) → the violation must STILL flag.
- **A scope-boundary fixture is needed for EVERY skip/allow/exclusion condition, not just the gate's core scope.** A gate typically has several sanctioning conditions — a history/past-tense tolerance, an escape marker, a dir/archive exclusion, a proximity/clause window, the core enclosing-scope resolver. Each is a place the gate can be too GENEROUS and silently miss a real violation, so each needs its own boundary fixture: the sanctioning condition present but NOT actually covering the violation → the violation must still flag. Testing only "the condition, when it legitimately applies, skips" proves the pass branch, never the over-generous branch. (2026-07-07, `check:doc-registry-refs` — the **2nd** instance after call-drop-gate: history-tolerance skipped the WHOLE LINE, so a live COPY ref sharing a dense blast-radius row with an unrelated "retired/removed" went unchecked; the meta-test proved past-tense-skips-a-note but had no fixture for "history word in a DIFFERENT clause than a live ref → still flag." Fix was clause-scoping + that exact boundary fixture.)
- Name the partial-weakening mutation it kills ("weaken the scope resolver to its permissive fallback → this case fails"; "revert the clause-scoped skip to a whole-line skip → the different-clause case false-skips"), not only the full-neutering one.
- Cheap adversarial probe for any gate slice: run the REAL gate CLI against a purpose-built scratchpad scaffold that isolates the scope property — it both confirms the property is live and exposes the fixture gap in one move.
- **A scanner-gate WIDENING must NAME the residual blind spots the widened gate STILL cannot see — especially the shape of the gate's OWN origin bug — in the gate header + the backlog.** Adding an entry token / scope closes one gap, but the scanner's inherent limits (intra-file, non-interprocedural, regex-bounded) remain; a reader of a "✅ HARDENED" note reasonably assumes the class is now fully covered. (2026-07-08, `check:tx-rollback` widened `TX_ENTRY` for the `runInTenant` alias but STILL cannot see an expression-body delegation `runInTenant(t, (tx) => helper(tx))` — the exact shape of its origin bug `smsSend.validateAndClaim` #13; the adversarial reviewer flagged the gap as unnamed, and it was then documented in the gate header + backlog rather than left implied.)
- **An over-generous CLASSIFIER arm (comment-line / string / identifier detector) is itself a skip/allow condition and needs its own boundary fixture (3rd instance of the rule above).** (2026-07-08, `check:tx-rollback`: `isCommentLine`'s loose `endsWith('*/')` arm misclassified a `code(); /* x */` CODE line as a comment, so the block-above escape scan could walk PAST a real statement and over-suppress a violation — reviewer F2. Fixed by dropping the loose arm + a "token above a trailing-block-comment code line → still flags" boundary fixture.)

## 9. Page-orchestration + bounded-loop test shapes (adversarial-review learned classes, 2026-07-05)

Two coverage classes the AI-disposition-draft slice ("Booker AI Assist v2") exposed — a hook-unit + presentational-component test pair proved each layer but left the *wiring* and the *loop safety* unexercised, so the highest-risk mutations would have sailed past CI green:

- **Page/orchestration wiring gets a page-level integration test.** When a page wires a NEW `hook → handler → api` chain — especially provenance / source-param derivation, or a `setState`-then-read handler that must pass EXPLICIT values (not read state) — a hook-unit test + a presentational-stub test do NOT prove the wiring. Add ≥1 page-level test that mounts the real page, drives the real handler (a click), and `assertEquals` the api was called with the DERIVED value (e.g. `saveDisposition` called with `source: 'ai_draft_accepted'`). This is the frontend analog of test-intent §4's route-authority rule (a handler's derivation covered only by unit tests that can't reach it). *Killer mutation to name:* the handler passes the wrong source / reads stale selection state → the page test goes RED while the unit + presentational tests stay green.
- **Every bounded poll/retry loop carries a fake-timers test proving the cap AND the stale-guard.** A loop with a `MAX_POLLS`/cap + a run-token stale guard (loop-discipline: bounded + no misattribution) needs: (a) a fake-timers test that transitions through the transient state (`generating → ready`) across a real poll interval, and (b) a stale-response test that re-targets the hook mid-flight (new id) and asserts the LATE previous-target response is discarded (never overwrites the current target). Immediate `mockResolvedValue` tests prove the terminal states but leave the poll machinery + the run-token guard — the load-bearing safety — untested; removing either would pass green.

*(Universal-layer candidate: both classes generalize to any project with a page-orchestrates-provenance shape or a bounded client poll — propagate to the global `adversarial-reviewer` "Test bite" checklist + `testing-strategy-and-tdd` when next touched.)*

## 10. Converging fail-closed branches need a DISCRIMINATING assertion (adversarial-review learned class, 2026-07-08)

When a fail-closed resolver/gate has MULTIPLE reject paths that converge on the SAME user-visible outcome (same decision + same status/reason), a test that asserts only that outcome cannot prove WHICH path ran — so a regression that fires the wrong path (e.g. a broken tenant-scope guard rejecting a ref that SHOULD have reached storage-verify) still passes green, because the guard-reject and the verify-then-fail branches produce identical assertions. The test must additionally assert the **discriminator** — a side-effect that differs between the paths (e.g. `expect(verifyCalled).toBe(true)` proves the guard PASSED and storage-verify was reached; `expect(verifyCalled).toBe(false)` proves the guard REJECTED before any storage read). Relying on a SIBLING case to cover the other path leaves each individual case non-self-proving. (Origin: 2026-07-08, `recording-decision-db.test.ts` case (f) — object-missing → `disclosure_audio_unavailable` — shared its exact assertion with the off-tenant-prefix guard-reject case (g); both yield `skip/unavailable` + `signCalled===false`, so (f) could not on its own distinguish "verify saw missing" from "guard rejected before verify." Fix: (f) asserts `verifyCalled===true`.) *Killer mutation to name:* a prefix-guard regression that rejects a legitimate tenant-scoped key → the outcome-only test stays green while the discriminator assertion goes RED. Reviewer-enforced (no static gate — distinguishing converging branches needs data-flow analysis). Generalizes to any multi-reject-path fail-closed primitive — universal-layer candidate for the global `adversarial-reviewer` "Test bite" checklist.

## 11. Mutation-layer hooks every consumer mocks + RLS-masked isolation-test killer mutations (People-admin 4-auditor review, 2026-07-12)

Two coverage classes the People-admin slice exposed:

- **A mutation-layer hook that EVERY page/component test mocks needs its own real-`renderHook` derivation test.** When the load-bearing derivations — call ORDERING (add-role-then-remove so the person is never role-less), an enum→lifecycle/param MAPPING (unassign fate `'rotate'` → clear-assignment + `transition(INBOUND_ONLY)`; `'pool'` → clear-assignment only), a request-field derivation (buy sends the pick's `country`), or partial-failure resilience (`Promise.allSettled` + always-`reload`) — live in a hook (`usePeopleActions`) that every page test does `vi.mock('../usePeopleActions')`, the page tests prove the components *call* the actions but never that the actions *do* the right thing. This is §9's sibling: there the derivation is in the page handler; here it's in a MOCKED hook. Required: ≥1 test mounting the REAL hook (`renderHook` + real providers, `api` mocked) asserting the api was called with the DERIVED value/order. *Killer mutations to name:* swap add/remove order; drop the rotate assignment-clear (a "Remove" that doesn't remove); revert `allSettled`→`all` (a partial buy billed while the toast says "couldn't") → the real-hook test goes RED while the page tests stay green. (Origin: People-admin `usePeopleActions` shipped with only the 13 `vi.mock`'d page tests; the rotate-doesn't-remove correctness bug + the partial-buy-billing gap were both in the untested hook.)

- **A tenant-isolation black-box test over a `FORCE ROW LEVEL SECURITY` table CANNOT prove the app-layer predicate — its cross-tenant assertion is RLS-masked.** On a FORCE-RLS table read inside `withTenant(tenantId)`, dropping the app-layer `where:{tenantId}` does NOT leak (RLS still scopes), so a header naming "omit the app predicate → leak" as its killer mutation overclaims a mutation the test can't catch. Prove the app predicate INDEPENDENTLY with a raw-handle probe querying with the RLS context absent and asserting zero rows (the `rls-bootstrap.test.ts` pattern), and name only killer mutations the black-box test actually catches (the AuthZ-gate regression; the NET app+RLS isolation). *Killer mutation to name:* disable the table's RLS policy → the raw-handle probe goes RED (the black-box cross-tenant case would NOT). (Origin: `people-roster.test.ts` claimed the app-predicate drop as its killer mutation; the cybersecurity-auditor caught it RLS-masked.)

*(Both generalize — universal-layer candidates for the global `adversarial-reviewer` "Test bite" checklist + the global testing rule.)*

## 12. Normal tests default-deny public network egress (B06 live-request incident, 2026-07-17)

A provider test with a missing fake made a real unauthenticated Calendly request and received 401.
Mocking the intended call is insufficient: another SDK, transport, or error branch can bypass that
mock. The backend test setup therefore installs one process-wide egress boundary before test modules
load:

- block public `globalThis.fetch` and direct public `node:net.Socket.connect`;
- allow loopback and local IPC so DB/Redis/test servers remain real;
- provide no casual environment escape in the normal runner; live-provider proof is a separate,
  explicit, credential-scoped lane and stays human-gated when billed or mutating;
- test the guard itself with public-fetch and public-socket attack fixtures plus loopback liveness.

Killer mutations: remove the fetch wrapper -> the fetch attack escapes; remove the socket wrapper ->
the direct-socket attack escapes. Both must redden `test-network-boundary.test.ts` independently.

## 13. Delivery-chain liveness: a recurring job, a provider binding field, and a pre-tenant lookup are each DEAD until proven live (B06 root remediation, 2026-07-17)

Three delivery-chain classes shipped "complete" in B06 with full implementations, clean types, and a
green suite — and all three were **structurally unreachable in production**. Unit tests proved each
piece worked; nothing proved anything ever *called* it. Each needs a liveness test that fails when the
wiring is removed, not merely when the logic is wrong.

- **A recurring job is dead until its registration is asserted.** `findWatchChannelsDueForRenewal` and
  `reconcileGoogleConnection` were fully implemented, correct, and **registered in no scheduler**. Every
  Google watch channel would simply expire after 7 days and push would stop, permanently; a dropped
  push would strand an attempt as `indeterminate` forever. Required: a test that asserts the job is
  registered in the EXISTING scheduler (`registerSystemWorkerSchedules`) with its deterministic
  `bullmqJobId`, AND that the worker dispatches it. *Killer mutation:* delete the `queue.add` for the
  job → the registration test goes RED. Canonical: `s14-b06-booking-schedule-liveness.test.ts`.
  *(The discipline is symmetric: when a job is DEFERRED, the same liveness test is INVERTED to assert it
  is NEITHER registered NOR dispatched, so a premature re-introduction is caught — e.g. the booking watch
  sweep was inverted for the 2026-07-21 embed-only unwind, PR #256, native booking deferred to INT-004;
  killer mutation there: re-add the `queue.add` → the test goes RED.)*

- **A provider binding column is dead until a WRITER is proven.** `calendar_provider_connections`
  modelled `webhook_signing_key_secret_ref` + `webhook_subscription_uri` in migration 0043 and
  **nothing ever wrote either**. So `resolveWebhookConnection` always read a null key, every Calendly
  delivery failed verification, and the whole invitee.created/canceled path was decoration — on top of
  which no subscription existed, so Calendly was never going to deliver anything at all. Required: for
  any column a provider read later depends on, a test that runs the real writer and asserts the value
  PERSISTED, plus a bridge test that feeds the persisted value through the real consumer. This is the
  ref-FORMAT bridge rule (§3) applied to *existence*: a column with no writer is worse than a wrong
  format, because every test that mocks around it is green.

- **A pre-tenant lookup must be tested AS THE RUNTIME ROLE, never as the owner.** `resolveWebhookConnection`
  and `validateGoogleNotification` query a `FORCE ROW LEVEL SECURITY` table with no `app.tenant_id`
  set (a webhook cannot name its tenant — the row is what tells us). Under FORCE RLS the predicate is
  UNKNOWN for every row, so `dialer_app` reads **zero rows** and both webhook paths are dead. The
  tests passed because they connected as the table OWNER, for whom the shipped behaviour differs.
  This is the mirror of §11's RLS-masking class: there RLS HID a missing app predicate; here RLS
  KILLED a legitimate query, and the owner connection hid it. Required: any lookup that intentionally
  runs without a tenant context is proven under the real `dialer_app` role — a direct table SELECT
  returns zero, the SECURITY DEFINER function returns the exact binding, and `pg_proc`
  `proconfig`/`proacl`/`prosecdef` are asserted. *Killer mutation:* point the helper back at the table
  → the dialer_app-role test goes RED while an owner-role test stays green. Canonical:
  `s14-b06-booking-db-proof.test.ts` §"pre-tenant lookup under dialer_app".

*Fail-state:* a slice shipped a worker, a provider binding, or a pre-tenant lookup that no test ever
exercised through its real runtime wiring/role — so "implemented", "typed", and "green" all held while
the feature could not run at all in production.

## 14. Scanner-gate OK messages enumerate only mechanically proven scopes, with counts (B04 remediation, 2026-07-19)

A scanner's green line is a load-bearing claim. It must enumerate each distinct scope the gate really
checked and print a count for that scope (for example: fixed files marker-checked, production files
AST-parsed, structural candidate chains inspected). It must also name the important adjacent shapes it
does not certify when a broad phrase such as "repo-wide" or "authority" could imply otherwise.

Required meta-test: invoke the real CLI, derive the expected counts from the exported scope helper, and
assert each count plus the scope-limitation sentence appears. A static assertion against a duplicated
success string is theater. Killer mutations: drop the AST walk while retaining the production-file
count, or change the OK line back to a class-wide claim; the CLI-output test must go red.

Origin: `check-media-selector-authority.mjs` scanned production files for one exact source literal but
reported the whole split-brain class clean. Renaming the local, reversing nullish precedence, or using a
multiline alias bypassed the check while the green sentence still sounded comprehensive.

*Fail-state:* a gate prints "repo-wide authority clean" after checking only one token/literal shape, or
prints an uncounted scope that a reviewer cannot independently reconcile with the scan.

## 15. Authority gates cover equivalent selection shapes, and compatibility drains never certify success (B04 final review, 2026-07-19)

A source-authority invariant expressed as “v2 first, v1 fallback only” is not an operator-specific
rule. Checking only `??` leaves the same split-brain selection reachable through `||`, a conditional
expression, or a direct if/return chain. A scanner widening must enumerate the exact AST/control-flow
shapes it covers, add a new-unlisted-file sole-v1 and v1-first killer mutation for each shape, and add
the v2-first counterexample. Name residual shapes (switch/loop/assignment/interprocedural) in the gate
header and green line; do not imply a general control-flow proof.

Keep a predicate ledger for each claimed shape: precedence operands are only expressions that can
become the selected/returned value; boolean conditions are control evidence, never selected media.
Use comparable fixtures with identical returned branches under both an authority-bearing guard and an
unrelated flag. Killer mutation: include the condition in the operand list or skip a chain because its
condition has zero/multiple authority kinds — the unrelated-flag v1-first case must still go red.
For every detector entry predicate, also remove each optional structural operand in a fixture: an
absent fallback is absence of evidence, never permission to skip inspecting the remaining return.

Likewise, a compatibility projection may be nullable while the canonical selector is healthy. Client
success and configured state must prove the exact canonical selector id returned by the authority;
they must not require or derive from the drain-only ref. Pair the positive null-ref liveness case with
a mismatched-selector negative case. Killer mutations: require `compatibilityRef !== null`, update UI
state from that ref, or accept a select response whose canonical id differs from the requested id.

When an adoption/status row changes in a registry, living authority prose that names that row needs a
bounded reverse-drift meta-test: seed stale pending/not-enforced prose into each named authority and
prove the real CLI fails, then seed corrected prose and prove it passes. Derive root/value identity from
the registry; do not retype a second authority list in the gate.

*Fail-state:* a v1-first equivalent operator remains green, a null compatibility ref makes a canonical
selection look failed/unconfigured, or a resolved registry adoption stays “pending” in living authority
docs with no gate capable of noticing.

## 16. Test-runner totality: zero discovery is a failure, and root proof reaches every test-bearing workspace (2026-07-19)

Every permanent test/proof command must fail when its selection discovers zero files. Never use
`--passWithNoTests` in a workspace script or dedicated runner. The root `test` aggregate explicitly
invokes every workspace that currently contains test files; `--workspaces --if-present` is not proof,
because it lets a missing workspace test script disappear successfully. Focused paths are relative to
the selected workspace, and their proof includes the runner's own nonzero discovered-file and
executed-case counts—not only exit 0.

`gate:test-runner-totality` derives test-bearing workspaces from the live file tree, requires a test
script for each, proves the root aggregate reaches each one, inspects referenced dedicated runner
sources, and reports its derived counts. A workspace with zero test files may omit a test script; the
moment its first test lands, both the workspace script and root reachability become mandatory.

Killer mutations: reintroduce `--passWithNoTests`, remove a test-bearing workspace's test script, or
drop that workspace from the root aggregate—the isolated gate meta-test must go red. Counterexample:
a source-only workspace with zero test files does not need a placeholder runner.

*Fail-state:* a typoed workspace-relative focus prints “No test files found” and exits 0, or root CI is
green while a test-bearing workspace was never invoked.

## 17. DB fixture identity is per run unless stable identity is the behavior under test (2026-07-19)

DB tests must not hardcode globally unique IDs—or low-entropy values behind a unique constraint—unless
the test explicitly proves stable identity. Use a per-run UUID/high-entropy value and retain cleanup,
so residue from an interrupted process cannot make the next run fail in `beforeAll` before the behavior
under test is reached. The rerun proof is: interrupt after insert/before cleanup, run the suite again,
and the new fixture identity must coexist while cleanup still removes what the current run owns.

Killer mutation: replace the per-run UUID with a fixed unique value, seed that value as interrupted-run
residue, and rerun—the mutated fixture must collide. Counterexample: a test specifically proving
idempotent replay of one stable provider event ID should keep that stable ID, because sameness is the
contract it exercises; isolate it from unrelated global fixture identity.

*Fail-state:* an interrupted prior test run poisons a later run through a fixed UUID before any product
assertion executes.

## 18. Multi-operation mocks dispatch by observable identity; exact inputs are checked at construction (2026-07-19)

When one mock can receive multiple queries or operations, dispatch on observable operation identity
(an operation name, stable query marker, tagged statement, or distinguishing arguments), return the
contract-correct payload for every expected branch, throw on every unknown branch, and assert each
expected branch's liveness. Never use one catch-all response for incompatible contracts or call order
as a substitute for identity. When an authority-bound input has an exact key set, apply `satisfies` or
an explicit annotation at construction; add an exact-key assertion when runtime shape is part of the
contract. Assigning the object to an intermediate variable must not bypass stale-key detection.

Killer mutation: replace the dispatcher with a catch-all response, or add an unhandled operation; the
test must turn red through a contract mismatch or the unknown-branch throw. Counterexample: a mock with
exactly one possible operation does not need artificial dispatch; it still asserts that operation's
liveness and payload.

*Fail-state:* incompatible operations silently consume one shared fake payload, or a stale extra input
key survives because construction was not checked against the exact authority shape.

## 19. Source-ordering sentinels track current authority anchors; SQL assertions prove mandated totality (2026-07-19)

A source-ordering sentinel is a companion consumer of the production authority names and effect
entrypoints it orders. When an authority is replaced, the same change updates every companion
sentinel and repo-wide retirement scan. Bound the scan to the actual function or block under test,
enumerate every current authority-access and external-effect anchor, and assert that the function
start, function end, guard, and EACH current anchor exist before comparing their positions. Never
slice to end-of-file: a later unrelated function can otherwise make a deleted local effect look live.

Killer mutations: remove or rename one current provider/effect anchor, delete the bounded function-end
anchor, or move provider access above the fail-closed guard; the sentinel must turn red in every case.
Counterexample: a lower-level adapter factory may remain valid inside its adapter module, but it is not
the right ordering anchor after the production caller has moved to a provider-bundle authority.

SQL structural assertions likewise preserve the exact safety shape, not a weaker substring. Where a
constraint is mandated to reject SQL `UNKNOWN`, require the total form `CHECK ((predicate) IS TRUE)`.
Asserting only `CHECK (predicate)` both false-reds on the intentional stronger migration and would
normalize away the three-valued-logic protection. Killer mutation: remove `IS TRUE`; the companion
test must fail because PostgreSQL `CHECK` otherwise accepts a null/unknown predicate.

*Fail-state:* verification searches a retired caller anchor, treats a missing current effect as an
orderable `-1`, finds an unrelated later-file anchor, or accepts a non-total SQL CHECK where totality
is part of the migration invariant.

## 20. External-ledger proof contracts must be typed, actionable, live, and self-routed (2026-07-20)

When production runs an adapter or normalizer and then feeds its output into a validator, at least one
test must compose those real stages. Separate adapter tests plus validator tests built from the
validator's own expected-fixture factory do not prove the join: a renamed field, discriminator, enum,
or null shape can remain green on both sides while production rejects every normalized result. Use a
fixed provider/wire fixture with the real adapter, pass that exact output to the real validator, and
assert the final contract result. Killer mutation: change the adapter to emit the provider's raw type
instead of the validator's contract type; the composed test must fail. Canonical:
`check-project-ledger-drift.test.mjs` §"fixed GraphQL adapter output composes into the real ledger validator".

Cardinality does not establish inventory membership. A required registry, card set, state set, or
preflight set must assert every exact member (or derive the expected set from a separate upstream
authority) and compare the sets in both directions. A count may accompany that proof but can never
replace it: swapping one required key for an unauthorized key preserves the count. Include the
counterexample outside the governed scope so exactness does not become an accidental whole-system
claim. Killer mutation: replace one required member with another same-shaped key; the set assertion
must fail. Canonical: `check-project-ledger-drift.test.mjs` §"the checked-in offline contract covers the exact Sprint-1.4 authority inventory".

A terminal `Done` state needs immutable evidence of delivered bytes, not a mutable coordination
pointer. Bare issue/PR numbers or URLs, ordinal snapshots, status prose, and short hashes are not
completion evidence. Accept a full commit SHA/commit URL, or a repository-relative
artifact/migration/capture path paired with a full content or commit digest. Keep field presence
separate from field equality: a required workflow field may need to be nonblank without pinning its
current value. Canonical: `check-project-ledger-drift.test.mjs` §"Done evidence rejects mutable links, ordinal snapshots, short hashes, and unbound paths" and `check-project-ledger-drift.test.mjs` §"included decisions require a nonblank Status without pinning its delivery value".

A privacy-safe live audit still has to locate the repair. Emit a contract-sourced authority key,
field, expected value, normalized actual class/value, missing section, or required token as allowed by
each issue type. Never emit bodies, arbitrary external strings, URLs, field values, or provider error
text. Preserve one detail row per card so two same-code drifts cannot lose correlation. Canonical:
`check-project-ledger-drift.test.mjs` §"the safe live report preserves actionable field drift correlation across two cards".

A control is not self-enforcing unless edits to its implementation, mutation test, and citing rule
route through the exact gate that proves it. The gate command itself runs its meta-test before its live
check. A cited test section is live only when declared by an executable test/it/describe form:
unconditional skip/todo/disabled and x-prefixed aliases do not count; conditional skipIf/runIf does.
Canonical: `rule-test-citations-gate.test.ts` §"FAILS when the only matching section is unconditionally skipped, todo, or disabled".

*Fail-state:* producer and consumer are green only against separate self-shaped fixtures; exact
inventory is claimed from a count; mutable links certify Done; required is confused with pinned; a
redacted report cannot identify the broken card/field; a skipped test satisfies doctrine; or editing a
control does not route through its own gate.

## 21. Reachability setup is a separate, proven phase; it never impersonates the subject (2026-07-20)

When an interaction can be reached only after a local prerequisite, the proof recipe represents that
prerequisite as a versioned setup phase, proves its observable state, and only then performs the
unchanged subject action. Setup actions may use a unique actionable harness or an independently
declared local-presentation control; they may not directly mutate arbitrary DOM, invoke a server-backed
control, or operate the subject itself. Persist setup trace/results separately, replay them exactly,
and abort before subject execution when setup fails. Give every recipe a fresh context so prerequisite
state cannot leak between claims.

Killer mutations: delete setup so the hidden subject is unreachable; change the setup expectation so
the subject executor is never invoked; target the subject/server control from setup; forge or delete
retained setup evidence; reuse one browser context for two recipes. Counterexample: an already-reachable
subject needs no empty/no-op setup object, and historical no-setup recipes remain valid under their
historical schema.

When a proof phase is added to an existing recipe or step schema, enumerate every existing comparison,
pairing, identity, and equality check that reads the old phase fields. Prove each check either consumes
the new phase too or is deliberately scoped with a named reason and counterexample. A new execution
phase that escapes an existing pairing check is a silent authority regression.

Canonical: `mock-handoff-proof.test.ts` §"blocks subject execution when a setup expectation fails",
§"rejects the hidden Hold subject when its required setup phase is deleted", and §"rejects a motion
pair whose setup phases diverge despite identical subject actions".

*Fail-state:* proof silently primes state through the subject action, relies on arbitrary DOM mutation,
continues after a false prerequisite, certifies setup evidence that fresh replay did not reproduce,
or adds a phase that an older cross-recipe identity check silently ignores.

## 22. An early policy check cannot prove its final recheck (2026-07-20)

When one policy is checked before a claim and again at the final effect boundary, the final check needs
its own discriminator. Begin with the policy clear, prove the early check and durable claim completed,
change only the authoritative state through a named post-claim interleaving seam, then require the final
check to block with zero provider effect and correct cleanup. Run that discriminator for every branch
that can reach the provider (country, provider, feature mode); a TCR-only branch must not accidentally
own an everywhere-applicable STOP/DNC check.

The companion static gate requires the actual final authority lookup and its ordering, not merely the
lock/fence acquired nearby, and rejects conditionally excluding an applicable branch. Grep for a real
test consumer of every interleaving seam. Killer mutations: delete/repoint only the final lookup while
leaving the precheck intact, or wrap the final authorization in one narrower branch. Canonical:
`sms-send-raw-number.test.ts` section "rechecks the internal-DNC ROOT after claim" and
`s14-authority-boundary-gate.test.ts` section "fails when only the final SMS DNC lookup is removed".

*Fail-state:* a pre-seeded denial makes a final-barrier test green without reaching that barrier, a
fence is counted as the policy decision, or one destination/provider branch skips the final check.

## 23. A pattern-intersection / overlap / matcher predicate needs an EXHAUSTIVE kind-pair matrix test (swarm-coordination overlap false-negatives, 2026-07-24)

Any predicate that decides whether two patterns, paths, globs, ACL entries, resource keys, or ranges can
share a concrete member (`resourcesOverlap`, a glob matcher, a route matcher, a scope-intersection check)
is a **false-negative factory** when its tests only enumerate the EASY pairs. Example-based coverage
(exact-vs-exact, dir-vs-file, glob-vs-literal) silently omits the hard cross-pairs (glob-vs-glob,
dir-vs-glob, singleton-vs-path), and a false-negative there is worse than no check: a safety gate that
reports "no conflict" when there IS one, corrupting any promotion telemetry that trusts the count.
(Origin: the observe-only resource-admission engine's `pairOverlaps` returned `false` for
`backend/src/` ∩ `backend/**/*.ts`, `frontend/**` ∩ `frontend/components/**`, and
`singleton:prisma-schema` ∩ `backend/prisma/schema.prisma` — three real overlaps read as clean, caught
only by an adversarial reviewer that PROBED the module instead of trusting the enumerated tests.)

The required test is an **ordered kind-pair matrix**: for EVERY ordered pair of input kinds that can
share a concrete member, assert overlap/match `=== true` with a **named witness** member, AND a disjoint
negative per pair proving it does not over-broaden. Bias the predicate **fail-closed** on ambiguity (a
false-positive is a noisy log; a false-negative is a missed collision). Confirm by executing the ACTUAL
module (a read-only `import` probe), never by hand-reasoning the regex. Killer mutations: narrow the
predicate back to exact-string or textual-prefix comparison → the cross-pair witnesses go RED; drop the
fail-closed default → an ambiguous pair's assertion goes RED. Canonical:
`.ai-organization/runtime/core/coordination/coordination.test.mjs` kind-pair matrix +
`resourceKey.mjs` `globsCanIntersect`.

*Fail-state:* an overlap/intersection/matcher predicate shipped with only the easy kind-pairs tested, so
a hard cross-pair (glob-glob, dir-glob, singleton-path) returned a false-negative that no test exercised.

## 24. Live-artifact fixture mutations fail loudly (2026-07-28)
Gate/meta tests mutate live artifact text structurally or through the shared `replaceOnce`; raw `.replace(` requires a reasoned scanner escape because a missing anchor otherwise makes a negative test pass vacuously.
