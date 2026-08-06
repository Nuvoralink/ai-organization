---
description: Require compile checks for backend TypeScript and Prisma changes
paths:
  - "backend/src/**/*.ts"
  - "backend/prisma/**/*.prisma"
  - "backend/prisma/migrations/**/*.sql"
  - "backend/prisma.config.ts"
---
# Backend Prisma Build Checks

- Before backend TypeScript or Prisma changes, check `docs/ARCHITECTURE_BLAST_RADIUS.md` for connected route, service, migration, script, DTO, frontend, deploy, and verification surfaces.
- If a backend/Prisma failure reveals a missing relation that should have been in the blast radius, update `docs/ARCHITECTURE_BLAST_RADIUS.md` in the same turn as the fix.
- Backend TypeScript or Prisma changes are not done until a real compile check has been considered and the outcome is reported.
- Minimum expectation:
  - run backend TypeScript build or typecheck when the environment supports it
  - if the environment blocks that check, explicitly say so before finishing
- Prisma changes must stay synchronized:
  - update `backend/prisma/schema.prisma`
  - add or update the matching migration under `backend/prisma/migrations/`
  - keep runtime Prisma config aligned with `DATABASE_URL`
- Be especially careful with nested `try/catch` edits, async helpers, and ffmpeg/prisma utility files because small syntax mistakes can break Railway builds before migrations run.
- If a deploy/build failure points at a backend TS file, inspect that file first before assuming the database or env vars are wrong.

## Data-bearing migrations require executable predecessor-state rehearsal

- A migration that backfills, canonicalizes, deduplicates, bridges rolling versions, changes a
  constraint over existing rows, or installs trigger behavior MUST have an executable scratch-DB
  rehearsal from its exact predecessor migration state. Static SQL/string tests remain useful shape
  guards, but they are never behavioral proof.
- The rehearsal copies the Prisma/migration tree into a verified OS-temp child, applies only the
  predecessor migrations, seeds realistic legacy fixtures (including malformed values and normalized
  duplicates), copies the exact repository migration bytes, applies them, and opens/asserts persisted
  rows plus installed constraints/triggers. Sequential retry and concurrent duplicate behavior are
  included whenever the migration changes idempotency or uniqueness.
- A database-owned canonical normalizer must exactly match the live product identity authority.
  A broader database CHECK may validate generic storage shape, but it does not authorize the migration
  to materialize identities no live producer or consumer can normalize. Include one syntactically valid
  but product-unsupported fixture (not only malformed input) so broadening the migration parser fails.
  If both a durable derived column and a temporary rolling bridge consume it, the normalizer survives
  bridge retirement; the bridge triggers do not own its lifecycle.
- Scratch creation and cleanup are fail-closed: accept only an explicitly disposable local/CI database,
  generate a strict scratch prefix, and in `finally` drop/remove only names/paths revalidated against
  that prefix and the OS temp root. Never derive a DROP target from an unchecked URL or user string.
- Wire the rehearsal into `test:integration`; a file that exists but is never invoked is not proof.
  Report the command's own exit and inspect the persisted artifact output, not a wrapper status.
- **Fail-state:** a static test says the migration contains a normalizer/predicate, but the real SQL
  aborts on legacy rows, silently chooses a collision witness, leaks raw input in a database error, or
  was never applied from the prior schema.
- **Regression mutation:** remove the backfill predicate/collision collapse/trigger, broaden a domain
  normalizer to the generic column CHECK, or apply current HEAD directly instead of
  predecessor→candidate; the rehearsal must fail on a named persisted fact.
- **Counterexample:** a new empty table with no backfill, rolling bridge, trigger, or existing-row
  constraint may use ordinary fresh-database migration coverage; do not build a bespoke predecessor
  harness when there is no legacy state whose behavior can differ.

## Transaction-write seams must be Prisma-typed, never `unknown` (gate: `tx-seam`)

When a worker/service performs DB writes inside `prisma.$transaction((tx) => …)` — or accepts an injected tx client for testability — type that seam against `Prisma.TransactionClient`, or a `Pick<Prisma.TransactionClient, 'auditLog' | 'phoneNumber' | …>` of just the delegates it uses, or the real `Prisma.<Model><Op>Args` for the argument. **Never hand-roll a loose seam that types the write argument as `unknown`** (e.g. `auditLog: { create(args: unknown) }`).

Why this is a hard rule (2026-06-13, number-health worker): a loose `create(args: unknown)` seam let a runtime-breaking write — `auditLog.create({ actorUserId, metadata })`, fields that don't exist on the model (the real columns are `actorId` / `actorType` / `payload`) — pass `tsc` clean, because `unknown` accepts anything. The test mocked the transitioner, so the real write never ran: `verify` + `tsc` were both green over a Prisma `Unknown argument` crash on the one autonomous mutation. A `Prisma.TransactionClient`-typed seam fails the compile on the wrong field names — the bug never ships.

- `npm run gate:tx-seam` (in `gates:all`, `scripts/check-tx-seam.mjs`) fails the build on any `create|update|upsert|delete(arg: unknown)` write-method signature under `backend/src` / `shared/src`. Escape hatch: `// tx-seam-ok: <reason>` on the line, for a genuine non-Prisma adapter seam.
- This pairs with `test-intent.md` §4.1: the gate stops the typecheck-evasion half of the class; §4.1 ("an injectable that performs the real persistence needs ≥1 non-mocked DB-backed test running the default impl") stops the mock-the-SUT half. Both halves, closed.

## A `withTenant`/`$transaction`/`runInTenant` callback that WRITES must ROLL BACK via a THROW, never a `return` (`gate:tx-rollback` FAILS on any unannotated site + reviewer-enforced)

`withTenant(tenantId, (tx) => …)` is `prisma.$transaction(cb)`: the tx **commits when the callback resolves** and **rolls back ONLY when it throws**. So a callback that performs a write (`tx.<model>.create/update/delete`) and then takes a non-throwing early `return` of a blocked / fail-closed / not-found value **silently COMMITS that write** — an early `return` is NOT a rollback.

Why this is a hard rule (2026-06-30, #13 cockpit-SMS): `smsSend.validateAndClaim` (the by-prospect shape) find-or-CREATED the lead-keyed conversation, then on a gate block `return`ed `{kind:'blocked'}` instead of throwing → the conversation create COMMITTED on every blocked first-contact send → an orphan empty thread for a DNC-suppressed / unvetted lead. `tsc` was clean and the local `verify` green (the DB suite `skipIf(!HAS_TEST_DB)`-skips locally); only CI's `integration` job + the compliance/adversarial auditors caught it. Fix: the blocks `throw new SendBlocked(result)`, caught in `sendSms` and mapped to the HTTP result, so the tx rolls back (the codebase's established throw-to-fail-closed pattern, cf. `dispositionSave.ts`).

- **The rule:** inside a `withTenant`/`$transaction` callback, once a write has happened, a block / fail-closed / not-found exit MUST be a `throw` (caught outside the tx, mapped to the result) — NEVER a bare `return`, which keeps the write.
- **Gate: `gate:tx-rollback`** (`scripts/check-tx-rollback.mjs`, in `gates:all`; wired WARN-only 2026-07-02, promoted to **FAIL 2026-07-08** once the whole baseline was audited). It brace-scans each `withTenant`/`$transaction`/`runInTenant` (the DI alias `deps.runInTenant ?? withTenant`) callback body and flags a `return` after a write and outside a `catch` — the return-after-write shape (the #13 orphan-thread pattern). Precise "fail-closed bail vs the callback's committed result" detection needs data-flow analysis, so false positives (a legit committed `return response`) are expected — that is exactly what the **escape hatch** is for: a genuine committed result carries `// tx-rollback-ok: <reason>` (on the return line OR anywhere in the contiguous comment block directly above it — a multi-line reason is honored). Every pre-existing site was read + confirmed a genuine committed result + annotated, so the tree is clean and the gate now **FAILS the build (exit 1) on any UNANNOTATED site** — a NEW one is either a real committed result to bless (add the marker) or a fail-closed bail to FIX (change the `return` to a `throw`). The **reviewer still confirms** each marker is honest — the escape must not be used to silence a real fail-closed bail. KNOWN GAP (named in the gate header): the scanner is intra-callback / non-interprocedural, so an expression-body delegation `runInTenant(t, (tx) => helper(tx))` or a statement body whose writes live in a called helper (e.g. `smsSend.validateAndClaim`, the #13 origin) is NOT gate-covered; the reviewer rule + a DB-backed test are the backstop there. Meta-test: `backend/src/__tests__/tx-rollback-gate.test.ts`.
- Pairs with `test-intent.md` §4.1: a write-path rollback claim MUST have a DB-backed test the orchestrator actually RUNS — a `skipIf(!HAS_TEST_DB)` suite passing inside plain `npm test` is not evidence; gate on local `npm run test:integration` before merge, or on the remote `integration` job only when milestone/manual/main CI is intentionally invoked. The gate surfaces the candidate sites; the DB-backed test proves the rollback.

## The MIRROR rule: evidence that MUST persist cannot be reported by a `throw` from inside its own transaction (reviewer-enforced)

The rule above stops a fail-closed bail from silently **committing** an unwanted write. This is the same reasoning run the other way, and it is a distinct bug class that the `tx-rollback` gate structurally **cannot** see — that gate flags a `return` after a write; this one is a `throw` after a write, which looks *correct* to it.

`withTenant`/`runInTenant` IS `prisma.$transaction`: the callback commits on resolve and **rolls back on throw**. So a callback that writes EVIDENCE — a state the system must remember — and then throws to report that state **discards the very write it is reporting**. The throw is not the bug; the throw *from inside the transaction that produced the evidence* is.

**The distinction that decides it:** ask what the write MEANS.
- The write is a **claim/side-effect that should not survive a block** (an orphan conversation, a half-made booking) → **throw inside** the tx. The rollback is the point.
- The write is **EVIDENCE of something that already happened, or a fact the next caller must see** (a reconnect-required marker, an indeterminate provider outcome, a terminal failure, a durable claim) → **commit a discriminated result, then throw OUTSIDE**. The persistence is the point, and rolling it back re-hides the fact.

**Why this is a hard rule (2026-07-17, B06 booking):** two live instances, both invisible to `tsc`, `verify`, and the gate.
1. `bookingConnectionTokens.markReconnectRequired` wrote `reconnect_required_at` + `status='expired'` and then threw `BookingConnectionReconnectRequired` **from inside the same `runInTenant`** — so the marker rolled back on every call. The connection never actually recorded that its grant was dead, and every subsequent booking re-hammered a revoked refresh token into Calendly's 8-per-minute rate limit, forever, with nothing in the row explaining why.
2. `bookingAuthority.createBooking` phase 3 updated the attempt to `indeterminate`/`terminal_failed` and threw `BookingBlocked` from inside its transaction — so the row stayed `pending` forever. A terminally-rejected booking then answered every retry with "reconcile before retrying" about a write that had definitively failed, and an indeterminate attempt kept **no record that the provider write may have landed** — which is exactly the evidence that blocks a double-book.

**Required shape:** the transaction callback RETURNS a discriminated result (`{ kind: 'reconnect' } | { kind: 'claimed', … }`), the caller inspects it and throws after the tx has committed. Annotate each committed arm with `// tx-rollback-ok: <why this must survive>` so the gate's escape hatch carries the reason.

**Required test (this is what makes it bite):** a DB-backed test that drives the failure path and then **re-reads the row** to assert the evidence PERSISTED — not merely that the caller threw. Asserting only `await expect(fn()).rejects.toThrow()` passes identically against both the correct and the rolled-back version, which is precisely why both bugs above survived a green suite. Canonical: `s14-b06-booking-db-proof.test.ts` §"reconnect evidence survives the throw".

*Killer mutation to name:* move the `throw` back inside the `runInTenant` callback (or replace the returned discriminated result with a direct throw) → the re-read assertion goes RED while the `rejects.toThrow()` assertion stays green.

*Fail-state:* a fail-closed path wrote the evidence explaining WHY it failed and then threw from inside the same transaction, so the evidence never persisted — and the test only asserted that it threw.

## A DB write is reconciled against EVERY trigger/constraint/policy on the table — read each in full (2026-07-21)

A single table routinely carries several BEFORE/AFTER triggers, CHECK constraints, and RLS policies — and one PL/pgSQL trigger function routinely owns **multiple** invariants (e.g. `protect_media_artifact_provenance` owns provenance-immutability AND transition-legality in one function body). So before you INSERT / UPDATE / DELETE a row, or `CREATE OR REPLACE` a trigger that governs one:

- **Enumerate them all — at their CURRENT definitions.** Run `npm run db:guards -- <table>`: it walks the migrations in order with last-wins semantics and prints the table's current triggers (with each trigger function's full CURRENT body), CHECK constraints, policies, and RLS state, each with its defining migration. That is the enumeration; a hand-walked `grep` of the migrations is the fallback, and if you grep, resolve every object to the LAST migration that CREATEs/REPLACEs/ALTERs it — an earlier hit is a superseded copy, and reconciling against one is the same class as reading only the opening lines. Read each guard **in full** — the opening lines are a lead, not the spec; concluding "this trigger only freezes columns" from its first block is exactly how a soft-delete shipped that the table's *other* trigger arm rejected at runtime (2026-07-21, migration 0073 round 1: the evidence trigger was extended but the legality trigger was not, and only the DB run caught it — both static auditors passed).
- **A CHECK over nullable columns constrains nothing unless its predicate is `IS TRUE`-wrapped.** SQL three-valued logic ADMITS a row whose predicate evaluates UNKNOWN — reading a predicate correctly is not evaluating it correctly, and a self-review that reconciles every write against the constraint can still miss it. Wrap `CHECK ((predicate) IS TRUE)` and run `gate:check-totality` before reporting any migration that adds/changes a CHECK. (2026-08-05, slice-2 10DLC: a sole-prop OTP backstop over a nullable entity-type column evaluated FALSE OR NULL = UNKNOWN and admitted the exact row it existed to forbid; caught by the gate, not the read.)
- **A state-transition change is reconciled against ALL triggers on the table, not the one whose error surfaced first.** If your write must be admitted, verify EVERY trigger admits it and EVERY constraint passes — don't fix one rejection, rerun, and fix the next (that's the peel-one-layer anti-pattern; it wastes a DB run per layer).
- **A `CREATE OR REPLACE` of a trigger/function is verbatim + your addition only.** Mechanically diff your copy against the current original — `npm run db:guards -- <table>` prints the body to diff against — and assert no original line was lost (a 75-line function copy silently drops an arm otherwise).
- **A gate/trigger/policy ADMISSION-widening owes a paired NEGATIVE test.** When you make a previously-rejected case pass, the same change writes the test proving a case just OUTSIDE the new gate is STILL rejected — killer mutation: widen the gate's predicate further → that negative test must go RED; a negative test that stays green under the widening is vacuous (test-intent §"Make it bite"). The positive "it now admits X" test alone lets the widened arm become a hole (2026-07-21, compliance-auditor Finding 1).
- **A migration that ADDS/TIGHTENS a trigger or CHECK sweeps the fixtures in the same slice.** Grep the test fixtures that INSERT/UPDATE the affected table and update them against the new invariant — a fixture written before the constraint is the DB-fixture sibling of `testing-guardrails.md` §13's stale-mock class, and it fails only when the DB lane finally runs (origin: the voicemail-delivery fixture went stale when 0064 made a verified normalized derivative a hard INSERT precondition; DB-LANE-INVISIBLE-COVERAGE-001 control 3).

This is the DB-work instance of the implementer's pre-report audit self-review (`.claude/agents/sprint-implementer.md`); it fires here because backend/prisma work reads this rule at the moment of the write. *Fail-state:* a runtime constraint/trigger rejected a write the implementer believed valid because only one of the table's guards was read — a divergence invisible to `tsc`, `verify`, and static review.

Two of this section's classes are now MECHANICAL gates in `gates:all` (2026-07-21): **`gate:rls-delete-path`** fails the build on any `.delete(`/`.deleteMany(` against a table whose RLS permits no delete (set folded last-wins from ALL migrations including the 0043 dynamic DO-loops; escape `// rls-delete-ok: <reason>`, tx-rollback annotation semantics — a KNOWN-DEFECT pointer is legitimate, a silent blessing is not), and **`gate:db-mutation-coverage`** fails the build on any DB-mutating module whose only reaching suites are `skipIf(!HAS_TEST_DB)`-gated (transitive import-graph reachability; escape `// db-mutation-coverage-ok: <reason>`; the durable fix is the two-lane shape — an always-run unit test asserting the mutation args). The rules above remain the judgment layer the gates cannot see (trigger-body semantics, fixture reconciliation, negative-test pairing).
