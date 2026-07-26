---
name: specforge-reviewer
description: Review app planning docs for AI slop, passive interviews, missing recommendations, shortcuts, placeholders, missing evidence, weak traceability, stale repo claims, contradictions, and missing required sections.
---

# SpecForge Quality Reviewer

Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `docs/app-plan/auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Read `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` before review.
- Read `../_specforge-shared/references/no-shortcuts-decision-protocol.md` before review.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose shortcuts, workaround fixes, or vague placeholders.
- Apply the guided interview protocol in `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` and no-shortcuts protocol in `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material choices, recommendations, and user-facing questions.
- Use private multi-option deliberation for material decisions. Do not reveal private reasoning; output only decision cards, concise rationale, pros and cons, recommendation, confidence, and reversal triggers.
- Run root-cause analysis for conflicts, stale docs, missing requirements, weak decisions, risky shortcuts, and repo-document mismatches before proposing fixes.
- Prefer durable, standard-aligned solutions over quick fixes. If a temporary workaround is unavoidable, label it `Temporary`, explain the risk, define the proper fix, and set the removal trigger.
- Keep the scope proportional to the app's risk, data sensitivity, expected scale, and user impact. Avoid both under-specification and needless enterprise bloat.
- Label every material claim as User-confirmed, Repo-derived with evidence path, Standard-backed with source title and version/date, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and write `Research status: online research unavailable, baked-in baseline used`.
- Apply the anti-slop rubric at `../_specforge-shared/references/document-quality-rubric.md` before finishing.
- Every requirement must have an ID, source, owner or affected role, verification method, risk level, and related document links.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Do not output placeholder tokens such as TODO, TBD, lorem ipsum, `[fill in]`, or fake example values as if they are real.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, and risks must use the same IDs and names.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.

## Purpose

Review generated or updated app documentation and force them to be specific, traceable, internally consistent, and useful for future AI coding work.

## Inputs

- `docs/app-plan/` docs
- `../_specforge-shared/references/document-specification.md`
- `../_specforge-shared/references/document-quality-rubric.md`
- `../_specforge-shared/references/document-quality-acceptance-tests.md`
- Existing repo evidence, if any
- `docs/app-plan/auditability/decision-log.md`
- Validation script output, if available

## Output files

Create or update:

- `docs/app-plan/auditability/documentation-quality-review.md`

## Review process

1. Read the document specification, quality rubric, and document-quality acceptance tests.
2. Inventory `docs/app-plan/` and identify the scope profile: full package, focused package, or existing repo repair.
3. Resolve the validator and repo-doc quality gate from the active skill pack first: `../_specforge-shared/scripts/validate_app_docs.py`, `../_specforge-shared/scripts/check_repo_doc_quality.py`, and `../_specforge-shared/scripts/validate_implementation_artifacts.py` relative to this `SKILL.md`. If SpecForge was manually installed into the target repo, the equivalent paths are `.agents/skills/_specforge-shared/scripts/validate_app_docs.py`, `.agents/skills/_specforge-shared/scripts/check_repo_doc_quality.py`, and `.agents/skills/_specforge-shared/scripts/validate_implementation_artifacts.py`.
4. Run the validator with the available Python launcher (`py` on Windows, otherwise `python`) using `--docs-dir docs/app-plan --strict` before creating the review doc. Add `--profile focused` when the user asked for a targeted package rather than a full package.
5. After creating or updating `auditability/documentation-quality-review.md`, rerun the validator with `--docs-dir docs/app-plan --final --strict`, adding `--profile focused`, `--existing-repo`, and `--assurance` when those modes apply.
6. Run the repo-doc quality gate with the same mode flags: `check_repo_doc_quality.py --repo-root . --docs-dir docs/app-plan --strict --final`, adding `--profile focused`, `--existing-repo`, and `--assurance` when those modes apply. This catches broken links, missing docs-index routing, old focused filenames, audit-only "create this later" recommendations, and missing review sections.
6. If `docs/app-plan/implementation/` exists, run the implementation-artifact validator: `validate_implementation_artifacts.py --docs-dir docs/app-plan --strict`, adding `--existing-repo` for repo-derived packs and `--require-ai-matrix` when runtime AI, generated content, semantic decisions, scoring, ranking, classification, or recommendations are in scope. This catches missing implementation artifacts, source-to-surface gaps, incomplete slices, weak handoff prompts, missing rollback, missing observability, and absent AI decision matrices.
7. Check for placeholders and filler.
8. Check every doc for required global sections.
9. Check evidence quality: user-confirmed, repo-derived, standard-backed, or assumption.
10. Check that requirement IDs are present and reused consistently.
11. Check cross-document names for roles, features, screens, entities, endpoints, components, events, and risks.
12. In existing-repo mode, verify that generated docs are wired into any existing documentation index, backlog, filemap, or routing layer and are not creating a competing authority tree.
13. In existing-repo mode, verify that a repo instruction surface contains a docs-drift prevention rule. If no such rule exists, create or request an update in the preferred instruction surface (`AGENTS.md`, `.cursor/rules/*.mdc`, `CLAUDE.md`, or equivalent) so future behavior/API/data/security/AI/runbook/product-rule changes update live docs and the docs index.
14. Cross-check at least one code-owned runtime/default contract where relevant: model/provider defaults, prompt versions, feature flags, env variable names, package scripts, route mounts, database fields, DTO/read-model authority, or generated file maps.
15. Check that active docs outside conventional folders were considered, including source-tree markdown, agent/rule files, plan folders, generated maps, and README-like files.
16. Check that high-risk areas have controls, tests, and blast-radius entries.
17. Check that the interview did not ask non-blocking questions and that choice questions include recommendations.
18. Check that `auditability/decision-log.md` records AI-recommended defaults, options, pros and cons, final recommendations, no-shortcut review, and reversal triggers.
19. Check that recommendations solve root causes instead of symptoms when they respond to existing repo issues or doc gaps.
20. Check whether audit findings only tell the user to create security, privacy, threat-model, architecture, API, runbook, or quality docs when those docs are actually in scope. If yes, create/update the actual docs or update the living doc that owns the area.
21. Check focused-package filenames. New focused repo packages should use descriptive lowercase kebab-case names, with numbered names treated only as legacy aliases.
22. Check product-intent preservation: generated docs must not degrade the app's user outcome, source-of-truth hierarchy, role model, trust contract, or AI/deterministic decision boundary.
23. Check standards alignment against official or primary sources when the review judges architecture, security, privacy, accessibility, API contracts, release, ADRs, or naming.
24. Fix issues directly when safe and within docs. Record remaining gaps.
25. Apply `../_specforge-shared/references/evolutionary-architecture-doctrine.md`: inspect the approved roadmap against current authorities, reject known future features that would build sibling identity/data/workflow/provider/persistence owners, and reject planted seams with no real current consumer or verified domain contract.

## Anti-slop checks

Flag and fix:

- Generic advice that could apply to any app.
- Requirements without IDs.
- Claims without sources or evidence.
- Source labels that do not distinguish User-confirmed, Repo-derived, Standard-backed, Assumption, or AI-recommended default.
- `Unknown` values without an impact note and owner or decision trigger.
- Empty headings that exist only to satisfy the validator.
- Placeholder values.
- Vague verbs like `should support`, `may include`, or `as needed` unless they are explicitly marked as assumptions or options.
- Feature names that do not map to PRD features.
- API endpoints that do not map to data contracts.
- Security controls that do not map to threats.
- Tests that do not map to acceptance criteria.
- AGENTS.md rules that are too broad or too long.
- Generated docs that are not listed in an existing docs index or routing layer.
- Missing docs-drift prevention rules in existing-repo instruction surfaces.
- Generated audit docs that say a required in-scope document should be created later instead of creating/updating it now.
- Focused-package filenames that expose internal numbering instead of reader-intent names.
- Standards claims without official or primary sources.
- Product-intent drift, such as replacing repo-specific direction with generic planning copy or weakening the app's existing trust model.
- Code-default claims that were not checked against source files, especially model/provider defaults, prompt versions, env names, package scripts, and DTO/read-model authority.
- Filemap or generated inventory claims that ignore whether new files are already tracked.
- User questions that dump decisions on the user without recommendations.
- AI-recommended defaults that are not labeled as such.
- Architecture, security, stack, data, or implementation decisions with no alternatives considered.
- Shortcut decisions that avoid the root cause or reduce quality, security, privacy, testing, accessibility, or maintainability.
- “Extensible/scalable/future-proof” architecture with no future-capability map, seam admission evidence, current-consumer liveness, forbidden parallel authority, retirement path, or killer mutation.
- Present-only assumptions duplicated across callers even though an approved later capability will invalidate them.
- Dead flags/enums/tables/routes/provider methods or universal plugin frameworks created against hypothetical future contracts.

## Review output requirements

In `auditability/documentation-quality-review.md`, include:

- Review summary
- Validation result
- Anti-slop findings
- Traceability findings
- Cross-document consistency findings
- Source coverage findings
- Existing docs index/routing integration findings
- Code-default cross-check findings
- Missing evidence
- Highest-risk assumptions
- Required fixes applied
- Remaining gaps
- Decision quality findings
- Shortcut or surface-level work findings
- Actual document coverage: created, updated, routed, intentionally omitted, or blocked with impact.
- Naming findings.
- Standard-backed alignment findings.
- Product intent preservation or drift findings.

## Existing repo mode

When a repo exists:

- Verify repo-derived claims against evidence paths where practical.
- If a claim has no evidence path, downgrade it to Assumption or fix it.
- Verify current runtime defaults and contract names from code when docs mention provider/model names, prompt versions, feature flags, env names, package scripts, route mounts, database fields, DTOs, or generated inventories.
- Look beyond `docs/`: root docs, frontend/backend docs, source-tree markdown, agent/rule files, plan folders, generated maps, and README-like files can all be active or misleading authority.
- If new files are untracked, do not claim git-generated file maps are complete; record that they will update after staging/commit or after the repo's filemap generator sees tracked files.
- Do not change product code.
- Do not expose secret values.

## Quality gate

Before finishing, check:

- The review doc lists what was fixed.
- Remaining gaps
- Decision quality findings
- Shortcut or surface-level work findings are clear.
- Existing docs index/routing layer was checked and updated or marked not present.
- Repo instruction surface contains a docs-drift prevention rule, or the missing rule is recorded as a blocking quality issue.
- Runtime defaults and prompt/model versions were spot-checked against code when relevant.
- Required in-scope docs were created or updated instead of only recommended.
- Focused-package filenames are descriptive lowercase kebab-case unless the target repo already uses another convention.
- Product intent and direction are preserved.
- Future capabilities consume named current authorities; planted seams are exercised now; concrete one-off code remains allowed when no approved second consumer exists.
- The validation result is included.
- The repo-doc quality gate result is included.
- The implementation-artifact validation result is included when `docs/app-plan/implementation/` exists.
- No placeholder text remains in final docs unless quoted as a finding.

## Expanded v3 review areas

Also check:

- Business and monetization claims are marked as hypothesis unless user-confirmed or repo-derived.
- Compliance and platform-policy claims say review-needed when jurisdiction, law, tax, app-store, payment, child-data, AI, medical, finance, education, biometrics, or employment rules are involved.
- Trust and safety docs are substantive when the app has UGC, messaging, public sharing, marketplaces, AI outputs, or minors.
- Environment and secrets docs do not expose secret values and treat production config as high risk.
- Operational runbooks map deployments, rollback, backups, restore, migrations, incidents, and security incidents to tests and monitoring.
- Supply-chain docs cover lockfiles, dependency approval, vulnerability scanning, license review, SBOM, provenance, artifact integrity, and third-party services.
- Cost and capacity docs do not invent prices and include formulas, quotas, budget alerts, and scaling triggers.
- Analytics docs do not conflict with privacy docs and forbid sensitive data in event payloads unless explicitly justified.


## v3 additional coverage checks

- Glossary and taxonomy docs must define canonical terms and IDs used across product, UI, data, API, analytics, risks, controls, and ADRs.
- Platform and special-feature contracts must evaluate web, mobile, PWA, notifications, email/SMS, uploads, payments, admin tools, search, webhooks, and integrations. Not applicable items need reasons.
- AI implementation task plans must break future work into small slices with required tests, protected files, rollback or containment, and docs updates.


## v4 decision-support review

Also check:

- `auditability/decision-log.md` exists after focused or existing-repo generation; legacy packages may still use flat `decision-log.md`.
- Material decisions include options, pros, cons, final recommendation, verification method, and reversal trigger.
- User-facing choice questions include a recommended default and do not force the user to make non-blocking technical decisions.
- Interview scope is minimal: no more than 5 initial questions and no more than 3 follow-up questions unless a high-risk blocker exists.
- Root-cause analysis records exist for conflicts, stale docs, missing requirements, risky shortcuts, and repo-doc mismatches.
- Shortcut decisions are rejected or labeled Temporary with risk, proper fix, and removal trigger.
- Stack, auth, database, hosting, analytics, CI/CD, observability, and security defaults are tied to app context, repo evidence, or current official sources.

## v4 decision-support checks

Also check:

- The docs include `auditability/decision-log.md` for focused or existing-repo packages.
- The register separates User-confirmed decisions from AI-recommended defaults.
- Every material recommendation includes options considered, pros, cons, final recommendation, source basis, verification method, and reversal trigger.
- Choice questions in interview summaries include guidance and a recommendation.
- Non-blocking unknowns were handled through research-backed defaults, not user-question overload.
- Existing repo fixes include root-cause notes when docs were stale, missing, or inconsistent with code.
- The final docs do not rely on hidden reasoning. They expose enough rationale, evidence, and verification for review without revealing private chain-of-thought.


## Assurance architecture review checks

Also review the package for source-of-truth and UI-truth failures:

- A user-visible claim has no authority owner.
- A fallback outranks a stronger authority layer.
- A UI surface invents truth because a card, table, or dashboard slot exists.
- Deterministic code is assigned semantic judgment without an exception register.
- A prompt/model change is documented but no final visible consumer is mapped.
- A generated or suggested value can appear without source/provenance and approval status.
- A high-risk page lacks first-viewport questions and acceptance checks.
- A filter appears for a role that cannot use it.
- An object selector relies only on filenames, IDs, or weak labels where better human-recognizable identity is available.
- A doc is treated as active architecture without authority classification.
- A historical or stale plan still governs implementation.
- A generated docs package bypasses an existing docs index or living-doc hierarchy.
- A generated inventory is trusted without regeneration or sanity check.
- Validation silently patches semantic or domain meaning instead of using bounded remediation or fail-closed behavior.

If any of these exist, revise the relevant docs and record the finding in `auditability/documentation-quality-review.md`.


## Assurance proportionality review

Check that assurance docs are neither missing nor bloated.

- If the app is Tier 0, assurance extension docs should not be generated as filler. `README.md` and `auditability/decision-log.md` should record `not-applicable-with-reason`.
- If the app is Tier 1, source-of-truth and surface authority coverage may live inside existing docs if separate docs would create bloat.
- If the app is Tier 2 or Tier 3, full assurance docs 31-36 should exist and validation should be run with `--assurance`.
- If the app has no runtime AI, do not require prompt matrices, model usage ledgers, or AI evals except for Codex-development guardrails.
- If the app has runtime AI, generated content, semantic classification, recommendations, or agentic tool use, require prompt/model decision matrices, provenance, bounded remediation, evals, and usage metering.

