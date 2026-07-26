---
name: marketforge-messaging-architecture
description: Build the messaging architecture — value pillars, proposition stack, message × awareness-stage matrix, copy guidelines, what-we're-not-saying. The connective tissue between positioning, brand, and all downstream copy. Use as Phase 3 step 2.
---

# MarketForge Messaging Architecture

Read shared references, especially `_marketforge-shared/templates/message-stage-matrix-template.md` and `awareness-stages.md` output.

## Global quality rules

- Lead with VOC verbatim quotes when possible. Customers' words > our words.
- Stage match required: every messaging variant declares its Schwartz awareness stage.
- "What we're NOT saying" is a required section — explicit negative space prevents drift.

## Purpose

Produce:
1. Value pillars (3-5 — the core arguments).
2. Proposition stack (hero proposition, sub-propositions, proof points).
3. Message × awareness-stage matrix (per template).
4. Copy guidelines (rules for headlines, body, CTAs).
5. "What we're not saying" register.

## Inputs

- `positioning.md`, `brand-strategy.md`, `icp-and-personas/`, `voice-of-customer.md`, `awareness-stages.md`, `competitive-intel.md`.

## Outputs

- `docs/marketing-plan/03-brand/messaging-architecture.md`
- DEC-110 to DEC-129

## Structure

```markdown
# Messaging Architecture

## Value pillars (3-5)

For each:
- **Pillar name** (short — "Migration in minutes, not days")
- **What it argues:** [the case being made]
- **Proof points:** [data, named customers, specific outcomes — sourced]
- **VOC verbatim that supports it:** "[quote]" — [source]
- **Awareness stages it serves:** [Problem-aware / Solution-aware / Product-aware]
- **Anti-pillar (what we're NOT arguing):** [explicit boundary]

## Proposition stack

### Hero proposition (one sentence — homepage, deck cover)
"[Sentence]"

### Sub-propositions (5-7 — feature pages, deck slides)
- "[Sub 1]"
- "[Sub 2]"

### Proof point library

[Numbered list of all proof points usable across copy — each with source.]

1. "Cut monthly close from 8 days to 3" — Source: [customer case, name + date].
2. "98 of 100 trials activate within 24 hours" — Source: internal product data Q1 2026.
3. ...

## Message × awareness-stage matrix

[Full matrix per `_marketforge-shared/templates/message-stage-matrix-template.md`.]

## Copy guidelines

### Headlines
- Format: [specific structure — "Outcome in [unit]: [number]"]
- Word count: [5-12 words for hero headlines]
- Banned: "Unlock", "Empower", "Streamline", "Revolutionary", "Game-changing", three-word triplets, em-dash overuse, "Not just X — Y" structure.

### Body copy
- Reading level: [grade level]
- First-sentence rule: [specific outcome the reader gets]
- Avoid: passive voice, jargon, exclamation marks.

### CTAs by stage
[From awareness-stages.md, restated.]

### Voice match
[Brief — refer to brand-strategy.md voice section.]

## What we are intentionally NOT saying

- We are NOT positioning as "for everyone." We position for [specific ICP].
- We are NOT claiming "world's best" or "industry-leading" without verifiable rank.
- We are NOT competing on price (or, if we are, we say so explicitly).
- We are NOT making medical / financial advice claims (or any regulated-claim that requires disclosure we haven't built).
- We are NOT promising outcomes we haven't measured.
- We are NOT using fake scarcity or fake testimonials.
- We are NOT comparing ourselves to competitors in defamatory or misleading ways.

## Decision cards
[DEC-110 to DEC-129]

## Cross-cites produced

Consumed by every copy-producing subskill: website-copy, landing-pages, ad-creative-brief, paid-search, paid-social, cold-email, email-lifecycle, content-strategy, social-imagery, video-scripts.

## What we are intentionally NOT doing
- Writing the actual copy — downstream subskills do that.
- Setting visual treatments — VisualForge / marketforge-distinctive-assets do that.
- Defining specific channels — channel-strategy.

## Sources and basis
V3 §1.3 (Schwartz awareness stages), §6.2 (Cialdini), §11 (Underrated evidence-backed tactics).
```

## Anti-patterns

- One mega-proposition that tries to say everything → fragmented messaging downstream.
- Proof points without sources → AI slop.
- No stage-matrix → landing pages misfire.

## Sources and basis
V3 §1.3, §6.2, §11.
