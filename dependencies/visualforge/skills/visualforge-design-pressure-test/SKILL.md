---
name: visualforge-design-pressure-test
description: Post-generation pressure test of the generated design. Heuristic evaluation, persona walkthroughs, edge-case / failure-mode / adversarial sweeps, cognitive load scoring, brand coherence, implementation feasibility, future-shift robustness, and multi-expert review simulation. Surfaces findings as a triaged severity report — not just doc audit.
---

# Design Pressure Test (Red Team)

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`.
- Use `opinionated-decision-template.md` for any decision change recommended.
- This subskill pressure-tests the **generated design**, not the documentation. `visualforge-design-qa` audits the docs; this audits the *design quality itself*.
- Findings are severity-rated and triaged (block / fix-next-release / accept).
- Maintain `decision-log.md`.

## Purpose

A complete document set can still describe a mediocre design. This subskill simulates expert review, persona walkthroughs, edge cases, failure modes, and adversarial use. It's the final gate before declaring the design good — not just complete.

## When this runs

- **Per-phase mini mode** (v1.1 — per VF-FIND-003): at every phase boundary (foundation → visual-language → structure → interaction → quality → handoff), the orchestrator invokes this subskill with `partial=phase-N` to run a fast 4-pass subset against just the phase's outputs. Catches issues at their source rather than at end-of-run.
- **Full mode**: after `visualforge-design-qa` passes (docs are complete and consistent). Runs all 12 passes.
- **Before** `visualforge-agent-rules-update` (so any flagged design changes can be made before rules are locked).
- **On demand** any time: `Use $visualforge-design-pressure-test to red-team the current design` or `Use $visualforge-design-pressure-test partial=phase-3 to mini-test phase 3 outputs`.

## Per-phase mini mode (v1.1 — VF-FIND-003)

Invoked at every phase boundary by the orchestrator. Runs only 4 of the 12 passes, scoped to the phase's outputs:

| Mode | Passes run | Time budget |
|---|---|---|
| `partial=phase-1` (foundation) | A (heuristic, on persona / IA-trends docs), I (brand coherence on brand attributes), L (multi-expert top-2 on each foundation doc) | < 5 min |
| `partial=phase-2` (visual language) | A (heuristic, on tokens / surfaces / icons), I (brand coherence — sample), C (edge cases for color / type / motion at extremes), L (multi-expert top-2) | < 5 min |
| `partial=phase-3` (structure) | A (heuristic on IA / layout / mobile / i18n), C (edge cases at breakpoints / browser zoom / device classes), I (brand coherence — sample), L (multi-expert top-2) | < 5 min |
| `partial=phase-4` (interaction) | A (heuristic on flows / components / content), B (persona walkthroughs — 1 per primary persona × 1 critical task per persona), C (edge cases for empty / error / network), L (multi-expert) | < 10 min |
| `partial=phase-5` (quality) | F (a11y usability — keyboard + screen reader only, deferred AT walkthroughs to Phase 6 full mode), G (perf lens — token cost only) | < 5 min |
| `partial=phase-6` (handoff) | J (feasibility), K (future-shift) | < 5 min |

### BLOCK findings at phase boundaries

- Surface to user before proceeding to next phase.
- Auto mode: attempt source-fix once; on second occurrence, escalate.
- Loop limit of 2 iterations per finding at phase boundary (vs 3 at end-of-run); designed to catch and fix cheaply.

### Full mode is unchanged

The 12-pass full mode runs at end of Phase 6 as before. It cross-references all per-phase mini reports and adds the passes not yet run (Pass D failure modes; Pass E adversarial; Pass H cognitive load; full Pass F a11y AT walkthroughs).

## On-demand invocation

The user can invoke at any time:

```
Use $visualforge-design-pressure-test                          → full 12-pass mode
Use $visualforge-design-pressure-test partial=phase-N          → mini mode against phase N's outputs
Use $visualforge-design-pressure-test partial=current          → mini mode against everything since last phase boundary
```

On-demand invocation honors the same BLOCK/FIX-NEXT/ACCEPT/WATCH triage and the same loop-back mechanism.

## Loop-back mechanism

This subskill is not a one-shot audit. BLOCK findings trigger orchestrator-driven revision per `visualforge` orchestrator's "Pressure-test feedback loop" section:

- Each BLOCK finding maps to an upstream subskill responsible for the affected layer.
- The orchestrator invokes that subskill in revision mode with the finding as input.
- Affected downstream subskills cascade-revise.
- `design-qa` and `design-pressure-test` re-run.
- Loop until GOOD or GOOD WITH NOTES, with a 3-iteration ceiling before user escalation.

Findings tagged with the upstream subskill suspected to own the fix:

```markdown
### Finding F-NNN — [name]

- **Pass:** [A through L]
- **Severity:** BLOCK / FIX-NEXT / ACCEPT / WATCH
- **Description:** ...
- **Affected:** [screens / components / personas]
- **Suspected upstream owner:** [subskill name]
- **Proposed revision:** ...
- **Decision card to add (if accepted):** DEC-NNN
```

## Inputs

- All generated design docs.
- All token files.
- Decision log.
- Personas + journey maps.
- Component system + screen specs.
- Data inventory (retrofit / specforge-enhanced).
- Performance budget.

## Output files

- `docs/design-system/07-quality/design-pressure-test-report.md` — full findings, severity-rated.
- Updates to `auditability/design-quality-review.md` summarizing top issues.
- Decision-log entries (DEC-1100 to DEC-1199, overflow DEC-1200 to DEC-1219) per `../_visualforge-shared/references/decision-id-allocation.md`. When BLOCK findings drive revisions, the actual revision decisions live in the *upstream* subskill's range (not this one); this subskill only logs the verdict + persona/triage decisions.

## Pressure test passes

Run all passes. Findings are surfaced with severity:

- **BLOCK** — must fix before launch / release. Design is broken for a primary persona, fails accessibility target, has security implication, or contradicts brand foundation.
- **FIX-NEXT** — should fix in next iteration. Friction, inconsistency, or limited persona impact.
- **ACCEPT** — known limitation, accepted with rationale.
- **WATCH** — not a problem now, but could become one.

### Pass A — Heuristic evaluation

Apply Nielsen's 10 heuristics + modern additions to every primary screen and flow. Also apply the visual-default-breaker pre-output checklist (`_visualforge-shared/references/visual-default-breakers.md` §"Pre-output checklist") to every marketing / hero / brand surface in scope.

1. **Visibility of system status** — does the design always tell the user what is happening (loading, saving, success, error)? Check every async path.
2. **Match between system and real world** — is the language users' language, the metaphors users' metaphors?
3. **User control and freedom** — undo, cancel, escape from any state, including destructive ones.
4. **Consistency and standards** — same components, same tokens, same patterns across screens. No surprise variants.
5. **Error prevention** — confirmations for destructive actions, validation before submission, irreversible operations gated.
6. **Recognition rather than recall** — visible labels, persistent navigation, no hidden state user must remember.
7. **Flexibility and efficiency of use** — keyboard shortcuts for power users, defaults for new users.
8. **Aesthetic and minimalist design** — does any screen show data the user doesn't need? Any chrome that adds no value?
9. **Help users recognize, diagnose, recover from errors** — every error gives the user a real next step.
10. **Help and documentation** — discoverable help, contextual where possible.

Modern additions:

11. **Performance perceptibility** — does the design feel fast? Skeleton states, optimistic UI, perceived performance.
12. **Privacy by default** — does the design respect user data, minimize collection, surface consent?
13. **Reduce-X awareness** — reduced-motion, reduced-transparency, reduced-data states all designed.
14. **AI transparency** — when AI-generated, when streaming, when uncertain, when citing sources.

For each heuristic, walk every primary screen and surface violations.

### Pass B — Persona walkthrough

For each persona × each primary task, simulate the walkthrough cold:

```markdown
### Walkthrough — [Persona] doing [Task]

**Context:** [device, network, lighting, mental state]
**Entry point:** [where they start]

**Step 1:** [observation]
- Friction: [what slows them down]
- Risk: [what they might misinterpret]
- Accessibility check: [does their a11y profile work here?]

**Step 2:** ...

**Did they complete the task?** Yes / Yes with friction / No
**Where would they bounce?** [step]
**What's missing for them?** [feature / clarity / accessibility]
**Severity of friction:** BLOCK / FIX-NEXT / ACCEPT
```

At minimum cover:

- Each persona's #1 task (3–5 walkthroughs).
- The most-frequent failure-prone task (signup, payment, share, etc.).
- An accessibility-profile-specific task (e.g., NVDA user creating a project).
- A first-time-ever-using-the-product walk.

### Pass C — Edge case sweep

For each component / screen / flow, ask:

- What if the data is empty / one item / many items / many many items (1k+)?
- What if a string is 1 char / 1000 chars / contains emoji / contains RTL?
- What if a number is 0 / negative / NaN / Infinity / very large / many decimals?
- What if a date is far past / far future / invalid / in a different timezone?
- What if a URL is malformed / very long / contains query params?
- What if an image is missing / broken / wrong aspect ratio / very large file?
- What if a user has no name / no avatar / no permissions?
- What if a list is currently filtered to zero / paginated to last page / sorted by unusual key?
- What if network is slow / flaky / offline mid-action?
- What if two users edit at once / a session expires mid-form / a tab is duplicated?
- What if storage quota fills / clipboard is restricted / fullscreen is denied?

Findings: any screen / component that doesn't gracefully handle an edge case.

### Pass D — Failure mode sweep

For each external dependency and async operation, what happens when it fails?

- API down → recoverable error with retry?
- API slow → progressive rendering or timeout?
- API partial → handle missing fields?
- API new fields → handle gracefully, don't break?
- API removed fields → handled at consumer?
- DB write failure → optimistic UI rollback?
- File upload mid-fail → resumable?
- Auth token expired mid-action → in-context re-auth, preserved work?
- Browser tab loses focus mid-async → resume on focus return?
- Offline mid-action → queue and sync?
- Push notification permission denied → fallback?
- Geolocation denied → fallback?
- Storage denied → fallback?
- Payment failure → clear recovery, don't double-charge?

For each: is the design graceful?

### Pass D cross-reference (v1.1 — per VF-FIND-009)

Pass D MUST cross-reference the IA session-state edge case map (`03-structure/information-architecture.md` §"Session-state edge case map"). For each failure mode above:

1. Is the corresponding case in the IA map?
2. If yes — does the design implementation match the IA-documented behavior?
3. If no — this is a **FIX-NEXT finding for IA revision**, not just a design-pressure-test finding. The IA map should have included it; bouncing it to IA forces the right ownership.

Failure modes that **must** appear in the IA map (per VF-FIND-009):
- Session expired mid-action
- Role revoked mid-session
- Resource deleted mid-session
- Resource archived mid-session
- Multi-tab session conflict
- Token-gated link expired (invite / password-reset / magic-link / verify-email)
- Rate-limited mid-action
- Plan-state change mid-session

If any of these eight are missing from the IA map, surface as a finding owned by `visualforge-information-architecture`, not a Pass-D-internal finding.

### Pass E — Adversarial use

A user is hostile, careless, or malicious. Does the design defend?

- **Spam input:** does form validation prevent garbage submission?
- **Account takeover:** does sensitive action require re-auth?
- **Rate abuse:** does the design surface rate limits gracefully?
- **Content harm (UGC products):** is reporting / moderation in the design?
- **Dark patterns:** does the design have any? (Confusing cancel flows, hidden costs, fake urgency, opt-out instead of opt-in). Catch and recommend removal.
- **Phishing surface:** any redirect / email pattern that could be impersonated?
- **Confusion attack:** can a user be tricked by a similar-looking screen?
- **Auto-pay traps:** is subscription cancellation as easy as signup?
- **Manipulative defaults:** do defaults serve the user or the business?

### Pass F — Accessibility usability (not just compliance)

WCAG passing is necessary, not sufficient. Test real usability:

- **NVDA + Chrome (Windows):** can a blind user complete every primary task?
- **VoiceOver + Safari (macOS / iOS):** can a blind user navigate the product?
- **TalkBack (Android):** can a blind user on Android?
- **Keyboard only:** without mouse, every action reachable in a sensible focus order?
- **Voice control (Dragon / Voice Access):** are all interactive elements labeled and uniquely addressable?
- **Switch control:** can a single-switch or two-switch user complete primary tasks?
- **Magnification (200% zoom OS-level):** does layout hold?
- **Reduced motion / transparency / contrast:** do experiences degrade gracefully?
- **Cognitive load:** is any screen overwhelming? Does progressive disclosure exist?
- **Reading level:** is content readable at target reading level (typically 8th grade for consumer, 10th–12th for professional)?

### Pass G — Performance lens

For each primary screen, estimate against the budget:

- LCP element: is it cheap? (Image weight, font load, JS-blocking)
- INP-heavy interactions: any expensive computation on tap / click?
- CLS risk: any element that loads with shifted dimensions?
- Animation cost: any animation on layout properties? Any animation running > 60fps?
- Bundle size: any screen requiring uncommon dependencies on initial load?

Estimate fit; flag overshoots.

### Pass H — Cognitive load lens

For each screen, score cognitive load:

- **Number of primary actions:** ideal 1, acceptable 2–3, overload 4+.
- **Number of distinct sections:** ideal 1–3, overload 5+.
- **Distinct data densities:** if a screen has both dense data + spacious marketing-style content, that's a load tax.
- **Decision points:** how many choices does the user face?

For each "overloaded" screen, propose split / simplification / progressive disclosure.

### Pass I — Brand coherence

Sample 5–10 random screens. Do they feel like the same product?

- Same surface treatment (cards / glass / flat consistent)?
- Same motion personality (restrained vs expressive consistent)?
- Same iconography (style + weight consistent)?
- Same voice in copy (warm vs direct consistent)?
- Same component vocabulary (no surprise primitives)?

Drift in any axis = finding.

### Pass J — Implementation feasibility

Walk the design through a hypothetical build:

- Can every component be implemented with the chosen library + framework?
- Are any layout patterns CSS-untrivial (e.g., subgrid required, animation-timeline required) on browsers in support window?
- Is any animation jank-likely on target device tier?
- Is any data display requiring an aggregation the backend doesn't provide (cross-check `backend-gaps.md`)?
- Are any third-party services required (image CDN, ESP, push provider) not yet selected?

### Pass K — Future-shift robustness

How robust is the design to product evolution?

- If a new persona joins (e.g., admin role, viewer role) — does the IA accommodate?
- If a new feature is added (common product expansion) — where does it go?
- If the product internationalizes — does the design hold?
- If the product adds mobile native — do tokens / components port?
- If the product is acquired / rebranded — what blocks?

Robustness rating per axis: High / Medium / Low.

### Pass L — Multi-expert review simulation

Imagine eight expert reviewers and surface what each would say. Their lenses catch different things:

- **Senior product designer:** UX, IA, flow optimization, persona fit, cognitive load.
- **Senior frontend engineer:** feasibility, perf, maintainability, framework fit, type safety.
- **Accessibility expert:** real-usability AT, cognitive a11y, low-vision, motor, vestibular, comprehension.
- **Brand designer:** voice cohesion, visual identity strength, distinctiveness, signature moments.
- **Target user (the primary persona):** would they enjoy this? Trust it? Recommend it?
- **Adversarial reviewer / red team:** what fails, what's exploited, what's dark-patterned?
- **Visual-direction critic (added per VF-FIND-038):** applies `_visualforge-shared/references/visual-default-breakers.md` end-to-end. Calls out:
  - Hero that defaults to text-left / image-right without justification.
  - Hero Scale that "splits the difference" instead of committing.
  - H1 that wraps past 3 lines.
  - Multi-section pages using fewer than 3 composition anchors.
  - Pages with no full-bleed / atmospheric background section (non-minimalist briefs).
  - Banned gradients in use (purple-to-blue AI, pink-to-orange creator, rainbow / mesh).
  - Meta-label slop (`SECTION 01`).
  - KPI slop on pages that aren't about numbers.
  - Decoration with no purpose.
  - Missing narrative spine in execution.
  - Missing second-read moment, or more than one.
  - Visual-direction lock commitments not honored.
- **React-product-fit critic (added per VF-FIND-038):** applies `visualforge-frontend-contract` §17. Calls out:
  - Components missing server / client boundary declarations.
  - Forms specified without a form library.
  - State that would naturally live deep in the tree being lifted to root for no reason.
  - Data fetches in `useEffect` instead of the framework's data primitive.
  - Component specs that don't name their data dependencies or error boundaries.
  - Core functionality hidden on mobile.
  - Essential actions gated by hover.

For each, surface the top 3 things they would call out. Together these eight lenses cover decision-quality (PD), implementation-quality (FE + React-fit), real-usability (a11y), brand-integrity (brand + visual-direction), trust (target user), and security (red team).

## Report format

```markdown
# Design Pressure Test Report

## Overall verdict
GOOD / GOOD WITH NOTES / NEEDS WORK / NOT READY

## Top BLOCK findings
- [finding] — severity BLOCK — affects [persona/screen/component]
  - Why it blocks: ...
  - Proposed fix: ...
  - Decision card to add: DEC-NNN

## Pass A — Heuristic evaluation
[findings table]

## Pass B — Persona walkthroughs
[per-walkthrough findings]

## Pass C — Edge case sweep
[findings table]

## Pass D — Failure mode sweep
[findings table]

## Pass E — Adversarial use
[findings table]

## Pass F — Accessibility usability
[findings table]

## Pass G — Performance lens
[findings table]

## Pass H — Cognitive load lens
[findings table]

## Pass I — Brand coherence
[findings table]

## Pass J — Implementation feasibility
[findings table]

## Pass K — Future-shift robustness
[axis ratings]

## Pass L — Multi-expert review
- Senior PD: [top 3]
- Senior FE: [top 3]
- A11y expert: [top 3]
- Brand designer: [top 3]
- Target user: [top 3]
- Red team: [top 3]
- Visual-direction critic: [top 3]
- React-product-fit critic: [top 3]

## Triaged action plan
- BLOCK (N): [items]
- FIX-NEXT (N): [items]
- ACCEPT (N): [items + rationale]
- WATCH (N): [items + trigger to revisit]
```

## Decision cards

- DEC-1160 Overall verdict.
- DEC-1163 Top BLOCK findings → cascade into ideal design fixes.
- DEC-1166 FIX-NEXT backlog priority.
- DEC-1169 Accepted limitations.
- DEC-1172 WATCH list.

## Anti-slop pressure-test rules

- "Looks good" without per-pass findings — fails.
- A pass that returns zero findings on the first run — re-examine; design rarely emerges flawless.
- "Trust the personas, they pass" without naming the path step-by-step — fails.
- "Brand feels coherent" without sampling random screens — fails.
- Avoiding the adversarial pass because "we're a friendly product" — fails. Dark patterns slip in unconsciously.

## Quality gate

- All 12 passes run.
- Findings triaged with severity.
- BLOCK findings drive design changes before completion.
- Verdict locked.
- Multi-expert review summary present.

## Sources and basis

Heuristic basis: Nielsen 10 + Schneiderman 8 + modern web research. Persona walkthrough basis: usability test methodology. Accessibility lens: WCAG 2.2 + real assistive technology behavior. Multi-expert simulation: domain literature for each role.
