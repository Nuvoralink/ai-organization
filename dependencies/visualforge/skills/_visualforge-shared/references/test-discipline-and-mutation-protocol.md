# Test discipline and mutation protocol — VisualForge

## Why this document exists

A green test suite is unfalsifiable unless we know which tests would fail under a real bug. The plugin's own self-test harness shipped with 8/8 GREEN — and 3 of those fixtures **also passed when the validator was sabotaged to a no-op**. We caught it because we deliberately sabotaged. The pattern repeats at the implementation layer: a Tabs component with `data-variant='vertical'` passed a "variant" test even when `aria-orientation` was hardcoded to `horizontal` (the actual behavior the variant exists for).

This document encodes the discipline that prevents that.

## The six rules

### Rule 1 — Every test must have a positive signal

A test of the form "X must not appear in output" is **vacuous** when the code that would produce X is disabled. Pure `*_exclude` / `not.toBeInTheDocument()` / "no errors raised" assertions are a vacuous-pass risk.

**Fix:** pair every negative assertion with a positive one. If the test claims "broken X does not happen," it must also assert "working Y does happen" from the same code path. The plugin's fixture system enforces this via `verdict_must_be` + `min_total_findings` keys; component tests enforce it by including paired conditions in the same fixture (one normal, one trigger).

### Rule 2 — Boundary values get explicit tests

Any spec with a numeric threshold (≤ 7 days, ≥ 99%, < 5%, 24 hours, 44×44 px) requires tests at:
- The exact boundary value
- One unit on each side of the boundary
- A degenerate value (zero, negative, today-as-now, empty string)

Reason: thresholds are where math errors hide. RenewalCard's `days <= 7 → urgent` worked for "days = 6" and "days = 30" but the spec was ambiguous at `days = 7` (inclusive vs exclusive) and at `days = 0` (today). The bug was implicit until we wrote `days=7`, `days=8`, and `due-today` boundary tests.

### Rule 3 — Mutation testing is the verification of the tests

After a test suite is written, run mutation testing: deliberately break the implementation in N ways and verify N tests fail. The expected outcome is:

- **One mutation = one failing test (or a small known cluster).**
  - If 0 tests fail, the test is vacuous → strengthen it.
  - If 100% of tests fail, the test fixture is over-coupled → split it.

Record results in `auditability/implementation-mutation-log.md` per component.

Minimum mutations to attempt per component:
- One per **variant-controlled behavior** (e.g., disable a variant condition).
- One per **side effect** (e.g., remove the callback wiring).
- One per **a11y-critical attribute** (e.g., drop the aria-label spread).
- One per **state derivation** (e.g., force a state machine into one branch).

### Rule 4 — Polymorphic components need a test per branch

When a component picks a render tree at runtime (`<a>` vs `<button>` vs `<article>`), every branch needs:
- An assertion of the rendered tag (`tagName`)
- An assertion of the activation path appropriate to that tag (click on `<button>`, href on `<a>`)
- An assertion that the OTHER branches do NOT render

Forgotten branches = dead code at the type system level but live code at runtime, exactly the worst combination.

### Rule 5 — Polyfills are a smell that needs disclosure

If a unit test needs `ResizeObserver`, `setPointerCapture`, `scrollIntoView`, or other jsdom-missing APIs polyfilled, the test isn't really proving browser behavior — it's proving wiring. That's still useful, but the real behavior must be exercised somewhere else:

- Polyfilled component → must also have a Playwright (or equivalent) E2E test for the actual interaction.
- Add the polyfill to `tests/components/setup.ts` (or equivalent) with a comment explaining the gap.
- Add a row to `auditability/test-environment-disclosures.md` (or implementation log) listing what is polyfilled vs what really runs.

### Rule 6 — Assumption probes for migrations and substitutions

Mutation testing catches "this code path's logic broke." Probe testing catches "this code path SECRETLY changed contract." They are different classes of bug.

When a page or component is **migrated** from one implementation to another (e.g., raw `<button>` → VF `Button`, raw `<h1>` → `CardTitle`), the new tests cover the new contract. They do NOT automatically cover what the old contract guaranteed. Silent semantic drift hides in the gap.

The discipline: after a migration, write a separate **probe suite** that articulates each pre-migration assumption AS A TEST. Phrase each test as `"ASSUMPTION: <thing-the-old-impl-guaranteed>"`. Examples that have caught real bugs:

- "ASSUMPTION: the page has exactly one `<h1>`" — caught a CardTitle (h3) replacing the original page h1.
- "ASSUMPTION: submit buttons have `type='submit'` (not the VF Button default `type='button'`)" — would catch forgetting to override the default.
- "ASSUMPTION: email input has `name='email'` (the server action reads `formData.get('email')`)" — would catch a rename that silently delivers magic links to nobody.
- "ASSUMPTION: every `var(--vf-*)` referenced in rendered output exists in `tokens.css`" — end-to-end token resolution.
- "ASSUMPTION: `next build` succeeds and the route is rendered as `ƒ` dynamic, not `○` static" — confirms searchParams wiring.

Probe-tests are the antidote to the "trivial wrapper" failure mode: a component substitution that looks identical at the call site (`<h1>` → `<CardTitle>`) but ships with a different semantic.

The "wrapper hides a semantic decision" smell is named **wrapper-encapsulated semantic drift**. Canonical case: heading-level regression when a `CardTitle`-style component defaults to a lower-level heading than the original raw `<h1>`. Same pattern applies to any wrapper that encapsulates ARIA role, semantic HTML tag, or default attribute value.

#### Page-migration probe checklist

For every page that migrates to VF components, the probe suite MUST assert (a minimum, not exhaustive):

| Assumption category | What the probe must assert |
|---|---|
| Heading hierarchy | Exactly one `<h1>` exists; pre-migration heading levels match. |
| Landmark structure | `<main>` still present; `<nav>` / `<aside>` survive if originals had them. |
| Form action wiring | Each `<form action={X}>` references the correct server action; each input `name=` matches the action's `formData.get(key)` call. |
| Submit button `type` | Every button inside a form has `type='submit'` if it should submit (VF Button defaults to `'button'`). |
| Tokens resolve end-to-end | Every `var(--vf-*)` in rendered HTML exists in `tokens.css`; only Tier-2 semantic tokens are referenced (no `--vf-color-*` primitive leaks). |
| Polymorphic component default | When a polymorphic component is used without disambiguating props, the rendered tag matches the spec's default. |
| Production build mode | `next build` exits 0; routes appear in the expected `○` static / `ƒ` dynamic mode. |
| ARIA roles preserved | Non-default `role="..."` attributes (alert, dialog, etc.) survive the migration. |
| Side-effect specificity | Probes for redirects, dispatches, logged events, or persistence writes assert the **call arguments** — not just "something threw" or "something happened." See testing-strategy-and-tdd § "The proxy-assertion fallacy" for the general rule and the redirect-mock recipe. |
| Content layer | When a page renders domain data (workspace name, role, status, counts), the probe asserts the text appears, not only that the containing element exists. |
| A11y label/id linkage | Every `<label htmlFor>` has a matching `id`; loop the labels and assert each target exists. The design system cannot enforce this at the wrapper level — it's a per-call-site contract. |
| HTTP-method side-effect safety | A GET handler that performs a single-use side effect (token consume, debit, claim) is unsafe — email-client prefetchers + CDN warmers + browser tab prefetchers can hit it. Page tests for such endpoints MUST assert that rendering does NOT call the persistence method (mock the call, assert `not.toHaveBeenCalled`). The corresponding POST handler holds the side effect. See `failure-isolation-by-layer.md` § "HTTP-method discipline." |
| Critical-vs-degraded path classification | Multi-step actions that call notification / audit / analytics side effects after a persistence transaction MUST isolate those calls so a thrown error cannot cancel the success redirect. Layout-injected decorations (banners, badges) must isolate their data reads so a session-decrypt or DB blip cannot 500 every page. Tests drive the degraded-path rejection (mock the dependency to throw) and assert the critical path still completes (page renders / action redirects). See `failure-isolation-by-layer.md`. |

A page migration with zero probe tests is incomplete regardless of how many unit tests its new components have.

The general disciplines (boundary-value testing, paired-condition rule, mutation evidence per route) are documented once in **testing-strategy-and-tdd § "Verifying the tests"**. They apply to all migrations; this skill names only the VF-specific assumptions a wrapper migration is likely to break.

#### Shared-contract / content-map update is part of the slice

A page migration that adds or repurposes a shared surface (a new component import, a new screen-spec reference, a new view-model consumer) MUST update `auditability/content-map.md` in the same slice. The rule is in `shared-contracts-and-blast-radius.md`; the operational point for migrations is: when this slice changes who-consumes-what, the consumer registry in the content map is part of the deliverable, alongside the mutation log and the probe suite.

A slice that only refactors internals (no new public surface, no new consumer) does not need a content-map update.

## Required artifacts

Any subskill that produces implementation (frontend-contract, design-ops, agent-rules-update) must, at completion, verify the presence of:

1. `auditability/implementation-mutation-log.md` — per-component mutation table.
2. Per-component test file that asserts at least one paired condition for each variant/state in the spec.
3. Disclosure of test-environment polyfills if any.

The plugin validator emits a WARN (and a FAIL in `--strict`) when these are absent and `src/components/ui/**` (or equivalent implementation dir) exists.

## Mutation-test recipe

A pragmatic, low-tool workflow:

```bash
# 1. Back up the file
cp src/components/ui/<name>.tsx /tmp/backup.tsx

# 2. Apply one mutation (e.g., flip a default, remove a guard, drop an attribute)
python -c "
src = open('src/components/ui/<name>.tsx').read()
mutated = src.replace('ORIGINAL', 'MUTATED')
assert mutated != src, 'mutation did not apply'
open('src/components/ui/<name>.tsx', 'w').write(mutated)
"

# 3. Run the test suite for that component
pnpm exec vitest run --project components tests/components/<name>.test.tsx

# 4. Verify the expected test(s) fail
# 5. Restore
cp /tmp/backup.tsx src/components/ui/<name>.tsx
```

The exit code from step 3 should be 1 (some test failed). If it's 0, the mutation is undetectable → the test is vacuous → improve it.

## Anti-patterns to reject

- "It's just a lookup table, no test needed" — variant tables have selector logic; selector logic has bugs (proven by Tabs orientation).
- "The Radix primitive handles it" — true for ARIA defaults; not true for our wrapping. Test the props we pass through.
- "Coverage is high" — coverage is the floor, not the proof. A line is covered if the test executes it; a behavior is verified only if the test fails when the line breaks.
- "Snapshot tests" — snapshot tests pass when the snapshot is regenerated after the bug ships. They are a UI-stability signal, not a behavior verification.

## Cross-cite

- Plugin finding **VF-FIND-023** (positive-control fixtures vacuously passed sabotaged validator) is the originating evidence.
- `examples/fixtures/README.md` § "Positive vs negative fixtures" enforces this at the plugin level.
- `auditability/implementation-mutation-log.md` (per-project) enforces this at the consuming-project level.
