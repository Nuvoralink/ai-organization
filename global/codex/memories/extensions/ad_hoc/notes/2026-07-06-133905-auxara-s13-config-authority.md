# Auxara Dialer Sprint 1.3 config authority backend state

Date: 2026-07-06

The Sprint 1.3 Teleprompter + Battlecards backend config-authority implementation is in worktree `${WORKSPACE:dev|backslash}\NuvoDialer-s13-config-authority` on branch `codex/s13-config-authority-backend`.

Implemented scope:
- Shared DTO/zod contracts for teleprompter config reads/writes and battlecard trigger reads/replacement.
- Backend routes `GET/PUT /api/teleprompter-configs` and `GET/PUT /api/battlecard-triggers`.
- Service authorities that validate first, archive prior active rows in scope, create new active rows, and audit count/ID metadata only.
- Teleprompter booker reads are object-scoped: a manager with `teleprompters.manage` can preview broadly, but a booker with `calls.dial/self` can read a list-specific config only when their concrete `dial_runs.operate/manage` grant covers that list's pod. Same-tenant other-pod probes return `FORBIDDEN` before fallback can leak script state.
- Battlecard reads re-validate persisted JSON before mapping to DTOs; corrupt active JSON fails closed with the safe `INTERNAL_ERROR` envelope instead of being returned as a fake-valid battlecard.
- Migration `0029_config_authority_routes`: `teleprompter_configs.list_id`, active-scope uniqueness, battlecard lookup index, and live RBAC seed for `teleprompters.manage` plus `battlecards.manage`.
- Docs updated in Sprint 1.3, API/data contracts, source-of-truth map, architecture blast radius, frontend blast radius, glossary, and Journey notes.

Important persistence decision:
- `teleprompter_configs.list_id` cascades on hard-deleted never-dialed lists. Do not use `ON DELETE SET NULL`; that would silently promote a list-specific override into tenant-default scope and can collide with the active-default unique key.

Verification completed:
- `npm run test:db:up` rebuilt local Docker Postgres/Redis and applied migration 0029 from zero.
- Focused contract tests and DB-backed config-authority route tests passed.
- `npm test` passed: 88 test files, 735 tests.
- `npm run verify` exited 0. Existing WARN-class gates remained: softphone fixed-position layout, transaction-return review markers, and local Windows dev-port reservation.

Explicitly not implemented in this slice:
- No frontend/pixel work. Claude/Claude Design is handling shared-run UX/primitives separately.
- No live-ASR auto-pop or paid model call. Phase 1 remains manual assist/config authority only.
- No list individual-ownership correction yet.

Accepted list-ownership correction from Amin:
- A list must be assigned to exactly one target: either a team/pod OR an individual dialer.
- A regular user can assign/import a list to themselves or to a team they are part of.
- A manager can assign to authorized teams or users.
- Current live DB/API only supports `lists.pod_id` plus null/company-wide; do not treat `podId:null` as a personal list.
- Future DLR-016/list-ownership correction should add `lists.assigned_user_id`, enforce XOR with `pod_id`, update shared list DTOs/API, server-side tenant/RBAC/object-scope validation, list discovery/run start, mapper/tests/docs, and frontend UX after mock approval.
