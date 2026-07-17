# Portable AI organization control plane — implementation plan

Status: Implementation and independent verification in progress
Tracking: issue #1 / private Project 8
Branch protection: explicitly deferred by user

## Settled outcome

The private repository is the complete portable source of truth for safe Claude/Codex orchestration. It includes global and project-level orchestration rules, agents, skills, prompts, hooks, gates, guardrails, `CLAUDE.md`/`AGENTS.md` sources, assurance contracts, automation specifications, and the operating-model presentation. It excludes application/product trees and sensitive machine/runtime state.

## Action authority

Agents may autonomously read, plan, edit in scope, test, create branches/worktrees, commit, push, and open draft/ready PRs. They may merge only when every machine-readable conditional in `policies/action-authority.v1.json` is satisfied, including no production/deploy effect. Destructive, billed, production, external-contact, or unresolved product/design/architecture actions remain human gated.

## Blast radius

- Global installed Claude/Codex routers, rules, agents, skills, hooks, and bootstrap templates.
- Universal automation specifications and recurring drift/backflow checks.
- Auxara project orchestration overlay and its lifecycle/gate wiring.
- CoachAI project orchestration overlay and its lifecycle/gate wiring.
- Cross-vendor task contract, risk/evidence controls, role triggers, and completion wrapper.
- Repository/installed parity, context budget, collision, local-only, and unsafe-path gates.
- Organization presentation and technical handbook.

## Too little / too much

Too little is adding another orchestration document without installing it, gating drift, retiring contradictory rules, or proving the final agent workflow consumes it. Too much is copying application code/product docs or sensitive home state, building a hosted orchestration platform, or changing production/branch protection.

## Phases and proof

### Phase 1 — Canonical foundation

- Private repository, ownership boundary, issue/project ledger, action authority, task-assurance schema, agent-role registry, manifest schema.
- Proves: authority is explicit and machine readable.
- Killer mutation: mark an auto-deploying merge autonomous; validation must fail.

### Phase 2 — Portable install and parity

- Safe capture, dry-run install, install, check, local-root registry, hashes, collision/context/path validation.
- Proves: clean-machine install is deterministic and local-only/drifted assets cannot hide.
- Killer mutations: add a local-only rule, change one installed byte, omit a canonical file, reuse a skill ID, reference an unresolved absolute path, or try to include `.env`; each must fail before writes.

### Phase 3 — Global catalog migration

- Import all safe user-authored global Claude/Codex orchestration assets; classify upstream plugin/system assets as dependencies rather than copied authorities.
- Normalize twin doctrine, remove stale Figma/push/PR wording, add premise-and-architecture challenger, task lifecycle, release truth, uptime semantics, closure ledger, context/rule gates.
- Proves: Claude and Codex receive the same semantic controls through tool-appropriate adapters.

### Phase 4 — Project overlays

- Auxara: repair false decision-sprint gate, stale router facts, lifecycle validation, backend gate routing, role registry, release/journey evidence, and action policy.
- CoachAI: add task lifecycle, lean context router/gate, live decision register, affected-proof selection, Claude Design wording, warning ratchet, parity/journey routing, runtime/AI-quality operations specifications.
- Proves: project-specific operating behavior consumes universal authorities without creating a parallel product source of truth.

### Phase 5 — Assurance and presentation

- Adversarial review of actual diffs/artifacts; bite tests; repository-to-installed parity; project gates.
- Build and QA a presentation covering philosophy, roles, orchestrator/control plane, task flow, hooks, gates, guardrails, decision/action authority, learning loops, project overlays, and examples.
- Proves: the organization can be explained and bootstrapped from the same source.

## Rollout and rollback

Install begins with `--dry-run`; capture never overwrites canonical data without a reviewed diff. Product changes occur in isolated fetched-base worktrees. Existing installed files are backed up by hash-addressed snapshots before replacement. Rollback restores the previous manifest release and reinstalls; no application schema/data migration is involved.

## Implemented control surface

- Safe canonical boundary enforcement, secret/path refusal, destination-collision detection, deterministic install/check, local-only detection, snapshots, failure rollback, and explicit rollback.
- Executed JSON schemas plus semantic action-policy invariants and a fail-closed action evaluator.
- Cross-vendor task assurance runtime with immutable attempts, registry-resolved local proof profiles, parsed artifact digests, structural mutation receipts, risk-derived independent review/human gates, and replay-safe completion.
- Auxara and CoachAI overlay authorities plus daily/weekly project checks and a biweekly universal backflow comparison.
- Pull-request CI, ownership/review templates, and an editable 19-slide operating-model presentation with structural and rendered QA.

Project-repository PRs remain separate because merging them can trigger product deployment. The central control-plane PR also remains human-reviewed because it changes broad organization authority rather than an isolated low-risk leaf.

## Remaining human gates

- Any merge that triggers deployment or production mutation.
- Production config, environment variables, migrations, deploys, data writes, deletions, purchases, billed provider actions, or external messages.
- Close product, UX/design, or architecture choices without a previously settled authority.
