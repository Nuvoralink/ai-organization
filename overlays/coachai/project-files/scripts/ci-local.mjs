#!/usr/bin/env node
/** Local mirror of the two CI proof lanes. No hand-maintained DB test list and no silent DB skip. */
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const placeholder = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
function run(label, command, env = {}) {
  console.log(`\n▶ ${label}\n  $ ${command}`);
  const result = spawnSync(command, { shell: true, stdio: 'inherit', env: { ...process.env, ...env } });
  if (result.status !== 0) { console.error(`✗ ${label} — exit ${result.status}`); process.exit(result.status ?? 1); }
  console.log(`✓ ${label}`);
}

run('static CI authority', 'npm run verify', {
  DATABASE_URL: process.env.DATABASE_URL || placeholder,
  JWT_SECRET: process.env.JWT_SECRET || 'ci-test-jwt-secret-value',
  PROOF_LANE: 'static',
  CI: 'true'
});

const dbUrl = process.env.CI_LOCAL_DB_URL || process.env.DIALER_INGEST_TEST_DATABASE_URL;
if (dbUrl) {
  const dbEnv = {
    DATABASE_URL: dbUrl,
    DIALER_INGEST_TEST_DATABASE_URL: dbUrl,
    DIALER_INGEST_TEST_CONFIRM_DISPOSABLE_DB: '1',
    TENANT_SECURITY_BLACKBOX_DATABASE_URL: dbUrl,
    TENANT_SECURITY_BLACKBOX_CONFIRM_DISPOSABLE_DB: '1',
    APP_STACK: 'paid', NODE_ENV: 'test', QUEUE_DRIVER: 'memory', RATE_LIMIT_STORE: 'memory',
    GOOGLE_API_KEY: 'ci-test-google-key', OPENAI_API_KEY: 'ci-test-openai-key', GROQ_API_KEY: 'ci-test-groq-key',
    CREDENTIAL_ENCRYPTION_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
    JWT_SECRET: 'ci-test-jwt-secret-value', CSRF_SECRET: 'ci-test-csrf-secret-value', STORAGE_SIGNING_SECRET: 'ci-test-storage-signing-secret',
    ALLOWED_ORIGINS: 'http://localhost:5173', FRONTEND_URL: 'http://localhost:5173', STRIPE_SECRET_KEY: 'sk_test_ci',
    STRIPE_WEBHOOK_SECRET: 'whsec_ci', RESEND_API_KEY: 'ci-test-resend', ADMIN_SECRET_KEY: 'ci-test-admin-secret-key-value',
    AUXARA_DIALER_API_BASE: 'https://dialer.auxara.test', AUXARA_DIALER_AUTHORIZE_URL: 'https://dialer.auxara.test/oauth/authorize',
    AUXARA_DIALER_TOKEN_URL: 'https://dialer.auxara.test/oauth/token', AUXARA_DIALER_REVOKE_URL: 'https://dialer.auxara.test/oauth/revoke',
    AUXARA_DIALER_CLIENT_ID: 'coachai-client', AUXARA_DIALER_CLIENT_SECRET: 'coachai-secret',
    AUXARA_DIALER_RECORDING_HOSTS: 'r2.auxara.test,recordings.auxara.test', PROOF_LANE: 'db', CI: 'true'
  };
  run('DB prerequisites', 'npm --prefix shared run build && cd backend && npx prisma generate && npx prisma migrate deploy', dbEnv);
  run('changed-path DB proof', 'npm run proof:changed', dbEnv);
} else {
  // The selector passes when the diff has no DB-risk profile and fails closed when one is selected.
  run('changed-path DB proof / no-risk assertion', 'npm run proof:changed', { PROOF_LANE: 'db', CI: 'true' });
}

console.log('\nci-local: PASS — static and applicable DB risk proof are green.');
