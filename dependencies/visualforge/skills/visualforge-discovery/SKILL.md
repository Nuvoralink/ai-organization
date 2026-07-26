---
name: visualforge-discovery
description: Produce the design brief — product intent, primary platforms, audience density and aesthetic profile, brand constraints, component library preference, accessibility level, performance targets, theming requirements.
---

# Design Discovery

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, and `design-research-rules.md` before starting.
- Use `opinionated-decision-template.md` for every decision.
- Apply `guided-design-interview-protocol.md` for any user-facing question (max 6 initial questions).
- No taste-words without values. No "consider". No "modern / clean / intuitive" without measurable behavior.
- Every material decision needs: ID, source, alternatives, recommendation, confidence, evidence, bound artifacts, reversal trigger.
- Every document includes a `Sources and basis` section.
- Label every fact as User-confirmed, Repo-derived, Research-backed, Standard-backed, Specforge-derived, or Assumption.
- Do not invent facts, versions, or capabilities. Use `Unknown` with impact when info is missing.
- Maintain `docs/design-system/auditability/decision-log.md` and `research-ledger.md`.
- Run mode detection per `mode-detection-protocol.md` before any work.
- In retrofit mode, follow `drift-and-retrofit-protocol.md` — design ideal first, drift second.
- Recommend; do not make the user design the answer.
- If regulated, accessibility-critical, or children's-product domain detected, flag for review.
- Refuse to enable illegal, deceptive, or dark-pattern products.

## Purpose

Produce the foundation document that constrains every subsequent VisualForge decision. Establish what the product is visually trying to be, who it must work for, on what platforms, with what brand and accessibility constraints.

## Mode-aware behavior

- **Greenfield:** Run full discovery interview. Maximum 6 questions per `guided-design-interview-protocol.md`. Derive anything that can be derived.
- **Specforge-enhanced:** Read Specforge `01-product-brief.md`, `02-prd.md`, `03-feature-scope.md`. Extract product intent, audience, feature set. Skip questions Specforge answers. Add only the design-specific questions Specforge does not cover (platform, aesthetic profile, brand, library, a11y level).
- **Retrofit:** Read existing repo for product intent signals (README, package.json description). Read existing brand if present. Run inventory but do not let it constrain new design.

## Required research pass

Only if intent is genuinely ambiguous after inputs:

```text
Research the current design conventions and audience expectations for products in the [domain] / [platform] category. Identify the visual range users expect (Linear-style, Notion-style, Stripe-style, Arc-style, Material-style, Apple-style, brutalist, etc.). Identify three direct competitors and their visual language. Output: a named aesthetic profile recommendation with rationale.
```

Record in `research-ledger.md`.

## Inputs

- User prompt / product idea.
- Specforge docs at `docs/app-plan/` if present.
- Existing repo (README, package.json, brand assets, theme files).
- User answers to the bounded discovery interview.

## Output files

- `docs/design-system/01-foundations/design-brief.md`
- Entries in `docs/design-system/auditability/decision-log.md` (DEC-001 to DEC-010 range typically).
- Entries in `docs/design-system/auditability/research-ledger.md` if research ran.

## Design brief sections

### 1. Product summary
- One sentence: what this is and what success looks like.
- Source label.

### 2. Primary platforms
- Decision: which platforms are first-class (web, iOS, Android, desktop, watch, TV, multi).
- Decision: which platforms are secondary or out of scope.
- Rationale: where the audience actually uses the product.
- Implementation implications: framework, performance targets, gesture support, input modes.

### 3. Audience aesthetic profile
- Decision: named profile that best fits the audience and product (from the audience-expectation library below or a custom hybrid).
- Profile must be named, not described in taste-words. Examples: "Linear-style minimal pro tool", "Notion-style approachable productivity", "Stripe-style trustworthy infrastructure", "Arc-style playful prosumer", "Material 3 Expressive consumer", "Apple HIG iOS-native", "Soft brutalist creator tool", "Editorial publication", "Dense data analytics", "Spatial / Vision UI".
- Two reasons why this profile fits the actual audience.
- Two rejected profiles with one-line reasons.

### 4. Brand constraints (User-confirmed only)
- Existing logo, colors, typography that must be preserved.
- Tone and voice constraints.
- Partnership / co-branding requirements.
- Regulatory visual constraints.
- If none exist, state explicitly: "No locked brand constraints. VisualForge will design brand identity from scratch in subskill 5."

### 5. Component library preference
- Decision: recommended component library and version, or custom from primitives.
- Options: Shadcn + Radix, Material UI, Fluent UI, Ant Design, Chakra, Mantine, React Aria + custom, fully custom on Radix primitives, native platform (UIKit / SwiftUI / Compose), web platform primitives only.
- Two reasons why this choice fits this product (team, audience, brand differentiation, accessibility, motion needs).
- Two rejected options with one-line reasons.

### 6. Accessibility level
- Decision: WCAG 2.2 level — A, AA, AA+, or AAA.
- Recommendation default: AA. Recommend AAA for: public-sector, healthcare, education, government, accessibility-tool products. Recommend AA+ (AA + most AAA criteria) for: any consumer product with broad audience.
- Explicit success criteria emphasized for this product (e.g., 1.4.3 contrast, 2.4.7 focus visible, 2.5.5 target size, 1.4.13 hover/focus dismissible).

### 7. Performance budget
- Decision: target Core Web Vitals or platform equivalents.
  - Web: LCP, INP, CLS — recommended ≤ 2.5s, ≤ 200ms, ≤ 0.1.
  - Mobile: launch time, frame budget, memory budget per platform spec.
- Decision: target device tier (high-end only, mainstream, low-end including 2-year-old budget Android).
- Implication: which surface treatments and motion patterns are affordable.

### 8. Theming and modes
- Decision: light only, dark only, both with system follow, both with user override.
- Decision: high-contrast variant required (yes if a11y AAA or public-sector).
- Decision: white-label / multi-tenant theming required (yes / no with rationale).
- Decision: dynamic color (Material You) supported or not.

### 9. Internationalization
- Decision: target languages, scripts (Latin, Cyrillic, CJK, RTL Arabic/Hebrew, Devanagari).
- Implication: typography choice, type scale, layout flex (text expansion), RTL mirroring scope.
- Default: English, system-language follow; expand if user states.

### 10. Content and copy voice
- Decision: voice direction (5 named profiles: Direct/Professional, Warm/Approachable, Playful/Confident, Calm/Technical, Sharp/Editorial).
- Reasoning ties to audience and brand from above.

### 11. Risk flags
- Regulated domain: yes / no — with regulator list.
- Children's / student / vulnerable user: yes / no.
- Health, finance, legal decisioning: yes / no.
- AI-generated content surfaces: yes / no — if yes, link to AI-chrome trend research.
- Dark-pattern risk areas (subscription, growth, retention): yes / no — design defensively.

### 12. Open questions
- Items not resolvable from inputs or research, that block specific downstream decisions.
- Each with: question, blocked decision, why it matters, recommended default if unanswered.

## Interview discipline

The full interview must fit in **six questions or fewer**, and each must follow recommend-then-confirm. Skip any question where the answer is derivable from Specforge, the repo, or unambiguous user input.

## Quality gate

Before finishing, verify:

- Every section has a concrete value, not a description.
- Aesthetic profile is named, not described.
- Library and accessibility level are decided, not deferred.
- Brand constraints section explicitly says "none locked" when applicable, instead of leaving blank.
- Every decision has a DEC-NNN entry in the decision log.
- No taste-words remain.
- Open questions are bounded to real blockers, with recommended defaults.

## Sources and basis

Document the basis line by line: which sections came from user, Specforge, repo, research, standards, or assumption.
