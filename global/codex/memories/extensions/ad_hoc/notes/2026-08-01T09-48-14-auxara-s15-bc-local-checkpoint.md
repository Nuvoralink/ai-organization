# Auxara Sprint 1.5 B/C takeover checkpoint

This note supersedes any handoff that describes the coordinated identity/membership B/C worktree as
uncommitted, DB-unproven, or still awaiting the security re-audit repairs.

- Repository/worktree: `${WORKSPACE:dev|backslash}\nd-s15-bc` on `codex/s15-bc-membership-cutover`.
- Local checkpoint commit: `44b253e4` (`feat(auth): activate membership-bound identity runtime`).
- The commit is intentionally not pushed, PR'd, merged, or deployed.
- Exact commit-candidate local CI passed all four lanes: audit 7.3s; verify 1,056.8s; DB integration
  461.4s with 321 files, 3,123 passing tests, 113 skips, and all 13 required DB suites executed;
  Docker build 7.0s.
- Security re-audit repairs are included: WebRTC rechecks exact live membership/version plus
  dial-or-answer authority after provider mint; recording final authorization compares the signed
  auth-token version; `/auth/me` preserves a pending workspace-selection CSRF binding; the Argon2
  decoy is initialized before listen. The runtime login-many -> `/auth/me` -> explicit-select chain
  and the deferred-mint revocation race both passed the DB lane.
- Migration 0079 repoints the 74 modeled relations across the 76 physical User foreign keys through
  retained membership. User tenancy/lifecycle/pause/E911 scalars remain non-authoritative rollback
  projections; do not retire them until a later release measures zero old reads/writes.
- Project #7 (`Auxara Dialer Roadmap`) was updated for AUTH-002, AUTH-007, AUTH-008, DEC-001, and the
  Sprint-1.5 epic. All remain honestly In Progress. Live audit is 24/24 fields, 199/199 items,
  `requiredAuthoritySatisfied=true`, and `issueCount=0`; the targeted whole-board stale scan found no
  old integration-pending, old item-count, near-cost, or local-only control-plane evidence.
- Do not push or merge the Dialer branch yet. Railway auto-runs migrations on deploy, and migration
  0079 requires real old-writer quiescence, instance drain, replacement-writer proof, and its exact
  activation acknowledgement. The workspace-selection, recovery, invite, and remember-me frontend
  is also Claude Design/founder-approval-gated and not fully wired, so pushing now would expose an
  incomplete multi-workspace login journey.
- Remaining Sprint 1.5 work includes the approved frontend wiring, production activation,
  entitlement/usage ledger, Stripe/onboarding saga, 10DLC, and later planned slices. Sprint 1.5 is
  not complete.

