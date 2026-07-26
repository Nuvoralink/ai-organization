---
name: marketforge-positioning
description: Build positioning using Dunford's 5-box framework — competitive alternatives, unique attributes, value those enable, customers who care most, market category. Use as Phase 1 step 6 of MarketForge full runs, or independently for repositioning work. Re-positions quarterly post-PMF.
---

# MarketForge Positioning

Read shared references. Apply Dunford's *Obviously Awesome* (2019) framework with the V3 guide's honest caveat: positioning lives inside the first 90 seconds of product for PLG SaaS, not the homepage; positioning decays as competitor sets shift.

## Global quality rules

- Force the user to name the REAL alternatives — often "do nothing" or "a spreadsheet" — not flattering peer brands.
- Every unique attribute must be verifiable; "industry-leading" is banned without source.
- Positioning is a working hypothesis subject to revision. Never frame as final.
- Re-positioning trigger: significant competitor shift, ICP shift, product capability shift, or market category shift.

## Purpose

Produce a positioning statement that:
1. Survives the "what would a 5-year-old understand?" test.
2. Differentiates from the actual alternatives, including "nothing."
3. Maps onto the ICP's actual buying context.
4. Anchors all downstream messaging (subskill: `marketforge-messaging-architecture`).

## Inputs

- `docs/marketing-plan/01-foundations/marketing-brief.md`
- `docs/marketing-plan/01-foundations/voice-of-customer.md` (if available)
- `docs/marketing-plan/01-foundations/competitive-intel.md` (if available)
- `docs/marketing-plan/01-foundations/jtbd-analysis.md` (if available)
- SpecForge `docs/app-plan/product/product-brief.md` if present
- User-supplied existing positioning if any

## Outputs

- `docs/marketing-plan/01-foundations/positioning.md`
- DEC-008 through DEC-015 in range — positioning decisions

## The Dunford 5-box

For each of the 5 boxes, capture answer + alternatives considered + evidence:

### Box 1: Competitive alternatives
What does the customer actually do today if they don't buy your product?

- "Do nothing" (the most common alternative; the hardest to compete with)
- A specific competing product (named)
- A workaround tool (often "a spreadsheet" or "manual process")
- An internal build (B2B)
- A consultant / agency

**Rule:** name the alternative the customer would name, not the alternative your investor deck names.

### Box 2: Unique attributes
What does your product have that the alternatives lack? Specific, verifiable attributes — not adjectives.

- Specific feature with measurable difference: "Imports from [common previous tool] in 3 minutes vs. [competitor]'s 2-day migration."
- Specific data set: "Trained on 1.2B [domain-specific] examples; competitors use general-purpose models."
- Specific reach: "Available in 47 markets vs. competitor's 12."
- Specific compliance: "SOC 2 Type II + HIPAA + GDPR; competitor only SOC 2."
- Specific integration: "Native integration with [tool ICP already uses]; competitor requires Zapier middleware."

**Rule:** if you can't verify the attribute in writing, cut it. Marketing claims that don't survive sales contact destroy trust.

### Box 3: Value those attributes enable
For each unique attribute, what specific value does it create for the customer?

- Attribute: "3-minute migration" → Value: "Stop blocking on the 2-day Migration. Test us in an hour."
- Attribute: "Native integration with X" → Value: "Skip the Zapier maintenance overhead."

**Rule:** value is in customer-outcome terms, not feature terms. Use language from VOC interviews.

### Box 4: Customers who care most
What kind of customer cares most about this specific value? Not "all customers" — the specific segment for whom the unique-attribute → value pair is decisive.

- Specific firmographic / behavioral pattern.
- The pain that matters most to them.
- The trigger event that makes them ready to buy.

**Rule:** if "all our customers" care most, the positioning is too generic. Differentiation requires a sharp ICP.

### Box 5: Market category
What category do you live in? Three options:

- **Existing category** (best for crowded markets — be the best-fit option in a category they're already searching).
- **Category sub-segment** (best for differentiation in a crowded category — "the [category] for [specific ICP]").
- **New category** (best for novel products without category — but requires more education).

**Rule:** category creation is expensive. Most SMBs should NOT attempt category creation; pick an existing category and be the best in your sub-segment.

## Output structure

```markdown
# Positioning

## Box 1: Competitive alternatives
[List with one-line description each]

## Box 2: Unique attributes
[Specific verifiable attributes with evidence]

## Box 3: Value
[For each attribute, the customer-outcome value it enables]

## Box 4: Customers who care most
[Specific segment]

## Box 5: Market category
[Category + rationale for sub-segment vs. existing vs. new]

## Positioning statement (synthesized)

> "[Product] is a [category sub-segment] for [specific ICP] who [specific pain / trigger]. Unlike [primary competitive alternative], we [unique attribute] which means [outcome value]."

## Variations for different surfaces

- **Homepage hero (one line):** [10-15 word version]
- **Investor deck (one paragraph):**
- **Cold email (one sentence value prop):**
- **Ad copy (5-7 word value prop):**

## What we are intentionally NOT positioning against
- [Competitor A — segments don't overlap]
- [Status quo X — too far adjacent]
- [Category creation — would require X budget]

## Decision cards

[DEC-008 to DEC-015]

## Sources and basis

- Dunford, A. Obviously Awesome (2019). Evidence grade: C (practitioner consensus).
- JTBD interviews: [reference to jtbd-analysis.md]
- VOC: [reference to voice-of-customer.md]
- Competitive intel: [reference to competitive-intel.md]
- User-confirmed: [list specific user inputs]
```

## Common positioning failures and fixes

### Failure A: Positioning against the flattering peer set, not the real alternatives
> "We're like Notion but for product teams."

Fix: Force naming of real alternatives. Often the real alternative is Google Docs + a Slack channel + tribal knowledge. Position against that.

### Failure B: Adjective positioning
> "We're the modern, easy, intuitive [category]."

Fix: Replace adjectives with specific verifiable attributes.

### Failure C: Positioning that's too broad
> "For modern teams that want to ship faster."

Fix: Force the specific firmographic. "For 30-150-engineer SaaS companies with on-call rotation pain."

### Failure D: Aspirational positioning
> "The platform for the future of work."

Fix: Position for the customer you can win today, not the one you wish you had.

### Failure E: Category-creation that no one searches
> "We're a Continuous Customer Discovery Engine."

Fix: If 100 buyers in the ICP can't recognize the category name, you'll spend 5 years educating it. Use an existing search-able category.

## Re-positioning triggers

Positioning is not static. Re-run this subskill when:

- A new competitor enters and reshapes the alternative set.
- ICP shifts (going from SMB to mid-market, or vice versa).
- Product capability shifts (a new feature changes the unique-attribute set).
- Market category shifts (e.g., "marketing automation" becoming "GTM platform").
- Conversion data shows positioning isn't landing (high bounce, low time-on-page, sales calls reveal confusion).

## What we are intentionally NOT doing in this layer

- Writing copy — that's `marketforge-website-copy` and `marketforge-messaging-architecture`.
- Setting brand voice — that's `marketforge-brand-strategy`.
- Final pricing — that's `marketforge-pricing-strategy`.
- Detailed channel plan — that's `marketforge-channel-strategy`.

## Sources and basis

V3 §1.1 (Positioning — Dunford). Dunford, *Obviously Awesome*, 2019. Evidence grade: C (practitioner consensus; useful framing not RCT-tested).
