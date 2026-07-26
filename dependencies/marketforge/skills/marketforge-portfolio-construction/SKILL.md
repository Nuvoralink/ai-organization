---
name: marketforge-portfolio-construction
description: Build the 3-leg channel portfolio (1 compound + 1-2 harvest + 1 wildcard) with allocation, kill criteria, concentration-risk monitoring. Synthesizes channel-strategy outputs into an executable portfolio. Use as Phase 2 step 2.
---

# MarketForge Portfolio Construction

Read `portfolio-construction.md` and `kill-criteria-by-channel.md`. This subskill turns the channel-strategy decisions into the operational portfolio.

## Purpose

The output of `marketforge-channel-strategy` lists scored channels and selects the 3 legs. This subskill turns that into an executable portfolio with allocation, monitoring, and re-evaluation cadence.

## Inputs

- `channel-strategy.md` (the selected 3 legs).
- `budget-allocation.md` (or, in the same run, this subskill informs `marketforge-budget-planning`).
- All foundational decisions.

## Outputs

- `docs/marketing-plan/02-strategy/portfolio-construction.md`
- DEC-070 to DEC-079 — portfolio construction decisions

## Structure

```markdown
# Portfolio Construction

## The 3-leg model

| Leg | Channel | Allocation (% budget) | Allocation (% time) | Owner | Kill window |
|---|---|---|---|---|---|
| Compound | [channel] | X% | X% | [role] | 6-12 months |
| Harvest 1 | [channel] | X% | X% | [role] | 30-60 days |
| Harvest 2 (if any) | [channel] | X% | X% | [role] | 30-60 days |
| Wildcard | [channel] | X% | X% | [role] | 90 days |

## Per-leg execution detail

### Compound leg — [channel]
- **12-month milestone:** [specific outcome]
- **6-month milestone:**
- **3-month milestone:**
- **First 30 days:** [actions]
- **Investment thesis:** [why this compound channel for this product]
- **Compounding signal to watch:** [what tells us it's working — e.g., growing branded search, growing inbound from this channel, audience growth]
- **Kill criterion:** [specific — must be slow to trigger; 6-12 months minimum]
- **Reversal trigger:** [lighter signal]

### Harvest leg 1 — [channel]
- **Unit economics target:** [CAC, ROAS, payback period]
- **Test budget (first 30 days):** $[N]
- **Ramp budget (60-90 days if working):** $[N]
- **Kill criterion:** [specific per kill-criteria-by-channel.md]
- **Iteration cadence:** [creative refresh weekly / monthly]

### Wildcard — [channel]
- **Thesis:** [asymmetric upside hypothesis]
- **90-day test budget:** $[N]
- **Success criterion (what would make us extend):** [specific]
- **Kill criterion (what would make us replace):** [specific]
- **Next-up wildcard candidates if this one kills:** [list]

## Concentration risk monitoring

| Threshold | Action |
|---|---|
| Single channel <30% revenue | Healthy diversification |
| Single channel 30-50% | Acceptable; monitor |
| Single channel 50-70% | Yellow zone; activate diversification work |
| Single channel >70% | Red zone; channel-decay risk; mitigation plan required |

Mitigation plans:
- If compound channel becomes >70%: that's actually positive (it's the asset). But add a second harvest channel as resilience.
- If harvest channel becomes >70%: build out a second harvest channel; accelerate compound channel.

## Allocation summary

- Total monthly budget: $[N]
- Compound: $[N] paid + [N] hours founder/team
- Harvest 1: $[N] paid
- Harvest 2: $[N] paid (if any)
- Wildcard: $[N] paid + [N] hours

## Re-evaluation cadence

- **Weekly (agentic light loop):** Active-channel health check; anomaly surface.
- **Monthly (agentic medium loop):** Channel-level performance vs targets; budget adjustment proposal.
- **Quarterly:** Re-run `marketforge-channel-strategy`. Re-score. Adjust portfolio.

## Operational reserves

- Reserve 10-15% of budget for opportunistic spend (new channel test, creative refresh accelerant, anomaly response).

## Decision cards
[DEC-070 to DEC-079]

## What we are intentionally NOT doing
- 4+ active channels at once — execution becomes too thin.
- Channels without owners — every channel has a named owner.
- Allocation without budget math — every $ is assigned a channel + thesis.

## Sources and basis

V3 §12.5 (Portfolio construction), §12.6 (Differential kill/scale criteria), §8.8 (Kill criteria by channel).
```

## Anti-patterns

- Channel allocation without ICP grounding — see `marketforge-icp-persona`.
- Equal split across 5 channels — see anti-patterns in `portfolio-construction.md`.
- Wildcard slot used as "spray and pray" — wildcards have specific theses.

## Cross-cites produced

- `marketforge-budget-planning` (the dollar amounts).
- Every channel subskill (the allocation + kill criteria + timeline).

## Sources and basis

V3 §12.5, §12.6, §8.8.
