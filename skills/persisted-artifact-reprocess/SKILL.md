---
name: persisted-artifact-reprocess
description: Use when a system needs to refresh downstream entities, read models, generated copy, dashboards, reports, DTOs, or UI from persisted source artifacts without re-running expensive or irreversible upstream provider work. Trigger for downstream reruns, reprocess without reuploading or retranscribing, refresh stale derived state, rebuild from stored analysis/results, verify a fix against persisted artifacts, avoid unnecessary model/provider spend, or choose the narrowest safe rerun path.
---

# Persisted Artifact Reprocess

Use this skill to choose and verify the narrowest rerun that refreshes stale downstream truth without repeating upstream provider work unnecessarily.

## Core Rule

Use the earliest persisted artifact that is still authoritative.

- Use downstream reprocess for entity, read-model, mapper, DTO, dashboard, report, queue, or display-consumption fixes.
- Use generation-only reprocess for structured AI copy, recommendations, drills, summaries, or generated decision changes when source evidence is still current.
- Use full upstream provider rerun only when the original artifact is missing, corrupt, stale at the evidence layer, or the fix changes transcription, extraction, classification, analyzability, or provider-specific behavior.

If a reprocess succeeds but old truth remains visible, inspect stale persisted artifacts, compatibility mappers, read-model fallbacks, caches, DTO wrappers, and frontend/report reconstruction before assuming the upstream fix failed.

## Workflow

1. Identify the source artifact:
   - stored JSON/results,
   - transcript or normalized evidence,
   - provider evidence,
   - persisted decision payload,
   - source database row,
   - file/blob/storage object.
2. Decide whether that artifact is authoritative enough for the requested proof.
3. Map the downstream consumers:
   - derived rows,
   - projections and aggregates,
   - generated copy,
   - queues and jobs,
   - reports and exports,
   - API/DTO/read models,
   - frontend or document display.
4. Pick the narrowest rerun path and explicitly name what it does not redo.
5. Verify deployment/runtime version when using a deployed endpoint to validate a fresh fix.
6. Run the reprocess.
7. Verify persistence and final output, not only the endpoint success response.

## Safety Checks

- Never print bearer tokens, secrets, signed URLs, database URLs, cookies, or raw private payloads.
- Confirm the endpoint/script cannot repeat irreversible provider side effects unless that is the intended path.
- Make idempotency explicit: duplicate reruns should not duplicate rows, charge twice, notify twice, or overwrite terminal evidence.
- If the rerun path can be triggered twice at the same time, prove concurrent duplicate-trigger safety as well as retry-after-success safety. Look for a durable uniqueness key, row lock, claim step, provider event ID, or equivalent persisted guard.
- Treat response wrappers as unstable until verified. Normalize `body.data`, `body.result`, `body.review`, or direct payload shapes before inspecting fields.
- If ad-hoc queries fail with missing columns or undefined fields, stop and verify the current schema/API shape before continuing.

## Stale Artifact Questions

- Is the persisted source artifact current enough?
- Which derived rows were created from it?
- Which derived rows can still act, retry, dispatch, display, aggregate, or outlive the source mutation?
- Are retryable failed, queued, processing, stale, and test-only rows safe after the source changes?
- Is terminal provider/user evidence preserved?
- Does the final UI/API/report consume the rebuilt authority rather than a stale fallback?

## Proof

A successful reprocess should prove:

- the rerun path executed the intended code version,
- source artifact identity is known,
- derived row counts/statuses are expected,
- stale rows are updated, canceled, superseded, preserved, or intentionally ignored,
- terminal evidence remains traceable,
- final user-visible output changed or remained honest for the right reason,
- no expensive provider call or irreversible side effect happened unless explicitly intended.

## Response Style

Report each target with status, what was rerun, what was not rerun, key counts or evidence, final-output verification, and whether a broader upstream rerun is still needed.
