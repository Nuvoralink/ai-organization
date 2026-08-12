---
paths:
  - 'platform-design/**'
  - 'packages/**'
  - 'registries/**'
  - 'scripts/**'
---

# Architecture authority

Read `platform-design/README.md`, then the architecture, state/contracts, and implementation-plan documents in full. One registered reducer owns each state family; one persisted authority owns each event, action, usage, job, derivative, and readiness lifecycle. Extend current ports and contracts—never create a provider-specific parallel orchestration path.

Every new effect-capable schema variant must enter `registries/effect-release-bindings.v1.json`, name its durable fence and live consumer, and carry liveness plus mutation proof. Future seams require a current consumer; speculative vendor abstractions stay documented until a real contract exists.
