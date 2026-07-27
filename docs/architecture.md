# Architecture

## Product intent

Connect a clean machine to this private repository and begin safe, consistent Claude/Codex work without manually remembering which global or project orchestration rule has been transferred.

## Control flow

1. The manifest declares repository source trees, install destinations, allowed file types, denials, ownership, whether extra destination files are errors, and any exact denied entries that are expected only in an installed dependency tree. Canonical ownership flows repository-to-install; captured ownership flows live `captureFrom` state-to-repository backup.
2. A machine-local root registry resolves user-home and project tokens without committing machine-specific paths.
3. `install --dry-run` computes a deterministic plan and performs no writes.
4. `install` snapshots every canonical managed target, creates or updates only declared destinations, records hashes, and never deletes unmanaged files unless a future separately approved migration says so. Captured mappings are reported as skipped-by-mode and never reach destination planning or writes. A partial failure restores the pre-install snapshot.
5. `check` compares canonical and installed bytes, detects missing/drifted/local-only canonical assets, validates schemas and role/skill identities, and rejects unsafe, overlapping, or unresolved paths. For captured mappings it inspects the live `captureFrom` source directly, treats backup content differences as informational, and fails when the live source is missing. A validated `installedIgnore` entry is skipped by name before metadata/content access and is reported as expected installed-local state; canonical validation never consults that list.
6. `capture` is an explicit migration tool. It imports only manifest-declared orchestration paths after all deny rules pass; it is never an open-ended home-directory copier. A mapping may explicitly inverse-tokenize registered root literals only when install rendering is enabled; separator-style modifiers preserve exact round-trip bytes, while unregistered machine paths still fail closed.
7. Project overlays install the same universal contracts plus project-specific role extensions, routers, agents, hooks, gates, and automation specifications into a registered product repository without copying its application tree. Effective role inventories are derived from the universal registry and one project extension; a project role may specialize a universal role with `extends` and may replace that universal role only through explicit `supersedes_universal`.
8. The task governor and action evaluator turn task scope, risk, proof, mutation, review, and action permissions into machine-checked decisions shared by Claude and Codex.

## Authority seams

- Policy: `policies/action-authority.v1.json` owns what agents may do autonomously.
- Task assurance: `schemas/task-assurance.v2.schema.json`, `schemas/task-evidence.v2.schema.json`, and `core/lifecycle/` own the cross-vendor contract, runner evidence, attempt state, and completion authority.
- Roles: `registries/agent-roles.v1.json` owns the universal fleet; each `overlays/<project>/control-plane/registries/agent-roles.project.v1.json` owns only that project's extensions, and `core/roles/agent-role-registry.mjs` owns fail-closed merge semantics.
- Assets: `global`, `skills`, and `overlays` own portable files.
- Location: `registries/project-roots.local.json` owns machine-specific paths and is never committed.
- Product truth: referenced product repositories remain authoritative.
- Task lifecycle: `core/lifecycle/task-governor.mjs` owns cross-vendor start/completion evidence checks.
- Action evaluation: `core/authority/assess-action.mjs` owns fail-closed autonomous/conditional/human-required decisions.
- Recovery: install snapshots beside each lock own reversible generated-copy changes.

## Why copy-with-manifest instead of symlinks

Symlinks and Windows junctions are fragile across privilege modes, worktrees, CI, and different checkout roots. Manifest-driven generated copies are explicit, testable, portable, and compatible with agents that require conventional home/project paths. Hash parity and local-only detection prevent the copies from quietly becoming independent authorities.

## Alternative rejected

Copying complete `.claude` or `.codex` directories would seem simpler, but it would capture credentials, caches, sessions, plugin internals, and machine state. It also makes clean-machine behavior depend on accidental files. Explicit allowlisted mappings are more work initially and remove an entire class of secret leaks and invisible drift.

## Planned capability: unified agent memory

Founder decision 2026-07-26: use curated-file capture now; later add one memory MCP server backed by the founder's Neon Postgres.
That server will be the shared memory authority for Claude and Codex across machines.
Its server code and agent-registration contract will be canonical in this repository.
Only the database credential will remain machine-local and unmanaged.
This section records a schedulable capability decision only; no server, schema, registration, or migration is implemented yet.
