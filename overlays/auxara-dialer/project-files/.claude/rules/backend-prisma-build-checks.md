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
