---
name: marketforge-retention-churn
description: Build retention + churn analysis program. Cohort retention by acquisition channel + segment. Win-back flows. Churn reason analysis. Cancellation flow design. Use as Phase 8 step 9.
---

# MarketForge Retention + Churn

Apply V3 §7 + §1.8 (retention is truth).

## Global quality rules

- Cohort retention is THE truth metric. Look at cohort curves, not aggregate retention numbers.
- Churn reasons must be sourced from real exit interviews, not assumed.
- Cancellation flow design balances honest UX with retention math.
- Win-back works when there's a specific reason addressed; generic discount → low yield.

## Purpose

1. Cohort retention dashboard + baseline.
2. Per-channel retention comparison (channel quality, not just CAC).
3. Churn reason taxonomy + analysis.
4. Win-back flow design.
5. Cancellation flow design.

## Inputs
- `analytics-stack.md`, `voice-of-customer.md` (churn exit interviews), `onboarding-activation.md`, `channel-strategy.md`.

## Outputs
- `docs/marketing-plan/08-lifecycle/retention-churn.md`
- DEC-565 to DEC-569

## Structure

```markdown
# Retention + Churn Program

## Cohort retention dashboard

### Dimensions
- Time (D1, D7, D30, D90, D180, D365 — adjust to business model).
- Acquisition channel (which channels drive higher-retention cohorts).
- ICP segment.
- Plan tier.
- Cohort month.

### Baseline targets
- SaaS B2B mid-market: D30 ≥ 90% (≤2% monthly logo churn).
- SaaS SMB: D30 ≥ 75% (≤5% monthly).
- DTC: 20% of 6-month cohorts repeat.
- Mobile: at or above category median (gaming 4-8%, social 15-20%, fintech 10-15%, productivity 10-18%).

## Channel × retention comparison

| Channel | Acquisition cost | D30 retention | D90 retention | LTV contribution |
|---|---|---|---|---|
| Paid search | $X | X% | X% | $X |
| Cold email | $X | X% | X% | $X |
| Organic / SEO | $X | X% | X% | $X |
| ... | | | | |

Lower-CAC channels often have lower retention. The math: CAC × retention quality > CAC alone.

## Churn reason taxonomy

For SaaS / subscription:
1. **No-fault leaves** — life event, business closure, role change.
2. **Wrong-fit** — product never matched their need.
3. **Failed activation** — never reached aha moment.
4. **Found alternative** — competitor displacement.
5. **Price sensitivity** — couldn't justify cost.
6. **Specific feature gap** — needed something we don't have.
7. **Service / support frustration** — bad experiences.

For DTC:
1. One-time buyer (never repeated).
2. Product disappointment.
3. Price.
4. Found alternative.
5. Life event.

Source the taxonomy via:
- Cancellation form (open-text + categorize).
- Exit interviews (10-20% of churn — high-leverage learning).
- Sales-team feedback on lost-after-purchase customers.

## Win-back flow

### Triggers
- Cancelled but cancellation reason was addressable.
- 90-day-inactive but never cancelled (DTC).
- 12-month-anniversary of churn (life events may have changed).

### Content
- Address the specific reason: "We heard you about [X]. Since you cancelled we've [improvement]." (only if true.)
- Specific offer: discount, new feature trial, founder personal touch.
- Honest soft-CTA: "Want to give it another try?"

### Anti-pattern
- Generic discount-only win-back (low yield).
- Win-back blast without reason-specific personalization.

## Cancellation flow design

### Honest UX
- Don't trap users — make cancellation findable.
- Confirm + show what they'll lose.
- Optional retention offer (downgrade plan, pause subscription, discount).
- Exit interview as last step (optional).

### Anti-pattern
- Multi-step dark-pattern flow.
- Hiding cancellation deep in settings.
- Requiring phone call to cancel (illegal in many jurisdictions per FTC click-to-cancel rule).
- "Are you sure?" loops past 1-2 steps.

## KPIs

- Monthly logo churn (SaaS) / monthly subscriber churn.
- Revenue churn (often >0 even when logo churn = 0 due to downgrades).
- Net Dollar Retention (NDR; >100% = expansion > churn).
- Cohort retention curves.
- Win-back conversion rate.

## Decision cards
[DEC-565 to DEC-569]

## Kill criteria
- Specific channel: 90 days post-acquisition; D30 retention <50% of company avg → channel quality issue; re-evaluate.

## What we are intentionally NOT doing
- Hiding cancellation paths (FTC click-to-cancel violation).
- Generic win-back blasts.
- Treating churn as "marketing problem" when it's product / onboarding problem.
- Optimizing for aggregate retention rather than cohort retention.

## Sources and basis
V3 §7, §1.8, §10.1 (Four Fits — Channel-Model misfit causes high-CAC, low-LTV).
```

## When to delegate
- `marketing-skills:churn-prevention` for tactical churn-prevention.

## Sources and basis
V3 §7, §1.8.
