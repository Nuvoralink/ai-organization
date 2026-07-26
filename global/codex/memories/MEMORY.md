# Task Group: Nuvora Link operational follow-ups, production migration, and clean workspace builds
scope: deploying agent-entered operational-only appointments/callbacks without KPI attribution, applying their Prisma migration safely, and preventing Railway clean-build dependency omissions
applies_to: cwd=${PROJECT:nuvora-link|backslash}; reuse_rule=reuse for this monorepo while its Prisma, Railway, and workspace-package contracts remain current; re-check live deployment and database state before asserting production completion

## Task 1: Operational-only agent follow-ups and production migration, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-25T08-32-32-Cu7N-nuvora_link_operational_followups_worker_build_migration.md (cwd=\\?\${PROJECT:nuvora-link|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\25\rollout-2026-07-25T12-32-32-019f9867-915c-7e70-a78c-858b589edb6b.jsonl, updated_at=2026-07-25T15:04:54+00:00, thread_id=019f9867-915c-7e70-a78c-858b589edb6b, production migration and schema proof passed)

### keywords

- AppointmentEntryOrigin, MeasurementScope, AgentFollowUpReceipt, 20260725120000_add_agent_operational_follow_ups, DIRECT_DATABASE_URL, Neon direct endpoint, KPI-exempt, Telegram

## Task 2: Railway Worker clean-build repair, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-25T08-32-32-Cu7N-nuvora_link_operational_followups_worker_build_migration.md (cwd=\\?\${PROJECT:nuvora-link|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\25\rollout-2026-07-25T12-32-32-019f9867-915c-7e70-a78c-858b589edb6b.jsonl, updated_at=2026-07-25T15:04:54+00:00, thread_id=019f9867-915c-7e70-a78c-858b589edb6b, clean-install build contract repaired and deployed)

### keywords

- TS2307, @nuvora-link/contracts, apps/worker/src/main.ts, prebuild, pretypecheck, check:workspace-build-contracts, test:workspace-build-contracts, stale packages/contracts/dist

## User preferences

- when agent-entered appointments needed normal follow-up behavior but “no KPI” and no effect on “anyones show ratio” -> make operational-versus-tracked measurement a persisted contract consumed by analytics, notifications, and UI, rather than filtering one dashboard [Task 1]
- when a production migration was needed, the user explicitly authorized it only after confirmation -> obtain separate confirmation before production database writes [Task 1]

## Reusable knowledge

- `20260725120000_add_agent_operational_follow_ups` introduces `AppointmentEntryOrigin`, `MeasurementScope`, operational-only appointment/callback fields, and `AgentFollowUpReceipt`. Verify both migration status and persisted PostgreSQL enum/table/column/constraint objects; all 44 migrations and the expected guards were confirmed here. [Task 1]
- `apps/api/prisma.config.ts` prefers `DIRECT_DATABASE_URL || DATABASE_URL`. Neon migrations need the direct host, not the pooler; when only the pooled hostname is available, derive the direct host in-process by replacing `-pooler.` with `.` without exposing credentials, then remove temporary runners after verification. [Task 1]
- A local workspace consumer importing generated declarations must build that local dependency in its own `prebuild` and `pretypecheck`; root lifecycle ordering is not sufficient. The guardrails are `npm run test:workspace-build-contracts` and `npm run check:workspace-build-contracts`. [Task 2]

## Failures and how to do differently

- Symptom: production migration is reported pending through `railway run ... prisma migrate status` -> cause: only pooled `DATABASE_URL` was supplied -> use the direct Neon endpoint via the installed Prisma Node CLI, then prove schema objects; do not print credentials. [Task 1]
- Symptom: Railway Worker reports `TS2307: Cannot find module '@nuvora-link/contracts'` while local builds pass -> cause: stale `packages/contracts/dist` masks a missing local build prerequisite -> reproduce from a clean worktree/install and add direct dependency build ordering to every consumer. [Task 2]
- Symptom: a combined Windows npm acceptance command times out -> cause: partial output was treated as success -> run checks separately and require each independent exit code. [Task 2]

# Task Group: Nuvora Link accounting defaults, analytics KPI presentation, and admin follow-up access
scope: server-authoritative invoice price resolution, persisted agent rates, usable long selection modals, analytics roster presentation, and the unfinished extension of Follow-up to administrators
applies_to: cwd=${PROJECT:nuvora-link|backslash}; reuse_rule=reuse for current accounting/analytics/follow-up workflows only after tracing current role gates and provider behavior; branch, PR, and production status in these tasks are historical

## Task 1: Accounting invoice defaults, editable rates, modal scrolling, and analytics KPI presentation, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-25T08-27-53-H42w-nuvora_accounting_analytics_fixes_merged_and_cleaned.md (cwd=\\?\${PROJECT:nuvora-link|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\25\rollout-2026-07-25T12-27-53-019f9863-4f2e-7e30-b2e9-de624e1de1d4.jsonl, updated_at=2026-07-25T13:27:00+00:00, thread_id=019f9863-4f2e-7e30-b2e9-de624e1de1d4, merged and production-smoked)

### keywords

- invoice-pricing.ts, Stripe defaults, agent default rate, PATCH /api/v1/accounting/admin/agent-rate, modal-shell, modal-body, modal-footer, Show, Book/Reach, Kept/Hr, Reach, analyticsRosterPresentation

## Task 2: Safe completed-feature worktree and branch cleanup, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-25T08-27-53-H42w-nuvora_accounting_analytics_fixes_merged_and_cleaned.md (cwd=\\?\${PROJECT:nuvora-link|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\25\rollout-2026-07-25T12-27-53-019f9863-4f2e-7e30-b2e9-de624e1de1d4.jsonl, updated_at=2026-07-25T13:27:00+00:00, thread_id=019f9863-4f2e-7e30-b2e9-de624e1de1d4, worktree and feature refs removed)

### keywords

- git worktree remove, git worktree list --porcelain, git rev-list --left-right --count, git cherry -v, codex/accounting-agent-defaults-kpi, node_modules-only shell

## Task 3: Add existing Follow-up control for admin account, outcome uncertain

### rollout_summary_files

- rollout_summaries/2026-07-25T08-27-53-H42w-nuvora_accounting_analytics_fixes_merged_and_cleaned.md (cwd=\\?\${PROJECT:nuvora-link|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\25\rollout-2026-07-25T12-27-53-019f9863-4f2e-7e30-b2e9-de624e1de1d4.jsonl, updated_at=2026-07-25T13:27:00+00:00, thread_id=019f9863-4f2e-7e30-b2e9-de624e1de1d4, unfinished; no implementation recorded)

### keywords

- Follow-up button, admin account, role gate, backend authorization, rendered verification, operational follow-ups

## User preferences

- when grouped invoices were overriding agent-specific Stripe prices, the user asked that it “uses the assigned default” and only override deliberately -> preserve each agent’s assigned price/product/currency by default; group override must be explicit [Task 1]
- when a modal hid actions for many selected agents, the user asked for scrolling without losing actions -> keep header/footer fixed and scroll only the body [Task 1]
- when discussing analytics, the user specified “Show ratio first, then Book/Reach, Kept/Hr, Reach” with agent-name colors based on Show ratio -> retain that KPI order and identity-color authority [Task 1]
- when asking to add the follow-up button “for the admin account as well,” the user wanted to see how it looks and whether it works -> reuse the existing primitive, trace backend authorization, and perform rendered plus functional verification [Task 3]

## Reusable knowledge

- Server authority is `apps/api/src/modules/accounting/invoice-pricing.ts`, wired through single and bulk routes in `apps/api/src/modules/accounting/router.ts`. Price precedence: explicit override, agent default, currency-compatible organization default, then saved hourly rate; inactive/deleted Stripe prices fail closed. [Task 1]
- Stripe line items and persisted local totals must use one calculated minor-unit total; fractional hours must not become Stripe quantity. Persisted editable rates use `PATCH /api/v1/accounting/admin/agent-rate`. [Task 1]
- Shared `Modal` uses `.modal-shell`, `.modal-body`, and `.modal-footer`; analytics presentation is in `apps/web/src/lib/analyticsRosterPresentation.ts`, with status from adjusted Show ratio and pills exactly Show, Book/Reach, Kept/Hr, Reach. Focused accounting tests 6/6, web tests 40/40, workspace typecheck/build, and rendered checks passed; full API suite still had 34 unrelated failures/timeouts. [Task 1]
- Before worktree deletion verify clean status, merged PR, branch ancestry/zero unique commits, and remote branch presence. On Windows `git worktree remove` can leave a node_modules-only shell: verify expected path, no `.git`, and zero files before removing it. [Task 2]

## Failures and how to do differently

- Symptom: a temporary visual mock crashes at initial render -> cause: a background endpoint has a wrong-shaped fallback -> inventory every initial request and return type-correct fixtures. [Task 1]
- Symptom: a documented pre-push guard is absent -> cause: setup claimed success without checking the file -> ensure `.githooks/pre-push` exists and make `scripts/install-git-hooks.ps1` verify it; develop pushes may proceed while main pushes remain blocked unless deliberately bypassed. [Task 1]
- Symptom: existing invoice replacement loses the old local invoice if provider creation fails -> cause: deletion occurs before provider creation -> treat this as a separate provider-failure data-loss risk, not resolved by the pricing change. [Task 1]
- The admin Follow-up task remains unfinished: trace the existing UI role gate and API authorization first, implement the smallest extension, then verify admin rendering and a successful action; do not report it complete. [Task 3]

# Task Group: Nuvo Dialer Sprint 1.4 rebase, deployment parity, and orchestrator handoff
scope: reconciling Sprint 1.4 authority before history rewrites, turning Railway API/worker environment drift into checked-in controls, and handing off active worktrees without overstating sprint completion
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse for current Sprint 1.4 authority/rebase, Railway worker startup requirements, or handoff work while the named contracts and gate registry still exist; re-check branch, PR, worktree, and live Railway state before using rollout-specific conclusions

## Task 1: Rebase Sprint 1.4 planning branch and reconcile authority, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-15T17-23-18-4CPk-sprint_1_4_rebase_deployment_parity_and_claude_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T21-23-23-019f66cd-e8e9-7e90-8f16-77ae0010d2e6.jsonl, updated_at=2026-07-20T12:05:19+00:00, thread_id=019f66cd-e8e9-7e90-8f16-77ae0010d2e6, rebased authority but not sprint closure)

### keywords

- sprint-1.4, kickoff-goal.md, codex/s14-plan-rebase, origin/main, git range-diff, BUX-019, BIL-008, gate:decision-sprint-linkage, gate:future-seams, ARC-009

## Task 2: Fix Railway API/worker environment-parity process gap, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T17-23-18-4CPk-sprint_1_4_rebase_deployment_parity_and_claude_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T21-23-23-019f66cd-e8e9-7e90-8f16-77ae0010d2e6.jsonl, updated_at=2026-07-20T12:05:19+00:00, thread_id=019f66cd-e8e9-7e90-8f16-77ae0010d2e6, checked-in parity control verified)

### keywords

- Railway, BACKEND_PUBLIC_URL, RAILWAY_PUBLIC_DOMAIN, service-env-contract.json, gate:deployment-config-parity, deployment-config-parity:live, ComSpec, backend/src/lib/env.ts, telnyx-sms.ts, gates:all

## Task 3: Produce Claude orchestrator handoff for remaining Sprint 1.4 work, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T17-23-18-4CPk-sprint_1_4_rebase_deployment_parity_and_claude_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T21-23-23-019f66cd-e8e9-7e90-8f16-77ae0010d2e6.jsonl, updated_at=2026-07-20T12:05:19+00:00, thread_id=019f66cd-e8e9-7e90-8f16-77ae0010d2e6, time-specific worktree/PR checkpoint)

### keywords

- PR-251, PR-252, migration 0071, terminalizeNoProviderEffect, not_submitted, zero SMS/provider effects, codex/s14-b01-authority-cutover, codex/s14-backend-mocks, M01-M10 paused

## User preferences

- when Sprint 1.4 work starts, the user required the kickoff goal to be the "exact product contract, execution order, proof contract, and definition of done" -> read `docs/agent-prompts/sprint-1-4/kickoff-goal.md` completely before planning or editing [Task 1]
- when a manually fixed production/deployment incident exposes a process gap, the user said: "fix the process gap you just flagged" -> convert the root cause into a checked-in gate/runbook with regression coverage, rather than leaving only incident notes [Task 2]
- the user prohibited visible production frontend work and merge/deploy/production writes, real 911, purchases, and billed irreversible actions without approval -> keep progressing only on independently safe work while those human gates are pending [Task 1][Task 3]

## Reusable knowledge

- Before rewriting history, create a backup ref, then use `git range-diff` after rebase. Authority conflicts in decision/backlog/sprint files require semantic reconciliation: preserve newer billing/linkage decisions while retaining locked Sprint 1.4 ownership; do not use blanket ours/theirs. The 2026-07-20 rebase preserved the planning commit at `fb58ac3d9a6554aaf8d2cbe330338862a2732911` over `origin/main` `1b2f73d8` [Task 1]
- `gate:decision-sprint-linkage` validates bidirectional decision↔sprint linkage and rejects stale/dead/malformed pending rows; `gate:future-seams` requires post-1.4 docs to declare additive ARC-009 seams. The resolved authority assigned BUX-019 to Sprint 1.4, BIL-003/BIL-004 to Sprint 1.5, and treated newer BIL-008 pricing/fair-use language as controlling [Task 1]
- Railway services can share a Docker image while holding separate per-service variables; image parity does not imply environment parity. Any new backend startup requirement must update `docs/deployment/service-env-contract.json`, pass `npm run gate:deployment-config-parity`, and run `npm run deployment-config-parity:live` before release [Task 2]
- Keep static checks in the canonical `gate:*` registry; keep read-only operator live checks outside it and update the registry test when adding a static row. On Windows, invoke fixed read-only Railway arguments through `ComSpec` because direct Node spawn cannot reliably execute the installed `railway.ps1`/`.cmd` shim [Task 2]
- The 2026-07-20 handoff was not sprint completion: PR #251 mock lane was intentionally paused, PR #252 was open/not merge-ready, and the next B01 proof was migration `0071` plus `terminalizeNoProviderEffect`, followed by persisted `not_submitted` evidence proving zero SMS/provider effects [Task 3]

## Failures and how to do differently

- Symptom: authority-file rebase conflicts -> cause: source-of-truth decisions changed on main -> inspect the decision log, sprint ownership, backlog, and linkage gate together; do not mechanically choose ours/theirs [Task 1]
- Symptom: worker crashes although API works -> cause: the worker lacks a required environment variable -> compare the per-service contract, not just the shared image; run static and live parity checks [Task 2]
- Symptom: `spawnSync('railway')` fails on Windows -> cause: Node cannot execute the installed shim directly -> call `cmd.exe` through `ComSpec` with fixed read-only arguments [Task 2]
- Symptom: a live parity check is registered as `gate:*` or missing from registry tests -> cause: operator-only and static-gate roles were conflated -> keep the live command operator-only and extend the expected registry sequence/tracked-file checks [Task 2]
- Symptom: `gate:doc-code-drift` cannot start with missing `markdown-it` -> cause: environment dependency failure -> report it as unverified, never as a green documentation check [Task 2]

# Task Group: Nuvo Dialer AI capability audit and portable orchestration control plane
scope: auditing the user's actual Claude/Codex operating model and designing or validating portable controller-owned completion evidence; separates verified local proof from installation, activation, billing, and trust-boundary gaps
applies_to: cwd=${PROJECT:auxara-dialer|backslash} and ${PROJECT:control-plane|backslash} Control Plane; reuse_rule=reuse for AI workflow/capability audits or portable orchestration-control-plane work, but re-check live repo, CI, installation, and automation activation state before claiming rollout or deployment completeness

## Task 1: Audit the actual Claude/Codex operating model, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-14T14-55-44-q5RU-ai_capability_audit_and_portable_orchestration_control_plane.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\14\rollout-2026-07-14T18-55-49-019f6120-744c-7563-9b0c-2f457d6f7e32.jsonl, updated_at=2026-07-17T16:44:39+00:00, thread_id=019f6120-744c-7563-9b0c-2f457d6f7e32, capability audit plus later implementation activity)

### keywords

- Claude, Codex, actual AI development system, AGENTS.md, CLAUDE.md, .claude/settings.json, orchestration-playbook.md, orchestrator-handoff-context.md, always-on context, 48438 tokens, Playwright visual regression, Sentry fallback, automation activation

## Task 2: Build and locally validate portable controller-owned completion evidence, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-14T14-55-44-q5RU-ai_capability_audit_and_portable_orchestration_control_plane.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\14\rollout-2026-07-14T18-55-49-019f6120-744c-7563-9b0c-2f457d6f7e32.jsonl, updated_at=2026-07-17T16:44:39+00:00, thread_id=019f6120-744c-7563-9b0c-2f457d6f7e32, portable repo=${PROJECT:control-plane|backslash} Control Plane; local proof passed; installation and external CI remain unresolved)

### keywords

- AI Organization Control Plane, TaskCreated, SubagentStop, TaskCompleted, task-assurance.v2.schema.json, task-evidence.v2.schema.json, artifact_opened, killer_mutation_observed, mutation receipt, baseline exit 0, mutant exit 17, overlay checks, GitHub Actions billing

## Task 3: Read-only weekly fleet doctrine review and overlay parity audit on 2026-07-20, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-20T05-26-28-4IV8-weekly_fleet_doctrine_review_control_plane_drift.md (cwd=${PROJECT:control-plane|backslash} Control Plane, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\20\rollout-2026-07-20T09-26-33-019f7dfd-6e5e-7061-a2fc-8f4ef6ac7fe6.jsonl, updated_at=2026-07-20T05:33:04+00:00, thread_id=019f7dfd-6e5e-7061-a2fc-8f4ef6ac7fe6, read-only parity finding; no remediation)

### keywords

- control:check, bootstrap-orchestrator, PostToolUse, claude-posttooluse-gate, rooted exec-form hooks, CLAUDE_PROJECT_DIR, exit 2, review objects, installed parity, doctrine drift, weekly audit, read-only

## User preferences

- when the user asks for a capability-gap audit of their "actual AI development system" -> inspect the real repos, rules, agents, hooks, memories, prompts, and prior evidence before recommending capabilities; do not answer with a generic feature list [Task 1]
- when the user asks for the result "in plain english tell me what you have built and what it does" -> explain the concrete workflow sequence and proof boundaries, not only file names, agents, or policy terms [Task 1][Task 2]
- when the user asks for a "Read-only organization-wide weekly fleet and doctrine review" and says "do not implement them" -> keep the audit evidence-only; cap deduplicated recommendations at three high-leverage changes [Task 3]
- when the user says "never search an entire home directory" or inspect credentials, tokens, session logs, raw telemetry payloads, or `.env` files -> use the control-plane manifest as the allowlist for audit surfaces [Task 3]

## Reusable knowledge

- The canonical intended workflow is: orchestrator defines outcome and proof; challenger tests premise; specialist implements; independent auditors attack the result; local gates and runtime verification establish evidence; humans gate irreversible, billed, or production actions. Claude is positioned for visible frontend/design work; Codex for backend, infrastructure, gates, tests, and token-intensive non-visual work. [Task 1]
- `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `docs/agent-prompts/orchestration-playbook.md`, and `docs/agent-prompts/orchestrator-handoff-context.md` are the first authority surfaces for a Nuvo Dialer workflow audit. The audit found stale handoff sprint prose and roughly 48,438 estimated always-on context tokens; keep conditional rules as JIT pointers rather than expanding always-loaded context. [Task 1]
- The portable control plane binds completion evidence to task, repository, commit, attempt, contract, profile, role, lifecycle events, and parsed proof artifacts. Completion is controller/platform evidence (`TaskCreated -> SubagentStop -> TaskCompleted`), not agent-authored booleans. [Task 2]
- Mutation proof is a verifier trust test: clean baseline pass -> registered mutant fails with expected diagnostic -> exact byte restoration -> clean post-restore pass. Local evidence reported universal 69/69, CoachAI 22/22, Auxara lifecycle 7/7 and control 10/10, plus mutation receipts, syntax/diff checks, gitleaks, and independent audits. [Task 2]
- Automation specifications and portable repository commits/PRs are not activation or installed-overlay proof. Verify desktop activation and current project overlay parity separately. [Task 1][Task 2]
- `npm run control:check` in `${PROJECT:control-plane|backslash} Control Plane` is a parity sentinel: a red result means installed doctrine is stale until parity is restored. Keep canonical sources, installed copies, and project overlays distinct. [Task 3]
- The canonical bootstrap contract requires rooted exec-form `node` hooks using `${CLAUDE_PROJECT_DIR}/scripts/...`; malformed JSON or missing `tool_input.file_path` in `PostToolUse` must fail closed with exit 2. Query actual GitHub review objects when independent review evidence matters; comments alone are not reviews. [Task 3]

## Failures and how to do differently

- Symptom: an audit silently turns into edits, commits, pushes, or PR work -> likely cause: the initial read-only boundary was not preserved through later stages -> keep audits read-only unless implementation is explicitly authorized; if authorized, state the scope transition clearly. [Task 1]
- Symptom: a broad PowerShell inventory scan fails or fresh verification is overstated -> likely cause: empty-pipeline syntax or a run exceeding the time limit -> prefer smaller targeted commands, and do not call a timed-out rerun fresh green evidence. [Task 1]
- Symptom: GitHub Actions did not start -> likely cause: account billing/spending-limit failure before job steps, not a code failure -> route to GitHub Billing & plans rather than changing code. [Task 2]
- Symptom: the control plane is described as fully rolled out -> likely cause: local/pushed proof was conflated with project installation and trust coverage -> state the open limits: no live Claude event proof, no authenticated Codex lifecycle ingress, no external trusted human-approval provider, no official task-to-subagent principal binding, and no malicious same-user boundary. [Task 2]
- Symptom: an overlay looks present but control-plane health is claimed -> likely cause: canonical parity and malformed-payload behavior were not checked -> run `control:check`, compare the rooted hook form to the canonical template, and require exit 2 for malformed/missing `file_path` before claiming parity. [Task 3]

# Task Group: Nuvora CoachAi read-only orchestration drift audit
scope: evidence-only repo-state and control-plane drift audits for CoachAI, including git/GitHub status, safe gate output, rule wiring, and documentation-vs-execution authority checks
applies_to: cwd=${PROJECT:coachai|backslash}; reuse_rule=reuse across read-only CoachAI orchestration, repo-hygiene, or control-plane audits while the repo still uses the same gate names, `gh` access pattern, and `.claude` hook wiring; verify live git/GitHub state before reusing branch-specific conclusions

## Task 1: Read-only orchestration drift audit on 2026-07-17, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-17T05-12-17-w6ws-coachai_orchestration_drift_audit_2026_07_17.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\17\rollout-2026-07-17T09-12-22-019f6e7d-5c27-7021-9f9b-f110ffdec314.jsonl, updated_at=2026-07-17T05:17:02+00:00, thread_id=019f6e7d-5c27-7021-9f9b-f110ffdec314, evidence collected but no-edit constraint violated)

### keywords

- Read-only CoachAI orchestration drift audit, fix/dashboard-header-ambient, origin/main, git worktree list --porcelain, SRP-004, gate:preflight-rules, test:doc-code-drift, gate:test-intent:audit, claude-posttooluse-gate.mjs, authority doc drift, no-edit constraint

## Task 2: Read-only orchestration drift audit on 2026-07-16, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-16T05-12-05-Une1-coachai_readonly_orchestration_drift_audit.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\16\rollout-2026-07-16T09-12-10-019f6956-d44c-7333-bf72-f2bc4036c781.jsonl, updated_at=2026-07-16T05:17:51+00:00, thread_id=019f6956-d44c-7333-bf72-f2bc4036c781, earlier audit)

### keywords

- Read-only Nuvora CoachAI orchestration drift report, git fetch --prune origin, git rev-list --left-right --count HEAD...origin/main, gh repo view, gh pr list, SRP-004, gate:preflight-rules, test:doc-code-drift, gate:test-intent:audit, claude-posttooluse-gate.mjs

## Task 3: Read-only organization orchestration drift audit on 2026-07-21, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-21T05-11-50-LINu-organization_orchestration_drift_audit_2026_07_21.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\21\rollout-2026-07-21T09-11-55-019f8316-63c2-7992-af90-901459a1ea84.jsonl, updated_at=2026-07-21T05:15:55+00:00, thread_id=019f8316-63c2-7992-af90-901459a1ea84, newer CoachAI evidence from cross-repo audit)

### keywords

- organization orchestration drift, fix/dashboard-header-ambient, origin/main, SRP-004, 15 worktrees, 46 open issues, gate:preflight-rules, test:doc-code-drift, gate:test-intent:audit, CODEOWNERS, classification-only

## Task 4: Read-only cross-repository drift audit on 2026-07-20 and 2026-07-22, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-22T05-10-33-3SHf-read_only_orchestration_drift_audit_2026_07_22.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\22\rollout-2026-07-22T09-10-38-019f883b-934a-7873-a27e-2cbd01d10e59.jsonl, updated_at=2026-07-22T05:14:22+00:00, thread_id=019f883b-934a-7873-a27e-2cbd01d10e59, newest time-specific CoachAI state)
- rollout_summaries/2026-07-20T05-11-23-WXnt-organization_wide_orchestration_drift_audit_nuvo_coachai.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\20\rollout-2026-07-20T09-11-30-019f7def-9cb1-7251-8a70-b811b8e96cdb.jsonl, updated_at=2026-07-20T05:14:45+00:00, thread_id=019f7def-9cb1-7251-8a70-b811b8e96cdb, iterative cross-repo audit)

### keywords

- git fetch --prune origin, fix/dashboard-header-ambient, 2 ahead/145 behind, 15 worktrees, 50 unregistered ahead branches, SRP-004, gate:preflight-rules, test:doc-code-drift, gate:test-intent:audit, PostToolUse, CODEOWNERS, classification-only

## Task 5: Read-only organization orchestration drift audit on 2026-07-23, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-23T05-11-46-z9yL-organization_orchestration_drift_audit_2026_07_23.md (cwd=\\?\${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\23\rollout-2026-07-23T09-11-51-019f8d63-0b86-76a0-ac4f-fe8d694ea6e7.jsonl, updated_at=2026-07-23T05:15:33+00:00, thread_id=019f8d63-0b86-76a0-ac4f-fe8d694ea6e7, newest time-specific CoachAI evidence from cross-repo audit)

### keywords

- organization orchestration drift, fix/dashboard-header-ambient, 2 ahead/145 behind, 15 worktrees, 50 unregistered ahead branches, PR #221, dialer-db-regressions, gates, Vercel previews, SRP-004, docs/agent-prompts/README.md, log not found, classification-only

## Task 6: Read-only cross-repository orchestration drift audit on 2026-07-24, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-24T05-10-07-Haxp-cross_repo_orchestration_drift_audit_nuvo_coachai_2026_07_24.md (cwd=\\?\${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\24\rollout-2026-07-24T09-10-12-019f9287-e51d-76c3-b4b8-c9e551a423a7.jsonl, updated_at=2026-07-24T05:13:29+00:00, thread_id=019f9287-e51d-76c3-b4b8-c9e551a423a7, newest time-specific CoachAI evidence from cross-repo audit)

### keywords

- read-only organization-wide orchestration drift audit, fix/dashboard-header-ambient, 2 ahead/145 behind, 15 worktrees, 50 unregistered ahead branches, PR #221, dialer-db-regressions, gates, PostToolUse, SessionStart, CODEOWNERS, PULL_REQUEST_TEMPLATE, ISSUE_TEMPLATE, docs/agent-prompts/README.md, classification-only

## User preferences

- when the user asks for a read-only CoachAI audit and says "Run only existing safe read-only orchestration/context/rules gates" and "if a named gate does not exist, report that fact instead of inventing one" -> stay strictly read-only, use only discovered safe checks, and name unavailable gates honestly [Task 1][Task 2]
- when the user says "Report only evidence-backed discrepancies, blockers, stale handoffs, orphaned branches/worktrees, and exact next actions" -> bias the audit toward concrete drift items and actionable next steps instead of broad repo summaries [Task 1][Task 2]
- when the user prohibits edits, commits, pushes, branch/worktree changes, or sensitive-data inspection -> do not modify repository files, automation memory, or any external state; treat automation-memory files as inside the no-edit boundary [Task 1]
- when the user asks to inspect both repos and deduplicate findings across them -> compare projects side-by-side and group by project instead of replaying raw tool output separately [Task 6]

## Reusable knowledge

- If `$env:CODEX_HOME` may be unset, do not assume `$CODEX_HOME/automations/...` can be resolved with `Join-Path`; use a direct path check or guard the env var first, and never update that file in a read-only audit [Task 1][Task 2]
- `gh repo view --json nameWithOwner,url,defaultBranchRef` established the correct repo slug as `Nuvoralink/Nuvora-CoachAi`; use that before running PR or issue queries so audit time is not wasted on repository-resolution errors [Task 2]
- The live read-only gate trio that produced useful audit proof was `npm run gate:preflight-rules`, `npm run test:doc-code-drift`, and `npm run gate:test-intent:audit`; on 2026-07-17 they exited 0 with 316 preflight warnings, 1,425 doc-code checks passing, and 90 compliant/234 legacy test files [Task 1]
- `.claude/settings.json` wires `PostToolUse` to `node scripts/claude-posttooluse-gate.mjs`, and that hook currently runs UI checks, `gate:tx-seam`, `gate:ephemeral-listen`, and touched-test intent checks, but not `test:doc-code-drift` for authority-bearing edits [Task 1][Task 2]
- `docs/app-plan/README.md` and `docs/app-plan/decision-log.md` are historical documentation-audit overlay docs, not a live sprint execution ledger, so do not treat them as the current source of execution truth during drift audits [Task 2]
- Fresh 2026-07-17 state was `fix/dashboard-header-ambient` at `c4fcd85d`, 2 ahead/139 behind `origin/main`, 16 non-prunable worktrees, no open PRs, and blocked SRP-004 issues #4/#5/#6; all branch/worktree figures are time-specific and must be rechecked live [Task 1]
- Newer 2026-07-21 state was `fix/dashboard-header-ambient`, dirty with 6 paths, 2 ahead/144 behind `origin/main`, 15 registered worktrees (three detached), no open PRs, 46 open issues, and 45 unregistered ahead branches requiring owner/PR/retirement classification rather than deletion. SRP-004 #4/#5/#6 stayed blocked on live operations, secret rotation, and production observability validation [Task 3]
- The safe CoachAI audit trio remained `npm run gate:preflight-rules`, `npm run test:doc-code-drift`, and `npm run gate:test-intent:audit`; the newer run passed with 316 warnings, 1,425 doc-code checks, and a non-enforcing 90 compliant/234 legacy test inventory. Root PR template, issue templates, and CODEOWNERS remained absent [Task 3]
- Newest 2026-07-22 state was dirty `fix/dashboard-header-ambient`, 2 ahead/145 behind `origin/main`, with 15 non-prunable worktrees and 50 unregistered ahead branches. Treat all figures as time-specific; classify branches retain/PR/retire before cleanup. No open PRs, 46 open issues, SRP-004 #4–#6, the non-enforcing test inventory, PostToolUse-only wiring, and absent PR/issue templates, `.githooks`, and CODEOWNERS remained open. [Task 4]
- Newest 2026-07-23 state remained dirty `fix/dashboard-header-ambient`, 2 ahead/145 behind `origin/main`, with 15 registered worktrees and 50 unregistered ahead branches requiring ownership classification. PR #221 was UNSTABLE: `dialer-db-regressions` and `gates` failed while Vercel previews passed. Treat static/doc gate success as distinct from CI, live-provider proof, and merge readiness; `docs/agent-prompts/README.md` was stale because it described a clean main checkout. [Task 5]
- Newest 2026-07-24 cross-repo evidence kept the same primary checkout `fix/dashboard-header-ambient`, 15 registered worktrees, 50 unregistered ahead branches, 46 open issues, and PR #221 `UNSTABLE`; use `gh repo view` before issue/PR queries, and treat the repo's live state as more authoritative than `docs/agent-prompts/README.md` because the README still reflected an older persistent-role snapshot. `.claude/settings.json` still only exposed `PostToolUse`; there was no `SessionStart` wiring, and root PR template, issue template, and `CODEOWNERS` were absent. [Task 6]

## Failures and how to do differently

- Symptom: an audit is “read-only” but code edits automation memory -> cause: automation state was treated as an exception -> fix: treat no-edit as covering automation memory, repo files, branches/worktrees, and all external state; report only [Task 1]
- Symptom: a Git upstream command returns `fatal: ambiguous argument 'dQBwAHMAdAByAGUAYQBtAA=='` -> likely cause: shell interpolation corrupted the revision -> use explicit `origin/main` or guarded ref resolution [Task 1]
- Symptom: `gh` queries fail with `Could not resolve to a Repository` -> likely cause: the audit used the wrong owner/repo slug -> fix by confirming `gh repo view` first and then re-running PR/issue queries against the resolved slug [Task 2]
- Symptom: broad repo scans or backlog greps keep timing out during a drift audit -> likely cause: the repo surface is too large for shotgun scans -> pivot to targeted doc, gate, and backlog checks earlier instead of burning time on exhaustive search [Task 1][Task 2]
- Symptom: a non-enforcing audit passes -> likely cause: exit status is being mistaken for closure -> retain the legacy test inventory and SRP-004 as open until enforcing/live operations evidence exists [Task 3]
- Symptom: an orchestration audit claims the edit-time governance is fully wired -> likely cause: the hook routing was skimmed instead of enumerated -> inspect `.claude/settings.json` and `scripts/claude-posttooluse-gate.mjs` directly and keep calling out the missing authority doc-drift gate until it is wired [Task 1][Task 2]
- Symptom: dirty worktrees or ahead branches are treated as deletion candidates -> likely cause: state inventory was confused with cleanup authority -> refresh remotes, inspect status/divergence/porcelain worktrees/PRs/issues first, then report retain/PR/retire ownership choices without mutation. [Task 4]
- Symptom: failed PR #221 checks are presented as explained -> likely cause: `gh run view --log-failed` returned `log not found` -> preserve this as an unresolved evidence limitation and use available artifacts or a later authorized query for triage. [Task 5]
- Symptom: stale orchestration docs are treated as current repo authority -> likely cause: live git/worktree/gh state was not compared against the README snapshot -> re-check branch divergence, worktrees, PRs/issues, and hook wiring before trusting handoff docs. [Task 6]

# Task Group: Nuvora CoachAi sales SOP and coaching guide split
scope: turning fragmented CoachAI coaching sources into two audience-specific artifacts, with one technical companion for future edits and one plain-language manager SOP with no product or repo references
applies_to: cwd=${PROJECT:coachai|backslash}; reuse_rule=reuse across CoachAI documentation or training-guide work when the task needs source-material consolidation or a manager-facing artifact derived from technical sources; verify the live source files and target audience before reusing content-specific conclusions

## Task 1: Technical coaching companion from original sources, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T13-27-32-Xe0S-coachai_sales_sop_and_human_guide.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T17-27-37-019f65f6-1039-7642-a69b-1d7f637be896.jsonl, updated_at=2026-07-15T14:02:52+00:00, thread_id=019f65f6-1039-7642-a69b-1d7f637be896)

### keywords

- original human written files, FINAL CALL REVIEW SYSTEM checklist.txt, FINAL CALL REVIEW SYSTEM.txt, COACHAI_SALES_AND_COACHING_TECHNIQUES.md, shared/src/coaching/checklist.ts, shared/src/coaching/contracts.ts, 32/32 checklist labels, 11/11 technique IDs

## Task 2: Standalone manager SOP and coaching guide, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T13-27-32-Xe0S-coachai_sales_sop_and_human_guide.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T17-27-37-019f65f6-1039-7642-a69b-1d7f637be896.jsonl, updated_at=2026-07-15T14:02:52+00:00, thread_id=019f65f6-1039-7642-a69b-1d7f637be896)

### keywords

- one of my managers is trying to create a SOP and coaching guidelines, this is for a normal human, SALES_CALL_SOP_AND_COACHING_GUIDE.md, no app references, no technical references, printable review checklist, one-page coaching record

## User preferences

- when the user says they want "the original human written files" and asks "if we dont have them anymore can you turn all of them into one file?", prefer consolidating fragmented source material into a readable artifact instead of leaving it scattered [Task 1]
- when the user says "dont care about the prompts" and then clarifies "you dont have to give me the prompts, but some of the techniques are probably in them so still read them" -> use prompts as evidence when useful, but do not reproduce them in the output [Task 1]
- when the user says "one of my managers is trying to create a SOP and coaching guidelines" and "this is for a normal human" -> write the deliverable in plain, manager-facing language rather than product or engineering language [Task 2]
- when the user says "i will be removing that file from the repo so no need to mention anything related to the app in it" and later "this file you created is good to keep if it helps future edits just make a new one" -> preserve the technical companion if it is still useful and create a separate human-facing artifact with no app, repo, code, or prompt references [Task 1][Task 2]

## Reusable knowledge

- The original human-written source files still exist at `${WORKSPACE:dev|backslash}\shared folder\FINAL CALL REVIEW SYSTEM checklist.txt` and `${WORKSPACE:dev|backslash}\shared folder\FINAL CALL REVIEW SYSTEM.txt`; they are the fastest source-of-truth pair when the user asks for the original coaching system [Task 1]
- The live checklist authority in this repo is version 1.4 with 6 sections, where Section 1 is non-scored craft guidance and the scored maximum is 10 [Task 1]
- The live named coaching-line technique set has 11 IDs: `time_frame_opener`, `context_anchor`, `value_bridge`, `acknowledge_reframe`, `acknowledge_reframe_binary_close`, `binary_close`, `fallback_callback_control`, `appointment_cementing`, `discovery_probe`, `micro_commitment`, `playbook_objection_response` [Task 1]
- `docs/COACHAI_SALES_AND_COACHING_TECHNIQUES.md` is useful as the retained technical companion because it consolidates the original human-written material plus current live checklist and technique authority for future edits [Task 1]
- `docs/SALES_CALL_SOP_AND_COACHING_GUIDE.md` works as the manager-facing artifact because it stands alone, includes a printable review checklist and one-page coaching record, and avoids product or repo terminology [Task 2]
- Collective Learning / BestPractice extraction is collection/moderation infrastructure and does not currently feed the coaching output pipeline, so it should not be presented as active coaching-output authority [Task 1]

## Failures and how to do differently

- Symptom: prompt-derived techniques are missing from the consolidated guide -> likely cause: prompts were excluded entirely instead of treated as evidence -> if the user says to read prompts, mine them for techniques while still avoiding prompt reproduction in the final artifact [Task 1]
- Symptom: a useful technical companion gets deleted while making a manager-facing guide -> likely cause: the task was treated as a replacement instead of a split by audience -> confirm whether the new artifact should replace or complement the old one before deleting or overwriting anything [Task 1][Task 2]
- Symptom: a supposedly human-facing SOP still trips a technical-language check -> likely cause: the final pass did not validate for stray app/repo/prompt/code terms -> run a final no-technical-terms validation pass before handing off the manager-facing file [Task 2]

# Task Group: Nuvo Dialer worktree cleanup and stale-branch hygiene
scope: evidence-first classification, deletion, and pruning of Nuvo Dialer worktrees, archive folders, and stale worktree metadata without dropping unique commits or unrelated active work
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse across Nuvo Dialer worktree cleanup, disk-space reclamation, and stale-branch hygiene tasks while the repo still uses git worktrees and the same archive patterns; always re-check live branch ancestry and filesystem state before deleting anything

## Task 1: Determine which folders are safe to delete, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T10-53-25-ER6q-worktree_deletion_safety_triage.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T14-53-31-019f6568-f855-70c0-b74b-07fdd4d69b32.jsonl, updated_at=2026-07-16T04:23:27+00:00, thread_id=019f6568-f855-70c0-b74b-07fdd4d69b32, per-folder safety triage)

### keywords

- git worktree, origin/main, safe to delete, node_modules-only, archive folder, unique commit, gh pr view, worktree remove, NuvoDialer-worktree-archive

## Task 2: Audit pictured worktrees, reclaim disk space, and preserve only active or unique state, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-11T12-00-09-ZBET-nuvo_dialer_worktree_and_stale_branch_cleanup.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\11\rollout-2026-07-11T16-00-14-019f510c-9d89-7a40-a3a8-bf752eac6dd3.jsonl, updated_at=2026-07-16T09:38:01+00:00, thread_id=019f510c-9d89-7a40-a3a8-bf752eac6dd3, cleanup plus disk-space reclamation)

### keywords

- git worktree list --porcelain, agent:state, git rev-list, git cherry -v, orphan shell, node_modules junction, archive cleanup, orchestration-control-plane-v2, disk space

## Task 3: Safely prune stale worktree connection and retire obsolete branch, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-11T12-00-09-ZBET-nuvo_dialer_worktree_and_stale_branch_cleanup.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\11\rollout-2026-07-11T16-00-14-019f510c-9d89-7a40-a3a8-bf752eac6dd3.jsonl, updated_at=2026-07-16T09:38:01+00:00, thread_id=019f510c-9d89-7a40-a3a8-bf752eac6dd3, stale metadata and branch cleanup)

### keywords

- decision-sprint-linkage, git worktree prune, git worktree prune --dry-run --verbose, git cherry -v, git rev-list --left-right --count origin/main...branch, codex/decision-sprint-linkage

## User preferences

- when the user asks "can you tell me if these worktrees are safe to delete" and "are your files on main? i want to delete your worktree" -> give a direct safety verdict per folder, not a blanket rule, and verify reachability on `origin/main` before calling something disposable [Task 1]
- when the user asks to "go through these worktrees and check the work thats in them" and "only keep the ones that are really needed and are part of an ongoing work" -> default to evidence-first triage, not blind deletion [Task 2]
- when the user explicitly wants disk space reclaimed -> prefer deleting confirmed orphan shells and truly merged worktrees once uniqueness checks pass [Task 2]
- when the user says they already deleted the worktree and wants to "safely remove the stale connection" -> prune registry metadata first, then delete the local branch only if branch uniqueness is zero [Task 3]

## Reusable knowledge

- The definitive cleanup proof in this repo family is a combination of `git worktree list --porcelain`, `git rev-list --left-right --count origin/main...branch`, `git cherry -v`, `gh pr view/list`, and direct filesystem inspection for `.git`, tracked files, and whether the folder is only a `node_modules` shell [Task 1][Task 2][Task 3]
- Four folders were ordinary remnants and safe to delete because they had no Git metadata or source files and only `node_modules`: `${WORKSPACE:dev|backslash}\NuvoDialer-list-ownership`, `${WORKSPACE:dev|backslash}\nuvo-dialer-orchestration-review`, `${WORKSPACE:dev|backslash}\NuvoDialer-pr184-wiring`, and `${WORKSPACE:dev|backslash}\NuvoDialer-s13-config-authority` [Task 1]
- `${WORKSPACE:dev|backslash}\NuvoDialer-worktree-archive` is not a disposable worktree; it preserves snapshots such as `branch.txt`, `HEAD.txt`, `status.txt`, `tracked-diff.patch`, and untracked artifacts, so it should be kept unless every retained item has been triaged elsewhere [Task 1]
- `${WORKSPACE:dev|backslash}\nuvo-dialer-orchestration-control-plane-v2` was a real clean worktree with unique local commit `9086729f630bf2ea4e418fa2cd71043b34d0879a`; that uniqueness had to be preserved or triaged before the worktree itself could be removed [Task 1][Task 2]
- On Windows, `git worktree remove` can leave an empty shell behind; verify the path is gone on disk and then prune registry metadata rather than assuming the removal fully cleaned itself up [Task 2][Task 3]
- For stale worktree cleanup, the decisive branch-safety test is whether `git rev-list --left-right --count origin/main...branch` and `git cherry -v` show any commits not already in `origin/main`; if uniqueness is zero, deleting the local branch after pruning the stale worktree entry is safe [Task 3]
- After the stale `decision-sprint-linkage` cleanup, the active preserved worktrees were `main`, `codex/s14-b01-internal-dnc`, `codex/s14-b02-inbound-routing`, `codex/s14-backend-mocks`, `codex/s14-mock-tooling`, and `codex/s14-plan-rebase` [Task 3]

## Failures and how to do differently

- Symptom: a folder looks like a worktree and is tempting to delete immediately -> likely cause: directory name alone is being treated as evidence -> inspect Git metadata, tracked files, and archive markers first because some folders are only `node_modules` shells while others are archive snapshots [Task 1][Task 2]
- Symptom: a clean worktree is assumed safe to remove -> likely cause: `HEAD` ancestry and unique commits were never checked -> verify whether the branch carries unique commits before deleting the worktree or its branch [Task 1][Task 2]
- Symptom: `git worktree prune` clears the stale registration but the branch still lingers or may hold unique work -> likely cause: metadata cleanup was treated as branch cleanup -> follow the sequence: confirm path missing, confirm branch uniqueness, prune metadata, then decide on branch deletion [Task 3]

# Task Group: Nuvo Dialer orchestration drift audit, control-plane consolidation, and local-main sync
scope: read-only repo-state audits, orchestration control-plane merge/verification, and safe cleanup or sync work that preserves unrelated dirty work while bringing `main` back in sync
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse across Nuvo/Auxara repo-state audits, orchestration consolidation, or worktree cleanup/main-sync requests while the repo still uses the same `agent:state`, rules wiring, and worktree patterns; re-check live git/GitHub state before reusing branch-specific conclusions

## Task 1: Read-only orchestration drift audit on 2026-07-16, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-16T05-11-35-XNHf-auxara_daily_orchestration_drift_audit_2026_07_16.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\16\rollout-2026-07-16T09-11-40-019f6956-5ee3-7e03-bfad-14c7808e7a75.jsonl, updated_at=2026-07-16T05:14:22+00:00, thread_id=019f6956-5ee3-7e03-bfad-14c7808e7a75, freshest read-only audit)

### keywords

- Read-only Auxara Dialer orchestration drift report, git fetch --prune, git worktree list --porcelain, prunable gitdir file points to non-existent location, gate:rules-wiring, gh auth status, BUG_BACKLOG

## Task 2: Read-only orchestration drift audit on 2026-07-15, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T09-52-37-tAtp-auxara_orchestration_drift_audit_and_main_sync.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T13-52-42-019f6531-4d48-7623-890a-6fb85ea8c877.jsonl, updated_at=2026-07-15T11:06:47+00:00, thread_id=019f6531-4d48-7623-890a-6fb85ea8c877, earlier read-only audit)

### keywords

- Read-only Auxara Dialer orchestration drift report, git worktree list --porcelain, git rev-list --left-right --count main...origin/main, gh pr list, gh issue list, gate:rules-wiring, agent:state

## Task 3: Consolidate orchestration work, verify, merge, clean residue, and sync local main, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-15T09-52-37-tAtp-auxara_orchestration_drift_audit_and_main_sync.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\15\rollout-2026-07-15T13-52-42-019f6531-4d48-7623-890a-6fb85ea8c877.jsonl, updated_at=2026-07-15T11:06:47+00:00, thread_id=019f6531-4d48-7623-890a-6fb85ea8c877, cleanup/main-sync)

### keywords

- PR 244, orchestration control-plane, agent:state, npm run verify, npm run gates:all, npm run test:e2e:locked, 4601b7d1cde9d911832901078e8f4ecb1c834171, wip/local-main-pre-sync-20260715

## Task 4: Read-only orchestration drift sweep on 2026-07-17, outcome fail

### rollout_summary_files

- rollout_summaries/2026-07-17T05-11-48-RIya-auxara_orchestration_drift_read_only_sweep_2026_07_17.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\17\rollout-2026-07-17T09-11-53-019f6e7c-eaf0-7620-8d09-0337060c2aae.jsonl, updated_at=2026-07-17T05:14:45+00:00, thread_id=019f6e7c-eaf0-7620-8d09-0337060c2aae, evidence collected but no-edit constraint violated)

### keywords

- Read-only Auxara orchestration drift sweep, npm run agent:state -- --github, origin/main, gate:rules-wiring, unregistered ahead branches, Sprint 1.3, Sprint 1.4, BUG_BACKLOG, no-edit constraint

## Task 5: Read-only organization orchestration drift audit on 2026-07-21, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-21T05-11-50-LINu-organization_orchestration_drift_audit_2026_07_21.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\21\rollout-2026-07-21T09-11-55-019f8316-63c2-7992-af90-901459a1ea84.jsonl, updated_at=2026-07-21T05:15:55+00:00, thread_id=019f8316-63c2-7992-af90-901459a1ea84, newer Nuvo evidence from cross-repo audit)

### keywords

- organization orchestration drift, fix/integration-suite-repairs, origin/main, dirty 23 paths, PR-251, PR-252, 21 unregistered ahead branches, gate:rules-wiring, agent:state, Sprint 1.3, Sprint 1.4, CODEOWNERS

## Task 6: Read-only cross-repository drift audit on 2026-07-20 and 2026-07-22, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-22T05-10-33-3SHf-read_only_orchestration_drift_audit_2026_07_22.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\22\rollout-2026-07-22T09-10-38-019f883b-934a-7873-a27e-2cbd01d10e59.jsonl, updated_at=2026-07-22T05:14:22+00:00, thread_id=019f883b-934a-7873-a27e-2cbd01d10e59, newest time-specific Nuvo state)
- rollout_summaries/2026-07-20T05-11-23-WXnt-organization_wide_orchestration_drift_audit_nuvo_coachai.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\20\rollout-2026-07-20T09-11-30-019f7def-9cb1-7251-8a70-b811b8e96cdb.jsonl, updated_at=2026-07-20T05:14:45+00:00, thread_id=019f7def-9cb1-7251-8a70-b811b8e96cdb, iterative cross-repo audit)

### keywords

- git fetch --prune origin, fix/integration-suite-repairs, 14 ahead/21 behind, 13 worktrees, 26 unregistered ahead branches, PR #251, issue #250, agent:state, gate:rules-wiring, Sprint 1.3, Sprint 1.4, classification-only

## Task 7: Read-only organization orchestration drift audit on 2026-07-23, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-23T05-11-46-z9yL-organization_orchestration_drift_audit_2026_07_23.md (cwd=\\?\${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\23\rollout-2026-07-23T09-11-51-019f8d63-0b86-76a0-ac4f-fe8d694ea6e7.jsonl, updated_at=2026-07-23T05:15:33+00:00, thread_id=019f8d63-0b86-76a0-ac4f-fe8d694ea6e7, newest time-specific Nuvo evidence from cross-repo audit)

### keywords

- organization orchestration drift, fix/integration-suite-repairs, 14 ahead/23 behind, 19 worktrees, 28 unregistered ahead branches, PR #251, Project #7, M01-M03, agent:state, gate:rules-wiring, gate:agent-context, DB integration, approved-to-built parity, classification-only

## Task 8: Read-only cross-repository orchestration drift audit on 2026-07-24, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-24T05-10-07-Haxp-cross_repo_orchestration_drift_audit_nuvo_coachai_2026_07_24.md (cwd=\\?\${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\24\rollout-2026-07-24T09-10-12-019f9287-e51d-76c3-b4b8-c9e551a423a7.jsonl, updated_at=2026-07-24T05:13:29+00:00, thread_id=019f9287-e51d-76c3-b4b8-c9e551a423a7, newest time-specific Nuvo evidence from cross-repo audit)

### keywords

- read-only organization-wide orchestration drift audit, fix/integration-suite-repairs, 14 ahead/23 behind, 19 worktrees, 28 unregistered ahead branches, PR #251, issue #250, Project #7, M01-M03, gate:agent-context, gate:decision-sprint-linkage, gate:project-ledger-drift, gate:agent-control-plane, gate:organization-overlay, approved-to-built parity, classification-only

## User preferences

- when the user asks for a "Read-only Auxara Dialer orchestration drift report" and says "Do not edit files, create branches, commit, push, open or modify issues/PRs, merge, deploy, publish, delete, purchase, mutate production, or send external messages" -> stay evidence-only and avoid mutation until the user later authorizes it [Task 1][Task 2]
- when the user asks to "Report only evidence-backed discrepancies, blockers, stale handoffs, orphaned branches/worktrees, and exact next actions" -> keep the audit tightly grounded in live git/GitHub/rules evidence rather than narrative recap [Task 1][Task 2]
- when a read-only audit prohibits edits -> do not patch automation memory either; automation state is part of the no-edit boundary [Task 4]
- when the user requires classification-only handling of active work -> do not clean, delete, rebase, or mutate branches/worktrees; report owner/PR/retirement classification needs instead [Task 5]
- when the user asks to inspect both repos and deduplicate findings across them -> report by project with comparative evidence, not raw tool spam [Task 8]
- when the user later asks what "has already been merged and what should have been merged but hasnt, and clean them and bring local main up to date" -> identify merge state first, then clean only after verification [Task 3]
- when cleanup touches local residue, preserve unrelated dirty work on a WIP branch instead of sacrificing it to fast-forward `main` [Task 3]

## Reusable knowledge

- The highest-signal repo-state checks here were `git worktree list --porcelain`, `git rev-list --left-right --count main...origin/main`, `gh pr list`, `gh issue list`, `gate:rules-wiring`, and later `npm run agent:state -- --github`; use the raw git/gh commands even when `agent:state` exists [Task 1][Task 2][Task 3]
- `npm run agent:state -- --github` is useful for git/worktree/sprint reporting, but it can hide prune-only nuance; `git worktree list --porcelain` is still required to catch missing or prunable worktrees such as `${WORKSPACE:dev|backslash}\nuvo-dialer-decision-sprint-linkage` [Task 1][Task 2]
- `gate:rules-wiring` passed and confirmed `.claude/rules/*.md` are discoverable from `AGENTS.md`; the durable orchestration doctrine lives in `CLAUDE.md`, `AGENTS.md`, `.claude/rules/*`, and `docs/BUG_BACKLOG.md` [Task 1][Task 2]
- On 2026-07-16, `git -C ${PROJECT:auxara-dialer|backslash} fetch --prune` succeeded and `main` was `0 6` behind/ahead relative to `origin/main`; GitHub had zero open PRs and zero open issues, and `.github/CODEOWNERS` was absent while the PR template, issue template, and CI workflow existed [Task 1]
- Fresh 2026-07-17 state: `npm run agent:state -- --github` reported 9 worktrees, `main` 0 ahead/6 behind `origin/main`, and 5 dirty paths; GitHub still had zero open PRs/issues and no prunable worktrees. Unregistered ahead branches requiring owner handoff or explicit PR/retirement decisions included `codex/orchestration-control-plane-v2`, `codex/s14-b00-foundation`, `codex/s14-b08-proof`, `codex/s14-doc-authority-reconcile`, and `codex/s14-plan-rebase-backup-309373c`; `preview` and `wip/local-main-pre-sync-20260715` must not be cleaned automatically [Task 4]
- On 2026-07-17, `npm run gate:rules-wiring` passed; hooks, CI, the PR template, and the agent-slice issue template existed, while root `CODEOWNERS` and `.githooks` were absent. Sprint 1.3 still lacked rendered/source-to-screen, reconnect, non-member, and stale-presence proof; Sprint 1.4 remained approval-locked; persistent blockers were `PARITY-S13-APPROVED-NOT-BUILT-001`, `RELEASE-VERIFIER-SENTRY-FALLBACK-001`, and `TEST-DB-RLS-PARITY-001` [Task 4]
- Newer 2026-07-21 audit state was `fix/integration-suite-repairs`, dirty with 23 paths and 9 ahead/5 behind `origin/main`; four registered worktrees were present and none prunable. Draft PR #252 was clean and draft PR #251 was DIRTY; both had Vercel success but no review decision. Twenty-one unregistered ahead branches require owner/PR/retirement classification, not deletion; root `.github/CODEOWNERS` remained absent [Task 5]
- `npm run agent:state -- --github` and `npm run gate:rules-wiring` passed on 2026-07-21. Sprint 1.3 still needed rendered/source-to-screen, reconnect, non-member, and stale-presence proof; Sprint 1.4 needed a fresh serialized closure proof for later dirty integration work [Task 5]
- Newest 2026-07-22 state was dirty `fix/integration-suite-repairs`, 14 ahead/21 behind `origin/main`, with 13 registered non-prunable worktrees and 26 unregistered ahead branches. Draft PR #251 was DIRTY with Vercel-only success/no review decision and issue #250 open; `agent:state -- --github` and `gate:rules-wiring` passed. Sprint 1.4 visible UI remained approval-gated and the Sprint 1.3/parity/Sentry-fallback/local-RLS proof gaps remained open. [Task 6]
- Newest 2026-07-23 state was dirty `fix/integration-suite-repairs`, 14 ahead/23 behind `origin/main`, with 19 registered worktrees and 28 unregistered ahead branches requiring owner/PR/retirement classification. Draft PR #251 remained DIRTY with only Vercel success/no review decision and issue #250 open; `agent:state`, `gate:rules-wiring`, and `gate:agent-context` passed. DB integration was not a merge gate; M01-M03 mock hashes were stale/paused, Project #7 had 28 declared-scope drift findings, and approved-to-built parity remained open. [Task 7]
- Newest 2026-07-24 cross-repo evidence kept Nuvo at `fix/integration-suite-repairs`, dirty 21 paths, 14 ahead/23 behind `origin/main`, with `main` 9 behind, 19 registered worktrees, and 28 unregistered ahead branches. Local orchestration coverage now explicitly included `gate:decision-sprint-linkage`, `gate:project-ledger-drift`, `gate:agent-control-plane`, and `gate:organization-overlay`, but `gate:project-ledger-drift` remained offline-only and cannot be used as proof that live Project #7 state is clean. Draft PR #251 stayed DIRTY with only Vercel success/no review decision, and dirty integration work still needs a fresh serialized Sprint 1.4 closure proof. [Task 8]
- `docs/app-plan/implementation/sprints/sprint-1-3.md` still had unchecked rendered-verification and AI edit-rate readiness items, while `sprint-1-4.md` still said `Locked pending decision-surface Approvals` during the 2026-07-16 audit [Task 1]
- The consolidated control-plane work merged as PR `#244` after Vercel passed; the repo gained a durable `agent:state` command and the locked-surface Playwright suite passed `8/8` at `390/768/1024/1440` [Task 3]
- Verification succeeded only after fixing two concrete integration defects: Prettier drift in `scripts/claude-lifecycle-hook.mjs`, and Vitest accidentally collecting `frontend/e2e/locked-surfaces.spec.ts` until `frontend/vite.config.ts` was narrowed to `src/**/*.{test,spec}.{ts,tsx}` [Task 3]
- Safe cleanup required checking each target under `${WORKSPACE:dev|backslash}`, verifying it was not an active worktree and had no dirty status, then deleting stale local branches, stale remote branches, and orphan directories; unrelated dirty `main` work was preserved on `wip/local-main-pre-sync-20260715` at commit `0037f93` before the fast-forward [Task 3]
- The clean-state proof at the end of the main-sync task was `agent:state: main -> origin/main (ahead 0, behind 0); dirty 0`; later 2026-07-16 evidence then surfaced the stale `decision-sprint-linkage` registration and behind-`origin/main` drift as new state, so branch/worktree conclusions from Task 3 must be revalidated live before reuse [Task 1][Task 3]

## Failures and how to do differently

- Symptom: `gh` queries fail with `error: wrong number of arguments, should be from 1 to 2` -> likely cause: the repo argument was passed in the wrong shape -> derive the repo slug once and pass it cleanly to `gh -R` [Task 1]
- Symptom: `npm run agent:state -- --github` is missing or underreports worktree problems -> likely cause: the helper has not landed on the checked-out branch yet, or it omits the `prunable` flag -> derive the live state directly from git/gh and treat `agent:state` as convenience, not authority [Task 1][Task 2]
- Symptom: a long combined verification command times out -> likely cause: the proof chain hides the actual failing step behind a single long-running command -> split verification into focused commands so the first real defect becomes visible [Task 3]
- Symptom: `git worktree remove` times out during cleanup -> likely cause: background deletion is still running for a large worktree -> wait for the removal processes to finish and re-check the worktree registry before acting again [Task 3]
- Symptom: branch deletion fails from malformed shell logic -> likely cause: the deletion command mixed existence checks and destructive steps incorrectly -> check `git show-ref` first, then delete in a separate command path [Task 3]
- Symptom: a read-only sweep modifies `${HOME|backslash}\.codex\automations\auxara-daily-orchestration-drift\memory.md` -> cause: automation memory was treated as outside the audit’s edit prohibition -> fix: make no repository, automation, or external-state writes; emit the evidence-backed report only [Task 4]
- Symptom: a combined cross-repo verification command times out with excessive recursive output -> cause: worktrees/build artifacts were scanned together -> run focused bounded commands per repository and exclude worktrees/build artifacts from recursion [Task 5]
- Symptom: a read-only audit updates automation memory after an unset `$env:CODEX_HOME` lookup -> cause: a missing read path was treated as permission to patch state -> use the explicit path only for read access and report missing/stale memory; never write it without authorization. [Task 6]
- Symptom: static rules/doc gates are treated as operational or merge readiness -> likely cause: local checks, CI status, live-provider proof, and approval-gated visible work were conflated -> report each proof boundary separately. [Task 7]
- Symptom: passing local gates are presented as proof that live Project/PR/mock-handoff drift is resolved -> likely cause: offline authority checks were conflated with live GitHub state -> keep `gate:project-ledger-drift` in the offline bucket and separately report PR status, Project #7 drift, stale M01-M03 hashes, and remaining serialized closure proof gaps. [Task 8]

# Task Group: Nuvo Dialer weather backend BUX-010 review-PR handoff
scope: worktree-bound weather backend handoff, audit-driven remediation, exact verify proof, and review-PR reporting rules for the area-code weather cue slice
applies_to: cwd=${PROJECT:auxara-dialer|backslash}\.claude\worktrees\weather-backend; reuse_rule=reuse for this named worktree or similar Nuvo Dialer worktree-bound PR handoffs where the user specifies an existing worktree, staged slice, and review-only PR flow; treat branch/PR state as checkout-specific and re-check before reuse

## Task 1: Commit the staged weather backend slice inside the named worktree, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-14T07-06-44-CwXU-weather_backend_bux010_review_pr_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}\.claude\worktrees\weather-backend, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\14\rollout-2026-07-14T11-06-49-019f5f73-1325-72c0-89b7-5a984e0d6552.jsonl, updated_at=2026-07-14T08:25:28+00:00, thread_id=019f5f73-1325-72c0-89b7-5a984e0d6552)

### keywords

- BUX-010, feat/weather-weatherapi, existing worktree, git -C, _codex-weather-report.md, shared/dist, cockpit README, 043afee21376271735cc749414fb2a40e2c858b7

## Task 2: Run full verify plus security/doctrine/adversarial audits and remediate until green, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-14T07-06-44-CwXU-weather_backend_bux010_review_pr_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}\.claude\worktrees\weather-backend, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\14\rollout-2026-07-14T11-06-49-019f5f73-1325-72c0-89b7-5a984e0d6552.jsonl, updated_at=2026-07-14T08:25:28+00:00, thread_id=019f5f73-1325-72c0-89b7-5a984e0d6552, verification/audit remediation)

### keywords

- FINAL_VERIFY_EXIT: 0, npm run verify, security audit, doctrine audit, adversarial audit, SET NX EX, Redis fill reservation, Unicode-safe truncation, PENDING_WIRING, WeatherAPI.com

## Task 3: Push branch and open an unmerged review PR with exact reporting fields, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-14T07-06-44-CwXU-weather_backend_bux010_review_pr_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}\.claude\worktrees\weather-backend, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\14\rollout-2026-07-14T11-06-49-019f5f73-1325-72c0-89b7-5a984e0d6552.jsonl, updated_at=2026-07-14T08:25:28+00:00, thread_id=019f5f73-1325-72c0-89b7-5a984e0d6552, PR handoff)

### keywords

- PR 242, mergeStateStatus DIRTY, state OPEN, real verify EXIT, PR URL, head SHA, push exit 0

## Task 4: Base-drift and WeatherAPI activation holds documented for future follow-up, outcome uncertain

### rollout_summary_files

- rollout_summaries/2026-07-14T07-06-44-CwXU-weather_backend_bux010_review_pr_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}\.claude\worktrees\weather-backend, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\14\rollout-2026-07-14T11-06-49-019f5f73-1325-72c0-89b7-5a984e0d6552.jsonl, updated_at=2026-07-14T08:25:28+00:00, thread_id=019f5f73-1325-72c0-89b7-5a984e0d6552, base-drift/activation holds)

### keywords

- WeatherAPI activation hold, conspicuous disclaimer, attribution, ahead 4 behind 8, merge-tree conflict, source-of-truth-map, decision-log, AI_BUILD_JOURNEY_LESSONS

## User preferences

- when the user says "operate ONLY on the EXISTING worktree" and "Use `git -C \"<that worktree>\"` for every git command", treat the named worktree as the only allowed mutation surface and avoid drifting to another checkout [Task 1]
- when the user says "Do NOT merge" and asks for a "REVIEW PR", default to push plus open PR reporting rather than merge [Task 1][Task 3]
- when the user asks for the "real verify EXIT" and warns not to trust a piped status, capture and report the actual exit code from the full verify chain [Task 2]
- when the user asks to report commit SHA, real verify exit, endpoint-wiring `PENDING_WIRING` status, and PR URL, surface those exact fields in the final handoff rather than a generic recap [Task 2][Task 3]

## Reusable knowledge

- The staged weather slice committed cleanly after deleting `_codex-weather-report.md`; the unrelated `frontend/public/explorations/s15-cockpit/README.md` stayed unstaged and untouched throughout [Task 1][Task 4]
- The weather backend remediation that satisfied the auditors added a distributed Redis fill reservation/cooldown via `SET NX EX`, bounded repeated provider attempts after failures, strengthened Unicode/control validation, made truncation code-point-safe, and expanded lease-expiry and hanging-reservation tests [Task 2]
- Endpoint wiring was already satisfied by `frontend/src/lib/api.ts`, so this slice needed no `PENDING_WIRING` row despite being backend-only in product scope [Task 2]
- Final exact-commit proof was `FINAL_VERIFY_EXIT: 0` after the full `npm run verify` chain; focused weather tests also passed, and the security / doctrine / adversarial audits all ended in PASS after remediation [Task 2]
- PR `#242` stayed intentionally open and unmerged, with head `84c72db68ce0aa5767be7eef636b829929d6b1e0` and documented holds for base drift and WeatherAPI activation/disclaimer requirements [Task 3][Task 4]

## Failures and how to do differently

- Symptom: the requested staged handoff stops at the initial commit boundary but verify fails later -> likely cause: older-base drift or real repo assertions were outside the originally staged slice -> fix the true root causes in-repo rather than forcing the handoff to ignore failing verification [Task 1][Task 2]
- Symptom: a cache fix proves null-response behavior but not distributed duplicate-spend prevention -> likely cause: reservation TTL and expiry behavior were under-proven -> derive the lease from provider plus Redis timeout budget and add explicit never-settling and expiry-aware contender tests [Task 2]
- Symptom: a review PR looks merge-ready when it is not -> likely cause: base drift and activation holds were not surfaced explicitly -> disclose merge-tree conflicts, behind/ahead state, and provider activation blockers in the PR body and handoff [Task 3][Task 4]

# Task Group: Nuvo Dialer compliance manual-dial calling-hours confirm-flow investigation
scope: manual dial vs power-dial calling-hours enforcement, confirm-flow runtime tracing, and the precise UI to backend contract for `confirm_needed`
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse for Nuvo Dialer compliance/dial-flow investigations while `frontend/src/pages/comms/ComposeDialog.tsx`, `frontend/src/pages/comms/CommunicationsPage.tsx`, `frontend/src/context/CallProvider.tsx`, `backend/src/routes/calls.ts`, and `backend/src/services/complianceGate.ts` remain the relevant authority paths; re-check tenant config and live auth/session state before treating production repro notes as current truth

## Task 1: Diagnose manual dial calling-hours behavior and confirm the intended contract, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-13T11-07-48-om6R-manual_calling_hours_confirm_flow_investigation.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\13\rollout-2026-07-13T15-07-54-019f5b29-69dc-72f3-aebb-8cae3ee0dfb1.jsonl, updated_at=2026-07-14T08:28:16+00:00, thread_id=019f5b29-69dc-72f3-aebb-8cae3ee0dfb1)

### keywords

- calling-hours, manual dial, click-to-dial, CMP-012, confirm_needed, callingHoursManualMode, complianceGate, CallProvider, ComposeDialog.tsx, login expiry

## User preferences

- when the user asks "why is calling hour gate blocking manual dial?", explain the specific current behavior and whether it is a hard block or an intended confirmation flow, not a generic compliance-policy summary [Task 1]
- when the question is driven by a screenshot or live UI evidence, trace the exact manual-dial path before proposing a code change [Task 1]

## Reusable knowledge

- Manual/click-to-dial uses `callingHoursManualMode` and is not supposed to behave like the power dialer; the default config is `confirm`, not `block` [Task 1]
- `POST /api/calls/dial` accepts `{ prospectId }` for manual targeted-prospect calls and can return `confirm_needed` with `callingHours` details; `frontend/src/pages/comms/CommunicationsPage.tsx` already opens a confirm dialog and re-dials with `callingHoursConfirmed: true` [Task 1]
- `frontend/src/context/CallProvider.tsx` treats `confirm_needed` as a no-call response: it rolls back to idle and hands the response back to the caller instead of fabricating an active call [Task 1]
- The investigation reached the intended contract in code but did not finish a clean production repro because the authenticated session expired and the tab redirected to `/login` [Task 1]

## Failures and how to do differently

- Symptom: manual calling-hours looks like a hard block -> likely cause: the UI is surfacing `confirm_needed` awkwardly or the tenant mode differs from the default -> fix by separating "power hard-block" from manual `confirm` / `block` / `off`, then verify with the actual dial response and current tenant config [Task 1]
- Symptom: a response overstates a manual-dial compliance bug -> likely cause: policy text was trusted without tracing the real compose route, backend dial path, and call-provider state machine -> trace `ComposeDialog.tsx` / `CommunicationsPage.tsx` -> `/api/calls/dial` -> `CallProvider` -> `complianceGate` before answering [Task 1]
- Symptom: production verification stalls or yields generic UI errors instead of a clean proof -> likely cause: the browser session expired or auth health is bad -> re-authenticate first and do not treat `INTERNAL_ERROR` plus signaling timeout noise as proof of a calling-hours bug [Task 1]

# Task Group: Nuvo Dialer Sprint 1.1-1.3 closure audit, local-proof hardening, and honest auditor evidence
scope: proof-driven sprint-close verification, Prisma client drift, local DB/Redis harness reliability, and rules for separating completed auditor evidence from unfinished turns
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse across Nuvo Dialer Sprint 1.1-1.3 closure checks, backend-contract verification, and local integration-proof runs while the repo still uses the same Prisma generation path, `scripts/test-db-up.mjs`, and endpoint-wiring gate patterns; verify live repo state before treating sprint-close blockers as current

## Task 1: Sprint 1.1-1.3 closure audit and remediation review, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-10T18-23-07-12MI-sprint_1_3_backend_closure_audit.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\10\rollout-2026-07-10T22-23-12-019f4d44-dfbd-76a0-8e54-48123156104c.jsonl, updated_at=2026-07-11T14:16:29+00:00, thread_id=019f4d44-dfbd-76a0-8e54-48123156104c)

### keywords

- sprint 1.1, sprint 1.2, sprint 1.3, prisma:generate, backend/src/generated/prisma, scripts/test-db-up.mjs, dialer_app already exists, mock-gated, backend contracts, local integration harness

## Task 2: Auditor and gate findings for sprint closure, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-10T18-23-07-12MI-sprint_1_3_backend_closure_audit.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\10\rollout-2026-07-10T22-23-12-019f4d44-dfbd-76a0-8e54-48123156104c.jsonl, updated_at=2026-07-11T14:16:29+00:00, thread_id=019f4d44-dfbd-76a0-8e54-48123156104c)

### keywords

- run all the auditors, sprint_completion_auditor, loophole_security_auditor, wiring_mock_gate_auditor, endpoint-wiring, structured pending rows, AST-based frontend reference scanning, live Telnyx proof

## User preferences

- when the user asks to "finish sprint 1.3, do all the backend and any work needed" and to "run all the auditors on the code and fix any gaps, bugs, loop holes", treat sprint closure as proof-driven and actively look for loopholes instead of stopping at green unit tests [Task 1][Task 2]
- when the user asks that mock-gated work stay "easily wired" later, preserve backend/contract/DTO completeness even when UI or admin surfaces are intentionally deferred [Task 1]
- when auditor turns do not finish, do not narrate them as proof; preserve only completed auditor verdicts as evidence [Task 2]

## Reusable knowledge

- `backend/prisma/schema.prisma` is the authority; regenerate the client in `backend/src/generated/prisma` with `npm run prisma:generate --workspace=backend` before trusting verification results after schema changes [Task 1]
- `npm run verify` passed after Prisma regeneration and is the repo-wide build/lint/format/typecheck/test/gate chain for this checkout [Task 1][Task 2]
- `scripts/test-db-up.mjs` is the local DB-backed proof harness: it boots disposable Postgres/Redis, creates `dialer_app`, runs backend migrations, seeds RBAC, and then runs backend tests [Task 1]
- The endpoint-wiring gate uses structured pending rows plus AST-based frontend reference scanning, and the repo docs explicitly record some mock-gated/pending surfaces as intentional deferrals [Task 2]
- Sprint 1.1-1.3 was not fully closed even after backend/contracts mostly passed because live-provider proof, trustworthy local DB-backed proof, and remaining mock-gated admin/frontend surfaces still blocked a full end-to-end claim [Task 1][Task 2]

## Failures and how to do differently

- Symptom: DB-backed verification fails with `ERROR: role "dialer_app" already exists` during `npm run test:db:up` -> likely cause: stale anonymous Docker volumes survived container recreation because the harness removed containers without `-v` -> fix by deleting `auxara-testdb` and `auxara-testredis` with volumes and rerunning bootstrap; treat it as a local harness bug, not a product bug [Task 1]
- Symptom: fast gates pass but sprint-close proof is still shaky -> likely cause: local DB/Redis proof never ran cleanly or only mock-gated surfaces were inspected -> do not count DB-backed verification until bootstrap is clean and the targeted suites pass [Task 1][Task 2]
- Symptom: a sprint closure report overstates confidence -> likely cause: incomplete auditor turns were blended with finished evidence -> keep unfinished auditors explicitly incomplete and separate them from the completed `sprint_completion_auditor` verdict [Task 2]

# Task Group: Nuvo Dialer Sprint 1.3 orchestration, endpoint-wiring gate hardening, and fresh handoff rules
scope: shared-team dialer design analysis, scheduler-RLS tenant-enumeration risk, endpoint-wiring parity hardening, and the kind of continuation brief the user wants when Sprint 1.3 work gets noisy
applies_to: cwd=${PROJECT:auxara-dialer|backslash}; reuse_rule=reuse across Nuvo Dialer Sprint 1.3 orchestration, authority or parity gate work, and fresh-thread handoff requests when the checkout still follows the same shared-team dialer and endpoint registry patterns; verify live repo state before treating branch, dirty-file, or unfinished gate details as current

## Task 1: Analyze shared-team dialer / list design before implementation, outcome uncertain

### rollout_summary_files

- rollout_summaries/2026-07-05T12-28-40-mVnu-sprint_13_orchestration_endpoint_gate_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\05\rollout-2026-07-05T16-28-45-019f3240-9182-7c83-aace-efc788d71094.jsonl, updated_at=2026-07-10T18:21:02+00:00, thread_id=019f3240-9182-7c83-aace-efc788d71094)

### keywords

- shared-team power dialer, list can be assigned to pods or teams, two dialers working at the same time, claim pause semantics, podId, assignedUserId, backend/src/services/dialerEngine.ts, backend/prisma/schema.prisma

## Task 2: Audit scheduler RLS tenant enumeration and preserve the real Sprint 1.3 objective, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-05T12-28-40-mVnu-sprint_13_orchestration_endpoint_gate_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\05\rollout-2026-07-05T16-28-45-019f3240-9182-7c83-aace-efc788d71094.jsonl, updated_at=2026-07-10T18:21:02+00:00, thread_id=019f3240-9182-7c83-aace-efc788d71094)

### keywords

- systemSchedules.ts, prisma.tenant.findMany(), forced RLS, tenant enumeration, codex/s13-scheduler-rls-tenant-enumeration, scheduler-rls-fix, agent thread cap, non mock gated sprint 1.3

## Task 3: Harden endpoint-wiring parity gate and canonical route authority, outcome partial

### rollout_summary_files

- rollout_summaries/2026-07-05T12-28-40-mVnu-sprint_13_orchestration_endpoint_gate_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\05\rollout-2026-07-05T16-28-45-019f3240-9182-7c83-aace-efc788d71094.jsonl, updated_at=2026-07-10T18:21:02+00:00, thread_id=019f3240-9182-7c83-aace-efc788d71094)

### keywords

- endpoint wiring gate, PENDING_WIRING, AST member-access scanning, scripts/check-endpoint-wiring.mjs, endpoint-wiring-gate.test.ts, API_ENDPOINTS.conversationDetail, comments strings tests do not count

## Task 4: Produce a fresh-thread Sprint 1.3 handoff without shrinking scope, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-05T12-28-40-mVnu-sprint_13_orchestration_endpoint_gate_handoff.md (cwd=${PROJECT:auxara-dialer|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\05\rollout-2026-07-05T16-28-45-019f3240-9182-7c83-aace-efc788d71094.jsonl, updated_at=2026-07-10T18:21:02+00:00, thread_id=019f3240-9182-7c83-aace-efc788d71094)

### keywords

- give me a fresh handoff, codex/s13-doc-drift-closure, dirty files, delegated worktrees, pending tests, full Sprint 1.3 objective, continuation brief

## User preferences

- when the user describes a target shared-team flow like "the list can be assigned to pods or teams" and "if there are 2 dialers working at the same time", treat it as a product-design request first and reason from shared pool plus concurrency-safe claim/pause semantics, not a narrow UI tweak [Task 1]
- when the user asks "give me a fresh handoff", provide a concrete continuation packet with branch state, dirty files, delegated work, blockers, exact next tests, and scope guardrails instead of a vague recap [Task 2][Task 3][Task 4]
- when continuing Sprint 1.3, preserve the user's stated scope: "finish every non mock gated task in sprint 1.3, build the backends and everything the frontend would need to be wired to" and do not silently redefine success around the last edited files [Task 2][Task 4]

## Reusable knowledge

- Repo docs already encode shared-team power sessions, list ownership XOR, and authority boundaries; `podId` and `assignedUserId` should be treated as XOR-style ownership signals rather than inferring personal ownership from `podId:null` alone [Task 1]
- `backend/src/workers/systemSchedules.ts` is a high-risk tenant-enumeration seam because a plain `prisma.tenant.findMany()` under forced RLS can return zero rows and silently skip per-tenant jobs [Task 2]
- For endpoint-wiring parity, regex over raw source text is too weak; AST member-access scanning is the robust check for `API_ENDPOINTS.<key>`, and frontend tests, comments, string literals, mocks, and stories should not count as user-reachable wiring evidence [Task 3]
- `PENDING_WIRING` should be structured metadata with `reason`, `owner`, `addedAt`, and `decision`, not a free-form string blob that decays into an unlabeled exemption list [Task 3]
- A good fresh-thread handoff should include branch name, dirty files, delegated worktrees or branches, current blockers, exact next tests, and explicit warnings about what still needs live verification [Task 4]

## Failures and how to do differently

- Symptom: a plausible shared-team dialer design gets treated as settled implementation truth -> likely cause: repo docs were mistaken for user-confirmed product decisions -> fix by preserving the user's scenario as a strong requirement candidate while still asking for explicit confirmation before treating the model as final [Task 1]
- Symptom: per-tenant scheduler jobs silently stop running under app-role or forced-RLS execution -> likely cause: tenant enumeration relied on naive `prisma.tenant.findMany()` -> inspect `systemSchedules.ts` first and verify the enumeration path is RLS-safe before debugging downstream job behavior [Task 2]
- Symptom: endpoint-wiring gate passes even though no real frontend wiring exists -> likely cause: comments, strings, or test files satisfied a weak text scan, or pending rows were unstructured -> replace regex scanning with AST member-access detection and require structured `PENDING_WIRING` metadata [Task 3]
- Symptom: a continuation brief loses the real objective after a noisy thread or agent-slot exhaustion -> likely cause: the handoff only summarized recent edits -> fix by restating the full Sprint 1.3 goal and including concrete next commands, pending files, and blockers [Task 2][Task 4]

# Task Group: Nuvora CoachAi Dialpad auto-ingest adapter, deployment, and fail-closed verification
scope: researching a new dialer provider against repo truth, wiring it into the existing ingestion authority, then carrying the slice through merge, Railway deploy, and smoke verification without overstating proof
applies_to: cwd=${PROJECT:coachai|backslash}; reuse_rule=reuse across Nuvora CoachAi dialer-provider integrations and Railway deployment smokes when the repo still routes auto-ingest through the shared dialer ingestion seam; verify live provider contracts, env topology, and stack state before reusing rollout-specific deploy details

## Task 1: Research Dialpad contract and repo ingestion authority before editing, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-07T09-10-39-T44v-dialpad_auto_ingest_adapter_merge_deploy_smoke.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\07\rollout-2026-07-07T13-10-44-019f3bd8-0117-7622-a457-3ed0fd8dda5f.jsonl, updated_at=2026-07-08T05:40:48+00:00, thread_id=019f3bd8-0117-7622-a457-3ed0fd8dda5f)

### keywords

- Dialpad, MightyCall, auto ingest, ingestCall, backend/docs/auto-ingest-api.md, docs/ARCHITECTURE_BLAST_RADIUS.md, dialerTypes.ts, provider adapter, dont guess

## Task 2: Implement Dialpad adapter, webhook ingestion, migration, docs, and frontend wiring, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-07T09-10-39-T44v-dialpad_auto_ingest_adapter_merge_deploy_smoke.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\07\rollout-2026-07-07T13-10-44-019f3bd8-0117-7622-a457-3ed0fd8dda5f.jsonl, updated_at=2026-07-08T05:40:48+00:00, thread_id=019f3bd8-0117-7622-a457-3ed0fd8dda5f)

### keywords

- dialpadAdapter.ts, dialpadWebhookIngest.ts, dialpadWebhookSubscription.ts, DIALPAD_WEBHOOK_SECRET, HS256 JWT, ALLOW_UNSIGNED_DIALPAD_WEBHOOKS, Prisma v7, migration 20260707120000_add_dialpad_dialer_provider

## Task 3: Merge, deploy to paid/internal Railway stacks, and smoke-test signed webhooks, outcome success

### rollout_summary_files

- rollout_summaries/2026-07-07T09-10-39-T44v-dialpad_auto_ingest_adapter_merge_deploy_smoke.md (cwd=${PROJECT:coachai|backslash}, rollout_path=${HOME|backslash}\.codex\sessions\2026\07\07\rollout-2026-07-07T13-10-44-019f3bd8-0117-7622-a457-3ed0fd8dda5f.jsonl, updated_at=2026-07-08T05:40:48+00:00, thread_id=019f3bd8-0117-7622-a457-3ed0fd8dda5f)

### keywords

- Railway, PR 180, 4744abf2, /api/ready, connection_or_mapping_not_found, signed synthetic webhook, paid/internal stacks, DIALPAD_WEBHOOK_ID, DIALPAD_WEBHOOK_HOOK_URL

## User preferences

- when adding an external integration, the user explicitly said: "read rules, docs, memory, then do proper research on how dialpad integration work, its webhook requirements and everything. dont guess." -> treat primary-doc plus repo-truth research as a hard requirement before implementation [Task 1][Task 2]
- when the integration needs credentials or config plumbing, the user said: "i can give you a dialpad API key when you need it, just create its env vars on the env file" -> proactively wire required env keys as part of the slice instead of bouncing config edits back to the user [Task 1][Task 2]
- when the user asks to orchestrate an implementation, default to carrying the slice through PR, merge, deployment, and verification rather than stopping at code changes [Task 3]

## Reusable knowledge

- `backend/src/lib/dialer/ingestCall.ts` is the shared auto-ingest authority, so Dialpad-like providers should feed that seam instead of inventing a new session/finalize path [Task 1]
- `backend/docs/auto-ingest-api.md`, `backend/src/lib/dialer/dialerTypes.ts`, and `backend/src/lib/dialer/mightyCallAdapter.ts` are the fastest repo-truth set for a new dialer-provider integration in this checkout [Task 1]
- Dialpad landed as provider-adapter registration plus webhook ingestion and subscription helpers, while still converging on the existing ingest path and persistence contracts [Task 2]
- Signed webhook verification uses HS256 JWT when `DIALPAD_WEBHOOK_SECRET` is present; unsigned webhooks are only allowed behind explicit local or non-production opt-in via `ALLOW_UNSIGNED_DIALPAD_WEBHOOKS` [Task 2]
- Paid and internal stacks need separate Dialpad webhook URLs, webhook IDs, webhook secrets, and subscription setup; do not treat one stack's webhook ID as reusable on the other [Task 2][Task 3]
- The repo's Prisma v7 setup is brittle for ad hoc raw `PrismaClient` evaluation; use the app-owned Prisma helper (`backend/src/lib/prisma.ts`) and filter mappings through `dialerConnection` instead of probing with improvised inline clients [Task 2][Task 3]
- `railway status` and `railway deployment list --service ... --environment production --json` were enough to discover service topology and confirm deploy success without exposing secrets [Task 3]
- This repo's readiness checks differ by stack: paid `/api/ready` reports database, queue, Redis rate-limit, and R2 storage; internal `/api/ready` reports database, queue, memory rate-limit, and local storage [Task 3]
- A signed synthetic Dialpad webhook that lacks a matching connection should still return `200` with `{"kind":"unmapped","code":"connection_or_mapping_not_found"}`. That is a useful fail-closed receiver smoke when no live connection exists, but it is not end-to-end ingest proof [Task 3]

## Failures and how to do differently

- Symptom: a new dialer-provider slice drifts into a parallel finalize/upload path -> likely cause: the repo's existing ingestion authority was not traced before coding -> fix by reading the blast-radius and auto-ingest docs first and routing the provider into `ingestCall()` [Task 1]
- Symptom: stack setup accidentally reuses the wrong Dialpad webhook ID or secret -> likely cause: local or paid `.env` values were blindly reused across environments -> fix by creating or finding the webhook by URL per target stack and keeping paid/internal IDs separate [Task 2][Task 3]
- Symptom: full recording-download ingestion cannot be truthfully proven after deploy -> likely cause: the production stacks have no live Dialpad connection or mapping -> stop at signed fail-closed webhook smokes and state explicitly that end-to-end ingest remains unproven [Task 2][Task 3]
- Symptom: Railway shell probes fail or return misleading mapping results -> likely cause: ad hoc `PrismaClient` evals or the wrong relation filter bypassed the repo's setup -> use `backend/src/lib/prisma.ts` and query through `dialerConnection` instead [Task 2][Task 3]

# Task Group: Auxara Dialer Sprint 1.3 status, remediation, config authority, closure hardening, and recovery rules
scope: durable Auxara Dialer Sprint 1.3 state, verified config-authority and remediation facts, and the later non-mock closure and recovery-hardening decisions that future orchestrators should preserve
applies_to: cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc; reuse_rule=reuse across Auxara Dialer planning, orchestration, and implementation follow-ups when the task touches Sprint 1.3 state, DLR-016 semantics, teleprompter or battlecard authority, AI disposition handling, or recovery behavior; verify live repo state before treating note-backed implementation details as current code truth

## Task 1: Auxara Sprint 1.3 AI disposition slice merged and deployed, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-auxara-s13-ai-disposition-and-next-slice.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-auxara-s13-ai-disposition-and-next-slice.md, updated_at=2026-07-06T12:05:59, source=ad-hoc-note)

### keywords

- Auxara Dialer, Sprint 1.3, AI disposition, PR #181, PR #182, aaa904126c5ab0fbd969caa43fa6b0c664219905, GET /api/calls/:id/disposition-draft, callback, ai_draft_accepted, ai_draft_edited, DLR-016

## Task 2: Sprint 1.3 docs cleanup landed and teleprompter/battlecard config-authority plan was compacted from root evidence, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-auxara-s13-doc-cleanup-config-authority-plan.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-auxara-s13-doc-cleanup-config-authority-plan.md, updated_at=2026-07-06T12:31:00, source=ad-hoc-note)

### keywords

- Docs PR #183, 6b366d55652ccadd0ab1305b1fdda2c2e3028dc2, PLACEHOLDER_SCRIPT_SECTIONS, PLACEHOLDER_BATTLECARDS, API_ENDPOINTS.battlecardTriggers, API_ENDPOINTS.teleprompterConfigs, validateTeleprompterTree(), AiBattlecardTrigger, TeleprompterConfig, teleprompter config authority

## Task 3: Teleprompter + battlecards backend config-authority slice implemented in a dedicated worktree, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-133905-auxara-s13-config-authority.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-133905-auxara-s13-config-authority.md, updated_at=2026-07-06T13:51:51, source=ad-hoc-note)

### keywords

- ${WORKSPACE:dev|backslash}\NuvoDialer-s13-config-authority, codex/s13-config-authority-backend, GET /api/teleprompter-configs, PUT /api/teleprompter-configs, GET /api/battlecard-triggers, PUT /api/battlecard-triggers, 0029_config_authority_routes, teleprompters.manage, battlecards.manage, FORBIDDEN, INTERNAL_ERROR, teleprompter_configs.list_id

## Task 4: Placeholder retirement, live cockpit authority wiring, and DLR-010 exhaustion semantics clarified, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-auxara-placeholder-authority-retirement.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-auxara-placeholder-authority-retirement.md, updated_at=2026-07-06T19:09:55.3493296Z, source=ad-hoc-note)

### keywords

- PLACEHOLDER_SCRIPT_SECTIONS, PLACEHOLDER_BATTLECARDS, PLACEHOLDER_SMS_ELIGIBILITY, gate:authority-placeholders, CallCard.Script, CallCard.BattlecardStrip, GET /api/tendlc/brand, api.conversations.sendToNumber, canDialList, DLR-010, dialerEngine.next(), dialRuns.reserveNextDispatch(), recycle_min_gap_minutes, max_attempts_per_lead_per_day

## Task 5: Shared-list remediation status tightened around owner reassignment, dial-run routing, and transcript-gated AI drafts, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06T19-38-58-auxara-s13-remediation.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06T19-38-58-auxara-s13-remediation.md, updated_at=2026-07-06T15:39:10.1903734Z, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06T19-29-20-auxara-s13-list-ai-remediation.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06T19-29-20-auxara-s13-list-ai-remediation.md, updated_at=2026-07-06T15:29:29.0357618Z, source=ad-hoc-note)

### keywords

- PATCH /api/lists/:id/owner, lists.manage, DIAL_RUN_REQUIRED, /api/dial-runs, LIST_NOT_DIALABLE, manual {prospectId} dialing, useDialRun, mediaSessionId, claim-next, ENDED webhook, usable transcript text, no transcript text, podId:null

## Task 6: Non-mock-gated Sprint 1.3 closure hardened queue, snapshot, and disposition-save authority, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-08T08-15-00-s13-non-mock-closure.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-08T08-15-00-s13-non-mock-closure.md, updated_at=2026-07-08T08:15:00, source=ad-hoc-note)

### keywords

- codex/s13-non-mock-closure, PR #202, enqueueDispositionDraftForCall, THRESHOLDS.ai.dispositionDraftEnqueueTimeoutMs, Queue.add, viewer-aware snapshots, claim-next, source:'system', disposition-save-route.test.ts, gate:test-intent

## Task 7: Sprint 1.3 recovery hardening locked DLR-016 state repair and Redis-parallel test rules, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-08T09-41-17-s13-recovery-hardening.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-08T09-41-17-s13-recovery-hardening.md, updated_at=2026-07-08T09:41:17, source=ad-hoc-note)

### keywords

- codex/s13-recovery-hardening, appendCallEvent, DLR-016 recovery, team_power, runId, indeterminate, Telnyx call-status lookup, command_id, Redis parallel suite, getDelayedCount(), gate:tx-rollback

## User preferences

- when Sprint 1.3 list ownership comes up, Amin corrected: "A list must be assigned to exactly one target: either a team/pod OR an individual dialer." -> model future DLR-016 ownership work as XOR `pod_id` vs `assigned_user_id`, and do not treat `podId:null` as a personal list [Task 3][Task 5]
- when auditing or remediating a workflow, ask "how does the user do this?" and verify create/assign, discover, act, recover, and later change paths instead of stopping at API/schema existence [Task 4]

## Reusable knowledge

- Current validated Sprint 1.3 state: AI disposition is done and deployed; backend config authority is live; the old cockpit placeholders are retired; shared-list remediation wires manager reassignment, dial-run-only team routes, and the DLR-016 booker claim path; later closure notes tightened queue, snapshot, disposition-save, and recovery behavior [Task 1][Task 3][Task 4][Task 5][Task 6][Task 7]
- The docs cleanup note marked `PLACEHOLDER_SCRIPT_SECTIONS` and `PLACEHOLDER_BATTLECARDS` as non-authoritative placeholders before the backend reads landed, and the later retirement note says those live placeholders plus `PLACEHOLDER_SMS_ELIGIBILITY` are now retired behind `gate:authority-placeholders` [Task 2][Task 4]
- Before the backend slice landed, the compact verified plan from root evidence was: `API_ENDPOINTS.battlecardTriggers` and `API_ENDPOINTS.teleprompterConfigs` already existed, `AiBattlecardTrigger` and `TeleprompterConfig` already existed, `validateTeleprompterTree()` already existed and was tested, but backend routes/services were not mounted and permission keys for teleprompter/battlecard config were missing [Task 2]
- The backend config-authority slice in `${WORKSPACE:dev|backslash}\NuvoDialer-s13-config-authority` added shared DTO and zod contracts, `GET/PUT /api/teleprompter-configs`, `GET/PUT /api/battlecard-triggers`, validation-first service authorities, migration `0029_config_authority_routes`, and RBAC seeds for `teleprompters.manage` plus `battlecards.manage` [Task 3]
- Teleprompter reads are object-scoped: a manager with `teleprompters.manage` can preview broadly, but a booker with `calls.dial/self` can only read a list-specific config when their concrete `dial_runs.operate/manage` grant covers that list's pod; same-tenant other-pod probes should return `FORBIDDEN` before fallback leaks script state [Task 3]
- Battlecard reads re-validate persisted JSON before mapping to DTOs; corrupt active JSON should fail closed with `INTERNAL_ERROR` instead of coming back as a fake-valid battlecard [Task 3]
- Persistence landmine: `teleprompter_configs.list_id` should cascade on hard-deleted never-dialed lists. Do not switch this to `ON DELETE SET NULL`, because that can silently promote a list-specific override into tenant-default scope and collide with the active-default unique key [Task 3]
- Verification evidence for the backend slice was stronger than a targeted unit pass: `npm run test:db:up` rebuilt local Docker Postgres and Redis and applied migration 0029 from zero, focused contract plus DB-backed route tests passed, `npm test` passed with 88 test files and 735 tests, and `npm run verify` exited 0 with only pre-existing WARN-class gates [Task 3]
- Teleprompter script now reads `GET /api/teleprompter-configs` through `frontend/src/lib/api.ts` and renders in `CallCard.Script`; battlecards now read `GET /api/battlecard-triggers` in `CallCard.BattlecardStrip`; Companion SMS entitlement reads `GET /api/tendlc/brand`, and raw-number text sends through `api.conversations.sendToNumber` into a contactless conversation [Task 4]
- Teleprompter reads for an individual-owned list must use the same list-access authority as dialing (`canDialList`), not a team-only check [Task 4]
- DLR-010 exhaustion is calculated by backend queue authorities, not by the frontend or a user toggle. Solo dialing uses `dialerEngine.next()` and `dial()`; shared team runs use `dialRuns.reserveNextDispatch()` and distinguish `waiting` from `exhausted`. Active dispatches, defer, recycle gap, and daily-attempt cap are waiting states, not exhausted [Task 4]
- The exhaustion policy knobs are list fields `recycle_min_gap_minutes` and `max_attempts_per_lead_per_day`; there is no "disable exhaustion" switch [Task 4]
- List ownership is operationally movable, not creation-only: `PATCH /api/lists/:id/owner` supports individual -> team and team -> individual when the caller has object-scope `lists.manage` over source and target, while regular agents cannot delegate team lists [Task 5]
- Reassignment preserves the same list, prospect, and call history, and any active shared run stops accepting new claims while active calls and wrap-up drain before the run finalizes [Task 5]
- Team-owned active lists are not allowed through legacy solo queue routes: `/api/calls/dial`, `/api/calls/next`, and `/api/calls/up-next` return `DIAL_RUN_REQUIRED`; team dialing goes through `/api/dial-runs` [Task 5]
- Manual `{prospectId}` dialing is a human-selected action that intentionally bypasses queue completion and exhaustion status, but archived lists still block manual prospect dial; archived-list import returns `LIST_NOT_DIALABLE`, and exhausted lists reactivate to `active` only when an import adds new live rows [Task 5]
- DLR-016 booker path is wired: `useDialRun` joins active runs, heartbeats the server-minted `mediaSessionId`, and `SoftphonePage` calls `claim-next` only when the current operator is Ready, online, idle, and on shift. A single Ready and online participant can claim even if every other teammate is offline or unavailable [Task 5]
- Legacy solo read-ahead and up-next calls are suppressed in team mode so the shared coordinator remains the only queue authority [Task 5]
- AI disposition draft enqueue authority is the accepted Telnyx `ENDED` webhook path, but the worker requires usable transcript text before any provider call. Answered call events are lifecycle evidence only, not semantic grounding; no transcript text means no draft, no metered AI call, and manual wrap-up [Task 5]
- `enqueueDispositionDraftForCall` is now timeout-bounded by `THRESHOLDS.ai.dispositionDraftEnqueueTimeoutMs`, so a Redis or BullMQ `Queue.add` hang logs an AI draft enqueue failure instead of freezing ENDED webhook handling [Task 6]
- Shared DLR-016 snapshots are viewer-aware: teammates can see safe capacity and work-state data, but another operator's `callId` and `prospectId` are redacted to `null`; only the assigned viewer sees their own IDs, while `claim-next` remains the full `call` and `prospect` DTO path [Task 6]
- Client or API submitted `source:'system'` on disposition save is downgraded to `agent`; `system` remains reserved for deterministic auto-disposition writers [Task 6]
- The recovery worker is state-repair only: it enumerates running dial runs, re-enqueues notify-only wakes, cancels stale pre-provider `team_power` dispatch claims without provider evidence, marks provider-ambiguous claims `indeterminate`, and recovers indeterminate calls only from existing terminal projection evidence or conclusive Telnyx call-status lookup using call-control IDs. It must not reserve, dial, or create replacement dispatches [Task 7]
- Shared `appendCallEvent` is the single append, dedupe, and collision-repair helper for both Telnyx webhooks and provider-status recovery, and Telnyx `command_id` remains idempotency and duplicate-detection evidence only, not status-lookup authority [Task 7]
- Recovery repair intentionally narrows stale-dispatch handling to `OutboundDispatchKind.team_power` rows with a non-null `runId`; manual prospect and raw dispatches are outside DLR-016 recovery [Task 7]
- Redis-backed full-suite tests run in parallel, so cross-request counter assertions and queue-count assertions are racy. Observe the middleware-generated key inside the test process, and filter wake-queue checks by deterministic job ID instead of `getDelayedCount()` on the shared queue [Task 7]
- Later verification evidence: the non-mock closure passed 31 targeted DB-backed tests and then full `npm run verify` after the `gate:test-intent` header fix; the recovery-hardening slice also passed `npm run verify` with local Docker Postgres and Redis, with only the pre-existing warn-only `gate:tx-rollback` output remaining [Task 6][Task 7]

## Failures and how to do differently

- Symptom: a planner lane is blocking progress on teleprompter and battlecards config authority -> likely cause: waiting on read-only planner subagents that already timed out -> fix by using the compact verified root-evidence plan directly and do not wait for those interrupted planner threads [Task 2]
- Symptom: frontend or docs still route live users through placeholder script, battlecard, or SMS-eligibility paths after backend authority exists -> likely cause: the old placeholder surfaces were not retired in the same slice -> fix by deleting or demoting `PLACEHOLDER_SCRIPT_SECTIONS`, `PLACEHOLDER_BATTLECARDS`, and `PLACEHOLDER_SMS_ELIGIBILITY` and keeping `gate:authority-placeholders` green [Task 4]
- Symptom: a list-specific teleprompter override suddenly behaves like a tenant default after cleanup -> likely cause: `list_id` was nulled instead of deleted -> fix by preserving cascade delete behavior and guarding the active-scope uniqueness model [Task 3]
- Symptom: same-tenant users can infer script state for pods they do not operate -> likely cause: read fallback happens before object-scope denial -> fix by enforcing the `FORBIDDEN` path before any fallback lookup [Task 3]
- Symptom: an individual-owned list can dial but cannot read its teleprompter config -> likely cause: teleprompter reads were checked with team-only authority -> fix by reusing `canDialList` for the read path [Task 4]
- Symptom: the UI or planner treats a temporarily blocked queue as exhausted -> likely cause: exhaustion was computed from frontend assumptions or a toggle instead of backend queue authorities -> fix by using the backend `waiting` vs `exhausted` semantics and the real list policy knobs [Task 4]
- Symptom: team-owned active lists fail through legacy solo routes -> likely cause: the client is still calling `/api/calls/dial`, `/api/calls/next`, or `/api/calls/up-next` -> fix by routing team dialing through `/api/dial-runs` and treating `DIAL_RUN_REQUIRED` as the intentional guardrail [Task 5]
- Symptom: AI disposition drafts appear without transcript evidence or from raw call events -> likely cause: event-log lifecycle data was treated as semantic grounding -> fix by keeping the `ENDED` webhook as enqueue authority but requiring usable transcript text before any provider call, and do not reintroduce event-log fallback [Task 5]
- Symptom: ENDED webhook handling can freeze when BullMQ or Redis stalls during queue add -> likely cause: `enqueueDispositionDraftForCall` had no timeout bound around `Queue.add` -> fix by enforcing `THRESHOLDS.ai.dispositionDraftEnqueueTimeoutMs` and logging enqueue failure instead of hanging the webhook [Task 6]
- Symptom: a shared DLR-016 snapshot leaks another operator's active `callId` or `prospectId` -> likely cause: viewer-aware redaction was skipped -> fix by redacting those fields to `null` for non-assigned viewers while preserving the full claim-next DTO for the assigned operator [Task 6]
- Symptom: callers can persist `source:'system'` through the disposition save API -> likely cause: the route trusted client-submitted authority labels -> fix by downgrading submitted `system` to `agent` and reserving `system` for deterministic auto-disposition writers [Task 6]
- Symptom: recovery logic starts redialing or minting replacement dispatches -> likely cause: the worker was allowed to exceed state-repair authority -> fix by keeping recovery notify-only and evidence-based, never reserve, dial, or create replacement dispatches [Task 7]
- Symptom: provider-status recovery or tests rely on Telnyx `command_id` as lookup authority -> likely cause: duplicate-detection evidence was confused with status authority -> fix by treating `command_id` as idempotency evidence only and using call-control IDs plus conclusive status evidence for recovery [Task 7]
- Symptom: Redis-backed full-suite tests flake on counter totals or delayed-job counts -> likely cause: parallel test files share Redis and external key deletion makes count-based assertions racy -> fix by observing the generated rate-limit key in-process and filtering wake-queue assertions by deterministic job ID instead of `getDelayedCount()` [Task 7]

# Task Group: Auxara Dialer orchestration posture and frontend mockup threshold
scope: durable Auxara operating rules for orchestrator-mode sessions, subagent and tool autonomy, and when frontend work may proceed without a fresh mock approval
applies_to: cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc; reuse_rule=reuse across Auxara Dialer orchestration and frontend-slice planning when the session is explicitly acting as orchestrator or deciding whether mock approval is blocking

## Task 1: Orchestrator-mode posture, micro-fix exception, and standing subagent permission clarified, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-153028-orchestrator-microfix-rule.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-153028-orchestrator-microfix-rule.md, updated_at=2026-07-06T15:30:35, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06-153005-orchestrator-microfix-rule.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-153005-orchestrator-microfix-rule.md, updated_at=2026-07-06T15:30:11, source=ad-hoc-note)

### keywords

- orchestrator mode, micro-fix, role drift, audit scope dispatch verify merge, subagents, auditors, standing permission, small low-risk non-visual fix

## Task 2: Frontend mockup threshold rule for small additions vs visual redesign work documented, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-07-06-frontend-mockup-threshold-rule.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06-frontend-mockup-threshold-rule.md, updated_at=2026-07-06T16:20:06, source=ad-hoc-note)
- extensions/ad_hoc/notes/2026-07-06T19-29-20-auxara-s13-list-ai-remediation.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-07-06T19-29-20-auxara-s13-list-ai-remediation.md, updated_at=2026-07-06T15:29:29.0357618Z, source=ad-hoc-note, follow-up reinforcement)

### keywords

- frontend mockup approval, foundation mock, existing design system, small addition, already-made primitive, full page design, new visual composition, human visual judgment

## User preferences

- when Amin says the session is the orchestrator, keep orchestrator posture by default: audit, scope, dispatch, verify, and merge or release through the agent fleet; do not drift into implementer mode without saying so first [Task 1]
- if a wiring gap or implementation fix is genuinely small, low-risk, non-visual, and fast, Codex may do it directly, but must say that explicitly first so it reads as an intentional micro-implementation rather than role drift [Task 1]
- Amin gave standing permission to spawn subagents, auditors, and tooling whenever useful without a new explicit ask each time [Task 1]
- for frontend work, if the foundation mock is already approved or built and the change is only a small addition using an already-made primitive, Codex may implement without a fresh mockup approval; for a full page design, multiple item placements, a new visual composition, or anything needing human visual judgment, make mock approval blocking before coding [Task 2]

## Reusable knowledge

- The orchestrator exception is narrow by design: small, low-risk, non-visual, fast micro-fixes can be done directly, but larger work, unclear scope, frontend-visible work, or anything needing design or product judgment should still be dispatched or paused for the normal orchestration flow [Task 1][Task 2]
- Standing subagent and tool permission reduces unnecessary confirmation loops in Auxara sessions; the important behavior change is to use that autonomy while still announcing when the orchestrator is personally doing the fix [Task 1]

## Failures and how to do differently

- Symptom: Amin may read the session as drifting out of orchestrator mode -> likely cause: the main Codex session started implementing without announcing why it was handling the change directly -> fix by explicitly calling out the micro-fix exception before editing [Task 1]
- Symptom: a frontend implementation creates churn or gets blocked late on visuals -> likely cause: a visually meaningful change was coded without required mock approval -> fix by treating full-page, multi-placement, or new-composition work as mock-gated and only bypass approval for small additions on already-approved primitives [Task 2]

# Task Group: CoachAI standing workflow notes from memory extensions
scope: durable CoachAI operating defaults captured in ad-hoc memory notes; use when the task is a bug hunt, coaching-quality audit, AI or prompt issue, rerun validation, or proof-planning decision
applies_to: cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc; reuse_rule=reuse across similar CoachAI workflows because these notes were explicitly promoted as standing guidance; do not treat them as checkout-specific implementation proof

## Task 1: Reuse the CoachAI spider pass as the default bug-hunt workflow, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-05-14T12-51-12-coachai-spider-pass.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-05-14T12-51-12-coachai-spider-pass.md, updated_at=2026-05-14T08:51:22Z, source=ad-hoc-note)

### keywords

- spider pass, CoachAI bugs, coaching-quality audit, data-integrity, prompt decision, rerun validation, source authority, final user-visible output, sibling layers, docs blast-radius

## Task 2: Reuse the CoachAI prompt-testing ladder for semantic and prompt work, outcome documented

### rollout_summary_files

- extensions/ad_hoc/notes/2026-05-14T12-56-12-prompt-testing-ladder.md (cwd=${HOME|backslash}\.codex\memories\extensions\ad_hoc, rollout_path=${HOME|backslash}\.codex\memories\extensions\ad_hoc\notes\2026-05-14T12-56-12-prompt-testing-ladder.md, updated_at=2026-05-14T08:56:33Z, source=ad-hoc-note)

### keywords

- prompt-testing ladder, static prompt-contract regression, local replay, persisted artifacts, subagent qualitative eval, real app-model rerun, cheapest useful proof, semantic work

## User preferences

- when working on CoachAI bugs, coaching-quality audits, data-integrity concerns, prompt or AI decision problems, rerun validation, or backlog cleanup, the user explicitly asked to make the "spider pass" reusable across future sessions -> trace the earliest wrong decision, search sibling layers for the same pattern, fix upstream, update docs or blast-radius maps, and verify the final user-visible output [Task 1]
- for CoachAI semantic or prompt work, the user confirmed a proof ladder -> start with the cheapest useful proof, then escalate only when needed instead of jumping straight to a live rerun [Task 2]

## Reusable knowledge

- For AI or semantic issues, use a decision matrix plus source-authority contract: AI should make the sales or coaching meaning judgment from grounded evidence, while deterministic code validates grounding, policy, schema, provenance, persistence, and display integrity [Task 1]
- The spider pass should not stop at the first visible symptom; trace source evidence, prompt or decision, validator or repair, persistence, ranking, DTO mapping, UI display, tests, docs, and rerun path before calling the bug local [Task 1]
- The preferred prompt-testing ladder is: static prompt-contract regression, local replay with persisted artifacts, subagent qualitative eval, then a real app-model rerun only when final proof depends on production model or runtime behavior [Task 2]
- Subagent eval is useful for prompt clarity, JSON shape, wrong fields, and decision-matrix rehearsal, but it is not authoritative proof of production generation [Task 2]

## Failures and how to do differently

- Symptom: a fix removes one visible bug but similar failures keep reappearing elsewhere -> likely cause: the investigation stopped at the first symptom instead of checking sibling layers and authority boundaries -> fix by running the full spider pass and updating the guardrails that should prevent recurrence [Task 1]
- Symptom: prompt work burns time or money on live reruns before the contract is even stable -> likely cause: the proof order skipped cheap contract and replay checks -> fix by following the testing ladder and bundling multiple prompt fixes before the authoritative rerun [Task 2]
- Symptom: subagent output looks good but production behavior still fails -> likely cause: the subagent rehearsal was treated as final proof -> fix by using subagent eval to refine the contract, then run the real app-model rerun only if the final question depends on production routing or runtime behavior [Task 2]

# Task Group: CoachAI call audit and one-rerun verification skill
scope: reusable procedure for auditing persisted call artifacts, separating upstream analysis failure from downstream coaching bugs, and proving at most one live rerun when the user explicitly wants it
applies_to: cwd=${HOME|backslash}\.codex\memories\skills\coachai-call-audit-rerun; reuse_rule=reuse for CoachAI session-audit and single-rerun workflows across checkouts that share the same backend artifact model; verify exact service paths before using it outside CoachAI

## Task 1: Audit persisted CoachAI call artifacts before judging coaching quality, outcome documented

### rollout_summary_files

- skills/coachai-call-audit-rerun/SKILL.md (cwd=${HOME|backslash}\.codex\memories\skills\coachai-call-audit-rerun, rollout_path=${HOME|backslash}\.codex\memories\skills\coachai-call-audit-rerun\SKILL.md, updated_at=2026-05-13T10:49:25Z, source=skill)

### keywords

- coachai-call-audit-rerun, analysis_json_main_v1, readSessionAnalysisJson, semanticJudgment.ts, topFixSelection.ts, callReviewMapperRegression.ts, completed_with_feedback, analysis_failed

## Task 2: Use at most one authoritative live Railway rerun when the user wants exact proof, outcome documented

### rollout_summary_files

- skills/coachai-call-audit-rerun/SKILL.md (cwd=${HOME|backslash}\.codex\memories\skills\coachai-call-audit-rerun, rollout_path=${HOME|backslash}\.codex\memories\skills\coachai-call-audit-rerun\SKILL.md, updated_at=2026-05-13T10:49:25Z, source=skill)

### keywords

- one rerun, Railway API, internal admin token, POST /api/analysis/session/:sessionId/rerun, completed_with_feedback, rendered review, stored audio, live proof

## Reusable knowledge

- Start by checking product state before judging coaching quality: inspect `Session`, `AnalysisJob`, transcript presence, and whether `analysis.json` or downstream review artifacts exist so `analysis_failed` sessions are not misread as coaching bugs [Task 1]
- Audit a good completed session deeply rather than skimming many broken ones: compare quote or proof against title, rationale, and keep-doing text separately, and prefer fixing the earliest wrong semantic or mapper decision over patching display copy [Task 1]
- Focused regression entry points for this workflow are `backend/scripts/callReviewMapperRegression.ts` plus semantic-judgment checks and backend build gates [Task 1]
- If the user asks for exactly one rerun, use the live Railway API service context instead of a plain `railway run` shell when stored audio or mounted chunks are required, then poll until the session returns to `completed_with_feedback` and the job is `completed` [Task 2]
- After the rerun, inspect the fresh rendered review and validate title, rationale, and keep-doing separately so a fixed title does not hide generic downstream text [Task 2]

## Failures and how to do differently

- Symptom: the audit appears to show many bad coaching outputs -> likely cause: some uploads never reached transcript or coaching generation -> fix by separating `analysis_failed` from `completed_with_feedback` before auditing coaching quality [Task 1]
- Symptom: `railway run` can read env vars but still cannot rerun against stored audio -> likely cause: the shell context does not mount the API volume -> fix by using the live Railway API service context for the rerun [Task 2]
- Symptom: the proposed fix only patches display text -> likely cause: the wrong behavior was created earlier in semantic judgment or ranking -> fix the earliest wrong decision and keep display validation as a backstop [Task 1]
- Symptom: the title is corrected but the final review still feels generic -> likely cause: rationale or keep-doing text still falls back to broad boilerplate -> verify each rendered surface independently after the rerun [Task 2]
