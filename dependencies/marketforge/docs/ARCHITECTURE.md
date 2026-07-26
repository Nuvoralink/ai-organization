# MarketForge Architecture

## High-level design

MarketForge follows the orchestrator + shared-references + many-subskills pattern established by VisualForge and SpecForge:

```
MarketForge
├── Orchestrator (marketforge)         — Detects mode, sequences phases, validates
├── Shared references (~22 docs)        — Anti-slop, evidence grading, templates
└── Subskills (50+)                    — One per marketing domain
    ├── Phase 1: Foundation (8)
    ├── Phase 2: Strategy (5)
    ├── Phase 3: Brand (5)
    ├── Phase 4: Website + Content (6)
    ├── Phase 5: Paid (6)
    ├── Phase 6: Outbound (4)
    ├── Phase 7: Organic + Social (11)
    ├── Phase 8: Lifecycle (9)
    ├── Phase 9: CRO + Measurement (6)
    ├── Phase 10: Visual Assets (5)
    └── Phase 11: Launch + QA (6)
```

## Design principles

### 1. Evidence-graded everywhere

Every claim, framework citation, benchmark gets an A/B/C/D/E grade. The orchestrator validates this via the evidence-grader script.

### 2. Decision-card discipline

Every material decision uses the opinionated decision template:
- DEC-NNN ID (allocated per phase range)
- Decision (concrete values)
- Why this + why not alternatives
- Confidence + evidence grade + source basis
- Commercial-bias flag
- Asset / channel / metric bindings
- Kill criterion + reversal trigger + test window
- Anti-pattern to avoid
- Cross-cites consumed + produced

### 3. Anti-slop discipline

Scanned via validator script:
- Banned phrases ("leverage", "best-in-class", "game-changing").
- Three-word-triplet AI cadence.
- Hedged non-decisions.
- Stale references (HARO, Google Optimize, pre-iOS-14 attribution claims).

### 4. Commercial-bias flagging

Vendor-promoted frameworks (60/40, 95-5, GEO ROI claims, "AI cold email 21% replies") are cited with explicit bias level and triangulation status.

### 5. Channel-decay aware

Channel performance decays. The orchestrator dates every cited benchmark and flags stale-channel-assumption patterns.

### 6. Stage-aware (Schwartz)

Every page, ad, email, CTA declares target awareness stage. Stage-mismatches are BLOCK findings.

### 7. Multi-source attribution

Never single-source. Platform + CAPI + self-report + (when supported) incrementality.

### 8. Delegation to specialized skills

- `banana-claude:banana` for image generation (banana-bridge.md).
- `marketing-skills:*` plugin for tactical execution (marketing-skills-bridge.md).
- VisualForge for brand visual (visualforge-bridge.md).
- SpecForge for product spec (specforge-bridge.md).

## Orchestrator design

### Pre-flight
- Skill detection (banana, marketing-skills, VF, SF, MCPs).
- Concurrency lock.
- Resume check (validate input hashes; skip completed).
- Scope + budget tier selection.
- Pre-run estimate surfaced to user.

### Phase execution
- Each phase runs sequentially.
- After every 2 subskills: status entry written to run-log.
- After every phase: phase-boundary mini pressure-test.
- BLOCK findings at phase boundary halt the run.

### Post-execution
- Marketing QA → pressure-test → bias-audit.
- Agent-rules-update.
- Run summary.

### Resilience
- Checkpointing after every subskill.
- Resume on context exhaustion or interruption.
- Append-only auditability files (corrections via correction-entry protocol).

## Subskill design pattern

Every subskill follows this structure:

```markdown
---
name: marketforge-[name]
description: [What this does, when to trigger, where in phase sequence]
---

# MarketForge [Name]

[Brief on global quality rules specific to this subskill]

## Global quality rules
[3-7 rules]

## Purpose
[What it produces]

## Inputs
[Files / decisions consumed]

## Outputs
[Files written + DEC-NNN range allocated]

## Mode-aware behavior
[Greenfield / existing / drift / launch-imminent / continuous variations]

## Structure (template)
[The output template — markdown, decision cards, sections]

## Decision cards
[DEC-NNN range and what each decision card captures]

## What we are intentionally NOT doing in this layer
[Explicit prohibitions]

## Sources and basis
[V3 sections + cited frameworks with evidence grades]
```

## Decision-ID allocation

- DEC-001 to 049: Foundations
- DEC-050 to 099: Strategy
- DEC-100 to 149: Brand
- DEC-150 to 249: Website + Content
- DEC-250 to 349: Paid
- DEC-350 to 399: Outbound
- DEC-400 to 499: Organic & Social
- DEC-500 to 599: Lifecycle
- DEC-600 to 699: CRO & Measurement
- DEC-700 to 749: Visual assets
- DEC-750 to 799: Launch + Execution
- DEC-800 to 899: Operations / agentic decisions
- DEC-900 to 999: Audit / drift / supersession

## Output directory structure

Under `docs/marketing-plan/`:
```
README.md
RULES.md
00-index.md (regenerated at end of every run)
01-foundations/
02-strategy/
03-brand/
04-website-content/
05-paid/
06-outbound/
07-organic-social/
08-lifecycle/
09-cro-measurement/
10-visual-assets/
11-execution/
auditability/
  ├── decision-log.md
  ├── research-ledger.md
  ├── run-state.json
  ├── run-log.md
  ├── mode-report.md
  ├── skill-detection-report.md
  ├── marketing-quality-review.md
  ├── pressure-test-report.md
  ├── bias-audit.md
  ├── rules-update-log.md
  └── deferred-findings.md
operations/ (continuous-mode only)
  ├── YYYY-MM-DD.md (daily journals)
  ├── approval-queue.md
  └── weekly/ + monthly/ + quarterly/
```

## Validation

`scripts/validate_marketing_docs.py` runs:
- Mid-run validation (subset, fast).
- Final validation (full, strict).
- Anti-slop scan.
- Stale-reference scan.
- DEC-NNN format check.
- Required-section check.

## Agentic mode design

See `agents/AGENTS.md` and `_marketforge-shared/references/agentic-operations-protocol.md`.

Three cadences:
- Daily light loop.
- Weekly medium loop.
- Monthly heavy loop.
- Quarterly full strategy re-run.

Approval queue model: all external-publish actions require human approval by default. Anomaly thresholds breached → pause.

## Coordination with sibling skills

- VisualForge produces brand visual system → MarketForge reads as authoritative.
- SpecForge produces product spec → MarketForge reads as authoritative.
- Banana-claude produces images → MarketForge sends briefs.
- Marketing-skills plugin produces tactical execution → MarketForge wraps with strategy.

## Extension points

- New subskill: add to `skills/marketforge-[name]/SKILL.md`, register in orchestrator phase list.
- New shared reference: add to `_marketforge-shared/references/`, cite from relevant subskill.
- New template: add to `_marketforge-shared/templates/`, cite from subskill.
- New validator check: edit `scripts/validate_marketing_docs.py`.
- New scenario / business model: extend `business-model-channel-fit.md`.
