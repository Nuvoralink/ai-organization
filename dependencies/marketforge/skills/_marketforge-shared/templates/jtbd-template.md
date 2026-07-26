# Jobs-to-be-Done Template

Capture JTBD insights from interviews (Moesta switch-interview methodology) or from quantitative outcome scoring (Ulwick ODI). Output: `docs/marketing-plan/01-foundations/jtbd-analysis.md`.

## Choose the methodology

| Stage | Methodology | Why |
|---|---|---|
| <30 customers | Moesta switch interviews | Qualitative, narrative, captures language |
| >200 customers | Ulwick ODI | Quantitative, outcome-scored, prioritization |
| 30-200 customers | Hybrid — start with Moesta, layer Ulwick later | |

## Moesta switch-interview template (qualitative)

For each interviewee (target: 15-20 recent switchers):

```markdown
### Interview JT-NNN — [interviewee handle]

**Date:** YYYY-MM-DD
**Tenure as customer:** [days/weeks]
**Purchase date:** YYYY-MM-DD
**Segment:** [ICP or sub-segment]
**Role:** [their job title in their company]

#### The switch

- **From (previous tool / process / habit):** [specific name or description]
- **To (your product):**
- **When did they first start looking?** [date or relative — "about 6 weeks before purchase"]
- **When did they first hear about you?** [date / source]
- **When did they decide?** [date]
- **Time from first-thought to purchase:** [N days]

#### The 4 forces

**Push (away from current):**
[Direct quotes. What was failing in their current situation. What was the trigger event — the moment they realized the current situation wasn't sustainable.]

> "[Direct quote]"

**Pull (toward your product):**
[What attracted them. What specific moment / story did they hear that made them think "this is for me." Often a colleague's endorsement, a content piece, a specific feature, a pricing dynamic.]

> "[Direct quote]"

**Anxiety (about switching):**
[What gave them pause. Concerns about migration, data loss, retraining team, missing features. Why did they wait? What did they evaluate against?]

> "[Direct quote]"

**Habit (inertia):**
[What kept them stuck longer than they should have been. Sunk cost, internal politics, lack of time, no clear ROI case to make to stakeholders.]

> "[Direct quote]"

#### The actual moment of decision

[The specific moment / day / event when they decided to commit. Often very specific: "I was on call at 2am for the third time that week and I just said, never again.'"]

#### What they evaluated against

- [Competitor A] — rejected because [reason in their words]
- [Competitor B] — rejected because [reason]
- [Status quo] — rejected because [reason]

#### The first-value moment (their words)

[When they first felt the product was working. The "aha moment" in their language.]

> "[Direct quote]"

#### What would have stopped them from buying

[What was the closest near-miss? At what point did they almost not buy? What would have killed the deal?]

> "[Direct quote]"

#### Their language for the problem

Capture verbatim phrases that go into copy:

- "[Phrase 1 — for hero copy]"
- "[Phrase 2 — for ad headlines]"
- "[Phrase 3 — for objection-handling]"
- "[Phrase 4 — for case study]"
```

## Theme extraction (across interviews)

After 15-20 interviews:

```markdown
## JTBD theme analysis

**N interviews analyzed:** [N]
**Date range:** [earliest – latest]

### Most common push forces (in their words)
1. [Theme + N mentions] — example quote: "[quote]"
2. [Theme + N mentions] — example quote: "[quote]"
3. [Theme + N mentions]

### Most common pull forces
1. [Theme + N]
2. ...

### Most common anxiety / objections
1. [Theme + N] — example quote: "[quote]" — how to address in copy: [recommendation]
2. ...

### Most common habit / inertia
1. [Theme + N]
2. ...

### Most common time-to-decide
[Median, range, distribution]

### Most common "first heard about us" sources
[Distribution. Feeds attribution understanding.]

### Most common "what would have killed the deal" themes
[High-priority objections to address in funnel + copy.]
```

## Ulwick ODI template (quantitative)

For mature products with >200 customers:

```markdown
## Outcome-driven innovation survey

**Target audience:** [ICP segment]
**Survey N:** [respondents]
**Survey period:** [dates]

### Identified outcomes (sourced from interviews + customer feedback)

For each outcome, ask:
- "How important is it to you that [outcome]?" (1-5)
- "How satisfied are you with the current ability to achieve [outcome]?" (1-5)

#### Opportunity score = Importance + max(Importance − Satisfaction, 0)

| Outcome | Importance avg | Satisfaction avg | Opportunity score | Priority |
|---|---|---|---|---|
| [Outcome 1, written as "minimize the time it takes to..."] | 4.7 | 2.1 | 7.3 | High |
| [Outcome 2] | 4.5 | 3.4 | 5.6 | Medium |
| [Outcome 3] | 4.2 | 4.0 | 4.4 | Low |

### Opportunity scoring read

- **High-priority outcomes (score >5):** these are under-served opportunities. Build / message against these.
- **Medium-priority (score 4-5):** address in supporting messaging.
- **Low-priority (score <4):** already well-served by category; not differentiation.

### Implications for messaging

- Lead with [outcome] in hero — Opportunity score 7.3.
- Address [outcome] in feature page — Opportunity score 6.1.
- Don't lead with [outcome] — already well-served, undifferentiated.

### Implications for product

- [Feature gap] — Opportunity score X — recommend [build / partner / skip].
```

## Synthesis output

`docs/marketing-plan/01-foundations/jtbd-analysis.md` includes:

1. Methodology used (Moesta / Ulwick / hybrid) + rationale.
2. N interviews / surveys + date range.
3. The 4 forces summary table.
4. Most common themes per force.
5. Outcome / opportunity scoring (if Ulwick).
6. Top 10 verbatim quotes (becomes source for copy).
7. Implications for messaging architecture (cross-cite into `marketforge-messaging-architecture`).
8. Implications for product (cross-cite into SpecForge if exists, or `auditability/product-changes-required.md`).

## Anti-patterns to avoid

### Anti-pattern A: Demoing during "discovery"

Founder demos during interview. Counts compliments as validation. Useless data.

### Anti-pattern B: Asking hypotheticals

"Would you use a feature that..." Hypotheticals don't predict behavior. Ask about specifics in the past.

### Anti-pattern C: Asking about your idea

"What do you think of our product?" Talks about you. Should talk about them. Mom Test rule #1.

### Anti-pattern D: One interview, decisive conclusions

A single switch-interview is signal; 15-20 reveal patterns. Don't make budget decisions on N=2.

### Anti-pattern E: Synthetic personas from no interviews

"Founder thinks the ICP is X based on hypothesis." Mark explicitly as Assumption / Source basis: Assumption. Don't pretend it's evidence.

## Sources and basis

Cite:
- Interview list + dates + transcripts location.
- VOC mining sources.
- Survey methodology + N + collection method.
- Evidence grade per finding.
