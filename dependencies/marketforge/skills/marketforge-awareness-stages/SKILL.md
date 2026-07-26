---
name: marketforge-awareness-stages
description: Map the customer awareness journey using Schwartz's 5 stages (Unaware → Problem-aware → Solution-aware → Product-aware → Most aware). Match copy + CTA to stage. Most landing page failures are stage mismatches, not copy quality. Use as Phase 1 step 7 of MarketForge full runs.
---

# MarketForge Awareness Stages

Read shared references, especially `_marketforge-shared/templates/message-stage-matrix-template.md`. Apply Eugene Schwartz's *Breakthrough Advertising* (1966) framework.

## Global quality rules

- Every page, ad, email, and CTA must declare its target awareness stage.
- Copy that addresses a stage above the visitor's current stage converts at ~0. This is the #1 root cause of landing-page underperformance.
- A page that has to serve multiple stages (e.g., homepage) must have layered copy: above-the-fold for Most-aware, sections below for Product/Solution/Problem-aware visitors.
- Stage assignment is per-touchpoint, not per-product.

## Purpose

Produce:
1. A per-channel + per-page awareness stage map.
2. The message × stage matrix specific to this product.
3. Stage-appropriate CTA recommendations per surface.
4. Stage-mismatch audit findings on any existing pages/ads.

## Inputs

- `icp-and-personas/persona-*.md` files (each persona has stage at first touch).
- `positioning.md`.
- `jtbd-analysis.md` (the customers' stage when they first heard of you, from interviews).
- `voice-of-customer.md`.
- Current website pages + ad accounts if Mode B/C.
- Channel candidate list from channel-strategy or business-model-channel-fit.

## Outputs

- `docs/marketing-plan/01-foundations/awareness-stages.md`
- DEC-040 through DEC-049 — awareness-stage decisions per major surface

## Output structure

Use the full `_marketforge-shared/templates/message-stage-matrix-template.md` structure. Customize per the product's specific stages, channels, and personas.

Key sections:

```markdown
# Awareness Stages

## The 5 stages applied to [Product]

### Unaware
- **Their state in our context:** [specific to this ICP]
- **Where they encounter us (channels):**
- **What converts at this stage (copy direction + CTA):**
- **What backfires:**

### Problem-aware
[Similar structure]

### Solution-aware
[Similar structure]

### Product-aware
[Similar structure]

### Most aware
[Similar structure]

## Channel × stage map
[Table mapping each candidate / active channel to typical visitor stage]

## Per-page stage assignment

### Homepage
- **Primary stage served:** [usually Product/Solution-aware]
- **Secondary stages served (in sections below the fold):** [Problem-aware, sometimes Most-aware via pricing link]
- **Above-the-fold CTA:** [stage-appropriate]
- **Below-the-fold CTAs:** [stage-appropriate]

### Pricing page
- **Primary stage:** Most-aware / Product-aware
- **CTA:** Buy / Trial / Talk-to-sales

### Comparison pages ("[Competitor] alternative")
- **Primary stage:** Solution-aware / Product-aware
- **CTA:** Compare / Trial / Talk-to-sales

### Blog / POV content
- **Primary stage:** Problem-aware / Solution-aware
- **CTA:** Subscribe / Read related / Download framework

### Landing pages (campaign-specific)
- **Primary stage:** depends on traffic source (cold paid = Unaware/Problem-aware)
- **CTA:** stage-matched

## Per-ad-campaign stage assignment

### Paid search — branded
- **Stage:** Most aware
- **CTA:** Buy / Trial

### Paid search — competitor
- **Stage:** Solution-aware / Product-aware
- **CTA:** See how we compare / Trial

### Paid search — category
- **Stage:** Problem/Solution-aware
- **CTA:** Diagnostic / Read POV

### Paid social cold (Meta / TikTok)
- **Stage:** Unaware / Problem-aware
- **CTA:** Diagnostic / Subscribe / Read

### Retargeting
- **Stage:** Product-aware
- **CTA:** Trial / Comparison

## Per-email-flow stage assignment
[Welcome / Browse / Cart / Trial-end / Win-back each mapped to stage]

## Existing-surface audit (Mode B/C only)
[For each current page or ad, was it stage-matched? Findings.]

- [Page X]: Currently serves Most-aware CTA to Unaware traffic from paid social. → BLOCK. Recommended fix: produce diagnostic landing page; route paid social to it.
- [Ad Y]: "Sign up free" CTA on cold prospecting audience. → BLOCK. Recommended fix: rewrite CTA to diagnostic.

## Decision cards
[DEC-040 to DEC-049]

## What we are intentionally NOT doing in this layer
- Writing the copy — that's marketforge-website-copy and marketforge-ad-creative-brief.
- Assigning channels — that's marketforge-channel-strategy.
- Fixing single-page stage mismatches — that's queued for the appropriate copy subskill.

## Sources and basis

V3 §1.3 (Awareness stages — Schwartz).
Eugene Schwartz, *Breakthrough Advertising*, 1966. Evidence grade: C/E (foundational practitioner framework with strong predictive value; RCT-testing limited).
```

## Cross-cites consumed (must cite by ID)

- DEC-008-015 (positioning) — Box 4 customers who care most.
- DEC-016-019 (JTBD) — trigger events and stage at first touch.
- DEC-020-029 (ICP / personas) — per-persona stage at first touch.

## Cross-cites produced

- `marketforge-website-copy` (every page's target stage).
- `marketforge-landing-pages` (every campaign LP).
- `marketforge-paid-search` (keyword bucket → stage mapping).
- `marketforge-paid-social` (audience → stage mapping).
- `marketforge-cold-email` (signal-based personalization → stage).
- `marketforge-email-lifecycle` (each flow's stage).
- `marketforge-content-strategy` (content pieces' stage).

## Anti-patterns

### Anti-pattern A: One-size-fits-all CTA across surfaces
"Start free trial" everywhere — converts well on Product-aware pricing page, converts at 0 on Unaware cold paid social.

### Anti-pattern B: "Awareness funnel" theater
Talking about awareness stages but not mapping them to specific surfaces / campaigns. Stage-mapping must be operational.

### Anti-pattern C: Mistaking awareness for funnel stage
Awareness ≠ funnel stage. A Most-aware visitor on a brand-loyal repeat purchase is also at the bottom of the funnel; a Most-aware visitor on a competitor displacement is at the bottom of a different funnel. Awareness is about cognitive state; funnel is about purchase progress.

## What we are intentionally NOT doing in this layer

- Mapping every micro-touchpoint — focus on the high-leverage surfaces (homepage, pricing, top ad campaigns, top lifecycle emails).
- Producing copy — that's downstream subskills.
- Skipping the audit on existing surfaces in Mode B/C — that's where the biggest quick wins live.

## Sources and basis

V3 §1.3. Schwartz, *Breakthrough Advertising*, 1966.
