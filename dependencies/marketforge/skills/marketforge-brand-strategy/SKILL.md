---
name: marketforge-brand-strategy
description: Define brand attributes, voice + tone, positioning statement, manifesto. Reads VisualForge brand identity if present. Use as Phase 3 step 1.
---

# MarketForge Brand Strategy

Read shared references and `visualforge-bridge.md`. If VisualForge `docs/design-system/02-visual-language/brand-identity.md` exists, read and consume it as authoritative for visual attributes.

## Global quality rules

- Brand attributes must connect to specific mechanism (visual, copy, motion, content); taste-words alone forbidden.
- Voice + tone documented with do/don't examples, not adjectives.
- Manifesto written by founder (or in founder's voice) — never AI-cadence.

## Purpose

Produce:
1. 4-6 brand attributes (each with mechanism + anti-pattern).
2. Voice + tone direction (formal vs casual, technical vs accessible, etc.).
3. Positioning statement (synthesized from `positioning.md`).
4. Manifesto draft (founder voice).
5. Brand voice do/don't examples.

## Inputs

- `marketing-brief.md`, `positioning.md`, `icp-and-personas/`, `voice-of-customer.md`.
- VisualForge `docs/design-system/02-visual-language/brand-identity.md` if present.

## Outputs

- `docs/marketing-plan/03-brand/brand-strategy.md`
- DEC-100 to DEC-109

## Structure

```markdown
# Brand Strategy

## Brand attributes (4-6 with mechanism)

For each:
- **Attribute name** (polarity pair): "Precise — but not sterile"
- **Visual mechanism (if VF exists, cite tokens):** [specific]
- **Copy mechanism:** [specific — "we use specific numbers; we don't round to make ourselves sound bigger"]
- **Anti-pattern:** [what this attribute is NOT — e.g., "not friendly-to-the-point-of-empty"]
- **Example in practice:** [sentence-level example]

## Voice + tone

- **Formality level:** Casual / Professional-but-friendly / Formal-enterprise — and why.
- **Person:** First-person plural ("we") / second-person ("you") / third-person — and when each.
- **Reading level (Flesch-Kincaid):** Target grade level + rationale (B2B dev tools ~grade 10-12 is appropriate; B2C consumer ~grade 6-8).
- **Humor level:** None / Subtle / Frequent — and where.

### Voice do/don't (10-15 pairs)

| Don't say | Say |
|---|---|
| "Streamline your workflow" | "Cut your monthly close from 8 days to 3" |
| "Leverage" | "Use" |
| "Best-in-class" | (cut it or specify ranked-where-by-whom) |
| "Revolutionary" | (cut it) |
| "Game-changing" | (cut it) |
| ... | ... |

## Positioning statement (synthesized from positioning.md)

[Three lengths — homepage hero, investor deck, cold email value prop, ad copy version.]

## Manifesto draft (founder voice, 200-400 words)

[Written in the founder's voice — assumes specific founder. Captures: what we believe the world needs more of; what we believe is broken; what we're building; for whom; and why now. NOT AI cadence.]

## Decision cards
[DEC-100 to DEC-109]

## What we are intentionally NOT doing
- Setting visual tokens (VisualForge's job).
- Naming products / taglines (next subskill).
- Listing values like a corporate poster.

## Sources and basis
V3 §10.6 (Distinctive brand assets — Romaniuk, Sharp).
```

## Anti-patterns

- "Authentic. Innovative. Customer-first." — taste-word stack. Refuse.
- Brand attributes without mechanism — refuse.
- Manifesto in AI cadence (three-word triplets, em-dash overuse, "Not just X — Y") — rewrite in founder voice.

## When VisualForge is absent
Produce minimal brand-visual layer here too: 1 primary color (hex + OKLCH), 1 accent, 3-5 neutrals, 1-2 type families, logo direction.

## Sources and basis
V3 §10.6.
