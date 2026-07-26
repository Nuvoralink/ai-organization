# Anti-Slop Design Rubric

Use this rubric before, during, and after every design documentation pass. Design slop is different from spec slop — it hides behind taste-words instead of vague requirements.

## Table of contents

This rubric has grown across many findings. Read it once; cite the relevant section per task.

1. **Hard failure patterns — design-specific** — taste-words, raw values, missing states; the prose-level slop check.
2. **Claim-discipline** (VF-FIND-002 / 006 / 008) — numeric claims, raw px in tokens-required surfaces, rhetorical hedges on known values.
3. **Required quality properties** — every decision needs ID, source label, exact value, state coverage, a11y note, token reference, reversal trigger.
4. **Specificity / Evidence / Opinion / Trend-fit / Contradiction / Risk-fit tests** — the analytic checks.
5. **Final quality report** — what `design-quality-review.md` must contain.
6. **Decision slop patterns** — protocol-level slop (asking the user without a recommendation, "we can support both" without algorithm).
7. **Test-discipline patterns** (VF-FIND-023+) — variant-table vacuous tests, lookup-table tests, threshold without boundaries, polymorphic untested branches, jsdom polyfill blindness, proxy-assertion fallacy, vacuous `.rejects.toThrow()`, implementation-pinned `toHaveBeenCalledWith`.
8. **Numeric-threshold contract / Polymorphic-component contract / Wrapper-encapsulated semantic drift / Capability-pending aging** — the boundary-test, paired-condition, and lifecycle guardrails from real incidents.
9. **Visual default breakers** (VF-FIND-032+) — *anti-LLM-default visual rules; lives in [`visual-default-breakers.md`](./visual-default-breakers.md)*. Cited but not duplicated here.

## Purpose

Prevent generic AI-generated design output. Good design documentation must constrain visual, interaction, motion, and content behavior in a way that is specific, evidence-backed, opinionated, and reproducible by a different team without losing intent.

## Hard failure patterns — design-specific

Do not ship documentation that contains any of these:

- Taste-words without concrete behavior: `modern`, `clean`, `minimal`, `intuitive`, `seamless`, `delightful`, `professional`, `user-friendly`, `sleek`, `elegant`, `polished`, `vibrant`, `bold`, `playful`, `premium`, `pixel-perfect`, `beautiful`.
- Color recommendations without hex/HSL/OKLCH values, semantic role, contrast ratio against intended backgrounds, and dark-mode pair.
- Typography recommendations without font family, weight, size, line-height, letter-spacing, fallback stack, and license/source.
- Spacing recommendations without an exact value tied to the spacing scale.
- Animation recommendations without duration in ms, easing curve (named or cubic-bezier), what property animates, and reduced-motion fallback.
- Shadow recommendations without layer count, offset, blur, spread, color, opacity, and the elevation level it represents.
- Component recommendations without every state (default, hover, focus-visible, active/pressed, disabled, loading, error, success, selected, dragging) defined.
- Icon recommendations without library name + version OR custom-design rule, stroke weight, corner radius, and grid size.
- Layout recommendations without breakpoint values, column count, gutter size, and container max-width.
- Trend recommendations (Liquid Glass, neumorphism, bento, brutalism, etc.) without explicit rationale tied to this product's audience, use context, brand, and platform — and a rejection list of trends that do *not* fit.
- "Follow Material Design / Apple HIG" as a recommendation without specifying *which version*, *which sections apply*, and *which parts are overridden*.
- "Use a design system" without naming it (Shadcn/Radix, Material 3, Fluent 2, Ant 5, HeadlessUI + custom, etc.), version, and component-by-component adopt/extend/replace decisions.
- Accessibility claims without WCAG 2.2 level (A/AA/AAA), success criterion IDs (e.g., 1.4.3, 2.4.7), and verification method.
- Surface treatment claims (glass, blur, gradient, noise) without backdrop-filter values, opacity, fallback for unsupported browsers, and performance budget impact.
- Recommendations to "consider" something. Decisions are made, not deferred. If unresolved, mark as `Open Question` with risk impact, not `consider`.
- **Data-blind design (retrofit / specforge-enhanced):** a screen spec listing fields that do not appear in `retrofit/data-inventory.md` (or Specforge data contracts) without a `BackendGap` entry. Designs may not invent data.
- **Data-omitting design (retrofit):** an entity in `retrofit/data-inventory.md` with no user-facing surface and no operational-only justification. Designs may not silently drop important data; surface it or write a `MissingSurface` justification.
- **Structural drift left uncaught (retrofit):** a page mixing multiple roles, task domains, or data scopes with no IA-restructuring finding logged. The IA restructuring protocol must surface splits, merges, missing pages, orphans, and role leaks.
- **Flat-dump output:** all design docs at `docs/design-system/` root rather than organized into the thematic sub-folders specified in `mode-detection-protocol.md`. Personas, components, screens must each be one-file-per-thing, not lumped into single files.

### Claim-discipline (v1.1 — added per VF-FIND-002 / 006 / 008)

Three related failure patterns for specific numeric / value claims. All three corrupt the evidence trail by *implying precision the artifact can't back up*.

- **Numeric claim without computation source (VF-FIND-002):** any cited numeric ratio, budget, threshold, or duration that *looks* measured (e.g., `5.4:1`, `200ms`, `≤ 150KB`) must be paired within ~80 characters with one of `(measured)`, `(computed)`, `(estimated)`, `(target)`, or `(assumption)`. Bare ratios / specific numbers without a label imply verification that hasn't happened. The validation script's `check_numeric_claim_labels` flags violations.

- **Raw px / ms / token-eligible values bypassing the token system (VF-FIND-006):** layout-system, component, and screen specs must reference tokens by name (`size.6`, `duration.fast`) — not raw px / ms values. Raw values are permitted only when paired with both a `(target)` or `(measured)` label AND a `DEC-NNN` cite to a known token-gap decision (e.g., `DEC-274` for token-scale extension). The validation script's `check_raw_px_in_layout_and_components` warns at density ≥ 3 unlabeled raw px per file.

- **Rhetorical hedge on known-exact value (VF-FIND-008):** `≥`, `≤`, `~`, `approximately`, `around`, `about`, `roughly` are reserved for *genuine ranges* (e.g., `≥ 60-day session gap` describing any gap that meets the threshold) and *genuine estimates* (e.g., `approximately 8% of users` for an unmeasured share). They are forbidden as cargo-cult precision on exact values. If a count is exactly 5, write `5` — not `≥ 5`. The validation script's `check_hedge_on_known_values` warns when a hedge appears near a fixed-count concept (nav items, breakpoints, columns, tiers, etc.).

These three rules together enforce the principle: *the precision of a claim must match the strength of its evidence*.

## Required quality properties

Every design decision must have:

- Stable ID (e.g., `COLOR-001`, `MOTION-014`, `SURFACE-003`, `COMP-027`).
- Source label: User-confirmed, Repo-derived, Research-backed, Standard-backed, or Assumption.
- Specific behavior with exact values.
- Visual or interaction state coverage (all states enumerated).
- Accessibility note: contrast, motion, focus, screen reader.
- Performance note when relevant: GPU compositing, paint cost, layout thrash.
- Token reference (no raw values in component docs — must reference a named token).
- Implementation contract: which CSS property, which framework primitive, what fallback.
- Reversal trigger.

## Specificity test

For each section, ask:

1. Could two different designers read this and produce visually-equivalent results?
2. Does it say what is *out of scope* for the visual language?
3. Does it define behavior in every interaction state?
4. Does it define behavior in reduced-motion, high-contrast, dark, RTL, and small-screen contexts?
5. Does it define verification — visual regression target, a11y check, performance budget — not just intent?
6. Does it avoid invented designs by tying to research or evidence?
7. Does it point to an official source (HIG/Material/WCAG), competitor reference, or repo evidence?

If the answer is no, rewrite the section.

## Evidence test

Every factual claim about the design must come from one of:

- The user answer.
- Repository evidence (existing tokens, components, brand assets) — but only as inventory, never as a constraint on the new design unless the user explicitly locked it.
- A research-backed source (current design trend article, official platform guidance, design system reference) recorded in `research-ledger.md`.
- A standard (WCAG 2.2, ISO type sizes, web platform specs).
- A clearly labeled assumption.

Evidence format:

- User-confirmed: short quote or answer summary.
- Repo-derived: exact file path (e.g., `tailwind.config.js`, `tokens.css`) — for inventory only.
- Research-backed: source title, owner, publication date, URL, and what was extracted.
- Standard-backed: standard name, version, section, URL.
- Assumption: assumption ID, reason, risk if wrong, what to verify post-launch.

## Opinion test

Generic guidance is slop. Every design decision must be opinionated:

- A *chosen* option, not a menu of options.
- A reason this product needs *this* answer (not "best practice").
- A rejection list — what was considered and why it lost.
- A confidence level (High / Medium / Low) and what would shift it.

A decision card that reads "consider using subtle shadows" fails. A card that reads "Use `shadow.card.rest` (4-layer warm-tinted shadow, max 24px blur radius, total opacity 0.16) because the dense card grid needs depth separation without competing with the saturated brand accent — rejected flat (reads as utility-software), single drop shadow (reads as 2018 Material), neumorphism (a11y contrast failure)" passes.

## Trend-fit test

When considering a current visual trend (Liquid Glass, Material 3 Expressive, bento, brutalism, AI-native chrome, spatial UI, etc.), check:

1. Does the audience expect it / will they read it correctly?
2. Does the platform support it natively at acceptable performance?
3. Does it strengthen the brand voice, or fight it?
4. Does it cost less than the design-quality lift it delivers?
5. Does it have a documented fallback for older devices / reduced-motion / low-power mode?

If any answer is no, reject the trend and record why in the decision log.

## Contradiction test

Before finishing, compare:

- Brand identity against design tokens.
- Design tokens against component system.
- Component system against UX flows.
- UX flows against IA and layout.
- Motion against accessibility (reduced motion).
- Surface treatments against performance budget.
- Iconography against brand identity.
- Content design against component states.
- Implementation contract against design tokens (every token must be exportable).
- Repo retrofit drift report against ideal design.

Record unresolved conflicts in `auditability/design-quality-review.md`.

## Risk fit test

Increase detail and constraint strictness when:

- Product is consumer-facing with high aesthetic stakes (lifestyle, premium, social, creative tools).
- Product is regulated and visual cues affect interpretation (medical, financial, legal).
- Product is accessibility-critical (government, education, public-sector, assistive-tech).
- Product targets children — extra constraints on motion, contrast, dark patterns.
- Product is multi-tenant / white-label — theming must be a first-class concern.
- Product runs across web, mobile, desktop — design tokens must be platform-portable.

## Final quality report

Create or update `docs/design-system/auditability/design-quality-review.md` with:

- Quality review status.
- Files reviewed.
- Slop issues found and fixed.
- Remaining gaps with owners.
- Contradictions found and resolution.
- Missing evidence.
- Assumptions that affect implementation.
- High-risk design choices flagged for stakeholder sign-off.
- Token export validation result.
- Figma artifact build status (built / fallback JSON exported / skipped with reason).

## Decision slop patterns — also reject

- Asking the user to choose a color palette, typeface, or component library without a recommendation with rationale.
- More than 6 initial discovery questions before research can fill the rest.
- "We can support both light and dark" without specifying the dark-mode color algorithm and which surfaces invert vs which stay token-mapped.
- "Responsive design" without specifying breakpoint values, layout-shift rules, and which patterns adapt vs which stay constant.
- "Accessible" without WCAG 2.2 level target and verification checklist.
- "Performant" without LCP/CLS/INP budgets and the design choices that affect them.
- "Brand-aligned" without naming the brand attributes being expressed and the visual mechanism expressing each one.

A decision is acceptable only when a future designer or engineer can see why it was chosen, what was rejected, how to verify it, and when to reverse it.

## Test-discipline patterns — also reject

Promoted from `test-discipline-and-mutation-protocol.md` after VF-FIND-023:

- **"Variant-table tests" that only verify the prop maps to a data-attribute.** Asserting `<Button variant='primary'>` produces `data-variant='primary'` is nearly tautological — it tests prop spreading, not the variant's effect. Each variant must additionally have a paired assertion that proves the variant CHANGES output (e.g., `primary` references `--vf-accent-primary` token AND `ghost` does NOT).
- **"Lookup tables don't need tests."** Wrong. Lookup tables have selector logic. Tabs `orientation` is selected by `variant === "vertical"` — a one-line lookup. A regression made it always-horizontal; the data-variant test still passed. Every selector lookup needs a paired-condition test.
- **Threshold decisions without boundary tests.** "7 days = urgent" must include tests for `days=6`, `days=7`, `days=8`, and `days=0`/today. If a spec doesn't specify the boundary, the spec is incomplete; flag and pick.
- **Polymorphic components with one rendering path tested.** A Card that renders `<a>` / `<button>` / `<article>` based on props needs three tests, not one. Untested branches become dead code at the type level + live code at runtime.
- **JSdom polyfills without disclosure.** If a component test polyfills `ResizeObserver` / `setPointerCapture` / etc., it's testing wiring not behavior. Required: a documented real-browser test (Playwright) covering the unpolyfilled behavior, OR an explicit "unverified in unit tests" note.
- **"Mutation testing not needed for this component."** No exceptions for trivial components. Even Badge had a status→icon mapping that could break silently. If a component truly has no testable behavior, inline the JSX instead of shipping a component.
- **`capability-pending` items with no target date.** Every entry needs an "expected by" date. CI flags items past their date; review them quarterly to either ship, escalate, or remove from the inventory.

## Numeric-threshold contract

When a decision specifies a numeric threshold, the decision card must include:

```
**Threshold:** <value> <unit>
**Boundary inclusivity:** <inclusive | exclusive on the upper side>
**Boundary tests required:**
- value - 1 → expected behavior X
- value → expected behavior X (or Y if exclusive)
- value + 1 → expected behavior Y
- degenerate (0 / today / empty) → expected behavior Z
```

A threshold without boundary specification is incomplete.

## Polymorphic-component contract

When a component renders different elements based on props:

```
**Render branches:**
- prop A → element X
- prop B → element Y
- default → element Z

**Tests required:**
- A renders X (assert tagName + activation path)
- B renders Y (assert tagName + activation path)
- default renders Z
- A does NOT also render Y or Z (assert absence)
- B does NOT also render X or Z (assert absence)
```

## Wrapper-encapsulated semantic drift

Promoted after the RenewalRadar `/sign-in` migration regressed `<h1>` → `<h3>` silently because `CardTitle` defaulted to `<h3>` and the migration replaced an `<h1>` without overriding (VF-FIND-025).

### The pattern

A wrapper component encapsulates a semantic decision (HTML tag, ARIA role, default attribute) that the call site cannot see. When the wrapper substitutes for raw markup that previously carried a different semantic, the substitution silently regresses behavior.

Canonical cases:
- `<h1>` → `<CardTitle>` (defaults to h3) — heading hierarchy regression.
- Raw `<button type='submit'>` → VF `<Button>` (defaults to `type='button'`) — form never submits.
- Raw `role='alert'` → VF `<Alert severity='info'>` (defaults to `role='status'`) — critical announcement degrades to polite.
- Raw `<input type='password'>` → VF `<Input>` (defaults to `type='text'` if caller omits `type`) — password field silently downgraded.

### Mitigation rules (mandatory for all VF wrappers)

1. **Wrappers that encapsulate a semantic decision must expose an override prop.** Convention: `as` for HTML tag, `role` for ARIA, `type` for input/button. The default is documented + every override option is tested.
2. **The wrapper's spec doc must list the regression risk** in its "Composition rules" or "Anti-pattern" section. Example: "Using `CardTitle` without `as='h1'` on a page-primary heading regresses h1 → h3."
3. **Page migrations must include probe tests** (per `test-discipline-and-mutation-protocol.md` Rule 6) asserting the pre-migration semantic contract: exactly one h1, correct landmark structure, correct form input names, correct button types, correct ARIA roles.

### Validator enforcement

The plugin validator emits a WARN when an `app/**/page.tsx` file uses a known semantic-wrapper component (`CardTitle`, etc.) without the disambiguating prop, AND the page lacks an alternative source for the semantic (e.g., a raw `<h1>` elsewhere). See `check_wrapper_semantic_drift` in v1.7.0+.

## Capability-pending aging

Each `capability-pending` entry in `_index.md` / `WHATS-MISSING.md` must include:

```
| Item | Owner | Reason | Target date | Last reviewed |
```

Validator surfaces items past their target date. A capability-pending that has aged 6 months without review is a parking lot, not an honest deferral.
