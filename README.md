# Nuvoralink AI Organization Control Plane

This private repository is the portable source of truth for how Nuvoralink's Claude and Codex agents work. It contains orchestration assets only: rules, agents, skills, prompts, hooks, gates, guardrails, assurance contracts, automation specifications, tool routers, and project orchestration overlays.

It deliberately does **not** contain application source code, ordinary product documentation, secrets, credentials, environment files, histories, caches, logs, telemetry, customer data, or provider payloads.

## Operating promise

A clean machine can clone this repository, register its project locations, run one bootstrap command, and receive the same managed Claude/Codex operating system. `check` then fails when a managed artifact is missing, changed only on one machine, present only locally, duplicated under a conflicting name, or dependent on an invalid machine-specific path.

## Authority model

- `global/` is canonical for safe cross-project Claude and Codex doctrine, rules, and agent adapters.
- `skills/` contains one materialized canonical package per active user-authored skill.
- `overlays/<project>/` is canonical for that project's orchestration overlay, not its application or product source.
- Installed files under user-home and project directories are generated copies unless their manifest ownership is `captured`. Captured live state is authoritative, is imported into the repository as a backup, and is never an install target.
- `policies/`, `schemas/`, and `registries/` are machine-readable control-plane authorities.
- Local project-root registration is machine-specific and intentionally untracked.

## Quick start

Prerequisites: Git and Node.js 20 or newer.

```powershell
git clone https://github.com/Nuvoralink/ai-organization.git
cd ai-organization
Copy-Item registries/project-roots.example.json registries/project-roots.local.json
# Edit only the project paths in the untracked local file.
npm run ci
npm run control:check
npm run control:install -- --dry-run
npm run control:install
npm run control:check

# Apply a registered project's orchestration overlay after cloning that project.
npm run overlay:install:auxara -- --root 'C:\path\to\Auxara Dialer'
npm run overlay:check:auxara -- --root 'C:\path\to\Auxara Dialer'
npm run overlay:install:coachai -- --root 'C:\path\to\Nuvora CoachAi'
npm run overlay:check:coachai -- --root 'C:\path\to\Nuvora CoachAi'
npm run overlay:install:nuvora-link -- --root 'C:\path\to\Nuvora Link'
npm run overlay:check:nuvora-link -- --root 'C:\path\to\Nuvora Link'
```

`npm run ci` is the portable merge gate: unit and killer-mutation tests, canonical validation, and both project-overlay validations. GitHub-hosted CI is intentionally retired to avoid paid remote-runner execution; PR status checks are not proof.

The installer never reads excluded secret-bearing locations, snapshots every managed target before replacement, and never deletes unmanaged files by default. If an install must be reversed, use `npm run control:rollback -- --install-id <id>` or the matching project-overlay rollback command. See [Operations](docs/operations.md), [Ownership boundaries](docs/ownership-boundaries.md), and [Architecture](docs/architecture.md).

The presentation is [Nuvoralink AI Organization Operating System](artifacts/Nuvoralink-AI-Organization-Operating-System.pptx); its maintainable content outline lives beside it under `artifacts/source/`.

## Work tracking

- [Master implementation issue](https://github.com/Nuvoralink/ai-organization/issues/1)
- [Private project board](https://github.com/users/Nuvoralink/projects/8)
