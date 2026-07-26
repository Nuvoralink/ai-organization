# Bounded Remediation and Validation Protocol

Use this when generated docs, repo-derived claims, status fields, UI surfaces, exports, dashboards, model output, automated decisions, or workflow state fail validation.

## Do not silently patch meaning

Do not fix a failed claim by hiding it, locally rewriting it, or adding one-off rules unless the issue is exact policy, safety, schema, authorization, arithmetic, or display safety.

## Remediation sequence

1. Name the failed field, claim, or state.
2. Name the authority source it should have used.
3. Check whether the source was present, fresh, applicable, and authorized.
4. Check whether the decision matrix covered this case.
5. Check whether validation rejected the right thing.
6. Choose the narrowest safe remediation:
   - re-read canonical source;
   - invalidate stale cache/read model;
   - recompute from source;
   - re-run deterministic validation;
   - targeted AI/model repair for the failed field or packet;
   - human/admin review;
   - fail closed.
7. Validate again.
8. Record the remediation attempt and result.
9. Update docs, tests, or authority map if the failure reveals a missing rule.

## When code may intervene

Code may block, downgrade, hide, or mark output limited when:

- source is missing;
- source is stale;
- source label is false;
- authorization is missing;
- policy requires it;
- output is unsafe;
- schema is invalid;
- arithmetic or aggregation is wrong;
- display would mislead the user.

Code should not become a long-term semantic or domain judge unless an explicit exception is documented.

## Required remediation record

- Remediation ID:
- Failed field or claim:
- Failure type:
- Authority source:
- Remediation method:
- Attempts:
- Result:
- User-visible state:
- Diagnostic state:
- Follow-up doc/test update:
- Review or sunset trigger:
