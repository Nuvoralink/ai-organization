# CoachAI organization control plane

This directory is the vendor-neutral authority for agent roles, action permissions, startup context, task lifecycle, proof selection, and universal-overlay ownership. Claude hooks and agent files adapt these contracts; they do not redefine them.

Normal flow:

1. The single orchestrator creates a kickoff artifact matching `schemas/task-assurance.v1.schema.json`.
2. The premise challenger is used when value, need, placement, or architecture is unsettled.
3. Work proceeds under the generated universal policy at `policies/action-authority.v1.json` and the role boundary in `roles.json`.
4. `npm run proof:changed` maps changed paths to the minimum sufficient risk proof.
5. Completion evidence matches `schemas/task-evidence.v1.schema.json`; the lifecycle hook refuses closure when selected proof or evidence is missing.
6. `npm run gate:organization` verifies the control plane. `npm run test:organization-control-plane` proves each gate fails under a seeded killer mutation.

The user approves product, design, material architecture, and irreversible/external/production actions. Claude Design is the active visible-design authority. Branch protection is intentionally deferred and no repository file claims it is active.
