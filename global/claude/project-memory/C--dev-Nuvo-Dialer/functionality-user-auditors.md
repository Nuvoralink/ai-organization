---
name: functionality-user-auditors
description: 2026-07-08 fleet upgrade — user-journey-auditor + functionality-parity-auditor lenses + gate:endpoint-wiring (NFR-012) exist; first parity run + CoachAI sibling still owed.
metadata: 
  node_type: memory
  type: project
  originSessionId: 78193b06-e23d-4bbd-ab73-237322cf0621
---

Amin's 2026-07-08 directive ("ICP use-case audit; decision-vs-built drift; backend built but never
wired to frontend and nothing caught it") produced two standing lenses + a mechanical gate — do NOT
re-propose these; they exist:

- `.claude/agents/user-journey-auditor.md` — ICP's-seat walk (personas × moments, day-zero first,
  workflow loopholes, improvement candidates as decision inputs). Web-research-enabled.
- `.claude/agents/functionality-parity-auditor.md` — delivery chain decided→built→wired→called→
  reachable, both directions; re-triages the gate's PENDING_WIRING rows.
- `gate:endpoint-wiring` (`scripts/check-endpoint-wiring.mjs`, in gates:all + the PostToolUse hook
  for endpoints.ts/api.ts edits; meta-test `endpoint-wiring-gate.test.ts`; PRD row NFR-012). First
  run found 6 real unwired endpoints (now honest PENDING_WIRING rows w/ reasons) + 2 registry keys
  orphaned by inline path reassembly in api.ts (fixed same turn: conversations.get/send now
  reference conversationDetail/conversationMessages).
- Cadence wired into sprint-rigor §10 (parity per backend-only slice + both in the sprint-close
  whole-app sweep); routing added to adversarial-reviewer + doctrine-drift-auditor (drift keeps
  CONTRADICTION, parity owns UNDER-delivery).
- Universal backflow DONE same turn: both agent templates + fleet enumerations in the
  bootstrap-orchestrator skill (the ~/.codex and ~/.claude skill homes are ONE hard-linked store —
  editing one updates both; cp between them errors "same file").

**Still owed:** (1) the functionality-parity-auditor's FIRST whole-app run — it owes a triage
verdict on every PENDING_WIRING row (numbersSettings, numbersImportOwned, calls read-one,
callsFromEligible, recordings + suffix); (2) the user-journey-auditor's first run → creates
`docs/app-plan/assurance/icp-use-case-inventory.md` via the orchestrator; (3) CoachAI sibling
instantiation — spawn_task chip `task_6798cd2f` pending Amin's click; (4) the work is UNCOMMITTED
on `codex/s13-doc-drift-closure` (deliberately — in-flight Codex slice shares the tree; land on its
own branch + `npm run filemap` at commit time).

Related: [[doctrine-upgrade-2026-07-02]], [[universal-backflow-rule]].
