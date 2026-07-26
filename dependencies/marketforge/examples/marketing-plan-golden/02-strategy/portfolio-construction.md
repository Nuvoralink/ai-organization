<!-- marketforge: v1.2.0 run-id=golden-fixture scope=full generated=2026-05-20 -->

# Portfolio Construction (Golden Fixture)

3-leg model with multiple channels at different lifecycle states.

## The 3-leg model

| Leg | Channel | Allocation (% budget) | Allocation (% time) | Owner | Kill window |
|---|---|---|---|---|---|
| Compound | Founder LinkedIn + HackerNews + content | 0% paid + 30% founder time | 30% | Founder | 12 months |
| Harvest 1 | Paid search (competitor + branded) | 35% paid budget | 10% | Paid lead | 30-60 days |
| Harvest 2 | Newsletter sponsorships (Pragmatic Engineer + 2 others) | 25% paid | 5% | Content lead | 1-2 placements per newsletter |
| Wildcard | Show HN engineering deep-dives | 0% paid + 10% engineering time | 10% | Engineering | 90 days |

Total paid budget allocated: ~60 percent of paid (the rest is operational reserve).
Concentration check: largest single channel = 35% — within concentration risk threshold.

## Per-leg execution detail

### Compound leg — Founder content
- 12-month milestone: 5K LinkedIn followers, 100 newsletter subs, 20+ DM-driven inbound meetings.
- 6-month milestone: founder voice established; 3 POV pieces with 1K+ engagements each.
- 3-month milestone: 5 posts/week sustained cadence; reply-to-every-comment discipline.
- First 30 days: 25 posts; founder audit + voice calibration.
- Investment thesis: ICP-001 (VPE-level) is active on LinkedIn; founder has technical credibility.
- Compounding signal to watch: branded search growth, newsletter subs, DM-driven inbound.

### Harvest leg 1 — Paid search (competitor + branded)
- Unit economics target: CPA <$50, payback <90 days, LTV:CAC >3:1.
- Test budget (first 30 days): $1,500.
- Ramp budget (60-90 days if working): $3,500/month.
- Iteration cadence: weekly creative refresh, monthly bid optimization.

### Harvest leg 2 — Newsletter sponsorships
- 3 placements per quarter (Pragmatic Engineer, DevOps Weekly, Software Lead Weekly).
- Per-placement budget: $1,200-$2,000.
- Unit economics target: CPA <$80 (premium audience).
- Per-newsletter kill criterion: 1-2 placements before evaluating CAC.

### Wildcard — Show HN engineering deep-dives
- Thesis: technical buyers respond to credibility-building "how we built X" content.
- Test budget: 0 paid + 10% engineering time (~3 hours/week).
- Success criterion: 1 Show HN front-page (>100 points), 10+ trial signups attributed via UTM.
- 90-day kill criterion: <50 points on best Show HN attempt + no measurable trial signup correlation.

## Decision cards

### [DEC-070] 3-leg portfolio composition

**Decision:** Compound (Founder content) + 2 Harvest (Paid search + Newsletter sponsorships) + 1 Wildcard (Show HN).

**Why this:**
1. Compound chosen for compounding asset; ICP-001 audience is concentrated on LinkedIn.
2. Two harvest channels diversify against concentration risk.
3. Wildcard taps into HN audience without paid budget.

**Why not the alternatives:**
- Single harvest (paid search only): concentration risk at scale.
- 4+ harvest channels: spreads execution too thin at T2 budget.

**Confidence:** High
**Evidence grade:** B
**Source basis:** Research-backed (channel scoring + V3 §12.5).

**Commercial-bias flag:** None.

**Asset / channel / metric bindings:**
- Channels: 4 active.
- Largest single allocation: 35% (Paid search).
- Concentration risk threshold: 50% — currently under.

**Kill criterion:** Any leg hits kill criterion → re-allocate per portfolio rules.
**Reversal trigger:** New channel scores >30 in re-scoring (e.g., TikTok organic for dev-tools matures).
**Test window:** 12 months for compound; 30-60 days for harvest; 90 days for wildcard.

**Anti-pattern to avoid:** 5+ active channels (execution dilution); compound + brand-only allocation (premature).

**Cross-cites consumed:** DEC-020 (ICP-001 channels), DEC-008 (positioning), DEC-067 (readiness), DEC-080 (brand-vs-performance).

### [DEC-071] Concentration risk monitoring

**Decision:** Largest single channel cannot exceed 50% of revenue or budget. Currently 35% — safe.

**Confidence:** High
**Evidence grade:** B
**Source basis:** Research-backed.

## Concentration check

| Threshold | Action |
|---|---|
| Single channel <30% revenue | Healthy diversification |
| Single channel 30-50% | Acceptable; monitor monthly |
| Single channel 50-70% | Yellow zone; activate diversification |
| Single channel >70% | Red zone; mitigation required |

Current state: largest = 35% (Paid search). Safe.

## What we are intentionally NOT doing
- 5+ active channels (execution dilution).
- 2 compound channels at half-strength (compound returns require concentration).
- Paid LinkedIn / TikTok / Meta Ads (not in ICP-001 channel-density top 3).

## Sources and basis
- V3 Marketing Guide §12.5 (Portfolio construction).
- Channel scoring (DEC-067-069).
- Evidence grade B with practitioner caveat.
