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

