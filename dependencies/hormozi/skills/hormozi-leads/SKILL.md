---
name: hormozi-leads
description: Build a complete lead-generation system for a product using Alex Hormozi's $100M Leads method — engineer a lead magnet, pick and run the Core Four (warm outreach, post free content, cold outreach, paid ads) with the Rule of 100, then add Lead Getters (referrals, employees, agencies, affiliates) for leverage, and scale with More/Better/New. Use when the user wants a lead-gen plan built. For one piece only, use the specific hormozi-lead-* sub-skill.
---

# Hormozi Leads — Sub-Orchestrator ($100M Leads)

Runs the lead-generation arc and assembles a concrete plan: what to advertise, which channels to run
now, the daily commitment, and how to scale. Invoked by `$hormozi lead-gen-plan`, or directly.

**Read first:** `../_hormozi-shared/references/orchestration-protocol.md`, `decision-and-fidelity-rubric.md`,
and the Leads references (`lead-magnet-7-step.md`, `core-four.md`, `lead-getters.md`,
`rule-of-100-and-roadmap.md`, `more-better-new.md`).

## Prerequisite
Leads need something to advertise. If there's no defined offer, run `$hormozi-offers` first (or at
least confirm the offer + avatar). A lead magnet is built *for* an offer.

## Chain
1. **`hormozi-lead-roadmap`** — apply the Roadmap + Rule of 100 to *this* business: which of the Core
   Four to start with (warm outreach first for most), the daily commitment, and the order to add the
   rest. This decides what runs below.
2. **`hormozi-lead-magnet`** — engineer the lead magnet (7-step process) that powers all four channels.
3. **Chosen Core Four** (run the ones the roadmap selected, not all at once):
   - `hormozi-lead-warm` — Warm Outreach (10 steps, Rule of 100).
   - `hormozi-lead-content` — Post Free Content (Hook · Retain · Reward).
   - `hormozi-lead-cold` — Cold Outreach (list → personalize → big fast value → volume).
   - `hormozi-lead-paid` — Paid Ads (Call-out + Value + CTA; Client-Financed Acquisition).
4. **Lead Getters** (for scale/leverage, once the Core Four works):
   - `hormozi-lead-referrals` · `hormozi-lead-employees` · `hormozi-lead-agencies` · `hormozi-lead-affiliates`.
5. **`hormozi-lead-more-better-new`** — scale what's working (do More, do it Better, add New).

## Intake
Offer + avatar (or run Offers first); current lead sources; the founder's assets (existing contacts,
audience, budget, team); constraints. Ask for what's missing in one batch.

## Assembly
Produce a lead-gen plan: the lead magnet spec, the starting channel(s) with their Rule-of-100 daily
action + scripts, the sequence for adding channels, the Lead-Getter plan for scale, and the
More/Better/New levers. Then run `$hormozi-fidelity-audit` and fix any FAIL before delivering.

## Output contract
One lead-generation plan document per the rubric header. No fabricated benchmarks — cite the book's
numbers via the reference files, and mark the user's own targets as `<placeholder>`.

## What we are intentionally NOT doing
- Not building the offer itself (that's the Offers chain — but we require one to exist).
- Not executing anything live (no sending/posting/spending) — this produces the plan + assets/scripts.
- Not running all four channels at once — the roadmap picks the starting point; focus beats spray.

## Sources and basis
*$100M Leads* — the Core Four, lead magnets, Lead Getters, Rule of 100 / Open To Goal; methods in
`../_hormozi-shared/references/`.
