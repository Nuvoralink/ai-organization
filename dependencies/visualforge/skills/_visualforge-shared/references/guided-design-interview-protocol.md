# Guided Design Interview Protocol

How VisualForge subskills talk to the user. The goal is to extract only the information that cannot be researched or inferred, and to do so without making the user design the system.

## Hard limits

- **Maximum 6 questions in the initial discovery pass.** If you need more, you have not researched enough.
- **Maximum 3 follow-up questions per subskill.** Follow-ups are only allowed when a high-risk decision cannot be resolved from research + repo + prior answers.
- **Never ask the user to pick from raw options without a recommendation.** Always: "I recommend X because [two reasons]. Alternatives are Y (rejected because…) and Z (rejected because…). Confirm X, override to Y, override to Z, or override to something else."
- **Never ask about taste alone.** Ground every question in a downstream design decision and tell the user what will change.

## Allowed question shapes

### Recommend-then-confirm

```
For [decision], I recommend [option] because [reason 1] and [reason 2].
- Alternative A: [option] — rejected because [reason].
- Alternative B: [option] — rejected because [reason].

Confirm, override, or tell me a constraint I missed.
```

### Constraint extraction

```
I need to know one thing that I cannot research or infer: [specific factual constraint, e.g., existing brand color, locked component library, regulatory restriction, partnership branding].
```

### Hard-blocker resolution

```
Decision [DEC-NNN] has two viable answers that lead to different design systems: [A] vs [B]. The difference matters because [downstream impact]. Which fits your product?
```

## Forbidden question shapes

- "What colors do you like?"
- "What feel are you going for?" without giving the user 3-5 named mood profiles to react to.
- "Should we use [trend]?" without research-backed recommendation.
- "Material or Apple style?" without explaining what that means for *this* product.
- "How responsive should it be?" — research determines this from platform decision.
- "Light or dark mode?" — recommend, ask user to confirm or override.
- Any question that asks the user to design the answer rather than confirm a recommendation.

## Initial discovery question set

These are the *only* questions VisualForge should ask in the initial pass, and only the ones not answerable from inputs:

1. **Product intent** — one sentence on what the product is and what success looks like (skip if Specforge brief exists or repo README is clear).
2. **Primary platform(s)** — web, iOS, Android, desktop, multi-platform. Recommend default based on product type if user doesn't know.
3. **Audience density and aesthetic expectation** — present 3-5 named profiles ("Linear-style minimal pro tool", "Notion-style approachable productivity", "Stripe-style trustworthy infrastructure", "Arc-style playful prosumer", "Material-style mainstream consumer") and ask which the user reacts to most. Use this only when intent is ambiguous.
4. **Brand constraints** — existing logo, colors, typography, voice that must be preserved. If none, say so and VisualForge will design from scratch.
5. **Component library preference** — recommend one based on platform + audience + team capability; ask for confirmation or override.
6. **Accessibility requirement level** — recommend WCAG 2.2 AA as default; ask if AAA is required (regulated, public-sector, accessibility-first product) or if AA can be relaxed (closed beta, internal tool).

If all six are derivable from inputs (Specforge brief, existing repo, user's initial prompt), ask zero questions and proceed.

## Follow-up question rules

Follow-up questions during a subskill are only allowed when:

- The decision is high-risk (brand color, type system, primary component pattern, accessibility level).
- Research and prior answers genuinely conflict.
- The user has signaled they want input on a specific area.

Forbidden follow-ups:

- Aesthetic preference on micro-decisions (shadow style, icon weight, exact spacing values) — VisualForge decides, user reviews the decision log.
- "Are you sure?" — once confirmed, move on.
- Confirmation of research-backed defaults — silent default unless contradicted.

## Presenting decisions instead of asking

For 90% of design decisions, do not ask. Instead, decide and present:

```
Decided: [decision]
Why: [two-sentence rationale]
Alternatives rejected: [one line each]
Confidence: High | Medium | Low
Reversal trigger: [signal]

To override, say "override [decision ID]" with your preferred direction.
```

This gives the user veto power without making them design the system.

## When to stop asking and start producing

After the initial discovery pass, switch to production mode:

1. Run mandatory research pass.
2. Generate decisions silently using the decision quality protocol.
3. Produce the document and artifacts.
4. Surface only the decisions where confidence is Low or where the user explicitly asked for input.
5. Let the user review the decision log and override.

Producing the work and inviting override is faster and better than upfront interrogation.

## Bulk override protocol

If the user wants to override many decisions at once, accept:

- A list of decision IDs with new values.
- A new constraint that cascades (e.g., "use Material 3 as the base") — VisualForge re-runs affected subskills.
- A reference product to align with ("more like Linear") — VisualForge re-derives decisions to match that target.

After any bulk override, re-run contradiction tests across all documents.
