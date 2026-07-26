---
name: pr255-shift-left-remediation
description: "PR #255 shift-left doctrine loopholes fixed 2026-07-21 across all layers — db:guards tool, DB-lane merge gate, 3-question RCA, design-in blocks, CONFIRMED/CORRECTED metric"
metadata: 
  node_type: memory
  type: project
  originSessionId: a962bf11-759b-412e-9450-80a17b13dba7
  modified: 2026-07-21T08:56:01.016Z
---

2026-07-21: reviewed PR #255 (shift-audit-left doctrine) for loopholes, then fixed all nine findings + four additions across every layer in one pass.

**Now standing (don't re-propose):**
- `npm run db:guards -- <table>` (scripts/db-guards.mjs + gate:db-guards in gates:all registry) — static last-wins inventory of a table's CURRENT triggers/CHECKs/policies/RLS with honest dynamic-DO-block warnings. Use it for any DB write; it replaces hand-walked migration greps.
- **DB lane is a MERGE gate** for `backend/src/**`/`backend/prisma/**` branches (AGENTS.md Local proof) — test:integration green on HEAD before merge, DB-gated test list derived from the DIFF (`skipIf(!HAS_TEST_DB)`), never from the implementer's flag.
- **Three-question RCA** everywhere (adds "what INPUT set the builder up?"): project agents, global doctrine-loop/orchestrator-mode/implementer/auditors, bootstrap templates, CoachAI agents.
- **Design-in contract blocks** atop adversarial/compliance/cyber auditor files (implementer-facing distillation; implementers read the block, not the reviewer-seat prompt).
- **CONFIRMED (0)/CORRECTED (n) verdict prefix** on audit lenses + sprint-close tally = the countable shift-left metric.
- **Honesty counterweights** wired: auditors never soften; implementer self-audit never narrows audit scope; flagged residual = success.
- Killer-mutation polarity convention: widen the gate further → negative test must go **RED** (a "goes green" phrasing is the inversion bug I fixed in 3 places).
- ~/.codex/AGENTS.md now carries the implementer self-audit section (Codex parity closed).

**Known intentional residuals:** `.claude/agents/premise-and-architecture-challenger.md` still says "two-question" — control-plane managed (sha256-pinned in .ai-organization/ownership.json); needs a control-plane-layer sync, not a drive-by edit. CoachAI agent edits left UNCOMMITTED on its fix/dashboard-header-ambient branch (matching a prior uncommitted backflow there) — commit them with that tree's next commit.

**Scanner slice DONE 2026-07-21 (PR #259, stacked on #255):** gate:rls-delete-path + gate:db-mutation-coverage built on db-guards' parser (resolveDynamicGuards resolves 0043's inline-ARRAY DO loops; 0007 computed names = warnings). First sweep CAUGHT A LIVE DEFECT: inboundRoutingConfig.ts deletes FORCE-RLS `inbound_skill_memberships` → retained-member saves CRASH on PK, removals silently no-op → INBOUND-SKILL-MEMBERSHIP-DEAD-DELETE-001, **needs Amin's decision: DELETE-policy migration vs 0073-style soft-delete**. 4 gated-only coverage modules inventoried in DB-MUTATION-COVERAGE-BURNDOWN-001. Gate templates propagated to bootstrap-orchestrator templates/gates/. At merge time #259's backend annotations owe a test:integration green (DB-lane merge gate). Related: [[sprint-1-3-active]], [[migrate-on-deploy-live]].
