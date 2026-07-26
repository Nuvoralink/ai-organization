<!-- marketforge: v1.2.0 run-id=golden-fixture scope=full generated=2026-05-20 -->

# Paid Search Strategy (Golden Fixture)

## Target awareness stage by campaign
- Branded campaign: Most-aware (visitor types our name).
- Competitor campaign: Solution-aware / Product-aware (visitor comparing).
- Category campaign: Problem-aware / Solution-aware.

## Per-bucket plan

### Branded campaign
- Target queries: "TestProduct", "TestProduct pricing", "TestProduct login".
- LP: homepage / pricing.
- Awareness stage: Most-aware.
- CTA: "Start free trial."
- Daily budget: $20.

### Competitor campaign
- Target queries: "[Competitor A] alternative", "[Competitor A] vs TestProduct", "[Competitor A] pricing".
- LP: comparison page (`/competitor-a-alternative`).
- Awareness stage: Solution-aware / Product-aware.
- CTA: "See how we compare."
- Daily budget: $60.

### Category campaign
- Target queries: "on-call rotation tool", "PagerDuty alternative", "incident management software".
- LP: features page.
- Awareness stage: Solution-aware.
- CTA: "Read the framework."
- Daily budget: $40.

## Decision cards

### [DEC-250] Paid search campaign structure

**Decision:** 3 active campaigns — Branded ($20/d), Competitor ($60/d), Category ($40/d) — total $120/d = $3,600/mo (35% of paid budget per DEC-070 allocation).

**Why this:**
1. Branded is defensive layer (low CPA).
2. Competitor terms have highest intent (Solution-aware visitors comparing us).
3. Category captures mid-funnel intent.

**Why not the alternatives:**
- Skip branded: leaves brand searches to competitor poaching.
- Skip category: misses Solution-aware buyers researching.
- Add PMax: would cannibalize branded (require brand keyword exclusion); deferred until volume justifies.

**Confidence:** High
**Evidence grade:** B
**Source basis:** Research-backed.

**Commercial-bias flag:** None.

**Asset / channel / metric bindings:**
- Channel: paid-search.
- Owner: Paid lead (or founder until first hire).
- KPIs: CPA per campaign, ROAS per campaign.
- Budget: $3,600/mo within $10K total paid budget (35% per DEC-070).

**Kill criterion:** CPA >150% of target ($75) sustained 30 days with 2 creative iterations.
**Reversal trigger:** Competitor A repositions; their brand searches drop our intent quality.
**Test window:** 30-60 days.

**Anti-pattern to avoid:** Running PMax without brand keyword exclusion (cannibalizes branded).

**Cross-cites consumed:** DEC-008 (positioning), DEC-020 (ICP-001), DEC-040 (awareness stages), DEC-070 (portfolio allocation), DEC-200 (homepage copy).

## What we are intentionally NOT doing
- PMax (until volume + maturity justify).
- Bidding on competitor trademarks in jurisdictions where prohibited.
- Top-funnel category queries (Awareness-stage = Unaware → wrong CTA).

## Sources and basis
- V3 Marketing Guide §4.1 (Google Ads).
- DEC-070 portfolio.
- DEC-040 awareness stages.
- Evidence grade B.
