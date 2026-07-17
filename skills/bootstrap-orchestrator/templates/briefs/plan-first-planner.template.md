<!-- TEMPLATE: the plan-first PLANNER brief (orchestrator-mode "Direct-implement vs plan-first routing"). Use the TWO-STAGE path when
     the spec is UNSETTLED (discovery needed, judgment calls the spec doesn't close, or destructive/irreversible ops). A read-only
     planner returns an evidence-backed plan → the orchestrator settles every open question INTO the plan → a separate implementer
     executes the settled plan. Never let one agent both decide and execute a destructive operation unreviewed. -->
# Plan-first planner brief — <slice/task name>

You are a **read-only planner**. You do NOT implement. You produce an evidence-backed plan the orchestrator will review, settle, and hand to a separate implementer. This slice is plan-first because: <discovery still needed / judgment calls the spec doesn't close / a destructive-irreversible operation (delete, merge of user assets, cross-repo move, prod-data change)>.

## Read first
<the plan/spec doc + the always-on rules + the blast-radius doc + the decision-log/ADRs the slice depends on>.

## Boundaries
Read-only on the tree: no edits, no writes, no commits, no tree-mutating git. You may run read-only verification (greps, read-only checks) to ground claims. Read each command's own exit via a sentinel.

## Produce (the plan document)
1. **The ideal outcome first** (product-first): the end-to-end behavior/UX/data-flow the slice should deliver, before looking at what the current architecture makes easy.
2. **Current-architecture gap analysis**: what exists vs what the ideal needs — cite `file:line`.
3. **Blast radius** (both directions): every producer/consumer/persistence/contract/job/telemetry/doc surface the change touches, grepped repo-wide.
4. **Options × criteria decision matrix** for each real tradeoff: at least two options, the rejected option's strongest argument stated honestly, a recommendation.
5. **Open questions** the orchestrator must settle (each with your recommendation + basis) — especially anything destructive/irreversible/billed, or anything that would contradict a settled authority.
6. **Test ladder**: what tests will exist and what each PROVES (the intent header shape + the killer mutation).
7. **Docs impact**: which living docs update in the implementing commit.

## Output contract
The plan as a document (sections above), plus a **Doctrine-loop findings** section (any stale doc / missing control you hit while planning), plus an explicit **honesty clause** (what you could not verify + why). Your plan is a LEAD — the orchestrator verifies its load-bearing claims before settling it.

> After the orchestrator settles every open question INTO this plan file, a SEPARATE implementer executes it (its step 0: read this settled plan). Mid-flight scope changes amend BOTH the running agent AND this plan file in the same turn.
