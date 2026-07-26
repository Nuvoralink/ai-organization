# Anti-Slop Marketing Rubric

The single most common failure of AI marketing output is **slop** — generic, taste-word-driven, evidence-free, vendor-cliché copy and recommendations that read like every other AI marketing tool. This rubric exists so MarketForge never produces it.

Read this before drafting any marketing artifact. Apply at every output.

## What counts as marketing slop

### Slop pattern 1: Taste-words without mechanism

| Slop | Fix |
|---|---|
| "engaging content" | "10 LinkedIn posts/month, each with original screenshot + specific number + reply-to-every-comment within 90 minutes" |
| "modern brand" | "Sans-serif geometric type, OKLCH warm-neutral palette, 8px grid, motion under 200ms" |
| "innovative approach" | "Affiliate program with 30% recurring commission, 90-day cookie, PartnerStack platform" |
| "elevated experience" | (just delete it — say what changes) |
| "transformative growth" | "K-factor target 0.4; from 800 to 1,200 paying users in Q3 via in-product referral ask at activation moment" |
| "leverage AI" | (specify which AI for what task with what input/output and what oversight) |
| "best-in-class" | (compared to what, on what metric, measured how) |
| "industry-leading" | (rank where, audited by whom) |
| "premium feel" | (specific color/type/material decisions that produce it) |
| "thought leadership" | (POV + named author + original data + distribution plan) |

### Slop pattern 2: Hedged non-decisions

Banned phrases in any decision:

- "Consider..."
- "It might be worth..."
- "You could try..."
- "Some marketers recommend..."
- "Best practice suggests..."
- "Depending on your goals..."
- "Conventional wisdom holds..."

Every decision must take a side. If genuinely unsure, write: `Confidence: Low. Reason: [why]. Default recommendation: [pick one]. Reversal trigger: [signal that would change it].`

### Slop pattern 3: Fabricated or unsourced statistics

- Never quote a stat without a source + date.
- Never round a vendor stat to make it sound more credible ("about 30x ROI" when the source said 36x).
- Never invent percentages. "Conversion rates increased by 47%" without a verifiable test → cut it.
- Specific-and-sourced beats round-and-confident.

### Slop pattern 4: Vendor-cliché copy

| Cliché | Why it's slop | Fix |
|---|---|---|
| "Unlock your potential" | Said by every product | Specific outcome the user gets in concrete terms |
| "Streamline your workflow" | Vague | "Cut weekly reporting from 4 hours to 15 minutes" |
| "Built for the modern team" | Could be any product | Name the team type, the prior tool, the switching moment |
| "Powerful, intuitive, easy" | Three adjective stack | One specific behavior |
| "Game-changing" | Marketing-speak | (cut it) |
| "Revolutionary platform" | Marketing-speak | (cut it) |
| "Empower your business" | Empty | (cut it) |
| "Drive results" | Empty | Name the result + metric + time horizon |
| "Take it to the next level" | Empty | (cut it) |
| "World-class" | Brag without basis | Specific credential, named comparison |

### Slop pattern 5: AI-cadence headlines

LLMs default to a recognizable cadence in headlines that buyers in 2025-2026 actively avoid:

- Three-word triplets ("Bold. Beautiful. Built.")
- "The X that Y" (overused)
- "Where X meets Y"
- "Beyond X, beyond Y, beyond Z"
- Excessive em-dashes
- "Not just X — Y" without follow-through

A headline must pass the "would a copywriter who never used AI write this?" test. If not, rewrite.

### Slop pattern 6: Copying playbooks from companies 100x bigger

Slop: "We should run a Super Bowl ad to build brand awareness."
Slop: "Let's do a category-creation movement like HubSpot did for inbound."
Slop: "Open the funnel with a podcast like every B2B SaaS."

These are survivor-bias playbooks from companies with $50M+ marketing budgets. Most do not generalize. Chris Walker: "Marketers that continue to copy the Salesforce playbook from 2006 for their 50-person SaaS company will continue to struggle."

### Slop pattern 7: Channel-name dropping without scoring

Slop: "We recommend TikTok, Instagram, LinkedIn, X, Reddit, YouTube, and podcast."

That's not a recommendation; that's an inventory. Fix: score each channel against the 7-factor scoring matrix in `channel-scoring-matrix.md` and recommend 3 (1 compound + 1-2 harvest + 1 wildcard).

### Slop pattern 8: "Best practice" without context

The most useful best practice for a $50K-ACV mid-market SaaS will harm a $20/mo SMB SaaS. Every claim must specify business model, stage, and budget tier (T1/T2/T3) where applicable.

### Slop pattern 9: 60/40 cargo-culting

"You should spend 60% on brand and 40% on performance" without explaining that Binet/Field's data came from established brands, has been challenged by Sharp, and the B2B refinement shifted to 46/54 — and any pre-PMF SaaS should be 80-100% performance.

Every framework citation must include its source, scope, and limit conditions.

### Slop pattern 10: Vanity metrics as success criteria

Banned as primary KPIs unless tied to revenue:

- "Followers" (followers ≠ buyers)
- "Impressions" (without attention measurement)
- "Reach" (without conversion tied to it)
- "MQLs" (without SQL conversion and pipeline data)
- "Engagement rate" (without revenue correlation)
- "Brand mentions" (without sentiment + brand-search lift)

Acceptable supporting metrics; never primary OKRs.

## The slop test (apply before every output)

Run this checklist on every artifact:

1. **Specificity test** — Could this be copy-pasted to any product in the category? If yes → too generic.
2. **Taste-word test** — Is any sentence anchored only by adjectives ("modern, clean, innovative, premium, easy")? If yes → rewrite with mechanism.
3. **Hedge test** — Does any decision read "consider X" or "you could try Y"? If yes → take a side or label Confidence Low explicitly.
4. **Source test** — Is every statistic, framework citation, and "research shows" claim grounded in a named source with date? If no → cut or source.
5. **Scope test** — Does every recommendation specify business model + stage + budget tier where applicable? If no → add.
6. **Survivor-bias test** — Does the recommendation pattern-match to a company 100x bigger? If yes → adjust to operator's actual scale.
7. **Channel-scoring test** — Are channel recommendations scored against the 7-factor matrix? If no → score them.
8. **Bias-flag test** — Is any vendor-promoted claim cited without a commercial-bias flag? If yes → add the flag from `commercial-bias-map.md`.
9. **AI-cadence test** — Read every headline out loud. Does it sound like every AI tool? If yes → rewrite.
10. **Anti-slop banned-phrase test** — Scan for the banned phrases in pattern 2. If present → rewrite.

## Anti-slop applied to common output types

### Homepage headline
- Slop: "Transform your business with our AI-powered platform."
- Fix: "Cut your monthly close from 8 days to 3 — without changing your ERP." (specific outcome, specific number, specific constraint)

### Cold email opener
- Slop: "Hi {firstName}, I noticed {company} just {recentEvent} and thought you might be interested in our solution."
- Fix: Reference a specific signal (funding, hire, tech change) + the specific implication for their stack + a 1-sentence offer of value, not a meeting ask.

### LinkedIn post hook
- Slop: "5 lessons I learned about marketing in 2026."
- Fix: "Last month I shut down a channel that was generating 40% of our pipeline. Here's the 6-week test that proved it was incremental fraud."

### Ad creative concept
- Slop: "Lifestyle shot of a happy professional using the product on a laptop."
- Fix: "Side-by-side phone screenshot: receipt photo at 9:42am → categorized expense report at 9:43am. Caption: 'Bookkeeping in 22 seconds.' 9:16 vertical. Talking-head voiceover from the founder over the screen recording."

### SEO content brief
- Slop: "Write a 2,000-word ultimate guide to email marketing."
- Fix: "Comparison page: '[competitor X] vs [our product]' targeting the bottom-funnel query (~720 monthly searches). Include: side-by-side feature table with 14 honest rows including 3 where competitor wins; pricing comparison with disclaimer; 2 customer quotes specifically about the switch; FAQ block answering the 7 questions surfaced in Reddit threads about migration."

## What good marketing artifacts look like

A non-slop artifact:

- Names the audience specifically.
- States the business model and stage explicitly.
- Uses specific numbers, even when they're estimates (with a confidence + source).
- Takes a side on every material decision.
- Acknowledges what was rejected and why.
- Includes a kill criterion and a reversal trigger.
- Grades evidence (A/B/C/D/E) on every claim.
- Flags commercial bias on every vendor-promoted citation.

If an artifact does not include these traits, run it back through the rubric.

## Final rule

**The best marketing copy in 2026 is the most human in an AI-saturated channel.** Buyers in 2025-2026 actively avoid AI-feeling content. Counter-moves built into MarketForge:

- Named human authors on POV pieces.
- Original data over AI-summarized industry research.
- Signed founder voice on hero content.
- Behind-the-scenes specifics ("we tried X, it failed because Y") over polished case-study language.
- One real photo > ten stock images.
- A real number with a source > a confident-sounding round number.
