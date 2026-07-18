---
name: coachai-audit-queue-coaching-quality
description: Poll CoachAI AnalysisAuditQueueItem rows, claim/download persisted analysis.json bundles, perform data-integrity and source-to-screen audits, fix root bugs, rerun/reprocess as needed, and judge final coaching quality as an elite sales/communication coach. Use when the user asks an agent to monitor or poll the analysis audit queue, debug new uploaded-call analyses, inspect queued sessionIds, validate analysis.json correctness, compare system feedback to a sales-coach opinion, or keep improving CoachAI until call coaching is logically correct.
---

# CoachAI Audit Queue Coaching Quality

## Purpose

Use this skill for the temporary agent audit loop: new completed analyses enter the backend queue, an agent claims/downloads the `analysis.json`, verifies the data truth, judges coaching quality independently, fixes root causes, reruns the narrowest necessary pipeline, and marks the queue item honestly.

This is not a shape check. The target is: a real manager would trust the final review because the transcript/material evidence is intact, the highest-leverage coaching issue is selected, and the final user-visible output matches the accepted system judgment.

## Required Skill Stack

Load these skills in this order as needed:

1. `coachai-call-audit-rca` for the sales-coach read, source-to-screen comparison, and root-cause categories.
2. `spider-debugging-methodology` when any mismatch, bad reasoning, stale artifact, or suspicious output appears.
3. `ai-output-source-truth-audit` when an AI decision exists but may not drive final persistence, DTOs, or UI.
4. `ai-decision-contract-builder` when the fix touches prompts, validators, decision matrices, grounding, repair loops, or semantic AI boundaries.
5. `testing-strategy-and-tdd` when creating golden seeds, mutation scenarios, or regressions.
6. `coachai-downstream-rerun` when the code fix only needs downstream/entity/review refresh from persisted `analysis.json`.
7. `persisted-artifact-reprocess` when artifact freshness, sidecar persistence, or derived-state lifecycle is part of the bug.
8. `implementation-review-against-plan` before finalizing any implementation that changed code, prompts, docs, queue lifecycle, or persisted output.
9. `coachai-journey-documentation` when the pass reveals a reusable lesson or new failure pattern.

If a needed named skill is unavailable, say so and follow the same workflow manually.

## Required Docs And References

Read these before acting:

- `AGENTS.md` and `CLAUDE.md`
- `docs/ops/analysis-audit-queue.md`
- `docs/ARCHITECTURE_BLAST_RADIUS.md` for backend/cross-layer fixes
- `docs/AI_DECISION_MATRIX_REGISTER.md` for semantic AI changes
- `docs/COACHING_BUG_BACKLOG.md` before adding or closing findings
- `references/sales-coaching-quality-lens.md` from this skill before judging coaching quality

Never paste raw transcript, prompts, secrets, signed URLs, database URLs, tokens, full `analysis.json`, or downloaded bundle contents into chat, logs, docs, or commits.

## Queue Intake

Run from repo root.

List pending rows:

```powershell
npm run audit:analysis-queue --workspace=backend -- --list --limit=20
```

Claim and download bundles:

```powershell
npm run audit:analysis-queue --workspace=backend -- --claim --agent=codex --limit=3
```

Download a known session:

```powershell
npm run audit:analysis-queue --workspace=backend -- --session-id <sessionId>
```

Bundles land under `backend/tmp/analysis-audit-queue/` unless an output dir is specified. Treat them as sensitive local artifacts. Do not commit them.

If `analysisJsonPresent` is false, stop the coaching-quality pass. First fix the missing artifact/rerun/persistence problem or use the correct rerun path.

## Data Integrity Pass

For each bundle, verify the analysis is safe to judge before reading coaching quality:

- Queue and artifact: one row per `sessionId`, expected status/lease, artifact hash present, durable `SessionPipelineRun.payloadJson` source available.
- Session truth: `completed_with_feedback` or clearly explained limited state; no stale `analysis_failed`/local queue state outranking persisted review truth.
- Transcript truth: enough transcript exists, speaker labels make conversational sense, role swaps are not driving blame, timestamps/evidence windows align.
- Analyzability: state/rejection reasons are consistent with what is visible in transcript/audio evidence.
- Pipeline stage health: transcription provider provenance, retries/rescue path, semantic judgment status, validator/repair trace, quota/provider failures.
- Material authority: matched script/playbook/custom rules/mandatory gates reflect uploaded materials and tenant/vertical; missing material is not blamed on the rep.
- Decision chain: `evidence_layer` -> `decision_scope` -> `grounded_decision` -> `coaching_generation_input` -> final structured coaching all agree.
- CQ layers: speaker roles, call type, discovery, commitment, objections, red flags, social proof/assumptive close, focus routing, audio judgments, section checklists, and primary-fix outcome are either accepted and consumed or explicitly unavailable for a valid reason.
- Persistence/DTO/UI: accepted decisions reach `Feedback`, coaching entities, observations, skill scores, objection instances, call highlights, review DTO, and visible Call Review/rep view surfaces without a second decision-maker overriding them.

If any integrity step fails, do not grade the coaching yet. Fix the earliest reliable source of the bad truth, then rerun/reprocess before judging.

## Elite Coaching Quality Pass

After integrity is safe, put on the sales coach hat before looking for code fixes:

1. Read the transcript, transcript windows around key moments, material/script context, final review, and `references/sales-coaching-quality-lens.md`.
2. Form your own opinion:
   - What actually happened?
   - What did the rep do well?
   - What was the highest-leverage miss for show rate, customer trust, commitment, call control, objection recovery, or script/material execution?
   - Which issue is primary, which issues are secondary, and which are noise/admin cleanup?
   - What should the rep practice next, in concrete spoken language when safe and allowed?
3. Compare system feedback against that opinion:
   - Does the primary fix match the biggest business risk?
   - Did the system elevate a low-impact reason while missing the real issue?
   - Did admin logistics outrank spouse/decision-maker, purpose, objection, commitment, or cementing risk?
   - Did a UI/mapper/ranker create a second decision-maker after the AI chose correctly?
   - Are generated lines grounded, useful, lane-aware, and source-labeled correctly?
   - Would the rep know exactly what to do differently next call?

Good output can catch more issues than your manual read, but it cannot make illogical, low-leverage, or invented reasons look important.

## Fix Workflow

Use the upstream-cause ladder:

1. Visible wrong output.
2. Validator/display/persistence step that allowed it.
3. Generation/ranking/matching/decision step that created or selected it.
4. Prompt, data contract, source authority, material normalization, or product rule that caused the wrong decision.
5. Sibling layers with the same pattern.

Fix at the earliest reliable layer. For AI semantic bugs, update the decision matrix, prompt, grounding contract, examples/counterexamples, or bounded repair. Validators should teach/reject/repair; they should not silently become the sales coach.

When fixing:

- Prefer no-cost replay from saved artifacts before paid live reruns.
- Add golden/mutation cases for the general pattern, not the exact observed phrase.
- Keep deterministic code to schema, grounding, provenance, policy, persistence, queue/idempotency, and display integrity unless there is a documented `SEMANTIC_DETERMINISM_ALLOW` reason.
- Update docs/backlog/Journey when a reusable pattern or unresolved bug exists.
- Commit locally after a coherent fix and verification. Push only when deployment is needed or the user asks.

## Rerun Strategy

Use the narrowest proof:

- Downstream/entity/display fix: use `coachai-downstream-rerun`; do not rerun audio.
- Prompt/coaching generation fix: use coaching-only or downstream path if supported by the current code.
- Transcript/diarization/audio-feature fix: full analysis rerun may be necessary.
- Missing or stale `analysis.json`: fix persistence/rerun durability first.

After rerun, fetch the review and re-check the final user-visible behavior. Do not stop at "command succeeded."

## Queue Closeout

Mark the row based on what actually happened:

```powershell
npm run audit:analysis-queue --workspace=backend -- --mark <queueItemId> --status debugged --agent=codex --summary "reviewed clean"
npm run audit:analysis-queue --workspace=backend -- --mark <queueItemId> --status fixed --agent=codex --summary "bug fixed and rerun verified"
npm run audit:analysis-queue --workspace=backend -- --mark <queueItemId> --status needs_fix --agent=codex --summary "root issue identified but unresolved"
npm run audit:analysis-queue --workspace=backend -- --mark <queueItemId> --status ignored --agent=codex --summary "artifact not useful for audit"
```

Use `--delete <queueItemId>` only when the user wants the temporary queue pointer removed. Deleting the queue row does not delete the session or artifact.

## Final Report

Use plain language:

- What was audited and which session IDs.
- Whether the data was trustworthy enough to judge.
- Your independent sales-coach read.
- What the system said.
- Match/mismatch and why.
- Root cause if wrong.
- What you changed and tested.
- Whether rerun/reprocess happened and what the final review now says.
- Queue status (`debugged`, `fixed`, `needs_fix`, `ignored`, or deleted).

Answer the final check explicitly: "Does this fully satisfy the product intent, or did I only patch the current failure?"
