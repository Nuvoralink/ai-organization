# Universal orchestration backflow monitor

This is the reproducible contract for the operator-level Codex automation named
`Universal biweekly orchestration backflow` (`universal-biweekly-orchestration-backflow`). It is not a
project template and must not be duplicated into each bootstrapped repository.

## Schedule and scope

- Every two weeks on Monday at 10:00 in the user's local timezone.
- Local, read-only execution, bound to the saved Auxara Dialer project so it has a durable task home.
- Compare the prior 14 days of tracked orchestration changes in the registered `${PROJECT:auxara-dialer}` and
  `${PROJECT:coachai}` roots against this skill, the safe Claude global rule/agent surfaces, and the Codex
  global `AGENTS.md`.

## Decision contract

Open real diffs and artifacts. Look for reusable agent prompts, gate shapes, lifecycle/control-plane
hooks, brief templates, test-intent controls, source-to-screen verification, workflow/journey checks,
context-budget controls, and automation patterns. Separate project-specific product policy from a
failure-prevention structure that belongs in any project. Deduplicate against the universal layer and
state the strongest argument against each promotion. Report at most five candidates, each with its
source, universal destination, evidence, gap, and smallest safe promotion. `None` is a valid result.

## Safety boundary

Never inspect credential/token/session stores, `.env` files, secret stores, customer data, transcripts,
recordings, or raw telemetry payloads. Never edit files, mutate git, create or modify GitHub artifacts,
merge, deploy, publish, delete, purchase, mutate production, or send external messages.

The registered automation definition is the runtime authority. After create/update, verify it through
the Codex automation service and the stored automation definition; this document alone schedules
nothing.
