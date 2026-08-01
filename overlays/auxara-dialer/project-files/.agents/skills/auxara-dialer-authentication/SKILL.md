---
name: auxara-dialer-authentication
description: Implement, audit, or fix authentication and authorization in the Auxara Dialer app. Use for login, signup, logout, password changes/recovery, invite acceptance, workspace selection, JWT cookie/session handling, AuthContext, ProtectedRoute, membership, capability/scope gates, secure route middleware, Prisma auth schema, multi-tenant RLS, or auth browser smoke issues. This app uses Express, Prisma, argon2id (`@node-rs/argon2`) password hashing, stack-bound JWT cookies, signed CSRF, and tenant-scoped helpers; do not apply Supabase/Cloud Backend profiles, getSession patterns, or single-tenant assumptions.
---

# Auxara Dialer Authentication

## Product Intent

Auth in Auxara Dialer protects paid agency tenants (multi-tenant from day one), internal admin tenants, manager/owner/supervisor visibility, agent privacy, **call recordings, transcripts, prospect PII, SMS content, billing, and compliance audit rows**. Frontend auth gates are only UX. The backend is the authority. Postgres RLS is the tenant-isolation backstop, but application code must still be tenant-aware.

When fixing auth, solve the root access-control or session-state problem across the full path: schema, token, backend middleware, authorization helper, API contract, frontend state, route gate, invite/payment/onboarding side effects, RLS predicate, and tests.

## Current Architecture (verify against the named live files before editing)

These paths are implemented authorities, not future scaffolding:

- Frontend auth context: `frontend/src/context/AuthContext.tsx`
- Frontend route guard: `frontend/src/components/ProtectedRoute.tsx`
- API client/session and CSRF handling: `frontend/src/lib/api.ts`
- Frontend provider wrapping: `frontend/src/main.tsx`
- Backend routes: `backend/src/routes/auth.ts`, `backend/src/routes/invites.ts`, and `backend/src/routes/people.ts` (workspace-admin recovery delivery)
- Backend auth middleware: `backend/src/middleware/auth.ts` (sets `app.tenant_id` for RLS after JWT validation)
- JWT mint/verify: `backend/src/lib/jwt.ts`
- Auth and CSRF cookies: `backend/src/lib/authCookies.ts`
- CSRF middleware: `backend/src/middleware/csrf.ts`
- Password hashing: `backend/src/lib/password.ts`
- Identity/membership/recovery services: `backend/src/services/identityMembership.ts`, `backend/src/services/passwordRecovery.ts`, and `backend/src/services/invites.ts`
- Server-side authorization helpers: `backend/src/lib/authorize.ts` and `backend/src/lib/teamMembership.ts`
- Permission registry: `shared/src/taxonomy/permissions.ts`; effective grants resolve fresh from Postgres
- Database source of truth: `backend/prisma/schema.prisma` plus migrations `0078_s15_identity_membership_expand` and guarded `0079_s15_identity_membership_activate`

Backend and frontend completion are separate claims. Email recovery, invite delivery/acceptance, remember-me lifetimes, and zero/one/many workspace selection exist in the backend. The visible login/forgot/reset/workspace-selection/invite interactions remain approval-gated until the product repository proves their current wiring and rendered behavior. Never describe the backend as unimplemented because a page is unwired, and never describe the user flow as shipped because the backend exists.

- **Fail-state:** the skill says auth scaffolding or email reset “has not landed” after the routes/services exist, or tells an agent the full flow is ready while the approved frontend interaction is still unwired.
- **Regression mutation:** restore “until the scaffolding lands” or “not email reset”; the canonical Auxara skill contract test must fail.
- **Counterexample:** an agent may truthfully report “backend implemented; production activation/frontend rendered proof pending” when those proof boundaries remain open.
- **Completion evidence:** inspect the current backend route/service and the actual frontend handler/route before assigning an implementation status.

## Auth Source Of Truth

The browser auth contract is cookie-first with signed CSRF. Bearer auth, if retained, is an explicit non-browser integration compatibility boundary only (API integrations, mobile manager app for listen/barge). Do not reintroduce browser bearer propagation or persistent browser token storage.

## Data Model Truths (current post-0079 authority per doc 08 + DEC-001 + ADR-AUTH-002/010/011)

- `tenants(id, name, plan, billing_status, dialing_hours_default, …)`
- `users(id, email, account_status, auth_token_version, password_hash, …)` — one global identity; retained tenant/lifecycle/pause/E911 scalars are rollback projections only and have no runtime authority
- `tenant_memberships(id, tenant_id, user_id, status, …)` — the only user↔workspace membership/lifecycle authority; retained as historical evidence when removed
- `roles(id, tenant_id?, name, is_system)` — system roles: `owner`, `tenant_admin`, `manager`, `supervisor`, `agent`, `compliance_viewer`, `api_integration`
- `permissions(key PK, description, category)`
- `role_permissions(role_id, permission_key, scope)` where scope ∈ `{self, team, tenant}`
- `user_permissions(tenant_id, user_id, permission_key, scope)` — tenant-scoped one-off grants
- `teams(id, tenant_id, parent_id, name)` — recursive hierarchy
- `role_assignments(id, tenant_id, user_id, role_id, team_id nullable)` — the sole role/scope binding; membership never receives a role column (ADR-AUTH-011; `team_id` NULL = tenant-wide, SET = pod-scoped; supersedes `team_members`)
- `audit_log(id, tenant_id, actor_id, action, target_type, target_id, payload, ts)`

The combination `role × permission × scope` is the authorization source. Effective permissions resolve fresh from Postgres; a future Redis cache may only decorate that read. UI hides forbidden actions using the same set as UX, never authority.

The authenticated workspace context is `(user_id, membership_id, tenant_id, auth_token_version)`. The server revalidates global account state, active membership state, and the membership→tenant relation before setting `app.tenant_id`. A request-controlled tenant id never selects or widens scope. Tenant offboarding changes only membership lifecycle; it must not disable the global identity, delete historical actor evidence, or revoke access to unrelated workspaces.

There is no Supabase `auth.users`, `profiles`, or Cloud Backend dependency in this app.

## Auth Flows (implemented backend behavior; frontend proof called out separately)

### Public Tenant Signup
`POST /api/auth/signup` creates a customer tenant, global owner identity, active membership, and tenant-wide owner role assignment in one transaction; it mints a stack-bound JWT cookie + signed CSRF cookie. Billing/trial provisioning is a separate authority and must not be invented inside auth.

### Internal admin boundary
There is no current `/api/admin/signup` route. ADR-AUTH-004 schedules a deploy-secret-gated bootstrap seed for Sprint 2.0. Do not invent a customer-stack route or claim the deferred seed is implemented.

### Login
`POST /api/auth/login` validates global credentials and account state, verifies the argon2id password hash, and loads active memberships without accepting a client tenant as authority. Avoid production account enumeration. Login must also enforce active stack/tenant-kind compatibility (paid accepts only `CUSTOMER`, internal accepts only `INTERNAL`). The membership count determines the next state:

- Zero active memberships: return one generic unavailable result and mint no workspace session.
- Exactly one: revalidate that membership and mint the normal stack-bound workspace JWT in the httpOnly session cookie.
- Several: mint only a short-lived, purpose-bound httpOnly workspace-selection capability plus signed CSRF. Return the authenticated identity's allowed membership display projection; `POST /api/auth/select-workspace` must revalidate the selected membership against the capability and current database state before rotating cookies and minting a workspace JWT. Never guess a tenant or silently choose the first/last membership.

The workspace JWT contains `user_id`, `membership_id`, `tenant_id`, `auth_token_version`, and standard stack/expiry claims. It contains no role or permission. `tenant_id` is a revalidated RLS bootstrap claim derived from `membership_id`, not an independent authority.

### Logout
`POST /api/auth/logout` is a real server-side session revocation path. It increments the user's `authTokenVersion` so older JWT cookies fail rehydration, then clears the session and CSRF cookies.

### Me / Rehydrate
`GET /api/auth/me` uses `authMiddleware`, rehydrates from the httpOnly workspace-session cookie, checks global `auth_token_version` and account state, revalidates the selected membership and membership→tenant relation, sets `app.tenant_id` for RLS, and resolves the current role/permission set from role assignments. Frontend `AuthProvider` rebuilds session/user state from this; it must not depend on browser-stored bearer tokens.

### Final Mutation Revalidation
Middleware authentication is not sufficient for a state-changing transaction that may wait before its final write. Pass the signed session's expected `authTokenVersion` from `req.auth` into the mutation service with no optional/default value. At the transaction's authorization fence, lock and re-read the actor's current status and `authTokenVersion`, require an exact match, and retain a lock that conflicts with status/version revocation through every later wait and write in that transaction. Acquire actor, permission, object, and policy locks in the repository's declared global order; changing lock strength to fix a deadlock must not reopen the revocation race.

Fail closed before provider work, persistence, or audit creation when the actor is no longer active or the version differs. Prove the condition race, not only a sequential retry: pause the mutation before its actor fence, commit an `authTokenVersion` increment first, release the mutation, and require the route's established 401/403 response plus zero domain writes and zero success audit rows.

- **Fail-state:** middleware accepts signed version N, a concurrent logout/password/session-revocation commits version N+1 while the mutation waits, and the stale request later writes because the service ignored or unlocked current actor state.
- **Regression mutation:** remove either the exact version comparison or the actor lock; the condition-race test must fail by observing a successful stale mutation or persisted side effect.
- **Counterexample:** a read-only route, or a mutation proven not to wait past middleware before its atomic authorization/write boundary, does not add a redundant long-lived actor lock.
- **Completion evidence:** inspect the real HTTP result, domain tables, provider-call spy, and audit rows after the ordered race; a green status without those outputs is insufficient.

### Password
Authenticated change-password and emailed self-service reset are both implemented backend flows. Minimum length is aligned with backend validation. Emailed recovery is identity-global: `password_reset_tokens` binds to `user_id`, contains no `tenant_id`, expires, is single-use, uses generic anti-enumeration responses and rate limits, and is consumed only through narrowly registered auth services. A successful password change or reset increments global `users.auth_token_version` and intentionally revokes every workspace session. The forgot/reset page submission, fragment stripping, and rendered completion remain separate approval-gated frontend proof.

Tenant-admin recovery initiation remains workspace-scoped: authorize the admin through their active membership and role/permission scope, and allow only an eligible target membership in that tenant. The administrator may request the same generic recovery-link delivery and create a workspace audit row, but never sees the token, creates a temporary password, mutates the global credential, or revokes sessions. Only the identity owner changes the password through authenticated self-change or by consuming the emailed one-time token. Removing or suspending one membership never changes the password or disables the global identity.

### Invite Acceptance
Invite acceptance validates the token, rejects accepted/expired invites, creates or reuses the global identity for the invited email, adds the tenant membership and role assignment in the correct tenant, marks the invite accepted, and audits the event in one transaction. It may select only the invite-bound active membership when it establishes session + CSRF cookies. Preserve cross-stack invite-role guards (paid invite cannot land in internal stack).

## Security Rules

- Never trust frontend auth state for authorization.
- Every backend route that reads or mutates tenant-scoped data must use `authMiddleware` and server-side scope helpers.
- Never trust client-supplied `userId`, `targetUserId`, `tenantId`, `numberId`, `listId`, `prospectId`, `callId`, `conversationId`, `appointmentId`, or role fields without checking allowed relationship.
- Use scope helpers (`requireRole`, `requirePermission(key, scope)`, `assertCanReadCall`, `assertCanReadRecording`, `assertCanManageNumber`) for object-level checks.
- Preserve stack-bound JWT audience/issuer behavior.
- Do not log raw JWTs, passwords, reset tokens, invite tokens in bulk, transcripts, recording paths, prospect PII, Telnyx event payloads, or Stripe payloads.
- Keep `JWT_SECRET` required and strong per stack.
- Browser auth is secure httpOnly cookie-first with signed CSRF and allowed Origin/Referer checks.
- AI output must never decide auth, roles, billing, compliance gating, or privacy.

## Frontend Rules

- `AuthProvider` currently owns `user`, `loading`, `login`, `signup`, `logout`, `changePassword`, `refresh`, and UX-only `can`.
- Frontend auth state is session/user state only. The browser session itself lives in the httpOnly cookie.
- `frontend/src/lib/api.ts` attaches `X-CSRF-Token` on unsafe cookie-authenticated requests.
- Do not store browser auth in `localStorage`, `sessionStorage`, or persistent client-side token helpers.
- Do not add normal browser `Authorization: Bearer` propagation.
- 401 responses clear local session/user state and redirect only when appropriate; avoid redirect loops on login/signup/invite pages.
- `ProtectedRoute` is UX only.
- After auth mutations that replace the session cookie or CSRF token, update auth state and refresh from `/api/auth/me`. A pending workspace-selection capability must preserve its own CSRF binding when `/api/auth/me` refreshes the readable token.
- The softphone is a long-lived authenticated surface — token expiry mid-call must be handled gracefully (reconnect, prompt re-auth without dropping the WebRTC leg if possible).

## Implementation Workflow

1. Assess current state:
   - Identify whether the issue is auth identity, session persistence, role derivation, tenant membership, RLS predicate, route authorization, invite/signup flow, billing stack boundary, or frontend UX.
2. Define the ideal product/security behavior:
   - Who should access what?
   - Which tenant/role owns the decision?
   - What should happen on expired token, missing membership, wrong stack, deleted user, stale invite, or cross-tenant probe?
3. Fix upstream:
   - Schema/migration when the source of truth is missing.
   - Backend auth/authorization helper when access logic is duplicated or wrong.
   - RLS predicate when tenant isolation is leaking.
   - API contract when frontend lacks required role/status fields.
   - Frontend state/route UI only after backend authority is correct.
4. Preserve compatibility:
   - Keep additive response changes when possible.
   - Do not break existing paid/internal stack behavior.
5. Verify with targeted tests and smoke:
   - Backend auth route tests or regression scripts for changed behavior.
   - Ordered stale-session mutation race when a state-changing transaction can wait after middleware.
   - Tenant-isolation black-box test for any new route returning object-scope data.
   - A migration that reads FORCE-RLS tables across tenants must require a SUPERUSER/BYPASSRLS
     migrator before its first data read, set `row_security=off` so filtering errors instead of
     silently returning partial data, stabilize every mutable feeder through validation/backfill,
     and include a non-BYPASS migrator test that proves atomic failure before schema change.
   - A staged expand/repoint/contract migration must account for writes arriving after the expand
     snapshot. Choose one explicit bridge: transaction-local compatibility writes with a named
     retirement, or a quiesced/old-instance-drained locked delta catch-up before activation. Prove
     a row created after expand reaches exactly one final membership before the new authorizer runs.
     A genuinely atomic, quiesced deploy is the counterexample; an undocumented gap is not.
   - Frontend auth state/route tests if UI changed.
   - Browser smoke for login/logout/invite when practical.
   - Backend build/typecheck.

## Common Fix Patterns

- Missing tenant membership: do not invent a fake tenant id. Return one generic unavailable result at public login, or the established authenticated `TENANT_MEMBERSHIP_REQUIRED` error where enumeration is not exposed, and repair provisioning.
- Role drift: centralize in `permissions.ts` or `authorize.ts`, not scattered frontend checks.
- Cross-tenant leak: add `assertCanReadX` server-side AND confirm the RLS predicate covers the query (RLS is the backstop, not the only line of defense).
- Invite bugs: validate invite role against active stack and write role membership in the same transaction as user creation.
- Stale frontend session after invite or signup: update auth context from the response, remember the returned CSRF token, then force refresh from `/api/auth/me`.

## Auth Checklist

- Current architecture inspected before editing.
- Global identity, membership lifecycle, and role-assignment authority remain separate; no scalar user tenant/role authority is introduced.
- Zero/one/many membership login and explicit workspace selection are handled without guessing a tenant.
- Backend route has authentication middleware where needed.
- Authorization is server-side, relationship-scoped, and tenant-scoped.
- Role and tenant kind come from the role/permission helpers.
- Stack boundaries are preserved for paid vs internal flows.
- Passwords are hashed with existing password helper.
- JWT secret, issuer, audience, and expiry behavior remain safe.
- Long-waiting mutations carry the signed expected `authTokenVersion` into the service and revalidate locked current actor state before effects.
- Cross-tenant FORCE-RLS migrations prove the migrator can bypass RLS, turn filtered reads into errors,
  lock or otherwise stabilize every validated feeder, and fail atomically under a non-BYPASS role.
- Staged identity migrations name the post-expand arrival bridge, activation order, compatibility
  retirement point, and killer mutation that creates a user after expand but omits it at cutover.
- Cookie, CSRF, and frontend session-state transitions are consistent.
- 401/403 UX is clear and does not loop.
- Invite/signup/admin flows write all required user, tenant, membership, audit, and billing/trial state.
- Browser flows use httpOnly session cookie + signed CSRF; bearer auth is not the browser authority.
- Identity-owner recovery is global and revokes all workspace sessions; tenant-admin recovery initiation is delivery-only and workspace-scoped.
- Sensitive logs avoided.
- Tests/build/smoke run or explicitly reported if blocked.

## Authority-Boundary Regression Contract

- **Fail-state:** a global user row again owns `tenant_id`, `role_id`, or tenant lifecycle, or a membership row becomes a second role/scope authority beside `role_assignments`.
- **Regression mutation:** let a two-membership identity reset its password through a tenant-scoped token, let a tenant administrator create a temporary password or mutate the global credential, or trust/select one tenant during recovery; the recovery-authority and membership-isolation tests must fail.
- **Counterexample:** an administrator authorized inside their active tenant may trigger generic delivery for an eligible target membership and record that tenant audit without receiving the token or changing any identity-global credential/session state.
