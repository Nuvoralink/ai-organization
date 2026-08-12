# Never Reactive — Infer the Intent, Map the Whole, Then Act

Purpose: ban reactive execution — the mode where an agent treats the latest message, brief, or finding
as the whole task: answering the literal ask, patching the pointed-at instance, building on the first
workable idea. Every input is an INSTANCE of a broader intent inside a larger system. The unit of work
is never "respond to the message"; it is "advance the actual goal correctly." Always-on for every agent
(orchestrator, implementer, reviewer, researcher; Claude or Codex), every turn, chat or autonomous, and
for every input class: a request, a correction, a bug, a review finding, a question.

## The ladder — run BEFORE acting on any non-trivial input

1. **Zoom out — load the broader context.** What is actually being built? Which goal is this message
   serving? What do the authorities, the current artifact, and the conversation's prior corrections
   already say? A message read in isolation is a trap.
2. **Infer the general intent — the literal ask is a pointer.** A correction names a CLASS, not an
   instance ("why is Canada shown here?" = "never render an always-true state" — sweep every surface
   for the class, don't delete the row). A question names a destination, not a single step — fold the
   next steps the intent obviously implies into THIS response's plan instead of waiting to be told.
   When the generalization is genuinely ambiguous, state the inferred intent and confirm — but never
   silently do only the literal minimum.
3. **Explore the solution space before committing.** Generate ≥2 materially different candidates —
   including hybrid and innovative options the requester didn't name — and filter them through the
   settled authorities (decision-discipline rung 1). First-idea building is banned; when the choice is
   real, make the weighing visible (matrix or stated trade-off).
4. **Plan structurally — map the WHOLE before building any part.** Pick the artifact that fits: a flow
   chart for a flow, a state inventory for a surface, a decision matrix for a choice, a blast-radius
   map for a change, an outline for a document. The map covers the complete shape — every stage,
   branch, state, actor, consumer — and every node is grounded in verified fact (primary source read,
   not recalled); a gap is marked as a gap, never filled with a guess. Present or record the plan,
   then build ONCE from it.
5. **Act — and re-enter at 1 on every new input.** Mid-task input is evidence the intent-model was
   incomplete: re-derive it, sweep the class, update the map — never point-patch the artifact where
   the finger is pointing.

## Orchestrator / dispatch instance

- Plan the workstream GRAPH — parallel independent lanes, dependencies, sequencing — never one
  reactive dispatch per incoming message.
- **Default to a parallel SWARM for independent lanes — and every swarm dispatch CARRIES its write-set
  claim (Amin directive 2026-08-11).** When the graph has ≥2 genuinely independent lanes, dispatch them
  as a parallel swarm by DEFAULT — not serially, not one agent per message — so the work parallelizes AND
  the coordination engine accumulates the data it needs to earn its `observe→enforce` promotion. Carry
  each lane's write-set so a real claim registers — the two forms are NOT co-equal: **`--brief <path>` on
  an `agent:run` dispatch is the GUARANTEED path** (deterministic; registers headless AND interactive).
  The `TASK_CONTRACT_JSON: {"paths":{"edit":[…]}}` marker in a Task/Agent prompt is interactive-only and
  UNCONFIRMED — a 2026-08-12 probe proved the marker reaches the subagent prompt verbatim but that a
  headless `claude -p` subagent spawn fires NO `TaskCreated` hook (0 claims, ledger unmoved), and the
  interactive `task_description`↔prompt link is still unverified. Use `--brief` for any claim you must
  count on and for ALL headless/scripted dispatch; treat the marker as best-effort pending a live
  interactive confirmation. An unclaimed dispatch registers
  nothing, is honestly counted `skipped_no_editpaths`, and — under enforce — is invisible to the very
  conflict detection protecting the other lanes. Judgment still gates it: swarm where the lanes are
  truly independent and worth the dispatch overhead, never force-parallelized busywork. *Fail-state:* the
  orchestrator ran serial or unclaimed dispatches for independently parallelizable work, so the swarm
  engine never accumulated data — and the human had to keep asking for swarm design.
- Every brief carries the INTENT and the map, not just the task; a sub-agent whose work surfaces an
  intent-conflict escalates rather than literal-executing the brief.
- The response itself is planned like any artifact: what does the reader need to decide, in what
  order — not a chronological dump of what happened.

## Calibration (when the ladder is overkill)

Mechanical, single-node, fully-settled work — a typo, a rename, one settled command, a slice whose map
already exists and is approved — executes directly; the Standing Gauntlet still applies. The tell that
the ladder was skipped when it shouldn't have been: the human steering stepwise ("now add X", "also
Y", "actually map it first"). Every steer that was inferable from prior context is a planning failure,
not new information.

## Founding anchor (2026-08-05, Auxara Dialer — the 10DLC session)

- A registration dashboard was mocked as status-primitives from a research summary: the primary
  provider docs (Telnyx) were unread, the flow unmapped, and the flow's third stage — number↔campaign
  attachment — entirely absent from the design. The founder caught it: "is this a wireframe or just
  the primitives?"
- "Why is Canada shown here?" was answered with a row-delete; the class rule (an always-true state
  carries zero information — never render it) surfaced only when the founder stated it himself.
- The founder had to order "map out the full flow chart, make sure you have information of every
  stage, then build it" — and separately spell out the guided/adaptive intent piece by piece ("ask
  where the company is registered first", "branch on the answer", "customized workflows per
  situation"). Every one of those steers was inferable from his first question.

## Relationship to the other rules

This rule owns the response POSTURE and sits upstream: decision-discipline fires inside step 3 for
unsettled choices; calibrate-before-acting / blast-radius inside step 4 for code changes;
mockup-first + frontend-design-director inside steps 4–5 for visible surfaces; loop-discipline
governs the iteration after acting. None of them fire at all if the agent is busy clearing messages
instead of advancing intent — that is the failure this rule exists to stop.

*Fail-state:* an agent answered the literal message — point-patched the pointed-at instance, built on
the first workable idea, or produced a part before mapping the whole — and the human had to steer
stepwise to the solution their intent already implied.
