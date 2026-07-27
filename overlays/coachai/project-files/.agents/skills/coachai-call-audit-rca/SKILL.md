---
name: coachai-call-audit-rca
description: Audit CoachAI session analysis like a sales coach, compare transcript/audio/materials against generated downstream feedback, identify mismatches, root-cause code/data issues, and fix them. Use when the user asks for call audit, RCA, deep review, compare your sales-coach opinion to generated feedback, or provides session IDs for this workflow.
---

# CoachAI Call Audit RCA

## Purpose

Use this skill to independently judge a call as a sales coach, compare that judgment with the generated downstream artifacts, find why mismatches happened, and fix root causes in code, prompts, tests, or normalization.

Do not expose chain-of-thought. Give concise conclusions, evidence, and fixes.

## Inputs

- One session ID or multiple session IDs.
- Optional screenshot/UI complaint.
- Optional specific focus, such as objections, mandatory gates, coaching lines, checklist rows, hero, drills, or tonality.

## Product Lens

The ideal product behavior is the source of truth:

- Transcript/audio facts are evidence, not suggestions.
- Approved script, call requirements, objection playbooks, and custom rules constrain scoring and coaching.
- AI semantic judgment is expected to make open-world sales-coaching decisions when the transcript supports them. Deterministic code validates grounding, speaker, material authority, lane, score policy, and provenance; it should not reject a grounded judgment only because the phrase/label was not prelisted.
- Coaching lanes must stay distinct:
  - `manager_accountability`: rep vs approved materials.
  - `craft_excellence`: above-script sales technique and delivery.
  - `material_intelligence`: material/script/playbook gaps, not rep penalties.
- Downstream UI must not invent, promote, or stitch lines outside its scope.
- Use known business outcome as an audit lens, not a forced label. If a call was a no-show, churn risk, wrong-contact booking, or successful save, use that outcome to ask whether the coaching explains the behaviors that made the outcome likely. Do not rewrite the analysis around the outcome if transcript evidence does not support it.
- First judge the call independently as a sales coach. Then compare generated artifacts against that judgment.
- When generated output is wrong, trace the full path: source evidence, AI decision, validation and repair, ranking or selection, persistence, mapper/DTO, UI, and rerun or stale artifact state.
- Do not fix semantic misses primarily with phrase policing unless the issue is exact policy, exact source compliance, security, or display safety.
- If an issue is real but not fixed in this pass, add it to `docs/COACHING_BUG_BACKLOG.md`.

## Workflow

1. Gather source data for each session:
   - `GET /api/coaching/sessions/:sessionId/review`
   - persisted `analysis.json` via storage/DB helpers when needed
   - transcript, `utterance_metrics`, `audio_features`, delivery events, prospect signals
   - `semantic_judgment`, `objection_decision_audit`, validation status/reasons
   - active script, mandatory gates, objection rules/playbook, custom rules
   - persisted `Feedback`, `CoachingObservation`, `ObjectionInstance`, `SkillScoreSnapshot`, `CallHighlight`

2. Form an independent sales-coach opinion:
   - What actually happened in the call?
   - What did the rep do well?
   - What were the highest-leverage improvements?
   - Which misses are scored requirements vs craft tips vs material gaps?
   - Which coaching line would be appropriate, using approved script/playbook first and AI only when needed?

3. Compare downstream artifacts against that opinion:
   - summary/hero/top fixes
   - checklist verdicts and evidence quotes
   - mandatory gates
   - objection detection/matching/response lines
   - grounded semantic judgment candidates and whether accepted candidates reached ranking/coaching/UI
   - generated drills and next-call focus
   - UI-visible replacement/suggested lines
   - timeline markers and ranks

4. Classify each mismatch:
   - extraction/data issue
   - stale persisted data or rerun issue
   - material normalization issue
   - matcher/scoring/ranking issue
   - semantic-judgment grounding/consumption issue
   - coaching-line authority issue
   - mapper/UI display issue
   - prompt/example/regression issue

5. Fix at the root:
   - Prefer shared helpers and explicit authority boundaries.
   - Keep DTO/API contracts additive and backward compatible.
   - Add or update focused regressions using realistic sales-coaching examples.
   - Avoid frontend scrubbers as the primary fix unless the issue is purely display.
   - Do not make completed/pass rows show "Say this instead."

6. Verify:
   - Run targeted backend regressions for touched areas.
   - Run frontend tests/build when UI display changes.
   - Run `npm run build --workspace=backend` for backend changes.
   - If deployed validation is needed, use the `coachai-downstream-rerun` skill to reprocess without Gemini.

## Data Pointers

Common source files:

- `backend/src/lib/objectionDetection.ts`
- `backend/src/lib/coaching/replacementLineResolution.ts`
- `backend/src/lib/coaching/coachingLineAuthority.ts`
- `backend/src/lib/coaching/callChecklistEvaluator.ts`
- `backend/src/lib/coaching/callReviewMapper.ts`
- `backend/src/lib/coaching/populateCoachingEntities.ts`
- `backend/src/lib/mandatoryTopicEvidenceValidation.ts`
- `backend/src/lib/coaching/machineCoachingFooter.ts`
- `frontend/src/components/coaching/callReview/*`

## Learned Failure Modes

- If a downstream-only rerun does not reflect a new objection-matcher fix, inspect `backend/src/lib/coaching/reprocessDownstreamSession.ts`. The rerun must treat persisted `feedback.objections` from `analysis.json` as stale evidence and re-run current objection normalization/material matching before `populateCoachingEntities`; otherwise old playbook labels and replacement lines are faithfully copied back into the UI.
- For callback resistance that was previously matched to a spouse/busy playbook, verify the reprocess path uses `normalizePersistedObjectionsForReprocess` and has a regression in `backend/scripts/reprocessDownstreamSessionRegression.ts`.
- Schema drift has caused wasted audit time before. Before writing DB/API inspection scripts, verify actual current shapes from `backend/prisma/schema.prisma`, route response wrappers, and mapper DTOs instead of assuming UI or older field names. Examples already hit: `ObjectionInstance` has `playbackProvenance`, `playbackSourceType`, `aiSuggestedLineSourceType`, and `hasVerifiedQuote`, but no `playbackApprovalStatus`; `SkillScoreSnapshot` has `skillLabel`, `score`, `confidence`, and `evidenceSnippets`, but no `maxScore`; review endpoints may return wrapped data (`body.data`, `body.review`, or direct DTO), so normalize the wrapper before reading fields.
- A semantic layer can be present but still not be a real architecture change if its accepted candidates do not drive final feedback, primary-fix ranking, generated lines/drills, labels, DTOs, or UI/debug surfaces. Audit the full consumption path before calling it fixed.
- When a strict structured-output stage repairs or retries, audit the whole prompt family together: initial generation, schema retry, semantic critic, core repair, and field repair. The provider `response_format` must be the only JSON-shape authority. Do not repeat a pseudo-JSON output object containing copyable placeholders, pipe-delimited enum examples, bare `string`/`boolean` tokens, or values that downstream normalization would reject. Keep semantic value rules as prose and feed reason-coded normalization failures back to the bounded retry. Fail-state: one variant removes its bad example while another variant still teaches the same invalid payload, causing routine repair calls or an uninformative parse failure. Regression mutation: reintroduce an illustrative invalid output object in either the initial or retry prompt and require the prompt contract test to fail. Counterexample: a prose sales-coaching example that is not presented as the model's output payload remains allowed.
- Before turning a presentation preference such as concise copy into a structured-output rejection or paid repair trigger, compare the provider-supported schema subset with the actual rendered surface. If the provider strips the proposed constraint (for example `maxLength`) and the UI wraps the field without truncation, keep concision as an AI-authored instruction and reserve deterministic validation for contract integrity such as presence, grounding, terminal punctuation, and balanced delimiters. Fail-state: the model is repeatedly asked to count characters that the provider cannot enforce, and otherwise valid coaching fails publication or burns repairs. Regression mutation: restore the character-count rejection and require a complete, grounded sentence beyond that former limit to fail the test. Counterexample: an externally fixed-width protocol field with an enforceable byte limit still requires deterministic length validation.
- When one bounded repair can change primary truth, audit the complete causal merge group, not only the prompt response. Primary selection changes the validity of dependent drills, advice, and selective secondaries; every exact failure reason must reach the repair, every corrected dependent key must be allowed to land atomically, and the merged candidate must be re-audited. Fail-state: the model returns a corrected secondary array but the merge restores the critic-rejected prior array, making the one-cycle repair impossible to pass. Regression mutation: remove the secondary key from the core regenerated-key set and require the merge test to restore the stale row. Counterexample: a narrow scalar field repair with unchanged primary truth should preserve every unrelated field verbatim.

Common regressions:

- `npm run test:regression:objection-matcher --workspace=backend`
- `npm run test:regression:semantic-judgment --workspace=backend`
- `npm run test:regression:mandatory-evidence --workspace=backend`
- `npm run test:regression:call-checklist-evaluator --workspace=backend`
- `npm run test:regression:call-review-mapper --workspace=backend`
- `npm run test:regression:machine-coaching-footer --workspace=backend`
- `npm run test:regression:coaching-line-authority --workspace=backend`
- `npm run test:regression:coaching-line-composer --workspace=backend`

## Output

Keep the final answer short:

- sales-coach read
- mismatches found
- root cause
- files changed
- verification run
- whether a downstream rerun is needed
