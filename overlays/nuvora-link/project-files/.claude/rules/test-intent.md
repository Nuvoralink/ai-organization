---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "scripts/**/*.test.mjs"
---
# Test intent

Every new or materially changed test declares `Proves:`, `Test type:`, `Surface:`, `Authority:`, `What this test proves about the product:`, `Killer mutation:`, and `Gated command:`. A requirement or decision id must resolve to a living project authority.

Pair positive liveness with negative boundaries. Admission widening owes a negative test whose mutation widens the predicate further. Organization-boundary, role, idempotency, time-window, metric, provider, and retired-capability tests must exercise the real path and actual persistence or rendered output where required.

Aggregate commands fail on zero discovered files or zero executed tests. Do not use ignore-empty flags. Each test-bearing workspace is invoked explicitly or through a discovery mechanism proven by a killer mutation.

Killer mutation: remove one required header, restore an ignore-empty flag, remove a test-bearing workspace from aggregation, or make the test pass after deleting the behavior it claims to prove.
