# Opinionated Decision Template

Every design decision in every VisualForge document uses this template. No exceptions. This is what separates VisualForge from generic AI design output.

## Template

```markdown
### [DEC-NNN] [decision title]

**Decision:** [one sentence with concrete values, not adjectives]

**Why this:**
1. [reason specific to this product's audience / brand / platform / use context]
2. [second reason, equally specific]

**Why not the alternatives:**
- [Alternative 1]: [one-line rejection reason]
- [Alternative 2]: [one-line rejection reason]
- [Alternative 3]: [one-line rejection reason] *(only if a third realistic alternative exists)*

**Confidence:** High | Medium | Low
**Source basis:** User-confirmed | Research-backed | Standard-backed | Repo-derived | Assumption | Specforge-derived

**Evidence:**
- [source 1 with URL / file path / quote]
- [source 2]

**Token / artifact bindings:**
- Token: `[token.name.path]` = `[value]`
- Document section: [path:section]
- Components affected: [list]
- Export targets: `tokens.json`, `tokens.css`, `tokens.ts`, Figma variable `[name]`
- Verification: [visual regression target | a11y check | perf budget | user test]

**Reversal trigger:** [observable signal that should cause this decision to be revisited]

**Related decisions:** [DEC-IDs that depend on this or that this depends on]

**Cross-cites consumed (v1.1 — per VF-FIND-007):** [explicit list of DEC-NNN IDs from earlier subskills that this decision materially consumes. Implicit re-statement of prior decisions is forbidden — every prior decision constraining visual / behavior / data / IA detail must be cited by ID here, not paraphrased in body prose.]

**Cross-cites produced:** [explicit list of DEC-NNN IDs in later subskills expected to consume this decision. This is forward-looking; populated when later subskills run.]

**Stamp (auto-filled by the orchestrator):**
- VisualForge version: v[major.minor.patch]
- Run ID: [run-id]
- Scope: comprehensive | core | lite | focused
- Generated: YYYY-MM-DD HH:MM TZ
```

Every generated narrative doc (every `*.md` outside `auditability/` and `tokens/`) begins with a single-line HTML comment:

```markdown
<!-- visualforge: v[major.minor.patch] run-id=[id] scope=[mode] generated=[ISO-8601] -->

# Doc Title
```

Future maintainers and the validation script read this stamp.

## Example — passing

```markdown
### [DEC-014] Card surface treatment — multi-layer warm shadow

**Decision:** Cards use a 4-layer drop shadow stack tinted toward brand warm-neutral (`#1A1410`), with total y-offset 15px, blur up to 24px, opacity sum 0.16. Card background is `surface.elevated` (token), border is 1px `border.subtle` at 6% opacity. No glass blur on cards in this product.

**Why this:**
1. The product is a dense content-discovery feed for design professionals; cards must read as physical objects on a textured canvas to support browsing scan-patterns observed in competitive audit (Pinterest, Are.na, Cosmos).
2. The warm shadow tint reinforces the brand's warm-paper aesthetic and avoids the cool-grey "Material 2018" reading that flat or single-shadow cards produce.

**Why not the alternatives:**
- Flat cards with border only: tested poorly in competitive audit for scanability at high tile density; reads as utility-software.
- Single drop shadow (legacy Material): dated visual language for this audience; fails to express premium feel agreed in brand identity DEC-003.
- Liquid Glass / backdrop-filter blur cards: rejected because cards sit on a textured background — glass reads as muddy. Glass is reserved for navigation surfaces (DEC-021).
- Neumorphic raised cards: fails accessibility contrast in light mode for users with low vision.

**Confidence:** High
**Source basis:** Research-backed

**Evidence:**
- Linear card system documentation: `https://linear.app/method/practices/...` (checked 2026-05-18)
- Material 3 elevation guidance, section on layered shadows: `https://m3.material.io/styles/elevation/...`
- Competitive audit findings: `03-competitive-audit.md#card-treatments`

**Token / artifact bindings:**
- Tokens: `shadow.card.rest`, `shadow.card.hover`, `shadow.card.pressed`, `surface.elevated`, `border.subtle`
- Document section: `07-surface-treatments.md#shadow-system`
- Components affected: `Card`, `MediaCard`, `ContentTile`, `ListItem (elevated variant)`
- Export targets: `tokens.json` → `shadow.card.*`; `tokens.css` → `--vf-shadow-card-*`; `tokens.ts` → `shadow.card`; Figma effect style `Shadow/Card/Rest`.
- Verification: visual regression on card grid at three densities; a11y contrast check between card surface and background ≥ 3:1.

**Reversal trigger:** If competitive audit shows the audience has shifted toward flat-UI tools, or if 60fps scroll budget on low-end Android cannot be maintained with 4-layer shadows on > 30 cards visible.

**Related decisions:** DEC-003 (brand warmth), DEC-008 (elevation system), DEC-021 (glass reserved for nav), DEC-035 (card component spec).
```

## Example — failing (do not produce output like this)

```markdown
### Card shadow

Cards should have a subtle shadow to make them pop. Consider using a soft drop shadow that feels modern and clean.
```

This fails on every axis: no decision ID, no values, no source, no alternatives considered, no token binding, no verification, taste-words (`subtle`, `pop`, `modern`, `clean`, `feels`), and a non-decision (`consider`).

## When the template feels heavy

It should feel heavy. Every entry in the template prevents a class of future drift. Skipping the template produces design slop that future contributors cannot interpret or defend.

For low-stakes derivative decisions (e.g., specific spacing values that follow directly from the scale established in a higher-level decision), shorten to a one-line entry under the parent decision:

```markdown
### [DEC-014.1] Card internal padding = `space.lg` (16px)
Derived from DEC-014; matches card grid rhythm.
```

This is acceptable only when the parent decision is fully specified using the full template.

## Decision ID numbering

- `DEC-001` to `DEC-099` reserved for foundational decisions (brand, tokens, surface, IA).
- `DEC-100` to `DEC-299` for components.
- `DEC-300` to `DEC-499` for flows, screens, content.
- `DEC-500` to `DEC-699` for motion, micro-interactions, gesture.
- `DEC-700` to `DEC-799` for accessibility.
- `DEC-800` to `DEC-899` for implementation contract.
- `DEC-900` to `DEC-999` for retrofit / drift entries.

When extending an existing Specforge decision log, start at the next free number above the highest existing ID, regardless of ranges.

## "What we are NOT doing" — required section per subskill doc

Every subskill's main narrative doc must end with this section, before `Sources and basis`:

```markdown
## What we are intentionally NOT doing in this layer

- [specific behavior] — because [reason] — instead do [alternative or "out of scope for this product"].
- [specific behavior] — because [reason] — instead do [alternative].
```

This converts rejected alternatives and out-of-scope choices into explicit prohibitions implementation agents can scan for before commit. Without it, "What was rejected" lives only inside individual decision cards and an engineer reading the narrative may not see it.

Examples per subskill:

- `surface-treatments`: "Not adopting glass on dense card grids — perf + readability cost — multi-layer shadow instead."
- `iconography`: "Not mixing icon libraries — brand cohesion failure — Lucide only, custom SVG for gaps."
- `motion-design`: "Not adopting magnetic hover on table rows — perf cost at scale — magnetic reserved for hero CTAs."
- `auth-flows`: "Not paste-blocking passwords — WCAG 3.3.8 fail — password managers must work."
- `component-system`: "Not building a custom DataTable — TanStack Table chosen — wrap and theme, don't replace."

The validation script confirms every subskill narrative includes this section.

## Output discipline

Every VisualForge document must:

1. Contain only opinionated decisions using this template.
2. Sort decisions by ID within the document.
3. Include a "Sources and basis" section at the bottom summarizing the source labels used.
4. Reference decisions by ID in body prose (e.g., "see DEC-014").
5. Avoid restating decision content in prose — link by ID.
