# Orchestrator Handoff Context — Auxara Dialer

This document preserves durable orchestration patterns and working-style decisions. It is not a live status snapshot. A fresh orchestrator generates current local git/worktree/sprint state with `npm run agent:state` before choosing work and, when live GitHub reconciliation is needed, enters plan mode before requesting the bounded drift workflow; any phase, branch, PR, or "next task" claim in prose is historical until those outputs confirm it.

## Live-update discipline

Update this doc when a durable operating pattern or user preference changes. Runtime state belongs to the generated state command and GitHub artifacts, not to a committed paragraph that can silently age.

This discipline is carried forward from the sibling Nuvora CoachAI project, where it caught and codified six gold-standard multi-agent patterns over many merges.

## How to establish live state

1. Run `npm run agent:state` from the current worktree and open the raw output. It reports local branch/base/divergence, dirty paths, sibling worktrees, and sprint-doc signals without fetching or committing a snapshot. If open PR/issue truth is load-bearing, enter plan mode, run the saved `orchestration-drift-audit` workflow, and inspect its raw GET evidence. Plan mode—not the workflow prompt—is the read-only tool boundary.
2. Reconcile the output against `docs/app-plan/implementation/sprints/`, the decision log, and the real diff. A doc/status/agent report is a lead; the artifact is proof.
3. Use GitHub issue/PR artifacts for handoffs between Codex and Claude. The user approves product, design, architecture, priority, and irreversible actions; they are not a screenshot or copy/paste transport layer.
4. Claude Design is the design authority for visible work. A visible change remains mockup-first and approval-gated; Figma is not part of this workflow.

## The user's working style (this matters more than you'd expect)

- **Terse, action-oriented.** Asks "is this good?" / "should I start X?" / "any issues with it?" and wants a yes/no with crisp reasons. Doesn't want long preambles. Doesn't want recapping.
- **Quality > speed, explicitly stated.** "I'm not in a time crunch" → when a tradeoff is speed-vs-quality, pick quality.
- **Pushes back on workarounds.** If they say "this feels like a workaround," they mean it. Don't defend. Pause, do an architecture audit, fix upstream. The CLAUDE.md rule "Architecture audit on pushback" comes from real moments in the CoachAi conversation that birthed this doctrine.
- **Trusts the orchestrator to make calls.** When they say "doesn't matter to me, whichever you suggest," it's not abdication — they want you to pick + commit to reasoning + execute. Recommendations are welcome; over-presenting trade-offs is not.
- **Calls out drift directly.** Will catch and surface when something is off. Don't argue; verify.
- **Wants context preservation.** Long chats lose context — handoff docs exist for that reason.
- **Prefers local-first verification while pre-customer.** As of 2026-07-11, ordinary PRs should carry local proof rather than waiting on GitHub Actions. Run the local CI-equivalent bundle for integration/milestone work; reserve remote CI for `main`, `milestone/**`, `release/**`, or manual dispatch.

## Cross-agent artifact bus

Codex implementers, Claude designers/reviewers, and the orchestrator exchange durable context through the issue brief, branch/commit, PR body, review comments, and attached evidence. The issue form carries the six-part dispatch contract; the PR template carries proof, killer mutation, rendered evidence, not-reached surfaces, and human gates. Agent View (`claude agents`) is the live coordination surface inside Claude Code.

For every write-, shell-, or delegation-capable cross-vendor dispatch, the load-bearing brief and settled decisions must already be readable from that durable issue/PR bus. A local prompt may bootstrap execution, but it is not the handoff authority: the agent first reads the live artifact and proves the relevant brief is present on the referenced branch/PR head or in the issue/PR discussion. On Windows, launch bounded Claude CLI work through the canonical user-owned `bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` helper with `--handoff-ref`; its preflight fails closed when any tool outside `Read,Glob,Grep,WebFetch,WebSearch` lacks a GitHub issue/PR reference. The exact read-only diagnostic set is the narrow counterexample. This activation rule applies to implementation, mock authoring, remediation, and independent review—not only Sprint 1.4.

For every other bounded local dispatch that has a brief, the default invocation is:

```text
npm run agent:run -- --timeout-ms <n> --label <task-id> --brief <path-to-dispatch-brief> -- <command> [args...]
```

`--brief` registers the brief boundary's declared `edit_paths` as the coordination write-set claim. A boundary `task_id` is authoritative when present; otherwise the explicit `--label` supplies the required identity. `--claim-file` remains a mutually exclusive compatibility input, not the default authoring path.

If a product/UX/architecture choice genuinely needs the user, ask it directly and persist the settled answer in the issue/plan before agents continue. Technical implementation choices stay with the fleet under decision discipline.

## Gold-standard patterns

Treat these as the default orchestration playbook. Patterns 1–6 proved themselves in the sibling CoachAi repo and apply unchanged here; pattern 7 (loop discipline) is dialer-originated (2026-06-13); pattern 8 (exhaustive dispatch briefs) is dialer-originated (2026-07-02).

### 1. Three-fold paired assertion for persisted derived state with visible UI

When a slice changes persisted derived state that has visible UI consequences (number lifecycle badge, abandonment counter, wallboard KPI, billing meter), one test must assert ALL THREE of:

1. **Normalization layer** — the function under test produces the expected normalized value.
2. **Source-invariant layer** — the downstream consumer's branch logic respects the normalized value (gating branches BOTH ways: positive and negative).
3. **DTO/mapper output layer** — the final user-visible string/value is exactly as expected.

Single-layer assertions silently drift: tests at the normalization layer pass while the downstream consumer or the mapper diverges. Paired assertions catch this drift class. Codified in `.claude/rules/testing-guardrails.md`.

### 2. Implementer self-review before submission

Agents re-read their own diff like an orchestrator, find gaps, fix in additional commits (not `--amend`), document in report-back. This caught real bugs in CoachAi over many slices (CQ-004, CQ-007, CQ-009). Treat this as the gold standard, not as a sign the agent was sloppy.

**Self-check is fast + bounded; the orchestrator owns the heavy/DB/local-CI gates.** The implementer runs only `typecheck` + `lint` + `format:check` + `gates:all` (cheap, small output) and **writes** the full test ladder — but does **not** run `npm run test:integration`, Docker builds, the full `npm run verify`, or `npm run test:db:recover`. The orchestrator runs the local CI-equivalent bundle via the `test-runner` agent (`npm run gate:audit` + `npm run verify` + `npm run test:integration` + `docker build -t auxara-backend:ci .`, serialized as the sole local test-DB user) — a disposable context that absorbs the verbose log and returns a compact pass/fail verdict — then adversarial review before merging. The shared Postgres/Redis bootstrap also atomically leases Git's common directory and labels both fixed-name containers; a competing worktree receives `TEST_DB_LEASE_HELD` with owner evidence before any `docker rm`. No time/PID auto-steal exists because manual `test:db:up` intentionally outlives its launcher and long suites have no safe fixed TTL. Only the orchestrator may invoke explicit stale recovery, after a separate process/agent check proves the owner is gone. Rationale (2026-06-14 S1.2-C2 + 2026-07-11 S1.3 closure + 2026-07-16 S1.4 collision): DB/container proof is verbose and globally shared; a status convention alone did not survive parallel briefs plus battery loss. Ordinary PRs carry local evidence; remote CI is reserved for main/milestone/release/manual runs. Type errors and gate violations still get caught early; runtime/DB/container behavior is proven by the orchestrator locally. Codified in `.claude/agents/sprint-implementer.md` + `.claude/agents/test-runner.md` + `.claude/rules/sprint-rigor.md` §12.

### 3. Design-baseline verification before locking the diff

Designers verify "existing code" snippets in design briefs match disk before locking the implementation prompt. Plans drift between writing and execution. Caught two wrong existing-code claims in one CoachAi round alone.

### 4. Bounded-repair trace truth

When AI bounded repair fails the second validation pass, the trace says `'rejected'` not `'repaired'`. The trace, product output, warnings, and downstream telemetry must all tell the same story. Codified in `.claude/rules/testing-guardrails.md`.

### 5. Forbidden-list discipline in design briefs

Every brief lists "Files allowed to read but NOT modify" with cross-consumer dependency reasoning. Prevents in-scope-refactor damage when the implementer's natural urge is to "clean up that file while I'm in it."

### 6. Worktree-based parallel agent isolation + PR-based integration

Each agent works in its **own `git worktree` on its own branch** cut from `main`. **`main` is an integration target that lives on GitHub (`origin/main`) — no agent commits feature work directly to a local `main` checkout.** Integration happens through PRs, which merge on GitHub's side, so `main` is never locally contended and no agent has to wait for or "free up" main.

**The loop each agent runs:**

1. **Branch + worktree:** `git fetch origin && git worktree add -b <area>/<slice> <folder> origin/main` — **ALWAYS fetch immediately before cutting the worktree.** `origin/main` is a *local cached ref* that goes stale the moment a PR merges server-side; a worktree cut without fetching bases the whole slice on old code and earns a needless rebase or, worse, re-implements something already merged. After cutting, sanity-check the base: `git log --oneline -1` should show the commit you expect from the latest merged PR. (Bit us 2026-06-11: a worktree spawned one merged-PR behind and had to be hard-reset.)
2. **Work + commit on the branch** (never on `main`).
3. **Push the branch → open a PR → attach local CI-equivalent proof → merge it** (`gh pr merge --rebase --delete-branch` keeps history linear and deletes the branch). Ordinary PRs do not require GitHub Actions while the project is pre-customer; the orchestrator/test-runner proof (`gate:audit`, `verify`, `test:integration`, Docker build) is the merge evidence. Remote Actions is reserved for `main`, `milestone/**`, `release/**`, or manual `workflow_dispatch`. The merge lands on `origin/main` server-side; no local `main` checkout is needed.
4. **Remove the worktree** when done: `git worktree remove <folder>`.

**Staying current — two different commands, don't conflate them:**

- A **feature branch** absorbs others' merged work by **rebasing onto main**: `git fetch && git rebase origin/main`, then `git push --force-with-lease` (safe — it's your own branch). Do it before merging your PR and whenever `main` moves under you.
- A **local `main`** (keep one only to *run/inspect* the integrated app) refreshes with **`git pull --ff-only`** — a pure fast-forward. Treat it as **read-only**; never commit feature work there. `--ff-only` is deliberate: it **fails loudly** if `main` ever diverged — the early warning that someone broke the rule and committed to local `main`.

**Out-of-band fix while other worktrees have uncommitted work** (a doc/security fix spotted mid-flight): never stash or touch another agent's working tree. Spin a **throwaway worktree** on a fresh branch off `origin/main`, fix it there, PR-merge, then `git worktree remove`. Fully isolated; the busy worktrees never notice.

**Worktree-isolation lessons (2026-06-11):** (1) Briefs must pin the working directory explicitly — "work ONLY under <worktree path>" — agents otherwise drift into editing the orchestrator's main checkout via absolute repo paths. (2) Fresh worktrees lack untracked files: `backend/.env` and the generated Prisma client don't propagate — run `npm run prisma:generate -w @auxara/backend` from the worktree root before the first typecheck, and name any untracked dependency the slice needs in the brief. (3) Never edit the orchestrator's main checkout: uncommitted work there is unowned and collides with integration pulls — if main-checkout-only state (like `.env`) is genuinely required, say so in the report instead of working there silently. (4) Stale-base check on EVERY base operation: `git fetch origin` before any `git worktree add`, `git rebase origin/main`, or branch cut — and before merging your PR, fetch + rebase once more so the diff lands against the true tip, not a memory of it. (5) **Commit a worktree's uncommitted work BEFORE running any destructive test against its own files.** `git checkout -- <file>` (and seed-then-revert experiments) revert to the *committed* base and silently discard an agent's uncommitted edits — an integrator lost a freshly-regenerated glossary section mid-merge this way 2026-06-11 (recovered from the taxonomy source, but avoidably). Stage or commit first, then experiment.

*(The older single-orchestrator variant — the orchestrator keeps `main` checked out and merges implementer branches into it — works only when there is exactly ONE integrator. The PR-based model above is the general, contention-free default; prefer it. Learned the hard way 2026-06-10: two agents committing to a shared local `main` checkout caused merge contention + a stale local `main`; the fix was a throwaway worktree + PR. This pattern, once established in CoachAi, became standard; the PR-based refinement supersedes the "orchestrator stays on main" form.)*

### 7. Bounded execution loops to convergence (loop-discipline)

When iterating beats one-shot — a review→fix→re-verify loop, a find-until-dry sweep, converge-on-a-spec/golden/locked-mock, bounded self-repair — **run an explicit loop, but declare its contract up front**: a *measurable* exit criterion (0 blockers / 0 *new* findings / a named gate green / equals a golden), a hard iteration cap (default 3–5, scale with stakes), monotonic-progress-or-stop, and a budget bound. The guardrails that keep it finite: **no-oscillation** (A→B→A halts), **dedup-against-all-seen** (find-until-dry exits on K≈2 consecutive dry rounds), **don't-chase-a-moving-target** (re-baseline once, then resume), **verify-the-critic** (a reviewer / gate / sub-agent "done / clean / merge" is a *lead, not proof* — it fails two ways, *confidently-wrong* and *incomplete*, so re-derive the claim from the actual diff before exiting on it), and **escalate-don't-spin** (cap-hit / stall / oscillation → hand back the residual + what was tried; escalation is a *successful* loop termination, not a failure). Cadence is the orchestrator's call: **auto-converge-within-the-cap** (default; crisp criteria like gate-green / 0-blockers) vs **pause-per-iteration** (fuzzy criterion, high blast radius, or expensive/irreversible iterations). **Above all, human-gate the irreversible step:** a loop may auto-iterate inside the cap, but the one-way action that *ends* it — the **merge** (likewise publish / prod-write / delete / deploy) — is never crossed on a critic's unverified "clean"; the human checks the sensor against the actual code before the merge, and *that gate* is what makes autonomous iteration safe rather than auto-shipping whatever the critic rubber-stamped. Every loop's report names its exit criterion + iterations-run (n / cap) + how it terminated. Full rule + fail-state: `.claude/rules/loop-discipline.md` (always-on; the single shared rules source for both Codex and Claude Code). Both critic failure modes are anchored to **2026-06-13**: the *confidently-wrong* PR #39 buy-cart-footer clear (mis-resolved the PR number + diffed only against `main`, blind to an in-flight correction) **and** the *incomplete* same-review miss of 5 of 7 inline-copy literals — both caught by the human verifying before the merge, not by the loop self-certifying.

### 8. Exhaustive dispatch briefs (a brief must stand alone)

Every dispatch brief the orchestrator hands a sub-agent, Codex, or a workflow must be **fully self-contained.** A sub-agent is *less capable than the orchestrator and knows NOTHING beyond its brief* — it has none of the orchestrator's accumulated session context, none of the "we settled that yesterday," none of the implicit "obviously this file, not that one." A brief that only works for a model that already shares the orchestrator's context is a **defective brief**: the gap surfaces as the sub-agent guessing, drifting, or asking a question the brief should have answered. (Amin's directive, 2026-07-02.)

Every brief carries all six of these:

1. **CONTEXT the agent can't infer** — the settled decisions, the reality on disk, the "why this task exists." Quote settled decisions **verbatim**, don't cite them by ID alone (a bare "per ADR-DLR-001" means nothing to an agent that can't hold the whole decision log; paste the load-bearing sentence).
2. **EXACT PATHS** — the files to read (with what each proves), the files to edit/create, the files it may **read but NOT modify** (with the cross-consumer reason — pattern 5), and where its output goes. Absolute or repo-root-relative; a worktree brief pins "work ONLY under `<worktree path>`" (pattern 6, the drift-into-main-checkout footgun).
3. **NUMBERED step-by-step procedure** — including which checks/tests to run **and how to read their real exit code** (`cmd; rc=$?; echo "EXIT: $rc"; exit $rc`, never a piped `| tail` status — the loop-discipline verify-the-critic trap).
4. **OUTPUT CONTRACT** — the exact report format/fields the orchestrator will consume (the sub-agent's final message is structured data, not a human summary).
5. **BOUNDARIES** — concrete don'ts (no scope creep, forbidden files, no new deps, no push/merge) + the **escalation path when blocked** (finish what's possible, surface exactly what's blocked + the one unblock action — never silently defer).
6. **ACCEPTANCE CRITERIA the agent can verify from its own seat** — a checklist it runs before reporting done, so "done" is proven, not asserted.

Implementation briefs add six explicit pre-edit sections (read-only briefs are exempt): **Authority path** (real producer → transforms/transaction → provider/effect → reconciliation → terminal consumer), **Lifecycle matrix** (source mutation/revoke/delete/interrupt/retry/rollback/terminal ownership), **Runtime execution** (actual writer, runtime DB role/RLS, scheduler/mount/route registration), **Proof matrix** (branch-entry preconditions, earlier guards neutralized, positive liveness, zero-effect negative, persisted terminal output, named killer mutation), **Current consumer**, and **Complexity budget/stop condition**. New seams, gates, and proof tooling without a current consumer stop at dispatch instead of becoming speculative infrastructure.

Mutating tasks are cut by **risk unit**: one authority handoff or irreversible lifecycle per task. A dependent child is not dispatched until the parent's durable completion/proof receipt is visible. After each high-risk handoff, run its narrow serialized DB/runtime proof before releasing the next dependent lane. Restart/battery recovery reconciles common attempts and registered worktrees before any replacement dispatch; unchanged second reconciliation is a stall, not permission to duplicate work.

**Spec MUST/MUST-NOTs are carried VERBATIM, never paraphrased** — a loosely-paraphrased spec loses the exact constraint and the agent implements the paraphrase (the responsive-build root-cause class: a brief that contradicted or softened the spec produced the drift). If the brief and the spec ever disagree, the brief is the bug.

*Fail-state:* a brief assumed the sub-agent shared the orchestrator's context — cited a decision by ID instead of quoting it, named a surface without its exact path, paraphrased a spec MUST, or omitted the boundaries / output contract — and the agent guessed, drifted, or re-asked what the brief should have said.

### 9. Source-to-screen placeholder retirement

When a backend/shared authority lands for something the UI previously mocked, the next wiring slice must
explicitly retire the live placeholder. "Backend exists" is not a product claim until the built surface
either consumes that authority or shows an honest loading/empty/error state. A placeholder may remain only
when the visible surface itself is still mock-gated, and that must be called out as a blocked frontend
slice. Current guardrail: `gate:authority-placeholders` prevents the retired softphone/companion/comms
authorities (`PLACEHOLDER_SCRIPT_SECTIONS`, `PLACEHOLDER_BATTLECARDS`, `PLACEHOLDER_SMS_ELIGIBILITY`) from
returning to built pages.

### 10. Workflow loophole audit

Diff review is not enough for product workflows. Before calling a slice done, run it through the user's
actual question: "How does someone do this?" The audit has to cover creation, assignment/ownership,
discovery, action, recovery, and later changes. Sprint 1.3 examples: list ownership was persisted before
the import UI had an assignment place; personal/team ownership worked before owner changes were possible;
team-run capacity worked only after proving one Ready/online operator can continue when teammates are
offline. A workflow is not implemented if users must duplicate data, rely on hidden defaults, or wait for
another user who is not working.

**2026-07-08 refinement:** team-run snapshots also need a privacy/capacity split. It is valid to show
teammates that another operator is active/reserved/wrap-up, but not to ship that teammate's assigned
`callId`/`prospectId` and hope the UI hides it. `backend/src/services/dialRuns.ts` now makes snapshots
viewer-aware: own dispatch gets IDs; teammate dispatches get `null` IDs. Future manager/wallboard work
must either preserve this safe DTO or introduce a separate manager-scoped DTO with explicit permission
tests. Same closure pass fixed two adjacent non-mock-gated gaps: `enqueueDispositionDraftForCall` is
timeout-bounded with `THRESHOLDS.ai.dispositionDraftEnqueueTimeoutMs`, and HTTP disposition saves
downgrade client-submitted `source:'system'` to `agent`.

## Specific recurring patterns and their workarounds (CoachAi-proven)

### 1. Codex agents don't always commit their work to git

Codex sessions sometimes report "done" but the commit doesn't propagate to git history that the orchestrator sees. Working tree has the changes; branch HEAD doesn't have a commit.

**Workaround**: the orchestrator stages the working tree changes + commits on the agent's behalf, crediting them in the commit message ("Codex session reported the work done but did not propagate the commit to local git history visible to the orchestrator — orchestrator committed on behalf after verifying the diff matched the reported scope"). Don't wait for the agent to fix their commit.

### 2. Codex IDE caches the prompt file at session start

When you revise a prompt mid-session, the agent's IDE keeps the OLD content in memory. The agent keeps saying "the prompt says X" while disk says Y. **Always verify the file on disk reflects your edit, then explicitly tell the agent to force-refresh (Read tool / cat / fresh session). Don't trust the agent's reported view of the prompt.**

### 3. Shared-checkout branch drift is retired by worktree isolation

Agents must not share a mutable checkout. Each implementer receives an exact isolated worktree path and branch cut after `git fetch origin`; `main` stays read-only and integration happens through PRs. Still verify `git branch --show-current`, `git status --short`, and the worktree path before staging.

Safe integration pattern:

1. Verify the exact worktree, branch, dirty paths, and base.
2. Commit the implementer slice before any tree-touching reviewer.
3. Cherry-pick/rebase only from a dedicated integration worktree; never move another agent's branch or stash its files.
4. Stage path-limited owned files, verify the staged diff, and push the feature branch.
5. Open a PR with proof. Merge/deploy remains a human gate.

### 4. Cross-prompt reference cleanups during deletions

When cleanup-convention deletes a Codex prompt + its Claude design prompt, other sibling design prompts may have stale references. Agents catch and clean these references during their final commit. This is good behavior, not scope creep.

### 5. Agents do excellent pre-implementation challenges

When agents read the locked prompt + ask clarifying questions before coding, those questions usually catch real prompt defects. **Treat these challenges as gifts, not blockers.** Lock the resolution in the prompt + tell the agent to refresh. The cost of one extra prompt revision is much cheaper than fixing a misimplementation post-merge.

### 6. Agents pressure-test their own implementation post-coding and find their own gaps

This is gold-standard agent behavior — accept it, verify the fix sites, but don't treat self-discovered gaps as a sign the agent was sloppy. The pre-implementation pressure-test caught the prompt-level issues; the post-implementation pressure-test caught the wiring-level issues. Both passes are valuable.

When this happens: verify the fix sites read sensibly + run the regressions the agent added to prove the fix. If the gap exposes a missing convention, lock the convention in this file for future agents.

## Dialer-Specific Operational Notes (to be populated)

> Things specific to the dialer (Telnyx ergonomics, 10DLC vetting timeline surprises, Vercel/Railway deploy quirks) accumulate here as discovered.
