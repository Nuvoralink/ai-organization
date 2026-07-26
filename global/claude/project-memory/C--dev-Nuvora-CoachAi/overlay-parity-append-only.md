---
name: overlay-parity-append-only
description: "The orchestration overlay-parity gates + the learned-classes append-only drift bug/fix across CoachAI, the dialer, and the universal source repo."
metadata: 
  node_type: memory
  type: project
  originSessionId: 35cf4fde-df64-497f-b223-842c0340d2fd
  modified: 2026-07-24T08:57:23.387Z
---

**The control-plane overlay-parity system + the append-only-drift fix (shipped 2026-07-24).**

Three repos share a "universal orchestrator overlay" governance layer; two gate *families* exist:
- **CoachAI** (`Nuvora-CoachAi`): `scripts/check-overlay-parity.mjs` — walks `managed_roots` + `managed_files` + `managed_json_sections` (package.json/settings.json) declared in `.ai-organization/ownership.json`, SHA-hashes them vs `.ai-organization/overlay-lock.json`. `--write` relocks. Runs in `gate:organization` (part of `ci:local`).
- **Dialer** (`auxara-dialer`, checkout `${PROJECT:auxara-dialer}`): `scripts/check-organization-overlay.mjs` — a DIFFERENT, manifest-based gate: explicit per-file `managedFiles: [{path, sha256}]` in `.ai-organization/ownership.json` (no dir-walk, no json_sections). `--write` relocks. Tested by `backend/src/__tests__/organization-overlay-gate.test.ts` (run from `backend/` — it does `path.resolve(cwd,'..')`).
- **Universal SOURCE** = `${PROJECT:control-plane}` (git, remote `Nuvoralink/ai-organization-control-plane`, repo `ownership.json overlay_source` calls it `universal-private-orchestrator`). Holds `overlays/coachai/` + `overlays/auxara-dialer/`, each with `project-files/` (the installed content) + a portable `overlay-lock.json`. Synced to/from live projects via `node scripts/project-overlay.mjs capture|install <name> --root <checkout>`. `npm test` (209 tests) is its gate.

**The bug:** both gates hash agent files' FULL content, but `.claude/agents/*.md` carry a `## Learned classes (live log — the orchestrator appends…)` region the closed-loop-learning flow grows. Every append drifts the lock → gate goes red with NO structural change. (CoachAI walks all agent files → drifts constantly; dialer manages only `premise-and-architecture-challenger.md` → drifts on that one file's appends.)

**The fix (append-only marker exclusion):** `fileSha`/`hashFile` strips from the first `## Learned classes` heading to EOF before hashing, driven by a new `append_only_markers`/`appendOnlyMarkers` field in `ownership.json`. Marker-less files keep their exact old hash → only the agent file's entry changes. Shipped: CoachAI PR #224 (+ #225 = proof-profiles `documentation` profile `include` gains `"*.md"` so ROOT docs like COACHING_ARCHITECTURE.md/MVP_CONTRACTS.md stop failing `run-risk-selected-proof`'s `unknown_path_policy:"fail"`); dialer PR #269 (open, merge left to Amin — dialer's `gates:all` is pre-existingly red on `gate:agent-context` budget, unrelated); universal source = local branch `chore/coachai-overlay-append-only-parity` (commits 5c11bfe coachai + 9b3285e auxara), NOT pushed (unknown workflow, mid Codex branch).

**Universal-source gotcha (durable):** do NOT `project-overlay.mjs capture` to sync the fix — capture resyncs 2 weeks of unrelated CoachAI control-plane drift (evolved hook scripts) and REDS the repo's own 209 tests. Apply a SURGICAL edit of only the fix files instead. The `overlay-lock.json` is a full-project-context artifact (it spans universal-shared `runtime/schemas/policies` files that live OUTSIDE the overlay's project-files) — it can't be regenerated standalone; leave it (reconciles on the next real capture; the installed project's fixed gate relocks). See [[ci-gates-doc-drift]], [[agent-fleet-setup]].
