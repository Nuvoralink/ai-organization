# Orchestration Playbook — How Amin Drives Claude Code Sessions

> **Audience:** Amin (the human). The sibling doc `orchestrator-handoff-context.md` is for *agents*; this one
> is the human-side cheat sheet — what to say, how to guide agents, how to stay in control.
> Written 2026-06-11 when the power-user layer landed (custom agents, hooks, allowlist).

---

## 0. The one mental model that explains everything

**Agents have amnesia.** A sub-agent sees ONLY the prompt it's handed — none of the chat, none of what
you said earlier. The orchestrator's whole job is packing everything an agent needs into its brief.
So in practice **you guide the orchestrator in outcomes; the orchestrator guides agents in briefs.**
You almost never need to write an agent prompt yourself — you need to give the orchestrator a clear
target, scope, and constraints, and demand evidence back.

## 1. Session starters

| You say | What happens |
|---|---|
| `Orchestrator mode — run the live-state check and tell me what's next` | `npm run agent:state` + sprint/decision reconciliation; you get local evidence-backed assignments. Use the saved drift workflow when live GitHub reconciliation is also needed. |
| `Continue where we left off — verify state against git first` | Generated git/worktree/GitHub state is opened before any handoff prose is trusted |
| `Plan X before touching anything` (or press **Shift+Tab** into plan mode) | Read-only planning; nothing is edited until you approve the plan |
| `/full-slice-planner <task>` | The heavy planning skill: blast radius, test ladder, DoD |

The compact operating core loads every session. Project state does **not**: it is regenerated, so a stale memory or handoff cannot silently choose the next slice.

## 2. Dispatching the custom agents

The roster lives in `.claude/agents/` (registers at session start):

| Agent | Dispatch phrase | Use for |
|---|---|---|
| `sprint-implementer` | "Use the sprint-implementer on `docs/agent-prompts/sprint-1-0/03-….md`" | One bounded slice, end-to-end, self-reviewed, gates run |
| `adversarial-reviewer` | "Run the adversarial-reviewer on that branch" | Refute-the-done-claim diff review before any merge |
| `compliance-auditor` | "Run the compliance-auditor on the dial path" | ARC-006 tiers, calling hours, DNC, disclosure, audit honesty |
| `cybersecurity-auditor` | "Run the cybersecurity-auditor on backend/src/routes" | Attacker-mindset appsec: auth, CSRF, RLS, PII leaks, abuse |

Modifier words that change execution (combine freely):
- **"in the background"** — chat stays free; results arrive as notifications
- **"in parallel"** / **"each in its own worktree"** — concurrent agents, isolated checkouts (gold-standard #6)
- **"read-only"** / **"don't commit"** / **"stop before X and show me"** — hard brakes
- **"don't touch <files>"** — forbidden-list discipline (gold-standard #5)

## 3. Phrasing requests so they come back right

1. **Outcome, not steps.** "Bookers need the wrap-up to save in one keystroke; the draft is wrong when X" beats "edit aiDispositionDraft.ts line 80". The doctrine (root-cause, blast radius, tests) handles the *how*.
2. **Say the scope you mean.** "just this file" / "repo-wide" / "backend only" / "plan only, don't implement". Unstated scope = the orchestrator picks, and tells you what it picked.
3. **The verbs are routing.** *plan* → plan; *pressure-test* → gap-hunt; *audit* → read-only findings; *mock up* → mockup-first (no production code); *implement* → full slice; *verify* → evidence pass; *review* → adversarial.
4. **Name the artifact.** A brief path, a branch, a commit, a REQ-ID, a doc — every concrete anchor removes a guess.
5. **Batch freely, vague never.** Five clear asks in one message is great (they parallelize). "Make it better" is the only bad prompt shape.

## 4. Steering work in flight

| You say | Effect |
|---|---|
| "Status?" | Board of all running/finished agents |
| "Tell the reviewer to also check X" | Finished/running agents keep their context — follow-ups don't restart them |
| "Stop the <agent/task>" | Halts it |
| **Esc** | Interrupts the orchestrator mid-action |
| "Don't merge anything until I say" | Standing brake |
| "Show me the verbatim output / the actual diff" | Always a fair demand — statuses are leads, outputs are proof |
| "That feels like a workaround" | Triggers a mandatory architecture audit (never a defense of the patch) |

## 5. Approval vocabulary (mockup-first & merges)

- **"Approved"** / **"Approved with changes: …"** / **"Rejected — because …"** — mocks, plans, branches
- **"Go with your recommendations"** — accepts the orchestrator's stated defaults on open micro-decisions
- Silence is never approval; visible frontend work waits on your sign-off, period.

## 6. Scale levers (you control the spend)

| Lever | Trigger | What it buys |
|---|---|---|
| Saved workflow | Enter plan mode first, then `/orchestration-drift-audit` | Bounded read-only-intent scouts + synthesis over live repo/GitHub/rules/docs/backlog state. Plan mode is the tool-permission boundary; prompt text alone is not enforcement. |
| Goal evaluator | `/goal` + a pair from `docs/agent-prompts/goal-templates.md` | Keeps a long slice measured against an explicit outcome after every turn |
| Cloud review | `/code-review ultra` (or `ultra <PR#>`) | Optional billed multi-agent branch review for important milestones — ordinary PRs use local proof first |
| Token target | append **"+500k"**-style budgets to a workflow ask | Scales fleet depth to a hard ceiling |
| Durable schedules | Codex desktop Automations | Read-only daily drift and weekly doctrine/fleet reports that survive a Claude session ending |
| Session schedule | `/schedule` | Ephemeral Claude-session jobs for a milestone window |
| Recurring local | `/loop 5m` with `.claude/loop.md` | Bounded continuation/PR tending; never starts new initiatives or crosses irreversible gates |

Default sessions never use these without your explicit words — they're billed scale.

## 6b. When the orchestrator delegates to Codex vs Claude

Non-frontend, non-user-facing, token-intensive implementation goes to **Codex** in an isolated worktree with an **independent Claude auditor** adversarially reviewing the diff before merge. Frontend/user-facing work stays with Claude: Claude Design creates the mock/reference, the user approves it, then Claude implements and rendered verification checks it. Both vendors' mid-flight choices are governed by `.claude/rules/decision-discipline.md` — research + visible matrix, escalate when uncertain, nothing silent.

Cross-vendor work travels through the issue/PR artifact bus, not through chat memory. Before a write-, shell-, or delegation-capable Claude CLI run, commit or post the complete brief and settled decisions to the referenced issue/PR, then use the canonical user-owned `bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` helper with `--handoff-ref`. The receiving agent reads that live artifact first and verifies its local bootstrap prompt has not drifted from it. Only the exact shell-free diagnostic set `Read,Glob,Grep,WebFetch,WebSearch` may run without a durable reference. Use the same pattern for implementation, mocks, remediation, and independent audit work.

**A bounded local agent never runs through a raw shell call.** A shell timeout reaches the shell, not its descendants — so a reaped parent leaves the real agent alive, still writing into a worktree you believe is idle. On 2026-07-20 two raw `claude -p` delegations survived a 904s parent-shell timeout as PIDs 41880 and 33868; one restored a deleted RCA document and the other edited `.claude/rules/loop-discipline.md` between another agent's staging check and its commit, and both had to be killed by hand. Use the canonical `dispatch-claude-cli.mjs` helper for a bounded Claude CLI run, and default to `npm run agent:run -- --timeout-ms <n> --label <task-id> --brief <path-to-dispatch-brief> -- <command> [args...]` for every other bounded local run that has a brief (or for Claude when that helper is unavailable). `--brief` registers the boundary's `edit_paths` as that dispatch's coordination write-set claim; `--claim-file` is the mutually exclusive compatibility form. Both helpers bound the run and terminate the whole descendant tree; exit `124` means the deadline elapsed and the tree was killed, exit `2` means the tree could NOT be killed and processes may still be running. `gate:bounded-agent` keeps this honest. Launching `claude -p` / `codex exec` / any long-running local command through a bare shell and trusting the tool timeout to stop it is forbidden.

## 7. Harness controls worth knowing

- `/model` (switch model — everything here is model-agnostic; works on Opus 4.8), `/fast` (Opus fast mode)
- `/memory` (edit memories) · `# <rule>` at line start → add to your global rules mid-chat
- `/compact` (summarize long session) · `/clear` (fresh context)
- `/goal` (attach a measurable evaluator) · `claude agents` (Agent View for live agent coordination)
- `/orchestration-drift-audit` (repo-saved control-plane review; enter plan mode before invoking so Claude's read-only enforcement, not prompt wording, supplies the permission boundary)
- `/config` (settings UI) · `/fewer-permission-prompts` (re-tune the allowlist later)
- Hooks + allowlist live in `.claude/settings.json`; gate router is `scripts/claude-posttooluse-gate.mjs`. Both load at session start.

Restart/reclaim controls are live-state controls, not memory. `npm run agent:state` reports every registered worktree's dirty count/hash, lock/prunable state, bounded footprint, and Git-common-dir task attempts without fetching. `npm run agent:worktrees -- audit` is read-only. Reclaim requires `reclaim --path <exact registered path> --retained-ref <integration/base ref>` and refuses current, locked, dirty, prunable, unregistered, missing-proof, or unique/uncontained work. Never point it at a real tree until the report has been independently inspected. After SessionStart/PostCompact or battery loss, reconcile attempts/worktrees before replacement dispatch; unchanged second state is a stall.

For Claude `TaskCreated`, an ENFORCE refusal is decided before lifecycle acceptance: it retains conflict evidence but creates no task attempt and records no replacement fingerprint. Once the conflict is released, re-dispatching the same task id is a valid fresh admission attempt; a stall at that point is a control defect, not proof the refused agent ran.

## 8. The standing quality loop (what the orchestrator does without being asked)

implementer (worktree) → **local CI-equivalent proof when risk warrants** (`gate:audit`, `verify`,
`test:integration`, Docker build) → **adversarial-reviewer** → (compliance/cybersecurity auditor when
the surface warrants) → orchestrator verifies the verdict's evidence → **human-approved merge** → docs/board update.
Ordinary pre-customer PRs use local proof; GitHub Actions is for `main`, important milestone/release
tags, or manual dispatch. Implementer reports are treated as leads, not proof; "done" claims get
re-verified against disk. If you ever see this loop skipped, call it — that's a bug in the orchestration,
not a shortcut.

Two specific loophole checks are now mandatory in that verification, because they bit Sprint 1.3:

- **Workflow loophole check:** ask the feature as a user would use it, not as a diff reviewer would read it.
  Can they choose the owner, change it later, work alone when teammates are offline, recover from empty /
  exhausted / archived states, and avoid duplicating the same list to change workflow?
- **Placeholder retirement check:** when a backend/shared authority exists, the built surface must consume
  it or show an honest loading/empty/error state. Keeping the old fixture as a "temporary fallback" is a
  parallel authority unless the doc explicitly says the visible wiring is still mock-gated.

## 9. Anti-patterns (yours to avoid, mine to refuse)

- Asking an agent to "continue" something it never saw (amnesia — give the artifact, not the memory)
- Accepting "tests pass" without *which tests prove what* (test-intent headers exist for this)
- Approving a mock you haven't opened (the file path is always in the report — open it)
- Letting a session sprawl: one orchestrator chat per work-stream beats one mega-chat for everything
