---
name: git-bash-git-show-pathconv
description: "In Git Bash on this box, `git show <rev>:<path>` mangles the colon/slashes → a swallowed error reads as false-empty output; disable MSYS path-conversion."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 56da5c2f-32ee-46ba-9b61-b4d683177c6a
---

Git Bash (MSYS2) on this machine converts `origin/main:.claude/agents/x.md` into `origin\main;.claude\agents\x.md` (`:`→`;`, `/`→`\`) for SOME `git show <rev>:<path>` invocations → `fatal: ambiguous argument …` on stderr, which a `2>&1 | grep` silently swallows as **zero matches** — reads as "the content isn't there" when it IS.

Bit me verifying a merge's union landed on `origin/main` (2026-07-14, PR #243): got a false "0 rows", nearly concluded the merge had dropped content; caught it only by separating stderr and reading the raw output (the merge was fine).

**Fix:** prefix with `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' git show <rev>:<path>`, or avoid the `rev:path` syntax entirely (temp worktree + the Read tool). The mangling is **intermittent** — a sibling `git show origin/main:docs/BUG_BACKLOG.md` escaped it the same session — so a green `git show rev:path` result is NOT proof it didn't mangle a different path. When trusting `git show rev:path` output, separate stderr (`2>err.txt`) or check the exit code, never just `2>&1 | grep`. Sibling of [[periodic-branch-sync]] / [[gh-pr-checks-watch-gotchas]].
