# Marketing-Skills Plugin Bridge

The user has the `marketing-skills` plugin installed (v1.9.0+ at this writing). It contains specialized skills for copywriting, ads, emails, CRO, SEO audit, cold email, popups, pricing, social, signup, video, etc. Each is a high-quality independent skill.

**MarketForge does NOT duplicate these. MarketForge wraps them.**

## The pattern

When a MarketForge subskill needs work in an area covered by a `marketing-skills` plugin skill, the MarketForge subskill:

1. Provides the strategic context (ICP, positioning, channel allocation, budget tier, evidence-graded decisions, kill criteria).
2. Delegates the tactical execution to the plugin skill via the Skill tool.
3. Wraps the plugin output in a MarketForge decision card per `opinionated-marketing-decision-template.md`.
4. Adds evidence grades + commercial-bias flags + cross-cites that the plugin skill does not produce.

## When to delegate vs. produce native

### Delegate to `marketing-skills:copywriting`
- Use for: homepage hero, pricing page, feature pages, about page, landing pages.
- MarketForge subskill `marketforge-website-copy` invokes `copywriting` with the positioning, ICP, voice, and message-architecture context as input. Then wraps the output in DEC cards with cross-cites.

### Delegate to `marketing-skills:ads`
- Use for: ad copy generation (Meta, TikTok, Google, LinkedIn ad units).
- MarketForge subskill `marketforge-ad-creative-brief` and `marketforge-paid-search` produce the creative brief + targeting + budget + kill criteria, then invoke `ads` for the ad copy variants.

### Delegate to `marketing-skills:emails`
- Use for: email subject lines, body copy, lifecycle email content.
- MarketForge subskill `marketforge-email-lifecycle` defines the flow architecture (triggers, segments, branching), then invokes `emails` for individual email copy.

### Delegate to `marketing-skills:cold-email`
- Use for: cold email sequence drafting.
- MarketForge subskill `marketforge-cold-email` defines deliverability stack, signal-based personalization plan, target accounts, and CAN-SPAM compliance, then invokes `cold-email` for the actual sequence drafts.

### Delegate to `marketing-skills:cro`
- Use for: page-level CRO recommendations.
- MarketForge subskill `marketforge-landing-cro` defines the conversion funnel hypothesis and tests, then invokes `cro` for page-specific recommendations.

### Delegate to `marketing-skills:seo-audit`
- Use for: technical SEO audit of an existing site.
- MarketForge subskill `marketforge-seo-strategy` defines the post-AIO strategy (bottom-funnel, brand, local, cited-in-AIO), then invokes `seo-audit` for the technical audit of an existing site.

### Delegate to `marketing-skills:pricing`
- Use for: pricing page copy and structure.
- MarketForge subskill `marketforge-pricing-strategy` defines the WTP analysis, anchoring, tier design, then invokes `pricing` for the page copy.

### Delegate to `marketing-skills:onboarding`
- Use for: onboarding copy + sequence.
- MarketForge subskill `marketforge-onboarding-activation` defines the aha-moment and flow architecture, then invokes `onboarding`.

### Delegate to `marketing-skills:popups`
- Use for: popup design + copy.
- MarketForge subskill `marketforge-landing-cro` decides whether popups apply (DTC yes, B2B SaaS often no), then invokes `popups`.

### Delegate to `marketing-skills:signup`
- Use for: signup flow copy + UX.
- MarketForge subskill `marketforge-onboarding-activation` invokes for signup flow.

### Delegate to `marketing-skills:social`
- Use for: organic social post drafting.
- MarketForge subskill `marketforge-linkedin-organic`, `marketforge-x-twitter-organic`, `marketforge-tiktok-organic` invoke for individual post drafts; MarketForge owns voice and cadence strategy.

### Delegate to `marketing-skills:video`
- Use for: video script drafting.
- MarketForge subskill `marketforge-video-scripts` invokes; MarketForge owns the format hierarchy (9:16 vertical priority, sub-30s hooks, UGC patterns).

### Delegate to `marketing-skills:ab-testing`
- Use for: A/B test design when A/B testing is justified.
- MarketForge subskill `marketforge-ab-testing-discipline` decides whether A/B testing is justified (1,000 conversions/month/step floor), then invokes.

### Delegate to `marketing-skills:analytics`
- Use for: analytics events + dashboard design.
- MarketForge subskill `marketforge-analytics-stack` defines the KPI hierarchy and attribution stack, then invokes.

### Delegate to `marketing-skills:ai-seo`
- Use for: AI-friendly content optimization (GEO/LLMO tactics).
- MarketForge subskill `marketforge-geo-llmo` defines the cited-source strategy, then invokes.

### Delegate to `marketing-skills:programmatic-seo`
- Use for: programmatic SEO when justified (Zillow-style data-rich pages, NOT thin template-swap).
- MarketForge subskill `marketforge-seo-strategy` decides whether programmatic SEO is justified (very narrow conditions post-March 2024 scaled-content-abuse policy), then invokes.

### Delegate to `marketing-skills:schema`
- Use for: structured data / schema markup for SEO+GEO.
- MarketForge subskill `marketforge-geo-llmo` invokes for schema implementation.

### Delegate to `marketing-skills:site-architecture`
- Use for: site architecture decisions.
- MarketForge subskill `marketforge-seo-strategy` invokes.

### Delegate to `marketing-skills:lead-magnets`
- Use for: lead magnet design.
- MarketForge subskill `marketforge-content-strategy` invokes when lead magnets are in the content plan.

### Delegate to `marketing-skills:free-tools`
- Use for: free tool design (engineering-as-marketing).
- MarketForge subskill `marketforge-engineering-as-marketing` invokes after defining the tool's strategic role.

### Delegate to `marketing-skills:competitors`, `marketing-skills:competitor-profiling`
- Use for: competitor research.
- MarketForge subskill `marketforge-competitive-intel` invokes; MarketForge owns the competitive-intel synthesis.

### Delegate to `marketing-skills:customer-research`
- Use for: customer interview question design.
- MarketForge subskill `marketforge-jtbd-interviews` and `marketforge-voice-of-customer` invoke.

### Delegate to `marketing-skills:cold-email`, `marketing-skills:churn-prevention`, `marketing-skills:revops`
- See above + relevant MarketForge wrapper.

### Delegate to `marketing-skills:launch`
- Use for: product launch planning.
- MarketForge subskill `marketforge-launch-plan` invokes.

### Delegate to `marketing-skills:ad-creative`
- Use for: ad creative concept generation.
- MarketForge subskill `marketforge-ad-creative-brief` invokes.

### Delegate to `marketing-skills:image`
- Use for: image asset planning (NOT generation — banana-claude does generation).
- MarketForge subskill `marketforge-visual-direction` may invoke for planning.

### Delegate to `marketing-skills:copy-editing`
- Use for: line-by-line polish on draft copy.
- MarketForge subskills invoke after producing first-draft copy.

### Delegate to `marketing-skills:marketing-psychology`
- Use for: applying Cialdini-style principles to copy.
- MarketForge subskill `marketforge-messaging-architecture` and `marketforge-landing-cro` invoke; MarketForge ensures honest application (no fake scarcity, etc.).

### Delegate to `marketing-skills:paywalls`
- Use for: paywall design (consumer subscription).
- MarketForge subskill `marketforge-pricing-strategy` and `marketforge-paid-mobile` invoke for mobile/web paywall UX.

### Delegate to `marketing-skills:referrals`
- Use for: referral program design.
- MarketForge subskill `marketforge-referral-program` invokes.

### Delegate to `marketing-skills:community-marketing`, `marketing-skills:co-marketing`
- Use for: community + co-marketing.
- MarketForge subskill `marketforge-community-led-growth` invokes.

### Delegate to `marketing-skills:directory-submissions`
- Use for: marketplace + directory submissions (App Store, Product Hunt, AppSumo, AlternativeTo, G2).
- MarketForge subskill `marketforge-launch-plan` invokes.

### Delegate to `marketing-skills:marketing-ideas`
- Use for: brainstorming new tactics when stuck.
- MarketForge orchestrator may invoke as a sounding board for the wildcard channel slot.

### Delegate to `marketing-skills:sales-enablement`
- Use for: sales collateral.
- MarketForge subskill `marketforge-customer-marketing` invokes when sales collateral is in scope.

### Delegate to `marketing-skills:content-strategy`, `marketing-skills:copywriting`
- See above.

### Delegate to `marketing-skills:product-marketing`
- Use for: product-marketing-specific docs (product brief context for marketing team).
- MarketForge subskills invoke; many use this for context.

## How to invoke

In a MarketForge subskill, when delegation is appropriate, use the Skill tool:

```
<Skill skill="marketing-skills:copywriting" args="[context: positioning, ICP, voice, target page, message architecture]" />
```

After the plugin skill produces output:

1. Wrap the output in a DEC card per `opinionated-marketing-decision-template.md`.
2. Add evidence grades to any claims.
3. Add commercial-bias flags where applicable.
4. Add cross-cites to upstream MarketForge decisions.
5. Add kill criterion + reversal trigger.
6. File the output to the correct path under `docs/marketing-plan/`.

## When NOT to delegate

- The plugin skill doesn't exist for the area (e.g., GEO/LLMO has only an `ai-seo` skill which is partial — MarketForge produces native GEO output).
- The strategic decision (channel allocation, budget, ICP) — these are MarketForge-owned, not plugin-owned.
- The wrapping work (decision cards, cross-cites, evidence grades, kill criteria, anti-patterns) — always MarketForge-owned.

## Fallback when plugin is not installed

If `marketing-skills` plugin is not present, MarketForge produces the tactical output natively. Quality is slightly lower (less specialized) but the strategic framework is intact. The orchestrator notes the fallback in `skill-detection-report.md`.

## What this looks like in practice

**User asks:** "Write me a homepage for [product]."

**Without MarketForge:** `marketing-skills:copywriting` is invoked directly, produces decent generic copy.

**With MarketForge:**
1. Orchestrator runs discovery + positioning + ICP + awareness-stages + messaging architecture.
2. MarketForge subskill `marketforge-website-copy` reads those outputs.
3. `marketforge-website-copy` invokes `marketing-skills:copywriting` with rich context.
4. Plugin produces draft copy.
5. MarketForge subskill wraps draft in DEC cards, adds awareness-stage alignment check, flags AI slop, and outputs to `docs/marketing-plan/04-website-content/website-copy/homepage.md`.

Result: same plugin doing the writing, but the writing is dramatically better because the context is rich and the wrapping enforces quality.
