# VisualForge

Forge a complete, opinionated, detail-obsessed design system from a product idea, a Specforge spec, or an existing repo.

VisualForge is the design counterpart to [Specforge](../Specforge/). Where Specforge produces product, architecture, and security documentation, VisualForge produces a full design system: brand identity, design tokens, surface treatments, iconography, layout system, UX flows, components (every state, every interaction), content design, micro-interactions, scroll and gesture behavior, imagery rules, accessibility contract, motion system, frontend implementation contract, and Figma artifacts.

It works as a plugin for both **Codex** (OpenAI Codex CLI) and **Claude Code**.

## What makes VisualForge different

- **Opinionated decisions, not menus.** Every decision uses a 9-step quality protocol: at least three realistic options, **weighted criteria** (per product profile — premium consumer / perf-critical / a11y-critical / etc.), cross-decision impact check, anti-pattern recall, "what would change my mind" probe, multi-expert review simulation, and reversal trigger.
- **Detail down to the micro-level.** Shadow recipes with layer counts. Animation durations and easings. Cursor states. Focus ring offsets. Pull-to-refresh thresholds.
- **Trend-aware, not trend-chasing.** Liquid Glass, Material 3 Expressive, bento, AI-native chrome, spatial UI — each evaluated against the trend-fit test, then adopted or rejected with a reason.
- **Anti-slop guardrails — prose AND visual.** Taste-words like `modern`, `clean`, `subtle`, `pop`, `consider` are banned. Every value is concrete and bound to a token. **Visual-layer defaults are also banned** (per v1.8.0): no text-left/image-right hero by default, no purple-to-blue AI gradients, no 6-line wrapped H1, no `SECTION 01` chrome labels, mandatory composition-anchor and background-mode variety across sections, decisive Hero Scale and narrative spine. See [`visual-default-breakers.md`](skills/_visualforge-shared/references/visual-default-breakers.md).
- **Visual-direction lock.** Once per run, the orchestrator commits to one theme paradigm, one Hero Scale, one default composition anchor, one narrative spine, four signature components, two motion-implied languages, and one second-read moment. Downstream subskills cite this lock so the visual direction stays coherent end-to-end.
- **React-quality discipline in handoff.** v1.8.0 adds product-first UI workflow + React boundaries discipline to the frontend-contract — not just bundlers and budgets.
- **Platform-mode lock for mobile.** First decision in the mobile subskill: iOS-native premium / Android-native premium / cross-platform premium neutral. Prevents the "phone-shaped website" anti-pattern.
- **Eight reviewers in Pass L.** The post-generation red team simulates Senior PD, Senior FE, A11y expert, Brand designer, Target user, Red team — plus a Visual-direction critic (applies visual-default-breakers) and a React-product-fit critic (applies frontend-contract §17).
- **Data-aware in retrofit.** Reads OpenAPI / GraphQL / Prisma / Drizzle / migrations / fixtures before designing screens. Designs cannot invent fields and cannot drop important data.
- **Structural drift catcher in retrofit.** Page-by-page IA restructuring analysis catches splits (team-stats + member-data → two pages), merges, missing pages, orphans, role-leaks.
- **Token tier rules.** Three-tier token system (primitives → semantic → component) exported as `tokens.json`, `tokens.css`, `tokens.ts`, and `tokens.figma.json`.
- **Figma integration.** Builds the full design system in Figma via Figma MCP when available; falls back to importable bundle.
- **Post-generation red team.** `visualforge-design-pressure-test` runs 12 passes (heuristic eval, persona walkthroughs, edge / failure / adversarial sweeps, accessibility-usability with AT, performance, cognitive load, brand coherence, feasibility, future-shift, multi-expert review) to validate the **design quality itself**, not just the docs.
- **Anti-drift rules.** Updates `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and creates `RULES.md` so future contributors (human and AI) treat the design docs as source of truth.

## What it produces

Under `docs/design-system/`, organized into thematic folders (never flat-dumped):

```
docs/design-system/
├── README.md   RULES.md   00-index.md
├── 01-foundations/
│   ├── design-brief.md
│   ├── competitive-audit.md
│   ├── design-trends-research.md
│   └── personas/                # one file per persona
├── 02-visual-language/
│   ├── brand-identity.md
│   ├── design-tokens.md         # narrative; canonical values in tokens/
│   ├── surface-treatments.md
│   └── iconography.md
├── 03-structure/
│   ├── information-architecture.md
│   ├── layout-system.md
│   └── site-map.md
├── 04-interaction/
│   ├── ux-flows.md
│   ├── content-design.md
│   ├── micro-interactions.md
│   ├── scroll-and-gesture.md
│   ├── imagery-illustration.md
│   └── motion-design.md
├── 05-components/               # one file per component
│   ├── _index.md  overview.md
│   ├── primitives/  composites/  patterns/  domain/
├── 06-screens/                  # one file per screen
│   ├── _index.md
│   └── SCR-NNN-[slug].md
├── 07-quality/
│   ├── accessibility-contract.md
│   ├── frontend-implementation-contract.md
│   └── design-qa-report.md
├── tokens/                      # tokens.json (canonical) + generated formats
├── content/microcopy.json
├── icons/  imagery/  brand/
├── auditability/                # mode report, decision log, research ledger, QA review, build logs, deferred/rejected findings
├── retrofit/                    # (retrofit mode only) inventory, data-inventory, data-crosswalk, backend-gaps, missing-surfaces, ia-restructuring, drift-report, migration-plan
└── figma-import-bundle/         # (only if Figma MCP unavailable)
```

Plus updates to `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, etc. — only files that already exist or show host signal.

### Retrofit mode does more

In retrofit mode, VisualForge runs three extra passes before screen and component design:

1. **Data inventory** — reads OpenAPI / GraphQL / Prisma / Drizzle / migrations / fixtures. Every entity and field gets classified (identifier, content, metadata, sensitive, operational, etc.). Designs cannot invent fields or silently drop important data.
2. **IA restructuring analysis** — every existing page is analyzed for splits, merges, missing pages, misplaced content, orphans, dead-ends, and role-leaks. Surfaces "this page mixes team-stats and individual member data — split into `/team/overview` and `/team/members`" findings.
3. **Drift report + phased migration plan** — current vs ideal, with a Phase-0-ships-zero-pixels migration ordering.

## Modes

VisualForge detects which mode to run in:

- **Greenfield** — no existing frontend code, no Specforge docs. Full discovery interview, full design system.
- **Specforge-enhanced** — Specforge docs at `docs/app-plan/` exist. Read them as input, skip already-answered questions, replace the basic UI docs with a full design system.
- **Retrofit** — existing frontend code present. Inventory what exists, design the ideal independently, then compute drift and produce a phased migration plan.

Modes can combine (Specforge + retrofit).

## Architecture

```
visualforge                                # orchestrator
├── Foundation
│   ├── visualforge-discovery
│   ├── visualforge-user-research
│   ├── visualforge-competitive-audit
│   └── visualforge-design-trends-research
├── Visual language
│   ├── visualforge-brand-identity
│   ├── visualforge-design-tokens
│   ├── visualforge-surface-treatments
│   └── visualforge-iconography
├── Structure
│   ├── visualforge-information-architecture        # retrofit: page restructuring analysis
│   ├── visualforge-layout-system
│   ├── visualforge-mobile-and-responsive           # mobile, foldables, ultra-wide, zoom
│   └── visualforge-i18n-rtl                        # locales, RTL, expansion, cultural
├── Interaction & content
│   ├── visualforge-ux-flows                        # retrofit: data inventory first
│   ├── visualforge-component-system
│   ├── visualforge-content-design
│   ├── visualforge-micro-interactions
│   ├── visualforge-scroll-and-gesture
│   ├── visualforge-imagery-illustration
│   ├── visualforge-data-visualization              # charts, dashboards, KPIs
│   ├── visualforge-auth-flows                      # sign in / up / MFA / SSO / delete
│   ├── visualforge-system-pages                    # 404, 500, maintenance, offline
│   └── visualforge-notifications-and-lifecycle     # email + push + in-app + SMS
├── Quality
│   ├── visualforge-accessibility                   # WCAG 2.2 + cognitive + voice + switch
│   └── visualforge-motion-design
└── Implementation handoff
    ├── visualforge-frontend-contract
    ├── visualforge-design-ops                      # Storybook, pipeline, versioning, ops
    ├── visualforge-figma-build
    ├── visualforge-design-qa                       # doc-level audit
    ├── visualforge-design-pressure-test            # post-gen red team — heuristics, persona walks, edge/adversarial sweeps, multi-expert review
    └── visualforge-agent-rules-update
```

**30 subskills + 1 orchestrator.** Every subskill is independently invocable for targeted updates.

Each subskill can be invoked independently (e.g., `Use $visualforge-component-system to add a Kanban-board component`) or as part of a full orchestrator run.

Shared guardrails live in `skills/_visualforge-shared/references/`:

- `anti-slop-design-rubric.md` — design-specific slop patterns and hard-fail rules
- `visual-default-breakers.md` — anti-LLM-default visual rules (composition, gradient, hero, narrative spine; added v1.8.0)
- `state-page-patterns.md` — shared patterns across auth-flows, system-pages, notifications-and-lifecycle (added v1.8.0)
- `color-theory-and-decision-matrix.md` — color theory primer, 6 harmony schemes, color meaning table with cultural caveats, 13-row brand-attribute → scheme decision matrix, OKLCH-based palette derivation method, color-blindness verification, WCAG+APCA tooling (added v1.8.0)
- `design-decision-quality-protocol.md` — six-step protocol for every material decision
- `current-design-source-map.md` — baked-in registry of design references (HIG, Material, libraries, color tools)
- `design-research-rules.md` — research pass rules
- `guided-design-interview-protocol.md` — bounded user-facing questions (max 6 initial)
- `figma-mcp-integration-protocol.md` — Figma MCP detection, build, and fallback
- `drift-and-retrofit-protocol.md` — ideal-first retrofit pattern
- `mode-detection-protocol.md` — greenfield / Specforge-enhanced / retrofit
- `opinionated-decision-template.md` — the decision card template used everywhere
- `token-artifact-export-spec.md` — token tier rules and four-format export
- `rules-update-protocol.md` — anti-drift rules update
- `failure-isolation-by-layer.md` — critical-vs-degraded path classification, HTTP-method side-effect safety
- `shared-contracts-and-blast-radius.md` — content-map discipline and source-of-truth registry
- `test-discipline-and-mutation-protocol.md` — mutation-test discipline, probe layers, paired-condition rule

## Installation

### Codex

The repo includes a `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`. Use the local marketplace install pattern your Codex environment supports.

### Claude Code

The repo includes a `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Install via Claude Code's plugin install flow.

The same `skills/` tree serves both hosts — `SKILL.md` is a universal format.

## Usage

### Greenfield

```
Use $visualforge for this product:

[product description: what, who, platform, brand constraints, a11y level]
```

See [examples/greenfield-saas-app-prompt.md](examples/greenfield-saas-app-prompt.md).

### Specforge-enhanced

```
Use $visualforge for this product. Specforge docs at docs/app-plan/ describe the
product and features. Upgrade the design layer.
```

See [examples/specforge-enhanced-app-prompt.md](examples/specforge-enhanced-app-prompt.md).

### Existing repo retrofit

```
Use $visualforge to retrofit this repo. Inventory what exists, design the ideal
independently, then produce a drift report and migration plan.
```

See [examples/existing-repo-retrofit-prompt.md](examples/existing-repo-retrofit-prompt.md).

### Targeted subskill

```
Use $visualforge-design-tokens to refresh the token system with OKLCH color space.
Use $visualforge-motion-design to revisit page transitions.
Use $visualforge-component-system to add a Kanban-board component.
```

## Validation

After VisualForge runs, validate with:

```
python scripts/validate_design_docs.py
```

Checks:

- All required docs present.
- All token files present and consistent.
- Token references resolve.
- No raw hex / px / ms values in component docs (must reference tokens).
- Slop word scan flags taste-words for review.
- Decision log has DEC-NNN entries.
- Figma artifacts present (built or bundled).

Exit 0 on PASS, non-zero on FAIL.

Run with `--strict` to treat slop warnings as errors.

## Relationship to Specforge

VisualForge can run independently — it does not require Specforge.

When Specforge docs exist, VisualForge reads them for product intent, audience, and feature scope, and replaces Specforge's basic UI docs with a deeper design system. Specforge's UI docs are marked superseded but not deleted.

The two share the same decision-log structure (`DEC-NNN` IDs), so a project using both has one continuous decision log across product, security, and design decisions.

## License

MIT. See `LICENSE`.
