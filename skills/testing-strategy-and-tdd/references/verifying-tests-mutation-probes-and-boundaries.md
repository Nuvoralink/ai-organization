# Verifying tests: mutation, probes, and boundaries

A passing test suite is unfalsifiable unless we know which tests would fail when a real bug ships. This reference covers four disciplines that turn coverage into confidence:

1. **Mutation testing** — verifying that tests fail when the implementation breaks.
2. **Paired-condition rule** — defeating the "vacuous absence" failure mode.
3. **Boundary-value testing** — finding the bugs that hide at thresholds.
4. **Assumption probes** — catching silent contract drift during migrations and refactors.

Use these alongside the regular TDD loop. They are the verification layer on top of the tests, not a replacement for them.

---

## 1. Mutation testing — the verification of the tests

The TDD red-green-refactor loop ends with green tests, but green tests prove only that the code reaches the assertions. It does not prove that the assertions would notice a bug.

The fix: after a feature's tests are green, deliberately break the implementation in a small, targeted way. Run the tests. The expected outcome is **at least one test fails, and the test(s) that fail are the ones that probe that specific behavior**.

### What "deliberately break" means

A mutation is the smallest possible edit that changes observable behavior:

- Flip a boolean default (`false` → `true`).
- Drop a guard (`if (X) return` → just `return`).
- Replace a function call with a no-op.
- Change a comparison (`>` → `>=`, `=== "active"` → `=== "inactive"`).
- Remove a callback wiring (`onChange={cb}` → `onChange={() => {}}`).
- Strip a critical attribute (`aria-label` removed from spread).
- Hardcode a derived value (`status = computeStatus(x)` → `status = "default"`).

Each mutation is reversible (back up the file, mutate, run tests, restore).

### What success looks like

| Mutation result | Interpretation |
|---|---|
| 0 tests fail | **Vacuous test.** The mutated line is not actually checked by any test. Strengthen the test or add one. |
| Exactly the tests that probe that behavior fail | **Healthy test discipline.** The tests have positive signal for the mutated path. |
| Almost all tests fail | **Over-coupled test fixture.** One mutation should not cascade — split the fixture or reduce shared setup. |

### Mutations to attempt for each unit under test

Aim for one mutation per *category* of behavior the unit has:

- **Variant / mode selection** — disable one variant's branch.
- **Side effect** — remove a callback wiring.
- **Accessibility-critical attribute** — drop the prop that produces it (`aria-label`, `role`, `aria-invalid`, etc.).
- **State derivation** — collapse a derived state to a constant.
- **Boundary condition** — flip a comparison operator.
- **Default value** — change the default of a key prop.

Three mutations per unit is a usable minimum. Record the mutations applied and the tests that caught each in an artifact (a mutation log file, a PR description block, or a CI report). The record is the evidence that the tests are doing work.

### A minimal mutation-test recipe

```text
1. Back up the source file.
2. Apply ONE mutation (smallest edit that changes behavior).
3. Run the relevant test command.
4. Confirm at least one test fails, and the failing test is one that
   logically probes the mutated path.
5. Restore the source file.
6. Re-run the test command; confirm all green.
```

This is a manual discipline. Full property-based mutation-testing tools exist (Stryker, mutmut, Pitest); the manual version is enough to catch the most common "test exists but proves nothing" failure mode.

### When mutation testing is NOT the right tool

- Pure-presentation code with no logic (true static templates).
- Generated code (the generator should be mutation-tested, not the output).
- Code already covered by stricter verification (formal methods, fuzzing).

In every other case, a test suite without mutation-test evidence is unverified.

---

## 2. The paired-condition rule

Tests of the form "X must not appear" can pass trivially when the code that produces X is disabled. This is the most common form of vacuous test.

### Examples of vacuous tests

```typescript
// Vacuous: passes when the entire error-rendering path is removed.
it("does not show error banner by default", () => {
  render(<Form />);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

// Vacuous: passes when class-name generation is broken.
it("does not apply danger styling on success state", () => {
  render(<Status state="success" />);
  expect(screen.getByTestId("status").className).not.toMatch(/danger/);
});
```

### The fix: pair the negative assertion with a positive one from the same code path

```typescript
it("shows error banner when error prop is set, omits it otherwise", () => {
  const { rerender } = render(<Form error="x" />);
  expect(screen.getByRole("alert")).toBeInTheDocument();

  rerender(<Form />);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("applies success styling on success state, NOT danger styling", () => {
  render(<Status state="success" />);
  const el = screen.getByTestId("status");
  expect(el.className).toMatch(/success/);     // positive — proves the path ran
  expect(el.className).not.toMatch(/danger/);  // negative — proves it ran correctly
});
```

The positive assertion proves the code under test executed. The negative assertion proves it produced the right answer. Both come from the same execution; if the executor is disabled, the positive assertion fails and the test fails. No vacuous pass.

### Liveness signals for tests that legitimately assert only absence

Some tests are genuinely about absence — "no console errors during normal render," "no extra network calls during cache hit." Add a liveness signal so the test fails when the harness silently no-ops:

- Assert a known-base finding fires (a test setup that always produces one expected output).
- Assert the operation completed (`expect(operation).toHaveBeenCalled()`).
- Assert the verdict is `PASS` if the harness emits one.

A test runner that reports green when it didn't actually run is the worst possible outcome. Liveness signals catch that.

### The proxy-assertion fallacy

A close cousin of the vacuous-absence trap: asserting a PROXY for the behavior you care about, rather than the behavior itself. When the proxy can fire for unrelated reasons, the test passes for the wrong reason.

**Canonical example.** A Next.js page that calls `redirect("/sign-in")` from `next/navigation` throws internally — that's how `redirect` works under the hood. So the test author writes:

```typescript
// VACUOUS: any throw makes this pass.
it("redirects unauthenticated users", async () => {
  await expect(Page()).rejects.toThrow();
});
```

Mutating the guard `if (!user)` to `if (false && !user)` lets `user` flow through as `null`. The next line `requireRole(user.email)` throws a TypeError on null access. **The test still passes** — and the auth-bypass mutation ships.

**Fix.** Mock the function that produces the intended side effect and assert it was called with the right argument:

```typescript
const redirectMock = vi.fn((url: string) => {
  throw new Error(`__NEXT_REDIRECT__:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

it("ASSUMPTION: unauthenticated users are redirected to /sign-in (specific URL)", async () => {
  redirectMock.mockClear();
  await expect(Page()).rejects.toThrow(/__NEXT_REDIRECT__:\/sign-in/);
  expect(redirectMock).toHaveBeenCalledWith("/sign-in");
});
```

Both assertions are necessary:
- The regex on the thrown error message discriminates "intentional redirect" from "TypeError on null".
- The `toHaveBeenCalledWith` assertion pins the destination URL — a refactor that redirects to the wrong path fails.

**The general rule.** Whenever a test asserts a throw, ask: "what else could throw here?" If the answer is "anything along this code path can throw a TypeError if upstream state is null," the throw assertion is a proxy. Mock the intended side effect and assert it directly.

This pattern applies to:
- Redirects (`redirect`, `permanentRedirect`, `router.push` in tests).
- Notification side effects (`onError`, `onSubmit`, `dispatch`).
- Logging contracts (`logger.error` was called with code X).
- Process exits / panics.

### The "implementation-pinned `toHaveBeenCalledWith`" failure mode

A subtler kind of proxy fallacy: `toHaveBeenCalledWith` is supposed to assert the CONTRACT a function call must satisfy, but it's easy to write it as a snapshot of the CURRENT implementation. When the implementation is wrong, the test pins the wrongness as the expected value, and the test passes any time the code matches its own bug.

```typescript
// VACUOUS: the expected call args are whatever the code currently does.
expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({
  where: { deletedAt: { not: null } }, // ← was the implementation's filter
});
```

A real session example: this filter looks plausible but is wrong — it deletes EVERY soft-deleted workspace, including those owned by users still inside their grace window. The test was written to match the buggy filter, so it "passed". The actual contract was "delete only workspaces whose members are in the purge set," but that's not what was asserted.

**The check.** Before writing a `toHaveBeenCalledWith` assertion, write out the CONTRACT in prose:

> "This call must scope writes to ONLY the entities the current operation is purging — never to other entities in similar lifecycle states."

Then translate the prose into the assertion. If you can't say the contract in prose without referencing the implementation's current code, the assertion is going to be implementation-pinned.

**Mutation-test the assertion.** Apply the inverse of the contract — e.g., revert the where-clause to the unfiltered version. The test MUST fail. If it doesn't, the assertion is snapshotting the implementation, not enforcing the contract.

**Contract clues to spot the failure mode:**
- The "expected" args were copy-pasted from the implementation (drift between code and test → silent acceptance).
- The assertion was written AFTER the implementation passed manual testing (almost guarantees implementation-pinning).
- The assertion's "expected" object exactly mirrors the source code's literal — no transformation, no abstraction.

When any of those clues fire, the assertion's job is harder: rephrase the expectation in terms of the CONTRACT (what guarantees this call provides) rather than the CODE (what literal arguments it passes today).

---

## 3. Boundary-value testing for thresholds

Every numeric or temporal threshold in a spec hides three potential bugs at the boundary: the off-by-one, the inclusive-vs-exclusive ambiguity, and the timezone/rounding edge.

### The rule

For every threshold (e.g., "≤ 7 days", "≥ 99% success", "< 5 characters", "30-day grace period"), write explicit tests at:

| Test point | Why |
|---|---|
| `value - 1` | The "just under" case |
| `value` | The exact boundary — most common bug location |
| `value + 1` | The "just over" case |
| Degenerate (`0`, empty, `today`, `null`) | Catches timezone math, divide-by-zero, null handling |

### Boundary applies to list cardinality too

The rule is not only for numeric thresholds. **Any list-shaped prop has cardinality boundaries.** When a component accepts an array, write probes for:

| Cardinality | Why |
|---|---|
| `[]` (boundary 0) | Does the component render gracefully? Does list-dependent UI degrade? |
| `[oneItem]` (boundary 1) | Does the single-item path render? "First-or-only" off-by-one bugs hide here. |
| `[a, b, c]` (N items) | Does the iteration render every item? Does ordering matter? |

The trigger for writing these probes is the prop's type shape, not whether the source code happens to render visible empty-state copy. The most dangerous case is a list-typed prop with no visible empty state — a regression that hides the entire list passes silently because there's nothing to assert against. Apply the boundary mechanically to every list prop.

### Inclusivity is part of the contract

If the spec says "≤ 7 days," does `days === 7` count? If the spec says "< 5 characters," does `length === 5` fail validation? The boundary test forces a deliberate answer — and forces it to be documented.

### Anti-pattern to reject

```typescript
// Tests middle of the range. Misses both edges.
it("classifies dates more than a week away as upcoming", () => {
  expect(classify(daysFromNow(30))).toBe("upcoming");
});

// What about daysFromNow(7)? daysFromNow(8)? daysFromNow(0)?
```

Replace with:

```typescript
it.each([
  [6, "urgent"],   // boundary - 1
  [7, "urgent"],   // exact boundary, inclusive
  [8, "upcoming"], // boundary + 1, the flip
  [0, "overdue"],  // degenerate: today
  [-1, "overdue"], // degenerate: past
])("days=%i → %s", (days, expected) => {
  expect(classify(daysFromNow(days))).toBe(expected);
});
```

This table makes the boundary contract explicit and tests it exhaustively. If the implementation's boundary moves, exactly one row fails and the reviewer sees which.

### Spec hygiene

A spec that defines a threshold without specifying inclusivity is incomplete. When the spec is ambiguous, the implementation makes an arbitrary choice; the test passes for that choice; future readers cannot tell whether the choice was deliberate. Force the choice into the spec.

---

## 4. Assumption probes for migrations and refactors

Mutation testing catches "this code path's logic broke." Probe testing catches a different class: "this code path's contract silently changed." The two are not interchangeable.

### The failure mode

When code is migrated from one implementation to another (raw HTML → component library, native control → wrapper, in-line copy → externalized string), the new tests are written against the new contract. They cover what the new implementation should do. They do NOT automatically cover what the old implementation guaranteed.

If the new implementation has a different default — a different ARIA role, a different HTML tag, a different validation behavior — the migration ships a silent regression and every test passes.

### The discipline

After a migration, write a separate **probe suite** that articulates each pre-migration assumption as a test. Name each test with the literal phrase `"ASSUMPTION: <thing the old contract guaranteed>"`. The phrasing forces you to name what you are protecting:

```typescript
describe("PROBE — pre-migration contract preservation", () => {
  it("ASSUMPTION: the page has exactly one h1", async () => { /* … */ });
  it("ASSUMPTION: every submit button has type='submit'", async () => { /* … */ });
  it("ASSUMPTION: the email input is named 'email'", async () => { /* … */ });
  it("ASSUMPTION: critical alerts use role='alert', not 'status'", async () => { /* … */ });
  it("ASSUMPTION: the page is wrapped in a <main> landmark", async () => { /* … */ });
});
```

A probe suite is *purely* a regression net for the migration. Once the migration is stable, the probes can be folded into the normal test suite or kept as a permanent contract.

### What to probe

Concrete examples that have caught real regressions:

- **Heading hierarchy** — wrapper component defaults to a lower heading level than the original; page silently loses its h1.
- **Form submit semantics** — wrapper button defaults to `type="button"` and the form silently never submits.
- **ARIA role escalation** — wrapper alert defaults to non-critical role; assistive-tech-interrupt behavior degrades.
- **Input type semantics** — wrapper input defaults to `type="text"` and a password field silently stops masking.
- **Landmark structure** — page rewrite drops the `<main>` or `<nav>` element.
- **Server-action input names** — a `name=` attribute rename silently delivers form data to the wrong key.
- **Build-time mode** — a page expected to be dynamic (reads request data) is silently statically generated.
- **Token / variable resolution** — a CSS variable or style token referenced in output exists in the source-of-truth definitions.

### Probe layers: structural, content, side-effect

A migration probe suite that only covers ONE layer of behavior misses regressions in the other layers. Three layers are independent and each needs at least one probe:

1. **Structural probes** — "the element exists, the right tag is used, the right role / type / aria attributes are set." Catches wrapper-encapsulated semantic drift, missing landmarks, dropped accessibility attributes.
2. **Content probes** — "the element contains the right user-visible data." Catches regressions where the element renders but shows the wrong value, the wrong copy, or no data at all. Especially critical for:
   - Dynamic data from view-models (workspace name, role, status, counts).
   - Spec-bound copy (legal disclaimers, regulatory text, compliance language).
3. **Side-effect probes** — for code that touches persistence, network, navigation, or any side-effecting API: "the right function was called with the right arguments." Catches tenancy leaks, wrong-URL redirects, missing where-clauses, and persistence shape drift.

The layers commonly co-fail: if an element is missing, neither structural nor content probes can read it. The independence shows up under partial regression — an element rendering with stale or null data instead of the view-model value. A structural probe (the button is in the document) passes; only a content probe (the button text says the right thing) catches the bug.

Recipe for a page that displays domain data:

```typescript
// Structural — the section is in the DOM
expect(screen.getByTestId("invite-card")).toBeInTheDocument();

// Content — the right data text appears
expect(container.textContent).toMatch(/Acme Bookkeeping/);
expect(container.textContent).toMatch(/as ADMIN/);

// Side-effect — the form wiring is correct
expect(container.querySelector('input[name="token"]')).toHaveValue("tok_1");
```

### Spec-bound copy needs a content probe

Any literal text whose source is a SPEC (DEC reference, screen specification, regulatory citation, legal copy, compliance disclaimer) is part of the contract. Edits to that text are contract changes, not cosmetic edits. Protect it with a `textContent` probe whose name explicitly references the spec binding:

```typescript
it("ASSUMPTION: success page does NOT imply access granted (spec-bound disclaimer)", () => {
  const { container } = render(<BillingSuccessPage />);
  expect(container.textContent).toMatch(/Paid access is not granted/);
});
```

The "spec-bound" phrasing signals to reviewers that a copy change is a contract change requiring spec update, not a casual word-smithing pass. The probe is the cheapest insurance against well-meaning copy edits that violate the underlying regulatory or product contract.

### Wrapper-encapsulated semantic drift

The general name for this failure class: a wrapper component encapsulates a semantic decision (HTML tag, ARIA role, default attribute) that the call site cannot see. The substitution looks like a cosmetic refactor but ships real behavior change.

The mitigation is two-sided:

1. **Wrapper contract:** any wrapper that encapsulates a semantic decision must expose an override prop (`as` for HTML tag, `role` for ARIA, `type` for input/button). The default and every override option must be documented and tested.
2. **Caller contract:** the migration must include probe tests asserting the pre-migration contract. The wrapper's documentation must list the regression risk in its anti-pattern section.

### When probes are NOT needed

- New code with no prior contract — there is no "old behavior" to protect.
- Refactors that only touch internal helpers, not call-site contracts.
- Rewrites that explicitly change the contract (the spec change is the source of truth; tests follow the new contract).

For everything else — migrations, library replacements, "use the new component" passes — probe tests are the cheapest insurance against silent regression.

---

## How these four disciplines fit together

| Question | Discipline |
|---|---|
| "Do my tests fail when the code is broken?" | Mutation testing |
| "Does this test pass when the executor is silently disabled?" | Paired-condition rule |
| "What happens at the exact threshold?" | Boundary-value testing |
| "Did the migration silently change a contract my new tests don't cover?" | Assumption probes |

Together they answer the question: **if I shipped a real bug today, would my test suite catch it?** No single discipline is sufficient. Coverage tools answer "did the line execute"; mutation testing answers "would the test fail if the line was wrong"; probe tests answer "would the test fail if the line's contract silently changed." All three are different verifications of the same suite.

---

## Anti-patterns to reject

- **"It's just a lookup table; no test needed."** Lookup tables have selector logic; selector logic has bugs. Test the selectors as paired conditions (one value fires, another doesn't).
- **"The component library is well-tested; my wrapper doesn't need tests."** Your wrapper has its own defaults, propagation, and accessibility contract. Test them.
- **"Coverage is 100%."** Coverage proves the line executed. Mutation testing proves the line's correctness was checked. They are not the same.
- **"Snapshot tests cover this."** Snapshots pass when regenerated after the bug ships. They are a UI-stability signal, not a behavior verification.
- **"Tests pass when I run them locally."** A test that passes when the harness is broken passes when YOUR harness is broken. Add a liveness signal.
- **"It's a small refactor — no need for probe tests."** The smaller the refactor, the more likely a silent semantic change hides in it.

---

## Required artifacts

When delivering a feature or migration, the test verification evidence is part of the deliverable. At minimum:

- **Per-unit mutation log** — for each unit under test, at least three mutations attempted with the test(s) that caught each recorded.
- **Boundary-test table** — for each threshold in the spec, the table of test points and expected behavior.
- **Probe suite** (migrations only) — explicit `"ASSUMPTION: …"` tests covering the pre-migration contract.
- **Liveness signal disclosure** — if any tests use absence-only assertions, document the liveness signal that proves the test ran.

This evidence belongs in the PR description, in an `auditability/` log file, or in the project's release notes. A green test suite without this evidence is unverified.

---

## When to escalate to property-based or fuzz testing

If a unit has:
- a large or open-ended input domain (parsers, serializers, validators),
- a security-sensitive contract (authentication, authorization, sanitization), or
- a numerical invariant (financial math, percentages summing to 100, timestamps),

then example-based tests + mutation + probe discipline is the floor. Property-based testing (see `references/property-based-testing.md`) generates inputs across the domain and asserts invariants — catching whole classes of input the example-based tests never consider.

The four disciplines in this document still apply. Property-based tests benefit from mutation testing (do they fail when the invariant is broken?), paired-condition wording (is the positive case proven?), and boundary specification (what are the edges of the input domain?).
