---
name: compliance-ux-tos-not-acks
description: "Compliance liability = ONE \"I agree to Terms\" checkbox at signup, NOT granular per-feature acks/consent popups/risk modals anywhere in the app."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-04T07:35:56.514Z
---

Amin (2026-08-03, reviewing the onboarding compliance mock): **remove the "I'm the liable caller" ack
and anything like it — "all these granular popups and getting consent and shit is high friction. no one
is assuming the dialer platform to be responsible if they disable the calling hours."** Compliance
liability is handled the way every other app does it: **a single "I agree to the Terms & Conditions"
checkbox at signup** (the ToS/AUP outlines calling-hours/DNC/recording/etc.). We keep our **internal
immutable audit log** (ARC-004 `compliance_audit_log`) as our own protection. Stop the narratives and
over-complicating compliance.

**This is doctrine-consistent, not a weakening:** ADR-CMP-001 / ARC-006 already state Tier-1b liability
rides on **ToS/AUP + safe-defaults-ON + abuse monitoring**, NOT per-call/per-feature enforcement; and
`auxara-dialer-project-rules §19` (calibrate the threat model) says don't build compliance friction for
schemes the market's own penalties already deter. The granular ack was over-engineering the doctrine.
Tier-1a hard gates (STIR/SHAKEN, 10DLC gate, STOP suppression) are unaffected — those are
platform-enforced, never user acks.

**How to apply, app-wide:**
- Onboarding: NO standalone "compliance confirm" step / liability ack. The T&C checkbox lives on the
  account-creation screen. Safe defaults are just ON; the user can review/edit them in Settings later
  (a low-priority, optional pointer at most — never a gate).
- Settings: compliance section shows the safe defaults + lets the user edit. **This SUPERSEDES
  [[settings-hub-ia]]'s "risk-ack modal ('I'm the liable caller')"** — no liability ack / risk-ack
  modal on enable/disable; the change is just saved and audit-logged. (A plain "are you sure" confirm on
  a destructive edit is fine; a liability/consent ACK is not.)
- Everywhere: no per-feature consent popups, no liability acks, no compliance risk modals.
- Updates the onboarding model in [[visible-surface-audit]] (compliance-confirm step removed).
- Pairs with [[design-conveys-meaning-not-narrative]] and [[no-internal-narrative-in-ui]].

*Fail-state:* a granular compliance consent/ack/liability/risk popup shipped in-product instead of
ToS-at-signup + safe-defaults-ON + the internal audit log.
