# Research basis and deliberate synthesis

Last reviewed: 2026-07-15.

This skill synthesizes primary design-system guidance, current public agent skills, and evidence from a mature operational product. Public skills are leads, not proof that they produce good outputs.

## Primary sources

- [OpenAI curated frontend skill](https://github.com/openai/skills/blob/main/skills/.curated/frontend-skill/SKILL.md): product topology, utility copy, restrained hierarchy, minimal chrome, and rejection of dashboard-card mosaics.
- [Anthropic frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md): deliberate aesthetic direction, purpose, context, differentiation, and atmospheric craft. Its website/hero bias is not copied into product UI.
- [IBM Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/): presentation versus exploration modes, hierarchy, metric restraint, whitespace, and consistent encodings.
- [IBM Carbon chart types](https://carbondesignsystem.com/data-visualization/chart-types/): visualization selection by analytical question.
- [GitHub Primer product UI](https://primer.style/product/), [layout](https://primer.style/product/getting-started/foundations/layout/), and [data visualization](https://primer.style/product/ui-patterns/data-visualization/): product regions, responsive composition, tables, accessible charts, and pattern reuse.
- [Atlassian foundations](https://atlassian.design/foundations), [typography](https://atlassian.design/foundations/typography/applying-typography), and [data-visualization color](https://atlassian.design/foundations/color-new/data-visualization-color/): tokens, visual rhythm, type hierarchy, and governed data palettes.
- [Microsoft Fluent layout](https://fluent2.microsoft.design/layout), [elevation](https://fluent2.microsoft.design/elevation), and [motion](https://fluent2.microsoft.design/motion): proximity, stacking, focus, and functional motion.
- [Shopify app design](https://shopify.dev/docs/apps/design) and [app home](https://shopify.dev/docs/apps/build/app-home): familiar host patterns, trusted compositions, and resource-centered product flows.
- [Android adaptive layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout): reflow, reveal, and pane transformations.
- [W3C WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): exact AA target-size authority and exceptions.

## Public skill leads

- [Interface Design](https://github.com/Dammyjay93/claude-design-skill): strongest product-only anti-default process found—specific human/task/feel, domain exploration, signature, hierarchy, render-and-critique loop. This skill keeps the concepts but rejects universal pixel values, forced parallel context files, and inaccurate “44px is WCAG” claims.
- [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): useful searchable catalog for patterns, chart types, palettes, and stacks. It is candidate generation, not design authority.
- [Baseline UI / UI Skills](https://github.com/ibelick/ui-skills): strong implementation hygiene, states, motion performance, tabular numbers, and accessible controls. It prevents errors but does not by itself produce product-specific art direction.
- Local `design-taste-frontend`: strong design-read, visual-materiality, asset, motion, and verification discipline; its declared landing/marketing scope, hero/section rules, and page storytelling are deliberately excluded here.
- Local `impeccable`: strong register, approval, state, and critique process; its familiarity/restraint bias and optional context-file system are not made universal.

## Contradictions resolved

### Distinctive versus familiar

Keep controls, semantics, and common interaction behavior familiar. Put product identity into topology, data representation, typography treatment, material hierarchy, and one domain-specific signature.

### One accent versus many data colors

Use one scarce chrome/action accent, a separate semantic-state palette, and a separate governed data palette with redundant encoding.

### Dense versus spacious

Use dense rhythm inside repeated operational zones and more space between semantic regions. Density is local and task-driven, not one global padding choice.

### Cards versus cardless

Cards are valid for independently actionable, selectable, movable, elevated, or bounded objects. They are invalid as default punctuation for every section.

### Motion required versus motion forbidden

Use motion for origin, causality, state, progress, and completion. Remove ornamental animation from repeated expert work.

### System font versus distinctive typography

Existing product typography wins. Identity can come from hierarchy, weight, numeric treatment, label rhythm, and limited domain display treatment before a new font family is justified.

### Responsive simplification versus feature parity

Representation and location may change, but essential capability remains reachable through explicit navigation, drawer, sheet, drill-in, or overflow.

## Dialer evidence incorporated

The Auxara Dialer design system demonstrated:

- a one-line visual thesis with everyday/live intensity registers;
- semantic surface and depth roles;
- atmosphere painted once at shell level;
- workflow-shaped product topology rather than a card mosaic;
- in-place state choreography with redundant visual signals;
- strict separation of brand accent and state colors;
- responsive modes rather than dimension-fiddling;
- real screenshot verification because static gates cannot detect visual breakage.

It also exposed gaps this skill addresses:

- an old wallboard exploration used the exact generic KPI-card/table/chart scaffold;
- the product UX benchmark had no wallboard-specific checklist;
- implementation/token gates could not reject a visually generic dashboard;
- a local “no illustrations” primitive comment was too narrow to become a universal product rule;
- strong live emphasis can drift onto non-live moments without a semantic emphasis gate.

The general lesson: design-system consistency is necessary but insufficient. A perfectly tokenized generic dashboard is still generic.
