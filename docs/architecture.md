# Architecture

## Product intent

Connect a clean machine to this private repository and begin safe, consistent Claude/Codex work without manually remembering which global or project orchestration rule has been transferred.

## Control flow

1. The manifest declares canonical source trees, install destinations, allowed file types, denials, ownership, and whether extra destination files are errors.
2. A machine-local root registry resolves user-home and project tokens without committing machine-specific paths.
3. `install --dry-run` computes a deterministic plan and performs no writes.
4. `install` creates or updates only declared destinations, records hashes, and never deletes unmanaged files unless a future separately approved migration says so.
5. `check` compares canonical and installed bytes, detects missing/drifted/local-only managed assets, validates schemas and role/skill identities, and rejects unsafe or unresolved paths.
6. `capture` is an explicit migration tool. It imports only manifest-declared orchestration paths after all deny rules pass; it is never an open-ended home-directory copier.

## Authority seams

- Policy: `policies/action-authority.v1.json` owns what agents may do autonomously.
- Task assurance: `schemas/task-assurance.v1.schema.json` owns the cross-vendor work contract.
- Roles: `registries/agent-roles.v1.json` owns standing roles, triggers, and incompatible responsibilities.
- Assets: `global`, `skills`, and `overlays` own portable files.
- Location: `registries/project-roots.local.json` owns machine-specific paths and is never committed.
- Product truth: referenced product repositories remain authoritative.

## Why copy-with-manifest instead of symlinks

Symlinks and Windows junctions are fragile across privilege modes, worktrees, CI, and different checkout roots. Manifest-driven generated copies are explicit, testable, portable, and compatible with agents that require conventional home/project paths. Hash parity and local-only detection prevent the copies from quietly becoming independent authorities.

## Alternative rejected

Copying complete `.claude` or `.codex` directories would seem simpler, but it would capture credentials, caches, sessions, plugin internals, and machine state. It also makes clean-machine behavior depend on accidental files. Explicit allowlisted mappings are more work initially and remove an entire class of secret leaks and invisible drift.
