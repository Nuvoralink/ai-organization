# Vendor-neutral task governor

`task-governor.mjs` is the deterministic execution controller shared by Claude and Codex. The orchestrator remains the single PM; the governor does not decide product scope or architecture. It validates the accepted task contract, exact edit boundaries, risk-to-proof coverage, opened proof artifacts, killer mutations, and independent review before a completion tier can be claimed.

Claude lifecycle hooks call it at `TaskCreated` and `TaskCompleted`. Codex tasks call the same commands through the project's completion script. Tool adapters may collect evidence differently, but neither vendor gets a weaker completion definition.

```powershell
node core/lifecycle/task-governor.mjs validate path/to/task.json
node core/lifecycle/task-governor.mjs complete path/to/task.json path/to/evidence.json
```

The task contract and evidence formats are defined in `schemas/task-assurance.v1.schema.json` and `schemas/task-evidence.v1.schema.json`. Project overlays may add stricter risk profiles; they may not remove universal requirements.
