---
name: prettier-blast-radius-lesson
description: "never run a blanket `prettier --write` on a whole file in a repo without first confirming the repo's own house style/gate — caused a bad merge-conflict resolution in Nuvora-CoachAi"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 49a07808-39a5-4fe5-8fc7-26cf526a2319
---

Never run `prettier --write` (or any blanket auto-formatter) across a whole file/repo without first checking (a) whether the project even HAS a prettier CI gate (`grep '"format' package.json`; check what `gates:all`/`verify` actually runs) and (b) what the project's actual house style is by reading a neighboring untouched file — don't trust a bare CLI invocation's default config resolution.

**Why:** In Nuvora-CoachAi (2026-07-03), after fixing a real auth bug (PR #127, later closed and redone as #137), I ran `npx prettier --write` on the touched files "to be safe" — a habit carried over from the dialer repo, which DOES have a prettier gate. CoachAI has none (`grep '"format' package.json` → nothing; `gates:all` never calls prettier). The bare `npx prettier` command picked up some default/different config and flipped the WHOLE api.ts file from single→double quotes, inflating a ~5-line logical fix into a 2300+ line diff. That noise then collided with an unrelated concurrent commit on `origin/main` (`chore(settings): delete notification-settings API`) during a routine rebase, producing a real merge conflict. I resolved it wrong — kept the reformatted-but-dead code instead of accepting the deletion — which reintroduced an undefined type and broke `tsc`. Caught only because I ran `tsc --noEmit` after the rebase instead of trusting the merge "succeeded."

**How to apply:** Before formatting anything: (1) check for a real format-check gate in `package.json`/CI config — if none exists, the project's committed style may not even be prettier-clean, so `prettier --check` warnings on untouched neighboring files are NOT a signal to act on; (2) read a nearby untouched file to learn the real quote/wrap convention by eye; (3) hand-edit to match that convention rather than running a formatter across a file you don't fully own; (4) after ANY rebase/merge, always re-run the real typecheck/test/lint — a clean `git rebase` exit is not proof the result compiles (this is the loop-discipline rule's "verify the critic" principle applied to git itself, not just to review agents). See also [commit-before-adversarial-review](commit-before-adversarial-review.md) for the sibling lesson about not trusting a tool's self-reported success on a tree-mutating operation.
