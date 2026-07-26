# Pre-Marketing Readiness Check Protocol

Before recommending paid acquisition spend, MarketForge runs a 7-gate readiness check. This is from Balfour's "Retention is truth, growth is lie" principle and the V3 guide's §12.2.

**The rule: if <5 of 7 gates pass, recommend research and retention work, not acquisition spend.**

## The 7 gates

### Gate 1: Customer interviews

**Question:** Have at least 30 customer interviews been completed?

**Why:** Without customer interview depth, marketing budget gets spent figuring out the customer rather than selling to them. Andy Rachleff founder-market fit test: does the founder know 50 people in the buyer persona by first name?

**Pass criteria:** 30+ interviews with target persona within last 12 months. Recent enough that JTBD signal is current.

**Fail criteria:** Fewer than 30 interviews; or interviews older than 18 months; or interviews skewed (only happy customers, no churned, no non-buyers).

**If fail:** Run `$marketforge-jtbd-interviews` and `$marketforge-voice-of-customer` first. Block paid acquisition.

### Gate 2: Retention curve flattening above zero

**Question:** Does the cohort retention curve show a horizontal asymptote above zero?

**Why:** If retention does not stabilize, every dollar of paid acquisition is pouring into a leaky bucket.

**Pass criteria:**
- SaaS B2B mid-market: D30 retention ≥ 90% (≤2% monthly logo churn).
- SaaS SMB: D30 retention ≥ 75% (≤5% monthly logo churn).
- DTC: at least 20% of 6-month cohorts repeat.
- Mobile apps: D30 retention at or above category median (gaming 4-8%, social 15-20%, fintech 10-15%, productivity 10-18%; cross-platform median ~7% per Adjust 2026).

**Fail criteria:** Retention curve still declining at the measurement horizon; or below category median; or no cohort data exists.

**If fail:** Recommend product/onboarding/activation work before paid spend. Run `$marketforge-onboarding-activation` and `$marketforge-retention-churn`.

### Gate 3: ICP + positioning articulable

**Question:** Can the team articulate ICP and positioning in two sentences?

**Why:** Without articulable positioning, all acquisition copy will fall back to vague taste-words. Marketing spend cannot fix unclear positioning.

**Pass criteria:** Founder/team can write two sentences answering:
- Who is this for (specific persona, not "businesses" or "professionals")?
- Why do they buy this instead of [the real alternative, often "nothing" or "a spreadsheet"]?

**Fail criteria:** Generic answers ("everyone who needs X"); positioning copy from website is taste-word soup; multiple stakeholders disagree on ICP.

**If fail:** Run `$marketforge-positioning` and `$marketforge-icp-persona` first.

### Gate 4: Unit economics viable

**Question:** Is LTV:CAC > 2:1 modeled credibly?

**Why:** Below 2:1 unit economics, paid acquisition compounds losses. The healthy zone is 3:1 to 5:1.

**Pass criteria:** Contribution-margin LTV (not gross-revenue LTV) divided by fully-loaded CAC ≥ 2:1, with documented assumptions about retention, expansion, and CAC inputs.

**Fail criteria:** Cannot model LTV (no retention data); or LTV:CAC < 2:1; or LTV based on gross revenue not contribution margin; or CAC excludes major cost components (team time, tooling, agency fees).

**If fail:** Recommend either pricing work (raise LTV) or product/onboarding work (raise retention) or channel-cost work (drop CAC) before scaling spend. Run `$marketforge-pricing-strategy`.

### Gate 5: Current paying revenue

**Question:** Is the product currently generating paying revenue?

**Why:** Pre-revenue products often need product work, not marketing. The exception is hardware DTC pre-launch waitlists — explicitly scoped.

**Pass criteria:** At least 10 paying customers (B2B) or 100 paying customers (B2C) generating consistent monthly revenue.

**Fail criteria:** No paying customers; or "paying" only via free trial conversions still in <14 days.

**If fail:** Recommend the founder-led sales / hand-recruit-first-100-customers playbook (Chen's tipping point for marketplaces; Y Combinator "do things that don't scale"). Defer paid acquisition until 10+ B2B / 100+ B2C paying.

**Exception:** Hardware DTC pre-launch waitlist marketing is in-scope — explicitly mark in `decision-log.md`.

### Gate 6: Capacity to execute

**Question:** Does the team have time, ops, and CS capacity to handle inbound demand the marketing will generate?

**Why:** Generating leads that don't get worked, trials that don't get onboarded, or DTC orders that ship slow destroys the marketing ROI.

**Pass criteria:**
- B2B: SDR / founder has 10+ hours/week for inbound follow-up; sales process is documented.
- DTC: fulfillment can scale 2-3x current orders without quality drop; CS can handle 2-3x volume.
- SaaS: onboarding flow is documented; activation rate measured; CS can handle proportional volume.

**Fail criteria:** No documented follow-up process; CS already drowning; fulfillment at capacity; trial-to-paid conversion is unmeasured.

**If fail:** Build capacity first. Run `$marketforge-onboarding-activation` for SaaS or fulfillment/CS audit for DTC.

### Gate 7: Conversion path fixed

**Question:** Is the path from first touch → first value functional and measured?

**Why:** Paid spend amplifies the worst part of the funnel. If signup is broken, paid traffic just buys more signup failures.

**Pass criteria:**
- Signup completion rate measured and ≥ 50% (or has known target with improvement plan).
- Time-to-first-value documented; activation rate measured.
- For DTC: checkout completion ≥ 50% (Baymard avg is 30%; major fixes available).
- Analytics events fire reliably.

**Fail criteria:** Funnel metrics unknown; signup completion <40%; activation rate not measured; events broken.

**If fail:** Run `$marketforge-landing-cro`, `$marketforge-onboarding-activation`, and `$marketforge-analytics-stack`. Block paid spend until funnel measured.

## The decision rule

| Gates passing | Recommendation |
|---|---|
| 7/7 | Proceed with full paid acquisition planning |
| 5-6/7 | Proceed but explicitly note the failing gates as risks; cap initial spend at T1 ($0-500/mo) until gates close |
| 3-4/7 | Block paid scaling. Allow paid search on branded terms only as defensive. Focus on closing gates 1-7 |
| 0-2/7 | Hard block on paid spend. Run discovery + research subskills; revisit readiness in 30-60 days |

## Output of the readiness check

`docs/marketing-plan/01-foundations/readiness-check.md` containing:

1. The 7 gates with PASS / FAIL for each, evidence (what was measured, who confirmed, when).
2. The composite score (X / 7).
3. The recommendation (proceed / proceed-capped / block / hard-block).
4. The blocking gates if any, with the specific subskill(s) to run first.
5. Re-check date (30 / 60 / 90 days depending on score).
6. A decision card (DEC-NNN) capturing this assessment.

## What this prevents

- Premature scaling of paid before product-channel fit (V3 guide §12.8 anti-pattern 3).
- Channel mix optimization that papers over a retention problem.
- Founders blowing 6 months of runway on Facebook Ads before talking to customers.
- "Acquisition strategy" presentations that pretend the product is ready when it isn't.

## When to override

Override is valid in two cases:

1. **Hardware DTC pre-launch.** Pre-order waitlist marketing is in-scope before paying customers exist. Mark explicitly in decision log.
2. **Founder has asymmetric audience.** If the founder has 50K+ relevant followers, channel arbitrage on that audience is in-scope even with weaker gates 4-7 — but log the channel concentration risk.

Any override must be logged with rationale in `auditability/decision-log.md` and `auditability/overrides-log.md`.

## Tone when delivering "no, don't market yet"

Founders often arrive at MarketForge ready to spend. Telling them to defer is hard. The framing that works:

> "Before we plan paid acquisition, here's what the readiness check found. [Pass gates with brief stats.] Failing gates: [specific gates with what's needed]. The math: putting $5K/mo into Meta Ads at current retention would cost ~$X in CAC but produce ~$Y in LTV — that's not a marketing problem, it's a product/onboarding problem.
>
> Recommended sequence: spend the next 4 weeks on [specific failing-gate work]. Re-check readiness. If gates close, we'll plan T2 paid acquisition with confidence."

This frames it as deferred, not denied. And it shows the math.
