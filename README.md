# Nuvoralink AI Organization Control Plane

This private repository is the portable source of truth for how Nuvoralink's Claude and Codex agents work. It contains orchestration assets only: rules, agents, skills, prompts, hooks, gates, guardrails, assurance contracts, automation specifications, tool routers, and project orchestration overlays.

It deliberately does **not** contain application source code, ordinary product documentation, secrets, credentials, environment files, histories, caches, logs, telemetry, customer data, or provider payloads.

## Operating promise

A clean machine can clone this repository, register its project locations, run one bootstrap command, and receive the same managed Claude/Codex operating system. `check` then fails when a managed artifact is missing, changed only on one machine, present only locally, duplicated under a conflicting name, or dependent on an invalid machine-specific path.

## Authority model

- `global/` is canonical for safe cross-project Claude and Codex doctrine, rules, and agent adapters.
- `skills/` contains one materialized canonical package per active user-authored skill.
- `overlays/<project>/` is canonical for that project's orchestration overlay, not its application or product source.
- Installed files under user-home and project directories are generated copies. Edit the canonical source first, then sync.
- `policies/`, `schemas/`, and `registries/` are machine-readable control-plane authorities.
- Local project-root registration is machine-specific and intentionally untracked.

## Quick start

Prerequisites: Git and Node.js 20 or newer.

```powershell
git clone https://github.com/Nuvoralink/ai-organization-control-plane.git
cd ai-organization-control-plane
Copy-Item registries/project-roots.example.json registries/project-roots.local.json
# Edit only the project paths in the untracked local file.
npm test
npm run control:check
npm run control:install -- --dry-run
npm run control:install
npm run control:check
```

The installer never reads excluded secret-bearing locations and never deletes unmanaged files by default. See [Ownership boundaries](docs/ownership-boundaries.md) and [Architecture](docs/architecture.md).

## Work tracking

- [Master implementation issue](https://github.com/Nuvoralink/ai-organization-control-plane/issues/1)
- [Private project board](https://github.com/users/Nuvoralink/projects/8)
