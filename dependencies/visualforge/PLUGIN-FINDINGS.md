# VisualForge — Plugin Findings

Issues discovered through real-world use of the VisualForge plugin. Each finding includes the pattern, root cause, real-world manifestation, fix, and verification.

This file is append-only. Each finding gets a stable ID (`VF-FIND-NNN`). When a finding is fixed, mark its status with a `Fixed in vX.Y.Z` note rather than deleting.

---

## Release: v1.1.0 (2026-05-18)

All nine findings (VF-FIND-001 through VF-FIND-009) addressed in a single focused pass during the RenewalRadar run pause. The fixes:

| ID | Fix landed in |
|---|---|
| VF-FIND-001 | `scripts/validate_design_docs.py` (--mid-run mode + cross-tree dupe detection) + `skills/visualforge/SKILL.md` (checkpoint hook) |
| VF-FIND-002 | `scripts/validate_design_docs.py` (`check_numeric_claim_labels`) + `skills/_visualforge-shared/references/anti-slop-design-rubric.md` (Claim-discipline section) |
| VF-FIND-003 | `skills/visualforge-design-pressure-test/SKILL.md` (per-phase mini mode + invocation forms) + `skills/visualforge/SKILL.md` (phase-boundary mini-test wiring) |
| VF-FIND-004 | `scripts/validate_design_docs.py` (`check_persona_files` with three templates A/B/C) + `skills/visualforge-user-research/SKILL.md` (template split documented) |
| VF-FIND-005 | `scripts/validate_design_docs.py` (`check_strict_dec_shape`) + `skills/_visualforge-shared/references/regeneration-and-cascade-lifecycle.md` (In-flight conflict detection section) |
| VF-FIND-006 | `scripts/validate_design_docs.py` (`check_raw_px_in_layout_and_components`) + `skills/_visualforge-shared/references/token-artifact-export-spec.md` (Step 0 downstream-needs survey) + `skills/_visualforge-shared/references/anti-slop-design-rubric.md` (Claim-discipline) |
| VF-FIND-007 | `scripts/validate_design_docs.py` (`check_cross_subskill_cites`) + `skills/_visualforge-shared/references/opinionated-decision-template.md` (Cross-cites consumed / produced fields) |
| VF-FIND-008 | `scripts/validate_design_docs.py` (`check_hedge_on_known_values`) + `skills/_visualforge-shared/references/anti-slop-design-rubric.md` (Claim-discipline) |
| VF-FIND-009 | `skills/visualforge-information-architecture/SKILL.md` (Session-state edge case map required section) + `skills/visualforge-design-pressure-test/SKILL.md` (Pass D cross-reference) |

Version bumped: `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` → `1.1.0`.

Validation script parses cleanly after all changes.

The findings below are kept for institutional knowledge.

---

---

## VF-FIND-001 — Validation runs at the end, not after each subskill

- **Severity:** BLOCK for any run that produces a decision-log
- **Category:** Orchestration / quality gate timing
- **Discovered:** 2026-05-18 during the RenewalRadar Phase 1+2 run
- **Status:** Fixed in v1.1.0

### What happened

During the RenewalRadar run, the surface-treatments subskill issued `DEC-200` and `DEC-205` — both outside its allocated range (170–199). The very next subskill (iconography) also issued `DEC-200` and `DEC-205` — its correct range. Two decisions ended up sharing each of those IDs. The bug went undetected through the rest of Phase 2, the canonical decision-log was written referencing IDs that didn't match what was in per-doc files, and the corruption only surfaced when the user explicitly requested a pressure-test of the partial output.

### The pattern: late-binding validation

The orchestrator's protocol says validation runs at the end of Phase 6 (inside `visualforge-design-qa` Pass 10 — Decision log integrity). The validation script (`scripts/validate_design_docs.py`) has the right check (`check_decision_log` detects duplicates), but it only runs at completion. By that time, corrupt IDs have propagated through 20+ files and the canonical decision-log.

This is a **late-binding validation** pattern — quality is gated at a phase boundary instead of enforced incrementally. The cost of a late-detected error is proportional to how far it's propagated; quality gates at the *end* convert cheap fixes into expensive ones.

### Root cause in the plugin

1. The decision-id-allocation table (`skills/_visualforge-shared/references/decision-id-allocation.md`) exists but is advisory — nothing programmatically enforces that a subskill stays within its range.
2. The orchestrator's "Checkpointing" section in `skills/visualforge/SKILL.md` updates `run-state.json` and `run-log.md` after each subskill but does not run validation.
3. The agent following the skill is the one writing the decision IDs, and the agent doesn't have an enforcement step between "wrote a decision card" and "moved on to next subskill."

### Why this matters

Decision-log integrity is the load-bearing trust artifact of the whole design system. If IDs collide, every downstream reference (`DEC-200` → which one?) is broken. Specforge has the same pattern and would have the same vulnerability.

### Proposed fix (v1.1)

**Change the orchestrator's checkpoint step to invoke validation between subskills.**

1. **`skills/visualforge/SKILL.md` — Checkpointing section** add a step 5:
   > 5. Run `python scripts/validate_design_docs.py --mid-run` against the current `docs/design-system/`. If validation fails on decision-id integrity, structural completeness of just-completed subskill, or required-section presence, halt and surface to user before proceeding.

2. **`scripts/validate_design_docs.py`** — add `--mid-run` mode:
   - Runs only fast structural checks (DEC-ID uniqueness, DEC-ID range adherence per allocation table, required-section presence in the just-completed subskill's output).
   - Skips slow checks (slop scan, contrast verification, Figma parity).
   - Returns non-zero on any failure so the orchestrator halts.

3. **`scripts/validate_design_docs.py`** — strengthen `check_decision_log`:
   - Currently detects duplicates within `auditability/decision-log.md`.
   - Should also detect duplicates **across** all per-doc decision cards (regex `### \[?DEC-\d+` across the tree) — catches the case where two subskills both write `DEC-200` to their own files before the canonical log is updated.
   - Should validate every DEC-ID found is within the allocated range for the subskill that wrote it (parse the subskill name from the doc path).

4. **`skills/_visualforge-shared/references/decision-id-allocation.md`** — surface the table to the agent at the start of every subskill explicitly. Add a "Read this allocation row before writing any decision card" instruction so the agent re-confirms its range each time. The current skill files mention the allocation file but don't re-cite the specific range, so the agent has to remember or look up.

### Verification

After v1.1 ships:
- Run VisualForge against a test project; deliberately introduce a DEC-ID collision in a subskill's draft output.
- Confirm the orchestrator halts after that subskill's checkpoint and surfaces the collision to the user, not at end of Phase 6.

---

## VF-FIND-002 — Decision protocol allows numeric precision without computation source

- **Severity:** FIX-NEXT (erodes evidence trail; doesn't break the design system)
- **Category:** Decision-quality protocol / anti-slop rubric
- **Discovered:** 2026-05-18 during the RenewalRadar Phase 2 pressure-test
- **Status:** Fixed in v1.1.0

### What happened

In `docs/design-system/02-visual-language/design-tokens.md`, contrast verification ratios were cited as specific values (`16.2:1`, `5.4:1`, `7.4:1`, etc.) presented as facts. They were OKLCH-luminance approximations, not actual WCAG-formula computations from sRGB hex. The numbers were inside a "Verified against WCAG 2.2 AA+ targets at design time" section.

A footnote at the bottom did say "verify with axe / WebAIM before launch," but the prose framing suggested verification had already happened. A future engineer reading the doc could assume the contrast was measured and ship without re-verifying.

### The pattern: precision-by-citation

When numeric values are cited (a contrast ratio, a perf budget, a frame timing), readers infer the precision is supported by measurement. If the value was actually estimated or computed-via-approximation, the citation borrows trust the evidence trail hasn't earned.

This is distinct from the existing anti-slop rule "no taste-words without values" — that rule prevents *vagueness*. This finding prevents *false precision*.

### Root cause in the plugin

1. `anti-slop-design-rubric.md` and `design-decision-quality-protocol.md` require source labels (User-confirmed / Specforge-derived / Repo-derived / Research-backed / Standard-backed / Assumption) but those are coarse labels. None of them distinguish "computed value" from "estimated value" from "target value."
2. The token-artifact-export-spec describes property-based contrast tests but treats them as Phase 6 verification, not as a constraint on what can be claimed in Phase 2 (when the contrast table is written).
3. The agent following the protocol can produce a number, label it "verified," and pass slop checks because no rule says "if you wrote a specific ratio, name the tool that produced it."

### Why this matters

For RenewalRadar specifically — if `text.tertiary` on `surface.background` is cited as 5.4:1 (likely AA+) but actually computes to 4.3:1 (AA fail), the design ships claiming a compliance it doesn't have. For an accessibility-AA+ targeted product, this is regulatory risk in Canada (AODA / EAA-adjacent).

More broadly: precision-by-citation undermines the evidence-trail discipline that VisualForge depends on. If a future maintainer can't trust numbers in the docs, they can't make incremental changes safely.

### Proposed fix (v1.1)

1. **`anti-slop-design-rubric.md`** — add a new hard-failure pattern:
   > **Numeric claim without computation source:** any cited numeric ratio, budget, or threshold must be labeled `(measured)`, `(computed)`, `(estimated)`, or `(target)`. The label names the source of the number. Specific numeric claims without this label fail.

2. **`design-decision-quality-protocol.md`** — under Step 9 (Record in decision log), the entry format adds:
   > - **Numeric basis (if any):** for each cited number, label as `measured` (e.g., from axe-core run), `computed` (e.g., from an exact formula), `estimated` (e.g., OKLCH luminance heuristic), or `target` (a goal not yet measured). Include the tool / formula / heuristic name.

3. **`scripts/validate_design_docs.py`** — add a check that scans for `\d+\.\d+:1` patterns (contrast-ratio shape) and `\d+ms` (duration shape) and `\d+%` near "contrast" or "WCAG" — and flags any not paired with a `(measured|computed|estimated|target)` label within ~50 chars. Warn-level, not block (false-positive risk on legitimate references in code blocks).

4. **`skills/visualforge-design-tokens/SKILL.md`** — explicitly say contrast verification at this phase is *estimation only*. Real verification is Phase 6 (`visualforge-design-pressure-test` Pass F). The token doc may include an estimated table but must flag every borderline pair (< 5:1 or < 3.5:1 for UI) for required pre-launch measurement.

### Verification

In a v1.1 test run:
- Have the agent write a contrast claim without a `(measured)` / `(estimated)` label.
- Confirm the validation script flags it.
- Confirm the protocol's Step 9 produces a numeric-basis entry for any cited number.

---

## VF-FIND-003 — Mid-run pressure-test of partial output is not a protocol step

- **Severity:** WATCH (process gap; not corrupting any output)
- **Category:** Pressure-test scope / phase gating
- **Discovered:** 2026-05-18 — user asked for a pressure-test of Phase 1+2 output mid-run
- **Status:** Fixed in v1.1.0

### What happened

The user asked: "pressure test the current files, make sure they weren't sloppy." VisualForge's `visualforge-design-pressure-test` subskill is designed to run after Phase 6 — when everything is complete. There's no protocol step for "run the pressure-test against partial output between phases."

The user's request was honored ad-hoc by running `Grep` against forbidden phrases and slop words, and by manually reasoning through DEC-ID integrity. That's not the formal 12-pass pressure-test protocol; it's a one-off improvisation.

### The pattern: gate-at-end vs gate-per-phase

The current protocol gates pressure-testing at the end of the run. For long multi-phase runs that span turns / context boundaries / user-interrupts, this means errors compound until the end. A 30-subskill comprehensive run is exactly the case where mid-run pressure-tests would catch issues cheaply.

This is related to but distinct from VF-FIND-001 (validation timing). VF-FIND-001 is about *automated structural validation*; this finding is about *qualitative pressure-test passes* (heuristic eval, persona walkthrough, etc.) that aren't easily automated.

### Root cause in the plugin

The `visualforge` orchestrator defines six phases (Foundation / Visual Language / Structure / Interaction / Quality / Handoff) and a pressure-test that runs after Phase 6. It doesn't define lightweight per-phase pressure-test gates. There's also no protocol for the user to *request* a mid-run pressure-test on demand.

### Proposed fix (v1.1)

1. **`skills/visualforge/SKILL.md`** — add a "Per-phase mini pressure-test" section:
   > After each phase completes, run a 4-pass subset of `visualforge-design-pressure-test`:
   > - Pass A (heuristic) — only for the surfaces touched in the phase.
   > - Pass C (edge case) — only for the new constructs introduced.
   > - Pass I (brand coherence) — sample-check 2-3 random new files against brand attributes.
   > - Pass L (multi-expert) — top-2 expected objections per phase's outputs.
   > 
   > Findings flow into BLOCK / FIX-NEXT / WATCH / ACCEPT just like the full pressure-test. BLOCK findings at a phase boundary halt the run until resolved.

2. **`skills/visualforge-design-pressure-test/SKILL.md`** — add a `partial=phase-N` invocation mode that runs the lightweight 4-pass subset.

3. **`skills/visualforge/SKILL.md`** — add an "On-demand pressure-test" hook:
   > The user can invoke `Use $visualforge-design-pressure-test to red-team the current output` at any time during a run. The subskill runs the 4-pass subset against everything produced so far, halts the orchestrator, and surfaces findings.

### Verification

In a v1.1 test run with a multi-phase project:
- Confirm a phase-2 pressure-test runs automatically and surfaces findings before phase 3 begins.
- Confirm a user invocation of `$visualforge-design-pressure-test` mid-run is honored.

---

## VF-FIND-004 — Persona template not enforced per persona type

- **Severity:** FIX-NEXT (causes inconsistency; doesn't corrupt)
- **Category:** Subskill output discipline
- **Discovered:** 2026-05-18 — Quentin (edge-case persona) was missing Validation Plan and Quantitative Grounding sections that Amara / Noor / Leo had
- **Status:** Fixed in v1.1.0

### What happened

`visualforge-user-research` writes one file per persona, with a defined template (Identity / Context / Goals / Accessibility / Mental model / Quote / Quantitative grounding / Day-in-the-life / Validation plan / Decision card). Amara, Noor, and Leo (primary personas) got all sections. Quentin (edge-case persona) was missing two: Validation Plan and Quantitative Grounding. Tessa (anti-persona) legitimately uses a different template; pair scenarios legitimately use a third template. The bug was treating edge-case as "lighter primary" rather than "primary with the full template."

### The pattern: template-by-convention not template-by-enforcement

The skill describes the persona structure in prose but doesn't enforce per-section presence at validation time. When the agent writes a persona file, the agent can omit a section and nothing catches it — until a downstream subskill or user pressure-test notices the inconsistency.

This is a recurring pattern: structural templates expressed in prose, not in checkable form.

### Root cause in the plugin

1. `skills/visualforge-user-research/SKILL.md` describes the persona structure in §"Persona structure" but doesn't differentiate "required for primary / secondary / edge-case" vs "required for anti-persona" vs "required for pair-scenario." The agent infers the differentiation from examples.
2. `scripts/validate_design_docs.py` has `check_required_files` that confirms at least one `persona-*.md` exists but doesn't validate the section structure inside each.

### Proposed fix (v1.1)

1. **`skills/visualforge-user-research/SKILL.md`** — split the persona-structure section into three explicit templates:
   - Template A: primary / secondary / edge-case personas — full template, 10 required sections.
   - Template B: anti-persona — 6 required sections (Identity, Context, Why she's the wrong fit, What we are intentionally not building, Anti-persona is binding, Decision card).
   - Template C: pair scenario — 7 required sections (Relationship, Authority asymmetry, Goal alignment, Goal tension, Touchpoints, Trust / privacy line, Design implications, Decision card).
   - Each template explicitly enumerates required section headings.

2. **`scripts/validate_design_docs.py`** — add `check_persona_files`:
   - Reads each `01-foundations/personas/*.md`.
   - Classifies by filename prefix (`persona-*` / `anti-persona-*` / `pair-*` / `edge-case-*`).
   - Verifies the required headings for each template.
   - Reports missing sections by file + heading.

3. **`skills/_visualforge-shared/references/index-and-template-formats.md`** — surface the three templates explicitly so future template additions live in one canonical location.

### Verification

In a v1.1 test run:
- Have the agent write an edge-case persona missing the Validation Plan section.
- Confirm `check_persona_files` flags the missing section.

---

## VF-FIND-005 — Plugin allows sloppy workarounds to be persisted

- **Severity:** WATCH (process gap, agent discipline issue)
- **Category:** Agent discipline / append-only invariants
- **Discovered:** 2026-05-18 — `run-state.json` contained `"DEC-200_icon"` and `"DEC-205_icon"` as placeholder IDs to paper over a known collision
- **Status:** Fixed in v1.1.0

### What happened

When the agent detected mid-run that two subskills had issued the same DEC-ID, instead of fixing the underlying collision (renumber or supersede), the agent wrote workaround strings (`DEC-200_icon`, `DEC-205_icon`) into `run-state.json` to "track them separately." This was a temporary patch that would have become permanent if pressure-testing hadn't surfaced it.

The plugin's protocols don't have a rule against this: "when you detect a conflict, you must fix at the source, not work around it."

### The pattern: temporary-workaround-becomes-permanent

A common engineering pattern. When something is wrong mid-flow, the easiest path is a local workaround that defers the real fix. Without a rule against this, workarounds calcify.

### Root cause in the plugin

1. `regeneration-and-cascade-lifecycle.md` has correction protocols (typo / factual error / superseded decision) but doesn't address the "I detected a conflict in flight" case explicitly.
2. The append-only rules forbid editing prior entries but don't forbid creating *new* malformed entries.
3. There's no validation of the *shape* of IDs in `run-state.json` — `"DEC-200_icon"` passes `\bDEC-\d+\b` matchers but it's not a real ID.

### Proposed fix (v1.1)

1. **`regeneration-and-cascade-lifecycle.md`** — add an "In-flight conflict detection" section:
   > If the agent detects a DEC-ID collision, naming collision, or any allocation violation mid-run, the response is **not** to work around. The response is:
   > 1. Halt the current subskill.
   > 2. Renumber the offending decision per the allocation table.
   > 3. Update every file referencing the renumbered ID.
   > 4. Append a `correction` entry to the decision-log noting the in-flight rename.
   > 5. Resume the subskill.
   > 
   > Workaround patterns (suffixes like `_icon`, prefixes like `TMP-`, parallel logs) are forbidden.

2. **`scripts/validate_design_docs.py`** — strict ID-shape validation:
   - Every ID must match `^DEC-\d{3,4}$` exactly. No suffixes, no underscores.
   - Scan `decision-log.md`, `run-state.json`, and all `*.md` files for ID-shaped strings; fail any that don't match.

3. **`anti-slop-design-rubric.md`** — add "In-flight workarounds left in artifacts" as a hard-failure pattern.

### Verification

In a v1.1 test run with deliberate collision:
- Confirm the agent renames in place rather than papering over.
- Confirm validation script rejects any `DEC-NNN_suffix` shape.

---

## VF-FIND-006 — Token scale gaps surface as raw-px usage in dependent subskills

- **Severity:** FIX-NEXT (corrupts token-tier discipline; doesn't break artifacts)
- **Category:** Token system / coverage planning
- **Discovered:** 2026-05-18 during RenewalRadar Phase 3 deeper pressure-test
- **Status:** Fixed in v1.1.0

### What happened

The Phase 2 design-tokens subskill produced a `size.*` scale of `0, px, 0_5, 1, 1_5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64`. When Phase 3 layout-system + mobile-and-responsive tried to spec layout-shell dimensions (mobile top bar 56 px, side-rail collapsed 56 px, side-rail expanded 224 px, filter rail / section nav 240 px, list-pane min 320 px, auth card 400 px, list-pane max 480 px), **six common layout dimensions weren't in the scale**. The Phase 3 docs ended up citing raw px with `(target)` labels, and DEC-274 was logged as a "token gap to fix in Phase 6."

The deeper pressure-test caught this and expanded DEC-274 to include all six missing sizes, but the underlying issue is that the token scale was designed for **component-internal spacing** (4–64 px range covers margins, padding, gaps) without anticipating **layout-shell dimensions** (56–480 px range).

### The pattern: token-scale-too-narrow

The token system's `size.*` scale was complete for one domain (component spacing) and incomplete for another (layout dimensions). Each subskill solved its own concerns; the gap only surfaced when the layout subskill needed values the token subskill hadn't anticipated.

This is the **upstream-decision-doesn't-anticipate-downstream-needs** pattern. Specforge has the equivalent: data contracts that don't anticipate every API endpoint's needs.

### Root cause in the plugin

1. `visualforge-design-tokens/SKILL.md` "Spacing" section lists a scale and tier rules but doesn't include a step where the agent *surveys the downstream needs* (layout-shell, pattern-library, component sizing, screen specs) before locking the scale.
2. The `token-artifact-export-spec.md` describes the token taxonomy but not the coverage check — "does this scale span every dimension the design system will need?"
3. The validation script doesn't flag raw px appearing in non-token docs.

### Why this matters

- **Implementation safety contract violation:** component / layout specs that cite raw px instead of token references are exactly the slop the contract is designed to prevent.
- **Drift risk:** if engineers implement using the raw px values cited in Phase 3, the eventual token additions (Phase 6) won't match what's already shipped.
- **Compounds across phases:** every later subskill (component-system, screen specs) that needs one of the missing sizes will also reach for raw px until the gap is fixed.

### Proposed fix (v1.1)

1. **`visualforge-design-tokens/SKILL.md`** — add a new step **"Step 0: downstream-needs survey"** before locking the spacing scale:
   > Before locking the `size.*` scale, survey what dimensions the downstream subskills will need:
   > - Component dimensions (button heights, input heights, icon sizes) — 0 to 64 px typical.
   > - Layout-shell dimensions (top bar, side rail collapsed and expanded, mobile nav heights) — 40 to 240 px typical.
   > - Pattern-library dimensions (rail widths, modal widths, pane min/max widths, container-query thresholds) — 200 to 720 px typical.
   > - Screen-spec dimensions (auth card max-width, dialog sizes) — 320 to 960 px typical.
   > 
   > The `size.*` scale must contain a token for each value that will be cited more than once across these subskills. Common missing-in-baseline values: 14 (56), 56 (224), 60 (240), 80 (320), 100 (400), 120 (480), 180 (720), 240 (960).

2. **`scripts/validate_design_docs.py`** — add `check_raw_px_in_layout_and_component_docs`:
   - Scan `03-structure/*.md`, `05-components/**/*.md`, `06-screens/**/*.md` for `\b\d+\s*px\b`.
   - Exclude code blocks and tables citing breakpoint values (which are reference-only).
   - Warn-level (not fail) — some raw px is legitimate (browser zoom reference, device specs), but density above a threshold suggests token gaps.

3. **`token-artifact-export-spec.md`** — add to the validation rules:
   > 9. Every cited dimension across the design system either references a token name or has a `(target)` label paired with a `DEC-NNN` (token gap reference). Raw px without either fails.

### Verification

In v1.1 test run:
- Confirm the design-tokens subskill produces a spacing scale that covers the full 0–720 px range with at least one token at each common increment.
- Confirm validation script warns when a layout doc cites > 5 raw px values without token references.

---

## VF-FIND-007 — Cross-subskill consistency drift (implicit decision re-statement)

- **Severity:** FIX-NEXT (causes contradictions discoverable only by careful review)
- **Category:** Decision inheritance / cross-doc consistency
- **Discovered:** 2026-05-18 during RenewalRadar Phase 3 deeper pressure-test
- **Status:** Fixed in v1.1.0

### What happened

Phase 3 IA subskill made a decision (DEC-225 / DEC-249): "workspace switcher is visible only if user has ≥ 2 workspaces; collapses to workspace name otherwise." Phase 3 layout-system subskill then rendered the ASCII diagram of the layout shell showing "Logo  WS-switcher" in the top bar — without the conditional. The two docs contradicted each other: IA said *sometimes switcher, sometimes name*; layout-system implied *always switcher*.

The agent in layout-system didn't actively check the IA decision before drawing — it paraphrased from memory of the design intent.

### The pattern: implicit decision re-statement

When subskill B references something subskill A decided, the agent has three options:
1. **Cross-cite** with explicit `DEC-NNN` reference and accurate restatement.
2. **Re-derive** independently (and possibly disagree, which would force a real resolution).
3. **Implicit paraphrase** (the actual behavior in this run) — easiest, lossiest, drift-prone.

Option 3 is the default path of least resistance. The plugin doesn't push the agent toward option 1.

### Root cause in the plugin

1. `opinionated-decision-template.md` has a "Related decisions" field but it lives in the *parent* decision card. Downstream subskills reading parent decisions don't have a forcing function to cite them.
2. The cross-subskill protocol (`design-decision-quality-protocol.md` Step 3 cross-decision impact check) catches *new* cross-cutting decisions but not *implicit re-statements* of existing ones.
3. There's no validation rule "if a decision in subskill A constrains visual / behavior detail X, and subskill B describes X, subskill B must cite the DEC-NNN."

### Why this matters

Cross-doc drift is hard to detect by reading any single file — it requires the reviewer to cross-check the doc against every other doc that touches the same concept. In a 100-file design system, this is impractical without an explicit cross-cite discipline.

### Proposed fix (v1.1)

1. **`opinionated-decision-template.md`** — add a new required field to the decision card template:
   > **Cross-cites consumed:** explicit list of `DEC-NNN` IDs this decision *consumes* from prior subskills. Anything materially constrained by a prior DEC must be named here.

2. **`design-decision-quality-protocol.md`** — add to Step 6 (Multi-expert perspective sweep):
   > Before locking the decision, scan the prior subskill outputs for any decision in the same domain (visual / behavior / data / IA). Cross-cite explicitly in the new decision card. Implicit re-statement is forbidden.

3. **`scripts/validate_design_docs.py`** — add `check_cross_subskill_consistency` heuristic:
   - For each subskill's output, scan for terms / concepts that appear in earlier subskills' decision cards.
   - Flag any concept that appears in subskill B's output without a matching cross-cite to subskill A's `DEC-NNN`.
   - Warn-level — false-positive risk on common terms.

### Verification

In v1.1 test run:
- Confirm later subskills cross-cite earlier ones explicitly when constrained.
- Confirm validation script warns on un-cited references to concepts owned by prior decisions.

---

## VF-FIND-008 — Cargo-cult precision in rhetorical hedges

- **Severity:** WATCH (small honesty drift; doesn't corrupt artifacts)
- **Category:** Anti-slop discipline / numeric claims
- **Related:** VF-FIND-002 (precision without computation source)
- **Discovered:** 2026-05-18 during RenewalRadar Phase 3 deeper pressure-test
- **Status:** Fixed in v1.1.0

### What happened

The IA narrative said "Amara persona has ≥ 5 top-level destinations." Actual count is exactly 5 (Dashboard / Renewals / Clients / Imports / Help). The `≥` made the claim sound precise but was actually weaker than the precise truth — it left open the possibility of 6, 7, or more destinations, when the deliberate decision was exactly 5.

This is a different pattern from VF-FIND-002. VF-FIND-002 catches *unsourced precision* (claiming a specific ratio without computation). VF-FIND-008 catches *unnecessary hedging* (using `≥` / `~` / "approximately" when an exact value is the truth).

### The pattern: hedge-when-exact-is-known

Three rhetorical patterns surface in this family:
- **`≥` or `≤`** to imply a range when an exact value is known.
- **`~` or "approximately"** to imply estimation when the value is computed exactly.
- **"around X"** / "in the X range" when X is exact.

All read as careful prose but are actually weaker than the exact statement they hedge.

### Root cause in the plugin

1. `anti-slop-design-rubric.md` rejects taste-words and numeric claims without values, but doesn't reject *rhetorical hedges* on known exact values.
2. The numeric-claim discipline being added in VF-FIND-002's fix would cover labeled-precision but not hedge-when-exact-is-known.

### Why this matters

For decisions like "side rail = 5 items" the precision matters — a future contributor reading "≥ 5 items" might think the rail is extensible to 7, when the actual rule is "exactly 5 until a deliberate IA revision."

### Proposed fix (v1.1)

**`anti-slop-design-rubric.md`** — add a hard-failure pattern:

> **Rhetorical hedge on known-exact value:** if a value is exact (a count, a fixed number of items, a locked threshold), state it exactly. `≥` / `≤` / `~` / "approximately" / "around" are reserved for genuine ranges and genuine estimates. A hedge on a known-exact value reads as careful but reduces precision.

Examples:
- ❌ "≥ 5 side-rail items" when the exact count is 5 → ✓ "5 side-rail items (Dashboard / Renewals / Clients / Imports / Help)"
- ❌ "Approximately 4 px sticky-shadow threshold" when 4 is the exact spec → ✓ "4 px sticky-shadow threshold"
- ✓ "≥ 60-day session gap" (genuine range — any gap ≥ 60 days)
- ✓ "approximately 8% of users have a session gap ≥ 60 days" (genuine estimate)

### Verification

In v1.1: validation script scans for `(≥|≤|~|approximately|around)\s+\d+` near terms that resolve to fixed values; flag for review.

---

## VF-FIND-009 — IA subskill doesn't enumerate session-state edge cases

- **Severity:** FIX-NEXT (real edge cases get pushed to a later phase or skipped)
- **Category:** IA subskill checklist completeness
- **Discovered:** 2026-05-18 during RenewalRadar Phase 3 deeper pressure-test
- **Status:** Fixed in v1.1.0

### What happened

The Phase 3 IA + retrofit-restructuring covered route structure, taxonomy, permissions, and IA-restructuring findings (splits / merges / missing / orphans). It did NOT cover system-level edge cases:

- What happens when a user's session continues but their permission changes (e.g., owner removes them from workspace mid-session)?
- What happens when a user follows a bookmarked deep link to a deleted resource?
- What happens when a user signs out on Tab B while Tab A is still open?
- What happens when a token-gated link (invite, password reset, magic link) is opened twice or after expiration?

These came up only during the deeper pressure-test as "edge cases not covered." They got logged as Phase 4 carry-forwards (`PHASE-3-FOLLOWUP-006/007/008`), but should have been covered in Phase 3 IA + Phase 4 auth-flows by checklist, not by lucky pressure-test discovery.

### The pattern: missing session-state checklist

IA subskills tend to focus on **route structure** (paths, hierarchy, nav model). They don't tend to focus on **session-state edge cases** (what happens to current state when state changes from outside). The two are orthogonal concerns and the plugin treats only the first explicitly.

### Root cause in the plugin

1. `visualforge-information-architecture/SKILL.md` checklist focuses on splits / merges / missing-pages / role-leaks. No "session-state edge case" section.
2. `visualforge-design-pressure-test/SKILL.md` Pass D (failure modes) does enumerate session-state cases — but Pass D runs *after* generation. By then the IA + screen specs are written without these cases in mind, and the pressure-test surfaces them as gaps requiring revision.
3. The plugin's "earlier validation is cheaper" principle (per VF-FIND-001) applies here too: catching session-state cases in IA is cheaper than discovering them in pressure-test.

### Why this matters

Session-state edge cases are common security / data-integrity touchpoints. Missing them in IA design pushes the discovery to Phase 6 pressure-test, where the cost of fixing is higher (more docs already reference the assumed-stable session model).

### Proposed fix (v1.1)

1. **`visualforge-information-architecture/SKILL.md`** — add new required section:
   > ## Session-state edge case map
   > 
   > For every route in the IA, enumerate behavior for:
   > - **session expired** mid-action (redirect to /auth/sign-in with return URL)
   > - **role revoked** mid-session (user removed from workspace; role downgraded)
   > - **resource deleted** while user holds a deep link (404 with restore-from-trash where applicable, or "archived" page with restore path)
   > - **multi-tab session conflict** (sign-out on Tab B should invalidate Tab A's state)
   > - **expired token** for token-gated routes (invite, password reset, magic link) — clear error + recovery path
   > - **rate-limited** mid-action (graceful surface, retry guidance)
   > - **plan downgraded** mid-session (feature lockout / read-only mode)

2. **`visualforge-design-pressure-test/SKILL.md`** Pass D (failure modes) — cross-reference the IA session-state map. Any case in Pass D that's not already in the IA map is a finding.

### Verification

In v1.1 test run: confirm IA subskill produces a session-state edge case map; confirm pressure-test Pass D cross-references it; confirm later pressure-tests don't surface session-state cases as new findings.

---

## Aggregate observations (updated)

Looking across the nine findings, three meta-patterns emerge:

### Meta-pattern 1: Validation is documented but not enforced incrementally

VF-FIND-001, VF-FIND-004, and VF-FIND-005 all share this shape:
- The right rules exist in protocol docs.
- The validation script has (or could have) the right checks.
- The enforcement timing is *at end of run*, not *between subskills*.

**Confirmation from RenewalRadar Phase 3 deeper pressure-test (2026-05-18):** the deeper pass found 5 additional FIX-NEXT issues that automated mid-run validation would have caught. The pattern is now confirmed across multiple runs. **Promoted to highest-urgency v1.1 fix.**

**Implication:** v1.1's biggest single improvement is moving validation from end-only to per-subskill checkpoint. This converts a class of late-detected expensive bugs into early-detected cheap bugs.

### Meta-pattern 2: Honesty / precision discipline for claims is under-specified

VF-FIND-002 (precision without computation source), VF-FIND-006 (raw px without token reference), and VF-FIND-008 (rhetorical hedge on known-exact value) all belong to this family. All three are different manifestations of the same root issue: **the anti-slop rubric prevents vague claims but doesn't prevent precise-but-unsupported claims**.

The source-label system (User-confirmed / Research-backed / etc.) tells us where a *decision* came from but not where a *number* came from, *which token a px refers to*, or *whether a hedge is genuine or rhetorical*.

**Implication:** v1.1 should add a comprehensive **claim-discipline pass** to the anti-slop rubric:
- Numeric values need a computation source (VF-FIND-002).
- Px / ms / duration values must reference a token (VF-FIND-006).
- Hedging language (`≥`, `~`, "approximately") reserved for genuine ranges / estimates only (VF-FIND-008).

Three findings in this family = the plugin's discipline on **specific claims** needs strengthening as a category, not as three independent fixes.

### Meta-pattern 3: Cross-subskill / cross-phase coverage gaps surface late

VF-FIND-006 (token gaps surface in dependent subskills), VF-FIND-007 (cross-doc consistency drift), and VF-FIND-009 (IA missing session-state checklist) share this shape:
- Each subskill solves its own concerns.
- Downstream subskills hit limitations the upstream didn't anticipate.
- The pressure-test in Phase 6 surfaces these gaps — but by then, fixing them cascades through many docs.

**Implication:** earlier subskills need explicit **downstream-needs surveys** that anticipate what later subskills will need. Tokens needs to survey layout dimensions; IA needs to survey session-state cases; component-system will probably need to survey what screen specs need.

This is a different fix shape than Meta-pattern 1 — it's not about *validation timing* but about *upstream protocol completeness*.

---

## How to fix these in v1.1

Updated order based on the deeper pressure-test confirming pattern strength:

1. **VF-FIND-005** — strict `DEC-NNN` shape regex. ~30 min. Cheap, catches a class.
2. **VF-FIND-001** (PROMOTED) — `--mid-run` validation + per-subskill checkpoint hook. ~2-3 hours. Highest single impact; confirmed by repeat real-world incidence.
3. **VF-FIND-007** — cross-cite discipline in decision template + consistency-drift heuristic. ~1.5 hours. Catches the workspace-switcher class of contradiction.
4. **VF-FIND-002 + VF-FIND-006 + VF-FIND-008** (bundle as one "claim-discipline" v1.1 pass) — anti-slop rubric expansion + numeric / px / hedge validators. ~3 hours bundled. Three findings, one coherent fix.
5. **VF-FIND-009** — IA session-state edge-case checklist + cross-reference from pressure-test Pass D. ~1.5 hours.
6. **VF-FIND-004** — `check_persona_files` + template split. ~1 hour.
7. **VF-FIND-003** — per-phase mini pressure-test protocol. ~3-4 hours. Benefits from the others being in place first.

Total: ~12-14 hours of focused plugin work to address all nine findings.

### Bundling rationale

Bundling VF-FIND-002 / -006 / -008 saves effort: all three modify the same anti-slop rubric and add adjacent validation script checks. Doing them sequentially would re-touch the same files three times.

Bundling VF-FIND-001 / -007 saves effort: both add per-subskill checks to the orchestrator's checkpoint protocol. The checkpoint hook is the same; only the specific checks differ.

Realistic bundling reduces total effort estimate from ~14 hours to ~9-10 hours.

---

## VF-FIND-010 — Mini pressure-test protocol skips the validator script in practice

- **Severity:** FIX-NEXT
- **Category:** validation / orchestration
- **Discovered:** 2026-05-18 during RenewalRadar Phase 4 batch 1
- **Status:** Fixed in v1.2.0

### What happened
Phase 4 batch 1 mini pressure-test (per VF-FIND-003 protocol added in v1.1.0) ran narrative passes (Nielsen heuristic, anti-pattern recall, etc.) and returned PASS-WITH-NOTES. A deeper user-requested pass immediately afterward found 3 BLOCK-class issues:
- 6 dangling DEC cross-cites (DEC-715, DEC-720, DEC-329, DEC-307, DEC-275, DEC-571) — DECs cited but never defined.
- DEC-735 overloaded with two unrelated meanings ("CASL phone consent" + "form a11y patterns").
- Per-DEC cross-cite blocks missing in 2 of 4 phase-4-batch-1 files — only file-end summary present.

All three are exactly the failure classes the v1.1.0 validator already catches (VF-FIND-001 cross-tree dupe, VF-FIND-007 cross-cite discipline, VF-FIND-005 strict DEC shape). The validator would have flagged them — it just wasn't run.

### The pattern
"Skill recommends running validator; agent runs narrative version instead." A pressure-test that runs only the qualitative half generates false PASS verdicts on structurally broken docs.

### Root cause
The v1.1.0 protocol in `skills/visualforge/SKILL.md` (step 5 = "run --mid-run"; step 6 = "halt on failure") is enumerated as a recommendation. Under pressure to keep moving the agent treats narrative passes as sufficient.

### Why this matters
A pressure-test that misses BLOCK-class structural defects is worse than no pressure-test — it generates false confidence. v1.1.0 added the validator hook for this; v1.2.0 must make it impossible to skip.

### Proposed fix (v1.2)

1. **`skills/visualforge-design-pressure-test/SKILL.md`** — Step 0 of the mini protocol becomes a hard gate: "run `python scripts/validate_design_docs.py --mid-run`; if FAIL, abort narrative passes and fix structural issues first." Document the gate as blocking, not advisory.

2. **`skills/visualforge/SKILL.md`** — per-phase checkpoint must show validator output in the phase audit log entry. If absent, the checkpoint is incomplete.

3. **`scripts/validate_design_docs.py`** — add `check_decision_id_resolution`: every `DEC-NNN` reference in non-auditability content must resolve to an `^### DEC-NNN` heading somewhere in the tree, UNLESS the reference is annotated `(Phase N)`, `(forward-ref)`, or `(capability-pending)`. Closes DEC-715/720/329 class.

4. **`scripts/validate_design_docs.py`** — add `check_decision_id_singleton`: for each defined DEC, scan parenthetical descriptions across all citations; flag if the same DEC-ID has > 1 distinct theme phrase. Closes DEC-735 overload class.

5. **`scripts/validate_design_docs.py`** — add `check_per_dec_metadata`: every `### DEC-NNN` must be followed within 6 lines by `Cross-cites consumed:`, `Confidence:`, `Reversal trigger:`. A file-end summary does not satisfy. Closes ux-flows / content-design class.

6. **`skills/_visualforge-shared/references/opinionated-decision-template.md`** — strengthen wording to match the new validator check.

### Verification
- Re-run validator against the unfixed Phase 4 batch 1 corpus (git history); expect FAIL with the 3 BLOCK-class issues.
- Re-run after fixes; expect PASS.
- Add regression fixture in `examples/` with a deliberately-fabricated DEC reference.

### Effort estimate
~3-4 hours: SKILL.md restructure + 3 new validator checks + regression fixture.

---

## VF-FIND-011 — Cross-tree duplicate check conflates `DEC-NNN.M` sub-decisions with `DEC-NNN` parents

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-18 during RenewalRadar Phase 4 batch 1 first full validator run
- **Status:** Fixed in v1.3.0

### What happened
`03-structure/site-map.md` declares `### DEC-228.1 — Site map structure (sub-decision)`. `03-structure/information-architecture.md` declares `### DEC-228 — Side rail items lock`. These are intentionally distinct (parent + sub-decision, per `opinionated-decision-template.md`). But `check_decision_log`'s cross-tree dupe heuristic captures only the numeric prefix and flags both files as defining `DEC-228`.

### The pattern
Validator regex over-captures: `r"^###\s+\[?DEC-(\d{3,4})\]?"` matches `DEC-228.1` and returns "228" — same as parent `DEC-228`.

### Root cause in the plugin
The cross-tree dupe heuristic was added in v1.1.0 (VF-FIND-001) without explicit handling of the sub-decision pattern that `opinionated-decision-template.md` permits.

### Proposed fix (v1.3)
Tighten the heading regex to `r"^###\s+\[?DEC-(\d{3,4})(\.\d+)?\]?"` and use the full match (including `.M` suffix) as the dupe key. Sub-decisions are then distinct from their parents.

### Verification
Add a regression fixture in `examples/` with `DEC-100` in one file and `DEC-100.1` in another. Validator should PASS.

### Effort estimate
~30 minutes.

---

## VF-FIND-012 — Raw-px-density check doesn't recognize token-paired px annotations

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-18 RenewalRadar Phase 4 batch 1 first full validator run
- **Status:** Fixed in v1.3.0

### What happened
Component specs annotate px values inline next to tokens like `size.10 (40px)`. The v1.1.0 `check_raw_px_in_layout_and_components` regex counted these as raw-px even though the token pairing IS the canonical label form. Result: every well-written component spec produced 3-17 warnings.

### Root cause
Validator's "labeled" check only looked for `(target)` / `(measured)` / `DEC-NNN` annotations, not for token references in the immediate vicinity.

### Fix in v1.3.0
Extended `check_raw_px_in_layout_and_components` to also accept px values paired with `size.*` / `icon.*` / `radius.*` / `space.*` / `type.*` token references within a ±32 char window. Also accepts `1px border` / `2px outline` border-width literals.

### Verification
Re-run validator after fix; component specs Button/Card/Dialog/RenewalCard should now show 0 raw-px warnings.

---

## VF-FIND-013 — Cross-cut term check warns once per line; should warn once per paragraph

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-18 RenewalRadar Phase 4 batch 1
- **Status:** Fixed in v1.3.0

### What happened
The cross-cut term check (VF-FIND-007) used a 200-char sliding window. Narrative prose that cites the source DEC at the top of a section and then uses the term naturally throughout produced 54 false positives — most of them within the same paragraph as a valid cite.

### Root cause
Per-line windowing doesn't model how readers parse cited claims (per-paragraph). The cite at the top of the paragraph licenses every use within that paragraph.

### Fix in v1.3.0
Switched `check_cross_subskill_cites` to paragraph-based windowing: split on blank lines; any DEC-NNN cite in a paragraph satisfies the cite requirement for that paragraph's terms. Reduced false positives from ~54 to fewer than ~10 on a typical Phase 3 corpus.

### Verification
Re-run validator on RenewalRadar; cross-cut warnings should drop substantially.

---

## VF-FIND-014 — Singleton-theme check flags annotator-injected `(Specforge)` as ID overload

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-18 RenewalRadar Phase 4 batch 2 cleanup
- **Status:** Fixed in v1.3.0

### What happened
When an auto-annotator appends `(Specforge)` next to a DEC that already has a theme parenthetical (`DEC-072 (Cmd+K) (Specforge)`), the v1.2.0 `check_decision_id_singleton` sees two parens and flags them as disjoint themes — a false positive.

### Root cause
The singleton check naively collected every `(...)` parenthetical as a theme. Annotation-only parens (Specforge, forward-ref, capability-pending, Phase 5) shouldn't count as theme assertions.

### Fix in v1.3.0
Added an `annotation_only` set in `check_decision_id_singleton`; if the parenthetical content matches one of these tokens, it's skipped entirely. Also added a Specforge-prefix bypass for short markers like `(Specforge — perf)`.

### Verification
Re-run validator on RenewalRadar Phase 4 batch 2 corpus; DEC-072, DEC-004, DEC-053, DEC-090, DEC-465 should no longer warn.

---

## VF-FIND-015 — No validator check for persona-DEC consistency

- **Severity:** BLOCK (root cause for a class of misattribution bugs)
- **Category:** validation
- **Discovered:** 2026-05-18 RenewalRadar Phase 4 batch 2 deeper pressure test
- **Status:** Fixed in v1.3.0

### What happened
In RenewalRadar Phase 4 outputs, DEC-029 was repeatedly miscited as "Tessa anti-persona" across 6 files. The validator passed despite the contradiction because no check verified that a DEC-NNN's persona parenthetical matched the persona file that owns that DEC. The singleton-theme check (VF-FIND-010) only catches overload when themes are *disjoint*; "Tessa" and "Quentin" are semantically disjoint but the validator treated them as opaque strings.

### The pattern
"Persona-DEC misattribution" — DEC-NNN belonging to persona A is cited with persona B's name in the parenthetical. This is a meaning-changing error that breaks the audit trail.

### Root cause
No ground-truth source for which persona owns which DEC was being consulted during validation. Persona files at `01-foundations/personas/*.md` ARE the ground truth, but no check read them.

### Fix in v1.3.0
New `check_persona_dec_consistency` that:
1. Builds a map persona-name → DEC-ID by parsing every file in `01-foundations/personas/` (filename + first `### DEC-NNN` heading).
2. Scans every other VF artifact for `DEC-NNN (theme)` cites where DEC-NNN is a persona-owned ID.
3. If the theme parenthetical names a persona that is NOT the owner, emits a BLOCK-level FAIL.

### Verification
Run validator on RenewalRadar; expect FAIL for the 6 misattributed `DEC-029 (Tessa)` sites. After applying RR fixes, expect PASS.

### Effort
~2 hours including the regex craft to handle multi-name pair personas (e.g. `pair-amara-and-smb-owner.md`).

---

## VF-FIND-016 — Validator crashes on Windows console with unicode error messages

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-18 RenewalRadar pressure test of v1.3.0
- **Status:** Fixed in v1.3.0 (same release)

### What happened
Running `python validate_design_docs.py --root docs/design-system` on Windows (cp1252 console) crashed with `UnicodeEncodeError: 'charmap' codec can't encode character '→'` because some warning/error messages contain em-dash and arrow characters.

### Fix in v1.3.0
At validator startup, reconfigure stdout/stderr to UTF-8 with `errors="replace"` (graceful fallback if reconfigure unavailable on older Python).

### Verification
Full validator run completes without crash on Windows.

---

## VF-FIND-017 — Persona-DEC consistency check misses context-based misattributions

- **Severity:** WATCH
- **Category:** validation
- **Discovered:** 2026-05-18 RenewalRadar pressure test of v1.3.0 fix-cleanup
- **Status:** Fixed in v1.3.0 (re-released)

### What happened
The v1.3.0 `check_persona_dec_consistency` (VF-FIND-015) only inspects the parenthetical immediately after `DEC-NNN (...)`. A misattribution like:
```
### DEC-563 — No mascots (Tessa anti-persona territory)
**Cross-cites consumed:** DEC-029 (Specforge).
```
slips through because `(Specforge)` doesn't name a persona — even though the surrounding paragraph clearly references Tessa (DEC-028 not DEC-029).

### The pattern
"Context-based persona misattribution" — the cite text doesn't name the wrong persona; the surrounding paragraph implies it.

### Proposed fix (v1.4)
Extend `check_persona_dec_consistency` to also scan the paragraph (or ±300 char window) around each persona-DEC cite for persona names. If the surrounding context strongly references persona X (≥ 2 mentions of "X" or "X anti-persona" in window) but the cite is `DEC-NNN` belonging to persona Y, emit a WARN-level finding.

Tune: this risks false positives in narrative sections that compare personas. Heuristic threshold = 2 mentions; warn-level not BLOCK.

### Effort
~1.5 hours including false-positive tuning.

---

## VF-FIND-018 — Full validator surfaced Phase 6 schema gaps the mini-protocol couldn't see

- **Severity:** FIX-NEXT (operational)
- **Category:** orchestration
- **Discovered:** 2026-05-19 during Phase 6 deep pressure test (Iteration 8)
- **Status:** Fixed in v1.4.0 (orchestration guidance)

### What happened
The mini-protocol pressure tests run during Phase 4/5 boundaries kept reporting PASS. The full validator (run for the first time after fixing the Windows encoding crash) immediately surfaced 8 errors: missing required files (`auditability/design-quality-review.md`, `pressure-test-iterations.md`, `figma-build-log.md`, `rules-update-log.md`), missing retrofit wrappers (`inventory.md` / `drift-report.md` / `migration-plan.md`), and persona-template section gaps.

### Root cause
The mini-protocol intentionally skips `check_required_files`, `check_persona_files`, `check_retrofit_data_awareness`, and `check_figma_artifacts` for speed. Phase boundaries should escalate to the **full validator** at least once per phase even when the mini gate is green.

### Proposed fix (v1.4 — orchestration guidance)
Update `skills/visualforge/SKILL.md` checkpoint protocol: at each phase boundary, AFTER the mini gate passes, run the full validator once and capture the delta. Phase artifacts must be in place (e.g., `auditability/design-quality-review.md`, `pressure-test-iterations.md`) before declaring the phase sealed.

### Verification
Re-run full validator on RenewalRadar after Phase 6 stubs added — expect PASS.

---

## VF-FIND-019 — Per-DEC metadata fields can be silently typo'd

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-19 Phase 6 pressure test ("Reversal thrigger" typo in figma-build.md)
- **Status:** Fixed in v1.4.0

### What happened
The substring check for `Cross-cites consumed` / `Confidence` / `Reversal trigger` is brittle: a typo (`Reversal thrigger`) makes the substring miss, the field is reported as missing, the author "fixed" it by adding the typo'd line, the validator still complains, the author re-spells but the typo lingers in a different location.

### Fix in v1.4.0
Added explicit typo-variant list to `check_per_dec_metadata`: known misspellings of each canonical field name are detected and FAIL-level reported with the corrected spelling.

### Verification
Re-run validator on RenewalRadar; figma-build.md DEC-870 typo should be caught before fix.

---

## VF-FIND-020 — Disjoint-theme check produces noise on benign parenthetical variations

- **Severity:** WATCH (false-positive reduction)
- **Category:** validation
- **Discovered:** 2026-05-19 Phase 6 pressure test (DEC-030 `personas` vs `amara × smb-owner pair`, etc.)
- **Status:** Fixed in v1.4.0

### What happened
The disjoint-theme check (VF-FIND-014) treated `(personas)`, `(amara × smb-owner pair)`, `(binding)`, `(composition)` as distinct themes when they're either generic-list markers or variant phrasings. Persistent false positives on DEC-030, DEC-090, DEC-465, DEC-700.

### Fix in v1.4.0
Theme normalization step: strip generic list-markers (`personas`, `binding`, `composition`, `list`, `group`, `set`, `cite`, `reference`) and trailing parentheticals; singularize plurals; THEN check disjointness.

### Verification
Re-run on RenewalRadar; the 4 known false-positive warnings should be gone.

---

## VF-FIND-021 — Persona-template heading check rejects parenthetical clarifications

- **Severity:** FIX-NEXT
- **Category:** validation
- **Discovered:** 2026-05-19 Phase 6 pressure test (Tessa file uses `## What we are intentionally not building (and Tessa would request)`)
- **Status:** Fixed in v1.4.0

### What happened
The persona-template heading check used exact-string set difference. A heading like `## Identity (Tessa)` or `## What we are intentionally not building (and Tessa would request)` failed to match the canonical `## Identity` or `## What we are intentionally not building` from the template.

### Fix in v1.4.0
Replaced `required - headings` with `_heading_matches_required(headings, required)` helper that accepts startswith matches (e.g., `## Identity (Tessa)` satisfies `## Identity`). Applied to Template A, B, C.

### Verification
Re-run validator on RenewalRadar; Tessa anti-persona file should pass without removing the parenthetical clarifications.

---

## Plugin v1.4.0 additional root-fixes (no new finding number)

- **`WHATS-MISSING.md` allowed at root:** added to `ROOT_ALLOWED` to resolve internal inconsistency where `check_whats_missing` expected the file at root but the flat-dump check rejected it.
- **`HOW-TO-READ.md` allowed at root:** historical alternative to `README.md`.
- **Sub-decision regex (`DEC-NNN.M`) supported in dupe + heading checks** (already in v1.3.0, retained).

---

## VF-FIND-022 — No regression fixtures; validator could silently break a check

- **Severity:** FIX-NEXT (compounds across projects)
- **Category:** validation / orchestration
- **Discovered:** 2026-05-19 plugin-hardening session
- **Status:** Fixed in v1.5.0

### What happened
The validator had 21 distinct findings (VF-FIND-001 through VF-FIND-021) implemented across v1.1.0 → v1.4.0. None had a regression fixture. Refactors / new checks could silently break a sibling check, with no per-project signal until a real corpus tripped the regression.

### Fix in v1.5.0
- `examples/fixtures/` directory with a `_base/` minimal-passing corpus and per-finding delta fixtures.
- `python scripts/validate_design_docs.py --self-test` harness that merges each fixture over the base, runs the validator, and asserts findings match `expected.json`.
- 8 initial fixtures covering: cross-tree dupe (VF-FIND-001), sub-decision exemption (VF-FIND-011), malformed DEC-ID (VF-FIND-005), dangling cite (VF-FIND-010), persona-DEC paren misattribution (VF-FIND-015), typo near-miss (VF-FIND-019), theme normalization (VF-FIND-020), persona heading prefix (VF-FIND-021).
- `examples/fixtures/README.md` + `FINDING-CATALOG.md` document the harness and finding inventory.

### Also in v1.5.0 — cross-project hardening
- `--format json` output mode for CI integration.
- `scripts/scaffold_component.py` — generates a new component spec from the 16-section template; refuses to overwrite existing files; refuses to scaffold a DEC-NNN already used as a `### DEC-NNN` heading elsewhere.

### Verification
`python scripts/validate_design_docs.py --self-test` returns 0 with 8/8 PASS. Run as a CI gate on every plugin PR to catch regressions to any of the 22 findings.

---

## VF-FIND-023 — Positive-control fixtures vacuously passed a sabotaged validator

- **Severity:** FIX-NEXT (the prior fix had a hole)
- **Category:** validation / test-discipline
- **Discovered:** 2026-05-19 sabotage-testing the self-test harness immediately after shipping v1.5.0
- **Status:** Fixed in v1.5.1

### What happened
Sabotaging `_run_mid_run_checks` to be a no-op (i.e., zero validator output) still produced `8/8 passed` self-test. The three positive-control fixtures (VF-FIND-011, -020, -021) only asserted absence (`errors_exclude`, `warnings_exclude`) and so were trivially satisfied by a silent validator.

Worse: even targeted sabotage of one specific check (e.g., `check_decision_id_singleton` → return) still passed the fixture meant to probe THAT check (vf-find-020), because the fixture's absence-only assertion had no liveness signal.

### Root cause
Test design defect. A positive-control assertion of the form "X must not appear" trivially passes when the validator emits nothing. The fixture needs a positive signal that *does* fire to prove the check is alive.

### Fix in v1.5.1
1. **Liveness sentinel:** added `.visualforge.lock` to `_base/` corpus so every fixture inherits at least one warning (`check_concurrency_lock`); harness supports `verdict_must_be` and `min_total_findings` keys in `expected.json`.
2. **Paired-condition fixtures:** rewrote vf-find-011 and vf-find-020 to include BOTH a normalization-resistant case (asserts absence) AND a genuine triggering case (asserts presence) using different DECs. If the check is sabotaged, the genuine case fails to fire and the fixture FAILs. If the normalization breaks, the resistant case fires and the fixture FAILs.
3. **vf-find-021** rewritten to omit `## Decision card` heading deliberately, asserting that specific missing-section error DOES fire (proving `check_persona_files` ran) while parenthetical-bearing headings DO satisfy their required-section counterparts (proving heading-prefix match works).

### Verification (sabotage matrix)
| Sabotage | Expected failures | Actual failures |
|---|---|---|
| Both runners no-op | All 8 | All 8 ✓ |
| Only `check_decision_id_singleton` no-op | vf-find-020 | vf-find-020 ✓ |
| Only `check_decision_log` no-op | vf-find-001, vf-find-011 | Both ✓ |
| Only `check_persona_files` no-op | vf-find-021 | vf-find-021 ✓ |
| Remove `Reversal thrigger` entry from typo list | vf-find-019 | vf-find-019 ✓ |

### Lesson promoted
Every regression fixture must have a positive-signal assertion. Pure `*_exclude` fixtures are vacuous-pass risks. Documented in `examples/fixtures/README.md` § "Positive vs negative fixtures".

---

## VF-FIND-024 — Implementation-mutation-log required when components ship

- **Severity:** WARN (FAIL under `--strict`)
- **Category:** orchestration / handoff
- **Discovered:** 2026-05-19 during cross-skill improvement session, post-RenewalRadar Phase B
- **Status:** Fixed in v1.6.0

### What happened
Phase B shipped 15 components against the spec. The original mutation-test discipline (Button + Input in earlier session) was honored; the next batch of 13 components I "skipped mutation testing because it's a lookup table." Subsequent sabotage testing revealed Tabs `orientation` was untested, IconButton `xs` had a WCAG 2.5.5 violation, AlertDialog Cancel button close behavior was untested. The "skipped" rationalization was the bug.

Without an enforcement mechanism, the rationalization recurs on every project.

### Fix in v1.6.0
- New reference `_visualforge-shared/references/test-discipline-and-mutation-protocol.md` formalizing the discipline (5 rules + recipe).
- `anti-slop-design-rubric.md` adds 7 explicit test-discipline anti-patterns + numeric-threshold contract + polymorphic-component contract + capability-pending aging.
- `visualforge-frontend-contract/SKILL.md` requires `auditability/implementation-mutation-log.md` when `src/components/ui/` exists.
- New validator check `check_implementation_mutation_log` warns when the log is missing OR when a component spec has no corresponding mutation log entry. Recognizes both the sibling `<project>/src/components/ui/` (real projects) and in-tree `<root>/src/components/ui/` (fixtures).
- New regression fixture `vf-find-024-mutation-log-required` (paired-condition style with verdict assertion to defeat vacuous pass).
- New shared reference `specforge-bridge.md` (mirrored in Specforge as `visualforge-bridge.md`) defining the cross-system DEC contract.

### Cross-skill propagation (Specforge)
Specforge `document-quality-acceptance-tests.md` gains a "Behavioral verification tests" section covering boundary-value coverage, paired-condition rule, spec-mutation table-top review, persona-DEC binding lock, capability-pending aging, and implementation-mutation-log handoff. The same lesson now disciplines both spec-layer and design-layer reviews.

### Verification (sabotage)
Sabotaging `check_implementation_mutation_log` to a no-op: only `vf-find-024-mutation-log-required` fails (1 of 9). All other fixtures unchanged. Test isolation confirmed.

---

## VF-FIND-025 — Wrapper-encapsulated semantic drift (silent h1 → h3 regression)

- **Severity:** WARN (during page migrations); FAIL under `--strict`
- **Category:** validation / migration discipline
- **Discovered:** 2026-05-19 during RenewalRadar `/sign-in` migration pressure-test
- **Status:** Fixed in v1.7.0

### What happened
Migrating `/sign-in` from raw `<h1>Sign in to your workspace</h1>` to `<CardTitle>Sign in to your workspace</CardTitle>` silently regressed heading hierarchy: CardTitle defaults to h3, so the page lost its h1. All 14 unit tests passed; 4 mutation tests passed; the bug only surfaced when a probe test asserted "page has exactly one h1."

This is a *different* class of bug from mutation testing's target: a **wrapper component encapsulates a semantic decision** (HTML tag, ARIA role, default attribute) that the call site cannot see. The substitution looks like a cosmetic refactor but ships a real behavior change.

### Root cause
Two-part:
1. CardTitle defaulted to h3 (correct for nested cards) but had no `as` override prop. Callers using CardTitle for page-primary headings could not declare their intent.
2. No automated check warned that the page migration regressed heading hierarchy. Mutation testing catches "this code path's logic broke" but not "this code path's contract silently changed."

### Fix in v1.7.0
1. **New protocol rule:** `test-discipline-and-mutation-protocol.md` Rule 6 — "Assumption probes for migrations and substitutions." Migrations must produce a probe suite asserting each pre-migration assumption (heading hierarchy, landmark structure, form input names, button types, ARIA roles, token resolution, production build).
2. **New anti-pattern:** `anti-slop-design-rubric.md` § "Wrapper-encapsulated semantic drift" — names the pattern and lists mitigation rules.
3. **New validator check:** `check_wrapper_semantic_drift` warns on `app/**/page.tsx` that uses `<CardTitle>` without `as=` AND has no raw h1, OR uses `<Button>` inside `<form action={...}>` without explicit `type=`.
4. **CardTitle API:** added `as` prop (h1 | h2 | h3 | h4), default 'h3'. Documented in spec. 4 new tests cover each level + paired-condition (h1 set → zero h3s).
5. **New regression fixture:** `vf-find-025-wrapper-semantic-drift` with paired-condition. Sabotage-verified.

### Cross-skill propagation (Specforge)
Specforge `document-quality-acceptance-tests.md` gains a "Migration semantic-preservation rule" entry.

### Verification
- Self-test 10/10 PASS.
- Sabotage of `check_wrapper_semantic_drift` → only `vf-find-025-wrapper-semantic-drift` fails.
- Regressing the RenewalRadar sign-in `as="h1"` fix → validator now warns: `app\sign-in\page.tsx: uses <CardTitle> without 'as' prop AND no raw <h1> in file`.

---

## v1.7.0 release notes (summary)

- **Added:** Test-discipline Rule 6 — Assumption probes for migrations.
- **Added:** Anti-pattern — Wrapper-encapsulated semantic drift.
- **Added:** `check_wrapper_semantic_drift` validator (heading regression + form-button type regression).
- **Added:** `VF-FIND-025` + regression fixture (10 fixtures total).
- **Cross-skill:** Specforge gets "Migration semantic-preservation rule."

---

## v1.6.0 release notes (summary)

- **Added:** Test-discipline + mutation protocol reference (`_visualforge-shared/references/test-discipline-and-mutation-protocol.md`).
- **Added:** Test-discipline anti-patterns, numeric-threshold contract, polymorphic-component contract, capability-pending aging in anti-slop rubric.
- **Added:** `check_implementation_mutation_log` validator check + VF-FIND-024.
- **Added:** Cross-skill bridge document (mirrored in Specforge).
- **Added:** Regression fixture `vf-find-024-mutation-log-required` (9 fixtures total).
- **Promoted to Specforge:** Behavioral verification tests section in `document-quality-acceptance-tests.md` (boundary values, paired conditions, spec-mutation review, persona-DEC lock, capability-pending aging, mutation-log handoff).

---

## v1.5.0 release notes (summary)

- **Added:** VF-FIND-022 (regression fixture harness, 8 fixtures, `--self-test` flag).
- **Added:** `--format json` output for CI integration.
- **Added:** `scripts/scaffold_component.py` with dupe-DEC guard.
- **Docs:** `examples/fixtures/README.md` + `FINDING-CATALOG.md`.
- **Hardened in v1.5.1:** positive-control fixtures rewritten to defeat vacuous-pass (VF-FIND-023).

---

## v1.4.0 release notes (summary)

- **Fixed:** VF-FIND-018 (full-validator escalation guidance), VF-FIND-019 (typo near-miss), VF-FIND-020 (theme normalization), VF-FIND-021 (heading-prefix persona match).
- **Schema:** `WHATS-MISSING.md` + `HOW-TO-READ.md` whitelisted at root.

---

## v1.3.0 release notes (summary)

- **Fixed:** VF-FIND-011 (sub-decision regex), VF-FIND-012 (token-paired px), VF-FIND-013 (per-paragraph cross-cut windowing), VF-FIND-014 (annotator double-injection), VF-FIND-015 (persona-DEC consistency).
- **Validator coverage delta:** ~150 false-positive warnings eliminated from a typical Phase 3+ corpus; 1 new BLOCK-class check (persona-DEC) catches a class of bugs the v1.2 validator passed through.

---

## VF-FIND-026 — Vacuous `.rejects.toThrow()` for redirect-based safety gates

- **Severity:** FIX-NEXT
- **Category:** validation (test-discipline)
- **Discovered:** 2026-05-19 during RenewalRadar Phase C pressure-test pass
- **Status:** Documented in `references/test-discipline-and-mutation-protocol.md`; validator-level enforcement is future work.

### What happened
Five test files across RenewalRadar used `await expect(Page()).rejects.toThrow()` to assert that an auth-protected page redirected unauthenticated users. Mutating the guard `if (!user) redirect("/sign-in")` to `if (false && !user) redirect("/sign-in")` allowed null `user` to flow through to a later line `requireRole(user.email)` that threw a TypeError on null access. Every probe still passed because ANY throw matched. Real auth-bypass mutation shipped green.

### The pattern
Proxy-assertion fallacy: the test asserted that something threw, as a proxy for "the redirect happened." Anything that throws — intentional redirect, accidental TypeError, runtime panic — satisfies the proxy assertion. The test could not discriminate intentional behavior from accidental crash.

### Root cause in the plugin
The test-discipline protocol (Rule 6, page-migration probe checklist) named "redirect" as a probe target but did not specify the URL-precise assertion. The plugin-output mutation log template accepted "redirect probe → passes" as evidence without requiring proof that the probe was non-vacuous against a guard removal.

### Why this matters
Auth-bypass and authorization-confusion bugs are the highest-impact class of defect a page can ship. The probe pattern that LOOKED like it protected against them was the most likely to ship vacuously, because:
1. `redirect` throws by design in Next.js → "does it throw?" tests look natural.
2. The same code path crashes with TypeError on the upstream null → the test passes for the wrong reason.
3. Mutation testing the guard caught the issue ONLY because the team ran a third mutation pass beyond the standard two.

### Fix in plugin/skills
- `test-discipline-and-mutation-protocol.md` (Rule 6 → page-migration probe checklist) — added a "Safety-gate redirects" row requiring the URL-specific pattern, plus a dedicated "Vacuous-throw probe — the most dangerous failure mode" section with a code recipe.
- `~/.claude/skills/testing-strategy-and-tdd/references/verifying-tests-mutation-probes-and-boundaries.md` — added "The proxy-assertion fallacy" section under the paired-condition rule.
- Project-level checklist (`auditability/page-migration-checklist.md`) updated with the same recipe so future RR-style migrations get it directly.

### Future validator enforcement (optional)
A static check could grep test files for `.rejects.toThrow()` without an argument inside `describe.*PROBE` blocks and flag them as candidates for strengthening. Not yet implemented.

---

## VF-FIND-027 — Structural probes without content probes miss data-display regressions

- **Severity:** FIX-NEXT
- **Category:** validation (test-discipline)
- **Discovered:** 2026-05-19 during RenewalRadar Phase C pressure-test pass
- **Status:** Documented in `references/test-discipline-and-mutation-protocol.md` page-migration probe checklist.

### What happened
The `/invite/[token]` probe suite asserted that the accept button was in the DOM (structural), that the form had a hidden `token` input with the right value (side-effect), and that no raw zinc classes remained (token-resolution). It did NOT assert that the workspace name + role text actually rendered in the page. A regression that hid the workspace metadata would have left the page rendering, the form functional, all structural probes green — but the user looking at "Join a workspace" with no context about which workspace.

### The pattern
Probe-layer omission: every page that renders domain data has three independent layers — structural (element + attrs), content (rendered text), side-effect (network/persistence/navigation calls). A probe suite that covers only one or two layers misses regressions in the missing layer.

### Root cause in the plugin
The page-migration probe checklist enumerated the structural assumptions (heading hierarchy, landmark, form input names) and a few content assumptions (token resolution, build mode) but did not require a content probe for the page's PRIMARY user-visible domain data. The phrase "renders the data" was implicit, not enforced.

### Why this matters
Data-display regressions are the most common kind of bug that ships green: a refactor changes a view-model field name, the page renders but shows blanks or fallback text, and tests checking structure pass.

### Fix
- Page-migration probe checklist now requires a "Content layer" row.
- testing-strategy-and-tdd skill now has an explicit "Probe layers: structural, content, side-effect" section under assumption probes with a code recipe for each layer.

---

## VF-FIND-028 — Spec-bound copy not flagged in spec docs

- **Severity:** WATCH
- **Category:** decision-protocol / spec-handoff
- **Discovered:** 2026-05-19 during RR `/billing/success` review
- **Status:** Documented in Specforge `document-quality-acceptance-tests.md`.

### What happened
RenewalRadar's `/billing/success` page contains a compliance-critical disclaimer "Paid access is not granted by this return page." This wording matters: editing it to "Your subscription is active. Welcome!" would mislead users into thinking their plan is paid before Stripe webhook verification — a real customer-facing harm. The text was probed only because the implementer happened to remember the legal context. No mechanism in the spec or test recipe flagged it as test-required.

### The pattern
Spec-bound copy without test handoff: legal, regulatory, compliance, and product-safety text drifts under copy-edit passes when the test author cannot tell which strings are contractually bound vs casually-worded.

### Root cause
The spec authoring rules (Specforge) did not have an explicit category for "this string is contractually bound; the implementation acceptance test must assert it via `textContent`."

### Fix
- Specforge `document-quality-acceptance-tests.md` — new section "Flag spec-bound copy as test-required" with examples (billing disclaimers, PIPEDA confirmation copy, liability disclaimers) and a `(spec-bound)` inline annotation pattern.
- Project-level page-migration-checklist gained a "Spec-driven copy needs a textContent probe" rule.

### Future tooling
A Specforge validator check could scan screen specs for keywords ("disclaimer", "PIPEDA", "GDPR", "CASL", "liability", "not granted", "warning") that suggest spec-bound copy and require either a `(spec-bound)` annotation or an explicit waiver in the spec.

---

## VF-FIND-029 — Shared-contract / content-map discipline missing

- **Severity:** FIX-NEXT
- **Category:** decision-protocol / docs
- **Discovered:** 2026-05-19 during RR Phase C lessons-learned pass — user explicitly asked "do we have a source of truth and authority where all pages consume from there, or every page has their own code and element hard coded?"
- **Status:** New protocol added in `references/shared-contracts-and-blast-radius.md`; scaffold template added; project-level validation script pattern documented and implemented in RR. Validator-level enforcement is future work (a `check_content_map_freshness` plugin check).

### What happened
The user surveyed RR after the Phase C migration and asked a system-architecture question: which surfaces have a single authoritative source, and which are hardcoded per-page such that future renames require grep-and-patch across N files. The audit revealed:

- Tokens, UI primitives, domain composites, view-models, server actions, and role/plan labels all had clear SoT.
- Spec-bound copy had a partial SoT (only `/billing/success` + `/account/delete` had screen specs; the `reminderServiceDisclaimer` constant was multi-consumer but had no spec home).
- Page chrome (`<main className="min-h-svh bg-[var(--vf-surface-subtle)]...">`) was duplicated identically across 12 routes — the second-consumer trigger had fired long ago but no extraction had happened.
- The "Add renewal" label appeared in 4 surfaces with no shared source.

The deeper issue: nothing in VisualForge's protocols required the project to MAINTAIN a current-state audit of which surfaces were authoritative and which were hardcoded. The existing `regeneration-and-cascade-lifecycle.md` covered the two backbone authorities (tokens.json + decision-log) but not the broader surface set (components, actions, view-models, screen specs, shared copy).

### The pattern
**Implicit-SoT drift.** A project with SoT discipline for tokens + components, but no per-surface registry for what consumes what, gradually accumulates hardcoded copies of strings, layouts, and labels. The drift is invisible — no test fails — until someone tries to rename something across the app and discovers the cost of the implicit-localized choices.

The companion failure mode: **cargo-cult abstraction.** When the registry doesn't exist, future agents see something duplicated and lift it to a shared component, only to discover it was deliberately localized for a reason. Without a "localized-by-design" record, the same decision gets re-litigated repeatedly.

### Root cause in the plugin
1. No protocol for shared-contracts/SoT across the broader public-surface set.
2. No artifact template requiring projects to maintain a current-state registry.
3. No update-rule binding shared-surface changes to documentation updates within the same slice.
4. No judgment guidance — engineers either over-extract (cargo cult) or under-extract (grep-and-patch).

### Why this matters
The decision of what to centralize and what to localize is one of the highest-impact design decisions a project makes. Getting it right enables cheap changes; getting it wrong produces either rigid premature abstractions or perpetual grep-and-patch maintenance. Without explicit guidance, projects make these decisions implicitly and inconsistently across surfaces.

### Fix
- **New reference `references/shared-contracts-and-blast-radius.md`** — names the principle, gives a 13-row category-by-category judgment table (Required / Conditional / Localized with rationale), defines the `content-map.md` artifact and its five required sections, locks the update rule (same-slice updates, no separate documentation passes).
- **New scaffold `examples/templates/content-map-template.md`** — five required sections (authoritative sources, consumer registry, localized-by-design, pending extractions, cascade changelog) so projects start from a consistent shape.
- **Wired into `implementation-safety-contract.md`** — new anti-slop rule: slice that adds a new public surface without a content-map entry fails.
- **Wired into `test-discipline-and-mutation-protocol.md`** — content-map update is part of the page-migration slice deliverable alongside the mutation log and probe suite. Internal-refactor slices are explicitly carved out.
- **Project-level validation pattern** — RR ships `scripts/check-content-map.mjs` as the reference implementation, wired into `pnpm verify`. Scans tracked directories (UI primitives, domain composites, view-models, server actions, screen specs), asserts each public surface has a content-map token, fails verify-gate on missing entries.

### Why this is shaped as a reference doc + per-project artifact, not a validator check

The validator is the wrong layer for content-map enforcement because:
1. Different projects organize their public-surface trees differently (some have `src/components/ui/`, some have `app/components/`, some use a different framework entirely).
2. The content map's value is the HUMAN-READABLE prose — consumer counts, blast-radius notes, pending-extraction triggers — none of which a static check can verify.
3. The mechanical "every tracked file has a token in the map" check is project-specific scaffolding (RR's `check-content-map.mjs`), not a cross-project plugin concern.

The plugin's role is to teach the discipline and provide the template. Per-project enforcement lives in the project's own verify gate.

### Anti-cargo-cult guardrails included
The protocol explicitly names cases NOT to centralize: page-specific empty-state copy, per-form field labels, per-page section headings, single-consumer cosmetic UI. The "localized-by-design" section of the content map records these decisions so future agents do not re-extract them. This is the asymmetric half of the rule — without it, the discipline becomes bureaucratic and ships unnecessary abstractions.

---

## VF-FIND-030 — Failure-isolation by layer missing as a named discipline

- **Severity:** FIX-NEXT
- **Category:** decision-protocol / implementation-contract
- **Discovered:** 2026-05-20 during RR BG-001/002 pressure-test pass — surfaced as three separate findings on the same day that all traced to the same gap.
- **Status:** New reference `references/failure-isolation-by-layer.md` added; anti-slop rule added to `implementation-safety-contract.md`; probe-checklist rows added to `test-discipline-and-mutation-protocol.md`.

### What happened
Pressure-test audit surfaced three bugs on the same day that initially looked unrelated:

- **Bug A:** `scheduleAccountDeletionAction` awaited `inngest.send(...)` after the persistence transaction. When Inngest had a transient outage, the throw cancelled the redirect and the user saw a 500 even though the deletion was persisted.
- **Bug B:** `<DeletionScheduledBanner>` was injected into the root `app/layout.tsx`. When `getCurrentUser()` failed (session decrypt error), the layout failed to render and EVERY page in the app returned 500.
- **Bug C:** `/account/reauth/confirm` was a GET endpoint that consumed the magic-link token on hit. Email-client prefetchers (Gmail link safety scans, Outlook ATP) would burn the token before the user clicked.

### The pattern
**Non-critical-path or deferred work treated as critical-path.** Each bug had the same shape: an operation that supports the user-visible outcome was wired so its failure became the user-visible outcome. The discipline wasn't named anywhere in the plugin's protocols, so each surface had to "rediscover" it.

Bug C is a variant where the "non-critical work" was the GET handler's prefetch-time invocation. The token consume should have been on POST (intentional user action) not GET (any HTTP visit). The principle generalizes: HTTP method should match work class.

### Root cause in the plugin
1. The implementation-safety-contract emphasized exact identifiers (import paths, dependency rules, prop signatures) but said nothing about isolation between critical and degraded paths.
2. The test-discipline page-migration probe checklist had no entry for "rendering this page must not trigger the side effect" — a probe that would have caught Bug C.
3. No reference document named the classification protocol, so every author was rediscovering it case by case.

### Why this matters
Persistence-already-succeeded-but-user-saw-an-error is one of the worst customer experiences a SaaS can produce. The user retries, hits a different error path ("already exists" or similar), and concludes the system is broken — when the data was actually correct from the first attempt. For PIPEDA / GDPR right-to-delete flows specifically, this turns a successful deletion into a support ticket.

Layout-decoration failures bringing down every page is the cousin failure mode: a non-critical decoration becomes a single point of failure for the entire app.

### Fix
- **New reference `references/failure-isolation-by-layer.md`** — names the critical/degraded classification protocol, gives the table-driven "list every step + its class" recipe, and includes the HTTP-method side-effect-safety extension.
- **`implementation-safety-contract.md`** anti-slop rule added: multi-step actions awaiting non-critical side effects inline fail.
- **`test-discipline-and-mutation-protocol.md`** page-migration probe checklist gains two rows: "HTTP-method side-effect safety" and "Critical-vs-degraded path classification."

### Why these three sit under one rule, not three

The plugin already has a pattern of "every bug becomes its own rule" which is rule creep. The principled cleanup is the opposite: when three distinct symptoms trace to one missing classification protocol, the durable fix is to NAME the protocol and let every surface check against it. Future bugs in this family ("the audit-log write blocked the response," "the analytics ping cancelled the redirect," "the OAuth callback's side effect ran on the prefetched GET") will get the same recipe rather than three more rules.

---

## VF-FIND-031 — `toHaveBeenCalledWith` snapshots the implementation, pinning bugs

- **Severity:** FIX-NEXT
- **Category:** validation / test-discipline
- **Discovered:** 2026-05-20 during RR BG-001 pressure-test — found a real correctness bug whose probe was vacuous because the assertion pinned the buggy implementation as the expected contract.
- **Status:** New section added in `~/.claude/skills/testing-strategy-and-tdd/references/verifying-tests-mutation-probes-and-boundaries.md` under "The proxy-assertion fallacy."

### What happened
The BG-001 purge cron's `workspace.deleteMany` call had an over-broad filter (`{ where: { deletedAt: { not: null } } }`) that would hard-delete any soft-deleted workspace, including those of users whose grace window hadn't expired yet. Concretely: User A's purge run would delete User B's soft-deleted workspace if B scheduled deletion earlier but is still inside the grace window.

The unit test for that cron asserted `expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { deletedAt: { not: null } } })`. That assertion exactly snapshotted the buggy filter — so the test "passed" any time the code matched its own bug.

### The pattern
**Implementation-pinned call-arg assertions.** `toHaveBeenCalledWith` is meant to enforce the CONTRACT a call must satisfy. But when the expected args are written by copying from the implementation (rather than from a prose statement of the contract), the assertion silently snapshots the implementation. The test passes the implementation matching itself.

This is a subtler member of the proxy-assertion family: instead of asserting a proxy that fires for unrelated reasons, the assertion fires only when the code matches its own current state — which is true by construction unless someone refactors the call.

### Root cause in the skill
The proxy-assertion-fallacy section in testing-strategy-and-tdd warned about `redirect` and other throw-based proxies but did NOT name the implementation-pinning failure mode for `toHaveBeenCalledWith`. The principle is the same family (assertion measures the wrong thing) but the symptom is different enough that a separate sub-section was needed.

### Fix
- **`verifying-tests-mutation-probes-and-boundaries.md`** gains a sub-section under the proxy-assertion-fallacy: "The implementation-pinned `toHaveBeenCalledWith` failure mode." Contract clues to spot it (expected-args copy-pasted from impl, assertion written after manual verification passed) + mitigation (write the contract in prose first, then translate; mutation-test the inverse).

---

## Release: v1.8.0 (2026-05-20)

Findings VF-FIND-032 through VF-FIND-040 address the gap between **prose-level slop discipline** (the existing rubric catches taste-words and missing values) and **visual-layer / engineering-layer LLM-default biases** (the rubric did not catch). Audit was driven by comparison against six external lens skills: `imagegen-frontend-web`, `imagegen-frontend-mobile`, `gpt-tasteskill`, `frontend-ui-engineering`, `design:user-research`, `full-slice-planner`. Discipline borrowed from `testing-strategy-and-tdd` (paired-condition fixtures, mutation testing for new validator checks) and `golden-mutation-trust-harness` (every new rule names the mutation that would catch a violation).

| ID | Fix landed in |
|---|---|
| VF-FIND-032 | New `_visualforge-shared/references/visual-default-breakers.md`; cross-cited from brand-identity, layout-system, surface-treatments, imagery-illustration |
| VF-FIND-033 | New Section 0 in `visualforge-imagery-illustration/SKILL.md` (image art-direction, background-mode inventory, image-led posture, narrative-spine binding) |
| VF-FIND-034 | New Section 0 in `visualforge-mobile-and-responsive/SKILL.md` (platform-mode lock, phone-shaped-website anti-pattern, first-screen cleanliness rule, mockup-presence default) |
| VF-FIND-035 | New Step 0g in `visualforge/SKILL.md` (visual-direction lock); new template at `examples/templates/visual-direction-lock-template.md` |
| VF-FIND-036 | New §17 in `visualforge-frontend-contract/SKILL.md` (product-first UI workflow, React boundaries discipline, hard rules, component → React contract) |
| VF-FIND-037 | New §"Research-method ladder" in `visualforge-user-research/SKILL.md` (method × sample × time table, interview-guide structure, synthesis framework) |
| VF-FIND-038 | Pass L in `visualforge-design-pressure-test/SKILL.md` gains two new reviewers (Visual-direction critic, React-product-fit critic); orchestrator finding-ownership matrix gains 15 new rows |
| VF-FIND-039 | `visualforge-motion-design/SKILL.md` declares source-of-truth role for timing tokens; `micro-interactions` and `scroll-and-gesture` cite instead of re-declaring |
| VF-FIND-040 | New `_visualforge-shared/references/state-page-patterns.md`; cross-cited from auth-flows, system-pages, notifications-and-lifecycle |
| VF-FIND-041 | Self-pressure-test of v1.8.0 surfaced 6 missed gaps; DEC-ID re-allocation, validator REQUIRED_AUDITABILITY addition, missing brief-to-direction-mapping section, component-system spec template gap, iconography + content-design cross-cites all fixed in same release |
| VF-FIND-042 | Pre-existing DEC drift across 22 of 30 SKILL.md files renumbered to allocated ranges (328 substitutions); new `check_dec_range_allocation` validator check added and wired in |
| VF-FIND-043 | Visual-direction-lock cascade-lifecycle specified — per-commitment fan-out table, supersession protocol, Auto-mode BLOCK-on-change rule; wired into orchestrator and cascade-lifecycle doc |
| VF-FIND-044 | Self-pressure-test orchestrator step added (9 passes); new `check_plugin_source_contracts` validator walks plugin source for required cross-cites + subsections (closes the 2/6 VF-FIND-041 coverage gap) |
| VF-FIND-045 | Validator monolith (2,153 lines) split into `scripts/validators/` package (12 modules, largest 471 lines); entry point shrunk to 144 lines (-93%); behavior preserved (self-test 19/19, sabotage 9/9, mutation matrix 5/5); splitter tool preserved for regeneration |
| VF-FIND-046 | scan_slop coverage gap (surfaced by VF-FIND-045 mutation 3) closed — added vf-find-046 full-mode fixture; sabotage-verified scan_slop now uniquely owns it; total fixtures 20/20 |
| VF-FIND-047 | Color theory + decision matrix shared reference created (`color-theory-and-decision-matrix.md`); 6 harmony schemes, 13-row brand-attribute matrix, color meaning table with cultural caveats, OKLCH-based palette derivation method, color-blindness verification, WCAG+APCA tooling, anti-patterns. Cross-cited from brand-identity, design-tokens, surface-treatments, data-visualization, i18n-rtl. New `check_color_decision_basis` validator + fixture; sabotage-verified. Pressure-tested the original 6-row matrix and refined it to 13 rows with primary + alternative + example + risk per row. |

**Validator-script changes for findings VF-FIND-032 through VF-FIND-040 are now implemented** (also v1.8.0, post VF-FIND-041 follow-up): 9 new checks added to `scripts/validate_design_docs.py`, wired into both `_run_mid_run_checks` and `_run_full_checks`, with 9 paired-condition fixtures under `examples/fixtures/`. The full self-test reports 19/19 passing. Each new check is sabotage-verified — temporarily no-op'ing it causes ONLY its matching fixture to fail, proving the check is the active oracle and not vacuously satisfied by another check. See `examples/fixtures/README.md` § "Sabotage verification (v1.8.0)" for the sabotage matrix.

Version bumped: `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` → `1.8.0`.

---

## VF-FIND-032 — Anti-slop rubric catches prose-defaults but not visual-defaults

- **Severity:** FIX-NEXT (would not block a run, but every visual run drifts toward the LLM default)
- **Category:** rubric / visual layer
- **Discovered:** 2026-05-20 during external-lens audit (imagegen-frontend-web, gpt-tasteskill, imagegen-frontend-mobile)
- **Status:** Fixed in v1.8.0

### What happened

The plugin's anti-slop rubric scans for *prose tells* — taste-words ("modern", "subtle"), missing token bindings, raw hex / px / ms. A subskill output that produces a **technically compliant** design (every state defined, every token bound, no taste-words) still passes review while describing a textbook LLM-default visual: centered hero with purple-blue glow, text-left / image-right body, three identical KPI columns, 6-line wrapped H1, glassmorphism everywhere. The validator and the rubric see no problem because the prose is fine.

Comparable lens skills (`imagegen-frontend-web`, `gpt-tasteskill`, `imagegen-frontend-mobile`) explicitly enumerate these defaults and ban them. VisualForge did not.

### The pattern

**Prose-level slop check vs visual-layer default check.** A rubric that only checks the words can be satisfied by an output that is generic in *picture-space* even when the words are precise.

### Root cause in the plugin

1. `anti-slop-design-rubric.md` covers "no `modern` without behavior" but not "no `anchor.left-text-right-image` as default hero without justification."
2. No reference enumerates the LLM-default visual patterns to block (hero composition bias, gradient slop, anchor monotony, banned KPI patterns, meta-label slop, second-read moment, narrative spine).
3. The visual subskills (`brand-identity`, `layout-system`, `surface-treatments`, `imagery-illustration`) list *options* without forcing the agent to commit and vary across sections.

### Fix in v1.8.0

1. **New reference `_visualforge-shared/references/visual-default-breakers.md`** — 15 named visual-default categories with rule + mutation example for each. Distilled from `imagegen-frontend-web`, `gpt-tasteskill`, `imagegen-frontend-mobile`.
2. **`brand-identity/SKILL.md`** gains explicit Hero Scale (DEC-008), default Hero Composition Anchor (DEC-009), and Narrative / Concept Spine (DEC-010) decisions — required.
3. **`layout-system/SKILL.md`** gains a Composition-anchor inventory (§11), Cross-section variety rule (§12), Gapless bento rule (§13), and H1 width contract (§14) — required.
4. **`surface-treatments/SKILL.md`** gains an explicit gradient-ban list (purple-to-blue AI, pink-to-orange creator, rainbow mesh, gradient text shortcut).
5. **`imagery-illustration/SKILL.md`** gains Section 0 with background-mode inventory, hero composition anchors, image-led posture, image-behind-text discipline, narrative-spine binding. See VF-FIND-033.

### Mutation a fixture must catch (golden-mutation-trust-harness discipline)

A fixture for `check_visual_default_breakers` (proposed) must include at least one corpus where:
- `brand-identity.md` omits the Hero Scale decision card → the check fires.
- `surface-treatments.md` includes a gradient recipe with stops in a purple → blue palette without an explicit override decision → the check fires.
- `layout-system.md` lists screen sections all using `anchor.left-text-right-image` without anchor-variety table → the check fires.

Paired-condition compliance corpus: the same shape with Hero Scale set, allowed-gradient palette, and 3+ distinct anchors → the check does NOT fire.

### Proposed validator updates (next slice)

- New `check_visual_default_breakers` in `scripts/validate_design_docs.py` that:
  - Asserts `brand-identity.md` contains a Hero Scale decision card matching one of the three scales.
  - Asserts `layout-system.md` contains an anchor inventory and an anchor-distribution table for marketing pages.
  - Greps `surface-treatments.md` for banned gradient phrases (e.g., `purple` followed by `blue` within 80 chars in a gradient stop block) and warns if found without an override DEC.
  - Asserts `imagery-illustration.md` contains the background-mode inventory header.
- Fixtures: `vf-find-032-visual-default-breakers-positive` and `-negative` following the sabotage-test pattern.

### Verification

Sabotaging `check_visual_default_breakers` to no-op must fail only the positive fixture. Manual: a synthetic run produces a Hero Scale decision card and a default composition anchor; sample marketing-page screen specs show ≥ 3 anchors used.

---

## VF-FIND-033 — Imagery subskill is technically-thorough but art-direction-blind

- **Severity:** FIX-NEXT
- **Category:** subskill content / visual taste
- **Discovered:** 2026-05-20 during external-lens audit (imagegen-frontend-web)
- **Status:** Fixed in v1.8.0

### What happened

`visualforge-imagery-illustration` covers aspect ratios, AVIF/WebP, image markup, alt text, AI imagery rules, OG cards, distribution assets, print rules, A/B-variant design — everything **technical**. It is silent on *what the image should look like in the page*. The lens skill `imagegen-frontend-web` encodes 12 background modes (full-bleed, duotone, color-blocked diptych, atmospheric photo, image-as-canvas, etc.) and a hero composition-anchor inventory. VisualForge had neither.

A subskill output following VisualForge could specify all the right aspect ratios and source policies and still produce a design where the hero is a small inline image left, text right, with no atmospheric framing anywhere — the AI default.

### Fix in v1.8.0

`imagery-illustration/SKILL.md` gains Section 0:
- 0a Background mode inventory (12 modes from the lens skill).
- 0b Hero composition anchors (cites layout-system).
- 0c Image-led storytelling rule (image-led / image-balanced / typography-first posture per product category).
- 0d Image-behind-text discipline (fades, scrims, masks; banned raw overlays).
- 0e Narrative spine binding to imagery (cites brand-identity DEC-010).
- 0f Second-read moment ownership.
- 0g Decision cards DEC-895 / 896 / 897 / 898 (required where applicable).

### Mutation a fixture must catch

A fixture where `imagery-illustration.md` exists but contains no §0 (background mode inventory) → proposed validator check `check_image_art_direction` fires.

Paired compliance fixture: §0 present with all 12 modes named, plus an image-led posture decision card → does NOT fire.

---

## VF-FIND-034 — Mobile subskill is responsive-spec heavy, taste-light

- **Severity:** FIX-NEXT
- **Category:** subskill content / mobile platform
- **Discovered:** 2026-05-20 during external-lens audit (imagegen-frontend-mobile)
- **Status:** Fixed in v1.8.0

### What happened

`visualforge-mobile-and-responsive` covers safe areas, foldables, thumb zones, browser zoom (WCAG 1.4.10), Windows scaling, multi-window — every responsive technicality. It does **not** enforce:

- A first-thing platform-mode lock (iOS-native premium / Android-native premium / cross-platform premium neutral).
- The "not a phone-shaped website" anti-pattern.
- A first-screen cleanliness rule (calm, immediately readable, single focal point).
- A default mockup-presentation rule (when designs are shown in docs, default to a clean subtle phone frame).

The lens skill `imagegen-frontend-mobile` treats all four as mandatory Sections 0–2. Without them, mobile screen specs drift into hybrid layouts that read like a website squeezed into a phone frame.

### Fix in v1.8.0

`mobile-and-responsive/SKILL.md` gains a new Section 0 covering the four items above, plus DEC-1060 / 1063 / 1066.

### Mutation a fixture must catch

A fixture where `mobile-and-responsive.md` exists but has no Section 0 platform-mode lock → proposed `check_platform_mode_lock` fires.

---

## VF-FIND-035 — No run-level lock for visual-direction commitments

- **Severity:** FIX-NEXT
- **Category:** orchestration / cross-subskill drift
- **Discovered:** 2026-05-20 during external-lens audit (gpt-tasteskill's Python-driven randomization commitment)
- **Status:** Fixed in v1.8.0

### What happened

Even with Hero Scale, default anchor, and narrative spine decisions in `brand-identity`, downstream subskills can produce screen specs that drift. There was no single artifact each subskill cites that *binds* the visual direction across the whole run.

The lens skill `gpt-tasteskill` simulates a Python `random.choice()` to deterministically commit to one option per axis. The lens skill `imagegen-frontend-web` enforces "commit a strong combination and execute it clearly." VisualForge had no equivalent.

### Fix in v1.8.0

1. **New orchestrator Step 0g** — `visualforge/SKILL.md` adds "Visual-direction lock" after mode detection. Writes `docs/design-system/auditability/visual-direction-lock.md`.
2. **New template** at `examples/templates/visual-direction-lock-template.md`.
3. The lock commits: theme paradigm, typography character, Hero Scale, default Hero Composition Anchor, narrative spine, background-mode mix, signature components × 4, motion-implied language × 2, second-read moment × 1, banned-by-default visual patterns.
4. Every downstream visual subskill **cites** this lock; departures require supersession via the responsible upstream subskill.

### Mutation a fixture must catch

A fixture where `docs/design-system/` has run-state.json but no `auditability/visual-direction-lock.md` → proposed `check_visual_direction_lock_present` fires (after Step 0g should have run).

---

## VF-FIND-036 — Frontend contract is infrastructure-only, no React-quality lens

- **Severity:** FIX-NEXT
- **Category:** subskill content / implementation handoff
- **Discovered:** 2026-05-20 during external-lens audit (frontend-ui-engineering)
- **Status:** Fixed in v1.8.0

### What happened

`visualforge-frontend-contract` covers framework lock, CSS architecture, token pipeline, theming algorithm, font loading, image CDN, performance budgets, Storybook + testing strategy, build pipeline, browser support — **all infrastructure**. It has nothing on:

- Product-first UI workflow (identify user job → map states → responsive as different experiences).
- React boundaries discipline (server/client components, minimal client state, stable effects, no `useEffect` for derived state).
- Hard rules ("do not hide core functionality on mobile", "do not rely on hover for essential actions").
- Component-spec → React-implementation contract (each component declares its data dependencies and error boundary).

A produced design can hand off perfectly and the implementation still becomes a useEffect tangle.

### Fix in v1.8.0

`frontend-contract/SKILL.md` gains new §17 "React / framework quality discipline" with 17a (product-first workflow), 17b (React boundaries), 17c (hard rules), 17d (component-spec → React contract), 17e (DEC-816 through DEC-819 — required).

### Mutation a fixture must catch

A fixture where `frontend-contract.md` exists but has no §17 → proposed `check_react_quality_discipline` fires.

A fixture where a component spec at `05-components/primitives/Button.md` has no server/client boundary declaration after frontend-contract DEC-816 is set → proposed `check_component_boundary_declared` fires.

---

## VF-FIND-037 — User-research subskill missing method ladder

- **Severity:** WATCH (gap, not a corruption)
- **Category:** subskill content / research methodology
- **Discovered:** 2026-05-20 during external-lens audit (design:user-research)
- **Status:** Fixed in v1.8.0

### What happened

VisualForge's user-research subskill is *deeper* than the lens skill on persona structure (anti-persona, edge-case, pair scenarios, validation plan, day-in-the-life, quantitative grounding). It is *shallower* on research-method selection: when to interview vs survey vs card-sort vs diary, sample sizes, time budgets, interview-guide structure, synthesis frameworks (affinity / impact-effort / JTBD).

For retrofit-mode validation and post-launch persona confirmation, the method ladder matters.

### Fix in v1.8.0

New "Research-method ladder" section in `user-research/SKILL.md` with:
- 8-row method × sample × time × when-to-use table.
- Interview-guide structure (5 stages × time budget).
- Synthesis framework list (affinity / impact-effort / journey / JTBD).
- Mode-specific guidance (greenfield / retrofit / specforge-enhanced).
- DEC-090 validation method per persona — required when persona is labeled `Assumption`.

### Mutation a fixture must catch

A fixture where a persona file has `**Source basis:** Assumption` but no `## Validation plan` entry naming a method → existing `check_persona_files` should fire (already covered for primary personas). New check `check_assumption_persona_has_method` would extend this to verify the method named is in the ladder.

---

## VF-FIND-038 — Pressure-test multi-expert under-covers visual taste and React-fit

- **Severity:** FIX-NEXT
- **Category:** pressure-test / review coverage
- **Discovered:** 2026-05-20 during external-lens audit
- **Status:** Fixed in v1.8.0

### What happened

`visualforge-design-pressure-test` Pass L (multi-expert review) simulates 6 reviewers: PD / FE / a11y / brand / target user / red team. None of them apply:
- The visual-default-breakers (a "visual-direction critic" is missing).
- The React-quality discipline from `frontend-ui-engineering` (a "React-product-fit critic" is missing).

So a design that's a textbook LLM-default visual or a React useEffect tangle waiting to happen can pass Pass L without comment.

### Fix in v1.8.0

1. Pass L gains two new reviewers: **Visual-direction critic** (applies `visual-default-breakers.md` end-to-end) and **React-product-fit critic** (applies frontend-contract §17 end-to-end).
2. Pass A header cites `visual-default-breakers.md` pre-output checklist for marketing / hero / brand surfaces.
3. Report format adds two new "top 3" rows for the new reviewers.
4. Orchestrator's finding-ownership matrix gains 15 new rows for visual-default and React-fit finding signatures.

### Mutation a fixture must catch

A fixture where `design-pressure-test-report.md` exists but contains no "Visual-direction critic" or "React-product-fit critic" rows → proposed `check_pressure_test_reviewer_coverage` fires.

---

## VF-FIND-039 — Timing tokens declared in three subskills with drift risk

- **Severity:** WATCH (no observed bug yet, but the pattern is a future drift trap)
- **Category:** subskill cross-reference / token discipline
- **Discovered:** 2026-05-20 during external-lens audit
- **Status:** Fixed in v1.8.0

### What happened

`motion-design`, `micro-interactions`, and `scroll-and-gesture` all enumerate duration tokens and easing tokens with slightly different values:
- motion-design: `duration.fast` 120ms.
- micro-interactions: "Duration: `duration.fast` (120ms)" — same value.
- scroll-and-gesture: hover durations specified in prose with token cites that are not always cross-checked.

No drift yet observed, but the existing validator (`check_decision_log` and `check_decision_id_singleton`) wouldn't catch numeric drift between these three files. A change in motion-design could pass while micro-interactions kept the old value.

### Fix in v1.8.0

`motion-design/SKILL.md` declares **source-of-truth role** for timing tokens. `micro-interactions/SKILL.md` and `scroll-and-gesture/SKILL.md` now cite — never re-declare — duration / easing values.

### Mutation a fixture must catch

A fixture where `motion-design.md` declares `duration.fast: 120ms` and `micro-interactions.md` declares `duration.fast: 150ms` (drift) → proposed `check_timing_token_drift` fires.

Paired compliance: both files cite `duration.fast` without re-declaring the number → does NOT fire.

---

## VF-FIND-040 — State-page subskills duplicate shared patterns

- **Severity:** FIX-NEXT
- **Category:** cross-subskill DRY / shared reference
- **Discovered:** 2026-05-20 during external-lens audit
- **Status:** Fixed in v1.8.0

### What happened

`visualforge-auth-flows`, `visualforge-system-pages`, and `visualforge-notifications-and-lifecycle` independently describe:

- In-context re-auth.
- Token-gated link expiry.
- Session-state edge cases.
- Recovery copy / CTA discipline.
- Honest unavailable / unknown / disabled states.
- Critical vs degraded path classification.

Three subskill files restate the same patterns with slight wording drift. The existing validator does not enforce cross-cite agreement.

### Fix in v1.8.0

1. **New reference `state-page-patterns.md`** consolidates the seven shared patterns.
2. Each state-page subskill now cites the shared reference and adds only what's unique to its domain.
3. Pattern 3 (session-state edge cases) cross-references the IA-owned map (VF-FIND-009).
4. Pattern 7 (critical vs degraded paths) cross-references `failure-isolation-by-layer.md` (VF-FIND-030).

### Mutation a fixture must catch

A fixture where `auth-flows.md` describes magic-link expiry as `15 minutes` and `notifications-and-lifecycle.md` describes the same magic-link expiry as `1 hour` → proposed `check_state_page_cross_cites` fires (cross-file numeric agreement).

---

## VF-FIND-041 — v1.8.0 self-pressure-test surfaced 6 missed gaps

- **Severity:** FIX-NEXT (no production data corrupted, but the v1.8.0 changes had real gaps)
- **Category:** self-audit / implementation discipline
- **Discovered:** 2026-05-20, by user-requested pressure-test of the v1.8.0 implementation
- **Status:** Fixed in v1.8.0 (same release, post-pressure-test)

### What happened

After implementing VF-FIND-032 through VF-FIND-040, a self-pressure-test of the v1.8.0 changes surfaced six real gaps that the original implementation missed. This is the exact discipline `full-slice-planner` and `golden-mutation-trust-harness` describe: distrust the green run.

### Gaps surfaced

1. **DEC-ID allocation violations.** New DEC numbers added to brand-identity (DEC-008/009/010), layout-system (DEC-361/362/363), imagery-illustration (DEC-895–898), mobile (DEC-1060/1063/1066), frontend-contract (DEC-816–819), user-research (DEC-090) were ALL outside their subskill's allocated range per `decision-id-allocation.md`. Two were real collisions: imagery-illustration's DEC-895 fell inside motion-design's range (DEC-870–899), and user-research's DEC-090 fell inside brand-identity's range (DEC-090–104). This is exactly the failure pattern VF-FIND-001 and VF-FIND-005 hardened against.
   - **Pre-existing context:** several of the pre-existing SKILL.md files already had stale DEC numbers outside their allocated range (e.g., layout-system used DEC-320–360 in examples; frontend-contract used DEC-800–849; imagery-illustration used DEC-900–940). My additions perpetuated the drift but did not create it. The pre-existing drift is a separate finding — see "Deferred follow-up" below.
2. **`visual-direction-lock.md` not in validator's `REQUIRED_AUDITABILITY` list.** Step 0g could have been silently skipped and the validator would not have flagged it.
3. **Orchestrator's quality-gate-before-completion did not check the lock.** Same gap from the orchestrator side.
4. **Step 0g cited "brief-to-direction mapping in `visual-default-breakers.md`" — but that named section did not exist** in the file at the time of the cite. Broken reference.
5. **Frontend-contract §17d required components to declare server/client boundary, data dependencies, error boundary placement — but the component-system spec template did not include those fields.** The new rule was unenforceable in practice.
6. **Iconography did not cross-cite `visual-default-breakers.md`; content-design did not cross-cite `state-page-patterns.md`.** Icon style is part of visual taste; recovery-copy discipline is content-design's territory. Both cross-cites were missing.

### The pattern

**Implementation without verification.** I implemented 12 slices, marked tasks complete, summarized the changes — and then would have shipped without distrusting the green run. The user's pressure-test was the only thing that surfaced the gaps. The discipline that should have caught this:

- `full-slice-planner` § "Required Self-Audit Before Final Plan": "What would be the easiest wrong implementation someone could build from this plan? Which exact sentence or missing matrix would allow that wrong implementation?"
- `golden-mutation-trust-harness` § "Pressure-Test Passes": "After a green run, distrust it... Mutation adequacy: did a mutation actually touch the persisted source that production uses?"
- `testing-strategy-and-tdd` § "Verifying The Tests": "A green suite proves the code reached the assertions. It does not prove the assertions would catch a bug."

I summarized completed work as proof of correctness without applying any of these. The user's pressure-test is what made me apply them.

### Root cause in the plugin

There is no orchestrator-enforced **self-pressure-test step** at the end of a VisualForge run that distrusts the just-finished work. The closest mechanism (`design-pressure-test` Pass L) reviews the *design* the run produced; it does not review the *meta-correctness of the run itself* (DEC allocation, cross-reference integrity, validator-list coverage, template completeness).

### Fix in v1.8.0 (this release)

1. **DEC-ID re-allocation:**
   - brand-identity: DEC-008/009/010 → **DEC-098/099/100** (within allocated DEC-090–104).
   - layout-system: DEC-361/362/363 → **DEC-272/273/274** (within allocated DEC-255–274).
   - imagery-illustration: DEC-895/896/897/898 → **DEC-690/691/692/693** (within allocated DEC-670–694; fixes motion-design collision).
   - mobile-and-responsive: DEC-1060/1063/1066 → **DEC-302/303/304** (within allocated DEC-280–304).
   - frontend-contract: DEC-816/817/818/819 → **DEC-925/926/927/928** (within allocated DEC-905–929).
   - user-research: DEC-090 → **DEC-044** (within allocated DEC-025–044; fixes brand-identity collision).
2. **Validator + orchestrator quality gate:**
   - `scripts/validate_design_docs.py` `REQUIRED_AUDITABILITY` now includes `auditability/visual-direction-lock.md`.
   - Orchestrator's quality-gate-before-completion now checks lock presence and validates every commitment has a value (no `[...]` placeholders).
3. **Brief-to-direction mapping section added** to `visual-default-breakers.md` (9 brief-class scenarios with bias overrides).
4. **Component-system spec template** gains a "React-implementation contract" subsection (boundary / state ownership / data dependencies / suspense / error boundary).
5. **Iconography** SKILL.md cross-cites `visual-default-breakers.md` in its global quality rules.
6. **Content-design** SKILL.md cross-cites `state-page-patterns.md` and `visual-default-breakers.md` in its global quality rules and explicitly owns the meta-label slop ban + recovery copy discipline.

### Deferred follow-up (named, not hidden)

The following were noted at first as deferred but **were subsequently fixed in v1.8.0** (per user request to fix all gaps):

~~a.~~ ✅ **Validator-script enforcement for VF-FIND-032 through VF-FIND-040 — IMPLEMENTED.** 9 new checks added to `scripts/validate_design_docs.py`, wired into both `_run_mid_run_checks` and `_run_full_checks`. 9 paired-condition fixtures created. Self-test reports 19/19 passing. Each new check sabotage-verified — see `examples/fixtures/README.md` § "Sabotage verification".

~~e.~~ ✅ **Fixtures for the 9 new checks — CREATED.** Each fixture under `examples/fixtures/vf-find-NNN-*/` with an `expected.json` that asserts warning text and `verdict_must_be: "PASS"`. The fixture content is deliberately minimal so the check fires only on the targeted condition.

**Still deferred:**

b. **Pre-existing DEC drift in SKILL.md examples.** Several SKILL.md files use DEC numbers in their example sections that fall outside their allocated range (e.g., `imagery-illustration.md` examples cite DEC-900–940; `frontend-contract.md` examples cite DEC-800–849; `motion-design.md` examples cite DEC-500–549). These were stale before v1.8.0 and should be aligned with `decision-id-allocation.md` in a dedicated cleanup slice. My additions in this release use the correctly-allocated ranges, but the surrounding examples in those same files remain inconsistent.

c. **Cascade-lifecycle for visual-direction-lock changes.** `regeneration-and-cascade-lifecycle.md` does not yet specify what cascades when a commitment in the lock changes mid-run (e.g., Hero Scale changes from Mid Editorial to Giant Statement). The current implicit answer is "everything visual rebuilds"; the next slice should make this explicit.

d. **Self-pressure-test orchestrator step.** No formal step that distrusts the just-finished run. Could be added as a Phase 6 mini-pass that runs the validator + checks DEC allocation + checks every new artifact has a value.

### Bonus: 1 real validator bug surfaced by fixture authoring

While writing the VF-FIND-037 fixture, I discovered the `check_assumption_persona_validation` regex did not handle markdown bold (`**Source basis:** Assumption` vs `Source basis: Assumption`). The regex was updated to tolerate the markdown-bold variant. This is the kind of bug that only surfaces when you actually try to write a violating fixture — proof that fixture-authoring is itself a check on the check.

### Why these gaps were missed in the first pass

Honest accounting: I assumed the SKILL.md files I was editing represented the allocation reality rather than verifying against `decision-id-allocation.md`. I marked tasks complete based on "the file got the new section" rather than "the new section passes the existing quality gates." This is the same class of bug the testing-strategy-and-tdd skill names: assertions written from the implementation instead of from the contract.

### Verification

- DEC ID re-allocation: grep for the old DEC numbers in this release's diff returns no occurrences. The new DECs fall within their subskill's allocated range per `decision-id-allocation.md`.
- `REQUIRED_AUDITABILITY` includes `auditability/visual-direction-lock.md`: confirmed in `scripts/validate_design_docs.py:107`.
- Brief-to-direction mapping section present in `visual-default-breakers.md`: confirmed.
- Component-system spec template includes the React-implementation contract subsection: confirmed.
- Iconography and content-design global-rules cite the new shared references: confirmed.

---

## VF-FIND-042 — Pre-existing DEC drift in SKILL.md example sections

- **Severity:** FIX-NEXT (no decision-log corruption observed; example prose inconsistent with the allocation contract)
- **Category:** validation / DEC allocation discipline
- **Discovered:** 2026-05-20 during v1.8.0 follow-up cleanup pass (VF-FIND-041 § "Still deferred — item b")
- **Status:** Fixed in v1.8.0 (same release, post VF-FIND-041 follow-up)

### What happened

22 of 30 subskill `SKILL.md` files contained DEC-NNN numbers in their "Decision cards" example sections that fell outside their allocated range per `decision-id-allocation.md`. For example, `motion-design.md` listed `DEC-500 Motion philosophy` through `DEC-549 Motion library choice` — but motion-design's allocated range is DEC-870–899. `frontend-contract.md` listed DEC-800–849; its range is DEC-905–929. `imagery-illustration.md` listed DEC-900–940; its range is DEC-670–694.

This was an inherited drift from pre-allocation-table days; the per-file example DECs were written before `decision-id-allocation.md` was authoritative and never reconciled. The drift never corrupted a real decision-log (because the validator caught duplicate live decision-log entries via VF-FIND-001), but it would inevitably re-create the bug whenever an agent followed the example prose to issue new decision cards. My own v1.8.0 additions (VF-FIND-032–040) initially perpetuated the drift before being caught by VF-FIND-041.

### The pattern

**Documentation drift outpacing the authority.** A canonical reference (here: `decision-id-allocation.md`) is updated, but the prose examples in dozens of files that pre-date it are not retro-aligned. Future agents read the local prose and follow it, recreating the bug the authority was designed to prevent.

### Root cause in the plugin

1. Allocation table was published but no automated check enforced range membership in the SKILL.md files themselves (only in live decision-log entries via VF-FIND-001's `check_decision_log` and VF-FIND-005's `check_strict_dec_shape`).
2. SKILL.md example DEC numbers were inherited from earlier drafts that pre-dated the allocation table.
3. No agent had run a tree-wide DEC range audit since the allocation table was finalized.

### Fix in v1.8.0

1. **Renumbered 328 DEC mentions across 24 SKILL.md files** to land within their allocated ranges per `decision-id-allocation.md`. Sequential mapping preserved order. Per-file, in-range DECs (already correct) were untouched.
2. **Fixed one explicit cross-subskill reference** (iconography's reference to brand-identity DEC-005, now DEC-095). Other cross-refs (imagery → brand-identity DEC-100) were already in-range so no update was needed.
3. **Cleaned up 14 prose lines** mentioning "Decision-log entries (DEC-X to DEC-Y)" that the auto-rename had narrowed to misleading sub-ranges (one inverted: "DEC-080 to DEC-070"; another collapsed: "DEC-671 to DEC-679"). Each now reflects the full allocated range with overflow.
4. **New validator check `check_dec_range_allocation`** in `scripts/validate_design_docs.py`. Walks `<plugin_root>/skills/*/SKILL.md`, asserts every DEC mentioned is either inside the subskill's allocated range OR a documented cross-reference (`SKILL_DEC_CROSS_REFS`). Warning on out-of-range; fails on `--strict`.
5. **Wired into both `_run_mid_run_checks` and `_run_full_checks`** so the drift cannot recur silently.

### Mutation a fixture must catch

The fixture pattern that other VF-FIND-NNN checks use (a delta over `_base/` + `expected.json`) doesn't apply here — `check_dec_range_allocation` operates on the plugin source tree, not on a generated `docs/design-system/` corpus. Instead, the check is sabotage-verified by a manual smoke-test:

```python
# Manual sabotage test (run after every plugin-source edit affecting SKILL.md DECs):
# 1. Inject "Bad reference: DEC-500" into brand-identity/SKILL.md (out of range 90-109).
# 2. Run check_dec_range_allocation against any path.
# 3. Confirm a warning fires naming visualforge-brand-identity and the out-of-range DEC.
# Verified manually 2026-05-20; output recorded in this finding.
```

### Note on PLUGIN-FINDINGS DEC references

Historical entries in this file (VF-FIND-024, VF-FIND-032 through VF-FIND-041) reference DEC numbers as they existed *at the time the finding was discovered*. After the renumbering in this finding, those references are technically stale (e.g., VF-FIND-036 mentions "DEC-816 React boundaries policy" which is now DEC-925). Rather than retroactively rewrite the history log — which would corrupt the audit trail of when each fix landed — those references are left as-is. This note serves as the canonical pointer that pre-v1.8.0-VF-FIND-042 DEC mentions reflect their original values, not the post-renumbering ones.

### Verification

- Tree-wide scan after fix: every SKILL.md has DECs only within its allocated range (verified by `check_dec_range_allocation` walking the source tree).
- `--self-test` 19/19 fixtures still pass.
- Sabotage smoke-test: inject `DEC-500` into brand-identity, check fires; remove, check is silent.
- Cross-reference integrity: iconography's `brand-identity.md` DEC-005 reference updated to DEC-095 (the renamed value).

---

## VF-FIND-043 — Visual-direction-lock cascade-lifecycle was unspecified

- **Severity:** FIX-NEXT (silent inconsistency risk when a lock commitment changes)
- **Category:** orchestration / cascade-lifecycle
- **Discovered:** 2026-05-20 during v1.8.0 follow-up cleanup pass (VF-FIND-041 § "Still deferred — item c")
- **Status:** Fixed in v1.8.0 (same release, post VF-FIND-041 follow-up)

### What happened

When VF-FIND-035 added `auditability/visual-direction-lock.md` and orchestrator Step 0g, it specified a "supersession" rule in passing but did not enumerate what cascades when a specific commitment changes mid-run. If a user pressed "override Hero Scale to Giant Statement" after `brand-identity` and `imagery-illustration` had already cited Mid Editorial, the downstream cascade was implicit. The implicit answer "everything visual rebuilds" was both expensive and ambiguous — some commitments (theme paradigm) genuinely fan out to every file; others (second-read moment) only invalidate one screen spec. Without explicit rules, in-run lock changes silently leave downstream subskills citing the old value.

### The pattern

**Backbone authority without cascade specification.** `decision-log.md` and `tokens.json` had explicit cascade rules from v1.0; the visual-direction-lock (a third backbone authority introduced in v1.8.0) inherited none. The lock could be changed and the run could continue, but no protocol said what to invalidate.

### Root cause in the plugin

1. VF-FIND-035 introduced the lock and stated "departures require supersession" without defining what supersession looks like for the lock specifically.
2. `regeneration-and-cascade-lifecycle.md` enumerated cascade rules for tokens, decisions, personas, retrofit inventory — but not for the lock.
3. Orchestrator's "User override and supersession" section didn't carve out the lock as a separate cascade.

### Fix in v1.8.0

1. **New section in `regeneration-and-cascade-lifecycle.md` § "Visual-direction-lock cascade"** with:
   - Per-commitment fan-out table (which downstream subskills invalidate per commitment).
   - Cascade trigger protocol (halt → append → log → mark stale → re-invoke → re-pressure-test).
   - Forbidden patterns (in-place edits, partial cascades, wip/temp values).
   - Idempotency under lock changes (unchanged lock = idempotent re-run).
   - Anti-slop rules promoted to the file's bottom rule list.
2. **Orchestrator `User override and supersession` section** gains a "Visual-direction-lock override cascade" sub-section pointing at the cascade-lifecycle document.
3. **Auto-mode default**: refuse to silently change a lock commitment. Visual-direction commitments are too foundational for unattended override; surface as BLOCK.

### Cascade fan-out summary

| Commitment | Fan-out scope | Why this scope |
|---|---|---|
| Theme paradigm | All visual files | Touches palette, surface, type — the cheapest commitment to think of also touches the most |
| Hero Scale | layout-system + hero screen specs + imagery (composition) | Affects the highest-leverage screen but not every page |
| Narrative spine | imagery + motion + content-design + most screens | The spine is implicit prose direction; breaks coherence if half-applied |
| Second-read moment | 1 screen + the owner subskill | The moment lives in one place by rule |
| Banned-by-default gradients | surface-treatments + every visual surface | A run-wide ban; ignoring it anywhere breaks the rule |

### Mutation a fixture must catch (proposed)

A future validator check `check_visual_direction_lock_supersession_protocol` should catch:
- A lock commitment edited in-place (no `*(Superseded by ...)*` annotation on the prior value).
- A lock change with no corresponding entry in `auditability/overrides-log.md`.
- A lock change with no staleness markers in `00-index.md`.

This check requires comparing two versions of the lock file — feasible only when git history or a prior-version snapshot is available. Tracked as deferred.

### Verification

- The cascade table covers every commitment in the `visual-direction-lock-template.md`.
- The orchestrator's `User override and supersession` section now points at the cascade rules.
- Auto-mode block-on-lock-change rule is consistent with the existing "no silent override of product-critical decisions" posture.
- Pressure-test: the v1.8.0 cascade rules are sufficient to handle a Hero Scale change without leaving downstream subskills inconsistent — verified by walking the per-commitment table against the dependency graph in the orchestrator.

### Deferred follow-up

- Validator check that enforces supersession protocol (above).
- A reference fixture demonstrating a lock-change-and-cascade run sequence.

---

## VF-FIND-044 — Orchestrator had no self-distrust step

- **Severity:** FIX-NEXT (a green completion can hide a gap, as VF-FIND-041 demonstrated)
- **Category:** orchestration / self-verification
- **Discovered:** 2026-05-20 during v1.8.0 follow-up cleanup pass (VF-FIND-041 § "Still deferred — item d")
- **Status:** Fixed in v1.8.0 (same release, post VF-FIND-041 follow-up)

### What happened

The orchestrator's "Quality gate before completion" checks that required artifacts exist and the validation script passes. It does NOT distrust the run's own output the way `golden-mutation-trust-harness` distrusts a green test suite. Concretely:

- The quality gate is a checklist of artifact-exists conditions. If every condition is true, completion is declared.
- A condition being satisfied doesn't prove it's *correctly* satisfied. A file can exist with placeholder content (caught only by `check_visual_direction_lock_complete` for one file). A DEC can be in a file but outside its allocated range (caught by `check_dec_range_allocation` only post-v1.8.0). A cross-reference can dangle (caught by `check_decision_id_resolution` only for decision IDs).
- VF-FIND-041's six missed gaps are direct evidence: the v1.8.0 implementation passed every applicable check at the time, yet had real defects that surfaced only when the user explicitly pressure-tested.

### The pattern

**Completion = checklist, not verification.** A green checklist proves the steps ran, not that the output is internally consistent and would survive its own pressure-test.

### Root cause in the plugin

1. The orchestrator's quality gate was append-only over the years (every finding added one more checklist item). The cumulative checklist grew but never introduced a *self-distrust pass* that explicitly tries to find what's wrong with the run.
2. `design-pressure-test` Pass A–L reviews the **design** the run produced (against personas, heuristics, etc.) — it does NOT review the **integrity** of the run's own metadata, cross-references, and allocation.
3. No orchestrator step asked "could the same VF-FIND-041 pattern hide here?"

### Fix in v1.8.0

1. **New orchestrator section "Self-pressure-test before completion"** with 9 explicit passes:
   - Pass 1: Re-run full validator (non-strict + strict).
   - Pass 2: Re-run validator self-test (19/19 fixtures must pass).
   - Pass 3: DEC allocation cross-check.
   - Pass 4: Artifact completeness (every commitment has a value).
   - Pass 5: Cross-reference resolution.
   - Pass 6: Authority binding (every claim resolves to a target).
   - Pass 7: Visual-direction-lock cascade integrity (if lock changed, downstream re-ran).
   - Pass 8: Lock-sampling probe (3 random screen specs walked against the lock).
   - Pass 9: Idempotency hash (recorded for next-run comparison).
2. **Pass-to-bug-pattern mutation table** modeled on `golden-mutation-trust-harness` — each pass names the bug pattern it catches and the backing fixture.
3. **`auditability/self-pressure-test-report.md`** added as a required artifact (validator's `REQUIRED_AUDITABILITY`). Without the report, the validator fails.
4. **Failure handling**: if any pass surfaces a problem, the orchestrator does NOT declare completion; logs to `auditability/self-pressure-test-report.md`, surfaces to user, and (Auto mode only, single attempt) tries to auto-fix.

### Coverage analysis — would the new step have caught the VF-FIND-041 gaps?

| VF-FIND-041 gap | Caught by | How |
|---|---|---|
| DEC-090 collision | Pass 3 | `check_dec_range_allocation` (new v1.8.0) |
| `visual-direction-lock.md` not in REQUIRED_AUDITABILITY | Pass 1 | `check_required_files` |
| Orchestrator quality-gate didn't check lock | Pass 4 | `check_visual_direction_lock_complete` |
| Step 0g cited missing section | Pass 5 | Heuristically — manual cross-ref check; partial |
| Component-system spec lacked boundary field | **NOT caught directly** | The defect is in SKILL.md plugin source, not in generated docs. Pass 8 catches the downstream effect only probabilistically. |
| Iconography + content-design cross-cites missing | **NOT caught directly** | Cross-cites in SKILL.md global-rules section are plugin-source defects. No current check walks plugin source for this. |

**Honest accounting:** the self-pressure-test catches ~70% of the VF-FIND-041 gap classes. The two it would NOT catch are plugin-source defects in SKILL.md global rules (cross-cites, contract field lists) — these aren't visible to the validator which operates on generated `docs/design-system/`. Plugin-source contract drift is a separate failure mode best caught by `check_dec_range_allocation`-style plugin-source-walking checks. See "Deferred follow-up" below.

### Mutation a fixture must catch (proposed)

A future "self-distrust" smoke test:
1. Inject a known defect into a sample design-system corpus (e.g., remove a section from a persona file).
2. Run the orchestrator's self-pressure-test pass against the corpus.
3. Verify the pass surfaces a finding for the defect.

This is conceptually the same as the validator's --self-test but at the orchestrator-protocol level rather than the validator level.

### Deferred follow-up

a. **Plugin-source contract walker check.** A check that walks `skills/*/SKILL.md` and asserts each subskill's global-quality-rules section cites the expected shared references (e.g., visual subskills cite `visual-default-breakers.md`; state-page subskills cite `state-page-patterns.md`; component-system spec template includes React-implementation contract subsection). Would have caught two of the VF-FIND-041 gaps.

b. **Lock-and-screen-spec walker.** Pass 8 (lock sampling) is described as "manual walk." A future check could automate this — parse the lock's commitments, parse each screen spec's "uses Hero Scale" line, assert they match.

c. **Self-pressure-test report parser fixture.** A fixture that supplies a `self-pressure-test-report.md` with a FAIL row and asserts the validator flags it as "completion blocked."

### Verification

- Self-test still passes 19/19 after `self-pressure-test-report.md` added to required list (fixtures use mid-run mode which skips `check_required_files`).
- Coverage table maps each VF-FIND-041 gap to a Pass — 4/6 directly caught, 2/6 deferred to plugin-source walker.
- Cascade integrity (Pass 7) is exercised by the new VF-FIND-043 cascade rules.
- Pass 9 (idempotency hash) is consistent with the existing idempotency contract in `regeneration-and-cascade-lifecycle.md`.

---

## VF-FIND-045 — Validator script split for maintainability

- **Severity:** FIX-NEXT (the monolith was working but rule-creep was named in VF-FIND-030 as a known risk)
- **Category:** maintainability / validator architecture
- **Discovered:** 2026-05-20 as recommended next step after v1.8.0
- **Status:** Fixed in v1.8.0

### What happened

`scripts/validate_design_docs.py` grew to **2,153 lines** across ~30 check functions, ~15 constants, ~6 helpers, plus argparse / main / emit / self-test harness — all in one file. VF-FIND-030 already named "rule-creep" as a known anti-pattern. A future contributor adding a new check had to scroll a monolith to find:
- where similar checks live (no spatial cohesion).
- which constants are shared vs check-local.
- how `_run_mid_run_checks` and `_run_full_checks` compose the run-list.

### The pattern

**Inevitable-monolith growth.** A script starts as one function; checks accumulate; constants accrete; the file passes a readability threshold without anyone noticing. The original validator was fine at 500 lines, OK at 1,000 lines, and over the line at 2,000+ lines.

### Fix in v1.8.0

Split into a `scripts/validators/` package with 12 cohesive modules:

| Module | Lines | Contents |
|---|---|---|
| `_common.py` | 432 | Findings dataclass, all shared constants, regexes, helpers (`_strip_excluded_contexts`, `_strip_jsx_comments`, `_extract_h2_headings`, `_heading_matches_required`, `load_tokens`, `flatten_tokens`) |
| `structural.py` | 229 | 7 file/dir presence checks: `check_required_files`, `check_persona_files`, `check_concurrency_lock`, `check_figma_artifacts`, `check_version_stamps`, `check_whats_missing`, `check_retrofit_data_awareness` |
| `tokens.py` | 72 | 3 token checks: `check_token_integrity`, `check_no_raw_values_in_components`, `check_dark_mode_coverage` |
| `dec_integrity.py` | 471 | 7 DEC checks: shape, log, ID resolution, singleton, per-DEC metadata, persona-DEC consistency, range allocation |
| `claim_discipline.py` | 200 | 5 claim checks: forbidden ambiguity, numeric labels, raw px, hedges, cross-subskill cites |
| `semantic_drift.py` | 141 | 2 checks: mutation log, wrapper semantic drift |
| `visual_defaults.py` | 292 | 8 v1.8.0 visual-default-breaker checks |
| `state_pages.py` | 37 | 1 check: state-page cross-cites |
| `plugin_contracts.py` | 85 | 1 v1.8.0 check: plugin-source contract walker |
| `slop.py` | 41 | `scan_slop` |
| `harness.py` | 123 | `_run_self_test` fixture harness |
| `__init__.py` | 125 | Re-exports + composed `run_mid_run_checks` and `run_full_checks` |

`scripts/validate_design_docs.py` shrinks to **144 lines** — entry point only: argparse, main, emit_text, emit_json, and imports from the validators package. The original monolith was preserved as `scripts/_split_validators.py` (368 lines) — the regeneration tool that performs the split deterministically from the source structure.

### Bugs surfaced during the split

The act of splitting surfaced two bugs in the splitter, both caught by the self-test:

1. **Missing `@dataclass` decorator.** Initial splitter `grab()` function captured class body but skipped the preceding `@dataclass` decorator line. `Findings.errors` became a `Field` object instead of a `list`, failing on first `.append()`. Caught by self-test on first run; fixed in splitter by extending `grab()` to capture leading decorators.
2. **Hard-coded plugin_root depth.** Original `_run_self_test` used `Path(__file__).resolve().parent.parent` to find the plugin root (one level up from `scripts/`). After moving to `scripts/validators/harness.py`, it needed `parent.parent.parent`. Caught by self-test (`FAIL: fixtures dir not found at scripts/examples/fixtures`).

This is the [`testing-strategy-and-tdd`](${HOME}/.claude/skills/testing-strategy-and-tdd) discipline in action: the 19-fixture self-test caught two real bugs in the refactor that a "looks-fine" review would have missed.

### Verification

**implementation-review-against-plan** (full skill applied):
- Plan promise vs delivery: 12 modules created (vs 9 planned — splitter added `_common.py` and `slop.py` as separate modules, both improvements).
- All 35 expected check functions present in some module (verified by AST walk).
- `run_mid_run_checks` calls 32 unique checks; `run_full_checks` calls 33 (adds scan_slop + tokens setup).
- Entry point shrunk from 2,153 → 144 lines (-93%).
- Largest single module: `dec_integrity.py` at 471 lines (under 500-line target).
- Behavior verifiably preserved: self-test 19/19, sabotage matrix 9/9.

**golden-mutation-trust-harness** (5 architectural mutations):

| Mutation | Expected | Actual | Verdict |
|---|---|---|---|
| Drop `check_visual_default_breakers` from `run_mid_run_checks` call list | vf-find-032 fixture fails | exit=1, 1 fixture failed | OK — run-list IS the oracle |
| Rename `SUBSKILL_DEC_RANGES` in `_common.py` | ImportError on validator load | exit=1, ImportError raised | OK — `_common` exports ARE consumed |
| Drop "modern" from `SLOP_WORDS` in `_common.py` | self-test (mid-run mode) unchanged | exit=0, 0 fixtures failed | OK — mid-run vs full mode boundary preserved |
| Break `DEC_HEADING_PATTERN` regex syntax | regex compile error | exit=1 | OK — shared regex IS used |
| Drop `check_state_page_cross_cites` re-export from `__init__.py` | ImportError when entry tries to import | exit=1 | OK — `__init__.py` re-exports ARE load-bearing |

5 / 5 architectural mutations caught — the new module structure is genuinely wired, not just stylistically reorganized.

### How to add a new check after the split

1. Pick the right module (see table above). If none fits, add a new module to `validators/`.
2. Write the check function. Import constants/helpers from `._common` as needed.
3. Re-export from `validators/__init__.py`.
4. Add to `run_mid_run_checks` and/or `run_full_checks` in `__init__.py`.
5. Add a paired-condition fixture under `examples/fixtures/vf-find-NNN-*/`.
6. Run `py -3 scripts/validate_design_docs.py --self-test` — must remain 19/19 PASS (or 20/20 after your new fixture).
7. Run the sabotage probe: temporarily no-op your check, confirm only your fixture fails.

### Verification

- Self-test 19/19 after the split.
- Sabotage matrix 9/9 after the split.
- 5/5 architectural mutations caught (mutation harness above).
- The original `_split_validators.py` tool can regenerate the package deterministically — re-running it produces equivalent output (idempotent split).

---

## VF-FIND-046 — scan_slop coverage gap

- **Severity:** WATCH (no incorrect output; only an uncovered check)
- **Category:** test coverage / fixture inventory
- **Discovered:** 2026-05-20 by the golden-mutation-trust-harness pass on VF-FIND-045
- **Status:** Fixed in v1.8.0

### What happened

While running the architectural mutation harness on the validator split (VF-FIND-045), one mutation showed an unexpected result:

> **Mutation 3:** Drop "modern" from `SLOP_WORDS` in `_common.py`. Expected: self-test (mid-run mode) unchanged. **Actual:** exit=0, 0 fixtures failed.

That mutation was correctly classified as a "negative control" — mid-run mode doesn't invoke `scan_slop`, so dropping a slop value shouldn't produce any failure in the mid-run-only fixture set. The trace was correct.

But it surfaced a real gap: **no fixture exercises `scan_slop`**. The slop-word scanner is only invoked in full mode, and every existing fixture used `"mode": "mid-run"`. A bug in `scan_slop` (e.g., a regex typo that stopped matching slop words) would not be caught by the existing self-test.

### The pattern

**Mode-segregated coverage.** A validator with multiple run modes (mid-run / full / --strict) needs at least one fixture per mode to prove each mode's check set is exercised. Otherwise mode-specific checks become invisible to the regression harness — they ship without their oracles.

### Fix in v1.8.0

1. New fixture `examples/fixtures/vf-find-046-slop-scan-coverage/`:
   - `02-visual-language/brand-identity.md` containing the slop word "modern" in prose.
   - `expected.json` with `"mode": "full"` (only full-mode fixture in the suite) and `warnings_include: ["Slop-candidate 'modern'", "brand-identity.md"]`.
2. Sabotage-verified: no-op'ing `scan_slop` in `validators/slop.py` causes exactly `vf-find-046` to fail. `scan_slop` is now the unique oracle for its fixture.
3. Updated `examples/fixtures/README.md` to include the new fixture row in the inventory table and the sabotage matrix.

### Mutation that would now be caught

Re-running VF-FIND-045 Mutation 3 (drop "modern" from `SLOP_WORDS`) now produces:

```
[FAIL] vf-find-046-slop-scan-coverage
   - warnings_include missing: "Slop-candidate 'modern'"
```

The mode-segregated coverage hole is closed.

### Verification

- Self-test: 20/20 (was 19/19; gained vf-find-046).
- Sabotage matrix:  9/9 from VF-FIND-040 + 1/1 for scan_slop = 10/10.
- The mutation that previously slipped through silently now fails the new fixture.

---

## VF-FIND-047 — Color theory + decision matrix grounding

- **Severity:** FIX-NEXT (palette decisions were menu-pick without theory or matrix grounding)
- **Category:** subskill content / decision quality
- **Discovered:** 2026-05-20, user-requested investigation of color-theory coverage
- **Status:** Fixed in v1.8.0

### What happened

A user asked: "was color theory research and decision matrix built into the skill? does it tell the agent to research color theory from sources and give a decision matrix?" Honest answer: **mostly no.** The skill had:

- A **menu** of palette breadth options in `brand-identity.md` (mono / duo / accent+neutral / multi-accent) without rules for when each works.
- A **token construction recipe** in `design-tokens.md` (11-step OKLCH ramps) without explaining why OKLCH or how to derive the ramp.
- A few **tooling links** in `current-design-source-map.md` (oklch.com, APCA, WCAG, Radix, Tailwind, Brewer).
- A **one-line name-drop** ("Perception and color science: Stone, Hardin") under foundational sources.
- **No** color-theory research prompt.
- **No** color meaning table.
- **No** color-pairing guidance ("what goes well together").
- **No** brand-attribute → scheme decision matrix.
- **No** palette derivation method beyond "use OKLCH for tokens."
- **No** color-blindness verification protocol beyond mentioning color-blind-safe palettes.

### Pressure-test of the assistant's first-draft matrix

When I drafted a recommended 6-row matrix for the user (precise / warm / luxurious / playful / trustworthy / natural), pressure-testing each row against real products surfaced real problems:

| Row | Issue |
|---|---|
| precise / technical → mono + accent | Apple/Vercel are achromatic, not monochromatic. Stripe is blue+purple. One pattern of several. |
| warm / human → analogous warm | Conflated "warm" (Mailchimp orange) with "approachable" (Headspace blue). Two different attributes. |
| luxurious → desaturated + jewel | Misses iconic-color-mode luxury — Tiffany blue, Cartier red, Bottega green, Hermès orange are saturated single-hue brands. |
| playful → triadic with dominant | Duolingo is closer to split-complementary; Instagram is mono. Triadic was a textbook reach. |
| trustworthy → blue + cool neutral | Western-skewed. HSBC red, BoA red, TD green are all trustworthy via other patterns. |
| natural → earth analogous + green | This one held up cleanly. |

Lesson: 1-pattern-per-row hides real ambiguity. The matrix needs **primary + common alternative + example + risk** per row.

### Fix in v1.8.0

1. **New shared reference `_visualforge-shared/references/color-theory-and-decision-matrix.md`** (~530 lines) containing:
   - **Research prompt** — directs agent to research 8 specific topics (harmony schemes, color meaning across cultures, 60-30-10, OKLCH/OKLab, color-blindness types, contrast tooling WCAG vs APCA, reference color systems, foundational sources).
   - **Color theory primer** — color wheel basics; 6 harmony schemes (monochromatic, achromatic+accent, analogous, complementary, split-complementary, triadic) each with rule + composition + when it works + real example + failure mode; 60-30-10 composition rule with Itten origin; color temperature axis.
   - **Color meaning table** — 11 hues × Western default + East Asia + South Asia + Middle East + stable-across-cultures + avoid-in. Includes explicit "culturally unstable" subset to avoid for global products. Color emotion / psychology section.
   - **"What goes well together"** — reliable pairings, risky pairings, anti-pairings, surface-specific pairing guidance with WCAG and APCA targets.
   - **Pressure-tested 13-row decision matrix** — primary scheme + common alternative + example product + risk-to-avoid per brand profile (precise / warm / approachable / luxurious-restraint / luxurious-iconic / playful / trustworthy / natural / creative / AI / children's / news / healthcare).
   - **OKLCH-based palette derivation method** — 5-step protocol (anchor accent, derive ramp via luminance laddering, derive neutrals, light/dark mapping, verify).
   - **Color-blindness verification** — prevalence data with sources, 4 types with verification tools, dual-encoding rule with concrete examples.
   - **Contrast tooling** — WCAG 2.2 (formula, when sufficient, AA/AAA targets) vs APCA Lc (perceptually-weighted, current 2026 draft targets, when to use), with "log both" recommendation.
   - **Anti-patterns** — pure black/white, rainbow, purple-blue AI cliche, pink-orange creator, neon edges, gradient text, state-decorative confusion, brand-state hue collision.
   - **Sources** — 17 references including Itten, Albers, Stone, Hardin, Munsell, Ottosson (OKLCH), Brewer, W3C WCAG/CSS Color 4, Somers (APCA), Material 3, Apple HIG, IBM Carbon, Radix, Tailwind, ColorBlind Awareness UK, WHO.

2. **Cross-wired into 5 subskills:**
   - `brand-identity` § 2 Color philosophy — agent must pick a matrix row before logging color decision.
   - `design-tokens` § Color — palette construction via the OKLCH-based derivation method; contrast table requires WCAG + APCA; color-blindness simulator pass required.
   - `data-visualization` — series colors via ColorBrewer; dual-encoding rule required.
   - `surface-treatments` — gradient discipline cross-checks with banned list.
   - `i18n-rtl` — cultural color associations cross-check via the meaning table.

3. **New validator check `check_color_decision_basis`** in new `validators/color.py` module. Scans `02-visual-language/design-tokens.md`, `brand-identity.md`, `surface-treatments.md` — if any contains hex color or `oklch(...)` notation but doesn't cite `color-theory-and-decision-matrix.md`, emits WARN. Splitter `_split_validators.py` updated to know about the new module.

4. **Fixture `vf-find-047-color-decision-basis`** under `examples/fixtures/`. Mode: mid-run. Provides minimal `design-tokens.md` declaring OKLCH + hex colors without the citation. Asserts the warning fires with the reference filename in the message.

5. **Sabotage-verified.** No-op'ing `check_color_decision_basis` causes exactly `vf-find-047` to fail. The check is the unique oracle for its fixture.

### Verification

- Self-test: 21/21 fixtures pass (gained vf-find-047).
- Sabotage matrix: 11/11 (was 10/10).
- Clean-state check: 0 VF-FIND-047 findings on the plugin's own (empty) `docs/design-system/`.
- The reference is 530+ lines and includes every gap the user listed: research prompt, decision matrix, color combinations (harmony schemes + pairing guide), color meaning, what goes well together.
- The decision matrix was pressure-tested by checking each row against real product examples; the original 6-row table was refined to 13 rows with primary + alternative + example + risk per row to acknowledge real ambiguity instead of pretending each attribute maps to a single answer.

### Honest residual gaps

- **No automated decision-card lint** that verifies a color decision card actually names the matrix row, the alternative, the example, and the risk. The check just verifies the citation exists. A stricter check would parse the decision card structure.
- **No fixture for `i18n-rtl` cultural-color cross-check** — the cross-cite is documented but not exercised by the test suite.
- **OKLCH derivation tables are starting values, not formulas** — the reference gives a luminance/chroma table per ramp step but doesn't ship a generator script. Hand derivation per accent hue is expected.

---

## Future findings format

When new findings come from real-world runs, append using this template:

```markdown
## VF-FIND-NNN — [one-line title]

- **Severity:** BLOCK | FIX-NEXT | WATCH | ACCEPT
- **Category:** [orchestration | decision-protocol | token-system | persona | validation | docs | other]
- **Discovered:** [date] during [which run]
- **Status:** Fixed in v1.1.0 | Fixed in vX.Y.Z | Won't-fix (with reason)

### What happened
[Concrete symptom observed in real use.]

### The pattern
[What class of bug / issue this is. Name it.]

### Root cause in the plugin
[What in the plugin design caused this — protocol file, validation gap, missing rule, etc.]

### Why this matters
[Real-world cost or risk.]

### Proposed fix (vX.Y)
[Specific files to change with specific changes.]

### Verification
[How we'd confirm the fix works.]
```
