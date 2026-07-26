---
name: marketforge-channel-strategy
description: Apply Bullseye framework + business-model × channel-fit matrix + 7-factor scoring to produce a 3-leg portfolio (1 compound + 1-2 harvest + 1 wildcard). Use as Phase 2 step 1 of MarketForge full runs. Re-run quarterly.
---

# MarketForge Channel Strategy

Read shared references: `channel-scoring-matrix.md`, `business-model-channel-fit.md`, `portfolio-construction.md`, `kill-criteria-by-channel.md`. Apply Weinberg & Mares' Bullseye framework (Traction, 2014; updated for 2026).

## Global quality rules

- Score every candidate channel against the 7 factors. Don't recommend without scoring.
- 3-leg portfolio: 1 compound + 1-2 harvest + 1 wildcard. Document each.
- Concentration risk rule: no single channel >50% of new revenue.
- Apply business-model-channel-fit.md to seed the candidate list — but score before recommending.
- Founder-channel-fit overrides matrix optimality. An introverted founder running LinkedIn daily underperforms vs a podcaster founder guesting twice monthly, even if LinkedIn scores higher.

## Purpose

Produce a 3-leg channel portfolio:
1. The candidate channel list per business model.
2. Each channel's score against the 7 factors.
3. The selected compound + harvest + wildcard channels with rationale.
4. The first 90-day execution priority per channel.
5. Kill criteria per channel.

## Inputs

- `marketing-brief.md`.
- `readiness-check.md` (must show acceptable readiness for paid acquisition).
- `icp-and-personas/` (channels they read / use).
- `positioning.md`.
- `awareness-stages.md`.
- `competitive-intel.md` (channels competitors are NOT investing in — wildcard opportunities).
- `voice-of-customer.md` (attribution sources customers mentioned).

## Outputs

- `docs/marketing-plan/02-strategy/channel-strategy.md`
- `docs/marketing-plan/02-strategy/portfolio-construction.md` (the 3-leg synthesis)
- DEC-050 to DEC-079 — channel-selection decisions

## Output structure

```markdown
# Channel Strategy

## Business model + budget tier
- Business model: [classification]
- Budget tier: [T1 / T2 / T3 / T4+]
- Founder profile: [from marketing-brief]
- Stage: [pre-PMF / early post-PMF / scaling]

## Candidate channels (from business-model-channel-fit.md)
- Primary candidates: [list]
- Supporting candidates: [list]
- Skip channels for this model: [list]

## Channel scoring (per channel-scoring-matrix.md)

For each candidate channel, score 1-5 on:
1. Buyer-channel match
2. Economics
3. Skill fit
4. Time to result
5. Compounding
6. Competitive density
7. Channel-product fit

Total = sum (max 35).

[Score table for all candidates.]

## Selected 3-leg portfolio

### Leg 1 — Compound channel
- **Channel:** [name]
- **Score:** [N/35]
- **Why selected:** [evidence]
- **Allocation:** [% budget, % time, owner]
- **First 90-day priority:** [specific actions, week 1, 2, ..., 12]
- **12-month milestone:** [what success looks like]
- **Kill criterion (long window — see kill-criteria-by-channel.md):** [specific]
- **Reversal trigger:** [specific]

### Leg 2 — Primary harvest channel
[Similar structure; harvest channels use shorter kill windows]

### Leg 2b — Secondary harvest channel (optional)
[If T2+ budget and ICP diversity justifies]

### Leg 3 — Wildcard
- **Channel:** [name]
- **Thesis:** [asymmetric upside hypothesis]
- **Score:** [N/35]
- **Test budget:** [10-20% of total]
- **90-day test window**
- **Kill criterion:** [crisp — no signal of asymmetric upside]

## Rejected channels

For every rejected channel that scored high (≥25), explain rejection:
- [Channel] — score 27 but rejected because [founder won't execute / regulated domain / concentration risk].

For every channel scoring <18, explain skip.

## First 90-day execution priority

[Consolidated calendar of channel ramp-up. Week-by-week.]

## Concentration-risk monitoring
- Single-channel revenue contribution monitored monthly.
- Threshold: 50%.
- Mitigation plan if exceeded.

## Decision cards
[DEC-050 to DEC-079]

## What we are intentionally NOT doing in this layer
- Channel inventory ("we'll do everything") — pick 3.
- Two compound channels at half-strength — pick one.
- Skipping the wildcard — asymmetric opportunity cheap insurance.
- Applying paid-channel kill windows to compound channels — they need 6-12 months.

## Sources and basis

V3 §3-4 (Channel sections), §10.2 (Bullseye), §12.3-12.6 (Decision matrix), §12.5 (Portfolio construction).
Weinberg & Mares, *Traction*, 2014. Evidence grade: C.
```

## Re-positioning quarterly

Channels decay. Re-run this subskill quarterly:

- Re-score active channels with current data.
- Confirm compound channel is showing compounding signals.
- Confirm harvest channels still hit unit economics.
- Wildcard verdict: extend / kill / replace.
- Adjust allocation per evidence.

## Mode-aware behavior

### Mode A (greenfield)
- Score candidates against hypothesized ICP.
- Wildcard slot has wider thesis space (less competitive intel to constrain).
- Initial allocation conservative.

### Mode B/C (existing)
- Score includes historical performance data.
- Existing channels with negative signal: candidate for kill.
- Channels never tried: candidate for wildcard slot if asymmetric thesis exists.

### Continuous ops (Mode E)
- Quarterly re-scoring is the regular cadence.
- Monthly adjustment of allocation.

## Anti-patterns

### Anti-pattern A: 8-channel inventory
Pick 3. See `portfolio-construction.md`.

### Anti-pattern B: Founder-disowned primary channel
"LinkedIn scored highest but the founder refuses to post." Score it lower on Factor 3 (skill fit) and pick the second-highest.

### Anti-pattern C: Two compound channels split
Splitting compound investment across 2 channels = neither compounds. Pick one.

### Anti-pattern D: Wildcard without thesis
"Trying TikTok" is not a wildcard. "Trying TikTok with weekly engineering-content video series, thesis is dev-tool TikTok is under-served" is a wildcard.

### Anti-pattern E: Skipping readiness check
Don't recommend paid channels when readiness check is <5/7. See `marketforge-readiness-check`.

## Cross-cites produced

This is the most-cited decision in the marketing plan. Consumed by every channel subskill (paid-search, paid-social, paid-mobile, cold-email, organic-channels, etc.) for allocation + priority.

## Sources and basis

V3 §3-4, §10.2, §12.3-12.6.
