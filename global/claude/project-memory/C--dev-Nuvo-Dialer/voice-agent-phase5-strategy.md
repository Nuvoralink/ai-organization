---
name: voice-agent-phase5-strategy
description: "The Phase-5 autonomous voice agent strategy spanning the dialer + CoachAI repos, and where it's captured"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3bc01c3d-fe48-40b8-bed1-326ca3002a91
---

A **Phase-5 autonomous voice agent** is on the dialer roadmap (planning, not built). Thesis: **ground** (not train) a frontier real-time voice model in **Nuvora CoachAI**'s knowledge brain, run it on the dialer's telephony/compliance/RBAC rails.

- CoachAI (`Nuvoralink/Nuvora-CoachAi`) is the knowledge layer: V1.5 Knowledge Flywheel (#38), V2 Universal technique Library (#36), V3 Practice Studio = a real-time **voice persona engine** that plays the *prospect* (#39). The voice agent is V3's runtime with roles **inverted** (AI plays the *rep*).
- Captured in the dialer repo: **`ADR-VOX-001`** (`docs/app-plan/architecture/adr/`) + **`voice-agent-forward-compat-seams.md`** (`docs/app-plan/architecture/`). Tracked on the **existing** GitHub Project #7 (NOT a separate board) as VOX-001/002/003 + seams ARC-007/AI-009/INT-003.
- It's a **new actor class**, NOT a dialer feature: ARC-006 Tier 3 ("the conversation is not the dialer's job") is an **immutable invariant**, so VOX coexists as a separate gated product (per-tenant entitlement default OFF, human-in-loop, kill-switch). AI-voice outbound = robocall (PEWC + AI-disclosure) → extends ADR-CMP-001 Set A. Unit cost ≈ 10–40× telephony.
- **3 seams planted now (Phases 1–3), exercised day-1, not speculative** (honors ADR-DLR-001 anti-speculation): `calls.operator_type` (ARC-007, Sprint 1.2), CoachAI-aligned objection/line-provenance taxonomy (AI-009, Sprint 1.3), CoachAI knowledge-grounding contract + outcome feed (INT-003, Sprint 2.4). 4 more documented as additive extension points only — NOT pre-built (no dead code).
- **CC-0 correction (2026-05-30):** CoachAI's "CRM-blindness" was a *current-state* constraint, not permanent. The dialer is the planned outcome feed that sharpens CoachAI. Corrected in CoachAI `docs/app-plan/coaching-philosophy-outcome-conditioned.md` + `flywheel-and-practice-studio-context.md`: durable rule = "**calibrate, don't condition**" (outcomes calibrate the predictor; coaching *generation* stays evidence-grounded to avoid hindsight bias).

Status: docs written + board updated; **not committed** (user controls commits). ADR-VOX-001 is Status: Proposed (awaits the board walkthrough → Approved like every decision surface).
