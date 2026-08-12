---
name: assurance-pipeline
description: Staged, resumable pipeline spine for security-vulnerability discovery and code review, built on the control plane's own hardened primitives. Phase 0 ships ONLY the reusable spine (stage-runner + resumable run-state store, backend abstraction with a mock backend, voting panel, scope/cost estimate, redaction-on-write, SARIF 2.1.0 + human-report emitters, CLI) proven by a deterministic 3-stage toy pipeline. Use when composing a staged assurance/review run, adding a stage, or wiring a real lens/backend in a later phase. Not itself a security scanner yet — Phase 0 carries no real lenses and no real model calls.
---

# Assurance Pipeline (Phase 0 — the spine)

A staged, resumable pipeline that will later host security-vuln discovery and code review. **Phase 0
is the reusable spine plus a deterministic toy pipeline that proves it** — no security lenses, no real
model calls, no product repositories. The plan is `docs/assurance-pipeline-plan.md`.

## When to use
- Composing or extending a staged assurance/review run (add a stage, a lens, a backend).
- Running the toy spine end-to-end to verify the primitive after a change.
- Wiring a real static-analysis lens, a real backend, or overlay install (Phase 1+, per the plan).

## What Phase 0 gives you
- **Stage-runner** — chains `async (ctx, input) => output` stages, validates each declared artifact
  against its JSON schema (reusing `core/schema/validate-json-schema.mjs`), and checkpoints every
  stage to a resumable run-state store.
- **Run-state store** — the spine's OWN lightweight store (NOT task-assurance, which is a closed
  completion-proof contract): a `run-manifest.json` + one JSON artifact per stage under a run
  directory, following the artifacts-dir + hashing convention of `core/lifecycle/evidence-runtime.mjs`.
  Resume reuses any stage whose artifact still hashes to its recorded sha256; the first changed or
  missing stage (and every stage after it) re-runs.
- **Backend abstraction** — `via ∈ {mock, cli, codex-cli}`. Phase 0 implements the **mock** backend
  (deterministic, offline). `cli` (Claude) and `codex-cli` (Codex) are documented, fail-closed stubs.
  `via: sdk` / `via: openai` (raw API endpoints) are OFF by default and throw.
- **Voting panel** — N lenses, majority threshold, and a deterministic prefilter fallback at N=1
  (a single lens is never trusted as a vote-of-one).
- **Estimate** — a scope + token/cost preview that makes **zero** backend calls.
- **Redaction-on-write** — every artifact (stage artifacts, SARIF, report) is masked before it
  touches disk: PAN (Luhn + issuer prefix), SSN, and common secret/token shapes.
- **Emitters** — SARIF 2.1.0 (validated against the vendored official schema) + a human Markdown
  report with FIX-PROVEN / FIX-PLAUSIBLE labels and an honesty clause naming unreached surfaces.
- **CLI** — `assurance estimate | scan | report`.

## CLI

```
node skills/assurance-pipeline/cli.mjs estimate --target <ref>            # zero-spend scope preview
node skills/assurance-pipeline/cli.mjs scan --target <ref> [--run-id X]   # run the toy spine, checkpoint + resume
node skills/assurance-pipeline/cli.mjs report --run-id X                  # re-emit SARIF + report, no re-run
```

Phase 0 ships only the `mock` backend, so `scan` runs the deterministic toy pipeline
(produce → verify → emit). Passing `--via cli` or `--via codex-cli` fails closed (Phase-1 stubs).

## Runtime is repo-resident
The spine imports control-plane primitives from `core/` (per plan decision D1: a repo-resident Node
stage-runner). Run it from the control-plane repo. Overlay/install packaging is a Phase-1 concern.

## Extending it (later phases)
Add stages via `defineStage({ name, kind, inputSchema, outputSchema, run })` and pass them to
`runPipeline`. Real security lenses (Semgrep/CodeQL/osv/gitleaks adapters), execution-proven
validation, and the Claude/Codex backend adapters are Phase 1 — see `README.md` and the plan.

See `README.md` for the architecture and the reuse/seam map.
