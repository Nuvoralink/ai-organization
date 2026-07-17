# AI Organization Control Plane — agent router

This repository owns Nuvoralink's portable orchestration system. Read `README.md`, `docs/ownership-boundaries.md`, `docs/architecture.md`, `policies/action-authority.v1.json`, and the task-relevant manifest/catalog files before planning or editing.

## Irreducible rules

- Verify from files, diffs, test output, and installed parity; summaries are leads.
- This repository may contain orchestration assets only. Never import secrets, credentials, environment files, session/history data, logs, telemetry, customer data, provider payloads, application source, or ordinary product docs.
- Canonical files live under `global/`, `skills/`, and `overlays/`. Home/project copies are generated installations; do not fix drift only in the installed copy.
- Replace superseded authorities rather than layering a second rule, agent, hook, gate, or skill with the same responsibility.
- Every changed rule or gate needs a fail-state, a mutation that proves the control bites, and parity verification in every declared consumer.
- Product-specific truth stays in its product repository. Project overlays may route to that truth but must not silently restate large product specifications.
- Frontend remains Claude-Design-first and approval-gated. Figma is not part of the active workflow.
- Use `policies/action-authority.v1.json` for external/state-changing authority. If uncertain, choose the stricter tier.
- Branch protection is intentionally deferred. Do not enable or change it unless the user asks.

## Verification

Run `npm test` and `npm run control:check`. For installer changes, also run a dry-run against a temporary fixture and prove the local-only, drift, missing-file, duplicate-name, unsafe-path, and invalid-absolute-path mutations fail.

Every final report includes `Skill-loop findings: none` or the canonical skill/control improvement and its proof.
