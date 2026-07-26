# Resilience and Recovery

VisualForge runs are long, multi-stage, and produce many interdependent files. Failure modes are real: subskill errors, agent context exhaustion, host crashes, user interrupts. This protocol makes runs resumable, mistakes correctable, and costs visible.

## Run state machine

Every run carries state. Persist it at `docs/design-system/auditability/run-state.json` after each subskill completes:

```json
{
  "run_id": "vf-2026-05-18-1430-abc123",
  "started_at": "2026-05-18T14:30:00Z",
  "host": "claude-code | codex | cursor",
  "mode": ["greenfield", "specforge-enhanced", "retrofit"],
  "skill_version": "1.0.0",
  "input_hashes": {
    "tokens_json": "...",
    "decision_log": "...",
    "specforge_app_plan": "..."
  },
  "subskill_status": {
    "visualforge-discovery": "completed",
    "visualforge-user-research": "completed",
    "visualforge-competitive-audit": "completed",
    "visualforge-design-trends-research": "completed",
    "visualforge-brand-identity": "in_progress",
    "visualforge-design-tokens": "pending"
  },
  "last_checkpoint": "2026-05-18T14:42:00Z",
  "decisions_added_this_run": ["DEC-090", "DEC-091", "DEC-092"]
}
```

States per subskill: `pending`, `in_progress`, `completed`, `failed`, `skipped` (with reason), `revised` (during pressure-test loop, with iteration count).

## Checkpoint protocol

After each subskill completes:

1. Update `run-state.json`.
2. Append a one-line entry to `auditability/run-log.md`:
   ```
   2026-05-18T14:42:00Z — visualforge-brand-identity completed (4 decisions added, confidence high)
   ```
3. Refresh the concurrency lock's heartbeat (extend TTL).

## Resume protocol

When VisualForge starts a run, before any work:

1. Read `auditability/run-state.json` if present.
2. If a run has subskills with `in_progress` or `pending` status and is < 24 hours old, offer to resume:
   ```
   A previous VisualForge run started YYYY-MM-DD HH:MM completed N of M subskills.
   Last checkpoint: [subskill name] at HH:MM.

   (a) Resume from checkpoint — pick up where the run left off
   (b) Restart — discard partial state and run fresh
   (c) Inspect — show me the run state, then decide
   ```
3. If user picks (a):
   - Skip completed subskills.
   - Re-run the `in_progress` subskill from scratch (its partial output may be inconsistent).
   - Continue with `pending` subskills.
   - Validate the resumed state against current inputs (input hash mismatch = fresh run required).
4. If user picks (b): treat the previous run as abandoned, archive `run-state.json` to `auditability/abandoned-runs/[run-id].json`, start fresh.
5. In Auto mode without a user, default to resume if checkpoint < 1 hour old; restart if older.

## Mistake correction (without violating append-only)

Append-only files (`decision-log.md`, `research-ledger.md`, `pressure-test-iterations.md`, `rules-update-log.md`) cannot be edited in-place. Mistakes get one of three handlings:

### Class 1 — Typo / formatting / broken link
- Add a follow-up entry immediately after the original, formatted as a `correction`:

```markdown
### [CORRECTION to DEC-014] — Typo in token name

Previous entry referenced `shadow.card.rest` but the canonical token name is `shadow.elevation.card.rest`. The token reference is corrected; the rationale, options, and outcome of DEC-014 are unchanged.

Corrected: 2026-05-18 by [agent / user]
```

Both entries stay. Tooling reading the log honors the correction.

### Class 2 — Factual error
- Add a `correction` entry that supersedes the factual claim:

```markdown
### [CORRECTION to DEC-014] — Factual error in Linear shadow research

DEC-014 cited Linear as using 4-layer shadows; current observation shows 3-layer. The decision to adopt multi-layer shadow is unchanged, but the basis is amended. See research-ledger RES-NNN for verified observation.
```

The original entry stays; the basis changes.

### Class 3 — Decision was wrong
- This is supersession, not correction. Create a new DEC-NNN that supersedes:

```markdown
### DEC-225 — Card shadow approach (supersedes DEC-014)

Status: Active. Supersedes DEC-014 (marked Superseded by DEC-225).

[Full new decision per opinionated-decision-template.]
```

Update the original DEC-014 entry by appending a status block (this is the *only* permitted edit to an append-only entry):

```markdown
### DEC-014 — Card shadow approach
[original content unchanged]

---
**Status:** Superseded by DEC-225 on 2026-05-18. Reason: …
```

The status block is the *only* allowed modification to a previously-written entry. Tooling reads the most recent active decision.

## User override protocol

When the user disagrees with a VisualForge decision:

### Inline override during run
```
> override DEC-014 to "single drop shadow, 4px y-offset, 12px blur"
```

The orchestrator:
1. Records the user's preference.
2. Re-invokes the responsible subskill (here, surface-treatments) with the override as a User-confirmed constraint.
3. The subskill writes a new decision (DEC-NNN) per the supersession protocol above.
4. Downstream cascades follow.

### Post-run override
After a run completes, the user can issue:
```
> Use $visualforge-surface-treatments to override DEC-014: use single drop shadow instead of multi-layer.
```

Same supersession path.

### Bulk override
```
> override these decisions: DEC-014 → single shadow; DEC-021 → no glass on nav; DEC-100 → use Tailwind defaults for primary palette
```

The orchestrator queues all overrides, runs each through the supersession protocol, cascades downstream once, and reports the cascade summary.

### Override of a foundational decision
If the override would change brand identity or design tokens at a foundational level, the orchestrator warns: "This override cascades to ~N components and ~M screens. Confirm to proceed."

### Override audit trail
Every override is logged in `auditability/overrides-log.md` with:
- Date, user identity (if available), original DEC, new DEC, reason given, cascade scope.

## Cost / time estimation (pre-run)

Before a full orchestrator run, the orchestrator produces a brief estimate:

```
VisualForge run estimate

Mode: greenfield
Subskills to run: 30
Estimated agent steps: ~120–180 (varies by research depth)
Estimated tokens: ~250k–450k (depending on research and Figma build)
Estimated wall time: 20–45 minutes
Files produced: ~80–130
Decisions logged: ~80–200

MCPs detected: Figma (yes), Browser (no), GitHub (yes), Image-gen (no)
Quality with current MCPs: Good (no Tier R missing)

Proceed? (yes / lite / preview-only / cancel)
```

This sets expectations before the user commits. Lite mode (below) cuts to a smaller scope. Preview-only runs Step 0 + discovery + brand identity then pauses for review.

## Partial-output preview

For long runs, the orchestrator surfaces key decisions mid-run for user confirmation, not every decision:

- **After foundation phase** (discovery → trends): "Foundation set. Brand attributes: [list]. Personas: [list]. Adopted trends: [list]. Continue?"
- **After visual language phase** (tokens, surfaces, icons): "Visual language locked. Primary color: [value]. Type: [family]. Surface: [approach]. Continue or override?"
- **After structure + interaction phase**: "Components: [count]. Screens: [count]. Continue with quality + handoff?"
- **After pressure test**: "Pressure test: [verdict]. [N] BLOCK findings. Proceed with revisions or accept as-is?"

User can confirm, pause for review, or issue overrides at each pause point. Auto mode skips the prompts but still writes the summaries to `run-log.md`.

## Skill version stamping

Every generated doc carries a `<!-- visualforge: v[major.minor.patch] run-id=[id] -->` HTML comment in the first line. The validation script reads this; future maintainers comparing two design systems can tell which VF version produced each.

The orchestrator records the active VF version in `run-state.json` and in every appended log entry. If a re-run detects a different VF version than the previous run, it logs: "VisualForge version changed from [old] to [new]. Migration may be required. Review CHANGELOG."

## Cost-related cancellation

If the agent's context approaches exhaustion mid-run:

1. Complete the current subskill's checkpoint.
2. Update `run-state.json`.
3. Write a "context exhausted, resume needed" note to `run-log.md`.
4. Release the lock cleanly.
5. Surface to user: "Run paused at [N of M] subskills. Resume with `Use $visualforge to resume run [run-id]`."

Never crash mid-write leaving a half-written file.

## Lock TTL — adaptive

Concurrency lock now uses heartbeat-extension:

- Initial TTL: 1 hour.
- Every checkpoint (after each subskill): extend TTL to current-time + 1 hour.
- If lock heartbeat ages > 30 min without extension, agent is presumed stalled — surface to user.
- Long runs (retrofit on large repos) extend naturally; abandoned runs expire predictably.

## Failure modes

### A subskill fails
- Write `failed` status to `run-state.json` with the exception / reason.
- Surface to user with the error and three options: (a) retry the subskill, (b) skip the subskill (with cascade impact summary), (c) cancel the run.
- In Auto mode, default to retry once; if second failure, skip with log.

### A required input is missing
- Mark the subskill `blocked` in `run-state.json`.
- Surface what's needed.
- Auto mode: skip with explicit gap recorded in `WHATS-MISSING.md`.

### Tokens.json fails property-based test
- Refuse to proceed. The token system is the backbone.
- Surface the failing property + the specific token pair.
- Wait for fix (manual or via decision override).

### Pressure-test loop exceeds 3 iterations
- Already handled per orchestrator's loop limit + exemption rules.

## Anti-slop resilience rules

- Crashing mid-write without checkpoint fails.
- Resume protocol that re-runs already-complete subskills wastes resources — must skip via input-hash verification.
- Append-only violations claimed as "fixes" fail; use correction or supersession protocol.
- Bulk override without cascade summary fails.
- Run estimate that says "depends" or "varies" with no numbers fails.
- Skill version stamping omitted from a regenerated doc fails the implementation safety contract.
