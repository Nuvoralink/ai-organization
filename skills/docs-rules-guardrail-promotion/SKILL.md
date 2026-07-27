---
name: docs-rules-guardrail-promotion
description: Use when a bug, review, architecture correction, testing miss, user pushback, or implementation lesson should be captured and promoted into its durable home — AGENTS/Cursor rules, skills, runbooks, tests, backlogs, guardrails, or a journey/lessons/playbook doc. Trigger when deciding where a lesson belongs so future agents follow it, after meaningful bugs or repeated workflow patterns, or when the user asks to update a journey, lessons doc, playbook, engineering rules, or future-agent guardrails. Covers both the routing decision (which durable surface) and how to write the narrative lesson itself.
---

# Docs Rules Guardrail Promotion

Use this skill when the work revealed a reusable prevention rule or a reusable lesson. It covers BOTH halves: deciding where the lesson belongs (routing), and writing the narrative lesson well when the journey/lessons doc is the right home. Documentation should preserve the lesson and improve future work — it must NOT replace the actual fix. Handle the fix first; this skill is for what survives it.

## Core Rule

Lessons should live where future work will obey them. A narrative lesson is useful, but it is not enough when the lesson should change implementation behavior. If a lesson reveals a durable prevention rule, update the living rule, skill, checklist, or architecture doc that future agents actually obey — do not leave the only prevention rule in a diary-style document.

## Destination Decision

Choose the right home:

- `AGENTS.md` or equivalent: always-on project behavior.
- Cursor/agent rules: task/path-specific behavior agents must follow.
- Architecture/blast-radius docs: relationship maps, source-of-truth contracts, cross-layer responsibilities.
- Testing docs or scripts: proof ladders, gates, fixtures, smoke commands.
- Runbooks: operational, deployment, reprocess, incident, or manual recovery behavior.
- Backlog: real issue found but intentionally not fixed now.
- Skill: reusable workflow that should work across projects or repeated task families.
- Journey/lessons doc: narrative learning, user pushback, prompting habit, or build-in-public memory. When this is the home, write it per "Writing the narrative lesson" below.

## Promotion Workflow

1. State the mistake pattern.
2. Name the future failure this guardrail should prevent.
3. Decide whether the lesson is project-specific, repo-pattern-specific, or globally reusable.
4. Pick the lowest-friction durable home that future agents will actually read.
   - Prefer merging into an existing section over appending duplicates.
   - Write the lesson as a class of problem, not a one-off bug.
5. Update the guardrail in the same pass when behavior changed.
6. Add a test/doc gate if the rule can be mechanically checked.
7. Avoid duplicating the same rule in many places unless each place has a distinct audience.
8. If the lesson is only narrative, keep it out of operational rules.
   - Run lightweight doc validation such as `git diff --check` and any repo doc-quality gate that exists.

### Mechanical coverage rule

When a promoted guardrail claims to scan a repository, authority set, or source family, build a
**source-shape coverage matrix** before calling it repo-wide. Inventory both the named files and every
syntax shape in which the guarded claim can actually live: Markdown paragraphs and reference
definitions, raw HTML prose and attributes, code comments, string and template literals, JSX/TSX text
(including text split by child elements), CSS declarations/comments, generated or fixture forms, and
historical/negated counterexamples where applicable. Use grammar-aware parsers for each language and
extract semantic prose from the complete relevant AST; a parser used only for links does not prove raw
HTML prose coverage, and a token scanner used only for comments/strings does not prove JSX coverage.
Inventory the physical source roots with traversal that includes hidden authority directories such as
`.claude` and `.codex`; default `rg`/glob ignore behavior is never coverage evidence. Use explicit safe
roots plus `rg --hidden`, `rg --files --hidden`, or an equivalent filesystem walk, and count the full
result before filtering. Keep secret/runtime/cache/vendor trees excluded through an explicit safe
allowlist rather than broad `--no-ignore` traversal.

For every matrix cell, require one rejecting mutation and one legitimate counterexample, then run the
gate against the real repository after the fixture suite. Read the actual failure output and confirm it
names the mutated file/line. A green fixture suite plus a green real-repo gate is not proof if an
unrepresented source shape can carry the same live authority.

- **Fail-state:** the guardrail is reported as repo-wide while stale live authority in an omitted syntax
  shape (for example JSX text or raw-HTML prose) or hidden authority directory passes, or a
  historical/negated statement is rejected.
- **Regression mutation:** place the same forbidden current claim in each matrix cell, including JSX
  text split around a child element, raw HTML with nested inline elements, and a hidden `.claude` or
  `.codex` authority file; every mutation must make the gate exit nonzero.
- **Counterexample:** code fences/inline code, historical lessons, and legitimate mobile-only values stay
  accepted when the guard applies only to current prose or a different surface; explicitly excluded
  secret, runtime, cache, and vendor directories remain unread.
- **Validation:** report the matrix, fixture exits, real-repository exit, and at least one independently
  reproduced bypass attempt. Do not summarize this as "parser-backed" without naming the AST nodes and
  source roots actually covered.

## Writing the narrative lesson

When the journey/lessons/playbook doc is the (or a) destination, write the lesson so it teaches a class of problem, not a bug-by-bug changelog.

### When to trigger a narrative capture

Capture a lesson when the task reveals something reusable about:

- unclear prompting or a better prompt shape,
- quick patches that created later architecture drag,
- source-of-truth design,
- validation and bounded repair,
- AI-vs-deterministic decision boundaries,
- UI/report layers reconstructing truth instead of consuming authority,
- incomplete blast-radius thinking,
- stale persisted state or rerun/reprocess misses,
- testing ladders, golden fixtures, local replay, subagent rehearsal, or final authority reruns,
- implementation review against plan/intent,
- user pushback or decisions that changed the outcome.

Skip or mention briefly when the situation only repeats an already-documented pattern without adding clarity.

### Pattern checklist (capture for each meaningful lesson)

- what happened in plain language,
- what the visible issue looked like,
- what the first/shallow fix would have been,
- what the real root cause was,
- whether the cause involved prompting, docs, architecture, source truth, validation, UI truth reconstruction, deterministic semantic logic, blast radius, stale state, tests, or user choices,
- what pushback or evidence changed the solution,
- what should have existed earlier,
- what should happen differently next time,
- the tradeoff: why the original instinct was useful and how it can go wrong if overused.

### Style

Keep it direct, practical, and honest. Avoid generic postmortem filler. Group issues into patterns. Preserve concrete examples only when they make the pattern clearer.

## What Good Looks Like

- The rule is concrete enough to fail a sloppy implementation.
- It says when it applies and when it does not.
- It names the source of truth or boundary.
- It names required proof.
- It avoids generic "be careful" language.
- It does not turn one bug into overbroad process drag.

## Output

Report the mistake pattern, destination(s), exact guardrail wording or narrative section changed, why it was not a duplicate, validation run, and related risks routed to backlog.
