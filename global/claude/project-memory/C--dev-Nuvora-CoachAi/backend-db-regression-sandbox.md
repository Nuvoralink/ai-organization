---
name: backend-db-regression-sandbox
description: "How to actually run CoachAI's disposable-DB backend regressions from this sandbox (raw pg times out; Prisma pg-adapter path works against a warm Neon branch)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 64013ed9-e44d-40d4-bcaa-5cd9d2067f3a
  modified: 2026-07-28T16:29:56.067Z
---

Running CoachAI's DB-backed backend regressions (`test:regression:dialer-*`, `tenant-security-blackbox`, etc.) from **this machine's agent sandbox**:

- **Raw Postgres clients time out.** A direct `pg.Client` / `psql` / `prisma migrate deploy` from a Bash tool call completes the TCP connect but the PG protocol/TLS handshake **times out** ("timeout expired" / P1001). This is a sandbox network-layer restriction, NOT a Neon or credentials problem.
- **The project's own tsx runner WORKS.** `npm run test:regression:<name>` (which goes through Prisma's `@prisma/adapter-pg` path) connects fine to a Neon branch. So run regressions via the npm script, not a hand-rolled pg client.
- **Warm the compute first.** A Neon branch's compute cold-starts; the FIRST `prisma migrate deploy` can P1001 on the cold start. Retry once the compute is warm (a prior successful query wakes it), then migrate deploy + the regression both succeed.
- **Recipe:** create a disposable branch on the target Neon project (e.g. Coach-Internal `snowy-glade-91475703`) via Neon MCP with an `expiresAt`; `get_connection_string`; `DATABASE_URL=<uri> npx prisma migrate deploy` (warm it first); then `DIALER_INGEST_TEST_DATABASE_URL=<uri> DIALER_INGEST_TEST_CONFIRM_DISPOSABLE_DB=1 npm run test:regression:<name> --workspace=backend`. Delete the branch after (Neon MCP `delete_branch` needs explicit user OK). See [[railway-topology]] for the prod stacks/DBs to NOT point at.

Proven 2026-07-08 running `dialer-roster` (28 checks) + `dialer-settings-route` (44 checks) green on a disposable Coach-Internal branch during the Dialpad roster feature build.

**2026-07-24 — the DB BATTERY is latency-flaky against a remote (ap-southeast-1) Neon branch; don't gate an unrelated merge on it.** Running the full `ci:local` DB lane (`verify:db` = the fixed dialer/auxara battery: dialer-ingest, auxara-*, **coach-link-writeback**, …) against a remote Neon branch from this machine, transaction-heavy tests flake: `coach-link-writeback` D-section hit Prisma **P2028 "Unable to start a transaction in the given time"** in isolation, and under the full battery's load its D7 fixed **80ms** async-wait missed (hook hadn't fired yet). Both are remote round-trip latency, NOT a code bug — they'd pass on a local/low-latency DB. So when a PR's OWN regressions are pure-logic (`primary-fix-ranker`, `call-review-mapper`, `semantic-judgment`, `structured-coaching` — run them directly with `NODE_ENV=test`, no DB), verify those + the static lane and treat a `verify:db` red in an UNRELATED battery as environmental once you've proven the diff is disjoint. (This is how CoachAI #223 was verified-green + merged despite a red `ci:local`.)

**2026-07-28 — LOCAL DOCKER POSTGRES is the better default; it beats the Neon-branch recipe above.** Docker Desktop IS available on this machine (`docker version` → 29.5.3). `docker run -d --name <x> -e POSTGRES_PASSWORD=… -p 55999:5432 postgres:16` + `DATABASE_URL=postgresql://…@127.0.0.1:55999/… npx prisma migrate deploy` works with **no** handshake timeout and **no** cold-start warm-up — the 2026-07-08 "raw pg times out" restriction is a *remote/TLS* problem, not a blanket sandbox one. It also removes the ap-southeast-1 latency flake above: the full `verify:db` lane ran 24/24 green serially against local Docker. Reset between runs with `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` + `migrate deploy` — these scripts assume a clean DB and are **not** idempotent across runs. **Run the DB lane SERIALLY** — they share one database and truncate each other's rows (`mandatoryGates`/`tenantSecurityBlackBox` pass alone, fail or time out concurrently). Prefer this over provisioning on the user's Neon account. Use a dedicated container name/port; other projects' containers (auxara-*) live on the same daemon.

**Exit-masking trap (bit me here, loop-discipline §verify-the-critic):** a backgrounded `npm run ci:local > log 2>&1; rc=$?; echo "EXIT: $rc"; exit $rc` reports the *compound* command's exit — the trailing `echo` (always 0) — so the task-completion notification said "exit code 0" while `ci:local` had actually exited 1 (grep the log for the real `CI_LOCAL_EXIT`/`✗` line, never trust the notification's code for a `; echo`-chained command). Prefer capturing `$?` into the log immediately after the real command with no trailing successful command, or read the tool's own captured result.
