# Producer / Reconciliation Matrix

When a "producer" event happens (product change, pricing change, ICP shift, positioning pivot, etc.), which downstream MarketForge subskills must re-run in revision mode?

This is the missing matrix flagged by the `full-slice-planner` review of MarketForge: derived marketing state can stale silently when its source-of-truth changes.

## The 14 producer events

These events trigger downstream reconciliation. Each row enumerates the downstream consumers that must re-run.

### Producer 1: New ICP / persona segment discovered

**Source:** VOC mining surfaces unseen segment / competitive intel reveals competitor heavily serving missed audience / paid social test data shows divergent CPM per sub-segment.

**Trigger event:** Add new ICP-NNN, or split existing ICP into two.

**Re-run subskills (in order):**
1. `marketforge-icp-persona` — finalize new ICP definition.
2. `marketforge-positioning` — Box 4 ("customers who care most") may need refinement.
3. `marketforge-awareness-stages` — new persona has its own stage map.
4. `marketforge-messaging-architecture` — new value pillars per new ICP.
5. `marketforge-channel-strategy` — new ICP may unlock new channels.
6. `marketforge-website-copy` — use-case page per new ICP.
7. `marketforge-content-strategy` — content angles per new ICP.
8. `marketforge-paid-search` — keyword expansion for new ICP.
9. `marketforge-paid-social` — audience targeting.
10. `marketforge-cold-email` — outreach list + signal-based personalization for new ICP.
11. `marketforge-email-lifecycle` — segmentation logic update.
12. `marketforge-customer-marketing` — case study targeting.

**Forbidden:** updating only the first 2-3 subskills and leaving the rest stale.

**Verification:** every consuming subskill's output must cite the new ICP-NNN within its decision cards.

---

### Producer 2: Positioning pivot

**Source:** New competitive entrant changes alternative set / product capability shift / market category shift.

**Trigger event:** Supersede positioning DEC card (DEC-008-015 range).

**Re-run subskills:**
1. `marketforge-positioning` — produce superseded DEC card.
2. `marketforge-brand-strategy` — voice may need refinement.
3. `marketforge-messaging-architecture` — value pillars re-anchor.
4. `marketforge-naming-and-tagline` — tagline may need refresh.
5. `marketforge-website-copy` — homepage hero + comparison pages.
6. `marketforge-landing-pages` — campaign LPs.
7. `marketforge-paid-search` — competitor + branded ad copy.
8. `marketforge-paid-social` — creative briefs.
9. `marketforge-cold-email` — value prop in opener.
10. `marketforge-email-lifecycle` — welcome flow + trial-end emails.
11. `marketforge-content-strategy` — POV piece on the new position.
12. `marketforge-launch-plan` — if pivot is significant, re-launch sequence.

**Verification:** new positioning DEC card cross-cited in every consuming subskill within the run.

---

### Producer 3: Pricing change

**Source:** WTP research / margin pressure / competitor pricing shift / strategic decision.

**Trigger event:** Supersede pricing DEC card (DEC-620-629 range).

**Re-run subskills:**
1. `marketforge-pricing-strategy` — produce superseded DEC card.
2. `marketforge-website-copy` — pricing page.
3. `marketforge-landing-pages` — campaign LPs with pricing.
4. `marketforge-paid-search` — branded + competitor copy (price anchoring).
5. `marketforge-paid-social` — creative briefs.
6. `marketforge-cold-email` — value prop math.
7. `marketforge-email-lifecycle` — welcome flow (discount?), trial-end (price reveal).
8. `marketforge-affiliate-program` — commission structure may shift.
9. `marketforge-referral-program` — incentive math.
10. `marketforge-launch-plan` — if pricing change is significant.
11. `marketforge-budget-planning` — unit economics shift.
12. `marketforge-attribution-stack` — LTV recalibration.

**Verification:** all pricing references in marketing-plan/ point to new price; no stale references.

---

### Producer 4: New product feature / major capability launch

**Source:** Product team ships major feature.

**Trigger event:** SpecForge updates `docs/app-plan/product/prd.md`.

**Re-run subskills:**
1. `marketforge-positioning` — Box 2 (unique attributes) may change.
2. `marketforge-messaging-architecture` — new value pillar.
3. `marketforge-website-copy` — feature page; feature-mention on homepage.
4. `marketforge-content-strategy` — POV / blog post on the feature.
5. `marketforge-paid-search` — feature-keyword expansion.
6. `marketforge-paid-social` — creative brief with feature highlight.
7. `marketforge-onboarding-activation` — does feature change aha moment?
8. `marketforge-customer-marketing` — case study angle.
9. `marketforge-email-lifecycle` — feature awareness email.

---

### Producer 5: Channel kills (kill criterion hit)

**Source:** Active channel hits kill criterion in monitoring.

**Trigger event:** Channel marked killed in `portfolio-construction.md`.

**Re-run subskills:**
1. `marketforge-channel-strategy` — re-score; replace killed channel.
2. `marketforge-portfolio-construction` — recalibrate 3-leg model.
3. `marketforge-budget-planning` — re-allocate budget.
4. `marketforge-execution-calendar` — remove killed-channel actions; add replacement.

**Verification:** no remaining activity in killed channel; replacement channel has decision card.

---

### Producer 6: Budget tier shift

**Source:** Funding round / margin improvement / strategic decision to scale or contract.

**Trigger event:** T1 → T2 → T3 transition (or down-tier).

**Re-run subskills:**
1. `marketforge-budget-planning` — re-allocate.
2. `marketforge-channel-strategy` — new channels viable at higher tier; some deprecate at lower tier.
3. `marketforge-portfolio-construction` — adjust 3-leg.
4. `marketforge-brand-vs-performance` — re-calibrate split per new ARR / stage.
5. `marketforge-paid-search`, `marketforge-paid-social`, `marketforge-paid-mobile` — adjust spend ranges.
6. `marketforge-influencer-program`, `marketforge-affiliate-program` — viability at new tier.
7. `marketforge-direct-mail-abm` — viability at new tier.
8. `marketforge-mmm-incrementality` — at T3+, MMM becomes feasible.

---

### Producer 7: Stage transition (PMF → scaling → mature)

**Source:** ARR threshold crossed / retention data confirms PMF / mature operations established.

**Trigger event:** Stage field in `marketing-brief.md` updates.

**Re-run subskills:**
1. `marketforge-readiness-check` — re-evaluate gates.
2. `marketforge-channel-strategy` — pre-PMF vs post-PMF channels differ.
3. `marketforge-brand-vs-performance` — split shifts toward brand at scale.
4. `marketforge-okr-quarterly-planning` — bets may pivot.
5. `marketforge-attribution-stack` — at scale, triangulation must add geo holdouts.
6. `marketforge-mmm-incrementality` — at $50K+/mo spend, MMM unlocked.

---

### Producer 8: ICP retention deterioration

**Source:** Cohort retention curve drops below threshold for a specific ICP.

**Trigger event:** `retention-churn.md` flags deteriorating cohort.

**Re-run subskills:**
1. `marketforge-readiness-check` — Gate 2 (retention) may now fail.
2. `marketforge-channel-strategy` — pause paid acquisition on this ICP until retention fixes.
3. `marketforge-onboarding-activation` — likely root cause; re-evaluate aha moment.
4. `marketforge-retention-churn` — investigate churn reasons.
5. `marketforge-customer-marketing` — re-evaluate case study targeting (don't promote churned segment).

---

### Producer 9: Voice / brand-strategy refresh

**Source:** Brand pivot / new founder content discipline / new design system (VisualForge update).

**Trigger event:** Supersede brand-strategy DEC cards (DEC-100-109).

**Re-run subskills:**
1. `marketforge-brand-strategy` — produce superseded DEC card.
2. `marketforge-messaging-architecture` — voice + tone.
3. `marketforge-distinctive-assets` — DBA alignment.
4. `marketforge-website-copy`, `marketforge-landing-pages`, `marketforge-content-strategy`, `marketforge-email-lifecycle`, `marketforge-cold-email`, `marketforge-linkedin-organic`, `marketforge-x-twitter-organic`, `marketforge-founder-content` — voice consistency.
5. `marketforge-visual-direction` — refresh brief.
6. `marketforge-ad-creative-brief` — voice in ad copy.

---

### Producer 10: Regulatory / compliance event

**Source:** New regulation (e.g., new state SMS law, AI-disclosure update, FTC guidance).

**Trigger event:** Compliance lead flags.

**Re-run subskills (relevant ones):**
1. `marketforge-sms-program` — TCPA + state laws update.
2. `marketforge-cold-email` — CAN-SPAM / GDPR / UK PECR refresh.
3. `marketforge-ad-creative-brief` + `marketforge-ad-creative-production` — AI-disclosure (Meta March 2026).
4. `marketforge-influencer-program` — FTC update.
5. `marketforge-bias-audit` — re-scan for newly-stale claims.

---

### Producer 11: AI-saturation cycle update

**Source:** New saturation cycle detected (e.g., AI ad creative saturating, AI-customer-research saturating).

**Trigger event:** Update to `ai-saturation-watch.md`.

**Re-run subskills (relevant ones):**
1. Whichever subskill relied on the now-saturating tactic.
2. `marketforge-pressure-test` — flag the saturated tactic.
3. `marketforge-bias-audit` — re-evaluate vendor claims tied to the tactic.

---

### Producer 12: Channel decay event

**Source:** Major channel shift (e.g., new iOS privacy update, new Google algorithm update, new platform sunset).

**Trigger event:** Documented in `evidence-grading-rubric.md` channel-decay section.

**Re-run subskills:**
1. Whichever subskill relied on the now-decayed channel.
2. `marketforge-attribution-stack` — re-evaluate triangulation.
3. `marketforge-channel-strategy` — re-score.
4. `marketforge-budget-planning` — re-allocate.

---

### Producer 13: Competitive landscape shift

**Source:** Competitor acquisition / major competitor launch / new competitor entry.

**Trigger event:** `competitive-intel.md` flags material change.

**Re-run subskills:**
1. `marketforge-competitive-intel` — refresh.
2. `marketforge-positioning` — Box 1 (alternatives) may need refresh.
3. `marketforge-website-copy` — comparison pages.
4. `marketforge-paid-search` — competitor terms.

---

### Producer 14: Strategic decision override (founder / leadership)

**Source:** Founder decides to override a MarketForge recommendation.

**Trigger event:** `> override DEC-NNN to "[new direction]"`.

**Re-run subskills:**
- Per the cascade defined in DEC-NNN's "Cross-cites produced" field.
- The overriding DEC supersedes; all consumers re-run in revision mode.

---

## How to apply this matrix

When a producer event happens:

1. Identify the producer event from the 14 above.
2. Read the "Re-run subskills" list.
3. Invoke each subskill in revision mode (passing the new evidence as input).
4. Log the cascade in `auditability/cascade-log.md`.
5. Run `marketforge-marketing-qa` against the affected outputs.
6. Run `marketforge-pressure-test` if the cascade is material (>5 subskills affected).

## What this prevents

- ICP changes that don't propagate to copy → drift.
- Pricing changes that don't reach the pricing page → wrong prices live.
- Positioning pivots where only the homepage is updated → cold email still uses old position.
- Channel kills where the killed channel still has actions in the execution calendar.

## Validator support

`scripts/validate_marketing_docs.py` should flag:
- Stale cross-cites (consumer subskill cites superseded DEC card without referencing the supersession).
- Orphan DEC cards (created but no downstream consumer).
- Missing cascade entries when a producer DEC is superseded.

## Sources and basis

- `full-slice-planner` producer-reconciliation matrix methodology.
- V3 Marketing Guide §7-8 (Lifecycle + Measurement) — retention deterioration triggers.
