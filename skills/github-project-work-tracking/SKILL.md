---
name: github-project-work-tracking
description: Use when feature work, a large slice, cross-session implementation, audit remediation, or a GitHub Projects board needs progress tracking. Trigger when the user asks to track Todo/In Progress/Done, update a GitHub Project, decide whether work is done, or make future agents keep project progress visible without letting the board replace the plan.
---

# GitHub Project Work Tracking

Use this skill to keep work visible in GitHub Projects. The project board is a tracking ledger, not the planning brain. Product intent, scope, definitions of done, tests, and pressure-test results still need to exist in the plan, issue, PR, docs, or conversation.

## First Move

For new features, big project slices, cross-session work, architecture passes, or audit-remediation work:

1. Check whether the repo or organization already has a relevant GitHub Project.
2. Use the existing project when one exists. Do not create a new project for every bug, small edit, or one-off task.
3. Prefer GitHub Issues or PRs as project items. Use draft project items only when issue creation would add noise.
4. If no durable tracking project exists and the work is big enough to outlive the current turn, create or propose one with clear tracking fields.
5. If GitHub tools, auth, or network access are unavailable, keep a local checklist and report that GitHub sync is pending. Do not block necessary implementation only because tracking cannot be synced.

## Tracking Fields

Use the repo's existing fields when possible. If creating a project or project template, include:

- Status: `Todo`, `In Progress`, `Blocked`, `Review/Verification`, `Done`.
- Product intent: one sentence describing what should become true.
- Scope boundary: what is included and explicitly not included.
- Definition of done: phase-level proof requirements.
- Tests/proofs: checkboxes or linked CI, smoke, review, or manual verification.
- Links: issue, PR, commits, docs, runbooks, dashboards, or relevant artifacts.
- Blocker: exact missing decision, credential, dependency, deploy, provider, or data condition when blocked.

Do not put secrets, credentials, raw transcripts, private customer data, raw prompts, provider payloads, or sensitive debug artifacts in project items. Link to redacted artifacts when needed.

## Bulk Reconciliation Integrity

Before proposing or applying a multi-item reconciliation:

1. Read the complete live inventory and prove it is not truncated when the API exposes a declared total.
2. Key each row by its durable domain key and retain both the Project item ID and content ID. Titles are display data, not identity.
3. Assert a bijection across durable keys, Project item IDs, and content IDs: each occurs exactly once in the plan. Against a fresh complete live read, verify both `liveByKey[key].itemId == planned.itemId` and `liveByKey[key].contentId == planned.contentId`, plus inverse coverage of every expected live item. Stop and issue zero writes on any missing, duplicate, or mismatched identity.
4. Emit a deterministic sorted plan and validate its full expected-key coverage separately from field-value validation.
5. Apply bounded batches. Record each successful item ID so a partial failure can resume without replaying unknown writes.
6. Re-read the complete live inventory after every batch and compare the persisted fields and identities with the plan. A successful command status is not proof of the saved result.

Fail-state: two durable keys target the same Project item ID, so one real item stays stale while the plan falsely claims complete coverage.

Regression mutation: map two distinct durable keys to one Project item ID; validation must fail before mutation and the live reread must still report the untouched expected item.

Counterexample: one correctly keyed Project item may receive several field updates in the same batch; repeated updates to that one identity are valid when the plan still contains one reconciliation row for it.

## Status Meanings

- `Todo`: accepted or proposed work that has not started.
- `In Progress`: analysis, design, implementation, docs, or fixes are actively underway.
- `Blocked`: progress needs a user decision, credential, unavailable service, failed deploy, missing data, or external dependency.
- `Review/Verification`: a first implementation or plan exists, but pressure testing, implementation review, tests, smokes, deployment proof, or user acceptance is not complete.
- `Done`: the work satisfied its definition of done, the relevant proof passed, material pressure-test gaps are closed, and the user either accepted it, moved on to the next task after verification, or the task had deterministic done criteria that were fully met.

If the project already uses different names, map these meanings to the closest columns instead of forcing a rename.

## Progress Decision Matrix

| Situation | Project Status | Required Action |
| --- | --- | --- |
| Work is proposed but not accepted or started | `Todo` | Record intent and open questions. Do not imply execution started. |
| User accepts the slice or the agent begins implementation for an accepted task | `In Progress` | Link the plan or conversation summary and name the current phase. |
| A plan is drafted but still being pressure-tested | `Review/Verification` | Track review gaps. Do not treat the plan as ready until gaps are resolved or explicitly accepted. |
| First implementation pass is complete but proof is still pending | `Review/Verification` | Run or document tests, smokes, pressure tests, and implementation review before Done. |
| Pressure test, review, smoke, or user pushback finds material gaps | `In Progress` | Reopen implementation work, list the gaps, and keep fixing. |
| A dependency or decision blocks forward progress | `Blocked` | Name the blocker, owner, and next unblock action. |
| Blocker clears | Previous active state | Move back to `In Progress` or `Review/Verification` based on whether code changes or proof remain. |
| All phase definitions of done pass and no material gaps remain | `Review/Verification` until accepted | Ask the user whether to mark Done unless acceptance is already clear. |
| User confirms it is done, accepts the result, or starts a new task after verified completion | `Done` | Mark Done and leave a concise proof summary. |
| Task has exact deterministic done criteria and all proof passed in the same turn | `Done` | Mark Done only if there are no pending pressure-test, deployment, review, or acceptance risks. |

## Done Gate

Never mark work `Done` just because files were edited, code compiled, a PR opened, or the first implementation pass finished.

Before Done, verify:

- The original product or system intent is satisfied.
- Every phase definition of done is met or explicitly descoped by the user.
- Required tests, smokes, review, deployment checks, or manual proofs passed, or skipped checks are explicitly accepted.
- Pressure-test findings are fixed, descoped, or documented as follow-up work with user agreement.
- Docs, rules, runbooks, migrations, reprocess paths, or downstream consumers are updated when they are part of the work.
- The final user-visible or system-visible behavior was verified when the task depends on final output.

Ask the user before marking Done when:

- The user is still actively pressure-testing.
- Any material risk, skipped verification, failed test, blocked dependency, deploy/rerun requirement, or unclear acceptance remains.
- The agent is unsure whether the result should be considered done or merely ready for review.

## Checkpoints

Update tracking at natural state changes:

- when the improved plan is accepted or the agent starts the accepted work,
- when implementation starts,
- after each pressure-test or implementation-review result,
- after tests, smokes, deploy checks, or proofs pass or fail,
- when blocked or unblocked,
- when the user accepts completion or moves to the next task after verified completion.

Keep updates concise: project action, item/status changed, remaining work, next checkpoint, and proof status.
