# Mock and critique prompts

## Claude Design concept prompt

Use this as a structure, not a fill-in-the-blank excuse to skip product research.

```text
Design a high-fidelity product-interface reference for [surface].

PRODUCT TRUTH
- Person: [specific role and experience]
- Moment: [before/after context]
- Job verb: [task]
- Frequency/stakes: [details]
- Viewing context: [private interactive/shared room/ambient 10-foot/mobile]
- Physical audience and least-privileged viewer: [who can see it]
- Available device inputs: [touch/pointer/keyboard/none] and private companion path: [if needed]
- Primary objects and source data: [real objects, fields, freshness]
- Primary operation: [one operation/decision]
- Dashboard mode: [presentation/exploration/operations/hybrid]
- Permissions and authority boundaries: [details]

ASSUMPTIONS AND OPEN DECISIONS
- Verified facts: [evidence-backed]
- Provisional assumptions: [explicitly labeled]
- Blocking product/design decisions: [only decisions that materially change the result]
- Do not render unsupported capabilities or data as settled product truth.

EXISTING AUTHORITY — PRESERVE
- Approved artifacts: [paths/links]
- Shell/navigation: [details]
- Tokens/type/components/icon family: [details]
- Analogous product surfaces: [details]
- Carry decisions: [list]
- Repair decisions: [list]
- Retire/superseded patterns: [list]

VISUAL DIRECTION
- Thesis: [one sentence]
- Dials: density [x], expression [x], tempo [x], criticality [x]
- Product domain concepts: [5+]
- Natural visual materials: [5+]
- Signature: [product-specific spatial/data/interaction move]
- Signature manifestations: [3+]
- Defaults to reject: [3+]
- Emphasis budget: [what may use strongest accent/elevation/glow/motion]

TOPOLOGY
- Navigation/orientation: [job]
- Primary workspace/focal region: [job]
- Supporting context: [job]
- Action region: [job]
- Inspector/overlay/recovery: [job]

VISUAL-MEANING LEDGER
[mechanism | question answered | source | action | fallback]

REQUIRED CONTENT AND STATES
[realistic content, fields, controls, labels]
[loading, empty, no-results, partial, error, stale/offline, permission, destructive, success]

RESPONSIVE CONTRACT
[band | mode | structural changes | capability parity]

CRAFT REQUIREMENTS
- No generic card mosaic and no decorative charts.
- Use hierarchy, uneven rhythm, semantic depth, and product-specific visuals.
- Keep interface accent, semantic colors, and data colors governed separately.
- Every major visual must communicate orientation, state, priority, change, relationship, causality, action, or identity.
- Preserve accessible semantics, focus, redundant status encoding, and reduced-motion behavior.

DELIVERABLE
- Show [named viewports/states].
- Keep review notes outside the product chrome.
- Make this a visual reference only; do not invent backend capabilities or unsupported data.
```

When the project uses a blocking approval gate, show the result and stop. Do not implement it into production code.

## Three-concept brief

Ask for three genuinely different directions:

```text
Create three product-UI concepts from the same product truth.

Concept A optimizes [priority] through [topology thesis].
Concept B optimizes [priority] through [different topology thesis].
Concept C tests [strong but credible alternative].

They MUST differ in topology, focal region, density, supporting-context model, signature visual mechanism, and interaction tempo. Palette or font swaps do not count. For each concept, show the same realistic data and states so the comparison is fair. Include the strongest reason to reject each concept outside the UI.
```

## Visual critique prompt

```text
Critique this rendered product surface against its approved artifact and product intent.

Inspect in order:
1. product truth and primary operation;
2. topology and focal hierarchy;
3. product-specific signature and visual-meaning ledger;
4. typography, density, depth, and color systems;
5. data truth, states, permissions, and recovery;
6. responsive mode and capability parity;
7. accessibility and interaction feedback.

Run the squint, swap, signature, meaning, card-mosaic, token, state, responsive, and operability tests. Name the single largest remaining mismatch, cite visible evidence, and propose one bounded correction. Do not praise compliance or suggest ornamental polish while a structural failure remains.
```

## Anti-basic dashboard correction prompt

```text
The current dashboard is visually competent but generic. Do not improve it by adding more cards, gradients, icons, or decorative charts.

First identify the actual person, moment, primary decision, exception model, and action path. Then redesign the topology around the product's real work. Introduce at least three meaningful visual mechanisms from different categories, define one product-owned signature, and reserve strong emphasis for named semantic roles. Preserve the existing design system and real data contracts. Produce three structural concepts and show realistic normal, stale, error, and permission states at desktop and mobile widths.
```
