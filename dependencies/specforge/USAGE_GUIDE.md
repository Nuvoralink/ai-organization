# SpecForge Core Usage Guide

Use SpecForge when you want Codex to create strong app planning documentation from an idea or repair documentation for an existing repo.

## The right way to use it

Start with a clear app idea, but do not over-explain every technical choice. SpecForge should ask only the questions that block good planning. For everything else, it should research and choose a best-fit default.

Good input:

```text
I want to build a mobile app that helps students plan revision sessions, track weak topics, and get reminders. It should start for individual students, not schools.
```

Weak input:

```text
I want an app for students.
```

Weak input still works, but Codex will need to ask more questions.

## New app workflow

Prompt:

```text
Use $specforge. I want to create an app that [describe your idea]. Ask only the most important decision-blocking questions. For every choice, give options, pros, cons, and your final recommendation. For everything else, research and use best-fit defaults. Do not take shortcuts. Use root-cause analysis where relevant. Generate the full docs package in docs/app-plan, run $specforge-reviewer, and run strict validation.
```

SpecForge should ask about:

- Core app purpose
- Target user
- Platform
- Sensitive data
- Payments or monetization
- User-generated content or messaging
- AI features
- Launch constraints

SpecForge should not ask you to decide every database, framework, logging tool, or deployment detail unless the choice is unusually risky or central to the app.

## Existing repo workflow

Prompt:

```text
Use $specforge-repo-audit. Read this repo. Do not change product code. Audit existing documentation against code, tests, routes, database schema, config, package files, and public behavior. Fix stale or missing docs. Preserve existing terminology and structure when possible. Ask only decision-blocking questions. Use root-cause analysis for documentation drift. Generate or update docs/app-plan, run $specforge-reviewer, and run strict validation.
```

SpecForge should:

- Search existing docs first.
- Compare docs against code evidence.
- Trust code over stale docs when behavior is clear.
- Preserve existing terminology.
- Update the smallest useful docs surface.
- Record repo evidence paths.
- Record what it could not prove.

SpecForge should not:

- Change product code.
- Invent behavior not found in the repo.
- Publish private customer information.
- Rewrite everything when targeted fixes are enough.

## Focused workflow

Use this when you need one area instead of a full documentation package:

```text
Use $specforge. Create a focused package for the security and threat-model docs for this app. Update only the docs needed for that outcome, keep security docs under security, put audit/research/decision artifacts under auditability, update the docs index, and update the quality review if material. Run strict validation with --profile focused.
```

Focused output should:

- Update only the docs that affect the requested product outcome.
- Keep real product, architecture, data, security, engineering, assurance, auditability, and implementation docs in their canonical folders.
- Record omitted docs in the docs index when they are intentionally outside scope.
- Still include requirement IDs, evidence labels, assumptions, decisions, sources, and verification methods.
- Use `--profile focused` so validation checks the generated docs without demanding unrelated full-package files.


## Discovery interview workflow

Use this when the app idea is still general and you want SpecForge to ask the right questions before generating docs:

```text
Use $specforge-discovery-interview. Treat this like a product-manager/developer client intake. Restate the product intent, ask only the decision-blocking questions, score unknowns with the decision matrix, recommend defaults for non-blocking choices, identify risk-trigger follow-ups, and tell me whether we can proceed to docs.
```

The interview should clarify product identity, MVP boundary, roles and permissions, source-of-truth expectations, risk triggers, hard constraints, and implementation readiness. It should not ask routine stack or tooling preferences unless those choices materially change risk or constraints.
## Implementation artifacts workflow

Use this after the planning docs have been created or repaired, reviewed, and validated:

```text
Use $specforge-implementation-artifacts. Read docs/app-plan and the repo evidence. Build the post-docs implementation artifact pack in docs/app-plan/implementation. Restate the product intent, audit the whole pipeline from source of truth to final user-visible output, research current official implementation best practices for this stack, create concrete slice specs, repo change maps, API/UI implementation contracts, migration and backfill plans, verification harnesses, rollout runbooks, implementation risk register, and safe Codex prompts, then run the implementation-artifact validator. Do not write product code unless I explicitly ask.
```

Implementation artifacts should:

- Use the validated SpecForge docs as source material, not replace them.
- Resolve source-of-truth conflicts before creating task specs.
- Map each slice to files or proposed file locations, data, APIs, UI, tests, release gates, rollback, observability, and docs updates.
- Use actual repo evidence paths in existing repo mode.
- Reject quick fixes that patch only a visible symptom while the upstream product, data, API, AI, permission, or display decision remains wrong.
- Pass `validate_implementation_artifacts.py --docs-dir docs/app-plan --strict` before being treated as implementation-ready.

## Decision workflow

Use this when you need one major decision:

```text
Use $specforge-decision-advisor. Help choose [decision] for this app. Give options, pros, cons, risk, implementation impact, final recommendation, rejected shortcuts, verification method, and reversal trigger.
```

Example:

```text
Use $specforge-decision-advisor. Help choose the database for a student revision planning app with accounts, reminders, progress tracking, and possible future parent dashboards.
```

Expected answer style:

```text
Recommendation: PostgreSQL.
Why: The app has structured user-owned records, permissions, history, and reporting needs.
Rejected shortcut: SQLite-only production backend, because it would limit multi-user deployment and operational scaling.
Reversal trigger: If the product becomes local-first with offline sync as a core requirement, revisit the storage and sync architecture.
```

## Output location

SpecForge writes the planning package here:

```text
docs/app-plan/
```

The root should contain `README.md` as the routing layer. Generated documents should be organized under:

```text
docs/app-plan/product/
docs/app-plan/architecture/
docs/app-plan/data-and-api/
docs/app-plan/security/
docs/app-plan/engineering/
docs/app-plan/assurance/
docs/app-plan/auditability/
```

Post-docs implementation artifacts go here:

```text
docs/app-plan/implementation/
```

Do not scatter generated planning docs or dump them all into `docs/app-plan/` unless your repo already has a strong docs structure that must be preserved.

## What good output looks like

Good SpecForge docs include:

- Requirement IDs
- Decision IDs
- Evidence labels
- Source register
- Assumptions
- Open questions
- Non-goals
- Acceptance criteria
- Threats, controls, and verification methods
- Data retention and deletion rules
- Rollback and observability plans
- Reversal triggers for decisions

Weak docs say things like:

```text
The app will be secure.
The system will be scalable.
Testing will be done.
Best practices will be followed.
```

Reject that output. Good docs define what those claims mean and how to verify them.

## Validation

Manual skill install:

```bash
python .agents/skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan --final --strict
```

Plugin repo testing:

```bash
python skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan --final --strict
```

Existing repo mode:

```bash
python .agents/skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan --final --strict --existing-repo
```

Focused package:

```bash
python .agents/skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir docs/app-plan --final --strict --profile focused
```

Implementation artifacts:

```bash
python .agents/skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

Plugin repo testing for implementation artifacts:

```bash
python skills/_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict
```

Add `--existing-repo` for repo-derived implementation packs and `--require-ai-matrix` when runtime AI, generated content, semantic decisions, scoring, ranking, classification, or recommendations are in scope.

Skill-pack quality self-test:

```bash
python scripts/quality_selftest.py
```

Use this after editing SpecForge itself. Golden docs and implementation fixtures must pass, and the intentionally bad docs and implementation fixtures must fail.

## How to use Core with a future Pro backend

Use Core to define the documentation standard.

Use Pro to automate:

- User onboarding
- Repo import
- AI job orchestration
- Document generation jobs
- Validation reports
- Exports
- Scheduled drift checks
- Team review workflows

Do not remove Core value. The open-source version should remain useful without the hosted product.

