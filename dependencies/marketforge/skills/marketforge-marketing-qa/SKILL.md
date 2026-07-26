---
name: marketforge-marketing-qa
description: Doc-level audit of MarketForge output. Anti-slop scan, completeness check, contradictions, evidence grades, copy quality, stage-match enforcement. Run before pressure-test. Use as Phase 11 step 3.
---

# MarketForge Marketing QA

Read all shared references, especially `anti-slop-marketing-rubric.md`.

## Global quality rules

- Every claim has an evidence grade.
- Every decision has a DEC-NNN ID.
- Every subskill output has "What we are intentionally NOT doing" section.
- Every page / ad / email has documented awareness-stage target.
- Banned phrases scanned per anti-slop rubric.

## Purpose

Audit the full MarketForge output for:
1. Anti-slop violations.
2. Missing evidence grades.
3. Stage-mismatches (ad copy / LP / CTA misalignment).
4. Contradictions across subskills.
5. Missing "What we're NOT doing" sections.
6. Missing kill criteria.
7. Decision ID duplicates / gaps.
8. Cross-cite validity.

## Inputs
- All subskill outputs under `docs/marketing-plan/`.

## Outputs
- `docs/marketing-plan/auditability/marketing-quality-review.md`
- Findings categorized BLOCK / FIX-NEXT / ACCEPT / WATCH.

## Audit categories

### A. Anti-slop scan
- Banned phrases per `anti-slop-marketing-rubric.md`.
- Taste-words without mechanism.
- Hedged non-decisions ("consider...").
- Three-word-triplet AI cadence.

### B. Evidence grade completeness
- Every statistic has an evidence grade.
- Every framework citation has a grade + source.
- D-grade claims have commercial-bias flag.

### C. Stage-match audit
- Every page declares target stage.
- Every ad campaign declares target stage.
- Copy + CTA matches stage.

### D. Cross-cite integrity
- Every "consumes" cross-cite points to existing DEC-NNN.
- Every "produces" cross-cite is plausible.
- No orphaned decisions (no consumer downstream).

### E. Completeness
- All scoped subskills have completed status.
- All scoped pages have copy.
- All scoped channels have decision cards.

### F. Contradictions
- Channel allocation in `portfolio-construction.md` sums correctly.
- Brand vs performance split in `brand-vs-performance.md` matches budget allocation.
- ICP definitions consistent across subskills.

### G. Required sections
- Every subskill output has "What we are intentionally NOT doing."
- Every subskill output has "Sources and basis."

### H. Kill criteria
- Every channel decision has a kill criterion.
- Every wildcard has 90-day window.
- No compound channel has paid-channel-window kill criterion.

## Findings format

```markdown
# Marketing Quality Review

## Summary
- Run: [date]
- BLOCK findings: [N]
- FIX-NEXT findings: [N]
- ACCEPT findings: [N]
- WATCH findings: [N]
- Overall verdict: PASS / PASS-WITH-NOTES / FAIL

## BLOCK findings

### BL-001: [Finding title]
- **Location:** [file:line]
- **Issue:** [specific]
- **Recommendation:** [fix]
- **Owner subskill:** [which subskill must revise]

[More findings...]

## FIX-NEXT findings

[Similar format; lower priority]

## ACCEPT findings (with user acceptance logged)

[Similar; logged in validation-overrides.md]

## WATCH findings

[Findings worth monitoring but not blocking]
```

## What we are intentionally NOT doing
- Approving slop with override (issues must be addressed or explicitly accepted with rationale).
- Skipping evidence-grade check.
- Treating pass with no BLOCK findings as enough — pressure-test still runs.

## Sources and basis
All shared references, especially `anti-slop-marketing-rubric.md`, `evidence-grading-rubric.md`, `commercial-bias-map.md`.
