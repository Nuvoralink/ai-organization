---
name: spider-debugging-methodology
description: Use for broad debugging, bug hunts, regression sweeps, data-integrity complaints, AI/prompt decision issues, stale-state investigations, rerun/reprocess validation, backlog cleanup, or "find similar problems" requests where Codex must find root cause, expand blast radius from each discovered issue, fix upstream, update docs/rules/guardrails, and verify the final user-visible or system-visible output instead of shipping a narrow symptom patch.
---

# Spider Debugging Methodology

## Intent

Run this skill when a bug may be a symptom of a wider mistake pattern across data movement, AI or rules decisions, scoring, ranking, persistence, queues, read models, APIs, UI, reports, jobs, or docs. Treat each real bug as evidence of a possible class of failures.

Find the first wrong decision, fix it at the earliest reliable layer, then search outward for sibling failures before stopping.

## The Standing Gauntlet — run on every bug and every fix (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. No fix ships until it can affirm each relevant gate.

1. **Verify, never assume.** Trace the cause to the line that produces it; a report, doc, recalled fact, or status line is a *lead*, not proof. State a cause only when traced; else label it "unconfirmed" and go get the evidence.
2. **Outputs over statuses.** Read the persisted row / rendered surface / raw model response yourself; distrust a green test or a grep returning 0 and re-run a different way.
3. **Tests must bite.** Regression coverage for the bug's class must FAIL on the unfixed code — name the mutation; reject vacuous or stale tests.
4. **Whole blast radius.** Find every sibling instance of the same mistake pattern across producers, validators, rankers, mappers, read paths, jobs, caches, UI fallbacks, reports, tests, docs.
5. **Replace, don't layer.** If the fix introduces a new authority/path, delete or demote the old one it supersedes; grep the old symbol to prove it's gone, not orphaned.
6. **No parallel system.** Don't add a second fix beside an existing solution that was merely mis-wired — wire or delete the existing one instead.
7. **Best, most durable way.** Fix at the earliest reliably-correctable layer; keep downstream checks as backstops, not the main intelligence. Root fix over symptom patch.
8. **Pressure-test the thing itself.** Is the failing piece even supposed to exist? Is it legacy/vestigial that should be deleted? Could it live elsewhere? Over-engineered or too loose/sloppy? Security weighed?
9. **Stop before you quick-fix.** This is the skill's core discipline — see Bug Thinking Questions. Never patch a mid-task discovery in place on reflex.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## Operating Loop

Repeat this loop until the remaining risk is low enough to name clearly:

1. State the product intent in plain language.
2. Identify the visible symptom and the user harm.
3. Trace the pipeline end to end: source evidence, decision logic, AI prompt/model if present, validators, repair/retry, persistence, derived rows, read models, ranking, DTO/API mapping, UI/report/export display, tests, docs, and rerun/reprocess path.
4. Find the earliest layer that made or allowed the wrong decision.
5. Decide whether the issue is localized, a symptom of a larger model, or caused by the wrong architecture pattern.
6. Fix the root layer first. Keep downstream checks as validation/backstops, not as the main intelligence.
7. Spider outward: search for the same mistake in sibling prompts, validators, rankers, mappers, read paths, queues, jobs, caches, UI fallbacks, reports, tests, scripts, and docs.
8. Add or update regression coverage for the general class, not only the observed phrase or session.
9. Update the relevant project docs, rules, backlog, runbooks, or guardrails when the bug reveals a missed relationship or prevention rule.
10. Verify the user-visible or system-visible consequence with targeted tests/builds and, when needed, a rerun/reprocess against persisted artifacts.

## Bug Thinking Questions

For every real bug or concern, answer these before settling on the fix:

- **Did I run the mid-task loop before touching it (Gate 9)?** The reflex in-place patch is the exact symptom fix this whole skill exists to prevent. Before settling on ANY fix: (a) verify it's actually a problem (reproduce/trace it to the line); (b) check whether it's already fixed elsewhere and only mis-wired here, or legacy that should have been deleted; (c) pressure-test its purpose — does it need to be there; (d) hypothesize a fix; (e) verify that fix is the best/most durable one; (f) verify my assumptions; (g) run the rest of the gauntlet — then implement, or flag it (file:line, what's wrong, why, suggested fix) if it's bigger than this bug's scope.
- Is this localized, or is it a symptom of a broader architecture or decision-model problem?
- What caused the bug? What design or implementation assumption was wrong?
- Where else could the same mistaken assumption appear?
- What documentation, rule, skill, or blast-radius map should prevent repeating it?
- Does the fix fully satisfy the product intent, or only patch the current failure?

## AI And Prompt Decision Rules

When the bug involves AI-generated, semantic, ranking, recommendation, summarization, or classification output:

- Make the AI perform open-world meaning judgments from compact grounded evidence.
- Use deterministic code for schema, grounding, provenance, authority, policy, persistence, and display integrity.
- Build or improve a decision matrix with inputs, source authority, allowed outputs, disallowed outputs, provenance requirements, examples, and counterexamples.
- If you trace the bug through a prompt that decides MEANING by keyword/phrase matching where the AI should be judging by FUNCTION (and a fresh phrasing the prompt never listed would slip past it), treat it as a fix-small-or-flag moment — a prompt that decides meaning by keywords is a latent instance of the same class of bug you are chasing, so don't walk past it. If teaching the intent — what each option is *doing* in context, with examples and counterexamples (especially the look-alikes a keyword reading flips) — is small, safe, and inside this bug's blast radius, add it. If it is a larger prompt redesign out of scope, call it out specifically (file:line, what intent teaching is missing, why a new phrasing breaks it) and route it to the backlog. (Reach for the intent frame only where the decision turns on meaning; skip prompts whose decision is structural or where a keyword cue is genuinely enough. Full guidance: `ai-decision-contract-builder`.)
- Avoid hardcoded phrase policing as the main solution. Phrase checks can be validator evidence or regression fixtures, not the product brain.
- If validation finds a bad AI field or line, prefer bounded targeted retry with the failed field, why it failed, and the correct authority. Merge repaired fields back into validated-good JSON.
- If a prompt/model-contract change is the actual fix, remember that downstream-only rebuilds may not validate it. Use the rerun path that regenerates the structured decision and visible copy when final proof depends on generation.

## Persisted State Rules

When the bug involves derived rows, queues, jobs, dispatch rows, retry rows, provider evidence, caches, projections, aggregates, or rows that can later act or make visible claims:

- Do not test only the fresh/current/scheduled row.
- Check stale, queued, processing, retryable failed, terminal, completed, canceled, skipped, and test-only states where applicable.
- Prove stale or ineligible rows cannot create future side effects after the source of truth changes.
- Preserve terminal evidence through repair/reconciliation.
- Verify final surfaces display the rebuilt authority rather than stale compatibility fallback.

## Blast Radius Rules

Check the repo's architecture, blast-radius, testing, and agent-rule docs before non-trivial work when they exist.

Update those docs in the same pass when the bug exposes a missing relationship, such as a source decision that also affects rankers, mappers, stale-field rejection, dashboards, reports, permission gates, queues, or rerun/reprocess behavior.

## Verification

**Verify from the actual output, never from a report or an assumption.** A sub-agent's finding, a status line, a passing test, or a remembered fact is a *lead*, not proof — read the persisted row / rendered surface / raw model response yourself before you believe a root cause or accept a fix. **Distrust surprising results:** a grep that returns 0, a green test, or a "done" status is as likely a tooling/test artifact as a truth — re-run it a different way and read the raw bytes (a gitignored or pretty-printed file silently returns 0 matches; a test can pass without ever exercising the path that breaks; a guard can look "too strict" when the real fault is an upstream input). If you state a cause, you traced it to the line that produces it; if you can't, label it "unconfirmed" and go get the evidence before building on it.

Choose proof based on the affected pipeline:

- Prompt/semantic/AI contract: run targeted regressions, static prompt-contract tests, and source-to-output replay.
- Persistence/read model: run mapper, projection, idempotency, and stale-state regressions.
- Frontend/report display: run component tests and build; use authenticated or role-aware smoke when route behavior changes.
- Shared contracts: build shared packages before consumers that import them.
- Live correctness: after deploy, rerun or reprocess only when local persisted replay cannot prove the runtime behavior.

## Prompt Testing Ladder

Use the cheapest proof that can answer the current question, then escalate only when needed:

1. Static prompt-contract regression: cheapest. Proves required matrix, rules, schema, and examples exist and prevents accidental prompt drift.
2. Local replay with persisted artifacts: cheap. Proves data wiring, validators, repair logic, persistence, ranking, and mapper/display behavior against real stored inputs.
3. Subagent qualitative eval: cheap-ish. Use a subagent with the same prompt packet and representative input to check whether the prompt is understandable, produces plausible JSON shape, avoids wrong fields, and follows the intended decision matrix. Treat this as near-authority rehearsal, not production truth.
4. Real app-model rerun: authoritative. Use after bundling multiple fixes when final proof depends on the production model, routing, structured-output behavior, retries, metering context, or deployed runtime.

Subagent eval is especially useful before spending app API calls, but do not treat it as final proof for production generation. If the subagent finds bad JSON, wrong fields, or wrong semantic interpretation, fix the prompt/contract first, then rerun the cheaper gates before doing the final authority rerun.

End with a concise status: what was fixed, what was verified, what remains, and whether a rerun/deploy is required.
