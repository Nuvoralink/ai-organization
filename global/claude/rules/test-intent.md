---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/__tests__/**/*"
  - "**/e2e/**/*"
  - "scripts/**/*gate*"
  - "scripts/**/*check*"
---

# Test Intent — Every Test Declares What It Proves, and Bites

Purpose: a test exists to prove a *product/system decision* holds and would **fail** if that decision regressed. A test that compiles, runs green, and proves nothing is theater — worse than no test, because it manufactures false confidence. This rule makes intent explicit at the file level and wires a gate so intent-less tests can't accumulate. Always-on; the execution sibling of slice-rigor §6 and gauntlet Gate 3 ("tests must bite").

## 1. Every test file carries an intent header
At the top of each test file (or each describe block for mixed files):
```
Proves: <requirement / benchmark / decision IDs this test defends>
Test type: <unit | contract | integration | tenant-isolation | three-fold-paired | bounded-repair | source-to-screen | e2e>
Surface: <the user-visible or system surface under test>
Authority: <which source-of-truth owns the decision being asserted>
<one-line product statement: "Given X, the system does Y; if it regressed to Z, this fails.">
```
A test without a `Proves:` line is not allowed. `Proves:` must reference a real ID from the project's requirement/benchmark/decision registry — not a vague phrase.

## 2. The test must bite
For every test, name the concrete **mutation** that should make it fail (the regression it defends against) — AND the **GATED command that turns red** under that mutation (a check that lives only on an ungated or permanently-red surface — an aux tsconfig no gate compiles, a script no CI runs — proves nothing; 2026-07-12 CoachAI CA-4: a DTO type-guard "bit" only in a 233-errors-red scripts tsconfig that verify never compiles). If you can't name a mutation that breaks it, the test isn't testing the right thing. Pair every positive assertion with the negative/fail-closed path — happy-path-only is half a test.

**Mode-bit assertions never certify delivered scope.** A regression that asserts a gate/mode/flag FUNCTION returns the right value does not prove the behavior the mode gates was DELIVERED — pair it with an assertion on the gated artifact itself (the required rows produced, the substage output, the skip warning), and aim the killer mutation at the WIRING, not the helper (2026-07-13 CoachAI CA-5: "SW-12 CLOSED" was certified by a mode-function test while the row-builder still withheld every row in the target population — mode on, zero rows delivered; and a "skip gate" regression tested only the threshold helper while the deleted pipeline branch stayed green).

**Validation claims are PATH-scoped.** A live/A-B/smoke validation claim must name the exact code path it exercised and flag every diff path it did NOT reach — "live validation done" that exercised only the unchunked/single-shot/happy variant is a false-confidence claim for the windowed/retry/fallback variants. And plumbing-level proof is never behavior proof: a regression asserting a prompt/string/payload was ASSEMBLED correctly says nothing about how the model/system BEHAVES with it (origin: CoachAI #186 — a prompt-injection tail was "validated live" single-shot while the chunked path it existed for was never exercised, hiding a timestamp double-offset hazard).

**Public network is a denied test boundary.** The normal unit/local-integration runner installs a
process-wide, default-deny egress guard before test modules load. It blocks both `globalThis.fetch`
and direct non-loopback sockets; permitting fetch alone misses SDK/HTTP-client transports. Loopback
and local IPC remain live. Provider tests use explicit fakes. A live-provider lane is separate,
credential-scoped, and human-gated when billed or mutating; no ordinary env flag silently weakens the
normal runner. The guard carries attack tests for public fetch, public socket, and loopback liveness.
Killer mutations delete each wrapper independently and make its matching attack test red.

**Source sentinels are authority consumers.** A test that inspects source ordering or wiring must name
the complete set of *current* authority/effect anchors, assert every anchor exists before comparing its
position, and bound its scan to the exact function or region under test. When an authority or entrypoint
is replaced, its companion sentinel changes in the same slice; an old symbol found only in the test is
not compatibility, it is stale proof. Killer mutations remove each current anchor independently, move
the protected effect before its guard, and delete the region-end boundary so an unrelated later call
cannot make the test pass. For SQL `CHECK` constraints whose contract requires total fail-closed
behavior under three-valued logic, assert the total form (`(predicate) IS TRUE` or an equivalent proven
total expression), not merely the inner predicate; removing totality must make the test red.

## 3. Forbidden shapes (a reviewer rejects these)
- **Vacuous / tautological** — asserts something that's true by construction.
- **Mock-the-SUT** — mocks the very thing under test, so it proves the mock, not the code.
- **Golden-mirrors-implementation** — the expected value is computed the same way the code computes it, so a bug in both passes; the golden must be derived independently from realistic fixtures.
- **Presence-only** — asserts "a helper/field/file exists" instead of exercising the behavior.
- **Stale** — still references removed behavior but passes because it no longer runs the real path.

## 4. A false-passing test is P0
A test that passes without exercising the decision it *claims* to prove is a **P0 bug: fix it that turn, never backlog it, never `.skip` it to green.** It is more dangerous than a failing test because it hides a real regression behind a green check.

**Boundary/refinement fixtures must DIVERGE.** A test defending a boundary/walk-back/clip/parse refinement proves nothing if its fixture is reachable by the PRE-refinement implementation — calibrate the input so the old code demonstrably produces a different, wrong output, and assert against that wrong shape (`!== wrongShape`, or a `// pre-fix output: <X>` divergence comment) in addition to the correct one. The named mutation must be INDIVIDUALLY sufficient to redden the test — on defense-in-depth fixes, exercise each layer on the path where it alone defends. Cheapest verification: a standalone old-vs-new harness on the exact fixture; if both implementations agree, the fixture is inert. (Origin: CoachAI COACH-COMPLETE-1, 2026-07-12 — a delimiter-aware-clip fixture whose in-quote period sat past the char budget passed identically under the quote-blind clip.)

## 5. Wire the gate, not just the rule
Where the project can, a CI gate scans test files for the intent header + a real `Proves:` ID and fails the build on a missing/placeholder one — so the discipline bites automatically (per the doctrine-loop rule). If no such gate exists yet, that gate is a named follow-up, not an excuse to skip the header.

*Fail-state:* a test shipped without a `Proves:` header, or with one that names no real requirement — or a green test was trusted that would still pass against a regressed version of the change it supposedly defends.
