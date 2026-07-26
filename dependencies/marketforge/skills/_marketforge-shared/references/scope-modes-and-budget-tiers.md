# Scope Modes and Budget Tiers

MarketForge produces output sized to the user's actual stage, team, and budget. This file defines the scope and tier model used throughout.

## Scope modes

### Full package
Complete marketing system: all 11 phases, ~70 subskills, ~12-week build-out plus ongoing operating cadence. Generate everything under `docs/marketing-plan/`.

**When to use:**
- Greenfield product with no marketing yet.
- Existing product with sparse/disconnected marketing being unified.
- User asks for "the full marketing department" / "GTM plan" / "complete marketing system."

**Typical wall time:** 4-12 hours of agent time across many subskill invocations.
**Typical files produced:** 60-120 docs + assets.

### Focused package
One area or a coherent slice: launch plan, website copy refresh, paid-search-only, lifecycle-only, GEO playbook, ICP + positioning only.

**When to use:**
- User explicitly asks for one area.
- Existing marketing system already has coverage of other areas.
- Time-bounded request ("launch in 2 weeks, need just the launch plan").

**Typical wall time:** 30 min - 4 hours.
**Typical files produced:** 5-30 docs.

### Audit + repair
Existing marketing presence. Inspect current site, ad accounts, ESP, CRM, analytics. Produce gap analysis and prioritized fix list.

**When to use:**
- "We have marketing already, but it's not working / drifting / inconsistent."
- Founder inherited the marketing system and needs to know what's broken.

**Typical wall time:** 1-3 hours for audit; remediation depends on findings.
**Typical files produced:** audit report + 10-30 fix-specific docs.

### Continuous operations
Recurring cadence agentic mode. Daily / weekly / monthly loops produce content, ad creative variants, lifecycle iteration, attribution reports, and surface anomalies for human approval.

**When to use:**
- Marketing system already exists.
- User wants ongoing execution, not one-time planning.
- Recurring scheduler is wired in.

**Wall time:** Variable per loop run; typically 15-60 min per daily light loop.

## Budget tiers

The V3 guide's three tiers, used throughout MarketForge to scope channel candidates and tactic intensity:

### T1: $0-500/mo
- Founder-led almost everything.
- AI-assisted content production.
- Free tools where they exist (Google Search Console, Plausible/PostHog free, ConvertKit free, Klaviyo free <500 contacts).
- Channel mix: organic (founder content, SEO BoFu, community, Reddit) + maybe $200-400/mo on paid search branded + competitor.
- No agency. No paid creative production. No paid PR.

### T2: $500-5,000/mo
- Founder + 1 part-time hire or contractor.
- Mid-tier tools (Klaviyo $50-300/mo, Apollo $99-150/user, Ahrefs/Semrush $150-500/mo).
- Channel mix: ~$1-3K paid (Meta/TikTok/Google), $500-2K in tooling, contractor budget for content/design.
- Newsletter sponsorships viable.
- ABM-lite feasible at top of band.
- Light influencer seeding (micro tier).

### T3: $5,000-25,000/mo
- Full marketing role (founder no longer the marketer).
- T2 agencies or T3 boutique agencies.
- All paid channels in play.
- Marketing automation maturity.
- Original research and content investment.
- Podcast hosting feasible.
- Affiliate program feasible.
- ABM 1:1 + 1:few at top of band.
- LinkedIn Ads viable for $25K+ ACV products.

### T4+: $25K+/mo
- Outside MarketForge default scope but supported.
- In-house team + multiple agencies.
- MMM models (Robyn / Meridian) feasible.
- Incrementality testing budget exists.
- Brand investment viable.

## Tier-aware channel candidates

| Channel | T1 | T2 | T3 | T4+ |
|---|---|---|---|---|
| Founder content (LinkedIn / X / podcast guest) | ✓ | ✓ | ✓ | ✓ |
| Bottom-funnel SEO + comparison pages | ✓ | ✓ | ✓ | ✓ |
| GEO/LLMO basics | ✓ | ✓ | ✓ | ✓ |
| Email lifecycle (Klaviyo flows) | ✓ (free tier) | ✓ | ✓ | ✓ |
| Paid search branded + competitor | small | ✓ | ✓ | ✓ |
| Paid search category terms | | ✓ | ✓ | ✓ |
| Paid social (Meta/TikTok) | | ✓ | ✓ | ✓ |
| Paid mobile (ASA + UAC) | | ✓ | ✓ | ✓ |
| Cold email (proper deliverability) | | ✓ | ✓ | ✓ |
| Newsletter sponsorships | | top-of-band | ✓ | ✓ |
| Influencer (micro) | | ✓ | ✓ | ✓ |
| Influencer (macro) | | | ✓ | ✓ |
| Podcast hosting | | | ✓ (5-figure ACV) | ✓ |
| Direct mail / ABM dimensional mailers | | top-of-band | ✓ | ✓ |
| LinkedIn Ads (Thought Leader format) | | | ✓ ($25K+ ACV) | ✓ |
| Affiliate program | | top-of-band | ✓ | ✓ |
| MMM modeling | | | top-of-band | ✓ |
| Brand investment (60/40-style) | | | top-of-band ($5M+ ARR) | ✓ |

## Tier-aware brand-vs-performance split

Per V3 guide §1.5:

| Stage | ARR | Recommended split |
|---|---|---|
| Pre-PMF | <$500K | 80-100% performance, 0-20% brand |
| Early post-PMF | $500K-$5M | 70/30 performance/brand drift |
| Scaling with healthy retention | $5M+ | 50/50 to 60/40 brand/performance defensible |

T1/T2 + pre-PMF + $20-100/seat SaaS: 90/10. The 60/40 prescription was derived from established brands; do not apply to startups.

## Adaptive scope selection

If user provides clear scope, use it. If user is unclear, default by signals:

| Signal | Default scope |
|---|---|
| "Build marketing for my product" + no existing docs | Full package |
| User mentions specific channel only | Focused package on that channel |
| User says "audit" or "fix" or "what's wrong with our marketing" | Audit + repair |
| User invokes with `agentic=on` or via scheduler | Continuous operations |
| User pastes URL or repo path + asks for review | Audit + repair (read first) |

In Auto mode, default to Focused + T1 unless signals suggest larger. Surface the scope in the pre-run estimate and proceed.

## Scope creep guardrails

If a focused package starts requiring documents from outside its declared scope:

1. The orchestrator notes the cross-cite dependency.
2. The orchestrator either generates the dependency as a "stub" (top-of-doc + key decisions + skip rest) or surfaces to user for scope expansion.
3. In Auto mode, default to stub generation with a `Scope-deferred` label.

This prevents focused packages from silently expanding into full packages while keeping the cross-cites valid.

## When tier and scope conflict

Sometimes a user requests "full package" with T1 budget. This is incoherent — a full package will recommend channels the budget cannot support.

The orchestrator surfaces this:

> "You asked for a full package at T1 ($0-500/mo). Many channels in the full package (paid mobile, influencer macro, LinkedIn Ads, podcast hosting, ABM) won't be in your budget tier. I can:
> - (a) Build a T1-scoped full package — only channels viable at your budget, plus 'upgrade-when-tier-rises' notes.
> - (b) Build a focused package on the 3-5 highest-leverage T1 channels.
> - (c) Build a full package at T2 budget so the plan is ready when you raise budget.
>
> Recommend (a) if you're not raising budget soon; (b) if you want speed; (c) if you'll raise budget in 60-90 days. Default: (a)."

This keeps the user in control without producing an incoherent plan.
