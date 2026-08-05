# Auxara control-plane and Sprint 1.5 reconciliation handoff — 2026-07-31

Use this note when Claude resumes Auxara work. Re-query GitHub and Git before acting because branch, worktree, Project, provider, and proof state can drift.

## Landed locally, not pushed

- Canonical AI Organization worktree: `${WORKSPACE:dev|backslash}\ai-org-auxara-reconcile`
  - branch: `codex/auxara-overlay-reconciliation`
  - commit: `1745930636da444ea179eca48421cd9409964759`
  - base: `6dac0d3bfdabd13e9d57956007103aa727705803`
- Dialer worktree: `${WORKSPACE:dev|backslash}\nd-s15-planning`
  - branch: `codex/s15-kickoff-reconciliation`
  - commit: `fa72fb37937f4a202a512b9ab89512cc7534c7d3`
  - base: `875338b1da7714ae911754de2e4291eaeeaeb68f`
- Both worktrees were clean after commit. Nothing was pushed, merged, deployed, or written to production.
- Landing order remains canonical AI Organization first, then reinstall/check that landed canonical commit into the Dialer and land the Dialer projection. Never merge only the generated half.

## Control-plane repair

The Dialer project-local overlay gate had been green while the canonical controller reported 39 missing/drifted files. The repair reconciled the target-evolved files into the canonical Auxara overlay instead of overwriting them or keeping a parallel fork.

Key changes:

- canonical Auxara ownership now includes current assurance v3, coordination, verdict-rubric, bounded-runner, dispatch-boundary, telemetry, and hook-validation assets;
- agent files use structural-prefix parity while the `## Learned classes` region stays append-only project memory;
- the ownership writer is dependency-free and refreshes only SHA-256 values while preserving every other generator-owned byte;
- Claude hooks are validated as rooted exec form: `command: "node"` plus one `${CLAUDE_PROJECT_DIR}/scripts/...` arg; `PostToolUse` must use matcher `Edit|Write`;
- `scripts/lib/validateClaudeHookSettings.mjs` is mapped, included in installed ownership, and registered in the canonical tracked-scope registry;
- verdict criteria/criticality are checked against the role registry;
- global Codex/Claude doctrine and decision-discipline mappings were installed and checked from the controller.

Final controller proof on the committed head:

- `npm test`: 271 tests, 271 passed, 0 failed;
- `npm run control:validate`: passed;
- `npm run overlay:validate:auxara`: passed;
- `npm run overlay:check:auxara -- --root ${WORKSPACE:dev|backslash}\nd-s15-planning`: passed;
- selected global `control-plane check` for Codex doctrine, Claude doctrine, and Claude rules: passed.

Dialer proof:

- build, lint, formatting, typecheck, backend tests, frontend tests, and `gates:all` passed as constituent lanes;
- agent-control-plane, organization-overlay, fleet-parity, rules-wiring, context-budget, decision-linkage, doc-code, doc-graph, Project-ledger offline, mock-handoff, endpoint-wiring, backend-endpoint parity, and filemap gates passed;
- `npm run test:integration` passed on the committed head after one first-run unrelated mock-browser timeout. The exact timed-out test passed alone in 2.2 seconds, and the serialized full retry passed. Test containers and the lease were cleaned up.

## Decision/document doctrine change

“Replace, do not layer” now explicitly covers decisions, plans, docs, GitHub Project cards, issues, backlogs, briefs, tests, and configuration:

- an approved change rewrites the owning current-authority record and every living projection in the same change;
- delete the retired claim from living authority;
- Git history or an isolated archive preserves provenance;
- do not use “latest wins” banners, bracketed amendment trails, duplicate decision IDs, or parallel Project cards;
- immutable legal/audit event logs may remain append-only, but must derive one singular current projection;
- finish with an old-claim sweep and reread every mutated external card.

This rule was backflowed into canonical Claude and Codex doctrine, the decision-discipline rule, the Auxara overlay, and the bootstrap decision-log template.

## Billing authority — no surprise pricing

Current policy is:

- commercial anchor remains `$80–120/seat/month`;
- default US/Canada voice and SMS is a genuinely useful flat bundle with generous transparent per-seat, never-pooled fair use;
- every usage unit is still ingested, reconciled, and rated through one versioned pipeline;
- the default flat policy creates no automatic per-use charge;
- sustained abuse may lead to a human-reviewed offer for a higher-flat or metered policy without rewriting ingestion/rating/reconciliation;
- a chargeable policy starts only prospectively after the tenant sees the measured basis, allowance, price, effective date, projected impact, and explicitly accepts it;
- never retroactively rerate/back-bill, silently enable charges, pool seats, or reveal a charge first on an invoice;
- exact tiers, allowances, and metered rates remain deferred.

BIL-002, BIL-003, BIL-007, and BIL-008 were rewritten in place as one current authority. Product, PRD, cost, data-contract, architecture, sprint, inventory, backlog, and Project projections were updated. Repo-wide retired-claim searches found zero live references to near-cost overage, the old numeric bands/rates, “latest billing authority,” or the retired authentication skill name.

## Sprint 1.5

Sprint 1.5 is the Phase-1 identity/membership and onboarding gate:

1. replace scalar `users.tenant_id` access authority with global identity, tenant membership, and active-workspace context;
2. repoint auth, RBAC, RLS, audits, queues/workers, provider context, invites, and entitlement consumers;
3. complete invite acceptance, password recovery, remember-me, and session revocation on that authority;
4. build one entitlement, usage, versioned pricing-policy/rating, flat-zero-charge, and bounded-trial pipeline;
5. extend the existing event/outbox system for an idempotent onboarding saga;
6. complete Stripe subscription/reconciliation/seat quantity;
7. complete 10DLC brand plus campaign vetting, vetted-throughput pacing, verified toll-free fallback, and CASL;
8. implement visible surfaces only after current Claude Design/founder approval;
9. close with provider/persisted/rendered proof and live Project parity.

Calendar remains Sprint 1.4 authority and is only consumed, never rebuilt. The only later work brought forward is stable high-cost-to-retrofit seams: actor/workspace contract for Sprint 1.6, membership/grant seam for Sprint 2.0, versioned event envelope for analytics/integrations, and domain-owned provider ports exercised by current Telnyx flows. Later features themselves stay later.

Primary plan: `${WORKSPACE:dev|backslash}\nd-s15-planning\docs\agent-prompts\sprint-1-5\kickoff-plan.md`.

## GitHub Project #7

Project: `Nuvoralink` private Project #7, `Auxara Dialer Roadmap`.

Final live reread on 2026-07-31:

- 24/24 fields fetched;
- 196/196 items fetched;
- 14 Sprint-1.5 items;
- 13 decision items with 13 unique decision IDs;
- 0 missing required Sprint-1.5 fields;
- 0 stale billing/auth/generic-walkthrough hits.

BIL-002 and BIL-003 now carry the no-surprise policy. ADM-001/002, AUTH-008, BIL-001/004/006, CMP-002/008, and CONV-007 were rewritten from generic walkthrough text to current authority. AUTH-008 now links the `auxara-dialer-authentication` skill. Dependencies and Acceptance were filled. Todo work remains Todo; no completion evidence was fabricated. Stale issue #250 was closed after verifying its referenced PR #249 was merged.

Keep Project #7 updated in the same change as every future authority/status/evidence update, then reread the full mutated sprint set. Do not treat the offline Project gate as live synchronization proof.

## Prior-sprint/worktree disposition

- Preserve `design/s14-pending-mocks` for the Claude Design and founder-approval lane.
- Do not touch `${WORKSPACE:dev|backslash}\nd-hookfix`; it is owner-controlled dirty lifecycle-hook work.
- `.claude/worktrees/agent-a696...` is spent M08 work already landed via #332 and is reclaimable.
- `${PROJECT:auxara-dialer|backslash}-s15` is not a Git worktree and has no unique blobs.
- `codex/s14-b01-authority-cutover`, `codex/s14-mocks-consolidated`, `preview`, and `gates/db-invariant-scanners` are superseded/spent.
- `docs/m07-embed-only-mock` is stale; salvage only a still-live current-contract fact, never merge/rebase the branch wholesale.

## Remaining real work

- Visible Sprint-1.4/Sprint-1.5 work still needs current Claude Design and founder approval.
- All ten mock packages pass hash/registry proof but controls and recipes remain schema v1 pending migration to v2; browser-evidence freshness is outside the cheap gate.
- Live provider continuity/E911 proof and the manual calling-hours/DNC confirmation UI remain real Sprint-1.4 closure items.
- Do not push the two local commits until current repository integration/deployment side effects are reviewed; no push was authorized or performed here.
