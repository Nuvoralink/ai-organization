---
name: marketforge-discovery
description: Marketing intake interview. Restate product intent, classify business model, capture stage / budget / founder profile / asymmetric advantages / hard constraints. Use as Phase 1 step 1 of MarketForge full or focused runs, or independently when the orchestrator needs to fill discovery gaps.
---

# MarketForge Discovery

Read shared references at `../_marketforge-shared/references/`. Apply `guided-marketing-interview.md` rigorously.

## Global quality rules

- Apply the guided interview protocol — at most 5 questions in initial round, 3 in follow-up.
- For every blocking question, supply recommendation + default + what-AI-will-assume.
- Do not ask preference-heavy questions where research can answer.
- Do not ask questions already answered by SpecForge docs, existing website, or prior user answers.
- Use `opinionated-marketing-decision-template.md` for every decision card.
- Restate intent first; question second.

## Purpose

Capture the minimal-sufficient input set for the rest of MarketForge to produce a non-generic plan:

- Product description (1-2 sentences).
- Business model classification (10 options per glossary).
- Stage (pre-PMF, early post-PMF, scaling, mature).
- Budget tier (T1 / T2 / T3 / T4+).
- Founder profile (technical / sales / content / design / operator).
- Asymmetric advantages (founder audience, partnerships, viral mechanic, local dominance, counter-positioning, proprietary data).
- 90-day target outcome.
- Hard constraints (banned channels, regulated domain, time deadlines, banned tools).

## Mode-aware behavior

- **Greenfield / Mode A:** Full discovery interview; no inputs to read.
- **Mode B / C:** Read SpecForge if present + existing website (WebFetch homepage, pricing, about); skip questions answered by inputs.
- **Mode D (Launch-imminent):** Skip non-essential discovery; ask only what's blocking the launch sequence.
- **Mode E (Continuous):** Re-read prior discovery; ask only about changes since last run.

## Inputs

- SpecForge `docs/app-plan/product/` if present.
- VisualForge `docs/design-system/` if present (informs founder design profile).
- Existing website (if URL supplied; WebFetch homepage + pricing + about).
- Prior MarketForge run state if exists.
- User prompt and follow-up answers.

## Outputs

- `docs/marketing-plan/01-foundations/marketing-brief.md`
- Decision cards: DEC-001 (business model classification), DEC-002 (stage), DEC-003 (budget tier), DEC-004 (90-day target), DEC-005 (asymmetric advantages), DEC-006 (hard constraints).
- `auditability/assumptions-register.md` updated with any AI-assumed values.

## Output structure

```markdown
<!-- marketforge: ... -->

# Marketing Brief

## Product
- **Name:** [from user / SpecForge]
- **One-sentence description:** [in user's own words ideally, refined for clarity]
- **Stage:** [pre-PMF / early post-PMF / scaling / mature]
- **Current paying customers (or pre-launch waitlist):** [N + ARR/MRR if SaaS, total revenue if DTC]

## Business model
- **Classification:** [one of the 10 from business-model-channel-fit.md]
- **Pricing / monetization:** [free + paid? subscription? one-time? marketplace fee?]
- **Target ACV / AOV:** [number with currency]
- **Sales cycle:** [self-serve / inside sales / enterprise]

## Customer
- **One-sentence ICP (provisional until ICP subskill runs):** [specific]
- **Geographic reach:** [country / region / language]

## Team & resources
- **Founder profile:** [technical / sales / content / design / operator + brief context]
- **Team size & dedicated marketing capacity:** [hours/week from founder + hired roles]
- **Budget tier:** [T1 / T2 / T3 / T4+]
- **Monthly marketing spend (current):** $[N]
- **Tools / platforms in place:** [list — site CMS, ESP, CRM, ad accounts, analytics]

## Asymmetric advantages
[For each advantage, score impact: High / Medium / Low / None.]
- Founder existing audience: [None | Small <1K | Medium 1-10K | Large 10-50K | Huge 50K+]
- Pre-existing partnerships:
- Viral product mechanic (K-factor potential):
- Local market dominance:
- Counter-positioning opportunity:
- Proprietary data set:

## 90-day target outcome
[Specific, measurable. Examples: "First $50K MRR." "300 net-new paying SaaS customers." "$200K Q3 DTC revenue at <$50 CAC." "Pre-launch waitlist of 5,000 emails."]

## Hard constraints
- **Time deadlines:** [launch date, press embargo, fiscal deadlines]
- **Banned channels (already failed):** [list with one-line reason if known]
- **Banned tools (compliance / preference):** [list]
- **Regulated domain triggers:** [medical / financial / legal / supplements / children / alcohol / firearms / crypto / gambling / political]
- **Cash runway (if pre-revenue or near-term):** [N months]

## Decision cards

[DEC-001 through DEC-006 per the template]

## What we are intentionally NOT doing in this brief

- Defining ICP, positioning, or channel mix — those come from dedicated subskills with their own evidence base.
- Recommending tactics — that's premature until readiness check + ICP + positioning run.
- Including taste-word product descriptions — instead capturing the founder's own language verbatim.

## Sources and basis

- User answers in interview: [date, summary]
- SpecForge docs read: [paths]
- Existing website scraped: [URL, sections, date]
- Assumptions made: [list with rationale]
```

## The interview script (when no inputs available)

Open with the restate-intent paragraph from `guided-marketing-interview.md`. Then ask the 5 questions (Q1-Q5) in that file.

Capture answers into the marketing brief template. For any unanswered question, use the documented default and mark `Source basis: Assumption`.

## When user is vague

If the user says "build my marketing department" with minimal product info:

1. Restate what little is known.
2. Ask Q1-Q5 from guided-marketing-interview.md.
3. If still vague after one round, ask one more concrete follow-up: "Walk me through what happens between a person hearing about your product and paying you. Even 1-2 sentences each step."
4. Proceed with discovered + assumed values.

## Refusal scope

If the product description matches a hard-refuse category (per orchestrator):

- Illegal product (in user's jurisdiction).
- Deceptive / adversarial marketing intent.
- Targeting minors without COPPA-compliant approach.
- Manufactured testimonials / fake reviews / paid PBN / similar manipulation.

Refuse to produce the brief; propose a safe alternative scope (e.g., "the legitimate version of what you described").

## Sources and basis

V3 Marketing Guide §12.1 (Project classification — 8+ dimensions), §1.7 (Founder-market fit), §12.10 (When to recommend doing less).
