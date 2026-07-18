# Rendered verification rubric

## Evidence required

- approved artifact or explicit design direction;
- actual rendered screenshots at named widths;
- realistic dense, long-label, and degraded-state data;
- state/permission/freshness source truth;
- before/after or concept comparison when redesigning.

Compilation, generated files, and tool statuses are not visual proof.

## Hard-gate checklist

- [ ] The specific person, moment, job verb, and primary operation are evident in hierarchy, content, and action path—not necessarily stated as meta-copy in the product chrome.
- [ ] Verified product facts and provisional assumptions are separated; no unsupported capability or data is rendered as settled truth.
- [ ] One focal region or operation wins.
- [ ] The view is not a default card/KPI/chart/table scaffold.
- [ ] A major new surface/redesign shows the product signature in at least three meaningful manifestations; a small or sparse surface inherits the system-level signature without inventing an unrelated local flourish.
- [ ] Each major visual mechanism has a real question and source.
- [ ] Charts state measure, unit, basis, source/freshness, and action.
- [ ] A shared/ambient display exposes only what every physical viewer may see, uses only available device inputs, and moves private detail/actions to an authenticated companion surface.
- [ ] Existing tokens/components/approved structures were carried or deliberately superseded.
- [ ] Normal, loading, empty, error, stale/offline, permission, and long-content states are coherent where applicable.
- [ ] Responsive modes change composition and preserve capability.
- [ ] Keyboard, focus, contrast, touch, reduced motion, status redundancy, and chart alternatives are covered.
- [ ] Strong accent/elevation/glow/motion stays inside its semantic budget.
- [ ] Required mock approval happened before production implementation.

Any applicable unchecked hard gate blocks approval. Mark a gate N/A only with a brief product-authority reason.

## Visual tests

### Squint test

Blur or reduce the screenshot. The focal operation, major groups, and high-attention states remain legible. If all rectangles have equal weight, fail.

### Swap test

Replace the topology, type treatment, and signature with common SaaS defaults. If little meaning is lost, the design is generic.

### Signature test

For a major new surface/redesign, point to three or more concrete places where the signature changes structure, data representation, material, or interaction. For a small/sparse surface, point to the inherited system signature and confirm there is no conflicting local flourish. “Overall feel” does not count.

### Meaning test

For each chart, icon family, illustration, ambient effect, state treatment, and motion, name the user question it answers. Remove visuals with no answer.

### Card-mosaic test

For every card, name why it is independently actionable, selectable, movable, elevated, or semantically bounded. Convert unjustified cards to panes, rows, sections, dividers, or spacing.

### Token test

Confirm visual values originate from the project system and that new tokens have semantic consumers. A one-off token created for one leaf is still suspicious.

### State test

Open real/loading/empty/no-results/partial/error/stale/offline/permission/destructive states. Check whether actions, emphasis, and recovery remain truthful.

### Responsive test

At each named band, confirm the declared mode, primary region, supporting-context access, action placement, long-label handling, and capability parity.

### Operability test

Walk the primary flow with keyboard and touch assumptions. Check focus, reading order, targets, labels, contrast, reduced motion, and visual alternatives.

## Score major new surfaces and redesigns after hard gates

| Dimension | Points | Evidence |
|---|---:|---|
| Product truth and task model | 15 | person/moment/action/source visibly shape the view |
| Topology and focal hierarchy | 15 | primary region and semantic grouping survive squint test |
| Product-specific visual character | 20 | signature and domain mechanisms survive swap test |
| Typography/density/surface/color craft | 15 | governed hierarchy, rhythm, depth, and palettes |
| Data and operational usefulness | 15 | real questions, truthful states, action paths |
| States/accessibility/responsive | 10 | state matrix, operability, mode parity |
| Rendered verification | 10 | screenshots, comparison, bounded critic loop |

Recommended approval floor for a major new surface/redesign: 85/100 with no applicable hard-gate failure. A generic result cannot average its way past the product-character gate. For a small extension, do not force it to maximize novelty; require coherent inheritance from the approved system and pass all applicable gates.

## Critic loop

Maximum three cycles:

1. Name the largest remaining mismatch with screenshot evidence.
2. Make one scoped correction at the right level: product truth, topology, system, component, or polish.
3. Re-render the same evidence set.
4. Confirm measurable improvement; stop if the criterion did not improve.

Do not oscillate between visual directions or spend a critic cycle polishing a surface that still has the wrong topology.
