# Decision & Fidelity Rubric

Every Hormozi sub-skill produces output against this rubric. It is what makes the engine generate
*Hormozi-grade* work instead of generic marketing filler. Read before drafting any deliverable.

---

## 1. Fidelity to the book (non-negotiable)

The engine's job is to apply Hormozi's **actual method**, not a paraphrase of it.

- **Name the framework you're running** and follow its steps *in his order* (e.g., the offer build
  runs Dream Outcome → Problems → Solutions → Delivery Vehicles → Trim & Stack — never skip or reorder).
- **Use his terminology** verbatim: Grand Slam Offer, Value Equation, Dream Outcome, Perceived
  Likelihood of Achievement, Time Delay, Effort & Sacrifice, Starving Crowd, Trim & Stack, the Core
  Four, Rule of 100, Lead Getters, More/Better/New, Client-Financed Acquisition, Open To Goal.
- **Apply, don't lecture.** Output the *result for this product* (the built offer, the named
  guarantee, the written lead magnet), not a summary of what the chapter says. The user wants the
  thing the book tells them to make.
- **Every framework reference cites its source** — `$100M Offers` or `$100M Leads` + the section —
  so claims are traceable. Encoded frameworks live in `references/`; cite those.

## 2. Grounded in the product

- Pull real specifics from the product before generating: what it is, who it's for (the avatar),
  the dream outcome, current price, current offer, constraints. If these are missing, ASK — a bounded
  intake, not a survey (see `orchestration-protocol.md`).
- Never output a generic offer/name/guarantee that could belong to any business. If a line would read
  identically for a different product, it's wrong — make it specific.
- **User-supplied angles are inputs, never the boundary.** When the user brings their own ideas
  ("I was thinking compliance… and a certification tier…"), sharpening those and stopping is a
  fidelity failure — the engine's value IS the divergent pass (Brick Exercise mindset; Steps 2 & 4 of
  the 5-step). Always ALSO walk the avatar's full journey stage by stage and generate angles the user
  did NOT name, mark which are new, and rank them. The deliverable must contain net-new angles beyond
  what the user brought, or explicitly state why the journey walk produced none.

## 3. No slop, no fabrication

- No taste-words with no mechanism ("amazing", "powerful", "next-level") — Hormozi's copy is concrete
  and benefit-loaded, not adjectival.
- **No fabricated numbers.** Value ($X value) stacks, prices, and benchmarks must be either (a) derived
  from the product's real economics, (b) an explicit *placeholder the user fills* (`<your cost>`), or
  (c) a benchmark cited to a book line ref. Never invent a statistic.
- Hormozi's own copy is loud and direct by design — bold claims, dream outcomes, "you'd be stupid to
  say no." That register is correct here. (Note: the word "leverage" is core to his method and is
  allowed — this engine has no banned-word list beyond fabrication and empty hype.)

## 4. Output record format (lightweight)

Hormozi outputs are deliverables (offers, scripts, magnets), not decision logs — so the format is
lighter than a full decision card. Each generated artifact carries a short header:

```markdown
# <Artifact name> — <product>

**Framework:** <which Hormozi framework this runs>
**Source:** $100M <Offers|Leads> · <section>
**Avatar / market:** <who this is for>
**Inputs used:** <the product specifics this was built from>

<the actual deliverable>

---
**Assumptions made:** <anything inferred vs. user-confirmed — flag placeholders to fill>
**Next step in the sequence:** <what the orchestrator runs next, per the book>
```

## 5. What the fidelity auditor checks (`hormozi-fidelity-audit`)

A deliverable FAILS fidelity if any of these are true:
- It skipped or reordered a framework's steps, or invented steps not in the book.
- It's a summary of the chapter instead of the applied output for this product.
- It contains a fabricated statistic or a value/price with no basis or placeholder.
- It's generic — the same output would fit an unrelated product.
- It drops a load-bearing element the book says is mandatory (e.g., an offer that doesn't solve
  *every* perceived problem; a guarantee with no "if you don't get X in Y, we do Z" structure; a name
  with no Magnetic Reason Why).

## 6. Sources and basis

Every sub-skill ends with a `Sources and basis` section citing the book + section + the encoded
reference file it used. This keeps the whole engine traceable to primary source.
