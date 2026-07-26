# Commercial Bias Map

The marketing industry is densely commercial. Most widely-circulated frameworks, benchmarks, and "best practices" are promoted by vendors with a commercial interest in widespread belief. This map identifies the most common biases so MarketForge can cite while flagging.

The rule: **flag commercial bias inline, gently, when citing. Do not lecture.**

## How to flag inline

Acceptable:
> "Klaviyo 2025-2026 benchmarks report flow-driven email generates up to 30x revenue per recipient vs campaigns (vendor-cited; Klaviyo sells the platform — corroborated by independent ecom operators)."

Acceptable:
> "Refine Labs found podcast was attributed to 53% of revenue via self-report but 0% via software attribution — the 'attribution mirage' (Refine Labs is a B2B services vendor selling demand-creation; their thesis is commercially aligned; the underlying observation is consistent with independent attribution research)."

Not acceptable (over-bias-flagging):
> "Klaviyo claims their tool drives 30x revenue but Klaviyo sells the tool so this claim is suspect and should be dismissed."

The goal is not to dismiss vendor data — most of it is real. The goal is to ensure the reader understands the commercial context.

## The bias map

### Framework / claim → who benefits if widely believed

| Framework / claim | Who benefits | Bias level | Triangulation status |
|---|---|---|---|
| 60/40 brand/performance split (Binet & Field) | Agencies selling brand work; LinkedIn B2B Institute (sells reach) | Medium | Disputed by Byron Sharp; B2B refinement shifted to 46/54; pre-PMF data shows 80-100% performance for early-stage |
| 95-5 rule (Dawes / EB) | LinkedIn (sells reach); brand-side agencies | Medium | NetLine 2024 shows 35.2% in market within 12 months; "95" is heuristic, not literal |
| "Creative is the new targeting" | Meta (deflects algorithm criticism) | High | Half-true — creative diversity matters; framing is commercially convenient |
| GEO/LLMO is essential now | Profound, Otterly, Peec AI, Goodie (sell GEO measurement tools) | High | Cited-source visibility does correlate with traffic but ROI claims (e.g., "23x conversion") are from one vendor's internal data |
| Cold email reply rates "stable" | Cold email tool vendors (Instantly, Smartlead, Apollo) | High | Industry data (Instantly 2026 benchmark itself) shows reply rates dropped 8.5% → 3.43% from 2019-2026; vendor marketing often hides this |
| Direct mail response is 4.4% (37x email) | Sendoso, PFL, ANA/DMA (DMA is industry body but member-funded) | Medium | Real for ABM dimensional mailers; doesn't generalize to broad-list mail at small scale |
| Influencer marketing X% ROI | Influencer agencies, micro-influencer platforms | High | Fake-influencer problem (15-30% bot follower bases) means many ROI claims are inflated; verify with engagement-to-follower ratio |
| Programmatic display works | DSPs, ad networks | High | Bob Hoffman's well-documented critique: much programmatic spend is fraud, bot traffic, low viewability |
| ABM is essential | 6sense, Demandbase (ABM platforms) | High | True at $50K+ ACV with named targets; theater at SMB SaaS scale |
| "Content / SEO is dead" | LLM SEO tool vendors, GEO platform vendors | Medium | Transformed, not dead; bottom-funnel SEO still works; vendor framing serves the new tools they sell |
| AI cold email = 21% replies | AI cold email tool vendors | High | Saturation collapse: signal-based hits 15-30%, template-fill AI hits 3-4% |
| Community-acquired customers show 33% higher LTV | ProfitWell (Patrick Campbell) — sells subscription analytics; community tooling vendors | Medium | Plausible but ProfitWell-internal; not independently replicated |
| Refine Labs attribution mirage data (53%/0% podcast attribution) | Refine Labs — sells demand-creation services | Medium | The directional observation matches independent practitioner experience; the specific number is one client cohort |
| PartnerStack network statistics ($2.7B GMV, 52% YoY growth) | PartnerStack — sells affiliate platform | Medium | Real network data but PartnerStack-internal; affiliate-channel ROI generalization unclear |
| "AI search visitors convert 23x better" (Ryan Law / Ahrefs) | Ahrefs — sells SEO tooling | High | One company's internal data; not generalizable; the post was deleted but math was confirmed |
| Klaviyo flow vs campaign benchmarks | Klaviyo — sells the platform | Medium | Real benchmarks; vendor adjacency; methodology transparent |
| Spark Ads outperform standard TikTok Ads | TikTok — sells Spark Ads | Medium | Plausibly true; vendor-promoted; few independent comparisons |
| "Most A/B tests find winners" | A/B testing platforms (Optimizely, VWO, Convert) | High | CXL research: only 10-20% of properly-powered tests yield real winners |
| Email marketing $42 ROI | DMA/Litmus | Medium | Aggregate true; misleading for cold lists; selection bias on respondents |
| Sendoso ABM gift-mailing ROI claims | Sendoso | High | Real for $25K+ ACV ABM; aggressively promoted for broader use cases |
| ASA outperforms UAC for subscription apps | SplitMetrics (ASA optimization vendor), AppTweak | Medium | Real for iOS-heavy mature acquisition; commercial alignment |
| "PMax delivers efficient growth" | Google | High | Often steals credit from organic + brand search; opaque |
| Meta Advantage+ is the default | Meta | Medium | Reasonable default for new accounts; commercially aligned |
| StoryBrand framework | Donald Miller / StoryBrand consultancy | Medium | Useful framework; oversimplifies B2B and PLG; commercially promoted to small businesses as universal answer |
| "Buyers need 7 touchpoints" / "Rule of 7" | Marketing service vendors (justifies multi-touch retainers) | High | Folklore; varies massively by category |
| "5-star reviews maximize conversion" | Review platforms whose ratings algorithms reward 5-star | Medium | Spiegel research: 4.0-4.7 outperforms 5.0; 46% distrust perfect ratings |

## Bias levels defined

- **High bias:** The claim originates from a vendor who directly profits from widespread adoption of the claim or who has gatekeeper status on the underlying data. Triangulate against independent sources before betting decisions on it.
- **Medium bias:** The claim originates from an institution or vendor adjacent to the activity, but the underlying data is auditable or methodology is transparent. Note the bias; use with caveat.
- **Low bias:** The claim is from a vendor or institution where commercial alignment is minor or the data is publicly verifiable. Note the source; treat as credible.
- **None:** Independent academic research, government data, or independent third-party measurement.

## When to NOT flag bias

Some vendor data is essentially the ground truth (no other source exists), and the methodology is transparent:

- Klaviyo flow vs campaign comparisons (Klaviyo is largest data source for ecom email; methodology disclosed)
- SplitMetrics ASA benchmarks (industry-standard data source)
- Meta / Google / TikTok platform-reported CPM averages (the platforms are the only source)
- Apple Developer documentation on iOS features

In these cases, cite the source by name without an explicit bias flag — the reader understands the source is the vendor itself. Where there's genuine commercial bias in the framing or interpretation (not just the data), flag it.

## Bias and the user

When a user references a framework you suspect they got from a vendor blog:

- Don't lecture.
- Acknowledge the framework, cite the source, note the bias gently.
- Recommend triangulation if budget will follow the claim.
- Offer the independent counter-evidence if it exists.

Example user-facing wording:

> "The 60/40 brand/performance rule comes from Binet & Field's IPA Effectiveness Awards data — useful but the dataset is award submissions (selection bias) and the original work pre-dates iOS 14.5. Byron Sharp publicly disputed the 60/40 framework. For a pre-PMF SaaS at <$500K ARR, 80-100% performance is the better call until referrals appear. We'll revisit at $5M ARR."

This respects the user's existing knowledge, names the bias, and gives an actionable recommendation.

## Maintenance

This map should be updated when:

- A new vendor framework becomes widely promoted.
- Independent triangulation either confirms or contradicts a vendor claim.
- A major channel or platform shift changes which vendors have commercial alignment.

Track changes in `auditability/bias-map-revisions.md` with date and rationale.
