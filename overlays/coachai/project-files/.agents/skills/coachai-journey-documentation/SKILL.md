---
name: coachai-journey-documentation
description: Update CoachAI's AI-build journey document when a task reveals reusable lessons about prompting, source-of-truth design, AI-vs-deterministic boundaries, validation, testing, blast radius, implementation review, or the user's own interventions. Use after meaningful bugs, architecture corrections, prompt-quality discoveries, testing breakthroughs, or repeated workflow patterns; do not use for trivial one-off edits.
---

# CoachAI Journey Documentation

## Purpose

Use this skill to keep `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md` current as a founder/dev diary source for TikTok, a course, a book, or build-in-public notes.

Do this after the actual work is handled. Do not let documentation replace the fix.

If a Journey update reveals a durable prevention rule that changes how future work should be done, update the living doc, Cursor rule, or skill that owns that behavior in the same pass. Do not let the Journey doc become a second hidden architecture spec.

## When To Trigger

Update the journey doc when the task reveals a reusable lesson about:

- unclear prompting or better prompt shape,
- quick patches that created later architecture drag,
- source-of-truth design, data contracts, validation, repair, or fail-closed behavior,
- deterministic code pretending to understand semantic sales/coaching meaning,
- UI reconstructing truth instead of displaying accepted backend authority,
- incomplete blast-radius thinking or downstream wiring missed until later,
- useful testing patterns such as golden fixtures, perturbation harnesses, local replay, subagent rehearsal, or final authority reruns,
- implementation review against plan/intent,
- a user action, pushback, implementation choice, skipped detail, or acceptance decision that produced a good or bad result.

Skip or only mention briefly when the situation is merely another instance of an already documented lesson and adds no new clarity.

## Update Workflow

1. Read `docs/Journey/AI_BUILD_JOURNEY_LESSONS.md`.
2. Decide whether the new situation is an existing pattern or a genuinely new pattern.
3. Prefer rewriting or extending an existing section over adding a duplicate.
4. Write in the user's voice: direct, practical, a little frustrated when deserved, but focused on learning.
5. Document classes of problems, not a bug-by-bug changelog.
6. Include tradeoffs: why the instinct helped, and how it can go wrong when overused.
7. If the lesson produced a reusable prompt, add it to `Prompt Playbook In My Style`.
8. If a new skill/rule was created, list only its name and purpose under `Skills Created Along The Way`.
9. Run `git diff --check` on the changed doc.

## Pattern Checklist

For a pattern or section update, capture the useful parts:

- what happened in plain language,
- what the visible bug looked like,
- what the shallow fix would have been,
- what the root cause was,
- whether the cause involved prompting, docs, architecture, source truth, validation, UI truth reconstruction, deterministic semantic logic, blast radius, or user-side choices,
- what the user pushed back on and how it changed the solution,
- what the user asked/implemented/skipped/accepted that changed the outcome,
- what should have existed earlier,
- what was learned,
- what should happen differently next time.

## Reusable Prompt

Use this prompt when another agent needs to update the document:

```text
I'm documenting my journey learning AI and building this app. I want this to become useful for a TikTok series, course, book, or founder/dev diary.

Please update the existing journey document instead of creating duplicate sections.

Before writing anything:
1. Read the current journey document.
2. Identify whether this situation already exists as a pattern/class in the document.
3. If it already exists, update that section to make it clearer, more honest, or more complete.
4. If it is genuinely new, add it as a new pattern.
5. Do not create duplicate scenarios just because the exact bug is different. Group by root cause/pattern.

Write in my voice: direct, practical, a little frustrated when the situation deserved it, but focused on learning. Do not make it sound like a corporate postmortem or generic AI blog.

For each pattern, document:
- What happened in plain language.
- What the visible bug looked like.
- What the first/shallow fix would have been.
- What the real root cause was.
- Whether this was caused by unclear prompting, missing documentation, weak architecture, bad source-of-truth design, missing validation, UI reconstructing truth, deterministic code pretending to understand meaning, incomplete blast-radius thinking, or something I asked/implemented/accepted that changed the outcome.
- What I pushed back on and how that changed the solution.
- What I asked for, implemented, skipped, accepted too early, or failed to specify if that produced a good result or bad result.
- What should have existed earlier to prevent it.
- What I learned.
- What I'll do differently next time.
- The tradeoff: why the instinct was useful, and how it can go wrong if overused.

Important style:
- Do not write a bug-by-bug changelog.
- Group issues into classes/patterns.
- Be honest if the original fix was a quick patch that created more problems later.
- Say when deterministic logic was added because the AI made a mistake, then that deterministic layer invited more fixes and became a bigger architecture problem.
- Say when fixes were not thorough enough, missed downstream wiring, and only got caught several prompts later.
- Include the role of blast-radius analysis, source-of-truth maps, data contracts, definitions of done, testing ladders, and implementation review.
- Include useful tests when they taught a reusable lesson, like synthetic golden fixtures, corrupted data at different severity levels, local replay, end-to-end source-to-UI tests, subagent prompt rehearsal, or one final authority rerun.
- Include my prompting habits: which ones helped, which ones caused problems, and how to improve them.
- If something I did, implemented, asked for, pushed back on, accepted, skipped, or failed to specify produced either a good result or bad result, document it honestly as part of the pattern.
- If I'm doing something that is not standard engineering practice but is actually producing good results, document it in a separate "Non-Standard But Useful Habits" section.
- Include a "Prompt Playbook" section with reusable prompts written in my style, not generic internet prompt-template language.
- Include a "Skills Created Along The Way" section that only explains what each skill/rule does at a high level, not the actual skill contents.

Deduplication rules:
- If the new situation is another example of an existing pattern, add it as a short example inside that pattern.
- If it changes the lesson or prevention rule, update the lesson.
- If it only repeats the same lesson, skip it or mention briefly that it reinforces the existing pattern.
- Keep the document organized and readable. Do not let it turn into a messy list of every bug.
- Prefer rewriting/merging sections over appending duplicate blocks.

At the end, include:
1. What section you updated or added.
2. Why it was not a duplicate, or why it was merged into an existing pattern.
3. Any new prevention rule, prompt, habit, or reusable testing pattern that should be added.
```
