---
name: marketforge-execution-calendar
description: Build 12-week consolidated tactical calendar — every asset, every channel, every owner, every due date. Synthesizes all subskill outputs into executable schedule. Use as Phase 11 step 2.
---

# MarketForge Execution Calendar

## Purpose

Consolidate all subskill outputs into a 12-week tactical calendar with:
- Per-day actions per channel.
- Per-asset due dates + owners.
- Dependencies + blockers.
- Re-prioritization checkpoints.

## Inputs

Every subskill's per-channel cadence + per-asset brief.

## Outputs
- `docs/marketing-plan/11-execution/execution-calendar.md`
- DEC-770 to DEC-774

## Structure

```markdown
# Execution Calendar — Q[N]

## Week-by-week summary

### Week 1
- Monday: [actions]
- Tuesday: ...
- ...
- KPI checkpoints: [end-of-week]

### Week 2
[Similar]

... through Week 12

## Per-channel weekly cadence

| Channel | Frequency | Owner | Asset source |
|---|---|---|---|
| LinkedIn founder | 5/week | Founder | content-calendar.md |
| X/Twitter founder | 2/day | Founder | content-calendar.md |
| Newsletter | 1/week | Content lead | content-calendar.md |
| Blog (deep piece) | 1/2 weeks | Content lead | content-strategy.md |
| Email lifecycle review | weekly | Lifecycle lead | email-lifecycle.md |
| Paid ad creative refresh | 2/month | Paid lead | ad-creative-brief.md |
| Outbound batch | weekly | SDR | cold-email.md |
| ... | ... | ... | ... |

## Per-week checkpoint structure

### Monday: planning
- Week's content + creative queue.
- Outbound batch loaded.
- Approval queue cleared (agentic).

### Wednesday: mid-week checkpoint
- Performance check.
- Anomalies surface.

### Friday: end-of-week
- KPI review.
- Next week's priorities adjusted.

## Quarterly checkpoints (per OKR)

### Week 6: mid-quarter
- OKR trajectory review.
- Bet status (on-track / off-track / kill).
- Re-allocation if needed.

### Week 12: end-quarter
- Retrospective.
- OKR scoring.
- Next quarter planning starts.

## Decision cards
[DEC-770 to DEC-774]

## What we are intentionally NOT doing
- Calendar without owners (no accountability).
- Calendar at quarter+ horizon in detail (frame lightly; detail at boundary).
- Treating calendar as fixed (weekly re-prioritization).

## Sources and basis
V3 §10.3 (Quarterly planning).
```

## Sources and basis
V3 §10.3.
