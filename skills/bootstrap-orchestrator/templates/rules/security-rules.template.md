---
paths:
{{SECURITY_RULE_PATHS_YAML}}
---
<!-- TEMPLATE: the appsec rule the security-auditor audits against. Save as {{RULES_DIR}}/security-rules.md (or .mdc). FILL/prune. -->

# {{PROJECT}} Security and Privacy Rules

Purpose: reduce the chance of shipping insecure features or privacy mistakes, and give the security-auditor a binding rule set to audit against section by section.

## 1. General mindset
Treat this as an internet-exposed SaaS handling {{SENSITIVE_DATA}}. Default to least privilege, minimal exposure, explicit validation. Assume all client input — and all uploaded content + AI output — is untrusted until validated. User convenience never overrides security for auth, {{BILLING_TERM}}, admin, tenant boundaries, uploads, or private data.

Configuration/tool audits use explicit safe-file allowlists. Never recursively grep a home/tool config directory that may contain `.credentials.json`, `.env`, session logs, telemetry payloads, keychains, or token stores: command output is a secret sink. If a credential appears, stop, do not repeat it, classify it exposed, and require rotation/re-authentication.

## 2. Authentication + session
Browser auth is httpOnly, sameSite, secure cookie-first — no auth tokens in `localStorage`/`sessionStorage`/in-memory bearer helpers (bearer is explicit non-browser integration only). Cookie-authenticated unsafe requests are CSRF-safe: a signed CSRF token bound to the current session/token-version + an Origin/Referer allowlist. Session tokens carry a version compared against the DB; logout/password-change revoke server-side by incrementing it + clearing the cookie. Account-existence non-disclosure in auth/recovery. Never trust frontend auth state as proof.

## 3. Authorization
Every backend route enforces authorization server-side. The authorization source is {{AUTHZ_MODEL}} <!-- FILL: e.g. "role × permission-key × scope (self/team/tenant), effective permissions cached, UI hides forbidden actions using the same set." -->. {{TENANT_ISOLATION_CLAUSE}} <!-- FILL if multi-tenant: "{{TENANT_SCOPE_TERM}} on every scoped table; the DB backstop ({{RLS_TERM}}) is intact; middleware sets the tenant context per request; never skip the predicate or silently widen for convenience." -->. Always verify ownership/allowed-relationship; never trust a client-supplied identifier without a scope check; cross-tenant probes return 404, not 403/200.

## 4. Input validation + output handling
Validate body/query/params before business logic. Validate uploads by size/extension/MIME; sanitize filenames; never trust client-supplied file metadata. Schema-validate AI-generated output before persisting/rendering. Never render unsanitized HTML from user input/uploads/AI output. Avoid broad fallback parsing of security-sensitive data. {{INPUT_NORMALIZATION_CLAUSE}}

## 5. Secrets + config
Never hardcode secrets/tokens/webhook secrets/API keys; never commit real `.env`; keep prod/dev secrets separate; minimize third-party integration scopes; rotate on suspected exposure.

## 6. Logging + telemetry (a security boundary)
Do not log raw auth tokens, secrets, payment payloads, {{PII_KINDS}}, provider payloads, ORM meta, or storage keys. Runtime logs, error envelopes, error-tracker context, audit/analytics/usage rows, and smoke artifacts route through the shared telemetry redaction authority ({{TELEMETRY_AUTHORITY}}) — never route-local redaction. Error responses expose safe code + message + requestId only. Structured logs for auth failures, admin actions, {{BILLING_TERM}} actions, and abuse-relevant events.

## 7. Privacy + data minimization
Collect only data needed for behavior / legal compliance / analytics aggregates. New personal-data fields need a clear purpose; new stored artifacts need a retention reason + horizon. Per-tenant privacy settings are enforced by code, not just displayed. Deletion considers primary records, derived artifacts, and any external consumer.

## 8. Abuse + rate limits + {{BILLING_TERM}} safety
Rate-limit more than login/signup — protect {{ABUSE_SURFACES}}. Count failed auth. Expensive endpoints ({{EXPENSIVE_ENDPOINTS}}) are tightened + cost-attributed. Recompute sensitive {{BILLING_TERM}}/entitlement values server-side; never trust client-calculated pricing/seats/entitlement. Log privileged state changes (role changes, invites, {{PRIVILEGED_ACTIONS}}).

## 9. Transport + browser
HTTPS enforced; security headers (CSP, frame + content-type protection); CORS locked to allowed origins (no wildcard + credentials); cookies Secure + SameSite in prod; redirects/external URLs via trusted-URL helpers only.

## 10. AI + prompt security
Treat prompt inputs (incl. any user/customer content) as untrusted — they can carry injection. AI output never decides authorization, {{BILLING_TERM}}, roles, {{ENTITLEMENT_TERM}}, or {{DOMAIN_NOUN}} gating. Schema-validate machine-consumed AI output. Keep security + gating logic deterministic and server-enforced.

## 11. Dependencies
Prefer mature, well-maintained packages; don't add unless necessary; review risk for anything touching secrets/files/auth/{{BILLING_TERM}}/{{HIGH_RISK_DEP_AREAS}}/code-execution. {{DEP_AUDIT_GATE_CLAUSE}}

## 12. Security definition of done
AuthN impact considered; authz server-side; tenant isolation preserved (no leak, backstop intact); inputs validated ({{INPUT_NORMALIZATION_TERM}}); outputs handled safely; logs don't leak; telemetry leak-scanned/routed through the shared authority; abuse + privacy impact considered; {{SAFETY_INVARIANTS}} preserved; secrets clean.
