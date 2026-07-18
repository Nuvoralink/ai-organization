# Goal Templates — Agent View and Saved Workflows

Status: live
Last verified: 2026-07-14
Authority: NFR-011 repo/build-doc integrity plus the six-part dispatch doctrine in
`docs/agent-prompts/orchestrator-handoff-context.md`.

Use these as concise goal/evaluator pairs after the issue form holds the full six-part brief. Run independent
sessions from Agent View with `claude agents`; give each editing session its own worktree. Ask Claude to enter
plan mode and then run the saved workflow named `orchestration-drift-audit` for a bounded
read-only-intent reconciliation before large handoffs or closure claims. Plan mode is the tool-permission
boundary; workflow prompt text alone is not enforcement. The workflow reports by contract.

Claude Design is the design authority. Any visible frontend change still requires an approved Claude Design
baseline before implementation; backend, control-plane, and read-only review lanes do not invent UI.

## Feature slice

**Goal:** Deliver `<user outcome>` end to end within `<issue/brief URL>` and `<worktree>`, preserving
`<authority IDs>`. Trace every upstream feeder and downstream consumer, implement only the approved scope,
prove negative states, and use the action-authority policy for branch, commit, push, PR, and conditional merge.
Stop before deploy, production mutation/configuration, migration, destructive/billed/external action, secrets,
or an unresolved product/design/material-architecture decision.

**Evaluator:** PASS only if the actual diff matches the allowlist, the named authority reaches every final
consumer, the exact checks show their own zero exit statuses, the killer mutation goes red, required rendered
evidence matches the approved Claude Design baseline, and not-reached surfaces are named. Otherwise FAIL with
file:line evidence and one next action.

## Bug and root-cause slice

**Goal:** Reproduce `<visible failure>`, climb the upstream-cause ladder to the earliest reliably-correctable
decision, fix the class rather than the phrase/example, sweep adjacent occurrences repo-wide, and stop before
external or irreversible action.

**Evaluator:** PASS only if before/after evidence proves the root cause, the fix removes or demotes the old
path, realistic positive and negative cases pass, and the named killer mutation recreates the failure. FAIL
symptom-only patches, parallel authorities, unverified greps, or tests that stay green against the regression.

## Sprint close

**Goal:** Reconcile the current closure scope from live product/decision docs, git, GitHub, locked surfaces,
and backlog; prove product, system, and drift-prevention DoD; re-triage open work; do not trust a named sprint
status or start unscheduled work.

**Evaluator:** PASS only when every included requirement/decision/locked element maps to shipped evidence or
a cited durable deferral, local proof matches the risk, auditor findings are resolved or honestly routed, and
all not-reached provider/deployed/rendered surfaces are explicit. Merge is permitted only when every
conditional-merge predicate in `.ai-organization/policies/action-authority.v1.json` is proven; release/deploy remains
human-required.

## Review and verification

**Goal:** Read-only refute `<branch/PR/done claim>` against actual diff, callers/feeders, authorities, tests,
GitHub state, and raw artifacts. Make no tree, git-state, issue, PR, production, or external-message mutation.

**Evaluator:** PASS only if the reviewed scope is enumerated, each finding cites exact evidence, green claims
are independently re-derived, killer mutations match what tests can catch, and incomplete/conflicting evidence
is reported under not reached. `clean` is forbidden for any surface not inspected.

## Operating the control plane

1. Put the full six-part brief in an Agent slice issue; link it from the goal.
2. Launch or inspect isolated sessions with `claude agents`.
3. For drift reconciliation, tell Claude: `Enter plan mode, then run the saved workflow named orchestration-drift-audit and return its raw evidence.`
4. Attach evidence to the PR template. Leave every human irreversible gate unchecked for the human.
