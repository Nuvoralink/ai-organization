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

Canonical orchestration files live under `global/`, `skills/`, and `overlays/`. Install destinations are generated copies declared in `control-plane.manifest.json`. A generated copy may be committed to a product repository because agents need it at startup, but it does not become a second authority. Any change discovered in an installed copy must flow back to the matching canonical source in the same task, then be reinstalled.

Project product authorities remain in their project repositories. Overlay rules link to those authorities and may summarize only the irreducible startup facts necessary for safe routing. The parity gate compares orchestration assets, not application/product trees.

## Safety invariant

Capture is fail-closed. A path is eligible only when an explicit manifest mapping includes it and no deny rule matches it. There is no recursive "copy my home directory" mode.
