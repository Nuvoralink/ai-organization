---
name: visualforge-accessibility
description: WCAG 2.2 level lock, per-component accessibility contract, keyboard navigation map, screen reader contract, focus management rules, color contrast verification, touch target enforcement, reduced motion, high contrast, prefers-reduced-transparency, prefers-contrast support.
---

# Accessibility Contract

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md`.
- Every accessibility claim cites the WCAG 2.2 success criterion ID (e.g., 1.4.3, 2.4.7, 2.5.5).
- Every component has an accessibility contract with: role, name, state, properties, keyboard, screen reader announcement, focus behavior.
- Color contrast verified, not assumed.
- Maintain `decision-log.md`.

## Purpose

The accessibility contract is non-negotiable. This subskill audits everything VisualForge has produced and locks the accessibility guarantees the product will deliver. It is the gate that decides whether the design is ready or not.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Generate accessibility contract from level lock + component / surface / motion / content specs.
- **Retrofit:** Audit existing accessibility; produce ideal target; drift entry covers known gaps with remediation priority.

## Required research pass

```text
Confirm current WCAG 2.2 success criteria, especially the new criteria added in 2.2 (focus appearance 2.4.11/2.4.12/2.4.13, dragging movements 2.5.7, target size minimum 2.5.8, consistent help 3.2.6, redundant entry 3.3.7, accessible authentication 3.3.8/3.3.9). Confirm APCA contrast (perceptual model, used on Apple platforms and previewed for WCAG 3). Confirm WAI-ARIA 1.2 patterns from APG. For mobile, confirm platform accessibility APIs (iOS UIAccessibility, Android Accessibility, TalkBack). Capture sources.
```

## Inputs

- Design brief — accessibility level target (AA / AA+ / AAA).
- Personas — assistive tech profile, motion sensitivity.
- Design tokens — contrast verification tables.
- Component system — per-component accessibility contract drafts.
- Content design — language patterns.

## Output files

- `docs/design-system/07-quality/accessibility-contract.md`
- Per-component accessibility audit appendix appended to each component file under `05-components/`.
- Decision-log entries (DEC-830 to DEC-864, overflow DEC-865 to DEC-869) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Level lock

- **Target:** WCAG 2.2 [A | AA | AA+ | AAA] across the product.
- **Exceptions:** any surface where a different level applies (e.g., marketing pages may target AA while product app targets AAA), with rationale.
- **Verification methodology:** automated (axe-core, Lighthouse) + manual screen reader passes + human audit at launch.

### 2. Keyboard navigation contract

- **All interactive elements:** focusable in DOM order.
- **Focus order:** matches visual reading order (top-to-bottom, left-to-right; reverses in RTL).
- **Skip links:** "Skip to main content" link at very start of page; visible on focus.
- **Keyboard shortcut policy:**
  - Global shortcuts (Cmd+K, /, ?) — documented in help dialog.
  - Per-screen shortcuts — listed in keyboard-shortcut overlay (press ?).
  - Shortcuts must not conflict with screen reader virtual cursor keys (avoid single-letter shortcuts in primary panes, or require modifier).
- **Focus trapping:** modals and command palettes trap focus until closed.
- **Focus restoration:** after modal close, focus returns to trigger.
- **Tab cycles:** Tab moves forward; Shift+Tab moves back; no traps outside modals.

Document a keyboard map for the product:

| Shortcut | Context | Action |
|---|---|---|
| Tab / Shift+Tab | Global | Move focus |
| Enter | Default-action context | Activate |
| Space | Buttons, checkboxes | Activate |
| Escape | Modal, popover, command palette | Close / cancel |
| Arrow keys | Lists, menus, tabs, radio groups | Navigate within |
| Home / End | Lists | First / last |
| PageUp / PageDown | Scrollable | Page scroll |
| Cmd+K (Ctrl+K) | Global | Open command palette |
| / | Global | Focus search |
| ? | Global | Show keyboard shortcuts |
| Cmd+Z (Ctrl+Z) | After action | Undo |

### 3. Screen reader contract

- **Landmark roles:** `header`, `nav`, `main`, `complementary`, `contentinfo`, `search` — one of each at the right level.
- **Heading structure:** single `h1` per page; logical h1 → h2 → h3 nesting; no skipped levels.
- **Live regions:** `aria-live="polite"` for non-urgent updates (toast, autosave indicator); `aria-live="assertive"` only for critical (errors blocking submission). Polite is the default.
- **Status announcements:** loading start / end / error per per-feature.
- **Dynamic content:** `aria-busy` during long-loading; `aria-expanded` for disclosures; `aria-pressed` for toggles; `aria-selected` in selectable lists.
- **Names from authors:** `aria-label` on icon-only controls and complex composites; `aria-labelledby` when label is rendered text elsewhere.
- **Descriptions:** `aria-describedby` for fields with helper text or errors.
- **Hidden from AT:** `aria-hidden="true"` only for purely decorative; never on focusable elements.

Document the per-component AT contract — extend the component-system spec.

### 4. Focus management rules

WCAG 2.2 introduced stricter focus appearance criteria (2.4.11, 2.4.12, 2.4.13).

- **Focus indicator:** 2px outline at offset 2px, color `border.focus`, never relying on color alone.
- **Contrast against background:** focus indicator vs adjacent background ≥ 3:1.
- **Not obscured:** focus indicator must not be hidden by sticky elements (e.g., a focused row near the bottom must not be obscured by a sticky footer — scroll into view, or constrain sticky height).
- **Focus appearance (2.4.13 AAA):** 2px solid perimeter; we adopt this as our standard regardless of AA/AAA target.

### 5. Color and contrast contract

For target WCAG level:

| Element pair | WCAG 2.2 minimum | Our target |
|---|---|---|
| Normal text on background | 4.5:1 (AA) / 7:1 (AAA) | [level-dependent] |
| Large text (≥ 18pt / ≥ 14pt bold) | 3:1 (AA) / 4.5:1 (AAA) | [level-dependent] |
| UI components and graphical objects (1.4.11) | 3:1 (AA) | 3:1 minimum |
| Focus indicator vs background | n/a | 3:1 |

Reference the design-tokens contrast verification table; every text-on-surface pair, border-on-surface, accent-on-surface, state-on-surface verified in light and dark mode.

**APCA note:** for newer products we recommend also verifying with APCA Lc 60+ for body text, Lc 75+ for fine text. APCA captures perceptual contrast better than WCAG 2.x but is not yet normative.

**Color independence (1.4.1):** never use color alone to convey meaning. Always pair with text label, icon, or pattern.

### 6. Target size contract (2.5.5 / 2.5.8)

- **Pointer:** ≥ 24×24 CSS px effective (WCAG 2.2 minimum, 2.5.8) for non-essential touch targets.
- **Touch:** ≥ 44×44 (iOS HIG) / 48×48 (Material) for touch surfaces.
- **Spacing exemption:** small targets are acceptable when surrounded by sufficient spacing.
- **Density mode adjustment:** compact density still respects 24×24 floor for pointer.

### 7. Motion and animation

- **Honor `prefers-reduced-motion: reduce`:** every animation has a fallback.
- **No flashing > 3 times per second (2.3.1):** verify no rapid flashes anywhere.
- **No vestibular triggers:** large parallax, full-page rotational motion, expansive zoom — only with reduced-motion fallback that disables.
- **Auto-playing motion:** auto-playing video / Lottie pauses on reduced-motion.

### 8. Form accessibility

- **Labels:** every input has a programmatic label (`<label>` or `aria-label` / `aria-labelledby`).
- **Required:** marked visually + with `required` attribute + announced.
- **Error association:** errors linked via `aria-describedby` and `aria-invalid="true"`.
- **Error announcement:** errors announced on submission via `aria-live` region or focus-to-first-error.
- **Helper text:** linked via `aria-describedby`.
- **Field grouping:** related fields in `<fieldset>` with `<legend>`.
- **Autocomplete attributes (1.3.5):** correct `autocomplete` values on personal data fields.
- **Accessible authentication (3.3.8 AAA):** support password managers (no paste-blocking), do not require uncommon cognitive function for sign-in (CAPTCHA must have alternative).
- **Redundant entry (3.3.7):** do not require re-entering data the user already gave in the same flow.

### 9. Names and instructions (1.3.5, 2.4.6, 3.3.2)

- Labels and instructions provided for inputs.
- Headings and labels descriptive (avoid generic "Click here", "More").
- Link text describes destination (avoid "Read more" without context, prefer "Read more about pricing").

### 10. Reflow (1.4.10)

Content reflows at 320 CSS px width without horizontal scroll (except for data tables, code blocks, and full-screen media).

### 11. Cognitive accessibility

Often missed. Critical for products serving children, students, neurodiverse users, low-literacy users, non-native speakers, or aged users.

- **Reading level target:** lock per product. Default: 8th-grade reading for consumer-facing copy. Specialist tools may target higher (10th–12th) but justify. Run Flesch-Kincaid or comparable on body copy.
- **Plain language:** prefer short sentences (< 20 words), active voice, common words, single clause.
- **Vocabulary:** use the persona language map; avoid jargon, idioms, region-specific phrases when global.
- **Progressive disclosure:** don't show advanced settings to novices; "Show more" / "Advanced" reveals.
- **Time-out policy (2.2.1, 2.2.6):** if a session has a timeout, warn user before expiry with extension option. Avoid auto-saves that confuse user state.
- **No timed pressure on tasks** unless essential (game / quiz / 2FA code).
- **Predictable navigation (3.2.3, 3.2.4):** consistent components do consistent things across screens.
- **Error prevention (3.3.4, 3.3.6):** for legal / financial / data-deletion actions, require confirmation; allow review-and-correct.
- **Glossary or inline definitions:** for unavoidable specialist terms, provide tooltip / glossary.
- **Avoid sensory overload:** simultaneously moving, color-shifting, audio surfaces are overwhelming for ADHD, autism, anxiety profiles. Provide reduced-stimulation mode if relevant.
- **Distraction-free mode:** for content-creation products, offer a focused view that strips chrome.
- **Symbols + text:** for low-literacy or non-native users, pair every key action with both icon and label.
- **Numeric input:** allow common formats (with or without commas; with or without spaces in phone numbers) and normalize server-side.

### 12. Voice control

Voice control users (Dragon, Voice Access, Siri shortcuts) need every interactive element to be uniquely addressable by name. Often missed when buttons are icon-only with the same `aria-label`.

- **Every interactive element has a unique, speakable name:** if there are two "Edit" buttons on a screen, give each a unique label ("Edit profile", "Edit avatar").
- **Visible label matches `aria-label`:** Voice Access (Android) and Voice Control (iOS) read visible text first; mismatch breaks "click [visible name]" commands.
- **Numbered overlays:** Voice Control / Voice Access offer numbered overlays on interactive elements when names aren't enough; ensure all interactive elements are exposed to AT so numbers appear.
- **No mouse-only interactions:** drag, gesture, scroll-jacking — voice can't easily replicate; ensure keyboard equivalent (which voice can trigger).
- **Common command-and-control commands work:** "click", "tap", "scroll down", "go back" should map naturally to the design.

### 13. Switch control

Single-switch and two-switch users navigate by automatic scanning or step scanning. Designs must support:

- **Sequential focus order matching visual order** (already required by keyboard contract, doubly required here).
- **Reachable in reasonable scan time:** if a user needs 40 switch presses to reach the primary action, the design has too many focusable items between entry and goal. Surface skip links and group-level focus targets.
- **No time-limited prompts** that scanning users can't reach in time.
- **Confirmation patterns adapted:** typed-confirmation patterns (typing a project name to delete) are switch-hostile; offer an alternative (hold-to-confirm with reduced-motion fallback, or two-step button confirm).

### 14. Per-persona end-to-end task walkthrough

Required at design time, not just QA. For each persona's primary task, simulate the full flow with their accessibility profile:

```markdown
### Walkthrough — [Persona] doing [Task] with [their a11y profile]

- **Entry point:** [URL / screen]
- **AT setup:** [NVDA + Chrome on Windows | VoiceOver + Safari macOS | TalkBack + Chrome Android | Keyboard-only | Voice Access | Switch]
- **Steps:**
  1. [Action] — predicted AT output: [what the user hears / sees] — friction: [any]
  2. ...
- **Did they complete the task?** Yes / Yes with friction / No
- **Where they would bounce:** [step]
- **Severity:** BLOCK / FIX-NEXT / ACCEPT
```

At minimum: one walkthrough per persona × their primary task, including at least one walkthrough where the persona uses AT.

This walkthrough output feeds the `visualforge-design-pressure-test` Pass F.

### 15. Reduce-X media queries

- **`prefers-reduced-motion`:** documented across motion subskill.
- **`prefers-reduced-transparency`:** disable glass / backdrop-filter; use opaque surfaces.
- **`prefers-contrast: more`:** increase contrast — bolder borders, higher-contrast text, remove subtle backgrounds.
- **`prefers-color-scheme`:** light / dark / no-preference handling.
- **`forced-colors`:** Windows high-contrast mode — respect system colors; use `forced-color-adjust: none` only where critical (e.g., brand color in logo).

### 16. Per-component accessibility audit

Append to the component-system docs: for every component, verify the accessibility contract is implementable with the chosen library. List any gaps in the chosen component library version that require workarounds.

### 17. Verification methodology

- **Automated:** axe-core run on every Storybook story; Lighthouse a11y score ≥ 95 on every route; pa11y CI on key flows.
- **Manual:**
  - Keyboard-only navigation pass through every flow.
  - NVDA + Chrome on Windows.
  - VoiceOver + Safari on macOS and iOS.
  - TalkBack + Chrome on Android.
- **Audit cadence:** every release; full audit before major launches.

### 18. Decision cards

- DEC-831 WCAG 2.2 level lock.
- DEC-832 Keyboard navigation contract.
- DEC-833 Screen reader contract.
- DEC-834 Focus management rules.
- DEC-835 Contrast verification target (WCAG + optional APCA).
- DEC-836 Target size policy.
- DEC-837 Reduced-motion, reduced-transparency, reduced-contrast policy.
- DEC-838 Form accessibility patterns.
- DEC-839 Cognitive accessibility — reading level, plain language, predictability, sensory-overload policy.
- DEC-840 Voice control compatibility — unique speakable names, visible label = aria-label rule.
- DEC-841 Switch control compatibility — focus order, scan budget, confirmation alternatives.
- DEC-842 Verification methodology.
- DEC-843 Per-persona end-to-end AT walkthrough.
- DEC-844 Known gaps and remediation plan (retrofit mode).

## Anti-slop accessibility rules

- "Accessible" without a level target fails.
- "We follow WCAG" without naming criteria fails.
- "Keyboard accessible" without a keyboard map fails.
- Color contrast unverified is a bug, not a guideline.
- `aria-label` everywhere is a misuse; prefer programmatic associations.
- Missing focus indicators is the #1 a11y failure — verify on every interactive element.

## Quality gate

- Level locked.
- Keyboard map complete.
- Screen reader contract per component.
- Contrast verification table validated.
- Touch / pointer target compliance.
- Reduce-X media queries supported.
- Per-component a11y contract appended.
- Verification methodology documented.

## Sources and basis

WCAG 2.2 normative, WAI-ARIA APG, platform-specific HIG accessibility sections, APCA where applicable. Every claim cites a criterion or guideline.
