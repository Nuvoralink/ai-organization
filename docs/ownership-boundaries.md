# Ownership boundaries

## Included

The control plane owns files whose purpose is to direct, constrain, verify, coordinate, or explain agent work:

- Claude/Codex global rule routers and doctrine;
- agent definitions and dispatch/output contracts;
- reusable skills and their tests, references, templates, and safe scripts;
- prompts used to operate the agent organization;
- lifecycle hooks, gate routers, guardrails, and assurance schemas;
- orchestration templates, decision/task contracts, role registries, and automation specifications;
- project-level `AGENTS.md`, `CLAUDE.md`, and orchestration-only `.claude`/`.codex` assets for registered projects;
- the organization operating-model presentation and its source.

## Excluded

The control plane must not read, capture, or publish:

- credentials, auth state, tokens, keychains, API keys, certificates, or secrets;
- `.env` files or settings/config files that contain secret values;
- session history, chat history, logs, telemetry, databases, caches, model traces, or raw prompts containing private task data;
- transcripts, recordings, customer/lead data, provider payloads, signed URLs, or production evidence containing PII;
- application source code, migrations, ordinary product documentation, design assets, test fixtures, or build output;
- tool/plugin caches and bundled system/plugin skills as canonical copies. Those remain upstream-owned dependencies and are referenced by version/installer when needed.

## Authority and generation

Canonical orchestration files live under `global/`, `skills/`, and `overlays/`. Ordinary install destinations are generated copies declared in `control-plane.manifest.json`. A generated copy may be committed to a product repository because agents need it at startup, but it does not become a second authority. Any change discovered in an installed copy must flow back to the matching canonical source in the same task, then be reinstalled.

Mappings with `ownership: "captured"` reverse that direction deliberately: the live `captureFrom` tree is authoritative and the repository copy is a backup. Capture still imports live bytes into the declared canonical source, but install reports the mapping as skipped-by-mode and never writes any declared destination. Check reports backup content differences as informational `captured-backup-behind` entries while a missing live capture source remains a blocking problem. Only captured mappings may declare an empty destination list.

Project product authorities remain in their project repositories. Overlay rules link to those authorities and may summarize only the irreducible startup facts necessary for safe routing. The parity gate compares orchestration assets, not application/product trees.

## Safety invariant

Capture is fail-closed. A path is eligible only when an explicit manifest mapping includes it and no deny rule matches it. There is no recursive "copy my home directory" mode.

An `installedIgnore` entry is a narrowly reviewed, exact mapping-relative path for denied state that legitimately exists only in an installed dependency tree. Installed inventory skips that named entry before statting or reading it and reports the skip; the entry is never hashed, copied, retired, or admitted into canonical capture. The same name in a canonical source remains forbidden by the repository-side deny policy.

## Curated Codex state

The portable subset includes `MEMORY.md`, `memory_summary.md`, authored `extensions/`, automation definitions plus their authored memory, and explicitly retired user-authored skills. Raw memory aggregation, rollout summaries, imported vendor caches, and `skills-curated-cache.json` remain unmanaged machine/runtime state and are not capture sources.

## Claude and agent provenance

The portable subset includes Claude plugin installation/marketplace/blocklist manifests, authored Claude plans, and the agent skill-lock provenance registry. Plugin caches and marketplace working copies remain upstream/runtime state; the existing `local-desktop-app-uploads/visualforge` copy is redundant with the canonical VisualForge dependency mirror but is intentionally not deleted.

Claude `settings.json` remains deny-listed and unmanaged because it contains machine-local secret values. `global/claude/settings.template.json` records only its portable shape, with every MCP environment value replaced by `<SET-LOCALLY>`; it has no install mapping.

## Curated Claude project memory

Claude project session transcripts, jobs, and history under `~/.claude/projects/` are machine-local and excluded. Only authored Markdown under an explicit project `memory/` directory is portable; current project directories each have a dedicated captured mapping into `global/claude/project-memory/<project-dir-name>/`. Add a new project by reviewing its `memory/*.md` content, then adding an equally narrow captured mapping and artifact-registry row—never broaden capture to the projects root.

Also excluded are `~/.codex/config.toml`, `~/.codex/rules/default.rules`, every credential/auth/cache/log/session surface, and the LLM-Councel `.env`. These remain machine-local deny-listed state and are never captured.
