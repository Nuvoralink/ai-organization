# Adversarial doneness audit — 14c36755 vs merge-base 5de29eb8

Read-only audit. Full report delivered in-session. Verdict: FINDINGS (1×P0, 2×P1, 2×P2, 4×P3).

Key verified defect: `backend/src/services/smsOptOuts.ts:22-25` is a second, unguarded
internal-DNC writer that overwrites `prospects.dnc_status = 'scrubbed_dnc'` with `internal_dnc`
on SMS STOP, destroying federal-registry evidence; `projectRevoked`
(`internalDncAuthority.ts:226-238`) never restores it, so a later revoke makes a
federally-listed prospect dialable via `dialerEngine.ts:633-637`.

Supporting evidence and the remaining findings are in the session transcript.
