---
name: specforge-ux-ui-content
description: Create UX, UI, content, typography, accessibility, component state, screen map, and frontend contract docs.
---

# UX, UI, and Content Contract Documentation


Shared references are available at `../_specforge-shared/references/` and templates at `../_specforge-shared/assets/templates/`. Use them when needed.

Global quality rules:

- Use `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material decisions.
- Do not ask non-blocking questions. Use researched defaults and record them in `auditability/decision-log.md`.
- When asking the user to choose what to do or what to use, give options, pros and cons, and a final recommendation.
- Read `../_specforge-shared/references/research-and-evidence-rules.md` before drafting or revising docs.
- Read `../_specforge-shared/references/anti-slop-quality-rubric.md` before drafting or revising docs.
- Ask only blocking questions. For choices, give a short recommendation with pros, cons, and why it fits this app instead of asking the user to design the solution from scratch.
- Use private structured reasoning and option-tree analysis. Do not reveal private chain-of-thought. Show only concise rationale, alternatives, tradeoffs, evidence, and final recommendation.
- Before finishing, run a no-shortcut check: verify the recommendation solves the root cause or underlying need, not only the easiest visible surface problem.
- Every important requirement must be specific, testable, and traceable to a user answer, repo evidence, official source, or explicit assumption.
- Every requirement must have an ID, source, affected role or component, data touched, risk level, verification method, and related docs.
- Every generated document must include `Sources and basis`, even when the source is only user input or repo evidence.
- Do not use placeholders, filler text, generic best-practice language, or broad claims that do not change implementation behavior.
- Use `Unknown` with an impact note when information is missing. Do not hide uncertainty with generic prose.
- Maintain a research ledger at `docs/app-plan/auditability/research-ledger.md` when research affects requirements.
- Keep naming consistent across docs: roles, features, entities, endpoints, components, events, and risks must use the same IDs and names.
- Produce documentation only unless the user explicitly asks for code changes.
- Choose the best maintainable, secure, testable, and reversible course of action. Do not choose shortcuts, workaround fixes, or vague placeholders.
- Apply the guided interview protocol in `../_specforge-shared/references/guided-interview-and-recommendation-protocol.md` and no-shortcuts protocol in `../_specforge-shared/references/no-shortcuts-decision-protocol.md` for material choices, recommendations, and user-facing questions.
- Use private multi-option deliberation for material decisions. Do not reveal private reasoning; output only decision cards, concise rationale, pros and cons, recommendation, confidence, and reversal triggers.
- Run root-cause analysis for conflicts, stale docs, missing requirements, weak decisions, risky shortcuts, and repo-document mismatches before proposing fixes.
- Prefer durable, standard-aligned solutions over quick fixes. If a temporary workaround is unavoidable, label it `Temporary`, explain the risk, define the proper fix, and set the removal trigger.
- Keep the scope proportional to the app. Avoid both under-specification and needless enterprise bloat.
- Label facts as User-confirmed, Repo-derived, Standard-backed, or Assumption.
- Do not invent facts, standards, versions, compliance duties, repo behavior, commands, dependencies, or API capabilities.
- If current research is available, use current official sources. If not, use the baked-in source map and say that online research was unavailable.
- If the app idea is illegal, harmful, abusive, or designed to bypass safety, privacy, age limits, laws, or platform rules, refuse to generate enabling docs and offer a safe alternative scope.
- For regulated domains, sensitive personal data, payments, child data, biometrics, medical, legal, or financial decisioning, flag the need for qualified review and produce defensive requirements only.


## Purpose

Produce UI and content contracts that make screens, components, states, typography, accessibility, and frontend behavior explicit before coding.

## Required research pass

Use this prompt:

```text
Research the newest official UI, platform, and accessibility guidance for [web/mobile/desktop/platform/framework]. Include W3C WCAG 2.2 for web accessibility, official platform human interface or material design guidance when applicable, and official framework docs for routing/forms/state. Capture versions and URLs.
```

## Inputs

- Product scope
- User roles
- User flows
- Data contracts
- Brand constraints, if any
- Platform constraints
- Existing components, if any

## Output files

Create or update:

- `docs/app-plan/product/04-user-flows-and-screen-map.md`
- `docs/app-plan/product/05-ux-ui-content-contract.md`

## User flow requirements

Include:

- Role-based flows
- Entry points
- Happy paths
- Error paths
- Permission denied paths
- Empty state paths
- Offline or degraded paths, if applicable
- State transition map

## Information architecture comes BEFORE the screen map — derive the inventory, don't document the sprawl

A screen map that starts from the screens that already exist will faithfully document sprawl. Derive the
page inventory from OUTSIDE the codebase first, then reconcile inward. Run these five steps in order,
before specifying a single screen.

**1 — Industry page inventory (research-first, primary sources only).** Read the ACTUAL documentation of
5+ comparable mature products and extract, verbatim with URLs: their complete top-level navigation in
real order; what each page contains; and where they put the recurring surfaces — activity/history,
artifacts (recordings/files/exports), admin audit log, team/users, billing, settings, integrations,
analytics, compliance/registration. Mark `NOT FOUND for <product>: <what>` rather than filling a gap with
a likely pattern. Also collect REAL user feedback on navigation — complaints ("buried", "too many
clicks", "had to go to three places", "can't find it") and praise ("everything in one place") — because
those name the failure modes the IA must design against. A surface **no** researched product has is
either a genuine differentiator or a mistake; decide which deliberately, never by accident.

**2 — Gap analysis.** One row per surface: what it is · which products have it · our state
(**Have / Partial / Missing / Rejected**) · the note. In any product past its first months, most
"Missing" rows are not unbuilt features — they are **built or approved things with nowhere to live**.
That is what sprawl actually is, and the gap table is what makes it visible.

**3 — Placement rule, stated once and applied consistently.** For every surface decide: a **PAGE** (its
own destination), a **SECTION** (nested in a hub), or **IN-PLACE** (drawer, side panel, expand-in-place
row, split pane). Default to in-place for *detail*: depth reached without navigation is the single
biggest usability lever, and mature products open detail beside the list rather than on another page.
**Never split the same data across two destinations** — that forces the product to teach users which one
to use, and it is a documented failure mode in shipping products. Settings split by SCOPE (personal /
workspace / product) inside ONE namespace beats a parallel `/admin` tree.

**4 — Object-oriented UX per page.** Specify each page as an OBJECT, not a layout:
**Object** (the one thing this page is about) → **Attributes** (what it shows) → **Actions** (what you can
do) → **States** (empty · loading · error · permission · degraded · terminal) → **Role scoping**. Prefer
scoping the **DATA, not the navigation**: same nav for everyone, contents narrow by role, and a section a
role lacks is hidden rather than dead-linked. A different nav (or a different app) per role multiplies
build, test, and support cost — adopt it only with a stated reason.

**5 — Nothing approved is homeless; nothing documented is fictional.** Every locked/approved design
artifact maps to exactly ONE page or section in the IA — an approved mock with no home is a silent drop.
And diff the documented routes against the ACTUAL router/registry: a screen map naming routes that do not
exist is worse than no map, because agents and humans build into fiction. Rewrite the map **in place**;
never leave the stale version behind a supersession note.

*Fail-state:* the page inventory was derived from the routes that happen to exist, so the map documented
sprawl instead of correcting it; an approved mock had no home; a role had no landing page; or the screen
map named routes the application does not have.

## Screen map requirements

For every screen:

- Screen name
- Route or navigation path
- User roles allowed
- Purpose
- Primary action
- Secondary actions
- Data displayed
- Data submitted
- Loading state
- Empty state
- Error state
- Success state
- Disabled state
- Permission state
- Analytics events
- Security and privacy notes

## A mock covers the WORST realistic case, not the best — granular empty states are mandatory

A mock built from the happy path is a wish list, and it hides exactly the work that makes a surface hard.
Every mock is rejected until it shows what the surface looks like when the data is thin, absent, stale, or
contradictory — because that is the state real users hit first and most often.

**1 — Granular empty states, not just the page-level one.** "No calls yet" is the easy one and it is not
sufficient. Every FIELD, ROW, SECTION and PANEL needs its own missing-data treatment, designed and shown:
a row whose lead has no name (only a raw number), a detail panel with no notes, no recording, no
disposition, no outcome; a section whose entire data source is unconfigured. The question to ask of every
element in the mock is *"what renders here when this is null?"* — and the answer must be in the mock, not
left to the implementer.

**2 — Minimum-information variant.** For any surface built around a rich object, mock the version where
almost nothing is known. In a dialer that is the **raw manual dial**: a phone number and nothing else — no
name, no company, no timezone, no list, no history. If the layout only works with a fully-populated
record, the layout is wrong, and that only becomes visible when the sparse variant is drawn.

**3 — Adverse and in-between states, not just success and empty.** Cover: partial data (some fields
known), stale/pending data (processing, awaiting provider, propagating), failed/unavailable (provider
down, permission denied, deleted-with-tombstone), degraded (a capability turned off), conflicting
(two sources disagree), and over-full (long names, 50 rows, a value that overflows its column). A state
that can occur in production and is not in the mock will be improvised in code by whoever implements it.

**4 — Show only what the system actually records.** Every field, badge, check, and status in a mock must
trace to something the product genuinely stores or computes — verified against the schema/contract, not
assumed from what a surface of this KIND usually shows. Inventing a plausible-looking row (a check we do
not perform, a field we do not persist) is the fabrication class: it reads as authoritative, it will be
implemented, and it makes a claim the system cannot back. Check the model before drawing the row.

**5 — Name the states in the handoff.** The mock's own state inventory is part of the deliverable: list
every state drawn and every state deliberately omitted with the reason. An unlisted state is an
unanswered question the implementer will answer alone.

*Fail-state:* a mock showed a fully-populated best case, so the sparse/partial/failed/degraded variants
were designed ad-hoc during implementation — or it displayed a field, check, or badge the system does not
actually record, which then got built as though it did.

## UI contract requirements

Define:

- Layout system
- Spacing scale
- Typography contract
- Color and contrast contract
- Icon rules
- Component inventory
- Component states
- Form behavior
- Validation message behavior
- Modal and dialog rules
- Navigation rules
- Responsive behavior
- Accessibility behavior
- Localization readiness

## Typography contract

Include:

- Font family policy
- Type scale
- Heading hierarchy
- Body text rules
- Line height rules
- Truncation rules
- Responsive type behavior
- Accessibility constraints

## Content contract

Include:

- Voice and tone
- Button labels
- Form labels
- Error messages
- Empty state copy
- Confirmation copy
- Permission-denied copy
- Loading copy
- Success copy
- Help text
- Dangerous action copy

Avoid vague copy like `Something went wrong`. Give user-safe, action-oriented messages without exposing internals.

## Accessibility contract

Include:

- Keyboard navigation
- Focus states
- Semantic structure
- Form labels
- Error association
- Color contrast
- Touch target size
- Reduced motion
- Screen reader names
- Accessible modals
- Skip links or landmarks for web apps

Use WCAG 2.2 as baseline for web apps.

## Existing repo mode

When a repo exists:

- Inventory existing screens, routes, components, design tokens, CSS variables, theme config, and component libraries.
- Update docs to reflect the actual UI system.
- Do not invent a new design system if one already exists.
- Record evidence paths.

## Quality gate

Before finishing, check:

- Every feature has a screen or explicit non-UI path.
- Every screen has state definitions.
- Forms have validation and error behavior.
- Accessibility requirements are explicit.
- UI docs match data and API contracts.

