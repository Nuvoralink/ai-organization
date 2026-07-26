---
name: visualforge-competitive-audit
description: Audit 3-5 direct competitors and 2-3 design-forward reference products. Extract UX conventions the user expects, patterns to adopt, patterns to reject, and differentiation opportunities.
---

# Competitive and Reference Audit

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `design-research-rules.md`.
- Use `opinionated-decision-template.md` for every decision.
- No vague competitor descriptions. Every audited product must have specific patterns, surfaces, and tradeoffs called out.
- Label every fact: User-confirmed, Research-backed, Standard-backed, or Assumption.
- Maintain `decision-log.md` and `research-ledger.md`.
- Never copy a competitor's choice without articulating why their reason applies here.

## Purpose

Two outputs that together prevent two failure modes:

1. **Convention map** — what users already expect from products in this category, so VisualForge does not accidentally violate established mental models with cleverness.
2. **Differentiation map** — where to be intentionally different, with a reason and a cost analysis.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Full audit pass.
- **Retrofit:** Full audit pass. If the existing product is already in the competitive set (e.g., this product *is* one of the competitors), audit it as if external — do not credit existing decisions just because they exist.

## Required research pass

```text
Audit the design of [3-5 direct competitors] and [2-3 design-forward reference products]. For each, capture: visual identity, color system, typography choice, layout grid, primary navigation pattern, component density, signature interaction, motion language, accessibility posture, dark mode treatment, mobile parity, AI / agent surfaces if any. Identify category conventions (≥3 competitors share it) vs distinctive choices (≤1). Capture sources: live URL, screenshot date, version observed.
```

For each product, screenshot or describe (when no screenshot tool):

- Homepage / landing.
- Primary product surface (dashboard / canvas / feed).
- One representative form.
- Empty state.
- Error or low-data state.
- Pricing or settings page.
- Mobile view if applicable.

Record in `research-ledger.md` with date, version (if visible), and URL.

## Selection rules

### Direct competitors (3–5)
Products serving the same job-to-be-done for the same audience. Not "any product in this space" — specifically the ones users compare this product to.

### Design-forward references (2–3)
Products outside the direct space that exemplify a design quality this product should reach toward. Examples: Linear for craft, Stripe for clarity, Notion for approachability, Arc for delight, Vercel for technical aesthetic, Pitch for editorial, Figma for collaborative density.

Each reference must be picked for a specific quality to extract, not for general admiration.

## Inputs

- Design brief (`01-design-brief.md`).
- User personas (`02-user-personas.md`).
- User-suggested competitors and references, if any.
- Research access for screenshots / current state.

## Output files

- `docs/design-system/01-foundations/competitive-audit.md`
- Decision-log entries.
- Research-ledger entries (one per audited product).

## Document structure

### 1. Direct competitor audit

For each direct competitor:

#### [Name]

- **URL / app source:** ...
- **Version observed:** ... (date)
- **Audience overlap with us:** high / medium / low — with reason.
- **Visual identity in one sentence:** ...
- **Color system:** dominant hue, palette breadth, dark mode posture.
- **Typography:** primary typeface, weight range, signature size.
- **Layout primitives:** grid, container width, card vs list emphasis.
- **Primary nav pattern:** top bar, side rail, command palette, hybrid.
- **Component density:** sparse / balanced / dense.
- **Signature interaction:** the one thing users notice and remember.
- **Motion:** restrained / moderate / expressive.
- **Surface treatment:** flat, shadowed, glass, gradient, textured.
- **Iconography:** library or custom, weight, fill style.
- **Accessibility posture observed:** focus visible, contrast feels safe, keyboard usable, screen reader semantics.
- **Dark mode treatment:** auto-derived / hand-tuned / not supported.
- **Mobile parity:** equivalent / reduced / different product.
- **AI / agent surfaces:** yes / no — if yes, how integrated.
- **What they do well that we should learn from:** specific.
- **What they do poorly that we should avoid:** specific.
- **What we should not copy even though they do it:** specific (e.g., dark patterns, dated visual language, accessibility gaps).

### 2. Design-forward reference audit

Same structure as above, but with one additional field:

- **The quality we are extracting:** the specific reason this reference is in the set (e.g., "Linear's keyboard-shortcut surfacing", "Stripe's documentation IA", "Arc's playful cursor states").

### 3. Convention map

Across the audited set, list patterns shared by ≥3 products. These are user expectations. Violating them needs a strong reason.

For each convention:

- **Pattern:** specific (e.g., "Cmd+K opens command palette", "Sidebar collapsible to icons", "Avatar dropdown in top-right").
- **Adoption count:** [N of M audited].
- **Why it became convention:** user expectation, OS standard, technical default.
- **Our adoption:** adopt / adapt / reject — with reason.

### 4. Differentiation opportunities

Where the audited set is uniform but uniformity is *not* a user requirement, we can differentiate. For each opportunity:

- **Area:** (e.g., onboarding pattern, empty-state treatment, error messaging tone, navigation metaphor).
- **Current convention:** what everyone does.
- **Differentiation thesis:** what we will do instead.
- **Why this is better for our audience:** specific reasoning tied to personas.
- **Cost / risk:** what we give up (e.g., user familiarity).
- **Reversal trigger:** when to abandon the differentiation.

### 5. Patterns to adopt

Specific UX patterns observed across the set that this product should adopt, with the source.

### 6. Patterns to reject

Specific patterns observed that this product should refuse, with the reason.

### 7. Decision cards

Top 5–10 audit findings become decision-log entries in the `DEC-050 to DEC-069` range. Examples:

- Adopt Cmd+K command palette (convention; user expectation).
- Reject infinite-scroll without virtual pagination (perf cost; audience needs jump-to-position).
- Adopt restrained motion (audience overlap with Linear/Stripe; our brand is craft-focused).
- Differentiate on empty states (audited set ignores; our brand can use them for personality).

## Anti-slop competitive audit rules

- "They're great" is not an observation.
- "Modern UI" is not an observation.
- Every competitor section must produce at least one extracted pattern, with a yes / adapt / no decision.
- A "we should be different" claim without a why is rejected.
- A "we should match" claim without a why is rejected.
- Screenshots referenced without date are research-slop.

## Quality gate

- 3–5 direct competitors audited with all structured fields.
- 2–3 design-forward references audited with extracted quality.
- Convention map produced with adopt / adapt / reject decision per convention.
- Differentiation map produced with cost analysis per opportunity.
- Top findings logged as decisions.
- All audit sources in `research-ledger.md` with date.

## Sources and basis

List every audited product with URL and date observed. Distinguish what was directly observed vs assumed.
