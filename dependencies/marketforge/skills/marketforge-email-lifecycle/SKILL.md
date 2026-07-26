---
name: marketforge-email-lifecycle
description: Build email lifecycle flows — Welcome, Browse abandonment, Cart abandonment, Post-purchase, Trial-end, Win-back. Flows generate up to 30x revenue per recipient vs campaigns (Klaviyo 2025-2026). Delegate to marketing-skills:emails for per-email copy. Use as Phase 8 step 1.
---

# MarketForge Email Lifecycle

Apply V3 §7.1 + §3.10.

## Global quality rules

- Flows (triggered) generate up to 30x revenue per recipient vs campaigns (Klaviyo 2025-2026 — evidence B with vendor-adjacency).
- Post-Apple MPP (Sept 2021): iOS opens inflated ~70%. Use clicks, replies, revenue/recipient as real KPIs.
- "$36-$42 per $1" claim is aggregate including transactional + behavioral; selection bias. Use as directional, not absolute.

## Purpose

1. Per-flow design (trigger, segments, branching, timing).
2. Per-email brief (subject, preview text, body angle, CTA).
3. Platform setup decisions (Klaviyo / Customer.io / HubSpot / Loops).
4. Segmentation strategy.
5. KPI selection (clicks > opens; revenue/recipient > vanity).

## Inputs
- `icp-and-personas/`, `voice-of-customer.md`, `messaging-architecture.md`, `awareness-stages.md`, `pricing-strategy.md`, `onboarding-activation.md`.

## Outputs
- `docs/marketing-plan/08-lifecycle/email-lifecycle/[flow-name].md` per flow.
- DEC-500 to DEC-519

## Per-flow structure (per business model)

### DTC flows
- **Welcome** — discount + brand story (5-7 emails over 14 days).
- **Browse abandonment** — 1-3 emails over 48h.
- **Cart abandonment** — 3 emails at 1h / 24h / 72h.
- **Post-purchase** — Confirm + shipping + review request + cross-sell (5-7 emails over 30 days).
- **Win-back** — 30/60/90-day inactive (3 emails).

### SaaS flows
- **Welcome / Onboarding** — Aha-moment guidance (4-7 emails over 14 days).
- **Feature awareness** — During trial (3-5 emails).
- **Trial-end** — 7/3/1 days before + on expiry (3-4 emails).
- **Activation** — Behaviorally triggered (when user reaches X step).
- **Renewal / expansion** — Post-paid expansion offers + feature education.
- **Win-back** — Churn risk → CS handoff (escalating).

## Per-email brief template

```markdown
# Email: [Flow] / [Email NN]

## Trigger
[Event + delay + segment filter]

## Awareness stage
[Per awareness-stages.md]

## Subject line (3-5 variants for A/B if traffic supports)
- "[Variant A]"
- "[Variant B]"
- "[Variant C]"

## Preview text (50-100 chars)
[Expands subject; not redundant]

## Body angle
[The argument this email makes — one idea per email]

## VOC quote (if applicable)
"[Verbatim]" — [source]

## CTA
[Stage-matched]

## Conversion event
[What this email is trying to drive]

## A/B testing
[Test only if 1,000+ conversions/month justify; otherwise ship opinionated]

## Personalization tokens
[Specific + safe — never expose internal data]
```

## Platform decisions

| Platform | Best for |
|---|---|
| Klaviyo | DTC <100K contacts (default); good for B2B too |
| Klaviyo / Attentive | DTC >100K (SMS-first lead) |
| Customer.io | SaaS lifecycle; powerful trigger logic |
| HubSpot | SaaS with CRM integration |
| Loops | SaaS, modern interface |
| ConvertKit / Kit | Creators / newsletter |
| Beehiiv / Substack | Creators (newsletter native) |
| Instantly / Smartlead | Cold outbound (NEVER warm list) |

## Segmentation discipline

- Engaged (clicked / opened in last 30 days): high-value cohort.
- Disengaged (no engagement 60+ days): suppress or win-back.
- High-LTV cohort: VIP segment with custom flows.
- Trial cohort: separate flow for trial-end.
- Geographic / language: when relevant.

## KPIs

- Clicks (real attention signal).
- Replies (highest-value signal).
- Revenue per recipient (RPR).
- Unsubscribe rate (<0.5% per send healthy).
- Spam complaint rate (<0.1% required).

NOT primary:
- Open rate (Apple MPP inflated ~70%).

## Decision cards
[DEC-500 to DEC-519]

## Anti-patterns

- Cold list sends from warm-list ESP (deliverability hit; account ban risk).
- Open rate as primary KPI.
- Blast campaigns instead of triggered flows.
- Stale flows with broken links / outdated copy.
- No suppression of disengaged contacts (drags deliverability).

## What we are intentionally NOT doing
- Blast campaigns to entire list (use segmentation).
- Optimizing for open rate (Apple MPP inflation).
- Cold sending from primary ESP (deliverability risk).

## Sources and basis
V3 §7.1, §3.10.
Klaviyo 2025-2026 benchmarks — evidence B with vendor-adjacency.
```

## When to delegate
- `marketing-skills:emails` for per-email copy.

## Sources and basis
V3 §7.1, §3.10.
