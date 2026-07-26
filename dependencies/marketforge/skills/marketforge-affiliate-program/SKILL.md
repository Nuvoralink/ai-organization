---
name: marketforge-affiliate-program
description: Build affiliate / partner program. PartnerStack pattern. Commission structure (20-30% recurring SaaS, % rev-share, flat-fee). 90-365 day cookie. ToS + compliance. Use as Phase 5 step 6.
---

# MarketForge Affiliate Program

Apply V3 §4.12 (Affiliate marketing — modern B2B SaaS channel).

## Global quality rules

- Modern affiliate works when: product self-serves OR has clear demo path; commission aligns with retention (rev share for SaaS, not flat fee).
- Doesn't work for: high-touch enterprise, low-margin products, opaque pricing.
- PartnerStack network: $2.7B all-time GMV, 52% YoY transaction volume growth (2025 PartnerStack Research Lab — D-grade, PartnerStack-internal).

## Purpose

1. Tier selection (PartnerStack / Impact / Rewardful / FirstPromoter).
2. Commission structure design (% recurring vs flat vs hybrid).
3. Cookie window decision.
4. Partner recruitment plan.
5. Partner enablement assets (creative, copy, training).
6. Compliance + ToS.

## Inputs
- `channel-strategy.md` (affiliate selected as primary or supporting).
- `pricing-strategy.md` (margin to fund commissions).
- `brand-strategy.md` (voice for partner materials).
- `competitive-intel.md` (competitor affiliate programs as benchmarks).

## Outputs
- `docs/marketing-plan/05-paid/affiliate-program.md`
- DEC-340 to DEC-349

## Structure

```markdown
# Affiliate / Partner Program

## Platform selection

| Platform | Best for |
|---|---|
| PartnerStack | B2B SaaS, recurring revenue, partner self-service |
| Impact | Enterprise affiliate at scale; complex deals |
| Rewardful | Simple SaaS, Stripe-native, low setup |
| FirstPromoter | Subscription SaaS, simple commission |
| Refersion | DTC ecom, Shopify integration |
| Friendbuy | DTC referrals (different from partner affiliate) |

## Commission structure design

### Recurring SaaS commission
- 20-30% recurring for life of customer (top SaaS programs)
- Some structure as 30-40% Y1 only, then 0% (less partner-aligned)
- Lifetime recurring beats year-one-only for partner motivation + retention

### One-time / DTC
- 5-15% revenue share typical
- Higher % for niche / high-margin
- Lower for commodity / high-AOV

### Tiered commission (volume-based)
- Bronze: 20% — first 10 referrals
- Silver: 25% — 11-50 referrals
- Gold: 30% — 51+ referrals + lifetime status

### Cookie window
- 30 days: minimum
- 90 days: standard for SaaS
- 180-365 days: premium / when sales cycles are long

## Partner profiles

### Power partners (top 5-10%)
- Generate 60-80% of program revenue
- Need: dedicated relationship, custom materials, co-marketing.

### Casual partners
- Long tail; need self-serve materials.

### Course creators / consultants
- Often best B2B SaaS partners; recommend to clients.

### Agencies
- Refer clients; want to white-label.

### Internal champions (employees of customers)
- Partner-style referrals from inside customer accounts.

## Partner enablement assets

- Onboarding guide
- Brand voice + asset library
- Pre-written social posts
- Email templates (with disclosure)
- Video walkthroughs / demos
- Pricing one-pager
- Common objections / FAQs
- Dashboard for tracking referrals + commissions

## Partner recruitment plan

- Internal: existing customers, advocates, NPS promoters → invite to program.
- Outreach: 100-200 high-fit individual / agency partners.
- PartnerStack marketplace listing (if T2+).
- Public application page on website.
- Cold outreach via PartnerStack / Crossbeam matching.

## Compliance + ToS

- **Disclosure:** Partners must disclose affiliate relationship (FTC requirement).
- **Brand guidelines:** Acceptable / unacceptable usage.
- **Prohibited promotion:** Spam, coupon-stacking, trademark-bidding without permission, deceptive content.
- **Payout terms:** Net 30 / Net 60 / monthly; minimum threshold $.
- **Disputes / refunds:** Commission clawback policy for refunded / churned customers within N days.
- **Tax compliance:** W-9 / W-8 collected; 1099 issued where applicable.

## Anti-patterns

- Pay flat fee instead of recurring (mis-aligned with retention).
- 0% commission after Y1 (partner motivation cliff).
- Short cookie window (≤7 days) — partner can't be credited reasonably.
- No vetting (anyone can be an affiliate) — brand risk.
- Allow trademark-bidding without rules → partner Cannibalizes own brand search.

## Decision cards
[DEC-340 to DEC-349]

## Kill criteria
- 6 months: <10 active partners producing <5% of new revenue → restructure program (commission, recruitment, enablement).

## What we are intentionally NOT doing
- Treating affiliate as zero-effort (requires dedicated relationship management at scale).
- Pay-per-click affiliate (almost always fraud-prone).
- Allowing partners to undercut our own paid search via trademark bidding without rules.

## Sources and basis
V3 §4.12 (Affiliate marketing — modern B2B SaaS channel).
PartnerStack Research Lab 2025 — evidence D (PartnerStack-internal).
```

## When to delegate
- `marketing-skills:referrals` for related referral program design.

## Sources and basis
V3 §4.12.
