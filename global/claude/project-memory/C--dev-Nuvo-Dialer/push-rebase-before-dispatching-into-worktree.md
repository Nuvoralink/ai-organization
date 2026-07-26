---
name: push-rebase-before-dispatching-into-worktree
description: "After rebasing a branch in a worktree, force-push it BEFORE dispatching any agent into that worktree — else the agent's \"preserve the remote, don't force-push\" heuristic resets to the stale remote and silently discards the rebase."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: df04f33d-909b-4f44-877d-61cb96ab4ccc
  modified: 2026-07-21T10:13:14.030Z
---

When the orchestrator rebases a branch inside a worktree but does **not** push the rewritten history, and then dispatches a sub-agent into that same worktree, the agent can see `local HEAD (rebased) != origin (stale pre-rebase)`. A safety-minded implementer resolves that divergence by **resetting to the remote to avoid a force-push** (its "safe recovery, never force-push" heuristic), which **silently discards the orchestrator's unpushed rebase** and builds its work on the OLD base. The pushed result then fast-forwards from the stale remote — looking clean — while the rebase (and any new-main base it carried, e.g. a merged decision-log deferral) is gone.

**Why:** an unpushed local rebase is invisible to the remote; the agent trusts the remote as the source of truth and treats the local divergence as *its* problem to reconcile away.

**How to apply:** after any rebase in a worktree, **`git push --force-with-lease` immediately**, before dispatching any agent into that worktree. If a rebase must stay unpushed, do NOT dispatch an agent into that worktree until it's pushed. Verify recovery by checking the new-base commit is an ancestor of the pushed HEAD (`git merge-base --is-ancestor <new-base> origin/<branch>`), not by trusting the agent's "fast-forward, no force-push" report — that report is consistent with the clobber. (Hit 2026-07-21: rebased the B06-unwind branch onto new main, dispatched a doc-reconciliation agent into the worktree without pushing; the agent reset to the stale remote and rebuilt on the old integration base, dropping the rebase — recovered by re-rebasing + immediate force-push.) Relates to [[periodic-branch-sync]] and [[commit-before-adversarial-review]].
