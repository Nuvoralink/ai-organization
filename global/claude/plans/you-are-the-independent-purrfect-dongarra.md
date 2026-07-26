# Adversarial review — Sprint 1.4 mock-proof tooling (checkpoint 0098f4f8)

## Context

Independent adversarial review of the Sprint-1.4 mock-package proof tooling at checkpoint
`0098f4f8` (parent `49987c30`) on `codex/s14-mock-tooling`. Scope reviewed read-only:
`scripts/mock-handoff-proof.mjs` (4236 lines, whole file), `backend/src/__tests__/mock-handoff-proof.test.ts`
(3527 lines, whole file), `docs/design-system/handoffs/MOCK-PACKAGE-PROOF-CONTRACT.md`,
`docs/agent-prompts/sprint-1-4/kickoff-goal.md`, and the governing always-on rules. Verified load-bearing
facts with `grep` rather than recollection.

The trust-boundary machinery is, on the whole, exceptionally well-hardened: recipe-authored
`passed:true`/screenshots/status are never trusted; DOM/CDP backend-node identity is pinned and re-checked
at every phase (pre-freeze, paint baseline, paint restoration, AX probe, final artifact); the immutable
phase is enforced by `Page.setWebLifecycleState frozen` + `debugger`-pause + `setScriptExecutionDisabled`
with a triple-screenshot-equality guard closing the baseline→pause window; paint suppression is gated by a
pre-freeze `inspectStateSemantic` visibility pass so `[style]`-reactive CSS decoys cannot manufacture a
false pass; `--verify-evidence` re-clones the bundle, re-derives every authority from the claimed commit,
re-executes a fresh proof, and requires exact `JSON.stringify` equality of recipeResults + byte-exact
PNGs; the authority-excerpt matcher is code-point/combining-mark/format-char aware; resource lifecycle and
error aggregation are correct. I found **no P0/P1 trust-boundary bypass**. The findings below are
completeness/robustness/CDP-assumption gaps.

---

## Verdict: FALSE

## Findings (most severe first)

### P2 — Verifier does not reject uncaught exceptions or console errors (CONFIRMED)
`scripts/mock-handoff-proof.mjs:1904` (`context.on('console')` early-returns on every non-`debug`
message) and `:2148-2169` (the `page.on(...)` handler set has **no `pageerror`**; only
frameattached/framenavigated/worker/download/crash/response). Grep confirms no `pageerror`,
`unhandledrejection`, or console-error handling anywhere in the script, and no test in the suite covers it.

- **Regression/exploit path:** a mock `*.dc.html` whose script throws an uncaught exception on load (or in
  an event handler *after* it has already set the asserted DOM state), or that emits `console.error`/`warn`
  on load, produces **zero** violations. If the declared recipes' expectations still hold, capture, the
  built-in self-replay, and `--verify-evidence` all PASS and emit "runtime-grounded" evidence for a mock
  that is erroring at runtime. The only reason a broken mock fails today is if the error happens to break a
  specifically-asserted expectation.
- **Violated contract:** the settled review contract — *"reject console/uncaught/network/style/motion/focus/
  identity drift"* — network/motion/identity/style are enforced; **console-drift and uncaught-drift are
  not.** Also weakens "runtime-grounded evidence" and agent-product-intent §"build it to work". Note: the
  in-repo `MOCK-PACKAGE-PROOF-CONTRACT.md` "Browser isolation" ledger list does **not** enumerate
  uncaught/console either, so code and doc are self-consistent but both fall short of the stated bar — the
  doc must be updated in the same fix if rejection is intended (doctrine-loop Arm 3).
- **Smallest durable fix:** in `createIsolatedPage`, add
  `page.on('pageerror', (e) => recordViolation('uncaught exception: ' + e.message));` and record
  non-channel console messages of type `error`/`warning` as violations (channel-prefixed `debug` stays the
  reserved reporter path). Add a killer-mutation test: a mock that throws on load with otherwise-passing
  recipes must exit non-zero with truthful failed evidence. Add the two categories to the contract doc's
  ledger list.

### P3 — Focus emulation is set on an immediately-detached CDP session (PLAUSIBLE)
`scripts/mock-handoff-proof.mjs:2143-2146`: `focusSession = context.newCDPSession(page)` →
`Emulation.setFocusEmulationEnabled {enabled:true}` → `focusSession.detach()`.

- **Regression path:** CDP emulation overrides are frequently reverted when the session that set them
  detaches. If focus emulation does not persist past detach, the page is not rendered as focused, so
  `:focus`/`:focus-visible` styling never applies during the frozen baseline and the frozen
  `:where(:focus-visible){outline-style:solid}` normalization has nothing to normalize — the focus-state
  rendering that Sprint 1.4 M01-M10 requires is silently vacuous. The `focused` recipe assertion still
  passes (it reads `document.activeElement === element`, independent of window focus), which *masks* the
  gap. If, conversely, Playwright already emulates focus by default, this call is dead code.
- **Violated contract:** "reject … focus … drift" / focus-state proof. Needs empirical confirmation (I did
  not run the tool).
- **Smallest durable fix:** set focus emulation on the persistent page/context session and do not detach
  (or keep the session for the page's lifetime), and add one rendered assertion that a focused element
  actually shows a focus indicator in the captured artifact — proving focus rendering, not just
  `activeElement`.

### P3 — "Portable / origin-independent" revalidation is platform-locked (CONFIRMED, fails closed)
`scripts/mock-handoff-proof.mjs:3686` pins `evidence.proofRuntime` to the current runtime via `exactJson`,
and `PROOF_RUNTIME_MANIFEST.semantics` includes `platform = process.platform` and
`architecture = process.arch` (`:296-297`, fed from `:211-212`). Combined with byte-exact retained-vs-fresh
PNG comparison (`:3819-3822`), revalidation succeeds only on an **identical** OS + arch + Node/V8/ICU +
Playwright/Chromium.

- **Regression path:** a reviewer on a different OS/arch than the capture machine cannot run
  `--verify-evidence` — it fails at the proofRuntime `exactJson` (or, same runtime but different
  font/GPU stack, at the PNG byte compare). This is **fail-closed** (no false pass), but
  `MOCK-PACKAGE-PROOF-CONTRACT.md` §"Portable evidence and fresh revalidation" ("Revalidation does not need
  the originating worktree", "portable review artifacts") oversells portability that is actually
  same-platform-only.
- **Violated contract:** doc-honesty (agent-product-intent §"honesty without usefulness"); the doc implies
  broader portability than the pinned runtime allows.
- **Smallest durable fix:** state the same-platform/same-toolchain requirement explicitly in the contract's
  Portable-evidence section. (Relaxing cross-platform verification is larger scope and should be a separate,
  escalated decision, since it would weaken the determinism guarantee.)

---

## Surfaces NOT reached (honesty clause)
- **The tool/tests were never executed** (read-only, plan mode). Every CDP/runtime conclusion —
  focus-emulation persistence, two-run and cross-machine PNG determinism, isolated-world→`console.debug`→
  host barrier ordering — is a static-analysis lead, not executed proof. The barrier-ordering unit test at
  `test:457` uses a **fake** CDP session, so the real isolated-world console path is proven only indirectly
  by the full 16-capture tests passing.
- `scripts/check-endpoint-wiring.mjs` internals (`collectEndpointDefs`) were **not** read; the control
  endpoint-key resolution is assumed correct.
- The vitest config and full `test`/`verify` npm scripts were **not** read — whether the browser proof
  suite is lane-gated / skip-guarded is unconfirmed (see doctrine-loop).
- `shared/src/contracts/calls.ts`, `shared/src/taxonomy/permissions.ts`, and the cited ADR/authority
  markdown were **not** read; DTO/permission/authority resolution is assumed correct.
- The rest of the checkpoint diff (`check-decision-sprint-linkage.mjs`, `check-future-seam-consumption.mjs`,
  doc/decision-log churn) is **out of this mock-proof mandate** and was not reviewed.

---

## Doctrine-loop findings

**Finding:** the heavy real-browser proof suite (dozens of `runCli` 16-capture + 15-recipe launches at
180s timeouts, plus byte-exact self-replay) lives in `backend/src/__tests__/mock-handoff-proof.test.ts`
with **no `skipIf`/env guard**, so `npm test` / `npm run verify` now hard-requires Playwright browser
binaries and pays a large, determinism-dependent runtime in the "fast local gate."
- **RCA q1 (why introduced):** a browser-integration proof was placed in the unit-test tree with no
  fast-vs-browser lane separation.
- **RCA q2 (why no control caught it):** no rule/gate distinguishes fast unit tests from browser-launching
  integration tests, and `test-intent`/`testing-guardrails` neither cap per-file runtime nor require an env
  guard for suites that launch a real browser.
- **Smallest control fix:** require browser-launching test files to carry a `skipIf(!<PROOF_ENV_FLAG>)` or
  live in a dedicated `test:proof` lane invoked at sprint-close (like `test:integration`), and name that
  lane in `testing-guardrails.md`. *(Lead, not verdict: I did not read the vitest config, so a lane guard
  may already exist — the orchestrator should confirm before routing.)*
- **Universal-layer candidate:** the "browser-integration tests need a lane guard, not the fast unit gate"
  class generalizes to any project (`testing-strategy-and-tdd`, the global testing rule).

---

## Proposed remediation (if approved)
1. P2: wire `pageerror` + error/warn console into `recordViolation`; add the killer-mutation test; update
   the contract doc ledger list.
2. P3 (focus): confirm CDP focus-emulation persistence; if it does not persist, stop detaching the session
   and add a rendered focus-indicator assertion.
3. P3 (portability): document the same-platform requirement in `MOCK-PACKAGE-PROOF-CONTRACT.md`.
4. Doctrine-loop: add the browser-test lane guard + `testing-guardrails.md` note (after confirming no
   existing guard).
