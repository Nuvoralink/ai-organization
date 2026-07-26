---
name: visualforge-layout-system
description: Grid system, breakpoints, container queries, responsive strategy, container max-widths, layout pattern library (dashboard, feed, detail, form, marketing), density modes (comfortable / compact / spacious).
---

# Layout System

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `visual-default-breakers.md`.
- Use `opinionated-decision-template.md`.
- Every breakpoint, column count, gutter, max-width is a token — never hard-coded.
- Every layout pattern is named, sketched, and bound to component slots.
- Maintain `decision-log.md`.

## Purpose

Define the geometric foundation: where content sits, how it reflows, and what layout patterns the product uses. Without an explicit layout system, screens drift in dimension and rhythm.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Generate full layout system from brand spacing + IA + personas device matrix.
- **Retrofit:** Inventory existing grid; produce ideal; drift entry covers migration.

## Required research pass

```text
Research current layout patterns as of 2026: CSS Grid Level 2 (subgrid), container queries, fluid type with clamp, density modes, breakpoint conventions, asymmetric and bento layouts, scroll-snap rows. Identify 5 reference products with their grid systems. Capture sources.
```

## Inputs

- Design tokens — spacing scale, breakpoint tokens.
- IA — primary nav model (drives global layout shell).
- Personas device matrix — primary device sizes, input modes.
- Brand identity — surface philosophy (dense / balanced / sparse).

## Output files

- `docs/design-system/03-structure/layout-system.md`
- Decision-log entries (DEC-255 to DEC-274, overflow DEC-275 to DEC-279) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Breakpoint system

| Token | min-width | Use |
|---|---|---|
| `bp.xs` | (default) | mobile portrait |
| `bp.sm` | 640 | large mobile / small tablet portrait |
| `bp.md` | 768 | tablet / small laptop |
| `bp.lg` | 1024 | laptop |
| `bp.xl` | 1280 | desktop |
| `bp.2xl` | 1536 | large desktop |
| `bp.3xl` | 1920 | wide desktop |

Decisions:

- **Mobile-first or desktop-first:** mobile-first default. Justify if otherwise.
- **Min/max-width approach:** all breakpoints use min-width unless cascade clarity requires max-width exceptions.
- **Container queries:** primary tool for component responsiveness; viewport breakpoints for layout shell only.

### 2. Container max-widths

- **Page content:** `container.sm` (640), `container.md` (768), `container.lg` (1024), `container.xl` (1280), `container.2xl` (1440), `container.prose` (720, optimized for reading).
- **Full-bleed:** designs that go edge-to-edge with internal padding.

Rules:

- Reading-heavy content: `container.prose` (≈ 65–75 character measure).
- Dashboards: `container.2xl` or wider with internal grid.
- Marketing: `container.xl` standard.

### 3. Grid system

- **Column count:** 12 (default), or 4/8/12 responsive, or asymmetric.
- **Gutter:** spacing token (`space.6` = 24px common at desktop, `space.4` at mobile).
- **Margin:** edge margin from viewport (`space.4` mobile, `space.6` tablet, `space.8` desktop).
- **Implementation:** CSS Grid primary, Flexbox for one-dimensional, Subgrid for nested alignment.

### 4. Density modes

If the product supports density toggles:

- **Comfortable (default):** full spacing scale.
- **Compact:** spacing reduced by ~25% (use a density multiplier token).
- **Spacious:** spacing increased by ~25%.

Decisions:

- **Per user or per surface:** user-preference setting, surface-driven (data tables compact by default, marketing comfortable), or both.
- **Touch / pointer adaptation:** automatic density bump for `pointer: coarse`.

### 5. Layout shell

The top-level chrome. Sketch as ASCII or Mermaid for each variant:

#### Variant A: Top-bar shell

```
+-----------------------------------+
| Logo  Nav nav nav     ⌘ Search Acc|
+-----------------------------------+
|                                   |
|         Page content              |
|                                   |
+-----------------------------------+
```

#### Variant B: Side-rail shell

```
+----+------------------------------+
| ☰  | Page top bar (breadcrumb)    |
|    +------------------------------+
| 🏠 |                              |
| 📁 |    Page content              |
| ⚙  |                              |
|    |                              |
+----+------------------------------+
```

#### Variant C: Hybrid

```
+-----------------------------------+
| Logo            ⌘  Acc            |
+----+------------------------------+
| 🏠 |  Section nav (tabs/breadcrumb)|
| 📁 +------------------------------+
| ⚙  |                              |
|    |    Page content              |
+----+------------------------------+
```

Pick one as primary; document the others as rejected.

### 6. Layout pattern library

For each common page archetype, define the layout pattern with named slots:

#### Dashboard
- **Slots:** header (title, actions), filters, kpi-row, primary-chart, secondary-charts, table.
- **Grid:** 12-col with named regions.
- **Behavior:** kpi row stays at 4-col on lg+, collapses to 2-col on md, 1-col on sm.

#### List + detail
- **Slots:** list-pane (320–480 fixed), detail-pane (flex).
- **Behavior:** stacks vertically below `md`, side-by-side at `md`+, both resizable on `lg`+ (drag handle).

#### Feed
- **Slots:** sidebar (320), feed-column (max 720), context-rail (320, optional, hides below `lg`).
- **Behavior:** sidebar collapses to drawer below `md`.

#### Form / settings
- **Slots:** section-nav (left), form-pane (centered, max `container.prose`).
- **Behavior:** section-nav collapses to top tabs below `md`.

#### Detail / document
- **Slots:** outline-rail (240, hides below `lg`), document-content (`container.prose`), context-rail (240, optional).
- **Behavior:** outline-rail becomes sticky-top dropdown below `lg`.

#### Marketing / landing
- **Slots:** hero, feature-grid (3-up or 2-up), social-proof, CTA, footer.
- **Behavior:** all collapse to 1-col on mobile, two-stage reveal at `md`.

#### Empty / 404 / error
- **Slots:** centered illustration + headline + body + primary CTA + secondary link.
- **Behavior:** same layout all viewports; just margin scales.

#### Modal
- **Sizes:** xs (320), sm (480), md (640), lg (800), xl (1024), full (viewport minus margin).
- **Behavior:** full-width on mobile below 640px.

#### Authentication
- **Slots:** centered card with logo + form + alt-link.
- **Behavior:** card max-width 400, vertically centered.

### 7. Scroll behavior at layout level

Reference `visualforge-scroll-and-gesture` for detail; here, decide:

- **Body scroll:** native or smooth.
- **Sticky regions:** nav top sticky, side rail sticky on scroll.
- **Internal scroll:** which layout slots have their own scroll containers.
- **Scroll restoration:** on route change, scroll to top or restore position.

### 8. Responsive shape changes

For each layout pattern, document what changes at each breakpoint — not just dimensions, but structure:

- Multi-column → single-column.
- Sidebar → drawer.
- Top tabs → dropdown.
- Inline filters → modal filters.

### 9. RTL handling

- Mirror the layout shell (side rail flips, breadcrumb separator reverses).
- Logical CSS properties (`margin-inline-start` not `margin-left`).
- Text-align logical (`start` / `end`, not `left` / `right`).

### 10. Print layout (if applicable)

If the product has print-relevant content:

- Print stylesheet basics: hide nav, restore default colors, ensure background graphics print if essential, page-break rules.

### 11. Composition anchor inventory (anti-LLM-default)

Per `visual-default-breakers.md` §4, lock the inventory of composition anchors that screen specs may use. Every section of every page must cite an anchor from this list.

| Anchor | Use case |
|---|---|
| `anchor.centered-statement` | Headline + sub + CTA centered, often over background image |
| `anchor.bottom-left-over-image` | Text overlaid on lower-left of full-bleed image |
| `anchor.bottom-right-cta` | Visual takes most space; CTA cluster bottom-right |
| `anchor.top-left-lead` | Lead text top-left, supporting visual bottom-right |
| `anchor.stacked-center` | Label / headline / sub / CTA stacked centered, ultra-minimalist |
| `anchor.image-as-canvas` | Image is the canvas; text overlaid in clean safe area |
| `anchor.off-grid-editorial` | Asymmetric pull, editorial offset |
| `anchor.right-text-left-image` | Inverted classic |
| `anchor.left-text-right-image` | Classic — **use sparingly**, never twice in a row, never as the primary hero by default |

### 12. Cross-section variety rule

Per `visual-default-breakers.md` §4 and §5:

- A multi-section page must use **≥ 3 distinct composition anchors** across its sections.
- The same anchor must not appear in **3+ consecutive** sections.
- The same background mode must not appear in **4+ consecutive** sections (background modes are owned by `imagery-illustration` and `surface-treatments`).
- For non-minimalist briefs, **at least one section** must be a mini minimalist (mostly negative space), and **at least one section** must use a full-bleed / duotone / atmospheric background.

Marketing-page screen specs must include an anchor-distribution table proving the rule:

```markdown
| Section # | Name | Composition anchor | Background mode |
|---|---|---|---|
| 1 | Hero | anchor.centered-statement | full-bleed-image |
| 2 | Trust bar | anchor.stacked-center | solid + inline-asset |
| 3 | Features | anchor.off-grid-editorial | flat + detail-crop |
| ... | ... | ... | ... |
```

### 13. Gapless bento rule

Per `visual-default-breakers.md` §7, any bento or modular grid pattern must be **gapless**. Column and row spans must interlock — no unintentional empty cells. Use CSS Grid `grid-flow-dense` (or framework equivalent). Pattern specs that include a Mermaid grid with more cells than slot definitions fail.

### 14. H1 width contract

Per `visual-default-breakers.md` §3, lock the `max-w` token (or fluid clamp) that prevents H1 lines from wrapping past 3. Screen specs cite this token. Suggested default for hero H1:

```css
.hero-h1 {
  max-inline-size: clamp(28rem, 60vw, 80rem);
  font-size: clamp(2.5rem, 5vw, 5.5rem);
}
```

### 15. Decision cards

- DEC-256 Breakpoint scale.
- DEC-257 Container max-widths.
- DEC-258 Grid system (12-col / asymmetric / bento).
- DEC-259 Density modes (adoption or rejection).
- DEC-260 Layout shell variant.
- DEC-261 Pattern library inventory.
- DEC-262 Container query strategy.
- DEC-263 RTL handling rules.
- DEC-264 Print stylesheet adoption.
- DEC-272 Composition anchor inventory (per VF-FIND-032). *(In allocated range DEC-255–274 per `decision-id-allocation.md`.)*
- DEC-273 Cross-section variety rule (per VF-FIND-032).
- DEC-274 H1 width contract (per VF-FIND-032).

## Anti-slop layout rules

- "Responsive design" without breakpoint values and layout shifts per breakpoint fails.
- "Flexible grid" without column count, gutter, margin fails.
- Layout patterns without named slots and breakpoint behavior fail.
- Container queries everywhere without a single viewport-level shell is layout slop.
- Bento layouts adopted without an explicit grid that supports them is slop.

## Quality gate

- Full breakpoint scale tokenized.
- Container widths tokenized.
- Grid system specified with implementation tech.
- Layout shell variant chosen with rejected alternatives.
- Pattern library covers all archetypes the product uses.
- RTL rules documented if internationalization is in scope.

## Sources and basis

Per-decision tied to brand surface philosophy, persona device matrix, and current CSS layout capability.
