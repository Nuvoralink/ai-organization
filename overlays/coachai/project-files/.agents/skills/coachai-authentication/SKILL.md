---
name: coachai-authentication
description: Implement, audit, or fix authentication and authorization in the Nuvora CoachAI app. Use for login, signup, logout, password changes, invite acceptance, admin signup, JWT cookie/session handling, AuthContext, ProtectedRoute, org membership, role gates, manager/owner/rep access, secure route middleware, Prisma auth schema, or auth browser smoke issues. This app uses Express, Prisma, bcrypt, stack-bound JWT cookies, signed CSRF, and org membership helpers; do not apply Supabase/Cloud Backend profiles, RLS, or getSession patterns.
---

# CoachAI Authentication

## Product Intent

Auth in Nuvora CoachAI protects paid agency workspaces, internal admin workspaces, manager/owner visibility, rep privacy, call recordings, transcripts, coaching feedback, billing, and playbook control. Frontend auth gates are only UX. The backend is the authority.

When fixing auth, solve the root access-control or session-state problem across the full path: schema, token, backend middleware, authorization helper, API contract, frontend state, route gate, invite/payment/onboarding side effects, and tests.

## Current Architecture

- Frontend auth context: `frontend/src/context/AuthContext.tsx`
- Frontend route guard: `frontend/src/components/ProtectedRoute.tsx`
- API client/session and CSRF handling: `frontend/src/lib/api.ts`
- Frontend provider wrapping: `frontend/src/main.tsx`
- Backend routes: `backend/src/routes/auth.ts` and `backend/src/routes/admin.ts`
- Backend auth middleware: `backend/src/middleware/auth.ts`
- JWT mint/verify: `backend/src/lib/jwt.ts`
- Auth and CSRF cookies: `backend/src/lib/authCookies.ts`
- CSRF middleware: `backend/src/middleware/csrf.ts`
- Password hashing: `backend/src/lib/password.ts`
- Auth context and server-side authorization helpers: `backend/src/lib/authorize.ts`
- Org role semantics: `backend/src/lib/organizationRoles.ts`
- Database source of truth: `backend/prisma/schema.prisma`

Do not create `src/contexts/AuthContext.tsx`; this repo uses singular `frontend/src/context/AuthContext.tsx`.

## Current Auth Source Of Truth

The current browser auth contract is cookie-first with signed CSRF. Before changing auth, read:

- `docs/ACCESS_CONTROL_ARCHITECTURE.md`
- `AGENTS.md`
- `.cursor/rules/coachai-security-rules.mdc`

Bearer auth, if retained, is an explicit non-browser integration compatibility boundary only. Do not reintroduce browser bearer propagation or persistent browser token storage.

## Data Model Truths

- `User` stores email, `passwordHash`, profile fields, legacy `accountType`/`role`, subscription state, onboarding/consent fields, and team relations.
- `Organization` stores tenant scope, billing owner, `tenantKind`, and org-level coaching settings.
- `OrgMembership` is the modern role/scope source of truth. One user has one membership; use `orgId`, `orgRole`, and `tenantKind` for access decisions.
- `OrgRole` values:
  - Customer: `PAID_OWNER`, `PAID_MANAGER`, `PAID_MEMBER`
  - Internal: `INTERNAL_ADMIN`, `INTERNAL_MANAGER`, `INTERNAL_MEMBER`
- `Invite` and invite acceptance create member users and org memberships.
- There is no Supabase `auth.users`, `profiles`, `user_roles`, or Postgres RLS layer in the current app.

## Auth Flows

### Public Customer Signup

`POST /api/auth/signup` is paid-stack only. It validates signup data, hashes the password, creates a `User`, creates a customer `Organization` and owner `OrgMembership`, applies trial/promo metadata, mints a stack-bound JWT cookie, sets a signed `coachai_csrf` cookie, returns `buildAuthUser` plus the CSRF token for frontend memory, and may send welcome email.

Internal stack must not expose public customer signup.

### Admin Signup

`POST /api/admin/signup` is internal-stack/admin-secret gated. Use this for internal tenant creation. Keep admin signup auditable and tightly scoped. Successful bootstrap sets the same browser session cookies as customer auth: `coachai_session` plus signed `coachai_csrf`.

### Login

`POST /api/auth/login` validates credentials, compares bcrypt password, mints a stack-bound JWT in the httpOnly `coachai_session` cookie, sets a signed readable `coachai_csrf` cookie, and returns `buildAuthUser` plus the CSRF token for in-memory frontend use.

Avoid production account enumeration. Prefer generic auth errors unless the product intentionally chooses more specific copy.

### Logout

`POST /api/auth/logout` is a real server-side session revocation path. It increments `User.authTokenVersion` so older JWT cookies fail rehydration, then clears `coachai_session` and `coachai_csrf`. Do not fake logout only in the UI.

### Me/Rehydrate

`GET /api/auth/me` uses `authMiddleware`, rehydrates from the httpOnly `coachai_session` cookie, checks `User.authTokenVersion`, and returns current user plus org membership, org billing tier, and a refreshed CSRF token when needed. Frontend `AuthProvider` uses this response to rebuild session/user state; it must not depend on browser-stored bearer tokens.

### Password

Current implemented password flow is authenticated change-password, not email reset. Keep minimum password length aligned with backend validation, currently 8 characters in auth routes.

If implementing forgot/reset password, design it for this JWT/Prisma app: reset-token table or signed one-time token, expiration, single-use invalidation, generic responses, email delivery, audit logging, and server-side password update. Do not copy Supabase recovery hash handling.

### Invite Acceptance

Invite acceptance validates the token, rejects accepted/expired invites, creates the user, adds `OrgMembership`, marks the invite accepted, audits the event, sets `coachai_session` and `coachai_csrf`, and returns team context plus CSRF token. Preserve cross-stack invite-role guards.

## Security Rules

- Never trust frontend auth state for authorization.
- Every backend route that reads or mutates private data must use `authMiddleware` and server-side scope helpers.
- Never trust client-supplied `userId`, `targetUserId`, `sessionId`, `teamOwnerId`, `orgId`, `materialId`, or role fields without checking allowed relationship.
- Use `getAuthContext`, `assertActor`, `requireOrgContext`, `getScopedMemberIds`, `assertCanReadSession`, `assertCanUploadOnBehalfOf`, and role helpers where appropriate.
- Preserve stack-bound JWT audience/issuer behavior in `jwt.ts`.
- Do not log raw JWTs, passwords, reset tokens, invite tokens in bulk, full transcripts, payment secrets, or sensitive personal data.
- Keep `JWT_SECRET` required and strong per stack.
- Browser auth is secure httpOnly cookie-first with signed CSRF and allowed Origin/Referer checks.
- Normal browser auth must not use `localStorage`, sessionStorage, in-memory bearer helpers, or `Authorization: Bearer` propagation.
- If bearer tokens remain for scripts or integrations, keep them explicit, non-browser, short-lived where practical, and do not expand their authority.
- AI output must never decide auth, roles, billing, or privacy.

## Frontend Rules

- `AuthProvider` owns `user`, session status, `isLoading`, `isAuthenticated`, `login`, `signup`, `adminSignup`, `logout`, `refreshUser`, `forceRefreshUser`, and onboarding status.
- Frontend auth state is session/user state only. The browser session itself lives in the httpOnly `coachai_session` cookie.
- `frontend/src/lib/api.ts` attaches `X-CSRF-Token` on unsafe cookie-authenticated requests from the in-memory token returned by auth responses or the readable signed `coachai_csrf` cookie.
- Do not store browser auth in `localStorage`, sessionStorage, or persistent client-side token helpers.
- Do not add normal browser `Authorization: Bearer` propagation.
- 401 responses clear local session/user state and redirect only when appropriate; avoid redirect loops on login/signup/invite pages.
- `ProtectedRoute` is UX only. It should not be treated as a security boundary.
- After auth mutations that replace the session cookie or CSRF token, update React auth state and refresh from `/api/auth/me` when local state may be stale.
- Auth forms must show loading, error, and success states, preserve accessible labels, and avoid leaking sensitive backend details.

## Implementation Workflow

1. Assess current state:
   - Read the files listed in Current Architecture.
   - Identify whether the issue is auth identity, session persistence, role derivation, org membership, route authorization, invite/signup flow, billing stack boundary, or frontend UX.
2. Define the ideal product/security behavior:
   - Who should access what?
   - Which tenant/role owns the decision?
   - What should happen on expired token, missing membership, wrong stack, deleted user, or stale invite?
3. Fix upstream:
   - Schema/migration when the source of truth is missing.
   - Backend auth/authorization helper when access logic is duplicated or wrong.
   - API contract when frontend lacks required role/status fields.
   - Frontend state/route UI only after backend authority is correct.
4. Preserve compatibility:
   - Keep additive response changes when possible.
   - Keep legacy `accountType`/`role` derivation aligned with `OrgMembership`.
   - Do not break existing paid/internal stack behavior.
5. Verify with targeted tests and smoke:
   - Backend auth route tests or regression scripts for changed behavior.
   - Frontend auth state/route tests if UI changed.
   - Browser smoke for login/logout/invite when practical.
   - `npm run build --workspace=backend` for backend auth changes.

## Common Fix Patterns

- Missing membership: do not invent a fake org id. Return/handle `ORG_MEMBERSHIP_REQUIRED` and repair provisioning.
- Role drift: centralize in `organizationRoles.ts` or `authorize.ts`, not scattered frontend checks.
- Cross-tenant session leak: add `assertCanReadSession` or scoped member checks server-side before returning data.
- Upload-on-behalf leak: authorize each target rep before session creation or fair-use charging.
- Invite bugs: validate invite role against active stack and write `OrgMembership` in the same transaction as user creation/invite acceptance.
- Stale frontend session after invite or signup: update auth context from the response, remember the returned CSRF token, then force refresh from `/api/auth/me`.
- Expired or revoked JWT cookie UX: clear local session/user state and redirect cleanly; do not leave partial user state.

## Do Not Copy From Sticklight/Supabase

- Do not create Supabase `profiles` or `user_roles`.
- Do not add RLS policies as the auth mechanism for this app.
- Do not use `supabase.auth.getUser()`, `getSession()`, `onAuthStateChange`, `resetPasswordForEmail`, or Cloud Backend email assumptions.
- Do not create a separate `src/contexts/AuthContext.tsx` tree.
- Do not store roles in user metadata or client state as authority.
- Do not reintroduce persistent browser bearer-token storage or propagation.

## Auth Checklist

- Current architecture inspected before editing.
- Backend route has authentication middleware where needed.
- Authorization is server-side and relationship-scoped.
- Org role and tenant kind come from `OrgMembership`/helpers.
- Stack boundaries are preserved for paid vs internal flows.
- Passwords are hashed with existing password helper.
- JWT secret, issuer, audience, and expiry behavior remain safe.
- Cookie, CSRF, and frontend session-state transitions are consistent.
- 401/403 UX is clear and does not loop.
- Invite/signup/admin flows write all required user, org, membership, audit, and billing/trial state.
- Browser flows use `coachai_session` plus signed `coachai_csrf`; bearer auth is not the browser authority.
- Sensitive logs avoided.
- Tests/build/smoke run or explicitly reported if blocked.
