User explicitly asked to make the "spider pass" reusable across future sessions.

Standing preference:
- For CoachAI bugs, coaching-quality audits, data-integrity concerns, prompt/AI decision problems, rerun validation, and backlog cleanup, use the spider pass: find a bug, identify root cause, decide if it is localized or a broader architecture pattern, search sibling layers for similar problems, fix upstream, update docs/rules/blast-radius maps, and verify the final user-visible output.
- For AI/semantic issues, use a decision matrix and source-authority contract. AI should make the sales/coaching meaning judgment from grounded evidence; deterministic code should validate grounding, policy, schema, provenance, persistence, and display integrity.
- Do not stop at the first visible symptom. Trace source evidence, prompt/decision, validator/repair, persistence, ranking, DTO mapping, UI display, tests, docs, and rerun path.

Implementation note:
- Added global skill `${HOME|backslash}\.codex\skills\coachai-spider-pass\SKILL.md` for future Codex sessions.
