# VisualForge Glossary

Definitions for terms VisualForge uses across all subskills. Every term that appears in a generated doc resolves here.

## Core vocabulary

- **Design system** — the integrated set of brand identity, design tokens, components, patterns, content rules, motion, and accessibility contracts that the product is built from. VisualForge's primary output.
- **Token** — a named design value. Has a tier (primitive / semantic / component).
- **Primitive token (Tier 1)** — raw values (`color.gray.500`, `size.4`, `duration.fast`). Only referenced by other tokens, never by app code.
- **Semantic token (Tier 2)** — role-based reference to one or more primitives (`surface.elevated`, `text.primary`). App code references this tier.
- **Component token (Tier 3)** — component-scoped reference to semantic tokens (`button.primary.bg.rest`). Used only inside component internals.
- **Decision card** — a record in `auditability/decision-log.md` capturing one design choice with options considered, rationale, alternatives rejected, confidence, evidence, bound artifacts, and reversal trigger.
- **DEC-NNN** — stable identifier for a decision card. Allocated per `_visualforge-shared/references/decision-id-allocation.md`.
- **Subskill** — one of the 30 VisualForge skills, each owning a specific design domain. Invoked individually or via the `visualforge` orchestrator.
- **Orchestrator** — the top-level `visualforge` skill that detects mode, sequences subskills, manages the pressure-test feedback loop, and finalizes outputs.

## Modes

- **Greenfield mode** — no existing frontend code, no Specforge docs. Full discovery + full design generation.
- **Specforge-enhanced mode** — Specforge product/architecture docs at `docs/app-plan/`. VisualForge reads them as input context and produces the design layer.
- **Retrofit mode** — existing frontend code present. VisualForge inventories what exists, generates the ideal independently, then computes drift and produces a phased migration plan.

## Quality concepts

- **Slop** — generic AI-generated content lacking specific values, evidence, alternatives, or actionable behavior. The anti-slop rubric enumerates patterns.
- **Sources and basis** — required section at the bottom of every generated doc summarizing the source labels (User-confirmed / Specforge-derived / Repo-derived / Research-backed / Standard-backed / Assumption) used.
- **Confidence** — High / Medium / Low rating per decision indicating how strongly the evidence supports the choice.
- **Reversal trigger** — observable post-launch signal that would cause the decision to be revisited.
- **Anti-pattern** — a known-bad design choice cataloged in the decision-quality protocol; the agent checks against the catalog before committing.
- **Weighting profile** — the per-product prioritization across the 8 decision criteria (Premium consumer / Performance-critical / Accessibility-critical / Enterprise / Developer tool / Regulated / Time-pressured / Custom).
- **Trend-fit test** — five-check evaluation (audience, platform, brand, cost, fallback) for whether to adopt a current design movement.

## Personas

- **Primary persona** — modal user the product is optimized for.
- **Secondary persona** — supported user, not optimized for.
- **Anti-persona** — user the product is explicitly not for.
- **Edge-case persona** — non-modal pattern (temporary, infrequent, returning-after-gap, over-shoulder).
- **Pair scenario** — two personas interacting (manager + employee, doctor + patient).
- **Day-in-the-life narrative** — 4–6 sentence placement of product in persona's actual time / context.
- **Validation plan** — how to confirm the persona is real once the product ships.

## UX / journey concepts

- **Journey map** — multi-stage view of a persona's relationship with the product over time.
- **Task flow** — step-by-step view of one task with happy / error / empty / permission paths.
- **Moments of truth** — 3–5 moments where the product must shine.
- **Trust formation moment** — specific moment where user trust is built or lost (first sign-up, first payment, first share, first failure).
- **Service blueprint** — frontstage user actions paired with backstage system / support / failure modes per task.
- **Interruption recovery** — design contract for resuming a task after the user is interrupted.
- **Frustration recovery** — design response when the user is stuck (beyond errors).
- **Lifecycle stage** — Day 0 / Day 1–7 / Day 8–30 / Day 31–90 / Day 90+ / Dormant / Returning-after-gap / Churn-risk / Departure.

## Structure

- **Information architecture (IA)** — how content and features are organized, navigated, named, and reached.
- **Site map / app map** — rendered tree of all screens with annotations.
- **Layout shell** — the top-level chrome (top-bar / side-rail / hybrid / mobile tab bar).
- **Layout pattern** — named recurring assembly (Dashboard / List+Detail / Feed / Form / Detail-Document / Marketing).
- **IA restructuring (retrofit only)** — analysis pass identifying page splits, merges, missing, misplaced, orphan, dead-end, and role-leak findings.

## Components

- **Primitive component** — composes tokens only (Button, Input).
- **Composite component** — composes primitives (Card, Dialog, Tabs).
- **Pattern component** — page-level chrome composing composites (TopBar, DataTable, FilterBar).
- **Domain component** — product-specific composite that does not generalize.
- **Variant** — fixed-set prop changing component appearance (primary, secondary, ghost).
- **Size** — fixed-set prop changing component dimensions (xs, sm, md, lg).
- **State** — runtime visual condition (default, hover, focus-visible, active, disabled, loading, error, success, selected, dragging, indeterminate, readonly).
- **Slot** — composition point inside a component (start-icon, label, end-icon).
- **Library adopt / extend / replace** — per-component decision on how to use the chosen component library (use as-is / wrap with our tokens / heavy custom style / replace entirely).

## Accessibility

- **WCAG 2.2** — Web Content Accessibility Guidelines version 2.2. Target levels: A / AA / AA+ / AAA.
- **Success Criterion (SC)** — individual WCAG requirement (e.g., 1.4.3, 2.4.7).
- **Assistive technology (AT)** — screen reader (NVDA / JAWS / VoiceOver / TalkBack), magnifier, voice control (Dragon / Voice Access), switch control.
- **Reduced-motion** — `prefers-reduced-motion: reduce` media query honored by every animation.
- **Reduced-transparency** — `prefers-reduced-transparency: reduce` honored by glass / backdrop-blur surfaces.
- **High-contrast / forced-colors** — Windows high-contrast mode; design respects system color tokens.
- **Per-persona AT walkthrough** — end-to-end task simulation using a specific persona's assistive technology profile.

## Motion / interaction

- **Duration token** — named time value (fast / base / slow / slower / enter / exit / expressive).
- **Easing token** — named curve (linear / standard / emphasized / decelerate / accelerate / spring-gentle / spring-snappy / spring-bouncy).
- **Choreography** — coordinated multi-element motion (parallel / staggered / cascade).
- **Signature moment** — deliberate expressive motion at a key product moment.
- **Micro-interaction** — small interaction feedback (hover / focus / press / drag / tooltip / loading).

## Surfaces

- **Surface treatment** — material choice for a surface (flat / multi-layer shadow / glass / textured / gradient).
- **Elevation level** — depth tier from 0 (flat) through 5 (top overlay) — drives shadow token used.
- **Glass / backdrop-filter** — translucent surface with blur of underlying content. Requires `prefers-reduced-transparency` fallback.
- **Liquid Glass** — Apple's iOS 26 / macOS 26 multi-layer translucent material with environmental light response.

## Figma

- **Figma MCP** — Model Context Protocol integration with Figma allowing programmatic file operations.
- **Variable (Figma)** — design token equivalent in Figma's Variables feature; can be aliased and moded.
- **Mode (Figma)** — variant within a variable collection (Light / Dark / High-Contrast).
- **Component (Figma)** — reusable design building block; has variants for variant matrix.
- **Effect style (Figma)** — reusable shadow / blur / glow definition.

## Validation / QA

- **Anti-slop rubric** — quality contract preventing generic output.
- **Design QA** — doc-level audit (coverage / slop / contradictions / token integrity / structure / retrofit completeness).
- **Design pressure-test** — design-level red-team across 12 passes (heuristic / persona walkthrough / edge / failure / adversarial / a11y-usability / performance / cognitive load / brand coherence / feasibility / future-shift / multi-expert).
- **BLOCK finding** — pressure-test severity rating; must be fixed before completion.
- **FIX-NEXT / ACCEPT / WATCH** — non-blocking pressure-test severity ratings.
- **Drift detection (retrofit)** — comparison between codebase state and design-system spec on every regeneration.
- **Temporary decision** — explicit compromise from the ideal with proper-fix and removal-trigger documented.

## Operations

- **Storybook** — component documentation and visual-test environment (Storybook 8+).
- **Visual regression** — automated screenshot comparison (Chromatic / Percy / Playwright snapshot).
- **Token build pipeline** — generator that produces `tokens.css`, `tokens.ts`, `tokens.figma.json` from canonical `tokens.json`.
- **Design ops** — operational contract for keeping the design system load-bearing (Storybook, pipeline, review workflow, versioning, deprecation, health metrics).
- **Rules block** — auto-appended section in `AGENTS.md` / `CLAUDE.md` / `.cursorrules` / `RULES.md` telling future agents how to use the design system without causing drift.

## Specforge interop

- **Specforge** — companion skill suite for product / architecture / security documentation; produces `docs/app-plan/`.
- **Specforge-derived** — source label for any decision input that came from Specforge docs.
- **app-plan/** vs **design-system/** — Specforge owns `app-plan/`; VisualForge owns `design-system/`. They cross-reference, never write into each other.
