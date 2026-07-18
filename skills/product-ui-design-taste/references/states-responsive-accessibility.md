# States, responsive behavior, and accessibility

## State matrix

Create a matrix for every meaningful region and action:

| State | What is visible | What can be done | Source truth | Recovery | Visual treatment |
|---|---|---|---|---|---|
| default | | | | | |
| hover/focus/active | | | | | |
| selected | | | | | |
| loading | | | | | |
| empty | | | | | |
| no results | | | | | |
| partial | | | | | |
| error | | | | | |
| stale/reconnecting | | | | | |
| offline | | | | | |
| permission-limited | | | | | |
| destructive/undo | | | | | |

State design is incomplete when it only changes copy. Consider topology, affordances, material, focus, and what remains visible from the last known good state.

## Empty, onboarding, and recovery moments

An empty state may need:

- orientation: what belongs here and why;
- one primary next step;
- an example or product preview;
- an import/connect/create path;
- education about a prerequisite or permission;
- a truthful distinction between “no data,” “filtered to none,” and “cannot access.”

Choose an icon, illustration, diagram, preview, or no asset deliberately. A universal “icon + headline + sentence + button” template is not always enough.

## Motion decision tree

Animate only when it answers one of these:

1. Where did this object come from or go?
2. What state changed?
3. Which elements are causally connected?
4. Is progress occurring?
5. Did the action complete?

Repeated expert actions, stable tables, and routine navigation should be immediate. Use motion mostly for state transitions, overlays, reordering, progress, and completion. Honor reduced motion and never encode meaning only through motion.

## Responsive mode contract

For each relevant band, specify:

```text
Band:
Mode name:
Primary region:
Supporting context:
Navigation:
Action placement:
Representation changes:
What moves to drawer/sheet/drill-in/overflow:
Capabilities that must remain reachable:
```

Preferred transformations:

- multi-pane → primary pane + drawer/sheet/drill-in;
- table → resource cards or list-detail navigation;
- persistent rail → bottom navigation or explicit drawer;
- dense toolbar → primary action + overflow;
- content/action modal → sheet/full screen on narrow screens;
- secondary context → reachable inspector, not silent removal.

Do not add breakpoints that switch nothing. Use container-driven adaptation for reusable composites where project architecture supports it.

## Accessibility contract

- Preserve logical headings, reading order, and focus order across responsive modes.
- Use semantic controls and visible focus.
- Keep status redundant: label plus color/shape/icon/position.
- Provide text/table alternatives for charts when exact values or screen-reader access matter.
- Maintain contrast across light/dark and semantic states.
- Respect reduced motion and avoid flashing.
- Keep controls operable by keyboard and touch; use the project's target-size authority. WCAG 2.2 AA target minimum is 24×24 CSS pixels with exceptions, while products may deliberately adopt larger platform targets.
- Make error location, consequence, and recovery clear.
- Test long labels, zoom, forced colors/high contrast where the project requires it, and localization expansion when applicable.

Accessibility is part of the visual system, not a post-design checklist.
