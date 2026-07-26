---
name: visualforge-data-visualization
description: Chart system — chart inventory matched to data types, library choice, color-blind-safe data palettes, chart accessibility (table alternative, ARIA live, keyboard nav), interactivity, empty/loading/error states, performance for large datasets.
---

# Data Visualization

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md`.
- Every chart has: chart type, data shape, color encoding, axes, legend rules, accessibility alternative, empty / loading / error state.
- Color-blind-safe palettes verified, not assumed.
- Performance budget per chart type.
- Maintain `decision-log.md`.

## Purpose

Data viz is its own discipline — bad charts make analytics useless. Without an explicit dataviz system, every chart looks different, palettes leak, accessibility fails.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Design dataviz system from feature inventory + persona analytical needs.
- **Retrofit:** Inventory existing chart usage; produce ideal; drift entry.

## Required research pass

```text
Research current data visualization libraries as of 2026: Recharts, Visx, Apache ECharts, Plotly, Chart.js, Tremor, Nivo, D3, Observable Plot. Capture: tree-shake size, accessibility maturity, performance with large datasets (>10k points), animation, server-side rendering compatibility. Research color-blind-safe palettes (Okabe-Ito, Color Brewer 2 sequential / diverging / qualitative, viridis family). Research chart accessibility patterns (data table alternative, ARIA, sonification).
```

## Inputs

- Personas analytical needs (which users need which insights).
- Data inventory (retrofit mode) — what numerical data exists.
- Brand color palette (must coexist with chart palette without clashing).
- Performance budget.
- Accessibility level.

## Output files

- `docs/design-system/04-interaction/data-visualization.md` — chart system overview, library, palette, accessibility, interactivity, performance.
- `docs/design-system/05-components/patterns/Chart[Type].md` — per chart-type component spec.
- New tokens added to `tokens.json` (data palettes).
- Decision-log entries (DEC-700 to DEC-724, overflow DEC-725 to DEC-729) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Chart inventory

For each chart-type the product needs, decide:

| Need | Chart type | Library component | Status states | Interaction |
|---|---|---|---|---|
| Trend over time (single metric) | Line / area | LineChart | empty / loading / error / no-trend | hover tooltip, brush zoom |
| Comparison categorical | Vertical bar | BarChart | (same) | hover, click drill |
| Part-of-whole few categories | Stacked bar / donut (rare) | StackedBarChart | (same) | hover, legend toggle |
| Distribution | Histogram, box-plot | Histogram | (same) | hover, bucket adjust |
| Correlation | Scatter | ScatterPlot | (same) | hover, brush, click |
| Geographic | Choropleth / heatmap on map | MapChart | (same) | zoom, pan, tooltip |
| Funnel / conversion | Funnel | FunnelChart | (same) | step click-through |
| Time-on-target / Gantt | Timeline | TimelineChart | (same) | hover, drag-edit (if editable) |
| Single metric | KPI / Stat card | StatCard | (same) | click drill |
| Inline trend | Sparkline | Sparkline | minimal | hover (optional) |

Forbidden by default unless explicitly justified:

- Pie chart with > 5 slices (use bar).
- 3D anything (perspective distorts comparison).
- Dual-axis (confuses comparison; use small multiples).

### 2. Library decision

Pick one primary, optionally a specialty secondary:

- **Tremor** — Tailwind-friendly, fast adoption.
- **Recharts** — popular React, customizable.
- **Visx (by Airbnb)** — D3 primitives in React, advanced.
- **Apache ECharts** — feature-rich, less React-native but powerful.
- **Plotly** — scientific.
- **D3 direct** — maximum control, maximum complexity.
- **Observable Plot** — concise, declarative.

Decision tied to: library accessibility maturity, performance at expected data scale, integration with framework, tree-shake cost.

### 3. Color encoding rules

Three palette types, each tokenized:

#### Qualitative (categorical, no order)
Color-blind-safe with high distinctness. Default: Okabe-Ito palette modified for warm brand neutral:

```
dataviz.qual.1 → indigo 600
dataviz.qual.2 → emerald 600
dataviz.qual.3 → amber 600
dataviz.qual.4 → rose 600
dataviz.qual.5 → cyan 600
dataviz.qual.6 → violet 600
dataviz.qual.7 → lime 700
dataviz.qual.8 → orange 600
```

8 max — beyond, group as "Other" or split into sub-charts.

#### Sequential (ordered, single hue)
For magnitudes (heatmaps, choropleths, single-series intensity):

```
dataviz.seq.50 → lightest
dataviz.seq.100
...
dataviz.seq.900 → darkest
```

Generated in OKLCH for perceptual uniformity (avoid the rainbow / jet trap).

#### Diverging (positive / negative around midpoint)
For change, sentiment, balance:

```
dataviz.div.negative.900 → strongest negative
...
dataviz.div.midpoint → neutral
...
dataviz.div.positive.900 → strongest positive
```

OKLCH-based, balanced perceptual weight either side of midpoint.

#### Semantic encoding
Always pair color with a non-color signal (shape, pattern, label). Specifically:

- Positive / negative: color + icon + sign-prefix.
- Anomaly / threshold breach: color + ring + label.
- Selected state in chart: color + outline + cursor change.

Never color alone (WCAG 1.4.1).

### 4. Chart accessibility contract

Every chart must provide:

- **Data table alternative:** `<table>` toggle showing the same data underneath the chart. Same data, same numbers.
- **Title and description:** `<figcaption>` or aria-label summarizing the chart's purpose and primary takeaway.
- **Keyboard navigation:** focus into the chart, tab through data points, arrow keys for sequential navigation, Enter for drill-through.
- **Screen reader output:** announce data point on focus.
- **Live updates:** `aria-live="polite"` when chart data changes after user action; `assertive` only for critical anomalies.
- **Color contrast:** chart lines / bars against background ≥ 3:1.
- **Reduced motion:** animation on chart entry / data transition fades to instant at reduced-motion.

### 5. Chart components — per-type spec

For each chart type, produce a per-component spec under `05-components/patterns/Chart[Type].md` with:

- Props (data shape, color encoding, axes config, legend, tooltip, interaction).
- Token bindings (palette tokens, axis tokens, grid tokens).
- States (default, empty, loading, error, no-data, partial-data, zoomed, filtered).
- Accessibility contract.
- Performance notes (data point limits, canvas vs SVG choice).
- Responsive behavior (mobile collapses to simpler view).

### 6. Dashboard composition

When charts are assembled into a dashboard:

- **Grid:** uses layout-system grid; charts in 1 / 2 / 3 columns per breakpoint.
- **Card wrapper:** ChartCard component standard wrapper.
- **Filters:** shared filter bar at top; each chart respects filter; loading state on filter change.
- **Hierarchy:** primary KPI row, then primary chart, then secondary.
- **Empty dashboard:** illustrates first-action pattern; never blank.

### 7. Interactivity

- **Tooltip:** hover, focus; concise (label + value + optional context); never block the chart it describes.
- **Legend:** toggle series visibility; show value when single point hovered.
- **Brush / zoom:** for time-series; double-click reset.
- **Drill-through:** click a data point to navigate to detail screen; pass query params for filter context.
- **Cursor:** crosshair / pointer per chart type.
- **Touch:** tap shows tooltip; long-press for drill-through; pinch zoom on enabled charts.

### 8. Performance

- **SVG:** preferred for < 1k data points; better a11y; better print.
- **Canvas:** for > 1k points; less a11y but performant.
- **WebGL:** for > 50k points; specialty.
- **Server-side rendering:** charts above the fold prefer SSR with skeleton.
- **Aggregation:** when data exceeds budget, aggregate server-side (downsample, bucket).
- **Streaming updates:** debounce updates to 200ms minimum; never animate every tick of a 10Hz feed.

### 9. Empty / loading / error states

- **Empty:** no data yet — instructive ("Add events to see them here") with CTA.
- **Loading:** skeleton matching final shape; not a spinner.
- **Error:** retry affordance; error-class-specific messaging (network vs server vs data-format).
- **No-trend (insufficient data):** show data with explicit "Not enough data for a trend yet."
- **Partial-load:** show what loaded; indicate incomplete state with retry for missing.

### 10. Print / export

- Charts must be exportable to PNG / SVG / PDF.
- Export keeps data table alongside the visual.
- Print stylesheet ensures readable chart at print resolution.

### 11. Decision cards

- DEC-701 Chart library lock.
- DEC-702 Chart inventory (which charts the product uses).
- DEC-703 Qualitative / sequential / diverging palette tokens.
- DEC-704 Color-vs-non-color encoding policy.
- DEC-705 Chart accessibility contract.
- DEC-706 Dashboard composition rules.
- DEC-707 Interactivity patterns.
- DEC-708 Performance + canvas/SVG threshold.
- DEC-709 Empty / loading / error patterns.
- DEC-710 Export / print policy.

## Anti-slop data viz rules

- "Use beautiful charts" — fails.
- Pie chart > 5 slices — fails.
- Dual-axis chart — fails by default.
- Chart with color alone for state — fails.
- Chart with no data table alternative — fails accessibility.
- "We'll use Chart.js" without inventory, palette, accessibility, performance plan — fails.

## Quality gate

- Inventory matched to data types.
- Library locked with rationale.
- Three palette types tokenized.
- Per chart type accessibility contract.
- States defined for every chart type.
- Performance threshold for SVG / canvas / WebGL.

## Sources and basis

Per-decision tied to data inventory, library research, color-vision research, and current dataviz best practices.
