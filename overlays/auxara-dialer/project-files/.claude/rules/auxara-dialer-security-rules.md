---
paths:
  - "backend/**/*"
  - "frontend/**/*"
  - "shared/**/*"
  - ".env*.example"
---
# Auxara Dialer Security and Privacy Rules

Purpose: reduce the chance of building insecure SaaS features, shipping privacy mistakes, or creating drift in auth, billing, upload, telephony, recording, or tenant-isolation flows.

## 1. General security mindset

- Treat this as an internet-exposed SaaS handling **regulated prospect PII + voice recordings + SMS content + financial billing**.
- Default to least privilege, minimal exposure, and explicit validation.
- User convenience does not override security for auth, billing, admin, tenant boundaries, uploads, or private data.
- Assume all client input is untrusted.
- Assume uploaded content (lead-list CSVs, scripts, VM recordings, prospect images) and AI output are untrusted until validated.

## 2. Authentication and session safety

- Browser auth is secure, httpOnly, sameSite cookie-first. Do not store or propagate normal browser auth tokens in `localStorage`, `sessionStorage`, or in-memory bearer helpers. Bearer auth is explicit non-browser integration compatibility only.
- Cookie-authenticated unsafe browser requests must be CSRF-safe. Require allowed Origin/Referer and a signed CSRF token bound to the current authenticated session/token version. Do not add deprecated CSRF middleware packages.
- JWTs must carry the current user's `authTokenVersion`, and authenticated middleware must compare it to the database user. Logout and password change should revoke older tokens server-side by incrementing this version and clearing the cookie.
- If bearer tokens are temporarily used (for API integrations, mobile manager app, supervisor barge from phone), keep them short-lived, avoid expanding their authority, and do not make them the browser source of truth.
- Never expose whether an account exists in production auth or recovery flows unless there is a deliberate reason.
- Support server-side session invalidation or token versioning for meaningful auth revocation.
- Do not trust frontend auth state as proof of authorization.
- Privileged actions must verify the current user on the server.

## 3. Authorization

- Every backend route must enforce authorization server-side.
- The authorization source (ADR-AUTH-010 + decision-log AUTH rows; permission matrix in `docs/app-plan/product/02-prd.md`) is: **role (Owner / Tenant Admin / Manager / Supervisor / Agent / Compliance Viewer / API Integration) × permission key × scope (self / team / tenant)**. Effective permissions cached in Redis (60s TTL); UI hides forbidden actions using the same set.
- `tenant_id` is on every tenant-scoped table. Postgres RLS is the backstop (`USING (tenant_id = current_setting('app.tenant_id')::uuid)`); middleware sets `app.tenant_id` per request after JWT validation. Do not skip the RLS predicate; do not silently widen for convenience.
- Always verify ownership or allowed relationship for calls, recordings, lists, prospects, conversations, appointments, billing records, and admin views.
- Never trust `userId`, `agentId`, `tenantId`, `numberId`, `listId`, `prospectId`, `callId`, `conversationId`, `appointmentId`, or similar identifiers from the client without checking scope.
- Frontend gating is for UX only.

## 4. Input validation and output handling

- Validate request body, query params, and path params before business logic.
- Validate uploaded files (lead lists, VM recordings, scripts, brand assets for 10DLC) by size, extension, and MIME type. Reject lead lists with > N rows without explicit batch consent.
- Sanitize filenames and never trust client-supplied file metadata.
- Validate AI-generated JSON (disposition drafts, battlecard triggers, accent-toggle decisions) before persisting or rendering it.
- Never render unsanitized HTML from user input, uploads, or AI output.
- Avoid broad fallback parsing that silently accepts malformed security-sensitive data.
- Phone-number normalization: every prospect/agent/owned number is canonicalized to E.164 before persistence. Reject what cannot be parsed; do not store ambiguous strings.

## 5. Secrets and configuration

- Never hardcode secrets, tokens, webhook secrets, Telnyx API keys, Stripe keys, or credentials.
- Never commit real `.env` files.
- Keep production and development secrets separate.
- Minimize third-party integration scopes (Telnyx, Stripe, transcription provider, AI provider, CRM webhook targets, Cloudflare R2).
- Rotate secrets immediately if exposure is suspected.

## 6. Logging and sensitive data

- Do not log raw auth tokens, secrets, payment payloads, full transcripts, raw audio paths, prospect PII (full names, full phone numbers in unbounded contexts), Telnyx event payloads, Stripe payloads, or AI provider responses.
- Log enough context to investigate incidents without leaking content.
- Use structured logging for auth failures, admin actions, billing actions, compliance-gate decisions, and abuse-relevant events.

## 7. Privacy and data minimization

- Only collect prospect data needed for product behavior (dialing, dispositioning, callback routing), legal compliance (for example DNC status), or analytics aggregates. CMP-003 forbids building prospect-consent evidence collection; the covered `consentProofId` compatibility field stays permanently null.
- New personal data fields require a clear purpose.
- New stored artifacts require a retention reason and a retention horizon. Recordings, transcripts, and call audit rows have compliance/litigation retention requirements — do not delete blindly.
- Deletion behavior must consider primary records, derived artifacts (transcriptions, AI drafts), and the external CoachAI consumer (notify it of deletion or fail closed).
- Per-tenant privacy settings (recording-disclosure on/off where legally allowed, retention window, AI feature opt-out) must be enforced by code, not only displayed in UI.

## 8. Billing and admin safety

- Billing actions require strong authorization checks.
- Admin endpoints should be more tightly rate-limited and auditable.
- Invite creation, number purchase/release, list import, 10DLC submission, recording deletion, role changes, and admin-heavy endpoints are abuse surfaces and need explicit limiters.
- Paid production must use distributed Redis-backed rate limits unless an explicit emergency override is documented.
- Do not trust client-calculated pricing, seat counts, or entitlement state.
- Recompute sensitive billing and entitlement values server-side. Telnyx usage (minutes, SMS segments, number cost, 10DLC fees) reconciled from Telnyx CDR + billing API, not from client claims.
- Log role changes, invite sends, team membership changes, subscription changes, number purchases/releases, and recording deletions.

## 9. Abuse prevention

- Rate limit more than login and signup. Protect dial-engine triggers (no one tenant can flood the system), SMS bulk sends, 10DLC submissions, recording downloads, list imports, invite flows, and admin-heavy endpoints.
- Count failed auth attempts against auth limits.
- Expensive endpoints (transcription reruns, AI disposition re-generation, recording exports) should have tighter controls + cost attribution.
- Add visibility for repeated failures, enumeration attempts, suspicious uploads, high-volume misuse, and dial-pattern anomalies (e.g. one tenant suddenly hitting 10× their normal dial volume, or a spike in DNC-hit / invalid-number attempts).

## 10. Browser and transport security

- Enforce HTTPS in production.
- Use security headers (CSP, frame protection, content type protection).
- CORS locked to allowed origins only. Do not use wildcard origins with credentials.
- Cookies must be secure and sameSite in production.
- Redirects and external navigation must pass trusted URL validation. Stripe checkout, portal, invoice URLs must be HTTPS Stripe hosts; app links must be built from trusted app origins.
- WebRTC signaling endpoints must validate Telnyx origin and not accept arbitrary turn-server overrides from the client.

## 11. AI and prompt security

- Treat prompt inputs as untrusted. Transcripts of a live prospect call can contain prompt-injection attempts.
- AI output must never decide authorization, billing, roles, compliance gating, or privacy policy enforcement.
- Schema-validate machine-consumed AI output.
- Do not allow user-provided content (lead notes, script content) to silently override security controls.
- Keep security, compliance gating, and entitlement logic deterministic and server-enforced.

## 12. Dependency and supply chain discipline

- Prefer mature, well-maintained packages.
- Do not add a package unless it is necessary.
- Avoid obscure libraries for auth, crypto, uploads, telephony bridging, or HTML parsing unless there is a strong reason.
- Review dependency risk when adding packages that handle secrets, files, auth, billing, recordings, or code execution.
- Recording playback, rerun, retention, explicit deletion, and idempotent upload-finalize replay must resolve storage by durable backend authority; do not use process-wide `STORAGE_DRIVER` env, finalized upload metadata alone, local scratch cleanup, or local chunk listing as the security/product authority for whether a recording exists or was deleted. If the owning backend is unknown or unavailable, fail closed before deleting the DB row or stamping `recordingDeletedAt`.
- Observability is an exposure surface. Runtime logs, API errors, Sentry, audit/analytics/AI-usage/Telnyx-usage rows, dialer trace summaries, smoke artifacts must use a shared telemetry redaction authority. Never log or return raw cookies, bearer tokens, CSRF/session/invite tokens, signed URLs, prospect PII, transcripts, audio paths, provider payloads, Prisma meta, Stripe payloads, R2/S3 keys, or debug payload paths.
- Redis connection posture is per-ROLE (security audit 2026-07-03, MEDIUM-2): request-path consumers (rate limiter, readiness probes, anything a user request awaits) use the fail-fast client (`redisRequestConnection` — `enableOfflineQueue: false`, bounded retries) so a down Redis rejects in milliseconds instead of queueing commands in process memory forever. `maxRetriesPerRequest: null` connections (`redisConnection`) are BullMQ/pubsub-ONLY — pointing a request path at one converts every outage into fail-HANG (an unbounded await that defeats fail-closed catches) plus unbounded offline-queue growth and a reconnect thundering-herd.
- An awaited BullMQ `Queue.add(...)` on a request/webhook path is ALSO a fail-HANG surface: BullMQ MANDATES the queue-forever `redisConnection`, so on a Redis outage `add` may never reject. BOUND the await with `lib/withTimeout.ts` plus a deterministic idempotent job ID, or detach only when caller correctness is independent and errors stay observed. Every custom ID is built with `lib/bullmqJobId.ts`; BullMQ reserves `:`, and `gate:bullmq-job-ids` rejects literal/dynamic bypasses after a colon-bearing system schedule failed in production on 2026-07-10. Queue consumers and detached startup schedule registration may retain queue-forever posture; request/webhook producers may not.
- Deregistering a repeatable/scheduler job retires BOTH the code AND the persisted Redis entry — code-side removal alone leaves it firing. BullMQ persists repeatable/scheduler state in **Redis, not in code**, so deleting the `queue.add(…repeat…)` registration + the worker dispatch branch does NOT stop an already-registered scheduler: it keeps enqueuing on its interval against prod Redis until a `queue.removeJobScheduler(schedulerId)` / `removeRepeatable(…)` runs against the running instance (a prod-Redis mutation → human-gated per `.ai-organization/policies/action-authority.v1.json`), or the job remounts. A crash-safe worker (fall-through no-op on an unhandled job name) turns those firings into benign INFO no-ops (`job_processed`, never `job_failed`) — dead work, not an outage — which is exactly why they hide: nothing errors. So a code-side deregistration MUST either (a) retire the persisted scheduler from prod Redis in the same change, or (b) record the recurring no-op with a **named removal owner** until the job remounts. Verify after deploy: grep the deploy-window worker log for the retired job name — a continuing benign no-op confirms crash-safety AND flags the orphaned Redis scheduler to clean up (surfaced 2026-07-21, S14-B06 booking embed-only unwind / PR #260: `bookingWatchSweep` was deregistered in code but its `*/15` scheduler survived in prod Redis as a 15-min no-op until INT-004 remounts). *Fail-state:* a repeatable job was "removed" in code, `tsc`/`verify` were green, and it kept firing on its interval in prod because the Redis-persisted scheduler was never retired and no owner was named to remove it.

## 13. Security definition of done

Before finishing a security-sensitive change, confirm:
- authentication impact considered
- authorization checks are server-side
- tenant isolation preserved (no cross-tenant leak, RLS predicate intact)
- inputs validated (including phone number normalization)
- outputs handled safely
- logs do not leak sensitive data
- Sentry, API error envelopes, persistent telemetry rows, admin trace responses, frontend diagnostics, and smoke artifacts are leak-scanned or routed through the shared telemetry authority
- abuse risk considered
- privacy impact considered if data collection or storage changed
- compliance invariants (STIR/SHAKEN, 10DLC, TCPA/CASL, calling hours, recording disclosure, DNC scrub) preserved where applicable
- secrets handling remains clean
