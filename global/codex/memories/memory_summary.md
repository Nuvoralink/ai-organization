v1

## User Profile

The user uses Codex across Nuvo Dialer, Nuvora Link, Nuvora CoachAi, Auxara, and an organization control plane. They want repository truth, source-to-screen authority, and explicit proof—not speculation. They expect current docs, rules, memory, and primary external contracts to be read before changes. They prefer concrete handoffs with exact blockers, next tests, and proof gaps. They authorize orchestration with subagents and audits where useful, while expecting strict scope boundaries and honest completion claims. [ad-hoc note]

## User preferences

- For unfamiliar integrations or contracts: “read rules, docs, memory ... dont guess”; use primary docs plus repo truth before editing.
- Fix a manually exposed deployment/process gap with a checked-in gate or runbook and regression coverage.
- For read-only drift reports, use only existing safe gates, report missing gates rather than inventing them, and never write repos, GitHub, worktrees, production, or automation memory.
- For cross-repo read-only audits, compare projects side-by-side and deduplicate findings by project instead of replaying raw tool output.
- In weekly fleet/doctrine reviews, compare both repos, use manifest-allowlisted surfaces, and cap deduplicated recommendations at three high-leverage changes.
- Preserve stated sprint scope and give fresh handoffs with branch state, dirty files, delegated work, blockers, next tests, and guardrails.
- For cleanup, classify each worktree/branch individually; preserve unrelated dirty work before fast-forwarding or deletion.
- For frontend changes, fresh mock approval is blocking unless a foundation mock is approved/built and the change is a small addition using an existing primitive. [ad-hoc note]
- For CoachAI prompt/quality bugs, use the spider pass and cheap-to-expensive proof ladder before a real rerun; at most one authoritative rerun for live proof. [ad-hoc note]
- Before a production database write, obtain explicit confirmation; afterwards prove the persisted schema/data, not just the migration command’s status.
- For Nuvora Link operational follow-ups, preserve “normal telegram notifications and what not” while enforcing “no KPI” / no effect on “anyones show ratio” through a persisted measurement scope.
- For user-visible Nuvora Link changes, preserve per-agent defaults unless deliberately overridden, keep modal actions visible while the body scrolls, and verify requested role extensions both rendered and functionally.

## General Tips

- Use `raw_memories.md` as routing, then open rollout summaries for exact evidence or conflict resolution. Tag extension-derived facts `[ad-hoc note]`.
- Read-only audit core: `git fetch --prune origin`, status/divergence, `git worktree list --porcelain`, PRs/issues, then only named gates. Dirty/ahead state requires retain/PR/retire ownership classification, not automatic cleanup.
- Local orchestration gates and stale handoff docs are not live-state proof; separate offline authority checks from PR/Project/worktree reality.
- Nuvo: `agent:state -- --github` is convenience, not authority; raw porcelain output catches prune-only residue. Railway image parity does not imply per-service env parity.
- CoachAI: resolve repo slug with `gh repo view`; guard unset `$env:CODEX_HOME`; inspect `.claude/settings.json` and `scripts/claude-posttooluse-gate.mjs` directly.
- Control plane: `npm run control:check` is a parity sentinel. Canonical hooks use rooted exec-form `${CLAUDE_PROJECT_DIR}/scripts/...`; malformed/missing PostToolUse `file_path` must exit 2. GitHub comments are not review objects.
- Nuvora Link: clean-worktree builds can reveal missing local package prerequisites masked by `dist`; run `npm run check:workspace-build-contracts`, and use separate Windows npm acceptance commands with independent exit codes.

## What's in Memory

### ${PROJECT:nuvora-link|backslash}

#### 2026-07-25

- Operational-only agent follow-ups and production migration: AppointmentEntryOrigin, MeasurementScope, AgentFollowUpReceipt, 20260725120000_add_agent_operational_follow_ups, DIRECT_DATABASE_URL
  - desc: Search for agent-entered appointment/callback behavior, KPI-exempt operational work, Neon migrations, or production schema proof; cwd=${PROJECT:nuvora-link|backslash}.
  - learnings: Model measurement scope centrally; Neon Prisma migrations require a direct host and explicit production-write confirmation, followed by persisted-object verification.
- Clean Railway Worker build contract: TS2307, @nuvora-link/contracts, prebuild, pretypecheck, check:workspace-build-contracts
  - desc: Use for Worker/API/Web deployment-only TypeScript failures caused by local package build ordering; cwd=${PROJECT:nuvora-link|backslash}.
  - learnings: A stale `packages/contracts/dist` can mask the error locally; clean install/worktree and per-consumer prerequisites are the proof.
- Accounting defaults, analytics KPI presentation, and admin Follow-up: invoice-pricing.ts, PATCH /api/v1/accounting/admin/agent-rate, modal-body, Show, Book/Reach, Follow-up button
  - desc: Server-authoritative Stripe/default-rate handling, modal/analytics presentation, safe worktree cleanup, and the explicitly unfinished admin role extension; cwd=${PROJECT:nuvora-link|backslash}.
  - learnings: Keep agent defaults unless explicitly overridden; KPI order is Show, Book/Reach, Kept/Hr, Reach. The Follow-up extension has no recorded implementation—trace UI and API role gates before claiming it done.

### ${PROJECT:auxara-dialer|backslash}

#### 2026-07-24

- Read-only organization orchestration drift audit: fix/integration-suite-repairs, 14 ahead/23 behind, 19 worktrees, 28 unregistered ahead branches, PR #251, Project #7, gate:agent-context
  - desc: Newest Nuvo evidence-only state audit; search before any branch/worktree decision or any claim that local orchestration coverage means live drift is resolved.
  - learnings: `gate:project-ledger-drift` stayed offline-only, PR #251 remained DIRTY with Vercel-only success/no review decision, and dirty integration work still needed a fresh serialized Sprint 1.4 closure proof.

### ${PROJECT:coachai|backslash}

#### 2026-07-24

- Read-only organization orchestration drift audit: fix/dashboard-header-ambient, 2 ahead/145 behind, 15 worktrees, 50 unregistered ahead branches, PR #221, dialer-db-regressions, gates, SRP-004
  - desc: Newest CoachAI evidence-only state audit; search before any cleanup or claim that orchestration docs or local gates reflect current live repo state.
  - learnings: Classify retain/PR/retire; PR #221 was UNSTABLE with failed `dialer-db-regressions` and `gates`, `.claude/settings.json` still exposed only `PostToolUse`, and `docs/agent-prompts/README.md` remained stale versus live state.

### ${PROJECT:control-plane|backslash}

#### 2026-07-20

- Weekly fleet doctrine review: control:check, bootstrap-orchestrator, rooted exec-form hooks, CLAUDE_PROJECT_DIR, PostToolUse, exit 2, review objects, installed parity
  - desc: Canonical-vs-installed-vs-overlay audit across Nuvo and CoachAI.
  - learnings: Red `control:check` means installed doctrine is stale; rooted hooks, exit-2 malformed payloads, and review objects are reusable hardening checks.

### Older Memory Topics

#### ${PROJECT:auxara-dialer|backslash}

- Sprint 1.4 rebase, deployment parity, and orchestrator handoff: kickoff-goal.md, git range-diff, service-env-contract.json, deployment-config-parity:live, terminalizeNoProviderEffect
  - desc: Authority reconciliation, Railway API/worker env parity, and B01 continuation; cwd=${PROJECT:auxara-dialer|backslash}.
- AI capability audit and portable orchestration control plane: AGENTS.md, CLAUDE.md, TaskCreated, TaskCompleted, mutation receipt, overlay checks
  - desc: Actual Claude/Codex operating-model and controller-owned completion-evidence audit; cwd=${PROJECT:auxara-dialer|backslash} and ${PROJECT:control-plane|backslash}.
- Orchestration drift, consolidation, and main sync: agent:state, git worktree list --porcelain, PR 244, npm run gates:all, wip/local-main-pre-sync-20260715
  - desc: Read-only audit, safe residue cleanup, and local-main sync procedures; cwd=${PROJECT:auxara-dialer|backslash}.
- Worktree cleanup and stale-branch hygiene: git worktree prune, git cherry -v, decision-sprint-linkage, unique commit
  - desc: Folder-by-folder deletion safety and branch-uniqueness checks; cwd=${PROJECT:auxara-dialer|backslash}.
- Weather BUX-010 review handoff: BUX-010, FINAL_VERIFY_EXIT: 0, PENDING_WIRING, PR 242
  - desc: Named weather-backend worktree review/verification handoff; cwd=${PROJECT:auxara-dialer|backslash}\.claude\worktrees\weather-backend.
- Manual-dial calling-hours confirm flow: CMP-012, confirm_needed, callingHoursManualMode, ComposeDialog.tsx
  - desc: UI-to-backend explanation for manual calling-hours behavior; cwd=${PROJECT:auxara-dialer|backslash}.
- Sprint 1.1–1.3 closure and endpoint hardening: prisma:generate, dialer_app already exists, PENDING_WIRING, AST member-access scanning
  - desc: Sprint proof, test-DB, scheduler-RLS, endpoint-gate, and handoff guidance; cwd=${PROJECT:auxara-dialer|backslash}.

#### ${PROJECT:coachai|backslash}

- Earlier orchestration drift audits: gate:preflight-rules, test:doc-code-drift, claude-posttooluse-gate.mjs, authority doc drift
  - desc: Historical safe-gate and wiring evidence; recheck time-specific state in the 2026-07-22 audit; cwd=${PROJECT:coachai|backslash}.
- Sales SOP and coaching guide split: FINAL CALL REVIEW SYSTEM.txt, COACHAI_SALES_AND_COACHING_TECHNIQUES.md, SALES_CALL_SOP_AND_COACHING_GUIDE.md
  - desc: Technical companion plus no-technical-reference manager artifact; cwd=${PROJECT:coachai|backslash}.
- Dialpad auto-ingest adapter and fail-closed verification: ingestCall, dialpadWebhookIngest.ts, DIALPAD_WEBHOOK_SECRET, Railway, PR 180
  - desc: Provider integration authority and honest smoke-proof boundaries; cwd=${PROJECT:coachai|backslash}.

#### ${HOME|backslash}\.codex\memories\extensions\ad_hoc

- Auxara authority, orchestrator posture, and CoachAI spider ladder: DIAL_RUN_REQUIRED, orchestrator mode, frontend mockup approval, spider pass, real app-model rerun
  - desc: Extension-derived operating defaults for Auxara/CoachAI workflows; [ad-hoc note].

#### ${HOME|backslash}\.codex\memories\skills\coachai-call-audit-rerun

- CoachAI call audit and one-rerun verification skill: coachai-call-audit-rerun, analysis_json_main_v1, semanticJudgment.ts, POST /api/analysis/session/:sessionId/rerun
  - desc: Use for separating upstream analysis failure from downstream coaching defects when one live rerun is allowed.
