---
name: testing-strategy-and-tdd
description: Use when designing, writing, fixing, or reviewing tests; applying test-driven development; improving regression coverage; planning unit/integration/e2e/property-based tests; analyzing coverage; or building an advanced testing strategy.
---

# Testing Strategy And TDD

Use tests to protect behavior, clarify design, and catch realistic regressions.

## The Standing Gauntlet — every test plan affirms these (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. Gate 3 is this skill's center of gravity.

1. **Verify, never assume.** Confirm what the code actually does before asserting it; a test written against an assumed behavior locks in the assumption.
2. **Outputs over statuses.** Assert against the real produced artifact (persisted row, rendered output, raw response), not an intermediate status flag.
3. **Tests must bite.** Each test must FAIL if the behavior regresses — pair every negative assertion with a positive liveness assertion, test boundary values, and for non-trivial logic include a mutation probe that proves the test catches a deliberate break. A test that still passes when the primary path is disabled is unacceptable.
4. **Whole blast radius.** Cover every producer and consumer of the behavior, not just the happy path of the one changed function.
5. **Replace, don't layer.** When a behavior is replaced, delete the stale tests for the old path; don't leave green tests asserting retired shapes (they're vacuous after retirement).
6. **No parallel system.** Reuse existing fixtures/harnesses/factories before authoring a near-duplicate; don't fork a second test util that already exists.
7. **Best, most durable way.** Prefer the smallest test that proves the behavior, then add broader tests where risk crosses boundaries; avoid snapshot-only or build-only validation for behavior-heavy changes.
8. **Pressure-test the thing itself.** Is this test proving product intent, or just that code ran? Does it need to exist, or is it redundant with stronger coverage elsewhere?
9. **Stop before you quick-fix.** A flaky or failing test is diagnosed to root cause, not silenced, skipped, or loosened to go green.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## Core Workflow

- Define the behavior and failure modes before choosing test type.
- Prefer the smallest test that proves the behavior, then add broader tests for cross-boundary risk.
- For bug fixes, write or update a regression that would have caught the bug and adjacent cases.
- Use TDD when the desired behavior is clear and the implementation path benefits from fast feedback.
- Avoid snapshot-only or build-only validation for behavior-heavy changes.

## Test Layers

- Unit tests for deterministic pure logic and helpers.
- Integration tests for service/database/API boundaries.
- Contract tests for shared DTOs and API consumers.
- E2E/browser tests for user journeys and UI state.
- Property-based/fuzz tests for parsers, validators, security-sensitive logic, and broad input spaces.

## Adapter And Parser Proof

For external or user-supplied data adapters such as imports, parsers, webhooks, uploads, exports, feeds, or provider payload mappers, test more than clean canonical examples:

- realistic messy inputs and aliases or descriptive field names,
- malformed syntax or invalid envelope structure,
- duplicate and normalized-duplicate keys or headers where applicable,
- missing required structure and extra unsupported fields,
- size/count limits and unsupported formats or encodings,
- privacy-sensitive fields that must not leak into logs, DTOs, exports, or analytics.

The test should fail if the adapter silently overwrites data, falls back to the wrong authority, or accepts unsafe structure as if it were confirmed truth.

## Test Network Boundary

Unit and local-integration test processes default-deny public network egress. Mocking the expected
provider call is not enough: a forgotten mock, a new SDK transport, or an error branch can otherwise
send a real unauthenticated or billable request while the suite appears local.

- Install the guard in the test runner's process-wide setup, before test modules execute.
- Cover both `globalThis.fetch` and the underlying socket boundary (`node:net.Socket.connect` or the
  runtime-equivalent), because HTTP clients and provider SDKs may bypass `fetch`.
- Permit loopback and local IPC only. A live-provider lane is separate, explicit, credential-scoped,
  human-gated when billed/mutating, and never enabled by a casual environment escape in the normal suite.
- Give the guard its own tests: public fetch blocked, direct public socket blocked, loopback succeeds,
  and the original provider test now uses an explicit fake.

*Fail-state:* removing only the fetch wrapper or only the socket wrapper still leaves the boundary
green. Killer mutations: delete each wrapper independently; its matching attack test must fail.

## Idempotency And Concurrency Proof

When behavior is described as idempotent, test both:

- sequential retry after success,
- concurrent duplicate trigger, double-submit, replay, or provider redelivery.

Prefer integration tests around the real persistence boundary. The implementation should rely on a durable guard such as a unique key, row lock, claim step, provider event ID, or persisted state transition, not only UI-disabled controls or pre-read status checks.

## Shared Harness For A Heavily-Mounted Surface (kill the provider/context cascade)

When many test files mount the SAME surface (a page, an app shell, a screen), the provider/context stack they wrap it in gets duplicated per file — and the day that surface gains a new PAGE-LEVEL context dependency, EVERY one of those files breaks at once and takes the identical patch. Centralize the mount in ONE shared render helper (`renderX(opts?)` + an `XProviders` component) that owns the provider stack; each suite routes its render through it and keeps only its own per-case overrides.

- **Provide new context deps as REAL context, not a per-file mock.** Wrap the surface in the real `<Ctx.Provider value={testValue}>` (export the context object if it's module-private — a zero-runtime change) rather than a `vi.mock('…Context', …)` repeated in every file. Real context means the NEXT context dependency the surface gains is satisfied by the helper alone — a one-file change, not an N-file cascade. A `vi.mock` is hoisted per-file and cannot be centralized into a plain helper module, so mocking the context re-creates the very cascade you're trying to kill.
- **Scope line — centralize the STACK, not the per-suite mocks.** The helper owns the provider stack only. Leave each suite's own `vi.mock`s for the hooks/SDK/api it drives — they are hoisted per-file, vary meaningfully per suite (captured handlers, mutable state holders, different api subsets, a suite that deliberately mocks at the SDK level so it can still exercise the real hooks), and unifying them flattens real differences. Only the shared provider stack belongs in the helper.
- Keep the helper OUT of the test-file glob (name it `renderX.tsx`, not `*.test.tsx`) so the runner and the intent gate don't treat it as a test.

*Fail-state:* a new test for a heavily-mounted surface hand-rolls the provider tree (or a `vi.mock` of a page-level context) inline instead of routing through the shared helper — so the next page-level provider dependency breaks it along with every file that copied the pattern.

## Verifying The Tests

A green suite proves the code reached the assertions. It does not prove the assertions would catch a bug. Apply these disciplines on top of the regular test loop:

- **Mutation testing.** After tests pass, deliberately break the implementation in a small, targeted way and confirm at least one test fails. If no test fails, the test is vacuous. Aim for at least three mutations per non-trivial unit covering variant selection, side effects, accessibility-critical attributes, state derivation, and default values.
- **Paired-condition rule.** A test of the form "X must not happen" passes vacuously when the code that produces X is disabled. Pair every negative assertion with a positive assertion from the same execution path, or add an explicit liveness signal.
- **Proxy-assertion fallacy.** A test that asserts a side effect (a throw, a log, a redirect) passes when ANY occurrence of that side effect happens, not only the intentional one. Mock the producing function and assert the call arguments directly. `expect(fn).rejects.toThrow()` is vacuous; `expect(fn).rejects.toThrow(/specific-marker/)` plus `expect(mock).toHaveBeenCalledWith(specificArgs)` is not.
- **Boundary-value testing.** Every numeric or temporal threshold in a spec (≤, ≥, <, >, retention windows, rate limits, validation lengths) requires explicit tests at `boundary - 1`, `boundary`, `boundary + 1`, and a degenerate value (zero, empty, today, null). The same rule applies to **list cardinality** — every list-shaped prop gets `[]`, `[one]`, `[N]` probes regardless of whether the source code renders visible empty-state copy. Force inclusivity into the spec; do not let the implementation make it implicit.
- **Assumption probes for migrations.** When code is replaced (raw markup → wrapper component, native control → library widget, in-line text → externalized string), write a separate probe suite naming each pre-migration assumption as `"ASSUMPTION: <original contract>"`. Cover three independent layers: **structural** (elements + attrs), **content** (rendered text including spec-bound disclaimers), and **side-effect** (Prisma/network/navigation call arguments). The new tests cover the new contract; probes cover what the old contract guaranteed.

Record the verification evidence (mutation log, boundary table, probe suite) as part of the deliverable. A test suite without this evidence is unverified.

Full guidance in `references/verifying-tests-mutation-probes-and-boundaries.md`.

## Use References

- TDD workflow: `references/test-driven-development.md`
- Advanced testing strategy: `references/advanced-testing-strategy.md`
- Property-based testing: `references/property-based-testing.md`
- Coverage analysis: `references/coverage-analysis.md`
- Verifying tests (mutation, probes, boundaries): `references/verifying-tests-mutation-probes-and-boundaries.md`

## Verification

Report exactly what was run, what passed, and what remains unverified. Include any mutation-test evidence and probe-suite results for migrations.
