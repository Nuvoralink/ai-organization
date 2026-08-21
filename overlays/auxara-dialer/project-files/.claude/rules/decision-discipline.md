---
paths:
  - "**/*"
---

# Decision Discipline — Dialer Adapter

**The universal `decision-discipline` rule governs in full** (always-on at user level; Codex twin in `~/.codex/AGENTS.md`). This adapter does not restate its ladder — it only binds it to the dialer's authorities and escalation triggers below.

## Rung 1 — the dialer's authority set (check BEFORE deciding anything)

Most "decisions" are already made. The settled truth for this repo lives in: the decision log (`docs/app-plan/auditability/decision-log.md`), the ADRs (`docs/app-plan/architecture/adr/`), the app-plan product/architecture docs (`docs/app-plan/product/01-product-brief.md`, `02-prd.md`, `03-feature-scope.md`, `architecture/06-architecture.md`), the always-on rules, the central registries (centralization-doctrine §1), the blast-radius maps, and the brief itself. Implementing against these is not a decision, and deviating from them is a STOP, not a choice.

When an explicit approved decision changes a dialer premise, replace the current authority rather than layering chronology. Rewrite the existing decision-log row or ADR current-decision section and every living projection in the same change: product/PRD/sprint docs, source-of-truth and blast-radius maps, Project #7 card/issue fields and body, backlog/briefs, tests, config, and implementation. Delete the retired claim from live prose; Git history or a clearly isolated archive retains provenance. A “latest BIL-* controls,” dated amendment chain, supersession banner, duplicate decision ID, or new Project card beside the stale one is not an acceptable resolution. Verify the change is an approved decision rather than an implementation accident, then run an old-claim sweep and reread every mutated Project item. Ambiguity or any apparent weakening of a compliance/security invariant escalates.

## Rung 2 — competitive / review research has a source authority; read it before fetching

`docs/runbooks/competitive-review-research.md` owns which review sites are actually reachable (Capterra is the only source returning attributed review bodies, and only with explicit `?page=N` pagination plus a name-the-reviewer prompt; TrustRadius, Gartner, G2, Trustpilot and Reddit hard-block us), how small-business targeting survives TrustRadius being unreachable, and the coverage-bounding contract. Read it before any competitive/incumbent-sentiment/ICP review pass — not after burning attempts on a blocked source.

**A summariser's completeness claim is NOT the researcher's coverage claim.** Every NOT-FOUND from a paginated source is bounded to the pages actually retrieved ("not found in pages 1–5 of an unknown total"), and a summariser's totality language ("all 919 reviews") is never repeated as your own coverage. This is the research instance of loop-discipline's verify-the-finding-at-the-level-of-the-claim-you-ship; the bound travels with the claim into the brief, the decision row, and the founder-facing report.

## Rung 4 — escalation triggers specific to this product

Beyond the universal triggers (options still close after research, high blast radius, one-way doors), the dialer adds domains where a silent guess is never acceptable: **compliance** (TCPA/CASL calling hours, DNC, recording disclosure, STIR/SHAKEN, 10DLC), **carrier/number state**, **billing**, and **tenant isolation**. Any choice implicating these escalates to the orchestrator with the decision matrix + your recommendation attached.

## §3 — recording

Every non-trivial mid-task decision appears in the report-back (what was decided, options considered, basis, what would invalidate it later); architectural decisions additionally go to the decision log / an ADR per sprint-rigor §2c.

*Fail-state:* an agent picked an approach mid-task without checking the dialer authorities above, left a stale decision or Project projection live beside its replacement, required readers to resolve policy by chronology, shipped an unbounded page-1 absence claim as whole-corpus evidence, or shipped the choice without research/a visible matrix/reporting — the orchestrator discovered it only by reading the diff.
