---
name: marketforge-onboarding-activation
description: Optimize onboarding + activation. Identify aha moment, baseline activation rate, fix to-first-value path. The PLG critical subskill. Pendo / Userflow / Appcues. Use as Phase 8 step 7.
---

# MarketForge Onboarding + Activation

Apply V3 §6.6. This is THE marketing metric for PLG SaaS — channel quality without it is noise.

## Global quality rules

- Activation rate before scaling acquisition (Balfour).
- "Aha moment" = first session where user gets core value.
- Optimize activation before scaling acquisition.
- Tools: Pendo, Userflow, Appcues, in-house flags.

## Purpose

1. Define aha moment specifically.
2. Map current activation funnel.
3. Identify friction / drop-off points.
4. Build improved onboarding flow.
5. Measure activation rate baseline + target.

## Inputs
- SpecForge `docs/app-plan/product/` if present (feature flows).
- `voice-of-customer.md` (aha moment in customer's words).
- `jtbd-analysis.md` (first-value moment language).
- `analytics-stack.md` (event schema for measurement).
- `email-lifecycle.md` (welcome flow coordination).

## Outputs
- `docs/marketing-plan/08-lifecycle/onboarding-activation.md`
- DEC-555 to DEC-559

## Structure

```markdown
# Onboarding & Activation

## Aha moment definition

[Specific action / state that represents user got value. From VOC + interviews.]

Example: "User imported their first 100 customers from their existing CRM and created their first segment within 4 minutes."

NOT: "User completed onboarding."
NOT: "User logged in."

## Activation rate

- Current baseline: [%] of signups reach aha within [N days].
- 12-week target: [%]
- Methodology: [event tracking + cohort analysis].

## Current funnel + drop-offs

| Step | % completing | Friction observed |
|---|---|---|
| Signup | 100% | — |
| Email verify | X% | Email delivery |
| First login | X% | Onboarding complexity |
| Set up first thing | X% | Required field count, jargon |
| Reach aha moment | X% | Connection to data, dependencies |

## Onboarding flow design

### Time-to-first-value target
- <5 minutes for B2B SaaS PLG.
- <2 minutes for consumer / mobile.

### Steps
- Step 1: minimal viable signup (3 fields max; social login if possible).
- Step 2: explicit aha-moment shortcut (skip the long setup; show one quick win).
- Step 3: just-in-time guidance via in-app messages.
- Step 4: explicit declaration of milestone reached (celebrate the aha).

### Anti-patterns
- Full app tour before any value.
- Requiring 12 fields to start.
- Hiding the aha moment behind multi-step setup.

## Coordination with email + in-app

- Welcome email: amplify the aha-moment promise + provide quick-start link.
- In-app: just-in-time tooltips at friction points.
- Re-engagement: triggered when user signed up but didn't reach aha within N days.

## Tools

| Tool | Use |
|---|---|
| Pendo | Web SaaS; analytics + in-app + onboarding |
| Userflow | Web SaaS onboarding focused |
| Appcues | Web SaaS onboarding |
| Intercom | SaaS + customer messaging |
| Custom feature flags | DIY when team has engineering capacity |

## KPIs

- Activation rate (THE PRIMARY METRIC for PLG).
- Time to aha (median).
- Step-by-step funnel conversion.
- Activation × paid conversion (does activation lift drive paid conversion lift?).

## Decision cards
[DEC-555 to DEC-559]

## Anti-patterns

- Full feature tour as default onboarding.
- 10+ required signup fields.
- "Welcome to [product]" without quick path to value.
- Long video as onboarding (most users skip).
- Hiding the aha moment behind a paywall.

## What we are intentionally NOT doing
- Scaling paid acquisition before activation is solid (leaky bucket).
- Treating onboarding as one-time (it's a continuous optimization target).
- Ignoring activation rate as the primary PLG KPI.

## Sources and basis
V3 §6.6.
```

## When to delegate
- `marketing-skills:onboarding` for onboarding flow design.
- `marketing-skills:signup` for signup flow optimization.

## Sources and basis
V3 §6.6.
