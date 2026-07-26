---
name: marketforge-content-calendar
description: Build a 12-week production calendar — every piece, every channel, every owner, every due date. Synthesizes content strategy into executable schedule. Use as Phase 4 step 6.
---

# MarketForge Content Calendar

Read shared references. Synthesize content strategy decisions into a tactical 12-week schedule.

## Global quality rules

- One piece, one owner, one due date.
- Schedule respects realistic production capacity — no "10 pieces this week" with a 1-person team.
- Every piece has its distribution plan attached.
- Quarterly horizon is the planning unit; weekly is the execution unit.

## Purpose

Produce:
1. 12-week (one quarter) content calendar.
2. Per-piece brief (title, author, deadline, distribution).
3. Distribution checklist per piece.
4. Slack for re-prioritization / opportunistic pieces.

## Inputs

- `content-strategy.md`.
- `okr-quarterly-plan.md` (the quarter's narrative + bets).
- `seo-strategy.md` (BoFu page priorities).
- `geo-llmo.md`.
- Founder availability + team capacity.

## Outputs

- `docs/marketing-plan/04-website-content/content-calendar.md`
- DEC-330 to DEC-339 (calendar-level decisions; individual piece DEC IDs are produced as pieces are written)

## Structure

```markdown
# Content Calendar — Q[N] YYYY

## Theme (from OKR plan)
[Annual narrative theme + quarterly bet that informs content selection]

## 12-week schedule

| Week | Piece type | Title (working) | Author | Awareness stage | Distribution plan | Status |
|---|---|---|---|---|---|---|
| W1 | Comparison | "[Us] vs [Competitor A]" | [Name] | Solution-aware | LP + LI + X + newsletter | Draft due W1 |
| W1 | POV piece | "[POV title]" | Founder | Problem-aware | LI + X + newsletter | Draft due W1 |
| W2 | Integration | "[Us] + [Tool]" | [Name] | Product-aware | LP + relevant slack/community | |
| W2 | Customer case study | "[Customer Name] cut [X]" | [Name] | Product-aware | LP + sales enablement + LI | |
| W3 | Founder POV | "[Annual research preview]" | Founder | Problem-aware | LI + X + newsletter | |
| ... | | | | | | |
| W12 | Original research report (annual) | "[Report title]" | Cross-functional | Problem/Solution-aware | LP + PR + LI + newsletter + podcast + investor letter | |

## Per-piece briefs

### Brief: "[Us] vs [Competitor A]"
- Owner: [name]
- Word count: 1,500-2,500
- Awareness stage: Solution / Product-aware
- Key proof points: [list with sources]
- VOC quotes to use: [list]
- Image asset brief: [delegate to banana / VisualForge]
- Distribution sequence:
  - Day 0: Publish LP
  - Day 0: LinkedIn carousel + post by founder
  - Day 1: X thread
  - Day 2: Newsletter sponsorship placement (if scheduled)
  - Day 3: Outreach to 10 named people who'd engage
  - Day 7: Repurposed quote cards for social
- Due: [date]
- Status: [draft / review / scheduled / published]

[Per-piece briefs for at least the first 4 weeks; later weeks can be lighter]

## Capacity budget

- Founder content: [N hours/week]
- Content writer: [N hours/week]
- Designer / illustrator: [N hours/week]
- Total content output capacity: [N pieces/month]

If calendar exceeds capacity → cut from the bottom (lowest-leverage piece).

## Slack capacity (15-20% of calendar)
Reserve for:
- Opportunistic news-cycle response.
- Customer interview-driven content.
- Engineering team contributing technical content.
- PR moment requiring rapid POV.

## Distribution discipline

Every piece has a documented distribution plan BEFORE writing. "Build it and they will come" is anti-pattern 8 of V3 §12.8.

## Re-prioritization triggers

- Major news event in category → opportunistic POV piece.
- Customer says something quotable in interview → case study fast-track.
- Competitor major launch → comparison-page priority bump.
- Pressure-test finding → de-prioritize lower-leverage pieces.

## Decision cards
[DEC-330 to DEC-339]

## What we are intentionally NOT doing
- Planning beyond 12 weeks in detail (frame Q+1 lightly; detail at Q boundary).
- Treating the calendar as fixed — re-prioritize at weekly checkpoints.
- Skipping distribution planning — production without distribution is waste.
- Filling slots with low-leverage pieces just to maintain cadence.

## Sources and basis
V3 §3.3, §10.3.
```

## Output cadence by tier

| Tier | Realistic 12-week output |
|---|---|
| T1 | ~12 pieces (1 per week) — mostly founder POV + 4-6 BoFu pages over the quarter |
| T2 | ~24 pieces — 2 per week — comparison + integration + POV + case study mix |
| T3 | ~40+ pieces — multi-channel, multi-author |

## Cross-cites consumed
- DEC-300-329 (content strategy).
- DEC-090-099 (OKR plan).
- DEC-270-289 (SEO).

## Sources and basis
V3 §3.3.
