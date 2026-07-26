---
name: coachai-no-outcome-analytics
description: "Amin boundary 2026-07-12 — CoachAI is a coaching product, NOT an outcome-analytics/CRM-reporting product; no book %, conversion rates, outcome-mix KPIs on user dashboards. Outcomes calibrate internally only."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 126ccd11-8654-4fc5-85f2-c2da58ef9771
---

Amin (2026-07-12, sales-signals audit session): his original "it has no CRM connection" remark was aimed at the system repeatedly trying to add **call-outcome analytics — book percentage and similar — to the owner dashboard**. He does not want that class of surface: "i dont want stuff like that."

**Why:** CoachAI's product is coaching (skills, behaviors, moments, drills, improvement) — not conversion-rate BI/CRM reporting. Outcome-rate KPIs drift the product into CRM/analytics territory and invite hindsight-bias coaching. The philosophy doc (`docs/app-plan/coaching-philosophy-outcome-conditioned.md`) already restricts outcomes to **internal calibration** of coaching predictions (never conditioning per-call coaching generation); this memory extends that: outcomes also don't become **user-visible rate KPIs**.

**How to apply:** Treat any user-visible outcome-rate surface in CoachAI as a boundary violation. 2026-07-12 Amin APPROVED removing all four violating surfaces (owner outcome-mix bar in `OwnerBusinessHealthOverview.tsx`, `conversionRate` goal metric, `rep_conversion_drop` alert, team-perf conversion aggregates + the `conversion.ts` helper layer) — removal is in the sales-signals remediation plan. Also settled same day: (a) Amin REMOVED manager outcome-labeling at upload (friction — "managers won't do it"); write path gone from routes, read/compat references remain to reap; (b) outcome truth = supplied dialer disposition when present, else AI-inferred ONCE — single authority, downstream layers reuse, never re-derive per layer; (c) rep-facing daily-digest/score-demotion redesign PARKED as a mockup-first design slice. Internal calibration (`buildOutcomeCalibrationReport`, now fed by dialer dispositions + AI inference) stays legitimate — internal only, never rendered as rates. Related: [[brand-architecture-two-hats]].
