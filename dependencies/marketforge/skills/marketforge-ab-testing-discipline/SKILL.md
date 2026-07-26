---
name: marketforge-ab-testing-discipline
description: Decide when SMBs should and shouldn't A/B test. Only 10-20% of properly-powered tests find real winners (CXL). 1,000+ conversions/month/step floor required. Most SMBs should NOT A/B test. Use as Phase 9 step 3.
---

# MarketForge A/B Testing Discipline

Apply V3 §6.4.

## Global quality rules

- Only 10-20% of properly-powered A/B tests yield real winners (CXL research).
- If you don't have ~1,000 conversions/month on the tested step, you cannot run statistically valid A/B tests.
- Most SMBs and PLG SaaS <$5M ARR should NOT A/B test — ship opinionated changes and watch cohorts.
- Test single high-leverage changes. Tiny changes (button color, position alone) waste test budget.

## Purpose

Decide whether A/B testing is justified, and if so, what to test.

## Inputs
- `analytics-stack.md` (conversion volume by step), `marketing-brief.md` (stage), `landing-cro.md` (hypothesized improvements).

## Outputs
- `docs/marketing-plan/09-cro-measurement/ab-testing-discipline.md`
- DEC-630 to DEC-634

## Structure

```markdown
# A/B Testing Discipline

## Volume gate (decision)

For each surface considered for testing:
- Step conversions per month: [N]
- Test-power requirement: ~1,000+ for meaningful detection.
- Verdict: PROCEED with A/B / SHIP opinionated and watch cohorts.

### Most common SMB verdict
Below 1,000 conversions/month/step → SHIP OPINIONATED.

## When A/B test is justified

- 1,000+ conversions/month at the test step.
- Significant proposed change (not button color alone).
- 14+ day test window (capture weekday variance).
- Single change tested (not multivariate without proper power).
- Hypothesis grounded in evidence (VOC / heuristic audit).

## When A/B test is NOT justified

- Low traffic (<1,000 conversions/month/step).
- Tiny change without strategic significance.
- "I have a feeling" — ship the feeling, don't test it.
- Multivariate testing without massive traffic (5x baseline minimum).

## Ship-opinionated alternative

For SMBs:
1. Use heuristic + research-backed best practices (per `landing-cro.md`).
2. Apply Cialdini honestly.
3. Apply Baymard checkout fixes.
4. Apply awareness-stage match.
5. Watch cohort-level conversion before/after, not statistical significance.
6. Iterate quickly.

## Test design (when justified)

### Power calculation
- Detect 10% lift at 95% confidence requires ~X conversions per arm (depends on baseline).
- Calculator: optimizely.com/optimization-glossary/sample-size-calculator (or similar).

### Single-variable
- Headline copy A vs B.
- CTA copy A vs B.
- Hero image A vs B.
- Pricing presentation A vs B.

### Multivariate (rarely justified)
- Only at large traffic; pre-register hypotheses; expect mostly null results.

### Duration
- 14+ days minimum.
- Full weekly cycle captured.
- Holiday / promo periods either dedicated test or excluded.

## Common failure modes

- Stopping a test early when "winning" (false positive).
- Running 5 tests simultaneously across the same funnel (interaction effects).
- A/B testing TOFU traffic (when funnel performance is downstream).
- Treating 50% confidence as meaningful (it's a coin flip).

## Tools

- Optimizely, VWO, Convert (paid).
- Google Optimize (sunset 2023).
- Vercel + LaunchDarkly + custom flags (DIY).

## Decision cards
[DEC-630 to DEC-634]

## What we are intentionally NOT doing
- A/B testing without sufficient traffic.
- Treating low-power tests as decisive.
- A/B testing tiny changes when bigger opportunities exist.
- Reporting A/B winners without rollout follow-up (winners often don't replicate).

## Sources and basis
V3 §6.4.
CXL CRO research — evidence B.
```

## When to delegate
- `marketing-skills:ab-testing` for test design support.

## Sources and basis
V3 §6.4.
