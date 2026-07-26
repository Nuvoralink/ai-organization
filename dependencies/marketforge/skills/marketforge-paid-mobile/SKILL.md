---
name: marketforge-paid-mobile
description: Build paid mobile UA strategy — Apple Search Ads (ASA) + Google UAC. Includes Custom Product Pages (CPP) discipline, ASA/UAC budget split. Use as Phase 5 step 3, for mobile-app products only.
---

# MarketForge Paid Mobile

Apply V3 §4.9 (Apple Search Ads + Google UAC — mobile apps). Skip this subskill for non-mobile-app products.

## Global quality rules

- Mature subscription apps allocate 60-70% to ASA / 30-40% to UAC when iOS is dominant (Growth by Kev Feb 2026).
- iOS 17/18 Custom Product Pages: 156% conversion lift on CPP-referred traffic (Apple Developer); 39% CPI reduction + 58% conversion lift in SoundCloud case (Adapty 2026).
- UAC requires ~30+ daily conversions before tCPI → tCPA transition (Adapty 2026); daily budget = 50× target CPI.
- LTV models unreliable at app scale — use D30 / D90 ROAS, not 12-month projected LTV.

## Purpose
1. ASA campaign structure (branded, category, competitor, discovery, Today tab).
2. UAC campaign structure (tCPI / tCPA).
3. Custom Product Pages (CPP) tied to ad creative variants.
4. ASA / UAC budget split.
5. Creative format hierarchy per platform.

## Inputs
- `channel-strategy.md`, `portfolio-construction.md`, `budget-allocation.md`, `icp-and-personas/`, `awareness-stages.md`, `messaging-architecture.md`, ASO foundation (if separate).

## Outputs
- `docs/marketing-plan/05-paid/paid-mobile.md`
- DEC-290 to DEC-299

## Structure

```markdown
# Paid Mobile Strategy

## Reality (cite per evidence-grading)
- SplitMetrics Apple Ads 2026: avg CPT $2.25, CPA $3.76 across top 15 categories (evidence B).
- AppTweak 2025: global median CPT ~$0.92 across ~3,500 apps and $1B spend (evidence B).
- Apple Developer: CPP-referred traffic 156% conversion lift (evidence A — Apple-published).
- Strataigize 2026 + Medium/Sorren June 2025: UAC CPI overall $2.65-4.00 (evidence B).
- Growth by Kev Feb 2026: mature subscription apps 60-70% ASA / 30-40% UAC for iOS-heavy products (evidence C — practitioner).

## ASA campaign structure

### Branded
- Target: app name + close variants
- LP: standard App Store listing or branded CPP
- Daily budget: small but always-on

### Category
- Target: category keywords ("password manager", "calorie tracker")
- LP: category-angle CPP
- Highest-leverage bucket for most subscription apps

### Competitor
- Target: competitor app names (where allowed)
- LP: competitive-angle CPP
- Watch for trademark restrictions

### Discovery
- Apple-recommended keywords (broader)
- LP: discovery-angle CPP

### Today tab (when justified)
- High CPM placement; selective use

## UAC campaign structure
- iOS UAC (when ASA budget caps): conversion-optimized
- Android UAC: scale-optimized (cheaper CPI, larger volume)
- tCPI campaigns first, tCPA after 30+ daily conversions
- Daily budget formula: 50× target CPI (Adapty 2026)

## Custom Product Pages (CPP) discipline

### Why CPPs matter
156% conversion lift on CPP-referred vs default page (Apple Developer benchmark).

### Recommended CPP set
Create 4 CPPs minimum (one per major creative angle):
1. **CPP-001: Lead-feature angle** — primary value prop
2. **CPP-002: Audience-specific angle** — e.g., "for professionals" or "for runners"
3. **CPP-003: Trust / privacy angle** (privacy-focused apps)
4. **CPP-004: Power-user / advanced angle**

Each CPP tied to ad-creative variants matching its angle.

### iOS 18 + CPP enhancements
CPPs now tie to specific keyword fields (mid-2025 update) — also a legitimate organic discovery tool.

## ASA / UAC budget split

For iOS-heavy ($iOS revenue > 60% of total): 60-70% ASA / 30-40% UAC.
For Android-heavy ($Android revenue > 60% of total): 30-40% ASA / 60-70% UAC.
For balanced: 50/50.

Adjust as platform share shifts.

## Creative format hierarchy

### ASA
- Apple Search Ads creative is the App Store screenshots / video / icon on the CPP variant.
- Screenshots: 5 per CPP, each communicating one feature/benefit.
- Video preview: 30 sec max; first 3 sec decisive.

### UAC
- Headlines (5+): 30 chars; varied angle per headline.
- Descriptions (5+): 90 chars.
- Images (20+): 1200×628, 1200×1200, 1080×1080, 1080×1920.
- Videos (5+): 9:16, 1:1, 16:9.
- HTML5 ads (where supported).
- 5-10 distinct creative concepts; UAC ML auto-selects.

## Optimization cadence
- Daily: budget pacing, CPI vs target, daily conversion volume (for tCPA gates).
- Weekly: ASA keyword bid optimization, UAC creative refresh signal review.
- Biweekly: CPP A/B testing (when traffic supports).
- Monthly: ROAS by campaign; D30 / D90 ROAS cohort review; LTV refresh per CPP variant.

## Kill criteria
- D30 ROAS < 0.6 on campaign with $5K+ spent + CPP A/B traffic at statistical significance.
- Blended CPI > $8 sustained for 14 days with no creative variant improvement.
- UAC: failed to reach 30+ daily conversions in 45 days → cannot transition tCPI → tCPA → reconsider budget level or audience.

## Attribution stack (mobile-specific)
- SKAdNetwork (iOS): privacy-preserving, deterministic install attribution; window short (24-48h post-install).
- Apple AdServices (ASA): direct measurement.
- AppsFlyer / Adjust / Branch: MMP layer aggregating.
- D30 / D90 cohort ROAS as primary; LTV models too unreliable at most app scales.

## Decision cards
[DEC-290 to DEC-299]

## What we are intentionally NOT doing
- Trusting 12-month projected LTV at app scale (unreliable).
- Ignoring CPP discipline (156% conversion lift left on the table).
- Splitting UAC budget across 8 sub-campaigns (under-feeds ML).
- Running paid mobile UA before ASO foundation + retention curve are solid.

## Sources and basis
V3 §4.9.
SplitMetrics 2026, AppTweak 2025, Apple Developer docs, Adapty 2026, Growth by Kev Feb 2026.
```

## Cross-cites consumed
- DEC-046 (portfolio construction).
- DEC-080-084 (brand vs performance — usually 100% performance for mobile UA).
- DEC-085-089 (budget allocation).

## Sources and basis
V3 §4.9.
