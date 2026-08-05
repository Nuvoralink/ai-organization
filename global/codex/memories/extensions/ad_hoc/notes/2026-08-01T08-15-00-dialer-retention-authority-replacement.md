# Auxara retention authority replacement

Memory update requested by the user: replace any retained Auxara/Nuvo Dialer claim that the post-cancellation export window is 90 days, or that Auxara keeps tenant call/compliance/DNC data for a multi-year platform horizon.

Current authority:

- Cancellation runs through the paid period, then closure begins one 30-day read-only export/reactivation window while DIDs are held.
- At day 30, the approved policy purges tenant-owned and derived data, including compliance/admin evidence and the tenant internal-DNC list; only a PII-free business record and purge receipt remain.
- A global user identity is deleted only when no other workspace membership still requires it.
- The 90-day value remains only the configurable default for recording retention while a workspace is active; it is not the cancellation window.
- The irreversible purge is not implemented and remains activation-gated on the counsel, backup-horizon, provider-retention, and deployment checks in REC-002 and `docs/app-plan/product/tenant-offboarding-brief.md`.

Do not preserve the superseded claims as a parallel amendment trail. Future memory summaries should state only the current contract and may mention that activation is pending, not restate the retired values.
