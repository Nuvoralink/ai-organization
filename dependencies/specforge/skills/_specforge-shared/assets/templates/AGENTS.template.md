# AGENTS.md

## Repository purpose

This repository is governed by the planning docs in `docs/app-plan/`. Treat the product brief, PRD, architecture, data contracts, security design, and decision register as the source of truth before making product or implementation changes.

## Source of truth

Read these before product, architecture, data, security, or AI-agent changes:

- `docs/app-plan/README.md`
- `docs/app-plan/product/02-prd.md`
- `docs/app-plan/architecture/06-architecture.md`
- `docs/app-plan/data-and-api/08-data-model-and-data-contracts.md`
- `docs/app-plan/data-and-api/09-api-and-integration-contracts.md`
- `docs/app-plan/security/10-security-design.md`
- `docs/app-plan/security/11-threat-model.md`
- `docs/app-plan/engineering/12-engineering-rules.md`
- `docs/app-plan/engineering/14-ai-development-guardrails.md`
- `docs/app-plan/engineering/15-blast-radius-and-change-risk.md`
- `docs/app-plan/auditability/decision-log.md`

## Working rules

- Do not invent features.
- Do not change unrelated files.
- Do not add production dependencies without approval, reasoning, alternatives, security impact, and license notes.
- Do not change authentication, authorization, payments, migrations, data retention, data deletion, production config, CI/CD, or admin tools without explicit approval.
- Do not weaken validation, security, logging, tests, accessibility, or privacy controls to make a task pass.
- Do not log secrets or personal data.
- Do not store secrets in source code.
- Keep diffs focused and reviewable.
- Do root-cause analysis before fixing issues or updating stale docs.
- Do not choose the easiest path if it weakens correctness, security, privacy, tests, accessibility, maintainability, or reversibility.
- When a decision matters, compare alternatives and record the final recommendation, tradeoffs, verification, and reversal trigger.
- For architecture, platform, roadmap, and phase-foundation work, apply `docs/app-plan/architecture/06-architecture.md`'s future-capability/seam map: build an extension seam now only when retrofit is cross-cutting/expensive, the boundary is stable in domain terms, and a real current flow exercises it. Later features must extend the named authority, not create a parallel system. Do not add dead flags/enums/tables or guessed provider interfaces; a concrete one-off stays concrete when no approved second consumer exists.
- Update docs when behavior, contracts, architecture, security assumptions, or protected workflows change.

## Testing and checks

Before proposing completion, run the project checks listed here:

```bash
python .agents/skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan
```

When `docs/app-plan/implementation/` exists or implementation artifacts were changed, also run:

```bash
python .agents/skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

Also run the repo-specific lint, typecheck, build, test, and smoke commands recorded in `docs/app-plan/engineering/13-testing-quality-release-observability.md`. If those commands are not yet defined, record that as a documentation gap instead of inventing commands.

If a command cannot run, explain why.

## Protected areas

Extra care is required for:

- Authentication
- Authorization
- Payments
- Personal data
- Admin tools
- Database migrations
- Secrets and environment config
- CI/CD pipeline
- Production deployment config
- AI tools, agents, RAG, and generated content

## Documentation rules

- If code behavior changes, update the relevant doc in `docs/app-plan/`.
- Documentation is part of done. If behavior, architecture, API contracts, DTOs,
  persistence, security/auth, AI behavior, model routing, runbooks,
  verification gates, or user-visible product rules change, update the live docs
  and docs index/routing layer in the same change.
- If an API changes, update `data-and-api/09-api-and-integration-contracts.md` and the API schema.
- If data shape changes, update `data-and-api/08-data-model-and-data-contracts.md`.
- If a security assumption changes, update `security/10-security-design.md` and `security/11-threat-model.md`.
- If architecture changes, add or update an ADR.
- If blast radius changes, update `engineering/15-blast-radius-and-change-risk.md`.
- If a material decision, default, or tradeoff changes, update `auditability/decision-log.md`.


## Documentation scope rules

- Business, policy, operations, supply-chain, cost, and analytics docs must stay aligned with product, privacy, security, architecture, and release docs.
- Do not add analytics events that collect personal or sensitive data unless privacy docs explicitly allow it.
- Do not add payments, subscriptions, app-store behavior, or AI features without updating compliance, security, privacy, testing, and blast-radius docs.
- Do not add or change environment variables, secrets, feature flags, deployment config, package dependencies, or migrations without updating the relevant docs in `docs/app-plan/`.


## Decision quality and root cause

- Ask only blocking questions. For non-blocking technical choices, research and recommend a default.
- When asking a user to choose, include options, pros, cons, a final recommendation, and the assumption if unanswered.
- Do not choose quick fixes or shortcut implementations when a durable fix is available.
- For bugs, stale docs, risky changes, auth, permissions, data, migrations, security, privacy, production config, and dependency changes, run root-cause analysis before editing.
- Do not reveal private reasoning. Show concise rationale, evidence, decision cards, tests, and diff summary.
- If a workaround is temporary, label it Temporary and include the proper fix plus removal trigger.

