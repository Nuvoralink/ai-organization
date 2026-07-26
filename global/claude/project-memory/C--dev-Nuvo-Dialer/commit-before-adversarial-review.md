---
name: commit-before-adversarial-review
description: Commit a slice BEFORE spawning the adversarial-reviewer (it has Bash + can git-checkout away uncommitted work); verify tree integrity after any tree-touching agent
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c10ba20a-59f3-4b8b-8b06-4a78a350947e
---

The `adversarial-reviewer` (and any sub-agent with the Bash tool) can **mutate or lose your UNCOMMITTED working tree**. On PR #152 (2026-07-01) it ran `git checkout -- WorkspaceLayout.tsx` to test a killer mutation, which discarded my uncommitted change; it self-restored via `git apply` from a captured diff and self-certified "byte-accurate." It happened to be correct, but a self-certified restore of the file you're about to commit is a lead, not proof.

**Why:** I reviewed BEFORE committing so findings could fold into one clean commit — but that left the work uncommitted and destructible by the reviewer's git ops. Had it been committed, `git checkout -- <file>` restores from HEAD (the commit) and loses nothing.

**How to apply:**
1. **Commit the slice to its worktree branch BEFORE spawning the adversarial-reviewer.** The commit is a safety net; the reviewer diffs a stable ref, and any finding becomes a fixup/follow-up commit — which the workflow already prefers over `--amend` anyway. (Only skip-and-review-uncommitted for a throwaway you don't mind losing.)
2. **After ANY agent that had Bash touch the tree, independently verify integrity** before the irreversible step — don't trust its restore claim: `git status --short` (expected files only, no residue), `git diff --numstat <file>` + grep the key added lines, and re-run `npm run verify`. That's "verify the critic" applied to a critic that edited your tree.

Ties to [[orchestrator-mode-setup]] and the loop-discipline "verify the critic before the irreversible step" rule.
