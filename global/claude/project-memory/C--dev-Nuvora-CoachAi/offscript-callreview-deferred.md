---
name: offscript-callreview-deferred
description: "CORRECTION (2026-06-16): the off-script Call Review v2 feature (compact rep rhythm + OffScriptSection) is MERGED and LIVE in main (PR #86, rebase, 2026-06-15) — NOT deferred. The earlier 'deferred/unmerged' record was a rebase-leftover misread; the stale branch was deleted."
metadata: 
  node_type: memory
  type: project
  originSessionId: 8b17a627-d518-47d5-bd00-6bbb06644578
---

**The off-script Call Review v2 feature is SHIPPED, not deferred.** "Compact rep Call Review rhythm + surface off-script coaching moments" (the `OffScriptSection` component + the `foundations.layout` section-rhythm tokens) **merged to `main` via PR #86 (rebase) on 2026-06-15** and is live in `origin/main` (as commits `fa620a00` + `1f3ebff1`): `OffScriptSection.tsx`, the tokens, and the authority-inventory classification are all there.

This memory previously claimed the feature was "PRESERVED but unmerged / deferred per Amin's 'land only my callback-guard fix' choice, on branch feat/rep-call-review-tighten-offscript." **That was wrong — a rebase-leftover misread, corrected 2026-06-16:**

- After a **rebase-merge**, the original local branch keeps its PRE-rebase SHAs (`a2bdcabe`/`dfbd4e38`), so `git log origin/main..feat/rep-call-review-tighten-offscript` showed "3 commits ahead" even though the content was fully merged, and the merged PR showed `closedAt` set. Together those *look* like "closed, unmerged, deferred" — but aren't.
- **Verify a merge by patch-id, never by SHA reachability:** `git cherry -v origin/main <branch>` showed `a2bdcabe`/`dfbd4e38` as `-` (already in main), and the branch's `callReview/v2/` + `foundations.ts` were byte-identical to main. The 3rd commit (`637a302d`, the `lineVisibility`/line-source cleanup) was foreign tangle-work whose equivalent was also already in main (`e7235714`; `lineVisibility.ts`/`.test.ts` are gone from main). Nothing unique lived on the branch.
- The stale local branch `feat/rep-call-review-tighten-offscript` was **deleted 2026-06-16**.

**Lesson:** to decide whether a branch's work is merged, use `git cherry` / patch-id — NOT `git log main..branch` (rebase rewrites SHAs so merged commits still show as "ahead") and NOT a PR's `closedAt` (merged PRs are also "closed"). The "land only my callback-guard fix" decision was about the OTHER tangled working-tree work (callback-guard #89, stragglers #90/#91, auto-ingest doc), NOT this already-merged feature. Do NOT try to "revive" the off-script feature — it's shipped. [[ci-gates-doc-drift]] [[coaching-surface-altitude]]
