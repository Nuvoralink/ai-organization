# Auxara Sprint 1.5 and control-plane final local checkpoint (2026-08-01)

This note **supersedes** the active-state claims in:

- `2026-08-01T08-35-00-auxara-control-plane-pr27-merged.md` where it presents PR #27 / `098a76c...` as the current control-plane head; and
- `2026-08-01T09-48-14-auxara-s15-bc-local-checkpoint.md` where it presents Dialer commit `44b253e4` and Project #7 at 199 items as the current B/C checkpoint.

Keep those older notes only as provenance. Do not route Claude/Codex back to their stale heads, counts, or pending-work claims.

## Canonical AI Organization control plane

- The only canonical checkout remains `${PROJECT:control-plane|backslash}`. `${PROJECT:control-plane|backslash} Control Plane` is retired and has zero authority.
- AI Organization PRs #27 and #29-#32 are merged. Current `origin/main` is merge `e3c1eb9cb25aad665462fe3cbe9542e4de2b9cf9`.
- PR #29 replaced the stale Railway release-verifier contract with the current CLI/readiness authority across universal templates and the Auxara/CoachAI overlays.
- PR #30 replaced stale Auxara AMD, ICP, and number-lifecycle projections. AMD authority is exactly `off`, `standard`, and `premium`; standard is active, premium remains dormant, and every result is passive/advisory.
- PR #31 replaced the stale 90-day cancellation claim with the 30-day read-only export/reactivation window while preserving the separate 90-day active-workspace recording-retention default. It also promoted the singular-current-decision/no-layered-addendum gate and removed resolved exceptions.
- PR #32 restored byte-for-byte canonical/project formatting parity after Prettier formatted the Dialer projection.
- The final canonical `npm run ci` passed: 281 tests, 1,257 tracked-scope classifications, control-plane validation, Auxara overlay validation, and CoachAI overlay validation. GitHub has zero Actions workflows; local CI remains the intentional merge proof.

## Dialer Sprint 1.5 B/C checkpoint

- Worktree: `${WORKSPACE:dev|backslash}\nd-s15-bc`
- Branch: `codex/s15-bc-membership-cutover`
- Final clean local HEAD: `48673cfd39269ebb00bae2813a626f995f85b362` (six commits ahead of Dialer `origin/main`)
- State: intentionally **unpushed, no PR, unmerged, undeployed**.
- Exact final `npm run ci` exited 0 in 1,798.5 seconds on `48673cfd...`: high-severity audit gate, full build/lint/format/typecheck/unit/gates registry, serialized DB integration, and Docker all passed. A preceding Docker `npm ci` hit one external `ECONNRESET`; the exact Docker retry passed in 96.2 seconds, then the complete aggregate rerun passed. Do not describe this checkpoint as uncommitted, DB-unproven, or awaiting the security repairs.
- The worker-contention backlog is resolved: Vitest derives one worker per two logical CPUs, bounded to 1-4; three consecutive full `verify` runs, the complete gate registry, DB integration, and final exact-HEAD CI passed without adding retries or widening timeouts.

## Implemented authority

- All 74 Prisma-modeled tenant-actor relations across the 76-physical-User-FK predecessor remain repointed through retained membership. Migration `0081_s15_dispatch_actor_authority_snapshot` adds one exact `(tenant_id, initiating_membership_id)` dispatch relation plus the initiating auth-token version.
- JWT/session/CSRF, invite acceptance, identity-owned recovery, dial-run claim/reserve, final provider preflight, recording/disclosure authorization, and Telnyx webhook paths revalidate the exact active membership, matching tenant, auth-token version, and required grant.
- Disclosure proof, event, recording command, and occurrence commit atomically before provider playback; duplicates resume the same durable command; missing normalized topology creates no false proof.
- AMD has exactly three states: `off`, `standard`, `premium`. Standard provider AMD is active on the prospect leg; premium is a dormant seam; off omits the provider AMD parameter and emits no AMD usage. Standard/premium use the same metered provider boundary and passive projection. AMD never drops, hangs up, advances, disposes, or mutates lead state autonomously.
- Current billing policy is a useful flat US/Canada per-seat bundle with generous never-pooled fair use. All units are still ingested/reconciled/rated through one versioned seam. A future higher-flat or metered policy is prospective only after measured disclosure and explicit tenant acceptance; never silently enabled, back-billed, pooled, retroactively rerated, or first revealed on an invoice.
- Booking authority is external link/embed plus explicit human `user_reported_external` completion. Native Google/Calendly OAuth/API/write/webhook/reconciliation is deferred INT-004 and remains disabled/quarantined. Existing M07 and People artifacts are structural handoffs only, not approved visible UI.

## Project #7 current truth

- Project: `Auxara Dialer Roadmap`, ID `PVT_kwHOD1DbR84BZDEP`, number 7.
- Final live audit: 24/24 fields, 201/201 active items, 75 required Sprint-1.4 authority cards, 40 included decision cards, `requiredAuthoritySatisfied=true`, `validation.ok=true`, `issueCount=0`.
- Stale Sprint-1.4 INT-004 native-calendar item `PVTI_lAHOD1DbR84BZDEPzguXftI` is archived. ADM-006 and INT-001 were rewritten in place. ARC-010, BUX-015, and COMPANION-RAW-DIAL-001 each have exactly one authority card. BUX-006, DLR-014, NUM-001/004/006, REC-002, DEC-001, AUTH-002/007/008, and the Sprint-1.5 epic were reread after update.
- The Sprint-1.5 epic `PVTI_lAHOD1DbR84BZDEPzguFdok` remains honestly `In Progress` and carries final Dialer HEAD `48673cfd...`, final local-CI proof, canonical control-plane head `e3c1eb9...`, three-state AMD, flat/no-surprise pricing, and remaining release gates.

## Resume boundary for Claude

- Start from the clean local Dialer worktree/head above; do not reapply older dirty-worktree handoffs or merge stale mock branches wholesale.
- Do not push or merge the Dialer branch while main changes can auto-deploy. No deployment, provider config, migration activation, or production mutation was authorized or performed by this checkpoint.
- Do not activate migration `0079` until signup/invite writers are quiesced, old instances drain, locked delta backfill and exact membership completeness pass, replacement writers are proven, and the exact maintenance acknowledgement is supplied. Scalar contraction still waits for measured zero old reads/writes.
- Visible workspace selection, invite/recovery/remember-me, People, and booking/report work remains Claude Design plus founder-approval gated.
- Remaining Sprint 1.5 product work includes the entitlement/usage ledger, Stripe/onboarding saga, campaign-level 10DLC/pacing/fallback, approved visible surfaces, and separately authorized production release verification.
