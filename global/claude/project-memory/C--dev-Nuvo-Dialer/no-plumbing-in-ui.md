---
name: no-plumbing-in-ui
description: "Don't surface non-actionable carrier/platform plumbing in the UI \"in the name of honesty\" — show only what serves the user's task."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c6cb6c0f-fc79-4576-b5c4-e28042c86ce8
---

Amin (2026-06-30): "i dont want carrier plumbing and stuff like this show up in the pages later on either. dont show unnecessary stuff in the page in the name of honesty." Every UI element (field / badge / section / tab / stat) must be **actionable, decision-driving, or explain a real current state** the user is seeing; non-actionable infra/platform plumbing — an always-"A" STIR/SHAKEN attestation badge, a tenant/platform-level constant repeated per object, "encryption: on" / "you're on HTTPS" reassurance — is **noise**, and calling it "transparency/honesty" doesn't make it belong. Trigger: the claude-design Number Detail **"Capabilities & compliance" tab** (per-number attestation grid + 10DLC Brand/Campaign grid) → cut entirely; kept only the one actionable line (`SMS not enabled — set up 10DLC →`); full compliance detail lives once on the tenant 10DLC dashboard.

**Why:** honesty = a real, current, *actionable* state the user needs — padding a page with non-actionable plumbing to look thorough is an info-dump, not honesty. Dialpad/RingCentral surface none of this (the user's own benchmark).

**How to apply:** before any element ships, run the test — *Can the user act on it?* (no → probably doesn't belong) · *Always-same / always-green / platform-or-carrier-handled?* (→ hide, it's plumbing) · *Does it explain something they're seeing — a spam flag, a degraded state, a real failure?* (→ keep; that's the genuine honesty case). Put actionable detail on the surface that **owns** the action (settings/compliance/admin) and **link** to it; never repeat a tenant/platform constant per object. Codified as a **blocking** design rule in `.claude/rules/auxara-dialer-frontend-rules.md` (+ `.codex` mirror) — "Show what serves the task — never carrier/platform plumbing in the name of honesty" — with a named fail-state + the Capabilities-tab anchor, and a cross-ref bullet in `docs/design-system/layout-and-ia.md` §2 (PR #137). The **data** sibling of [[no-internal-narrative-in-ui]] (copy) + the global "honesty without usefulness is pointless" (claims); relates to [[dialer-not-crm-design-boundary]].
