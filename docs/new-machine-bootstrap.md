# Bootstrap prompt — paste this into Claude Code on the new machine

---

You are bootstrapping this machine's entire AI-agent operating system from our private control-plane repository. Work autonomously through the numbered procedure; do not stop to ask unless a step is genuinely blocked on a credential only the human has. Read every command's REAL exit code (`<cmd>; echo "EXIT: $?"` — never trust a piped/tailed status).

## CONTEXT (what this is)

`https://github.com/Nuvoralink/ai-organization.git` is the portable source of truth for how our Claude and Codex agents work: universal rules/doctrine, agent + auditor definitions, ~160 skills (including five in-house skill marketplaces), the orchestration bootstrap, control-plane schemas/policies/registries, automations, and per-project orchestration overlays.

Its operating promise: **a clean machine clones it, registers its project locations, runs one install, and receives the same managed operating system.** Files under `~/.claude`, `~/.codex`, `~/.agents`, and inside each project are GENERATED COPIES — the repo is canonical. `control:check` fails when a managed artifact is missing, changed on only one machine, present only locally, or duplicated under a conflicting name.

**The golden rule you must follow forever after this bootstrap: edit the CANONICAL file in the control-plane repo first, then run `control:install` to propagate. Never hand-edit a generated file under `~/.claude`, `~/.codex`, `~/.agents`, or a project's `.ai-organization/runtime/core` — that creates drift the checker will flag.**

## PREREQUISITES (verify before starting)

1. **Git** installed and authenticated to GitHub for the `Nuvoralink` org (the repo is PRIVATE).
2. **Node.js >= 22.5** — this is a hard floor, not the README's older "20+". The coordination runtime uses the built-in `node:sqlite` module (`DatabaseSync`), which landed in Node 22.5. Verify with `node --version`. If it is older, stop and tell the human to upgrade Node first; several gates will fail confusingly otherwise.
3. **Claude Code** and (if the human uses it) **Codex CLI** installed and logged in. Auth/credentials are deliberately NOT in the repo.

## PROCEDURE

### 1 — Clone and install
```
git clone https://github.com/Nuvoralink/ai-organization.git
cd ai-organization
npm install
```

### 2 — Register this machine's project locations
```
Copy-Item registries/project-roots.example.json registries/project-roots.local.json
```
Open `registries/project-roots.local.json` and set the paths for THIS machine (`HOME`, each project root, and the `council-studio` dependency path). This file is intentionally gitignored — it is the ONE machine-specific binding. Every mapping resolves through it, so if a later step reports unresolvable paths, this file is the first thing to re-check.

Clone the projects the human wants on this machine (ask if unsure which) to the paths you just registered.

### 3 — Prove the repo is healthy BEFORE changing anything on this machine
```
npm test
npm run control:validate
npm run control:check
```
`npm test` must be fully green. On a fresh machine `control:check` WILL report problems — that is expected and correct: nothing is installed yet, so managed artifacts are "missing". Read the output to confirm the problems are all missing-artifact/not-yet-installed types, not schema or path-resolution errors.

### 4 — Install the managed operating system
```
npm run control:install -- --dry-run
npm run control:install
npm run control:check
```
Review the dry-run before the real install. The installer snapshots every managed target before replacing it and never deletes unmanaged files by default. After the real install, **`control:check` must exit 0 ("control-plane check passed")**. If it does not, do not proceed — report exactly which mappings failed.

To reverse an install: `npm run control:rollback -- --install-id <id>`.

### 5 — Install each project's orchestration overlay
For every project cloned in step 2, dry-run first, then install, then check:
```
npm run overlay:install:auxara -- --root '<path to the dialer repo>'
npm run overlay:check:auxara  -- --root '<path to the dialer repo>'
npm run overlay:install:coachai -- --root '<path to CoachAI>'
npm run overlay:check:coachai  -- --root '<path to CoachAI>'
```
Each overlay must end with its check passing. Overlays install the shared runtime (`core/` → the project's `.ai-organization/runtime/core`), agent files, gates wiring, and project doctrine. They do NOT install application source or secrets.

### 6 — Codex trust (only if Codex CLI is used on this machine)
Codex trust is per-PATH. For EACH project root (and later, each git worktree path), add to `~/.codex/config.toml`:
```
[projects.'<lowercase absolute path>']
trust_level = "trusted"
```
Without this, a headless `codex exec` in that path hangs silently on an interactive trust prompt.

### 7 — Secrets and credentials (NOT in the repo — the human must supply)
Report which of these are needed and ask the human for each; never invent, guess, or copy a placeholder value into a live config:
- Claude Code / Codex CLI login (interactive).
- Each project's `.env` files (DB URLs, provider keys). These are gitignored by design.
- `~/.claude/settings.json`: the repo ships `global/claude/settings.template.json` with **placeholder** values only. Any real API key must be supplied by the human and must NOT be committed anywhere. If a key is pasted in, verify it never reaches a tracked file.
- MCP servers requiring OAuth (Neon, Railway, Sentry, Vercel, etc.) must be authorized interactively by the human.

### 8 — Verify the whole thing actually works
```
npm run control:check          # must exit 0
```
Then in ONE installed project, run its own local gate suite (for the dialer: `npm run verify`) and read the REAL exit code. **Known pre-existing baseline:** the dialer's `agent-context-budget-gate` fails at approximately 10,818 vs a 10,000-token budget. That failure is pre-existing base debt on `main`, unrelated to this bootstrap — confirm it is the ONLY failure. Anything else failing is a genuine bootstrap problem to report.

Confirm the fleet is present: `~/.claude/agents/` has the global agents, `~/.claude/rules/` has the doctrine rules, and skills resolve in both `~/.claude/skills` and (if used) `~/.codex/skills`.

### 9 — Seed this machine's memory (it is deliberately NOT synced)
Agent memory is machine-local by design; session transcripts are never tracked. On your FIRST session in each project on this machine, seed a fresh memory from that project's DURABLE records rather than assuming a predecessor's memory exists: its decision log, journey/lessons docs, bug backlog, sprint statuses, and the curated notes synced under the control plane's `global/claude/project-memory/`. The canonical `CLAUDE.md` carries this rule — follow it.

## BOUNDARIES

- **Do not push, merge, or open PRs** during bootstrap. This is a local setup task.
- **Do not enable coordination enforcement.** The swarm coordination engine ships with mode `off` in `.ai-organization/policies/coordination-mode.v1.json`. Leave it off; enabling observe/enforce is a separate deliberate decision per project.
- **Do not hand-edit generated files** (see the golden rule above). If something is wrong, fix the canonical source in the control-plane repo and re-install.
- **Do not commit any secret**, and do not print secret VALUES into the transcript — names/paths only.
- If `control:check` cannot reach 0 after install, STOP and report the exact failing mappings rather than forcing or deleting files.

## OUTPUT CONTRACT (report back)

1. Node + Git versions, and confirmation Node >= 22.5.
2. The exact contents you set in `project-roots.local.json` (paths only).
3. The real exit code of: `npm test`, `control:validate`, `control:check` (before), `control:install`, `control:check` (after), and each `overlay:check`.
4. Which projects were cloned and had overlays installed.
5. Which secrets/credentials are still outstanding and who must supply them.
6. The result of the project verify run, explicitly confirming whether `agent-context-budget-gate` was the only failure.
7. Anything you could not complete, and why.

## ACCEPTANCE CRITERIA (self-verify before reporting done)

- `npm run control:check` exits 0.
- Every installed project's `overlay:check` passes.
- The global rules, agents, and skills are present and resolve on this machine.
- A project verify run shows no failures other than the known pre-existing budget gate.
- No secret was committed, printed, or copied from a placeholder.
