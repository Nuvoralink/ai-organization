---
name: visualforge-user-research
description: Produce concrete user personas, usage contexts, device contexts, accessibility needs, and mental models that drive every downstream design decision.
---

# User Research for Design

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `design-research-rules.md`.
- Use `opinionated-decision-template.md` for every decision.
- Apply `guided-design-interview-protocol.md` (max 3 follow-up questions, only for high-risk gaps).
- No taste-words. No vague personas like "tech-savvy millennials" or "anyone who likes design."
- Every persona has: name, role, age bracket, primary context, devices, frustrations, goals, accessibility needs, time pressure, cognitive load, and one quote in their voice that captures their use of this product.
- Personas must be testable: every claim must be specific enough that the team could find a real user matching the persona to test with.
- Label every fact: User-confirmed, Repo-derived, Research-backed, Standard-backed, Specforge-derived, Assumption.
- Maintain `decision-log.md` and `research-ledger.md`.

## Purpose

Make the user real, specific, and binding. Every later subskill must be able to ask "would persona X be able to do this?" and have a concrete answer. Generic personas produce generic design.

## Mode-aware behavior

- **Greenfield:** Build personas from product intent + research on category audience.
- **Specforge-enhanced:** Read user roles from Specforge `01-product-brief.md` and `02-prd.md`. Extend each role into a persona with the design-relevant details Specforge does not capture (device, context, sensory needs, motion sensitivity, cognitive load).
- **Retrofit:** Use existing analytics, user research, or repo-stated audience as input. Read `retrofit/data-inventory.md` if available — entity ownership patterns reveal real audience segments.

## Adaptive personas

Personas are not static after this subskill. They must be **revisited** when later subskills surface new evidence:

- After `visualforge-competitive-audit` — if competitors reveal an audience segment we missed, add or refine a persona.
- After `visualforge-design-trends-research` — if adopted trends imply a persona refinement (e.g., adopting Liquid Glass implies an Apple-platform-fluent persona), note it.
- After `visualforge-ux-flows` runs the data inventory (retrofit) — if data shapes reveal usage patterns (admin actions vs member actions), refine personas.
- After `visualforge-design-pressure-test` Pass B — if persona walkthroughs surface a gap, update the persona or add a new one.

Each revisit updates persona files and adds a revision note. The orchestrator triggers a persona refresh after each upstream evidence-generating subskill.

## Required research pass

```text
Research the audience for products in the [domain] category targeting [stated audience]. Find: typical age range, device split, accessibility prevalence (assistive tech use, color vision differences, motion sensitivity, low-vision, motor differences), context of use (where, when, while-doing-what), time pressure, common workflows, and known frustrations from competitor reviews. Use census, platform-share, accessibility prevalence reports (WHO, CDC), and product review aggregators. Capture sources.
```

## Research-method ladder (added per VF-FIND-037)

The subskill above produces personas, not validated research. When the team needs to **validate** a persona, gap, or design decision with real users, pick the right method. The ladder below maps question type to method, sample size, and time budget. Document the chosen method as a Validation Plan entry on the persona it tests.

| Method | Best for | Sample size | Time | When to use it |
|---|---|---|---|---|
| User interviews | Deep understanding of needs, goals, mental models | 5–8 | 2–4 weeks | Building or refining a primary persona; pre-design discovery |
| Usability testing | Evaluating a specific design or flow | 5–8 | 1–2 weeks | After a screen spec or prototype is drafted; before locking |
| Surveys | Quantifying attitudes, preferences, audience share | 100+ | 1–2 weeks | Confirming audience share (Quantitative grounding); ranking known frustrations |
| Card sorting | Information architecture decisions | 15–30 | 1 week | Before locking IA; when nav model is ambiguous |
| Diary studies | Behavior over time, real contexts | 10–15 | 2–8 weeks | Understanding session shape, interruptions, day-in-the-life claims |
| A/B testing | Comparing specific design choices in production | Statistical significance | 1–4 weeks | After launch, when two designs both look defensible |
| Analytics cohort review | Confirming a persona exists in real data | n/a (event-driven) | 1 day | Post-launch validation of `Assumption`-labeled personas |
| Support-ticket pattern review | Real frustrations users had to escalate | n/a (corpus-driven) | 1–3 days | Catching edge-case personas the team missed |

### Interview-guide structure (when interviews are chosen)

1. **Warm-up** (5 min): build rapport, explain the session.
2. **Context** (10 min): understand current workflow.
3. **Deep dive** (20 min): explore the specific topic.
4. **Reaction** (10 min): show concepts or prototypes if applicable.
5. **Wrap-up** (5 min): anything we missed? Thank them.

### Synthesis framework (after research runs)

- **Affinity mapping** — group observations into themes.
- **Impact / effort matrix** — prioritize findings.
- **Journey mapping** — visualize the user experience over time.
- **Jobs to be done** — what's the user hiring this product to do?

### When this ladder applies vs doesn't

- **Greenfield mode:** the persona's Validation Plan names a method from this ladder so it can be confirmed post-launch.
- **Retrofit mode:** if real analytics or support tickets exist, **prefer those** over inventing interviews — `retrofit/data-inventory.md` may already contain ground truth.
- **Specforge-enhanced mode:** Specforge user-research artifacts (if present) take precedence; this ladder fills gaps Specforge doesn't cover.

### Decision card

- DEC-044 Validation method per persona (interview / usability / survey / cohort / tickets) — required when a persona is labeled `Assumption`, optional otherwise. *(In allocated range DEC-025–044 per `decision-id-allocation.md`.)*

For accessibility prevalence baselines (use when no product-specific data):

- ~15-20% of any audience has a disability (WHO).
- ~8% of men, ~0.5% of women have color vision differences.
- ~35% of users prefer dark mode (rising).
- ~30% of users with vestibular disorders react to large parallax / aggressive motion.

Record in `research-ledger.md`.

## Inputs

- Design brief (`01-design-brief.md`).
- Specforge user-roles section, if present.
- Existing user research or analytics, if available.
- User answers to follow-ups (only if high-risk gap remains).

## Output files

- `docs/design-system/01-foundations/personas/_index.md` — summary table of all personas (primary, secondary, anti, edge-case, pair) with links.
- `docs/design-system/01-foundations/personas/persona-[name-slug].md` — one file per primary / secondary / edge-case persona.
- `docs/design-system/01-foundations/personas/anti-persona-[name-slug].md` — one file per anti-persona.
- `docs/design-system/01-foundations/personas/pair-[a-slug]-and-[b-slug].md` — one file per pair scenario.
- Aggregate sections (device-and-input matrix, accessibility-constraint summary, mental-model and language map, audience-share breakdown) live in `_index.md`.
- Decision-log entries.
- Research-ledger entries.

## Persona set composition

The set contains five categories of persona — every category must be addressed (some can resolve to "n/a for this product" with rationale):

1. **Primary personas (2–4):** the modal users the product is built for. Most design decisions optimize for these.
2. **Secondary personas (0–2):** users the product supports but does not optimize for. Design must work for them; not at their expense.
3. **Anti-persona (1):** who the product is **explicitly not for**. Without this, scope creeps and the product loses its edge. Describe in the same depth as a primary so the team can recognize the wrong fit.
4. **Edge-case personas (1–2):** users with non-modal patterns — temporary user (1-day trial, never returns), infrequent user (logs in twice a year and forgets everything), returning-after-long-gap user (3 months absent, needs to re-orient), support agent / customer-success looking over the user's shoulder.
5. **Persona-pair / triad scenarios (when applicable):** for products where multiple users interact (manager + employee, doctor + patient, parent + child, seller + buyer, agency + client), define the *pair scenario* — how the two personas interact, where their goals align, where they conflict, who has authority.

## Persona templates — three shapes (v1.1 — per VF-FIND-004)

Different persona types use different templates. The validation script's `check_persona_files` enforces which sections are required per file prefix.

### Template A — Primary / Secondary / Edge-case persona
**File prefix:** `persona-*.md` or `edge-case-*.md`
**Required sections (all 10):**
1. `## Identity`
2. `## Context`
3. `## Goals and frustrations`
4. `## Accessibility profile`
5. `## Mental model`
6. `## Quote`
7. `## Quantitative grounding`
8. `## Day-in-the-life narrative`
9. `## Validation plan`
10. `## Decision card`

### Template B — Anti-persona
**File prefix:** `anti-persona-*.md`
**Required sections (6):**
1. `## Identity`
2. `## Context`
3. `## Why she's the wrong fit` (or `## Why he's the wrong fit`)
4. `## What we are intentionally not building`
5. `## Anti-persona is binding`
6. `## Decision card`

### Template C — Pair scenario
**File prefix:** `pair-*-and-*.md`
**Required sections (7):**
1. `## Relationship`
2. `## Authority asymmetry`
3. `## Goal alignment`
4. `## Goal tension`
5. `## Touchpoints`
6. `## Trust / privacy line`
7. `## Design implications`
8. `## Decision card`

Validation rejects persona files missing required sections for their template. Anti-personas and pair scenarios do not need Template A's sections (Quantitative grounding, Day-in-the-life, Validation plan are inapplicable to those types).

## Persona structure (Template A detail)

Produce the set above. Each Template-A persona contains:

### Identity
- **Name** (first name only): a memorable handle.
- **Role / occupation**: specific.
- **Age bracket**: 22–28, 35–45, 60+, etc.
- **Tech comfort**: novice / mainstream / power / developer.

### Context
- **Primary use context**: where, when, while-doing-what.
- **Device profile**: primary device + secondary; OS version; screen size; input modality (touch / pointer / keyboard / voice / mixed).
- **Session shape**: duration, frequency, interruptibility, parallel tasks.
- **Network context**: stable Wi-Fi / shaky mobile / offline expected.
- **Lighting context**: indoor screen / outdoor glare / dim bedroom.

### Goals and frustrations
- **Top 3 goals** with this product, in priority order.
- **Top 3 frustrations** with current alternatives (specific, not "it's slow").
- **One thing that would make them love this product** — concrete behavior, not adjective.

### Accessibility profile
- **Vision**: typical / low-vision / blind / color-vision-different / age-related vision changes.
- **Motor**: typical / limited fine motor / tremor / one-handed / external switch.
- **Hearing**: typical / deaf-HoH / context-deaf (loud environment).
- **Cognitive**: typical / ADHD / dyslexia / autism spectrum sensory needs / low-literacy / non-native language.
- **Vestibular / motion sensitivity**: typical / sensitive (prefers reduced motion).
- **Assistive tech**: screen reader (NVDA / JAWS / VoiceOver / TalkBack), magnifier, voice control, switch control.

At least one persona must represent a non-typical accessibility profile. Designing for that persona explicitly is the only way to actually hit WCAG-target outcomes.

### Mental model
- **What metaphor does this user reach for** when first encountering the product? (file system, social feed, chat thread, dashboard, document, map, etc.)
- **What feature do they expect to exist** because of similar products they use?
- **What language do they use** internally for the product's nouns and verbs?

### Quote
- One quote in the persona's voice that captures how they would describe the product or their need. Must sound like spoken language, not marketing copy.

### Quantitative grounding
- **Estimated audience share:** ~N% of the target user base, or "majority / large minority / small minority / edge."
- **Source basis:** User-confirmed (e.g., founder said so), Research-backed (industry data), or Assumption.
- If only assumption, mark for post-launch analytics validation.

### Day-in-the-life narrative
- A 4–6 sentence narrative describing where the product fits into the persona's actual day.
- Names the time of day, the device, the location, what they were doing before, what they do after, the interrupt patterns.
- Reveals the time-pressure, attention-budget, and emotional context that screen-by-screen design must accommodate.

### Validation plan
- **Confirmation method:** how the team would validate this persona once the product ships (analytics cohort, user interview script, survey, support-ticket pattern).
- **Indicator metrics:** what behavior in production data confirms this persona exists and is real.
- **Falsification:** what would tell us this persona doesn't actually exist or is mis-specified.

### Persona decision card

For each persona, log a decision card:

```markdown
### [DEC-NNN] Persona — [name]

**Decision:** [name], [role], [age], [tech comfort]; uses on [device] in [context]; primary goal [goal]; key accessibility profile [profile].

**Why this persona is in the set:** [covers an underserved corner of the audience / represents the modal user / forces a constraint the team would otherwise ignore].

**Why others didn't make the cut:** [list of nearby personas that were considered and merged or dropped].

**Confidence:** ...
**Source basis:** ...
**Bindings:**
- Drives accessibility decision for [feature / surface].
- Drives layout density decision in [DEC-NNN].
- Drives input modality decisions in [DEC-NNN].
**Reversal trigger:** [analytics or user research result that would retire this persona].
```

## Mental model and language map

Aggregate findings across personas:

- **Shared metaphors** users reach for — drives IA and navigation patterns.
- **Vocabulary** users use — drives content design and microcopy.
- **Workflow shapes** — drives default screens and flows.
- **Failure expectations** — drives error messaging tone.

## Device and input matrix

| Persona | Primary device | OS / version | Input | Screen size | Notes |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

This matrix drives the layout system, touch-target rules, and gesture vocabulary downstream.

## Accessibility constraint summary

Aggregate the per-persona accessibility profiles into a single constraint list the rest of VisualForge will honor:

- Minimum touch target: largest of WCAG 2.2 (24×24 CSS px effective) and platform standard (44×44 iOS, 48×48 Android) — usually 44×44.
- Screen reader support: required for personas X, Y, Z — drives ARIA contract in component-system.
- Reduced motion: at least one persona prefers — drives motion-design fallbacks.
- Color independence: persona Z has color vision difference — drives never-color-alone rule.
- Cognitive load constraints: persona X has ADHD — drives focus / progressive disclosure decisions.

## Anti-persona structure

Same fields as a primary persona — but the goals section describes *why this product is wrong for them*, and the "what would make them love this product" field is replaced with "what they'd need that we are intentionally not building."

Anti-persona is binding too: when the team is tempted to add a feature, check it against the anti-persona — does this drag the product toward serving them?

## Pair-scenario structure

For each pair scenario:

```markdown
### Pair scenario — [Persona A] × [Persona B]

- **Relationship:** [manager-employee | doctor-patient | parent-child | seller-buyer | agency-client | other]
- **Authority asymmetry:** [A has admin / B has admin / equal / contextual]
- **Goal alignment:** [where they want the same outcome]
- **Goal tension:** [where their goals conflict — e.g., manager wants oversight, employee wants autonomy]
- **Touchpoints:** [screens where both are present — direct (joint editing) or indirect (one sees results of the other's actions)]
- **Trust / privacy line:** [what A can see of B and vice versa]
- **Design implication:** [permission model, notification policy, what features differ by role]
```

## Anti-slop persona checks

A persona fails if:

- Name is a stereotype ("Millennial Megan", "Boomer Bob").
- "Tech comfort: high" is the only differentiator from another persona.
- Goals are restatements of product features ("wants to use the dashboard").
- No accessibility profile, or all personas have "typical" profile.
- Device is "phone" without OS / size / input detail.
- Quote sounds like a marketing tagline.
- Persona cannot be used to make a specific design decision later (the personas-bind-decisions rule).
- **No anti-persona** — set is incomplete.
- **No edge-case persona** — set is incomplete.
- **No day-in-the-life narrative** — persona is not grounded in time.
- **No quantitative grounding** — persona priorities are unweighted.
- **No validation plan** — personas are unverifiable.

## Quality gate

- Full set composed: 2–4 primary, 0–2 secondary, 1 anti-persona, 1–2 edge-case, 0–N pair-scenarios as applicable.
- At least one persona with a non-typical accessibility profile.
- Each persona has all sections completed with concrete values, including quantitative grounding, day-in-the-life, validation plan.
- Anti-persona has goals-against-product framing and "what we are intentionally not building."
- Pair scenarios (when applicable) document authority asymmetry, goal tension, trust line.
- Device and input matrix is filled.
- Accessibility constraint summary feeds into later subskills.
- Every persona has a decision-log entry.

## Sources and basis

Document where each persona came from: user-confirmed, Specforge-derived, research-backed (with sources from research-ledger), or labeled Assumption with risk impact.
