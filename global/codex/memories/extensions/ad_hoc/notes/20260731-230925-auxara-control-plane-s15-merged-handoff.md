# Auxara control-plane and Sprint 1.5 merged handoff — 2026-07-31

This note supersedes the pre-push state in `2026-07-31-auxara-control-plane-s15-reconciliation-handoff.md`. Re-query live Git, GitHub, and Project state before acting.

## Canonical control plane is landed

- `Nuvoralink/ai-organization` PRs #20–#26 are merged. Current canonical `origin/main` is `3ca66bd70064f1d043f670fe6ad8cad435dd5087`.
- The sequence reconciled the Auxara overlay, retired GitHub-hosted CI in favor of complete local merge proof, guarded controller tracked scope, aligned authentication with global identity, made the lifecycle controller compute review verdicts, removed stale partial-CI doctrine, and fixed tenant-admin recovery authority.
- Controller proof was 277/277 tests plus validation/overlay checks. In the Dialer, GitHub workflows are absent and `npm run ci` is the complete local merge gate.
- Do not revive `${PROJECT:control-plane|backslash} Control Plane`; canonical authority is `${PROJECT:control-plane|backslash}`.

## Sprint 1.5 plan and Slice A are merged

- Plan PR #333 merged at `0dc9867a0143096324adfc1ca6eecaa45f796a21`. Independent pressure test: ACCEPT, 100% coverage, score 1.000. Complete local CI exited 0 in 2,198 seconds.
- Canonical plan path after local `main` fast-forward: `${PROJECT:auxara-dialer|backslash}\docs\agent-prompts\sprint-1-5\kickoff-plan.md`.
- Slice A PR #334 merged at `231778b9c6c3a64790e5d27abaed45a9aa9dcb2e`.
- Slice A added `User.accountStatus`, retained `TenantMembership`, and migration `0078_s15_identity_membership_expand` without activating runtime writer/read cutover.
- Exact predecessor authority is 76 physical User foreign keys: 74 Prisma-defined plus 2 SQL-only, guarded by schema hash `ed91217bf2fce20bb1de56846fc6952c`.
- Hardening includes BYPASSRLS plus `row_security=off` preconditions, deterministic feeder locks, bounded lock/statement timeouts, retained-membership RLS/guards, exact runtime UPDATE-column grants, and historical-predecessor verification.
- Proof: runtime/cutover review PASS; authority gate 48/48 mutations; focused DB suite 11/11; complete local CI exit 0 in 1,544.9 seconds across audit, verify, DB integration, and Docker. The audit retains 25 known low/moderate findings and no high-severity failure.

## Exact next work for Claude

- Sprint 1.5 remains In Progress. Next is the coordinated Slice B/C cutover: replacement signup/invite writers plus active-workspace runtime context, then every auth/session/RBAC/RLS/audit/queue/provider consumer.
- Scalar retirement is forbidden until the exact staged contract is complete: `quiesce_signup_and_invite`, `drain_old_instances`, `locked_idempotent_post_expand_delta_backfill`, `exact_membership_completeness_before_activation`, `replacement_writers_before_activation`, and `scalar_retirement_after_zero_old_reads_writes`.
- Visible activation remains blocked on the approved minimum workspace-selector reference. The Sprint-1.4 M04/M05/M06/M07/M09/M10/profile revisions remain in Claude Design; do not merge a stale mock branch wholesale.
- `${WORKSPACE:dev|backslash}\nd-hookfix` is the only dirty registered worktree. It is owner-controlled and stale relative to current `origin/main`; its staged lifecycle-hook replacement conflicts with the current canonical overlay. Do not merge, reset, or reuse it without an explicit rebase/reconciliation decision. The clean Sprint planning, Slice A, and live-audit worktrees and their local branches were removed after merge; the nested M08 worktree is spent/reclaimable.

## Live Project #7 and pricing authority

- Project #7 (`PVT_kwHOD1DbR84BZDEP`) was reread after the Slice A update: 24/24 fields, 199/199 items, `requiredAuthoritySatisfied=true`, `validation.ok=true`, `issueCount=0`.
- A separate complete `gh project item-list --limit 500` reread returned 199 unique item IDs and zero hits for the retired near-cost/numeric-overage, 74-only, 196/196, or local-unpushed claims.
- Sprint 1.5 epic item `PVTI_lAHOD1DbR84BZDEPzguFdok` remains Status/Workflow `In Progress`. Its body, Acceptance, and Completion Evidence now carry PRs #333/#334, exact 76-FK authority, proof receipts, remaining B/C work, and local-only CI.
- Supersede/remove memory that reports the board as 196/196 or says the plan/control-plane commits are merely local and unpushed.
- Current no-surprise billing authority: `$80–120/seat/month`; useful flat US/Canada voice/SMS with generous per-seat, never-pooled fair use; ingest/reconcile/rate every unit through one versioned pipeline; default policy emits no automatic per-use charge. A higher-flat or metered policy can begin only prospectively after measured basis, allowance, price, effective date, projected impact, and explicit tenant acceptance. No retroactive rerating, back-billing, silent enablement, or invoice-first surprise. Exact future tiers/allowances/rates remain deferred.

## Durable lesson added

The authentication skill now requires FORCE-RLS migration proof and a staged-arrival bridge before activation. The static authority gate independently mutates all six cutover clauses in both active authorities, preventing a prose-only or partial contract from passing.
