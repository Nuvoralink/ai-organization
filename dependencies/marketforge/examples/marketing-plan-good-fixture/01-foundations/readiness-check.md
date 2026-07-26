<!-- marketforge: v1.0.0 run-id=example scope=focused generated=2026-05-20 -->

# Readiness Check (Canonical Good Fixture)

**Run date:** 2026-05-20
**Overall score:** 6 / 7
**Recommendation:** PROCEED CAPPED — Cap initial paid spend at T1 ($0-500/mo) until conversion-path gate closes.

## Gate-by-gate assessment

### Gate 1: Customer interviews — PASS
- 35 interviews completed in last 6 months.
- Methodology: Moesta switch-interview format.
- Conductor: Founder.

### Gate 2: Retention curve — PASS
- D30 retention: 88%.
- Monthly logo churn: 2.5%.
- Benchmark for B2C subscription: >75% D30 → PASS.

### Gate 3: ICP + positioning articulable — PASS
- Founder can state in 2 sentences: "For iOS-using privacy-conscious individuals and families who don't want their password vault synced to a corporate cloud server. Unlike 1Password, we never see your data — your encrypted vault stays on your devices."

### Gate 4: Unit economics — PASS
- LTV: $52 (contribution-margin; 13-month avg lifecycle at $4.99/mo).
- CAC target: <$17 for 3:1 LTV:CAC.
- Currently $14 blended.

### Gate 5: Current paying revenue — PASS
- 80 paying customers, $400 MRR.
- Above threshold (100+ B2C ideal, but at 80 with documented growth trajectory).

### Gate 6: Capacity — PASS
- Founder dedicating 5h/week to marketing.
- Onboarding process documented.
- CS bandwidth handles current volume + 3x.

### Gate 7: Conversion path — FAIL
- Signup completion measured: 38% (below 50% target).
- Activation rate (first vault creation): not measured.
- **Specific fix needed:** Run `marketforge-onboarding-activation`; add event tracking.

## Decision: DEC-007

### [DEC-007] Marketing readiness assessment

**Decision:** PROCEED CAPPED. T1 paid budget ($300/mo max) until conversion path improvements close Gate 7.

**Why this:**
1. 6/7 gates pass — paid acquisition viable with capped spend.
2. Conversion path fix is short-term (4-6 weeks). T1 spend gives signal while we fix.

**Why not the alternatives:**
- Full proceed: would scale spend against a broken funnel (35% signup completion is too low).
- Hard block: not warranted at 6/7 with healthy retention + economics.

**Confidence:** High
**Evidence grade:** B (gates measured against documented thresholds from V3 §12.2).
**Source basis:** Research-backed (V3 + measured product analytics).

**Commercial-bias flag:** None.

**Asset / channel / metric bindings:**
- Affects: paid-search, paid-mobile, paid-social subskills.
- Re-check date: 2026-07-20 (60 days).
- Owner: Founder.

**Kill criterion:** If Gate 7 doesn't close in 60 days, deprecate this decision; require full block until fix.

**Reversal trigger:** Conversion path improvement > 50% signup completion + activation measured.

**Anti-pattern to avoid:** Scaling paid spend at $1K-$5K before signup conversion is fixed. Per V3 §1.8 (Balfour), this pours water into a leaky bucket.

**Cross-cites consumed:** DEC-001 (business model), DEC-002 (stage).

**Cross-cites produced:** Will be referenced by every paid subskill (DEC-250+, DEC-280+, DEC-290+).

## If proceeding — initial paid spend cap

Cap initial paid spend at T1 ($300/mo) per Apple Search Ads branded + category for 60 days. After Gate 7 closes, evaluate T1 → T2 transition.

## What we are intentionally NOT doing in this layer

- Recommending channels — that's `marketforge-channel-strategy`.
- Setting brand vs performance split — that's `marketforge-brand-vs-performance`.

## Sources and basis

V3 Marketing Guide §12.2 (Pre-marketing readiness check), §1.8 (Retention is truth), §1.7 (Founder-market fit), §10.1 (Brian Balfour's Four Fits).
