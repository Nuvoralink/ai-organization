# Message × Awareness Stage Matrix Template

Per Schwartz (Breakthrough Advertising, 1966), copy that addresses a stage above the visitor's current stage converts at near-zero. Most landing-page failures are stage mismatches, not copy quality.

This matrix maps the right message to each stage of buyer awareness. Output: `docs/marketing-plan/03-brand/messaging-architecture.md` (this matrix is a section).

## The 5 stages (Schwartz)

1. **Unaware:** Doesn't know they have the problem.
2. **Problem-aware:** Knows there's a problem, doesn't know solutions exist.
3. **Solution-aware:** Knows solutions exist, doesn't know about your product.
4. **Product-aware:** Knows about your product, hasn't decided.
5. **Most aware:** Knows your product and is ready to buy.

## Channel → typical stage map

| Channel | Typical visitor stage |
|---|---|
| Cold paid social (Meta, TikTok) | Unaware / Problem-aware |
| Paid search — category terms | Problem-aware / Solution-aware |
| Paid search — competitor terms | Solution-aware / Product-aware |
| Paid search — branded | Product-aware / Most aware |
| Organic SEO — top of funnel | Problem-aware |
| Organic SEO — comparison / alternative pages | Solution-aware / Product-aware |
| Organic SEO — bottom of funnel (pricing, demo) | Product-aware / Most aware |
| Cold email | Problem-aware (if signal-based) or Unaware (if not) |
| Direct mail / ABM | Problem-aware / Solution-aware |
| LinkedIn organic (founder content) | Problem-aware |
| Podcast guesting | Unaware / Problem-aware |
| Referral / WoM | Solution-aware / Product-aware |
| Email lifecycle — Welcome | Product-aware |
| Email lifecycle — Cart / Trial-end | Product-aware / Most aware |
| Newsletter sponsorship | Problem-aware / Solution-aware |

## The matrix template

```markdown
## Message × Stage matrix

### Unaware
- **Their state:** Doesn't know they have the problem.
- **What converts:** Diagnostic content. Story-based POV. "Did you know..." reframes.
- **What backfires:** "Sign up for [Product]." "See pricing."
- **Channel / asset:** Founder POV on LinkedIn / podcast guesting / TikTok organic.
- **Sample copy direction:**
  > "Most [audience] don't realize they're losing [N hours] / [N dollars] every week to [specific hidden problem]. Here's how to test if you are."
- **Sample CTA:** "Read the analysis" / "Take the diagnostic" / Subscribe to newsletter.
- **Anti-pattern:** Direct sell. Pricing pages. "Start your free trial."

### Problem-aware
- **Their state:** Knows the problem; hasn't seriously sought solutions yet.
- **What converts:** Framework content. Original data. "Here's how [specific cohort] solved this." Comparison of approaches (not products yet).
- **What backfires:** Long generic feature lists. Sign-up-now CTAs.
- **Channel / asset:** Newsletter sponsorship articles. Top-funnel SEO (still mostly broken post-AIO; use for entity-building). Webinars. LinkedIn carousel posts.
- **Sample copy direction:**
  > "Three ways teams solve [problem]: option 1 (works for X), option 2 (works for Y), option 3 (works for Z, the modern approach). Here's a 4-question diagnostic to figure out which fits you."
- **Sample CTA:** "Get the framework" / "Compare approaches" / Subscribe.
- **Anti-pattern:** "Buy now" before they've evaluated approaches.

### Solution-aware
- **Their state:** Knows solutions exist; comparing categories or approaches; hasn't shortlisted your product yet.
- **What converts:** Category-comparison content. "Why we built X differently." "[Approach A] vs [Approach B]." Founder POV on category direction.
- **What backfires:** Generic "Why [Product] is the best" pages.
- **Channel / asset:** Comparison pages (BoFu SEO). Founder LinkedIn POV. Podcast hosting / guesting. YouTube long-form explainer.
- **Sample copy direction:**
  > "The [category] market has two camps: [approach A] and [approach B]. Here's the honest tradeoff each one represents — and why we built [Product] on [approach C] which threads the needle."
- **Sample CTA:** "See how we compare" / "Read the technical brief" / "Watch the 7-min explainer."

### Product-aware
- **Their state:** Knows your product; deciding whether to buy / try / evaluate.
- **What converts:** Specific feature explanation tied to outcome. Competitor comparison pages. Pricing. Customer case studies in their segment. Risk-reversal (free trial, money-back, easy cancel).
- **What backfires:** Top-of-funnel content. "Welcome to [Product]" feels condescending.
- **Channel / asset:** Pricing page. Comparison pages ("[Product] vs [competitor]"). Case studies. Retargeting ads.
- **Sample copy direction:**
  > "Most [audience] picking between [Product] and [Competitor] choose us when [specific scenario]. Here's the side-by-side comparison and the 3 things that matter most."
- **Sample CTA:** "Start free trial" / "See pricing" / "Compare plans" / "Book a 15-min demo."

### Most aware
- **Their state:** Knows your product, knows pricing, ready to buy or has objections to resolve.
- **What converts:** Risk reversal. Migration path. Onboarding clarity. Live demo. Specific pricing details. Limited-time legitimate offer.
- **What backfires:** Generic education content. Repeating value prop.
- **Channel / asset:** Pricing page. Checkout / signup page. Trial-end emails. Sales calls.
- **Sample copy direction:**
  > "Get started in 4 minutes. Free for 14 days. Cancel anytime. No card required. Migration scripts available for [common previous tool]."
- **Sample CTA:** "Start free trial" / "Buy now" / "Talk to sales."
```

## The matrix in practice

For each major surface or campaign:

1. Identify the typical stage of incoming visitors.
2. Match the copy + CTA to that stage.
3. Document the stage-CTA pairing in the decision card.
4. Test for stage match: would a visitor at this stage actually engage with this copy?

## Sample stage mismatches (anti-patterns)

❌ Cold Meta Ad: "Sign up for [Product] and start saving 4 hours/week today."
**Why bad:** Visitor is Unaware / Problem-aware; "Sign up" is a Most-aware CTA. Predictable poor performance.

✅ Cold Meta Ad: "Most [audience] lose 4 hours/week to [specific hidden problem]. Take the 2-minute diagnostic to see how much you're losing."
**Why good:** Diagnostic-mode for Problem-aware visitor; reframes the problem; soft CTA.

❌ LinkedIn organic post by founder: "[Product] is the best CRM for B2B SaaS. Try it free for 14 days."
**Why bad:** Audience on LinkedIn is in research / browsing mode (Problem / Solution-aware); "Try free" is too aggressive.

✅ LinkedIn organic post: "We surveyed 240 RevOps leaders about why they fired their last CRM. Three patterns kept coming up. Here's what we learned — and which signal predicts the next switch."
**Why good:** Problem-aware framing; original data; positions founder as guide, not seller.

❌ Pricing page hero: "Welcome to [Product]. We're a category-defining platform for the modern enterprise."
**Why bad:** Visitor on pricing page is Product-aware / Most aware; they want pricing details, not a brand intro.

✅ Pricing page hero: "Pick a plan. Cancel anytime. Migrate from [common previous tool] in under an hour. See FAQ at bottom."
**Why good:** Most-aware visitor gets what they need.

## How MarketForge enforces

Every copy decision card cross-cites this matrix. The `marketforge-marketing-qa` subskill verifies:

1. Every ad campaign has a documented stage.
2. Every landing page has a documented stage.
3. Every email in lifecycle has a documented stage.
4. Stage and copy match per the matrix.

Mismatches are BLOCK findings.
