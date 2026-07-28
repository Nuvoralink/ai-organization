# Nuvora CoachAI — agent router

This is the compact, cross-vendor startup router. It names authorities and tells an agent what to load; it does not duplicate the detailed rules. Claude imports this file through `CLAUDE.md`. Cursor-native rules remain canonical in `.cursor/rules/`. The deterministic organization policy is in `.ai-organization/`.

## Product intent and crown jewels

- CoachAI turns calls and approved coaching material into grounded coaching for reps and managers. AI may judge semantic meaning from evidence; deterministic code owns schema, grounding, policy, provenance, persistence, and bounded repair.
- CoachAI coaches; the human decides. Do not let advice, scoring, patterns, or drills silently become autonomous employment, customer-contact, billing, or account actions.
- Protect tenant isolation, authorization, PII/transcripts/recordings, metered AI/provider calls, source-to-screen authority, and persisted-derived-state lifecycle.
- Verify from code, data, rendered output, and real command exits. A doc, status line, memory, or agent report is a lead, not proof.

## Organization contract

- The main session is the single orchestrator/PM and the only dispatch authority. Do not add another PM agent.
- Every task must pass the structured kickoff and completion contracts in `.ai-organization/`; proof is selected from changed paths and risk. A task cannot close on prose or a generic green status.
- Coordination mode is OBSERVE (`.ai-organization/policies/coordination-mode.v1.json`): tasks created through the lifecycle contracts register their declared `paths.edit` as write-set claims in the shared coordination ledger, while bounded local dispatches use `npm run agent:run -- --timeout-ms <n> --label <task-id> --brief <path> -- <command> ...` so the brief's `edit_paths` register through the same authority; overlapping claims are logged — never blocked. Declare honest, narrow `paths.edit` in every task contract; a task or bounded dispatch with no declared edit paths registers no claim, is counted `skipped_no_editpaths`, and delays enforce readiness.
- The premise-and-architecture challenger is read-only. It asks whether the task should exist, whether the premise is sound, and whether the proposed authority/seam is the durable one. It never dispatches or implements.
- Agents may branch, commit, and open PRs. Push is conditional on live proof that it cannot trigger a preview/production deploy, publish or billed build, production write, or external contact; preview counts as deploy. Conditional merge is permitted only when every condition in `.ai-organization/policies/action-authority.v1.json` is true. Production-affecting push/merge, production/deploy/config/migration mutation, destructive or billed actions, external contact/messages, secrets, and product/design/material-architecture decisions require the human. Branch protection is deferred.
- Frontend is Claude-Design-first and approval-gated. Figma is not an active authority. No visible surface is implemented before the user approves the Claude Design reference.
- Cross-agent truth travels through plans, issues, commits, PRs, decision records, and evidence artifacts—not user copy/paste.

## Start every non-trivial task

1. Read this router and the applicable rules below completely.
2. Validate startup wiring with `npm run gate:agent-context` and `npm run gate:rules-wiring` when routers/rules change.
3. Record a substantive kickoff contract: product outcome, full producer-to-surface blast radius, too-little/too-much boundaries, alternatives, risk class, proof profile, exact paths, and acceptance criteria.
4. For judgment-heavy, destructive, security/billing, or one-way work: produce a read-only plan and settle the decision before implementation.
5. Run the premise challenger before material architecture or unclear-value work. Its result is advice to the orchestrator, not a second command chain.
6. Use an isolated fetched-base worktree for parallel work. Preserve unrelated dirty state. Commit before any tree-touching review and re-check the tree afterward.

## Just-in-time rule routing

Only `agent-product-intent.mdc` and `authority-boundary.mdc` are always loaded. Read every other matching file completely before planning or editing.

| Trigger | Required canonical rule(s) |
| --- | --- |
| Product value, root cause, plan, slice closure | `.cursor/rules/agent-product-intent.mdc`, `.cursor/rules/product-first-planning.mdc`, `.cursor/rules/slice-rigor.mdc` |
| AI or human action authority | `.cursor/rules/authority-boundary.mdc` |
| General implementation / project invariants | `.cursor/rules/coachai-engineering-rules.mdc`, `.cursor/rules/coachai-project-rules.mdc` |
| Shared taxonomy, route, copy, contract, token, threshold | `.cursor/rules/centralization-doctrine.mdc` |
| Analysis/prompt/model output | `.cursor/rules/analysis-pipeline.mdc` |
| Coaching entity or observation lifecycle | `.cursor/rules/coaching-entities.mdc`, `.cursor/rules/coaching-lanes.mdc` |
| Backend TypeScript, Prisma, migration, database | `.cursor/rules/backend-prisma-build-checks.mdc` |
| Tests or verification | `.cursor/rules/testing-guardrails.mdc`, `.cursor/rules/manual-verification-smoke.mdc` |
| Frontend, visible UI, layout, copy-in-context | `.cursor/rules/coachai-frontend-rules.mdc`, `.cursor/rules/ui-design-tokens.mdc` |
| Call review/coaching UI | `.cursor/rules/coaching-frontend.mdc` |
| Manager workflows | `.cursor/rules/manager-surfaces.mdc` |
| Internal admin | `.cursor/rules/internal-admin-full-experience.mdc` |
| Auth, privacy, recordings, provider, billing, secrets | `.cursor/rules/coachai-security-rules.mdc` |
| User-facing route/page/component or analytics | `.cursor/rules/instrumentation.mdc` |

## Fleet and evidence

Role authority and installed-role inventory live in `.ai-organization/roles.json`. Project agent definitions live in `.claude/agents/`; global implementer and security roles are inherited and must not be duplicated locally. Every report names paths not reached and ends with `Doctrine-loop findings: none` or a routed control improvement.

Use the smallest proof profile that fully covers the risk:

- `npm run proof:changed` — changed-path risk selector; required completion authority.
- `npm run gates:all` — static source-of-truth and organization gates.
- `npm run verify` — normal local static verification plus changed-path proof.
- `npm run verify:db` — the single DB-regression authority; CI calls the same command.
- `npm run test:organization-control-plane` — killer mutations for organization gates.

Do not claim deployed behavior from local or CI proof. Merge, deploy, publish, production writes, deletion, purchases, external messages, and other human-gated actions must obey `.ai-organization/policies/action-authority.v1.json`.
