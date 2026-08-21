---
paths:
  - "**/*"
---

# Functionality-first delivery

`.ai-organization/policies/delivery-lifecycle.v1.json` is the machine-readable authority. This rule
explains how to execute it; `gate:delivery-lifecycle` and `gate:provider-doc-evidence` make the contract
bite.

## The principle — prove the intended behavior first (founder directive, 2026-08-16)

Functionality-first exists to make delivery fast and cheap in time and tokens: prove the INTENDED CODE
BEHAVIOR actually happens — ideally on the real surface — BEFORE spending on security hardening, broad
audits, cleanup, or edge-polish. Working-but-unhardened beats hardened-but-unproven. This ordering
governs code: product behavior (real surface = the deployed user journey below) and controls/gates
(cheap proof = the red-on-mutation run). Docs, mocks, planning, and other non-functional tasks are
exempt — no staged lifecycle, no added ceremony. Hardening remains mandatory; it follows proven
behavior instead of impersonating it.

## Functional changes use one ordered lifecycle

A feature or functionality bug fix moves through these stages in order:

1. **Root cause and current contract.** Reproduce the real user-visible failure (deployed surface when
   reachable), trace the production source-to-effect path, and consult current official provider docs plus
   the installed SDK source/types before designing any provider behavior.
2. **Targeted implementation proof.** Implement the smallest durable root correction. Run the exact
   positive/negative test that bites the reported behavior and name its killer mutation.
3. **Deploy safety.** Prove only what is needed to avoid breaking migration/schema application, database
   integrity, build/startup, Railway deployment/readiness, or irreversible data. Do not spend the full
   hardening suite as a substitute for functional proof.
4. **Deployed functional proof.** With explicit human authority for production-affecting merge/deploy,
   deploy promptly and repeat the original user journey on the deployed artifact. Read its actual output:
   provider evidence, persisted row/artifact, audio/media, and visible behavior as applicable. When the
   founder can exercise the journey, founder acceptance is the functional-acceptance authority.
5. **Hardening and broad assurance.** Only after stage 4 passes, remediate queued audit findings and run
   broad security, compliance, performance, doctrine, parity, full-CI, cleanup, and optimization work.

Functionality-first changes remediation order, never auditor cadence. The adversarial reviewer and every
applicable domain/security/performance lens are **required before merge**, though they may start in parallel.
Classify every finding before merge. **BLOCK and fix now** when it affects intended behavior or a core journey,
is unknown/unverified, invalidates functional or release-safety evidence, or enters any build/migration/readiness,
security/auth/tenant/privacy/compliance, data-integrity/loss, irreversible/external/billed blocker class.
**FIX-NEXT** may wait until after deployed functional proof only when evidence proves it is bounded, fails safely,
leaves core functionality working, is outside every blocker class, and has a durable backlog row before merge.

Merge preparation is concurrent. If a red gate is proven to be only documentation, file-map, or another
non-functional projection drift, assign that repair in parallel and keep implementation, focused proof,
auditing, and real-blocker repair moving. This is not a waiver: every required gate must be green before final
merge, and an unclassified gate failure or one that undermines functional/release-safety evidence stays BLOCK.

This lifecycle does not grant production authority. Production-affecting merge/deploy remains human-gated
by `action-authority.v1.json`; once authorized, ceremony must not delay the functional feedback loop.

## Provider work is docs-and-SDK-first

Any production change that touches a provider contract MUST, before code:

- open the current official leaf documentation for the exact capability;
- inventory the installed SDK's exported method/types and prefer the supported SDK capability;
- record exact request/response/webhook identifiers, idempotency/retry semantics, event ordering, and what
  the docs do not state;
- add/update a structured entry in
  `docs/app-plan/auditability/provider-proof/change-evidence.json` covering every changed provider path;
- plan one deployed smoke that proves the provider effect, not merely a mocked adapter.

Training data, recollection, third-party tutorials, and tests shaped from the implementation are leads, not
provider authority. Custom protocol/signing/serialization code is forbidden when the installed SDK already
owns the capability unless the evidence entry names the verified SDK gap and why the custom path is needed.

*Fail-state:* “functionality-first” is used to skip an applicable auditor or backlog an unverified/core-
functionality finding; proven non-functional drift serializes all merge preparation; broad closure runs before anyone proves the original behavior; or provider code is invented
from memory while an official SDK method exists.

*Killer mutations:* reorder broad hardening before deployed functional proof; set `required_before_merge=false`;
allow final merge with a required gate red; make proven file-map drift freeze merge preparation;
classify a core-journey failure as FIX-NEXT; change provider evidence to training-data-only; or modify a provider
production path without same-diff official-doc/SDK evidence. The two delivery gates must turn red.

*Counterexamples:* a verified bounded edge-case polish item may be backlogged; proven stale file-map drift is
repaired concurrently without pausing functional work, but final merge still waits for that gate to turn green.
