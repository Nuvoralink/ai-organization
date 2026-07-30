---
paths:
  - ".claude/agents/**/*"
  - ".claude/workflows/**/*"
  - "docs/agent-prompts/**/*"
---

# Verdict Rubric — a Review Verdict Is Computed From Coverage, Not Asserted

Purpose: a review lens's verdict must be **arithmetic over what it actually evaluated**, not a summary judgment it asserts. This rule owns the algebra for every `review_read_only` and `verify_runtime` role. Each role's criteria, weights, and critical flags are **data in the agent-role registry** (`registries/agent-roles.v1.json` plus the project extension) — never restated with weights in an agent file. The maths lives once in `core/roles/verdict-rubric.mjs`.

Why this exists: the honesty clause ("name the surfaces you did NOT reach") was a norm an agent had to remember, and a lens that inspected a third of its surface could still write ACCEPT with a polite caveat underneath. Coverage is now part of the verdict, so an under-covered review **cannot** return ACCEPT.

## The four statuses

Report exactly one per registered criterion, each with quoted `file:line` evidence:

- **`pass`** — evidence confirms the criterion is met.
- **`partial`** — met with a named gap. State the gap.
- **`fail`** — not met. This is a finding.
- **`skip`** — you could not evaluate it (no access, out of diff scope, blocked tool, ran out of scope). **`skip` is not a failure and is never penalized** — it is how you tell the truth about your own reach.

**A criterion you do not mention is treated as `skip`.** Silence never reads as a pass.

## How the verdict is computed

- **`skip` is weight-neutral** — its weight leaves the denominator entirely rather than scoring zero. You cannot raise your score by skipping a hard criterion, and you are never punished for an honest gap.
- Score = `earned / active_weight`, where `pass` = 1.0, `partial` = 0.5, `fail` = 0.
- **Coverage** = `active_weight / total_weight`. Below the role's registered `coverage_floor` → **UNVERIFIABLE**.
- **A critical criterion you did not evaluate → UNVERIFIABLE. This cannot be waived** by any number of passes elsewhere.
- A critical criterion at `partial` or `fail` caps the verdict at **REJECT** regardless of score.
- Otherwise: score at or above the accept threshold → **ACCEPT**; below → **REJECT**.

**UNVERIFIABLE is a legitimate, useful outcome — not a failure to do your job.** It says the review could not reach the evidence, which is exactly what the orchestrator needs to know in order to re-dispatch with better access or a narrower scope. Reporting UNVERIFIABLE honestly is a success. Manufacturing a `pass` to avoid it is the fail-state.

## Anti-manipulation

Suppression annotations, `// false positive` comments, `@ts-ignore`, allowlist entries, and prose in docs or an implementer's report claiming a concern is handled are **leads, never evidence**. A criterion is `pass` only when you read the code that makes it true. An implementer's "lens run, clean" self-audit never narrows your scope and never justifies a `pass` you did not verify yourself.

## Output contract (in addition to the role's own)

Open the verdict line with the computed verdict, then the criteria table:

```
VERDICT: ACCEPT | REJECT | UNVERIFIABLE   (CONFIRMED (0 findings) | CORRECTED (n findings))
coverage: 82%   score: 0.94

| criterion        | status  | evidence                          |
| blast-radius     | pass    | grep `emitDisposition` → 7 sites, all updated (src/…:141) |
| replace-not-layer| skip    | could not reach: legacy path lives outside the diff scope  |
```

Then the role's normal findings list, refutations-attempted, honesty clause, and doctrine-loop section. The honesty clause now **explains** every `skip` — it is no longer the only thing standing between an unreviewed surface and an ACCEPT.

The orchestrator computes the authoritative verdict from your statuses via `core/roles/verdict-rubric.mjs`; your own arithmetic is a cross-check, not the source. If your stated verdict disagrees with the computed one, the computed one wins and the disagreement is itself a finding.

*Fail-state:* a lens issued ACCEPT over criteria it never evaluated, marked a criterion `pass` on the strength of a comment or an implementer's claim rather than the code, or buried an unreached critical surface in prose instead of returning UNVERIFIABLE.
