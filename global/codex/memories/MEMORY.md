# Task Group: Auxara Dialer backend RBAC and phone-number authority
scope: read-only or implementation-resumption work on RBAC, roles, team/tenant scope, number purchasing/lifecycle, 10DLC admission, and the paused backend closure checkpoint.
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse the authority model and failure shields for this repository, but treat the paused branch/checkpoint and all static conclusions as historical until the current checkout, migrations, tests, and provider behavior are re-verified.

## Task 1: RBAC and phone-number authority investigation, partial with durable pause

### rollout_summary_files

- rollout_summaries/2026-08-14T09-57-26-rX9T-auxara_rbac_number_authority_investigation_paused.md (cwd=\\?\${PROJECT:auxara-dialer|backslash}, rollout_path=\\?\${HOME|backslash}\.codex\sessions\2026\08\14\rollout-2026-08-14T13-57-26-019fffb4-7d33-7f82-ae8d-66743fcf6cf9.jsonl, updated_at=2026-08-14T19:11:14+00:00, thread_id=019fffb4-7d33-7f82-ae8d-66743fcf6cf9, backend substantially implemented; closure paused)

### keywords

- Auxara Dialer, RBAC, role_assignments, user_permissions, team scope, tenant scope, numbers.buy, numbers.manage, 10DLC, NumberProviderOperation.actor, gate:tenant-membership-authority, migration 0092, codex/rbac-number-authority, rbac-number-backend-pause-checkpoint-2026-08-14.md

## User preferences

- when requesting an RBAC/authority implementation picture, the user asked for “not built at all, partial built, backend ready frontend owed, fully built” -> report with those categories and explicitly separate backend authority from frontend proof [Task 1]
- when the user says “once the agents are done pause work and save the progress durably until i start you again” -> stop implementation after the agents finish, preserve exact state and a restart sequence in a durable checkpoint, and wait for explicit resume; do not commit, push, or continue autonomously [Task 1]
- for a broad Auxara repository investigation, the user requested orchestrator loading -> use the single-PM orchestrator with specialist read-only audits [Task 1]

## Reusable knowledge

- Effective authority is capability key + scope, not role-name checks: `role_assignments` binds role/scope, `team_id = null` is tenant-wide, a concrete team ID is team jurisdiction, and `user_permissions` holds tenant-scoped one-off grants. Server authorization is authoritative; frontend `can()` is UX only; Postgres RLS is the backstop. [Task 1]
- Static evidence found Owner-only `numbers.buy`/search, with team- and tenant-scoped assignment/lifecycle checks. Classify this as substantially built backend, not closed/fully verified; frontend remains partly owed. [Task 1]
- Authorities to trace first: `backend/src/lib/authorize.ts`, `sessionAuth.ts`, `routes/roles.ts`, `services/customRoles.ts`, `roleAuthorization.ts`, `routes/numbers.ts`, `numberAuthorization.ts`, `numberLifecycle.ts`, `numberProviderOperations.ts`, `numberProviderOperationReconciliation.ts`, `shared/src/taxonomy/permissions.ts`, `rolePermissions.ts`, and migrations `0091_rbac_number_authority`/`0092_number_provider_operation_authority`. [Task 1]
- At pause, focused integration, formatting, typechecks, and `gate:test-intent` passed; full `npm run verify` failed because `NumberProviderOperation.actor` was omitted from the membership-bound actor relation inventory, which expected 74 but found 75. [Task 1]
- Restart from `${PROJECT:auxara-dialer|backslash}-worktrees\rbac-number-authority\docs\app-plan\implementation\rbac-number-backend-pause-checkpoint-2026-08-14.md` on `codex/rbac-number-authority`; the checkpoint records branch/head, uncommitted state, and resume sequence. [Task 1]

## Failures and how to do differently

- Symptom: architecture/status docs, green unit tests, or mocked provider-operation seams suggest closure -> cause: they do not prove runtime/DB correctness -> validate SQL constraints, provider admission, and full verification; static index-name checks alone do not prove uniqueness. [Task 1]
- Symptom: a custom role is safely broadened in its direct edit path but unsafe placements remain -> cause: not all existing assignments/open invites are enumerated and locked -> validate actor coverage for current/proposed bundles at every placement, revalidate at invite acceptance, and account for historical invite rows that pin custom roles. [Task 1]
- Symptom: automatic 10DLC attachment passes tenant scope plus a non-null team ID -> cause: its authorization input conflicts with migration 0092 -> use discriminated inputs that mirror SQL CHECK constraints and keep the source team in `sourceAssignedPodId`. [Task 1]
- Symptom: SMS release/routing appears admitted without sender evidence -> cause: brand-only gating, null campaign IDs treated as confirmed, and no shared release/inbound fence -> require sender-bound matching campaign confirmation and provider evidence before terminal release. [Task 1]
- Symptom: number-health/reconciliation degrades at scale -> cause: provider I/O inside an unbounded transaction, a concurrency-one shared worker, missing due-work/cursor indexes, payload fanout, and unevicted provider caches -> move I/O out of critical transactions and review worker/index/cache bounds before closure. [Task 1]
- Before coding autonomous 10DLC behavior, custom-role archive/history semantics, or Manager team invites, reconcile conflicting authority documentation; the advertised Manager `users.invite:team` capability was not reachable through tenant-only invite routes. [Task 1]

# Task Group: Codex CLI installation on Windows
scope: answering or validating practical Codex CLI setup in Windows PowerShell; this evidence is guidance only, not a completed local installation.
applies_to: cwd=${HOME|backslash}\Documents\Codex\2026-08-03\ins; reuse_rule=reuse the npm/verification sequence for Windows setup, but refresh official Codex documentation before making current product claims.

## Task 1: Install Codex CLI on Windows, outcome uncertain

### rollout_summary_files

- rollout_summaries/2026-08-03T06-00-37-fBeH-codex_cli_installation_windows_npm.md (cwd=\\?\${HOME|backslash}\Documents\Codex\2026-08-03\ins, rollout_path=${HOME|backslash}\.codex\archived_sessions\rollout-2026-08-03T10-00-37-019fc635-b848-7732-a39b-50518e053dbb.jsonl, updated_at=2026-08-03T06:01:58+00:00, thread_id=019fc635-b848-7732-a39b-50518e053dbb, guidance researched; installation not run)

### keywords

- Codex CLI, Windows, PowerShell, npm, @openai/codex, codex --version, fetch-codex-manual.mjs, Node.js LTS

## User preferences

- when asking “how do i install codex cli?” -> lead with platform-specific commands and only the necessary prerequisite/setup steps [Task 1]

## Reusable knowledge

- For current Codex product/setup questions, refresh the manual first with `node ${HOME|backslash}\.codex\skills\.system\openai-docs\scripts\fetch-codex-manual.mjs`; it returns cached manual and outline paths. [Task 1]
- Windows setup guidance used here: install current Node.js LTS, run `npm install --global @openai/codex`, verify with `codex --version`, then launch `codex` from the project directory. Update with `npm install --global @openai/codex@latest`. First launch offers an available sign-in method such as “Sign in with ChatGPT.” [Task 1]

## Failures and how to do differently

- Symptom: an answer claims Codex is installed -> cause: guidance was not run in the user environment -> verify `codex --version` and that npm's global bin directory is on `PATH` before claiming success. [Task 1]
- Symptom: Windows evidence is weaker than expected on the fetched CLI page -> cause: the extracted page exposed the macOS/Linux shell installer while npm guidance came from the manual's CI examples -> state that boundary and refresh primary documentation. [Task 1]

# Task Group: Auxara Dialer Sprint 1.3 backend authority and recovery
scope: Sprint 1.3 shared-list/team-run, teleprompter/battlecard authority, AI disposition grounding, and non-mock-gated backend hardening.
applies_to: cwd=${WORKSPACE:dev|backslash}\NuvoDialer-s13-config-authority and Auxara Dialer Sprint 1.3; reuse_rule=re-check current branch, migrations, routes, and deployment state; the notes record historical implementation/verification facts, not current production status. [ad-hoc note]

## Task 1: Config authority, list ownership, and placeholder retirement

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-133905-auxara-s13-config-authority.md (cwd=${WORKSPACE:dev|backslash}\NuvoDialer-s13-config-authority, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06-auxara-placeholder-authority-retirement.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06T19-29-20-auxara-s13-list-ai-remediation.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06-auxara-s13-ai-disposition-and-next-slice.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06-auxara-s13-doc-cleanup-config-authority-plan.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)

### keywords

- teleprompter_configs.list_id, 0029_config_authority_routes, teleprompters.manage, battlecards.manage, PATCH /api/lists/:id/owner, assigned_user_id, PLACEHOLDER_SCRIPT_SECTIONS, DIAL_RUN_REQUIRED

## Task 2: AI disposition and DLR-016 recovery hardening

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-08T08-15-00-s13-non-mock-closure.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-08, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-08T09-41-17-s13-recovery-hardening.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-08, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06T19-38-58-auxara-s13-remediation.md (cwd=Auxara Dialer, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)

### keywords

- enqueueDispositionDraftForCall, usable transcript text, DLR-016, appendCallEvent, team_power, indeterminate, mediaSessionId, claim-next, gate:tx-rollback

## Reusable knowledge

- `teleprompter_configs.list_id` must cascade on hard-deleted never-dialed lists; `ON DELETE SET NULL` could silently promote a list override into tenant-default scope and collide with the active-default unique key. Booker teleprompter reads need concrete list authority (`canDialList`/dial-run grant), not a team-only check. [Task 1] [ad-hoc note]
- List ownership is exactly one target: team/pod or `assigned_user_id`; `podId:null` and legacy null/null rows are never personal ownership. Reassignment must validate source and target object scope, preserve history, and drain/stop active shared-run claims. [Task 1] [ad-hoc note]
- Once backend/shared authority exists for a live surface, retire its frontend placeholder in the same source-to-screen slice and protect against reintroduction with `gate:authority-placeholders`. Workflow review must verify create/assign, discover, act, recover, and later change paths—not just API/schema existence. [Task 1] [ad-hoc note]
- Sprint planning distinction: the AI disposition slice was recorded as merged/deployed, while DLR-016 shared-run frontend remained mock-gated and real ASR/auto-advance stayed later-sprint scope. If resuming a historical slice, separate source-checked route/model facts from current PR/deployment state. [Task 1] [ad-hoc note]
- AI disposition requires usable transcript text before any provider call; call events/webhook `ENDED` are lifecycle evidence, not semantic grounding. Client-submitted `source:'system'` is downgraded to `agent`; deterministic writers alone may use `system`. [Task 2] [ad-hoc note]
- DLR-016 recovery may re-enqueue notify-only wakes and repair stale claims, but must never reserve, dial, or create replacement dispatches. Use `appendCallEvent` as the single append/dedupe/collision-repair helper; `command_id` is duplicate evidence, not status-lookup authority. [Task 2] [ad-hoc note]

## Failures and how to do differently

- Symptom: a personal list can dial but cannot read its script -> cause: teleprompter access used a team-only check -> use the same concrete list-access authority as dialing. [Task 1] [ad-hoc note]
- Symptom: corrupt persisted battlecard JSON is returned as valid -> cause: mapping skipped persisted-data validation -> revalidate and fail closed with the safe `INTERNAL_ERROR` envelope. [Task 1] [ad-hoc note]
- Symptom: disposition AI is grounded from an answered/event timeline -> cause: lifecycle evidence was treated as semantic evidence -> produce no draft/no metered call without transcript text; leave manual wrap-up available. [Task 2] [ad-hoc note]
- Symptom: flaky Redis assertions in the parallel full suite -> cause: global reset deletes keys outside the test process -> observe middleware-generated keys in-process; for wake queues filter deterministic job IDs rather than shared `getDelayedCount()`. [Task 2] [ad-hoc note]

# Task Group: CoachAI semantic debugging and proof ladder
scope: recurring CoachAI coaching-quality, data-integrity, prompt/AI decision, rerun-validation, and backlog-cleanup investigations.
applies_to: cwd=${PROJECT:coachai|backslash}; reuse_rule=reuse as an investigation/proof sequence, but verify current artifact paths and service behavior before a live rerun. [ad-hoc note]

## Task 1: Run the reusable spider pass for semantic and coaching defects

### rollout_summary_files

- extensions/ad_hoc/notes/2026-05-14T12-51-12-coachai-spider-pass.md (cwd=${PROJECT:coachai|backslash}, rollout_path=extension note, updated_at=2026-05-14T12:51:12, source=ad-hoc-note)

### keywords

- spider pass, source-authority contract, decision matrix, DTO mapping, rerun path, coaching quality, data integrity

## Task 2: Use the prompt-testing ladder before an authoritative rerun

### rollout_summary_files

- extensions/ad_hoc/notes/2026-05-14T12-56-12-prompt-testing-ladder.md (cwd=${PROJECT:coachai|backslash}, rollout_path=extension note, updated_at=2026-05-14T12:56:12, source=ad-hoc-note)

### keywords

- static prompt-contract regression, local replay, persisted artifacts, subagent qualitative eval, real app-model rerun, cheapest useful proof

## User preferences

- for CoachAI bugs, coaching-quality audits, data-integrity concerns, prompt/AI decision problems, rerun validation, and backlog cleanup, the user explicitly asked to make the “spider pass” reusable -> trace the earliest wrong decision, search sibling layers, fix upstream, update docs/rules/blast-radius maps, and verify the final user-visible output [Task 1] [ad-hoc note]
- for semantic/prompt work, the user confirmed: use the “cheapest useful proof first” and escalate only when needed; subagent evaluation is rehearsal, not final production proof [Task 2] [ad-hoc note]

## Reusable knowledge

- AI makes the sales/coaching meaning judgment from grounded evidence; deterministic code validates grounding, policy, schema, provenance, persistence, and display integrity. Trace source evidence, prompt/decision, validator/repair, persistence, ranking, DTO mapping, UI, tests, docs, and rerun path before calling a defect local. [Task 1] [ad-hoc note]
- Proof order: static prompt-contract regression; local replay with persisted artifacts; subagent qualitative evaluation; then a real app-model rerun only when final proof depends on production model/routing/structured-output/retry/runtime behavior. Bundle multiple fixes before that authoritative rerun. [Task 2] [ad-hoc note]
- Related skill: skills/coachai-semantic-proof/SKILL.md. [Task 1]

## Failures and how to do differently

- Symptom: a visible bug is fixed yet equivalent defects recur -> cause: stopping at the first symptom -> complete the spider pass and promote the prevention into rules/tests/docs. [Task 1] [ad-hoc note]
- Symptom: convincing subagent output is reported as live success -> cause: rehearsal was confused with authoritative generation -> use it to improve the contract, then rerun only when runtime proof is necessary. [Task 2] [ad-hoc note]

# Task Group: Auxara Dialer orchestration and frontend mock threshold
scope: how to run an Auxara Dialer session in orchestrator posture, decide direct micro-fixes, and gate frontend design work.
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse as the user's operating preference for similar Auxara work; current implementation/PR status in source notes is historical. [ad-hoc note]

## Task 1: Orchestrate meaningful work and announce direct micro-fixes

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-153028-orchestrator-microfix-rule.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06-153005-orchestrator-microfix-rule.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)

### keywords

- orchestrator mode, subagents, auditors, micro-fix, non-visual, low-risk, announce before editing

## Task 2: Gate frontend work by approved foundation and visual judgment

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-frontend-mockup-threshold-rule.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=extension note, updated_at=2026-07-06, source=ad-hoc-note)

### keywords

- frontend mockup approval, approved foundation mock, existing primitive, human visual judgment, full page design

## User preferences

- when the session is the orchestrator -> stay in orchestrator posture by default: audit, scope, dispatch, verify, and merge/release through the agent fleet; the user gave standing permission to spawn subagents, auditors, and tooling when useful [Task 1] [ad-hoc note]
- if a fix is genuinely small, low-risk, non-visual, and fast -> the orchestrator may do it personally, but must say so explicitly before editing; dispatch or pause larger, unclear, frontend-visible, or design-judgment work [Task 1] [ad-hoc note]
- frontend work may proceed without fresh mock approval only when an approved/built foundation and existing primitive make it a small addition; a full page, multiple placements, new composition, or human visual judgment makes mock approval blocking [Task 2] [ad-hoc note]

## Reusable knowledge

- The extension records historical Sprint 1.3 implementation details (including config authority, AI disposition, DLR-016, docs/PR status, and verification); treat them as context and re-check checkout/live state rather than as present-tense deployment proof. [Task 1] [ad-hoc note]

## Failures and how to do differently

- Symptom: the root session silently becomes an implementer during orchestration -> cause: no explicit micro-fix decision -> announce the narrow direct implementation first or dispatch the work. [Task 1] [ad-hoc note]
- Symptom: visible UI work is coded without design direction -> cause: the change exceeded the small-existing-primitive exception -> stop for mock approval before implementation. [Task 2] [ad-hoc note]
