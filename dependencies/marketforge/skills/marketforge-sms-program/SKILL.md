---
name: marketforge-sms-program
description: Build SMS program (DTC primary). Klaviyo SMS / Attentive / Postscript. TCPA compliance (double opt-in, STOP, hours). SMS flows generate ~8x higher RPR than campaigns. Use as Phase 8 step 2.
---

# MarketForge SMS Program

Apply V3 §5.6.

## Global quality rules

- Klaviyo 2026 benchmarks: SMS flows generate ~8x higher revenue/recipient than campaigns; SMS flows = 7.6% of sends but 45.2% of SMS revenue; new customers = 64.4% of SMS flow revenue.
- TCPA compliance: double opt-in, easy STOP, identification, hours 8am-9pm local.
- Cold SMS is ILLEGAL (US) and brand-killer.
- Viable at T2+ ($500/mo gets meaningful volume).

## Purpose

1. SMS opt-in strategy (popup, checkout, post-purchase).
2. Flow design (welcome, abandonment, win-back, VIP).
3. Campaign cadence (max 2-4/month for DTC).
4. Compliance (TCPA + state laws).
5. Platform selection.

## Inputs
- `email-lifecycle.md` (coordinate cadence + segmentation), `pricing-strategy.md`, `icp-and-personas/`.

## Outputs
- `docs/marketing-plan/08-lifecycle/sms-program.md`
- DEC-520 to DEC-525

## Structure

```markdown
# SMS Program

## Opt-in strategy

### Mechanisms
- Popup on site (post-engagement, not immediate): "Get 10% off — text WELCOME to [shortcode]"
- Checkout flow opt-in (with explicit consent checkbox; pre-checked illegal in most jurisdictions).
- Post-purchase opt-in (high-conversion).
- Receipt / order-confirmation page.

### Double opt-in (TCPA compliance)
- First message: confirm intent.
- Reply YES required to enroll.
- STOP message always honors instantly.

## Flows

### Welcome (1-3 messages over 7 days)
- Confirm enrollment.
- Discount code.
- Brand story / FAQ.

### Browse abandonment (1 message, 1-3h after exit)
- Specific product reminder.

### Cart abandonment (1-2 messages, 1h + 24h)
- "Still thinking about [product]?"
- Discount nudge (if appropriate).

### Post-purchase (1-2 messages, shipping + check-in)
- Shipping confirm.
- "How is [product]?" 14 days post-delivery.

### Win-back (1-2 messages at 60/90 days inactive)
- Discount reactivation.

### VIP cohort (custom)
- Early-access drops.
- VIP-only discounts.

## Cadence

- Flows trigger as needed (high frequency OK because relevant).
- Campaigns max 2-4/month for DTC (more = unsubscribe spike).
- Avoid Mondays (high promo noise); send Tue-Thu best.
- 8am-9pm local time (TCPA).

## Compliance

- **TCPA (US):** Double opt-in + STOP + hours + identification.
- **State laws:** Florida, Oklahoma have additional rules.
- **GDPR (EU):** Explicit consent required (TCPA-like).
- **Canada CASL:** Express consent + identification.
- **A2P registration:** Twilio / SMS providers require A2P 10DLC registration (US).

## Platform selection

| Platform | Best for |
|---|---|
| Attentive | DTC enterprise; SMS-first; opaque pricing |
| Klaviyo SMS | DTC most sizes; integrated with email |
| Postscript | Shopify-first; merchant-friendly |
| Twilio | DIY / SaaS internal builds |

## Pricing
- Klaviyo SMS: $20/mo + per-message credits.
- Attentive: typically $1K+/month minimums.
- Postscript: ~$25-150/month + per-message.

## KPIs
- RPR (revenue per recipient).
- Click rate (~10% SMS click rates per Klaviyo).
- Unsubscribe rate (<2% healthy).
- Spam reports (kill flow if >0.5%).

## Decision cards
[DEC-520 to DEC-525]

## Anti-patterns

- Cold SMS without opt-in (illegal + brand killer).
- Single opt-in without confirm (TCPA exposure).
- Outside-hours sends (TCPA violation).
- Pre-checked opt-in boxes (TCPA / GDPR violation).
- High-frequency campaigns (>4/month) — drives unsubscribes.

## Decision cards
[DEC-520 to DEC-525]

## Kill criteria
- Specific flow: 60-90 days; RPR <$0.50 → re-evaluate copy / segment.
- Program overall: 6 months; net negative due to unsubscribe / complaint cost.

## What we are intentionally NOT doing
- Cold SMS.
- Pre-checked consent (illegal).
- Sending outside 8am-9pm.
- Treating SMS as "more email" — SMS is interruption channel; respect it.

## Sources and basis
V3 §5.6.
Klaviyo 2026 SMS benchmarks — evidence B vendor-adjacency.
```

## Sources and basis
V3 §5.6.
