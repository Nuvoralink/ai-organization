---
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'scripts/tests/**'
  - 'vitest.config.ts'
  - 'docs/requirements.md'
---

# Test intent

Every test starts with `Proves`, `Test type`, `Surface`, `Authority`, `What this test proves about the product`, `Killer mutation`, and `Gated command`. `docs/requirements.md` is the complete executable catalog: every row is exactly `- \`ID\` — description`, every `Proves` ID resolves there, and every catalog ID is inverse-covered by at least one discovered test file. The installed gate fails closed on zero roots, zero catalogs, zero exact rows, zero executable IDs, zero tests, malformed or duplicate rows, unresolved claims, and uncovered IDs. A proof command must fail on zero discovered files or zero executed tests; no ignore-empty flags. Sequential idempotency claims also require a concurrent duplicate test.

The unit/mutation lanes are no-network. PostgreSQL integration uses the disposable loopback-only runner. Tests validate both acceptance and the nearest forbidden widening; name the mutation that turns each test red.
