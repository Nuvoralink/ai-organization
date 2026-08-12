# Assurance Pipeline spine — architecture (Phase 0)

Status: Phase 0 (spine + toy pipeline). Plan: `docs/assurance-pipeline-plan.md`.

Phase 0 builds the reusable pipeline spine and proves it with a deterministic 3-stage toy pipeline.
There are no security lenses, no real model calls, and no product repositories in this phase.

## Module map

| File | Role | Reuses |
|---|---|---|
| `lib/stage-runner.mjs` | Chains stages, validates artifacts, checkpoints + resumes | `artifacts.mjs` |
| `lib/run-store.mjs` | Run directory: `run-manifest.json` + per-stage artifacts; resume | `evidence-runtime.mjs` (via `artifacts.mjs`) |
| `lib/backend.mjs` | `Backend` interface + mock backend + Claude/Codex stubs | — |
| `lib/voting-panel.mjs` | N lenses, majority threshold, N=1 deterministic fallback | — |
| `lib/estimate.mjs` | Scope + token/cost preview, zero backend calls | — |
| `lib/redaction.mjs` | Redaction-on-write: PAN (Luhn+IIN), SSN, secret shapes | — |
| `lib/emit-sarif.mjs` | SARIF 2.1.0 emitter, schema-validated | `validate-json-schema.mjs` |
| `lib/emit-report.mjs` | Human Markdown report | — |
| `lib/artifacts.mjs` | Validation + hashing + redacted atomic writes | `evidence-runtime.mjs`, `validate-json-schema.mjs` |
| `lib/paths.mjs` | Resolves vendored schema files | — |
| `pipelines/toy-pipeline.mjs` | produce → verify → emit (proves the spine) | all of the above |
| `cli.mjs` | `assurance estimate\|scan\|report` | all of the above |
| `schemas/sarif-2.1.0.schema.json` | Vendored official SARIF 2.1.0 schema | — |
| `schemas/*.v1.schema.json` | Run-manifest + toy stage artifact schemas | — |

## Reuse, not reinvention (plan §3)

The spine reuses the control plane's existing hardened primitives rather than forking them:

- **Hashing / canonical JSON / atomic writes** come from `core/lifecycle/evidence-runtime.mjs`
  (`sha256`, `canonicalJson`, `digestObject`, `writeJson`), imported through `lib/artifacts.mjs`.
  No local hasher was needed.
- **JSON-schema validation** reuses `core/schema/validate-json-schema.mjs` for both stage artifacts
  and SARIF output — no new JSON-schema dependency.

## Run-state store (decision D1)

Task-assurance (`core/lifecycle/`, `schemas/task-evidence.v3`) is a **closed completion-proof
contract**, not a multi-stage artifact carrier, so the spine keeps its OWN lightweight store:

```
<runRoot>/<runId>/run-manifest.json     schema_version, run_id, pipeline, config_sha256, target_ref,
                                        created_at, updated_at, stages[{name,status,artifact_path,
                                        sha256,bytes,started_at,ended_at}]
<runRoot>/<runId>/stages/<stage>.json   one redacted JSON artifact per stage
<runRoot>/<runId>/emit/...              emitter outputs (SARIF, report)
```

`runRoot` defaults to `<git-common-dir>/assurance-pipeline-runs` (worktree-independent, outside the
tracked tree — the same convention as task-assurance's `auxara-agent-assurance`). **Resume**: a stage
whose record is `completed`, whose artifact file exists, and whose bytes still hash to the recorded
sha256 is reused; the first stage that fails any of those re-executes, and so does every stage after
it. A changed `config_sha256` or stage list invalidates the whole run.

## Backend abstraction (decision D6)

`createBackend({ via })`, `via ∈ {mock, cli, codex-cli}`:

- **mock** — deterministic, offline; used by the toy pipeline and all tests.
- **cli** (Claude) — Phase-1 stub. When wired, it must reuse the **hardened spawn primitives** of
  `skills/bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` — `buildDispatchChildEnvironment`
  (secret-free env allowlist), `terminateProcessTree` + `DEFAULT_MAX_RUNTIME_MS` (bounded child), and
  `buildClaudeArgv` with the `read_only` profile — **not** the PR-bound `dispatchClaude` entrypoint.
- **codex-cli** (Codex) — Phase-1 stub. Codex output is **UNATTESTED** (`core/lifecycle/
  codex-task-status.mjs` is read-only and cannot attest attempts) and must be deterministically
  verified by the spine, never self-attested.
- **sdk / openai** — raw API endpoints, OFF by default; constructing them throws.

## Redaction-on-write

Every disk write goes through `redaction.mjs`. PANs are masked only when Luhn-valid AND matching a
known issuer prefix (so order ids and timestamps are not over-redacted); SSNs and named secret/token
shapes (private keys, AWS/GitHub/Slack tokens, `sk-…`, and `<credential-key> = <value>` forms) are
masked. The in-memory value is never mutated — a stage keeps the real value for downstream logic
within a run while only the persisted copy is masked.

## SARIF 2.1.0 (decision D2)

`emit-sarif.mjs` builds a SARIF 2.1.0 log and validates it against the vendored official schema
(`schemas/sarif-2.1.0.schema.json`) using the control-plane validator. Redaction preserves validity
because it only masks string values.

## Phase-1 seams (documented, not built)

Per the plan, the following are Phase 1+ and are intentionally NOT built here: real static-analysis
lens adapters (Semgrep/CodeQL/osv/gitleaks → normalized findings), execution-proven validation
(mutation kill on a patched tree), remediation, overlay install wiring, and the live Claude/Codex
backend adapters. The stubs and this document mark where they attach.
