---
name: marketforge-website-copy
description: Write website copy for homepage, pricing, about, features, integrations, comparison ("[competitor] alternative"), use-case, customer pages. Consumes positioning, ICP, voice, message architecture, and awareness stages. Delegates to marketing-skills:copywriting when present. Use as Phase 4 step 1.
---

# MarketForge Website Copy

Read shared references and `marketing-skills-bridge.md`. Delegate to `marketing-skills:copywriting` when present; wrap output with stage-matching, evidence grades, decision cards.

## Global quality rules

- Every page declares its target awareness stage. Copy + CTA must match stage.
- Use VOC verbatims wherever possible — customers' words > our words.
- Banned phrases per `anti-slop-marketing-rubric.md`.
- Specific numbers, sourced. No "saves you time" without "saves you 4 hours/week (measured across 78 customers, Q1 2026)."
- Apply the page-structure framework from marketing-skills:copywriting (above the fold; problem/solution/benefits; social proof; FAQ; final CTA).

## Purpose

Produce copy for the standard website pages:

1. Homepage.
2. Pricing.
3. Features (one per major feature).
4. Integrations (one per major integration).
5. Comparison ("[competitor] alternative" — one per primary competitor).
6. Use-case (one per primary ICP segment).
7. Customer / case study (one per featured customer).
8. About.
9. Careers (if applicable).
10. Trust / Security (if B2B).

## Inputs

- `positioning.md`, `brand-strategy.md`, `messaging-architecture.md`, `awareness-stages.md`, `voice-of-customer.md`, `icp-and-personas/`, `naming-and-tagline.md`, `competitive-intel.md`.
- Existing site copy if Mode B/C (input for audit).
- `pricing-strategy.md` if it has run.

## Outputs

- `docs/marketing-plan/04-website-content/website-copy/[page-name].md` per page.
- DEC-200 to DEC-249 — website copy decisions.

## Per-page output template

```markdown
# Homepage Copy

## Target awareness stage
[Primary: Product-aware / Most-aware. Secondary in below-fold sections: Problem-aware, Solution-aware.]

## Above-the-fold

### Headline (10-12 words max)
- **Option A:** "[Specific outcome in customer's language]"
  - Rationale: [VOC source, awareness-stage match, specific number]
- **Option B:** [variant]
- **Option C:** [variant]
- **Recommended:** Option [A/B/C] because [reason]

### Subheadline (1-2 sentences)
[Sub headline expanding on the headline; adds specificity. Sourced.]

### Primary CTA
- **Option A:** "[Action verb + what they get]"
- **Option B:** [variant]
- **Recommended:** [A/B]

### Secondary CTA
[Optional — usually "See pricing" or "See how it works"]

### Social proof above fold
- Customer logos (5-8, named)
- Or: "Used by [N] [ICP role] at [Specific company class]" with named example
- Or: "Trusted by [Named customer 1], [Named customer 2], [Named customer 3]"

## Below-the-fold sections (in order)

### Section 1: Problem framing (Problem-aware)
- Headline
- Body
- Image / illustration brief (delegate to banana / VisualForge)

### Section 2: Solution / How it works (Solution-aware)
- 3-4 steps
- Specific to the product

### Section 3: Benefits / use cases (Product-aware)
- 3-5 benefits, each with proof point

### Section 4: Social proof (case study or testimonial)
- Named customer
- Specific outcome with number
- Verbatim quote

### Section 5: Objection handling (FAQ or comparison)
- 4-6 most common objections from `voice-of-customer.md`
- Honest answers

### Section 6: Final CTA recap
- Restate value
- Repeat CTA
- Risk reversal (free trial / money-back / cancel anytime)

## Meta content

- Page title (60 chars max): [SEO-optimized]
- Meta description (155 chars max): [conversion-optimized]
- OG image brief: [delegate to banana]
- OG title:
- OG description:

## Annotations

For each section, document:
- Why this content (cross-cite into messaging architecture).
- Which VOC quote it sources.
- Which DBA / brand asset is used.
- Which CTA matches which stage.

## Decision cards
DEC-200 (homepage hero), DEC-201 (homepage social proof), etc.

## What we are intentionally NOT doing
- Writing copy for pages not in scope.
- Including stat claims without sources.
- Setting visual design — see VisualForge + banana.

## Sources and basis
[VOC quotes, positioning DEC IDs, awareness-stage matrix.]
```

## Page-specific guidance

### Pricing page
- Apply `marketforge-pricing-strategy` outputs first.
- 3 plans not 5; anchor with highest plan; make recommended plan obvious.
- Awareness stage: Product-aware / Most-aware.
- Include FAQ at bottom (handles last-minute objections).

### Comparison page ("[Competitor] alternative")
- Apply `competitive-intel.md` findings.
- Honest table including 3+ rows where competitor wins (per V3 anti-slop discipline — credibility booster).
- VOC quotes from customers who switched.
- Pricing comparison (with disclaimer about feature parity).
- Awareness stage: Solution-aware / Product-aware.

### Feature page
- Tie feature → benefit → outcome.
- Use cases (2-3 specific use cases with named users).
- "See it in action" — link to demo / loom / screen recording.
- Awareness stage: Product-aware.

### About page
- Origin story (from `narrative-and-story.md`).
- Mission (from `brand-strategy.md`).
- Team photos (real, not AI-generated).
- Values (if any) — specific, not generic.
- Investors / advisors (if helpful for trust).
- Still include a CTA at the bottom.

### Use-case page
- Specific ICP segment in title.
- Their JTBD as headline.
- "Made for [specific role / situation]."

### Customer / case study page
- Named customer (real, with permission).
- Their before-state.
- The trigger event.
- Their evaluation process.
- Their first-value moment.
- Specific outcome (number + measurement methodology).
- Verbatim quote.
- Their photo (real, with permission).

## Delegation pattern

When `marketing-skills:copywriting` is present:

1. Read shared references + positioning + brand + messaging + awareness-stages + VOC.
2. Build the brief (page type, target stage, key proof points, VOC quotes to use, voice constraints).
3. Invoke `marketing-skills:copywriting` with the rich brief.
4. Receive draft.
5. Wrap in DEC cards.
6. Add anti-slop scan results.
7. Add evidence grades to proof points.
8. Save to `docs/marketing-plan/04-website-content/website-copy/[page].md`.

## What we are intentionally NOT doing
- Writing pages that don't have a documented awareness-stage target.
- Setting page visual design (VisualForge / frontend-ui-engineering).
- Setting actual prices (pricing-strategy).
- Implementing the website (frontend team).

## Sources and basis
V3 §6.1 (Landing page principles), §6.2 (Cialdini honest application), §11.2 (Spiegel review research).
