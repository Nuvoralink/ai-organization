User confirmed the preferred prompt-testing ladder for CoachAI semantic/prompt work.

Standing preference:
- Use the cheapest useful proof first, then escalate only when needed:
  1. Static prompt-contract regression: cheapest; catches missing decision matrix, rules, schema, and prompt drift.
  2. Local replay with persisted artifacts: cheap; verifies data wiring, validators, repair logic, persistence, ranking, and UI/display behavior against real stored inputs.
  3. Subagent qualitative eval: cheap-ish; use it as near-authority rehearsal to test prompt clarity, JSON shape, wrong fields, and semantic interpretation without burning app API calls. It is useful, but not authoritative.
  4. Real app-model rerun: authoritative; use after bundling multiple fixes when final proof depends on production model/routing/structured-output/retry/runtime behavior.
- Subagent eval can help avoid bad JSON, wrong fields, or an unclear decision matrix before a final production rerun.
- Do not treat subagent output as final proof of production generation. Use it to improve the prompt/contract, then run final authority rerun only if needed.

Implementation note:
- Added this ladder to `${HOME|backslash}\.codex\skills\coachai-spider-pass\SKILL.md`.
