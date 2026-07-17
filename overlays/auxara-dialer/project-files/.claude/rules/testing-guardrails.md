---
paths:
  - "backend/src/**/*.test.ts"
  - "backend/src/__tests__/**/*"
  - "backend/scripts/*Regression*"
  - "frontend/src/**/*.test.ts"
---
# Testing Guardrails

Purpose: require the right kind of test for the kind of logic being changed.

> Note: the examples below are dialer-grounded. The underlying patterns were proven on the Nuvora CoachAI repo; here they are re-expressed in dialer terms (Telnyx events, number lifecycle, AI disposition drafts, compliance gates, recordings) so implementers reason about artifacts that actually exist in this product.

## Mock factories must mirror the mocked module's export surface

When you ADD an export to a lib module, its consumers include every test file's `vi.mock('<module>', factory)` — grep for those factories and extend each in the same change. A closed factory missing the new export does NOT fail as an import error: vitest's mock guard throws at the property ACCESS ("No X export is defined on the mock"), which — when the access sits in Express middleware outside a try — becomes an **unhandled rejection + a request that never responds**, so the whole test file reads as inscrutable 5s timeouts. (Canonical: `redisRequestConnection` added to `lib/redis.ts` while `telnyx-webhook-idempotency` + `dlr-014-amd-signal` mocked it with `{ redisConnection: null }` only — 18 tests timed out in CI, 2026-07-03, PR #174.) Keep such factories explicit (they exist to avoid the real module's import side effects — `importOriginal` would construct real connections), which is exactly why they must be swept on every export addition.

## HTTP integration test bootstrapping

Any test that boots a real HTTP server on an OS-assigned ephemeral port (Express `app.listen(0, cb)`, or a bare `createServer().listen(0, cb)`) MUST go through `backend/src/__tests__/helpers/listenEphemeral.ts` — never call `.listen(0, ...)` directly. `npm run gate:ephemeral-listen` (in `gates:all`) enforces this.

Why: the WHATWG Fetch standard refuses to connect to a fixed list of ~80 "bad ports" (https://fetch.spec.whatwg.org/#port-blocking), enforced by Node's built-in `fetch` (undici). `.listen(0)` asks the OS for any free ephemeral port, and on a machine whose configured TCP dynamic-port range dips into that list (this dev box: 1024-65535 — not the 49152-65535 some platforms default to), the OS occasionally hands one back. Every `fetch()` the test then makes fails with `TypeError: fetch failed` / `Error: bad port` — not a bug in the server under test, a bad ephemeral port pick (root cause of the 2026-07-01 `sms-send-raw-number.test.ts` flake, found duplicated unguarded across 7 files). `listenEphemeral()` retries with a fresh port whenever the OS lands on a bad one; the shared `startTestServer()`/`startAuthedClient()` harness already uses it.

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

**Redis-backed counters/limiters are derived state too — their TTL is their lifecycle (security audit 2026-07-03, MEDIUM-1).** A rate-limit window, a dials-today counter, a claim key: the TTL IS the row's expiry semantics, and the classic INCR-then-EXPIRE pair is non-atomic — if the INCR lands and the EXPIRE is lost (timeout-abandoned, rejected, process restart between the two), the key lives forever and a fixed window never resets (a whole office NAT 429'd on login until an ops key-delete). Tests for any Redis-backed counter must prove **TTL exists after every failure path** (incr-lands-late, expire-abandoned, restart mid-pair) — the strongest shape seeds a TTL-less key against a real Redis and asserts the next request self-heals it. Prefer an atomic Lua op (INCR + set-TTL-if-absent) or `EXPIRE … NX` over the split pair; canonical fixture: `rate-limit-fail-closed.test.ts` §"TTL self-healing".

**BullMQ custom job IDs are an encoding boundary for arbitrary provider input (production incident 2026-07-10; review closure 2026-07-11).** BullMQ reserves `:` and rejects colon-bearing custom IDs, but external/provider IDs may legitimately contain colons, Unicode, or extreme lengths. Never reject a valid webhook solely because an internal queue delimiter disagrees. Every producer uses `lib/bullmqJobId.ts`, which deterministically hashes byte-length-prefixed arbitrary parts to one bounded colon-free key; producer tests make their fake reject a colon in the FINAL built ID and feed the real builder messy provider values. `gate:bullmq-job-ids` enumerates production `jobId` properties and rejects dynamic helpers that bypass the builder. Killer mutations: restore `system:<job>:<tenant>`, reject `provider:event:id` at the builder, or bypass the builder; gate + messy-input liveness tests go red.

**A TTL exclusion that guards an external side effect needs renewal, an immediately-before-side-effect fence, and a bounded operation (review closure 2026-07-11).** Acquire+TTL+release alone is unsafe: preparation or network delay can outlive the TTL, allowing pause/revoke to acknowledge before the stale owner submits. The owner must CAS-renew while active, atomically prove/extend ownership immediately before the irreversible request, and bound that request strictly below the restored TTL. Loss of ownership fails before submission. A timeout after possible provider receipt remains indeterminate evidence; never rewrite it as a definite failure. Tests use fake time/controlled concurrency to expire or replace the owner and prove zero provider commands begin after acknowledgement.

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
