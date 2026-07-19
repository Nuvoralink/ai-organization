## Product outcome

<!-- State the user/business outcome. Explain what would be too little (symptom patch) and too much. -->

## Authority and decision matrix

| Decision | Authority/evidence | Chosen option | Rejected option and its strongest argument | Invalidation trigger |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Blast radius

### Upstream feeders

<!-- Every creator/input/dependency that supplies the changed behavior. Include exact paths/symbols. -->

### Downstream consumers

<!-- Every caller, mapper, persistence/read model, job, UI/API surface, doc, test, and external consumer. -->

## Verification evidence

| Exact command | Command's own exit status | What it proves | Raw key output/artifact |
| --- | ---: | --- | --- |
|  |  |  |  |

<!-- Never report a pipe/tail/tee status as the command's status. Link or paste the load-bearing output. -->

## Killer mutation

<!-- Name the deliberate TEMP-fixture mutation, the test/gate that went red, and why this catches regression. -->

## Rendered evidence (when relevant)

<!-- Attach approved Claude Design baseline plus rendered proof at required states/breakpoints, or write N/A. -->

## Security, tenant, compliance, and authority checks

- [ ] Server-side authorization/object scope and cross-tenant behavior were checked, or N/A is justified.
- [ ] Secrets, PII, provider payloads, transcripts/audio, and signed URLs do not leak, or N/A is justified.
- [ ] ARC-006 authority tier and human-decision boundary are preserved, or N/A is justified.
- [ ] Compliance/provider/paid-usage invariants are preserved, or N/A is justified.

## Docs, journey, and doctrine-loop

- [ ] Behavior/route/contract docs and live maps were updated, or exact N/A evidence is supplied.
- [ ] Journey lesson was captured when reusable, or no reusable lesson surfaced.
- [ ] Doctrine-loop findings include both RCA questions and the smallest control fix, or explicit `none`.

## Honesty: surfaces not reached

<!-- Name every surface not inspected/run/rendered/deployed and why. Never claim clean outside reviewed scope. -->

## Human-gated actions (agents must leave unchecked)

`.ai-organization/policies/action-authority.v1.json` is canonical. Agents may branch, commit, and create/update
this PR within the authorized task. Push requires live proof of no preview/production deploy, publish or billed
build, production write, or external contact; preview counts as deploy. Agents may merge only when all conditional-merge criteria below are
independently proven; otherwise merge requires a human decision.

- [ ] Human approves deploy or production mutation.
- [ ] Human approves production config changes or migrations.
- [ ] Human approves destructive, billed, secret-bearing, or external contact/message actions.
- [ ] Human approves product, design, or material architecture decisions.

### Conditional merge evidence

- [ ] Low-risk.
- [ ] Additive or isolated.
- [ ] Conflict-free.
- [ ] Independently verified from actual artifacts/output.
- [ ] No production or deploy effect.
