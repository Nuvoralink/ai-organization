# Auxara control-plane reconciliation merged in PR #27

This note supersedes any handoff that describes `5916011f025bbe0ac6267a64ab7482c0c56756f6`
or `codex/auth-skill-live-boundary` as local-only or awaiting merge.

- Canonical repository: `${PROJECT:control-plane|backslash}` / `Nuvoralink/ai-organization`.
- PR #27 merged on 2026-08-01.
- Canonical `origin/main` after merge: `098a76c1ae26e490018ce68edb7890f81ab44d13`.
- The merge replaced stale automation work-state prose, repaired the tracked-scope validator so its
  inventory includes the managed tracked and untracked boundary it claims, updated the canonical
  Auxara authentication skill and installed overlay for global identity plus exact membership
  authority, and tightened shared agent/reference templates and tests.
- Repository release proof found no GitHub workflows, repository webhooks, product deploy target, or
  publish path. PR #27 had no required/status checks because GitHub-hosted CI is intentionally absent;
  acceptance used the complete local control-plane suite and direct artifact inspection.
- Do not reopen the retired `${PROJECT:control-plane|backslash} Control Plane` checkout or reapply the old
  local-only handoff. Future Claude/Codex work should fetch and begin from canonical commit
  `098a76c1ae26e490018ce68edb7890f81ab44d13` or its current descendant.

