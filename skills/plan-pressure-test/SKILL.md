---
name: plan-pressure-test
description: Use when REVIEWING, pressure-testing, or tightening an EXISTING plan (yours or another agent's) before implementation. Trigger when the user asks to review a plan, pressure test a plan, find gaps before coding, check a plan's blast radius, confirm it is root-cause rather than symptom patch, or keep tightening until no gaps remain. To author a new plan from scratch, use full-slice-planner.
---

# Plan Pressure Test

Use this skill before implementation. The job is to make the plan hard to misread, hard to underbuild, and hard to overbuild.

## The Standing Gauntlet — run on every plan (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. If the plan can't satisfy a gate, it is not ready — keep tightening or flag which gate fails.

1. **Verify, never assume.** Every load-bearing claim the plan rests on is traced to the actual code/data/output; a report, doc, recalled fact, or status line is a *lead*, not proof.
2. **Outputs over statuses.** Proof comes from the real artifact (persisted row, rendered surface, raw model response); distrust a green test or a grep returning 0 and re-check a different way.
3. **Tests must bite.** Each planned test must FAIL if the behavior regresses — name the mutation that should break it; reject vacuous or stale tests.
4. **Whole blast radius — trace every caller and every feeder, in every file.** Trace the dependency graph both ways — every consumer/caller/usage site AND every input/feeder of the behavior, grepped repo-wide — and update each. Fixing a function = finding and updating every call site in every file, not just the definition.
5. **Replace, don't layer.** A new central/unified authority deletes or demotes the old path it supersedes; the plan greps the old symbol to prove it's gone, not orphaned.
6. **No parallel system.** Confirm the thing isn't already built somewhere unchecked; extend the existing abstraction instead of standing up a second one.
7. **Best, most durable way.** Weigh an alternative; choose the stable/durable/secure/scalable root fix over the convenient symptom patch.
8. **Pressure-test the thing itself.** Does it need to exist? Could it live elsewhere for better UX? Already built? How do comparable products solve it? Over-engineered, or too loose/sloppy? Security and other load-bearing concerns weighed?
9. **Stop before you quick-fix.** Any bug found mid-work: verify it's real → check if already fixed/mis-wired or legacy-to-delete → pressure-test its purpose → hypothesize → verify the fix is best → verify assumptions → run the rest of the gauntlet → then implement or flag. Never patch in place on reflex.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## Required Review Shape

Start by restating the real product, user, business, or system intent in plain language. Name what must become true after the work.

Then audit the relevant pipeline end to end:

`source data -> decision logic -> validation -> persistence -> API/DTO -> mapper/adapter -> UI/output -> downstream consumers -> tests/docs`

Do not accept a plan that fixes only the visible symptom when the product intent depends on upstream authority, downstream consumption, or state lifecycle.

## Pressure Questions

Answer these before approving or rewriting the plan:

1. Is this issue localized, or is it a symptom of a larger architecture/source-of-truth problem?
2. What caused the issue? What mistake in architecture, logic, data flow, UI, process, prompt, validation, or testing allowed it?
3. Where else could the same mistake exist?
4. What should exist to prevent this class of issue from happening again?
5. Is the proposed fix the best root fix, or is there a more durable path?
6. Does every load-bearing claim the plan rests on — a `file:line`, an "only caller," a "this is already wired," a "safe to delete," a "removing X leaves the fallback intact," a "the field exists on that type" — hold up against the ACTUAL code, checked directly rather than taken from a sub-agent's exploration, a doc, or memory? A sub-agent's report is a lead, not proof; a wrong load-bearing fact yields a confident plan that is wrong in a way its own review will not catch, because every later step trusts the bad fact. Verify the claims the plan actually leans on; you need not re-check every incidental detail.
7. Does the thing being planned even need to exist (Gate 8)? Could it live elsewhere — a different surface, layer, or step — for better UX? Has it already been implemented somewhere not yet checked, so this would be a parallel system? How do comparable products solve this, and is there a more standard, durable shape to borrow?
8. Is the plan over-engineering — building machinery the product doesn't need yet — or being too loose/sloppy, skipping the durability, security, or edge handling it genuinely needs? Name the durable-but-minimal middle. Avoid both the symptom patch and the unrelated rewrite.
9. When the implementer hits a bug or oddity mid-build, does the plan tell them to stop and run the mid-task loop (verify it's real → already fixed/mis-wired or legacy-to-delete → pressure-test purpose → hypothesize → verify the fix is best → run the rest of the gauntlet → implement or flag) rather than quick-patching in place?

## Blast Radius

Check all that apply:

- producers,
- validators,
- business logic,
- prompts or AI layers,
- persistence and migrations,
- APIs and shared contracts,
- mappers and adapters,
- frontend or final output,
- dashboards, reports, exports, and aggregates,
- background jobs, queues, retries, and reprocess flows,
- tests, smokes, fixtures, and docs,
- rules, runbooks, or future-agent guardrails.

Stay inside the product-intent, data-flow, and trust boundary. If unrelated issues appear, document them separately.

## AI And Semantic Judgment

If AI or semantic judgment is involved:

- AI should make meaning-based judgments from grounded evidence.
- Code should validate schema, grounding, provenance, permissions, source authority, policy, arithmetic, persistence, and display safety.
- Do not solve semantic failures with brittle hardcoded phrase rules unless the issue is exact policy, security, formatting, or validation.

If needed, require a decision matrix with:

- inputs,
- source authority,
- allowed outputs,
- disallowed outputs,
- examples,
- counterexamples,
- uncertainty states,
- validation rules,
- repair or fallback path,
- downstream permissions.

## Edge Cases

Think through stale data, missing data, revoked permission, duplicate trigger, provider unavailable, retryable failure, terminal evidence, archived parent, legacy compatibility, partial migration, concurrent mutation, and user-visible limited/unavailable states.

For external or user-supplied data adapters such as imports, parsers, webhooks, uploads, exports, feeds, or provider payload mappers, also pressure-test realistic messy inputs and unsafe structure: aliases or descriptive field names, malformed syntax, duplicate or normalized-duplicate keys, missing required structure, extra columns or fields, size/count limits, unsupported formats or encodings, and privacy-sensitive fields that must not leak.

When a plan says a commit, import, webhook, dispatch, provider callback, checkout, or status transition is idempotent, require proof for both sequential retry and concurrent duplicate triggers. A UI-disabled button, optimistic client state, or pre-read status check is not enough; the plan should name the durable guard such as a unique key, row lock, claim step, provider event ID, or equivalent persisted evidence.

When a plan changes route names, API paths, server actions, jobs, exports, public URLs, or provider callback URLs, require a docs/implementation-artifact inventory check against actual route files or build output. Stale documented paths are a future implementation bug, not harmless prose drift.

## Work Tracking

For feature work, big slices, cross-session work, or audit-remediation passes, use `github-project-work-tracking` when GitHub Projects are available. Track status separately from the plan: a plan under pressure test is `Review/Verification`, not `Done`, and a first implementation pass must not be marked `Done` until proof and acceptance are clear.

## Output

Give:

1. The improved plan.
2. Definition of done for each phase.
3. Tests and proofs for each phase.
4. What should not be done because it would cause drift or future bugs.
5. Similar vulnerabilities or related risks to document or fix later.

Keep pressure-testing until no material gaps, missing parts, tightening points, or improvement points remain. If the plan is already strong, say so and name the residual risk.
