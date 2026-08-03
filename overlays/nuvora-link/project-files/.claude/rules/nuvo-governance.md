---
paths:
  - "apps/api/src/agent/nuvo/**"
  - "apps/api/src/modules/nuvo/**"
  - "docs/nuvo/**"
  - "docs/adr/ADR-NUVO-*.md"
---
# Nuvo governance

`docs/nuvo/NUVO_GOVERNANCE_RULEBOOK.md`, the permission matrix, and the tool registry are mandatory authorities. Nuvo is an interface, never identity, authorization, billing, or data authority.

All access flows through strict server-owned tools after actor and organization resolution. Unknown domains and uncovered resource/action/scope combinations deny. User chat and model output never supply actor identity or permission. Writes require exact target/mutation mapping, idempotency, concurrency safety, audit evidence, and confirmation/simulation by the registered risk class.

New domains require the complete onboarding pack and paired allow/deny, ambiguity, spoof, injection, retry, concurrency, and audit tests. Prompts guide behavior but never replace enforcement.

Killer mutation: trust a chat role claim, pass actor identity from the model, add a generic query/admin tool, bypass PolicyEngine, or add a tool without matching matrix and registry rows.
