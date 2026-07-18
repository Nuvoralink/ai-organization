---
name: cookie-rbac-auth-hardening
description: Use when implementing, auditing, or fixing web authentication and authorization with httpOnly cookie sessions, CSRF protection, RBAC, tenant/org membership, invite/signup/login/logout flows, role gates, object-scope authorization, browser auth state, or auth smoke tests. Trigger for auth bugs, session persistence issues, role drift, protected route issues, invite acceptance, logout revocation, password flows, cross-tenant access, or replacing unsafe browser bearer/localStorage auth.
---

# Cookie RBAC Auth Hardening

Use this skill for browser auth systems where server-side session authority, CSRF protection, tenant membership, and object-scope authorization matter.

## Product Intent

Auth protects private workspaces, user data, admin tools, billing, uploads, generated artifacts, reports, and role-specific visibility. Frontend gates are UX. The backend is the security authority.

When fixing auth, solve the root access-control or session-state problem across the full path: schema, token/session, backend middleware, authorization helper, API contract, frontend state, route gate, invite/payment/onboarding side effects, logs, and tests.

## Source Of Truth

Before editing, identify:

- user identity source,
- tenant/org/account membership source,
- role source,
- stack/environment boundary if multiple products or admin/customer stacks exist,
- session token authority,
- CSRF mechanism,
- object-scope policy helper,
- frontend session state consumer,
- audit/log redaction rules.

Do not treat client-side role flags, route guards, localStorage, or decoded browser state as authorization authority.

## Browser Session Contract

Prefer secure browser auth with:

- httpOnly session cookie,
- secure/sameSite settings appropriate for the deployment,
- signed CSRF token or equivalent unsafe-method protection,
- allowed Origin/Referer checks where relevant,
- server-side session rehydration,
- revocation/version checks for logout and password changes,
- generic error posture where account enumeration is a risk.

Bearer tokens may remain for scripts, integrations, or service-to-service flows, but normal browser auth should not rely on persistent browser bearer storage or automatic `Authorization: Bearer` propagation.

## Authorization Rules

- Every private route must authenticate server-side.
- Every request-controlled identifier needs an object-scope check: user, target user, member, manager, session, org, invite, file, upload intent, material, export, payment, report, or provider object.
- Missing membership fails closed before product logic or provider calls.
- Role and tenant decisions come from the authoritative membership/source table or service, not display fields.
- Cross-tenant probes should not reveal whether an object exists.
- AI output must never decide auth, roles, billing, privacy, or access.

## Flow Checklist

For login, signup, invite acceptance, logout, password change/reset, admin bootstrap, billing portal, upload-on-behalf, and role changes, verify:

- server-side validation,
- transactional writes where identity and membership are created together,
- session cookie and CSRF state are updated consistently,
- stale sessions are revoked when needed,
- frontend state refreshes from the server,
- privileged mutations have rate limits/audit logs where appropriate,
- sensitive tokens and personal data are redacted from logs and errors,
- 401/403 UX is clear and does not loop.

## Common Fix Patterns

- Missing membership: fail closed and repair provisioning; do not invent a fake tenant/org id.
- Role drift: centralize role derivation and keep display fields derived.
- Cross-tenant leak: add object-scope helpers before returning data.
- Logout that only clears UI state: add server-side revocation or session invalidation.
- Invite bugs: validate token, role, expiry, tenant/stack, and write membership in the same transaction as user creation/acceptance.
- Stale frontend session after auth mutation: update local auth state from the response, store only non-secret CSRF/session status as appropriate, then rehydrate from `/me` or equivalent.
- Password reset: use single-use expiring tokens, generic responses, server-side update, and audit logging.

## Verification

Run the narrowest meaningful gates:

- auth route/unit tests,
- role-policy and object-scope negative tests,
- CSRF regression tests,
- invite/signup/logout/password-flow tests,
- frontend auth-state/protected-route tests,
- browser smoke for login/logout/invite when practical,
- build checks for touched workspaces.

Report any gate that could not run and why.
