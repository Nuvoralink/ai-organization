# Assurance Pipeline — implementation plan

Status: **Proposed** (awaiting founder approval to build; direction founder-endorsed 2026-08-11)
Author: orchestrator session, 2026-08-11
Origin: comparative study of Visa Vulnerability Agentic Harness (VVAH, `github.com/visa/visa-vulnerability-agentic-harness`, Apache-2.0) against this control plane.
Supersedes: nothing (net-new capability; grep confirms no existing pipeline/orchestration primitive).

> Verification posture for this doc: the load-bearing repo facts below were read from source
> (`dispatch-claude-cli.mjs`, `security-auditor.md`, `security-review-hardening/SKILL.md`,
> `docs/architecture.md`, `policies/action-authority.v1.json`, `package.json`,
> `control-plane.manifest.json`). Facts marked **(VERIFY)** were inferred from architecture.md /
> naming and the implementer must confirm against the actual module/schema before building on them.

---

## 1. Summary

### Product intent (plain language)
Give the control plane a **native, installable, governed capability** that **discovers, verifies,
remediates, and execution-proves security vulnerabilities** across the product repositories it already
governs (Auxara, CoachAI, Nuvora Link, …) — and, reusing the same spine, runs the same
staged review→verify loop for general **code-review/quality**. It borrows VVAH's proven *blueprint*
(threat-model-first, deterministic gates around LLM judgment, adversarial voting, structured
artifacts) but **instantiates it on this control plane's own hardened primitives** and on **each
repo's native toolchain**, so VVAH's three honest caveats are closed *by construction*.

### What is true after this lands
- An overlay-installed `assurance` capability runs a staged pipeline in a product repo's CI / on a
  cadence, emitting a machine-readable **SARIF 2.1.0** artifact (GitHub code-scanning ingestible) plus
  a human report, with every finding carrying an **evidence tier** and every proposed fix carrying a
  **FIX-PROVEN / FIX-PLAUSIBLE** label.
- A remediation, when produced, is **validated by execution** — the repo's real gates run on the
  patched tree in an isolated worktree, and a **mutation kill** proves the regression test bites —
  before the fix is labeled `validated`. Nothing auto-merges; findings and fixes land as PRs / backlog
  rows under `policies/action-authority.v1.json`.
- The same spine, configured with review lenses instead of security lenses, replaces ad-hoc
  code-review with a repeatable, resumable, cost-estimated run.

### Non-goals (explicit)
- **Not** adopting VVAH as a bolted-on tool (parallel system; caveats remain; foreign stack).
- **Not** rebuilding taint/dataflow analysis — that is Semgrep/CodeQL's job; we orchestrate them (reuse before create).
- **Not** a hosted platform or a service; it is an installed control-plane asset like the existing gates.
- **Not** auto-merging or auto-deploying fixes; **not** changing branch protection (explicitly deferred).
- **Not** loosening any existing action-authority tier.

---

## 2. The core ask — how each VVAH caveat is closed by construction

The founder's question was "upgrade so the honest caveats aren't a problem." Each caveat is a verdict on
VVAH's *instantiation*, not its pattern; the mechanism that closes it and the stage that owns it:

| VVAH caveat | Why it exists in VVAH | Closing mechanism here | Owning stage |
|---|---|---|---|
| **(a) Typed taint = Python/Java/C# only** → shallow on TS/Node | VVAH ships its own tree-sitter taint engine for 3 langs | The **static-evidence stage is a pluggable per-stack adapter** that shells to the repo's *native* mature tools (Semgrep taint mode, CodeQL JS/TS dataflow, `osv-scanner`/`npm audit`, `gitleaks`) which emit SARIF directly | **S2 Static Evidence** |
| **(b) Doesn't compile/build/run tests against the patched tree** | VVAH's S11 panel only *reads* the fix | The **validation stage runs the repo's real gates + a mutation kill** on the patched tree in an isolated worktree; `validated` requires the regression test to pass on the fix AND fail on the unpatched code (composes `golden-mutation-trust-harness` + task-assurance mutation receipts) | **S8 Execution-Proven Validation** |
| **(c) Non-deterministic; findings are unproven candidates; no precision/recall** | VVAH trusts its own voting + prefilter | **Tier every finding** (PRODUCT-VERIFIED / WIRING-FACT / RELAYED per loop-discipline), deterministic prefilter + N-way adversarial voting as backstops, and a finding only reaches `confirmed` with an **executable proof (failing test / PoC)** — else it is an explicit `candidate` for human triage. Confirmed-vs-false-positive rate is **measured per run**, producing the precision numbers VVAH lacks | **S3 Prefilter, S5 Verify Panel, S8 Validation** |

Closing (a) and (b) is where **your methodology is strictly stronger than VVAH's** — VVAH cannot run
your mutation-proven validation, and its taint engine can't touch your stack. This plan makes that
strength the default.

---

## 3. Reuse inventory (Gate 6 — no parallel system; Gate 5 — replace, don't layer)

This capability is **~80% composition**. What already exists, its role, and the *only* new work:

| Existing primitive (verified) | Role in the Assurance Pipeline | New work needed |
|---|---|---|
| `skills/bootstrap-orchestrator/scripts/dispatch-claude-cli.mjs` — hardened 2-profile (`read_only`, `bounded_implementation`) headless Claude-CLI backend, env-allowlisted, injection-resistant hashed stdin, worktree-boundary attribution | **LLM backend** for every model stage (VVAH's `via: cli`) | Add a thin call-site; no change to the dispatcher |
| Task-assurance runtime — `core/lifecycle/task-governor.mjs`, `schemas/task-assurance.v2`, `schemas/task-evidence.v3`; immutable attempts, artifact digests, structural mutation receipts, replay-safe completion **(VERIFY exact fields)** | **Inter-stage evidence + checkpoint/resume** (VVAH's pydantic contracts + SQLite) | Define per-stage artifact schemas that ride this contract |
| `policies/action-authority.v1.json` + `core/authority/assess-action.mjs` | **Governance** of remediate/PR/merge (VVAH has none) | Map each stage action to a tier (§8) |
| `global/claude/agents/security-auditor.md` — computed verdict rubric, CONFIRMED/CORRECTED, FIX-PROVEN/PLAUSIBLE, Learned-classes log | **A verify-panel lens** (VVAH's S6/S11 panel role) | Invoke as a panel member; no change to the agent |
| `global/claude/agents/adversarial-reviewer.md` | **A verify-panel lens** (refute-the-finding) | Invoke as a panel member |
| `skills/security-review-hardening/` — ships `references/semgrep.md`, `references/codeql.md`, `references/variant-analysis.md`, `references/ai-security.md`, `WORKFLOW_STEPS.md`, `EXAMPLE_REPORT.md` | **Static-tool knowledge + deep-dive lens taxonomy** (VVAH's S4 lenses) | Reference from the deep-dive stage; add the tool *adapters* (not the knowledge) |
| `skills/golden-mutation-trust-harness/` | **Execution-proven validation** (closes caveat b) | Invoke in S8; no change to the skill |
| `skills/testing-strategy-and-tdd/`, `skills/spider-debugging-methodology/` | Lenses / regression-test authoring in S7 | Reference |
| The gate pattern (`scripts/*.mjs`, `check-*.mjs.template`), `scripts/control-plane.mjs`, `scripts/project-overlay.mjs` | **Install + CI wiring** (overlay installs the pipeline like a gate) | Overlay mapping + a recurring-check entry |
| `Workflow` harness tool | **Optional interactive authoring front-end** that emits the same stage contracts | Optional; not required for the installed runtime |

**New code is confined to:** (1) a thin **stage-runner spine**; (2) the **static-evidence adapters**
(Semgrep/CodeQL/osv/gitleaks → normalized findings); (3) the **SARIF + report emitters**; (4) a
**voting-panel helper** (N lenses, threshold, deterministic fallback); (5) the **estimate** pre-flight;
(6) the **artifact-redaction-on-write** pass. Everything else is composition.

**VVAH's residual role:** demoted from "the system" to an **optional evidence adapter** in S2 for repos
where its typed taint applies (your Python services), feeding SARIF like any other tool. No dependency;
no parallel system.

---

## 4. Backbone Decision Matrix (the runtime spine)

**Promise:** the pipeline must run **unattended in a product repo's CI / on a cadence** (like the
existing daily/weekly overlay checks and the biweekly backflow monitor), be **resumable**, and gate
state-changing steps through action-authority.

| Candidate | Authority / fit | Failure modes | Verdict |
|---|---|---|---|
| **A. Repo-resident Node stage-runner** reusing `dispatch-claude-cli.mjs` (LLM) + task-assurance (evidence) + assess-action (gating) | Matches the control-plane install/CI model exactly; reuses hardened backends; installable per overlay | Must author the thin spine + schemas | **CHOSEN** |
| B. `Workflow` harness tool as the runtime | Great for *my* interactive authoring | **Cannot run in the product repo's CI unattended** — it only runs inside an interactive orchestrator session | Rejected as the *installed* runtime; **kept as optional authoring front-end** |
| C. Adopt VVAH (Python) | — | Parallel system; wrong stack; caveats remain; ungoverned | Rejected (see §3 residual role) |

**Chosen backbone (Q3-verified 2026-08-11):** a **repo-resident Node stage-runner** with its **own
lightweight resumable run-state store** for detection-stage artifacts + checkpoints (following the
`core/lifecycle/evidence-runtime.mjs` artifacts + hashing convention). LLM stages route to **two
differently-shaped CLI backends** — Claude via the hardened `dispatch-claude-cli.mjs` primitives, Codex
via `run-bounded-agent.mjs`/`boundedProcess` (Codex output verified deterministically, never
self-attested, because `codex-task-status.mjs` is read-only). **task-assurance + `assess-action` govern
only the state-changing stages** (S7 remediate, S10 land). `Workflow` stays an *optional* interactive
front-end. **Q3 finding:** `task-evidence.v3` is closed/purpose-built for completion proof, so it is NOT
the detection-stage artifact carrier — that was the D1 reversal trigger, resolved by the store split
above rather than by distorting the schema.

---

## 5. The stage contract (the pipeline)

Typed artifact flows stage→stage on the task-assurance evidence contract. `[det]` = deterministic,
`[llm]` = model stage via the dispatcher. Lesson tags map to the founder's 5 liked points.

| Stage | Kind | Produces (typed artifact) | Reuses | Lesson / caveat |
|---|---|---|---|---|
| **S0 Estimate** | `[det]` | `ScopeEstimate` (files, tool inventory, token/cost preview — **no spend**) | — | Lesson 4 |
| **S1 Scope & Threat-map** | `[llm]` | `ThreatMap` (assets, trust boundaries, ranked high-risk chunks) — **bounds** S4 | never-reactive map-first | Lesson 1 |
| **S2 Static Evidence** | `[det]` | `StaticFindings[]` (normalized from Semgrep/CodeQL/osv/gitleaks SARIF) | per-stack adapters | **caveat (a)** |
| **S3 Prefilter** | `[det]` | filtered `Candidate[]` (confidence/evidence gates) | — | caveat (c) |
| **S4 Deep-dive by lens** | `[llm]` | `Candidate[]` (authz/tenancy, injection, secrets, SSRF, logic — the bugs static tools miss), bounded to S1's high-risk chunks and reading S2 evidence | `security-review-hardening` lenses, `security-auditor` design-in contract | Lesson 1 |
| **S5 Verify Panel** | `[llm]` | `VerifiedFinding[]` — N diverse lenses vote (correctness / exploitability / reproduces), majority threshold, **det-prefilter fallback at N=1**; each finding **tiered** | `security-auditor`, `adversarial-reviewer` | Lesson 2 / caveat (c) |
| **S6 Dedup + chain + rank** | `[det]`+`[llm]` | `RankedFinding[]` (semantic dedup, exploit-chain synthesis, severity rank) | — | — |
| **S7 Remediate** *(optional, gated)* | `[llm]` | `Patch` + regression test, in an **isolated worktree** | `testing-strategy-and-tdd` | — |
| **S8 Execution-Proven Validation** | `[det]` | `ValidationVerdict` (`validated`/`failed`/`needs_review`) — **runs real gates + mutation kill** | `golden-mutation-trust-harness`, task-assurance mutation receipts | **caveat (b)** |
| **S9 Emit** | `[det]` | **SARIF 2.1.0** + human report, **redacted on write** | — | Lessons 3 + 5 |
| **S10 Land terminal** | `[det]` | PR (ready-for-human) / backlog row / escalation — **nothing auto-merges** | `assess-action` | governance |

---

## 6. Source of truth

| Claim | Authority (owns it) | Surfaces that must consume it | Must NOT become authority |
|---|---|---|---|
| "This finding is real / its tier" | the `VerifiedFinding` record (S5) with its evidence tier | SARIF, report, PR body | a raw S2 static hit; an S4 LLM claim before S5; a summariser's "clean" |
| "This fix is validated" | the `ValidationVerdict` (S8) with executable proof | PR label, report | an S7 LLM "looks fixed"; an S5 panel opinion; VVAH-style read-only panel |
| "What may happen to a fix" (branch/PR/merge/deploy) | `policies/action-authority.v1.json` via `assess-action.mjs` | S10 | any stage deciding autonomously to merge/deploy |
| Attempt state / evidence / resume point | task-assurance runtime | the stage-runner | an ad-hoc second checkpoint store |
| Precision (confirmed vs false-positive rate) | per-run metrics derived from S5 tiers + S8 verdicts | report trend | a self-reported "high accuracy" claim |

---

## 7. Scope & blast radius

**New owned files (Phase 0/1):**
- `skills/assurance-pipeline/` — SKILL.md, the stage-runner spine, stage schemas, voting-panel helper, estimate, redaction pass, SARIF+report emitters, static-evidence adapters, tests, references.
- Overlay wiring: an `assurance` mapping + config in each target overlay + a recurring-check entry (Phase 1 wires **one** proving-ground overlay).

**Reused / protected (do NOT fork):** `dispatch-claude-cli.mjs`, task-assurance schemas + `core/lifecycle/`, `core/authority/`, `security-auditor.md`, `security-review-hardening/`, `golden-mutation-trust-harness/`. Changes to these, if any, land in *their* canonical source with parity — never a pipeline-local copy.

**Registration surfaces (Gate 4 — adding a skill touches all of these):** `control-plane.manifest.json` (new `skill-assurance-pipeline` mapping), `registries/tracked-scope.v1.json` (via `npm run control:scope:refresh`), `registries/artifacts.v1.json`, `registries/skill-lock.provenance.json` **(VERIFY exact rows)** — enforced by `npm run control:scope:check`, `control:validate`, and `verify-control-plane-asset-provenance.mjs`. The gates are the verification; the plan does not hand-enumerate rows it can prove mechanically.

**Governance / security impact:** high-sensitivity — the pipeline *reads product source and runs tools/models against it*. Data-egress and authorized-use constraints apply (§8). It must obey the ownership boundary: it operates **inside a product repo's own CI**, and it must **never** import product source, secrets, or findings *into this control-plane repo* (findings live in the product repo / its GitHub code-scanning, not here).

**Out of scope:** rebuilding taint; a hosted UI; auto-merge/deploy; branch-protection changes; Phase 2/3 build (shaped only).

**Rollback / containment:** additive skill; uninstalling the overlay mapping removes it. It writes only to an isolated worktree + PR + report artifacts; it performs no production writes and no deploys.

---

## 8. Governance mapping (each stage action → action-authority tier)

| Stage action | Tier (`action-authority.v1.json`) |
|---|---|
| S0–S6 read source, run read-only tools, analyze, plan | **autonomous** (`read_in_scope`, `analyze_and_plan`, `run_local_tests_and_safe_read_only_checks`) |
| S7 write a fix in an isolated worktree; commit; open/update PR | **autonomous** (`edit_in_isolated_workspace`, `create_branch_or_worktree`, `commit_in_scope_changes`, `open_or_update_pull_request`) |
| S8 run the repo's gates + mutation kill (read-only w.r.t. tracked tree) | **autonomous** |
| Push the fix branch | **conditional** — only on proof of no preview/prod deploy, publish, or external contact |
| Merge the fix PR | **human_required** (touches `security` → excluded from conditional-merge by `not_security_...`) |
| Any deploy / production write / external contact | **human_required** |

**Data egress note (borrowed from VVAH's `SECURITY.md` discipline):** routing product source to any
model endpoint is egress; the pipeline must state which backend each stage uses and run only against
repos the operator is authorized to test. Default backend is the local Claude CLI (`via: cli`).

---

## 9. Domain behavior + matrices

**Profiles that apply:** async/scheduled/background (runs in CI/cadence), provider-backed side effect
(model calls), AI/semantic judgment (findings), external-data adapter (SARIF ingest from tools),
derived-state/lifecycle (finding rows). Matrices required by those profiles:

### 9.1 Finding state & evidence matrix
| State | Meaning | Set by | Evidence required | Terminal? |
|---|---|---|---|---|
| `candidate` | surfaced, not yet verified | S2/S4 | a static hit or an LLM claim | no |
| `confirmed` | real, exploitable | S5 + S8 | **executable proof** (failing test/PoC) or ≥threshold panel votes with tier ≥ WIRING-FACT | no |
| `false_positive` | refuted | S5 | ≥threshold refuting votes | yes |
| `remediated_unvalidated` | fix written, not proven | S7 | a patch + a regression test | no |
| `validated` | fix proven by execution | S8 | regression test passes on fix **and** fails on unpatched (mutation kill) + suite green | yes |
| `needs_review` | pipeline cannot honestly decide | any | stated reason | yes (human) |

**Durable rule:** a `candidate` never enters SARIF as `confirmed`; a fix never reaches `validated`
without the mutation kill. Historical finding evidence is append-only (never overwritten by a re-run).

### 9.2 Producer / reconciliation (finding rows across re-runs)
Re-run is the main producer. On re-run: a finding that reproduces updates its row (keeps history); a
finding that no longer reproduces is marked `resolved_by_absence` (not deleted); a fixed+validated
finding stays terminal. Source-file deletion between runs → finding `superseded`. **(VERIFY** the
persistence home — product-repo code-scanning DB vs. a repo-local artifact — in Phase 1 design.)

### 9.3 AI/semantic clause
S1/S4/S5/S7 are semantic judgment from grounded evidence; S0/S2/S3/S6-dedup/S8/S9 are deterministic
validators/backstops. The verify panel's vote is the finding authority; deterministic prefilter may
only discount, never silently rewrite. Every model call goes through the dispatcher (untrusted-input
framing already enforced there).

---

## 10. Interfaces

**CLI (repo-resident, mirrors VVAH's verb set but on the Node spine):**
- `assurance estimate --repo <path>` → `ScopeEstimate`, no token spend (Lesson 4).
- `assurance scan --repo <path> [--stop-after s6]` → detection only, SARIF + report, no edits.
- `assurance remediate --repo <path> --finding <id>` → S7 in an isolated worktree.
- `assurance validate --repo <path>` → S8 execution-proven validation.
- `assurance report --repo <path>` → re-emit artifacts from persisted evidence (no re-spend).

**Config** (`assurance.config.json`, per overlay): stack adapters enabled, lens roster, `runs` /
`vote_threshold` / `temperature` per role, backend `via:` per role, cadence, budget ceiling.

**Artifact contracts:** SARIF 2.1.0 (schema-validated on emit); human report (severity-ranked,
FIX-PROVEN/PLAUSIBLE labels, honesty clause naming unreached surfaces — mirrors the `security-auditor`
output contract). **Redaction on write:** PAN(Luhn+IIN)/SSN/token/secret masked before any artifact
is written (Lesson 5).

---

## 11. Tests & proof ladder

Oracle policy: **hand-labeled golden vulnerable/clean fixtures are primary truth** (a tiny fixture
repo with known planted vulns + known-clean lookalikes). LLM-judge is secondary. Current output is
regression baseline, not truth.

| Rank | Test | Proves | Mutation that must turn it red |
|---|---|---|---|
| 1 | S2 adapter contract tests (Semgrep/CodeQL/osv/gitleaks SARIF → normalized) | messy/real tool output maps correctly; caveat (a) works on a TS fixture | feed a malformed SARIF envelope → must reject, not silently drop |
| 2 | S3 prefilter unit | low-signal gated, real kept | drop a real finding → liveness assert fails |
| 3 | S5 voting unit | threshold + N=1 deterministic fallback | set `runs:1` → must fall back to prefilter, not vote-of-one |
| 4 | S8 **validation-bite** (the critical one) | `validated` requires the regression test to FAIL on unpatched code | make S8 skip the unpatched-fails check → a fix with a vacuous test must stop reaching `validated` |
| 5 | Golden end-to-end on the fixture repo | planted vulns surface as `confirmed`; clean lookalikes do NOT (precision measured) | remove a planted vuln's detection path → recall assert fails; loosen a lens → a clean lookalike becomes a false `confirmed` and the precision assert fails |
| 6 | Redaction-on-write | a planted secret in a finding is masked in SARIF + report | disable the redaction pass → the secret appears → test fails |
| 7 | Governance | S10 cannot merge a security PR autonomously | make S10 call merge → assess-action must return human_required |

Commands: `npm test` (unit/contract), plus a new `assurance:golden` fixture run. Every negative
assertion paired with a positive liveness assertion (slice-rigor §6).

---

## 12. Phased delivery

### Phase 0 — the spine (the primitive; carries the 5 lessons as infra)
Build: the stage-runner + typed stage schemas on task-assurance; the voting-panel helper (Lesson 2);
`estimate` (Lesson 4); redaction-on-write (Lesson 5); SARIF+report emitters (Lesson 3); dispatcher
call-site (Lesson 1). **No security lenses yet** — prove the spine with a trivial stage set.
- **DoD:** a 3-stage toy pipeline runs end-to-end, checkpoints, resumes; SARIF validates; estimate
  spends 0 tokens; redaction masks a planted secret; `npm run control:*` gates green with the new asset registered.
- **Killer mutation:** delete the resume checkpoint read → re-run must redo work (proves resume was real, not decorative).
- **Status:** **MERGED to `main` via PR #59 (squash `cd68760`, 2026-08-12).** Independently adversarially reviewed → ACCEPT (2 minor findings, both fixed: D7 + literal de-dup); full local CI green (349/349 tests, control gates + all four overlay validations), D7 + checkpoint-killer mutations both bite. Phase 0 spine now lives on main.

### Phase 1 — the security instance (closes all 3 caveats)
Add: S2 stack adapters — **Semgrep first** (TS/Node-native, taint mode, SARIF, trivial install; alone
closes caveat (a) enough to prove the pipeline), then osv-scanner + gitleaks. **Correction (F1, verified 2026-08-12): Auxara deliberately retired paid GitHub-hosted CI, so CodeQL-via-Actions + SARIF-upload-to-code-scanning are deferred + founder-gated** (see Q2) — detection runs locally and Semgrep alone closes caveat (a). S4 security lenses (compose `security-auditor` +
`security-review-hardening`), S8 execution-proven validation (compose `golden-mutation-trust-harness`).
Wire into the **Auxara Dialer overlay** (proving ground, founder-chosen 2026-08-11) as a
**detection-only** recurring check first (`--stop-after s6`), remediation opt-in.
- **DoD:** on the golden fixture repo, planted TS/Node vulns surface `confirmed` with SARIF + tiers;
  clean lookalikes do not; a remediation reaches `validated` only via the mutation kill; precision/recall printed.
- **Killer mutation:** point S8 at a fix whose regression test passes on BOTH patched and unpatched
  code → S8 must refuse `validated` (caveat b closed); feed a Python-only-taint case on a TS repo →
  the CodeQL/Semgrep adapter still produces findings (caveat a closed).
- **Before building S2:** read the full `references/semgrep.md` + `references/codeql.md` and the actual
  CodeQL/Semgrep SARIF + CLI contracts — no building against assumed tool output (evidence-over-assumption).

### Phase 2 — the review instance (proves the spine generalizes; reuse)
Re-instantiate the same spine with review lenses (`code-review-quality`, `adversarial-reviewer`) instead of
security lenses; replace ad-hoc review. Lighter — mostly config + a lens roster.

### Phase 3 — propagate + demote VVAH
Add the capability to `bootstrap-orchestrator` templates so every new project inherits it
(doctrine-loop: universal-layer update). Add VVAH as an *optional* S2 evidence adapter for Py/Java/C#
repos. Record the capability as a "Planned capability" in `docs/architecture.md` and a phase in
`docs/implementation-plan.md`.

---

## 13. Locked decisions & open questions

**Locked (recommended defaults, reversible):**
- **D1** Backbone = repo-resident Node stage-runner with its **own lightweight resumable run-state store** for detection-stage artifacts + checkpoints (following the existing `<git-common-dir>/…/artifacts/` + `core/lifecycle/evidence-runtime.mjs` hashing convention); **task-assurance governs only the state-changing stages** (S7 remediate, S10 land). Q3-verified 2026-08-11: `schemas/task-evidence.v3` is a *closed* completion-proof schema, not a multi-stage artifact carrier — forcing detection artifacts through it was rejected. Reverse the split only if one store proves cleaner in practice.
- **D2** Artifact contract = SARIF 2.1.0 (industry standard, GitHub code-scanning ingestible) + human report. Reverse only if a target consumer needs another format.
- **D3** `validated` REQUIRES an execution mutation-kill (not an LLM read). Non-negotiable — it is the whole point of caveat (b).
- **D4** VVAH = optional S2 evidence adapter, never the spine. Reverse never (parallel-system gate).
- **D5** Findings persist in the **product** repo / its code-scanning, never imported into this control-plane repo (ownership boundary).
- **D6** Backend egress = **local already-authenticated CLI backends by default: Claude CLI (`via: cli`) AND Codex CLI (`via: codex-cli`)** — product source stays inside tools you already use; no new vendor/key/data path. Raw `via: sdk`/`via: openai` API endpoints are built as a *possible* switch but ship **off** (per-stage founder opt-in later). The two CLI adapters are *differently shaped*: Claude via the hardened `dispatch-claude-cli.mjs`; Codex via `run-bounded-agent.mjs`/`boundedProcess`. **Codex has no authenticated local lifecycle hook (`codex-task-status.mjs` is read-only), so Codex-dispatched stage output is deterministically verified, never self-attested** (fits the pipeline's tier-every-finding rule). Founder-decided 2026-08-11.
- **D7** Inter-stage artifact contract = the stage-runner passes the **redacted persisted artifact** as each stage's input in **both fresh and resume** runs (never the raw in-memory value on a fresh run), so a resumed run is byte-identical to a fresh one and no unredacted secret ever crosses a stage boundary. Consequence — a Phase-1 lens-contract requirement: **lenses must be redaction-invariant**, judging on structure/metadata (rule, location, dataflow, severity), never raw secret bytes. Rejected alternatives: an unredacted on-disk sidecar (reintroduces secrets at rest — security regression) and re-running upstream from the last unredacted in-memory boundary (defeats resume/cost). Decided 2026-08-11 from the Phase-0 adversarial-review finding; enforced in `stage-runner.mjs` + a biting test.

**Resolved (founder, 2026-08-11):**
- **Q1 → Auxara Dialer** is the Phase-1 proving ground. S2 uses **Semgrep first** (local, TS-native, SARIF). **Correction (F1, verified 2026-08-12 against Auxara `AGENTS.md` §Execution + `auxara-dialer-engineering-rules.md`): Auxara deliberately RETIRED GitHub-hosted CI to avoid paid remote runners — local `npm run ci` is the merge authority, "PR status checks are not proof."** So Phase-1 detection runs **locally** like every Auxara check; CodeQL-via-GitHub-Actions and SARIF-upload-to-code-scanning are **deferred, founder-gated** (Q2), not the free/no-install path assumed earlier. Semgrep alone still closes caveat (a) locally.
- **Q4 → D6** above (cli-only default).

**Open questions (block the relevant part until answered):**
*(Q2 resolved 2026-08-12 → **repo-local finding store** in the product repo's git-common-dir (honors D5; no CI/licensing dependency; matches the run-store convention). GitHub code-scanning upload is deferred + founder-gated: it needs a founder reversal of Auxara's retired-paid-CI decision AND confirmed GitHub Advanced Security licensing on the private repo — F1. The SARIF emitter output is already the exact artifact code-scanning ingests, so enabling it later is additive.)*

*(Q3 resolved 2026-08-11 → see D1: `task-evidence.v3` is a closed completion-proof schema, not a multi-stage artifact carrier; the spine uses its own run-state store while task-assurance still owns S7/S10 completion — no parallel governance system.)*

---

## 14. Pressure-test self-audit (required by full-slice-planner)

1. **Easiest wrong implementation a competent agent could build from this plan?** A pipeline that
   labels a finding `confirmed` on an LLM S4/S5 opinion with no executable proof, and a fix `validated`
   because a panel *read* it — i.e. it silently rebuilds VVAH's exact caveats on your spine.
2. **Which sentence would allow it?** Any softening of the S8 mutation-kill or the S5 tiering into
   "the panel agreed."
3. **What closes it?** D3 (locked), the §9.1 evidence matrix (`validated` requires unpatched-fails),
   and test-ladder rank 4 + Phase-1 killer mutation — all of which fail red if S8 is reduced to reading.
4. **What final-output proof fails if the wrong path is taken?** The golden fixture run (rank 5): a
   loosened lens turns a clean lookalike into a false `confirmed` and the precision assert fails; a
   vacuous regression test never reaches `validated`.
5. **Second wrong build:** forking `dispatch-claude-cli.mjs` or task-assurance into a pipeline-local
   copy (parallel system). Closed by §3 "reused / protected — do NOT fork" and the parity gates.

---

## 15. Documentation & registry updates (land with the build)
- `docs/architecture.md` — add "Planned capability: Assurance Pipeline" (on approval, mirroring the unified-memory precedent).
- `docs/implementation-plan.md` — add the phase + its killer mutations.
- `control-plane.manifest.json` + `registries/*` — register the new skill (gates enforce).
- `skills/bootstrap-orchestrator/` templates — Phase 3 propagation.
- This plan doc — move from `Proposed` to `Approved`/`In progress` on sign-off.
```
