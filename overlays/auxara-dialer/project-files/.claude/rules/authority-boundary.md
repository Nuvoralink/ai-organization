---
description: System informs and recommends; humans (or the CRM) decide and act. The system holds autonomous authority ONLY over hard compliance/legal gates. It never silently mutates operational state that affects an agent's work or a prospect's treatment.
paths:
  - "backend/src/**/*"
  - "frontend/src/**/*"
  - "shared/src/**/*"
  - "docs/app-plan/**/*"
---

# Authority Boundary — System Informs, Human Decides

Purpose: keep the dialer in its lane. It is a telephony tool a human operates, not an autonomous agent that decides who to pursue, schedules outreach, or rearranges an agent's working setup on its own. This rule prevents the recurring drift where "the system could do X automatically" quietly turns the dialer into a CRM, a marketing-automation engine, or a decision-maker that overrides the human.

This rule sits alongside `auxara-dialer-project-rules.md` §AI Decision Boundary (ARC-003). ARC-003 says **who computes a judgment** (AI vs deterministic code). This rule (ARC-006) says **who has authority to ACT on it**.

## North star (the one-line test)

**The dialer informs; the operator decides.** It surfaces subtle, factual cues and context to make the human's decision *easier* — but it never makes that decision *for* them, and it never owns CRM-level lead information. The only decisions the dialer makes on its own are the hard legal/carrier gates it is *required* to enforce (Tier 1a/1b below).

Worked example (settled 2026-06-10, the "Lead / Call prep" drawer): showing the prospect's **local time** — even with a quiet "early / late" flag outside ~8a–9p — is a *cue that informs* the booker's timing judgment → ✅. Stamping the lead **"cleared to call"** is the app *making the call-decision for them* → ❌. Reproducing a CRM lead profile (why they're a lead, interest, scoring, relationship history) is *owning CRM-level information* → ❌. The dialer's lead surface BASE is **name + phone + city/state + local time** — basic list fields + cheap derived cues; beyond that it MAY DISPLAY any tenant-supplied list/CSV field (company, email, spouse, DOB, address, …), shown TIERED so it stays glanceable. **AUTHORITY ≠ SHOW-CAPABILITY** (settled 2026-06-21): *displaying* tenant-provided fields is in-bounds and not a ceiling; what stays the CRM's is *ownership* — we never source, score, own, or build a profile from lead intelligence, and never stamp a "cleared to call" verdict. The anti-pattern is CRM ownership/sourcing/scoring/clutter/decision-making, NOT showing tenant data.

## Clarification (2026-06-25) — operational dial-state IS the dialer's job; only the *strategic* lead lifecycle / system-of-record is Tier 3

The "not a CRM / Tier 3 = lead lifecycle" line is about **ownership and the system-of-record — NOT feature-overlap.** A capability is not Tier-3 merely because a CRM also has it. The dialer MUST own its **operational dialing state** — everything it needs to dial correctly, respect the operator's time, and not look broken — even when a CRM tracks something similar, and it must keep working **standalone with no CRM** (e.g. on a bare CSV; "don't *fully rely* on CRMs").

- **The dialer's OWN job (build it as proper logic + UX):** not re-dialing a lead already **booked / refused / wrong-number / called-back** in this campaign (DLR-012); per-campaign attempt + outcome + completion state the dial queue reads; auto-recording a **factual call result** (DLR-013); the lead's own dialer-side call/SMS/VM/note history; displaying tenant-supplied lead fields (the AUTHORITY ≠ SHOW-CAPABILITY rule above). These are operational dial-state — deterministic, driven by the operator's own actions. Build them well; they are NOT "a CRM."
- **Still Tier 3 (human / CRM / system-of-record — the dialer never owns):** the *strategic* lead lifecycle — pipeline stage, deal value, lead scoring-for-worth, who to pursue and when to permanently give up across campaigns, multi-day nurture/drip cadence, *scheduling* a specific future outbound callback, the relationship/conversation, being the system-of-record. The dialer **syncs** these to the CRM (INT-001) + surfaces them; it does not own, source, score, or autonomously act on them.
- **Refined test:** *Does the dialer need this to dial correctly / respect the operator's time / not look broken?* → operational — the dialer's job (even if a CRM also does it). *Is it strategic lead-lifecycle, ownership of the lead record, or autonomous action on strategy?* → Tier 3 — CRM/human. The forbidden thing is **CRM ownership / sourcing / scoring / autonomy + a hard dependency on a CRM to function** — never feature-overlap.

## Three tiers of authority

### Tier 1 — Hard legal/carrier gates. Split into 1a (platform-enforced) and 1b (tenant-owned), per ADR-CMP-001.

The earlier flat "system enforces all of these, no override" list **over-claimed**. The correct line is **who is the legal actor** (caller-liability vs neutral-conduit safe-harbor — the Twilio/Telnyx model):

#### Tier 1a — Platform/carrier-enforced, NO override (the platform IS the actor)

The system enforces these autonomously and **neither tenant nor human can disable** — because we are the registered/signing party, or the carrier enforces them upstream:

- **STIR/SHAKEN attestation** (we sign as originating provider; Telnyx-provisioned DIDs only)
- **10DLC Brand+Campaign registration gate** + **toll-free verification** (US carriers block unregistered **US** A2P SMS at the network level; **Canada SMS needs no 10DLC** — CASL mechanics + attestation only)
- **CASL SMS sender-ID + functional unsubscribe** (platform-level SMS plumbing)
- **STOP / opt-out auto-suppression** (carrier-recognized keyword; always on and projected into the tenant-wide internal-DNC authority)

These are the **dialer-platform-specific legalities**. They cannot be disabled or cleared as a side effect of contact. The one deliberately narrow exception is a **human manual voice call while internal DNC remains active** (S14-PF-G): power/automatic/SMS stay blocked; the caller must hold the tenant-assigned `calls.dial_internal_dnc` permission, acknowledge a factual warning, provide a reason, and consume a server-bound single-use challenge after every other gate is rechecked. The audit records `manual_internal_dnc_exception`, never a fabricated DNC pass. This exception does not weaken carrier 10DLC/CASL mechanics or create an SMS/automatic override.

#### Tier 1b — Tenant-owned compliance capability: safe-default ON, configurable at the tenant's risk

For these, the **caller (the tenant) is the legally liable party** and the dialer is a neutral conduit. We ship the **capability with a safe default ON** and **log what the system actually did** — but the tenant may configure or disable it, and **owns the legal outcome** (ToS/AUP places the liability on them; it is NOT ours to enforce per-call):

- **Calling-hours** (prospect-local + country-aware — US default 8am–9pm + per-state stricter; Canada CRTC day-of-week windows Mon–Fri 9:00am–9:30pm / Sat–Sun 10:00am–6:00pm, CMP-CA-WINDOW-001; may narrow or disable at own risk)
- **DNC scrubbing** (CMP-005; default ON for dialer-owned lists; scrub-on-import + ≤31-day re-scrub + dial-time freshness; tenant configures sources / may disable)
- **Recording disclosure** (default ON for all-party-consent states + a disclose-always option; configurable where legally optional)
- **PIPEDA disclosure** (default ON for every Canadian call — sub-rule of recording disclosure)
- **Per-recipient consent** (CMP-003 — tenant attestation only; never dialer-tracked)

**Posture for Tier 1b + shared-account self-protection:** safe defaults ON + a ToS/AUP that puts compliance responsibility on the tenant + **abuse/anomaly monitoring with the right to suspend** (protects the shared Telnyx account — a commercial, not legal, exposure). NOT per-call platform enforcement.

**Audit honesty (ARC-004):** when a tenant disables a Tier-1b capability, the `compliance_audit_log` row records `*_pass = null` + basis `{ "enforced": false, "reason": "tenant_disabled" }` — **never a fabricated pass**. The row stays immutable + mandatory; it is the tenant's evidence locker (what the system actually did, per their config).

*(Predictive-abandonment cap was a Tier-1 example, now N/A — predictive scrapped; a single-line, agent-initiated power dialer cannot abandon. ADR-DLR-001.)*

### Tier 2 — System advisory: OPERATIONAL / BUSINESS SIGNALS

For everything operational, the system **detects, surfaces, recommends, and provides capabilities** — but the **human decides and acts.** The system does NOT autonomously mutate state that affects an agent's work or a prospect's treatment. Examples:

- **Number reputation / spam flag** → system records it + notifies the agent/manager ("your number +1… is flagged"). The human decides when to rest/swap it. The system does NOT auto-cool or pull the number from the agent's set.
- **"Safe to release this number?"** → advisory recommendation; human confirms the release.
- **AI disposition draft, battlecard suggestion** → the system proposes; the booker accepts/edits/rejects.
- **"This list is nearly exhausted," "this number is nearing its daily cap"** → notify; human decides.

**Capabilities the human can turn on:** the human may configure the system to apply a Tier-2 action for them — e.g. a power-dialer setting to *skip* spam-flagged numbers when picking the next caller-ID (a soft, per-dial, reversible routing choice). Capabilities are opt-in and visible, not silent.

**Per-tenant opt-in to autonomy (default OFF):** a tenant admin MAY elevate a specific Tier-2 action to autonomous (e.g. "auto-rest flagged numbers") if they explicitly choose it. Default is always human-decides. Never ship a Tier-2 action as autonomous-by-default.

### Tier 3 — Human / CRM authority: STRATEGY + LIFECYCLE

The dialer never does these. They belong to a human or the tenant's CRM:

- Whether/when to pursue a prospect; when to give up
- **Scheduling callbacks** (the dialer has NO scheduled-outbound-callback capability — a "callback" is a disposition TAG that syncs to the CRM; the CRM/human owns scheduling)
- Lead / contact / deal lifecycle, pipeline stages, deal value, lead scoring-for-worth
- Multi-step nurture / drip / cadence sequences over days or weeks
- The conversation itself

The dialer **syncs to the CRM via webhook** (INT-001) and **surfaces context to the human** — it does not become the system of record for the lead, and it does not run outreach on its own.

## The test to apply on every feature

Before building any behavior that changes state or contacts a prospect, ask:

1. **Is it a hard legal/carrier gate?** → Tier 1. Then split (ADR-CMP-001): is the *platform* the actor (STIR/SHAKEN, 10DLC/toll-free, CASL mechanics, STOP/internal-DNC persistence)? → **1a** — enforce and make non-disableable; only S14-PF-G's permissioned, reasoned, single-call **manual voice** exception may contact while the internal-DNC entry stays active. Or is the *tenant* the liable caller (calling hours, **external-registry DNC scrubbing**, recording disclosure, consent)? → **1b** — ship the capability with a safe default ON + log what the system did; the tenant configures it and owns the liability.
2. **Is it operational (which number, whether to keep dialing a flagged number, what the disposition was)?** → Tier 2: system recommends + offers a capability; the human decides; autonomy only via explicit opt-in (default off).
3. **Is it strategy or lead lifecycle (who to pursue, when to call back, pipeline stage)?** → Tier 3: not the dialer's job; sync to CRM, surface to human.

If a proposed feature has the system *autonomously deciding or acting* on a Tier-2 or Tier-3 concern by default, **stop** — that's drift into CRM / automation / human-judgment territory. Reframe it as: detect → notify → recommend → (human acts | explicit opt-in).

## Anti-patterns (bugs even if they compile)

- ❌ System auto-moves a flagged number out of an agent's rotation without the agent's action or an explicit opt-in.
- ❌ System schedules a future outbound dial ("call them back at 3pm tomorrow").
- ❌ System runs a multi-step SMS/nurture sequence on its own.
- ❌ System auto-releases a number the tenant is paying for.
- ❌ System decides which leads are "worth" calling.
- ❌ A disposition "triggers" an internal scheduled action the human didn't choose (beyond a Tier-1 compliance consequence like DNC-on-stop).
- ✅ System applies STIR/SHAKEN attestation + blocks unregistered A2P SMS, no override (Tier 1a — correct).
- ✅ System ships calling-hours/external-registry-DNC/disclosure ON by default, lets the tenant configure or disable at their own risk, and logs honestly what it did — including `tenant_disabled` (Tier 1b — correct).
- ✅ Internal DNC remains active and blocks power/automatic/SMS; a specifically permitted human may make one reasoned manual voice call through a server-consumed challenge, recorded as an exception rather than a pass (Tier 1a persistence + Tier 2 human action — correct).
- ❌ System fabricates `calling_hours_pass = true` (or silently "enforces" a Tier-1b gate the tenant disabled) instead of recording `tenant_disabled` (audit lie — bug).
- ✅ System notifies "your number is flagged" and offers a one-click rest (Tier 2 — correct).
- ✅ Disposition tagged "callback Tuesday" syncs to the CRM; CRM/human schedules (Tier 3 — correct).

## Relationship to other rules

- **ARC-003 (AI Decision Boundary):** who *computes* a judgment. ARC-006: who has authority to *act*. Both apply: AI may draft a disposition (ARC-003), the booker accepts it (ARC-006 Tier 2), and STOP/opt-out suppression is enforced by the system (ARC-006 Tier 1a).
- **Compliance responsibility model (ADR-CMP-001):** the source of the 1a/1b split — Set A (platform-enforced and non-disableable, with S14-PF-G's narrow manual-voice exception that leaves internal DNC active) vs Set B (tenant-owned capability) + the safe-defaults/ToS/abuse-monitoring posture + the in-app 10DLC ISV/CSP registration model.
- **Centralization Doctrine (ARC-005):** the tier of each action + each capability's default lives in a central registry, not hardcoded per surface.
- **Persisted-derived-state lifecycle matrix (ARC-004):** any Tier-2 advisory row (a flag notification, a "safe to release?" recommendation) still gets a lifecycle matrix.
