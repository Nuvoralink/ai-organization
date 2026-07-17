---
name: product-ui-design-taste
description: "Craft-first product interface design for dashboards, admin panels, SaaS applications, operational cockpits, settings, queues, tables, analytics, data-heavy tools, and product mockups. MUST use when creating, prompting, reviewing, or redesigning product UI—especially when the user says it looks basic, bland, generic, template-like, card-heavy, or AI-generated. Produces distinctive task-shaped concepts, a Claude Design-ready brief, state and responsive contracts, and rendered-quality gates. Not for landing pages, campaigns, portfolios, or brand-only marketing surfaces; use the marketing Taste skill for those."
---

# Product UI Design Taste

Design product interfaces whose visual language compresses the product's real work. A dashboard becomes rich through meaningful hierarchy, topology, state, chronology, comparison, and action—not by adding ornamental charts, gradients, or more cards.

This is the product-UI surface lens under `frontend-design-director`. Existing project authority, approved mocks, tokens, components, product rules, and real data contracts outrank this skill.

## Boundary and authority

Use this skill for:

- dashboards, admin panels, SaaS applications, internal tools, and operational workspaces;
- settings, onboarding, queues, tables, search/filter flows, inspectors, and multi-step workflows;
- product mockups, Claude Design briefs, product redesigns, visual audits, and anti-slop critiques;
- analytics, monitoring, real-time status, and data visualization inside a product.

Do not use it as the primary lens for marketing/editorial pages. Do not create a parallel `DESIGN.md`, token set, or component system when the project already has an authority. Do not code a visible change before approval when global or project rules require a mock first.

Apply authority in this order:

1. Current user direction and approved visual artifact.
2. Global/project approval and product rules.
3. Existing product intent, data/action contracts, design system, and analogous shipped surfaces.
4. This skill.
5. General patterns and external references.

## Non-negotiable outcome

A successful concept must make these five things obvious without explanation:

1. Who is using it and in what moment.
2. What they need to notice or decide now.
3. What the primary operation is.
4. What is live, changed, exceptional, or blocked.
5. What makes this product recognizably itself.

If the result can be summarized as “sidebar + header + KPI cards + chart + table,” it has not been designed yet.

## Workflow

### 1. Declare the product design read

Before proposing a direction, write one compact block:

```text
Person: [specific role, experience, environment]
Moment: [what happened just before; what happens next]
Job verb: [monitor, decide, triage, configure, compare, resolve, create]
Frequency and stakes: [occasional/continuous; reversible/high-risk]
Viewing context: [private interactive | shared room display | ambient/10-foot | mobile/on-the-move]
Source truth: [real objects, events, metrics, permissions, freshness]
Primary operation: [the one action or decision the view must accelerate]
Dashboard mode: [presentation | exploration | operations | hybrid]
Approval state: [required/pending/approved/exempt by named rule]
```

Generic labels such as “admin user” or “modern dashboard” fail. Name the real human, scene, and verb.

If essential product truth is unavailable, separate verified facts from provisional assumptions. Use responsible assumptions for low-risk concept hypotheses, but do not call a brief renderer-ready or present unsupported data/actions as settled until the person, moment, primary object, source truth, permissions, and primary operation are grounded. Inspect available product evidence before asking the user to supply technical details.

Dashboard modes:

- **Presentation:** summarize, orient, and focus attention. Limit metrics and explanation paths. State whether it is a private interactive view or a shared/ambient wallboard; distance, dwell time, privacy, and available interaction materially change the design.
- **Exploration:** compare, filter, search, drill down, and connect views.
- **Operations:** show current state, exceptions, next action, ownership, and recovery.
- **Hybrid:** define which region owns each mode; do not blur all three into one equal-weight canvas.

For a shared or ambient display, derive content and interaction from the physical audience and the inputs the device actually provides. Treat the least-privileged person who can see the display as its visibility boundary: aggregate, redact, or suppress customer/contact and confidential account, recording, or workflow detail unless every viewer is authorized. Never require hover, focus, keyboard, pointer, or touch on a non-interactive display. Move sensitive record-level detail and actions to an authenticated private companion surface.

- **Fail-state:** a room-visible wallboard exposes record-level customer/contact information or instructs viewers to use an unavailable hover/private interaction.
- **Regression mutation:** add customer-name/contact columns and hover-only confidential detail to a shared wallboard; the privacy/interaction gate must reject it.
- **Counterexample:** an authenticated manager view on a private device may show authorized record-level detail and explicit interactive drill-down; hover may enhance that view but must not be the only access path.

Read [product-context-and-concepts.md](references/product-context-and-concepts.md) for discovery and audit templates.

### 2. Audit the current product before inventing

Inspect:

- product intent, actual user journey, source data, permissions, and action contracts;
- approved mocks and rendered screenshots at relevant widths;
- shell, navigation, page topology, tokens, typography, primitives, iconography, motion, and charts;
- two or three analogous in-product surfaces;
- loading, empty, error, stale, permission, destructive, and long-content behavior.

Classify findings as:

- **Carry:** coherent, proven, and authoritative.
- **Repair:** the right concept with weak execution or missing states.
- **Retire:** legacy, generic, duplicated, misleading, or superseded.

Never treat a design doc or component inventory as proof that the rendered system is good. Open the real artifact.

### 3. Explore the product's own visual territory

Produce all of the following before a major concept:

- **Domain concepts:** at least five ideas, states, artifacts, or relationships from the product's world.
- **Natural visual materials:** colors, light, texture, geometry, instruments, documents, maps, traces, or physical analogues that genuinely exist in that world.
- **Defaults to reject:** at least three obvious visual or structural templates for this product category.
- **Signature:** one visual, spatial, data, or interaction move that could only belong to this product.
- **Richness sentence:** how visual richness will improve orientation, status recognition, comparison, decision, or action.

The signature is not a logo stamped on cards. On a major new surface or redesign, it must propagate through at least three meaningful moments or components while preserving familiar controls. A small or sparse surface should inherit the system-level signature and need not invent three local manifestations.

### 4. Set the design dials

Declare four dials. Use words plus a short reason; numbers are optional.

- **Information density:** focused ↔ cockpit.
- **Visual expression:** quiet utility ↔ atmospheric instrument.
- **Interaction tempo:** deliberate ↔ real-time.
- **Operational criticality:** forgiving ↔ high-stakes.

These dials govern hierarchy, spacing rhythm, depth, color, motion, and the amount of persistent context. Do not equate “product UI” with automatically flat, gray, or restrained.

### 5. Design topology before components

Name the regions before choosing cards:

- navigation/orientation;
- primary workspace or focal decision;
- supporting context;
- action region;
- transient overlay, inspector, drawer, or recovery layer.

Each region must have one job and a stated relationship to the focal operation. Use panes, rows, stages, canvases, timelines, lists, tables, or overlays as appropriate. A card is justified only when the content is independently actionable, movable, selectable, elevated, or semantically bounded.

Avoid equal rectangles, gaps, padding, and emphasis across unrelated major regions. Repeated peer elements may share geometry when equality is meaningful. Vary broader rhythm using the project's named scale: dense within repeated work zones, more space between semantic regions.

### 6. Build a visual-meaning ledger

For every major visual mechanism, record what it communicates:

```text
Visual mechanism | User question answered | Source truth | Action/decision enabled | Fallback/a11y encoding
```

Useful mechanisms include:

- timelines, stage trackers, topology maps, provenance trails, annotated charts, and object previews;
- live activity fields, queue movement, waveforms, signal strength, progress, freshness, and ownership;
- meaningful icons, diagrams, product previews, restrained illustration, and spatial state changes;
- semantic material changes, typography shifts, or motion that reveal causality.

For a major dashboard/mock, choose at least three applicable mechanisms from different categories. Fewer is acceptable only when the interface is genuinely sparse and the design brief explains why. Every mechanism must encode orientation, state, priority, change, relationship, causality, action, or identity. Decorative mini-charts and arbitrary blobs fail.

Explicitly decide whether the surface needs imagery, illustration, diagrams, iconography, product previews, texture, or none. “No illustrations” and “add a stock photo” are both lazy defaults.

### 7. Establish the craft system

#### Hierarchy and type

- Give each view one focal operation or decision; make it win through position, contrast, scale, or space.
- Use size, weight, tone, and spacing together. Do not make every label/value pair look alike.
- Preserve the existing type family unless a new family is an approved system decision.
- Use tabular numerals for changing values and aligned quantitative columns; use mono only when its semantics help.
- The squint test must reveal the focal region and major groups.

#### Surface and depth

- Paint atmosphere at the canvas/system layer, not independently inside every card.
- Define semantic depth roles such as canvas, base, raised, recessed, overlay, and high-attention/live.
- Reserve the strongest glow, frost, elevation, scale, and motion for named meanings.
- Use surface shifts, borders, shadows, and blur to explain containment and stacking—not to decorate.
- Do not apply the same radius, shadow, and material to every region.

#### Color

- Separate interface accent, semantic state colors, and data-visualization palettes.
- Keep action/selection accent scarce; state colors must not be confused with brand.
- Preserve consistent categorical color assignments across views.
- Never rely on color alone; pair with label, icon, shape, stroke, texture, or position.
- Atmospheric color must arise from the product thesis. Generic dark navy plus purple glow is not automatically premium.

#### Iconography, illustration, and imagery

- Icons accelerate scanning, label commands, or reinforce status; they are not decoration for every label.
- Illustration is most useful for onboarding, education, empty states, recovery, and conceptual explanation.
- Product previews and domain diagrams can be more valuable than stock photography in application UI.
- Use a coherent icon/illustration family and preserve accessible labels for controls.

Read [product-visual-craft.md](references/product-visual-craft.md) for the full craft rubric and the generalized Dialer case study.

### 8. Make data and operations truthful

For every metric or visualization, state:

- the user question;
- measure and unit;
- for a rate or percentage: numerator, denominator, evaluation window, and excluded/unknown population;
- time/comparison basis;
- source and freshness;
- threshold, target, or benchmark when relevant;
- intended action or drill-down.

Choose a chart only when shape, change, distribution, relationship, or comparison matters. Use a number, sentence, status, table, or timeline when it answers the question better. Give charts labels, accessible alternatives, and consistent encodings.

Tables must answer whether a table, resource list, or data grid is actually needed. Keep identity prominent, include only decision-relevant columns, align numeric data, expose filters/actions, and design loading, empty, no-results, partial, stale, permission, and error states. Recompose rather than horizontally squeeze on small screens.

For real-time surfaces, distinguish live, delayed, stale, reconnecting, offline, partial, and terminal. A silently frozen dashboard is a product failure.

Read [dashboards-and-data.md](references/dashboards-and-data.md).

### 9. Generate structurally different concepts

Before a major new surface or redesign, create three concepts unless the project has already approved one direction. They must differ in:

- topology and focal region;
- hierarchy and information density;
- signature visual mechanism;
- navigation/context model;
- material, color, or interaction tempo.

Palette swaps do not count. Each concept includes:

1. Product design read and dials.
2. One-sentence thesis.
3. Region map and primary operation.
4. Visual-meaning ledger.
5. State matrix.
6. Responsive mode contract.
7. Carry/repair/retire relation to the current system.
8. Risks and the strongest reason not to choose it.

Use [mock-and-critique-prompts.md](references/mock-and-critique-prompts.md) to produce a self-contained Claude Design prompt and comparison brief. If approval is blocking, show the concepts and stop before implementation.

### 10. Design states, interaction, and responsive modes

Cover applicable states: default, hover, focus, active, selected, disabled, loading, empty, no-results, partial, error, success, stale, offline/reconnecting, permission-limited, destructive confirmation, undo/recovery, and long-content/overflow.

Motion is allowed when it explains origin, relationship, state transition, causality, progress, or completion. Repeated expert actions should feel immediate. Avoid page-load choreography, decorative pulsing, and animated data that obscures comparison. Honor reduced motion.

Responsive design changes composition, not just dimensions. Define a mode per relevant band and state what moves into a drawer, sheet, drill-in, tabs, card list, overflow action, or alternate visualization. Essential capability remains reachable.

Read [states-responsive-accessibility.md](references/states-responsive-accessibility.md).

### 11. Implement only from the approved source

After approval:

- reuse existing components, tokens, and source registries;
- add new semantic tokens/primitives at the system source, not the leaf;
- keep structure, product logic, polish, and responsive work traceable to the approved reference;
- preserve permission, accessibility, source-to-screen, and recovery contracts;
- remove or explicitly demote superseded visual paths instead of layering a second system.

### 12. Verify the rendered result

Render realistic data at named desktop and mobile widths. Inspect actual screenshots, not build status. Use at most three critic cycles; each cycle fixes the largest remaining mismatch and must show monotonic improvement.

Run:

- **Squint test:** focal hierarchy and groups remain obvious when blurred.
- **Swap test:** replacing the signature/topology with a common template materially weakens the product.
- **Signature test:** for a major new surface/redesign, point to at least three concrete manifestations; for a small/sparse surface, show how it inherits the system-level signature without a conflicting local flourish.
- **Meaning test:** every major visual mechanism answers a user question.
- **Card-mosaic test:** cards exist for semantic reasons, not as default layout punctuation.
- **Token test:** no parallel values or one-off visual system was created.
- **State test:** realistic failure, stale, permission, and long-content states remain coherent.
- **Responsive test:** composition changes as contracted and capabilities remain reachable.
- **Operability test:** keyboard, focus, touch, contrast, reduced motion, labels, and data alternatives work.

Read [verification-rubric.md](references/verification-rubric.md).

### 13. Close the skill-evolution loop

Before finalizing, ask whether this skill or `frontend-design-director` caused, missed, or failed to prevent a real design failure, routing gap, stale rule, generic output, misleading data treatment, or reusable better method. If yes, load `skill-evolution-loop` and run it in the same task:

- keep project-specific product/brand decisions in the project authority;
- patch this global skill only when the principle generalizes across product interfaces;
- update the director or trigger metadata when the specialist was not selected correctly;
- add the old failure as a regression mutation and a nearby valid counterexample;
- validate the changed skill and forward-test the observed case plus a structurally different case.

One proven structural loophole is enough; do not wait for recurrence. Do not add a retrospective note without changing the controlling instruction, trigger, rubric, or test. If no gap was exposed, report `Skill-loop findings: none`.

## Hard failures

Do not approve or call complete when any applies:

- generic card mosaic or default dashboard scaffold;
- for a major new surface/redesign, no product-specific signature or domain visual mechanism; for a smaller surface, failure to inherit the product's existing signature coherently;
- no obvious focal operation, decision, or exception;
- chart without a stated user question or action;
- visuals that carry no meaning;
- existing project system ignored or a parallel design authority created;
- only the happy path was designed;
- desktop layout merely squeezed onto smaller screens;
- strong emphasis effects have no semantic budget;
- a shared/ambient display exposes information not authorized for every physical viewer or depends on interaction the display does not provide;
- mock approval was bypassed where required;
- no rendered proof for a material visible change.

## Scored quality rubric

For a major new surface or redesign, score only after hard failures are cleared. For a small extension, use the applicable hard gates and verify coherent inheritance instead of forcing novelty for its own sake.

- Product truth and task model — 15
- Topology and focal hierarchy — 15
- Product-specific visual character — 20
- Typography, density, surface, and color craft — 15
- Data and operational usefulness — 15
- States, accessibility, and responsive behavior — 10
- Rendered verification and iteration — 10

A polished generic dashboard cannot pass because product-specific visual character is both a hard gate and the largest scored dimension. Mutation: replace its domain visuals and signature with generic KPI cards; the rubric must reject the result.

## Completion output

Report:

1. Product design read, dials, and selected authority.
2. Current-system carry/repair/retire findings.
3. Chosen concept and rejected concepts with reasons.
4. Product signature and visual-meaning ledger.
5. State and responsive contracts.
6. Approval state and authoritative artifact.
7. Rendered evidence at named viewports when implementation changed.
8. Remaining visual debt or surfaces not reached.
9. Skill-loop findings and any same-task skill improvement made.

## Research basis

Read [research-basis.md](references/research-basis.md) when evaluating competing advice or updating this skill. It records the primary design-system sources, public skill leads, contradictions, and deliberate resolutions used here.
