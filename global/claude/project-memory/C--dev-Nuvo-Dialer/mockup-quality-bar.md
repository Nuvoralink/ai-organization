---
name: mockup-quality-bar
description: "Every mock must match claude-design's generated theme + carry full responsiveness + be future-proof (scale to lots of data, not just the small/happy case)."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c6cb6c0f-fc79-4576-b5c4-e28042c86ce8
---

Amin (2026-07-01, on the compliance-settings CMP-020 mock, but a STANDING bar for every mock): a mock must clear three gates, not just "looks right with a few rows."

1. **Match claude-design's generated theme.** Reuse the SAME real design-system visual language as the claude-design mocks (the Number Pool + Number Detail + comms surfaces): glass tiers (`--glass` / `--glass-soft`), the depth/elevation system, semantic tokens, and the built primitives (Section, Card, Badge, Switch, Tabs, DescriptionList, EmptyState) — NEVER a one-off look. It should feel like the same product as claude-design's pages.

2. **Full responsiveness.** Design AND verify at 375 / 768 / 1024 / 1440 (the RESPONSIVE_HANDOFF breakpoints). Lists collapse to stacked cards on phone (the §4 DataTable→card pattern); modals become bottom-sheets on mobile; the app shell owns scroll (ScrollArea), pages never own `height:100vh`/`overflow`; touch targets ≥44px. Verify with rendered computed-style/geometry, not just static gates (per [[responsive-build-process-fixes]] FIX A).

3. **Future-proof — designed to SCALE, not just for a small amount of data.** This is the one most often missed: a layout that only works with 3 items breaks the moment real data arrives. So — lists are **data-driven** (render N from a registry/array, not hardcoded rows) so new items appear automatically; **long copy / long values wrap or truncate gracefully** (no overflow blowout); **growing history/log lists** (e.g. the compliance-disable acknowledgment records — one per disable, forever) **scroll or paginate** with real empty / loading / error / many-items states; the page is stress-tested with LOTS of rows + long strings + the empty case before it's shown.

**Why:** a mock is the acceptance reference for the build — if it only holds up with tiny happy-path data, the coded surface inherits the same fragility and breaks in production.

**How to apply:** when building any mock, start from the claude-design visual language, design the responsive breakpoints + modal-as-bottom-sheet up front, and pressure-test the layout with a full/overflowing data set + the empty/error states — then show it. Relates to [[no-widget-mockups]], [[design-system-locked]], [[responsive-build-process-fixes]], [[no-plumbing-in-ui]].
