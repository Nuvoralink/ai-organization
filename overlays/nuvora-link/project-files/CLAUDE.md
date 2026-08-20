# Nuvora Link Claude entry point

@AGENTS.md

Use `AGENTS.md` as the compact cross-tool router. Load only the task-matched path-scoped rule and product authority. The installed `.ai-organization/` runtime, policies, schemas, role registries, ownership metadata, and automations are generated from the canonical AI Organization overlay.

Visible frontend work is Claude-Design-first and approval-gated. The integration branch is `develop`; production-affecting actions remain governed by `.ai-organization/policies/action-authority.v1.json`.

Functional code changes follow `.claude/rules/functionality-first-delivery.md`: intended behavior is proven on the deployed surface before broad hardening; applicable independent auditors are required before merge and classify BLOCK versus verified durably-backlogged FIX-NEXT. Functionality-first changes remediation order, never auditor cadence; docs/mocks/planning are exempt.
