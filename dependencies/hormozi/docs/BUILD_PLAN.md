# Hormozi Engine — Build Plan & Progress (living doc)

**Status:** v0.1.0 COMPLETE — Offers + Leads engines built & verified (24 sub-skills, 15 references);
first golden example generated (`examples/auxara-ai-system-architect-offer.md`). · **Last updated:** 2026-07-09
**Owner:** Amin (orchestrator: Claude)

This is the resume anchor for the Hormozi engine build. If context is compacted or a new
session starts, READ THIS FILE FIRST, then continue from the next `pending` slice.

## Progress snapshot — 2026-07-09

**✅ ALL 12 reference files encoded from the books (faithful, line-ref'd, spot-verified):**
`offer-creation-5-step`, `value-equation`, `market-selection`, `pricing`, `offer-enhancers`,
`guarantee-taxonomy`, `magic-naming` (Offers) · `lead-magnet-7-step`, `core-four`, `more-better-new`,
`lead-getters`, `rule-of-100-and-roadmap` (Leads). Plus foundation: `decision-and-fidelity-rubric`,
`orchestration-protocol`, `glossary`. (15 files in `references/`.)

**✅ SLICE 1 — Offers engine COMPLETE & verified (13 SKILL.md; names match dirs; refs present):**
`hormozi` (master), `hormozi-offers`, `hormozi-leads` (orchestrators) · `hormozi-offer-market`,
`-value-equation`, `-builder`, `-enhancers`, `-guarantees`, `-naming`, `-pricing`, `-grader` ·
`hormozi-self-test`, `hormozi-fidelity-audit`. Template: `offer-brief.md`.

**🔶 SLICE 2 — Leads leaf sub-skills IN FLIGHT (2 implementer agents writing SKILL.md to disk):**
- Agent A: `hormozi-lead-magnet`, `-warm`, `-content`, `-cold`, `-paid`, `-more-better-new`, `-roadmap`.
- Agent B: `hormozi-lead-referrals`, `-employees`, `-agencies`, `-affiliates`.
- (Note: `hormozi-leads` orchestrator SKILL.md already written in Slice 1.)

**Next after Slice 2 lands:**
1. Re-run the integrity check (all 24 sub-skills have SKILL.md; names match; refs resolve).
2. Author Leads templates `lead-magnet-brief.md`, `lead-gen-roadmap.md`.
3. **End-to-end dry-run:** `build-offer` (and `lead-magnet`) on a sample product — prove it generates
   a faithful Grand Slam Offer. Then mark v0.1.0 done in CHANGELOG.
4. (Optional, user's call) installation/registration so `$hormozi` is invocable.

---

## Vision

Turn Alex Hormozi's two books — **$100M Offers** and **$100M Leads** — into an AI engine.
Point it at a product; it runs Hormozi's actual methods and generates the offers, lead magnets,
lead-gen roadmaps, guarantees, names, scripts, and step-by-step guides the books prescribe.

Design principle: **every sub-skill = one chapter / section / task from the books.** A master
orchestrator routes by task and assembles the pieces. Built on the universal orchestration model
(orchestrator + specialized sub-agents + shared references + self-test + fidelity auditor).

## Locked decisions (from user, 2026-07-09)

- **Name:** `Hormozi` — folder `${DEPENDENCY:hormozi|backslash}\`, sub-skills `hormozi-*`, invoke `$hormozi`.
- **Scope:** Full engine, both books. **Offers chain first**, then Leads.
- **MarketForge:** Keep **fully separate**. Do NOT modify MarketForge. No reconciliation pass.
  (This supersedes the earlier "Hormozi wins, update MarketForge" instruction.)
- **Knowledge source:** the two book `.md` files (see below), cross-checked against Hormozi's
  public teaching. Encode the **method** (formulas, steps, decision rules) faithfully — not verbatim
  prose. Short attributed quotes only for load-bearing definitions.

## Source of truth

- `${HOME|backslash}\Downloads\100m-Offers.md` (2958 lines) — extraction source, NOT copied into repo.
- `${HOME|backslash}\Downloads\100M Leads How to Get Strangers To Want To Buy Your Stuff (Alex Hormozi).md` (4629 lines).
- Encoded frameworks live in `skills/_hormozi-shared/references/`. Those are the engine's authority
  at runtime — the raw books are only the build-time source.

## Architecture

```
skills/
  hormozi/                     master orchestrator — routes by task, assembles output
  hormozi-offers/              Offers sub-orchestrator ($100M Offers)
  hormozi-leads/               Leads sub-orchestrator ($100M Leads)
  hormozi-offer-*/             one per Offers task
  hormozi-lead-*/              one per Leads task
  hormozi-self-test/           Phase-0 integrity gate
  hormozi-fidelity-audit/      auditor: does output actually follow the book method?
  _hormozi-shared/
    references/                the ENCODED BOOK (frameworks) + protocols + rubric
    templates/                 offer brief, lead-magnet brief, lead-gen roadmap
```

## Sub-skill inventory & status

Legend: ⬜ pending · 🔶 in progress · ✅ done

### Foundation (shared)
- ✅ `docs/BUILD_PLAN.md` (this file)
- ⬜ `README.md`, `CHANGELOG.md`
- ⬜ `_hormozi-shared/references/orchestration-protocol.md`
- ⬜ `_hormozi-shared/references/decision-and-fidelity-rubric.md`
- ⬜ `_hormozi-shared/references/glossary.md` (Hormozi's coined terms)

### Encoded frameworks (references/)
- ⬜ `value-equation.md` (the 4 drivers, formula, scoring)
- ⬜ `offer-creation-5-step.md` (dream→problems→solutions→delivery→trim&stack) — extraction in hand
- ⬜ `market-selection.md` (Starving Crowd, 4 indicators, niche)
- ⬜ `pricing.md` (charge-what-it's-worth, virtuous cycle)
- ⬜ `offer-enhancers.md` (scarcity, urgency, bonuses)
- ⬜ `guarantee-taxonomy.md` (4 categories + full list)
- ⬜ `magic-naming.md` (M-A-G-I-C formula)
- ⬜ `lead-magnet-7-step.md`
- ⬜ `core-four.md` (warm, content, cold, paid + Rule of 100)
- ⬜ `lead-getters.md` (referrals, employees, agencies, affiliates)
- ⬜ `rule-of-100-and-roadmap.md` (Open To Goal, the sequence, More/Better/New)
- ⬜ `benchmarks.md` (all the numbers Hormozi cites)

### Offers sub-skills (SLICE 1 — build first)
- ⬜ `hormozi-offers` (sub-orchestrator)
- ⬜ `hormozi-offer-market`
- ⬜ `hormozi-offer-value-equation`
- ⬜ `hormozi-offer-builder`
- ⬜ `hormozi-offer-enhancers`
- ⬜ `hormozi-offer-guarantees`
- ⬜ `hormozi-offer-naming`
- ⬜ `hormozi-offer-pricing`
- ⬜ `hormozi-offer-grader`

### Leads sub-skills (SLICE 2)
- ⬜ `hormozi-leads` (sub-orchestrator)
- ⬜ `hormozi-lead-magnet`
- ⬜ `hormozi-lead-warm`
- ⬜ `hormozi-lead-content`
- ⬜ `hormozi-lead-cold`
- ⬜ `hormozi-lead-paid`
- ⬜ `hormozi-lead-more-better-new`
- ⬜ `hormozi-lead-referrals`
- ⬜ `hormozi-lead-employees`
- ⬜ `hormozi-lead-agencies`
- ⬜ `hormozi-lead-affiliates`
- ⬜ `hormozi-lead-roadmap`

### Orchestration + gates (SLICE 3)
- ⬜ `hormozi` (master orchestrator)
- ⬜ `hormozi-self-test`
- ⬜ `hormozi-fidelity-audit`
- ⬜ templates (offer-brief, lead-magnet-brief, lead-gen-roadmap)

## Slice sequence

1. **Foundation** — top docs + shared protocols + rubric + glossary.
2. **Encoded frameworks (Offers)** — value-equation, offer-creation-5-step, market, pricing, enhancers, guarantees, magic-naming, benchmarks (offers portion).
3. **Offers sub-skills** — the 8 `hormozi-offer-*` + `hormozi-offers` orchestrator.
4. **Encoded frameworks (Leads)** — lead-magnet, core-four, lead-getters, rule-of-100.
5. **Leads sub-skills** — the 11 `hormozi-lead-*` + `hormozi-leads` orchestrator.
6. **Master orchestrator + self-test + fidelity audit + templates.**
7. **Verify** — run self-test; dry-run `build-offer` on a sample product; check fidelity.

## Build conventions

- Each `SKILL.md` has YAML frontmatter: `name:` (matches dir) + `description:` (trigger-sharp).
- Sub-skills declare: Purpose, Inputs, the book Method (faithful), Output contract, Worked example,
  "What we are intentionally NOT doing", "Sources and basis" (cite book + line refs).
- **Faithful to the book:** use Hormozi's exact terminology and step order. The word "leverage" is
  FINE here (unlike MarketForge's validator) — it's core to his Lead Getters section.
- No marketing slop, no fabricated numbers. Every benchmark traces to a book line ref.
- Decision output uses the lightweight decision format in `decision-and-fidelity-rubric.md`.

## Extraction status (build-time)

Five background extraction agents read the books into structured framework notes:
- Offers foundations (value-driven/price, market, pricing, Value Equation) — feeds SLICE 2.
- Offers creation 5-step — DONE, in hand, feeds `offer-creation-5-step.md`.
- Offers enhancers (scarcity/urgency/bonuses/guarantees/naming) — feeds SLICE 2.
- Leads: lead magnets + Core Four — feeds SLICE 4.
- Leads: More/Better/New + Lead Getters + Get Started — feeds SLICE 4.
