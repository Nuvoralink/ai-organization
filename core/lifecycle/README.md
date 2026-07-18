# Vendor-neutral task assurance runtime

The shared lifecycle runtime is the completion authority used by the Claude platform adapter and any future trusted external adapter. The orchestrator remains the PM; this runtime does not decide product scope or architecture.

Task assurance is a state machine, not a status form:

1. `TaskCreated` validates a v2 contract, resolves each `profile_id` through a project-owned registry, rejects non-local or human-gated commands, captures the repository binding, and creates an immutable task attempt.
2. A registered runner spawns exact argument arrays with the controller shell disabled and a minimal environment. Registered `npm run` entries still use npm's normal package-script semantics, so the controller recursively rejects human-gated nested and pre/post scripts. It captures output hashes and writes a content-minimized parsed artifact under ignored `tmp/agent-assurance/`.
3. The governor opens and hashes each artifact, verifies the task/attempt/contract/profile/repository binding and HMAC attestation, requires the registered mutation receipt when applicable, and consumes the canonical risk-control policy.
4. The implementer's completion report comes from the platform `SubagentStop` event and must match the task's accepted parent session and declared implementer role. Only the same platform run may supersede it after a review/fix loop; foreign overwrites fail. Independent review must come from a different platform run. Human approval is a separate receipt from an external trusted provider. The local runtime exposes no human-receipt issuer, so a human-gated task fails closed until that protected provider exists. None is accepted as a `TaskCompleted` field, caller-supplied boolean, or public local CLI assertion.
5. Completion moves atomically from `accepted` to `completion_claimed` to `completed`. A duplicate completion returns the existing receipt without rerunning proof.

`artifact_opened` and `killer_mutation_observed` do not exist in the v2 contract. A green baseline command cannot represent inspection or mutation evidence. Mutation proof is structural: clean pass, registered mutant fails for the expected diagnostic, exact restoration, clean post-restore pass.

Useful local commands:

```powershell
node core/lifecycle/task-governor.mjs validate path/to/task.json
node core/lifecycle/lifecycle-controller.mjs status TASK-ID
```

The formats are `schemas/task-assurance.v2.schema.json` and `schemas/task-evidence.v2.schema.json`. `policies/risk-controls.v1.json` derives mandatory proof capabilities, reviewer roles, and human gates. Project adapters may be stricter; they may not accept free-form proof commands, caller-authored evidence, or weaker bindings.

Claude's documented `TaskCreated` and `TaskCompleted` payloads do not carry a subagent run id or completion report. The adapter therefore accepts report/review markers only from the documented `SubagentStop` payload, which does carry `agent_id`, `agent_type`, and `last_assistant_message`. Those events still do not provide an official task-to-subagent-ID link, so the local adapter binds the report to the accepted parent session and declared implementer role and uses the platform run ID to prevent foreign overwrite and self-review; a managed external controller is required for stronger principal binding.

Codex has no equivalent authenticated local lifecycle hook in this integration. The shipped `codex-task-status.mjs` client is deliberately read-only; it cannot create, complete, or attest attempts. Codex still consumes the shared contracts, rules, gates, and proof formats, but automatic lifecycle enforcement must wait for a trusted platform/external event provider rather than exposing a self-minting local CLI.

The human-gate receipt shape is reserved for a future protected approval adapter. No local module or CLI can issue one. Until a provider authenticates the human principal outside the agent-writable process and imports a bound receipt, destructive, billed, production-mutating, and external-contact tasks remain non-completable by design.

Local limitation: an unrestricted process that can read and rewrite both the controller state and its code is not a cryptographic adversarial boundary. The local HMAC/state design prevents accidental and cheap self-certification. Strong protection against a deliberately malicious local agent, and every destructive, billed, production, or external-contact approval, requires an external controller or signing service whose key and evidence store are unavailable to that agent.
