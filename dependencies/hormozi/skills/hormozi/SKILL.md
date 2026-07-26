---
name: hormozi
description: Turn a product into Alex Hormozi's actual playbook from $100M Offers and $100M Leads. Master orchestrator — routes by task and assembles the deliverable. Use to build a Grand Slam Offer, engineer a lead magnet, design a lead-generation plan (Core Four + Rule of 100), write guarantees or offer names, or grade an existing offer. Say what you want ("build me an offer for X", "design a lead magnet", "how do I get leads for Y") and it runs the right sub-skills. For a single narrow task, the matching hormozi-* sub-skill can be invoked directly.
metadata:
  version: 0.1.0
---

# Hormozi Engine — Master Orchestrator

Point this at a product; it runs Hormozi's real methods and assembles the offers, lead magnets,
guarantees, names, and lead-gen roadmaps the two books prescribe. Every sub-skill is one chapter/task
from the books; this orchestrator decides which to run and stitches the output together.

**Read first:** `../_hormozi-shared/references/orchestration-protocol.md` (routing + assembly) and
`../_hormozi-shared/references/decision-and-fidelity-rubric.md` (how every artifact must be produced).

## Operating rules
- **Faithful to the book.** Run the named framework's steps in order; use Hormozi's terminology; output
  the *applied result for this product*, not a summary of the chapter. (Rubric §1.)
- **Grounded + no fabrication.** Build from the product's real specifics; never invent statistics or $
  values — derive them or mark `<placeholder>`. (Rubric §2–3.)
- **Run only what the task needs.** Don't run the whole engine for a narrow ask.
- **Bounded intake.** Gather missing product context in one short batch, then proceed; flag assumptions.
- The word "leverage" and Hormozi's loud, direct register are correct here — this engine has no
  banned-word list beyond empty hype and fabrication.

## Flow
0. **Pre-flight** (full builds): run `$hormozi-self-test`. FAIL blocks the run.
1. **Detect the task** and route (table below).
2. **Bounded intake** — product, avatar, dream outcome, price, economics, constraints (protocol §2).
3. **Run sub-skills in dependency order** (protocol §3).
4. **Assemble** into one deliverable in the book's presentation order (protocol §4).
5. **Fidelity self-check** — run `$hormozi-fidelity-audit`; fix any FAIL before delivering (rubric §5).
6. **Deliver** + name the next step in Hormozi's sequence.

## Routing

| Ask | Runs |
|---|---|
| `build-offer` / "make my offer" | `$hormozi-offers` chain: market → value-equation → builder → enhancers → guarantees → pricing → naming → grader |
| `grade-offer` / "fix my offer" | `$hormozi-offer-grader` (+ targeted rebuild of the weakest driver) |
| "just the guarantee / name / bonuses / pricing / market" | the single `$hormozi-offer-*` |
| `lead-magnet` | `$hormozi-lead-magnet` (needs a defined offer + avatar) |
| `lead-gen-plan` / "how do I get leads" | `$hormozi-leads` chain: roadmap → chosen Core Four → lead-getters → more-better-new |
| "referrals / affiliates / cold / content / ads / employees / agencies" | the single `$hormozi-lead-*` |
| free-form | smallest set of sub-skills that answers it; state which ran |

## Sub-skills
- **Offers:** `hormozi-offers` (chain) · `hormozi-offer-market` · `-value-equation` · `-builder` ·
  `-enhancers` · `-guarantees` · `-naming` · `-pricing` · `-grader`.
- **Leads:** `hormozi-leads` (chain) · `hormozi-lead-magnet` · `-warm` · `-content` · `-cold` ·
  `-paid` · `-more-better-new` · `-referrals` · `-employees` · `-agencies` · `-affiliates` · `-roadmap`.
- **Gates:** `hormozi-self-test` (pre-flight) · `hormozi-fidelity-audit` (post).

## Sample invocations
- `$hormozi build-offer "AI bookkeeping for Shopify stores"`
- `$hormozi lead-magnet "AI bookkeeping for Shopify stores"`
- `$hormozi lead-gen-plan "local HVAC company"`
- `$hormozi grade-offer` (paste your current offer)
- `$hormozi make me a guarantee for my $2k coaching program`

## What we are intentionally NOT doing
- Not executing anything live (no sending, posting, or spending) — the engine produces the plan/assets.
- Not modifying MarketForge or any other skill; this engine is standalone.
- Not inventing numbers to fill a template — placeholders are surfaced for the user to fill.

## Sources and basis
Alex Hormozi, *$100M Offers* (2021) and *$100M Leads* (2023). Frameworks encoded in
`../_hormozi-shared/references/`; each sub-skill cites its section.
