# Mode Detection Protocol

Before running, MarketForge detects which mode applies and adjusts its inputs and outputs.

## The modes

### Mode A: Greenfield product, no marketing yet
**Signals:** No website, or website is a placeholder; no ad accounts; no ESP; no customer list; product is pre-launch or just-launched.

**Behavior:**
- Start from positioning and ICP.
- Skip audit subskills (no current state to audit).
- Treat readiness check as forward-looking (will retention curve form?).
- Plan for sequence: positioning → ICP → channel selection → asset creation → launch → measurement.

### Mode B: Existing product, no marketing system
**Signals:** Product is live, has paying customers, but marketing is ad-hoc (one founder post per week, no email automation, broken signup flow, no analytics).

**Behavior:**
- Read the website + scrape positioning if available.
- Read VOC from customer interviews, reviews, support tickets if any.
- Run audit subskills on the few things that exist (homepage copy, signup flow, analytics events).
- Build the missing layers prioritized by leverage.

### Mode C: Existing marketing, drift / repair
**Signals:** Active marketing system (running ads, sending lifecycle emails, publishing content) with reported problems (CAC rising, attribution unclear, AI slop in content, channels abandoned, conflicting messaging).

**Behavior:**
- Comprehensive audit of all existing layers.
- Gap analysis vs MarketForge ideal.
- Prioritized fix list with effort estimates.
- Anti-pattern flagging (especially: AI slop content, fake testimonials, dark patterns, channel concentration risk, attribution single-source claims).

### Mode D: Launch-imminent
**Signals:** Product launching in N weeks; user explicitly states deadline.

**Behavior:**
- Compress phases to fit the deadline.
- Skip non-critical phases for the launch window; defer to post-launch.
- Sequence highest-leverage activities first (typically: positioning → website copy → pre-launch waitlist → PR pitch → influencer seeding → launch-day plan).
- Schedule post-launch deeper phases on the 30-60-90 calendar.

### Mode E: Continuous operations (agentic mode)
**Signals:** User explicitly invokes `agentic=on`; or scheduled task fires; or the orchestrator is invoked with `continuous` scope.

**Behavior:**
- See `agentic-operations-protocol.md`.
- Daily / weekly / monthly loops.
- Read telemetry → decide → produce → queue for approval → log.

## Detection sequence

1. Check for explicit user signal (e.g., `mode=agentic`, `--audit`, `launch-in-2-weeks`).
2. Check for `docs/marketing-plan/` existence:
   - If exists with recent runs and a current state → Mode C or E.
   - If exists but old/abandoned → Mode B or C.
3. Check for `docs/app-plan/` (SpecForge):
   - If exists and indicates pre-launch → Mode A or D.
   - If exists and indicates live → check website + customer signals.
4. Check for live website (URL provided or inferable):
   - If WebFetch available, fetch homepage and inspect.
   - If homepage is placeholder ("Coming soon") → Mode A.
   - If homepage has marketing copy → Mode B or C.
5. Check for existing ad accounts, ESP, CRM mentions in user prompt or available MCPs:
   - If any are live → Mode C.
6. Check for explicit deadline:
   - If deadline within 60 days → Mode D.
7. Default: Mode B (existing product, no marketing system) — the most common.

## Mode report output

Write `docs/marketing-plan/auditability/mode-report.md`:

```markdown
# MarketForge Mode Report

**Detected mode:** [A | B | C | D | E]
**Confidence:** [High | Medium | Low]
**Detection basis:**
- [signal 1 with evidence]
- [signal 2 with evidence]

**Mode implications:**
- [phases sequenced for this mode]
- [phases skipped or deferred]
- [special handling]

**User override accepted:** [yes/no — if user explicitly stated mode]

**Inputs available:**
- SpecForge docs: [yes/no, path]
- VisualForge docs: [yes/no, path]
- Existing website: [URL, scraped/not]
- Existing ad accounts: [yes/no, which]
- Existing ESP: [yes/no, which]
- Existing CRM: [yes/no, which]
- Analytics tool: [yes/no, which]
- Customer interview data: [yes/no, source]
- VOC review sources: [list]
- Founder audience: [yes/no, size, platforms]
```

## Mode-specific subskill adjustments

### Mode A (Greenfield)
- Skip `marketforge-voice-of-customer` review-mining components (no reviews yet) → use SpecForge's user research if present, otherwise mark Assumption.
- `marketforge-readiness-check` flags retention as PENDING.
- All decision cards include "Pre-PMF" caveat where applicable.

### Mode B (Existing-no-marketing)
- Inspect website (WebFetch homepage, pricing, about, blog index).
- Audit existing copy for slop, voice consistency.
- Often skip new positioning if positioning is fine; focus on missing layers (email lifecycle, paid, GEO).

### Mode C (Audit + repair)
- Comprehensive audit pass before any new work.
- Output: `auditability/gap-analysis.md` with prioritized findings.
- Many subskills run in revision mode rather than from-scratch.

### Mode D (Launch-imminent)
- Defer Phase 8 (Lifecycle) initial flows to post-launch where possible (welcome flow shippable; expansion flow deferred).
- Defer Phase 9 deep MMM/incrementality (can't do until launched).
- Prioritize: positioning → website copy → launch-page LP → press/PR → influencer seeding → launch-day calendar → lifecycle Welcome → analytics baseline.

### Mode E (Continuous ops)
- Read previous run-state and active operations.
- Skip orchestration steps that already completed.
- Loop on operations runbook from `agentic-operations-protocol.md`.

## Detection failure handling

If the mode cannot be confidently detected:

1. Default to Mode B with Confidence: Low.
2. Surface to user: "I detected [mode] with low confidence. Override if wrong: `> mode=X`."
3. In Auto mode, proceed and log the assumption.

## Mode persistence

The detected mode is written to `auditability/run-state.json` and used by all subskills in the run. Mid-run mode changes require an explicit user override.
