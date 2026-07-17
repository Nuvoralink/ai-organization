---
name: auxara-dialer-downstream-rerun
description: Reprocess Auxara Dialer call records, recordings, transcripts, dispositions, conversation threads, or number-health/lifecycle state without re-running the upstream Telnyx call or paid provider call. Use when the user says /rerun, reprocess-downstream, rerun-without-recall, refresh-derived-state, or gives session/call/conversation IDs to refresh derived authority from persisted source-of-truth data.
---

# Auxara Dialer Downstream Rerun

## Purpose

Rerun only the downstream derived pipeline from persisted source-of-truth artifacts (Telnyx call events, recordings in durable storage, persisted transcripts, persisted lifecycle history). Do not re-trigger upstream provider work unless the user explicitly asks for it.

Use the narrowest rerun that refreshes the stale authority. Concrete cases:

- **Disposition / AI draft rerun** — re-run the AI disposition pipeline from a persisted transcript (no new Telnyx call, no new transcription).
- **Recording rehoming** — move a recording between storage backends without losing the durable-authority claim.
- **Number lifecycle reconciliation** — replay number-health events to repair a wrong `numbers.status`.
- **Conversation thread re-stitching** — re-key SMS messages to the correct lead-keyed conversation after a backfill of number-rotation history.
- **Billing usage reconciliation** — recompute per-tenant usage from Telnyx CDR after a CDR backfill.
- **Compliance audit rebuild** — rebuild the per-call compliance audit row from persisted `call_events` after a logging fix.

If a rerun succeeds but old truth remains visible, inspect:
- stale projection rows
- effective-permissions cache (60s Redis TTL)
- frontend mapper fallbacks
- DTO compatibility paths kept for old saved data

## Process (general)

1. **Confirm the deployed code includes the fix** the rerun is meant to validate.
2. **Identify the narrowest rerun path** for the affected derived state.
3. **Call the rerun endpoint or job** with the specific call/session/number/conversation/tenant IDs.
4. **Confirm the result contains the expected updated derived state** (entity counts, lifecycle status, conversation stitching, billing total, audit row).
5. **Verify persistence with SQL** when certainty is required.
6. **Refresh the user-visible surface** (force-refresh manager wallboard, reload tenant admin number pool, reload conversation thread) and confirm.

## Auth

Reruns require internal-admin authority (Owner-level role for cross-tenant; tenant-admin for within-tenant). Mint a short-lived JWT or use an existing valid token; never paste tokens into output.

## Failure Handling

- `403 INSUFFICIENT_AUTHORITY`: auth token is not internal admin.
- `404 SOURCE_NOT_FOUND`: persisted source-of-truth artifact missing (e.g. no Telnyx CDR for that call yet). Cannot rerun.
- Any sign the rerun re-triggered upstream provider work (new Telnyx call placed, new transcription job spawned, new AI provider call billed) means the wrong endpoint was used. **Stop and report.**
- If the rerun succeeds but old derived state remains visible, the bug is in cache invalidation, projection idempotency, or a fallback path — not in the rerun itself.

## Response Style

Report each ID with status, what was updated, and whether the user-visible surface was refreshed. Mention explicitly that upstream provider work was not re-run.
