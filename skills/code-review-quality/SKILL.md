---
name: code-review-quality
description: Use when reviewing code, auditing a diff, assessing implementation quality, finding bugs, checking maintainability, evaluating maturity, performing differential review, or looking for sharp edges. Combines code-review-and-quality with Trail of Bits review, maturity, and sharp-edge guidance.
---

# Code Review Quality

Review for correctness, product risk, security, maintainability, and test adequacy. Findings come first, ordered by severity and grounded in file/line references when reviewing a codebase.

## The Standing Gauntlet — review the diff against all ten (non-negotiable)

These ten gates mirror the user's global engineering doctrine. They are **always implied** and never need to be asked for. Treat a gate the diff can't affirm as a finding.

1. **Verify, never assume.** Each review claim is traced to the actual changed code/output, not inferred from the PR description or a summary; distrust surprising results and re-check.
2. **Outputs over statuses.** Confirm behavior from the real artifact (persisted row, rendered surface, raw model response), not a passing-test status.
3. **Tests must bite.** Changed behavior has a test that would FAIL if it regressed — not vacuous, stale, or helper-exists-only; name the mutation that should break it.
4. **Whole blast radius — trace every caller and every feeder, in every file.** Every consumer/caller AND every input/feeder of the changed behavior is traced repo-wide and updated; flag partial wiring and any call site in another file left on the old shape/signature.
5. **Replace, don't layer.** A new authority/path deletes or demotes the old one; the old symbol is gone, not orphaned and racing.
6. **No parallel system.** The change extended what already existed instead of standing up a second way to do the same thing.
7. **Best, most durable way.** The fix is root-level, not a symptom patch left in place.
8. **Pressure-test the thing itself.** Does the change build something that needn't exist, belongs elsewhere for better UX, or duplicates existing capability? Over-engineered, or too loose/sloppy on durability/security/edges?
9. **Stop before you quick-fix.** A bug spotted during review is flagged with file:line and root cause, not silently patched mid-review without running the loop.
10. **Clean up after yourself — repoint or remove every trace of the old.** After any delete/replace/rename/change, grep the old name repo-wide: switch every dependent to the new thing (or migrate/remove it on delete), delete every now-orphaned dead path, and leave no dangling reference — in *all* files; nothing still points at the old thing (the reverse of Gate 4).

## Review Priorities

- Behavioral regressions and incorrect logic.
- Authorization, privacy, and data-boundary failures.
- Contract drift between API, persistence, shared types, and UI.
- Missing edge cases, error paths, loading states, and compatibility paths.
- Over-complexity, dead code, duplicated logic, and brittle abstractions.
- Missing or weak tests for changed behavior.

## Use References

- General review process: `references/code-review-and-quality.md`
- Code maturity assessment: `references/code-maturity-assessor.md`
- Differential review methods: `references/differential-review.md`
- Error-prone patterns and sharp edges: `references/sharp-edges.md`

## Reference integrity (blocking)

Every relative file named by this skill or its bundled references must exist before it is treated as
review guidance. A missing reference is unavailable guidance, not permission to assume its contents.
Use the nearest self-contained checklist that was actually loaded, then repair or remove the stale
reference in the canonical skill bundle before declaring the review complete.

- **Fail-state:** a reviewer claims to have followed a methodology, language guide, template, agent, or
  checklist whose referenced file is absent.
- **Regression mutation:** add a relative Markdown link or backticked `.md` reference to a nonexistent
  file anywhere under this skill; the reference-integrity scan must fail.
- **Counterexample:** external citations and plain example filenames explicitly labeled illustrative do
  not need to resolve locally.
- **Validation:** run `pwsh -File scripts/check_reference_integrity.ps1` and require exit 0; separately
  re-read all four references listed above through EOF.

## Output

Lead with actionable findings. Include impact, evidence, likely root cause, and durable fix. If there are no material findings, say so and list residual risk or test gaps.
