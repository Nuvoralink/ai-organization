---
name: assurance-pipeline
description: Staged, resumable pipeline for security-vulnerability discovery and code review, built on the control plane's own hardened primitives. Phase 0 is the reusable spine (stage-runner + resumable run-state store, backend abstraction, voting panel, scope/cost estimate, redaction-on-write, SARIF 2.1.0 + human-report emitters, CLI). Phase 1a adds the S2 static-evidence stage — a Semgrep-OSS adapter (native binary or the semgrep/semgrep Docker image), a stack-parametric adapter registry, a SARIF→StaticFinding normalizer, and a minimal S0→S2→S3 detection pipeline. Use when composing a staged assurance/review run, adding a stage/lens/adapter, running a static scan, or wiring a real backend in a later phase.
---

# Assurance Pipeline (Phase 0 spine + Phase 1a static evidence)

A staged, resumable pipeline for security-vuln discovery and code review. **Phase 0 is the reusable
spine** (proven by a deterministic toy pipeline). **Phase 1a adds the S2 static-evidence stage** — a
Semgrep-OSS adapter that normalizes SARIF into `StaticFinding`s, a stack-parametric adapter registry,
and a minimal S0→S2→S3 detection pipeline. It closes VVAH caveat (a) — native TS/Node static analysis —
via a mature tool rather than an LLM. Design authority: `docs/assurance-pipeline-plan.md` +
`docs/assurance-pipeline-phase1-plan.md` (locked decisions D1–D7, D-P1-1…7).

## When to use
- Composing or extending a staged assurance/review run (add a stage, a lens, a static adapter, a backend).
- Running a deterministic static scan over a target repo (`scan --repo`).
- Verifying the machine can run the pipeline's dependencies (`doctor`).

## What the spine gives you (Phase 0)
- **Stage-runner** — chains `async (ctx, input) => output` stages, validates each declared artifact
  against its JSON schema (reusing `core/schema/validate-json-schema.mjs`), and checkpoints every
  stage to a resumable run-state store. Inter-stage input is always the redacted persisted artifact
  (D7: fresh ≡ resume; no unredacted secret crosses a stage boundary; lenses are redaction-invariant).
- **Run-state store** — the spine's OWN lightweight store (NOT task-assurance, a closed
  completion-proof contract): a `run-manifest.json` + one JSON artifact per stage, hashed for resume.
- **Backend abstraction** — `via ∈ {mock, cli, codex-cli}`; Phase 0 implements **mock** (deterministic,
  offline); `cli`/`codex-cli` are fail-closed stubs; `sdk`/`openai` raw API are OFF and throw.
- **Voting panel** (N lenses, majority threshold, N=1 deterministic fallback), **estimate** (zero-spend),
  **redaction-on-write** (PAN/SSN/secret masking on every artifact), **SARIF 2.1.0 + report emitters**.

## What Phase 1a adds (S2 static evidence)
- **`StaticFinding` contract** (`schemas/static-finding.v1.schema.json`) + a **SARIF normalizer**
  (`lib/adapters/static/normalize.mjs`): a tool's SARIF 2.1.0 → normalized findings with a stable
  structural `fingerprint` (D7-invariant — identity is tool/rule/location, never raw snippet bytes);
  a malformed/wrong-version envelope is rejected.
- **Semgrep OSS adapter** (`lib/adapters/static/semgrep.mjs`): builds the exact argv
  (`--metrics=off`, explicit rulesets; never `--pro`, never `--config auto`) and runs Semgrep. Execution
  is **portable (D-P1-7): a native `semgrep` binary is used when present, else the `semgrep/semgrep`
  Docker image** (Windows-with-Docker, Linux CI). No runtime → fail-closed `SEMGREP_UNAVAILABLE`.
- **Stack-parametric registry** (`lib/adapters/static/registry.mjs`) — adapters declare their stacks;
  nothing is hardcoded to one project.
- **S2 stage** (`lib/stages/s2-static-evidence.mjs`) + a minimal **S0→S2→S3 security pipeline**
  (`pipelines/security-pipeline.mjs`) emitting SARIF + a report via the spine's emitters.

## CLI
```
node skills/assurance-pipeline/cli.mjs doctor                             # check the Semgrep runtime (D-P1-7)
node skills/assurance-pipeline/cli.mjs estimate --target <ref>            # zero-spend scope preview
node skills/assurance-pipeline/cli.mjs scan --repo <path>                 # deterministic S0→S2→S3 static scan
node skills/assurance-pipeline/cli.mjs scan --target <ref> [--run-id X]   # run the toy spine, checkpoint + resume
node skills/assurance-pipeline/cli.mjs report --run-id X                  # re-emit SARIF + report, no re-run
```
`scan --repo` needs a Semgrep runtime; run `doctor` first. If it reports none, `docker pull semgrep/semgrep`
(or install a native `semgrep`). Machines that run scans provision this in initialization — see
`docs/new-machine-bootstrap.md`. `--via cli` / `--via codex-cli` still fail closed (Phase-1b backends).

## Runtime is repo-resident
The pipeline imports control-plane primitives from `core/` (plan D1). Run it from the control-plane repo;
overlay/install packaging into a product repo is Phase 1d.

## Extending it (later phases)
Add stages via `defineStage(...)` + `runPipeline`. The LLM deep-dive/verify lenses (Phase 1b), osv-scanner
+ gitleaks adapters (Phase 1a.2), execution-proven validation (Phase 1c), and overlay wiring (Phase 1d)
are per the plan. See `README.md` for the architecture and the reuse/seam map.
