---
paths:
  - "**/*"
---
# Functionality-first delivery

`.ai-organization/policies/delivery-lifecycle.v1.json` is the machine-readable authority.

Functionality-first exists to make delivery fast and cheap in time and tokens: prove the INTENDED CODE
BEHAVIOR actually happens — ideally on the real surface — BEFORE spending on security hardening, broad
audits, cleanup, or edge-polish. Working-but-unhardened beats hardened-but-unproven. This ordering governs
code: product behavior (real surface = the deployed Nuvora Link site) and controls/gates (cheap proof =
the red-on-mutation run). Docs, mocks, planning, and other non-functional tasks are exempt — no staged
lifecycle, no added ceremony. Hardening remains mandatory; it follows proven behavior instead of
impersonating it.

A feature or functionality bug fix moves through these stages in order:

1. **Root cause and current contract** — reproduce the real user-visible failure (deployed surface when
   reachable), trace the production source-to-effect path, and consult current official provider docs plus
   the installed SDK source/types before designing any provider behavior.
2. **Targeted implementation proof** — the smallest durable root correction plus the exact
   positive/negative test that bites the reported behavior, with its named killer mutation.
3. **Deploy safety** — prove only migration/schema application, database integrity, build/startup,
   deploy/readiness, and irreversible-data protection; never the full hardening suite as a substitute.
4. **Deployed functional proof** — with explicit human authority for production-affecting merge/deploy,
   repeat the original user journey on the deployed Nuvora Link site and read its actual output. Human
   acceptance is the functional-acceptance authority when the human can exercise the journey.
5. **Hardening and broad assurance** — only after stage 4, remediate queued audit findings and run broad
   security, doctrine, parity, full-CI, cleanup, and optimization work.

Functionality-first changes remediation order, never auditor cadence. Applicable independent auditors are
required before merge and may run in parallel. Classify every finding before merge: fix BLOCK findings now;
queue only verified bounded fail-safe FIX-NEXT residuals outside every blocker class, each with a durable
backlog row before merge.

Merge preparation is concurrent. Proven documentation/file-map/non-functional projection drift gets an active
parallel repair owner and does not pause implementation, focused proof, auditors, or real-blocker repair. Every
required gate must still be green before final merge; an unclassified or functional/release-proof-invalidating
gate failure remains BLOCK.

Provider-touching code is docs-and-SDK-first: open the current official leaf documentation for the exact
capability, inventory the installed SDK's exported methods/types, record exact contract claims
(request/response/webhook identifiers, idempotency/retry, ordering), and plan one deployed smoke — with
the evidence in the same diff. Never invent provider behavior from training memory or tutorials; custom
protocol code is forbidden when a supported SDK capability exists.

This rule grants no production authority; `.ai-organization/policies/action-authority.v1.json` still
gates production-affecting actions. *Fail-state:* functionality-first is used to skip an applicable auditor,
queue an unverified/core-journey finding, or serialize merge preparation behind proven non-functional drift;
broad closure runs before behavior proof; or provider code is invented from memory while an official SDK method
exists. Killer mutations: set `required_before_merge=false`, permit final merge while a required gate is red,
make proven file-map drift freeze merge preparation, or remove the core-journey blocker class. Counterexample:
proven stale file-map drift is repaired concurrently, but final merge still waits for green.
