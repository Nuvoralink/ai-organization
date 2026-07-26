---
name: marketforge-jtbd-interviews
description: Run Jobs-to-be-Done analysis using Moesta switch-interview methodology (pre-PMF / <30 customers) or Ulwick Outcome-Driven Innovation (post-PMF / >200 customers). Captures push/pull/anxiety/habit forces and the customer's actual hiring/firing language. Use as Phase 1 step 4 of MarketForge full runs.
---

# MarketForge JTBD Interviews

Read shared references, especially `_marketforge-shared/templates/jtbd-template.md`. Choose methodology based on customer count.

## Global quality rules

- Apply Rob Fitzpatrick's Mom Test rules: talk about their life, not your idea; ask about specifics in the past, not hypotheticals; talk less, listen more.
- Never demo during a discovery interview. Counting compliments as validation is anti-pattern #2 of the V3 guide.
- Use the exact language interviewees use. Capture verbatim quotes — they become source for copy.
- 15-20 switch interviews minimum for Moesta methodology to produce reliable themes.

## Purpose

Produce a JTBD analysis that:
1. Reveals why customers actually fire what they were doing and hire your product.
2. Captures the specific trigger events that move them from inertia to switch.
3. Surfaces the language they use (becomes source for VOC + copy + ad messaging).
4. Documents the 4 forces (push, pull, anxiety, habit) per customer + thematically.

## Methodology decision

| Customers | Use |
|---|---|
| <30 | Moesta switch interviews — qualitative, 15-20 interviews |
| 30-200 | Hybrid — Moesta for narrative + early Ulwick for structure |
| >200 | Ulwick ODI — quantitative outcome scoring |

## Inputs

- `marketing-brief.md` for ICP scope.
- Customer list (recent buyers — purchased in last 90 days for Moesta).
- SpecForge product brief if present.
- Interview transcripts if user has already conducted some.

## Outputs

- `docs/marketing-plan/01-foundations/jtbd-analysis.md`
- DEC-016 through DEC-019 — JTBD findings
- Updates to `auditability/voc-quotes-bank.md` with verbatim quotes for copywriting

## Mode-aware behavior

### Greenfield / pre-customer
- Cannot run real interviews. Use SpecForge user research if present. Otherwise mark Source basis: Hypothesis. Plan for interviews post-launch.

### MarketForge produces interview guide, not the interviews
- This subskill produces the **interview script** and theme-extraction framework. The actual interviews are run by the user / sales team.
- After the user supplies transcripts, re-run the subskill in synthesis mode.

### Synthesis mode
- User pastes transcripts (or links them).
- Subskill extracts themes per the `jtbd-template.md` synthesis section.

## The Moesta switch-interview guide

If the user has not yet conducted interviews, produce this script:

```markdown
# JTBD Switch Interview Guide

**Target:** 15-20 customers who purchased in the last 90 days.
**Duration:** 45-60 minutes each.
**Method:** Video call recorded + transcribed (with consent).

## Opening (2 min)
"Thanks for joining. I want to understand the story of how you came to use [Product] — the timeline, the moments, what was happening. There are no right answers. I'm not here to demo or sell anything. The more concrete the stories, the more useful for me."

## The timeline (40 min)

### When did you FIRST start thinking about a solution? (5 min)
- "Take me back to the first time you thought 'I need something for this' — what was happening?"
- Listen for: trigger event, push force, current solution's failure point.

### What were you using BEFORE? (5 min)
- "What were you using or doing to handle [problem area] back then?"
- Listen for: real status quo, including 'spreadsheets' and 'doing it manually.'

### When did you start actively looking at options? (5 min)
- "Walk me through that. What changed? What made you actually look at solutions?"
- Listen for: the trigger that moved them from inertia to action.

### What options did you consider? (5 min)
- "What did you look at?"
- "How did you find [Product]?"
- Listen for: competitive set, attribution source (often dark social).

### What gave you pause? (5 min)
- "What concerns did you have? What kept you from buying sooner?"
- Listen for: anxiety forces, objections, stakeholders who needed convincing.

### What was the moment you decided? (5 min)
- "Was there a specific moment when you said 'OK, we're doing this'?"
- Listen for: pull force apex.

### What was it like in the first 2 weeks? (5 min)
- "How did onboarding go? When did you feel it was actually working?"
- Listen for: aha moment, friction, churn risks.

### What would have killed the deal? (3 min)
- "If something had been different, you might not have bought. What was the closest call?"
- Listen for: dealbreakers.

### How would you describe [Product] to a colleague? (2 min)
- Listen for: their language for your product. This becomes ad copy / hero copy.

## Closing (3 min)

- "What didn't I ask that you wish I had?"
- "Can we follow up if I have questions later?"
- Thank.

## After every interview
- Transcribe within 24 hours.
- Mark verbatim quotes for VOC bank.
- Tag the 4 forces.
- Note the specific trigger event.
- Note the closest-call moment.

## After 15-20 interviews
- Theme extraction per jtbd-template.md.
- Top 10 verbatim quotes for copy use.
- Distribution of trigger events.
- Distribution of attribution sources.
- Synthesis into messaging architecture and ICP refinements.
```

## Synthesis output structure

After interviews exist (or user pastes transcripts):

```markdown
# JTBD Analysis

## Methodology
- Method: [Moesta switch / Ulwick ODI / hybrid]
- N interviews: [count]
- Date range: [earliest – latest]
- Conducted by: [user / sales / external researcher]

## Per-interview JTBD records
[One per interviewee per the jtbd-template.md]

## Theme analysis

### Push forces (top 5 by frequency)
1. [Theme] — N=X — example quote: "[verbatim]"
2. ...

### Pull forces (top 5)
1. ...

### Anxiety forces (top 5)
[These become objection-handling content + sales enablement.]

### Habit / inertia forces (top 5)

### Trigger events (the moment they started looking)
[Distribution. Feeds outbound triggers + content angles.]

### Attribution sources (how they heard about you)
[Distribution. Important for confirming dark social.]

### Time-to-purchase (median, range)

### Top 10 verbatim quotes for copy

1. "[Quote 1]" — interview JT-007 — usable for: [hero / ad headline / objection / etc.]
2. "[Quote 2]" — usable for: ...

## Implications

### For messaging architecture (cross-cite into marketforge-messaging-architecture)
- Lead messaging with [theme] — supported by N=X interviews.
- Address [objection] explicitly in [funnel stage].
- Use the exact phrase "[verbatim]" in hero — N=4 interviewees independently used this phrase.

### For ICP / persona refinement (cross-cite into marketforge-icp-persona)
- Sub-segment identified: [pattern across N interviews] — recommend split into separate ICP.
- Trigger event most common: [event] — feeds outbound subskills.

### For product / activation (cross-cite into marketforge-onboarding-activation)
- Most common aha moment: [moment] — at week N.
- Most common closest-call: [issue] — affects [activation step].

### For attribution stack
- Dark social signal: N% credited [channel platform-can't-see] — confirms attribution-triangulation need.

## Decision cards
[DEC-016 to DEC-019]

## What we are intentionally NOT doing
- Conducting the interviews (that's the user's job).
- Synthesizing interviews we don't have access to.
- Inferring JTBD from product features (must be customer-sourced).

## Sources and basis

V3 §2.1 (JTBD switch interviews — Moesta), §2.2 (Mom Test — Fitzpatrick), §1.2 (JTBD two schools).
Bob Moesta, *Demand-Side Sales 101*, 2020. Evidence grade: C.
Tony Ulwick, *Jobs to be Done*, 2016. Evidence grade: C (with more replicable methodology than Moesta).
Rob Fitzpatrick, *The Mom Test*, 2013. Evidence grade: C.
```

## When delegating to marketing-skills:customer-research

Invoke `marketing-skills:customer-research` for interview-question design support when the user wants additional question variations. Wrap the output in DEC cards.

## What we are intentionally NOT doing in this layer

- Pretending hypothesized JTBD is real JTBD — labeled Source basis: Hypothesis.
- Counting any feature-feedback session as JTBD (those answer "do you like X?" not "why did you switch?").
- Skipping the synthesis pass — single transcripts produce anecdote, not insight.

## Sources and basis

V3 §2.1, §2.2, §1.2. Moesta, Ulwick, Fitzpatrick.
