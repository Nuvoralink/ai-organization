# Security review checklist

Use this checklist only after tracing the real runtime path. A checked box without code, data, or
runtime evidence is not proof.

## Identity and authorization

- Authentication fails closed and rotates/revokes credentials on lifecycle changes.
- Every state-changing/read-sensitive route enforces server-side permission, tenant, and object scope.
- Cross-tenant probes do not reveal existence; background jobs carry authoritative tenant context.
- Database roles, RLS, `SECURITY DEFINER` search paths, grants, and ownership are inspected directly.

## Inputs, outputs, and side effects

- External input is normalized, bounded, schema-validated, and tested with malformed/duplicate forms.
- Uploads use magic bytes, size/duration/codec checks, isolated storage, and no path traversal.
- Provider/webhook signatures are verified before persistence or side effects; replays are idempotent.
- Every paid or irreversible attempt has a durable pre-spend/pre-submit claim and indeterminate state.
- Logs, errors, metrics, and audit metadata exclude secrets, tokens, payloads, transcripts, and PII.

## Secrets and execution boundaries

- No secret reaches source, client bundles, command output, logs, or broadly readable configuration.
- Shell/process construction avoids string concatenation and unsafe interpreter crossings.
- SSRF-capable URLs are allowlisted by resolved destination and redirects are revalidated.
- CI/dependencies are pinned or verified, scanners run with their own exits, and waivers expire.

## Verification

- Positive liveness and cross-tenant/unauthorized negative tests reach the real authority.
- Sequential retry and concurrent duplicate triggers are both exercised.
- A hostile-shadow or bypass mutation fails for privileged database functions and central seams.
- The reviewer opens persisted rows/rendered artifacts/raw provider results, not only summaries.
- Findings list surfaces not reached and no unreviewed code is called clean.
