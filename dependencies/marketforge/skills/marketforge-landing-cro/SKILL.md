---
name: marketforge-landing-cro
description: Build landing page + funnel CRO program. Baymard checkout research (DTC). Cialdini honest application (no fake scarcity). Friction reduction beats incentive size. Use as Phase 9 step 1.
---

# MarketForge Landing CRO

Apply V3 §6.1-6.5.

## Global quality rules

- Baymard 49-study meta-analysis: 70.19% global cart abandonment; 35.26% conversion lift possible via checkout UX.
- Cialdini's principles work — use HONESTLY. Fake countdown timers destroy trust.
- A/B testing: only 10-20% of properly-powered tests yield real winners (CXL). Most SMBs should NOT A/B test — ship opinionated changes.
- Friction reduction > incentive size.

## Purpose

1. Landing page heuristic audit.
2. Conversion-funnel mapping.
3. Friction-reduction priorities.
4. Cialdini-principle application (honestly).
5. CRO test prioritization (or non-testing recommendation).

## Inputs
- Existing site (audit input), `voice-of-customer.md`, `messaging-architecture.md`, `awareness-stages.md`, `analytics-stack.md`.

## Outputs
- `docs/marketing-plan/09-cro-measurement/landing-cro.md`
- DEC-600 to DEC-619

## Structure

```markdown
# Landing CRO

## Conversion-funnel map

[Per surface — homepage → pricing → signup → activation OR product → cart → checkout → confirmation]

| Step | Current conversion | Industry benchmark | Friction observed |
|---|---|---|---|

## Baymard checkout audit (DTC)

### Top abandonment reasons (Baymard 2025)
- 48%: extra costs too high (shipping/tax/fees revealed at checkout).
- 26%: required account creation.
- 25%: delivery too slow.
- 22%: checkout too long/complicated.
- 18%: didn't trust site with card.
- 17%: errors/crashes.

### Per-issue fix priority
[Address top 3 abandonment reasons first.]

## Cialdini's 7 principles — honest application

| Principle | Use | Avoid |
|---|---|---|
| Reciprocity | Free tools, useful content, first-touch generosity | Free trial gimmicks |
| Commitment & consistency | Multi-step opt-ins; foot-in-the-door | Trapping commitment |
| Social proof | Reviews, logos, "N customers" — most reliable | Fake testimonials |
| Authority | Named experts, credentials, citations | Vague authority claims |
| Liking | Similarity, familiarity — founder content | Manufactured liking |
| Scarcity | Genuine scarcity (real stock, real time-limit) | FAKE COUNTDOWN TIMERS |
| Unity | Identity-based copy ("Made for marketers") | Excluding without purpose |

**Honest application rule:** if you wouldn't say it to the customer's face, don't put it on the page.

## Pricing CRO principles (from `pricing-strategy.md`)

- Anchoring: put expensive plan first.
- Decoy effect: middle plan designed to make top look obvious.
- Tier design: 3 plans not 5.
- Specific over round ($47 > $50, Schindler-Yalch).
- Charm pricing ($X9) real lift in B2C.

## Friction reduction priorities

| Priority | Friction |
|---|---|
| 1 | Required fields beyond minimum |
| 2 | Account-creation requirement before purchase |
| 3 | Unexpected costs at checkout |
| 4 | Slow page-load |
| 5 | Hidden / unclear shipping & timing |
| 6 | Manual data entry that could autofill |
| 7 | Multiple CTAs competing for attention |
| 8 | Unclear value prop above fold |

## A/B testing — honest discipline

### When to A/B test
- 1,000+ conversions/month/step at minimum.
- Test single high-leverage change.
- Statistically valid (95% confidence, sufficient sample).
- Test for 14+ days (capture weekday variation).

### When to NOT A/B test
- <1,000 conversions/month: ship opinionated; watch cohorts.
- "I have a feeling X would work" — that's an opinion, ship it.
- Testing tiny changes (CTA color, button position alone): waste of test budget.

### CXL evidence
Only 10-20% of properly-powered tests yield real winners.

## Test prioritization

For accounts with enough traffic to test:
1. Above-the-fold value prop (highest leverage).
2. Pricing presentation.
3. Checkout flow (DTC).
4. Signup form (B2B).
5. Headline copy variations.

## KPIs

- Step-by-step conversion rates.
- Time on step.
- Drop-off analysis per friction-fix.
- Revenue per visitor.

## Decision cards
[DEC-600 to DEC-619]

## Anti-patterns

- Fake countdown timers.
- Manufactured scarcity ("only 3 left!" when actually unlimited).
- Dark-pattern checkout that hides cancellation.
- Pre-checked opt-ins (illegal in many jurisdictions).
- Multi-step checkout that re-prompts after each step.
- A/B testing without sufficient traffic (false confidence).

## What we are intentionally NOT doing
- Dark patterns.
- A/B testing without traffic.
- Generic "improve CRO" suggestions — address specific friction.

## Sources and basis
V3 §6.1, §6.2, §6.4, §6.5.
Baymard Institute 2025 — evidence A/B.
CXL CRO research — evidence B.
Cialdini, *Influence* — evidence A for social proof / authority; C for others.
```

## When to delegate
- `marketing-skills:cro` for tactical CRO review.

## Sources and basis
V3 §6.1-6.5.
