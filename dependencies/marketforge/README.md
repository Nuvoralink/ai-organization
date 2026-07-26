# MarketForge

A complete, evidence-graded, opinionated marketing system for digital businesses — strategy, content, copy, ads, lifecycle, CRO, attribution, visual assets, and ongoing execution.

MarketForge does the work of an entire marketing department:
- Marketing strategist
- Brand director
- Content lead
- SEO + GEO specialist
- Growth marketer
- Paid-media buyer
- Outbound SDR ops
- Lifecycle marketer
- CRO + attribution analyst
- Creative director
- Copywriter
- Marketing ops

Every recommendation is evidence-rated (A/B/C/D/E), commercial-bias-flagged, and traceable to a decision card with rationale, alternatives, kill criterion, and reversal trigger.

## What it produces

For greenfield products or existing marketing systems, MarketForge produces:

- **Marketing brief** — business model, stage, budget, founder profile, asymmetric advantages
- **ICP + personas** — sourced from JTBD interviews and VOC mining (NOT "Marketing Mary")
- **Positioning** — Dunford 5-box, against real alternatives (often "do nothing")
- **Channel strategy** — Bullseye + 7-factor scoring + 3-leg portfolio
- **Brand strategy** — attributes, voice, manifesto, distinctive assets
- **Messaging architecture** — value pillars, awareness-stage matrix, copy guidelines
- **Website copy** — homepage, pricing, comparison pages, features, use-cases
- **SEO + GEO** — post-AI-Overviews realistic playbook
- **Paid channels** — Google, Meta, TikTok, LinkedIn TLA, ASA + UAC for apps
- **Outbound** — cold email + LinkedIn + direct mail + ABM
- **Organic + social** — LinkedIn founder, X, YouTube, TikTok, Reddit, community, podcast, PR, newsletter sponsorships, free tools
- **Lifecycle** — email flows, SMS, push, in-app, referral, loyalty, onboarding
- **CRO + measurement** — Baymard, Cialdini, A/B discipline, multi-source attribution, MMM
- **Visual asset briefs** — direction for banana-claude to generate
- **Launch + execution calendar** — 12-week tactical schedule
- **QA + pressure test** — anti-slop, bias audit, red-team

## What makes MarketForge different

### Evidence-graded
Every claim has an A/B/C/D/E grade per `evidence-grading-rubric.md`. Academic research is A. Industry benchmarks are B. Practitioner consensus is C. Vendor-promoted claims are D (with commercial-bias flag). Folklore is E (never cited as fact).

### Anti-slop discipline
Banned phrases ("leverage", "best-in-class", "game-changing", "unlock your potential") and AI-cadence patterns are scanned and rejected. See `anti-slop-marketing-rubric.md`.

### Commercial-bias-flagged
Every vendor-promoted framework (60/40 brand/performance, 95-5 rule, "AI cold email gets 21% replies") is flagged with bias level and triangulation status. See `commercial-bias-map.md`.

### Channel-decay-aware
Channel performance decays. 2019 Facebook CAC is not 2026 Facebook CAC. Cold email reply rates dropped 8.5% → 3.43% in 7 years. MarketForge tracks decay and saturation per `ai-saturation-watch.md`.

### Pre-marketing readiness gate
Before recommending paid spend, MarketForge runs a 7-gate readiness check (customer interviews, retention, ICP, unit economics, paying revenue, capacity, conversion path). If <5/7 pass, it BLOCKS paid spend and recommends product/onboarding work instead. See `readiness-check-protocol.md`.

### Stage-aware (per Schwartz)
Every page, ad, email, and CTA is matched to its target awareness stage (Unaware → Problem-aware → Solution-aware → Product-aware → Most aware). Stage-mismatches are the #1 root cause of landing-page underperformance.

### Multi-source attribution
Never single-source. Platform-reported + CAPI + self-report survey + (when budget supports) incrementality testing.

## Integration with other skills

MarketForge orchestrates and wraps:

- **`banana-claude:banana`** — All image generation (ad creative, social, website imagery).
- **`marketing-skills:*` plugin** — Tactical execution (copywriting, ads, emails, cro, seo-audit, etc.). MarketForge wraps these with strategy context, evidence grades, decision cards.
- **VisualForge** — Brand visual system (color, typography, components). MarketForge reads `docs/design-system/` when present.
- **SpecForge** — Product spec. MarketForge reads `docs/app-plan/` when present.

## How to use

### Full marketing system
```
$marketforge
```

### Focused on specific area
```
$marketforge scope=focused channels=paid-search,cold-email
```

### Audit existing marketing
```
$marketforge scope=audit
```

### Continuous operations (agentic mode)
```
$marketforge agentic=on cadence=daily
```

### Resume an interrupted run
```
$marketforge resume
```

### Override a single decision
```
$marketforge override DEC-014 to "[new direction]"
```

## Structure

```
MarketForge/
├── README.md                            ← this file
├── USAGE_GUIDE.md                       ← detailed usage
├── AGENTS.md → agents/AGENTS.md         ← for future agents
├── docs/
│   ├── MARKETING_GUIDE_V3.md            ← The doctrinal source
│   └── ARCHITECTURE.md
├── scripts/
│   ├── validate_marketing_docs.py       ← Anti-slop + completeness validator
│   ├── channel_scorer.py                ← 7-factor channel scoring
│   ├── readiness_check.py               ← 7-gate readiness check
│   └── evidence_grader.py               ← Evidence-grade missing-claim scanner
└── skills/
    ├── marketforge/                     ← Orchestrator
    ├── _marketforge-shared/             ← Shared references + templates
    │   ├── references/                  ← 19+ shared reference docs
    │   └── templates/                   ← ICP, persona, JTBD, message-stage matrix
    └── marketforge-[subskill-name]/     ← ~50 subskills, one folder per
        └── SKILL.md
```

## Subskills (50+)

### Foundation (8)
- `marketforge-discovery` — Intake interview
- `marketforge-readiness-check` — Pre-marketing 7-gate
- `marketforge-voice-of-customer` — VOC mining
- `marketforge-jtbd-interviews` — Moesta / Ulwick JTBD
- `marketforge-icp-persona` — ICP + persona (NOT "Marketing Mary")
- `marketforge-positioning` — Dunford 5-box
- `marketforge-awareness-stages` — Schwartz 5 stages map
- `marketforge-competitive-intel` — Comprehensive competitor analysis

### Strategy (5)
- `marketforge-channel-strategy` — 7-factor scoring + Bullseye
- `marketforge-portfolio-construction` — 3-leg model
- `marketforge-brand-vs-performance` — Calibrated split for stage
- `marketforge-budget-planning` — T1/T2/T3 allocation
- `marketforge-okr-quarterly-planning` — Bets + OKRs

### Brand (5)
- `marketforge-brand-strategy` — Attributes, voice, manifesto
- `marketforge-messaging-architecture` — Value pillars + stage matrix
- `marketforge-naming-and-tagline` — Product naming + taglines
- `marketforge-distinctive-assets` — Color, mark, sonic, hashtag, signature
- `marketforge-narrative-and-story` — Origin, mission, story arcs

### Website + Content (6)
- `marketforge-website-copy` — Per-page copy
- `marketforge-landing-pages` — Campaign LPs with ad-to-page match
- `marketforge-seo-strategy` — Post-AIO realistic
- `marketforge-geo-llmo` — Generative Engine Optimization
- `marketforge-content-strategy` — POV + BoFu + original research
- `marketforge-content-calendar` — 12-week production schedule

### Paid (6)
- `marketforge-paid-search` — Google/Bing
- `marketforge-paid-social` — Meta, TikTok, LinkedIn, Reddit, Pinterest, X
- `marketforge-paid-mobile` — ASA + UAC for apps
- `marketforge-ad-creative-brief` — Concept briefs
- `marketforge-influencer-program` — Micro + macro + FTC
- `marketforge-affiliate-program` — PartnerStack pattern

### Outbound (4)
- `marketforge-cold-email` — Deliverability + signal-based
- `marketforge-cold-linkedin-outreach` — Connection + content engagement
- `marketforge-direct-mail-abm` — 1:1 / 1:few / 1:many ABM
- `marketforge-cold-calling` — When it fits

### Organic + Social (11)
- `marketforge-linkedin-organic` — Founder + employees
- `marketforge-x-twitter-organic` — Dev/AI/indie
- `marketforge-youtube-strategy` — Long-form + Shorts
- `marketforge-tiktok-organic` — UGC, sub-30s
- `marketforge-reddit-strategy` — Community + ads
- `marketforge-community-led-growth` — Tool/forum/events
- `marketforge-podcast-strategy` — Host + guest
- `marketforge-pr-earned-media` — Qwoted + Featured.com
- `marketforge-newsletter-sponsorships` — Placement + sourcing
- `marketforge-engineering-as-marketing` — Free tools
- `marketforge-founder-content` — Personal brand system

### Lifecycle (9)
- `marketforge-email-lifecycle` — Welcome / Browse / Cart / Trial / Win-back
- `marketforge-sms-program` — Klaviyo SMS + TCPA
- `marketforge-push-notifications` — Web + mobile
- `marketforge-in-app-messaging` — Pendo / Intercom / Braze
- `marketforge-referral-program` — K-factor + two-sided
- `marketforge-loyalty-program` — Points / tiered / paid
- `marketforge-onboarding-activation` — Aha moment + funnel
- `marketforge-customer-marketing` — Case studies + advocacy
- `marketforge-retention-churn` — Cohort + win-back + cancellation

### CRO + Measurement (6)
- `marketforge-landing-cro` — Baymard + Cialdini honestly
- `marketforge-pricing-strategy` — WTP + anchoring + decoy
- `marketforge-ab-testing-discipline` — When and when NOT to test
- `marketforge-attribution-stack` — Multi-source triangulation
- `marketforge-mmm-incrementality` — Robyn / Meridian + geo holdouts
- `marketforge-analytics-stack` — Events + KPIs + tools

### Visual Assets (5)
- `marketforge-visual-direction` — Art direction brief
- `marketforge-ad-creative-production` — Banana-driven variant gen
- `marketforge-social-imagery` — Platform-sized assets
- `marketforge-website-imagery` — Hero, OG, illustrations
- `marketforge-video-scripts` — UGC, demo, founder, ad scripts

### Launch + QA (6)
- `marketforge-launch-plan` — 6-week launch sequence
- `marketforge-execution-calendar` — 12-week tactical
- `marketforge-marketing-qa` — Anti-slop + completeness audit
- `marketforge-pressure-test` — Red-team the plan
- `marketforge-bias-audit` — Commercial-bias scan
- `marketforge-agent-rules-update` — Repo drift prevention

## Sources

The doctrinal source is the V3 Marketing & Customer Acquisition Operating Guide (in `docs/`), which synthesizes:

- Academic research (Cialdini, Schwartz, Aggarwal et al. KDD 2024, Pew, Spiegel)
- Industry data (Baymard, Klaviyo, Ahrefs, Seer, ZenABM, SplitMetrics, Adjust, Apple, eMarketer)
- Practitioner frameworks (Dunford, Moesta, Ulwick, Balfour, Walker, Welsh, Romaniuk, Binet/Field, Sharp, Ramanujam, Simon, Weinberg/Mares, Chen, Berger, Cialdini)
- Vendor data (Profound, Refine Labs, PartnerStack, etc. — flagged commercial bias)

Every cited framework includes evidence grade per `evidence-grading-rubric.md`.

## License

This skill is yours to modify and adapt for your purposes.
