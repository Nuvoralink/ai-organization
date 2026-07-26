# Regeneration and Cascade Lifecycle

VisualForge runs more than once. Each run produces persisted artifacts that later runs must update, regenerate, supersede, or preserve. Without explicit lifecycle rules, regeneration corrupts terminal evidence, leaves stale derived files, or silently produces inconsistent output.

## Backbone decision (locked)

The **canonical authority** for VisualForge output is `docs/design-system/tokens/tokens.json` for token values and `docs/design-system/auditability/decision-log.md` for all material design decisions.

All other files (per-doc narratives, per-component specs, derived token formats, Figma file, microcopy.json, RULES.md, HOW-TO-READ.md, 00-index.md) are **derived state** from those two authorities plus the per-subskill source docs.

Consequences:

- A change to `tokens.json` cascades to `tokens.css`, `tokens.ts`, `tokens.figma.json`, the Figma file, and every component spec that binds those tokens.
- A change to a decision card (new DEC-NNN, or superseded entry) cascades to the docs that consume that decision.
- A change to a per-subskill source doc (e.g., `01-foundations/design-brief.md`) cascades to every later subskill that read it.

The Figma file, despite being a *thing* designers edit, is **not** the authority. It is a rendered mirror. Designer edits to Figma not also reflected in tokens.json drift; the rules-update protocol enforces resolution.

## In-flight conflict detection (v1.1 — per VF-FIND-005)

If the agent detects mid-run any of these conflicts:

- DEC-ID collision (two subskills issuing the same ID).
- DEC-ID outside the issuing subskill's allocated range.
- Naming collision (two components / tokens / personas with the same canonical name).
- Allocation violation (any other rule from `decision-id-allocation.md`).

The response is **not** to work around. The response is:

1. **Halt** the current subskill before its next file write.
2. **Renumber / rename at source** per the allocation table. If the conflict is a DEC-ID collision, the subskill that violated its range yields to the one within range; the violating decision is renumbered.
3. **Update every file referencing the conflicting ID / name** to use the new value.
4. **Append a `correction` entry** to the decision-log noting the in-flight rename. Format: `### [CORRECTION — DEC-NNN renumbered to DEC-MMM]` with the reason and the files updated.
5. **Resume the subskill** from the corrected state.

### Forbidden workaround patterns

These shapes are explicitly forbidden in any VisualForge artifact (file or JSON):

- DEC-NNN with arbitrary suffix: `DEC-200_icon`, `DEC-200-tmp`, `DEC-200_alt`.
- DEC-CATEGORY-NNN (Specforge-style): `DEC-SCOPE-001` is fine in `app-plan/` (Specforge namespace) but forbidden in VisualForge `design-system/` outputs.
- Parallel ID systems: never invent a `TMP-NNN` or `WIP-NNN` namespace to dodge conflicts.

The validation script's `check_strict_dec_shape` enforces. Mid-run validation (per orchestrator Checkpointing protocol) halts the run if a workaround shape appears.

## Producer and reconciliation matrix

Every regeneration trigger creates, updates, supersedes, or preserves derived files. Document each:

| Producer / trigger | What changes | Reconciliation | Preserved | Test |
|---|---|---|---|---|
| User runs `Use $visualforge` (orchestrator full run) | All subskill docs regenerated; tokens.json supersedes prior; Figma builds/syncs | Existing files overwritten unless tagged "user-edited" (rare); decision log entries appended, never overwritten | All entries in decision-log.md; all entries in research-ledger.md; pressure-test-iterations.md; rules-update-log.md; user-locked content marked `<!-- user-edit: keep -->` | Diff against prior run; verify decision-log.md grew, not shrank |
| User runs `Use $visualforge-[name]` (single subskill) | Only that subskill's docs regenerated; downstream subskills NOT re-run automatically; orchestrator surfaces affected downstream as "stale" warning | Subskill's own output regenerated; downstream marked stale in `00-index.md` | Decision-log entries for the subskill incremented (never overwritten); other subskills' content untouched | Diff confirms only the subskill's section changed |
| Tokens.json hand-edit | tokens.css/ts/figma.json regenerated from build pipeline | All derived token files regenerate; Figma sync prompts; downstream component spec validation re-runs | tokens.json edit history (via git) | Build pipeline confirms equivalence; validation script passes |
| Decision card added (any subskill) | decision-log.md gains entry; consuming docs may need refresh | Subskill that issued the DEC may re-run; downstream stays until explicit run | All prior decision-log entries | Validation script confirms no duplicates, no overwrites |
| Decision card superseded (status: superseded by DEC-NNN) | Original entry preserved with status change; new entry added | Consuming docs MUST update to reference the new DEC | Original entry, all history | Validation script confirms both entries exist; consuming docs reference the new one |
| Persona refined (adaptive trigger) | Persona file appended with `### Revision YYYY-MM-DD` block | Downstream subskills consuming personas may re-run | All prior revision blocks (append-only) | Diff confirms append; no deletion |
| Pressure-test BLOCK finding → revision | Upstream subskill re-runs; downstream cascades; pressure-test re-runs | Per-finding revision cycle | All pressure-test-iterations.md entries | Iteration logged; verdict trail visible |
| Retrofit inventory re-scan | retrofit/inventory.md, data-inventory.md regenerated | Ideal design re-evaluated against new inventory; drift-report.md regenerated | Prior drift report (versioned via git) | New drift report differs from old only where inventory differs |
| Figma file manually edited (designer) | DRIFT DETECTED on next VF run | Drift detection report surfaces the edit; user chooses: import to VF or revert in Figma | Figma file history (Figma's own) | Drift detection script flags |

## Persisted derived state lifecycle

For every derived artifact, every relevant state:

| Derived state | When source unchanged | When source changes | When source deleted | When superseded | Terminal evidence |
|---|---|---|---|---|---|
| `tokens.css` / `tokens.ts` / `tokens.figma.json` | Untouched (idempotent regenerate) | Regenerate from tokens.json; preserve any hand-written CSS outside the marked block | Not applicable — tokens.json never deleted; tokens deprecated instead | Old derived files overwritten; deprecated tokens emit warnings per design-ops 2-minor-version policy | None (these are pure derivations) |
| Figma variables / styles / components | Untouched | Sync from tokens.json; tagged nodes update; untagged nodes left alone | Tokens marked deprecated stay in Figma with a `deprecated` description; removed after 2 minor versions | New variable created with new value; old marked deprecated | Figma version history |
| Per-component spec file | Untouched | If component's referenced tokens change, spec auto-updates token paths but keeps prose; if component itself changes, full regenerate | Component file moves to `05-components/deprecated/` for 2 minor versions, then removed | New component spec at new path; old marked deprecated | Spec file in deprecated/ folder |
| Per-screen spec | Untouched | If a component the screen uses is deprecated, screen spec updated to point at the replacement | Screen file moves to `06-screens/deprecated/` | New screen file; old marked deprecated | Spec file in deprecated/ folder |
| `_index.md` files (personas, components, screens) | Regenerated each run (idempotent) | Regenerated; reflects current state | n/a | n/a | None — these are pure derivations |
| `00-index.md` | Regenerated each run | Regenerated; reflects current state + last-regenerated timestamp | n/a | n/a | None |
| `decision-log.md` | Untouched | Append-only; entries never deleted, only marked superseded | n/a | New entry added; old marked `Status: superseded by DEC-NNN`; both preserved | ENTIRE FILE — never overwritten, only appended |
| `research-ledger.md` | Untouched | Append-only | n/a | n/a | ENTIRE FILE — append-only |
| `pressure-test-iterations.md` | Append-only | n/a | n/a | n/a | ENTIRE FILE — append-only |
| `rules-update-log.md` | Append-only | n/a | n/a | n/a | ENTIRE FILE — append-only |
| Persona files | Untouched | Append `### Revision` block; do not edit prior content | Persona moved to `personas/retired/[slug].md` with retirement reason | New persona file replaces; old retired | Retired folder preserves history |
| Retrofit drift report | Untouched if inventory unchanged | Regenerated each retrofit re-scan | n/a | n/a | Versioned via git |

## Idempotency contract

Running VisualForge with no input change must produce **byte-equivalent** output, with these allowed differences:

- Timestamps in `00-index.md`, `auditability/run-log.md`, `auditability/mcp-detection-report.md`.
- Run identifier in append-only logs.

Anything else changing on idempotent re-run is a bug.

**Test**: run VisualForge twice with no input change. Diff the output. Allowed diff is only the timestamp / run-id lines listed above.

## Concurrency protection

When VisualForge begins a run, the orchestrator:

1. Checks for an existing lock file at `docs/design-system/.visualforge.lock`.
2. If present and < 1 hour old, refuses with: "VisualForge appears to be running (lock acquired YYYY-MM-DD HH:MM). Remove the lock if the previous run was killed."
3. If absent or stale (> 1 hour), creates the lock with current timestamp + run ID + host info.
4. Releases the lock on completion or on any halt.

Concurrent design-system regeneration is otherwise undefined behavior.

## Narrowest-rerun determination

When the user invokes a single subskill, the orchestrator computes the affected downstream cascade:

```
discovery → user-research → competitive-audit → design-trends-research →
brand-identity → design-tokens → surface-treatments → iconography →
information-architecture / layout-system / mobile-and-responsive / i18n-rtl →
ux-flows → component-system → content-design → micro-interactions / scroll / imagery →
data-viz / auth-flows / system-pages / notifications →
accessibility → motion-design →
frontend-contract → design-ops → figma-build →
design-qa → design-pressure-test → agent-rules-update
```

When a subskill mid-pipeline runs:

- Subskills earlier in the chain: untouched.
- Subskills later in the chain that depend on its outputs: **marked stale** in `00-index.md` (`### Stale since [date] — re-run $visualforge-[name]`).
- Orchestrator offers to cascade-rerun the affected downstream, or leaves stale markers for user to address.

This avoids unnecessary work while making staleness visible.

## Terminal evidence rule

These files are **terminal evidence** — never overwritten, only appended:

- `auditability/decision-log.md`
- `auditability/research-ledger.md`
- `auditability/pressure-test-iterations.md`
- `auditability/rules-update-log.md`
- `auditability/figma-build-log.md`
- `auditability/run-log.md`
- `auditability/drift-detection-report.md` (each entry timestamped; old entries preserved)
- `auditability/deferred-findings.md` (append-only)
- `auditability/rejected-findings.md` (append-only)

Regeneration that overwrites any of these is a bug.

## Version stamping

Every regenerated doc carries a footer:

```markdown
---
Generated by VisualForge [run-id] on [YYYY-MM-DD HH:MM TZ].
Source: `tokens/tokens.json` rev [git-short-sha or "uncommitted"]; `auditability/decision-log.md` last DEC-[NNN].
```

This makes "which run made this doc" visible to readers.

## Drift detection on rerun

On every run (after the first), the orchestrator runs drift detection:

- Any hex / rgb / px / ms / cubic-bezier appearing in *implementation code* (not VF docs) that doesn't match a token — flag.
- Any UI component implemented without a referenced design-system component — flag.
- Any `tokens.json` edited without a corresponding decision card — flag.
- Any Figma file diff against the last `figma-build-log.md` — flag.
- Any agent-rule files manually edited contradicting VF's last update — flag.

Findings to `auditability/drift-detection-report.md`. The user is asked: accept (legitimate hand-tuning, document why), or revert (re-sync from VF).

## What's missing surface

`docs/design-system/WHATS-MISSING.md` is regenerated each run with:

- Decisions deferred (`Confidence: Low` + open question).
- Components inventoried but not specced.
- Screens referenced but no SCR file.
- Tokens referenced but not in tokens.json.
- Pressure-test FIX-NEXT and WATCH findings.
- Personas walkthroughs not yet run.
- Subskills not yet run (partial chain).
- Backend gaps from retrofit data inventory.

This is the single page a stakeholder reads to know what's still outstanding.

## Visual-direction-lock cascade (v1.8.0 — per VF-FIND-043)

The `auditability/visual-direction-lock.md` artifact (produced by orchestrator Step 0g) is **a third backbone authority** alongside `tokens.json` and `decision-log.md`. It commits the run-level visual direction (theme paradigm, Hero Scale, default Hero Composition Anchor, narrative spine, background-mode mix, signature components, motion-implied language, second-read moment, banned-by-default visual patterns).

Once committed, every downstream visual subskill cites the lock. A change to a lock commitment therefore cascades. Without explicit cascade rules, an in-run change to e.g. Hero Scale leaves brand-identity, layout-system, imagery-illustration, motion-design, and every screen spec citing the old Hero Scale — silently inconsistent.

### Commitments and their cascade fan-out

| Lock commitment | Owner subskill | Subskills that must re-run on change | Files invalidated |
|---|---|---|---|
| Theme paradigm | `visualforge-brand-identity` | `design-tokens`, `surface-treatments`, `imagery-illustration`, every screen spec | `02-visual-language/*.md`, `tokens.json`, all screen specs |
| Typography character | `visualforge-brand-identity` | `design-tokens` (type tokens), every screen spec citing display | `tokens.json`, `02-visual-language/brand-identity.md` |
| Hero Scale | `visualforge-brand-identity` | `layout-system` (H1 width contract), `imagery-illustration` (hero composition), every screen spec with a hero | `03-structure/layout-system.md`, hero screen specs |
| Default Hero Composition Anchor | `visualforge-brand-identity` | `layout-system`, every screen spec | hero screen specs, marketing-page specs |
| Narrative / concept spine | `visualforge-brand-identity` | `imagery-illustration` (narrative-spine binding), `motion-design`, `content-design`, every screen spec | most narrative-touching files |
| Background mode mix | `visualforge-imagery-illustration` | `layout-system` (variety rule), `surface-treatments`, screen specs | screen specs with background commitments |
| Signature components | `visualforge-component-system` | `component-system` (the 4 components must exist), screen specs that use them | `05-components/*` for the 4 components |
| Motion-implied language | `visualforge-motion-design` | `motion-design`, `micro-interactions`, `scroll-and-gesture` | timing-token consumers |
| Second-read moment | designated owner (per lock §"Second-read moment ownership") | the owner subskill + 1 screen spec where the moment lives | 1 screen spec |
| Banned-by-default visual patterns | run-wide | `surface-treatments` (gradient ban), `imagery-illustration` (image-behind-text), every screen spec | every visual surface |

### Cascade trigger protocol

When a lock commitment changes mid-run or post-run:

1. **Halt** the current subskill before its next file write (mirrors the in-flight conflict detection protocol).
2. **Append-only update to the lock**: never overwrite the previous commitment in place. The lock file uses the supersession protocol:
   ```markdown
   ## Hero scale

   - [ ] Mid Editorial  *(Superseded by revision YYYY-MM-DD: Giant Statement — rationale)*
   - [x] Giant Statement
   ```
3. **Log the change** in `auditability/overrides-log.md` with: which commitment changed, what the new value is, why (user override / pressure-test finding / late-bound brand input), and which subskills are invalidated.
4. **Mark affected downstream files stale** in `00-index.md` with `### Stale since YYYY-MM-DD — re-run $visualforge-[name] (visual-direction-lock change)`.
5. **Re-invoke the subskills** in the affected column of the table above, in dependency order.
6. **Re-run `design-pressure-test`** at the end of the cascade — specifically Pass I (brand coherence) and the Visual-direction critic in Pass L.
7. **Auto-mode default:** if no user signal disambiguates the new value, refuse to silently change the lock; surface to user as a BLOCK.

### Forbidden lock-cascade patterns

These shapes fail the lifecycle contract:

- Editing a `**Chosen:**` line in-place without recording the supersession.
- Cascading only some downstream subskills (e.g., re-running `layout-system` but not `imagery-illustration` after a Hero Scale change).
- Skipping the post-cascade pressure-test re-run.
- Inventing a `wip` or `temp` Hero Scale that bypasses the supersession protocol.

### Idempotency under lock changes

If the lock has not changed, downstream visual subskills are untouched on re-run (idempotency contract above still holds). The lock's modification timestamp is the trigger.

### Validator enforcement

`check_visual_direction_lock_complete` (v1.8.0, VF-FIND-035) checks for the lock's required commitments and unresolved placeholders. A future complementary check `check_visual_direction_lock_supersession_protocol` would verify in-place edits are never made — superseded commitments must be visibly marked, not deleted. Tracked as a follow-up (VF-FIND-043 §"Future enforcement").

## Anti-slop regeneration rules

- Overwriting decision-log.md fails the terminal evidence rule.
- Silently regenerating without idempotency check fails.
- Re-running and producing different output with same input fails (unless the diff is timestamp / run-id only).
- Skipping concurrency lock fails.
- Letting stale downstream propagate without staleness markers fails.
- Editing a lock commitment in-place without supersession fails per the v1.8.0 visual-direction-lock cascade.
- Cascading only some downstream subskills after a lock change fails — the cascade is per-commitment all-or-nothing.
