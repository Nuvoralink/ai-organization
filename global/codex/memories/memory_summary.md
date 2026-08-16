v1

## User Profile

The user works across Windows PowerShell, Codex/agent workflows, Auxara Dialer, and CoachAI. They value source-to-screen authority, grounded AI decisions, and proof that distinguishes guidance, local verification, and live success. They use an orchestrator model for meaningful Auxara work and allow subagents/tooling without a fresh per-turn ask. For authority audits, they want a clear split between backend implementation and frontend proof. [ad-hoc note]

## User preferences

- For concise setup questions, lead with platform-specific commands and minimal prerequisites.
- In Auxara orchestrator sessions, audit/scope/dispatch/verify by default; announce any genuinely small, low-risk, non-visual direct micro-fix before editing. [ad-hoc note]
- Require fresh mock approval for a full page, new visual composition, multiple placements, or human visual judgment; a small addition using an approved foundation/existing primitive may proceed. [ad-hoc note]
- For CoachAI semantic defects, run the reusable “spider pass” across source, decision, validation, persistence, DTO/UI, tests, docs, and rerun path; fix upstream and verify the final user-visible output. [ad-hoc note]
- Use the “cheapest useful proof first”: static contract, local persisted-artifact replay, subagent rehearsal, then a real app-model rerun only if authoritative runtime proof is needed. [ad-hoc note]
- For RBAC/authority status, use “not built at all, partial built, backend ready frontend owed, fully built” and do not infer frontend completion from backend evidence.
- When asked to pause, save an exact durable checkpoint and wait for explicit resume; do not continue, commit, or push autonomously.

## General Tips

- In Windows Codex setup, use `npm install --global @openai/codex`, then `codex --version`; do not claim success unless it was actually verified.
- Refresh current Codex setup/product guidance with `fetch-codex-manual.mjs` before answering; keep the boundary clear if only indirect Windows evidence is available.
- For AI semantics, AI judges meaning from grounded evidence; deterministic code enforces grounding, policy, schema, provenance, persistence, and display integrity. [ad-hoc note]
- Auxara: enforce one list owner (team/pod xor individual); do not treat `podId:null` or legacy null/null as personal ownership. AI disposition needs usable transcript text, not lifecycle events. [ad-hoc note]
- Historical extension implementation/PR/deployment notes are context, not current-state proof; re-check checkout, branch, and live state. [ad-hoc note]
- For broad Auxara authority investigations, trace capability key + scope and SQL/provider behavior; role names, mocked seams, architecture docs, and static checks are not closure proof.

## What's in Memory

### ${PROJECT:auxara-dialer|backslash}

#### 2026-08-14

- RBAC and phone-number authority paused checkpoint: role_assignments, user_permissions, numbers.buy, NumberProviderOperation.actor, gate:tenant-membership-authority, migration 0092, codex/rbac-number-authority
  - desc: Search first for an authority/status audit, role/team/tenant permission question, 10DLC provider-operation work, or resumption of the paused backend closure.
  - learnings: Backend is materially built but not closed: verify full DB/runtime behavior; resume only from the recorded checkpoint and resolve role/invite, 10DLC, SMS admission, performance, and membership-inventory findings.

### ${HOME|backslash}\Documents\Codex\2026-08-03\ins

#### 2026-08-03

- Codex CLI installation on Windows: @openai/codex, npm install --global, codex --version, fetch-codex-manual.mjs
  - desc: Search first for a concise Windows PowerShell install/update/verification answer.
  - learnings: The npm path was researched but never run; verify PATH and `codex --version` before declaring success.

### ${PROJECT:auxara-dialer|backslash}

#### 2026-07-08

- Sprint 1.3 backend authority and recovery: DLR-016, appendCallEvent, usable transcript text, team_power, teleprompter_configs.list_id
  - desc: Historical config authority, team-run recovery, list ownership, placeholder retirement, and AI disposition boundaries.
  - learnings: Re-check present state; preserve source authority and never use lifecycle events as semantic grounding. [ad-hoc note]

### Older Memory Topics

#### ${PROJECT:auxara-dialer|backslash}

- Orchestrator posture and frontend mock threshold: orchestrator mode, micro-fix, subagents, approved foundation mock, human visual judgment
  - desc: User operating defaults for dispatch versus direct work and when mock approval blocks frontend changes; cwd=${PROJECT:auxara-dialer|backslash}. [ad-hoc note]

#### ${PROJECT:coachai|backslash}

- CoachAI semantic debugging and proof ladder: spider pass, static prompt-contract regression, local replay, subagent qualitative eval, real app-model rerun
  - desc: Use for coaching-quality, prompt/AI decision, data-integrity, rerun, and backlog investigations; cwd=${PROJECT:coachai|backslash}; see skills/coachai-semantic-proof/SKILL.md. [ad-hoc note]
