# Product visual craft

## The governing distinction

Marketing visuals attract and persuade. Product visuals orient, compress, reveal, compare, and enable action. Product UI can be expressive, atmospheric, and memorable, but every strong move must serve the task or product identity.

Familiar controls and interaction behavior are compatible with distinctive product topology and visual language. Earned familiarity is the base; product-specific expression is the differentiator.

## Hierarchy

- Name the focal operation or decision before styling.
- Establish at least three text tiers through size, weight, tone, and spacing—not size alone.
- Use position and surrounding space before adding decoration.
- Let proportions communicate priority: primary workspace dominates supporting context.
- Keep identity, current state, and primary action spatially stable during state transitions.

## Density and rhythm

- Density follows frequency and task: expert/operator zones can be tight; teaching and high-risk confirmation need more space.
- Use smaller spacing within a semantic group and larger spacing between groups.
- Avoid identical padding on every surface and identical gaps across the whole view.
- Vary only through the named spacing scale; visual rhythm is not permission for arbitrary literals.

## Semantic surface system

Useful roles:

1. **Canvas:** the product atmosphere and global orientation layer.
2. **Base surface:** normal work regions.
3. **Raised:** selectable/actionable objects or contained work units.
4. **Recessed:** input, track, or receive-content regions.
5. **Overlay:** temporary context that must sit above its source.
6. **High-attention/live:** a scarce material reserved for an active or urgent semantic state.

The recipes are product-specific. The role system is general. A card is not automatically “raised”; a pane can remain flat while a row, live object, or inspector earns elevation.

## Emphasis budget

Declare which roles may use:

- strongest accent;
- high elevation;
- glow or frost;
- large display type;
- continuous or pulsing motion;
- high-saturation semantic color.

If everything receives the strongest treatment, the semantic system has collapsed.

## Color systems

Keep three governed systems separate:

- **Chrome/action:** selection, focus, navigation, primary action.
- **Semantic state:** success, warning, danger, information, offline, stale, live.
- **Data visualization:** categorical, sequential, diverging, thresholds.

The product may use one main chrome accent while data needs many controlled colors. Preserve assignments across views and add redundant encoding.

## Visual assets

Choose assets based on the user question:

| Need | Useful visual |
|---|---|
| Understand an object | product preview, annotated object, thumbnail, diagram |
| Understand a process | stage tracker, timeline, flow map |
| Understand change | chart, delta, event annotation, before/after |
| Understand status | icon + label + color/shape, signal, progress, freshness |
| Learn the product | illustration, guided preview, contextual diagram |
| Recover from an empty/error state | orientation graphic, product preview, next-step diagram |

Do not put icons beside every heading, use illustration where a table is needed, or chart data solely to fill space.

## Generalized Dialer case study

The strongest reusable lessons from the Auxara Dialer are structural, not stylistic:

- It declares one thesis: an all-day precision instrument with a calm everyday register and a stronger live register.
- The shell paints atmosphere once. Supporting surfaces stay calm; the active work object receives richer material and a stronger state treatment.
- Its main workspace, session status, queue/activity context, script, objections, and controls have different spatial jobs. It is not a uniform card grid.
- The same call object morphs in place across states. Timer, recording cue, waveform, signal, label, and material provide redundant recognition.
- The strongest glow is semantic: connected/live only. It is not a global “premium” effect.
- Responsive behavior changes topology: multi-pane becomes disclose/drill-in/sheet rather than a squeezed desktop layout.

Do not generalize its iris accent, cyan-purple ambient, fonts, glass recipe, two-column proportions, or call-specific visuals. Generalize the visual thesis, semantic emphasis budget, workflow-shaped topology, multi-channel state encoding, and rendered verification.

## Anti-patterns

- every panel is a rounded card with the same shadow;
- a full row of equal KPI tiles regardless of decision priority;
- gray-on-gray minimalism used as the entire art direction;
- decorative gradients or dark-neon styling without a product reason;
- illustration or icon grids used to conceal weak hierarchy;
- a product-specific signature mentioned in prose but absent from the actual mock;
- atmospheric effects authored per component instead of one coherent system layer;
- state colors reused as brand accents;
- motion that makes repeated work slower.
