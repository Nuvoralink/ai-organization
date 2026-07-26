---
name: master-plan-retired-gap-audit
description: Master plan retired 2026-06-12 (authority = docs/app-plan set); 15 gap-audit rows + NUM-008 ALL walkthrough-LOCKED 2026-06-12 (not pending) — read decision-log before scoping any 1.x/2.x slice; NUM-007 ported-entry mock conflict open.
metadata: 
  node_type: memory
  type: project
  originSessionId: c736ed6a-56e0-4496-b3fa-e4b8599be152
---

As of 2026-06-12 (PR #30, branch docs/master-plan-retirement-decision-rows):

- `auxara-dialer-master-plan.md` is **deleted**. Authority set = `docs/app-plan/` (product/01-product-brief + 03-feature-scope, 02-prd, auditability/decision-log + architecture/adr, architecture/06, security/20, engineering/25 for costs). Never cite the master plan as live; historical §-citations resolve via git history. Sprint docs use a **Grounding:** line instead of "Master plan ref".
- 15 new decision rows from the gap audit: OPS-005 destination lock (✅ Approved); DLR-010, INT-005/006/007, NUM-007, CONV-005/006/007, ARC-008, OPS-006 (🟡 Open w/ recs); CMP-013/014/015/016 (⬜ Draft — frequency caps, SMS quiet hours, RND, 911). Walkthrough by Amin pending; sprints 1.2/1.3/1.4/1.5/2.1/2.3 block on them.
- IVR posture (Amin's direction): no IVR **builder** in v1, but inbound routing must be config-driven + IVR-ready (CONV-006) with voicemail fallback configurable at org + pod/member level (CONV-005). Inbound-heavy market segment is a door to keep open, not scope creep.
- Enforcement pattern for new compliance capabilities mirrors CMP-012: power/auto paths hard-block or defer (system is the actor); manual/human-send paths get a confirm speed-bump (tenant-config block/confirm/off); DNC/STOP/consent never overridable.
- `gh` token now has `project` scope (refreshed 2026-06-12). All 15 gap-audit surfaces exist on GitHub Project #7 (script: `scripts/add-gap-audit-decision-items-2026-06-12.py`, ALREADY RUN — do not re-run). **All 15 Approved** (walkthrough completed 2026-06-12, every recommendation accepted): incl. DLR-010 FIFO+recycle queue, INT-007 identity-at-birth, ARC-008 two-lane versioning, CMP-013/014 default-ON compliance w/ CMP-012 mode-split, CONV-005 voicemail + press-9 (bundled w/ VM-drop), CONV-006 config-driven routing pipeline, CMP-016 per-user dynamic E911, INT-006 lead-pull Phase-2-fast-follow. Sprint 1.2 fully unblocked.
- **NUM-007 OPEN CONFLICT (flagged to orchestrator, unresolved):** decision-log says ported numbers enter the lifecycle at **`active`** (reputation continuity); the APPROVED+LOCKED port-in mock (`number-pool.html` `#portScrim`) says they join as **`warming`**. The mock is the stale side. Not blocking 1.1 (porting = Sprint 2.1); settle before the 2.1 port-in slice → updating the mock is a locked-surface change (mockup-first re-approval). Until then, do NOT build the port-in dialog (frontend slices skip `#portScrim`).
- **Recall-vs-body drift caught 2026-06-12:** this file's BODY said "all 15 Approved" but its description/index said "pending walkthrough" — I dispatched 2 implementers off the stale recall summary before re-reading the decision-log. Lesson: the index/description hook is the load-bearing recall surface; keep it in sync with the body, and re-read the decision-log (not just memory) before scoping a slice.
- Stale worktree `.claude/worktrees/cx-num-mocks/` exists — exclude from repo-wide greps.

**Why:** prevents re-citing a deleted doc and re-litigating settled gap-audit scope.
**How to apply:** ground any product/scope claim in the [[design-system-locked]]-style authority docs above; check decision-log row status before implementing against the new IDs.
