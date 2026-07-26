# Trust Harness Protocol

Adapted from the `golden-mutation-trust-harness` skill (Anthropic) for marketing-plan output.

> The default posture is skeptical: a passing test is only useful after proving it would fail for the right wrongness.

## Why this exists

MarketForge produces marketing-plan documents. The validator catches slop. But that's only one oracle. Trust harness asks: **"If I mutate the source-of-truth (positioning DEC, pricing DEC, ICP DEC), does the downstream marketing output actually change?"**

Without this harness:
- A subskill could silently fail and produce no output → validator scans nothing → green pass.
- Website copy could quote a stale positioning version → no oracle catches.
- An ICP supersession could fail to cascade → downstream consumers still cite the old definition → no detection.

## Trust questions for MarketForge

Restate the user outcome in plain language before building:

1. **Will marketing decisions reach final user-visible output unchanged?**
   - When `marketforge-positioning` produces DEC-008, does the website hero copy reflect it?
   - When `marketforge-icp-persona` defines ICP-002, does the ad creative target that ICP?
   - When `marketforge-pricing-strategy` sets $129/seat, does the pricing page show $129?

2. **Will marketing decisions stay honest under stress?**
   - When readiness check is 4/7, are paid subskills BLOCKED?
   - When budget is T1, are T3-only channels excluded?
   - When stage is Unaware, is the CTA NOT "Buy now"?

3. **Will marketing decisions resist drift over time?**
   - When the V3 guide is updated, do downstream claims update?
   - When a producer DEC is superseded, are consumers re-run?
   - When AI saturation watch updates, are saturated tactics removed?

## Source authority

For marketing-plan output, the source authority is:

| Authority | Lives at | Who can update |
|---|---|---|
| V3 Marketing Guide | `docs/MARKETING_GUIDE_V3.md` | Quarterly refresh |
| DEC-NNN cards | `decision-log.md` + subskill outputs | Supersession protocol only |
| VOC verbatim quotes | `voice-of-customer.md` | Append from interviews |
| ICP definitions | `icp-and-personas/icp-NNN.md` | Revision-mode pass |
| Positioning | `positioning.md` | Revision-mode pass |
| Brand voice | `brand-strategy.md` | Revision-mode pass |
| Pricing | `pricing-strategy.md` | Pricing decision |
| Channel scoring | `channel-strategy.md` | Quarterly re-score |

**Forbidden authorities** (must not become accidental source-of-truth):
- AI-generated copy without DEC card backing.
- "Best practices" sections (banned).
- Founder gut feel without DEC card capture.
- Vendor-promoted claims without bias flag + triangulation.

## Blast radius inventory

For any marketing-plan claim, identify every consumer:

| Producer | Producer file | Downstream consumers |
|---|---|---|
| ICP (DEC-020-029) | `icp-and-personas/` | website-copy, paid-search, paid-social, cold-email, content-strategy, awareness-stages, messaging-architecture, lifecycle-email, customer-marketing (~12 subskills) |
| Positioning (DEC-008-015) | `positioning.md` | website-copy, messaging-architecture, paid-search ads, paid-social creative, cold-email value prop, landing-pages, content-strategy (~12 subskills) |
| Pricing (DEC-620-629) | `pricing-strategy.md` | website-copy (pricing page), landing-pages, paid-search, email-lifecycle, affiliate-program, referral-program (~6 subskills) |
| Brand voice (DEC-100-109) | `brand-strategy.md` | every copy-producing subskill (~15 subskills) |
| Channel allocation (DEC-070-079) | `portfolio-construction.md` | budget-planning, every channel subskill, execution-calendar (~10 subskills) |

See `producer-reconciliation-matrix.md` for the complete 14 producer events with cascade.

## Golden fixture design

A golden marketing plan must include:

### Multiple ICPs with different stories
- **ICP-001 (strong fit):** B2B SaaS PLG, $79/seat, healthy retention, clear positioning.
- **ICP-002 (struggling):** Adjacent segment with weaker fit but viable; lower D30 retention; different channels.
- **ICP-003 (sparse data):** New segment with only 5 customers; readiness gate fails for paid acquisition.

### Multiple channels at different lifecycle states
- **Compound channel (mature):** SEO bottom-funnel, 12 months in, showing compound traffic curve.
- **Harvest channel (working):** Paid search competitor terms, $2K/mo, 3:1 LTV:CAC.
- **Harvest channel (struggling):** Paid social Meta, CPM rising, kill criterion approaching.
- **Wildcard (testing):** TikTok organic, 60 days in, no signal yet.

### Edge cases
- Channel that hits kill criterion (must propose replacement).
- Positioning decision marked Confidence: Low (must escalate).
- D-grade citation with bias flag and triangulation.
- D-grade citation WITHOUT bias flag → must be caught.
- Stage-CTA mismatch on one page → must be caught.
- Cross-cite to nonexistent DEC → must be caught.
- Compound channel with paid-window kill → must be caught.

## Expected-values contract

Every visible claim mapped to:

| Visible claim | Source authority | Path in docs | UI / output location | Mutation that must break it |
|---|---|---|---|---|
| Homepage hero "Cut close from 8 days to 3" | DEC-014 (VOC quote) | `website-copy/homepage.md` | hero section | Change VOC quote → mutation must surface |
| Pricing page "$129/seat" | DEC-622 (pricing) | `website-copy/pricing.md` | pricing tiers | Change pricing DEC → pricing page must reflect |
| Cold email opener references "[Company] hired Director of Demand Gen" | DEC-360 (signal-based) + DEC-020 (ICP) | `cold-email-system.md` | email sequences | Change ICP → trigger must update |
| ASA budget 65% of mobile | DEC-052 (paid-mobile allocation) | `paid-mobile.md` | budget table | Change allocation → budget table must reflect |
| Channel "Bottom-funnel SEO" listed as Compound leg | DEC-072 (portfolio) | `portfolio-construction.md` | 3-leg table | Move to Harvest → portfolio must reflect |

Each row: at least one mutation that should break or change it.

## Harness architecture

### Oracles (independent)

1. **DB oracle** (for marketing-plan: file-system oracle) — exact files exist, decision-log.md matches DEC declarations in subskill outputs.
2. **API oracle** (n/a for doc skill; conceptually: validate cross-cite integrity).
3. **UI oracle** (conceptually: validator scans final consumer files for source-authority references).
4. **Export/report oracle** (validator scans for slop, bias flags, evidence grades).
5. **Role oracle** (n/a for marketing-plan; would apply if multi-user MarketForge).
6. **Inventory oracle** (self-test verifies all subskills exist; producer-reconciliation matrix verifies cascade).
7. **Mutation oracle** (mutation suite proves downstream changes when source changes).

For marketing-plan, these collapse into specific validators:

| Oracle | Implementation | Catches |
|---|---|---|
| Cross-cite oracle | validate_marketing_docs.py `--final` | Consumer references producer DEC that exists |
| Stale-supersession oracle | NEW validator | Consumer references superseded DEC without revision |
| Kill-criterion oracle | NEW validator | Every channel has kill criterion + window matches channel type |
| Concentration-risk oracle | NEW validator | No single channel >50% allocation |
| Stage-presence oracle | NEW validator | Every page/ad/email declares awareness stage |
| Bias-flag oracle | NEW validator | D-grade citations have commercial-bias flag |
| Producer-reconciliation oracle | NEW test | When DEC-X is superseded, every cited consumer marked stale |
| Required-section oracle | existing | Every subskill output has "What we are intentionally NOT doing" + "Sources and basis" |
| Anti-slop oracle | existing | No banned phrases / AI cadence / stale references |

## Mutation suite (realistic wrongness)

### Mutation 1: ICP definition change
- **Setup:** ICP-002 cited by 12 consumer subskills.
- **Mutation:** Supersede ICP-002 with materially different ICP (firmographic shift).
- **Expected before mutation runs:** 12 consumers cite old ICP-002 correctly.
- **Expected after mutation runs:** 12 consumers either updated OR flagged STALE.
- **Oracle:** stale-supersession + producer-reconciliation oracles.

### Mutation 2: Pricing change
- **Setup:** $79/seat in DEC-622; pricing page, landing pages, paid ads, lifecycle email all cite.
- **Mutation:** Change pricing to $129/seat (supersede).
- **Expected:** All consumers reflect $129 OR flagged STALE.

### Mutation 3: Positioning pivot
- **Setup:** Positioning DEC-008-015 cited by 12 consumers.
- **Mutation:** Supersede with new positioning.
- **Expected:** All 12 reflect new positioning OR flagged STALE.

### Mutation 4: Stage-CTA drift
- **Setup:** Landing page declares Problem-aware + CTA = "Take the diagnostic."
- **Mutation:** Change CTA to "Start free trial" (Most-aware CTA).
- **Expected:** Stage-CTA oracle catches mismatch.

### Mutation 5: Concentration-risk introduction
- **Setup:** 3-leg portfolio: 35/30/25/10 budget split.
- **Mutation:** Rewrite to 60/20/15/5.
- **Expected:** Concentration-risk oracle catches >50%.

### Mutation 6: Banned phrase injection
- **Setup:** Clean website copy.
- **Mutation:** Add "leverage our world-class platform."
- **Expected:** Anti-slop oracle catches BLOCK.

### Mutation 7: Missing kill criterion
- **Setup:** Channel with documented kill + reversal + window.
- **Mutation:** Remove kill criterion.
- **Expected:** Kill-criterion oracle catches.

### Mutation 8: D-grade claim without bias flag
- **Setup:** Clean evidence grading throughout.
- **Mutation:** Add "Profound 2026 shows 23x lift (evidence D)" without bias flag.
- **Expected:** Bias-flag oracle catches.

### Mutation 9: Window-type mismatch
- **Setup:** Compound channel (SEO) with 6-month kill window.
- **Mutation:** Change to 30-day window (paid-channel window applied to compound).
- **Expected:** Window-type oracle catches.

### Mutation 10: Missing awareness stage declaration
- **Setup:** Every page/ad declares stage.
- **Mutation:** Remove stage declaration from a page.
- **Expected:** Stage-presence oracle catches.

### Mutation 11: Cross-cite to nonexistent DEC
- **Setup:** Consumer cites DEC-008.
- **Mutation:** Consumer cites DEC-999 (does not exist).
- **Expected:** Cross-cite oracle catches.

### Mutation 12: Producer replay — supersession-cascade test
- **Setup:** ICP-001 in golden fixture, 12 consumers correctly cite it.
- **Mutation:** Add a NEW ICP-001 supersession card (`Status: Superseded by ICP-NNN`).
- **Expected:** Every consumer that still cites old ICP-001 must be flagged as having a stale reference, AND `producer-reconciliation-matrix.md` cascade for "new ICP discovered" must be invokable.
- **This is the most important mutation:** it proves the producer-reconciliation matrix is operational, not just documentation.

## Verification gates

For each mutation, run:
1. Apply mutation.
2. Run `validate_marketing_docs.py --final --strict`.
3. Verify expected oracle fires.
4. Verify expected output change OR stale-detection.
5. Restore baseline.

If any mutation fails to surface, the harness is vacuous — fix at root.

## Residual risk

This harness does NOT prove:
- Live customer interview transcripts (we use canonical fixtures).
- Live ad-platform performance (we use historical benchmarks).
- Live AI semantic judgment quality (we use evidence-graded references).
- Production marketing campaign outcomes (we produce plans, not execute).
- Cross-channel attribution in the field (we produce attribution stack design, not attribution data).

These are explicitly documented as residual risk in `auditability/residual-risk.md` after every run.

## Pressure-test passes (distrust the green run)

After the trust harness passes, ask:

1. **Liveness check:** Could the mutation pass if the consumer subskill never produced any output? (If `marketforge-website-copy` produced zero copy, no mutation would fire on its output.)
2. **Positive/negative pairing:** Every "does not contain banned phrase" assertion paired with "does contain expected source-of-truth reference."
3. **Wrong-source check:** Could the consumer copy be reading from "best practices" instead of the producer DEC?
4. **Mutation adequacy:** Did the mutation actually touch the persisted DEC card the consumer reads?
5. **Threshold check:** Do fixture sample sizes (number of consumer subskills cited) clear the test's denominator?
6. **Timestamp check:** Is the latest DEC unambiguous? No tied supersession dates?
7. **Visual reality check:** Did the harness inspect the actual output file content, or only the file's existence?
8. **Surface inventory check:** Is any subskill output unowned by an oracle?
9. **Failure-mode check:** If the consumer subskill failed silently, does the harness fail closed?

## When to invoke

The trust harness runs at:
- **Phase 11 step 7** (after pressure-test, before agent-rules-update).
- **Quarterly** (full mutation suite re-run against latest marketing plan).
- **On producer-DEC supersession** (cascade-specific validation).

## Sources and basis

- `golden-mutation-trust-harness` skill methodology (Anthropic, adapted).
- `producer-reconciliation-matrix.md` (operational backbone).
- V3 Marketing Guide §8 (Measurement & Attribution — the rigor model).
