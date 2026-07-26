---
name: marketforge-landing-pages
description: Build campaign-specific landing pages with ad-to-page message-match. Each LP serves one ad/campaign/audience. Different from homepage. Use as Phase 4 step 2.
---

# MarketForge Landing Pages

Read shared references. Apply V3 §6.1 (Landing page principles), §6.5 (Baymard for DTC).

## Global quality rules

- Match-the-source: if the ad promised X, the LP headline says X word-for-word.
- One page, one job. Strip anything that doesn't serve the conversion.
- Awareness stage match: cold paid social LP serves Unaware/Problem-aware; competitor-keyword search LP serves Solution/Product-aware.
- DTC: minimize checkout friction per Baymard 49-study research.

## Purpose

Per campaign:
1. Headline word-for-word matched to ad copy.
2. Subheadline + 1-2 supporting sentences.
3. Above-fold CTA stage-matched.
4. Below-fold: problem framing, social proof, benefits, FAQ (if Most-aware), final CTA.
5. Mobile-first structure (most paid traffic is mobile).
6. Tracking + UTM discipline.

## Inputs

- The ad creative brief + targeting (from `marketforge-ad-creative-brief` or `marketforge-paid-search` / `paid-social`).
- `messaging-architecture.md`.
- `awareness-stages.md` (the stage for this campaign).
- VOC quotes relevant to the campaign angle.

## Outputs

- `docs/marketing-plan/04-website-content/landing-pages/[campaign-slug].md` per LP.
- DEC-250 to DEC-269 — LP decisions.

## Per-LP structure

```markdown
# LP: [Campaign Name / Angle]

## Campaign context
- Source channel: [paid search / paid social / cold email / etc.]
- Audience: [from targeting decision]
- Awareness stage: [from awareness-stages.md]
- Ad creative reference: [DEC-NNN]
- UTM source/medium/campaign: [explicit values]
- Date launched / iterating:

## Headline
Word-for-word match to ad: "[X]"

## Subheadline
[1-2 sentences expanding]

## Above-fold CTA
[Stage-matched]

## Social proof above fold (1 element)
[Logo bar / "N customers" / named testimonial]

## Sections below fold (3-5 max — keep LP short)

### Section 1: Problem framing
[2-3 sentences echoing the angle]

### Section 2: Solution + 2-3 benefits
[Direct response to the angle]

### Section 3: Social proof / case study
[Named customer / verbatim quote / specific number]

### Section 4 (optional): FAQ for objection handling
[3-5 questions specific to this angle]

### Final CTA
[Re-stated]

## Mobile-first checks
- Headline visible on 375px viewport: [yes/no]
- CTA in thumb zone: [yes/no]
- Page weight: [target <100KB]

## Tracking
- Conversion event: [signup / book demo / preorder / etc.]
- Self-report survey active: [yes/no]
- CAPI event firing: [yes/no]

## Decision cards
[DEC-250+ as relevant]

## What we are intentionally NOT doing
- Reusing homepage as LP (worse conversion).
- Pretending one LP serves all campaigns.
- Including navigation links that distract from conversion.
- Including any CTA that doesn't match awareness stage.

## Sources and basis
V3 §6.1 (Landing page principles). For DTC: §6.5 (Baymard checkout — 70.19% abandonment + 35.26% conversion lift via checkout UX).
```

## DTC checkout-LP guidance

When the LP is a DTC product page:

- Extra cost transparency above fold (don't surprise at checkout — Baymard's #1 abandonment reason at 48%).
- Guest checkout option (account creation = 26% abandonment).
- Express delivery clearly stated.
- Trust signals (SSL, security badges, payment processor logos).
- Mobile checkout flow tested.

## SaaS LP guidance

- Free trial: card-required vs no-card decision documented.
- Onboarding preview (screenshot, GIF, or loom) above fold.
- Time-to-first-value claim (specific: "Set up in 4 min").
- Pricing visible (or link to pricing) — hidden pricing destroys conversion for SMB SaaS.

## A/B testing
LPs are good candidates for A/B testing only when traffic hits the 1,000-conversions/month/step floor (see `marketforge-ab-testing-discipline`). Below that, ship opinionated and watch cohort.

## Cross-cites consumed
- DEC-040-049 (awareness stages).
- DEC-110-129 (messaging architecture).
- DEC-200-249 (website copy — voice consistency).
- DEC-250-329 (the specific ad campaign this LP serves).

## Sources and basis
V3 §6.1, §6.5.
