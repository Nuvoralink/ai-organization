# Skills — self-contained orchestrator suites

Four self-contained skill systems (each usable in Claude Code and Codex). These are **not** the installed user-level skills — those live in `~/.codex/skills` + `~/.claude/skills`. This folder holds the larger multi-skill *suites* that are invoked by opening their folder (or, for LLM Councel, via the `council` / `studio` skills installed user-level). See `CONSOLIDATION_CHANGELOG.md` for the 2026-07-02 consolidation history.

| Suite | What it is | When to use | How to invoke |
|---|---|---|---|
| **MarketForge** | Evidence-graded full marketing department (75 skills). | Any marketing work that needs a graded, sourced, multi-discipline output. | Open this folder in Claude/Codex and follow `MarketForge/USAGE_GUIDE.md`. |
| **Specforge** | App-spec / documentation forge (27 skills; generates `docs/app-plan/` planning packages). | Before implementing a new app, or to audit/repair stale planning docs. | Open the folder; installable as a Codex plugin per `Specforge/README.md`. |
| **VisualForge** | Design-system forge (31 skills; produces `docs/design-system/`, tokens, Figma artifacts). | When standing up or evolving a product's design system. | Open the folder and follow its README. |
| **LLM Councel** | Python multi-LLM engine + 2 skills: `/council` (idea pressure-test memo) and `/studio` (marketing creative package). | To pressure-test an idea/decision (`/council`) or generate a researched creative package (`/studio`). | Via the user-level `council` / `studio` skills. Requires `uv sync`, `.env` keys, and `claude` / `codex` CLI logins (see `LLM Councel/README.md`). |
