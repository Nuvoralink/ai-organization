# MarketForge Usage Guide

## Quick start

### Build a complete marketing system for a new product
```
$marketforge
```

The orchestrator will:
1. Detect mode (greenfield / existing / drift / launch-imminent / continuous).
2. Detect available skills (banana-claude, marketing-skills plugin, VisualForge, SpecForge).
3. Run the discovery interview (5 questions, with recommendations).
4. Run the 7-gate readiness check (block paid if <5/7 pass).
5. Sequence the relevant phases (1-11).
6. Generate ~60-120 documents under `docs/marketing-plan/`.
7. Run marketing-qa + pressure-test + bias-audit.
8. Surface results.

Expect 2-12 hours of agent time depending on scope.

### Focused work
```
$marketforge scope=focused channels=paid-search,linkedin-organic
```

Builds only those channel subskills + their dependencies.

### Audit existing marketing
```
$marketforge scope=audit
```

Inspects current site, ad accounts, ESP, CRM, analytics. Produces gap report.

### Continuous operations
```
$marketforge agentic=on cadence=daily
```

Registers daily/weekly/monthly scheduled loops. Produces:
- Daily content drafts + ad creative variants.
- Weekly KPI reports + cohort retention + attribution refresh.
- Monthly channel review + budget re-allocation proposal.
- Quarterly full strategy re-run.

## How the orchestrator runs

### Step 0: Pre-flight
- Skill detection (banana, marketing-skills, VF, SF).
- Concurrency lock.
- Resume check.
- Scope + budget tier selection.
- Pre-run estimate (surface to user before commencing).

### Steps 1-11: Phases
- Phase 1: Discovery + Research (8 subskills).
- Phase 2: Strategy (5).
- Phase 3: Brand (5).
- Phase 4: Website + Content (6).
- Phase 5: Paid (6).
- Phase 6: Outbound (4).
- Phase 7: Organic + Social (11).
- Phase 8: Lifecycle (9).
- Phase 9: CRO + Measurement (6).
- Phase 10: Visual Assets (5).
- Phase 11: Launch + QA (6).

### After every phase
- Phase-boundary mini pressure-test runs.
- BLOCK findings halt the run; loop limit 2 iterations.

### After all phases
- Marketing QA → pressure-test → bias-audit.
- Agent-rules-update.
- Concurrency lock released.

## Inputs the orchestrator looks for

### Required
- A product description (1-2 sentences).

### Strongly recommended
- Business model classification.
- Stage (pre-PMF / post-PMF / scaling).
- Budget tier (T1 $0-500/mo, T2 $500-5K/mo, T3 $5K-25K/mo).

### Helpful when present
- SpecForge product docs at `docs/app-plan/`.
- VisualForge design docs at `docs/design-system/`.
- Existing website URL.
- Existing ad accounts, ESP, CRM access via MCPs.
- Customer interview transcripts.
- Retention data (cohort curves).

### Detected automatically
- Available skills (via system context).
- Available MCPs.
- Existing `docs/marketing-plan/` (for resume / continuous).

## Outputs

All under `docs/marketing-plan/`:

```
docs/marketing-plan/
├── README.md (index)
├── RULES.md (operating rules)
├── 01-foundations/
├── 02-strategy/
├── 03-brand/
├── 04-website-content/
├── 05-paid/
├── 06-outbound/
├── 07-organic-social/
├── 08-lifecycle/
├── 09-cro-measurement/
├── 10-visual-assets/
├── 11-execution/
└── auditability/
    ├── decision-log.md
    ├── research-ledger.md
    ├── marketing-quality-review.md
    ├── pressure-test-report.md
    ├── bias-audit.md
    └── run-state.json
```

## Working with the output

### Decision cards
Every material decision has a DEC-NNN card. Read the card before changing anything. Cards include:
- Decision (with concrete values).
- Why this + why not alternatives.
- Confidence + evidence grade.
- Source basis + commercial-bias flag.
- Asset / channel / metric bindings.
- Kill criterion + reversal trigger + test window.
- Anti-pattern to avoid.
- Related decisions + cross-cites.

### Override mid-run
```
$marketforge override DEC-014 to "[new direction]"
```

Cascade ripples through dependent subskills.

### Resume after interruption
```
$marketforge resume
```

Validates input hashes; skips completed subskills; re-runs in-progress from scratch; continues pending.

## Working with the agentic mode

### Activate
```
$marketforge agentic=on cadence=daily
```

### Default cadence
- Daily 09:00 local: light loop (~15-60 min).
- Weekly Monday 09:00: medium loop (1-2h).
- Monthly 1st 09:00: heavy loop (4-8h).
- Quarterly: full strategy re-run.

### Override cadence
```
$marketforge agentic=on cadence=light:daily,medium:weekly:fri,heavy:monthly:15
```

### Safety guardrails (always-on)
- No auto-publish to public surfaces without approval.
- No auto-push ad spend changes without approval.
- No auto-send cold email batches without per-batch approval.
- Anomaly thresholds breached → pause + surface.
- Daily operations journal written.

### Pause
```
$marketforge agentic=off
```

### Approval queue
`docs/marketing-plan/operations/approval-queue.md` is a table of pending items.
Approve via:
- File edit (`Status: APPROVED`).
- Command (`$marketforge approve APR-2026-05-20-001`).

## Required tools / MCPs (for full quality)

### Always
- `banana-claude:banana` — image generation.

### Highly recommended
- `marketing-skills:*` plugin — tactical execution.
- WebFetch / WebSearch — current research, competitive scrapes.

### For agentic mode
- `scheduled-tasks` MCP — cron loops.
- Analytics MCP (GA4 / Plausible / Mixpanel / PostHog / Amplitude).
- Ad platform MCPs (Meta, Google, LinkedIn, TikTok, ASA).
- ESP MCPs (Klaviyo / Customer.io / HubSpot).
- CRM MCPs (HubSpot / Apollo / Clay).
- Social MCPs (LinkedIn / X / Buffer).
- SEO MCPs (Ahrefs / Semrush / GSC).
- GEO MCPs (Profound / Otterly / Peec AI).

## Validation scripts

### Marketing docs validator
```
python scripts/validate_marketing_docs.py --root docs/marketing-plan [--mid-run|--final] [--strict]
```

Checks:
- Anti-slop banned phrases.
- Stale references (HARO, Google Optimize, etc.).
- DEC-NNN ID format.
- Required sections present.

### Channel scorer
```
python scripts/channel_scorer.py --input channels.json [--output scores.json]
```

Scores channels against 7-factor matrix; recommends 3-leg portfolio.

### Readiness check
```
python scripts/readiness_check.py --input readiness.json
```

Evaluates the 7 gates; recommends proceed/cap/block/hard-block.

### Evidence-grade scanner
```
python scripts/evidence_grader.py --root docs/marketing-plan
```

Finds statistical claims missing nearby evidence grade.

## Common questions

### Why does MarketForge sometimes refuse to recommend paid spend?
Because the readiness check failed. Pre-PMF marketing is interviews and product work, not Meta Ads. See `readiness-check-protocol.md`.

### Why does MarketForge recommend founder content over hired marketing?
Founder voice survives AI saturation. Hired voice often doesn't. See `ai-saturation-watch.md`.

### Why does MarketForge recommend LinkedIn Thought Leader Ads over Single Image Ads?
ZenABM 2026 (161,256 ads, 211 companies): 6.4x CTR, 77% cheaper CPC. See `marketforge-paid-social`.

### Why does MarketForge recommend triangulated attribution?
Because platform-reported attribution is broken post-iOS 14.5 + cookie deprecation. See `attribution-protocol.md`.

### Why does MarketForge sometimes flag a "best practice" as commercial bias?
Because frameworks promoted heavily by vendors (60/40 brand/performance, 95-5 rule, GEO ROI claims) have commercial alignment that distorts the framing. See `commercial-bias-map.md`. We cite, we flag, we triangulate.

### Why does the orchestrator take so long?
Because doing the work of a marketing department comprehensively takes time. ~60-120 documents, ~150-300 decision cards, validated. You can run focused scopes for faster turnaround.

### Can I just use one subskill?
Yes. Each subskill is independently invokable:
```
$marketforge-website-copy
$marketforge-paid-search
$marketforge-cold-email
```

They'll either find inputs in `docs/marketing-plan/` or ask via discovery interview.

## Extending MarketForge

### Add a new subskill
Create `skills/marketforge-[name]/SKILL.md` following the pattern of existing subskills:
- YAML frontmatter (name + description).
- Global quality rules.
- Purpose, Inputs, Outputs.
- Structure / template.
- "What we are intentionally NOT doing."
- "Sources and basis."

Add it to the orchestrator phase list in `marketforge/SKILL.md`.

### Override a default
Override single decisions via:
```
$marketforge override DEC-NNN to "..."
```

Update orchestrator phases or default behaviors by editing `marketforge/SKILL.md`.

### Add a new validation check
Edit `scripts/validate_marketing_docs.py` and add a new check function.

## Getting help

- Read the orchestrator `skills/marketforge/SKILL.md` for the full flow.
- Read individual subskill SKILL.md files for tactical guidance.
- Read shared references in `skills/_marketforge-shared/references/`.
- The V3 Marketing Guide is the doctrinal source (in `docs/`).
