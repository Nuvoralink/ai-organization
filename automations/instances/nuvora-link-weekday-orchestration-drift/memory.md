# 2026-08-03 baseline run

Run time: 2026-08-03T09:40:31+04:00

- Read-only baseline refreshed both origins. Final heads: Nuvora Link `6bcf09389b648da5c057c7167975262a941fe0fc`; AI Organization `482d37fceb9158b9cf033dffbb68e7ad3dcb668b`.
- Canonical PR #34 merged mid-run and changed the Nuvora Link performance-auditor projection. Committed project `origin/main` remains one managed blob behind. `C:\tmp\nuvora-link-neon-cost` has that file modified but uncommitted; its local overlay-lock gate fails until propagation is completed.
- Gate baseline: rules/context/control/fleet/workspace/docs passed; changed-only test-intent passed with `checked=0`, but `--all` failed on 20 test files and 111 missing intent fields.
- Automation identity drift: project overlay declares `nuvora-link-daily-orchestration-drift`; installed/canonical instance is `nuvora-link-weekday-orchestration-drift`.
- Worktree baseline: Nuvora 17 total (10 integrated/patch-equivalent, 7 unique without open PR, 1 dirty); AI Organization 18 total (11 integrated/patch-equivalent, 6 unique without open PR, PR #28 open, all clean).
- GitHub baseline: Nuvora has zero open PRs/issues and no project board. AI Organization PR #28 is 3 ahead/21 behind current main with no formal reviews/checks; Project #8 contains stale issue #1 that omits Nuvora Link and leaves old checklist/status text.
- Both repos have no GitHub Actions workflows. Branch-protection/ruleset APIs return plan-related HTTP 403; Nuvora policy explicitly defers branch protection.

# 2026-08-05 run

Run time: 2026-08-05T11:28:09.7701355+04:00

- Read-only audit used live `git ls-remote`/GitHub queries without fetch or repository mutation. Nuvora Link main is clean and matches live origin at `fc7c7f915515079f06ac331f131f80ff8ba1d57f`; AI Organization main is clean and matches live origin at `b9e05ec96dc88220b6c036f03192451098a50498`.
- Both repos now have one clean worktree. Nuvora retains 8 local-only topic branches (6 with unique patches, 2 patch-equivalent); AI Organization retains 6 (5 unique, 1 patch-equivalent). All named topic refs are absent from origin and there are no open PRs. Nuvora's local `develop` is 67 commits behind `origin/develop`; live `origin/develop` is one commit behind `main`.
- Nuvora and canonical overlay parity are green: project aggregate gates exit 0, local lock reports 41 managed files/sections, canonical overlay check passes, tracked scope verifies 1,313 classifications, and the malformed PostToolUse mutation is blocked with exit 2.
- The aggregate remains false-green for legacy test intent: default changed mode reports `checked=0`, while `--all` exits 1 on 20 test files and 111 missing intent fields. Canonical local branch `codex/test-intent-complete-executable-catalog` contains one unique unpushed patch but is 51 commits behind main.
- Automation identity drift persists: canonical and installed specs declare `nuvora-link-daily-orchestration-drift`, while the active automation ID is `nuvora-link-weekday-orchestration-drift`.
- GitHub has no open Nuvora PRs/issues and no open canonical PRs; canonical issue #1 / Project #8 remains stale, omits Nuvora Link, and retains unchecked bootstrap status. Since the prior run, merged Nuvora PRs #49/#51 have no formal review objects and only Vercel rollups; canonical merged PRs have no formal reviews or checks. Both repos still lack GitHub Actions workflows; Nuvora also lacks CODEOWNERS. Ruleset/protection APIs remain HTTP 403 and branch protection remains explicitly deferred.
- Active product authority is coherent: Nuvora Link remains a single-company internal system with organization scope as a security/import boundary; built-in telephony remains retired. The old complete-system-design is explicitly classified historical, not current authority.
