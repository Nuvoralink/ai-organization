---
name: ai-decision-contract-builder
description: Use when designing, repairing, or reviewing AI/LLM semantic decisions before implementation. Trigger for prompts, classifiers, rankers, recommendations, generated coaching/copy, summarization, extraction, validation/repair flows, decision matrices, grounding/provenance contracts, uncertainty states, or avoiding brittle deterministic phrase rules.
---

# AI Decision Contract Builder

Use this skill before or during implementation when AI is expected to make meaning-based decisions.

## Product Intent First

State what decision the product needs AI to make and why code alone should not own the semantic judgment.

Then define what deterministic code must still own: schema, grounding, provenance, permissions, source authority, policy, arithmetic, persistence, display safety, rate/cost metering, and final contract validation.

## Decision Matrix

Define:

- decision name,
- user/product outcome,
- inputs,
- source authority and precedence,
- allowed outputs,
- disallowed outputs,
- uncertainty or insufficient-evidence states,
- examples,
- counterexamples,
- grounding/provenance requirements,
- validation rules,
- bounded repair path,
- fallback path when repair fails,
- downstream permissions and visibility,
- final consumers.

## Prompt Contract

The prompt should teach the general technique, not only the observed example. Include:

- what evidence to trust,
- what evidence to ignore,
- when to abstain,
- how to separate source facts from generated advice,
- how to label confidence and provenance,
- what must never be fabricated,
- what shape the JSON/output must take.

### Teach the intent, not the keywords (reach for this when the decision turns on meaning)

When the decision is a meaning judgment that surface words alone would get wrong — look-alikes, paraphrases, indirect or vertical phrasings, direction (who is driving vs reacting), "is this the booking moment / a real objection / the right speaker" — teach the model the underlying INTENT or FUNCTION the decision turns on, not a keyword list. Three moves:

1. State what each option is *doing* in context, as a stable function that survives surface variation. (e.g. "the caller DRIVES toward an appointment and owns the process; the recipient REACTS to it" / "the booking moment is where the rep PIVOTS from exploring toward securing an appointment".)
2. Give the decision rule as a question about that function, not the words. (e.g. "is this line DRIVING the booking or REACTING to it?")
3. Pin it with examples AND counterexamples — especially the look-alikes a keyword reading gets backwards, and the indirect phrasings the model would otherwise miss. The examples are what let the model generalize to phrasings the prompt never listed; without the intent frame they read as a phrase list and overfit.

This is the same `decision matrix` discipline, sharpened: the matrix's allowed/disallowed outputs say *what*; the intent teaching says *how to recognize them by function*. They belong together.

Do NOT force this everywhere. Skip it when the decision is structural or mechanical, when the surface form IS the truth (an exact enum, schema field, ID, or explicit label), or when a short keyword cue is genuinely sufficient and unambiguous. The test: would a competent reader get this wrong from the keywords alone and only get it right by reading what the line is *doing*? If yes, teach the intent. If a keyword cue is honestly enough, a paragraph of intent prose is just bloat.

## Validation And Repair

Validators are backstops and teachers. When regeneration is possible:

1. Validate schema, grounding, provenance, authority, policy, and safety.
2. Send only failed fields back to the model.
3. Explain what failed, why it failed, and the correct authority.
4. Revalidate repaired fields.
5. Merge repaired fields into the previous validated-good payload.
6. Move the complete payload downstream only after repair passes.

Do not silently rewrite bad semantic decisions in deterministic code unless the issue is exact policy, security, formatting, or display validation.

### Guards are signals, not gates — never let a check override the model's meaning verdict

A schema-valid model verdict (valid enum/shape, required fields, rationale present) is **authoritative**. The semantic guards — grounding, speaker attribution, time-window, confidence floor — may **attach** a confidence discount or an "unverified" provenance flag, but must **never reject, discard, override, or substitute** the verdict, and must never trigger a deterministic fallback that overwrites it. The moment a guard can overrule the model, deterministic code is the primary intelligence layer again — the exact thing this skill exists to prevent. Guards also **compound**: one upstream model slip (e.g. a mis-assigned speaker) feeding an authoritative downstream guard (a speaker-filtered grounding check) cascades into a wrong final verdict AND a wrong "limited"/degraded honesty state. Gate only on schema + security/policy; everything about meaning is a signal surfaced for review. You cannot enumerate a guard for every situation — that is precisely why the model owns meaning and the guards only annotate it. (Where a deterministic semantic block is genuinely unavoidable, mark it with scope + reason per the rule below and prove it can't expand.)

## Tests

Cover:

- positive examples,
- counterexamples,
- paraphrases,
- missing evidence,
- conflicting evidence,
- fabricated quote attempts,
- uncertainty/abstain,
- invalid schema,
- validator-triggered repair,
- downstream consumer proof.

## Output

Return the decision matrix, prompt contract changes, validator/repair boundaries, final consumers, tests/proofs, and any deterministic rule that is intentionally allowed with scope and reason.
