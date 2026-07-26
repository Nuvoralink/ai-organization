---
name: hormozi-self-test
description: Phase-0 integrity check for the Hormozi engine. Verifies every sub-skill and reference file the orchestrators cite actually exists, each sub-skill has valid frontmatter and its required sections, and templates are present. Run before a full build; FAIL blocks the orchestrator.
---

# Hormozi Self-Test (Phase 0)

Runs BEFORE a full `$hormozi` build to catch a broken/incomplete engine before it produces output.
Not needed for a single direct sub-skill invocation.

## Checks
1. **Sub-skill inventory** — every `hormozi-*` referenced in `hormozi/SKILL.md`, `hormozi-offers/SKILL.md`,
   and `hormozi-leads/SKILL.md` exists at `skills/<name>/SKILL.md` with YAML frontmatter whose `name:`
   matches the directory.
2. **Reference inventory** — every `../_hormozi-shared/references/*.md` cited by any SKILL.md exists.
3. **Template inventory** — every template cited exists at `_hormozi-shared/templates/`.
4. **Required sections** — each sub-skill SKILL.md has: a Method/authority pointer, an Output contract,
   "What we are intentionally NOT doing", and "Sources and basis".
5. **No orphan citations** — no SKILL.md points at a reference/sibling that doesn't exist.

## Procedure
- Enumerate `skills/` directories; parse each SKILL.md frontmatter.
- Cross-check citations (grep `references/<x>.md` and `hormozi-<sibling>` mentions) against what exists.
- Report PASS / WARN / FAIL with a per-check list and file:line evidence.

## Output
```
Hormozi Self-Test — <date>
Result: PASS | WARN | FAIL
Sub-skills expected/found: N/M   Missing: [...]
References missing: [...]        Templates missing: [...]
Sub-skills missing a required section: [...]
Orphan citations: [...]
Required actions: [...]
```

## When it FAILs
Surface: "Hormozi self-test FAILED — <N> sub-skills or <M> references missing. Cannot run a full build
until fixed." Do not proceed with a full orchestration.

## What we are intentionally NOT doing
- Not judging output quality (that's `hormozi-fidelity-audit`).
- Not auto-fixing — surface gaps; the builder fixes them.

## Sources and basis
Universal orchestration model — pre-flight integrity gate (mirrors the pattern in MarketForge's
`marketforge-self-test`, adapted and lighter for this engine).
