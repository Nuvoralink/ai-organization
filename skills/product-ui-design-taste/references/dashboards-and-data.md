# Dashboards and data interfaces

## Declare the viewing context

Before choosing a dashboard mode, state whether the surface is:

- a private interactive workspace;
- a shared room display or TV wallboard;
- an ambient/10-foot display glanced at while doing other work;
- a mobile/on-the-move status view.

For shared or ambient displays, design for distance, short dwell time, automatic freshness, and a known audience. The least-privileged physical viewer—not the signed-in account—sets the visibility boundary. Minimize names, phone numbers, customer details, transcripts, health/financial data, and other sensitive fields; show aggregate, pseudonymous, or exception-level information unless product/security authority proves every viewer may see more. Never assume that logged-in authorization makes a room-visible screen private. Inventory the device's actual inputs and never make hover, focus, keyboard, pointer, or touch the only route on a non-interactive display; move record-level detail and actions to an authenticated private companion surface.

## Choose the mode

### Presentation dashboard

Goal: orient and direct attention.

- Keep the metric set small and prioritized.
- Make the comparison basis explicit.
- Use annotations or exception summaries to explain why something matters.
- Provide a clear path to the detailed surface.

### Exploration dashboard

Goal: investigate and compare.

- Support search, filter, sort, drill-down, linked highlighting, and persistent query state.
- Keep relationships between charts/tables clear.
- Preserve filter scope and show active constraints.
- Allow data access through table/export where appropriate.

### Operations dashboard

Goal: understand now, find exceptions, act, and recover.

- Emphasize live/stale state, ownership, urgency, exceptions, and next action.
- Keep the primary operational object or queue visible.
- Show recovery and degraded-state behavior.
- Prefer task-shaped regions over a KPI gallery.

## Separate wallboard glance from analytics drill-down

A shared wallboard answers: “Are we healthy now, where is attention needed, and who owns the next operational response?” It is not the place for dense filtering, record-level investigation, or sensitive detail.

Provide a separate private/interactive analytics or operations surface for search, filter, comparison, diagnosis, and record-level action. The wallboard may link or hand off to that surface, but it should not accumulate its controls and data until it becomes an unreadable analytics dashboard at distance.

## Visualization decision guide

| User question | Default representation |
|---|---|
| What is the exact current value? | number + unit + basis |
| Did it change? | delta + small trend or annotated time series |
| How did it change over time? | line/area chart |
| Which categories differ? | sorted bar/dot plot |
| What is the distribution? | histogram/box/violin as audience permits |
| What contributes to a whole? | stacked bar; pie/donut only for few stable parts |
| Where is it? | map only when geography changes the decision |
| What happened in sequence? | timeline/event stream |
| Where is an item in a process? | stage tracker/state machine |
| Which records require action? | prioritized table/list/queue |

Every chart must name its question, measure, unit, time/comparison basis, source/freshness, and intended action. Every rate or percentage must also name its numerator, denominator, evaluation window, and excluded/unknown population.

## Data-visualization craft

- Give charts informative titles, not only metric names.
- Label axes and units; avoid legends for a single series.
- Limit competing series and preserve color assignments.
- Annotate important events, thresholds, targets, and data gaps.
- Use accessible redundant encoding and provide a tabular alternative when users need exact values.
- Distinguish missing, zero, unavailable, and not-applicable.
- Never invent data to make a visual look populated in a production implementation. In a mock, label fixtures honestly outside the product chrome.

## Tables, resource lists, and data grids

Use a table when users compare attributes across many records. Use a resource list when identity, status, and one or two actions dominate. Use a data grid only when cell-level navigation/editing, large data, or advanced interaction justifies it.

Table checklist:

- identity/primary object is the first strong column;
- only decision-relevant columns are present;
- numeric columns are right-aligned with tabular numerals;
- headers are concise and explain units/basis;
- row, bulk, and destructive actions are distinguishable;
- filter/search/sort state is visible and recoverable;
- selected and keyboard-focused rows are clear;
- loading, empty, no-results, partial, stale, permission, error, and pagination/end states exist;
- narrow layouts recompose to a resource card or drill-in instead of horizontal squeeze.

## Real-time state model

Define and visually separate:

- live and current;
- delayed but usable;
- stale with last-known value and timestamp;
- reconnecting;
- partial/degraded;
- offline/unavailable;
- terminal/ended.

State must affect both presentation and permitted actions. Do not show a live-looking control over stale authority. Avoid continuous pulse unless something is genuinely live and the emphasis budget allows it.

## Visual-meaning ledger examples

| Mechanism | Question | Source | Action |
|---|---|---|---|
| annotated time series | When did conversion drop, and what changed? | event + metric stream | inspect affected interval |
| queue topology | Where is work stuck? | queue state + ownership | reassign or resolve blocker |
| stage tracker | What is blocking completion? | workflow events | complete current requirement |
| provenance badge | Can I trust this value? | source + freshness metadata | inspect evidence or refresh |
| activity field | Is the system moving now? | live events | monitor or recover connection |
