---
name: namespace-reservation-managed
description: "The namespace-reservation core, CLI, and both collision-gate engines are control-plane MANAGED assets auto-delivered to every project; each project ships only its own bindings."
metadata: 
  node_type: memory
  type: project
  originSessionId: 7a2c7c4e-76ad-45a7-bc78-d3e6920d076a
  modified: 2026-08-05T09:30:47.662Z
---

Promoted 2026-08-05. Canonical source: `core/coordination/` in `${PROJECT:control-plane}` — `namespace-reservation.mjs` (Git-common-dir ledger + atomic mkdir mutex + sequential/range allocation + reconciliation), `reserve-cli.mjs`, `adr-numbering.mjs`, `migration-object-names.mjs`, plus an engine test each. Delivered to `.ai-organization/runtime/core/coordination/` in every project by the existing `*-shared-runtime` tree mapping (no manifest change; nuvora-link gets it too).

Each project owns only `scripts/reservation-config.mjs` plus thin entries (`reserve.mjs`, `check-adr-numbering.mjs`, `check-migration-object-names.mjs`). Ledger: `<git-common-dir>/namespace-reservations/ledger.json`. Env: `NAMESPACE_RESERVATION_AGENT_ID` / `_BASE_REF`.

**Per-project bindings that must not drift:**
- Dialer — migration (`NNNN_slug`) + adr (`domain-numbered`) + decision + port **5300–5399**.
- CoachAI — adr (`sequential`, `docs/app-plan/adr`) + decision (`docs/app-plan/decision-log.md`) + port **5400–5499**. **No migration namespace on purpose:** its migration dirs are 14-digit timestamps, so the number axis cannot collide; `gate:migration-object-names` is the applicable control there.

**How to apply:** reserve BEFORE creating the artifact — `node scripts/reserve.mjs <namespace> [scope] <label>`; stdout carries the value and nothing else. Fix engine behaviour at the control-plane source and re-install, never in a delivered copy ([[managed-asset-fork-trap]]). When proving the object-name gate bites, pick a duplicate object by **tracing the real migration set** — an object a later migration DROPs is legitimately re-creatable, so duplicating it yields an inert fixture that passes and proves nothing.

Related: [[managed-asset-fork-trap]], [[parity-gates-normalize-line-endings]], [[parallel-swarm-coordination-research]].
