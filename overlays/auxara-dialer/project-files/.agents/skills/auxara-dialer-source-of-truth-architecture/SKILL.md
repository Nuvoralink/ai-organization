---
name: auxara-dialer-source-of-truth-architecture
description: Audit and plan root-level Auxara Dialer source-of-truth fixes for telephony state, number lifecycle, conversation threading, compliance gating, AI decisions, stale fallbacks, deterministic semantic creep, rerun freshness, and final user-visible authority. Use when the user asks whether a fix is root-level, whether the right layer owns the decision, whether output is tracked properly, or whether a patch is a workaround.
---

# Auxara Dialer Source Of Truth Architecture

## Purpose

Use this skill when a visible bug may be caused by the wrong layer owning product truth.

The goal is not to widen every task. The goal is to make sure the intended authority drives the final user-visible behavior.

## Common authority owners in this app

| Decision | Authority |
|---|---|
| Whether a call happened, when, how long | Telnyx Call Control events → `call_events` (Postgres) is the projection |
| Whether a number can dial outbound / accept inbound / send SMS | The `numbers.status` lifecycle column, transitioned only by lifecycle jobs |
| Whether a prospect is reachable | DNC scrub freshness + per-tenant DNC + state DNC + consent_proof + calling-hours TZ check |
| Whether an SMS thread belongs to a lead | `conversations.prospect_id` (lead-keyed), not number-keyed |
| What dial mode is active for a campaign | `campaigns.dialing_mode` (POWER only — parallel/predictive scrapped, ADR-DLR-001) |
| Recording existence | Durable storage backend authority (Cloudflare R2; INF-006/REC-004) verified via object check, not process env |
| Tenant membership / role / scope | Role × permission × scope tables, with Postgres RLS as backstop |
| ~~Predictive abandonment cap~~ | N/A — predictive scrapped (ADR-DLR-001); a single-line power dialer cannot abandon |
| AI disposition draft | AI model output validated against the dispositions taxonomy + transcript grounding |
| Billing usage | Telnyx CDR + per-tenant aggregation, not client-claimed counts |

If a layer is making a decision and is not the authority above, that's a likely root-cause site.

## Workflow

1. Restate product intent in plain language.
2. Identify the visible bad output or behavior.
3. Identify the earliest reliable authority that should own the decision (use the table above).
4. Trace producer, validator, repair, persistence, DTO, UI, aggregate, and rerun paths.
5. Identify stale fallback or compatibility paths that can keep the bug alive (often: cached lifecycle state, cached effective-permissions, cached number-health, cached recording-availability).
6. Choose the smallest proof: synthetic fixture, local replay from persisted events, source-to-UI smoke.
7. Verify the final visible output or name the exact blocker.

## Decision Boundary

- **Deterministic code** owns: schema, grounding, provenance, exact policy (compliance gating, lifecycle transitions), score arithmetic, persistence, display safety, tenant/security checks, metering, idempotency.
- **AI** owns: bounded semantic judgments (disposition draft, battlecard trigger, accent-toggle decision). AI never owns compliance gating, billing, RBAC, or lifecycle transitions.
- If deterministic semantic logic is unavoidable, require `SEMANTIC_DETERMINISM_ALLOW:` plus a regression proving the scope is narrow.

## Output

Return product intent, source-of-truth diagnosis, root cause, required architecture change, stale paths to remove or isolate, tests/smokes/reruns required, and whether the plan fully satisfies product intent or only patches the current failure.
