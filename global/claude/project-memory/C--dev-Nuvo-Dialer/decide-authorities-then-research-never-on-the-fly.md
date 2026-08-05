---
name: decide-authorities-then-research-never-on-the-fly
description: Amin standing rule — any workflow/UX/decision goes authorities-first → research (patterns + user happy/complaints) → synthesize; NEVER decide on the fly.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-04T17:47:02.267Z
---

Amin (standing directive, reinforced 2026-08-03): **"if you ever need to decide on a workflow, or UX,
or a decision, first check if locked decisions already exist; if it doesn't, then fan out research and
figure out how other apps do things, what users are happy about and what they're complaining about,
then put something together based on that. NEVER just decide on your own on the fly."**

The ladder, mandatory for ANY workflow / UX / product / architecture decision:
1. **Authorities first.** Check the settled/locked truth — decision-log, ADRs, product/PRD/feature-scope
   docs, the always-on rules, central registries, the visible-surface-audit, doc-31 UX benchmarks. If it's
   settled, implement against it; deviating is a STOP, not a choice.
2. **If unsettled → fan out research** (comparable products / industry best practice) — including **what
   users are HAPPY about and what they COMPLAIN about**, not just the pattern. Scale to stakes.
3. **Synthesize** a recommendation from the research (filtered back through the authorities), then bring
   it for approval (visible surfaces are mockup-first + approval-gated).
4. **Never decide on the fly / from your own head.** An invented flow/screen/field-placement is the
   fail-state (proven: the invented onboarding wizard + the card-on-the-credentials-screen, both caught
   only after the fact).

This is the always-on `decision-discipline` rule + the `frontend-design-director` stage-by-stage
research mandate, restated as an Amin directive with the user-sentiment sharpening. Applies to the whole
1.4/1.5 closeout — every gap-surface mock (10DLC dashboard, billing, audit viewer, compliance-viewer)
gets authorities-check → research → synthesize → approval, never an on-the-fly design. See
[[design-conveys-meaning-not-narrative]], [[visible-surface-audit]], [[decision-defaults]].

*Fail-state:* a workflow/UX/decision was made from my own head (or first idea) without first checking
locked decisions and, if unsettled, researching comparable products + user sentiment.
