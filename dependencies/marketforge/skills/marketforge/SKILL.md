---
name: marketforge
description: Orchestrate a full-stack, evidence-graded marketing department for any digital business — discovery, ICP/JTBD, positioning, channel strategy, brand, website copy, SEO/GEO, paid acquisition, outbound, organic/social, lifecycle, CRO, attribution, visual assets, QA, and ongoing execution. Use when the user wants an end-to-end marketing plan, a website + content + ads + emails + lifecycle bundle, a marketing department in a box, a launch plan, GTM, or autonomous marketing operations.
metadata:
  version: 1.0.0
---

# MarketForge Orchestrator

MarketForge turns a product idea, app, SaaS, DTC brand, mobile app, marketplace, or local business into a complete, evidence-graded, opinionated marketing system — strategy, content, copy, ads, lifecycle, CRO, attribution, visual assets, and ongoing execution. Every recommendation is evidence-rated (A/B/C/D/E), commercial-bias-flagged where relevant, and traceable to a decision card with rationale, alternatives, reversal trigger, and verification method.

Shared references live at `../_marketforge-shared/references/`. Templates at `../_marketforge-shared/templates/`. Use them when needed.

## Global quality rules

- Read `../_marketforge-shared/references/anti-slop-marketing-rubric.md` before drafting any marketing artifact.
- Read `../_marketforge-shared/references/marketing-decision-quality-protocol.md` for every material decision.
- Read `../_marketforge-shared/references/evidence-grading-rubric.md` — every claim, framework citation, or benchmark gets an A/B/C/D/E grade.
- Apply `../_marketforge-shared/references/guided-marketing-interview.md` for every user-facing question.
- Use `../_marketforge-shared/references/opinionated-marketing-decision-template.md` as the format for every decision.
- Read `../_marketforge-shared/references/commercial-bias-map.md` before citing any vendor-promoted framework, benchmark, or playbook.
- Read `../_marketforge-shared/references/marketing-skills-bridge.md` before invoking any installed marketing-skills sub-skill (copywriting, ads, emails, etc.). MarketForge wraps these — it does not duplicate them.
- Read `../_marketforge-shared/references/banana-bridge.md` before generating any image asset. All image generation delegates to `$banana`.
- Read `../_marketforge-shared/references/visualforge-bridge.md` and `../_marketforge-shared/references/specforge-bridge.md` when those packages exist in the repo.
- Never produce marketing slop: no taste-words ("modern", "engaging", "transformative", "innovative") without measurable mechanism; no "consider"; no vague "leverage"; no fabricated statistics; no AI-cadence headlines.
- Every important marketing decision must be specific, evidence-graded, opinionated, traceable, and bound to a channel/asset/metric.
- Every decision must have an ID, evidence grade, source basis, alternatives considered, recommendation, confidence, asset bindings, kill criterion, and reversal trigger.
- Every generated document must include a `Sources and basis` section, even when the source is only user input or repo evidence.
- Maintain `docs/marketing-plan/auditability/decision-log.md` and `docs/marketing-plan/auditability/research-ledger.md` continuously.
- Keep naming consistent across docs: ICP, persona, channel IDs, campaign IDs, message IDs, KPI IDs must use the same identifiers everywhere.
- Produce documentation, content, copy, briefs, scripts, and asset specs — never execute paid spend, send live emails, post to public accounts, or push to ad platforms unless the user explicitly authorizes and an authorized tool is wired in.
- Choose the right marketing approach for the product, stage, and budget — not the easiest playbook for the AI to write.
- Label every claim as User-confirmed, Repo-derived, Research-backed (with source + date), Standard-backed, Specforge-derived, VisualForge-derived, or Assumption.
- Do not invent benchmarks, vendor capabilities, platform policies, statistics, framework attributions, or research findings. When unknown, write `Unknown — confirm via [source]` with an impact note.
- If the user's product is illegal, harmful, deceptive, predatory, age-restricted without verification, or designed to manipulate vulnerable populations, refuse to produce marketing artifacts and propose a safe alternative scope.
- For regulated domains (medical, financial advice, legal, supplements, children's products, alcohol, firearms, crypto, gambling, political), flag platform-policy and legal-counsel requirements before producing ads, claims, or comparison content.
- Flag commercial bias inline when citing any vendor-promoted framework, benchmark, or claim — gently, not lecturing. See `commercial-bias-map.md`.

## Purpose

Turn a raw product or business into a complete, traceable, evidence-graded marketing operating system that can be executed by a human team, a hybrid AI-assisted team, or eventually an autonomous AI marketing agent. MarketForge does the work of: strategist, brand director, content lead, SEO/GEO specialist, growth marketer, paid-media buyer, outbound SDR ops, lifecycle marketer, CRO analyst, attribution analyst, creative director, copywriter, and marketing ops — without inflating scope to "enterprise marketing department theater."

This skill produces documentation, copy, briefs, content drafts, asset specs, channel playbooks, calendars, scripts, and dashboards specs. It can hand off to live execution tools (Klaviyo, Meta Ads Manager, Apollo, LinkedIn, Google Ads) but does not push live by default.

## Scope profiles

Choose before generating:

1. **Full package** — Greenfield product or full-stack rebuild. Generate the complete map under `docs/marketing-plan/`. ~12-week build-out plan plus ongoing operating cadence.
2. **Focused package** — One area: launch plan, website copy refresh, paid-ads-only, lifecycle-only, GEO-only, etc. Run only the relevant subskills; update only the docs needed.
3. **Audit + repair** — Existing marketing presence. Inspect current site, ad accounts, ESP, CRM exports, analytics. Produce gap analysis and prioritized fixes.
4. **Continuous operations** — Already-launched product on a recurring cadence (weekly/biweekly/monthly). Produces content calendar, ad creative refresh, lifecycle iteration, attribution reports.

Do not turn a focused request into a full package unless the missing docs materially block the user's outcome. If scope must expand, state why and proceed only as far as needed.

## Modes

Detect first:

1. **Greenfield product, no marketing yet** — start from positioning and ICP.
2. **Existing product, no marketing system** — audit current site/ads/email/analytics, then build the missing layers.
3. **Existing marketing, drift/repair** — find gaps, conflicts, AI slop, abandoned channels, false attribution, dead funnels; fix in priority order.
4. **Launch-imminent** — product launching in N weeks; sequence the highest-leverage activities for the deadline.
5. **Continuous operations** — recurring cadence agentic mode (see "Agentic mode" below).

## Orchestration flow

### Step 0a — Repo + skill detection (run first)

1. Read `../_marketforge-shared/references/skill-detection-protocol.md`.
2. Scan available skills/tools for: banana-claude (image gen), marketing-skills plugin (copywriting, ads, emails, etc.), VisualForge (brand visual system), SpecForge (product spec at `docs/app-plan/`), browser/MCP tools for live research.
3. Scan target repo for: `docs/app-plan/` (SpecForge output), `docs/design-system/` (VisualForge output), `package.json`, `pyproject.toml`, existing marketing files.
4. Write `docs/marketing-plan/auditability/skill-detection-report.md` with findings.
5. If banana-claude is missing **and Auto mode is off**: surface to user. Image generation falls back to written briefs ("here is the image spec — generate externally").
6. If marketing-skills plugin is missing: MarketForge uses its own native subskill outputs (slightly less specialized) and notes the fallback.

### Step 0b — Concurrency lock

1. Check for `docs/marketing-plan/.marketforge.lock`.
2. If present and < 2 hours old: refuse to proceed; surface lock metadata.
3. If absent or stale: create lock with run ID + timestamp + host.
4. Register cleanup hook to release lock on completion / halt.

### Step 0c — Resume check

1. Check for existing `docs/marketing-plan/auditability/run-state.json`.
2. If previous run is incomplete and < 7 days old, offer resume / restart / inspect.
3. If resume: validate input hashes; skip completed subskills; re-run `in_progress` from scratch; continue with `pending`.

### Step 0d — Scope and budget selection

1. Read `../_marketforge-shared/references/scope-modes-and-budget-tiers.md`.
2. Determine recommended scope from product signals.
3. Determine budget tier (T1 $0-500/mo, T2 $500-5K/mo, T3 $5K-25K/mo).
4. Present scope + tier to user (or default to Focused + T1 in Auto mode unless signals suggest larger).
5. Record in `run-state.json`.

### Step 0e — Pre-run estimate

Surface to user before commencing:

```
MarketForge run estimate
Mode: [primary mode]
Scope: [full | focused | audit | continuous]
Budget tier: [T1 | T2 | T3]
Subskills to run: [N of 45]
Estimated agent steps: [range]
Estimated tokens: [range]
Estimated wall time: [range]
Files produced: [range]
Decisions logged: [range]

Skills detected: banana [yes/no], marketing-skills [yes/no], VisualForge [yes/no], SpecForge [yes/no]
Quality with current skill stack: [Good / Limited / Compromised]

Auto-execution flags: post-to-LinkedIn [off], send-cold-email [off], push-to-ad-platform [off], publish-website [off]

Proceed? (yes / lite / preview-only / cancel)
```

In Auto mode: log the estimate and proceed.

### Step 0e1 — Self-test (PHASE 0 PRE-FLIGHT — HARD GATE)

Before any subskill invocation, invoke `$marketforge-self-test`. This validates skill integrity:
- All 71 subskill SKILL.md files exist.
- All shared references exist.
- DEC-NNN ranges don't collide.
- Validator scripts are executable.
- Top-level docs (README, USAGE_GUIDE, ARCHITECTURE, MARKETING_GUIDE_V3, AGENTS, CHANGELOG, CONTRIBUTING) exist.

**HARD GATE:** if self-test FAILs, orchestrator REFUSES to proceed. Surface to user with required actions.

### Step 0f — Mode detection and intake

1. Read `../_marketforge-shared/references/mode-detection-protocol.md`.
2. Detect `MODE=greenfield | existing-no-marketing | existing-with-marketing | launch-imminent | continuous`.
3. If `docs/app-plan/` exists: read SpecForge product brief, PRD, business model, monetization, target users.
4. If `docs/design-system/` exists: read VisualForge brand identity, distinctive assets, voice.
5. If current website exists: scrape (via WebFetch if available) homepage, pricing, about, comparison, blog index — feed into the audit.
6. Write `docs/marketing-plan/auditability/mode-report.md`.

### Step 0g — Hard-refuse gates (BLOCKING)

These gates are evaluated AFTER discovery + readiness check, BEFORE any paid subskill or external-publish action can run.

**Gate A — Readiness <5/7 blocks paid subskills.**
- If `marketforge-readiness-check` returns score <5/7, the orchestrator REFUSES to invoke:
  - `marketforge-paid-search`
  - `marketforge-paid-social`
  - `marketforge-paid-mobile`
  - `marketforge-ad-creative-brief`
  - `marketforge-ad-creative-production`
  - `marketforge-influencer-program`
  - `marketforge-affiliate-program`
- Branded paid search defensive-only IS allowed at 3-4/7 (per V3 §12.2 logic).
- Cannot be overridden in Auto mode; user must explicitly override and document.

**Gate B — Pre-PMF blocks brand-only investment.**
- If stage is pre-PMF AND `marketforge-brand-vs-performance` recommends >20% brand allocation, REFUSE.
- Per V3 §1.5: pre-PMF is 80-100% performance.

**Gate C — Channel concentration risk.**
- If `marketforge-portfolio-construction` allocates >50% of budget to a single channel, REFUSE without explicit user override.
- Per `portfolio-construction.md`: concentration risk threshold.

**Gate D — Channel count > 4 in active portfolio.**
- 3-leg model permits 1 compound + 1-2 harvest + 1 wildcard = 3-4 channels.
- 5+ active channels REFUSED unless explicit override (and concentration risk re-evaluated).

**Gate E — Agentic mode without required MCPs.**
- If `agentic=on` and required MCPs are missing (scheduled-tasks + analytics + banana), REFUSE.
- Per `examples/agentic-mode/mcp-wiring-example.md`.

**Gate F — Hard-refuse content categories.**
- If product is in refuse category (per orchestrator refusal scope), REFUSE entirely.
- Examples: fake reviews / testimonials, AI-generated customer faces, targeting minors without COPPA, manufactured testimonials, defamatory comparison content.

**Gate G — Regulated domain without compliance plan.**
- If product is regulated (medical / financial advice / legal / supplements / children / alcohol / firearms / crypto / gambling / political), REFUSE unless compliance plan documented.

When a gate refuses:

```
ERROR: MarketForge cannot proceed.

Gate [X] failed: [specific reason]

Required action:
- [Specific fix]

Override (with explicit rationale logged in auditability/overrides-log.md):
  $marketforge override-gate=[X] reason="[rationale]"
```

Override is recorded permanently; future audits will see the override.

### Step 1 — Discovery & Research (Foundation)

Run in sequence. Each subskill is implicitly invoked.

1. `$marketforge-discovery` — Marketing brief, business model classification, stage, budget, founder profile, asymmetric advantages, urgent constraints.
2. `$marketforge-readiness-check` — Pre-marketing gate: PMF signal, retention, unit economics, conversion path. If <5/7 yes → recommend research/retention work, not acquisition spend, before proceeding to paid channels.
3. `$marketforge-voice-of-customer` — Review mining (Amazon, G2, app stores, subreddits), VOC theme extraction, customer language capture.
4. `$marketforge-jtbd-interviews` — Moesta switch-interview framework (pre-PMF) or Ulwick ODI (post-PMF), depending on stage. Output: 4-forces analysis.
5. `$marketforge-icp-persona` — Revella 5 Rings + JTBD synthesis. NOT "Marketing Mary, 35, loves yoga." Real: "fires last vendor when X happens; buys when Y."
6. `$marketforge-positioning` — Dunford 5-box: competitive alternatives, unique attributes, value those enable, customers who care most, market category.
7. `$marketforge-awareness-stages` — Schwartz 5 stages map. Required input for landing-page and ad copy.
8. `$marketforge-competitive-intel` — SimilarWeb / Ahrefs / SparkToro / App Annie / AdLibrary / Wayback positioning history.

### Step 2 — Strategy

9. `$marketforge-channel-strategy` — Bullseye framework + business-model × channel-fit matrix + 7-factor scoring. Output: 1 compound + 1-2 harvest + 1 wildcard.
10. `$marketforge-portfolio-construction` — 3-leg model, concentration risk, allocated time/budget per channel.
11. `$marketforge-brand-vs-performance` — Honest split for stage and ARR; 60/40 only at post-PMF + $5M+ ARR.
12. `$marketforge-budget-planning` — T1/T2/T3 allocation across channels, monthly + quarterly view.
13. `$marketforge-okr-quarterly-planning` — 1 annual narrative, 3 quarterly bets, 1-2 OKRs/quarter, mid-quarter checkpoint.

### Step 3 — Brand & Messaging

14. `$marketforge-brand-strategy` — Brand attributes, voice + tone, positioning statement, manifesto. Reads VisualForge brand identity if present.
15. `$marketforge-messaging-architecture` — Value pillars, proposition stack, message-stage matrix, copy guidelines, what-we're-not-saying.
16. `$marketforge-naming-and-tagline` — Product naming, tagline candidates with rationale, naming rules for sub-products and features.
17. `$marketforge-distinctive-assets` — Color, mark, sonic, hashtag, mascot — Romaniuk/Sharp DBA discipline. Cross-references VisualForge.
18. `$marketforge-narrative-and-story` — Origin story, mission, manifesto, founder POV, brand story arcs.

### Step 4 — Website & Content

19. `$marketforge-website-copy` — Homepage, pricing, about, features, integrations, comparison ("[competitor] alternative"), use-case, customer pages. Reads positioning + ICP + voice.
20. `$marketforge-landing-pages` — Campaign LPs with ad-to-page message-match contract.
21. `$marketforge-seo-strategy` — Post-AIO realistic: bottom-funnel commercial queries + brand + local + cited-in-AIO. NOT "publish 100 AI articles."
22. `$marketforge-geo-llmo` — Cited-source playbook: structure for extraction, stats addition, authoritative quotes, claim chunking, entity recognition, allow GPTBot/PerplexityBot/ClaudeBot.
23. `$marketforge-content-strategy` — POV + bottom-funnel + original research + distribution-first. NOT keyword-stuffed AI slop.
24. `$marketforge-content-calendar` — 12-week production calendar, per channel, per asset type, per owner.

### Step 5 — Paid Acquisition

25. `$marketforge-paid-search` — Google/Bing: branded + competitor + commercial-intent + category. PMax discipline (exclude brand). Bing math.
26. `$marketforge-paid-social` — Meta (Advantage+, creative rotation, CPM-r fatigue), TikTok (Spark Ads), LinkedIn (TLA > Single Image), Reddit, Pinterest, X. CPM benchmarks per platform.
27. `$marketforge-paid-mobile` — Apple Search Ads + Google UAC for apps. CPP discipline. ASA/UAC split rules.
28. `$marketforge-ad-creative-brief` — Briefs for 5-10 concepts/ad-set, refresh cadence, format hierarchy (9:16 vertical priority).
29. `$marketforge-influencer-program` — Micro/macro vetting, engagement-rate floor, FTC disclosure, unique codes/UTMs.
30. `$marketforge-affiliate-program` — PartnerStack pattern, commission structure (% recurring vs flat), cookie window, ToS.

### Step 6 — Outbound

31. `$marketforge-cold-email` — Deliverability stack (SPF/DKIM/DMARC, separate domain, warmup, verification), signal-based personalization > template-fill, CAN-SPAM/GDPR/UK PECR.
32. `$marketforge-cold-linkedin-outreach` — Connection + content engagement cadence; Sales Navigator config.
33. `$marketforge-direct-mail-abm` — 1:1 / 1:few / 1:many ABM tiers; dimensional mailers for top-50 accounts at $25K+ ACV.
34. `$marketforge-cold-calling` — When it fits (local service B2B, $10K+ ACV ops buyers, <200-account ABM); script structure.

### Step 7 — Organic & Social

35. `$marketforge-linkedin-organic` — Founder + 2-3 employee accounts (NOT company page); PAIPS hooks; carousels > links; DM-based selling.
36. `$marketforge-x-twitter-organic` — Devtools, AI, indie hackers; reply-heavy 2025 algorithm.
37. `$marketforge-youtube-strategy` — Long-form tutorials + Shorts; ICP-specific "how to do X"; assisted conversions.
38. `$marketforge-tiktok-organic` — Native UGC, sub-30s, talking-head; B2B applicability (no-code, AI, marketing, sales).
39. `$marketforge-reddit-strategy` — 2-3 month subreddit immersion, 1:20 promo ratio, Reddit Ads CPC math.
40. `$marketforge-community-led-growth` — Tool-as-community, forum/Slack/Discord, events; moat-vs-theater test (30%+ ARR via community).
41. `$marketforge-podcast-strategy` — Hosting (only at 5-figure ACV+) vs guesting (lower-cost, higher-leverage); 10-15 mid-tier podcasts/year.
42. `$marketforge-pr-earned-media` — Qwoted / Help a B2B Writer / Featured.com / SourceBottle (HARO is dead since 2024); data-hook pitching.
43. `$marketforge-newsletter-sponsorships` — Beehiiv directory, Sparkloop, Passionfroot; CPM benchmarks by category.
44. `$marketforge-engineering-as-marketing` — Free-tool design that solves real adjacent problem and surfaces intent.
45. `$marketforge-founder-content` — Personal brand system, voice, posting cadence, repurposing pipeline.

### Step 8 — Lifecycle & Retention

46. `$marketforge-email-lifecycle` — Welcome, browse-abandonment, cart, post-purchase, win-back; flows (30x revenue/recipient) > campaigns.
47. `$marketforge-sms-program` — Klaviyo SMS, TCPA compliance (double opt-in, STOP, 8am-9pm); flows = 7.6% of sends but 45% of SMS revenue.
48. `$marketforge-push-notifications` — Web push opt-in tactics; mobile push (iOS 50% / Android 80%); rich notifications > text-only.
49. `$marketforge-in-app-messaging` — Pendo/Intercom/Userflow for SaaS; Braze/CleverTap for mobile; behavioral trigger > blast.
50. `$marketforge-referral-program` — K-factor math; two-sided > one-sided; in-product activation-moment ask > email ask.
51. `$marketforge-loyalty-program` — Points/tiered/paid; deploy after product NPS is solid, not before.
52. `$marketforge-onboarding-activation` — Aha-moment identification; activation rate baseline; Pendo/Userflow/Appcues.
53. `$marketforge-customer-marketing` — Case studies, reference calls, advocacy program; highest-converting B2B content in 2025-2026.
54. `$marketforge-retention-churn` — Cohort retention analysis; win-back; churn reasons; cancellation flow design.

### Step 9 — CRO & Measurement

55. `$marketforge-landing-cro` — Baymard checkout research (DTC), Cialdini honest application, friction reduction.
56. `$marketforge-pricing-strategy` — Ramanujam (WTP), Simon (value > cost > competitor), anchoring, decoy, charm/specific pricing.
57. `$marketforge-ab-testing-discipline` — When SMBs should and shouldn't A/B test; 1,000 conversions/month/step floor.
58. `$marketforge-attribution-stack` — Multi-source triangulation: platform + CAPI + self-report survey + incrementality. Never single-number truth.
59. `$marketforge-mmm-incrementality` — Meta Robyn / Google Meridian (need $50K+/mo spend and 2-3 years data); geo holdouts.
60. `$marketforge-analytics-stack` — Event schema, KPI dashboard, north-star metric, leading vs lagging indicators.

### Step 10 — Visual Assets

61. `$marketforge-visual-direction` — Art direction brief: subject, lighting, palette, lens, mood, anti-pattern. Reads VisualForge brand if present.
62. `$marketforge-ad-creative-production` — 9:16 vertical priority, variant generation via banana, format hierarchy, AI-disclosure compliance.
63. `$marketforge-social-imagery` — Platform-sized assets (LinkedIn 1200x627, IG 1080x1080, X 1600x900, etc.).
64. `$marketforge-website-imagery` — Hero, OG cards, feature illustrations, product shots, customer photos.
65. `$marketforge-video-scripts` — UGC briefs, demo scripts, ad scripts, founder explainers, sub-30s hooks.

### Step 11 — Launch, Ops, QA

66. `$marketforge-launch-plan` — Product Hunt, Hacker News, Indie Hackers, AppSumo, social launch sequence; pre-launch waitlist for hardware/mobile.
67. `$marketforge-execution-calendar` — 12-week consolidated tactical calendar: every asset, every channel, every owner, every due date.
68. `$marketforge-marketing-qa` — Doc-level audit: anti-slop, completeness, contradictions, evidence grades, copy quality, message-match.
69. `$marketforge-pressure-test` — **Red-team the marketing plan**: would this fail in 90 days? Channel bet density, AI-saturation watch, channel-decay risk, attribution honesty, founder-fit, copying-bigger-companies anti-pattern.
70. `$marketforge-bias-audit` — Flag every cited claim with commercial bias per `commercial-bias-map.md`.
71. `$marketforge-trust-harness` — **Mutation-based trust harness:** prove downstream output reacts to source-of-truth changes. Multi-oracle validation (cross-cite, kill-criterion, concentration-risk, stage-presence, bias-flag, window-type, supersession). 12 mutation scenarios. BLOCK completion if mutations reveal brittle downstream. See `trust-harness-protocol.md`.
72. `$marketforge-agent-rules-update` — Update AGENTS.md, CLAUDE.md, .cursorrules, and RULES.md to prevent marketing-doc drift.

## Inputs

- Product idea or user prompt.
- Existing SpecForge docs at `docs/app-plan/` if present.
- Existing VisualForge docs at `docs/design-system/` if present.
- Existing website if present (URL provided or scraped).
- Existing ad accounts, ESP, CRM exports if provided.
- User answers to bounded discovery interview.
- User-locked constraints (budget ceiling, time horizon, banned channels, regulatory).

## Outputs

All under `docs/marketing-plan/`, organized into thematic folders (never flat-dumped).

```
docs/marketing-plan/
├── README.md                    (top-level index + routing layer)
├── RULES.md                     (marketing operating rules for future agents)
├── 00-index.md                  (regenerated at end of every run)
├── 01-foundations/
│   ├── marketing-brief.md
│   ├── readiness-check.md
│   ├── voice-of-customer.md
│   ├── jtbd-analysis.md
│   ├── icp-and-personas/        (one file per persona)
│   ├── positioning.md
│   ├── awareness-stages.md
│   └── competitive-intel.md
├── 02-strategy/
│   ├── channel-strategy.md
│   ├── portfolio-construction.md
│   ├── brand-vs-performance.md
│   ├── budget-allocation.md
│   └── okr-quarterly-plan.md
├── 03-brand/
│   ├── brand-strategy.md
│   ├── messaging-architecture.md
│   ├── naming-and-tagline.md
│   ├── distinctive-assets.md
│   └── narrative-and-story.md
├── 04-website-content/
│   ├── website-copy/            (one file per page)
│   ├── landing-pages/           (one file per campaign LP)
│   ├── seo-strategy.md
│   ├── geo-llmo.md
│   ├── content-strategy.md
│   └── content-calendar.md
├── 05-paid/
│   ├── paid-search.md
│   ├── paid-social.md
│   ├── paid-mobile.md
│   ├── ad-creative-briefs/      (one per concept)
│   ├── influencer-program.md
│   └── affiliate-program.md
├── 06-outbound/
│   ├── cold-email-system.md
│   ├── cold-linkedin.md
│   ├── direct-mail-abm.md
│   └── cold-calling.md
├── 07-organic-social/
│   ├── linkedin-organic.md
│   ├── x-twitter-organic.md
│   ├── youtube-strategy.md
│   ├── tiktok-organic.md
│   ├── reddit-strategy.md
│   ├── community-led-growth.md
│   ├── podcast-strategy.md
│   ├── pr-earned-media.md
│   ├── newsletter-sponsorships.md
│   ├── engineering-as-marketing.md
│   └── founder-content.md
├── 08-lifecycle/
│   ├── email-lifecycle/         (one per flow)
│   ├── sms-program.md
│   ├── push-notifications.md
│   ├── in-app-messaging.md
│   ├── referral-program.md
│   ├── loyalty-program.md
│   ├── onboarding-activation.md
│   ├── customer-marketing.md
│   └── retention-churn.md
├── 09-cro-measurement/
│   ├── landing-cro.md
│   ├── pricing-strategy.md
│   ├── ab-testing-discipline.md
│   ├── attribution-stack.md
│   ├── mmm-incrementality.md
│   └── analytics-stack.md
├── 10-visual-assets/
│   ├── visual-direction.md
│   ├── ad-creative/             (briefs + generated assets)
│   ├── social-imagery/
│   ├── website-imagery/
│   └── video-scripts/
├── 11-execution/
│   ├── launch-plan.md
│   └── execution-calendar.md
└── auditability/
    ├── mode-report.md
    ├── skill-detection-report.md
    ├── run-state.json
    ├── run-log.md
    ├── decision-log.md
    ├── research-ledger.md
    ├── marketing-quality-review.md
    ├── pressure-test-report.md
    ├── bias-audit.md
    ├── rules-update-log.md
    └── deferred-findings.md
```

Plus updates to `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, etc. only when warranted.

The orchestrator regenerates `00-index.md` at the end of every run with the current file map.

## Checkpointing

After every subskill completes (or fails / is skipped):

1. Update `auditability/run-state.json` with the subskill's new status.
2. Append one-line entry to `auditability/run-log.md`.
3. Refresh concurrency lock heartbeat (extend TTL by 1 hour from now).
4. Decisions added this run captured in `run-state.json.decisions_added_this_run`.
5. **Run mid-run validation** — invoke `python ../scripts/validate_marketing_docs.py --root docs/marketing-plan --mid-run`. Fast subset: DEC-ID shape, cross-tree duplicate DECs, forbidden-ambiguity scan, anti-slop scan, evidence-grade presence, raw-stat citation check, lock state, channel-allocation sum check.
6. **Halt on validation failure.** Three options surfaced:
   - (a) Fix at source: re-invoke the just-completed subskill with the finding as input; correct; re-validate.
   - (b) Accept with override: log in `auditability/validation-overrides.md` with rationale.
   - (c) Cancel run: halt; preserve checkpoint for resume.
7. In Auto mode, default to (a) once per finding. Second occurrence escalates to user.

If context approaches exhaustion or a subskill fails irrecoverably, the orchestrator halts cleanly with a "resume needed" note — never crashes mid-write.

## Phase-boundary mini pressure-test

At every phase boundary:

| Phase | Boundary trigger | Pressure-test invocation |
|---|---|---|
| 1 — Foundation | After `competitive-intel` completes | `$marketforge-pressure-test partial=phase-1` |
| 2 — Strategy | After `okr-quarterly-planning` completes | `$marketforge-pressure-test partial=phase-2` |
| 3 — Brand | After `narrative-and-story` completes | `$marketforge-pressure-test partial=phase-3` |
| 4 — Website + Content | After `content-calendar` completes | `$marketforge-pressure-test partial=phase-4` |
| 5 — Paid | After `affiliate-program` completes | `$marketforge-pressure-test partial=phase-5` |
| 6-7 — Outbound + Organic | After `founder-content` completes | `$marketforge-pressure-test partial=phase-6-7` |
| 8 — Lifecycle | After `retention-churn` completes | `$marketforge-pressure-test partial=phase-8` |
| 9 — CRO + Measurement | After `analytics-stack` completes | `$marketforge-pressure-test partial=phase-9` |
| 10 — Visual | After `video-scripts` completes | `$marketforge-pressure-test partial=phase-10` |
| 11 — Execution | After `execution-calendar` completes | (full mode covers it) |

Phase-boundary mini tests produce reports at `auditability/phase-N-mini-pressure-test.md`. BLOCK findings halt the run until resolved (loop limit 2 iterations).

## User override and supersession

- **Inline override** during run: `> override DEC-NNN to [new direction]`.
- **Post-run override**: user invokes the responsible subskill with override input.
- **Bulk override**: cascade summary surfaced before execution.

Every override is logged in `auditability/overrides-log.md`. Supersession protocol: new DEC, original marked `Status: Superseded by DEC-MMM`. Append-only files never edited in place.

## Pacing and pausing

After every two subskills, write a brief status entry to `auditability/run-log.md`. Surface only:

- New decisions of Confidence Low (need user attention).
- Contradictions discovered.
- Research gaps that affect a decision.
- Commercial-bias flags worth surfacing.

Do not surface every decision — the decision log is for review post-completion.

## Adaptive ICP triggers

ICP and personas are not frozen after `marketforge-icp-persona`. The orchestrator re-invokes that subskill in **revision mode** when later subskills surface evidence:

1. **After `competitive-intel`** — if a segment the personas missed is heavily served by competitors, refine.
2. **After `voice-of-customer` follow-up** — if VOC reveals language inconsistent with the persona, refine.
3. **After `paid-social` test data** — if CPM/CTR data on a sub-segment dramatically outperforms ICP-targeted, refine.
4. **After `pressure-test`** — if pressure-test surfaces a persona gap (cannot defend channel choice with current personas), refine.

Re-invocation rules: orchestrator passes new evidence; user-research either adds/splits/refines or argues current set holds with rationale. All persona file changes are versioned with `### Revision YYYY-MM-DD` blocks. Downstream subskills that depend on ICP re-run if persona materially changed.

## Pressure-test feedback loop

`marketforge-pressure-test` runs after `marketforge-marketing-qa`. Findings triaged BLOCK / FIX-NEXT / ACCEPT / WATCH. The orchestrator handles the feedback loop:

### When pressure-test returns BLOCK findings

1. Orchestrator does **not** declare completion.
2. For each BLOCK finding, determine responsible upstream subskill via the **finding-ownership matrix** below.
3. Invoke responsible subskill in **revision mode** with finding as input. Subskill produces revised decision card (new DEC-NNN per supersession protocol).
4. Cascade — affected downstream subskills revise.
5. Re-run `marketing-qa` and `pressure-test` on revised plan.
6. Repeat until pressure-test returns GOOD or GOOD WITH NOTES (loop limit + exemptions apply).

### Finding-ownership matrix

| Finding signature | Primary owner | Secondary cascade |
|---|---|---|
| Channel-business-model mismatch | `channel-strategy` | `portfolio-construction` |
| ICP-channel mismatch | `icp-persona` first → if persona OK, `channel-strategy` | `paid-social` / relevant channel |
| Premature paid spend (readiness fail) | `readiness-check` | `budget-planning` |
| Concentration risk (>50% spend on one channel) | `portfolio-construction` | `budget-planning` |
| Awareness-stage / copy mismatch | `awareness-stages` | `website-copy` / `paid-search` |
| AI slop in copy | `messaging-architecture` | offending copy subskill |
| Vendor-promoted claim without bias flag | `bias-audit` | offending subskill |
| Attribution single-source claim | `attribution-stack` | offending channel |
| Missing kill criterion | offending channel subskill | `channel-strategy` |
| Brand vs performance mis-calibration for stage | `brand-vs-performance` | `budget-planning` |
| Compound-channel kill criterion applied as paid-channel kill | `channel-strategy` | `budget-planning` |
| GEO/LLMO ignored when surface area exists | `geo-llmo` | `seo-strategy` |
| Cold email saturation patterns | `cold-email` | `outbound-strategy` |
| LinkedIn company-page reliance | `linkedin-organic` | `founder-content` |
| Cookie-era retargeting assumption | `attribution-stack` | `paid-social` |
| HARO/dead-tool reference | `pr-earned-media` | n/a |
| K-factor wishful thinking | `referral-program` | `channel-strategy` |
| Copying-Salesforce-2006 anti-pattern | `channel-strategy` | `brand-vs-performance` |
| Founder-channel-fit ignored | `discovery` | `channel-strategy` |
| Regulated-domain compliance missing | offending content subskill | `bias-audit` |
| Pre-PMF brand spend | `brand-vs-performance` | `readiness-check` |

Each finding maps to one primary owner. Findings that span multiple subskills are decomposed into multiple findings, each with its own owner — never "or" / "either."

## Agentic mode (autonomous operations)

When invoked with `agentic=on` or via the recurring scheduler, MarketForge runs in continuous-operations mode:

### Daily loop (default cadence)

1. **Read recent inputs** — analytics events, ad performance pulls (via configured MCP/tool), inbound replies, support tickets, social mentions, review sites.
2. **Update telemetry pack** — refresh KPI dashboard, channel performance, attribution triangulation, anomaly flags.
3. **Decide what to act on** — kill criteria check, refresh cadence check, content calendar gates, lifecycle trigger events.
4. **Produce day's artifacts** — ad creative variants, social posts (LinkedIn, X), blog drafts, email drafts, outbound batches.
5. **Surface to human approval queue** — anything that ships externally requires approval by default. Configurable per channel.
6. **Log to operations journal** — `docs/marketing-plan/operations/YYYY-MM-DD.md`.

### Tools the agentic mode expects (via MCP or installed tools)

These are integration points — MarketForge does not implement them; it expects them to be wired:

- **Analytics MCP** — GA4, Plausible, Mixpanel, PostHog, Amplitude reads.
- **Ad platform MCPs** — Meta Marketing API, Google Ads API, LinkedIn Marketing API, TikTok Ads API reads (and writes with approval).
- **ESP MCP** — Klaviyo, Customer.io, HubSpot reads (and sends with approval).
- **CRM MCP** — HubSpot, Salesforce, Apollo, Clay reads (and updates with approval).
- **Social MCPs** — LinkedIn, X, Buffer, Hootsuite (post with approval).
- **SEO MCPs** — Ahrefs, Semrush, Search Console reads.
- **GEO MCPs** — Profound, Otterly, Peec AI reads.
- **Browser MCP** — for competitive scrapes, screenshot captures, review mining.
- **Image generation** — banana-claude (already installed in this user's environment).
- **Search MCPs** — web search for current research.

### Safety guardrails (always-on in agentic mode)

- Never push live ad spend changes without approval unless explicitly whitelisted per campaign.
- Never send cold email batches without per-batch human approval unless deliverability infra is verified and seed-tested.
- Never post to public social accounts without per-post approval unless brand-voice template + creative review is logged.
- Never publish website copy without approval.
- Never modify product pricing live.
- Refuse to produce content that violates platform policy, ad-platform policy, or applicable laws (FTC, GDPR, TCPA, CAN-SPAM, COPPA).
- Flag and pause when KPI anomalies exceed configured thresholds (e.g., CPA up 50% week-over-week).
- Daily operations journal with what was done, what was queued for approval, what was blocked, and rationale.

### Recurring scheduler

If `scheduled-tasks` MCP is available, MarketForge can register cron-driven runs:
- Daily 09:00 local: light loop (telemetry refresh, anomaly check, surface today's queue).
- Weekly Monday 09:00: medium loop (week's content + creative queue, cohort retention update).
- Monthly 1st 09:00: heavy loop (channel review, budget re-allocation proposal, brand-vs-performance check).
- Quarterly: full re-run of strategy phase against latest data.

See `../_marketforge-shared/references/agentic-operations-protocol.md` for full operating spec.

## Refusal and safe-alternative scope

If the user's product or marketing ask falls into a hard-refuse category, the orchestrator refuses and proposes a safe alternative scope:

- Adversarial / deceptive marketing (fake reviews, fake scarcity, dark patterns, fake limited-time, fake testimonials).
- Illegal products (where illegal in user's stated jurisdiction).
- Mass cold-outreach to consumers (CAN-SPAM B2C / GDPR / TCPA violations).
- Health / financial / legal claims that would require regulated disclosures the user has not addressed.
- Targeting minors without COPPA-compliant approach.
- Targeting protected categories in housing / employment / credit ads (Meta SCA, Google sensitive-category restrictions).
- "Manufacture testimonials" / "buy followers" / "buy reviews" / "buy backlinks" / "PBN" requests.
- Defamatory comparison content.

For each refusal, propose a safe alternative — usually the legitimate version of what they asked for.

## Completion criteria

A MarketForge run is complete when:

1. All in-scope subskills have status `completed` in `run-state.json`.
2. `marketforge-self-test` PASSED (pre-flight).
3. `marketforge-marketing-qa` returns PASS or PASS WITH NOTES.
4. `marketforge-pressure-test` returns GOOD or GOOD WITH NOTES (no BLOCK findings).
5. `marketforge-bias-audit` is complete; all D-grade and E-grade citations flagged.
6. `marketforge-trust-harness` returns TRUST or PARTIAL TRUST (mutations surface expected oracles).
7. `validate_marketing_docs.py --final --strict` exits 0.
8. `pytest tests/` — all tests pass including marketing-plan mutation suite.
9. `00-index.md` is regenerated.
10. Concurrency lock released.
11. Run summary surfaced to user with: files produced, decisions logged, deferred findings, assumptions register, next safe prompt.

## Sample invocations

- `$marketforge` — full package, auto-detect business model from repo.
- `$marketforge scope=focused channels=paid-search,linkedin-organic` — focused two-channel build-out.
- `$marketforge scope=audit` — audit existing marketing presence and produce gap report.
- `$marketforge agentic=on cadence=daily` — register continuous operations loop.
- `$marketforge resume` — resume interrupted run.
- `$marketforge override DEC-014 to "ASA-heavy 70/30 over UAC"` — single-decision override + cascade.

## Related skills

- `$banana` / `banana-claude:banana` — image generation (required for visual asset subskills).
- `marketing-skills:copywriting`, `marketing-skills:ads`, `marketing-skills:emails`, `marketing-skills:cro`, `marketing-skills:seo-audit`, `marketing-skills:cold-email`, etc. — MarketForge wraps these when present.
- `$visualforge` — brand visual system (color, typography, components). MarketForge reads its outputs.
- `$specforge` — product spec. MarketForge reads `docs/app-plan/` when present.
- `$find-skills` — discover other marketing-relevant skills the user could install.

## Sources and basis

This orchestrator implements the V3 Marketing & Customer Acquisition Operating Guide (full text at `../../docs/MARKETING_GUIDE_V3.md`), graded by evidence quality (A/B/C/D/E) per `evidence-grading-rubric.md`. Key frameworks (Dunford, Moesta, Ulwick, Schwartz, Sharp/Romaniuk, Binet/Field, Balfour, Walker, Welsh, Cialdini, Baymard, Ramanujam, Berger) are cited at the subskill level with their evidence grade. Vendor-promoted claims (Klaviyo, Sendoso, Profound, Refine Labs, etc.) are flagged in `commercial-bias-map.md`. Channel-decay reality (Facebook CAC, Google CPCs, cold email reply rates) and AI-saturation timelines are tracked in `ai-saturation-watch.md`.
