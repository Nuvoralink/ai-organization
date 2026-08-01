---
name: ai-output-source-truth-audit
description: Use when auditing, fixing, or planning root-cause repairs for AI-generated or algorithm-generated product output that may be wrong, stale, ungrounded, over-deterministic, poorly ranked, incorrectly validated, or not reaching the final user-visible surface. Trigger when the user asks whether an AI output is accurate, whether a fix is root-level rather than a workaround, whether validators are masking bad reasoning, whether generated decisions are tracked properly, or whether the final UI/API/report actually consumes the intended source of truth.
---

# AI Output Source-Truth Audit

Use this skill when a visible product answer may be driven by the wrong layer, stale data, an under-specified AI contract, or downstream reconstruction.

The goal is not to widen every task. The goal is to make sure the intended authority drives the final user-visible behavior.

## The Standing Gauntlet — run on every audit and every fix (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. No fix ships until it can affirm each relevant gate.

1. **Verify, never assume.** Trace the wrong output to the line/layer that produces it; a report, doc, recalled fact, or status line is a *lead*, not proof.
2. **Outputs over statuses.** Read the raw model response, the persisted row, and the rendered surface yourself; distrust a green test or a grep returning 0 and re-check a different way.
3. **Tests must bite.** Regression coverage must FAIL on the unfixed reasoning/wiring — name the mutation; reject vacuous or stale tests.
4. **Whole blast radius.** Every stale fallback, cache, mapper, or UI reconstruction that can keep the wrong answer alive is found and updated.
5. **Replace, don't layer.** A new authority deletes or demotes the old one; grep the old path to prove it's gone, not orphaned and racing the new truth.
6. **No parallel system.** Don't add a second decision path beside one that already exists and was merely mis-wired.
7. **Best, most durable way.** Fix the earliest reliable wrong decision; keep validators as backstops/feedback, not the main intelligence layer.
8. **Pressure-test the thing itself.** Is the layer even supposed to own this decision? Is it vestigial/forgotten? Over-deterministic where AI should judge, or too loose where code should gate?
9. **Stop before you quick-fix.** A bug found mid-audit runs the mid-task loop (verify → already-fixed/mis-wired or legacy → pressure-test purpose → hypothesize → verify the fix is best → the rest of the gauntlet → implement or flag), not a reflex patch.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## Safe First Inventory — before any recursive search

Treat path enumeration as disclosure: ignored or untracked data-bearing paths are not safe merely because file contents remain unopened. Before the **first** repo-wide `rg`, `rg --files`, `git ls-files`, recursive filesystem walk, or equivalent inventory/search:

1. Declare the complete safe source roots and root files for the task from project routers, manifests, and non-recursive top-level names. Cover every relevant code, docs, tests, configuration, template, skill, overlay, and generated-authority root; name every exclusion.
2. Declare a data-bearing denylist. Apply the repository's authoritative policy when it is stricter, and always exclude at least env-like files (`.env`, `.env.*`), credential/secret roots, sessions/history, uploads, recordings/audio, logs, telemetry, caches, exports, live database files, and customer/provider payload roots.
3. Declare any allowed scrubbed fixture roots separately. Allow only repository-owned, synthetic or verified-scrubbed test fixtures that are relevant to the task; an env-like, credential, key, or live-data file does not become safe because it sits under a fixture directory.
4. Run recursive inventory/search only across **all** declared safe roots and files. Preserve Gate 4 inside that boundary: do not use `head`, capped output, a convenient subdirectory, or early filtering before the complete result set exists. If an additional authority root appears, classify and add it before searching it.
5. If a required root cannot be classified safely, stop before recursive enumeration and escalate the boundary. Never fall back to a home/tool-directory scan or an unscoped repository-root walk.

**Fail-state:** the first inventory starts at `.` or another broad root, prints a path such as `uploads/session/analysis.json`, or silently narrows the safe scan so a caller, feeder, template, test, doc, or overlay authority is missed.

**Killer mutation:** replace the declared-safe-root inventory with a recursive repository-root inventory; the regression must fail when ignored upload, recording, log, telemetry, session, environment, database, export, or provider/customer-payload paths enter the result.

**Counterexample:** a declared `tests/fixtures/scrubbed` root containing synthetic AI-output fixtures remains searchable and must not be rejected merely because it contains representative output shapes.

**Required evidence:** report the declared safe roots/root files, deny classes, separately allowed scrubbed fixture roots, complete match count, and every deliberately excluded source-looking root.

## Workflow

1. Restate the product intent in plain language.
2. Identify the visible bad output or misleading behavior.
3. Name the earliest reliable source of truth that should own the decision.
4. Trace the full pipeline: source evidence, prompt/model decision, validators, repair/retry, persistence, ranking/selection, read models, API/DTO mapping, UI/report/export display, rerun/rebuild path, tests, and docs.
5. If the issue is semantic, build or update a decision matrix:
   - decision inputs,
   - source authority,
   - allowed outputs,
   - disallowed output classes,
   - provenance and grounding requirements,
   - examples and counterexamples.
6. Find stale fallback, compatibility, cache, mapper, or UI reconstruction paths that can keep the wrong answer alive after the upstream fix.
7. Fix the earliest reliable wrong decision. Keep validation as a backstop and feedback signal, not as the main intelligence layer.
8. Verify that the accepted/validated decision reaches the final user-visible output.

## AI And Validator Boundary

AI should make open-world semantic judgments from compact grounded evidence.

Deterministic code should validate schema, grounding, provenance, source authority, policy, permissions, arithmetic, persistence, and display safety.

Do not fix semantic misses primarily with phrase policing, forbidden phrase lists, or deterministic rewrites unless the issue is exact contract, security, or display validation.

When generated output fails validation and regeneration is possible, prefer bounded targeted repair:

1. Send back only the failed field or line.
2. Tell the model exactly what failed, why it failed, and which authority should guide the correction.
3. Revalidate the repaired field.
4. Merge repaired fields into the previous validated-good payload.
5. Move the full validated payload downstream only after the repaired fields pass.

## Common Failure Modes

- A prompt fix does not matter because a mapper, ranker, cache, or UI fallback still uses old truth.
- A semantic layer exists, but accepted candidates do not drive the final copy, ranking, DTO, report, or dashboard.
- Validation silently patches bad AI reasoning instead of teaching a bounded retry.
- A deterministic phrase check becomes the product brain.
- Tests prove a helper or schema exists but not that the final surface changed.
- A rerun refreshes one layer while stale persisted artifacts remain authoritative.
- Generated, suggested, approved, and persisted outputs are not labeled distinctly.

## Proof Ladder

Use the cheapest proof that can answer the current question, then escalate only when needed:

1. Static prompt or contract regression.
2. Local replay against persisted artifacts or fixtures.
3. Targeted unit/integration tests for validators, repair, rankers, mappers, and read models.
4. Source-to-final-output smoke for the UI/API/report/export.
5. One live model/runtime rerun when production generation behavior is the only remaining authority.

## Output

Lead with findings and root cause. Then give the durable fix, affected pipeline stages, tests run or needed, stale paths removed or quarantined, and whether the result fully satisfies product intent or only patches the current failure.
