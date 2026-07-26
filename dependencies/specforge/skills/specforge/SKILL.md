---
name: specforge
description: Turn an app idea or existing repo into evidence-backed app specs, architecture, security docs, AI guardrails, decisions, and implementation-ready documentation. Use for greenfield planning, repo documentation repair, minimal guided interviews, researched defaults, and anti-slop review.
---

# SpecForge

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Apply `../_specforge-shared/references/evolutionary-architecture-doctrine.md` to architecture, platform, roadmap, phase-foundation, and implementation-artifact work. Audit approved future consumers, plant only expensive-to-retrofit seams exercised by a real current flow, and forbid both present-only hardcoding and speculative frameworks.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose shortcuts, workaround fixes, or vague placeholders.
- Apply the guided interview protocol in `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` and no-shortcuts protocol in `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material choices, recommendations, and user-facing questions.
- Use private multi-option deliberation for material decisions. Do not reveal private reasoning; output only decision cards, concise rationale, pros and cons, recommendation, confidence, and reversal triggers.
- Run root-cause analysis for conflicts, stale docs, missing requirements, weak decisions, risky shortcuts, and repo-document mismatches before proposing fixes.
- Prefer durable, standard-aligned solutions over quick fixes. If a temporary workaround is unavoidable, label it `Temporary`, explain the risk, define the proper fix, and set the removal trigger.
- Keep the scope proportional to the app's risk, data sensitivity, expected scale, and user impact. Avoid both under-specification and needless enterprise bloat.
- Label every material claim as User-confirmed, Repo-derived with evidence path, Standard-backed with source title and version/date, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, policies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.
- Apply the anti-slop and document-quality rubrics before finishing.
- Every requirement must have an ID, source, owner or affected role, verification method, risk level, and related document links.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Do not output placeholder tokens such as TODO, TBD, lorem ipsum, `[fill in]`, or fake example values as if they are real.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, environments, metrics, and risks must use the same IDs and names.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.


## Purpose

Turn a raw app idea or an existing repository into a complete, traceable, research-backed specification and documentation package that constrains future AI coding work.

This skill removes human-process steps such as user testing, market interviews, and iteration loops. It focuses on what Codex can do: interview the user, research, inspect a repo, create docs, update docs, create rules, create guardrails, validate docs, and write repo instructions.

After the core docs are complete and validated, SpecForge can hand off to `$specforge-implementation-artifacts` to create concrete implementation documents under `docs/app-plan/implementation/`. That post-docs phase turns the plan into file-level, contract-level, test-level, rollout-level, and Codex-prompt artifacts without writing product code unless the user explicitly asks for implementation.

## Scope profile

Choose the documentation scope before creating files:

1. Full package: use when the user asks for a full app plan, complete docs package, greenfield planning package, or repo-wide documentation rebuild. Generate the full required map in `document-specification.md`.
2. Focused package: use when the user asks for one area, a targeted audit, a single decision, or repair of specific docs. Update only the docs needed for that product outcome, plus `README.md`, `auditability/decision-log.md`, `auditability/research-ledger.md`, and `auditability/documentation-quality-review.md` when the change is material.
3. Existing repo repair: use when current docs are stale or missing. Inspect code evidence first, then update the smallest documentation surface that restores source-of-truth accuracy.

Do not turn a focused request into a full package unless the missing docs materially block the user's outcome. If scope must expand, state why and proceed only as far as needed for correctness.

## Modes

Detect the mode first:

1. Greenfield idea: the user gives an app idea and no repo exists.
2. Existing repo: the user asks to read a repo, audit docs, fix docs, or generate docs from code.
3. Hybrid: the user gives an idea and there is already a repo.

In existing repo or hybrid mode, run `$specforge-repo-audit` before drafting final docs or asking non-blocking questions, so repo evidence answers what it can.

## Required interview behavior

Ask the fewest questions needed to avoid wrong assumptions. Run `$specforge-discovery-interview` for vague app ideas, client briefs, early product concepts, and any request where interview order or decision-blocking questions are unclear. Use `../_specforge-shared/references/interview-question-bank.md` and `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` as supporting references only.

Default limits:

- Initial interview: at most 5 questions.
- Follow-up interview: at most 3 questions.
- Extra questions are allowed only for blockers that affect safety, legality, privacy, data exposure, payments, minors, production access, or the core app definition.

Do not ask questions already answered by the user or repo evidence.

Do not ask preference-heavy questions when Codex can make a researched recommendation. For stack, architecture, database, auth, analytics, CI/CD, observability, security baseline, hosting, API style, and documentation structure, research current best practice and recommend a default unless the user gives a hard constraint.

When a user-facing question asks what to do or what to use, include:

- Why the decision matters.
- Recommended default.
- Options with pros and cons.
- Final recommendation.
- What Codex will assume if the user does not answer.

Prioritize questions in this order:

1. Core app definition, target user, and hard non-goals.
2. Must-have features that define the MVP.
3. User roles, permissions, and protected actions.
4. Sensitive data, retention, deletion, audit needs, minors, payments, UGC, AI, or regulated-domain triggers.
5. Hard constraints: platform, stack, launch region, existing repo path, files that must not be touched, required providers, budget ceiling, or deadline.

For the rest, proceed with researched defaults. Record them as Standard-backed or Assumption in the decision and defaults register and assumptions register.

After the interview, summarize what the user confirmed, what Codex will decide from research, what assumptions will be used, and which high-risk unknowns remain. Then proceed unless a blocker remains.

## Required research protocol

Run research to support material decisions, drift-prone claims, regulated/policy areas, current product/platform behavior, dependency choices, provider capabilities, pricing/cost assumptions, security standards, privacy/compliance duties, and generated defaults. Batch research by document or decision area; do not perform a shallow web search for every heading.

For stable repo-derived or user-confirmed facts, cite the repo path or user answer instead of browsing. If online research is unavailable, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.

Use this research prompt internally:

```text
Research the newest official and authoritative best practices for [section] for this app type, platform, stack, launch region, data sensitivity, and risk level. Prefer official standards, official framework docs, OWASP, NIST, CISA, W3C, OpenAPI, cloud provider docs, CI provider docs, deployment platform docs, app-store policy docs, payment provider docs, auth provider docs, analytics provider docs, and official library docs. Record source title, owner, version or date, URL, stable or draft status, document sections affected, requirement IDs affected, and recommended default decisions affected. Compare credible options. Recommend the best course for this app with pros, cons, verification method, and reversal trigger. Do not use outdated blog guidance when official docs exist. If current internet access is unavailable, use the baked-in source map and say so.
```

Always include `Sources and basis` in generated docs. When research affects requirements or defaults, record the official source title, owner, version/date, URL if available, stability, affected doc sections, and affected requirement or decision IDs.

## Required decision protocol

Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` and `$specforge-decision-advisor` before material recommendations.

For every major decision, internally evaluate root cause, alternatives, tradeoffs, risks, verification, and reversal triggers. Do not display private chain-of-thought. Output only the decision summary, evidence, pros and cons, final recommendation, risks, and verification plan.

A decision is material when it affects product scope, architecture, data model, API contract, security, privacy, compliance, platform policy, AI behavior, payments, analytics, release safety, operational readiness, dependencies, cost, or repo guardrails.

Never choose a shortcut because it is easier. Choose the best fit for the app's risk level and context. The best fit may be simple, but it must be durable, testable, secure, maintainable, and reversible.

Record decisions and defaults in `docs/app-plan/auditability/decision-log.md` for focused or existing-repo packages. Legacy flat `decision-log.md` remains accepted only when repairing an older package.

## Output map

Create or update `docs/app-plan/` according to the selected scope profile and `../_specforge-shared/references/document-specification.md`.

Do not dump all generated docs into the root of `docs/app-plan/`. The root is only the package index and routing layer. Put documents in the folder that matches their product purpose:

- `README.md`: top-level docs index, source register summary, document map, and routing layer.
- `product/`: product brief, PRD, feature scope, flows, UX/UI/content, business, analytics, glossary, and platform contracts.
- `architecture/`: architecture, ADR index, and ADR files.
- `data-and-api/`: data model, data contracts, API contracts, integration contracts, and schema artifacts such as OpenAPI.
- `security/`: security design, threat model, privacy, compliance, and trust/safety docs.
- `engineering/`: engineering rules, testing/release/observability, AI guardrails, blast-radius, environment, runbooks, dependency, cost, capacity, and performance docs.
- `assurance/`: source-of-truth, decision-boundary, surface-authority, validation-fixture, and product-assurance controls that keep user-visible claims honest.
- `auditability/`: documentation audit, quality review, research ledger, decision log, documentation lifecycle, assumptions/open-questions registers when split out, and other provenance or meta-docs.
- `implementation/`: implementation task plan and post-docs implementation artifacts.

Focused and existing-repo packages must use descriptive lowercase kebab-case filenames inside the relevant folder. Numbered filenames are accepted for the primary numbered product docs, but meta-docs such as documentation audit, documentation quality review, decision log, and research ledger must live under `auditability/`.

Flat root-level documents are legacy aliases only. Do not create new packages that put audit, review, research, decision, assurance, engineering, product, or implementation docs directly in `docs/app-plan/` unless the target repo already established that convention and moving would break existing links.

Always create `docs/app-plan/auditability/decision-log.md` to record user-confirmed decisions, AI-recommended defaults, options considered, pros and cons, rejected shortcuts, root-cause notes, verification methods, and reversal triggers.

Always create `docs/app-plan/auditability/research-ledger.md`, even when online research is unavailable. In that case, record the baked-in baseline and unavailable sources.

For an existing repo, also create or update `docs/app-plan/auditability/documentation-audit.md`.

After full-package generation, create `docs/app-plan/auditability/documentation-quality-review.md` using `$specforge-reviewer`. For focused packages, create or update the quality review when the change affects material decisions, source-of-truth docs, security/privacy/compliance, AI behavior, naming, or future implementation rules.

When a required document is in scope and can be created or updated from user, repo, or official-source evidence, create or update the document. Do not merely write an audit finding that says the user or a future agent should create a security, privacy, threat-model, architecture, API, runbook, or quality document. If a living document for that area already exists, update and route that existing document instead of creating a duplicate authority. Only defer document creation when it is out of scope, legally/operationally blocked, or missing a blocking source; record the trigger and impact in `auditability/documentation-audit.md` and `auditability/decision-log.md`.

If the repo lacks `AGENTS.md`, create a proposed `AGENTS.md` from `../_specforge-shared/assets/templates/AGENTS.template.md`. If `AGENTS.md` exists, update it only after preserving existing project-specific instructions.

If no repo instruction surface contains a docs-drift prevention rule, create
one in the repo's preferred rule location. Prefer `AGENTS.md`; if the repo
already uses Cursor rules, also update the relevant `.cursor/rules/*.mdc`.
The rule must require future behavior, architecture, API, data-contract, DTO,
persistence, security/auth, AI, runbook, verification-gate, and product-rule
changes to update the live docs and documentation index/routing layer in the
same change.

## Post-docs implementation artifacts

Run `$specforge-implementation-artifacts` only after the core docs package exists and `$specforge-reviewer` plus strict validation have run, unless the user explicitly asks for a draft implementation pack.

Use this post-docs phase when the user asks for implementation documents, implementation artifacts, build docs, engineering execution docs, coding handoff docs, or task specs that are ready for future Codex implementation.

The implementation-artifacts phase must:

- Restate the product intent before planning the build.
- Audit the full implementation pipeline from requirement to source of truth, data model, API or integration, persistence, UI or output surface, validation, tests, release, rollback, observability, and docs update path.
- Research current official stack and industry best practices for the framework, database, API style, auth, security, privacy, testing, CI/CD, deployment, accessibility, observability, and AI or model behavior when applicable.
- Create concrete artifacts under `docs/app-plan/implementation/`, including slice specs, repo change maps, API and UI implementation contracts, migration/backfill plans, verification harnesses, rollout runbooks, risk registers, and safe Codex implementation prompts as applicable.
- Use actual repo evidence paths and commands when a repo exists; mark proposed paths as assumptions only in greenfield mode.
- Treat validators and tests as backstops. The root implementation decision must still be carried from the correct upstream source of truth into the final user-visible or machine-consumed output.
- Create a future-capability/foundation-seam map. Every planted seam names a real current liveness consumer; every later slice names the existing authority it extends and the parallel authority it must not create. Unknown provider contracts remain documented extension points, not guessed runtime interfaces.
- Run `../_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict` after generating the implementation pack, adding `--existing-repo` for repo-derived packs and `--require-ai-matrix` when AI, scoring, ranking, semantic decisions, generated content, or recommendations are in scope.

If the implementation pass finds stale, contradictory, or missing source-of-truth docs, fix the owning docs first or record the blocker clearly. Do not paper over documentation conflicts by generating generic implementation tasks.

## Execution sequence

1. Classify mode: greenfield, existing repo, or hybrid.
2. Select scope profile: full package, focused package, or existing repo repair.
3. Read only the shared references needed for that scope: document specification, document-quality acceptance tests, quality rubrics, guided interview protocol, no-shortcuts decision protocol, evolutionary architecture doctrine for architecture/platform/roadmap/foundation work, source map, assurance/source-of-truth patterns, interview question bank, and repo audit rubric as applicable.
4. If repo exists, run `$specforge-repo-audit` and collect evidence paths before asking questions that repo evidence may answer.
5. Run `$specforge-discovery-interview` to restate product intent, choose the minimal interview questions, score decision-blocking unknowns, and identify risk-trigger follow-ups.
6. Run `$specforge-decision-advisor` only for material choices that need explicit options, pros, cons, recommendation, and reversal trigger.
7. Ask only decision-blocking questions, with recommendations, pros, cons, and confirmation needs. For non-blocking gaps, research and choose best-fit defaults.
8. Create or update Assumptions Register, Open Questions Register, and `auditability/decision-log.md`.
9. Generate only the section docs required by the selected scope. For a full package, run the section skills in document order. For a focused package, run only the relevant section skills.
10. Decide whether the assurance extension is needed. If Tier 1, add source-of-truth and surface authority coverage where it fits. If Tier 2 or Tier 3, generate the full assurance extension using `$specforge-assurance-architecture`.
11. Create or update docs index, `auditability/research-ledger.md`, and `auditability/decision-log.md`.
12. Run validation script if available without `--final` to catch missing core docs. Use `--profile focused` for focused packages and the default full profile for full packages.
13. Run `$specforge-reviewer` and fix issues it finds.
14. Run validation script again with `--final --strict`, add `--profile focused` for focused packages, add `--existing-repo` in existing repo mode, and add `--assurance` only when the full assurance extension was triggered. Then run `../_specforge-shared/scripts/check_repo_doc_quality.py --repo-root . --docs-dir docs/app-plan --strict --final` with the same mode flags to catch broken links, missing docs-index routing, legacy focused filenames, audit-only "create this later" recommendations, and missing quality-review sections.
15. If the user requested implementation documents or implementation artifacts, run `$specforge-implementation-artifacts` after validation, create or update `docs/app-plan/implementation/`, then run `../_specforge-shared/scripts/validate_implementation_artifacts.py --docs-dir docs/app-plan --strict` with applicable `--existing-repo` and `--require-ai-matrix` flags. Include the implementation-artifact validation result. If the user did not request that phase, include a suggested next prompt that can trigger it safely.
16. Return a summary with generated files, assumptions, unresolved questions, research status, validation result, quality review result, assurance architecture gaps, implementation-artifacts status, AI-recommended defaults, and next safe Codex prompt.

## Documentation standards

Every requirement must be traceable to one of:

- User answer
- Repo evidence
- Official source or standard
- Explicit assumption

Every feature must include:

- Feature ID
- User story
- Acceptance criteria
- Edge cases
- Empty states
- Error states
- Permissions
- Data touched
- Security and privacy notes
- Abuse cases
- Test requirements

Every material decision must include:

- Decision ID or ADR ID
- Decision statement
- Context
- Options considered
- Pros and cons
- Final recommendation
- Why this is the best course
- Shortcut or weak option rejected, when relevant
- Tradeoffs
- Risks and mitigations
- Verification method
- Reversal trigger
- Related requirements and docs

Every high-risk workflow must include:

- Risk ID
- Risk level
- Blast radius
- Required controls
- Required tests
- Required documentation updates
- Rollback or containment notes

Every AI-recommended default and material decision must include:

- Decision ID
- Decision area
- Options considered
- Pros and cons
- Final recommendation
- Source basis
- Why this is the best course
- Why not the easier shortcut, when relevant
- Verification method
- Reversal trigger
- Related requirements, risks, controls, ADRs, and docs

Every business, policy, operational, supply-chain, cost, and analytics requirement must include:

- Applicability decision
- Evidence or assumption
- Verification method
- Link to affected product, security, privacy, architecture, data, or release docs

## Anti-slop and no-shortcut gates

Before finishing, check:

- No placeholders remain.
- No vague sections remain.
- Every recommendation is mapped to this app.
- Every major decision includes options considered, pros and cons, final recommendation, verification method, and reversal trigger.
- No decision chooses the easiest path unless it is also the best fit after evidence-backed comparison.
- Existing repo fixes include root-cause analysis when documentation drift or contradictions are found.
- Every major claim has a source, repo evidence, user answer, or assumption.
- Every unknown has an impact note.
- Cross-doc IDs and names match.
- The validation script passes or failures are listed clearly.
- The repo-doc quality gate passes or failures are listed clearly.
- Every material decision has options, pros, cons, a final recommendation, a reversal trigger, and a verification method.
- Every shortcut found during review is either rejected or explicitly labeled Temporary with a proper fix.
- Architecture/foundation work includes a substantive future-capability map, seam admission decisions, current-consumer proof, forbidden parallel authorities, and a no-speculation counterexample; `extensible` without those artifacts is rejected.

## Final response format

After generating or updating docs, respond with:

- Mode used
- Files created or changed
- Research status
- Major assumptions
- Highest-risk open questions
- Validation result
- Quality review result
- Implementation artifacts status
- AI-recommended defaults used
- Suggested next prompt


## Assurance architecture requirement

Run `$specforge-assurance-architecture` only when the app has user-visible claims or decisions that can drift.

Use a proportional tier:

- Tier 0: simple low-risk app. Record `not-applicable-with-reason` in `README.md` and `auditability/decision-log.md`. Do not create filler assurance docs.
- Tier 1: app has users, data, workflows, or integrations. Add source-of-truth and surface authority coverage in `assurance/` or the owning domain doc, and route it from `README.md`.
- Tier 2: app has payments, sensitive data, admin actions, dashboards, exports, critical statuses, or regulated review needs. Create the full assurance extension under `assurance/` plus `auditability/documentation-lifecycle.md`.
- Tier 3: app uses runtime AI or non-deterministic decisions. Create the full extension under `assurance/` plus model/prompt matrices, evals, provenance, bounded remediation, usage metering, and `auditability/documentation-lifecycle.md`.

Do not import app-specific examples from past projects. Use only reusable patterns:

- product assurance contract;
- source-of-truth map;
- decision ownership boundary;
- decision matrix;
- bounded remediation;
- source-to-surface proof;
- limited, pending, and unavailable states;
- first-useful-viewport acceptance;
- object identity and role-specific controls;
- documentation authority lifecycle.

A generated package is not complete if a high-risk user-visible claim lacks an authority owner, validation rule, fail state, downstream consumer map, and test proof.



