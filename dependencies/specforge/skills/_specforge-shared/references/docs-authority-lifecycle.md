# Documentation Authority Lifecycle

Docs should not become a competing source of truth.

## Doc classes

Classify every doc as one of:

- active living architecture;
- active product requirements;
- active runbook;
- generated inventory;
- source register;
- marketing or sales content;
- historical audit;
- future backlog;
- deprecated or retired plan.

## Rules

- Active docs must match current code, current product intent, and current repo instructions.
- Historical docs must be labeled as historical and must not govern implementation.
- Marketing docs may preserve positioning but must not define engineering behavior unless linked to active requirements.
- Generated inventories must be regenerated or verified after file moves, deletions, and major refactors.
- Future ideas belong in backlog, not stale implementation plans.
- Retired plans should be removed from checkers, agents, and active doc indexes.
- When docs and code disagree, inspect the code and active product intent before deciding which artifact changes.

## Documentation audit questions

- Which docs are active authority?
- Which docs are historical evidence only?
- Which docs are generated and need regeneration?
- Which docs are marketing?
- Which stale plans still contain useful future ideas?
- Which links or file maps point to deleted files?
- Which agent rules point to outdated docs?
- Which claims are not supported by code, tests, or active decisions?

## Output table

| Doc | Class | Authority level | Current? | Evidence checked | Action |
|---|---|---|---|---|---|
