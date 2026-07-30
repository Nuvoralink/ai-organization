# Weekly fleet doctrine review memory

Last run: 2026-07-27T05:34:25Z

- The configured control-plane path `${PROJECT:control-plane}-legacy-path` was absent; the verified replacement root was `${PROJECT:control-plane}`, containing `control-plane.manifest.json`.
- `npm run control:check` failed on two installed-drift entries, while both `npm run overlay:check:auxara` and `npm run overlay:check:coachai` failed with broad canonical-overlay drift. In contrast, local `gate:organization-overlay` (Auxara) and `gate:organization` (CoachAI) passed: the main recurring class is self-referential local parity that does not prove canonical parity.
- All 37 Auxara PRs and all 6 CoachAI PRs merged from 2026-07-20 through 2026-07-27 had zero GitHub PullRequestReview objects. Treat comments and PR summaries as non-review evidence unless reconciled to a bound independent-review receipt.
- Auxara PRs #274, #277, #288, and #289 showed gate-admission issues: context-budget red, parallel migration-number collisions, a gate skipped because verify aborted first, and a fail-fast aggregate blocking later gates. CoachAI PRs #224/#225 repaired local overlay/proof mapping but did not close current canonical-overlay drift.
- Recommendations only; no files outside this automation memory were edited. Next run should re-check canonical location, exact overlay failures, formal-review counts, and gate execution provenance before carrying any conclusion forward.
