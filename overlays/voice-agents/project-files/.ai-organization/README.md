# Installed AI Organization Control Plane

Universal runtime, schemas, action policy, risk policy, and role registry are byte-exact projections of the canonical commit declared by `control-plane-assets.v1.json` from the fixed control-plane worktree. That manifest is the singular provenance authority; this README and `ownership.json` do not duplicate its commit literal. Project-owned authority lives in the project role extension, proof profiles, Voice Agent rules, and product architecture.

Run `pnpm run gate:organization` for orchestration parity and `pnpm run verify` for the full Phase 1 ladder. Generated `roles.json` and agent files come from `scripts/generate-agent-projections.mjs`; the two role registries remain authoritative.

Deployment topology is intentionally unsettled because Phase 1 has no deployment. Live contact, browser submission, provider spend, migration execution, deployment, production mutation, push with unverified side effects, and merge with production effects remain human-gated.
