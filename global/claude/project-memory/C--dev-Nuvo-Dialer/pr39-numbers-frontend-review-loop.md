---
name: pr39-numbers-frontend-review-loop
description: Sprint 1.1 number-pool/health frontend PR #39 + NUM-007 mock-correction #37 — BOTH MERGED to main 2026-06-13 after a 2-iteration review loop (caught a wrongly-cleared footer + 7 inline-copy literals). Open follow-up: implement the stubbed inline-copy CI gate (check-ui-source-of-truth.mjs).
metadata: 
  node_type: memory
  type: project
  originSessionId: ce385ac5-3c07-47f8-bf6d-1f50459c1a24
---

Handoff state (2026-06-13) of the **PR #39** implement→review loop — branch `feat/numbers-frontend`, base `main`, **DRAFT**, ~4,580 lines / 20 files. It is the **salvaged Sprint 1.1 number-pool + number-health frontend slice** (`NumberPoolPage`, `NumberHealthPage`, `BuyNumbersDialog`, `ReleaseNumberDialog`, `numberView` mapper, `numbers.css`, `shared/src/copy/numbers.ts`, 5 test files, wiring). Authored by a sprint-implementer that died before committing; orchestrator salvaged + rebased → no self-review.

**Iteration 1 (adversarial-reviewer) is COMPLETE. Verdict came back "STOP / ready to un-draft" — but I verified its load-bearing claims and it is WRONG on the one item that matters most (the footer). Corrected verdict: NOT a clean STOP — one small reconcile pass remains, entangled with the open PR #37.**

**FINAL STATE (2026-06-13) — DONE. Both #37 and #39 MERGED to main; branch + worktree retired; local main refreshed.** #37 = `3b46069`. #39 squash-merged as **`47f1e9e`** on `main` (#39→#37→#38). The `feat/numbers-frontend` branch (local + remote) and its worktree are deleted. Below = how it got there: #39 was rebased onto #37 with TWO reconcile commits:
- **`4af5692`** — `.buy__cart` borderless to match the #37 mock (`margin-top: var(--space-6)`, no border/padding) + the 2 known inline-copy gaps → `shared/src/copy/numbers.ts`.
- **`2ab5ed9`** — the **5 MORE** inline-copy literals that **iteration-2 re-review** caught (3 filter `aria-label`s + `placeholder="415"` + a hardcoded 'Select' verb), all → the registry.

Iteration-2 confirmed footer/rebase/no-new-issue **CLEAN**; its only finding was those 5 (fixed). My **attribute-aware** sweep of all 4 numbers components = **ZERO** inline copy. `npm run verify` GREEN ×2; **CI GREEN ×2** (verify + integration + docker-build). #39 is now `isDraft:false`, `mergeStateStatus:CLEAN`, OPEN — **ready; the merge is Amin's call.** Total inline-copy literals moved this loop: **7** (2 + 5, across two review passes).

**Systemic follow-up FILED (spawn_task chip):** `scripts/check-ui-source-of-truth.mjs` is a STUB that skips → no gate catches inline JSX copy/aria/placeholder; that's why 7 literals slipped past 2 reviews. Implement the copy-literal scan + fix the stale centralization-doctrine §5 claim that the ESLint rule already exists. Two reviews flagged it = codify-the-control (doctrine-loop Arm 1 / sprint-rigor §11).

Everything below is the iteration-1 detail that drove the fix.

## The reviewer's miss (the headline)
It dismissed checklist item #2 (dialog-footer reconciliation) as a "false premise," claiming *"PR #37 never touched the mock footer."* That is **false** because it (a) resolved "PR #37" to commit `2f6a4e8`, which is actually **PR #36** (Sprint 1.2 briefs), and (b) compared #39 only against the mock on **current `main`**, blind to the correction in the still-**open** PR #37. The real deviation, confirmed both sides:
- **#39 React** `frontend/src/pages/numbers/numbers.css:592` `.buy__cart`: `margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border)` → **bordered-inset**.
- **PR #37** (OPEN, `fix/num-007-ported-entry-active`) corrects the locked mock `frontend/public/explorations/number-pool.html` `.buy-cart` → `margin-top: var(--s6)` with **padding-top + border-top REMOVED** → **borderless**. (#37 also moves port-in out of the pool into its own `number-porting.html`; #39 already correctly omits port-in.)
- So #39 matches the mock on *today's main*, but goes **stale the moment #37 merges**.

**Reconcile = a ~2-line CSS edit** on `.buy__cart`: drop `padding-top`, drop `border-top`, set `margin-top: var(--space-6)`. (align-items/flex-wrap already match.)

## Other REAL findings (confirmed by me)
- **[SHOULD-FIX] inline copy** `NumberPoolPage.tsx:~573` — `'Assigned to a team' / 'an agent' / 'a campaign'` hardcoded in JSX (registry has `pool.assignment.unassigned` but no `assignedTo.*`). Add `pool.assignment.assignedTo.{team,agent,campaign}` to `shared/src/copy/numbers.ts`, read from `C`.
- **[SHOULD-FIX] inline copy** `BuyNumbersDialog.tsx:185` — literal `Search` button label; add `buy.searchButton`.
- **[NIT]** `placeholder="415"` example area code inlined.

## Doctrine-loop flags (Arm 1 — missing controls; surfaced, not yet actioned)
1. `centralization-doctrine.md §5` claims an ESLint rule *"(added Sprint 0.1): no inline string literals in JSX where copy registry exists"* — **that rule does NOT exist** on the branch. Stale/aspirational doc + the missing control that would have CI-caught the two copy gaps above. Fix: implement the `no-restricted-syntax` JSX-text rule (or extend `check-copy-terms.mjs` to scan `.tsx`).
2. **NEW lesson:** the `adversarial-reviewer` agent cleared a real BLOCKER by (a) inferring a PR#→commit mapping instead of `gh pr view`-ing it, and (b) checking a "matches the locked mock" claim only against `main`, ignoring an in-flight correction in an OPEN PR. Guard to consider adding to the agent: resolve PR identity via `gh pr view <n>`, and when a claim is "matches locked surface X," diff X against open PRs touching X, not just main. (This is exactly why human-in-the-loop verification of the critic's verdict exists — it caught a stale footer that would've shipped.)

## Cleared (reviewer correct + I corroborated) — do NOT re-litigate
CI green + gates actually bite (`check:ui-guardrails` / `gate:test-intent` 71-pass / `check:layout` all pass for real in the branch worktree) · **tokens-only at leaf** (`numbers.css` 0 raw hex/rgb/oklch/shadow/z/font; only `1px` hairlines, gate-allowed) · **NUM-008** respected + regression-locked (test asserts no clean-badge / no previously-owned toggle) · **NUM-007** ported=active (state-driven `numberView`, nothing hardcodes `warming`) · tests bite (real intent headers w/ resolvable REQ/BENCH IDs, SUT imported not mocked, ARC-006 proof: health mutations are human-click only, `expect(transition).not.toHaveBeenCalled()` on mount) · authority-boundary clean (no auto-cool/auto-release; no CRM lead data) · centralization positives (API via `API_ENDPOINTS`, lifecycle via taxonomy) · no stale/duplicated wiring.

## Stop/loop + pending decisions
- **Loop state:** does NOT stop — one reconcile pass (footer + 2 copy fixes) before un-draft.
- **Entanglement → Amin's call.** Recommended sequencing: **merge #37 first** (it's the mock-correction + NUM-007 authority and moves port-in out), then fix #39's footer + 2 copy strings in one cleanup commit → re-verify → CI-babysitter watches the push → un-draft #39. Alt: fix #39 to #37's intended mock now (risk: #37 footer could change again in review).
- **Pending from Amin:** (1) sequencing above; (2) loop cadence — auto-converge vs pause-per-iteration; (3) whether to codify doctrine-loop flag #2 into the agent.

**Why:** a second orchestrator must NOT trust the reviewer's "STOP/merge" headline — the footer item is a real (minor) locked-mock deviation it cleared on a false premise; and must not re-litigate the cleared items.
**How to apply:** treat #39 as ~ready pending the footer + copy reconcile, sequence it with #37, keep #39 frontend on Claude not Codex ([[codex-claude-division-of-labor]]), un-draft only at 0 BLOCKERs. Sprint 1.2 stays paused ([[sprint-1-2-paused]]).

Related: [[sprint-1-2-paused]] · [[design-system-locked]] · [[dialer-not-crm-design-boundary]] · [[codex-claude-division-of-labor]] · [[orchestrator-mode-setup]]
