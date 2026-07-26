---
name: marketforge-pressure-test
description: Red-team the marketing plan. Would this fail in 90 days? Channel bet density, AI-saturation watch, channel-decay risk, attribution honesty, founder-fit, copying-bigger-companies anti-pattern. Use as Phase 11 step 4. Returns BLOCK / FIX-NEXT / ACCEPT / WATCH findings.
---

# MarketForge Pressure Test

## Global quality rules

- Pressure-test BEFORE declaring run complete.
- BLOCK findings halt the run until resolved (loop limit 3 iterations).
- Use the V3 guide §12.8 anti-pattern list as the primary red-team checklist.
- Use `ai-saturation-watch.md` to flag saturating tactics.

## Purpose

Red-team the full marketing plan for 90-day failure modes.

## Inputs
- All subskill outputs.

## Outputs
- `docs/marketing-plan/auditability/pressure-test-report.md`

## Pressure-test categories

### 1. Premature paid spend
- Is readiness check <5/7 but paid spend recommended?
- BLOCK if yes.

### 2. Channel-business-model mismatch
- Are LinkedIn Ads recommended for <$10K ACV?
- Is direct mail recommended for DTC consumer?
- BLOCK if mismatch material.

### 3. Concentration risk
- Does any single channel exceed 50% of new revenue projection?
- BLOCK if yes; require diversification.

### 4. Compound-channel kill-criterion misuse
- Are paid kill windows applied to compound channels (SEO, GEO, founder content, community)?
- BLOCK if yes.

### 5. AI-saturation watch
- Is the plan reliant on AI-cold-email at template-fill scale?
- Is the plan reliant on AI-written LinkedIn content?
- Is the plan reliant on AI-volume SEO?
- FIX-NEXT for each saturated tactic; recommend counter-move.

### 6. Single-source attribution claims
- Does any channel decision rely on platform-reported attribution alone?
- BLOCK if yes; require triangulation.

### 7. Founder-channel-fit failure
- Is the founder unwilling to execute the primary channel?
- BLOCK if yes; recommend different channel or different distribution model.

### 8. "Copying Salesforce 2006" anti-pattern
- Is the playbook derived from a company 100x bigger than this user?
- FIX-NEXT; scale recommendations down.

### 9. Brand-vs-performance miscalibration
- Is brand spend recommended pre-PMF?
- Is 0% brand recommended at $10M+ ARR?
- BLOCK if yes.

### 10. Channel-decay assumption
- Are 2024 benchmarks applied to 2026 channels without channel-decay accounting?
- WATCH; flag for monitoring.

### 11. HARO / dead-tool reference
- Is HARO referenced anywhere? (HARO shuttered late 2024)
- BLOCK if yes; replace with Qwoted / Help a B2B Writer / Featured.com.

### 12. K-factor wishful thinking
- Is K-factor projected >1 without proven mathematical viral mechanic?
- FIX-NEXT; recalibrate to realistic K (0.1-0.5).

### 13. Regulated-domain compliance
- Is the product in regulated domain (medical / financial / legal / supplements / children's / alcohol / firearms / crypto / gambling / political) without compliance plan?
- BLOCK if yes.

### 14. Cookie-era retargeting assumption
- Does plan assume pre-iOS-14.5 retargeting reach?
- FIX-NEXT; flag 50-60% of 2019 reach assumption.

### 15. Pre-PMF brand spend
- Is brand investment recommended without PMF?
- BLOCK if yes.

## Findings format

```markdown
# Pressure Test Report

## Summary
- Run: [date]
- BLOCK findings: [N]
- FIX-NEXT findings: [N]
- WATCH findings: [N]
- Overall verdict: GOOD / GOOD-WITH-NOTES / FAIL

## BLOCK findings

### PT-001: [Finding title]
- **Category:** [from list]
- **Location:** [files implicated]
- **Issue:** [specific failure mode]
- **Recommendation:** [fix]
- **Owner subskill (via finding-ownership matrix):** [which subskill must revise]

[More findings...]

## FIX-NEXT findings
[Similar format]

## WATCH findings
[Similar format]
```

## Loop limit
- Each finding has loop limit 3 (3 iterations of revise-and-retest).
- After 3 iterations: escalate to user with options.

## What we are intentionally NOT doing
- Letting the run declare "complete" with BLOCK findings.
- Skipping pressure test for "small" runs.
- Treating WATCH findings as ignorable — they go in the deferred-findings register.

## Sources and basis
V3 §12.8 (Anti-patterns to flag), §12.10 (When to recommend doing less), §1.5-1.8 (Foundations).
