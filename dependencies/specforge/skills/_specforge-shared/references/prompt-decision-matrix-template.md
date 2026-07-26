# AI Prompt Decision Matrix Addendum

Use this only when the app has runtime AI, model-based classification, summarization, ranking, recommendations, moderation, generated content, or agentic tool use.

Start with `decision-matrix-template.md`, then add the fields below.

## Prompt identity

- Prompt/model stage:
- Prompt version:
- Model/provider:
- User-visible decisions affected:
- Cost/metering role:
- Owner:

## Prompt inputs

| Input packet | Source authority | Full or compacted | Required metadata | Missing behavior |
|---|---|---|---|---|

## Prompt contract

- System instruction purpose:
- Allowed outputs:
- Disallowed outputs:
- Required evidence/provenance:
- Required uncertainty states:
- Required refusal or fail-closed states:
- Human review triggers:

## Prompt packet compaction

- Full context required:
- Context that can be compacted:
- Required metadata for compacted slices:
- Critical items that must be restored in full:
- Test proving compaction did not degrade output:

## Targeted repair

- Fields eligible for targeted repair:
- Repair prompt input:
- Max remediation attempts:
- Fail-closed output:
- Diagnostic logging:

## Evals

- Static prompt tests:
- Local replay:
- Golden-set evals:
- Source-to-surface test:
- One real model/runtime proof, if needed:
