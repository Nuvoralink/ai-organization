# Marketing Decision Quality Protocol

Before finalizing any material marketing decision, run this protocol. This is the discipline that prevents shortcut decisions and survivor-bias playbook copying.

## When this applies

A decision is "material" if it affects:

- Channel selection or budget allocation
- ICP, persona, or positioning
- Brand voice, naming, or messaging architecture
- Pricing
- Attribution methodology
- Lifecycle flow structure
- Compliance-sensitive content
- A claim that will be made publicly (homepage, ads, press)

For trivial derivative decisions (ad headline variant 3 of 10, single email subject line), skip this protocol — it would be overhead.

## The 7-step protocol

### Step 1: State the decision in one sentence with concrete values

Not "we should improve our content." Not "explore TikTok." Instead:

> "Allocate 60% of paid budget to Apple Search Ads (branded + category + 4 CPPs) for Q3, $6,500/mo."

If you cannot state the decision with concrete numbers, channels, and outputs, the decision is not material enough to apply this protocol — or it's too vague to be a real decision.

### Step 2: Identify the root cause

What underlying problem does this decision solve? Not what symptom does it patch?

- Symptom: "Our CAC is too high."
- Root cause: "We're spending against an undefined ICP; ad copy speaks to multiple audiences; attribution is single-source and ad-platform-inflated."

A decision should address root cause, not symptom. If the decision only patches a symptom, write the symptom-patch label and add the underlying-cause decision to the queue.

### Step 3: Generate at least 3 realistic alternatives

Most marketing decisions have a "default obvious" answer and 2-3 thoughtful alternatives. Force the alternatives.

Example:
- **Decision:** Run cold email outbound to top-200 ICP accounts.
- **Alternatives:**
  - Direct mail dimensional mailers to top-50 accounts at $25K+ ACV (ANA/DMA 4.4% response data).
  - Founder LinkedIn DM outreach with content-engagement-first cadence.
  - Hybrid: warm via LinkedIn comments + content engagement, then email after engagement signal.
  - Skip outbound entirely; ride inbound + warm referral.

Score each alternative against the 7-factor channel scoring matrix. Don't pick "cold email" because it's familiar; pick the highest-scoring alternative for the actual constraints.

### Step 4: Identify the commercial bias

If any cited framework, benchmark, or claim has commercial alignment, flag it (see `commercial-bias-map.md`). A decision driven by D-grade evidence must triangulate before being adopted.

### Step 5: Define the kill criterion + reversal trigger + test window

Every decision must answer:

- **Test window:** How long do we run this before evaluating? (Per `kill-criteria-by-channel.md`.)
- **Kill criterion:** What observable signal triggers killing the decision?
- **Reversal trigger:** What signal triggers revisiting (lighter than kill)?

If you cannot define a kill criterion, you cannot run the decision rigorously.

### Step 6: Define the verification method

How will we know if it worked? Specific metrics, specific dashboards, specific tests.

- "CAC will be lower" → fail. Lower than what? Measured how? Over what window?
- "Blended CAC drops below $80 by end of Q3 measured via post-purchase survey triangulated against platform-reported CAC, weekly cohort review" → pass.

Attribution must be triangulated. A single number from a single platform is not verification.

### Step 7: Document the anti-pattern this decision is designed to prevent

Every decision is implicitly choosing against several other paths. Make the explicit anti-pattern visible:

> "Anti-pattern to avoid: Splitting $10K paid budget across 5 channels (Meta + TikTok + Google + Reddit + LinkedIn) before any single channel proves attribution-positive incrementality. Concentration on 2 measurable channels with native attribution beats diversification at this budget."

This converts the decision from "do X" to "do X *instead of* Y." Useful for future maintainers.

## Output format

After running the protocol, write a full decision card per `opinionated-marketing-decision-template.md`.

## No-shortcut check

Before finalizing, ask:

1. Did I take the easiest answer because it was easiest? → if yes, redo.
2. Did I copy a playbook from a 100x-bigger company? → if yes, scale down to operator's actual stage.
3. Did I cite a stat I haven't sourced to its origin? → if yes, source it or cut.
4. Did I cite vendor data without a bias flag? → if yes, add the flag.
5. Is there a Confidence: High decision built on D-grade or E-grade evidence? → if yes, downgrade Confidence or upgrade evidence.
6. Is the kill criterion specific enough that we'd know in 90 days whether to kill? → if no, sharpen.
7. Does the decision say what we're NOT doing, in addition to what we ARE doing? → if no, add.

## When you cannot reach High confidence

That's OK. Many marketing decisions are genuinely Medium or Low confidence. Label honestly:

- "Confidence: Medium. Reason: We are testing the hypothesis that ICP segment B has higher LTV than segment A; no data confirms this yet. Kill criterion will validate within 60 days."

Honest medium-confidence decisions are better than fake-confident ones.

## Surfacing low-confidence decisions to the user

Per the orchestrator's pacing rule, surface to user:

- All Confidence: Low decisions during the run, even if not blocking.
- All Medium-confidence decisions in the run summary at completion.
- All decisions where evidence grade is D or E.

This lets the user catch wrong assumptions early instead of after the marketing budget is spent.
