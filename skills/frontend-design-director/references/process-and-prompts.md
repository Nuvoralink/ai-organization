# Process and prompt templates

Use only the template that matches the deliverable. Replace bracketed fields with repo/product truth; do not leave placeholders in a final brief.

## Claude Design concept brief

```text
You are designing a visual reference in Claude Design. Do not write or modify production code.

Product and user
- Product: [product]
- Primary user: [user/persona]
- Moment and job: [what they are trying to accomplish now]
- Product intent: [outcome in plain language]

Authority
- Existing design system: [tokens, components, screenshots, approved references]
- Content/data that must remain exact: [source]
- Existing surfaces to match: [2-3 concrete surfaces]
- Project constraints: [approval, accessibility, framework, compliance, brand]

Required experience
- Information hierarchy: [ordered content]
- Primary action and supporting actions: [actions]
- Required states: [default, hover/focus, loading, empty, error, success, disabled, permission, long-content]
- Responsive targets: [named desktop and mobile viewports]
- Interaction thesis: [how the workflow should feel]

Explore three materially different concepts. They must differ in composition, hierarchy, density, and interaction model—not just color or typography. For each concept provide:
1. a short name and one-sentence visual thesis;
2. the primary layout and interaction decision;
3. why it serves this user and moment;
4. its strongest tradeoff;
5. the desktop reference and mobile adaptation.

Avoid: [brief-specific forbidden list based on the product, not a generic trend blacklist].
Designer latitude: [what Claude Design may decide].
Must remain exact: [what it must not reinterpret].

End with a compact comparison and recommend one direction. Stop after the visual concepts so the user can approve a direction before implementation.
```

## Approved-reference implementation handoff

```text
Implement the user-approved visual reference at [artifact/path/link]. Treat it as the visual source of truth.

Before editing:
1. inventory the current route, shared shell, components, tokens, data/actions, and all responsive consumers;
2. map deviations between the current render and the approved reference;
3. state what will change, what must not change, and the named viewports/states used for acceptance.

Implementation constraints
- Reuse [components/tokens] before creating anything new.
- Preserve [functional/data/auth/accessibility contracts].
- Add a missing primitive at its source; do not inline a one-off design value at the leaf.
- Do not redesign neighboring surfaces not shown or approved.

Verification
- Render and inspect [desktop viewport] and [mobile viewport].
- Compare screenshots with the approved reference.
- Exercise realistic, long-content, empty, loading, error, success, disabled, and permission states.
- Run no more than three scoped visual-critic cycles; each must improve a named mismatch.
- Run functional and accessibility checks whose failures would expose a real regression.

Report the rendered evidence, remaining mismatches, and surfaces not reached.
```

## Read-only visual critic

Score only against the declared brief and approved source; do not impose a personal style.

1. Product fit: can the intended user complete the primary job quickly and confidently?
2. Hierarchy: is attention allocated in the same order as task importance?
3. Composition: does the layout have a coherent rhythm, density, and focal structure?
4. System fidelity: are existing tokens, components, and interaction conventions respected?
5. Content truth: are labels, values, states, and actions realistic and sourced?
6. Responsive behavior: does the design recompose rather than merely shrink?
7. State coverage: are loading, empty, error, success, disabled, permission, and long-content cases designed?
8. Accessibility: keyboard, focus, contrast, motion, semantics, touch targets, and zoom.
9. Distinctiveness: is there one justified signature move without decorative noise?
10. Implementation fidelity: name the three largest visible mismatches with screenshot evidence.

Return findings in priority order, with the affected viewport/state and a concrete acceptance test. If no material finding exists, name the evidence inspected and the surfaces not reached.

## Research basis

This process reflects current first-party guidance and practitioner evidence:

- OpenAI recommends visual exploration with ImageGen before implementation for visually important apps and dashboards: https://learn.chatgpt.com/use-cases/idea-to-proof-of-concept
- OpenAI's UI-mock workflow treats normalized user stories, multiple visual variants, and the selected mock as implementation authority: https://learn.chatgpt.com/use-cases/user-stories-to-ui-mocks
- OpenAI's frontend workflow recommends reference screenshots, current components/tokens, and browser comparison at desktop and mobile sizes: https://learn.chatgpt.com/use-cases/frontend-designs
- OpenAI's frontend prompt guidance distinguishes quiet, work-focused product UI from marketing layouts and requires complete states and rendered verification: https://developers.openai.com/api/docs/guides/frontend-prompt
- Exact GPT-5.6 Sol practitioner reports favor three concepts, guided variants, selection, and only then implementation: https://www.reddit.com/r/OpenaiCodex/comments/1uszogd/looks_like_56_sol_upped_the_uiux_game/
- The upstream Taste Skill routes image references and implementation through separate specialist skills: https://github.com/Leonxlnx/taste-skill/blob/main/README.md
