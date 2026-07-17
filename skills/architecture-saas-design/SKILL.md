---
name: architecture-saas-design
description: Use when designing or reviewing system architecture, SaaS architecture, multi-tenant boundaries, role models, dual-auth systems, RBAC, service boundaries, tenancy isolation, data ownership, AI/token metering, quota and budget controls, scale paths, and architecture tradeoffs.
---

# Architecture SaaS Design

Design architecture from product and trust boundaries first, then fit the implementation to those boundaries.

## Core Questions

- Who are the actors, tenants, roles, and ownership boundaries?
- What data must be isolated, shared, audited, retained, or deleted?
- Which operations require strong authorization, idempotency, audit trails, or background processing?
- What contracts need to be stable across backend, frontend, jobs, and integrations?
- Where does the current architecture fight the ideal product outcome?

## Consolidate by replacing, not layering

When the recommendation is to consolidate, centralize, or unify — one source of truth, one authority, one classifier, one validator — the design is not complete until the OLD paths are DELETED or explicitly demoted to a single named non-authoritative role *in the same change*. Adding the new component on top of the old ones leaves multiple producers of the same authoritative output racing each other; they drift and the wrong (often less-informed) one wins on some input — a latent bug that surfaces later. "We built the central X" is not done; "X is the only thing that produces this decision, and the old producers are removed or provably demoted" is done. For each consolidated decision, state the single authority and exactly what was removed; grep the old symbol/path to confirm no orphaned producer remains.

## Use References

- General system architecture: `references/system-architecture-design.md`
- Multi-tenant SaaS architecture: `references/multi-tenant-saas-architecture.md`
- Dual auth and RBAC: `references/dual-auth-rbac.md`
- AI metering, token ledgers, quotas, budgets, and tenant billing aggregation: `references/ai-metering-billing.md`

## Output

Name the ideal architecture, compare it to the current system, then recommend the smallest durable changes that move the product toward the ideal without weakening security or maintainability.
