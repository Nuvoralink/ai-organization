---
paths:
  - "backend/**/*"
  - "frontend/**/*"
  - "shared/**/*"
  - "src/**/*"
  - "app/**/*"
  - "docs/app-plan/**/*"
  - "docs/sprints/**/*"
  - "package*.json"
---

# Slice Rigor — Prove Work Against Product Intent, Not "Green Pass"

Purpose: every unit of work — a feature slice, a sprint/epic task, a bug fix, a refactor — must produce work proven against product intent, not work that merely compiles. A green CI pass that doesn't assert meaningful product behavior is **theater**, and over time it corrupts the team's sense of what "done" means. Always-on; "slice" = whatever bounded deliverable the task names (a sprint row, a tracked task ID, a PR). Applies retroactively: a closed slice with DoD/blast-radius/source-of-truth/test-ladder gaps has bugs to fix.

## 1. Before opening a slice (read, in order)
1. The task/slice doc.
2. The grounding docs it's based on (product brief / PRD / feature scope / architecture / ADRs / decision rows it names).
3. Every decision-log row / requirement ID / benchmark the slice depends on.
4. The project's source-of-truth map and blast-radius docs for the surfaces involved.
5. The relevant always-on rules.

If any of these are missing or stale: STOP and fix them first. Don't implement against a stale plan (labels like "pending"/"locked"/"next" may be overtaken by history — reconcile against git + the decision log).

## 1.0 Reconcile before you plan (iteration kickoff gate)
When a project has a decision log plus sprint/iteration plan docs, dispatch its read-only
`sprint-kickoff-auditor` **before** planning. Run the project's decision↔plan linkage gate when one
exists and read its own exit status. Reconcile both directions: every approved decision with an exact
iteration target appears in that plan's included-decision inventory, and every included ID resolves to
a real, non-Scrapped/non-Deferred decision; exact targets must resolve to real, non-deleted plans.
Then audit semantic consistency, stale echoes, locked artifacts, and scrapped scope. **GAPS blocks
planning.** A genuine ownership/timing fork gets options + a durable dated deferral/backlog row for the
human product owner; the auditor never chooses it. Locking settles *what*; the plan inventory schedules
*when*—neither implies the other.

## 1.1 Evolution-seam audit (architecture/foundation/phase work)

Inventory approved/expected later capabilities and map each to the existing authority it must extend.
For every future consumer, record: current authority; expensive present-only assumption; seam planted now
or documented for later; real current consumer that exercises a planted seam; forbidden parallel authority;
migration/retirement path; and killer mutation. Plant now only when retrofit is cross-cutting/expensive,
the boundary is stable in domain terms, and current code can exercise it. A seam with no current consumer
or verified contract is speculative architecture: document its extension point instead of adding dead
flags, enums, tables, provider methods, or generic frameworks. Later slices may add policy/projections but
must consume the existing identity/data/command/event/provider/artifact authorities.

Fail the plan when it hardcodes a known present-only assumption across callers or schedules a later feature
that would create a sibling source of truth. Also fail over-generalization against an imagined provider.
Allow a concrete one-off helper when no approved second consumer exists; record the trigger for extraction.

## 2. Definition of Done — 3-fold, all three must hold simultaneously
**a) Product DoD — the user-visible outcome works.** Every requirement in scope has a passing acceptance test exercising actual product behavior (not just compile); every relevant competitive benchmark (negative = don't repeat the incumbent's failure; positive = match/beat the incumbent's strength) has a passing assertion; the user-visible surface shows the right state in the right role × scope; honest fail-closed states are exercised, not just happy paths.

**b) System DoD — data integrity + source-of-truth preserved.** Every persisted derived row has source-mutation handling for every applicable state (lifecycle matrix) AND producer-RETIREMENT handling — retiring a detector/metric/kind requires a same-slice terminal sweep for its OPEN rows, or they make user-visible claims forever (2026-07-12 CoachAI CA-4: removing an alert kind from the refresh list left open rows never-re-detected AND never-auto-resolved — immortal KPI claims on the manager cockpit) — AND scale/ceiling-change handling: changing the scale a persisted derived row is stored on requires enumerating every reader of HISTORICAL rows and classifying windowed (ages out) vs unwindowed (renders old-scale values against new ceilings forever — 2026-07-13 CoachAI CA-5: a score reweight's "ages out in 30 days" claim was false for two unwindowed consumers); every authority a touched surface claims is verified (no surface invents truth that should come from an authority); cross-tenant queries are app-scoped AND backstopped (RLS), proven by a tenant-isolation black-box test; provider-event idempotency is a real durable guard (unique constraint / claim row / event id), not happy-path; paid-AI calls write a usage event with stable stage/role/capability/provider/model/tokens/cost.

**c) Drift-prevention DoD — docs + maps + journey + tests updated.** Blast-radius docs updated for any new connected surface; the decision log updated for every decision actually made; new ADRs for architectural decisions confirmed; source-of-truth / surface-authority maps updated for new authorities or surfaces; API/contract docs updated for new endpoints; glossary updated for new IDs/terms; the journey/lessons doc updated if a reusable pattern surfaced. A skipped update means the slice is NOT done — re-open and finish.

## 3. Blast radius (declare BEFORE editing)
```
Blast radius for this slice:
- Backend: <routes, services, workers, middleware, lib helpers>
- Frontend: <pages, components, hooks, lib/api, design tokens>
- Shared contracts: <DTOs, enums, config thresholds>
- DB: <models, migrations, RLS predicates>
- Jobs / queues: <jobs, retry rows, dispatch rows>
- Telemetry: <events, audit rows, AI-usage rows>
- Provider integrations / external consumers: <...>
- Docs: <which docs update in this commit>
```
If implementation reveals a surface not named above, STOP, update the declaration, and update the blast-radius doc (and this rule's lessons if recurring).

## 4. Source-of-truth verification
Declare which authority owns each decision the slice makes (a small table: Decision | Authority owning it | How verified). If a decision is made by a layer that is NOT the authority, that's a bug to fix at the authority layer — not patch at the consuming layer.

## 5. Downstream consumers
Every authority surface the slice creates/changes enumerates its downstream consumers (API/DTO, frontend, aggregate/report, external, audit, billing) AND verifies them. A consumer named but not updated is a stale-wiring bug.

## 6. Test ladder with named assertions (not green-pass theater)
Before implementing, declare what tests will exist and what each PROVES (see the test-intent rule for the file header). Apply the smallest rank that proves the risk:
1. Schema/static (contract shape, enum, taxonomy presence)
2. Pure-logic unit (branchy logic, state machines, counters)
3. Integration (service handoffs, provider event → projection → consumer)
4. Tenant-isolation black-box (every object-scope read endpoint)
5. Three-fold paired assertion (persisted derived state with visible UI: normalization + source-invariant + DTO/mapper)
6. Bounded-repair trace truth (every AI path: a failed second-pass repair traces `rejected`, not `repaired`)
7. Source-to-screen smoke (high-risk user-visible surfaces)
8. One live-provider rerun post-merge (high-risk integrations)

A test using fixtures that pass without exercising the actual product decision is theater — reject it.

## 7. Data integrity + anti-fabrication
For state writes, declare the invariants tests must prove: uniqueness scopes, referential/temporal integrity, idempotency (durable guard, not UI-disable), append-only tables, authority precedence when two authorities disagree. Test against meaningful fixtures incl. concurrent duplicate trigger, stale source mutation after the derived row was written, provider unavailable/malformed, cross-tenant attempt, token-version mismatch, fail-closed paths. For data shown to users: it's sourced from the owning authority; honest Unknown/Pending/Unavailable states are tested; fabricated values (computed from stale state, parsed from prose, made up to fill a card) are forbidden and a test would catch a fabrication regression; user-visible values `assertEquals` a golden derived from realistic fixtures, not a mock that mirrors the implementation.

## 8. Closure checklist
- [ ] Grounding + slice + decision rows + benchmarks read
- [ ] Source-of-truth map consulted; blast radius declared + verified vs the actual diff
- [ ] Three-fold paired assertions where persisted derived state hits UI; bounded-repair trace truth on AI paths
- [ ] Tenant-isolation black-box for new read endpoints; idempotency proven (sequential retry AND concurrent duplicate)
- [ ] Test ladder declared; every test has a `Proves:` header; negative paths exercised
- [ ] Downstream consumers updated (not stale); docs updated (blast-radius, decision-log, ADR, maps, glossary, journey)
- [ ] **Delivery ledger:** every enumerated element of an approved/LOCKED design artifact this slice's scope touches (a locked mock/surface, a signed-off spec) maps to a **shipped surface**, a **plan/sprint Included decision-ID**, or a **cited deferral row** (decision-log / backlog) — an approved element that is NONE of those is a silent-drop finding. A "pause" that lives only in session/orchestrator memory is **NOT** a deferral. (Locking approves the *design*; only a plan Included-ID or a cited deferral row schedules/parks the *build*.)
- [ ] Authority boundary classified (see the authority-boundary rule)
- [ ] For architecture/foundation work: future-consumer/seam matrix complete; every planted seam has a real current consumer and liveness proof; speculative seams remain documentation-only; bypass and parallel-authority killer mutations named
- [ ] The project's aggregate gate passes (read its own exit status, not a piped one)

## 9. When to STOP and audit
A test passes without exercising the decision it claims to prove (a false-passing test is **P0** — fix that turn, never backlog, never `.skip` to green); a green run hides a stale consumer; a persisted row's lifecycle wasn't analyzed for "what if the source changes"; a deterministic guard was made the authority for an AI meaning-judgment; AI was made the authority for billing/RBAC/lifecycle; an honest Unknown/limited state was bypassed for fabricated values; a reviewer says "this feels like a workaround" (don't defend — audit upstream); a behavior acts autonomously where the project reserves the decision for a human/external system-of-record; the same class of bug catches in two different slices (codify before continuing); a scrapped/killed decision is being reintroduced (re-expanding killed scope is a fresh explicit user decision, never a latent assumption); **an approved/LOCKED design element is being left unbuilt with no cited deferral row** — a "pause" that lives only in session/orchestrator memory is a silent drop, not a deferral, so file the decision-log/backlog deferral row (or add its decision-ID to the plan) the same turn.

## 10. Lessons (live log)
When a slice reveals a recurring DoD/blast-radius/source-of-truth/test failure mode, append a short note here naming the pattern + the prevention. Future slices inherit it.

**L1 — An approved/LOCKED design element is silently dropped when the plan never carries its decision ID and the "pause" lives only in session memory (dialer 2026-07-13, first whole-app functionality-parity sweep).** A comms/SMS surface (a dock + an "SMS everywhere" set) was approved & LOCKED, but the sprint that should have built it never listed those decision IDs, and its "pause" existed only in orchestrator session memory — so ~10 enumerated mock elements shipped undelivered, with nothing in the durable record tracking them. The endpoint-wiring gate could not see it: it only sees registry endpoints, never a locked-mock element with no endpoint, an api-method built-but-never-called, or a stale "no backend yet" shell; and the whole-app functionality-parity sweep had never run. **Prevention (wired):** §8 closure now carries the **delivery-ledger** check (every enumerated locked-design element maps to shipped / a plan Included-ID / a cited deferral row), §9 STOP names "a session-memory pause is not a deferral — file the cited row the same turn," and the `functionality-parity-auditor` carries the locked-mock-vs-plan diff as a standing checklist + Learned class. *Locking approves the design; only a plan Included-ID or a cited deferral row schedules (or honestly parks) the build.*
