---
name: persona-lens-product-audit
description: Use when auditing product, UX, code, data flow, dashboards, permissions, generated output, onboarding, reports, or workflows through a specific user persona or stakeholder lens. Trigger when the user asks for a manager lens, rep/end-user lens, owner/admin lens, operator lens, buyer lens, persona audit, whether the product is useful to a target user, or whether a surface helps someone know what to do next.
---

# Persona Lens Product Audit

Use this skill to judge whether the product works for a real person in a real role, not only whether the code renders or the API returns data.

## Start With The Persona Job

Before auditing screens or code, define:

- Who is this person?
- What job are they trying to complete?
- What pressure, risk, or constraint are they under?
- What does success look like in the first 30 to 60 seconds?
- What should they be able to decide or do next?
- What should they not have to interpret, translate, or manually reconcile?

## Common Persona Lenses

Use the user's requested persona when given. If none is given, choose the relevant lens for the surface:

- **New or frontline user**: needs one clear next action, plain language, confidence, practice/help, and no internal diagnostic clutter.
- **Busy manager or operator**: needs prioritization, evidence, triage, approvals, follow-up, and fast drill-down.
- **Owner or executive**: needs visibility, accountability, trend/risk, governance, coverage, and confidence that delegated work is happening.
- **Internal admin/support**: needs diagnostics, auditability, safe tools, and tenant/user boundaries without leaking private data.

## Audit Workflow

1. State the ideal persona outcome in plain language.
2. Inspect the relevant surfaces end to end:
   - source data,
   - permissions,
   - backend contract,
   - persistence/read model,
   - API/DTO,
   - frontend/report/export,
   - empty/loading/error/limited states,
   - tests and smokes.
3. Check whether the product exposes the right level of detail for that persona.
4. Separate user-actionable guidance from internal diagnostics.
5. Verify labels, trust markers, approvals, provenance, and ownership are visible where they matter.
6. Treat confusion, overwhelm, missing next action, contradictory guidance, and untrusted labels as product bugs.
7. Prefer upstream fixes in source authority, DTOs, permissions, ranking, aggregation, prompts, or shared presentation helpers over local copy masking.

## Audit Questions

- Can this persona understand what matters quickly?
- Can they tell what action to take next?
- Can they verify the evidence behind important claims?
- Can they distinguish required work from optional suggestions?
- Can they tell who owns the next step?
- Can they trust whether an item is approved, generated, stale, limited, or unavailable?
- Does the view hide details this persona should not see?
- Does the surface avoid turning raw diagnostics into user-facing product truth?
- Does the product help them feel guided rather than forced to reconcile the system?

## Output

Lead with findings ordered by persona harm and business risk. For each material finding, include the persona impact, likely root cause, durable fix, affected surfaces, and the proof needed to verify the final user-visible behavior.
