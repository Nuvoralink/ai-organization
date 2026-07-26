---
name: periodic-branch-sync
description: "Keep working branches synced with origin/main and commit promptly — don't let uncommitted work pile up"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0a043681-e84b-43ea-9779-37b703611198
---

Periodically — and before/after each meaningful chunk of work — `git fetch origin`, bring the working branch up to date with `origin/main` (rebase onto it), and **commit completed work promptly to the correct branch** instead of letting uncommitted changes accumulate.

**Why:** this repo is worked by multiple agents (Claude + Codex) across `git worktree`s, and Amin actively consolidates commits. Floating uncommitted changes (e.g. a stray `_design.css` edit mixed into another agent's feature WIP) and branches that silently drift behind `origin/main` create a painful pile to sort through and risk landing work on the wrong branch — which already happened once this project.

**How to apply:**
- Always confirm **which branch + which worktree** you're on before committing. Never `git checkout`/`switch` in a *shared* worktree — it moves everyone in that directory and disturbs their WIP. Use a dedicated isolated `git worktree` per branch instead (see [[design-system-locked]] / the worktree topology). `git -C "<path>"` operates a specific worktree without changing cwd.
- `git fetch origin` periodically; when `origin/main` has moved, rebase the working branch onto it to stay current; resolve small conflicts (e.g. `package.json` scripts) as they arise.
- Commit your own completed work to the right branch promptly and surface it; clean up your own stray changes from other worktrees once they're committed elsewhere. **Do NOT touch another agent's uncommitted WIP** — only your own changes.
- **Pushing is Amin's call** (he consolidates history) — keep work committed locally and offer to push/PR; don't push unprompted.
