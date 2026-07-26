# Hormozi Engine

**Turn Alex Hormozi's *$100M Offers* and *$100M Leads* into an AI you point at a product.**

Give it your product; it runs Hormozi's actual methods and generates Grand Slam Offers, engineered
lead magnets, guarantees, offer names, lead-generation roadmaps, outreach scripts, and the
step-by-step guides the books prescribe — faithful to the frameworks, applied to *your* business.

Every sub-skill is one chapter / section / task from the books. A master orchestrator (`$hormozi`)
routes by what you ask for and assembles the pieces.

> Built for personal use from books the user owns. The engine encodes Hormozi's **methods**
> (formulas, steps, decision rules) — not the books' text. Hormozi teaches these frameworks publicly.

## Quick start

```
$hormozi build-offer <product>       # full Grand Slam Offer: market → value equation → 5-step
                                     #   build → enhancers → guarantee → name → grade
$hormozi lead-magnet <product>       # the 7-step lead-magnet process
$hormozi lead-gen-plan <product>     # Core Four + Rule of 100 + Open To Goal roadmap
$hormozi grade-offer <your offer>    # pressure-test an existing offer against the Value Equation
$hormozi <free-form ask>             # orchestrator picks the right sub-skills and composes them
```

You can also invoke any sub-skill directly, e.g. `$hormozi-offer-guarantees <product>`.

## What's inside

### Offers ($100M Offers)
| Sub-skill | Book task |
|---|---|
| `hormozi-offer-market` | Pick a "Starving Crowd" — the 4 market indicators, commit to a niche |
| `hormozi-offer-value-equation` | Score & maximize the 4 value drivers |
| `hormozi-offer-builder` | The 5-step engine: dream → problems → solutions → delivery → trim & stack |
| `hormozi-offer-enhancers` | Scarcity, urgency, bonuses |
| `hormozi-offer-guarantees` | The full guarantee taxonomy + builder |
| `hormozi-offer-naming` | The M-A-G-I-C naming formula |
| `hormozi-offer-pricing` | Charge what it's worth; the virtuous cycle of price |
| `hormozi-offer-grader` | Pressure-test an offer against the Value Equation |

### Leads ($100M Leads)
| Sub-skill | Book task |
|---|---|
| `hormozi-lead-magnet` | The 7-step lead-magnet process |
| `hormozi-lead-warm` | Core Four #1 — Warm Outreach (10 steps, Rule of 100) |
| `hormozi-lead-content` | Core Four #2 — Post Free Content (Hook · Retain · Reward) |
| `hormozi-lead-cold` | Core Four #3 — Cold Outreach (list → personalize → big fast value → volume) |
| `hormozi-lead-paid` | Core Four #4 — Paid Ads (Call-out + Value + CTA; Client-Financed Acquisition) |
| `hormozi-lead-more-better-new` | Scale the Core Four |
| `hormozi-lead-referrals` | Lead Getter #1 — Customer referrals |
| `hormozi-lead-employees` | Lead Getter #2 — Employees |
| `hormozi-lead-agencies` | Lead Getter #3 — Agencies |
| `hormozi-lead-affiliates` | Lead Getter #4 — Affiliates & partners (6-step army) |
| `hormozi-lead-roadmap` | Rule of 100, Open To Goal, the sequence |

### Orchestration & quality
| Sub-skill | Role |
|---|---|
| `hormozi` | Master orchestrator — routes by task, assembles the deliverable |
| `hormozi-offers` / `hormozi-leads` | Per-book sub-orchestrators |
| `hormozi-self-test` | Phase-0 integrity gate (inventory, references, contracts) |
| `hormozi-fidelity-audit` | Checks the generated output actually follows the book method |

Shared frameworks and protocols live in `skills/_hormozi-shared/`.

## Status

Under construction — see [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) for the live slice-by-slice
progress. Offers chain is being built first.
