---
paths:
{{TEST_RULE_PATHS_YAML}}
---
<!-- TEMPLATE: the test-intent rule. Save as {{RULES_DIR}}/test-intent.md (or .mdc). Enforced by the gate:test-intent gate.
     FILL {{PLACEHOLDER}}s (the requirement-ID sources, the test-type list, the file globs). -->

# Test Intent — Every Test Declares What It Proves, and Bites

Purpose: a test exists to prove a product/system decision holds and would **fail** if that decision regressed. A test that compiles, runs green, and proves nothing is theater — worse than no test, because it manufactures false confidence. This rule makes intent explicit at the file level and wires a gate so intent-less tests can't accumulate.

## 1. Required header in every test file
Every `{{TEST_FILE_GLOBS}}` file begins with:
```
Proves: {{REQ_ID_EXAMPLES}}   // real IDs from {{REQUIREMENT_ID_SOURCE}}
Test type: <one of: {{TEST_TYPES}}>
Surface: <the file/module under test>
Authority: <which source-of-truth owns the decision being asserted>
What this test proves about the product: <1–4 sentences: "Given X, the system does Y; if it regressed to Z, this fails.">
Killer mutation: <the exact behavior/code/fixture mutation that must make this test fail>
Gated command: <the aggregate command/CI job that runs this test>
```
A test missing any required header line is not allowed. `Proves:` must reference a real ID from {{REQUIREMENT_ID_SOURCE}} — not a vague phrase. `Killer mutation:` and `Gated command:` are mandatory, not review-time memory. Strongly recommended: `Negative path covered:`, `Anti-pattern this test guards against:`, and (where applicable) a three-fold-paired or bounded-repair note.

## 2. The test must bite
For every test, name the concrete **mutation** that should make it fail. If you can't name a mutation that breaks it, the test isn't testing the right thing. Pair every positive assertion with the negative/fail-closed path — happy-path-only is half a test.

**Composite claims require isolated mutations.** When `Proves:` or `Killer mutation:` names multiple independent properties, use one independently isolated test case (or separately named subtest) per property. A mutation that changes two properties at once does not independently prove either one.

**Executable surfaces require entrypoint liveness.** When `Surface:` names an executable entrypoint or script, the test must spawn that entrypoint or import a symbol defined and exported by that exact entrypoint. Exercising only a helper behind the entrypoint does not prove its argument parsing or wiring.

**Multi-operation mocks dispatch by observable operation identity.** If one mock can receive multiple queries or operations, branch on an operation name, stable query marker, tagged statement, or distinguishing arguments; return a contract-correct payload per expected branch, throw on every unknown branch, and assert each expected branch's liveness. A catch-all response or call-order-only mock is forbidden. Authority-bound exact-key inputs use `satisfies` or an explicit annotation at construction, plus an exact-key assertion when runtime shape matters; an intermediate variable must not bypass stale-key detection. Killer mutation: replace the dispatcher with a catch-all response or add an unhandled operation; the test must turn red. Counterexample: a mock with exactly one possible operation needs no artificial dispatch. *Fail-state:* incompatible operations silently consume one shared fake payload, or a stale extra key survives through an unannotated intermediate variable.

## 3. Forbidden shapes (a reviewer rejects these)
- **Vacuous / tautological** — asserts something true by construction.
- **Mock-the-SUT** — mocks the very thing under test, so it proves the mock, not the code.
- **Golden-mirrors-implementation** — the expected value is computed the same way the code computes it; the golden must be derived independently from realistic fixtures.
- **Presence-only** — asserts "a helper/field/file exists" instead of exercising the behavior.
- **Stale** — references removed behavior but passes because it no longer runs the real path.
- **Route/authority-layer behavior covered ONLY by client/unit tests that can't reach the route** — add a route/integration test that EXERCISES the handler.

### Source sentinels are authority consumers
A test that inspects source ordering or wiring must enumerate the complete set of *current*
authority/effect anchors, assert each anchor exists before comparing positions, and bound its scan to
the exact function or region under test. Replacing an authority or entrypoint requires updating its
companion sentinel in the same slice; do not leave an obsolete symbol in a green source-inspection
test. Killer mutations remove each current anchor independently, move the protected effect before its
guard, and delete the region-end boundary so an unrelated later call cannot create a false pass. When
a SQL `CHECK` contract requires total fail-closed behavior under three-valued logic, assert
`(predicate) IS TRUE` or an equivalent proven-total expression; removing the totality operator must
make the test red.

## 4. A false-passing test is P0 — fix the moment it's found (never backlog, never skip)
A test that passes when it should fail (mocks the SUT, asserts a tautology the same patch hardcoded, never reaches the decision it claims) is worse than no test — it certifies broken code as working. The instant one is found: **fix it now** (never a backlog row, never a follow-up), **never `.skip`/`xit`/comment-out/loosen to green**, and **make it bite** (rewrite to exercise the real SUT; name the killer mutation and confirm it breaks). If a whole class slipped, strengthen the upstream control too (doctrine-loop Arm 1) — in addition, never instead.

## 5. Isolation — a gate/whole-tree meta-test must NEVER write fixtures into the live source tree
A test that spawns a real gate and seeds a fixture into the LIVE source tree is flaky by construction (parallel test workers race the walk; a crashed test strands a fixture that poisons the next gate run). Build a throwaway `os.tmpdir()` scaffold, seed the fixture there, run the gate with `cwd:<scaffold>`. Reviewer-enforced.

## 6. Public network is denied in the normal test runner
Install a process-wide default-deny egress guard before test modules load. It blocks both
`globalThis.fetch` and direct non-loopback sockets; loopback and local IPC remain available. Provider
tests use explicit fakes. Any live-provider lane is separate, credential-scoped, and human-gated when
billed or mutating; do not add an ordinary environment escape that weakens the normal runner. Add
attack tests for public fetch, direct public socket, and loopback liveness. Killer mutations: remove
each wrapper independently and require its matching test to fail.

## 7. Wire the gate
`{{TEST_INTENT_GATE}}` scans every real test root (including browser/e2e lanes outside `src`) for the intent header + real `Proves:` IDs and fails the build on a missing/placeholder/unresolved one. Candidate extraction happens before catalog resolution, so one valid ID cannot hide a typo beside it. Catalog only owning authority sources: PRD/NFR tables, decision-log rows, ADR H1 IDs, benchmark registries, and bug-backlog headings; do not scan arbitrary prose as an ID authority. It runs in `gates:all` and in the CI mirror. Until `{{SRC_DIRS}}` exist it bootstrap-skips.

**Test-runner discovery is part of the proof.** A named proof command must fail when it discovers zero files or executes zero tests; never use `--passWithNoTests` (or an equivalent ignore-empty switch) in a proof, aggregate, CI, integration, or closure lane. Workspace-filtered paths are resolved from that workspace's effective cwd. Aggregates must explicitly reach every test-bearing workspace, or a derived inventory gate must prove that they do. Raw proof includes the command's own exit plus nonzero file and executed-test counts for every expected workspace/lane. Killer mutations: re-add an ignore-empty flag, delete a test-bearing workspace's test script, or pass a repository-root-prefixed filter through a workspace runner; each must turn the proof red. Counterexample: a workspace with no test files may omit a test command and is not required to manufacture a no-op test.

*Fail-state:* a test shipped without a `Proves:` header, or with one naming no real requirement — or a green test was trusted that would still pass against a regressed version of the change it supposedly defends, including a runner that exited zero after discovering no proof.
