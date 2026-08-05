---
name: visible-surface-audit
description: The authoritative built-vs-missing visible-surface audit (through Sprint 1.5) + its phasing; replaces the misleading Sprint 1.4 parity ledger.
metadata: 
  node_type: memory
  type: project
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-04T06:32:47.789Z
---

The dialer's visible-build audit lives at `docs/app-plan/implementation/visible-surface-audit.md`
(PR `docs/visible-surface-audit`, committed 2026-08-03). It is the durable answer to "what surfaces
were supposed to be built so far × what's built × what's genuinely missing" — grounded in the screen
inventory (`product/04`) + the page registry (`frontend/src/app/pageRegistry.tsx`), phased against
feature-scope (`product/03`).

**It REPLACES the Sprint 1.4 "Locked-surface parity delivery ledger"** (`sprint-1-4.md`) as the
visible-build authority. That ledger is the "thing biting Amin for 4 weeks" — it conflated
already-built + only-mocked + Phase-2-not-yet-in-scope into one flat "everything missing" list and
repeatedly misdirected mock/build work (incl. the #328 duplicate-surface consolidation). **Do NOT
audit the visible build from that ledger.**

**Result:**
- **5 genuine ≤1.5 gaps to mock then build:** tenant onboarding (multi-step; only `/onboarding/buy`
  exists), 10DLC dashboard, billing (Stripe portal + usage), audit/evidence log viewer,
  compliance-viewer read-only surfaces. All are the pending *visible* layer of the in-flight
  Sprint 1.4/1.5 (backends integrated).
- **Correctly NOT built (Phase 2+, do not mock now):** wallboard, live-monitoring/listen-whisper-barge,
  team reports, my-stats (all F-SV-* supervisor/analytics), custom roles builder (F-MT-003),
  internal-admin cross-tenant surfaces, manager mobile (F-MO-001 deferred).

**Gap #1 (onboarding) SETTLED 2026-08-03 — NOT a multi-step wizard.** Amin rejected the blocking
5-step wizard (his instinct + comparable-product research: progressive/contextual onboarding beats a
linear wizard; doc-31 already flags Convoso's "2-month onboarding" as a complaint). Approved model:
minimal signup → **pick your number IN signup** (area-code suggestions + search → company default
caller ID; reuse the buy-numbers flow) → land in cockpit + test-call prompt → **one compliance-confirm
card** (safe-defaults ON, per-prospect tz/state rules, reuses the "I'm the liable caller" risk-ack) →
a dismissible **home "getting started" checklist** (the real activation surface) carrying 10DLC
(status-surfaced, NON-blocking — voice works now, US SMS vets ~10–15 days, toll-free meanwhile),
invite team, import leads/CRM, add payment to keep the number after trial. **Trial billing =
card-for-verification (authorized, NOT charged during trial)** — defers billing + blunts toll-fraud +
preloads payment (fits the 1.5 saga's Stripe-customer-at-signup). This reframes gap #1's build to
3 surfaces (signup number-pick + compliance-confirm + home checklist); the checklist also carries part
of gap #2 (10DLC) and invites. Mockup-first: mocking those 3 now → Amin approves → build.

Mockup-first still governs for the other gaps (10DLC dashboard, billing, audit/evidence viewer via M08,
compliance-viewer). Backend for billing + 10DLC-campaign is the active Sprint 1.5 plan's next slices
(`sprint-1-5.md` lines 77–108) — Codex builds them AGAINST that plan, not an ad-hoc fork. See
[[user-profile-and-operating-mode]], [[no-widget-mockups]], [[mockup-quality-bar]].
