---
paths:
  - "backend/**/*"
  - "frontend/**/*"
  - "shared/**/*"
  - "scripts/**/*"
  - "package*.json"
  - "Dockerfile"
  - "docker-compose*.yml"
---
# Auxara Dialer Engineering Rules

Purpose: keep development consistent, fast, typed, testable, and maintainable across frontend, backend, shared, and any future workspaces.

Before any non-trivial backend, shared-contract, database, security, telephony-integration, billing, upload, queue, storage, deploy, or cross-layer architecture change, read `docs/ARCHITECTURE_BLAST_RADIUS.md` (when populated) and use it to identify connected producers, validators, persistence/read models, API contracts, jobs/scripts, Telnyx event handlers, frontend consumers, docs, and verification gates. If debugging or implementation reveals a missing relationship that caused a miss, update the blast-radius map in the same turn.

When a change creates or modifies persisted derived rows, retry/outbox rows, queue or dispatch rows, cache/projection rows, aggregates, provider evidence rows (Telnyx CDRs, 10DLC vetting status, number-health checks, DNC scrub timestamps, recording-rehoming jobs), or any row that can later act or make a visible claim, do not treat only the "current", "scheduled", or "visible" row as the blast radius. A persisted derived state lifecycle matrix is mandatory when rows can stale, retry, dispatch, display, aggregate, or outlive the source mutation.

That lifecycle matrix must cover every source-of-truth mutation and every applicable existing row state: pending, scheduled/queued, processing/claimed, retryable failed, terminal failed, sent/completed, indeterminate/ambiguous provider result, canceled/skipped, and test-only. For each row, answer: which source authority created it, whether it can still act, what happens when the source changes, what happens when eligibility is revoked (number flagged spam mid-call?), what happens when the parent is archived/deleted, what happens after provider failure if retry remains possible, what happens after terminal evidence exists, whether the row is updated/canceled/skipped/superseded/preserved/ignored, what evidence must never be overwritten, what final surface should show, and which test proves it.

## 1. Core priorities

Optimize for:
1. correctness
2. safety (compliance + tenant isolation)
3. maintainability
4. consistency
5. speed

Do not optimize for short-term convenience if it increases architectural drift.
- Start from the intended user or business outcome (booker speed, manager visibility, tenant compliance posture), not only the literal requested code change.
- Prefer focused changes that improve clarity, trust, usability, or maintainability with real product value; avoid information-dump solutions.
- When fixing bugs, find the root cause and prefer a durable generic fix over a brittle workaround.
- When you discover a real bug that should be fixed but is not being handled in the current task, add it to `docs/BUG_BACKLOG.md` (create on first use) with symptom, suspected/root cause if known, current status, and the validation needed.

## 2. Repo architecture

- Respect workspace boundaries (when scaffolded):
  - `frontend` for web UI (React/TS softphone, manager wallboard, tenant admin)
  - `backend` for API, auth, billing, dialer engine, queue workers
  - `shared` for shared types and contracts
- Do not move logic into a different workspace just because it is faster to patch there.
- Keep web-only code out of backend; shared contracts belong in the shared workspace when both frontend and backend rely on them.

## 3. File responsibilities

- Routes should stay thin.
- Validation belongs in schema modules or explicit validation blocks.
- Business logic belongs in services, domain helpers, dialer-engine modules, or queue workers.
- Pure transformation logic should be separated from HTTP handlers.
- Telnyx event handlers should stay thin too — translate the event, hand off to a domain service.
- Avoid large catch-all files that mix transport, business logic, persistence, and mapping.

## 4. Reuse before create

Before creating a new component, hook, helper, endpoint helper, mapper, or utility:
- search for an existing equivalent
- extend the existing abstraction if it is the same concept
- create a new abstraction only when the concept is genuinely new

Do not create duplicate helpers with slightly different names.

## 5. Type safety

- Prefer strict typing end to end.
- Avoid `any` in production code.
- If `any` is temporarily required, localize it and add a comment explaining why.
- Prefer explicit DTOs and domain types for machine-consumed data.
- Frontend should not rely on loose blobs when stable response shapes can exist.
- Backend should not leak raw persistence models when API DTOs are clearer and safer.

## 6. API contracts

- Keep response shapes stable.
- Additive changes are preferred over breaking changes.
- Do not rename machine-consumed fields casually.
- When changing contracts, update both producer and consumer in the same change.
- Document contract-sensitive changes in code comments when they affect billing, compliance audit, telephony, recording authority, or external CoachAI integration.

## 7. Database and migrations

- Treat Prisma schema changes as product-level changes, not simple refactors.
- Any schema change must consider migration impact, old data, nullable transitions, defaults, multi-tenant RLS impact, and rollback risk.
- Do not assume production data is clean. Per ADR-AUTH-005 (tenant-isolation RLS), every tenant-scoped table has `tenant_id` and Postgres RLS is the backstop.
- Do not change or remove fields used by old calls, saved campaigns, billing history, or stored compliance audit rows without a migration plan.
- **Applying a migration to production:** `.ai-organization/action-authority.json` requires explicit human authorization for every production migration. After authorization, follow `docs/runbooks/prod-migrations.md`, use the credential-safe owner-level method, maintain the `_prisma_migrations` ledger, and perform post-apply verification. Safety checks prove readiness; they do not grant mutation authority.

## 8. Quality gates

No task is complete until the changed code passes the relevant checks for the touched area.

Required by default:
- build must pass
- lint must pass
- typecheck must pass
- no obvious dead code or placeholder logic should remain
- **Local-first verification is the default.** For ordinary implementation work, run `npm run verify` before commit/integration — it mirrors the fast CI job locally (build + lint + format:check + typecheck + test + gates:all). `npm run gates:all` ALONE is NOT enough: it omits lint / format:check / typecheck, which is how a banned `@prisma/client` import + unformatted files reached a RED main CI (2026-06-11). For sprint-close, integration-branch, backend-contract, or release-candidate work, run the local CI-equivalent bundle: `npm run gate:audit`, `npm run verify`, `npm run test:integration`, and `docker build -t auxara-backend:ci .`. GitHub Actions is milestone/main/manual only (`main`, `milestone/**`, `release/**`, or `workflow_dispatch`) and is not the ordinary PR blocker while the product is pre-customer.

Required when touching the dialer engine, number lifecycle, compliance gating, or billing meter:
- run relevant regression scripts
- confirm contract compatibility with existing persisted calls/dispositions/recordings

Required when touching UI behavior:
- verify loading, empty, success, and error states
- update or add stable selectors where needed

## 9. Refactor discipline

- Prefer small, composable refactors over giant rewrites.
- Preserve behavior unless the task explicitly changes behavior.
- When replacing legacy code, remove the dead path instead of leaving confusing no-op shims unless there is a real compatibility need.
- If compatibility code must remain, mark why it exists, whether it may override current product truth, and what condition allows its removal.

## 10. Logging and observability

- Log enough to diagnose issues.
- Do not log secrets, tokens, payment payloads, full transcripts, prospect PII, or call audio paths in unbounded contexts.
- Prefer structured logs for high-value backend operations.
- Add traceability for dialer changes, billing actions, admin actions, and compliance-gate decisions (calling-hours block, DNC hit, recording-disclosure played).
- All paid provider calls must be usage-metered. Telnyx voice/SMS/numbers, transcription (pyannote.ai batch + streaming Whisper live — AI-004; Deepgram rejected), AI providers (OpenAI/Anthropic), and accent add-on (Krisp/Sanas/Tomato.ai) go through metered adapters with stage/role/capability attribution.
- Usage metering metadata is operational only. Never persist raw prompts, transcripts, raw audio, customer content, API keys, auth tokens, secrets, passwords, or payment payloads in usage rows.
- Provider routing for AI features must stay centralized in a single policy module (analog of CoachAI's `aiTierPolicy.ts` + `aiModelPolicy.ts`). Do not add scattered plan checks in prompts, routes, or UI.

## 11. Definition of done

Before finishing a change, confirm:
- checked `docs/ARCHITECTURE_BLAST_RADIUS.md` for connected backend/shared/database/API/job/frontend/deploy surfaces when the change is non-trivial or cross-layer
- updated the blast-radius doc if the work exposed a missing relation
- architecture still makes sense
- no duplicate abstraction was introduced
- types remain coherent
- contracts remain stable
- relevant tests or regressions were considered
- security or privacy impact was considered for data, auth, billing, uploads, recordings, or AI flows
- compliance invariants (STIR/SHAKEN, 10DLC, TCPA/CASL, calling hours, recording disclosure, DNC scrub) are preserved where applicable
- paid provider calls are still routed through metered adapters

## 12. Drift prevention

When in doubt, prefer:
- extending shared types
- reusing existing UI primitives
- keeping route handlers thin
- validating inputs explicitly
- writing code that a future developer can reason about quickly

## 13. Button interaction standard

Every clickable button (or button-like affordance) must inherit a canonical interactive motion (subtle 1px hover-lift, press grounded, smooth color/shadow/transform tween). When the design system exists, this lives in `foundations.motion.interactive`; until then, follow the pattern manually with `transition` + `hover:translate-y-[-1px]` + `active:translate-y-0`.

A `<button>` element without this transition is a bug. Routing through the design-system token (rather than reinventing hover/active classes inline) is what keeps the feel uniform across booker, manager, and admin surfaces.
