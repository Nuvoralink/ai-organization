# Decision Matrix Template

Use this when the app has AI, classification, recommendations, summarization, scoring, ranking, generated content, moderation, automation, complex business rules, permissions, billing state, status precedence, or non-trivial integrations.

## Matrix identity

- Matrix ID:
- Feature or workflow:
- Decision stage:
- User-visible decisions affected:
- Decision owner:
- Risk level:
- Owner:

## Inputs

| Input | Source authority | Required? | Freshness rule | Missing behavior |
|---|---|---:|---|---|

## Allowed outputs

| Output | Meaning | Required evidence | Downstream consumers |
|---|---|---|---|

## Disallowed outputs

| Output or behavior | Why blocked | Safe alternative |
|---|---|---|

## Examples and counterexamples

Include good, neutral, uncertain, and bad examples for the same concept when judgment is involved. Do not include only forbidden examples.

| Case | Input summary | Correct decision | Why | Proof required |
|---|---|---|---|---|

## Uncertainty states

- Insufficient evidence:
- Conflicting evidence:
- Stale source:
- Source not applicable:
- Needs human review:
- Fail-closed state:

## Validation

- Schema checks:
- Source/provenance checks:
- Authorization checks:
- Policy checks:
- Arithmetic/aggregation checks:
- Display-safety checks:
- Metering checks, if paid/scarce runtime is used:

## Bounded remediation

- Fields or states eligible for remediation:
- Remediation method:
- Max attempts:
- Fail-closed output:
- Diagnostic logging:

## AI or prompt-specific addendum, if applicable

- Model or prompt stage:
- Prompt version:
- Prompt packet inputs:
- Prompt compaction rules:
- Critical items that must stay full:
- Targeted repair prompt:
- Eval or golden-set proof:

## Tests

- Static contract tests:
- Local replay or deterministic fixture:
- Synthetic severity matrix:
- Source-to-surface test:
- One production-path/model proof, if needed:
