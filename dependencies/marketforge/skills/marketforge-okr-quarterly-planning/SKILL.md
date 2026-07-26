---
name: marketforge-okr-quarterly-planning
description: Set quarterly OKRs and annual narrative theme. One annual theme, 3 quarterly bets max, 1-2 OKRs per quarter. Avoid vanity metrics as KRs. Use as Phase 2 step 5.
---

# MarketForge OKR Quarterly Planning

Read shared references. Apply V3 guide §10.3 (Quarterly planning) and §10.4 (OKRs).

## Global quality rules

- Vanity metrics (followers, impressions, MQLs without pipeline tie) are banned as primary KRs.
- Activity metrics (emails sent, posts published) are banned as KRs — they're inputs, not outputs.
- 1 annual narrative theme. Maximum.
- 3 quarterly bets. Maximum.
- 1-2 OKRs per quarter. Maximum.
- Leading indicators > lagging indicators where possible.

## Purpose

Produce:
1. Annual narrative theme.
2. 3 quarterly bets per quarter.
3. 1-2 OKRs per quarter with Objective + Key Results.
4. Mid-quarter checkpoint protocol.
5. End-quarter retrospective protocol.

## Inputs

- `marketing-brief.md`.
- `channel-strategy.md` + `portfolio-construction.md`.
- `brand-vs-performance.md`.
- `budget-allocation.md`.
- SpecForge product roadmap if present.

## Outputs

- `docs/marketing-plan/02-strategy/okr-quarterly-plan.md`
- DEC-090 to DEC-099 — OKR + bet decisions

## Structure

```markdown
# Quarterly OKR + Narrative Plan

## Annual narrative theme (YYYY)
[One sentence — the marketing story arc for the year. Examples:
"The year we became the obvious choice for [ICP] migrating off [legacy player]."
"The year we built the audience that earns the next stage of growth."
"The year we shifted from outbound dependency to inbound flywheel."]

## Quarterly bets — Q1

### Bet 1: [name]
- **Thesis:** [why this bet matters this quarter]
- **Investment:** [time + budget]
- **What success looks like:** [specific]
- **What failure looks like:** [specific — what would tell us to stop]

### Bet 2: [name]
[Similar]

### Bet 3: [name]
[Similar]

## OKRs — Q1

### OKR 1
**Objective:** [qualitative, ambitious, time-bound. Example: "Become the default consideration for [ICP] migrating from [competitor]."]

**Key Results (3-5, measurable):**
1. KR1: [specific number + measure + date]. Example: "Q1 inbound trial signups from comparison-pages source ≥ 250 (measured via UTM + landing-page form attribution)."
2. KR2: [specific number + measure + date]
3. KR3: [specific number + measure + date]

### OKR 2 (optional)
[Similar structure]

## Mid-quarter checkpoint (week 6)

What to review:
- Bet 1 status: on-track / off-track / kill?
- Bet 2 status: on-track / off-track / kill?
- Bet 3 status: on-track / off-track / kill?
- OKR 1 trajectory: are we ~50% to target by week 6?
- OKR 2 trajectory: same.

What to decide:
- Continue / kill / pivot each bet.
- Re-allocate freed budget.

## End-quarter retrospective

- Bets that worked + why.
- Bets that didn't + why.
- OKR scores (0.0-1.0 scale).
- What we learned about the ICP / channel / message.
- Inputs to next quarter's planning.

## Q2, Q3, Q4 — initial framing
(Filled in detail at mid-quarter checkpoint; framed at annual planning.)

## Decision cards
[DEC-090 to DEC-099]

## What we are intentionally NOT doing in this layer
- Setting 6 quarterly bets (overcommitment).
- Setting 5+ OKRs (focus dilution).
- Using vanity metrics as KRs.
- Using activity metrics (posts published, emails sent) as KRs.
- Pretending the plan is fixed — mid-quarter checkpoint can kill bets.

## Sources and basis

V3 §10.3 (Quarterly planning), §10.4 (OKRs). Practitioner consensus C-grade.
```

## Anti-pattern KRs (refuse these)

- "Reach 10,000 LinkedIn followers." → Vanity. Refuse.
- "Send 100,000 cold emails." → Activity. Refuse.
- "Generate 500 MQLs." → MQLs without pipeline tie are vanity. Refuse or rewrite as "500 MQLs that convert to ≥50 SQOs."
- "Publish 200 blog posts." → Activity. Refuse or rewrite as "200 blog posts that collectively drive 10K monthly organic visits and 500 trial signups."
- "Improve brand awareness." → Unmeasurable. Refuse or rewrite as "Brand-search volume up 30% Q-over-Q per GSC."

## Good KR patterns

- "First-purchase customers Q1 ≥ 450 (currently 280)."
- "Trial-to-paid conversion ≥ 18% (currently 12%) measured monthly."
- "Branded search impressions ≥ 25K/month (currently 15K) per Google Search Console."
- "Self-reported attribution to dark social channels ≥ 25% of new customers."
- "Comparison-page traffic ≥ 8K monthly (currently 2K)."
- "Cohort D30 retention ≥ 60% on Q1 trial cohort."

## Anti-patterns in bets

### Anti-pattern A: 6 bets
Too many. Focus dilutes. Cut to 3.

### Anti-pattern B: Generic bet
"Improve marketing." Refuse. "Reduce blended CAC by 30% via paid-search competitor-keyword expansion + LP CRO" is a bet.

### Anti-pattern C: Bet without thesis
A bet must answer "why this bet now?" If no thesis, cut it.

### Anti-pattern D: Bet with no kill criterion
Every bet has a "what would tell us to stop" definition.

## Cross-cites produced

- All channel subskills (channel-level KRs roll up to quarterly OKRs).
- `marketforge-execution-calendar` (week-by-week mapping).

## Sources and basis

V3 §10.3, §10.4. Practitioner C-grade.
