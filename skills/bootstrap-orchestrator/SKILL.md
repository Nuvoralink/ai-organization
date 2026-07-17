---
name: bootstrap-orchestrator
description: Generate the full orchestrator/auditor/gates/living-docs operating structure in ANY project, adapted to its domain — the fleet (premise-and-architecture challenger + sprint-kickoff auditor + implementer + adversarial-reviewer + doctrine-drift + domain auditor + security + ui-verifier + performance-auditor + functionality-parity-auditor + user-journey-auditor + release-verifier + test-runner), single-source agent rules with wiring/context gates, vendor-neutral task assurance plus Claude lifecycle adapters, gates:all + verify CI mirror, living docs, dispatch briefs, closed-loop learning, recurring read-only orchestration checks, and an uptime monitor pattern. Use when the user says "bootstrap this project", sets up a new repo, or asks to install the orchestrator structure. Not for upgrading a single agent or rule in an already-bootstrapped repo (edit directly).
---

# bootstrap-orchestrator

Stand up the orchestrator/PM operating model in a project: a fleet of specialized sub-agents, mechanical gates that bite at edit time and in CI, living docs, and a closed learning loop — **adapted to the project's domain, never copied word-for-word.** This skill generates the *project layer*; the *global layer* (`~/.claude/rules/orchestrator-mode.md` + doctrine + the user-level `implementer`/`adversarial-reviewer`/`security-auditor` agents) is inherited automatically and must NOT be copied into the repo.

Read `ARCHITECTURE.md` (why each piece exists + its origin incident) before your first bootstrap; read `HOWTO.md` for the Amin-facing walkthrough. This file is the executable procedure.

## What this is NOT
- NOT for editing one agent/rule/gate in an already-bootstrapped repo — edit it directly.
- NOT a copier of the two reference repos' product facts. Templates are parameterized; the reference repos (Auxara Dialer, Nuvora CoachAI) are *worked examples of the same model expressed differently*, cited to show what is invariant vs what adapts.
- NOT the global doctrine. `orchestrator-mode.md` + `doctrine-loop.md` + `loop-discipline.md` + `decision-discipline.md` + `slice-rigor.md` + `test-intent.md` + `authority-boundary.md` live user-level and load in every project. Do not duplicate them into the repo (no parallel system).

## The invariant vs what adapts (read this before Step 1)
**Invariant across every project** (the model itself): one orchestrator/PM over a fleet; the fleet roles (premise-and-architecture challenger + sprint-kickoff auditor + implementer + adversarial-reviewer + a domain auditor + security + doctrine-drift + ui-verifier + performance-auditor + functionality-parity-auditor + user-journey-auditor + release-verifier + test-runner); a single-source path-scoped agent-rules dir with wiring + startup-context gates; vendor-neutral task assurance with tool-specific lifecycle adapters; a GitHub issue/PR artifact bus; a PostToolUse gate hook; a `gates:all` + `verify` chain that CI mirrors exactly; living docs (index, backlog, blast-radius, journey/lessons, decision-log, ADRs); evolutionary architecture by default; the dispatch-brief 6-part contract; bounded goals/workflows/loops; two registered read-only orchestration automations; closed-loop learning wiring; the uptime-monitor pattern; a lean startup context layer.

**Adapts per project** (fill from discovery, never invent):
- **The domain auditor** — the single most adaptation-heavy role. It is authored from the project's *crown jewels* (what this product cannot get wrong). Two worked examples of the SAME role: the dialer's `compliance-auditor` (telephony legal/carrier invariants — STIR/SHAKEN, TCPA calling-hours, DNC, recording disclosure, tier-boundary) and CoachAI's `ai-decision-boundary-auditor` + `source-to-screen-auditor` (AI-owns-meaning boundary, source-to-screen authority). Same role, different crown jewels → different checklist.
- **The rules directory location + format** — `.claude/rules/*.md` (default: Claude lazy-loads official `paths:` matches, Codex reads via the AGENTS.md trigger table) vs `.cursor/rules/*.mdc` (only for an existing Cursor-native repo). This is a DECISION POINT (see Step 2).
- **The centralization registry table** — built from the project's ACTUAL discovered source-of-truth files, never a fictional list.
- **The gate set** — the always-invariant gates (`gate:rules-wiring`, `gate:test-intent`) plus project-specific gates the domain needs (UI-token gates for a frontend-heavy product, a tx-seam gate for a Prisma product, etc.).
- **Deploy topology, breakpoints, hot paths, check commands** — all discovered from the repo + a short interview.

---

## STEP 1 — Discovery interview + repo scan (never ask what the repo can answer)

**Discover from the repo (do NOT ask the user):** package manager + workspaces (`package.json`, `pnpm-workspace.yaml`, `Cargo.toml`, `go.mod`), test runner (`vitest`/`jest`/`pytest`/`cargo test`), existing check/lint/format/typecheck commands (`package.json` scripts, `Makefile`, `pyproject.toml`), monorepo layout (`frontend`/`backend`/`shared` or single package), CI provider (`.github/workflows/`, `.gitlab-ci.yml`), existing rules dir (`.claude/rules/`, `.cursor/rules/`, `AGENTS.md`), existing agents (`.claude/agents/`), whether it's a frontend product (React/Vue/Svelte present), whether it uses an ORM (Prisma/Drizzle/TypeORM), the frontend breakpoints if a design system exists (token files, tailwind config).

**Ask the user (only what the repo cannot answer — these are the product-judgment calls per orchestrator-mode "Who I am"):**
1. **Product domain in one line + its CROWN JEWELS** — "what can this product absolutely not get wrong?" (the regulated invariants / the AI-decision boundary / the money path / the data-integrity guarantee). This authors the domain auditor. Give the two worked examples so the user can place theirs.
2. **Deploy topology** — where does it run (Vercel/Railway/Fly/AWS)? What are the frontend + backend URLs? Where's the readiness endpoint? Where's the error tracker (Sentry/other)? (Feeds `release-verifier` + the uptime monitor.)
3. **What's billed / irreversible / destructive** — paid provider calls, prod migrations, anything that contacts a real user or moves money (feeds the authority-boundary classification + the plan-first routing default).
4. **Merge policy** — PR-based with self-merge after gates + review (default), or a protected `main`?

Record the discovery + answers in your working notes; you'll feed them into placeholders and the first journey-doc entry (Step 5).

## STEP 2 — Generate the project layer (from templates, WITH adaptation)

Every template lives under `templates/` with placeholders in `{{DOUBLE_BRACE}}` form and a filling instruction as an inline HTML comment (`<!-- FILL: ... -->`). Never leave a placeholder or a filling comment in a generated file.

1. **Decide the rules dir (DECISION POINT).** Default: `.claude/rules/*.md` — single source, official YAML `paths:` on every rule, Claude lazy-loads a rule when it reads a matching file, Codex discovers it via AGENTS.md, and `gate:rules-wiring` guards scoping/discoverability. Choose `.cursor/rules/*.mdc` ONLY if the repo is already Cursor-native. Whichever you pick, there is exactly ONE rules source — never both (`gate:rules-wiring` fails if the retired mirror returns).

2. **Instantiate the rules** from `templates/rules/` — fill the `paths:` patterns from the repo's real directories so each rule loads only where it bites — PLUS author the project's own path-scoped domain rule(s) using `templates/rules/DOMAIN-RULES-AUTHORING-GUIDE.md`. The centralization/registry rule's table is built from ACTUAL discovered source-of-truth files, never invented.

3. **Author the domain auditor(s)** from `templates/agents/domain-auditor.template.md` — this is the adaptation-heavy step. The template carries BOTH worked-example skeletons (regulated-invariant lens and AI-boundary lens). Pick the closer skeleton, then rewrite its checklist from the crown jewels the user named in Step 1. A domain auditor whose checklist is generic is a defective auditor — every row must name a real invariant of THIS product with a real `file:line` it would cite.

4. **Instantiate the rest of the fleet** from `templates/agents/`: premise-and-architecture challenger, sprint-kickoff auditor, implementer, adversarial-reviewer, security-auditor, doctrine-drift-auditor, ui-verifier (only if the product has a frontend), performance-auditor, functionality-parity-auditor, user-journey-auditor, release-verifier, test-runner. The premise challenger is read-only and never becomes a second PM; the sprint-kickoff lens is the plan-reconciliation opening bookend. Fill their read-first authority lists with ACTUAL paths. Project versions add domain-specific routing and do not duplicate global generic passes.

5. **Instantiate the living docs** from `templates/docs/`: `DOCUMENTATION_INDEX.md`, `BUG_BACKLOG.md`, `ARCHITECTURE_BLAST_RADIUS.md`, `JOURNEY_LESSONS.md`, `decision-log.md`, `adr-template.md` (+ an `adr/` dir). Place them where the repo's docs live (discover; default `docs/`).

## STEP 2.5 — Shape the context layer (the always-on set is a budget, not a bucket)

The generated files ARE the context system every future session runs on: `CLAUDE.md`/`AGENTS.md` + recursive `@` imports + every `.claude/rules` file without `paths:` are **startup context**; path-scoped rules, skills, and docs behind `DOCUMENTATION_INDEX.md` are **just-in-time**. A context window is a finite attention budget with diminishing returns — shape the layer deliberately. (Deep doctrine: `context-engineering` §5.)

1. **Startup = only what EVERY turn needs.** `CLAUDE.md` imports compact `AGENTS.md`; both carry pointers/irreducible invariants. Every project rule gets official `paths:` and AGENTS.md names its trigger. Use zero to four deliberate `@` rule imports at most; imports organize but do not save tokens.
2. **One source per rule — pointers beside content, never content beside content.** A rule stated in `CLAUDE.md` AND restated in a rules file drifts, and the agent obeys the stale copy. `CLAUDE.md` points; rules files state. (`gate:rules-wiring` proves the pointers resolve; this step guards against pasting bodies next to them.)
3. **Measure, gate, and record the budget.** `gate:agent-context` recursively expands `@` imports, adds every accidentally unscoped rule, estimates characters ÷4, and fails above the project's named ceiling. Target ~4K tokens; default hard ceiling 10K. Record the measured files/total in the Step 5 journey entry. Growth is a reviewed decision, never drift.
4. **Freshness signals stay wired.** Every authority-doc row in the index carries `Status:` + `Last verified:` (the templates do this). A stale doc pulled JIT into context is an active mislead — the doctrine-loop's stale-on-sight rule is part of the context layer, not just doc hygiene.
5. **Route product-AI context OUT of the bootstrap.** If the PRODUCT itself will have AI features (RAG over customer data, a knowledge assistant, semantic pipelines), that context system — corpus readiness, retrieval, grounding, governance — is product design work: run the `context-engineering` skill in those slices. Do not fold it into this bootstrap.

## STEP 3 — Wire the mechanics

1. **`.claude/settings.json`** from `templates/settings.json.template` plus `scripts/claude-lifecycle-hook.mjs` from `templates/lifecycle/claude-lifecycle-hook.mjs.template` — the read-only allowlist is built from the repo's REAL check/test commands (discovered in Step 1), plus lifecycle hooks and the `PostToolUse (Edit|Write)` gate router. Fill the integration branch and one bounded completion gate, ignore `tmp/agent-telemetry/`, instantiate `templates/tests/claude-lifecycle-hook.test.ts.template` in the repo's real test lane, and prove the hook with temp-tree mutation tests. The lifecycle command emits live local state at SessionStart/SubagentStart without converting command failure into a false clean/zero claim; blocks incomplete/non-substantive six-part TaskCreated briefs; fingerprints read-only task-time state; makes changed-file implementation checks bite at TaskCompleted; requires substantive Doctrine-loop/Honesty report sections at SubagentStop; and records only hashed IDs, allowlisted counts/outcomes, summary hash/bytes, and duration under ignored `tmp/agent-telemetry`. Do not persist prompt/report/summary/path bodies, do not allow a telemetry-path override, and do not configure `WorktreeCreate` until the installed Claude version's replacement semantics and Windows path behavior are explicitly verified.
2. **The PostToolUse gate router** from `templates/claude-posttooluse-gate.mjs.template` — fill the file-path→gate routing map from the repo's actual gates (a frontend edit routes to the UI gates; a test edit routes to the test-intent gate; etc.).
3. **`gates:all` + `verify` in `package.json`** from `templates/gates/gates-all-wiring.md` — `verify` must mirror the repo's actual CI sequence EXACTLY (build → lint → format:check → typecheck → test → gates:all). If the repo has no `verify` yet, create it; if it has one, EXTEND it (append `gates:all`), never replace a working sequence. `gates:all` always includes `gate:rules-wiring` + `gate:test-intent`; add the project-specific gates.
4. **The wiring gate** from `templates/gates/check-rules-wiring.mjs.template` and **the test-intent gate** from `templates/gates/check-test-intent.mjs.template`, placed in the repo's `scripts/`. Enumerate every real test root, including browser/e2e directories outside `src`, and catalog decision-log/backlog IDs when they are legitimate regression authorities. A new test lane outside the scanner is an ungated lane.
5. **The durable control plane** — instantiate the action-authority matrix, issue form, PR template, plan-mode saved workflow, bounded loop, goal templates, and playbook from `templates/control-plane/`; instantiate `templates/gates/check-agent-control-plane.mjs.template` plus its mutation-test template; wire `gate:agent-control-plane` through `gates:all` and the PostToolUse router. The gate validates the capability matrix, `.claude/settings.json`, and the playbook; those are load-bearing boundaries, not prose extras.
6. **CI** from `templates/ci/ci.yml.template` where a workflow provider exists — a `verify` job (mirrors local `verify`), a build job for the real deploy artifact if containerized, and a `notify-failure` job (commented; wire only if the user has an alert channel — CoachAI deliberately has none).
7. **Point `CLAUDE.md` + `AGENTS.md` at the fleet** from `templates/CLAUDE.md.template` + `templates/AGENTS.md.template` — a short "Agent fleet" section naming the project's domain auditor(s) + a line that the global doctrine applies. Do NOT copy the global orchestration rules in.

## STEP 4 — Verify (sentinel exit codes; the wiring gate is the proof the loaders resolve)

Run every generated gate reading its OWN exit code (never a piped `| tail` status):
```
npm run gate:rules-wiring; echo "EXIT: $?"     # green ⇒ CLAUDE.md/AGENTS.md ↔ rules dir all resolve
npm run gate:agent-context; echo "EXIT: $?"    # green ⇒ startup imports + unscoped rules stay inside budget
npm run gate:agent-control-plane; echo "EXIT: $?" # green ⇒ workflow/hook/brief/human-gate artifacts agree
npm run gate:test-intent; echo "EXIT: $?"      # green (or bootstrap-skip if no tests yet)
npm run gates:all; echo "EXIT: $?"             # the whole chain
```
Then a **seeded-violation spot-check** on `gate:test-intent`: create a throwaway test file with NO intent header in an `os.tmpdir()` scaffold (NEVER in the live source tree — test-intent §4.2), run the gate against it, confirm it FAILS (exit 1). Remove the scaffold. A gate that passes a seeded violation is theater; prove it bites before trusting it.

## STEP 5 — Register

1. **Codex trust** — add `[projects."<abs repo path>"] trust_level = "trusted"` to `~/.codex/config.toml` if absent (so `codex exec` runs unsandboxed for backend slices).
2. **CLAUDE.md / AGENTS.md fleet pointers** — confirm Step 3.6 landed and `gate:rules-wiring` is green.
3. **First journey-doc entry** — record the bootstrap in the repo's `JOURNEY_LESSONS.md`: date, the crown jewels chosen, the rules-dir decision + why, the domain auditor authored, the gate set, and the measured always-on context budget (Step 2.5). This is the closed-loop's first row.
4. **Recurring orchestration checks** — instantiate `templates/automations/project-orchestration-automations.md.template` and use the Codex desktop automation service to create or update the exact-name weekday drift and weekly doctrine-review automations. Inspect existing definitions first so registration is idempotent; bind both to this project; verify the stored definitions after the write. These are part of project-start bootstrap, not a later recommendation. If the automation service is genuinely unavailable, report that exact external-state blocker instead of pretending a committed file scheduled anything.

## STEP 6 — Hand off

Output a summary: what was generated (file tree), the domain auditor's checklist (so the user can confirm the crown jewels), the gate set + their green exit codes, the two stored automation names/schedules/statuses, and a numbered **human-steps** list in no-dev-knowledge form for anything a human must do (e.g. "1. Open <CI provider> → Settings → Secrets → add SENTRY_DSN: paste the value from …"). If nothing needs a human, say so.

---

## Discipline (this skill obeys the same doctrine it installs)
- **Never invent facts about the reference repos** — the two worked examples are cited from their actual merged files. If you cite one, it must be true of that repo.
- **Every non-trivial decision made during a bootstrap** (the rules-dir choice, which domain-auditor skeleton, which project-specific gates) appears in the hand-off with its basis (decision-discipline).
- **Loop discipline** — the verify step (Step 4) is a bounded loop: fix a failing gate → re-run → repeat to a hard cap of ~5; a gate that won't go green after research is an escalation to the user with the residual, not an infinite retry.
- **Doctrine-loop** — if a bootstrap reveals a template gap (a placeholder that had no filling instruction, a gate that didn't bite), fix the template in the same turn and note it.
- **These templates are LIVING — the backflow contract (Amin directive 2026-07-02).** The templates here are not a snapshot of the reference repos; they receive every generalizable lesson those repos (and any bootstrapped project) learn AFTER generation. Whenever a project's structure improves — an auditor prompt gains a learned class, a rule gains a section, a gate/brief/doc skeleton changes shape — and the class would bite in ANY project, the orchestrator updates the matching template here in the SAME turn (plus the global rules/agents and sibling projects). Corollary for maintainers: before trusting a template as "current best," check its recency against the reference repos' live agent/rule files — and if a reference repo has outgrown a template, that IS the backflow rule having been missed; sync it. (Precedents, 2026-07-02: the responsive layout-mode doctrine → `frontend-rules` + `ui-verifier` templates; the degraded-Sentry-sweep + timezone-correlation classes → the `release-verifier` template.)
