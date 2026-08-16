# Assurance Pipeline — Phase 1 (Security Instance on Auxara Dialer) — Implementation Plan

Status: **Proposed** (awaiting founder approval to build). Builds on the Phase-0 spine, **merged to `main` via PR #59** (`cd68760`). Follows `full-slice-planner`. Companion to `docs/assurance-pipeline-plan.md` (design authority; honors decisions D1–D7). Every load-bearing claim traced to source; the F1 contradiction was **orchestrator-verified verbatim** before this plan was accepted.

---

## 0. Verification posture + the one contradiction that reshapes this plan

- **F1 — HARD CONTRADICTION (verified 2026-08-12):** Auxara has **deliberately retired GitHub-hosted CI to avoid paid remote-runner execution**; local `npm run ci` is the merge authority and "PR status checks are not proof." Confirmed verbatim in `overlays/auxara-dialer/project-files/AGENTS.md:57` and `.claude/rules/auxara-dialer-engineering-rules.md:97`. This **overturns** the earlier assumption (CodeQL via free GitHub Actions code-scanning; SARIF → code-scanning). **Resolution:** Phase-1 default is a **repo-local finding store** in the product repo, detection runs **locally** like every other Auxara check, and CodeQL-via-Actions + SARIF-upload become an **explicitly-deferred, founder-gated opt-in** (Q2). This does not weaken caveat (a): Semgrep alone closes it on TS/Node.
- **F2 — CLI gap:** Phase-0 `cli.mjs` ships only `estimate | scan | report`. `remediate`, `validate`, and `--stop-after` do not exist yet — a scoped Phase-1 deliverable, not a contradiction.
- **F3 — `--stop-after` vs the resume/config contract:** `runPipeline`'s `manifestMatchesPlan` invalidates the whole run when the stage-list length/names change. If `scan --stop-after s6` ran a 7-stage list and a later `remediate` ran an 11-stage list, detection checkpoints would be **discarded and re-executed** (re-spending on S1/S4/S5 model stages). Locked fix D-P1-3: the manifest always models the **full canonical stage list**; `--stop-after` passes a `stopAfter` bound that halts *execution* while leaving later stages `pending`. This is a small additive change to `runPipeline`, landing with a biting test.
- **F4 — install-path constraint:** `lib/artifacts.mjs` imports `../../../core/lifecycle/evidence-runtime.mjs`. The Auxara overlay installs `core → .ai-organization/runtime/core`, so the pipeline runtime must land at **`.ai-organization/runtime/skills/assurance-pipeline/`** for that relative import to resolve. Locked D-P1-6.

---

## 1. Summary

**Product intent.** Turn the Phase-0 spine into a working **security-vulnerability-discovery instance** and install it on Auxara as a governed, detection-only recurring check. It shells to Auxara's *native* tools for static evidence (Semgrep first), runs bounded LLM security lenses over the high-risk chunks, votes and tiers every finding, and — when remediation is opted in — proves a fix by execution (mutation-kill) before ever labeling it `validated`. Closes VVAH's three caveats by construction on TS/Node: (a) native taint via Semgrep, (b) execution-proven validation, (c) tiered findings + measured precision.

**True after this lands.** `assurance scan --repo <auxara> --stop-after s6` runs S0→S6 unattended, emits SARIF 2.1.0 + a human report with every finding carrying a verdict + evidence tier, persisted in the **product repo** (never the control-plane repo — D5). Remediation (opt-in) reaches `validated` only via the S8 mutation-kill. One read-only recurring-check automation runs detection on a cadence; nothing auto-merges or auto-deploys.

**Non-goals.** Rebuilding taint (Semgrep/CodeQL own it); CodeQL local install (deferred); GitHub-Actions/code-scanning on Auxara (F1 — deferred, founder-gated); auto-merge/deploy/branch-protection; importing product source/findings into the control-plane repo; the Phase-2 review instance + Phase-3 propagation (shaped only).

---

## 2. Source of truth

| Claim | Authority | Consumers | Must NOT become authority |
|---|---|---|---|
| Finding is real / its tier | **S5** `VerifiedFinding` (verdict + tier) | SARIF, report, PR, finding store | a raw Semgrep hit; an S4 claim pre-S5; a Codex self-report |
| Fix is validated | **S8** `ValidationVerdict` w/ mutation-kill proof | PR label, report | S7 "looks fixed"; an S5 opinion; a read-only lens pass |
| What may happen to a fix | `action-authority.v1.json` via `assess-action.mjs` | S10 | any stage auto-merging/deploying |
| Stage artifacts + resume | the spine **run-store** (D1) | stage-runner, report/validate/remediate | task-evidence.v3 (closed schema — D1) |
| Fix completion attestation | **task-assurance** (governs S7/S10) | S7, S10 | the run-store (detection only) |
| The raw static hit | the tool's own SARIF (Semgrep `--sarif`) | S2 normalizer | a hand-kept rule list; an LLM's memory of tool output |
| Precision (confirmed vs FP) | per-run metrics vs the golden fixture | report trend | a self-reported "high accuracy" |
| Finding persistence home | **repo-local store** in the product repo (Q2-A) | re-runs, report | the control-plane repo (D5); code-scanning until F1/GHAS resolved |

---

## 3. Scope & blast radius

**New owned files** (extend `skills/assurance-pipeline/`, do NOT fork the spine):
- `lib/adapters/static/` — `registry.mjs` (stack-parametric adapter registry), `semgrep.mjs` (1a), `osv-scanner.mjs` + `gitleaks.mjs` (1a.2), `normalize.mjs` (tool SARIF/JSON → `StaticFinding[]`).
- `lib/stages/` — `s1-threat-map`, `s2-static-evidence`, `s3-prefilter`, `s4-deep-dive`, `s5-verify-panel`, `s6-dedup-chain-rank`, `s7-remediate`, `s8-validate`, `s9-emit`, `s10-land`.
- `lib/backends/` — `claude-cli.mjs` (real adapter over `dispatch-claude-cli.mjs` primitives), `codex-cli.mjs` (real adapter over `run-bounded-agent.mjs`/`boundedProcess`, grounding-verified).
- `lib/lenses/` — roster binding `security-auditor` + `security-review-hardening`; `lib/validation/execution-proof.mjs` (S8, composes `golden-mutation-trust-harness`).
- `pipelines/security-pipeline.mjs`; new `schemas/` (`threat-map`, `static-finding`, `candidate`, `verified-finding`, `ranked-finding`, `validation-verdict`, `assurance-config`).
- `cli.mjs` extension: `remediate`, `validate`, `--stop-after`, `--repo`. Tests + a golden fixture repo.
- Overlay: a mapping in `overlays/auxara-dialer/manifest.json` installing the runtime to `.ai-organization/runtime/skills/assurance-pipeline/` (F4); an `auxara-assurance-detection` entry in `overlays/auxara-dialer/automations/project-automations.v1.json`; an `assurance.config.json`.

**One edit to a protected spine file:** add an optional `stopAfter` bound to `runPipeline` (F3) — additive, lands with a biting test.

**Reused / PROTECTED (do NOT fork — parity gates enforce):** the whole Phase-0 spine; `dispatch-claude-cli.mjs` **hardened primitives only** (`buildDispatchChildEnvironment`, `terminateProcessTree`, `DEFAULT_MAX_RUNTIME_MS`, the `read_only` argv builder with tools `["Read","Glob","Grep","WebFetch","WebSearch"]` + `mode:"dontAsk"`, `resolveClaudeExecutable`, `auditObservedTools`) — **never** the PR-bound `dispatchClaude`/`materializePullRequestDiff` entrypoint; `core/lifecycle/evidence-runtime.mjs`, `core/schema/validate-json-schema.mjs`, `core/lifecycle/codex-task-status.mjs` (read-only — the reason Codex is unattested), `core/authority/assess-action.mjs`; `run-bounded-agent.mjs`/`boundedProcess` (`runBounded`, exit 124, tree-kill); `security-auditor.md`, `security-review-hardening/`, `golden-mutation-trust-harness/` (composed, never edited).

**Registration surfaces (Gate 4):** the skill is already registered (PR #59); Phase 1 **extends** it — new files land in `control-plane.manifest.json` scope + `registries/tracked-scope.v1.json` (via `control:scope:refresh`) + `registries/artifacts.v1.json`, enforced by `control:scope:check` / `control:validate`.

**Governance/security/privacy:** high-sensitivity — reads Auxara product source (regulated prospect PII per `auxara-dialer-security-rules.md`) and runs tools/models over it. Egress controls (§5): Semgrep `--metrics=off`, never `--config auto` (both phone home); default backend is the local Claude CLI (D6). Operates **inside the product repo**; never imports product source/secrets/findings into the control-plane repo (D5).

**Out of scope:** taint re-impl; CodeQL local install; GitHub-Actions/code-scanning on Auxara (F1); auto-merge/deploy; branch-protection; Phase 2/3.

**Rollback:** additive skill + one `runPipeline` param + one overlay mapping + one automation row. Uninstall = remove the mapping + row. Writes only to an out-of-tree run-store, an isolated worktree, and PR/report artifacts.

---

## 4. Backbone decisions

### 4.1 Real LLM backends (replace the Phase-0 stubs)
- **Claude (`via: cli`, DEFAULT):** `dispatch-claude-cli.mjs` hardened primitives, `read_only` profile (`--print --output-format stream-json --safe-mode --strict-mcp-config`), env-allowlisted spawn, bounded by `DEFAULT_MAX_RUNTIME_MS`, tree-killed; tool-use audited via `auditObservedTools` (observed ⊆ read-only set).
- **Codex (`via: codex-cli`, opt-in diversity lens):** `runBounded` (own deadline, tree-kill, exit 124, secret redaction). **UNATTESTED** (`codex-task-status.mjs` is read-only, "cannot create or attest attempts").
- **`via: sdk`/`via: openai`:** OFF by default (constructing them throws) — ship OFF (D6); reversal = founder per-stage opt-in.
- **"Deterministically verified, never self-attested" (D6, concretized as D-P1-4):** a backend output reaches a finding only if it (1) schema-validates against the stage `outputSchema` (runner already enforces via `validateArtifact`), AND (2) passes a **grounding check** — every claimed `file:line` resolves to a real path+line in the scanned tree, and an S4/S5 finding's evidence corroborates a persisted S2 hit or a re-derivable code fact. Identical for both backends; the difference D6 names is that Claude *also* carries tool-use audit evidence while Codex has none — so for Codex the grounding check is the **only** trust source and is non-optional.

### 4.2 Finding persistence home (Q2 → resolved)
- **A. Repo-local store** in the product repo's git-common-dir (reuse `run-store` convention) — honors D5, no CI/licensing dependency, runs locally like every Auxara check. **CHOSEN (Phase 1).**
- **B. GitHub code-scanning (SARIF upload)** — free triage UI/dedup/PR annotations, but **blocked on F1** (Auxara retired paid GitHub Actions) + GHAS licensing (unconfirmable read-only). **Deferred, founder-gated.** Additive later (the SARIF emitter output is exactly what code-scanning ingests).
- **C. Control-plane repo store** — violates D5. Rejected.

---

## 5. Governance mapping (stage action → action-authority tier)

| Action | Tier |
|---|---|
| S0–S6 read source, run read-only tools (Semgrep `--metrics=off`), analyze, vote, rank | **autonomous** |
| S7 write patch + regression test in an isolated worktree, commit, open/update PR | **autonomous** |
| S8 run Auxara's real gates + mutation-kill (read-only w.r.t. tracked tree) | **autonomous** |
| Push the fix branch | **conditional** — only on live proof of no preview/prod deploy, publish, billed build, or external contact (a preview counts as a deploy; uncertainty stops for a human) |
| Merge the fix PR | **human_required** (security-touching) |
| Any deploy / prod write / external contact / SARIF upload to a hosted service | **human_required** |

Egress note (D6): each stage states its backend; default is the local Claude CLI. Semgrep runs fully local, telemetry off.

---

## 6. Domain matrices

### 6.1 Finding state & evidence
| State | Meaning | Set by | Evidence | Terminal? |
|---|---|---|---|---|
| `candidate` | surfaced, unverified | S2/S4 | a Semgrep hit or an LLM claim | no |
| `confirmed` | real, exploitable | S5 (+S8 if fix exists) | executable proof **or** ≥threshold votes, tier ≥ WIRING-FACT | no |
| `false_positive` | refuted | S5 | ≥threshold refuting votes | yes |
| `remediated_unvalidated` | fix written, unproven | S7 | patch + regression test | no |
| `validated` | fix proven by execution | S8 | regression test **passes on patched AND fails on unpatched** (mutation-kill) + Auxara gates green | yes |
| `needs_review` | pipeline can't honestly decide | any | stated reason (incl. panel tie) | yes (human) |

Every finding tiered: `PRODUCT-VERIFIED` (executable proof) / `WIRING-FACT` (grounded structural fact) / `RELAYED` (unverified relay). **Durable rule:** a `candidate` never enters SARIF as `confirmed`; a fix never reaches `validated` without the unpatched-fails mutation-kill (D3). Historical evidence is append-only.

### 6.2 Producer / reconciliation (findings across re-runs)
Re-run reproduces → update row, keep history. No longer reproduces → `resolved_by_absence` (not deleted). Fixed+validated → stays terminal. Source file deleted → `superseded`. Config/ruleset/version change → recorded in the run manifest; S2 re-derives, cascading S3+ (dependency-correct resume). Persistence = repo-local store. Because D7 redacts every persisted artifact, a reproduced secret-class finding's evidence is masked identically across runs (byte-stable resume).

---

## 7. Interfaces

**CLI (extends `estimate|scan|report`):** `scan --repo <p> [--stop-after <s>] [--via cli|codex-cli] [--config <f>]` (overlay default `--stop-after s6`); `remediate --repo <p> --finding <id>` (new, S7 isolated worktree); `validate --repo <p> [--finding <id>]` (new, S8); `report --repo <p> --run-id <id>` (re-emit, no re-spend). `--stop-after` → the `runPipeline` `stopAfter` bound (D-P1-3): full stage list always modeled; execution halts after the named stage; later stages stay `pending` for a resumed `remediate`/`validate`.

**`assurance.config.json`** (per overlay): `pipeline: "security"`, `stack: ["ts","node"]`, per-adapter enable + rulesets (`semgrep.rulesets: ["p/typescript","p/nodejsscan","p/owasp-top-ten"]`, `codeql.enabled:false reason:"F1/GHAS-deferred"`), lens roster, `runs`/`vote_threshold`/`temperature` per stage, `backend` per stage, `persistence:"repo-local"`, `budget_ceiling_usd`, `stop_after:"s6"`. Hashed into `config_sha256`.

**`StaticFinding` (S2 output):** superset of what the emitters consume — `{ id, tool, ruleId, ruleName, ruleDescription?, level, message, uri, startLine, startColumn?, endLine?, snippet?, dataflow?[], confidence?, cwe?[], fingerprint }`. `fingerprint` (stable dedup key from tool+ruleId+uri+region) survives redaction and drives §6.2. **Redaction-invariant (D7):** `snippet` is masked on write; lenses/dedup key on `ruleId/uri/region/dataflow/severity/fingerprint`, never raw snippet bytes.

**SARIF 2.1.0:** reuse `emit-sarif.mjs` unchanged (redaction preserves validity — it masks only string values). Tool-native SARIF is normalized **in** to `StaticFinding[]`; the pipeline's findings emit **out** as one SARIF log — one emitter, never two producers.

**Semgrep adapter contract (from `references/semgrep.md`):** invoke the `semgrep` CLI directly (unattended) — **not** the interactive skill's Task-spawning/human-approval workflow (a human-driven audit flow that can't run headless; the pipeline's "approval" is the founder opting the overlay in + the config-locked ruleset). Command shape `semgrep --config <ruleset> --sarif --output <run>/raw/<ruleset>.sarif --metrics=off <target>`. **`--metrics=off` mandatory** (telemetry egress during a security audit); **never `--config auto`** (phones home); explicit rulesets only. **OSS engine only (founder has no Semgrep Pro license, 2026-08-12): never invoke `--pro`.** Semgrep OSS does not track cross-file dataflow; that cross-file + semantic reasoning is deliberately the job of the S4/S5 **LLM lenses** (which read across files) + **osv-scanner** (deps) + **gitleaks** (secrets), not Semgrep. The adapter records `engine: "oss"` into finding provenance so precision numbers are honest about depth. **Execution is portable (D-P1-7): the adapter runs Semgrep via Docker (`docker run --rm -v <repo>:/src semgrep/semgrep semgrep <argv over /src>`) when no native `semgrep` binary is on PATH — cross-platform (Windows+Docker, Linux CI). `buildSemgrepArgv` is identical for both paths; only the execution wrapper differs.** Retain each valid per-scan SARIF; normalize each (no assumed bundled merge tool).

---

## 8. Tests & proof ladder

**Oracle (primary truth):** a hand-labeled **golden fixture repo** (`tests/fixtures/golden-ts-repo/`) with planted TS/Node vulns (SQLi via string-concat query, missing tenant predicate, hardcoded secret, SSRF via unvalidated URL, an object-scope authz bypass) **and** known-clean lookalikes (a parameterized query that *looks* concatenated, a tenant-scoped query, an env-loaded credential). LLM-judge secondary; current output = regression baseline, not truth.

| # | Test | Proves | Killer mutation (→ red) |
|---|---|---|---|
| 1 | S2 Semgrep adapter contract | caveat (a) on TS; malformed envelopes rejected | truncated / `version:9.9.9` SARIF → must reject; drop `--metrics=off` → egress-guard test red |
| 2 | S2 registry stack-parametric | not Auxara-hardcoded | register python→bandit stub; same normalizer runs → hardcoded paths make it red |
| 3 | S3 prefilter | low-signal gated, real kept | drop a real planted finding → liveness assert fails |
| 4 | S5 voting + N=1 fallback | threshold + deterministic fallback | `runs:1` w/o fallback → throws (no vote-of-one) |
| 5 | **S8 validation-bite (critical)** | `validated` requires unpatched-fails (D3) | S8 skips the unpatched-fails check → a vacuous test passing on BOTH trees must be **refused** `validated` |
| 6 | Golden end-to-end | planted vulns `confirmed` w/ SARIF+tiers; clean lookalikes NOT; precision/recall printed | remove a planted vuln's detection → recall fails; loosen a lens → clean lookalike false-`confirmed` → precision fails; Python-only-taint case on TS repo → Semgrep still finds it (caveat a) |
| 7 | Backend adapter contract | Claude tool-audit + Codex grounding-verify | point Claude adapter at PR-bound `dispatchClaude` → boundary assertion red; Codex output citing nonexistent `file:line` → grounding check discards it (D6) |
| 8 | Redaction-on-write | planted secret masked in SARIF+report+every artifact | disable redaction → secret appears |
| 9 | Governance | S10 can't autonomously merge a security PR | S10 calls merge → `assess-action` returns human_required |
| 10 | `--stop-after` resume (F3) | detection checkpoints survive a later `remediate` | `scan --stop-after s6` then `validate` → S0–S6 skipped, not re-run; mutation: truncate the stage list instead of `stopAfter` → S1/S4/S5 re-execute, "no re-spend" assert fails |

Commands: `npm test` + a new `assurance:golden` fixture run. Every negative assertion paired with a positive liveness assertion; each test file carries a `Proves:` header naming the caveat/decision + the reddening mutation.

---

## 9. Phased sub-slices (dependency-ordered)

Before building S2: read the full Semgrep SARIF/CLI output on the golden fixture (done at the ref level in this plan) — no building against assumed tool output.

- **1a — Semgrep S2 adapter + stack-parametric registry.** Registry, `semgrep.mjs`, `StaticFinding.v1` + normalizer, S2 stage; S0→S2→S3 minimal detection emitting SARIF via the existing emitter. **DoD:** planted TS vulns → normalized `StaticFinding[]`; malformed SARIF rejected; `--metrics=off` enforced; registry parametric (ranks 1–3). **Closes caveat (a).**
- **1b — Real backends + S1/S4/S5 lenses.** Claude adapter (hardened primitives, read_only) + Codex adapter (bounded-runner, grounding-verified); replace stubs. Compose `security-auditor` + `security-review-hardening` as the S4 deep-dive over S1 high-risk chunks reading S2 evidence; S5 verify panel (N lenses, threshold, N=1 fallback) tiering every finding. **DoD:** S4/S5 run a real read-only Claude call; tool-audit passes; an ungrounded Codex output is discarded (ranks 4, 7).
- **1c — S6 dedup/chain/rank + S7 remediate + S8 execution-proven validation.** S6 semantic dedup on `fingerprint` + exploit-chain + rank. S7 (opt-in) writes patch + regression test in an isolated worktree under task-assurance. S8 composes `golden-mutation-trust-harness`: run Auxara's real gates + mutation-kill; `validated` requires the regression test to FAIL on unpatched AND pass on patched (D3). **DoD:** a remediation reaches `validated` only via the mutation-kill; a vacuous test is refused (rank 5). **Closes caveat (b).**
- **1d — S9 emit + S10 land + overlay wiring.** S9 SARIF+report (reuse emitters) with an honesty clause naming the active persistence home + unreached surfaces. S10 land terminal under `assess-action`. Overlay: `manifest.json` mapping → `.ai-organization/runtime/skills/assurance-pipeline/` (F4); a read-only `auxara-assurance-detection` automation (rrule cadence, `targetRoot ${PROJECT:auxara-dialer}`, prompt = run `assurance scan --stop-after s6` + report) modeled on the existing daily/weekly read-only entries; ship `assurance.config.json`. **DoD:** the recurring detection check runs locally on the golden fixture and on Auxara, emits SARIF+report+precision to the repo-local store, edits/merges nothing (ranks 6, 9, 10). Remediation stays opt-in.

Registry/manifest updates + the `runPipeline` `stopAfter` change land with the sub-slice that first needs them; docs reconcile in the same PRs.

---

## 10. Locked decisions & open questions

**Inherited & honored:** D1 (own run-store; task-assurance governs only S7/S10), D2 (SARIF 2.1.0), **D3 (`validated` REQUIRES an execution mutation-kill — non-negotiable)**, D4 (VVAH = optional S2 adapter only), **D5 (findings in the product repo, never the control-plane repo)**, **D6 (local CLI default; Codex deterministically verified, never self-attested; raw API off)**, **D7 (inter-stage artifacts pre-redacted; lenses redaction-invariant)**.

**New Phase-1 (recommended defaults, reversible):**
- **D-P1-1** Semgrep first, CLI-direct, **OSS engine only (never `--pro` — no Pro license)**, `--metrics=off`, explicit rulesets, never `--config auto`, never the interactive human-approval workflow. Cross-file dataflow is covered by the LLM lenses + osv/gitleaks, not Semgrep OSS.
- **D-P1-2** Finding home = repo-local store (Q2-A). Reverse → code-scanning once F1 + GHAS resolved.
- **D-P1-3** `--stop-after` = a `stopAfter` bound on `runPipeline`; the full stage list is always modeled (F3). *(Phase 1a does NOT ship `--stop-after` — it always runs S0→S2→S3, so it never truncates the stage list; the bound lands with the first phase where partial runs are useful. Adversarial-review finding, resolved 2026-08-12.)*
- **D-P1-4** Codex verification = schema-validate + grounding-check; non-optional (no tool-audit backstop).
- **D-P1-5** Detection recurring check runs LOCALLY (mirrors Auxara's retired-hosted-CI posture, F1), read-only, `--stop-after s6`; remediation opt-in.
- **D-P1-6** Install path `.ai-organization/runtime/skills/assurance-pipeline/` (F4).
- **D-P1-7 — Semgrep execution is portable + provisioned by initialization (founder-directed 2026-08-12).** The adapter runs Semgrep **via Docker** (`semgrep/semgrep` image) when no native binary is on PATH (native preferred if present), so it's cross-platform (Windows-with-Docker, Linux CI) — the founder's machine has Docker but no native/Windows Semgrep. **The Docker-image provisioning + a `doctor`/setup check are part of machine initialization** (`docs/new-machine-bootstrap.md` + the pipeline's setup/SKILL), so a new machine that runs scans provisions Semgrep-via-Docker automatically — never a manual per-machine step. The golden end-to-end test runs live wherever Semgrep-or-Docker is available and skips cleanly otherwise (gated-lane pattern).

**Open questions — RESOLVED (founder, 2026-08-12):**
- **Q2 → defer GitHub code-scanning; keep GitHub-hosted CI retired for now.** Repo-local store is the Phase-1 finding home (D-P1-2, firmed). Revisit only if the founder later reverses the retired-paid-CI decision AND confirms GHAS licensing; the SARIF-upload adapter is additive when that happens.
- **Q-P1-a → no Semgrep Pro license → OSS engine only.** Cross-file dataflow is not a Semgrep responsibility in Phase 1; the S4/S5 LLM lenses (cross-file reasoners) + osv-scanner + gitleaks cover what OSS Semgrep can't. D-P1-1 updated: never `--pro`.

---

## 11. Pressure-test self-audit

1. **Easiest wrong build:** label a finding `confirmed` on an S4/S5 LLM opinion with no executable proof, and a fix `validated` because a lens *read* it — silently rebuilding VVAH's caveats. Runners-up: forking the spine/`dispatch-claude-cli.mjs` (parallel system); an S2 adapter hardcoded to Auxara paths, or one dropping `--metrics=off`/using `--config auto` (silent source egress during a "security" scan).
2. **Sentence that would allow it:** softening S8's unpatched-fails mutation-kill into "the panel agreed"; treating the interactive Semgrep workflow as the adapter; trusting Codex on self-report.
3. **What closes it:** D3 (locked) + §6.1 + ranks 5 & 6 fail red if S8 is reduced to reading; D6 + D-P1-4 + rank 7 discard an ungrounded Codex claim; ranks 1–2 redden a non-parametric or telemetry-leaking adapter; §3 "PROTECTED — do NOT fork" + parity gates catch a forked spine; rank 10 catches the `--stop-after` re-spend regression.
4. **Final-output proof:** the golden fixture run (rank 6) — a loosened lens turns a clean lookalike into a false `confirmed` (precision assert fails); a vacuous regression test never reaches `validated`; a Python-only-taint case on the TS repo still yields Semgrep findings (caveat a closed by the native tool, not the LLM).

---

## Critical files for implementation
- `skills/assurance-pipeline/lib/stage-runner.mjs` (add the `stopAfter` bound; resume/config contract lives here)
- `skills/assurance-pipeline/lib/backend.mjs` (replace the `cli`/`codex-cli` stubs with the real adapters per their documented wiring notes)
- `skills/bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` (reuse read_only argv + env/termination primitives; NOT `dispatchClaude`)
- `skills/security-review-hardening/references/semgrep.md` (S2 CLI + SARIF + `--metrics=off` contract)
- `global/claude/agents/security-auditor.md` (S4/S5 lens rubric, tiers, FIX-PROVEN/PLAUSIBLE)
- `overlays/auxara-dialer/manifest.json` + `overlays/auxara-dialer/automations/project-automations.v1.json` (install mapping + read-only recurring detection check)
- `overlays/auxara-dialer/project-files/AGENTS.md` §Execution + `.claude/rules/auxara-dialer-engineering-rules.md` §8 (F1 — the retired-paid-CI merge-authority constraint)
```
