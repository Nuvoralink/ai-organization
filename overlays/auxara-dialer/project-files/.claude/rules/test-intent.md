---
description: Every test file declares what product behavior it proves. CI gate enforces. Tests without intent are not allowed.
paths:
  - "backend/src/**/*.test.ts"
  - "backend/src/__tests__/**/*"
  - "frontend/src/**/*.test.ts"
  - "frontend/src/**/*.test.tsx"
  - "frontend/e2e/**/*"
  - "scripts/**/*gate*"
  - "scripts/**/*check*"
  - "package.json"
---

# Test Intent

Purpose: tests must mean something. Green CI is only useful when each test exercises a product decision the user/business actually cares about. A test that asserts `true === true` or that mocks the entire system under test is theater — it inflates the coverage number and corrupts the team's sense of safety.

This rule applies to every `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*Regression*.ts`, and `*Regression*.mjs` in the repo. The CI gate `npm run gate:test-intent` enforces it.

---

## 1. Required header in every test file

Every test file MUST begin with a comment block of this form:

```ts
/**
 * Proves: REQ-DLR-001, REQ-CMP-004, BENCH-PRO-COMPLIANCE-AUDIT
 * Test type: integration
 * Surface: backend/src/services/dialerEngine.ts (power) + complianceGate + Telnyx Call Control event projection
 * Authority: services/complianceGate.ts (deterministic) + Telnyx events (call.initiated, call.answered, call.hangup)
 *
 * What this test proves about the product:
 * - On a power dial, the compliance gate runs BEFORE Call Control (calling-hours TZ + DNC freshness);
 *   an out-of-window prospect is blocked with a compliance_audit_log row and is never dialed.
 * - On an allowed dial, the call_events projection shows INITIATED → ANSWERED →
 *   (recording disclosure played for an all-party-consent state) → CONNECTED, timestamps matching the Telnyx CDR.
 *
 * Negative path covered:
 * - Stale DNC scrub (> 31 days) → dial blocked, compliance_audit_log.dnc_scrub_pass = false, reason logged.
 * - All-party-consent state but disclosure audio missing → fail-closed, dial blocked.
 *
 * Anti-pattern this test guards against:
 * - Dialing before the compliance gate resolves (an unprovable-compliance dial).
 * - A blocked dial that writes no audit row.
 *
 * Three-fold paired assertion (where applicable):
 * - Normalization: prospect TZ resolved/validated to an IANA zone.
 * - Source-invariant: dialerEngine respects the gate result in BOTH the allow and block branches.
 * - DTO/mapper: CallEventDTO + compliance_audit_log carry the gate basis (tz, dialed_at_in_tz, dnc_scrub_basis).
 */
```

Required fields (the gate checks for these by name):

- `Proves:` — comma-separated list of at least one catalogued requirement, NFR, benchmark, decision-log, or bug-backlog ID
- `Test type:` — one of: `unit`, `integration`, `e2e`, `contract`, `regression`, `smoke`, `source-to-screen`, `tenant-isolation`, `compliance-audit`, `bounded-repair`
- `Surface:` — file/module under test (path or logical surface name)
- `Authority:` — who owns the decisions this test exercises (per `assurance/source-of-truth-map.md`)
- `What this test proves about the product:` — 1–4 sentences in plain language

Strongly recommended (not enforced but reviewers ask):

- `Negative path covered:`
- `Anti-pattern this test guards against:`
- `Three-fold paired assertion (where applicable):`
- `Tied competitive benchmark evidence:` (when a BENCH-* is in Proves)

## 2. What counts as a valid `Proves:` ID

- `REQ-DLR-001` … any requirement ID from `docs/app-plan/product/02-prd.md` §"Functional requirements"
- `NFR-001` … non-functional requirement IDs from the same doc
- `BENCH-CON-*` … competitive negative benchmarks from `docs/app-plan/product/30-competitive-benchmarks.md`
- `BENCH-PRO-*` … competitive positive benchmarks from the same doc
- `BUX-021`, `ARC-006`, and similar IDs … rows in `docs/app-plan/auditability/decision-log.md`
- `ADR-DLR-016`, `ADR-ARC-002`, and similar IDs … H1 IDs in `docs/app-plan/architecture/adr/*.md`
- `LAYOUT-LOCKED-SURFACE-001` and similar IDs … headings in `docs/BUG_BACKLOG.md` when the test is the durable regression for that tracked bug class

IDs are looked up at gate time. An ID that doesn't resolve fails the gate (typo guard).

## 3. What counts as a valid `Test type:`

| Type | When |
|---|---|
| `unit` | Pure-logic test with no I/O, no DB, no network |
| `integration` | DB-backed or service-handoff test using local providers/mocks |
| `e2e` | Full-stack browser-driven (playwright) |
| `contract` | Schema/DTO/zod-validation; shared-contract producer + consumer |
| `regression` | Locks down a previously-broken behavior with a named bug reference |
| `smoke` | Lightweight end-to-end signal, not exhaustive |
| `source-to-screen` | UI shows the right value sourced from the right authority |
| `tenant-isolation` | Cross-tenant probe; RLS-backstopped scope check |
| `compliance-audit` | Audit row write completeness; immutable after creation |
| `bounded-repair` | AI bounded-repair trace truth (`'rejected'` not `'repaired'`) |

## 4. Forbidden test patterns (gate flags these)

- A test with `expect(true).toBe(true)` or equivalent — non-assertion theater
- A test that mocks the entire System Under Test instead of exercising it
- A test that asserts a literal that was hardcoded by the same patch (tautology — would pass even with a regressed implementation)
- A test for an AI feature without a bounded-repair trace-truth assertion
- A test for persisted derived state with visible UI without a three-fold paired assertion
- A test for a compliance gate that fires AI judgment — gates are deterministic, tests must reflect that
- A test that ignores the negative path entirely (only happy)
- A test for cross-tenant data without a cross-tenant probe negative case
- A test for an idempotent mutation without a concurrent duplicate trigger negative case
- A route/authority-layer behavior change (a handler's derivation, deterministic gate, or status-code split) covered ONLY by client/unit tests that can't reach the route — add a route/integration test that EXERCISES the handler. Frontend + unit tests pass OVER the server authority layer, so a regression there sails through `verify`/`tsc` (the onboarding `/search` country-derivation fix, 2026-06-30: reverting the route's derive line stayed green at 380/0; only the adversarial reviewer + a route-level test catch it — the 2nd instance of the §4.1 number-health-worker class).

The CI gate detects the structural ones (no header, no `Proves:`, no valid IDs). Reviewers catch the semantic ones.

## 4.1 A false-passing test is a P0 — fix it the moment it's found (never backlog, never skip)

A test that **passes when it should fail** — one that would still go green against a broken or regressed implementation (it mocks the System Under Test, asserts a tautology the same patch hardcoded, exercises a mocked path instead of the real one, or never reaches the decision it claims to prove) — is **worse than no test**: it actively *certifies broken code as working*. Every green run it joins is a false assurance the next agent or human trusts. (Canonical: the 2026-06-13 number-health worker test injected `lifecycle.transition = vi.fn()`, so the real transitioner — which wrote nonexistent Prisma fields and threw at runtime — was never executed; `verify` + `tsc` were green over a runtime-broken autonomous path.)

The instant one is found, **in the same turn it is found**:

- **Fix it now.** A known false-passing test is never a `docs/BUG_BACKLOG.md` row, never a "follow-up", never "low-risk, later". Deferring it leaves a live lie in CI. This overrides normal triage: it is a P0 the moment it is identified — by anyone (implementer, reviewer, orchestrator, CI).
- **Never skip-to-green.** Do NOT `.skip` / `it.skip` / `describe.skip` / `xit` / comment it out / loosen the assertion to make the suite pass. Skipping a false-passing test trades a *lying green* for a *silent gap* — both hide the same broken code, and the silent gap is harder to find later. (Deleting a test that genuinely proves nothing and replacing it with one that bites is fine; *silencing* one that should be proving something is not.)
- **Make it bite.** The fix is to rewrite the test so it exercises the **real** SUT (not a mock of it) and would **fail** against the regression — name the killer mutation that should break it and confirm it does. If the only honest way to reach the real path is a DB/provider-backed test, write that (the disposable test DB / local replay); don't settle for the mock that lies.
- **Confirming it does means RUNNING it, and verifying the mutation LANDED.** Apply the mutation, assert the edit actually applied (a scripted `replace` whose pattern is absent silently no-ops — the suite stays green and the "confirmation" proved nothing), watch the suite go red, then restore and `diff` byte-for-byte. A mutated run that **hangs** is still a kill (a hang is a CI failure), but prefer a clean red; a hang usually means the code loops without its guard, and redesigning so the loop is impossible beats guarding against it. Above all, watch for a test that survives its mutation because a **different** guard short-circuits first — the assertion never reaches the protection it claims, so it is green for the wrong reason. Build the fixture so the named guard is the *only* thing between the code and the failure. (2026-07-30, `CommunicationsPage` read-ack: two mutations silently no-op'd and a third flipped nothing because an earlier `unreadCount === 0` return fired first.)
- **Then close the loop (doctrine-loop Arm 1) — in addition, never instead.** If a whole *class* of false-pass slipped through (a typecheck-evading `args: unknown` seam, a mock-the-SUT habit), strengthen the upstream control too. But fixing the class is *on top of* fixing the test now, not a substitute for it.

*Fail-state:* a test that passes against a broken implementation was found and then backlogged, skipped, or left green "for now" — so the next CI run kept certifying the same broken code as working.

## 4.2 Isolation — a gate/whole-tree meta-test must NEVER write fixtures into the live source tree

A test that spawns a real CLI gate (or any tool that walks the repo) and seeds a `__tmp` fixture into the **live** `backend/src` / `frontend/src` / `shared/src` tree is **flaky by construction**: `npm test` runs every `backend/src/**/*.test.ts` in parallel vitest forks, so a sibling worker's walk-then-read over the same tree can observe the in-flight fixture or hit an ENOENT when a `__tmp` file is created/overwritten/deleted mid-walk → spurious non-zero exit on a PASS-expecting case. It also lets a crashed test strand a fixture that poisons the next `gates:all` run. (Canonical: 2026-06-29, the `ui-copy-source-of-truth` / `ui-testid` / `preflight-security` gate meta-tests all seeded fixtures into the live tree and raced each other.)

The fix is **isolation, not a retry**: build a throwaway `fs.mkdtempSync(os.tmpdir())` scaffold, create only the dirs/files the gate needs to engage (copy in a real source file when the gate must parse one), write the fixture there, and run the gate with `cwd:<scaffold>` (a small `runGate(cwd)` helper). The seeded-violation-FAILS + clean-PASSES assertions must stay — name the killer mutation each catches. A read-only "engages and passes on the current tree" case may still scan the real tree (it writes nothing).

*No clean static gate exists for this* (distinguishing a live-tree **write target** from an identical-looking path string passed as a pure-function **argument** needs data-flow/taint analysis, which false-positives on these very meta-tests; a runtime `fs` wrapper risks snapshot/coverage false-positives) — so it is **reviewer-enforced**. *Fail-state:* a `*.test.ts` does `writeFileSync`/`rmSync` to a path under the live source tree (`path.join(repoRoot, 'backend/src/__tmp…')`) instead of an `os.tmpdir()` scaffold.



**A scanner that maintains its own depth/state counters needs a fixture per counter TRANSITION, and an unbalanced residue must fail CLOSED.** Shape coverage is not state coverage: a hand-rolled splitter/walker with brace, paren, angle, or quote counters IS a state machine, and testing the input *shapes* it accepts says nothing about what a counter does when one never closes. Give every counter an open case, a close case, and an **unbalanced-residue** case; the residue must emit something the caller reports loudly, never silently suppress further parsing. Killer mutation: delete the residue check and the unbalanced fixture must go red. (2026-07-30, CoachAI `gate:api-method-consumers`: a fix replacing an indent-anchored regex with a depth-aware splitter introduced an angle counter, and `m: (a) => a < 5,` — an expression-bodied arrow, whose body sits at depth 0 — left it stuck open, suppressed every later comma split, and swallowed all remaining members into one chunk reporting zero problems. A silent unbounded fail-open, strictly worse than the shape gap it replaced, in the exact direction the code comment declared impossible. Second sighting of "new machinery ships with its INPUT covered and its ENFORCEMENT untested" inside one change — so STOP-and-codify.)

**A mutation counts as KILLED only when the assertion it NAMES goes red — keep a two-column ledger.** The suite's exit code is not proof: a mutation to a shared matcher reddens many unrelated positive assertions, which looks exactly like a kill while the guard it was aimed at has zero coverage. Record `mutation → the assertion name that must go red`, then diff the actual FAIL list against that name. (2026-07-30, same gate: dropping the namespace-prefix guard reddened 11 unrelated positives and was banked as "killed"; the assertion meant to defend that guard stayed green, and a clean prefix-drop left the entire suite passing. The ledger also caught an assertion whose MESSAGE named a guard it was not defending.) This is the mechanical form of the "individually sufficient" requirement above.

## 5. CI gate (`scripts/check-test-intent.mjs`)

The gate runs as `npm run gate:test-intent`, included in `npm run gates:all`. It:

1. Lists every `*.test.ts|tsx`, `*.spec.ts|tsx`, `**/*Regression*.{ts,mjs}` under `backend/src`, `frontend/src`, and `frontend/e2e`
2. Parses the header comment of each file
3. Fails the build if:
   - No header comment at file top
   - No `Proves:` line, or `Proves:` contains zero valid IDs
   - No `Test type:` line, or value not in the allowed list
   - No `Surface:` line
   - No `Authority:` line
   - No `What this test proves about the product:` line
   - Any catalogued ID in `Proves:` doesn't resolve in the PRD, benchmarks, decision log, or bug backlog
4. Bootstrap-skip: until `backend/src`, `frontend/src`, or `frontend/e2e` exists, the gate skips with a friendly message

## 6. Migration / adoption

For every existing test that doesn't have the header: it's grandfathered ONLY until the file is next touched. Any PR that touches a test file without an intent header must add one. The gate runs in ERROR mode (hard-fails the build) and always has — an earlier plan for a WARN-only adoption phase never shipped; this text claimed WARN-only until corrected 2026-06-11.

## 7. Examples — full headers

### Unit test
```ts
/**
 * Proves: REQ-CMP-004
 * Test type: unit
 * Surface: backend/src/services/complianceGate.ts resolveProspectTz()
 * Authority: prospect.tz (IANA) with state / area-code fallback
 *
 * What this test proves about the product:
 * - resolveProspectTz() maps a prospect to an IANA zone (explicit tz, else state/area-code default),
 *   so the calling-hours window (8am-9pm prospect-local) is computed against the right zone.
 *
 * Negative path covered:
 * - Unknown / unmappable area code → resolves fail-CLOSED (treat as outside calling hours until a
 *   zone is known), never silently to a permissive default.
 *
 * Anti-pattern this test guards against:
 * - Silent fallthrough to the server's local zone when the prospect's zone is unknown — which would
 *   green-light a dial that is actually outside the prospect's legal calling window.
 */
```

### Tenant-isolation black-box
```ts
/**
 * Proves: REQ-AUTH-005, NFR-008
 * Test type: tenant-isolation
 * Surface: every GET endpoint that returns object-scope data (calls, recordings, prospects, conversations, appointments)
 * Authority: tenant_id JWT claim + Postgres RLS predicate
 *
 * What this test proves about the product:
 * - A Tenant A user requesting Tenant B's object IDs receives 404 (not 403).
 * - The RLS predicate is intact: even if app-layer scope is bypassed, the DB
 *   returns zero rows for the wrong tenant.
 * - Cross-tenant probe rate is logged and rate-limited.
 *
 * Negative path covered:
 * - Forged JWT with different tenant_id is rejected by token-version check.
 * - Direct DB query without app.tenant_id set returns zero rows from any
 *   tenant-scoped table (proves RLS is on).
 *
 * Anti-pattern this test guards against:
 * - 403 leak revealing object existence to a tenant that shouldn't know.
 * - App-only scope check without RLS backstop.
 */
```

### Compliance audit completeness
```ts
/**
 * Proves: REQ-CMP-010, BENCH-PRO-COMPLIANCE-AUDIT
 * Test type: compliance-audit
 * Surface: backend/src/services/complianceGate.ts + complianceAuditWriter
 * Authority: per-dial deterministic gate (calling hours TZ math, DNC scrub freshness, consent_proof, recording-disclosure trigger)
 *
 * What this test proves about the product:
 * - Every dial attempt (allowed OR blocked) writes exactly one compliance_audit_log row.
 * - The row is immutable after creation (DB constraint).
 * - The row's denormalized fields (prospect_e164, prospect_state, prospect_tz, calling_hours_basis, dnc_scrub_basis) survive prospect-row updates that happen later.
 *
 * Negative path covered:
 * - Calling-hours violation: row exists with calling_hours_pass=false + the basis JSON
 *   shows the exact TZ + dialed_at_in_tz that failed.
 * - DNC hit: row exists with dnc_scrub_pass=false + the list that matched.
 * - Storage backend down at write time: dial is blocked + row is still attempted via
 *   transactional outbox; eventual write proven on backend recovery.
 *
 * Anti-pattern this test guards against:
 * - Allowed dial without audit row (unprovable compliance).
 * - Audit row mutation post-creation (would break regulator-facing immutability).
 *
 * Tied competitive benchmark evidence:
 * - GoHighLevel + Convoso + Kixie all surface compliance audit weakly; we make it the
 *   compliance viewer's primary surface (BENCH-PRO-COMPLIANCE-AUDIT).
 */
```

### Bounded-repair trace truth
```ts
/**
 * Proves: REQ-AI-002, BENCH-PRO-AI-DISPOSITION
 * Test type: bounded-repair
 * Surface: backend/src/services/aiDispositionDraft.ts validate + repair flow
 * Authority: AI provider response + tenant disposition_taxonomy + transcript grounding
 *
 * What this test proves about the product:
 * - When validation fails AND repair output also fails validation, the trace status
 *   is "rejected" (NOT "repaired"), the product output for the failed fields is empty,
 *   and a warning row "ai_disposition_repair_rejected:<reason>" exists.
 * - The booker UI shows the failed fields as blank for manual entry, not as
 *   fabricated values.
 *
 * Negative path covered:
 * - First-pass valid: trace = "passed", no repair attempted.
 * - First-pass fail + repair valid: trace = "repaired", product output complete.
 * - First-pass fail + repair fail + AI returns malformed JSON on retry: trace = "rejected", warning row written.
 *
 * Anti-pattern this test guards against:
 * - Trace says "repaired" while product output is empty (debugging lie).
 * - Validator silently rewriting failed fields (AI judgment bypass).
 * - Validator fabricating a "safe" default (e.g. defaulting disposition to "callback") to fill the gap.
 */
```

## 8. The point

Test files are technical documentation. The header is the place where future maintainers (humans + agents) learn what the test was supposed to catch and why. If the header is missing or vague, the test was probably theater — and the gate's job is to prevent shipping theater.
