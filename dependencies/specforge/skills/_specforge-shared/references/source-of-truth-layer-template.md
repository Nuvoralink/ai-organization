# Source-of-Truth Layer Template

Use this template for any layer that affects product claims, workflow status, permissions, billing, recommendations, scoring, ranking, dashboards, generated output, exports, admin actions, or other user-visible truth.

## Layer summary

- Layer ID:
- Layer name:
- Product decision this layer supports:
- User trust dependency:
- Risk level:
- Owner:
- Applicability tier:

## Authority

- Canonical source:
- Decision owner:
- Inputs:
- Outputs:
- Evidence required:
- Confidence or completeness levels:
- Freshness rules:
- Not-applicable rules:
- Low-confidence behavior:
- Missing-source behavior:
- Contradictory-source behavior:

## Decision boundary

- Human/admin owns:
- Product policy or rule engine owns:
- External provider owns:
- AI/model judgment owns, if applicable:
- Deterministic code owns:
- Explicit semantic/domain exceptions:
- Exception tests:
- Exception review trigger:

## Validation and remediation

- Schema validation:
- Grounding or source validation:
- Provenance validation:
- Policy validation:
- Authorization validation:
- Arithmetic or aggregation validation:
- Bounded remediation path:
- Fail-closed or limited state:
- Diagnostic output:

## Downstream consumers

| Consumer | Field or artifact consumed | Required behavior | Limited/unavailable state | Test proof |
|---|---|---|---|---|

## Fallbacks

| Fallback | Why it exists | What it may decide | What it must not decide | Retirement trigger |
|---|---|---|---|---|

## Tests

- Static checks:
- Contract tests:
- Local replay or deterministic fixture:
- Perturbation cases:
- Source-to-surface assertion:
- Role/browser/export smoke:
- One production-path or model proof, if needed:
