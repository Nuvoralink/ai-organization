---
name: implementation-review-against-plan
description: Use after code or docs were implemented from a plan to verify the actual diff satisfies the original product intent, phase definitions of done, tests, blast radius, and final user-visible or system-visible behavior. Trigger when the user asks to review implementation against the plan, check whether the intent was fully implemented, find missed downstream consumers, or confirm the code did not only add helpers without wiring them to output.
---

# Implementation Review Against Plan

Use this skill after implementation, before calling work done.

## The Standing Gauntlet — review the diff against all eleven (non-negotiable)

These eleven gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. The diff is not done until it can affirm each gate; otherwise list which gate failed and what it needs.

1. **Verify, never assume.** Every claim in the review ("X is wired," "Y is consumed," "Z is deleted") is traced to the actual changed code/output, not inferred from the plan or a summary.
2. **Outputs over statuses.** Confirm behavior from the real artifact (persisted row, rendered surface, raw model response), not a passing-test status; distrust a green test or a grep returning 0 and re-check differently.
3. **Tests must bite.** Each test exercises the path that matters and would FAIL if it regressed — not a helper-exists or shape-only assertion; the primary path disabled should break at least one test.
4. **Whole blast radius.** Every producer and every downstream consumer/wiring named in the plan is actually updated — look for partial wiring (new field not consumed, helper not called, DTO updated but UI reconstructs).
5. **Replace, don't layer.** The old path the change supersedes was deleted or demoted in the same change; grep the old symbol to confirm it's gone, not orphaned and racing.
6. **No parallel system.** The change extended what already existed rather than standing up a second way to do the same thing.
7. **Best, most durable way.** The implemented fix is the root fix, not a symptom patch left in place.
8. **Pressure-test the thing itself.** Did the change build something that needn't exist, belongs elsewhere for better UX, or duplicates existing capability? Is it over-engineered, or too loose/sloppy on durability/security/edges?
9. **Stop before you quick-fix.** If this review surfaces a NEW bug, do not patch it on the spot — run the mid-task loop (verify it's real → already fixed/mis-wired or legacy-to-delete → pressure-test purpose → hypothesize → verify the fix is best → run the rest of the gauntlet → implement or flag).
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).
11. **Relational, never hardcoded.** Values that encode a relationship—routes, keys, enum strings, thresholds, duplicated constants, response assumptions, design values, positions, or sizes—must derive from their owning contract, registry, token, or layout relation. A literal belongs only at the source that defines it. *Fail-state:* the reviewed diff inlines a leaf-level value that silently duplicates or assumes another authority and no gate fails when that authority changes.

Regression mutation: review a diff that hardcodes a shared route, retry limit, or
design value at a consumer instead of referencing its authority; the review must
report Gate 11 as failed. Counterexample: a literal at the canonical registry or
token definition remains allowed when it is the source rather than a duplicate.

## Review Goal

Verify the implementation made the intended product/system truth real. Do not stop at "the code changed" or "the helper exists." The accepted source of truth must reach the final output and the tests must prove the right behavior.

## Workflow

1. Restate the original product intent and plan promise.
2. Map the plan phases to actual changed files.
3. Trace the implemented path end to end:
   `source data -> decision logic -> validation -> persistence -> API/DTO -> mapper/adapter -> UI/output -> downstream consumers -> tests/docs`
4. Check whether each phase definition of done is actually satisfied.
5. Look for partial wiring: new fields not consumed, helpers not called, prompts updated but rerun path stale, DTOs updated but UI still reconstructs, tests covering scheduled/current rows but not stale/retryable rows.
6. Check whether the implementation created new authorities, duplicated logic, stale compatibility paths, or hidden fallbacks.
6a. **Replace, don't layer (consolidation gate).** If the change introduced a new / central / unified / single version of something — an authority, classifier, source of truth, validator, or code path — verify the OLD path it supersedes was DELETED or explicitly demoted to a single named non-authoritative role *in the same change*, not left running alongside the new one. **Grep the old symbol/path.** If two producers of the same authoritative output still exist and either can win, the consolidation is INCOMPLETE: they race and the wrong (often less-informed) one wins on some input. "Added the new X" is not done until "the old X is gone, or reduced to exactly one named non-authoritative role with the reason stated." Also check the inverse: a new soft/non-blocking path added while the old blocking gate still fires (e.g. a guard converted to a signal in one validator while the old rejecting copy still runs in another).
7. For external or user-supplied data adapters, verify realistic messy fixtures and unsafe structure, not only canonical happy-path inputs. Check aliases or descriptive field names, malformed syntax, duplicate or normalized-duplicate keys, missing required structure, limits, unsupported formats or encodings where applicable, and privacy leakage.
8. For any claimed idempotent mutation, verify both sequential retry and concurrent duplicate-trigger behavior. Confirm a durable guard exists, such as a database uniqueness constraint, row lock, claim step, provider event ID, or equivalent persisted evidence.
9. If routes, API paths, server actions, jobs, exports, public URLs, or provider callback URLs changed, compare actual route files or build output to docs/implementation artifacts. Treat stale path docs as implementation defects.
10. Verify final user-visible or system-visible behavior with the narrowest meaningful tests/smokes.

## Work Tracking

For feature work, big slices, cross-session work, or audit-remediation passes, use `github-project-work-tracking` when GitHub Projects are available. If the review finds material gaps, move the item back to `In Progress` and list the gaps. Mark `Done` only after the implementation satisfies the plan, proof is complete, and the user accepts it or clearly moves on after verified completion.

## Findings To Look For

- The root cause remains because only the visible symptom was patched.
- One downstream consumer was fixed but canonical output still uses old truth.
- Validation masks bad generation instead of feeding bounded repair.
- Persistence or read models are updated but API/DTO/frontend is not.
- UI copy changed while source authority stayed wrong.
- A migration/backfill/reprocess path is missing.
- Tests prove helper behavior but not final behavior.
- Docs/rules claim a guarantee that tests do not enforce.
- External-adapter tests use only clean canonical inputs and miss realistic messy user/provider data.
- "Idempotent" means retry-after-success only; concurrent duplicate submit/replay can still create duplicate rows, charges, messages, exports, or claims.
- Docs or implementation artifacts still name old routes, callbacks, jobs, or public URLs after the code moved.
- A consolidation / new-authority change LAYERED the new path on top of the old one instead of replacing it — two producers of the same authoritative output now race, and the wrong (often less-informed) one wins on some input. Grep the old symbol/path; if it still runs and can win the consolidation is incomplete. (Inverse: a new non-blocking/soft path added while the old blocking gate is still wired and firing.)
- The change stood up a parallel system — a second component/helper/endpoint/pattern beside one that already solved this — instead of extending the existing abstraction (Gate 6).
- The change is over-engineered (machinery the product doesn't need yet) or, conversely, too loose/sloppy (skips durability, security, or edge handling the feature genuinely needs). Either misses the durable-but-minimal middle (Gate 8).
- Something was built that didn't need to exist, or belongs on a different surface/layer/step for better UX (Gate 8).
- A bug surfaced during review was quick-patched in place instead of run through the mid-task loop (Gate 9).
- A consumer hardcodes a route, enum, threshold, response-shape assumption, or design value that should derive from its owning authority (Gate 11).

## Output

Lead with findings ordered by severity and file/line references when available. Then give:

- plan items satisfied,
- plan items missed or only partially satisfied,
- root cause coverage judgment,
- extra risks introduced,
- required fixes,
- tests/proofs run or still needed,
- final answer to: "Does this fully satisfy product intent, or only patch the current failure?"
