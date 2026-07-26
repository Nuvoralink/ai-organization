---
name: marketforge-readiness-check
description: Pre-marketing readiness gate. Apply the 7-gate readiness check from V3 guide §12.2 — customer interviews, retention, ICP/positioning, unit economics, paying revenue, capacity, conversion path. Returns a gate score and either authorizes paid spend or blocks it with a remediation plan. Use as Phase 1 step 2 of MarketForge full or focused runs.
---

# MarketForge Readiness Check

Read shared references at `../_marketforge-shared/references/`, especially `readiness-check-protocol.md`. Apply the 7 gates rigorously.

## Global quality rules

- Block paid acquisition when <5/7 gates pass. Be willing to deliver "no, don't market yet."
- Frame deferral as "30-60 days of focused work, then revisit" — not denial.
- Show the math: project CAC at current retention; quantify the leaky-bucket problem.
- Cite Balfour's "retention is truth, growth is lie" and Rachleff's founder-market fit when blocking.

## Purpose

Determine whether the product is ready to receive paid acquisition spend. If not, identify the specific gates failing and recommend the corrective subskills to run first.

## Inputs

- `docs/marketing-plan/01-foundations/marketing-brief.md` (from `marketforge-discovery`).
- SpecForge `docs/app-plan/` if present (especially business model, monetization, user roles).
- User-supplied retention data (cohort curves, churn rate, repeat rate).
- User-supplied unit economics (LTV, CAC, payback period).
- Existing website + funnel metrics if available.

## The 7 gates (see readiness-check-protocol.md)

1. Customer interviews — 30+ recent JTBD-style interviews.
2. Retention curve — flattens above zero per business model thresholds.
3. ICP + positioning — articulable in 2 sentences.
4. Unit economics — LTV:CAC > 2:1 modeled credibly.
5. Current paying revenue — 10+ B2B / 100+ B2C customers (with hardware DTC exception).
6. Capacity — team has time/ops/CS to handle inbound.
7. Conversion path — signup → first value functional and measured.

## Outputs

- `docs/marketing-plan/01-foundations/readiness-check.md`
- DEC-007: Readiness assessment + recommendation
- (if blocked) `auditability/deferred-paid-spend.md` with revisit date
- (if blocked) sequencing of corrective subskills

## Output structure

```markdown
# Readiness Check

**Run date:** YYYY-MM-DD
**Overall score:** [X] / 7
**Recommendation:** [Proceed | Proceed-capped | Block | Hard-block]

## Gate-by-gate assessment

### Gate 1: Customer interviews
- **Status:** PASS / FAIL
- **Evidence:** [N interviews completed in last 12 months; methodology used; who conducted]
- **If FAIL:** [specific gap; recommended subskill — typically marketforge-jtbd-interviews + marketforge-voice-of-customer]

### Gate 2: Retention curve
- **Status:** PASS / FAIL
- **Evidence:** [cohort retention data; current monthly churn; benchmark per business model]
- **If FAIL:** [specific issue; recommended subskills — marketforge-onboarding-activation, marketforge-retention-churn]

### Gate 3: ICP + positioning
- **Status:** PASS / FAIL
- **Evidence:** [the 2-sentence test result; current positioning quality]
- **If FAIL:** [recommended — marketforge-positioning, marketforge-icp-persona]

### Gate 4: Unit economics
- **Status:** PASS / FAIL
- **Evidence:** [LTV value + methodology; CAC value + scope of costs; ratio]
- **If FAIL:** [recommended — marketforge-pricing-strategy, marketforge-retention-churn, marketforge-onboarding-activation]

### Gate 5: Current paying revenue
- **Status:** PASS / FAIL / EXCEPTION (hardware DTC pre-launch)
- **Evidence:** [N customers, MRR/ARR if SaaS, monthly revenue if DTC]
- **If FAIL:** [recommended — defer paid acquisition; founder-led sales until threshold; Y Combinator-style "do things that don't scale"]

### Gate 6: Capacity to execute
- **Status:** PASS / FAIL
- **Evidence:** [founder hours/week; CS/sales process docs; fulfillment capacity DTC]
- **If FAIL:** [recommended — build process + capacity before generating demand]

### Gate 7: Conversion path
- **Status:** PASS / FAIL
- **Evidence:** [signup completion rate; activation rate; checkout completion DTC; event firing health]
- **If FAIL:** [recommended — marketforge-landing-cro, marketforge-onboarding-activation, marketforge-analytics-stack]

## Decision: DEC-007

### [DEC-007] Marketing readiness assessment

**Decision:** [PROCEED with full paid acquisition planning | PROCEED-CAPPED at T1 budget tier until failing gates close | BLOCK paid scaling; allow branded paid search as defensive only | HARD-BLOCK; run remediation subskills first]

**Why this:**
1. [Score X/7; specific gates passing; specific gates failing]
2. [Math of premature spend at current retention; reference Balfour]

**Why not the alternatives:**
- [Proceeding anyway]: [specific risk]
- [Blocking entirely when partial gates pass]: [specific cost of unnecessary deferral]

**Confidence:** [High | Medium | Low based on data quality]
**Evidence grade:** [based on retention data quality, interview rigor]
**Source basis:** [User-confirmed retention data | Assumed from product description | etc.]

**Asset / channel / metric bindings:**
- Affects: all paid acquisition subskills (paid-search, paid-social, paid-mobile, cold-email)
- Re-check date: [30 / 60 / 90 days based on score]
- Owner: Founder / Marketing Lead

**Kill criterion:** [If gates close within 90 days, this decision is superseded by a new readiness check]
**Reversal trigger:** [Material change in retention curve, ICP definition, or unit economics]

**Anti-pattern to avoid:** Generating leads against a leaky bucket; spending against an unclear ICP; scaling acquisition past CS/fulfillment capacity.

**Related decisions:** DEC-001-DEC-006 (marketing brief inputs).

**Cross-cites produced:** All paid-channel subskills consume this readiness status.

## If blocked — sequence of corrective subskills

[Ordered list of subskills to run before re-checking readiness. Example:]
1. `marketforge-voice-of-customer` (close Gate 1).
2. `marketforge-jtbd-interviews` (close Gate 1).
3. `marketforge-icp-persona` (close Gate 3).
4. `marketforge-positioning` (close Gate 3).
5. `marketforge-onboarding-activation` (close Gates 2, 6, 7).
6. `marketforge-pricing-strategy` (close Gate 4).
7. [Re-run readiness check.]

## If proceeding — initial paid spend cap

When gates pass at 5/7 or 6/7, cap initial paid spend at T1 ($0-500/mo) until failing gates close. The cap forces signal-gathering before scaling.

## What we are intentionally NOT doing in this layer

- Recommending a marketing plan despite failing gates — readiness is the gate.
- Burying the failing-gate news in process language — it gets surfaced clearly.
- Replacing this assessment with channel-tactic optimization — the issue isn't channels; the issue is readiness.

## Sources and basis

V3 Marketing Guide §12.2 (Pre-marketing readiness check), §1.8 (Retention is truth), §1.7 (Founder-market fit), §10.1 (Brian Balfour's Four Fits).
```

## Tone when delivering "block" verdict

Founders often arrive ready to spend. Framing matters. From `readiness-check-protocol.md`:

> "Before we plan paid acquisition, here's what the readiness check found. [Pass gates with brief stats.] Failing gates: [specific gates with what's needed]. The math: putting $5K/mo into Meta Ads at current retention would cost ~$X in CAC but produce ~$Y in LTV — that's not a marketing problem, it's a product/onboarding problem.
>
> Recommended sequence: spend the next 4 weeks on [specific failing-gate work]. Re-check readiness. If gates close, we'll plan T2 paid acquisition with confidence."

## Sources and basis

V3 §12.2, §1.8, §1.7, §10.1.
