---
name: audit-bugs-are-decision-residue
description: "Amin's triage lens for audit findings: most 'bugs' (dead CTAs, unrendered DTO fields, orphaned surfaces) are residue of a DELIBERATE design-decision change whose wiring/state wasn't swept — not naive defects. Check decision history first; fix by completing the new decision's states, never by restoring the old path."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5c8d501f-eece-48cb-9b06-62ccc539edda
---

Amin (2026-07-03, during the full page-design audit): "most of bugs found are probably like that where a design decision was changed but the wiring or state wasnt updated properly, keep that in mind when you're looking at the bugs."

**Why:** Canonical example — the rep practice/drill CTA no-op: it used to point to the Improvement Plan; Amin deliberately gated the plan behind Coach+ to save cost, and the CTA was left pointing at nothing. Labeling it "dead button bug → rewire to plan" would silently resurrect a killed decision. The correct fix was a 2-state CTA design (see [[tier-pricing-packaging-direction]]).

**How to apply:**
- Before triaging any dead CTA / unrendered DTO field / orphaned component / unreachable surface as a defect, check whether a deliberate decision (gating, de-scoping, altitude change, tier packaging) removed its destination or consumer — search the decision log, `docs/app-plan/`, backlog, the audit ledger, and memories.
- The fix completes the NEW decision (design the missing state, delete the orphaned producer, sweep the stale wiring) — never restores the superseded path. Re-expanding killed scope is a fresh explicit user decision.
- When writing the audit/plan doc, label such findings "decision residue (incomplete sweep)" rather than "bug", and name the originating decision.
- The recurring control gap this implies: when a product decision changes a destination/entitlement, the same change must sweep every CTA/consumer that pointed at it (Gate 4/10 class).
