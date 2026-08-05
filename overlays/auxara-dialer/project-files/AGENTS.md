# Auxara Dialer — agent router

This file is the shared project entry point for Codex and Claude Code. It stays deliberately lean: hold only the facts needed before any work begins, then load the detailed rule or product authority that matches the task. Read every selected file completely before planning or editing.

## Product and authority

- Do not restate the current ICP, provider, workflow, or phase scope here; those claims change. Read the product authority below for current product truth.
- North star: the dialer informs; the operator decides. Only Tier-1 legal/carrier gates act autonomously. Tier-2 recommendations default to human decision; Tier-3 strategy stays in the CRM/human workflow.
- Product authority: `docs/app-plan/product/01-product-brief.md`, `docs/app-plan/product/02-prd.md`, and `docs/app-plan/product/03-feature-scope.md`.
- Architecture authority: `docs/app-plan/auditability/decision-log.md`, `docs/app-plan/architecture/adr/`, `docs/app-plan/architecture/06-architecture.md`, and `docs/app-plan/data-and-api/08-data-model-and-data-contracts.md`.
- Compliance authority: `docs/app-plan/security/20-compliance-policy-and-review.md` and `.claude/rules/authority-boundary.md`.
- Before non-trivial backend, shared-contract, database, security, telephony, billing, queue, storage, deploy, or cross-layer work, read `docs/ARCHITECTURE_BLAST_RADIUS.md`. For non-trivial frontend work, also read `frontend/docs/FRONTEND_BLAST_RADIUS.md` when present.

## Irreducible invariants

- Verify from code/data/runtime output; docs, status lines, recollection, and agent reports are leads. Tests must name the product behavior and mutation that would make them fail.
- Trace every producer, transformer, persistence boundary, validator, caller, consumer, and user-visible surface. Replace old authority instead of layering a parallel path, then grep the retired symbol repo-wide.
- Prefer the earliest durable root fix. When an oddity appears, stop and verify it before patching. Flag larger connected findings with file, line, impact, and suggested fix.
- Frontend is mockup-first and approval-gated. Claude Design is the design authority. Codex owns backend/non-visual implementation and must not invent or implement unapproved visible UI.
- Browser auth is httpOnly-cookie first; enforce RBAC and tenant scope server-side. Treat external input, uploads, provider payloads, and model output as untrusted. Never log secrets, PII, transcripts, audio, provider payloads, or signed URLs.
- Multi-tenant authority is mandatory: tenant predicates plus RLS backstop. Request-controlled object IDs require object-scope authorization and cross-tenant probes must not reveal existence.
- Product-specific telephony, conversation, and lifecycle contracts live in the named ADRs and data-contract authority; verify them there before relying on them.
- Paid provider calls go through metered adapters. AI owns semantic judgment from grounded evidence; deterministic code validates schema, grounding, policy, persistence, and provenance and feeds failures into bounded field-level repair.
- Persisted derived state requires a lifecycle matrix covering source mutation, eligibility revocation, archive/delete, retry/terminal evidence, visible claims, and proof for every applicable state.
- Documentation and journey learning are part of done. Update `docs/ARCHITECTURE_BLAST_RADIUS.md` when a missing relationship is discovered and `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md` when work reveals a reusable AI-build lesson.

## Just-in-time rule routing

The five compact execution rules imported by `CLAUDE.md` are always active for Claude and must be read by Codex: `.claude/rules/agent-product-intent.md`, `.claude/rules/decision-discipline.md`, `.claude/rules/loop-discipline.md`, `.claude/rules/doctrine-loop.md`, and `.claude/rules/never-reactive.md`.

Load the remaining rule only when its topic/path applies:

| Trigger | Required rule |
| --- | --- |
| Product authority, compliance, autonomy, AI decision boundaries | `.claude/rules/authority-boundary.md`, `.claude/rules/auxara-dialer-project-rules.md` |
| Non-trivial implementation or architecture | `.claude/rules/auxara-dialer-engineering-rules.md`, `.claude/rules/product-first-planning.md` |
| Sprint/epic planning or closure | `.claude/rules/sprint-rigor.md` |
| Any test or verification change | `.claude/rules/test-intent.md`, `.claude/rules/testing-guardrails.md` |
| Registry, taxonomy, route, copy, token, threshold, or shared constant | `.claude/rules/centralization-doctrine.md` |
| Backend TypeScript, Prisma, migration, or database work | `.claude/rules/backend-prisma-build-checks.md` |
| Frontend code, layout, copy-in-context, or rendered behavior | `.claude/rules/auxara-dialer-frontend-rules.md` |
| Auth, RBAC, tenant isolation, billing, uploads, recording, provider, secrets, privacy | `.claude/rules/auxara-dialer-security-rules.md` |
| User-facing route/page/component or analytics | `.claude/rules/instrumentation.md` |
| Internal-admin behavior or permissions | `.claude/rules/internal-admin-full-experience.md` |
| Parallel agent dispatch, worktree/file collisions, or coordination mode | `docs/ARCHITECTURE_BLAST_RADIUS.md` (coordination section) + decision-log `ARC-010` |

## Execution and evidence

- The orchestrator remains the single PM. `.ai-organization/agents.json` is the machine-readable fleet inventory; use `premise-and-architecture-challenger` as a read-only decision-quality lens, never as a second PM.
- `.ai-organization/policies/action-authority.v1.json` is the generated universal action authority. Agents may branch, commit, push, and open or update pull requests inside an authorized task. Conditional merge is permitted only when every canonical low-risk condition is satisfied. Production/deploy/config/migration, destructive, billed, external-message/contact, secrets, and product/design/material-architecture actions remain human-gated. Branch protection is deferred.
- Calibrate before editing: state the exact product outcome, full blast radius, too-little and too-much boundaries, alternatives considered, and acceptance ladder.
- Fully settled slices may be implemented directly. Discovery, judgment-heavy, destructive, security/billing, or one-way decisions require a read-only plan first.
- Every agent brief is self-contained: quoted settled context, exact read/edit/read-only paths, numbered procedure with real exit codes, output contract, boundaries/escalation, acceptance criteria, and completion tier.
- Use isolated fetched-base worktrees and branches for parallel implementation. `main` is a read-only integration target. Preserve unrelated dirty work. Commit before any tree-touching reviewer and verify tree integrity afterward.
- The orchestrator independently opens diffs/artifacts and verifies claims. A green status is a lead; acceptance depends on the named proof profile and actual output.
- Local proof: small work runs relevant gates; implementation work runs `npm run verify`. **`npm run ci` is the COMPLETE merge gate** (`gate:audit` → `verify` → `test:integration` → `docker build`) for sprint-close, integration, backend-contract, and release-candidate work. `gate:local-ci-contract` proves that this aggregate still contains every required lane without depending on a paid remote runner. GitHub-hosted CI is intentionally retired; a PR status is not proof and must not replace the exact local command output. **The DB lane is also a MERGE gate for backend-touching work:** a branch touching `backend/src/**` or `backend/prisma/**` merges only after `npm run test:integration` ran green on its HEAD (orchestrator/test-runner-executed; derive the authored DB-gated test list from the DIFF — `skipIf(!HAS_TEST_DB)` — never from the implementer's flag; DB-LANE-INVISIBLE-COVERAGE-001). The shared local Postgres/Redis pair is protected by an atomic Git-common-dir lease; a lease conflict is a fail-closed coordination result, never permission to remove another worktree's containers. Only the orchestrator may run `npm run test:db:recover`, after proving no DB/test process is active.
- UI proof requires an approved mock/reference and rendered verification at named breakpoints. CI green is not deployed proof; release closure includes deployed readiness, a core-flow smoke, and error-tracker inspection.

If a connected bug cannot be fixed within the authorized slice, add a concrete row to `docs/BUG_BACKLOG.md`. Do not silently defer correctness work.
