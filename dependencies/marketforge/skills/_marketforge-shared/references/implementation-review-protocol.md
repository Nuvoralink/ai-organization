# Implementation Review Protocol

Adapted from the `implementation-review-against-plan` skill (Anthropic) for marketing-domain output.

Use this AFTER MarketForge produces output, BEFORE declaring the marketing plan ready. Verify the implementation made the intended marketing truth real. Do not stop at "the docs exist."

## Review Goal

The accepted source of truth (V3 guide section + DEC cards + ICP definition + positioning + brand voice) must reach the final marketing output (website copy / ad copy / email body / social post / sales script) AND the validation must prove the right behavior — not just that helpers exist.

## Workflow

### Step 1: Restate the original marketing intent

What did the user actually want? Not "I want marketing" — specifically: who do they want to acquire, at what cost, by when, with what positioning, on what channels?

If you cannot answer in 2 sentences, the plan is not ready for review.

### Step 2: Map the plan phases to actual produced files

For each declared phase in the orchestrator, identify which files were produced. Are they all there? Are they the right size / quality? Did the orchestrator silently skip subskills?

### Step 3: Trace the implemented path end-to-end

The marketing source-of-truth path:

```
ICP / persona / VOC (PHASE 1)
  → positioning + awareness stages (PHASE 1)
    → messaging architecture (PHASE 3)
      → website copy / ad copy / email copy (PHASES 4-8)
        → visual assets (PHASE 10)
          → execution calendar (PHASE 11)
            → KPI dashboard (PHASE 9)
              → attribution stack (PHASE 9)
```

For every consumer subskill output, verify it cites the source DEC-NNN. If the website copy says "for modern teams" but no positioning DEC card mentions "modern teams," there's drift.

### Step 4: Check each phase definition of done

For each phase, the DoD is:

- **Phase 1 (Foundation):** Discovery + readiness + VOC + JTBD + ICP + positioning + awareness + competitive complete. Readiness gate result documented.
- **Phase 2 (Strategy):** 3-leg portfolio selected. Budget allocated. OKRs locked. Channels scored against 7-factor matrix.
- **Phase 3 (Brand):** Voice + messaging + naming + DBA + narrative consistent.
- **Phase 4 (Website + Content):** Every page declares awareness stage. Cross-cites positioning. Calendar produced.
- **Phase 5 (Paid):** Each channel decision card has kill criterion + reversal trigger + test window.
- **Phase 6 (Outbound):** Deliverability infrastructure documented. Signal-based personalization (NOT template-fill AI).
- **Phase 7 (Organic / Social):** Founder voice anchored. Saturation-watch applied.
- **Phase 8 (Lifecycle):** Flows designed (not just campaigns). Apple MPP awareness for emails.
- **Phase 9 (CRO + Measurement):** Triangulation stack in place. NOT single-source attribution.
- **Phase 10 (Visual):** All briefs cite VisualForge tokens (when present) or marketforge-distinctive-assets.
- **Phase 11 (Execution + QA):** Pressure-test PASS. Bias-audit complete. All BLOCK findings resolved.

### Step 5: Look for partial wiring

Common partial-wiring failures in MarketForge:

- **New ICP defined but only some downstream subskills consume it.** E.g., ICP-002 (mid-market segment) added but cold-email targets ICP-001 list.
- **Positioning changed but website copy still uses old language.** E.g., DEC-014 superseded by DEC-026 but homepage hero still says old version.
- **VOC quote added but never appears in copy.** E.g., powerful customer quote in voice-of-customer.md but not cited in any messaging.
- **Brand voice defined but ad copy uses generic startup voice.**
- **Distinctive color defined but ad creative uses competitor's color palette.**
- **Awareness stage declared on page but CTA mismatches stage.** E.g., page is Problem-aware but CTA is "Start free trial" (Most-aware CTA).
- **Validator catches slop but pressure-test missing.**
- **Kill criterion documented but no monitoring artifact produced.**

### Step 6: Check for new authorities, duplicated logic, stale paths

- **Did a subskill invent its own ICP** instead of consuming the ICP from `marketforge-icp-persona`?
- **Did a content piece invent its own POV** instead of consuming `narrative-and-story.md`?
- **Did an ad campaign invent its own value prop** instead of consuming `messaging-architecture.md`?
- **Is there a "Best practices" section anywhere** that should have been DEC-card decisions?
- **Did any subskill skip the "What we are intentionally NOT doing" section?**

### Step 7: External-data realistic-fixture coverage

For VOC mining, JTBD interviews, competitive intel — are real-world messy inputs tested?

- Customer interviews with rambling, off-topic detours: did the AI-extraction stay disciplined?
- Reviews mining: did 1-star reviews actually surface, or only happy ones?
- Competitor intel: did Wayback Machine evolution show, or only current homepage?

### Step 8: Idempotency / concurrency proof for agentic actions

If MarketForge is in agentic mode:

- **Sequential retry:** if the daily loop fires twice for the same day, are content drafts duplicated?
- **Concurrent duplicate:** if two operators kick off `$marketforge agentic=on` simultaneously, what happens?
- **Provider replay:** if Klaviyo webhook fires twice for same email send, does the lifecycle flow update its state correctly?

### Step 9: Inventory drift checks

Do docs match actual files?
- Does `marketforge/SKILL.md` reference subskills that actually exist?
- Do subskill outputs cite DEC-NNN ranges that match the allocation table?
- Do "Sources and basis" references point to V3 sections that exist?
- Does the execution calendar enumerate channels that match `channel-strategy.md`?

### Step 10: Final user-visible behavior

The narrowest meaningful proof:

- Pick a stranger from the target ICP.
- Show them the homepage.
- Does the value prop land in 5 seconds?
- Read them the cold email opener.
- Would they reply?
- Send them a cold ad.
- Would they click?

If the answer is no, the implementation is not done regardless of what the validators say.

## Findings to Look For (marketing-specific)

### The root cause was patched at a single surface
The team complained about "low conversion." Marketing fixed the homepage headline. But the actual root cause was a positioning mismatch — the ICP definition was wrong upstream. Now the new headline converts no better.

### One downstream consumer was fixed but canonical output still uses old truth
Website copy updated to new positioning. Cold email still uses old positioning. Paid ads still use old positioning.

### Validation masks bad generation instead of feeding bounded repair
Anti-slop validator caught "leverage" but the subskill output was full of other slop the validator didn't catch (e.g., three-word triplets, em-dash overuse, generic "modern" language).

### Persistence or read models are updated but final surfaces are not
DEC card created for new pricing, but pricing page on website still shows old prices.

### UI copy changed while source authority stayed wrong
Homepage updated, but the positioning DEC card was never updated — so the next AI agent will revert to the old position.

### A migration / backfill / reprocess path is missing
Ran MarketForge for B2B SaaS. Product pivoted to PLG. Need to re-run subskills affected by the pivot. There's no "what to re-run when X changes" guide.

### Tests prove helper behavior but not final behavior
Validator passes. But the actual marketing copy is still slop because the validator only catches banned phrases, not the deeper drift.

### Docs / rules claim a guarantee that tests do not enforce
README says "every decision has evidence grade." Validator doesn't enforce this. Future agents skip it.

### External-adapter tests use only clean canonical inputs
VOC mining tested with a synthetic transcript. Real customer interviews are messier — broken sentences, contradictions, sales-pitchy founders. Adapter not tested for these.

### "Idempotent" means retry-after-success only
Concurrency lock prevents two simultaneous orchestrator runs. But not two concurrent agentic daily loops on different schedules.

### Docs name old subskill names / DEC ranges after the code moved
DEC ranges in `opinionated-marketing-decision-template.md` say one thing; actual subskill outputs use another. Validator doesn't catch.

## Output Format

When reviewing MarketForge output, lead with findings ordered by severity:

```markdown
# MarketForge Implementation Review

## Severity: BLOCK
- [Finding] — [File:line] — [Why blocks shipment]
- [Finding] — [File:line] — [Why blocks shipment]

## Severity: FIX-NEXT
- [Finding] — [File:line] — [Recommended fix]

## Severity: ACCEPT (logged with rationale)
- [Finding] — [User-accepted reason]

## Severity: WATCH
- [Finding] — [Monitor for X months]

## Plan items satisfied:
- [Item] — [Evidence: file path]

## Plan items missed or only partially satisfied:
- [Item] — [What's missing]

## Root cause coverage judgment:
[Did we fix the underlying problem or paper over the symptom?]

## Extra risks introduced:
[New risks created by this implementation]

## Required fixes:
1. [Fix 1]
2. [Fix 2]

## Tests / proofs run or still needed:
- [What was tested]
- [What remains untested]

## Final answer:
[Does this fully satisfy product intent, or only patch the current failure?]
```

This is enforced by `marketforge-marketing-qa` (Phase 11 step 3).

## Sources and basis

- `implementation-review-against-plan` skill methodology (Anthropic, adapted).
- V3 Marketing Guide §12.2 (Pre-marketing readiness check), §12.8 (Anti-patterns).
