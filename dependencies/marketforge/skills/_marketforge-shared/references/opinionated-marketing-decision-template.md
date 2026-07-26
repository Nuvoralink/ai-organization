# Opinionated Marketing Decision Template

Every marketing decision in every MarketForge document uses this template. No exceptions. This is what separates MarketForge from generic AI marketing output.

## Template

```markdown
### [DEC-NNN] [decision title]

**Decision:** [one sentence with concrete values, channel/asset/metric bindings, not adjectives]

**Why this:**
1. [reason specific to this product's business model / stage / budget / audience]
2. [second reason, equally specific]

**Why not the alternatives:**
- [Alternative 1]: [one-line rejection reason — usually tied to stage, budget, or attribution math]
- [Alternative 2]: [one-line rejection reason]
- [Alternative 3]: [one-line rejection reason] *(only if a third realistic alternative exists)*

**Confidence:** High | Medium | Low
**Evidence grade:** A | B | C | D | E (per evidence-grading-rubric.md)
**Source basis:** User-confirmed | Research-backed | Standard-backed | Repo-derived | Vendor-cited | Assumption | Specforge-derived | VisualForge-derived

**Commercial-bias flag:** None | Low | Medium | High (per commercial-bias-map.md)

**Evidence:**
- [source 1 with URL / file path / direct quote + date checked]
- [source 2]

**Asset / channel / metric bindings:**
- Channel: [paid-search | cold-email | linkedin-organic | etc.]
- Campaign / asset IDs: [CMP-NNN, ASSET-NNN, FLOW-NNN]
- KPIs: [primary KPI ID, secondary KPI IDs]
- Spend allocation (if applicable): [$ or % of budget, time period]
- Owner: [role — founder / paid-media-lead / content-lead / etc.]
- Docs section: [path:section]
- Verification: [how we'll know it's working — incrementality test / cohort analysis / specific dashboard]

**Kill criterion:** [observable signal that should cause this decision/channel to be killed]
**Reversal trigger:** [observable signal that should cause this decision to be revisited (less severe than kill)]
**Test window:** [time period before evaluation — must match channel type, see kill-criteria-by-channel.md]

**Anti-pattern to avoid:** [the specific failure mode this decision is designed to prevent]

**Related decisions:** [DEC-IDs that depend on this or that this depends on]

**Cross-cites consumed:** [explicit list of DEC-NNN IDs from earlier subskills that this decision materially consumes. Implicit re-statement of prior decisions is forbidden — every prior decision constraining audience / channel / message / budget / attribution detail must be cited by ID here, not paraphrased in body prose.]

**Cross-cites produced:** [forward-looking; populated when later subskills run.]

**Stamp (auto-filled by the orchestrator):**
- MarketForge version: v[major.minor.patch]
- Run ID: [run-id]
- Scope: full | focused | audit | continuous
- Generated: YYYY-MM-DD HH:MM TZ
```

Every generated narrative doc (every `*.md` outside `auditability/`) begins with a single-line HTML comment:

```markdown
<!-- marketforge: v[major.minor.patch] run-id=[id] scope=[mode] generated=[ISO-8601] -->

# Doc Title
```

## Example — passing

```markdown
### [DEC-052] Paid acquisition channel mix for Q3 — Apple Search Ads dominant + UAC for Android scale

**Decision:** Allocate 65% of paid mobile budget ($6,500/mo of $10K) to Apple Search Ads (branded + category + competitor keywords + 4 Custom Product Pages tied to top ad creatives) and 35% ($3,500/mo) to Google UAC for Android scale (tCPI campaigns, daily budget = 50× target CPI). Target blended D30 ROAS ≥ 1.2 by month 3.

**Why this:**
1. This is an iOS-heavy subscription consumer product ($9.99/mo) with mature acquisition motion — Growth by Kev's Feb 2026 ASA/UAC analysis shows mid-stage subscription apps in productivity/utility achieve $8 CPI / $60 LTV on ASA (7.5x ROAS) vs $4 CPI / $12 LTV on UAC (3x ROAS); ASA's higher cost is offset by intent-driven users with materially better retention.
2. iOS 17/18 Custom Product Pages tied to specific ad creatives produce 156% conversion lift on CPP-referred traffic (Apple Developer benchmark) and a documented 39% CPI reduction + 58% conversion increase in real-world deployments (SoundCloud case via Adapty 2026). Without CPPs, ASA budget would underperform; with CPPs, ASA becomes the highest-leverage channel.

**Why not the alternatives:**
- 50/50 ASA/UAC: Underweights ASA's intent quality for an iOS-heavy product; misses the documented 60-70% allocation pattern of mature subscription apps with $50+ LTV.
- 80/20 ASA/UAC: Sacrifices Android scale; the user's Android revenue is currently 28% of total and growing; UAC at $3,500/mo will meet the ~30+ daily conversion floor required for tCPI → tCPA transition by week 6.
- Meta Ads instead of mobile DSPs: Rejected because in-platform attribution for mobile post-iOS-14 ATT is broken; ASA + UAC have direct platform-native install measurement.
- TikTok Ads as third channel: Deferred until ASA/UAC stabilize; introducing a third paid channel before reaching budget efficiency is concentration-risk inversion (DEC-046 portfolio rules).

**Confidence:** High
**Evidence grade:** B (large-scale industry benchmark data; vendor benchmarks corroborated by independent practitioner data)
**Source basis:** Research-backed

**Commercial-bias flag:** Low (ASA benchmarks from SplitMetrics — Apple-adjacent vendor; UAC from Strataigize/AppsFlyer — independent; CPP lift from Apple Developer — Apple-published. Triangulated against Growth by Kev practitioner analysis.)

**Evidence:**
- SplitMetrics Apple Ads Search Results Benchmarks Report 2026: avg CPT $2.25, CPA $3.76 across top 15 categories; subscription/utility CPA ~$3-5 (checked 2026-05-18).
- Growth by Kev "ASA vs UAC trade-off" Feb 2026: 60-70% ASA / 30-40% UAC for mature acquisition strategies (checked 2026-05-18).
- Apple Developer iOS 18 CPP performance documentation: 156% conversion lift on CPP-referred traffic.
- Adapty 2026 UAC operating guide: ~30+ daily conversions before tCPI → tCPA transition; budget = 50× target CPI.
- AppTweak 2025 Apple Ads benchmarks: global median CPT ~$0.92 across ~3,500 apps and $1B spend.

**Asset / channel / metric bindings:**
- Channel: paid-mobile (ASA + UAC)
- Campaign IDs: CMP-MOB-101 (ASA Branded), CMP-MOB-102 (ASA Category), CMP-MOB-103 (ASA Competitor), CMP-MOB-104 (UAC iOS), CMP-MOB-105 (UAC Android)
- Custom Product Pages: CPP-001 (Productivity onboarding angle), CPP-002 (Privacy angle), CPP-003 (AI-features angle), CPP-004 (Power-user angle)
- KPIs: D30 ROAS (primary), CPI (secondary), D7 retention (gate), payback period (gate)
- Spend: $6,500/mo ASA, $3,500/mo UAC = $10,000/mo total mobile
- Owner: Paid-media lead (or founder until first hire)
- Docs section: 05-paid/paid-mobile.md
- Verification: weekly cohort ROAS, D30 ROAS report by campaign, monthly LTV refresh per CPP variant

**Kill criterion:** D30 ROAS < 0.6 on a campaign with $5K+ spent and CPP A/B traffic at statistical significance; or blended CPI > $8 sustained for 14 days with no creative variant improvement.

**Reversal trigger:** Android share of revenue grows past 45% (shift to 50/50 split); or new platform (TikTok Ads, Meta Ads with SKAdNetwork maturity) shows incrementality lift > 20% in geo-holdout test.

**Test window:** 90 days minimum before strategic re-allocation; weekly monitoring; biweekly creative refresh.

**Anti-pattern to avoid:** "Spray and pray" — splitting $10K across 4-5 channels (ASA, UAC, Meta, TikTok, Reddit) before any single channel proves attribution-positive incrementality. Concentration on 2 measurable channels with native attribution beats diversification at this budget level.

**Related decisions:** DEC-046 (portfolio construction — 3-leg model), DEC-048 (budget tier T2 = $5-25K/mo), DEC-051 (paid-search excluded from mobile budget), DEC-057 (CPP angle alignment to ICP segments).

**Cross-cites consumed:** DEC-012 (ICP: iOS-heavy productivity prosumer), DEC-018 (positioning: privacy-first vs. cloud-syncing alternatives), DEC-035 (ASO foundation), DEC-046 (portfolio construction), DEC-048 (budget tier).
```

## Example — failing (do not produce output like this)

```markdown
### Paid mobile strategy

We recommend running Apple Search Ads and Google UAC to drive installs. ASA tends to deliver higher quality users while UAC scales well. Consider starting with a 50/50 split and adjusting based on performance.
```

This fails on every axis: no decision ID, no specific budget/allocation, no source, no evidence grade, no kill criterion, no reversal trigger, no CPP discipline, "consider" hedge, no anti-pattern, no cross-cites, no asset bindings, taste-words ("higher quality", "scales well").

## When the template feels heavy

It should feel heavy. Every entry in the template prevents a class of future drift. Skipping the template produces marketing slop that future agents and team members cannot interpret or defend.

For low-stakes derivative decisions (e.g., specific ad headline variants that follow directly from a messaging architecture established in a higher decision), shorten to a one-line entry under the parent decision:

```markdown
### [DEC-052.1] ASA Branded ad headline variant 1 = "[Product] for [ICP-segment]"
Derived from DEC-052; matches CPP-001 angle.
```

This is acceptable only when the parent decision is fully specified using the full template.

## Decision ID numbering allocation

- `DEC-001` to `DEC-049` — Foundations (discovery, readiness, VOC, JTBD, ICP, positioning, awareness, competitive intel)
- `DEC-050` to `DEC-099` — Strategy (channel mix, portfolio, brand-vs-performance, budget, OKRs)
- `DEC-100` to `DEC-149` — Brand (strategy, messaging, naming, distinctive assets, narrative)
- `DEC-150` to `DEC-249` — Website + Content (copy per page, LPs, SEO, GEO, content strategy, calendar)
- `DEC-250` to `DEC-349` — Paid (search, social, mobile, creative briefs, influencer, affiliate)
- `DEC-350` to `DEC-399` — Outbound (cold email, LI, direct mail/ABM, calling)
- `DEC-400` to `DEC-499` — Organic & Social (LI, X, YouTube, TikTok, Reddit, community, podcast, PR, newsletter sponsorships, free tools, founder content)
- `DEC-500` to `DEC-599` — Lifecycle (email flows, SMS, push, in-app, referral, loyalty, onboarding, customer marketing, retention)
- `DEC-600` to `DEC-699` — CRO & Measurement (landing CRO, pricing, A/B testing, attribution, MMM, analytics stack)
- `DEC-700` to `DEC-749` — Visual assets (direction, ad creative, social imagery, web imagery, video scripts)
- `DEC-750` to `DEC-799` — Launch + Execution (launch plan, execution calendar)
- `DEC-800` to `DEC-899` — Operations / agentic-mode decisions
- `DEC-900` to `DEC-999` — Audit / drift / supersession entries

When extending an existing run's decision log, start at the next free number within the appropriate range.

## "What we are NOT doing" — required section per subskill doc

Every subskill's main narrative doc must end with this section, before `Sources and basis`:

```markdown
## What we are intentionally NOT doing in this layer

- [specific channel / tactic / message] — because [reason tied to stage/budget/ICP] — instead do [alternative or "out of scope this quarter"].
- [specific channel / tactic / message] — because [reason] — instead do [alternative].
```

Examples:

- `paid-social`: "Not running LinkedIn Single Image ads — 6.4x worse CTR than Thought Leader Ads at 5.8x higher CPC (ZenABM 2026) — instead route LinkedIn budget through founder TLAs."
- `seo-strategy`: "Not publishing top-funnel 'ultimate guide' content — AI Overviews crushed CTR and HubSpot lost ~7M monthly visits 2024-2025 from this exact playbook — instead 5-10 BoFu comparison + integration pages and one original-data piece per quarter."
- `cold-email`: "Not running AI hyper-personalization at scale — saturation collapse: 'Hi {firstName}, noticed {company} just {recentPost}' is detected as AI in seconds — instead signal-based trigger personalization (funding, hires, tech changes) with human-curated message bodies."
- `email-lifecycle`: "Not measuring open rate as primary KPI — Apple MPP inflated iOS opens ~70% since Sept 2021 — instead clicks, replies, revenue per recipient."
- `linkedin-organic`: "Not posting from company page — LinkedIn has down-ranked company pages for ~3 years — instead founder + 2-3 employee accounts."

This converts rejected alternatives and out-of-scope choices into explicit prohibitions implementation agents can scan for before publishing. Without it, "What was rejected" lives only inside individual decision cards.

## Output discipline

Every MarketForge document must:

1. Contain only opinionated decisions using this template.
2. Sort decisions by ID within the document.
3. Include a "Sources and basis" section at the bottom summarizing source labels + evidence grades used.
4. Reference decisions by ID in body prose (e.g., "see DEC-052"). Never restate the decision text inline.
5. Include the "What we are intentionally NOT doing in this layer" section.
6. Include a stamp line at the top.
7. Include explicit cross-cites in every decision.
