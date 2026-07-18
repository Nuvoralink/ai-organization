---
name: coachai-source-of-truth-architecture
description: Audit and plan root-level CoachAI source-of-truth fixes for AI/coaching decisions, stale fallbacks, deterministic semantic creep, rerun freshness, and final user-visible authority. Use when the user asks whether a fix is root-level, whether AI is making the right decision, whether output is tracked properly, or whether a patch is a workaround.
---

# CoachAI Source Of Truth Architecture

## Purpose

Use this skill when a visible bug may be caused by the wrong layer owning product truth.

The goal is not to widen every task. The goal is to make sure the intended authority drives the final user-visible behavior.

## Workflow

1. Restate product intent in plain language.
2. Identify the visible bad output or behavior.
3. Identify the earliest reliable authority that should own the decision.
4. Build or update the decision matrix in `docs/AI_DECISION_MATRIX_REGISTER.md` if the issue is semantic.
5. Trace producer, validator, repair, persistence, DTO, UI, aggregate, and rerun paths. Use `docs/COACHING_SURFACE_AUTHORITY_MAP.md` when the issue reaches a visible coaching, dashboard, queue, drill, or KPI claim.
6. Identify stale fallback or compatibility paths that can keep the bug alive.
7. Choose the smallest proof from `docs/GOLDEN_FIXTURE_CATALOG.md`.
8. Verify the final visible output or name the exact blocker.

## Decision Boundary

AI should own open-world sales/coaching meaning.

Deterministic code should own grounding, provenance, exact policy, schema, score arithmetic, persistence, display safety, tenant/security checks, and metering.

If deterministic semantic logic is unavoidable, require `SEMANTIC_DETERMINISM_ALLOW:` plus a regression proving the scope is narrow.

## Output

Return product intent, source-of-truth diagnosis, root cause, required architecture change, stale paths to remove or isolate, tests/smokes/reruns required, and whether the plan fully satisfies product intent or only patches the current failure.
