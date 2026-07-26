---
name: local-frontend-smoke-setup
description: "How to run the authenticated manager frontend smoke on Amin's machine + its known slow spots (port 5173 reserved, local Redis points at prod, ~28s Call Review load)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5c8d501f-eece-48cb-9b06-62ccc539edda
---

Running the authenticated manager frontend smoke on this machine (verified 2026-07-07):

- **Port 5173 is OS-reserved here** (Windows dynamic range `netsh interface ipv4 show excludedportrange` ≈ 5077–5876) → Vite `listen EACCES`. Fixed in PR #165: `scripts/runManagerFrontendSmoke.mjs` now auto-probes `CANDIDATE_BASE_URLS` (5173 → 4173 → 4273), binds the first free port, and injects that origin into the backend it spawns via `ALLOWED_ORIGINS`. So `npm run test:manager-frontend-smoke` (or `.\scripts\run-manager-frontend-smoke.ps1`) just works now — it lands on **4173**. Pass `--base-url` only to pin a specific origin.
- **`backend/.env` `REDIS_URL` points at `redis.railway.internal`** (prod), unreachable locally → the rate limiter logs `rate_limit_redis_error` every ~2s. Harmless (falls back) but noisy. Start the backend with `REDIS_URL=""` for a clean local run.
- **The focused manager Call Review (M3) takes ~26–29s to mount in local dev** — measured even with Redis disabled, so it's genuinely slow, not the rate-limit tax. The smoke's built-in 5s wait silently skips the whole M3 assertion block (`callReview=skipped-no-call`) — that's [[ux-ui-redesign-audit]] backlog **TOOL-3**, and the slowness itself is candidate **PERF-1** (route to performance-auditor on a prod-like build; dev is 2–5× slower). To verify M3 manually: log in, open `/team/insights?tab=calls&sessionId=<id>`, wait ~30s for the cockpit, then it's instant.
- Manager creds live in gitignored `scripts/local/manager-smoke.local.ps1` (`MANAGER_SMOKE_EMAIL`/`PASSWORD`). Manager account = Andrea E (`eab661e8-1afd-4afd-9e0c-5829a3f0752d`); 20 reviewable sessions exist in the local DB. Default smoke session `dd6b491e…` (Rica, referral, score 65) renders M3 fine.
- **M5 (rep Call Review verdict layer) needs a REP login** — the manager smoke can't reach it; no rep creds are in the local config, so M5 rendered-verification is still open.
