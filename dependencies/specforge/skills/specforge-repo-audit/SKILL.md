---
name: specforge-repo-audit
description: Audit an existing repo, fix stale docs, infer architecture and contracts from code, and update docs without changing product code.
---

# Existing Repo Documentation Audit and Repair


Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `docs/app-plan/auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` before drafting or revising docs.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Every important requirement must be specific, testable, and traceable to a user answer, repo evidence, official source, or explicit assumption.
- Every requirement must have an ID, source, affected role or component, data touched, risk level, verification method, and related docs.
- Every generated document must include `Sources and basis`, even when the source is only user input or repo evidence.
- Do not use placeholders, filler text, generic best-practice language, or broad claims that do not change implementation behavior.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Maintain a research ledger at `docs/app-plan/auditability/research-ledger.md` when research affects requirements.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, and risks must use the same IDs and names.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose shortcuts, workaround fixes, or vague placeholders.
- Apply the guided interview protocol in `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` and no-shortcuts protocol in `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material choices, recommendations, and user-facing questions.
- Use private multi-option deliberation for material decisions. Do not reveal private reasoning; output only decision cards, concise rationale, pros and cons, recommendation, confidence, and reversal triggers.
- Run root-cause analysis for conflicts, stale docs, missing requirements, weak decisions, risky shortcuts, and repo-document mismatches before proposing fixes.
- Prefer durable, standard-aligned solutions over quick fixes. If a temporary workaround is unavoidable, label it `Temporary`, explain the risk, define the proper fix, and set the removal trigger.
- Keep the scope proportional to the app. Avoid both under-specification and needless enterprise bloat.
- Label facts as User-confirmed, Repo-derived, Standard-backed, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and say that online research was unavailable.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.


## Purpose

Read an existing repo and make its documentation accurate, complete, and aligned with the code.

This skill is for docs. Do not change product code unless the user explicitly asks.

## Required research pass

Use this prompt after identifying the stack:

```text
Research the newest official docs for the repo stack, framework, language, package manager, test framework, database, auth provider, deployment platform, and CI provider. Find documentation best practices and any conventions that affect project structure, routing, config, security, testing, and deployment. Capture versions and URLs.
```

## Required repo audit process

Read `../_specforge-shared/references/repo-audit-rubric.md` first.

Then:

1. Check `git status --short`.
2. Before editing, record whether existing docs are tracked: list tracked docs and untracked docs in the requested documentation locations. If new docs are created later, state that generated file maps based on `git ls-files` will not include them until they are staged or committed.
3. Inventory docs across conventional and unconventional locations: root docs, `docs/`, `frontend/docs/`, `backend/docs/`, source-tree markdown, agent/rule files, plan folders, generated maps, and README-like files.
4. Detect existing documentation routing files such as `docs/DOCUMENTATION_INDEX.md`, docs indexes, backlogs, file maps, or retired-plan ledgers. Treat them as routing authorities and update them instead of creating a parallel docs authority tree.
5. Detect repo instruction surfaces such as `AGENTS.md`, `.cursor/rules/*.mdc`, `CLAUDE.md`, or team rule files. If none contains a docs-drift prevention rule, create one in the preferred instruction surface. The rule must require future behavior, architecture, API, data-contract, DTO, persistence, security/auth, AI, runbook, verification-gate, and product-rule changes to update the live docs and documentation index/routing layer in the same change.
6. Inventory stack files.
7. Inventory app entry points.
8. Inventory routes, APIs, schemas, models, migrations, services, tests, CI, deployment config, and env templates.
9. Cross-check docs against code-owned runtime defaults and current contracts: model/provider names, prompt versions, feature flags, environment variable names, package scripts, route mounts, database fields, config constants, and generated DTO/read-model authority.
10. Build a Repo Evidence Matrix.
11. Identify stale docs.
12. Identify missing docs.
13. Identify contradictions between docs and code.
14. Update existing docs where possible.
15. Create missing in-scope docs in `docs/app-plan/` or update the existing living doc that owns the area.
16. Create `docs/app-plan/auditability/documentation-audit.md`.
17. Run the validator and repo-doc quality gate if available.

## Hard rules

- Do not expose secrets.
- Do not read `.env` values unless the user explicitly asks and it is safe. Prefer `.env.example`.
- Do not run destructive commands.
- Do not install packages unless approved.
- Do not run migrations.
- Do not change code.
- Do not overwrite docs without merging useful existing content.
- Do not trust README claims if code contradicts them.
- Record evidence paths for repo-derived facts.

## Documentation audit output

Create or update `docs/app-plan/auditability/documentation-audit.md` with:

- Repo scan summary
- Existing docs inventory
- Code-derived facts
- Stale docs found
- Missing docs found
- Conflicts between docs and code
- Updated docs
- Remaining gaps
- Evidence paths
- Tracked/untracked docs baseline before edits
- Existing docs index, backlog, filemap, or routing updates
- Filemap status when new docs are not yet tracked
- Commands run
- Commands not run and why

## Existing docs update policy

For each existing doc:

- Keep useful accurate sections.
- Correct stale behavior.
- Add missing links to source-of-truth docs.
- If a docs index or routing doc exists, wire updated/generated docs into it and mark retired docs clearly.
- Add `Last verified from code` with date and evidence paths when applicable.
- Move duplicated or obsolete claims into the audit doc instead of deleting context silently.
- If a required security, privacy, threat-model, architecture, API, runbook, or quality doc is missing and the requested scope requires it, create the actual document instead of only recommending that it be created.
- If a living document already owns the area, update and route that living document rather than generating a duplicate authority under a confusing new name.

## Generating missing docs

Use the section skills:

- `$specforge-product-scope`
- `$specforge-ux-ui-content`
- `$specforge-architecture`
- `$specforge-data-contracts`
- `$specforge-security-threat-model`
- `$specforge-engineering-rules`
- `$specforge-quality-release-observability`
- `$specforge-ai-guardrails`

When code evidence is incomplete, mark assumptions instead of pretending certainty.

## Focused package naming

Focused existing-repo packages use descriptive lowercase kebab-case filenames:

- `README.md`
- `auditability/documentation-audit.md`
- `auditability/documentation-quality-review.md`
- `auditability/decision-log.md`
- `assurance/product-assurance-contract.md`
- `assurance/source-of-truth-map.md`
- `assurance/decision-boundary-matrix.md`
- `assurance/surface-authority-map.md`
- `assurance/validation-fixture-plan.md`
- `auditability/documentation-lifecycle.md`
- `auditability/research-ledger.md`

Numbered SpecForge filenames are legacy aliases only. Do not create new focused
repo-audit packages with internal numbers unless the target repo already uses
that convention.

## Quality gate

Before finishing, check:

- Docs index exists.
- Existing docs index or routing file was updated when present.
- Repo instruction surfaces contain a docs-drift prevention rule. If missing, one was created or a blocking reason was recorded.
- Active docs outside conventional doc folders were audited or explicitly scoped out with reason.
- Documentation audit exists.
- Missing in-scope docs were actually created or the existing living document was updated and routed.
- Existing docs were preserved when useful.
- Repo-derived facts have evidence paths.
- Runtime defaults, prompt/model versions, package scripts, and env names were checked against code where relevant.
- Stale claims are flagged or fixed.
- Missing docs are created.
- Git-tracked file maps were regenerated only when appropriate, or documented as waiting for newly tracked files.
- Validation script was run or skipped with reason.
- Repo-doc quality gate was run or skipped with reason. Use `check_repo_doc_quality.py --repo-root . --docs-dir docs/app-plan --profile focused --existing-repo --strict --final`, and add `--assurance` when assurance docs were generated. This catches broken links, missing docs-index routing, old focused filenames, audit-only "create this later" recommendations, and missing quality-review sections.
- No product code changed.


## Root-cause analysis for documentation drift

When docs conflict with code, do not simply rewrite the stale sentence. Record:

- What changed in the repo.
- Why the existing doc became stale.
- Which rule would prevent the drift.
- Which docs need cross-updates.
- Which evidence path proves the correction.

Write the RCA into `auditability/decision-log.md` and summarize it in `auditability/documentation-audit.md`.


## Assurance and documentation authority audit

When auditing an existing repo, also classify docs and source-of-truth layers:

- active living architecture;
- active runbook;
- generated inventory;
- marketing content;
- historical audit;
- future backlog;
- deprecated or retired plan.

Do not let stale plans govern the current app because they contain one useful idea. Move useful future ideas into backlog and retire stale authority. If a docs index, file map, backlog, or routing document exists, update that routing layer so generated docs are discoverable and clearly subordinate to living docs.

Also inspect for assurance-drift patterns:

- UI or mapper creates meaning not present in source data.
- Local status, cache, queue state, or event stream outranks durable evidence.
- Deterministic helper acts as semantic product policy without an exception.
- Prompt-only or model-only change does not reach final visible consumers.
- Legacy fallback survives after a stronger authority layer exists.
- User-visible object labels depend on weak IDs or filenames when better identity exists.
- Role-specific controls appear for roles that cannot use them.
- Source-to-surface maps are missing for important claims.

Write findings into `auditability/documentation-audit.md`, `assurance/source-of-truth-map.md`, `assurance/surface-authority-map.md`, and `auditability/documentation-lifecycle.md`.
