---
name: coachai-worktree-setup
description: "Exact setup sequence a fresh CoachAI worktree needs before any backend script/test runs (npm ci alone is NOT enough), plus the analysis.json read topology that decides where a reprocess must run."
metadata: 
  node_type: memory
  type: project
  originSessionId: 35cf4fde-df64-497f-b223-842c0340d2fd
---

A fresh CoachAI git worktree needs FOUR steps before backend scripts/tests work (each missing step produced a real failure on 2026-07-08):

1. `npm ci` at the worktree root (workspaces install).
2. Copy `backend/.env` from the main checkout (gitignored — doesn't travel; `prisma generate` and runtime scripts fail on missing `DATABASE_URL`/keys without it).
3. `cd backend && npx prisma generate` (npm ci installs the stub `@prisma/client`; without generate, ANY script importing the prisma chain dies with "does not provide an export named 'PrismaClient'").
4. `npm run build --workspace=shared` (the build gate `check-shared-resolution.mjs` verifies worktree-local resolution — see [[worktree-stale-shared-dist-falsered]]).

**Why:** steps 2-3 are invisible until the first runtime import, and the failure surfaces as a confusing ESM export error, not "missing env".
**How to apply:** run all four immediately after `git worktree add`, before edits/gates.

**Read-only reviewers don't need the full setup** (adversarial-reviewer lesson, 2026-07-12): even when `backend/node_modules/.bin/tsx` is absent, the worktree ROOT usually carries the hoisted `node_modules/.bin/tsx` and an already-built `shared` — so `../node_modules/.bin/tsx scripts/X.ts` from `backend/` runs every regression + `tsc --noEmit` with zero install. Check the root `.bin` and the `@ail-sales-coach/shared` resolution before concluding a worktree "can't be exercised".

**NEVER `git stash` in a worktree** (footgun hit 2026-07-12): the stash stack is PER-REPOSITORY and SHARED across all worktrees. A `git stash push -- <files>` + `git stash pop` collided with a pre-existing foreign WIP stash (`codex/dialpad-ingest-adapter`) and merged ~20 unrelated files into the tree as `UU` conflicts. To A/B a change against base, don't stash — use `git show <sha>:<path>`, a separate worktree, or read the committed base directly. Recovery if it happens: `git checkout HEAD -- <the UU files only>` (path-limited, never a blanket reset), leave your own ` M` files and the foreign stash untouched.

**`typecheck:scripts` has ~233 pre-existing tolerated errors** (2026-07-12): the backend scripts tsconfig (`tsc -p tsconfig.scripts.json`) is NOT in the merge gate — `verify` runs `typecheck` (src only, `tsc --noEmit`). `check:script-imports` explicitly tolerates the 233 fixture type-drift errors. So a red `typecheck:scripts` is expected; only judge NEW errors your diff adds (diff the error set, don't treat any red as a regression).

Related topology fact (decides WHERE a reprocess can run): the live Call Review GET reads `analysis.json` FILE-first per request (`callReviewMapper.ts` → `readSessionAnalysisJson`: session-dir file, then the `SessionPipelineRun` `analysis_json_main_v1` DB sidecar as fallback). On the internal stack (storage=volume) a LOCAL reprocess updates the DB sidecar but the deployed volume file SHADOWS it — server-side rerun/reprocess (admin route) is the only way to refresh what the deployed surface serves. `railway ssh` into prod is permission-gated in Claude Code auto mode.
