# Guided Marketing Interview Protocol

The discovery interview is the single most important moment of a MarketForge run. Bad discovery → bad ICP → bad channel selection → wasted spend.

This protocol limits questions to the minimum necessary, supplies a recommendation with every question that requires user input, and avoids preference-heavy questions where the AI can make a researched recommendation.

## Rules

1. **Ask only blocking questions.** A question is blocking if no reasonable default exists or the wrong assumption is hard to reverse.
2. **For every blocking question, supply: why it matters, recommended default, options with pros/cons, final recommendation, what the AI will assume if the user does not answer.**
3. **Never ask preference-heavy questions when research can answer them.** Stack choice, hosting, analytics provider, ESP — recommend by default.
4. **Initial interview: at most 5 questions. Follow-up: at most 3 questions.** Exceptions only for safety, legality, privacy, payments, regulated domains.
5. **Do not ask questions answered by the repo, existing docs, or user's previous answers.**
6. **Open with "restate intent" not "tell me about your business."** The AI says what it understands; user corrects.

## The opener (not a question, a confirmation)

> "Before I plan your marketing, here is what I understand:
> - Product: [name + 1-sentence description]
> - Business model: [classification from §12.1 of the V3 guide]
> - Stage: [pre-PMF / early post-PMF / scaling]
> - Budget tier: [T1 $0-500/mo | T2 $500-5K/mo | T3 $5K-25K/mo]
> - Founder profile: [technical / sales / content / design / operator — best guess from context]
> - Target outcome in 90 days: [my best guess from the prompt]
>
> Correct anything that's wrong; then I'll ask 3-5 questions to fill gaps before producing the plan."

If the user just says "build me a marketing department" with no detail, this opener becomes:

> "I can build you a complete marketing system. To do that well, I need to know enough about your product to make non-generic recommendations. Five questions:
> [the 5 most important questions follow]"

## The 5 questions to ask first (when no repo + sparse user input)

These are the highest-information-density questions for marketing. Adapt to context.

### Question 1: Business model + target customer

> **What is the product, and who buys it?**
>
> **Why this matters:** Channel mix and messaging depend on business model. B2B SaaS sales-led, B2B SaaS PLG, SMB SaaS, DTC ecom, B2C mobile, local service, marketplace, creator, agency, and hardware DTC each have different primary channels (see business-model-channel-fit.md).
>
> **Recommended default if unanswered:** I'll infer business model from the product description and propose the standard playbook for that model.
>
> **What I'll assume:** [specific business-model assumption based on context].
>
> **Options I'm considering:**
> - B2B SaaS sales-led ($10K-100K ACV)
> - B2B SaaS PLG (free trial / freemium, $20-500/mo)
> - SMB SaaS ($20-500/mo, broad)
> - DTC ecommerce
> - B2C mobile / consumer subscription
> - Local service business
> - Marketplace (two-sided)
> - Creator / content business
> - Agency / consultancy
> - Hardware DTC

### Question 2: Stage and current paying revenue

> **Where are you in the lifecycle, and do you have paying customers today?**
>
> **Why this matters:** Pre-PMF marketing is interviews and JTBD work, not paid spend. Post-PMF with retention is paid spend. The readiness check gates this (see readiness-check-protocol.md).
>
> **Recommended default if unanswered:** I'll assume early post-PMF with first 50-200 paying customers. If retention data is unavailable, I'll plan acquisition assuming a healthy curve but flag the readiness check as PENDING until you supply retention data.
>
> **Options:**
> - Pre-PMF, no paying customers yet
> - Pre-PMF, first 10-50 paying customers (informal)
> - Early post-PMF, 50-500 paying customers, retention curve forming
> - Scaling, $1M+ ARR or $500K+ DTC monthly revenue
> - Mature, $10M+ revenue

### Question 3: Budget tier and time horizon

> **What is your monthly marketing budget tier, and what's the 90-day outcome you need?**
>
> **Why this matters:** Channel candidates and the brand-vs-performance split depend on budget. A 12-person startup spending $40K/mo on brand because Binet & Field said 60/40 is malpractice.
>
> **Recommended default if unanswered:** T1 ($0-500/mo), 90-day outcome = first paying customer if pre-revenue, or 2x current MRR if revenue exists.
>
> **Options:**
> - T1: $0-500/mo
> - T2: $500-5,000/mo
> - T3: $5,000-25,000/mo
> - T4: $25K+/mo (out of MarketForge default scope; can still plan but flag)

### Question 4: Founder profile and asymmetric advantages

> **What's your founder/team profile, and do you have any asymmetric advantages?**
>
> **Why this matters:** Founder-channel fit matters more than channel optimality on paper. An introverted founder running LinkedIn daily produces less value than a podcaster founder guesting twice a month. An asymmetric advantage (existing audience, partnerships, viral product mechanic) reshapes the channel mix.
>
> **Recommended default if unanswered:** Technical founder, no existing audience, no partnerships. I'll plan accordingly.
>
> **Asymmetric advantage examples:**
> - Founder has 50K+ relevant followers
> - Pre-existing partnerships with distribution
> - Viral product mechanic with K-factor > 0.6
> - Local market dominance
> - Counter-positioning vs incumbents
> - Proprietary data set for original-research content

### Question 5: Hard constraints, banned channels, regulated domains

> **Are there channels you've already tried and don't want, regulated-domain considerations, or hard constraints I should know about?**
>
> **Why this matters:** Time saved by knowing upfront. Also unblocks regulated-domain restrictions (medical, financial, legal, alcohol, firearms, crypto, gambling, supplements, children's products, political).
>
> **Recommended default if unanswered:** No banned channels, no regulated domain, no hard time deadline.

## Follow-up questions (no more than 3 in a single follow-up)

When phase-1 reveals gaps:

### Follow-up A: Retention data (if pre-PMF or unclear)

> "Can you share monthly logo churn (SaaS) or 6-month repeat rate (DTC) or D30 retention (mobile)?"

### Follow-up B: ICP precision (if Q1 was vague)

> "Inside [business model], who is the buyer? Title, company size, the specific problem they hire your product to solve, and what they were using before."

### Follow-up C: Competitive set

> "Who do prospects compare you against in their head? Don't list 'industry leaders' — list the real alternatives, including 'spreadsheet,' 'nothing,' or 'manual process' if applicable."

### Follow-up D: Existing assets

> "What marketing assets exist today? Site URL, ad accounts active, ESP, CRM, social handles, analytics. I'll inspect what you have before recommending new work."

### Follow-up E: Hardcoded constraints

> "Do you have a launch deadline? A press embargo? A pricing decision pending? A regulatory review pending? Anything that makes a recommendation immediately impossible?"

## Anti-patterns in marketing discovery

- **Asking the user to design the marketing department.** "What channels do you want to use?" puts the burden on the user. Instead: "Based on your business model and budget, I recommend [X, Y, Z] for these reasons. Override if you have a reason."
- **Asking about emotional tone first.** "What feeling do you want your brand to evoke?" is preference-heavy. Instead, ask about audience and let brand emerge from messaging architecture and competitive position.
- **Asking 12 questions in one go.** Cap at 5. If 6 are needed, ask 5 + plan to follow up with the 6th later.
- **Asking 0 questions.** Generic plans are worse than asking 3 sharp questions.

## When the user is non-responsive in Auto mode

In Auto mode, default to the most reasonable assumption per question + write the assumption to `docs/marketing-plan/auditability/assumptions-register.md`. Mark every assumption-driven decision with `Source basis: Assumption` and flag for user review at the next interaction.

## When the user provides a SpecForge `docs/app-plan/`

Most of these questions are already answered. Read:
- `docs/app-plan/product/product-brief.md` (or 01-product-brief.md)
- `docs/app-plan/product/prd.md`
- `docs/app-plan/product/business-model.md` (or monetization)
- `docs/app-plan/product/user-roles.md`

Skip questions answered by these docs. Cite the source.

## When the user provides existing site / accounts

Run audit subskills before asking gap-filling questions. The audit answers many "who is the customer" questions via VOC mining and competitive analysis.

## Sample interview transcript (good)

> **AI:** Before I plan your marketing, here is what I understand:
> - Product: A privacy-first password manager for individuals and families
> - Business model: B2C mobile app + consumer subscription (best guess)
> - Stage: Unknown — please confirm
> - Budget tier: T2 (best guess)
> - Founder profile: Technical (best guess from "we built our own crypto layer")
> - Target outcome in 90 days: First $50K MRR (best guess)
>
> Correct anything wrong; then 5 questions.
>
> **User:** Correct except budget is T1 right now ($300/mo) and we have 2,000 free users + 80 paying at $4.99/mo.
>
> **AI:** Updated. Five questions:
> 1. Retention: what's your D30 retention for the free → free cohort and free → paid conversion rate?
> 2. iOS / Android split of users?
> 3. Founder profile: do you have an existing audience anywhere (X/Twitter, YouTube, podcast appearances)?
> 4. Any banned channels or hard constraints (we've already tried X; legal counsel said don't do Y)?
> 5. 90-day priority: more free users, more conversions, or both equally?

That's a real interview — sharp questions, clear context-setting, low friction.

## Anti-pattern transcript (bad)

> **AI:** Hi! I'd love to help with your marketing. Can you tell me:
> 1. What are your business goals?
> 2. Who is your target audience?
> 3. What are your brand values?
> 4. What channels are you considering?
> 5. What's your budget?
> 6. What's your timeline?
> 7. Who are your competitors?
> 8. What makes you unique?
> 9. What's your USP?
> 10. What's your mission statement?

This is a slop interview. It puts everything on the user, asks preference-heavy questions, doesn't recommend anything, and doesn't reveal the AI has any expertise.
