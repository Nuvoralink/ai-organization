---
name: ai-build-lessons-capture
description: Use when a project should capture reusable lessons from AI-assisted development, prompting, source-of-truth design, validation, AI-vs-deterministic boundaries, testing, blast-radius misses, implementation review, user pushback, or architecture corrections. Trigger after meaningful bugs, repeated workflow patterns, prompt-quality discoveries, testing breakthroughs, or when the user asks to update a journey, lessons, playbook, engineering rules, AGENTS/Cursor rules, or future-agent guardrails.
---

# AI Build Lessons Capture

Use this skill after the actual work is handled. Documentation should preserve the lesson and improve future work; it should not replace the fix.

## Purpose

Capture reusable patterns from AI-assisted development without turning the document into a bug-by-bug changelog.

If a lesson reveals a durable prevention rule, update the living rule, skill, checklist, or architecture doc that future agents actually obey. Do not leave the only prevention rule in a diary-style document.

## When To Trigger

Capture a lesson when the task reveals something reusable about:

- unclear prompting or better prompt shape,
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

Skip or mention briefly when the situation only repeats an already documented pattern without adding clarity.

## Update Workflow

1. Read the existing journey, lessons, playbook, rules, or guardrail docs.
2. Decide whether the situation is a new pattern or another example of an existing pattern.
3. Prefer merging into an existing section over appending duplicates.
4. Write the lesson as a class of problem, not a one-off bug.
5. Include what the shallow fix would have been and why it was insufficient.
6. Name the root mistake pattern.
7. Name the prevention rule, test, prompt, architecture contract, or implementation-review habit that should exist next time.
8. If the lesson affects future implementation behavior, update the actual rule/skill/checklist in the same pass.
9. Run lightweight doc validation such as `git diff --check` and any repo doc-quality gate that exists.

## Pattern Checklist

For each meaningful lesson, capture:

- what happened in plain language,
- what the visible issue looked like,
- what the first/shallow fix would have been,
- what the real root cause was,
- whether the cause involved prompting, docs, architecture, source truth, validation, UI truth reconstruction, deterministic semantic logic, blast radius, stale state, tests, or user choices,
- what pushback or evidence changed the solution,
- what should have existed earlier,
- what should happen differently next time,
- the tradeoff: why the original instinct was useful and how it can go wrong if overused.

## Style

Keep it direct, practical, and honest. Avoid generic postmortem filler. Group issues into patterns. Preserve concrete examples only when they make the pattern clearer.

## Output

Report what section or guardrail changed, why it was not a duplicate, what prevention rule was added, and what validation ran.
