---
name: worktree-stale-shared-dist-falsered
description: "A CoachAI worktree \"red build\" about a shared contract is usually a stale-shared/dist false-red, not a source bug — diagnose before editing."
metadata: 
  node_type: memory
  type: project
  originSessionId: 00291603-8f61-4eaa-8a4b-35349c06187c
---

**A "red backend build" in a CoachAI git worktree that points at a `@ail-sales-coach/shared` contract mismatch is almost always a STALE/FOREIGN `shared/dist` false-red — NOT a source bug. Verify the resolved dist before touching source.**

Mechanism: `backend`/`frontend` consume `@ail-sales-coach/shared` via `file:../shared`, resolved through `node_modules`. A worktree that was never `npm install`-ed has no local `node_modules`, so Node walks UP and resolves the **main checkout's** `shared/dist` (which is on whatever branch/commit the main checkout sits — often behind origin/main). A shipped contract change (e.g. MGR-12 removing `LeadTypeBreakdownDTO.conversionRate/inScopeOutcomeCount/bookedCount`) then makes a current 5-field producer typecheck against a stale 8-field resolved DTO → TS2345. `git stash` does NOT hide it (dist is gitignored). The FALSE-GREEN variant (foreign dist still has fields current source removed → a real break passes) is the dangerous twin.

**Diagnose:** compare `shared/src/coaching/contracts.ts` (source) vs the resolved `shared/dist/coaching/contracts.d.ts` in the MAIN checkout — if they differ, it's the artifact, not the code. The error's object-literal shape shows the CURRENT producer; the "missing" fields are the STALE dist's.

**Fix = worktree setup, never a source edit:** `npm install` in the worktree (resolves shared in-tree); `prisma generate` (needs a resolvable `DATABASE_URL` — a dummy `postgresql://u:p@localhost:5432/db` works, generate reads the schema not the DB); provide `.env`; then `npm run verify`. Reintroducing removed contract fields to satisfy the stale dist revives killed scope (PD-MGR-4 was settled+shipped) and breaks `teamObjectionSummaryRegression.ts`.

**Prevention wired (2026-07-04):** `scripts/check-shared-resolution.mjs` (fails fast on foreign resolution) is the FIRST step of `build:backend` + `build:frontend`, registered in `v2-authority-source-inventory.json`. Generic template also added to the `bootstrap-orchestrator` skill (`templates/gates/check-shared-resolution.mjs.template` + worktree-slice-preamble step 0). See [[git-ff-main-sync]] (main checkout lagging origin/main is the root enabler) and [[ci-gates-doc-drift]] (adding a root script requires inventory registration or doc-code-drift fails).
