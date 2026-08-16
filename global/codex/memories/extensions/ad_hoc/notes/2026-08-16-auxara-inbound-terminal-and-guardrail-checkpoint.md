# Auxara inbound terminal incident and functionality-first checkpoint

Primary durable authority: `${PROJECT:auxara-dialer|backslash}-worktrees\inbound-voicemail-p0\docs\HANDOFF-backend-inbound-voicemail-p0-2026-08-16.md`, especially `Durable checkpoint — 2026-08-16 terminal-call production incident`.

- Inbound/outbound ringing and two-way audio were proven by the founder after PR #389.
- A connected inbound call then remained locally active and left the dialer `On a call`. Exact production
  call/legs/occupancy were reconciled and cleared.
- Root hotfix PR #391 merged to main `22a40e8ac681a262c575f4967f5a93c5efb4282c`; Railway API deployment
  `36d90c26-dc6c-49d2-a6cc-9b0e1e8cabfa` and worker deployment
  `268fccca-f27a-4031-974a-d1bcfb7c71ce` succeeded. Founder retest remains owed.
- Voicemail call `82bf9197-f186-4d21-ac1f-72608216b85b` produced verified stored artifact
  `df3be1f8-39ea-414c-b981-dbfed983d4ad`.
- Connected call `4aed51c4-3df7-4e48-a1a4-e9e1fcd30b54` produced no recording despite tenant
  `recordingEnabled=true` and `recordingDisclosurePolicy='always'`; P0 `CONNECTED-CALL-RECORDING-MISSING-001`
  is recorded in `docs/BUG_BACKLOG.md` and `docs/WORK_TRACKER.md`.
- Voicemail disclosure policy remains disputed by the founder and is not fixed; reconcile product/compliance
  authority before changing it.
- Preserve dirty worktree `${PROJECT:auxara-dialer|backslash}-worktrees\inbound-voicemail-p0`, branch
  `codex/functionality-first-guardrails-20260816`. It contains uncommitted functionality-first delivery and
  provider-doc enforcement across `.ai-organization`, `.claude`, GitHub templates, repo rules/docs, and new
  mechanical gates. Do not reset/clean it. Universal AI-organization/bootstrap/global propagation is pending.
- Founder policy: implementation/function fix → proportional migration/DB/Railway deploy-safety → deploy →
  real functional journey proof; auditors may run in parallel but ordinary findings queue until the original
  function is proven. Provider integrations must consult current official provider leaf docs and installed SDK
  source/types, mechanically enforced rather than prose-only.

Resume by reading the handoff, current tracker/backlog, live `origin/main`, and the dirty worktree diff. Treat
all deployment/runtime claims as leads and refresh them before acting.
