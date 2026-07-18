<!-- Not a rule file — a guide to this templates/rules/ directory. Delete before shipping into a repo. -->
# Rules templates

The rules directory is the project's **single source** of contextual agent rules. Location is a DECISION POINT (SKILL.md Step 2.1): `.claude/rules/*.md` (default — Claude lazy-loads official `paths:` matches; Codex reads via the trigger table in AGENTS.md) or `.cursor/rules/*.mdc` (only if the repo already uses Cursor rules). Whichever you pick, there is exactly ONE rules source — `gate:rules-wiring` fails if a mirror returns, a rule is undiscoverable, or a Claude rule lacks `paths:`.

## The global vs project split (do NOT copy the global doctrine in)
The user-level global rules provide the universal doctrine; compact core rules load at startup and larger rules are path-scoped. Do not duplicate them into the repo — that's a parallel system. The project rules dir holds:
- **The project's DOMAIN rules** — authored from the crown jewels (see `DOMAIN-RULES-AUTHORING-GUIDE.md`).
- **The project's CENTRALIZATION registry** — the source-of-truth table, built from the repo's ACTUAL files (`centralization-doctrine.template.md`).
- **A project-level expression of the always-on gauntlet** where the project needs its own wording (engineering rules, frontend rules, security rules, testing guardrails) — these ADAPT the global doctrine to the stack, they don't restate it.

## What's here
- `DOMAIN-RULES-AUTHORING-GUIDE.md` — how to write the project's domain rule(s) from its crown jewels. The adaptation-heavy one.
- `centralization-doctrine.template.md` — the one-source-of-truth-per-domain rule + the registry table (fill from discovered files).
- `test-intent.template.md` — the test-intent rule (every test declares what it proves; the gate enforces it).
- `engineering-rules.template.md` — the stack-level engineering discipline (blast radius, reuse-before-create, contracts, quality gates, DoD).
- `frontend-rules.template.md` — frontend discipline (generate only for UI products): layout/scroll ownership, primitives, testids, state handling, mockup-first, and the responsive layout-mode doctrine (per-band mode contracts, the dimension-fiddling ban + 4-rung repair ladder, intrinsic-first hard rules — fill `{{RESPONSIVE_DOC}}` with the project's responsive-design standard, generated from the dialer's `docs/design-system/responsive-design.md` shape).
- `security-rules.template.md` — the appsec rule set the security-auditor audits against.

## Wiring (mandatory)
Every `.claude/rules/*.md` file you keep MUST:
1. carry official YAML `paths:` frontmatter so Claude lazy-loads it only for matching work, and
2. be named in `AGENTS.md` with the topic/path trigger so Codex can discover it.

`CLAUDE.md` imports `AGENTS.md`. It may `@`-import zero to four compact, genuinely irreducible project rules; imported files still consume startup context, so imports are not an organization trick. `gate:rules-wiring` enforces discoverability/scoping and `gate:agent-context` measures recursive imports plus accidentally unscoped rules.
