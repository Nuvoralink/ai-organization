---
name: marketforge-engineering-as-marketing
description: Build a free tool that solves a real adjacent problem and surfaces buyers with right intent. HubSpot Website Grader = canonical example. Cost $5K-50K to build well. Use as Phase 7 step 10.
---

# MarketForge Engineering-as-Marketing

Apply V3 §3.14.

## Global quality rules

- Works when: tool solves real adjacent problem + surfaces buyers with right intent.
- Fails when: "calculators" thinly veiled lead-capture forms.
- Cost $5K-50K to build well.
- Examples: HubSpot Website Grader, ConvertKit Creator Profile, Ahrefs Free Tools, SparkToro Free, Ubersuggest, Linear API.

## Purpose

1. Tool concept identification (what adjacent problem to solve).
2. Tool design (input, output, signup gate or not).
3. Production tier (build internal or commission).
4. Distribution plan.
5. Conversion path (tool → product).

## Inputs
- `voice-of-customer.md` (what adjacent pain do prospects mention).
- `competitive-intel.md` (what tools do competitors offer).
- `channel-strategy.md`.

## Outputs
- `docs/marketing-plan/07-organic-social/engineering-as-marketing.md`
- DEC-472 to DEC-477

## Structure

```markdown
# Engineering-as-Marketing

## Tool concept

### Adjacent problem identified
- Specific problem: [from VOC]
- Why our ICP needs it: [evidence]
- What current solutions exist: [analysis]
- Why ours would be better: [specific]

### Tool design

- Input: [what user provides]
- Output: [what tool returns]
- Time to value: [<30 sec ideal; <2 min acceptable]
- Authentication gate: yes / no (no gate = higher virality; yes = email capture)
- Premium upgrade path: [if applicable]

### Examples by category

| Category | Example tool concept |
|---|---|
| Marketing | Website Grader (HubSpot) — score + actionable advice |
| Dev tools | Build status badge generator, regex tester, JSON formatter |
| Design tools | Color contrast checker, font pair generator, palette extractor |
| Sales | Sales email subject line analyzer |
| HR | Salary calculator (region + role + experience) |
| Finance | Tax estimator, mortgage calculator, ARR multiplier |
| E-commerce | Pricing-anchor analyzer, conversion-funnel calculator |
| SEO | Free meta description grader, schema generator |

## Production tier

| Tier | Approach | Cost |
|---|---|---|
| T1 | DIY: code-first builder, simple JS calculator, ~10 hours | $0 (founder time) |
| T2 | Commission contractor or AI-pair-programmed; 40-80 hours | $2-10K |
| T3 | Studio / in-house engineer; production-quality | $20-50K |

## Distribution plan

### Pre-launch
- Build email waitlist via teaser content.
- Pre-recorded demo for press / Product Hunt.

### Launch day
- Product Hunt (delegate to `marketforge-launch-plan` and `marketing-skills:directory-submissions`).
- Hacker News (if technical audience).
- Reddit (relevant subs, follow promo rules).
- Founder LinkedIn + X.
- Newsletter mention.
- Email to existing customers / list.

### Post-launch (weeks 1-12)
- Embed tool prominently on homepage.
- Internal link from blog content.
- Schema markup for SoftwareApplication.
- Track usage + conversion to product.

## Conversion path (tool → product)

- After-result CTA: relevant product feature page.
- Email capture on premium feature (if applicable).
- Re-targeting on tool users.
- Lifecycle email (tool usage → product feature relevance).

## KPIs

- Weekly active uses (target: 1K+ within 6 months with promotion).
- Conversion from tool → product trial (target: 1-3%).
- Backlinks earned (free tool is shareable; track via Ahrefs).
- Branded search lift (HubSpot Website Grader drove massive brand-search lift).

## Decision cards
[DEC-472 to DEC-477]

## Kill criteria
- 6-12 months; tool reaches <1,000 weekly active uses + conversion <1% → kill (or repurpose).

## What we are intentionally NOT doing
- Thinly veiled lead-capture forms ("calculator" requiring email upfront).
- Tools unrelated to product (no conversion path).
- Tools where competitors already dominate with free open-source equivalents.

## Sources and basis
V3 §3.14.
```

## When to delegate
- `marketing-skills:free-tools` for related design.

## Sources and basis
V3 §3.14.
