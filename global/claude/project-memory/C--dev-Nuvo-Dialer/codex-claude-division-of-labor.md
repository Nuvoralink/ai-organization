---
name: codex-claude-division-of-labor
description: "Don't route frontend/UI slices to Codex — keep visual work on Claude; Codex is for backend/non-visual implementer slices."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8537cc0c-e899-463f-8b96-5587d543c945
---

When delegating implementer work as orchestrator, **never run a frontend/UI slice through Codex.** Keep all visual/UI/design-sensitive work on Claude (a `sprint-implementer` agent or a Claude designer). Codex is for **backend / non-visual** implementer slices (routes, services, workers, migrations, contracts, tests).

**Why:** frontend is the mockup-first, locked-surface, design-system-craft work where taste and pixel-level adherence to the approved mocks matter — Amin trusts Claude for that and explicitly rejected running the number-pool/number-health React slice through Codex (2026-06-12). Codex was enabled that day ("usage reset") for parallel *backend* throughput, not UI.

**How to apply:** Codex invocation is `codex exec --cd <worktree> -o <outfile> "<brief>"` (CLI 0.130.0, model `gpt-5.5`, `model_reasoning_effort = xhigh`, `sandbox = "elevated"` in `~/.codex/config.toml` — elevated permits write + network, so Codex can run npm/git itself). Route backend slices there for parallelism; route every frontend slice to a Claude agent. See [[orchestrator-mode-setup]] and [[user-profile-and-operating-mode]].

**Codex makes its OWN worktree/branch — don't look for its work in the main checkout or a worktree you set up (Amin flagged 2026-07-13).** When Codex runs (interactive or `codex exec`), it creates + COMMITS to its own git worktree + branch, not the one the orchestrator prepared and not the main checkout. So after a Codex run, find its work via `git worktree list` + `git branch` — **a clean `git status` in the main checkout is NOT evidence Codex's work is missing.** (2026-07-13: a WeatherAPI backend Codex built showed clean status + unmodified `phone.ts` in the main checkout; the whole slice was committed on `feat/weather-weatherapi` in a Codex-made `.claude/worktrees/weather-backend` worktree. Verifying via `git worktree list` found it before I wrongly reported it lost.) Practical consequence: verify/typecheck/tests must run IN Codex's worktree (which may resolve `@auxara/shared` to its own `shared/src` — check `require.resolve`), and the orchestrator opens the PR from Codex's branch.
