---
name: marketforge-bias-audit
description: Flag every cited claim with commercial bias per commercial-bias-map.md. Triangulate D-grade and E-grade citations before adoption as decision drivers. Use as Phase 11 step 5.
---

# MarketForge Bias Audit

Read `commercial-bias-map.md` and `evidence-grading-rubric.md`.

## Global quality rules

- Every D-grade claim must have commercial-bias flag.
- Every D-grade claim that drives budget allocation must be triangulated.
- Every E-grade claim is folklore; never cited as fact.
- Flag inline, gently — don't lecture.

## Purpose

Scan the full MarketForge output for:
1. Vendor-promoted claims without bias flag.
2. Frameworks cited without source + date.
3. D-grade or E-grade claims driving decisions without triangulation.
4. Stale claims (pre-iOS-14, pre-AIO, pre-HARO-shutdown).

## Inputs
- All subskill outputs.

## Outputs
- `docs/marketing-plan/auditability/bias-audit.md`

## Audit categories

### A. Vendor claims without bias flag
[For each citation from a vendor-adjacent source, verify commercial-bias-flag is present.]

### B. Framework citations without source + date
[For each framework citation, verify primary source + date is given.]

### C. D-grade claims driving budget allocation
[For each D-grade claim that influences a budget decision, verify triangulation against independent source.]

### D. Stale claims
- Pre-iOS-14.5 attribution claims.
- Pre-AIO SEO claims.
- HARO references (shuttered late 2024).
- Pre-Andromeda Meta creative claims (2024 and earlier).

### E. Counter-evidence missing
- Where V3 guide flags counter-evidence (e.g., NetLine 35.2% counter to 95-5), is it presented?

## Findings format

```markdown
# Bias Audit

## Summary
- Total claims audited: [N]
- D-grade claims: [N]
- E-grade claims (folklore): [N]
- Missing bias flags: [N]
- Stale claims: [N]
- Verdict: PASS / PASS-WITH-NOTES / FAIL

## Findings

### BA-001: D-grade claim without bias flag
- **Location:** [file:line]
- **Claim:** "[text]"
- **Source:** [vendor]
- **Recommendation:** Add commercial-bias flag per commercial-bias-map.md.

[More findings...]
```

## What we are intentionally NOT doing
- Refusing to cite vendor data (much vendor data is real; flag, don't ban).
- Over-flagging (when bias is minimal).
- Lecturing the reader.

## Sources and basis
`commercial-bias-map.md`, `evidence-grading-rubric.md`.
