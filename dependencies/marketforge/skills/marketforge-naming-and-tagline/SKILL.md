---
name: marketforge-naming-and-tagline
description: Generate product names, tagline candidates, naming rules for sub-products / features. Includes trademark + domain availability checks. Use as Phase 3 step 3.
---

# MarketForge Naming & Tagline

## Global quality rules

- Test every name against: 5-year-old understanding test, phonetic pronounceability, trademark search, domain availability, social handle availability.
- Tagline candidates must pass the "would a copywriter who never used AI write this?" test.
- For sub-product naming, establish a system (e.g., "Product X: Studio / Pro / Cloud") — random naming is brand decay.

## Purpose

Produce:
1. Product / company name candidates (when naming greenfield).
2. Tagline candidates (3-7 per direction, with rationale).
3. Naming rules for sub-products, features, plans.
4. Trademark + domain + social handle availability snapshot (where checkable).

## Inputs

- `marketing-brief.md`, `positioning.md`, `brand-strategy.md`, `messaging-architecture.md`.

## Outputs

- `docs/marketing-plan/03-brand/naming-and-tagline.md`
- DEC-130 to DEC-139

## Structure

```markdown
# Naming & Tagline

## Product name [if naming greenfield]

### Candidates (5-10)
For each:
- Name
- Phonetic spelling
- Etymological / conceptual origin
- Domain check: [.com available? alternatives?]
- Trademark check: [USPTO basic search results — date checked]
- Social handles: [@name available on Twitter, LinkedIn, Instagram, TikTok, GitHub]
- 5-year-old understanding: [pass/fail with reasoning]
- Risk: [is the name fragile to misinterpretation, cultural translation, etc.]

### Recommended: [name]
[Reasoning — why this beats the others]

## Tagline candidates (3-7)

For each:
- Tagline
- Length: [word count]
- What it argues
- Voice match: [pass/fail]
- AI-cadence test: [pass/fail]
- VOC source (if directly from quote): [reference]

### Recommended tagline: "[X]"
[Reasoning]

### Alternates by surface
- Homepage hero version: "[X]"
- Investor deck: "[X]"
- App Store / Play Store short tagline (30 chars): "[X]"
- Twitter bio: "[X]"
- Cold email signature: "[X]"

## Naming rules

### Sub-products / SKUs
- Pattern: [defined — e.g., "Product X: [Tier name]" where tiers are Studio/Pro/Enterprise]
- Banned names for tiers: [list — e.g., "Premium" generic / "Plus" overused]

### Features
- Pattern: [Specific verbs / outcome-words / etc.]
- Banned patterns: [e.g., no "Smart" / "AI" prefix unless feature is materially AI-distinct]

### Plans / Pricing tiers
- Pattern: [Starter / Growth / Scale; or Personal / Team / Business; etc.]

### Code names (internal)
- Pattern: [optional — fun internal codenames different from public names]

## Decision cards
[DEC-130 to DEC-139]

## What we are intentionally NOT doing
- Promising trademark clearance (we do basic search, NOT legal opinion).
- Buying domains (user decision).
- Setting product feature names (product team owns, marketing collaborates).

## Sources and basis
V3 §10.6 (Distinctive brand assets — naming as DBA).
```

## Anti-patterns

- Names that don't pronounce on first read.
- Taglines with three-word triplet AI cadence.
- "Plus" / "Premium" / "Pro" / "Suite" without differentiation.

## Trademark caveat
This subskill does basic search; legal counsel required for clearance. Document the disclaimer in the doc.

## Sources and basis
V3 §10.6.
