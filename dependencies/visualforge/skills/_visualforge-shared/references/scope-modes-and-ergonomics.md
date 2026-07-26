# Scope Modes and Team Ergonomics

VisualForge's full 30-subskill pipeline produces a comprehensive design system. For large teams shipping consumer products that justify the investment, it's right-sized. For a 3-person team building an internal tool or a solo founder launching a beta, it's overkill. This protocol defines smaller scope modes and team-ergonomic adaptations.

## Scope modes

### Scope: `comprehensive` (default)

All 30 subskills. Full decision protocol. Full pressure test. Full Figma build. Right for:

- Consumer product seeking premium / craft positioning.
- Multi-platform product (web + iOS + Android + desktop).
- Regulated / accessibility-critical product.
- Multi-tenant or white-label product needing theming depth.
- Team of 5+ with at least one dedicated designer or design-engineer.
- Runway of 12+ months pre-launch or established product.

Expected: 80–130 files. ~250k–450k agent tokens. 20–45 minutes wall time.

### Scope: `core` (recommended for most teams)

A focused subset. Right for:

- B2B SaaS at growth stage.
- Mobile app or web app with one primary platform.
- Team of 3–10 with shared design responsibility.

Includes:
- All Phase 1 (foundation): discovery, user-research, competitive-audit, design-trends-research.
- All Phase 2 (visual language): brand-identity, design-tokens, surface-treatments, iconography.
- Phase 3 essentials: information-architecture, layout-system. **Skips**: mobile-and-responsive (folded into layout), i18n-rtl (deferred unless internationalization in scope).
- Phase 4 essentials: ux-flows, component-system, content-design, micro-interactions, motion-design. **Skips**: scroll-and-gesture (folded into micro-interactions), imagery-illustration (deferred), data-visualization (only if product has charts), auth-flows (only if product has auth), system-pages (lighter inline coverage), notifications-and-lifecycle (only if product has notifications).
- All Phase 5 (quality): accessibility, motion-design.
- Phase 6: frontend-contract, figma-build (or fallback), design-qa, design-pressure-test (quick variant), agent-rules-update. **Skips**: design-ops (recommended but not enforced).

Expected: 30–50 files. ~120k–200k agent tokens. 10–20 minutes wall time.

### Scope: `lite` (minimum viable)

Just enough design to ship v1. Right for:

- Solo founder pre-launch.
- 1–3 person team building internal tool.
- Hackathon / weekend project.
- Spike / prototype where design might be discarded.

Includes:
- Discovery (compressed, 3 questions).
- 1–2 primary personas (no anti-persona, no edge-case, no pair scenarios).
- Brand identity (3–4 attributes only).
- Design tokens (minimal — colors / type / spacing / radius; no shadow / motion / blur tokens; light mode only).
- Information architecture (single-page or simple hierarchy).
- Layout system (basic breakpoints only).
- UX flows (just primary tasks, no journey maps, no service blueprints).
- Component system (chosen library defaults + ≤ 10 customized components).
- Content design (voice + ~20 microcopy entries for primary actions / errors).
- Accessibility (WCAG 2.2 A or AA only; no per-persona walkthrough).
- Frontend contract (stack + tokens config stub).
- Design QA (basic audit only; pressure-test deferred).
- RULES.md + HOW-TO-READ.md.

**Skipped entirely** unless explicitly requested: surface-treatments depth, iconography decisions (use library defaults), micro-interactions (use library defaults), scroll-and-gesture, imagery-illustration, data-visualization, auth-flows narrative (auth UX still works via library defaults), system-pages, notifications, mobile-and-responsive depth, i18n-rtl, motion-design, design-ops, figma-build (only if user asks), design-pressure-test 12-pass.

Expected: 8–15 files. ~40k–80k agent tokens. 5–10 minutes wall time.

The skipped subskills produce **stubs** in the design docs: a single `04-interaction/auth-flows.md` containing "Not designed in lite mode. Re-run as `core` or `comprehensive` to populate." This signals the gap explicitly rather than pretending it's done.

### Scope: `focused`

User invokes a specific area. Right for:

- "Help me design auth pages for this product."
- "I need a design tokens system."
- "Pressure-test my existing design."

Runs only the requested subskills + their direct prerequisites. Stubs the rest.

## Mode selection protocol

In the orchestrator's Step 0c (mode detection), after greenfield / specforge-enhanced / retrofit is determined, also determine scope:

```
Detected mode: [primary mode]
Detected signals: team size estimate, product class, runway hint

Recommended scope: [core | comprehensive | lite | focused]
Why: [reason — e.g., "B2B SaaS at growth stage with single web platform suggests core scope"]

Confirm scope, or choose:
  comprehensive — full 30-subskill pipeline (~30 min, ~80–130 files)
  core — focused subset (~15 min, ~30–50 files) [recommended]
  lite — minimum viable (~7 min, ~10 files)
  focused — only specific subskills (specify which)
```

In Auto mode, default to `core` unless the design brief / repo signals strongly suggest comprehensive (regulated, multi-platform, premium consumer).

## Team-capability ergonomic profiles

Pair the scope mode with the team-capability profile (already in `design-decision-quality-protocol.md`). Common combinations:

| Profile | Recommended scope | Notes |
|---|---|---|
| Solo founder pre-launch | lite or core | Use library defaults aggressively; skip Figma if no designer |
| Solo developer with design instinct | core or lite | Heavy library reuse; minimal custom |
| 2–5 person startup | core | Skip design-ops, light pressure-test |
| 5–15 person growth-stage | core or comprehensive | Add design-ops once a designer is hired |
| 15+ person org with design team | comprehensive | Full pipeline justified |
| Accessibility-critical (any size) | comprehensive | Cannot skip a11y, motion, content depth |

## Solo-founder adaptations

When a solo founder is detected (single contributor, no design team, fast iteration):

### Decision protocol simplifies
- Multi-expert sweep collapses from 5 reviewers to 2: "you (the founder)" + "an imagined target user."
- Devil's advocate stays — important even solo.
- Pre-mortem stays — important.
- Skip cross-decision impact for non-foundational decisions; keep for foundational ones.
- Skip status-quo bias check on derivative decisions; keep on foundational.

### Library reliance
- Always prefer Shadcn / Radix / Material / similar full library adoption over wrap-and-extend.
- Lock to library defaults for: micro-interactions, motion (use library presets), iconography (one library, no custom).
- This trades distinctiveness for time-to-ship; document the trade.

### Decision log style
- Decisions are still logged, but with terser entries ("DEC short form" — title, choice, one reason, one-line reversal trigger). The full template is available for foundational decisions only.
- Confidence Low is acceptable and frequent — the team knows they'll iterate.

### Pressure test
- Quick variant: 4 of 12 passes (heuristic, accessibility-usability, performance, persona walkthrough for the single primary persona).
- BLOCK findings still revise; skip FIX-NEXT cascade for solo speed.

### Hand-off contract
- Lighter implementation safety contract: "These are guidelines; deviations need a journal entry."
- Solo founders often play multiple roles; the contract recognizes context-switching.

## Scope down rules (running lighter than detected)

User can always request lighter than the recommendation. Lighter is allowed but the orchestrator notes the implications:

```
You requested lite mode for a product that signals comprehensive scope.

Implications:
- Accessibility coverage drops to baseline. If you ship to accessibility-critical users, plan to upgrade.
- No motion design — micro-interactions will use library defaults, possibly inconsistent with your brand.
- No notifications design — emails / push will be ad-hoc.
- No system pages (404, 500, etc.) — defaults from framework will ship.

Proceed with lite? (yes / give-me-core / cancel)
```

## Scope up rules (running heavier than detected)

User can request more. Allowed:

```
You requested comprehensive for a product that signals core scope.

Implications:
- Adds ~50 files of additional documentation.
- Adds ~30 minutes of agent time.
- Some sections will be sparse if the product doesn't actually use those surfaces (e.g., notifications subskill outputs "no notifications in scope" if there are none).

Proceed? (yes / give-me-core / cancel)
```

## Scope-mode interaction with retrofit

Retrofit mode operates at any scope level. The data inventory + IA restructuring + drift report run regardless of scope (they're the value of retrofit). Subskills skipped by scope mode don't produce ideal output but their drift entries still surface in the report if relevant.

## Re-running at a different scope

User can upgrade scope on a re-run:

```
Use $visualforge with scope=core
```

The orchestrator:
1. Reads existing run state.
2. Identifies subskills not yet run at the higher scope.
3. Runs those subskills, leaving completed ones untouched (unless their dependencies changed).
4. Pressure-test re-runs at the new scope.
5. WHATS-MISSING.md updates to reflect the scope upgrade.

Scope downgrade is unusual but allowed; existing files are marked `out-of-scope-for-current-mode` rather than deleted.

## Anti-slop scope rules

- Defaulting to comprehensive for a small project without checking the team-capability profile fails — wastes runway.
- Defaulting to lite for a regulated / accessibility-critical / premium-consumer product fails — under-specifies.
- Stubs that hide what's missing fail — every skipped subskill must produce an explicit "not designed in current scope" stub.
- Re-running comprehensive after lite without using cached completed subskill output fails idempotency.

## Quality gate

- Scope determined and recorded in `run-state.json`.
- Team-capability profile recorded.
- Subskills marked complete / stubbed / pending per scope.
- Stubs make missing coverage visible, not hidden.
- WHATS-MISSING.md reflects scope-driven gaps.
