---
name: marketforge-referral-program
description: Build referral program. K-factor math (most "viral" SaaS K-factors are 0.1-0.4). Two-sided incentives beat one-sided. In-product activation-moment ask outperforms email by 3-5x for SaaS. Use as Phase 8 step 5.
---

# MarketForge Referral Program

Apply V3 §3.12 + §7.5.

## Global quality rules

- K-factor math: new users per existing user × time-to-refer. K>1 = viral; K~0.3-0.7 = additive boost.
- Most "viral" SaaS K-factors are 0.1-0.4 in practice. Don't model on Dropbox/Uber outliers.
- Friction reduction beats incentive size in most categories.
- Two-sided incentives (Dropbox model) beat one-sided.
- SaaS: in-product referral asks at activation moment outperform email-based by ~3-5x.

## Purpose

1. K-factor target + math (realistic, not Dropbox-cargo-cult).
2. Incentive structure (one-sided vs two-sided; cash vs credit vs product).
3. Trigger moment (in-product at activation, not in welcome email).
4. UI placement.
5. Platform selection.

## Inputs
- `icp-and-personas/`, `pricing-strategy.md`, `onboarding-activation.md`, `channel-strategy.md`.

## Outputs
- `docs/marketing-plan/08-lifecycle/referral-program.md`
- DEC-545 to DEC-549

## Structure

```markdown
# Referral Program

## K-factor math (honest)

- 1,000 customers × [X]% refer × [Y] each successful = K of [Z]
- Realistic K targets:
  - SaaS B2B: 0.2-0.5 additive
  - DTC: 0.1-0.4
  - Consumer mobile: 0.3-0.7 in some cases
  - Marketplace: variable; depends on both sides
- Viral (K>1): rare; reserved for products with mathematically viral mechanics

## Incentive structure

### Two-sided (Dropbox model)
- Referrer gets X.
- Referee gets Y (often half or similar of X).
- Typically outperforms one-sided.

### One-sided (one party only)
- Cheaper but lower conversion.

### Cash vs credit vs product
- Credit > cash for ongoing usage.
- Product upgrades > credit for high-margin SaaS.
- Cash easiest to communicate.

### Friction reduction
- Friction reduction beats incentive size in most categories.
- One-click referral link generation.
- Pre-written referral message (user can edit).
- Native share (iOS / Android share sheets).

## Trigger moment (CRITICAL — V3 evidence-graded)

In-product at activation moment outperforms email-based by ~3-5x for SaaS.

### Activation-moment ask
- Right after user reached aha moment / first success.
- "Loved that? Invite a colleague who'd benefit."
- Friction-low (one-click share, pre-written message).

### Avoid
- Email-only ask without in-product trigger.
- Asking before activation (user doesn't trust product yet).
- Generic "share us!" with no context.

## UI placement

- Activation-moment modal (highest conversion).
- Dedicated "Invite" page (always-on).
- Account settings (low-conversion default).
- Email signature link.

## Platform selection

### SaaS
- PartnerStack — comprehensive partner + referral.
- Rewardful — Stripe-native, simple.
- FirstPromoter — subscription-friendly.

### DTC
- Friendbuy — purpose-built DTC referrals.
- Yotpo Referrals.
- Refersion.

## KPIs

- K-factor (new users per existing).
- Referral conversion rate (referrer share → invitee signup).
- Time-to-refer (faster = more compounding).
- LTV of referral-acquired vs paid-acquired.

## Decision cards
[DEC-545 to DEC-549]

## Kill criteria
- 90 days post-launch (with activation-moment ask + UI prominence + two-sided incentive); K<0.1 → re-evaluate incentive + UI.

## Anti-patterns

- Email-only referral ask (3-5x worse than in-product).
- One-sided incentives when two-sided affordable.
- Generic share buttons without context.
- High-friction (multi-step) referral flows.
- Building viral mechanics in non-viral products.

## What we are intentionally NOT doing
- Pre-PMF referrals (refer-while-still-firing-the-product is detrimental).
- Cargo-culting Dropbox K-factor.
- Penalizing customers for not referring.

## Sources and basis
V3 §3.12, §7.5.
```

## When to delegate
- `marketing-skills:referrals` for design + copy.

## Sources and basis
V3 §3.12.
