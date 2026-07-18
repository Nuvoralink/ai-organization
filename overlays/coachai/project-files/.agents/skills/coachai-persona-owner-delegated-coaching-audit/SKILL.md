---
name: coachai-persona-owner-delegated-coaching-audit
description: Audit Nuvora CoachAI code, UX, dashboards, permissions, coaching visibility, manager accountability, team trends, strict-mode controls, or playbook governance from the lens of the Agency Owner With Delegated Coaching. Use when the user asks for an agency owner lens, owner-level review, delegated coaching audit, manager accountability audit, team visibility audit, or whether the owner can see if coaching is happening and aligned with the agency process.
---

# Agency Owner With Delegated Coaching Audit

## Persona Lens

This persona owns the agency, delegates coaching to managers or trainers, and does not personally review most recordings. They care about scale, visibility, process control, and whether coaching quality is consistent before production drops or new agents fail.

They want control without micromanagement. Their success state is: see coaching coverage, identify neglected reps and recurring weaknesses, confirm manager follow-up, monitor mandatory gate risk, verify Strict Mode and playbook governance, and drill from agency-level signal to manager, rep, call, checklist item, and transcript evidence.

## Product Truths

- Owner view should not look like rep view or a manager call-workbench.
- Owner dashboards must foreground visibility, risk, accountability, trend, and training-system health.
- The owner must see whether coaching is happening, who owns each rep, which feedback is reviewed or followed up, and who is neglected.
- Team-level views need coaching coverage, active coaching, needs-attention queues, score trends, drill completion, mandatory gate/compliance risk, and recurring weaknesses.
- Script gaps and strong rep lines should feed material intelligence and playbook review, not only rep feedback.
- Strict Mode must protect the agency process: unapproved AI-generated lines must not reach agents.
- Line authority must be explicit: approved playbook, script, manager approval, or AI suggestion.

## Audit Workflow

1. Start from the ideal owner outcome: scale coaching with manager leverage, agency-level visibility, and process control.
2. Inspect ownership and accountability data first: org/team/manager/rep relationships, review status, follow-up status, permissions, and visibility filters.
3. Trace recurring weaknesses and risk indicators from source artifacts through aggregation, API contracts, and UI presentation.
4. Verify that playbook-line promotion and script opportunity review preserve authority labels and approval gates.
5. Check whether the product can distinguish agent performance, manager follow-up, and material/script weakness.
6. Treat black-box AI advice, missing audit trails, missing manager ownership, and agent-visible unapproved wording as trust failures.
7. Prefer upstream fixes in schema, DTOs, aggregation services, permissions, and shared coaching helpers over local dashboard-only inference.

## Audit Questions

- Can the owner see whether coaching is happening across the team?
- Can the owner see which manager or trainer is connected to each rep's coaching?
- Can the owner identify neglected reps quickly?
- Can the owner see recurring weaknesses across multiple agents?
- Can the owner see mandatory gate risk at team level?
- Can the owner confirm agents are not receiving unapproved AI-generated lines in Strict Mode?
- Can the owner review and approve new playbook lines created from call analysis?
- Can the owner tell whether the problem is agent performance, manager follow-up, or script weakness?
- Can the owner get value from the dashboard without listening to any full call?

## Output Style

For audits, lead with findings ordered by business and trust risk. Include file and line references when reviewing code. For each material finding, state the owner impact, likely root cause, and the durable fix.
