---
name: marketforge-icp-persona
description: Build Ideal Customer Profile + persona definitions using Revella's 5 Rings of Buying Insight as the output format, sourced via JTBD interviews + VOC mining. Produces actionable, language-rich, channel-aware ICPs and personas — NOT demographic cartoons. Use as Phase 1 step 5 of MarketForge full runs.
---

# MarketForge ICP + Persona

Read shared references, especially `_marketforge-shared/templates/icp-template.md` and `_marketforge-shared/templates/persona-template.md`. Apply Revella's 5 Rings as the output format; source the data via JTBD + VOC.

## Global quality rules

- An ICP that says "Marketing Mary, 35, loves yoga" is forbidden. Use specific firmographics, trigger events, customer language.
- Cite N interviews / N reviews / N sales calls in evidence. Hypothesized ICPs are marked Source basis: Assumption.
- Multiple sub-segments → multiple ICPs. Don't collapse into one "average customer."
- Every ICP must connect to channel selection: where do they read / listen / watch / hang out.

## Purpose

Produce:
1. 1-3 ICP definitions (sometimes a primary + secondary).
2. 1-3 persona files per ICP (when sub-segments diverge significantly).
3. Channel-density implications (feed into channel-strategy).
4. Language bank (feed into messaging + copy subskills).
5. Disqualifiers (prevent outbound targeting waste).

## Inputs

- `marketing-brief.md`.
- `jtbd-analysis.md` (preferred — required for evidence-graded ICP).
- `voice-of-customer.md` (preferred).
- `competitive-intel.md` (optional — informs the alternative competitive context).
- SpecForge `docs/app-plan/product/user-roles.md` if present.
- User-supplied ICP hypotheses (treated as Assumption until validated).

## Outputs

- `docs/marketing-plan/01-foundations/icp-and-personas/icp-[slug].md` (per ICP).
- `docs/marketing-plan/01-foundations/icp-and-personas/persona-[slug].md` (per persona).
- DEC-020 through DEC-029 — ICP and persona decisions.
- Updates to `auditability/voc-quotes-bank.md` with persona-labeled quotes.

## When to split into multiple ICPs

Split when ANY of:

- The buying trigger differs materially between segments.
- The competitive alternatives differ between segments.
- The acceptable CAC differs (e.g., self-serve $79/seat vs. enterprise $50K ACV).
- The channels they're reachable on differ.
- The sales cycle differs.

When unsure: split, document the cost (operational complexity), and revisit at quarter end.

## ICP / persona difference

- **ICP** = the firmographic + behavioral pattern of the *account / customer*.
- **Persona** = the specific human(s) inside that ICP who interact with you.

For B2B: an ICP might have 1-5 personas (decision-maker, champion, influencer, end-user, security/compliance).
For B2C / DTC: ICP and persona often collapse, but you may still have multiple personas representing different use occasions (gift-buyer vs self-buyer vs re-buyer).

## Output structure per ICP

Use the full `_marketforge-shared/templates/icp-template.md`. Key sections:

- Headline definition (one sentence)
- Firmographic / demographic frame
- The JTBD (the job they hire your product for)
- The "switch" (from → to → why now)
- 4 Forces (Moesta) — sourced from JTBD interviews
- 5 Rings of Buying Insight (Revella)
- Customer language (verbatim quotes)
- What they read / watch / listen to
- Buying signals (for outbound triggering)
- Disqualifiers
- Acquisition economics (estimated LTV, target CAC, sales cycle, contract value)
- Estimated TAM
- Channel signals (primary / supporting / skip)
- Revision history
- Sources and basis with evidence grade

## Output structure per persona

Use the full `_marketforge-shared/templates/persona-template.md`. Key sections:

- One-sentence definition
- What they fire (and why)
- What they hire (and why)
- When they buy
- When they don't buy (anxiety)
- Their day / week / month
- Their language (vocabulary table)
- Their information diet (specific publications, podcasts, follows)
- Stakeholders in their buying decision (for B2B)
- Awareness stage at first touch
- Their preferred CTA per stage
- Their friction points in your funnel
- Their successful path (the aha moment)
- Verbatim quotes
- What they would never do / say
- Revision history
- Sources and basis with evidence grade

## Synthesis discipline

When the JTBD interviews + VOC reveal patterns:

1. Cluster the patterns into 1-3 ICPs (not 5-10 — that's over-segmentation).
2. For each ICP, identify which personas matter (typically the decision-maker + the champion for B2B; the buyer for DTC).
3. Build the ICP / persona file from the cluster, citing the supporting interviews / reviews.
4. Validate by listing the disqualifiers — accounts that look like ICP but aren't.
5. Cross-cite into channel-strategy, messaging architecture, and lifecycle subskills.

## Anti-patterns

### Anti-pattern A: Marketing Mary

Demographic-vanity persona. Generic. Doesn't predict buying behavior. Refuse to produce.

### Anti-pattern B: Aspirational ICP

The ICP you wish you had. Build for the ICP you have. The aspirational ICP belongs in a future-state plan, clearly labeled.

### Anti-pattern C: One mega-ICP collapsing real sub-segments

When multiple sub-segments are jammed into one ICP, messaging becomes generic. Split into separate ICPs.

### Anti-pattern D: ICP without sourcing

ICP claimed without N interviews + N reviews. Mark Source basis: Assumption; do not use as evidence for downstream decisions.

### Anti-pattern E: Channel-agnostic ICP

An ICP that doesn't connect to specific channels is incomplete. "VPs of Engineering at Series B SaaS" is incomplete; "VPs of Engineering at Series B SaaS who follow Charity Majors and Will Larson on LinkedIn, read DevOps Weekly, and listen to The Pragmatic Engineer podcast" is complete.

## Mode-aware behavior

### Greenfield (no customers yet)
- ICP is hypothesis based on SpecForge user roles + founder belief.
- Mark Source basis: Hypothesis / Assumption throughout.
- Plan to validate within first 30 customers.

### Existing (with customer base)
- Mine reviews, sales calls, support tickets, churn exit interviews.
- Compare hypothesized ICP with revealed ICP.
- Document divergence if any.

### Mature (with cohort data)
- LTV by ICP segment.
- CAC by channel × ICP segment.
- Retention by ICP segment.
- Quarterly ICP review.

## Cross-cites produced

This subskill's outputs are consumed by:

- `marketforge-positioning` (Box 4: customers who care most).
- `marketforge-awareness-stages` (per-persona stage map).
- `marketforge-channel-strategy` (ICP channel density).
- `marketforge-messaging-architecture` (per-persona messaging).
- `marketforge-website-copy` (ICP-specific page versions).
- `marketforge-content-strategy` (ICP-specific content angles).
- `marketforge-paid-search` (ICP-targeted keywords).
- `marketforge-paid-social` (ICP audience targeting).
- `marketforge-cold-email` (ICP target list + signal-based personalization).
- `marketforge-email-lifecycle` (ICP-specific flow segments).
- `marketforge-customer-marketing` (ICP-specific case study targeting).

## Revision triggers

Re-run this subskill (revision mode) when:

- New VOC data reveals an unseen segment.
- Competitive intel reveals competitor heavily serving an audience missed in current ICPs.
- Paid social test data shows dramatically different performance on a sub-segment.
- Pressure-test surfaces a persona gap (cannot defend channel choice).

Per the orchestrator's adaptive-ICP-triggers protocol.

## What we are intentionally NOT doing in this layer

- Building ICPs without source data — when source data is missing, mark as Hypothesis.
- Building demographic cartoons — refuse the pattern.
- Settling on one mega-ICP when sub-segments diverge — split.
- Defining channels — that's `marketforge-channel-strategy`. We surface channel signals only.

## Sources and basis

V3 §2.4 (Buyer personas — Revella vs JTBD), §2.1 (JTBD interviews), §2.3 (Review mining & VOC).
Adele Revella, *Buyer Personas*, 2015. Evidence grade: C.
Moesta JTBD: evidence grade C.
