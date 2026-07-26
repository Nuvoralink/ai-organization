# MarketForge — Agent Instructions

This file is for AI agents working on or with MarketForge — either using it to produce marketing plans, or building atop it.

## What MarketForge does

MarketForge produces:
- Marketing strategy + tactical plans
- Website copy + landing pages
- Ad creative briefs + organic content
- Email lifecycle flows + SMS programs
- Channel-specific playbooks (paid, outbound, organic)
- Attribution + measurement frameworks
- Visual asset briefs (delegating to banana for generation)

Always evidence-graded (A/B/C/D/E), commercial-bias-flagged, with kill criteria and reversal triggers.

## How to invoke

### Full package
```
$marketforge
```

Builds the complete marketing system under `docs/marketing-plan/`. Takes 2-12 hours of agent time depending on scope.

### Focused package
```
$marketforge scope=focused channels=[list]
```

Builds only the relevant subskill outputs.

### Audit
```
$marketforge scope=audit
```

Audits existing marketing presence; produces gap report.

### Continuous operations (agentic)
```
$marketforge agentic=on cadence=daily
```

Registers recurring scheduled-tasks for daily/weekly/monthly loops.

### Resume
```
$marketforge resume
```

Resumes interrupted run.

### Override
```
$marketforge override DEC-NNN to "[new direction]"
```

Single-decision override with cascade.

## Required reading before using MarketForge

If you're an agent about to invoke MarketForge or work on its outputs:

1. **`skills/_marketforge-shared/references/anti-slop-marketing-rubric.md`** — Prevents AI slop output.
2. **`skills/_marketforge-shared/references/opinionated-marketing-decision-template.md`** — Decision-card format.
3. **`skills/_marketforge-shared/references/evidence-grading-rubric.md`** — A/B/C/D/E grading.
4. **`skills/_marketforge-shared/references/commercial-bias-map.md`** — Vendor-claim flagging.
5. **`skills/_marketforge-shared/references/readiness-check-protocol.md`** — Pre-paid-spend gate.

## Decision-card discipline

Every material marketing decision uses the template. No exceptions for the orchestrator, every subskill, every output.

Decision IDs allocated per range (see `opinionated-marketing-decision-template.md`):
- DEC-001 to 049: Foundations
- DEC-050 to 099: Strategy
- DEC-100 to 149: Brand
- DEC-150 to 249: Website + Content
- DEC-250 to 349: Paid
- DEC-350 to 399: Outbound
- DEC-400 to 499: Organic & Social
- DEC-500 to 599: Lifecycle
- DEC-600 to 699: CRO & Measurement
- DEC-700 to 749: Visual assets
- DEC-750 to 799: Launch + Execution
- DEC-800 to 899: Operations
- DEC-900 to 999: Audit / drift / supersession

## Delegation to other skills

MarketForge delegates tactical execution to:

- **`marketing-skills:*`** plugin (copywriting, ads, emails, cro, seo-audit, etc.) — see `marketing-skills-bridge.md`.
- **`banana-claude:banana`** — all image generation. See `banana-bridge.md`.

MarketForge owns: strategy, evidence-grading, decision-card wrapping, cross-cites, kill criteria.
Plugin skills own: tactical execution (per-page copy, per-ad copy, per-email body).

## Agentic mode safety rules

When running in `agentic=on` mode:

- Never auto-publish to public surfaces without approval (default).
- Never auto-push ad spend changes without approval (default).
- Anomalies > thresholds pause agentic execution and surface to user.
- Daily operations journal must be written.
- Approval queue must not exceed 20 pending (block new generations if so).

See `agentic-operations-protocol.md` for full safety guardrails.

## Refusal scope

Refuse to produce:
- Fake reviews / testimonials.
- AI-generated customer / executive faces presented as real.
- Deceptive scarcity / urgency.
- Defamatory comparison content.
- Targeting minors without COPPA-compliant approach.
- Regulated-domain marketing without compliance plan.
- "Buy followers / reviews / backlinks / PBN" requests.

Propose safe alternative scope when refusing.

## Sources

V3 Marketing & Customer Acquisition Operating Guide is the doctrinal source. Cite V3 sections in subskill outputs.
