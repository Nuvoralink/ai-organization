---
name: marketforge-direct-mail-abm
description: Build direct mail + ABM (1:1, 1:few, 1:many) strategy. Dimensional mailers for top 50-200 accounts at $25K+ ACV. ABM = same content with names on a dashboard is theater. Use as Phase 6 step 3.
---

# MarketForge Direct Mail + ABM

Apply V3 §5.4 (Direct mail counterintuitive resurgence) and §5.5 (ABM tiers).

## Global quality rules

- Direct mail response: 4.4% vs email 0.12% — 37x gap (ANA/DMA 2025) — but this is for ABM dimensional mailers, not broad-list mail. Don't generalize.
- ABM dimensional mailers (boxes, packages) achieve 5-15% response, near-100% open rates (mailrooms route past gatekeepers).
- 3x higher meeting-set rates vs email-only outreach when mail precedes the sales touch.
- ABM tiers: 1:1 (top 10-50 accounts, full custom — $50K+ ACV) / 1:few (clusters of 100-500 — mid-market sweet spot) / 1:many (programmatic ABM via 6sense, Demandbase, RB2B — needs 5K+ TAM + budget).
- "ABM" = same content + same emails + same ads with names on a dashboard = theater. Refuse to call that ABM.

## Purpose

1. ABM tier selection (1:1 / 1:few / 1:many) per ACV + TAM.
2. Target account list build.
3. Dimensional mailer concept design.
4. Multi-channel sequence (mail + email + LinkedIn + call).
5. Attribution / measurement.

## Inputs
- `marketing-brief.md` (ACV; only valid for $25K+ ACV).
- `icp-and-personas/`.
- `channel-strategy.md` (direct mail / ABM selected).
- `competitive-intel.md`.

## Outputs
- `docs/marketing-plan/06-outbound/direct-mail-abm.md`
- DEC-390 to DEC-399

## Structure

```markdown
# Direct Mail + ABM Strategy

## Tier selection

### 1:1 (top 10-50 accounts)
- ACV threshold: $50K+
- Full custom: dedicated landing page, custom mailer, named-executive outreach
- Investment per account: $500-5,000
- Conversion target: 20-40% meeting-set

### 1:few (clusters of 100-500)
- ACV threshold: $25K+
- Cluster-based: 5-15 mailer designs serving 20-50 accounts each
- Investment per account: $100-500
- Conversion target: 5-15% meeting-set

### 1:many (programmatic)
- TAM threshold: 5K+ accounts
- Display ads + segmented email + intent data
- Platforms: 6sense, Demandbase, Bombora
- Investment: T3+ tier
- Conversion target: 1-5% engagement

## Target account list

### Sourcing
- Internal sales team's wishlist.
- Apollo / ZoomInfo / Clearbit filters per ICP.
- Intent data (6sense, Bombora) for in-market signals.
- Competitor displacement candidates.

### Prioritization (for 1:1 + 1:few)
- ACV opportunity (high)
- Buying signals present (recent funding, hires, tech changes)
- Decision-maker identifiable (named target)
- Champion / inroad already present (warm signal)

## Dimensional mailer concept

### What works (per ANA/DMA + practitioner data)
- Branded box (logo + brand color) — opens at near-100% in mailrooms.
- Tangible artifact: book, branded merch, physical demo unit, hand-written note, USB with custom video.
- Personalization: name + company + role + their specific context.
- Sender: named executive on our side (CEO, CRO) — not "team".
- Follow-up touch tied to mailer arrival.

### Sample concept
- Branded box with the company name.
- Contents: hand-signed letter from our founder + a relevant book or branded artifact + small QR code linking to dedicated LP for their company.
- Letter: 150-300 words, named individual, references specific signal (their funding / hire / pain mentioned in podcast).

## Multi-channel sequence

| Day | Channel | Touch |
|---|---|---|
| -2 | LinkedIn | Founder comments on prospect's recent post |
| 0 | Direct mail | Dimensional mailer arrives |
| +1 | Email | Reference to mailer + value prop |
| +3 | Phone | Call from named SDR — references mailer + email |
| +5 | LinkedIn DM | Soft follow-up |
| +10 | Email | Different angle if no response |
| +14 | Phone | Second call attempt |
| +21 | Email | Close-the-loop ("not the right time?") |

## ABM 1:1 dedicated landing pages

For 1:1 accounts:
- URL pattern: `[brand]/[targetcompany]` or `[brand]/welcome-[name]`
- Custom: their company logo, their named decision-maker, their named challenge.
- Specific case studies of similar companies.

## Programmatic ABM (1:many — T3+)

- 6sense / Demandbase / RB2B for account identification.
- Bombora for intent data.
- Audience tagging in Meta + LinkedIn + Google for account-list retargeting.
- Coordination with sales team: handoff when account hits Marketing-Qualified-Account threshold.

## Attribution

- Unique dedicated LP per cohort (or per 1:1 account).
- UTM hygiene.
- Self-report attribution: "How did you hear about us?" + "What got you to the meeting?"
- Account-level pipeline tracking in CRM.

## Anti-patterns

- "ABM" with no per-account customization.
- Direct mail without follow-up sequence (mailer arrives, no touch, fades).
- 1:1 ABM applied to <$50K ACV (uneconomic).
- Programmatic ABM at <5K TAM (over-engineered).
- Dimensional mailers to executives in stricter-mail-policy jurisdictions (some refused / discarded).
- Mail items that read as junk: branded swag with no context.

## Decision cards
[DEC-390 to DEC-399]

## Kill criteria
- 6-8 weeks (per cycle of 50-200 accounts): reply / meeting-book <3% on top-tier accounts → re-evaluate concept + targeting.
- 1:1 cohort: 1 sales cycle without closed-won → re-evaluate the cohort.

## What we are intentionally NOT doing
- Broad-list direct mail (not the same as ABM dimensional mailing).
- ABM theater (same content + names on dashboard).
- Programmatic ABM at insufficient TAM (over-engineered).
- $25-50K ACV at 1:1 tier (uneconomic).

## Sources and basis
V3 §5.4 (Direct mail), §5.5 (ABM tiers).
ANA/DMA 2025 (evidence B with commercial-bias caveat — Sendoso, PFL adjacency).
```

## Sources and basis
V3 §5.4, §5.5.
