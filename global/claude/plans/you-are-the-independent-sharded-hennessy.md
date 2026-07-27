# Remediation plan — control-plane audit of 71156cbf + a262baa3

## Context

An adversarial read-only audit of `71156cbf` (Redis worker isolation) and `a262baa3` (task/worktree
lifecycle hardening) was asked to refute the claim that the Sprint-1.4 execution-system failures
(RCA rows CP-01/CP-03/CP-04/CP-07/CP-09, MK-01) are fixed.

**Verdict: REFUTED.** The Redis isolation work (CP-07) holds up. The control-plane work does not
close CP-01/CP-04/MK-01: one committed gate cannot run at all, the restart-stall control fires only
in the window a pre-existing guard already owned, and the worktree disk figure cannot support the
budget decision it was built for.

All findings are derived from reading committed source plus `git status` / `git show`. **No test,
gate, or `npm run verify` was executed** — nothing below is runtime-confirmed.

## Fixes, in dependency order

### 1. (HIGH) Commit the dispatch-boundary gate, or unregister it
`a262baa3` added `gate:dispatch-boundaries` to `package.json` and to `GATES_ALL_REGISTRY` in
`scripts/run-gates-all.mjs`, but `scripts/check-dispatch-boundary-consistency.mjs` and its
`.test.mjs` are **untracked** (`git status` → `??`; absent from the commit's 25-file stat). A clean
checkout of `a262baa3` fails `npm run gates:all` with MODULE_NOT_FOUND — so `verify`, sprint-close,
and the CI mirror are all red on the committed tree. This also leaves RCA row MK-01 ("FIXED LOCALLY;
commit/gate wiring pending") with the wiring landed and the implementation missing.

- Commit both scripts in the same change (after reviewing them — their logic is **unaudited**).
- Add the missing control to `scripts/run-gates-all.test.mjs`: every registry row's referenced
  script path must resolve in `git ls-files`. Killer mutation: untrack one gate script → red.

### 2. (MEDIUM-HIGH) Fix the restart stall fingerprint comparison
`scripts/claude-lifecycle-hook.mjs` checks the stall against the **pre-dispatch** state digest but
records the **post-dispatch** digest (which already contains the new attempt). The two can only
match while the attempt file still exists and the worktree is byte-identical — precisely the window
`acceptTaskAttempt`'s `collision or replay` guard already owned. An interrupted agent leaves a dirty
worktree, so `worktree.dirty`/`dirtySha256` differ and the stall never fires — the more work the
interrupted agent did, the less likely detection.

- Record the pre-dispatch fingerprint (or store both and compare like-for-like).
- Derive the fingerprint from durable attempt identity + branch/HEAD, not volatile dirty counts.
- Regression: in the "unchanged durable state stalls" test, write one file into the fixture between
  the two `create()` calls; the stall assertion must still hold.

Net safety is currently preserved by the collision guard — this is a control-quality and
claim-accuracy defect, not an exploitable duplicate-dispatch hole.

### 3. (MEDIUM) Implement real A-B-A oscillation detection, and rename the test that claims it
`recordReplacementDispatch` keeps one latest fingerprint per task, so an S1 → S2 → S1 oscillation is
undetectable. The test named "retains per-task replacement evidence across an interleaved A/B/A
dispatch" creates task A, task B, then re-creates A — that proves per-task file keying, not
oscillation. The rule text added to `.claude/rules/loop-discipline.md` ("Restart boundaries consume
events") states sequential-identity only, silently narrowing the parent rule's "No oscillation"
(A→B→A) guardrail.

- Retain a bounded fingerprint history (last N) per task; stall on any repeat, not just the last.
- Rename the test to what it proves and add a genuine oscillation case.
- Widen the loop-discipline paragraph to match the parent rule.

### 4. (MEDIUM) Make the worktree disk figure decision-usable
`scripts/orchestration-state.mjs` `worktreeDiskUsage`:
- walks with **no exclusions**, so the number is dominated by ignored content (`node_modules`);
- walks `.git` as a directory in the primary checkout but not in linked worktrees (where it is a
  file), so the primary's figure includes the shared non-reclaimable object store and is not
  comparable to a sibling's;
- sets `truncated: stack.length > 0`, a **false negative** when the entry limit is hit while the
  stack is empty (the inner loop breaks at the limit; if that directory pushed no subdirectories the
  walk reports complete). The formatter then drops the "(bounded lower bound)" qualifier.

Fix: exclude `.git` uniformly, either exclude ignored content or label the figure explicitly, and
set `truncated` from the limit condition itself. Add a fixture at the limit boundary.

### 5. (MEDIUM) Prove the pre-commit filemap recovery path
The scope-safety intent in `.husky/pre-commit` is right — a hook must not broaden a caller's
pathspec. But the new else-branch converts an auto-heal into a hard block, and its printed remedy is
untested: for a partial (pathspec) commit git runs hooks against a temporary index, while
`npm run filemap` regenerates from the real index, so the two inventories diverge whenever anything
is staged outside the pathspec. `filemap-gate.test.ts` asserts only that the block fired.

- Add the recovery case: block → run generator → include the map → commit succeeds → `checkFilemap`
  on the full tree is ok.
- If it does not close, downgrade the else-branch to a warning and let `gate:filemap` in `verify`
  own the hard failure.
- **Verify first:** whether git uses a temp index for partial commits is this item's load-bearing
  premise and was not executed during the audit.

### 6. (LOW-MEDIUM) Tighten the retained-ref policy in `scripts/worktree-lifecycle.mjs`
`allowedRetainedRef` trusts any local ref containing an `integration` path segment (a throwaway
local branch qualifies as "retained"), and for a detached target both self-retention checks compare
against `undefined` and are dead. Require the retained ref to resolve to a remote-tracking ref or to
the profile registry's configured integration branch (one source of truth). Add cases for a detached
target, an `origin/<target-branch>` retention, and a local `*-integration-*` throwaway.

### 7. (LOW) Move the rate-limit test namespace out of production middleware
`backend/src/middleware/rateLimit.ts` branches on `NODE_ENV === 'test'` inside the request path.
Production logical keys are unchanged (re-derived), so this is doctrine rather than behavior — but a
`NODE_ENV=test` misconfiguration in a deployed process silently removes distributed rate limiting
with no signal. Move the decision into a test-only redis client wrapper and assert the
`NODE_ENV=production` path returns the logical key.

## Verification

Run each of these and read the command's **own** exit code (`cmd; rc=$?; echo "EXIT: $rc"; exit $rc`), never a piped
status:

1. From a **fresh worktree of the fixed commit** (not this dirty tree): `npm run gates:all` — this
   is the check that would have caught finding 1.
2. `npm test --workspace=backend -- claude-lifecycle-hook.test.ts orchestration-state.test.ts
   worktree-lifecycle.test.ts filemap-gate.test.ts`
3. With real Redis: `npm run test:integration` (covers `rate-limit-test-isolation.test.ts`, whose
   real-Redis block is `skipIf(!HAS_REAL_REDIS)` and silently skips without `REDIS_URL`).
4. `npm run verify`.

For each new regression, apply its named killer mutation and confirm red before accepting green.
