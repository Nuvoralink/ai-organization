---
name: gh-pr-merge-from-worktree
description: gh pr merge --delete-branch fails from inside a feature worktree; run merges from the main checkout
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-07-30T11:54:59.586Z
---

`gh pr merge <n> --squash --delete-branch` run from INSIDE a feature worktree fails with
`fatal: 'main' is already used by worktree at '<main checkout>'` — because `--delete-branch` does a
local `git checkout main` to delete the merged branch, and main is checked out in the main worktree.

**Key detail:** the merge API call SUCCEEDS before the local git step fails, so the PR IS merged even
though the command reports exit 1. Verify with `gh pr view <n> --json state` (will show MERGED), then
clean up manually — the remote branch is already deleted by GitHub-on-merge; only the local worktree +
branch remain.

**How to apply:** run `gh pr merge` from the **main checkout dir** (`${PROJECT:auxara-dialer}`), not the
feature worktree — then `--delete-branch` works. Or drop `--delete-branch` and remove the worktree +
local branch yourself via `npm run worktree:remove` + `git branch -D`. Either way, always confirm the
merge landed via `gh pr view` before assuming the exit-1 meant failure. [[commit-before-adversarial-review]]
