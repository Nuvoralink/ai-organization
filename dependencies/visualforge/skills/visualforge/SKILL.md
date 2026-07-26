---
name: visualforge
description: Orchestrate a complete, opinionated design system generation — discovery, research, brand, tokens, surfaces, components, motion, accessibility, Figma artifacts, and agent rules.
---

# VisualForge Orchestrator

VisualForge turns a product idea, a Specforge spec, or an existing repo into a complete, implementation-ready, opinionated design system. Every decision is recorded with options, rationale, evidence, and reversal trigger. Output includes markdown docs, design tokens in four formats, Figma artifacts (via MCP when available, importable bundle otherwise), and agent-rule updates that prevent drift.

Shared references live at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `../_visualforge-shared/references/anti-slop-design-rubric.md` before drafting or revising any design doc.
- Read `../_visualforge-shared/references/visual-default-breakers.md` before any visual subskill drafts (brand-identity, layout, surfaces, imagery, marketing surfaces). Catches the LLM defaults the prose-level rubric does not see.
- Read `../_visualforge-shared/references/design-decision-quality-protocol.md` for every material decision.
- Read `../_visualforge-shared/references/design-research-rules.md` before any research pass.
- Apply `../_visualforge-shared/references/guided-design-interview-protocol.md` for every user-facing question.
- Use `../_visualforge-shared/references/opinionated-decision-template.md` as the format for every decision.
- Never produce design slop: no taste-words without values, no "consider", no "modern / clean / intuitive" without concrete behavior.
- Every important design decision must be specific, evidence-backed, opinionated, and traceable.
- Every decision must have an ID, source label, alternatives considered, recommendation, confidence, bound artifacts, and reversal trigger.
- Every generated document must include `Sources and basis`, even when the source is only user input or repo evidence.
- Maintain `docs/design-system/auditability/decision-log.md` and `docs/design-system/auditability/research-ledger.md` continuously.
- Keep naming consistent across docs: tokens, components, decisions, states must use the same IDs and names everywhere.
- Produce documentation and artifacts only — never modify the target product code unless the user explicitly asks.
- Choose the right design for the product, not the easiest design for the AI to implement.
- Label every fact as User-confirmed, Repo-derived, Research-backed, Standard-backed, Specforge-derived, or Assumption.
- Do not invent facts, library versions, platform capabilities, spec values, or research findings.
- If a regulated domain (medical, financial, legal, accessibility-critical, children's product) is detected, flag for qualified review and apply stricter constraints.
- Refuse to generate design docs that enable illegal, harmful, abusive, deceptive, or dark-pattern products.

## Orchestration flow

### Step 0a — MCP detection (run first)

1. Read `../_visualforge-shared/references/mcp-recommendations-and-detection.md`.
2. Scan available tools for the MCP catalog (Tier R / S / N).
3. Write `docs/design-system/auditability/mcp-detection-report.md` with findings.
4. If Tier R or Tier S MCPs are missing **and Auto mode is not active**: surface to user with specific capabilities-lost and ask whether to install before proceeding.
5. If Auto mode is active or user chooses to proceed without: log the missing MCPs and the fallback paths each subskill will use.

### Step 0b — Concurrency lock

1. Read `../_visualforge-shared/references/regeneration-and-cascade-lifecycle.md`.
2. Check for `docs/design-system/.visualforge.lock`.
3. If present and < 1 hour old: refuse to proceed; surface lock metadata to user.
4. If absent or stale: create lock with run ID + timestamp + host info.
5. Register cleanup hook so lock is released on completion / halt.

### Step 0c — Resume check

1. Read `../_visualforge-shared/references/resilience-and-recovery.md`.
2. Check for existing `auditability/run-state.json`.
3. If a previous run is incomplete and < 24 hours old, offer resume / restart / inspect.
4. If resume: validate input hashes; skip completed subskills; re-run `in_progress` from scratch; continue with `pending`.

### Step 0d — Scope selection

1. Read `../_visualforge-shared/references/scope-modes-and-ergonomics.md`.
2. Determine recommended scope from product signals (team size, product class, runway).
3. Present scope options to user (or default to `core` in Auto mode unless signals suggest comprehensive).
4. Record scope in `run-state.json`.

### Step 0e — Pre-run estimate

Surface to the user before commencing work:

```
VisualForge run estimate
Mode: [primary mode]
Scope: [scope]
Subskills to run: [N of 30]
Estimated agent steps: [range]
Estimated tokens: [range]
Estimated wall time: [range]
Files produced: [range]
Decisions logged: [range]

MCPs: Figma [yes/no], Browser [yes/no], GitHub [yes/no], Image-gen [yes/no]
Quality with current MCPs: [Good / Limited / Compromised]

Proceed? (yes / lite / preview-only / cancel)
```

In Auto mode: log the estimate and proceed.

### Step 0f — Mode detection and intake

1. Read `../_visualforge-shared/references/mode-detection-protocol.md`.
2. Detect `MODE=greenfield | specforge-enhanced | retrofit` (or combinations).
3. Detect Figma MCP availability per `../_visualforge-shared/references/figma-mcp-integration-protocol.md`.
4. Detect online research availability — note if unavailable.
5. Write `docs/design-system/auditability/mode-report.md`.
6. If `MODE=specforge-enhanced`, read Specforge docs from `docs/app-plan/` and extract product brief, PRD, user roles, feature scope, data contracts (if `docs/app-plan/data/` exists).
7. If `MODE=retrofit`:
   - Run the **inventory pass** per `../_visualforge-shared/references/drift-and-retrofit-protocol.md` (Step 1) — what exists in the codebase.
   - Run the **data inventory** per `../_visualforge-shared/references/data-inventory-protocol.md` (Step 1a) — read OpenAPI / GraphQL / Prisma / Drizzle / migrations / fixtures / sampled responses. Produce `retrofit/data-inventory.md`, `retrofit/data-crosswalk.md`, `retrofit/backend-gaps.md`, `retrofit/missing-surfaces.md`. This must happen **before** screen specs and component specs are written, so the design references real data rather than inventing fields.
   - Run the **IA restructuring analysis** per `../_visualforge-shared/references/ia-restructuring-protocol.md` (Step 1b) — identify splits / merges / missing pages / misplaced content / orphans / dead-ends / role-leaks. Triage with the user (accept / defer / reject). Accepted findings flow into the ideal IA and the migration plan.

### Step 0g — Visual-direction lock (anti-LLM-default, added per VF-FIND-035)

Before any visual subskill drafts (brand-identity, design-tokens, surface-treatments, iconography, layout-system, imagery-illustration, motion-design, component-system), commit the run-level visual direction once and lock it.

1. Read `../_visualforge-shared/references/visual-default-breakers.md`.
2. Use `../../examples/templates/visual-direction-lock-template.md` as the starting shape.
3. Commit one choice from each axis: theme paradigm, typography character, hero scale, default hero composition anchor, narrative spine, background mode mix, signature components (×4), motion-implied language (×2), second-read moment (×1), and the banned-by-default visual-pattern list.
4. Write the lock to `docs/design-system/auditability/visual-direction-lock.md`.
5. Every downstream visual subskill cites this lock. A subskill that departs from a commitment must do it via supersession — a new DEC in the responsible subskill's range, with the original commitment marked `Superseded by DEC-NNN` and the reason logged in `auditability/overrides-log.md`.
6. **Auto-mode default:** if no user signal disambiguates the choices, pick the highest-fit option per the brief-to-direction mapping in `visual-default-breakers.md` and surface the picks in `run-log.md`.

This step prevents the "every section drifts to the LLM default" failure (VF-FIND-035) — without it, downstream subskills produce technically-compliant designs that still read as centered hero + purple-blue gradient + left-text / right-image.

### Step 1 — Discovery and research

Run in sequence (each subskill is implicitly invoked):

1. `$visualforge-discovery` — Design brief, platform targets, audience density, brand constraints.
2. `$visualforge-user-research` — Personas, contexts, accessibility needs.
3. `$visualforge-competitive-audit` — Direct competitors + design-forward references.
4. `$visualforge-design-trends-research` — Current movements, fit assessment, adoption / rejection decisions.

### Step 2 — Visual language

5. `$visualforge-brand-identity` — Personality, mood, color philosophy, type philosophy.
6. `$visualforge-design-tokens` — Full token system, all four export formats.
7. `$visualforge-surface-treatments` — Material, glass, blur, gradients, shadows, edges, depth.
8. `$visualforge-iconography` — Icon library, weight, style, semantic mapping, animation rules.

### Step 3 — Structure

9. `$visualforge-information-architecture` — Site map, nav model, taxonomy. In retrofit mode, runs IA restructuring analysis (page splits / merges / missing / orphans / role-leaks).
10. `$visualforge-layout-system` — Grid, breakpoints, responsive strategy, layout patterns.
11. `$visualforge-mobile-and-responsive` — Mobile UX patterns, iOS / Android native, foldables, tablet, ultra-wide, browser zoom 200%/400% (WCAG 1.4.10), hi-DPI, multi-window.
12. `$visualforge-i18n-rtl` — Locale lock, RTL contract, text expansion, logical CSS, Intl APIs, cultural sensitivity.

### Step 4 — Interaction and content

13. `$visualforge-ux-flows` — Journey maps, task flows, wireframe specs. In retrofit mode runs data inventory first.
14. `$visualforge-component-system` — Component inventory, every state, every variant, bound tokens.
15. `$visualforge-content-design` — Voice, tone, microcopy library.
16. `$visualforge-micro-interactions` — Hover, focus, press, drag, cursor, tooltip, every micro-behavior.
17. `$visualforge-scroll-and-gesture` — Scroll physics, snap, parallax, custom scrollbars, gestures.
18. `$visualforge-imagery-illustration` — Photo, illustration, AI imagery, aspect ratios, placeholders.
19. `$visualforge-data-visualization` — Chart inventory, library, color-blind-safe palette, dataviz accessibility.
20. `$visualforge-auth-flows` — Sign in, sign up, forgot password, MFA, SSO, magic link, session expiry, account deletion, data export.
21. `$visualforge-system-pages` — 404, 500, maintenance, offline, suspended, rate-limited, browser-deprecated.
22. `$visualforge-notifications-and-lifecycle` — Email, push, in-app, SMS notification design + coordination + preference center.

### Step 5 — Quality and constraints

23. `$visualforge-accessibility` — WCAG 2.2 target, keyboard, screen reader, focus, contrast, cognitive a11y, voice control, switch control, per-persona AT walkthroughs.
24. `$visualforge-motion-design` — Spring physics, easing, choreography, reduced motion.

### Step 6 — Implementation handoff

25. `$visualforge-frontend-contract` — CSS arch, perf budgets, asset strategy, theming, framework specifics.
26. `$visualforge-design-ops` — Storybook, token pipeline, design review workflow, versioning, deprecation, health metrics.
27. `$visualforge-figma-build` — Build the design system in Figma via MCP, or export importable bundle.
28. `$visualforge-design-qa` — Doc-level audit: coverage, slop, contradictions, token integrity, structure, retrofit completeness.
29. `$visualforge-design-pressure-test` — **Post-generation red team** of the design itself: heuristic eval, persona walkthroughs, edge / failure / adversarial sweeps, cognitive load, brand coherence, feasibility, future-shift robustness, multi-expert review. BLOCK findings drive design changes before completion.
30. `$visualforge-agent-rules-update` — Update AGENTS.md, CLAUDE.md, .cursorrules, and RULES.md to prevent drift.

## Inputs

- Product idea or user prompt.
- Existing Specforge docs at `docs/app-plan/` if present.
- Existing frontend code if present.
- User answers to the bounded discovery interview.
- User-locked constraints (existing brand, partnership requirements, regulatory).

## Outputs

All under `docs/design-system/`, organized into thematic folders (never flat-dumped). See `../_visualforge-shared/references/mode-detection-protocol.md` for the full tree. Highlights:

- `README.md`, `RULES.md`, `00-index.md` at the root.
- `01-foundations/` — design brief, competitive audit, design trends, personas/ (one file per persona).
- `02-visual-language/` — brand identity, design tokens (narrative), surface treatments, iconography.
- `03-structure/` — information architecture, layout system, site map.
- `04-interaction/` — ux flows, content design, micro-interactions, scroll-and-gesture, imagery-illustration, motion design.
- `05-components/` — overview, _index, and one file per component organized into `primitives/`, `composites/`, `patterns/`, `domain/`.
- `06-screens/` — _index plus one file per screen (`SCR-NNN-[slug].md`).
- `07-quality/` — accessibility contract, frontend implementation contract, design QA report.
- `auditability/` — mode report, decision log, research ledger, design quality review, Figma build log, rules update log, drift detection report, deferred/rejected findings.
- `retrofit/` (retrofit mode only) — inventory, data-inventory, data-crosswalk, backend-gaps, missing-surfaces, ia-restructuring, drift-report, migration-plan.
- `tokens/` — canonical `tokens.json` plus generated `tokens.css`, `tokens.ts`, `tokens.figma.json`, and framework config stub.
- `content/microcopy.json`, `icons/semantic-map.md`, `icons/custom/`, `imagery/`, `brand/mood-board.md`.
- `figma-import-bundle/` only when Figma MCP unavailable.

Plus updates to `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, etc. — only those that already exist or are warranted by host signal.

The orchestrator regenerates `00-index.md` at the end of every run with the current file map.

## Checkpointing (with mid-run validation per VF-FIND-001)

After every subskill completes (or fails / is skipped):

1. Update `auditability/run-state.json` with the subskill's new status.
2. Append one-line entry to `auditability/run-log.md`.
3. Refresh concurrency lock heartbeat (extend TTL by 1 hour from now).
4. Decisions added this run captured in `run-state.json.decisions_added_this_run`.
5. **Run mid-run validation** — invoke `python scripts/validate_design_docs.py --root docs/design-system --mid-run`. This is the fast subset: strict DEC-ID shape check, cross-tree duplicate DEC detection, forbidden-ambiguity scan, raw-px density in layout/components, rhetorical-hedge detection, cross-subskill cite check, lock state.
6. **Halt on validation failure.** If the mid-run validation returns non-zero, the orchestrator does not proceed to the next subskill. Findings are surfaced to the user with three options:
   - (a) **Fix at source**: re-invoke the just-completed subskill with the finding as input; produce corrections; re-validate.
   - (b) **Accept with override**: user explicitly accepts the finding (e.g., a false-positive cross-cite warning); log the override in `auditability/validation-overrides.md` with rationale.
   - (c) **Cancel run**: halt the run; preserve checkpoint state for later resume.
7. In Auto mode, default to (a) — automatic source-fix attempt — once per finding. Second occurrence escalates to user.

If the agent's context approaches exhaustion or any subskill fails irrecoverably, the orchestrator cleanly halts with a "resume needed" note — never crashes mid-write.

**Workaround patterns forbidden.** If mid-run validation detects a DEC-ID collision, naming collision, or any allocation violation, the orchestrator must renumber at source per the allocation table — never write suffix workarounds (`_icon`, `-tmp`) into any artifact. Per `regeneration-and-cascade-lifecycle.md` in-flight conflict detection.

## Phase-boundary mini pressure-test (v1.1 — per VF-FIND-003)

At every phase boundary (after the last subskill of a phase completes), the orchestrator invokes `$visualforge-design-pressure-test partial=phase-N`:

| Phase | Boundary trigger | Pressure-test invocation |
|---|---|---|
| 1 — Foundation | After `design-trends-research` completes | `$visualforge-design-pressure-test partial=phase-1` |
| 2 — Visual language | After `iconography` completes | `$visualforge-design-pressure-test partial=phase-2` |
| 3 — Structure | After `i18n-rtl` completes | `$visualforge-design-pressure-test partial=phase-3` |
| 4 — Interaction | After `notifications-and-lifecycle` completes | `$visualforge-design-pressure-test partial=phase-4` |
| 5 — Quality | After `motion-design` completes | `$visualforge-design-pressure-test partial=phase-5` |
| 6 — Handoff | After `design-qa` completes (before pressure-test full mode) | (full mode covers it) |

Each phase-boundary mini test produces a report at `auditability/phase-N-mini-pressure-test.md`.

BLOCK findings at phase boundary halt the run until resolved. Loop limit of 2 iterations per finding at this stage (faster than the end-of-run 3-iteration ceiling, because the catch-cost is lower).

## User override and supersession

Per `../_visualforge-shared/references/resilience-and-recovery.md`:

- **Inline override** during run: `> override DEC-NNN to [new direction]`.
- **Post-run override**: user invokes the responsible subskill with an override.
- **Bulk override**: cascade summary surfaced before execution.

Every override is logged in `auditability/overrides-log.md` and follows the supersession protocol (new DEC, original marked `Status: Superseded by DEC-MMM`). Append-only files are never edited in place; corrections use the correction-entry protocol.

### Visual-direction-lock override cascade (v1.8.0 — per VF-FIND-043)

Overriding a commitment in `auditability/visual-direction-lock.md` (Hero Scale, default Composition Anchor, narrative spine, etc.) triggers a specific cascade per `../_visualforge-shared/references/regeneration-and-cascade-lifecycle.md` § "Visual-direction-lock cascade". The orchestrator must:

1. Halt the in-flight subskill before its next write.
2. Append the new commitment to the lock with a supersession note; never overwrite in place.
3. Log the change in `auditability/overrides-log.md` with: commitment name, old value, new value, reason, invalidated subskills.
4. Mark affected downstream files stale in `00-index.md` per the per-commitment fan-out table.
5. Re-invoke the affected subskills in dependency order.
6. Re-run `design-pressure-test` Pass I (brand coherence) + Pass L Visual-direction critic at the end of the cascade.

Auto-mode default: refuse to silently change a lock commitment; surface as a BLOCK to the user. Visual-direction commitments are too foundational for unattended override.

## Pacing and pausing

After every two subskills, write a brief status entry to `docs/design-system/auditability/run-log.md` so the user can interject. Surface only:

- New decisions of Confidence Low (need user attention).
- Contradictions discovered.
- Research gaps that affect a decision.

Do not surface every decision — the decision log is for review post-completion.

## Adaptive persona triggers

Personas are not finalized after `visualforge-user-research`. The orchestrator re-invokes that subskill in **revision mode** when later subskills surface new evidence:

1. **After `visualforge-competitive-audit`** — if the audit reveals an audience segment the personas missed (e.g., audit shows competitors heavily serving solo founders but personas were team-focused), re-invoke user-research to add or refine a persona.
2. **After `visualforge-design-trends-research`** — if adopted trends imply an audience refinement (adopting Liquid Glass implies an Apple-platform-fluent persona; adopting AI-native chrome implies an AI-literate persona), refine.
3. **After `visualforge-ux-flows` runs the data inventory (retrofit)** — if data shape reveals usage patterns inconsistent with personas (admin-heavy actions when no admin persona exists), refine.
4. **After `visualforge-design-pressure-test` Pass B** — if persona walkthroughs surface gaps (persona cannot complete a primary task, or no persona covers a frequent edge case), refine.

Re-invocation rules:

- The orchestrator passes the **new evidence** to user-research as input ("competitive audit revealed segment X; refine personas").
- User-research either adds a new persona, splits an existing persona, refines fields on an existing persona, or argues the existing set still holds with rationale.
- All persona file changes are versioned: each refinement appends a `### Revision YYYY-MM-DD` block to the persona file with what changed and why.
- Downstream subskills that depend on personas (ux-flows, accessibility per-persona walkthroughs, design-pressure-test Pass B) re-run if persona definitions changed materially.
- Log every persona revision in `auditability/run-log.md`.

## Pressure-test feedback loop

`visualforge-design-pressure-test` runs after `visualforge-design-qa`. Findings are triaged BLOCK / FIX-NEXT / ACCEPT / WATCH. The orchestrator handles the feedback loop:

### When pressure-test returns BLOCK findings

1. The orchestrator does **not** declare completion.
2. For each BLOCK finding, determine the responsible upstream subskill via the **finding-ownership matrix** below. The matrix gives one primary owner per finding *signature* — never "or" / "either."
3. Invoke the responsible subskill in **revision mode** with the BLOCK finding as input. The subskill produces a revised decision card (new DEC-NNN per the supersession protocol) and updates its docs.
4. Cascade — affected downstream subskills also revise.
5. Re-run `design-qa` and `design-pressure-test` on the revised design.
6. Repeat until pressure-test returns GOOD or GOOD WITH NOTES (or the loop limit + exemptions apply).

### Finding-ownership matrix (deterministic)

To prevent ping-pong, each finding gets one primary owner. Findings that genuinely span multiple subskills are decomposed into multiple findings, each with its own owner.

| Finding signature | Primary owner | Secondary cascade |
|---|---|---|
| Heuristic — visibility of system status | `ux-flows` (state coverage) | `component-system` (loading/error state design) |
| Heuristic — match with real world | `content-design` (vocabulary) | `information-architecture` (taxonomy) |
| Heuristic — user control / freedom | `ux-flows` (regret prevention) | `component-system` (undo affordance) |
| Heuristic — consistency | `component-system` (uniform patterns) | `brand-identity` (cross-surface coherence) |
| Heuristic — error prevention | `ux-flows` (destructive confirmation) | `content-design` (validation copy) |
| Heuristic — recognition over recall | `information-architecture` (nav visibility) | `component-system` |
| Heuristic — flexibility / efficiency | `component-system` (keyboard shortcuts) | `micro-interactions` |
| Heuristic — aesthetic / minimalist | `ux-flows` (cognitive load) | `layout-system` (density) |
| Heuristic — error recovery | `content-design` (error messaging) | `ux-flows` (recovery flow) |
| Heuristic — help / documentation | `system-pages` (help layout) | `content-design` |
| Heuristic — performance perceptibility | `motion-design` (skeleton / optimistic UI) | `frontend-contract` |
| Heuristic — privacy by default | `auth-flows` (data export, deletion) | `content-design` (consent copy) |
| Heuristic — reduce-X awareness | `accessibility` (motion / transparency / contrast) | `surface-treatments` |
| Heuristic — AI transparency | `content-design` (disclosure) | `component-system` (AI surfaces) |
| Persona walkthrough — task incomplete | **`user-research`** first (is the persona right?) → if persona OK, `ux-flows` | `component-system` |
| Persona walkthrough — AT user blocked | `accessibility` | `component-system` (a11y contract) |
| Edge case — long string / overflow | `component-system` (handles truncation) | `i18n-rtl` (text expansion) |
| Edge case — empty data | `ux-flows` (empty state philosophy) | `component-system` |
| Edge case — network failure | `ux-flows` (offline handling) | `system-pages` |
| Failure mode — API down | `system-pages` (5xx pages) | `ux-flows` |
| Failure mode — auth expired mid-action | `auth-flows` (in-context re-auth) | `ux-flows` (interruption recovery) |
| Adversarial — dark pattern | `content-design` (microcopy honesty) | `ux-flows` (no manipulative defaults) |
| Adversarial — phishing surface | `auth-flows` | `notifications-and-lifecycle` |
| A11y usability — keyboard | `accessibility` (keyboard map) | `component-system` (focus order) |
| A11y usability — screen reader | `accessibility` (AT contract) | `component-system` (ARIA) |
| A11y usability — cognitive | `accessibility` (cognitive section) | `content-design` (reading level) |
| Performance — LCP / bundle | `frontend-contract` (budgets) | `imagery-illustration` |
| Performance — animation jank | `motion-design` | `surface-treatments` (shadow cost) |
| Performance — interaction (INP) | `frontend-contract` | `component-system` |
| Cognitive load — overloaded screen | `ux-flows` (page split per IA restructuring) | `layout-system` |
| Cognitive load — overloaded component | `component-system` | `ux-flows` |
| Brand coherence — drift | `brand-identity` (attribute reaffirmation) | individual subskill that drifted |
| Feasibility — can't build | `frontend-contract` | `component-system` |
| Feasibility — perf can't hit budget | `frontend-contract` | `surface-treatments` / `motion-design` |
| Future-shift — new persona doesn't fit | `user-research` → `information-architecture` | cascade through affected subskills |
| Future-shift — new feature has nowhere to go | `information-architecture` | `component-system` |
| Future-shift — i18n breakage | `i18n-rtl` | `layout-system` |
| Visual-default — hero composition / scale / H1 wrap | `brand-identity` | `layout-system`, `imagery-illustration` |
| Visual-default — composition anchor variety across sections | `layout-system` | per-screen specs |
| Visual-default — background-mode monotony | `imagery-illustration` | `surface-treatments` |
| Visual-default — banned gradient slop | `surface-treatments` | `brand-identity` |
| Visual-default — grid voids / bento gaps | `layout-system` | `component-system` |
| Visual-default — meta-label slop (`SECTION 01`) | `content-design` | `information-architecture` |
| Visual-default — KPI slop on non-numeric pages | `data-visualization` | `content-design` |
| Visual-default — decoration without purpose | `imagery-illustration` | `surface-treatments` |
| Visual-default — narrative spine missing in execution | `brand-identity` | `imagery-illustration`, `motion-design`, `content-design` |
| Visual-default — second-read moment missing / duplicated | designated owner from `visual-direction-lock.md` | n/a |
| Visual-default — visual-direction-lock commitment violated | the upstream subskill that committed the choice | downstream that consumed it |
| React-fit — component missing server/client boundary | `frontend-contract` | `component-system` |
| React-fit — useEffect for derived state / data fetching | `frontend-contract` | `component-system` |
| React-fit — core functionality hidden on mobile | `mobile-and-responsive` | `component-system` |
| React-fit — form spec without form library | `frontend-contract` | `component-system` |

### Finding decomposition

If a finding genuinely spans multiple owners, the pressure-test subskill **decomposes** it into separate findings before triage:

- Example raw finding: "Empty state on dashboard is confusing — illustration is unclear, copy is generic, primary action is hidden."
- Decomposes into:
  - F-001 — illustration unclear → `imagery-illustration` (illustration system rules).
  - F-002 — copy generic → `content-design` (empty-state philosophy).
  - F-003 — primary action hidden → `ux-flows` (empty-state CTA visibility).

Each decomposed finding has one owner. No ping-pong.

### Ping-pong detection

If the same finding ID resurfaces across two consecutive iterations after revision, the orchestrator escalates: "Finding F-NNN re-emerged after revision by [subskill]. The mapping may be wrong, or the revision did not address the root cause. Re-examine."

After three resurfaces, the finding becomes an `ACCEPT` with explicit risk record — the loop will not converge.

### Loop limit

If pressure-test produces BLOCK findings for the **third** iteration, the orchestrator stops automatic cascading and surfaces the persistent findings to the user with an explicit recommendation: either (a) accept the limitation with rationale (move to ACCEPT triage), or (b) abandon the constraint causing the loop and rerun.

### Loop exemptions

The 3-iteration limit does not count iterations triggered by these classes of finding — they're treated as resolved through known compromises rather than retry:

- **Findings traced to a `Temporary` decision** (the design intentionally compromises for now; the Temporary card already names the proper fix and removal trigger). Pressure-test marks these `ACCEPT — Temporary` automatically and does not retry.
- **Findings traced to a User-confirmed locked constraint** (the user locked the constraint despite the design cost). Pressure-test marks `ACCEPT — Locked by user` and surfaces the residual risk without retry.
- **Findings traced to a platform / regulatory constraint outside design control** (e.g., App Store policy forces a specific layout pattern). Pressure-test marks `ACCEPT — External constraint` with the constraint reference.

For each exempted finding, pressure-test still records the finding so the team can revisit when the constraint changes.

### Persona-revision trigger

When `design-pressure-test` Pass B (persona walkthroughs) discovers a persona could not complete their primary task, this is a signal the persona definition is wrong or the design is wrong. The orchestrator invokes `visualforge-user-research` in revision mode to refine or split the persona, then cascades downstream.

### Recording loop iterations

Each pressure-test iteration is logged in `auditability/pressure-test-iterations.md`:

```markdown
## Iteration N — YYYY-MM-DD

- **BLOCK findings:** [list]
- **Upstream subskills invoked:** [list]
- **Decisions revised:** [DEC-IDs]
- **Verdict after revision:** [GOOD / GOOD WITH NOTES / NEEDS WORK / NOT READY]
```

This produces a visible trail of how the design was hardened before launch — useful for the team to see what nearly shipped and didn't.

## When the orchestrator is invoked partially

If the user invokes a specific subskill (e.g., `$visualforge-design-tokens`) without running the full chain:

1. Verify prerequisites: every subskill states what must exist before it runs.
2. If prerequisites are missing, recommend the minimum chain to run first (e.g., "design-tokens needs brand-identity; run `$visualforge-brand-identity` first or let me run both").
3. Proceed with the partial chain if confirmed.

## Failure handling

If any subskill cannot complete:

- Log the failure in `run-log.md` with the reason.
- Mark dependent subskills as `blocked` in the run log.
- Surface the blocker to the user with two options: (a) provide the missing input, (b) skip with a labeled gap that the user accepts.
- Never silently produce a degraded output.

## Single-subskill invocation handling

When a single subskill is invoked (not the full orchestrator):

1. The subskill runs.
2. The orchestrator computes the affected downstream cascade per `../_visualforge-shared/references/regeneration-and-cascade-lifecycle.md`.
3. Stale downstream files are marked in `00-index.md` (`### Stale since [date] — re-run $visualforge-[name]`).
4. The user is offered: cascade-rerun the affected subskills, or leave stale markers for later.
5. `WHATS-MISSING.md` is regenerated to reflect the new stale state.

## Idempotency check

After completion (or after every subskill cycle), the orchestrator can validate idempotency:

- Hash the inputs.
- Hash the outputs (excluding timestamps and run-id lines).
- Re-run on identical inputs.
- Re-hash outputs.
- Compare. Mismatch = bug.

This is recommended for CI but not required for every interactive run.

## Quality gate before completion

Before the orchestrator signals completion:

- Every subskill has produced its document.
- Every decision in the decision log has a binding artifact.
- Every decision ID is within its allocated range per `decision-id-allocation.md`.
- Every token in every document exists in `tokens.json`.
- The validation script `scripts/validate_design_docs.py` passes.
- Figma artifacts exist (built or bundled).
- Agent rule files are updated and idempotent.
- `design-quality-review.md` confirms no slop, no contradictions, no missing evidence.
- `WHATS-MISSING.md` regenerated with the current open-questions / deferred / unbuilt list.
- `00-index.md` regenerated with the current file map and includes the `visual-direction-lock.md` artifact.
- `auditability/visual-direction-lock.md` exists and every commitment has a value (no `[...]` placeholders).
- `mcp-detection-report.md` shows which MCPs were used and which were fallback-substituted.
- Concurrency lock released.

If any gate fails, fix and re-verify before completion. Never declare done with known failures.

## Self-pressure-test before completion (v1.8.0 — per VF-FIND-044)

Quality-gate-before-completion lists the artifacts the run must produce. It does **not** distrust the run itself — a green checklist can still hide a bug (the same pattern VF-FIND-041 surfaced for the v1.8.0 implementation). After the quality gate passes, the orchestrator runs a final **self-pressure-test pass** that distrusts the just-finished output the way `golden-mutation-trust-harness` distrusts a green test suite.

### What the self-pressure-test runs

1. **Re-run the full validator** in non-strict and strict mode. Both must pass.
2. **Run the validator self-test** (`scripts/validate_design_docs.py --self-test`). All fixtures must still pass — proves the validator itself hasn't been silently broken by the run.
3. **Cross-check DEC allocation** via `check_dec_range_allocation`. Every DEC in every SKILL.md (and every decision-log entry) must be within its allocated range.
4. **Cross-check artifact completeness** — every commitment in `auditability/visual-direction-lock.md` has a value; every required-section persona file has all sections; every component spec has every state.
5. **Cross-check cross-references** — for each file that cites another file's DEC, verify the cited DEC exists in the target.
6. **Cross-check authority binding** — every claim in the design that references a token, persona, component, or decision must resolve to an existing target.
7. **Cross-check the visual-direction-lock cascade** — if any lock commitment was changed during the run (per `overrides-log.md`), every downstream subskill in that commitment's fan-out (per `regeneration-and-cascade-lifecycle.md`) must have been re-run.
8. **Sample 3 random screen specs** and walk them against the lock — they must cite the chosen Hero Scale, default composition anchor, and narrative spine.
9. **Idempotency probe** — compute a content hash (excluding timestamps and run-id lines) of the design-system tree. Stored in `auditability/run-state.json` as `final_content_hash`. If the run is re-executed with no input change, the hash must match.

### Mutation-style probe (the discipline borrowed from `golden-mutation-trust-harness`)

For each pass above, ask: "What concrete bug pattern would this pass catch? Which existing fixture proves it?"

| Pass | Bug pattern caught | Backing fixture / check |
|---|---|---|
| 1 (full validator) | Any single check's failure mode | All 28+ validator checks |
| 2 (self-test) | Validator regressions | All 19 fixtures + sabotage matrix |
| 3 (DEC allocation) | DEC drift like VF-FIND-042 | `check_dec_range_allocation` + smoke test |
| 4 (artifact completeness) | Lock placeholder like VF-FIND-035 | `check_visual_direction_lock_complete` |
| 5 (cross-refs) | Dangling cite like VF-FIND-010 | `check_decision_id_resolution` |
| 6 (authority binding) | Untracked references | `check_persona_dec_consistency` |
| 7 (cascade) | VF-FIND-043 cascade-skip | manual cross-check (no automated check yet) |
| 8 (lock sampling) | Lock-and-screen-spec drift | manual walk (no automated check yet) |
| 9 (idempotency) | Non-deterministic regeneration | hash diff between two runs |

If any pass surfaces a problem, the orchestrator does **not** declare completion. It logs the finding to `auditability/self-pressure-test-report.md`, surfaces to the user, and either auto-fixes (Auto mode, single attempt) or escalates.

### What this prevents (the failure mode VF-FIND-041 surfaced)

Without this pass, an agent can:
- Complete the quality gate (all required files exist).
- Pass the validator (no fixed-rule failures).
- Skip the verification that the run's own changes are internally consistent.

The pattern is the green-suite-without-mutation-test. This pass is the orchestrator's mutation test on its own output.

### Output

`auditability/self-pressure-test-report.md` with one row per pass:

```markdown
| Pass | Verdict | Findings | Notes |
|---|---|---|---|
| 1. Full validator (non-strict) | PASS | 0 | |
| 1. Full validator (strict) | PASS | 0 | |
| 2. Validator self-test | PASS | 19/19 | sabotage matrix not re-run (slow) |
| 3. DEC allocation | PASS | 0 | |
| 4. Artifact completeness | PASS | 0 | visual-direction-lock has all 10 commitments |
| 5. Cross-references | PASS | 0 | |
| 6. Authority binding | PASS | 0 | |
| 7. Cascade integrity | N/A | – | no lock changes this run |
| 8. Lock sampling | PASS | 3/3 | sampled SCR-007, SCR-013, SCR-021 |
| 9. Idempotency hash | recorded | – | (next run will verify) |
```

If every row is PASS or N/A, completion is declared. Otherwise the run is held in `verification-needed` state.

## Sources and basis

This orchestrator's behavior is defined by the protocols in `../_visualforge-shared/references/`. Every subskill inherits these protocols. The orchestrator itself produces no design content — it only sequences, gates, and audits the work done by subskills.
