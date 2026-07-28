# Portable AI organization control plane — implementation plan

Status: Implementation and independent verification in progress
Tracking: issue #1 / private Project 8
Branch protection: explicitly deferred by user

## Settled outcome

The private repository is the complete portable source of truth for safe Claude/Codex orchestration. It includes global and project-level orchestration rules, agents, skills, prompts, hooks, gates, guardrails, `CLAUDE.md`/`AGENTS.md` sources, assurance contracts, automation specifications, and the operating-model presentation. It excludes application/product trees and sensitive machine/runtime state.

## Action authority

Agents may autonomously read, plan, edit in scope, test, create branches/worktrees, commit, and open draft/ready PRs. A push is conditional on live proof that it cannot trigger a preview/production deploy, publish or billed build, production write, or external contact; a preview deploy counts as a deploy. They may merge only when every machine-readable conditional in `policies/action-authority.v1.json` is satisfied, including no production/deploy effect. Destructive, billed, production, external-contact, or unresolved product/design/architecture actions remain human gated.

## Blast radius

- Global installed Claude/Codex routers, rules, agents, skills, hooks, and bootstrap templates.
- Universal automation specifications and recurring drift/backflow checks.
- Auxara project orchestration overlay and its lifecycle/gate wiring.
- CoachAI project orchestration overlay and its lifecycle/gate wiring.
- Cross-vendor task contract, risk/evidence controls, role triggers, and completion wrapper.
- Repository/installed parity, context budget, collision, local-only, and unsafe-path gates.
- Organization presentation and technical handbook.

## Too little / too much

Too little is adding another orchestration document without installing it, gating drift, retiring contradictory rules, or proving the final agent workflow consumes it. Too much is copying application code/product docs or sensitive home state, building a hosted orchestration platform, or changing production/branch protection.

## Phases and proof

### Phase 1 — Canonical foundation

- Private repository, ownership boundary, issue/project ledger, action authority, task-assurance schema, agent-role registry, manifest schema.
- Proves: authority is explicit and machine readable.
- Killer mutation: mark an auto-deploying merge autonomous; validation must fail.

### Phase 2 — Portable install and parity

- Safe capture, dry-run install, install, check, local-root registry, hashes, collision/context/path validation.
- Proves: clean-machine install is deterministic and local-only/drifted assets cannot hide.
- Killer mutations: add a local-only rule, change one installed byte, omit a canonical file, reuse a skill ID, reference an unresolved absolute path, or try to include `.env`; each must fail before writes.

### Phase 3 — Global catalog migration

- Import all safe user-authored global Claude/Codex orchestration assets; classify upstream plugin/system assets as dependencies rather than copied authorities.
- Normalize twin doctrine, remove stale Figma/push/PR wording, add premise-and-architecture challenger, task lifecycle, release truth, uptime semantics, closure ledger, context/rule gates, and the PR-bound Claude CLI dispatcher. The noninteractive dispatcher exposes only two evidence profiles, both using `dontAsk`: ordered exact `read_only` `Read,Glob,Grep,WebFetch,WebSearch`, or generated-settings `bounded_implementation` with the bounded Read/Glob/Grep/Skill/Edit/Write subset and at least one mutation tool; `bypassPermissions` and every other mode, subset/superset/reordering, shell, delegation, notebook, or unknown capability fail before spawn. It requires and independently materializes a live GitHub issue/PR for implementation, preserves bounded native `shell:false` for `claude`, `gh`, and `git`, appends hashed untrusted-evidence grounding only to stdin, binds every PR review to matching origin plus clean checked-out live head and the verified merge-base..head diff, validates canonical realpath root identity, keeps Git output as exact bytes through bound/digest validation and rejects lossy UTF-8, and preserves full-PR provenance separately from exact implementation/partial-review patch scope. It permits bounded implementation only behind a clean isolated worktree, native exact Edit permissions, the catch-all defense/evidence hook, and exact edit-path/trusted-skill/action boundaries. Exact declared skills are byte-copied with SHA-256 evidence from canonical non-reparse roots into one outside-repository `bounded-dispatch` skill-only plugin; zero-model plugin details/init evidence must prove the exact `bounded-dispatch:<name>` runtime set and zero plugin agents/hooks/commands/workflows/MCP/LSP. The installed CLI's zero-model `--add-dir` probe loaded zero additional skills, so that hypothesis was rejected rather than claimed. Copied skill resources receive only separate exact Read authority, never Edit/Write or product-read expansion. Manifest creation performs one capped descendant-symlink scan per declared read directory during manifest construction rather than on every tool call, makes exact SessionStart activation replay idempotent, verifies post-run tracked/untracked and Edit/Write paths with Windows case-folded keys on success and failure without auto-revert, rejects no-op implementation success, and requires a capability probe before expensive implementation grounding. Same-user filesystem mutation after manifest construction is outside this local-process trust boundary; per-call path-segment/realpath checks remain mandatory.
- Proves: Claude and Codex receive the same semantic controls through tool-appropriate adapters.

Runtime skill containment clarification (Claude 2.1.215): the init skill catalog is evidence, not the authority list. “Exact runtime set” means every caller-declared `bounded-dispatch:<name>` appears exactly once and no undeclared name appears inside that isolated namespace; Claude-owned ambient built-ins may remain listed, but an observed Skill-tool invocation of one fails. Init also binds exactly one generated plugin object by `bounded-dispatch` name, per-run absolute path, `bounded-dispatch@inline` source, and `1.0.0` version, while every observed Skill input is checked against the caller declaration in both profiles. Unlike the ambient skill catalog, plugin discovery is deliberately closed by `--setting-sources ""` plus the dispatcher-owned optional `--plugin-dir`; the live bounded run exposed the one exact generated object and the live read-only run exposed `plugins: []`, so missing/extra plugin shape is treated as protocol drift and fails closed.

Dispatcher containment follow-through: implementation cleanliness is captured before and immediately after zero-model boundary probes; both profiles isolate settings sources, and read-only `dontAsk` additionally uses safe mode, disabled slash commands, and no session persistence without the API-key-only `--bare`; `.git` edit targets are denied case-insensitively without blocking exact `.husky`, `.claude`, or package files; temp plus both profiles' stdout/stderr/state evidence paths use canonical nearest-existing-ancestor containment; GitHub CLI output receives the same byte-bound fatal UTF-8 treatment as Git; full-review inventories stay out of argv; and stdin failures still reach post-run capture/evidence cleanup. General worktree status remains bounded to Git-visible tracked/untracked state, while a separate NUL-delimited `git check-ignore --no-index -z --stdin` probe covers every declared edit target and every observed Edit/Write path is independently boundary-checked. Stream auditing reads only exact top-level protocol locations: an exact unavailable-tool denial is recorded as behavioral noncompliance while malformed, mismatched, nested-forged, ambiguous, or executed forbidden tools fail closed. PostToolUse gate children execute from a verified project root even when Claude's current working directory is a nested package, and malformed mutation payloads block instead of bypassing gates.

The ignored-tree statement above applies to the general worktree inventory: all declared edit targets are sent as NUL-delimited stdin to one exact `git check-ignore --no-index -z --stdin` probe, including not-yet-created files, and any ignored target blocks before dispatch. Stream files are initialized before spawn and append bounded chunks incrementally without a later truncating rewrite; a structured sidecar records `running`, `failed`, or `completed` so parent/battery loss leaves durable partial evidence without retaining temporary settings or plugins. All Claude, GitHub CLI, Git, and direct-probe children receive a canonicalized registered minimal environment, and Windows termination invokes the absolute System32 `taskkill.exe` rather than trusting `PATH`. Generated native Edit permissions are filesystem-absolute because the generated settings file lives outside the repository. Doctor proves that Claude parses those settings; actual Edit/Write liveness and matching PreToolUse evidence are required from the model run before success. Explicit skill-source roots are exclusive authority; ambient user-home skills are consulted only when no explicit root is supplied. Direct reads and explicit search roots under `.git` are denied even when repository-root reading is declared.

Exit-0 dispatcher evidence requires exactly one later top-level result for every tool request and binds both request and result to the initialized session; missing, orphaned, duplicated, early, or cross-session results fail closed. PreToolUse proof accepts only Claude's native top-level `system` `hook_started`/`hook_response` envelopes, correlated by hook id, hook name, session, and stream order before the matching tool result. The retired synthetic `hook_event` shape is never evidence, while lawful successful SessionStart hook pairs may precede exactly one `init` envelope.

### Phase 4 — Project overlays

- Auxara: repair false decision-sprint gate, stale router facts, lifecycle validation, backend gate routing, role registry, release/journey evidence, and action policy.
- CoachAI: add task lifecycle, lean context router/gate, live decision register, affected-proof selection, Claude Design wording, warning ratchet, parity/journey routing, runtime/AI-quality operations specifications.
- Proves: project-specific operating behavior consumes universal authorities without creating a parallel product source of truth.

### Phase 5 — Assurance and presentation

- Adversarial review of actual diffs/artifacts; bite tests; repository-to-installed parity; project gates.
- Build and QA a presentation covering philosophy, roles, orchestrator/control plane, task flow, hooks, gates, guardrails, decision/action authority, learning loops, project overlays, and examples.
- Proves: the organization can be explained and bootstrapped from the same source.

## Rollout and rollback

Install begins with `--dry-run`; capture never overwrites canonical data without a reviewed diff. Product changes occur in isolated fetched-base worktrees. Existing installed files are backed up by hash-addressed snapshots before replacement. Rollback restores the previous manifest release and reinstalls; no application schema/data migration is involved.

Installed-bootstrap reconciliation implemented but not yet applied (2026-07-20): installed-only template lessons have been merged into canonical without regressing the bounded PR/issue dispatcher. The installer now has a generic, selected-mapping `--reconcile-installed <mapping-id>:<reviewed-old-tree-sha256>` lane. It deterministically binds the reviewed physical tree's normalized relative paths and raw bytes in a length-framed inventory; requires every non-link destination to match before any dirty overwrite or local-only retirement; retains only manifest-approved junctions; rejects adoption, malformed/duplicate/unknown/missing inputs, and unrelated mappings; and uses the existing snapshot/rollback transaction. A single consuming command grammar rejects missing values, duplicate or incompatible flags, stray tokens, and mismatched mapping/reconciliation pairs before any planning or writes. The read-only `digest --mapping <mapping-id>` lane emits stable JSON with the mapping, physical destination token, SHA-256, and informational file count, while validating and retaining approved root junctions. Digest and reconciliation share one pre-write installed-layout classifier whose deliberate precondition is exactly one physical destination per mapping; physical aliases count individually, while every additional destination must instead be an approved junction to that one tree. Default install remains unchanged and fail-closed. Neither lane has been run against the installed user trees: application still requires fixture proof, an exact-mapping dry-run, explicit install, then ordinary exact-mapping install/check proof while unrelated mappings remain untouched.

Doctrine-loop closure (2026-07-20): broad source-text heuristics and presence-only template assertions were retired in favor of executable generated-artifact behavior and independent red/green mutation cycles. Canonical npm tests now render and execute the lifecycle adapter's Delivery-fit matrix across valid implementation, checkpointed, and read-only profiles plus missing, ambiguous, placeholder, malformed, and reordered evidence; mutating away the implementation enforcement must turn the behavior gate red before restoration returns it to green.

Skill-loop closure (2026-07-20): a live Claude 2.1.215 init exposed ambient built-in names alongside the isolated plugin skills, revealing that whole-catalog equality was stricter than the real authority boundary. The sanitized live-envelope regression must pass with ambient listings, including duplicate ambient evidence; removing, duplicating, or adding a `bounded-dispatch:` skill, drifting the deliberately closed plugin identity, omitting a required init catalog, or observing a Skill-tool invocation of an ambient name must fail. Foreign producer fields now carry an explicit decision: tolerate ambient skill entries, but fail closed on the dispatcher-isolated plugin catalog and on absent protocol fields.

## Open compatibility backlog

| ID | Status | Evidence and problem | Required durable design | Cheap mechanical guard candidate | Acceptance / killer mutation |
|---|---|---|---|---|---|
| OVERLAY-HYBRID-COMPAT-001 | OPEN — design only; do not implement in the 2026-07-28 absorption slice | A full Auxara overlay install replaced three target-evolved HYBRID files byte-for-byte. Canonical parity stayed internally consistent while the installed lifecycle hook lost coordination/replacement behavior, the doc/code gate lost five imported validators, and decision linkage restored resolved BUX-019 state. Byte equality proves delivery, not target compatibility. | Add a manifest-level compatibility profile for every HYBRID mapping. It must name the stable public exports, behavioral contracts, project-owned composition seams, and target proof command(s); split universal core from project adapters where one file currently mixes both. Installation may replace a HYBRID target only when the incoming artifact satisfies that target profile. The profile is target behavior authority, not a second copy of product implementation. | Before profiles exist, a safe cheap guard can refuse `--adopt-existing` when the current target hash differs from the last installed/locked hash and the incoming hash is different, requiring an explicit reviewed reconciliation bound to the prior digest. Hashes alone cannot prove “ahead,” so the guard must call this local evolution, not infer semantic ordering. | Positive: a canonical union satisfying the declared exports and target proofs installs. Negative: remove one declared export, coordination refusal/release/reconciliation, replacement-stall behavior, or a resolved pending-row invariant and the scoped install fails before writes. Killer mutation: restore unconditional overwrite of a locally evolved HYBRID target merely because canonical differs. |

## Implemented control surface

- Safe canonical boundary enforcement, secret/path refusal, destination-collision detection, deterministic install/check, local-only detection, snapshots, failure rollback, and explicit rollback.
- Executed JSON schemas plus semantic action-policy invariants and a fail-closed action evaluator.
- Cross-vendor task assurance runtime with immutable attempts, registry-resolved local proof profiles, parsed artifact digests, structural mutation receipts, risk-derived independent review/human gates, and replay-safe completion.
- Rooted exec-form Claude hooks whose script paths and telemetry remain bound to `CLAUDE_PROJECT_DIR` even when a tool changes the current working directory, plus a PR-bound Claude CLI dispatcher with zero-token preflight, bounded native live-artifact and exact local-diff materialization, injection-resistant hashed stdin grounding, independently verified post-run edit boundaries, capability-first probing, and bounded child lifetime.
- Auxara and CoachAI overlay authorities plus daily/weekly project checks and a biweekly universal backflow comparison.
- Pull-request CI, ownership/review templates, and an editable 19-slide operating-model presentation with structural and rendered QA.

Project-repository PRs remain separate because merging them can trigger product deployment. The central control-plane PR also remains human-reviewed because it changes broad organization authority rather than an isolated low-risk leaf.

## Remaining human gates

- Any merge that triggers deployment or production mutation.
- Production config, environment variables, migrations, deploys, data writes, deletions, purchases, billed provider actions, or external messages.
- Close product, UX/design, or architecture choices without a previously settled authority.
