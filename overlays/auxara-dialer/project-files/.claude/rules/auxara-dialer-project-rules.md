---
description: MVP-safe rules for Auxara Dialer — telephony engine boundaries, number lifecycle, contracts, compliance, AI feature scope, backward compatibility
paths:
  - "backend/src/**/*"
  - "frontend/src/**/*"
  - "shared/src/**/*"
  - "docs/app-plan/**/*"
---

# Auxara Dialer Project Rules (MVP)

Before non-trivial architecture work, read `docs/app-plan/product/01-product-brief.md` + `docs/app-plan/product/03-feature-scope.md` (wedge, phases, out-of-scope), `docs/app-plan/product/02-prd.md` (requirements), `docs/app-plan/auditability/decision-log.md` + `docs/app-plan/architecture/adr/` (settled decisions — the authority), `docs/app-plan/architecture/06-architecture.md` (architecture), and (when populated) `docs/ARCHITECTURE_BLAST_RADIUS.md`. Use them to keep source-of-truth changes connected across prompts, validators, persistence, DTOs, frontend consumers, jobs/scripts, security, deploy, docs, and tests.

## 1. Source of Truth — Telephony

- **Telnyx is the source of truth for call state.** The local `calls` row is the projection of Call Control events. If they diverge, Telnyx wins and the projection is repaired (idempotently).
- **Number lifecycle** (`active → cooling/rested → inbound_only → released`; DB enum `warming` is dormant legacy only) is the source of truth for whether a number can dial outbound, accept inbound, send SMS, or receive SMS. Never mutate `numbers.status` directly from a route handler or UI — **all transitions go through the single `numberLifecycle` service** (legality + RBAC + audit). The `number-health-monitor` and `number-retirement-sweeper` workers **feed signals/recommendations** only; there is no runtime warming promotion path. The **contested edges** (`active → cooling`, retirement, release) are driven by a **human** (per RBAC) or the tenant's **opt-in automation (default OFF)** — the system flags and recommends, the human decides (ARC-006, ADR-NUM-001). There is no system-imposed per-number dial cap (ADR-NUM-002).
- **Conversations are keyed to lead, not number — _when a lead exists._** SMS threading must survive number rotation: a reply to a rotated-out number routes back to the lead-keyed conversation, not a new one. A raw/pasted number that matches NO lead gets a **contactless** conversation keyed to the number itself (`contact_e164`; COMPANION-RAW-DIAL-001) — operational dial-state, never a fabricated CRM lead (ARC-006). ADR-CONV-001 codifies both.
- **DNC** is TWO distinct mechanisms (ADR-CMP-001) — do not conflate them. **(Tier-1a, always-on, never disableable)** on-list suppression: STOP / opt-out / terminal internal-DNC states (`opt_out`/`internal_dnc`/`scrubbed_dnc`) are excluded from the dial queue (the authority), and never reach the gate. **(Tier-1b, tenant-owned capability — safe-default ON, configurable + tenant-liable)** federal/state registry-scrub **freshness**: the freshness block is **provider-gated** — *when the capability is enabled* (`tenants.dnc_scrub_enabled`) **AND a scrub provider is configured** (`DNC_SCRUB_DRIVER !== 'none'`), a null or stale (>31d) scrub blocks the dial at dial time — fail-closed, never a silent allow (CMP-005/CMP-010). **With NO provider wired** (`DNC_SCRUB_DRIVER='none'`, the default pre-INT-DNC-PROVIDER-001) the enabled capability **allows + records an honest `dnc_provider_unavailable` audit basis** (`*_pass = null` + `{enforced:false, reason:'dnc_provider_unavailable'}`) — it does **not** block every dial, because there are no scrub timestamps to be fresh (the tenant is the liable caller; ToS + abuse-monitoring backstop). A tenant *may also disable it at their own liability*, and the audit then records `{enforced:false, reason:'tenant_disabled'}` — never a fabricated pass (ARC-004). Do **not** state the freshness block as an unconditional, no-override rule — that mis-states the Tier-1b capability as a Tier-1a gate (the exact doctrine-drift the doctrine-drift-auditor exists to catch).

## 2. Dialer Engine Boundaries

The dialer ships ONE mode — **single-line power** (ADR-DLR-001). Parallel and predictive are **scrapped** (not deferred); do not build engine seams, AMD, or pacing for them.

- **Power dialer (the only mode):** fetch next prospect → validate compliance gates (calling hours, DNC, recording disclosure, consent) → dial via Telnyx Call Control → on disposition save, fetch next. One line per agent; agent-initiated, so it **cannot abandon**.
- **VM-drop is agent-triggered:** the agent hears voicemail and one-taps a pre-recorded drop (no AMD; ARC-006-clean). VM-drop of prerecorded marketing requires documented prior express written consent.

The stable cross-consumer contract is the ARC-002 `call_events` stream — manager wallboard / billing meter / compliance audit all read it. The power engine is concrete; there is no multi-mode interface (DLR-002 dropped).

## 3. Compliance Stages — Set A enforced / Set B tenant-owned capabilities (ADR-CMP-001)

The line is **who is the legal actor**: the platform (we sign/register or the carrier enforces) vs the caller/tenant (we are a neutral conduit; safe-harbor).

**Set A — platform/carrier-enforced, NO override** (neither tenant nor human can disable):
- **STIR/SHAKEN** A-attestation on US/CA DIDs (Telnyx-provisioned).
- **10DLC** brand + ≥1 campaign per tenant before any **US** A2P SMS (US carriers block unregistered at the network); toll-free verified fallback. Vetting state visible + registered in-app (ADM-002). **Canada SMS needs no 10DLC** — it works immediately (CASL mechanics + attestation).
- **CASL** SMS sender-ID + functional unsubscribe mechanics (≤10 business days) for SMS into/from Canada.
- **STOP / opt-out** auto-suppression (always on; internal DNC).

**Set B — tenant-owned compliance capability, safe-default ON, tenant-configurable + tenant-liable** (we ship the capability + a safe default + log what the system did; the tenant owns the legal outcome):
- **Calling-hours** by prospect-local TZ, **country-aware** (US default 8am–9pm + per-state stricter; **Canada** CRTC day-of-week windows Mon–Fri 9:00am–9:30pm / Sat–Sun 10:00am–6:00pm via `CANADA_CALLING_HOURS`, CMP-CA-WINDOW-001; tenant may narrow or disable at own risk). **Enforcement differs by dial mode (ADR-CMP-012 / CMP-012):** the power dialer **hard-blocks** out-of-window leads (skip/defer → next in-window); **manual / click-to-dial** is a per-tenant setting — **block / confirm** (default; a speed-bump popup states the prospect's local time + window, the human decides) **/ off**. The override is **calling-hours only** (DNC / STOP / consent never overridable), and **no reason is captured** from the operator (ARC-006 — don't police the human's decision); the audit logs any override honestly.
- **DNC scrubbing** (CMP-005; default ON for dialer-owned lists; federal + internal + state; scrub-on-import + ≤31-day re-scrub + dial-time freshness).
- **Recording disclosure** at call start for all-party-consent states (CA, CT, DE, FL, IL, MD, MA, MI, MT, NV, NH, PA, WA, +VT) + a disclose-always option; **PIPEDA** → disclose on every Canadian call. Fail-safe = disclose when state uncertain.
- **Per-recipient consent / PEWC** — tenant attestation only (`consent_attestations`); never per-lead tracked. VM-drop of prerecorded fires only when the tenant enabled the capability + attested PEWC.
- *(No predictive-abandonment cap — predictive scrapped; a single-line, agent-initiated power dialer cannot abandon. ADR-DLR-001.)*

**Posture for Set B + shared-account protection:** safe defaults ON + a ToS/AUP that puts compliance responsibility on the tenant + abuse/anomaly monitoring with suspend rights — **not** per-call platform enforcement.

Each gate is **deterministic** (calling-hours TZ math, DNC lookup, disclosure state-map) — **never let an AI decision compute or bypass a compliance outcome.** When a tenant disables a Set-B capability, the `compliance_audit_log` row records `*_pass = null` + `{ "enforced": false, "reason": "tenant_disabled" }` — **never a fabricated pass**.

## 4. Contract and Schema Stability

- API and persistence shapes used by the frontend, billing, compliance audit, or the external CoachAI consumer are contracts. Do not break them without a versioned migration path.
- Machine-consumed fields (IDs, enums, counts, status flags, lifecycle states, Telnyx event refs) must remain stable or additive; prefer backward-compatible changes.
- Every machine-consumed model output (AI disposition draft, AI battlecard trigger, AI accent toggle) must be validated and normalized before any downstream use.
- The CoachAI integration DTOs (call metadata, recording references, transcription handoff, disposition, consent proof) are covered contracts. Treat changes to their fields or enums as cross-product breaking changes.

## 5. AI Feature Scope (intentionally narrow)

AI in the dialer is bounded to:
- **AI-drafted disposition + notes** (Phase 1) — drafts from transcription, rep approves with one keystroke or edits.
- **Keyword-triggered battlecards** (Phase 1, no-ASR fallback; ASR-grounded later) — show rebuttal card when prospect says "too expensive" / "already covered".
- **AI auto-advance of branching teleprompter** (Phase 3) — replaces manual branch buttons.
- **Optional metered AI accent conversion add-on** (Phase 3) — toggle, not baked in; per-tenant/team/agent gated by entitlement; passes audio through untouched when off; disclosure-friendly per active Canadian regulatory scrutiny.

**Not in scope:** AI scorecards / coaching rubrics (those live in the separate CoachAI product), deal/pipeline AI, gamification AI, AI lead-qualification scoring beyond pickup-likelihood prioritization.

### AI Decision Boundary

When the dialer makes an AI semantic judgment:
1. AI reads the call/lead/event evidence semantically and proposes a structured decision with grounded evidence reference.
2. Deterministic code validates grounding, speaker, confidence, schema, policy, persistence, provenance.
3. Accepted decisions drive downstream behavior: disposition write, battlecard surface, accent toggle apply.
4. Rejected/downgraded decisions remain auditable with explicit reasons.

Anti-patterns:
- Adding another regex phrase to fix a new wording when the real failure is missing AI judgment.
- Persisting an AI artifact that does not influence the final user-visible output.
- Letting final prose invent or re-rank decisions that were not present in structured validated artifacts.
- Deterministic code judging meaning unless there is a `SEMANTIC_DETERMINISM_ALLOW:` comment explaining the narrow scope plus a regression proving the scope cannot expand silently.

## 6. Uncertainty, Confidence, and Limited States

- If a model is uncertain (transcription unclear, call too short, evidence missing), prefer empty fields, warnings, or explicit low confidence over invention.
- Poor transcript or audio quality → support a limited-AI mode (rep types disposition manually with no AI draft suggestion). Do not fabricate quotes to fill gaps.
- Missing evidence is not negative evidence.

## 7. Prompt Design

- No giant prompt blobs with mixed responsibilities.
- All AI prompts must request strict JSON when the output is machine-consumed.
- All JSON responses must be validated and normalized before use.
- Fail closed, not open: invalid model data → graceful degradation + persisted warnings, not silent business-logic invention.

## 8. Frontend and UI Safety

- The booker softphone is the most-touched surface. UX must consume structured, version-stable data (call DTO, lead context DTO, disposition DTO). Do not depend on parsing freeform narrative for core UX.
- If the backend adds structured fields, migrate the UI to use them rather than scraping prose.
- UI copy must be role-aware (booker vs manager vs tenant admin vs compliance viewer). Use shared label helpers; do not duplicate role-specific copy.

## 9. Idempotency

- Writes for call-scoped events (Telnyx CDR ingestion, recording finalization, disposition save, billing usage rows, SMS send acks) must be idempotent. Use Telnyx event IDs as the idempotency key where applicable.
- Re-running disposition save for the same call must not create duplicate rows or conflicting state.
- Any persisted derived row, queue/dispatch row, retry row, provider evidence row, projection, or lifecycle status that can later act or make a visible claim must have source-mutation handling for every actionable state, not only the newly scheduled/current state.

## 10. Error Handling

- Never let a non-critical AI substep (disposition draft failure) crash the whole call wrap-up. The rep can still save manually.
- Never let a non-critical metric/wallboard failure block the dialer engine.
- Capture warnings and persist them.
- Return partial results when safe.
- Log enough context to debug; do not log secrets, full transcripts, raw audio paths, or prospect PII in unbounded contexts.

## 11. Scalability

- Do not rely on in-memory state for anything that must survive restarts or multiple instances. Dialer state, queue depth, and the dials-today counter (analytics; ADR-NUM-002) live in Redis/Postgres.
- Long-running work (VM drop, SMS sends, DNC scrub, recording rehoming, TCR sync, number-health checks, CRM webhook delivery) goes through BullMQ workers.
- Keep pure transformation logic separate from HTTP route handlers and from Telnyx event handlers.

## 12. Config and Constants

- Do not scatter magic strings, model names, thresholds, status labels, or fallback copy across files.
- Centralize config and domain constants (calling-hours defaults, callback-tail default, retention windows).
- Business-sensitive thresholds: expose through config per tenant per the compliance-as-config posture (`docs/app-plan/security/20-compliance-policy-and-review.md` + ADR-CMP-001).

## 13. Safe Refactors and Saved Calls/Recordings

- Do not silently change API response shapes used by the frontend, billing, compliance audit, or the external CoachAI consumer.
- Evolving shapes: backward-compatible field first, then migrate callers.
- Saved calls, dispositions, recordings, and audit rows stay **readable for as long as they're retained** (a mapper change must not break an older persisted payload) — but retention is **not "forever."** **Retention is the tenant's obligation, not ours:** we are the data *processor*, the tenant (the liable caller — ADR-CMP-001/ARC-006) is the *controller*. We hold their data while they're a customer (to operate + export), give an export window at cancellation, then **delete** it (default **cancellation + 90 days**) — never a multi-year archive of an ex-customer. The tenant's legal retention (FTC TSR ~5yr) is met by *their export*, not our storage; post-cancellation we keep only our own minimal records (billing/tax, abuse, active legal holds). Opt-out/internal-DNC suppression is permanent *while they're a customer* and leaves with them at cancellation. Detail: `docs/agent-prompts/sprint-1-3/list-retention-lifecycle-spec.md`.

## 14. Testing and Engine Regression

- Dial-engine logic: fixture-based regression for the power-dialer path, number-lifecycle transitions, and compliance-gate decisions.
- Compliance logic: fixtures for calling-hours block, DNC hit, recording-disclosure trigger.
- Number-lifecycle logic: fixtures for every state transition + the inbound router after a number is retired.
- Conversation threading: fixture for SMS reply after number rotation lands on the right lead-keyed conversation.

## 15. Repository file map (Git-tracked paths)

- Root `REPO_FILEMAP.md` is a tree of every path returned by `git ls-files`. Regenerate it after adding, renaming, or removing tracked files: `npm run filemap` (runs `scripts/generate-repo-filemap.mjs`).
- When introducing new files that will be committed, run `npm run filemap` and include the updated `REPO_FILEMAP.md` in the same commit when practical.

## 16. Docs drift prevention

- Documentation is part of done. When behavior, architecture, API contracts, DTOs, persistence, security/auth, telephony integration, compliance gating, or user-visible product rules change, update the living docs that own that behavior in the same commit.
- Use `docs/DOCUMENTATION_INDEX.md` as the routing layer (when populated). If a new doc is created, a doc is retired, or an authority changes, update the index.
- Generated file maps are not live architecture truth. `REPO_FILEMAP.md` is generated from tracked files; run `npm run filemap` after tracked file adds, removes, or renames when practical.
- When changing a covered DTO (calls, dispositions, recordings, consent, CoachAI handoff), update all affected artifacts in the same commit: shared code, backend mapper/producer, frontend consumer, Codex rules where relevant.

## 17. CoachAI Integration Boundary

- The dialer is standalone. The separate Nuvora CoachAI repo (`Nuvoralink/Nuvora-CoachAi`) consumes recordings/transcripts/structured call metadata via API. Until that integration exists, recording storage authority and call metadata DTOs must still be stable enough for an external consumer.
- Do not pull coaching-domain rules from CoachAi into this repo. They belong to that product.
- Coaching, scorecards, drills, rubrics, AI sales-coaching prompts, observation taxonomies — out of scope here.

## 18. Tenant Isolation as a Default

- Every tenant-scoped query includes `tenant_id`. Postgres RLS is the backstop, not the design.
- Internal admin work that crosses tenants is a separately-audited code path. Never silently widen a tenant-scoped query for convenience.
- Test for cross-tenant leak on every new read endpoint that returns object-scope data.
