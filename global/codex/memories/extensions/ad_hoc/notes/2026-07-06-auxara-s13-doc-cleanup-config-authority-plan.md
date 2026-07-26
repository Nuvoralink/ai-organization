# Auxara Dialer Sprint 1.3 docs cleanup and config-authority plan

Date: 2026-07-06

Doc/project cleanup completed after Sprint 1.3 AI disposition merge:

- GitHub Project was updated so AI-001, AI-002, and AI-008 are Done; Sprint 1.3 epic is In Progress; AI-004 real ASR/transcription bundle was moved to Sprint 3.0.
- Docs PR #183 merged to `main` at `6b366d55652ccadd0ab1305b1fdda2c2e3028dc2`.
- PR #183 clarified Sprint 1.3 status: AI disposition/Booker AI Assist is merged; DLR-016 shared-run UX remains mock-gated; teleprompter and battlecards config authority remain pending.
- PR #183 also updated source-of-truth/API/frontend blast-radius docs so `PLACEHOLDER_SCRIPT_SECTIONS` and `PLACEHOLDER_BATTLECARDS` are explicitly non-authoritative placeholders until backend config reads land.
- Local verification before merge: `npm run format:check`, `npm run gates:all`, `git diff --check origin/main...HEAD`; GitHub CI for PR #183 passed verify, integration, docker-build, and Vercel.

Planner lane note:

- Two read-only planner agents for Teleprompter + Battlecards config authority failed to produce a report within bounded waits and were interrupted. Future Claude/Codex runs should not wait for those agent threads.
- Compact verified plan from root evidence: endpoints already exist in `API_ENDPOINTS.battlecardTriggers` and `API_ENDPOINTS.teleprompterConfigs`; DB models exist as `AiBattlecardTrigger` and `TeleprompterConfig`; `validateTeleprompterTree()` exists and is tested; backend routes/services for those endpoints are not mounted; frontend cockpit still consumes `PLACEHOLDER_SCRIPT_SECTIONS` and `PLACEHOLDER_BATTLECARDS`; permission registry has `dispositions.manage` but no teleprompter/battlecard config permission keys.
- Recommended next non-visible Sprint 1.3 slice: build one shared Config Authority backend slice with additive RBAC keys, shared validation/mappers, GET read routes for cockpit consumption, PUT/admin write routes only if no visible admin editor is required yet, tests proving tenant isolation, invalid teleprompter graph rejection, battlecard registry validation, and placeholder retirement once frontend wiring is mock-approved.
