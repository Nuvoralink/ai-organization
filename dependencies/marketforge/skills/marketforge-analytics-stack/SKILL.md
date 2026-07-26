---
name: marketforge-analytics-stack
description: Build analytics stack — event schema, KPI dashboard, north-star metric, leading vs lagging indicators. Tool selection (GA4 / Plausible / Mixpanel / PostHog / Amplitude). Use as Phase 9 step 6.
---

# MarketForge Analytics Stack

## Global quality rules

- Event schema set BEFORE shipping new surfaces. Retrofitting is expensive.
- North-star metric: 1 metric the whole company chases. Banal vanity metrics forbidden.
- Leading > lagging indicators where possible.

## Purpose

1. North-star metric.
2. Event schema (taxonomy, naming convention, required vs optional properties).
3. KPI dashboard structure.
4. Tool selection.
5. Data warehouse / ETL decisions (when justified at T3+).

## Inputs
- `marketing-brief.md` (business model), `okr-quarterly-plan.md` (OKR + KR alignment), `channel-strategy.md`.

## Outputs
- `docs/marketing-plan/09-cro-measurement/analytics-stack.md`
- DEC-660 to DEC-669

## Structure

```markdown
# Analytics Stack

## North-star metric
[1 metric. Example for SaaS PLG: "Weekly active workspaces with ≥3 active users." Example for DTC: "Repeat-rate-weighted 90-day revenue." Example for marketplace: "Weekly transactions in priority geo."]

## Event schema

### Naming convention
- Past tense, snake_case, descriptive.
- Example: `signup_completed`, `trial_started`, `feature_used`, `payment_succeeded`.
- NOT: `Sign Up`, `submitSignupForm`, `SignupV2`.

### Required vs optional properties
[Per event, what properties capture.]

### Core events to track
- `page_viewed` (with path, referrer, UTMs).
- `signup_started` / `signup_completed`.
- `activated` (aha moment reached).
- `feature_used` (with feature name).
- `payment_succeeded` / `subscription_started`.
- `trial_started` / `trial_ended`.
- `cancellation_requested` / `cancellation_completed`.

### Custom events per business
[List per business model.]

## KPI dashboard structure

### Top section (north-star + 3-5 supporting)
- North-star metric (weekly + monthly trend).
- Top 3-5 supporting KPIs.

### Acquisition section
- Channel-level CAC (triangulated per `attribution-stack.md`).
- Self-report attribution distribution.
- Channel-level conversion rates.

### Activation section
- Activation rate.
- Time to aha.
- Step-by-step funnel.

### Retention section
- Cohort retention curves.
- Monthly logo / revenue churn (SaaS).
- Repeat rate (DTC).
- NDR (SaaS).

### Revenue section
- MRR / ARR / total revenue.
- New / expansion / churn breakdown.
- LTV by cohort.

### Marketing-specific
- Marketing-influenced revenue.
- Pipeline coverage (B2B).
- Lifecycle email RPR.

## Tool selection

### Web analytics
- GA4: default; free; difficult; not great at retention curves.
- Plausible: privacy-friendly; simple; subscription.
- Fathom: similar to Plausible.

### Product analytics
- Mixpanel: event-based; cohort analysis; standard for SaaS.
- Amplitude: similar; enterprise-friendly.
- PostHog: open-source alternative; self-host option.

### Customer data platform (T3+)
- Segment: event router; data warehouse loader.
- RudderStack: open-source alternative.

### Data warehouse (T3+)
- BigQuery / Snowflake / Postgres.
- Pipe events for SQL-based analysis.

### Visualization
- Looker / Studio (free, GA4-friendly).
- Mode / Hex / Metabase (SQL-driven).

## Cadence

- Daily: anomaly check (huge drops or spikes).
- Weekly: KPI scorecard.
- Monthly: attribution + retention review.
- Quarterly: full review aligned to OKR checkpoint.

## KPIs

[The dashboard itself.]

## Decision cards
[DEC-660 to DEC-669]

## Anti-patterns

- Vanity metrics as top-of-dashboard (impressions, followers).
- "Everything is a KPI" (focus dilution).
- Retrofitting event schema after shipping (expensive).
- Mixing platform-reported data with internal data without methodology notes.

## What we are intentionally NOT doing
- Treating vanity metrics as North Star.
- Defaulting to GA4 reports as primary (often misleading for retention).
- Building dashboards no one reads.

## Sources and basis
Industry-standard analytics practitioner consensus — evidence C.
```

## When to delegate
- `marketing-skills:analytics` for events / KPI design.

## Sources and basis
Practitioner consensus.
