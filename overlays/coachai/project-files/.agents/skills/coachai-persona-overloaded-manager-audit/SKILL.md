---
name: coachai-persona-overloaded-manager-audit
description: Audit Nuvora CoachAI code, UX, data flows, dashboards, call review screens, coaching feedback, strict-mode behavior, or manager workflows from the lens of the Overloaded New-Agent Manager. Use when the user asks for a persona audit, manager-lens review, new-agent manager review, hiring manager review, training manager review, or whether the product helps managers know who to coach, what to fix, and what agents should say next.
---

# Overloaded New-Agent Manager Audit

## Persona Lens

This persona is responsible for coaching 10 to 20 new agents and may face 30 to 80 recordings per batch. They are busy, reactive, and trying to find the highest-priority coaching issue without listening to every minute.

They need leverage, not more review work. Their success state is: open the dashboard, know who needs attention, understand the call verdict, verify transcript-backed evidence, approve or edit suggested lines, assign a focused next-call improvement, and track progress on later recordings.

## Product Truths

- The manager dashboard must prioritize urgency and next action over browsing.
- The coach verdict must be visible before detailed notes.
- Feedback must distinguish required script misses, mandatory gate risk, scored coaching issues, optional craft tips, and material/script opportunities.
- Every coaching point should provide fast navigation to the exact call moment and transcript evidence.
- Suggested wording must be manager-controlled and clearly labeled as approved playbook, script-derived, manager-approved, or AI suggestion.
- Strict Mode should protect agents from unsafe or off-process wording by default.
- Improvement plans should make the next practice step obvious and track whether the same agent improves in future calls.

## Audit Workflow

1. Start from the ideal manager outcome: review more calls, catch priority misses, approve safe wording, and track improvement.
2. Inspect the relevant surfaces end to end: backend contracts, persisted coaching entities, shared DTOs, scoring/ranking helpers, API routes, frontend dashboard/call-review UI, and tests.
3. Check whether source-of-truth data exists upstream instead of being inferred from narrative text in the UI.
4. Verify coaching lane separation:
   - `manager_accountability`: rep versus approved org materials.
   - `craft_excellence`: universal sales execution.
   - `material_intelligence`: script/playbook/material work, not rep failure.
5. Treat missing trust labels, missing approval controls, weak evidence links, or dashboard ambiguity as product bugs, not polish nits.
6. Prefer root-cause fixes in shared helpers, DTOs, pipeline output, persistence, ranking, or permissions over one-off frontend workarounds.

## Audit Questions

- Can the manager find the highest-priority rep in under 30 seconds?
- Can the manager understand the main issue of a call without reading the full transcript?
- Can the manager verify evidence behind a coaching point quickly?
- Can the manager approve, reject, or edit AI-suggested lines?
- Can the manager see which feedback is grounded in script or playbook?
- Can the manager track whether the same agent improved on the next uploaded call?
- Can the manager distinguish a required script miss from an optional coaching suggestion?
- Can the manager act from the dashboard without training?
- Does the product avoid generic summaries, vague sales theory, and dashboards full of metrics with no next action?

## Output Style

For audits, lead with findings ordered by user/product risk. Include file and line references when reviewing code. For each material finding, state the manager impact, likely root cause, and the durable fix.
