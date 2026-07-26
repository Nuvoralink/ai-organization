# Evidence Grading Rubric

Every marketing claim, framework citation, benchmark, statistic, and recommendation in MarketForge is labeled with an evidence grade. This is the discipline that separates MarketForge from "AI marketing tools that confidently repeat folklore."

## The grades

### A — Peer-reviewed / replicated empirical research

Multi-study replication, peer-reviewed academic journals, cross-replicated experimental findings.

**Examples:**
- Aronson et al. 1966 pratfall effect (replicated).
- Cialdini's social proof and authority principles (consistent replication across decades).
- Bornstein 1989 mere-exposure meta-analysis.
- Schindler & Yalch 2006 charm pricing (Journal of Consumer Research).
- Aggarwal et al. 2024 GEO paper (KDD).
- Pew Research methodologically rigorous surveys.

**How to cite:**
> Source: [paper], journal/conference, year. Replication status: [strong / moderate]. Evidence grade: A.

### B — Large-scale industry data

Datasets from credible industry bodies, large vendor benchmarks based on real data, established measurement firms.

**Examples:**
- Baymard Institute checkout research (49-study meta-analysis).
- ANA/DMA Response Rate Report.
- Klaviyo 2025-2026 benchmark reports (real customer data, large N).
- Ahrefs / SEMrush / Seer Interactive AIO studies (large-N data).
- SplitMetrics Apple Ads benchmarks.
- ZenABM LinkedIn Ads benchmarks (161,256 ads across 211 companies).
- Adjust / AppsFlyer mobile benchmarks.
- IPA Effectiveness Awards databank (with selection-bias caveat).
- NetLine State of B2B Content Consumption.
- Spiegel Research Center (Northwestern) review-rating data.
- Pew Research industry surveys.

**How to cite:**
> Source: [vendor / institution] [report name], [year], n=[sample size if reported]. Caveats: [selection bias / scope / vendor adjacency]. Evidence grade: B.

### C — Practitioner consensus across multiple credible operators

Frameworks and patterns repeatedly validated by independent practitioners with track records. No randomized controlled trial; lived experience across many operators.

**Examples:**
- Dunford positioning framework (Obviously Awesome, 2019).
- Moesta JTBD switch interviews.
- Ulwick ODI methodology.
- Brian Balfour Four Fits framework.
- Justin Welsh LinkedIn methodology (with selection-bias caveat).
- Andrew Chen marketplace cold-start (Cold Start Problem).
- Andy Rachleff founder-market fit.
- Pricing levers (anchoring, decoy, tiered design) when applied to SaaS/DTC at SMB scale.
- Most channel-specific operating heuristics ("post daily on LinkedIn", "2-3 month subreddit immersion before promo").

**How to cite:**
> Source: [author/book/post], [year]. Practitioner consensus across [N operators]. Evidence grade: C.

### D — Vendor-promoted (hypothesis, not fact)

Claims that originate from a vendor with commercial interest in widespread belief of the claim. The data may be real, but the framing is commercially convenient. Triangulate before recommending.

**Examples:**
- "GEO is essential now" (Profound, Otterly, Peec AI).
- "AI cold email gets 21% reply rates" (AI cold-email vendors).
- "AI search visitors convert 23x better than organic" (Ahrefs internal, Ryan Law).
- "Community-acquired customers show 33% higher LTV" (ProfitWell internal).
- "Direct mail response is 4.4% (37x email)" (ANA/DMA + Sendoso ecosystem — vendor adjacency, even though ANA is industry body).
- "$36-$42 ROI per $1 of email" (DMA/Litmus — true on aggregate, vendor-friendly framing).
- "Creative is the new targeting" (Meta-promoted framing).
- Refine Labs attribution mirage data (Refine Labs is a vendor; data is suggestive but limited).
- PartnerStack network statistics (PartnerStack-internal).
- Most case studies from the vendor whose product is being sold.

**How to cite:**
> Source: [vendor], [year]. Commercial bias: [described]. Triangulation status: [confirmed / unconfirmed / contradicted by independent data]. Evidence grade: D.

### E — Folklore / single-case anecdote

A widely repeated claim that on inspection has no clear sourcing, or a single-company case study that does not generalize.

**Examples:**
- "Rule of 7 touches" (1930s movie marketing folklore).
- "5 stars is the gold standard" (contradicted by Spiegel research — 4.0-4.7 outperforms 5.0).
- "Zappos service-as-marketing" (folklore reinforced by experience; not generalizable).
- "Email ROI is $42 per $1" cited without context (the level is real on aggregate; cited without context it becomes folklore).
- "Content marketing has a 13x ROI" (origin obscure, often vendor-recycled).
- "Companies that blog get 67% more leads" (vintage HubSpot stat, methodology never reproduced).
- "It costs 5x more to acquire a new customer than retain one" (origin: 1990s management consulting folklore, no rigorous basis).
- "The average attention span is now 8 seconds" (Microsoft study from 2015, widely misrepresented).
- Most "growth hack" case studies featuring a single company.

**How to cite:**
> Source: [common attribution if known]. Status: folklore — origin unclear or single-case. Evidence grade: E. **Recommendation: avoid quoting as fact.**

## Decision impact by grade

| Decision evidence grade | Confidence ceiling | Recommendation |
|---|---|---|
| A | High | Cite as fact; build on it |
| B | High (with caveats) | Cite; note sample size and bias if relevant |
| C | Medium-High | Cite; flag as "practitioner consensus, not RCT" |
| D | Medium | Cite; mandatory commercial-bias flag; triangulate before betting budget |
| E | Low | Do not cite as fact; if used, label "folklore" explicitly |

A decision with Confidence High cannot be supported solely by D or E grade evidence. If the only available evidence is D or E, the decision Confidence must be Medium or Low and the user must be told.

## How to grade a new claim

When researching a new claim:

1. **Find the original source.** Not "according to a Forbes article that linked to a HubSpot blog that linked to a survey" — the actual paper, the actual benchmark report, the actual primary source.
2. **Check the methodology.** Sample size, methodology, peer review, replication.
3. **Check who paid for it.** If a vendor commissioned the research, it's D-grade unless triangulated.
4. **Check the date.** A 2018 SEO claim is likely outdated post-AIO. A 2020 Meta-attribution claim is pre-iOS-14.5. Date-stale claims downgrade.
5. **Check the operator scale.** A claim derived from $50M-spend enterprise marketing may not apply to a 12-person startup — note the scope.

## Triangulation protocol

Any D-grade or E-grade claim that influences budget allocation, channel selection, or attribution methodology must be triangulated against at least one independent source before being used as a decision driver:

- D-grade claim + 1 independent corroboration (B or C grade) → upgrade to B.
- D-grade claim + 1 independent contradiction → flag as "vendor-cited, contradicted; do not use as decision driver."
- E-grade claim → never used as decision driver; only as illustrative or rhetorical device with the folklore label.

## Examples of correctly graded claims

### Pre-grading (slop)

> "Studies show that personalized cold email gets 21% reply rates."

### After grading

> "Vendor-promoted: AI cold-email tools claim 21% reply rates from hyper-personalization. **Evidence grade: D.** Commercial bias: high (vendors selling AI cold-email tools). Triangulation: Instantly 2026 industry benchmark shows average B2B cold email reply at ~3.43%; Belkins 16.5M-email analysis confirms the decline trend. Newmail/Sendr/Salesforge research (2026) shows signal-based personalization (real events, not template fills) achieves 15-30% reply rates while superficial template-fill AI personalization achieves 3-4%. **Recommendation: the 21% claim is true only for signal-based AI assistance, not template-fill AI personalization. Use signal-based; treat vendor 21% claim as ceiling under best conditions, not floor.**"

### Pre-grading (slop)

> "Email marketing has a $42 ROI per $1 spent."

### After grading

> "DMA/Litmus annual reports cite aggregate email ROI of $36-$42 per $1. **Evidence grade: B with caveats.** Aggregate includes transactional and behavioral email (which is high-margin), not cold-list marketing. Selection bias: reported by vendors with commercial interest. **Operational reading: owned-audience email is high-ROI because marginal send cost is ~$0 and buyers opted in. The multiplier is real for warm-list flows; the level for any specific operator is unknown without their own data. Klaviyo 2025-2026 benchmarks show flows generate up to 30x revenue per recipient vs campaigns — confirming flow > campaign ratio.**"

## Channel-decay awareness

Channel performance decays. A 2019 Facebook Ads benchmark is not a 2026 Facebook Ads benchmark. A 2021 cold email reply rate is not a 2026 cold email reply rate. When a stat predates a major channel shift, flag it:

- iOS 14.5 ATT (April 2021) — pre/post divide for attribution and Meta CPMs.
- Google AI Overviews rollout (2024-2025) — pre/post divide for SEO CTR.
- HARO shuttering (late 2024) — pre/post divide for PR sourcing.
- Gmail/Yahoo bulk-sender rules (Feb 2024) — pre/post divide for cold email deliverability.
- LinkedIn algorithm shifts (~2023 onward favoring native content over outbound links).
- X/Twitter algorithm changes (post-2022 ownership).
- Meta Andromeda creative system update (2025).

When citing a stat that predates these shifts, write `Pre-[event]; verify current` and grade the stat down one level.

## Summary

| If the source is... | The grade is... |
|---|---|
| Replicated academic research | A |
| Industry-body or large-vendor benchmark (real N, transparent methodology) | B |
| Practitioner consensus across multiple operators | C |
| Vendor-promoted claim (real or unverified) | D |
| Folklore or single-case anecdote | E |

Every decision card, every benchmark, every channel recommendation gets a grade. No exceptions.
