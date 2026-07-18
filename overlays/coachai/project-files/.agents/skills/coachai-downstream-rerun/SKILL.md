---
name: coachai-downstream-rerun
description: Reprocess CoachAI call-review sessions without reuploading audio to Gemini. Use when the user says /rerun, downstream rerun, reprocess-downstream, rerun without Gemini, or gives one or more session IDs to refresh coaching entities/feedback display from persisted analysis.json through POST /api/coaching/sessions/:id/reprocess-downstream.
---

# CoachAI Downstream Rerun

## Purpose

Rerun only the downstream coaching/entity/display pipeline from persisted `analysis.json`. Do not use the full analysis rerun endpoint unless the user explicitly asks to reprocess audio.

Use the narrowest rerun that refreshes the stale authority.

- Use downstream rerun for entity, read-model, mapper, DTO, manager queue, or display-consumption fixes.
- Use coaching-only rerun for Prompt A/B, structured coaching, drill, replacement-line, or generated coaching behavior changes.
- Use full audio rerun only when transcript, diarization, audio features, evidence extraction, analyzability, or missing stored analysis requires it.

If a rerun succeeds but old truth remains visible, inspect stale persisted artifacts, mapper fallbacks, DTO compatibility, and frontend reconstruction before assuming the code fix failed.

Use:

`POST /api/coaching/sessions/:sessionId/reprocess-downstream?includeReview=true`

Avoid:

`POST /api/analysis/session/:sessionId/rerun`

## Inputs

- Accept one session ID or multiple session IDs from the user.
- If the user says `/rerun <ids>`, treat it as this skill.
- Default API base for the internal Railway stack is `https://api-production-a69a.up.railway.app`; verify from Railway/env if it looks stale.

## Auth

The endpoint requires an internal-admin bearer token.

Preferred order:

1. Use an existing valid bearer token only if the user already provided one or the environment has one.
2. Mint a short-lived internal JWT from `backend/.env` using `JWT_SECRET` and a real internal admin user.
3. If user/admin identity is unknown, find one through Neon/DB:

```sql
select u.id, u.email, om."orgRole", om."orgId"
from "User" u
join "OrgMembership" om on om."userId" = u.id
where om."orgRole" = 'INTERNAL_ADMIN'
order by u."createdAt" asc;
```

Never print bearer tokens, JWT secrets, or database URLs.

## Process

1. Confirm the deployed API includes the intended code when the rerun is meant to validate a fresh fix:

```powershell
railway deployment list --service "API" --environment "production" --limit 5 --json
```

2. For each session ID, call the downstream endpoint with `includeReview=true` so the response includes rebuilt review data:

```powershell
$api = "https://api-production-a69a.up.railway.app"
$sessionIds = @("<SESSION_ID_1>", "<SESSION_ID_2>")
foreach ($sessionId in $sessionIds) {
  $url = "$api/api/coaching/sessions/$sessionId/reprocess-downstream?includeReview=true"
  $res = Invoke-RestMethod -Method Post -Uri $url -Headers @{ Authorization = "Bearer $token" }
  $res.result
}
```

Practical local note: this repo hoists Node packages to the project root. When running an inline Node script from `${PROJECT_ROOT}`, use normal `require("jsonwebtoken")` and `require("pg")`; do not require from `./backend/node_modules/...`.

3. Confirm each result includes:

- `ok: true`
- `result.sessionId`
- `observationCount`
- `objectionCount`
- `skillScoreCount`

The `includeReview=true` response may not expose a flat `CallReviewDTO` at `body.review` in every deployment shape. Treat `body.ok` and `body.result` as the primary rerun success signal, then verify persistence with SQL when you need certainty.

4. Verify persistence when needed:

```sql
select id, status, "coachingEntityRebuildProvenance", "bookingAttempted"
from "Session"
where id in ('<SESSION_ID>');

select count(*) from "CoachingObservation" where "sessionId" = '<SESSION_ID>';
select count(*) from "ObjectionInstance" where "sessionId" = '<SESSION_ID>';
select count(*) from "SkillScoreSnapshot" where "sessionId" = '<SESSION_ID>';
```

Expected successful persistence marker:

- `Session.coachingEntityRebuildProvenance = 'reprocessed_from_analysis_json'`
- Session remains `completed_with_feedback`
- Entity counts match the API `result`

5. Fetch the call review after rerun if not already included:

`GET /api/coaching/sessions/:sessionId/review`

## Failure Handling

- `403 INTERNAL_ADMIN_REQUIRED`: auth token is not internal admin.
- `404 FEEDBACK_NOT_FOUND`: session has no feedback yet; downstream-only rerun cannot work.
- `analysis.json not found for session`: use full rerun only if the user approves audio reprocessing.
- Any Gemini upload/log activity means the wrong endpoint/path was used; stop and report it.
- If the rerun succeeds but old objection labels or replacement lines remain, inspect whether deployed `reprocessDownstreamSession` re-normalizes persisted `feedback.objections` against current objection materials before `populateCoachingEntities`. Directly copying objections from `analysis.json` can preserve stale playbook matches after matcher fixes.
- If an ad-hoc verification query fails with missing columns or undefined response fields, stop and verify schema/DTO shape first. Use `backend/prisma/schema.prisma` for DB fields and normalize review response wrappers (`body.data`, `body.review`, or direct DTO) before inspecting nested review data. Do not assume UI label names are persisted column names.

## Response Style

Report each session ID with status, entity counts, and whether review data was returned. Mention explicitly that Gemini/audio was not rerun.
