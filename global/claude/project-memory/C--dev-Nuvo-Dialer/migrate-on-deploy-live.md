---
name: migrate-on-deploy-live
description: "Prisma migrations auto-apply on every Railway deploy (LIVE + validated 2026-06-15). KEY GOTCHA: a committed railway.json deploy block OVERRIDES the Railway dashboard/API pre-deploy command (silently)."
metadata: 
  node_type: memory
  type: project
  originSessionId: c736ed6a-56e0-4496-b3fa-e4b8599be152
---

**Auto-migrate-on-deploy is LIVE + validated 2026-06-15** (deploy `1c8ec99d` / commit `1a728ff`: the pre-deploy ran `migrate:deploy` → log "10 migrations found … No pending migrations to apply."). Every Railway deploy now runs `prisma migrate deploy` BEFORE serving traffic, so a missed migration can't silently 500 prod again. (The class that bit us: migration **0010 `tenants.recording_enabled`** lagged prod → every signup 500'd until I applied it by hand via the runbook. Root cause: Railway doesn't auto-run migrations + there was no drift alarm.)

**Architecture (mirrors CoachAI):**
- Command lives in **`railway.json` → `deploy.preDeployCommand: "npm run migrate:deploy -w backend"`** (repo root; shared by the `api` + `worker` services).
- `backend/scripts/migrateDeploy.ts` → `resolveMigrationDecision` (`backend/src/lib/migrationDatabaseUrl.ts`): **migrate** with `DATABASE_URL_OWNER` if set, else **skip** (exit 0).
- Only the **api** carries `DATABASE_URL_OWNER` (= the `neondb_owner` connection; set on the api service via `railway variables --set-from-stdin`, absent on the worker). So the **api migrates**, the **worker self-skips** — the worker must NEVER migrate (`dialer_app` is NOBYPASSRLS / no-DDL, and only one service may hold the Prisma advisory lock). The wrapper swaps `DATABASE_URL_OWNER` in as `DATABASE_URL` for the prisma subprocess only; the app's own runtime connection is unchanged.

**⚠ THE GOTCHA (wasted a cycle): a committed `railway.json` `deploy` block OVERRIDES Railway's dashboard/API pre-deploy command — the dashboard value is SILENTLY ignored.** My first attempt set the pre-deploy command via the Railway API (railway-agent + the dashboard); the redeploy reached SUCCESS but went straight to `tsx src/index.ts` with NO migrate step (caught by reading the deploy log — "verify the critic": the railway-agent reported SUCCESS, but the load-bearing claim [the migrate ran] was false). Fix = put `preDeployCommand` IN `railway.json`. Now documented in `docs/runbooks/prod-migrations.md`, which is now the BREAK-GLASS fallback (manual Neon-MCP application) rather than the primary path.

**Cold-start retry (added 2026-06-20, #97 `77c4608`):** the pre-deploy `migrate:deploy` now RETRIES on a connection error (P1001 / ECONNREFUSED / ETIMEDOUT / "Can't reach database server") up to 5× with linear 3/6/9/12s backoff — a sleeping Neon (scale-to-zero) no longer fails the whole deploy on the first-connect timeout (it bit 3× on 2026-06-20; manual warm + redeploy was the only recovery before this). A genuine migration/SQL error (P3009, syntax, …) still fails FAST (no looping a doomed migration). `migrate deploy` is idempotent so retrying is safe. Policy + test: `backend/src/lib/migrationRetry.ts` (the testable classifier) + `backend/src/__tests__/migrationRetry.test.ts` (pins the regex against the real P1001 output AND a real migration error). This supersedes the manual warm-up dance.

**Minor follow-up (non-blocking):** the deploy logs a Prisma deprecation — `package.json#prisma` (the seed config key) is deprecated → move to `prisma.config.ts` before Prisma 7.

Related this session: the **0010 fix** (signup 500 → applied 0010 via the runbook); the **PasswordInput reveal-toggle** (PR #64, merged) on all auth fields; self-serve **signup at `dialer.auxara.io/signup`** creates a tenant **Owner** (internal_admin bootstrap is the unbuilt Sprint-2.0 ADR-AUTH-004); **16 `*@example.test` test-pollution tenants/users in prod** (pre-`dbGate` residue from 2026-06-10/11) — purge offered, Amin hasn't decided.
