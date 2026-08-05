<!-- Guide (not a template file to instantiate): how to compose `gates:all` + `verify` in package.json so CI mirrors local exactly. -->
# Wiring `gates:all` + `verify` (the CI mirror)

These two scripts are the spine of the mechanical-gate layer. `gates:all` is the aggregate every gate hook + CI run; `verify` is the full local mirror of CI.

## The invariant
`verify` MUST run the SAME sequence CI runs, in the same order:
```
verify = <install/generate as needed> && build && lint && format:check && typecheck && test && gates:all
```
**Why the full sequence, not `gates:all` alone:** `gates:all` omits lint/format:check/typecheck — running it alone let a banned import + unformatted files reach a RED CI (origin incident, 2026-06-11). `verify` surfaces the whole cascade locally, before the commit. The implementer/reviewer read each command's OWN exit code via a sentinel (`npm run verify; rc=$?; echo "EXIT: $rc"; exit $rc`), never a piped `| tail` status (a pipe reports the last stage's exit, not verify's).

## `gates:all` — always include these two, then add the project's own
```
gates:all = gate:rules-wiring && gate:agent-context && gate:agent-control-plane && gate:test-intent && <project-specific gates...>
```
- **`gate:rules-wiring`** (invariant) — the loader-integrity gate. Wire it FIRST so a broken rules↔agents link fails fast.
- **`gate:agent-context`** (invariant) — recursively measures CLAUDE imports + accidentally unscoped rules; fails above the named startup budget.
- **`gate:agent-control-plane`** (invariant) — validates the six-part issue form, human-gated PR template, plan-mode saved workflow/playbook, bounded loop/goals, lifecycle hook, settings events/permission surface, and ignored content-free telemetry path.
- **`gate:test-intent`** (invariant) — every test declares what it proves.
- **Project-specific gates** — add per domain, e.g.:
  - Frontend product: `check:ui` (guardrails + source-of-truth + testid + continuity), `check:layout` (scroll + header-surface).
  - ORM/DB product: a `gate:tx-seam` (typed transaction seams), a `gate:lifecycle-write`, an `ephemeral-listen` gate for HTTP integration tests.
  - Monorepo with internal `file:`/`workspace:` packages: `gate:shared-resolution` — internal packages must resolve in-tree; wire it into each consumer's `build` (see "Workspace-package resolution guard" below).
  - **Any product that runs PARALLEL agents in worktrees** (i.e. every bootstrapped repo): the two shared-namespace COLLISION gates — `gate:migration-object-names` (any repo with SQL migrations) and `gate:adr-numbering` (any repo with numbered ADRs). See "Shared-namespace reservation + its collision gates" below.
  - Any product: `gate:doc-code-drift` (every claimed authority path resolves), a `preflight-security` gate, a supply-chain `gate:audit` in CI.

## Shared-namespace reservation + its collision gates

Parallel/swarm agents in isolated worktrees each independently take "the next value" from a shared namespace — the next migration number, ADR number, decision-log ID, a free dev port — and collide. The collision is **git-clean** (different files, no merge conflict) until integration, or shows up at runtime as EADDRINUSE. Proven, not theoretical: two backend agents both created migration `0083`, caught only by hand at integration.

The mechanism is a **control-plane MANAGED asset** — the project-agnostic core, the shared CLI, and both gate ENGINES live at `core/coordination/` in the AI-Organization repo and auto-deliver to `.ai-organization/runtime/core/coordination/` in every project. **Never edit a delivered copy**: it forks the digest-pinned source, the next install reverts it, and the overlay-parity gate fails. A bootstrapped project installs only four small files from this directory:

| Template | Installs to | Owns |
|---|---|---|
| `reservation-config.mjs.template` | `{{SCRIPTS_DIR}}/reservation-config.mjs` | the ONLY project-specific file — namespace→path bindings, ADR convention, port range |
| `reserve.mjs.template` | `{{SCRIPTS_DIR}}/reserve.mjs` | thin CLI entry |
| `check-adr-numbering.mjs.template` | `{{SCRIPTS_DIR}}/check-adr-numbering.mjs` | thin gate entry |
| `check-migration-object-names.mjs.template` | `{{SCRIPTS_DIR}}/check-migration-object-names.mjs` | thin gate entry |

Wire the gates to run the MANAGED engine test alongside any project-binding test, so a broken engine fails the project's own gate rather than silently degrading:
```
gate:migration-object-names = node --test .ai-organization/runtime/core/coordination/migration-object-names.test.mjs && node {{SCRIPTS_DIR}}/check-migration-object-names.mjs
gate:adr-numbering          = node --test .ai-organization/runtime/core/coordination/adr-numbering.test.mjs .ai-organization/runtime/core/coordination/namespace-reservation.test.mjs && node {{SCRIPTS_DIR}}/check-adr-numbering.mjs
```

**Two calibration calls the bootstrapper must make, not copy:**
- **Which namespaces to wire.** Sequentially-numbered migrations (`NNNN_slug`) → wire `migration`. TIMESTAMP-prefixed migrations (Prisma's default, `20260803090000_slug`) → do **not** wire it: the number comes from the clock, so there is no "next number" to contend for, and `gate:migration-object-names` is the applicable control. A wired namespace nobody uses is noise; an unwired real one is a live bug.
- **The agent port range must not overlap a sibling project's.** Ranges are per project and both can run on one machine. Check the other projects' `reservation-config.mjs` and record the assignment in a comment (currently taken: Auxara Dialer 5300–5399, CoachAI 5400–5499).

**Prove the gates BITE before calling this done** — a registered gate that never fires is not proof. Seed a scratch duplicate (a second migration hard-creating a table that is *still occupied* at the end of the chain, and a second ADR file on an existing number), confirm exit 1 with the right message, delete the fixture, and confirm exit 0 again. Pick the duplicate object by *tracing the real migration set*, not by eye: an object that a later migration DROPs is legitimately re-creatable, so duplicating it produces an inert fixture that passes and proves nothing.

## Example (the dialer's actual `gates:all`, for calibration — do NOT copy verbatim)
```
gate:preflight-security && gate:doc-code-drift && gate:rules-wiring && check:ui && gate:test-intent
  && gate:copy-terms && check:layout && gate:tx-seam && gate:tx-rollback && gate:lifecycle-write
  && gate:ephemeral-listen && gate:filemap
```
The dialer's `verify`:
```
prisma:generate -w @<scope>/backend && build && lint && format:check && typecheck && test && gates:all
```
Note the heavy DB suite (`test:integration`) is DELIBERATELY NOT in `verify` — it's a separate script the orchestrator runs via the test-runner agent (implementer Pattern A). CoachAI expresses the same idea with different gate names — the invariant is the sequence + the two mandatory gates, not the specific project gates.

## The two scripts each gate needs
Each gate is `node {{SCRIPTS_DIR}}/check-<name>.mjs`, exposed as an npm script (`gate:<name>` or `check:<name>`), returning exit 0 (pass) / 1 (fail), and bootstrap-skipping (exit 0) until the code it scans exists.

## If the repo has no `verify` yet
Create it. If it has one, EXTEND it (append `gates:all`) — never replace a working sequence, which risks dropping a step CI relies on.

## The dev-boot smoke (recommended companion script, not a CI gate)
Config-agreement gates prove declarations MATCH; only serving a 2xx proves the server WORKS. Ship a
`smoke:dev-boot` script (`node {{SCRIPTS_DIR}}/dev-boot-smoke.mjs`): spawn THE backend launch command
the dev harness's config declares (read `.claude/launch.json`'s backend entry when it exists, with a
direct plain-`tsx` fallback — one command source, so launch-config drift is auto-covered), poll the
health endpoint to 2xx within a bounded deadline (~45s), kill the child either way, and SKIP cleanly
when the local env file is absent (CI-safe). Run it after any change to the backend's top-level
imports / env loading / dev tooling, and before dispatching any measurement session that needs the
backend. Origin (Auxara Dialer, 2026-07-02): a port fix was declared done because the port mirrors
agreed — but `@sentry/node` v8's import-time OTel instrumentation hung the tsx loader before
`app.listen()`, and a full measurement run re-blocked on it. Reference implementation: the dialer's
`scripts/dev-boot-smoke.mjs`. Related authoring rules:
- When a module's INIT is env-gated, its IMPORT must be gated too — never statically import a heavy
  loader-patching dependency (Sentry/OTel/APM) unconditionally.
- The harness launch config must run PLAIN `tsx` (or equivalent single-level command), NEVER a
  watcher/supervisor (`tsx watch`, nodemon): the supervisor's re-spawned child never binds under the
  preview harness on Windows even though the same command works from a plain shell (Auxara Dialer
  RRL-010, 2026-07-03). Corollary: a shell spawn — including this smoke — proves the COMMAND boots;
  only `preview_start` + a single-shot probe proves the harness path. Verify through the harness
  whenever a launch config changes.

## Generated-artifact freshness: regenerate in pre-commit from the STAGED index (not by vigilance)
Any committed GENERATED artifact with a freshness gate (a repo filemap, a generated route table, a
derived registry) has a built-in ordering footgun: the generator reads `git ls-files` (the INDEX), so
running it BEFORE `git add`-ing new files produces a stale artifact that only the CI gate catches —
and both humans and agents keep getting the order wrong (Auxara Dialer: the same class bit 3× in one
day, 2026-07-03, despite a memory line and a ledger row). The mechanical kill: a **pre-commit hook**
that regenerates the artifact and `git add`s it — the hook runs when the index is ALREADY staged, so
the ordering mistake becomes impossible instead of remembered. Keep the CI gate as the backstop
(machines without hooks, `--no-verify` commits). Shape (in `.husky/pre-commit` or equivalent):
`node scripts/generate-<artifact>.mjs && git add <ARTIFACT>` — cheap, silent when unchanged, guarded
by `command -v node` + a file-exists check so fresh clones don't break.

**Worktree blind spot (Auxara Dialer RRL-013, 2026-07-03):** husky's `core.hooksPath = .husky/_` is a
GITIGNORED runtime dir created by the `prepare` script — linked worktrees share the config but not
gitignored artifacts, so git resolves the relative path against the worktree root, finds nothing, and
**silently runs ZERO hooks there** (including the security scan). The worktree-setup preamble must run
`npx husky` (or the repo's prepare script) alongside the other gitignored-artifact steps (prisma
generate, `.env` copy) — and the CI gate stays the backstop for any unhooked commit.

## Workspace-package resolution guard: internal packages must resolve IN-TREE (worktree false-red / false-green)
In a monorepo where workspaces consume an internal package via `file:`/`workspace:` (`@scope/shared`
imported by `backend`/`frontend`), a build run inside a `git worktree` that was never installed resolves
the MAIN checkout's built package (`shared/dist`) instead of the worktree's own — Node walks `node_modules`
UP the tree. A stale foreign build then yields a **FALSE RED** (a cryptic TS error that looks like a source
bug) or, worse, a **FALSE GREEN** (a real break sails through). `git stash` does NOT hide it — the built
artifact is gitignored, so stashing source leaves it in place, which is exactly how the class gets
misdiagnosed as an origin/main source defect. Ship `templates/gates/check-shared-resolution.mjs.template`
as `{{SCRIPTS_DIR}}/check-shared-resolution.mjs` and wire it as the FIRST step of each consumer's `build`
script (`node ../{{SCRIPTS_DIR}}/check-shared-resolution.mjs && <existing build>`) so a foreign resolution
fails FAST with the fix instead of a cryptic downstream error. It is a no-op in any correctly-installed tree
(CI, a normal clone, an installed worktree). Origin (Nuvora CoachAI 2026-07-04): a shipped-and-settled
contract-field removal was reported as an origin/main "red build" because an uninstalled worktree
typechecked a 5-field producer against the main checkout's stale 8-field DTO — no source bug existed. Skip
this gate for single-package repos (no internal workspace deps).

## Postgres-RLS projects: the DB-invariant scanner trio (2026-07-21)

Any project with Postgres RLS + a skip-without-DB test lane inherits two invisible-failure classes: a delete against an RLS-no-DELETE table is a silent count:0 no-op, and a skipIf-gated suite can be the SOLE coverage of a DB-mutating module ("skip = green"). Instantiate `db-guards.mjs.template` (+ `db-scan-shared.mjs.template` at scripts/lib/) and the two scanners `check-rls-delete-path.mjs.template` / `check-db-mutation-coverage.mjs.template`, wire them as `gate:rls-delete-path` + `gate:db-mutation-coverage` in gates:all, and author meta-tests per the dialer's (tmpdir scaffolds; killer mutations: re-add a raw deleteMany against a guarded table → red; delete the always-run unit test → the gate flags the skip-only path). Pair with the DB-lane-as-merge-gate policy for backend-touching branches.

## Vitest: set `hookTimeout` = `testTimeout` in the CONFIG, not just on a DB-lane CLI (2026-07-21)

Vitest's defaults are asymmetric — `testTimeout` 5s, `hookTimeout` **10s** — so a project that raises `testTimeout` (bulk DB fixtures under a shared Postgres, heavy AST-spawning gate meta-tests, any suite slow under contention) but leaves `hookTimeout` at its default gets a `beforeAll`/`afterEach` killed the moment it spikes past 10s, while the test BODY it wraps (now 30s) is not. The symptom is `Error: Hook timed out in 10000ms`; it is LOAD-SENSITIVE (only under parallel/CPU/DB contention) and usually surfaces in a suite **ORTHOGONAL to the change under test** — so it misattributes and trains agents to "re-run until green," which is exactly how a real failure later gets waved through as "just the flake." Fix at the SOURCE, not per-lane: set BOTH timeouts in the vitest config from ONE constant (`const SUITE_TIMEOUT_MS = 30_000; testTimeout: SUITE_TIMEOUT_MS, hookTimeout: SUITE_TIMEOUT_MS`). One line covers every lane the config governs — the plain `verify`/`npm test` lane AND the serialized DB `test:integration` lane — and makes `hookTimeout >= testTimeout` true by construction (stronger than an assert, which is tautological when both read the same constant). A per-lane CLI `--hookTimeout` only patches the one lane that flaked and leaves the plain lane exposed — the trap that made the first attempt at this fix miss a second, already-documented instance. Reference: Auxara Dialer `backend/vitest.config.ts` `SUITE_TIMEOUT_MS` — one config line closed a DB-lane control-gap AND a separate gate-meta-test flake backlog, same root. Verify deterministically without a DB: a throwaway suite whose `beforeAll` sleeps between the two ceilings (e.g. 12s) FAILS with the default hookTimeout and PASSES once the config carries the lifted bound.
