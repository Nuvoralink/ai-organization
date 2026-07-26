---
name: merge-model-local-ci-gate
description: "CoachAI + auxara-dialer are free-plan private repos → NO branch protection → GitHub checks never gate a merge; ci:local (CoachAI) / the dialer's local CI is the REAL gate. GitHub Actions was billing-halted 2026-07-11 (red status ≠ code signal). Merge via gh pr merge --rebase."
metadata: 
  node_type: memory
  type: project
  originSessionId: b559c9e4-f729-4309-ac65-72580ac7b723
---

Both `Nuvoralink/Nuvora-CoachAi` and `Nuvoralink/auxara-dialer` are **private repos on a free GitHub plan** — so `gh api .../branches/main/protection` returns 403 ("Upgrade to GitHub Pro"), meaning **there is NO branch protection and NO required status checks**. A `gh pr merge --rebase --delete-branch` lands even when every GitHub check is red. The GitHub CI run is therefore **advisory, not gating**.

**The real merge gate is LOCAL:** run `npm run ci:local` (CoachAI — the runner Amin had me build, PR #191/#67b9a766; mirrors the `gates` + frontend-vitest CI jobs step-for-step) or the dialer's own local CI / `npm run gates:all` + `typecheck` + the affected vitest, read the REAL exit code (the runner prints `ci-local: PASS/FAILED` — the wrapper's trailing `echo` exit is NOT it), THEN merge on GitHub. This is exactly Amin's model: "run the local CI so we only just merge on github."

**GitHub Actions was BILLING-HALTED on 2026-07-11** — every workflow run showed `completed/failure` in ~2s (billing wall, before any gate ran). So a red GitHub run in this window is NOT a code signal. Don't chase it; verify with the local CI. (This may get fixed if Amin adds billing, but the no-branch-protection → local-CI-is-the-gate model is durable regardless — branch protection is itself a paid feature on private repos.)

**Why this bites — the silent-red-main incident (2026-07-11):** `ba7648c6` (Amin's own "hero verdict renders the SHORT editorialHeadline" coaching fix) moved the editorialHeadline authority from `TheMomentSection` to the hero verdict (`callReviewMapper.ts` `summary.primaryIssue = editorialVerdict || bundle.headline`) and updated its mapper+smoke bites — but NOT the `DCD-TEST-5` drift check, which still grepped `TheMomentSection` for the old order. So `main` sat **red on `test:doc-code-drift`**, and because GH Actions was billing-halted it was never caught — until `ci:local` on a stacked FE branch surfaced it. Fixed by repointing DCD-TEST-5 at the new mapper authority (PR #195). **Lesson: with CI billing-halted + no branch protection, `main` can go red silently on a real gate; a behavior-change commit that touches an authority a drift-check guards MUST update that check in the same commit (doctrine-loop Arm 3), and you must run the local CI before trusting main is green.** See [[ci-gates-doc-drift]] and [[git-ff-main-sync]].
