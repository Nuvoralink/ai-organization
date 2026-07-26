# SpecForge Bridge

SpecForge (when present at `${DEPENDENCY:specforge}` or installed as a skill) produces the product specification: product brief, PRD, user roles, features, data contracts, monetization, business model.

MarketForge reads SpecForge outputs to ground its marketing decisions in the actual product specification rather than inferring from a brief description.

## When SpecForge docs exist

Check for `docs/app-plan/` in the target repo. If present:

### Read on every relevant subskill

- `docs/app-plan/product/product-brief.md` (or `01-product-brief.md` in legacy layouts) — product concept, audience, hard non-goals.
- `docs/app-plan/product/prd.md` — feature scope, MVP definition.
- `docs/app-plan/product/business-model.md` (or `monetization.md`) — pricing, monetization, target ACV/AOV.
- `docs/app-plan/product/user-roles.md` — user roles, permissions, protected actions.
- `docs/app-plan/product/business-gtm-monetization.md` — GTM intent from SpecForge.
- `docs/app-plan/product/ux-ui-content.md` — UX content patterns.
- `docs/app-plan/product/glossary.md` — terminology to use consistently.
- `docs/app-plan/product/platform-feature-contracts.md` — platform/feature dependencies.

### Consumed by

| MarketForge subskill | Consumes from SpecForge |
|---|---|
| `marketforge-discovery` | product brief, business model, user roles |
| `marketforge-positioning` | product brief (intent, non-goals) |
| `marketforge-icp-persona` | user roles, audience description |
| `marketforge-jtbd-interviews` | PRD features as "jobs" candidates |
| `marketforge-competitive-intel` | competitive context if present |
| `marketforge-channel-strategy` | business model classification |
| `marketforge-pricing-strategy` | monetization spec |
| `marketforge-website-copy` | feature scope, glossary, terminology |
| `marketforge-content-strategy` | feature scope (what to write about) |
| `marketforge-paid-search` | pricing/ACV for budget math |
| `marketforge-onboarding-activation` | aha-moment + activation events from PRD |
| `marketforge-email-lifecycle` | trial/paid flow from monetization spec |
| `marketforge-customer-marketing` | user roles for case-study targeting |
| `marketforge-analytics-stack` | event schema from PRD |

## Reading discipline

When SpecForge defines a fact, MarketForge MUST use it consistently. Examples:

- If SpecForge says monetization is "$9.99/mo consumer subscription," MarketForge uses that in CAC payback math, channel selection (ASA + UAC dominant), and pricing copy.
- If SpecForge defines user roles as "Owner / Admin / Member," MarketForge uses those role names in ICP personas, lifecycle email segments, and message-stage matrices.
- If SpecForge defines feature glossary terms, MarketForge website copy and ad copy uses the same terms (no terminology drift).

## When SpecForge does NOT exist

MarketForge runs in greenfield mode (Mode A) or existing-no-marketing mode (Mode B). The discovery interview captures what SpecForge would have provided:

- Business model classification.
- Target customer description.
- Feature scope (high-level).
- Pricing/monetization (target ACV / AOV).
- User roles (if applicable).

These are written to `docs/marketing-plan/01-foundations/marketing-brief.md` rather than to SpecForge's product brief.

## Coordination handoff

If the user runs SpecForge AFTER starting MarketForge:

1. The orchestrator detects new SpecForge outputs at the next run.
2. Flags any MarketForge decisions that were made before SpecForge was available — particularly positioning, ICP, monetization-dependent channel decisions.
3. Suggests revision-mode passes on affected subskills.

If the user runs SpecForge BEFORE starting MarketForge:

1. MarketForge reads SpecForge as authoritative for product spec.
2. Marketing decisions defer to SpecForge product facts unless explicitly overridden.

If the user runs them in parallel:

1. MarketForge waits for SpecForge product brief + PRD if SpecForge is still running.
2. If SpecForge is producing the spec while MarketForge needs it, MarketForge logs a soft dependency and proceeds with assumptions, marking those decisions for revision.

## Conflict handling

If MarketForge discovers a marketing-relevant fact that contradicts SpecForge:

Example: SpecForge says "B2B SaaS, $50K ACV." VOC mining + competitive intel suggests product is actually being adopted by 5-person teams paying $50/mo seats.

Resolution: MarketForge does NOT silently override SpecForge. It flags the conflict in `auditability/spec-marketing-conflicts.md` and asks the user:

> "SpecForge characterizes this as B2B mid-market $50K ACV. Marketing discovery suggests current paying customers are actually 5-person teams at $50/mo seats. This is a major positioning conflict.
>
> Options:
> (a) The SpecForge characterization is the target; current customers are non-ICP early adopters. Build marketing for the target (mid-market), let small teams be a side stream.
> (b) The marketing reality is the truth; SpecForge needs updating. Pause MarketForge until SpecForge is revised.
> (c) Both are valid — segmented marketing strategy with separate ICPs.
>
> Default in Auto mode: (c), with the dual-segment plan flagged for user review."

The point: MarketForge surfaces conflicts; doesn't silently choose.

## What MarketForge does NOT cover (SpecForge owns)

- Product feature decisions.
- Architecture, data contracts, API contracts.
- Security, privacy, compliance posture.
- AI guardrails.
- Engineering rules.

If a marketing decision implies a product change (e.g., "we need a 'cancel anytime' guarantee for the homepage promise" or "we need a referral-tracking feature"), MarketForge logs this in `auditability/product-changes-required.md` and the user must coordinate with SpecForge or product engineering separately.

## Reading frequency

In agentic mode (continuous operations), MarketForge re-reads SpecForge outputs:

- Daily light loop: NO (avoid noise).
- Weekly medium loop: YES if SpecForge files have changed since last read.
- Monthly heavy loop: YES (full re-read).
- On scope expansion: YES.

Changes to SpecForge that affect marketing (new feature, new pricing tier, new ICP) trigger revision-mode passes on affected MarketForge subskills.
