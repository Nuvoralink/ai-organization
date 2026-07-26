# SpecForge Core

SpecForge Core is a free Codex plugin and skill pack that turns an app idea, or an existing codebase, into evidence-backed product, architecture, security, data, operations, and AI guardrail documentation.

It is built for developers, indie builders, students, agencies, and teams that want better planning before implementation.

## What it creates

SpecForge can generate a complete planning package in `docs/app-plan/` without dumping every file into one folder:

- `README.md` as the top-level index and routing layer
- `product/` for product brief, PRD, feature scope, flows, UX/content, business, analytics, glossary, and platform contracts
- `architecture/` for architecture and ADRs
- `data-and-api/` for data, DTO, API, integration, and schema contracts
- `security/` for security, threat model, privacy, compliance, trust, safety, and abuse controls
- `engineering/` for engineering rules, AI guardrails, blast radius, testing, release, observability, runbooks, dependency, cost, and performance docs
- `assurance/` for source-of-truth, decision-boundary, surface-authority, and validation controls
- `auditability/` for documentation audits, quality reviews, decision logs, research ledgers, and documentation lifecycle docs
- `implementation/` for implementation task plans and post-docs implementation artifacts

Existing repo mode also creates a documentation audit and repairs stale or missing docs. For targeted requests, SpecForge should use a focused package instead of creating filler docs that are outside the user's goal.

## Why SpecForge exists

AI often writes documentation that sounds complete but cannot guide implementation. SpecForge is designed to reduce that problem. It now separates product discovery from broad documentation generation so vague app ideas are interviewed with a product-manager/developer decision matrix before docs are written.

It forces Codex to:

- Ask only the most important questions.
- Recommend defaults with options, pros, cons, and final recommendations.
- Research current official guidance when available.
- Mark assumptions instead of pretending certainty.
- Record decisions, sources, risks, and open questions.
- Use root-cause analysis for doc drift and weak decisions.
- Reject shortcuts, vague claims, and generic filler.
- Run a reviewer and strict validator before marking docs ready.
- Compare generated docs against golden examples and bad fixtures when testing the skill pack.

## Install option 1, Codex plugin

Open a local checkout of this repo.

Add this repo as a local marketplace while testing:

```bash
codex plugin marketplace add ./
```

Then open Codex and install the `specforge` plugin from the local marketplace.

For a published GitHub repo, users can add the marketplace source using its repository slug:

```bash
codex plugin marketplace add owner/specforge
```

## Install option 2, manual skill install

Copy the `skills/` folder contents into the target repository:

```text
repo-root/.agents/skills/
```

The final path should look like this:

```text
repo-root/.agents/skills/specforge/SKILL.md
repo-root/.agents/skills/specforge-repo-audit/SKILL.md
repo-root/.agents/skills/_specforge-shared/
```

You can use the helper script:

```bash
python scripts/install_manual.py --target /path/to/target/repo
```

## Quick start, new app idea

Use this in Codex:

```text
Use $specforge. I want to create an app that [describe the app idea]. Ask only the most important decision-blocking questions. For every choice, give options, pros, cons, and your final recommendation. For everything else, research and use best-fit defaults. Do not take shortcuts. Generate the full docs package in docs/app-plan, run $specforge-reviewer, and run strict validation.
```

## Quick start, existing repo

Use this from the repo root:

```text
Use $specforge-repo-audit. Read this repo. Do not change product code. Audit existing documentation against the codebase, tests, config, routes, database schema, and package files. Fix stale or missing docs. Ask only decision-blocking questions. Use root-cause analysis for documentation drift. Generate or update docs/app-plan, run $specforge-reviewer, and run strict validation.
```

## Quick start, focused docs

Use this when you only need one area:

```text
Use $specforge. Create a focused package for [area]. Update only the docs needed for this outcome, keep product docs in their domain folders, put audit/research/decision artifacts under auditability, and update the quality review if the change is material. Run strict validation with --profile focused.
```

## Quick start, implementation artifacts

Use this after the core docs package has been generated, reviewed, and validated:

```text
Use $specforge-implementation-artifacts. Read docs/app-plan and the repo evidence. Build the post-docs implementation artifact pack in docs/app-plan/implementation. Restate the product intent, audit the full pipeline from source of truth to final user-visible output, research current official implementation best practices for this stack, create concrete slice specs, repo change maps, API/UI contracts, migration plans, verification harnesses, rollout runbooks, risk register, and safe Codex implementation prompts, then run the implementation-artifact validator. Do not write product code unless I explicitly ask.
```

The implementation artifact pack should not replace the planning docs. It should turn the validated docs into buildable implementation documents with file-level scope, root source-of-truth ownership, downstream consumers, tests, rollback, observability, and documentation updates for each slice.

## Validate generated docs

If you installed skills manually into the target repo:

```bash
python .agents/skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan --final --strict
```

If you are testing from this repository:

```bash
python skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan --final --strict
```

For existing repos, add:

```bash
--existing-repo
```

For focused packages, add:

```bash
--profile focused
```

Validate post-docs implementation artifacts:

```bash
python .agents/skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

When testing from this repository:

```bash
python skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

Add `--existing-repo` for repo-derived packs and `--require-ai-matrix` when runtime AI, generated content, semantic decisions, scoring, ranking, classification, or recommendations are in scope.

## Validate the skill pack itself

Run this before publishing or after changing quality rules:

```bash
python scripts/quality_selftest.py
```

The self-test verifies that golden focused examples and golden implementation artifacts pass, while intentionally surface-level docs and sloppy implementation artifacts fail.

## Skill list

Main skills:

- `$specforge`
- `$specforge-repo-audit`
- `$specforge-reviewer`
- `$specforge-discovery-interview`
- `$specforge-decision-advisor`

Section skills:

- `$specforge-product-scope`
- `$specforge-ux-ui-content`
- `$specforge-architecture`
- `$specforge-data-contracts`
- `$specforge-security-threat-model`
- `$specforge-privacy-compliance`
- `$specforge-business-gtm-monetization`
- `$specforge-compliance-policy`
- `$specforge-trust-safety-abuse`
- `$specforge-engineering-rules`
- `$specforge-environment-config-secrets`
- `$specforge-dependency-supply-chain`
- `$specforge-quality-release-observability`
- `$specforge-operations-runbooks`
- `$specforge-cost-capacity-performance`
- `$specforge-analytics-metrics`
- `$specforge-glossary-taxonomy`
- `$specforge-platform-feature-contracts`
- `$specforge-implementation-task-plan`
- `$specforge-implementation-artifacts`
- `$specforge-ai-guardrails`
- `$specforge-blast-radius-change-risk`

## Core vs Pro

SpecForge Core is free and open source.

SpecForge Pro is the commercial backend and hosted workflow layer. It can add:

- Web app onboarding
- Project workspaces
- Repo connections
- Generated doc storage
- Export to GitHub, Notion, Linear, and Jira
- Continuous documentation drift checks
- Team accounts and review workflows
- Industry-specific templates
- Advanced validation reports
- Paid support

Core should stay useful on its own. Pro should add workflow, automation, integrations, and hosting.

## License

MIT. See `LICENSE`.

## Safety and review

SpecForge does not guarantee a bug-free, secure, compliant, or production-ready app.

It creates better documentation and review artifacts. Humans still need to review legal, security, accessibility, privacy, and regulated-domain decisions.

## New in v1.1.0

SpecForge now includes an assurance architecture layer.

This adds documentation and guardrails for:

- product assurance contracts;
- source-of-truth maps;
- AI-vs-deterministic boundaries;
- prompt and decision matrices;
- bounded remediation;
- surface authority maps;
- first-viewport acceptance;
- golden fixtures and trust testing;
- documentation authority lifecycle.

Use `$specforge-assurance-architecture` when the app has AI output, recommendations, scoring, dashboards, generated content, workflow status, role-based controls, admin actions, billing, exports, or any user-visible claim that can become stale, unsupported, or misleading.



