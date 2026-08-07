---
name: frontend-design-director
description: "Global router for any visible frontend work, including mockups, Claude Design prompts, concepts, screenshots, landing pages, product dashboards, redesigns, audits, styling, responsive states, or implementation. Use this before selecting another design skill so the task follows the right design register, mock-approval gate, existing-system authority, and rendered-verification loop."
---

# Frontend Design Director

Route visible UI work through one coherent process. Do not let whichever design skill loads last become the design authority.

## Core contract

Before acting, announce a compact **design register**:

- Deliverable: mock/reference, design brief/prompt, implementation, redesign, or read-only critique.
- Surface: marketing/editorial, product application, mobile application, or visual asset.
- Authority: approved mock, existing design system, project rules, user stories, and source content in precedence order.
- Specialist stack: one process authority, one surface lens, one renderer or implementer, and one verifier.
- Approval state: required, pending, already approved, or exempt under an explicit project rule.

A Claude Design prompt, an image mockup, and a visual reference are design work. They are not exemptions from design routing.

## Authority order

When instructions conflict, follow this order:

1. The user's current direction and approved visual artifact.
2. Project and global mock-approval rules.
3. Existing product design system, components, tokens, information architecture, and content authority.
4. The selected surface-specific skill.
5. General design heuristics.

Never create a parallel design system. Never import a marketing-page rule into product UI merely because it sounds premium.

## Route by deliverable and surface

Choose the smallest specialist stack that covers the task.

| Request | Route | Important boundary |
|---|---|---|
| Claude Design brief, mockup, concept, or visual prompt | This skill -> existing project/product authority -> the surface-specific marketing or product lens -> Claude Design or the requested renderer | Produce the reference and stop at approval; do not implement visible code. |
| Landing page, portfolio, campaign, or editorial marketing surface | This skill -> `design-taste-frontend` -> existing brand system -> requested mock renderer or `imagegen-frontend-web` | Taste is a marketing/landing surface lens, not universal product-UI law. |
| Dashboard, admin, dense workflow, data table, analytics, or multi-step product UI | This skill -> existing product/design authority -> `product-ui-design-taste` -> Claude Design; use `frontend-ui-engineering` only after approval | The product skill is the craft lens. Do not invoke `design-taste-frontend` wholesale; its declared scope excludes product UI. |
| Existing surface redesign | This skill -> `redesign-existing-projects` -> correct marketing or product lens -> mock approval | Audit the current implementation before proposing a replacement. |
| Approved visual to code | This skill -> `image-to-code` when the image is authoritative, otherwise `frontend-ui-engineering` -> rendered verification | Preserve the approved reference and existing functional contracts. |
| Visual asset only | Appropriate image-generation or brand skill | Do not produce application code. |
| Read-only visual critique | Correct surface lens plus a rendered-surface verifier | Do not edit unless separately authorized. |

`ui-ux-pro-max` may supply research or pattern options when available. It is input, not the final design authority. `impeccable` is optional only when its context system is already active. Style packs apply only when the user explicitly selects that aesthetic.

Do not invoke a specialist merely because it is installed. If a specialist requires its own product/design context files and the project already has a different authority set, use the existing project authority and this director's process. Do not create or demand parallel `PRODUCT.md`/`DESIGN.md` files as a prerequisite unless the user or project has explicitly adopted that system.

## Workflow

### 1. Ground the problem

**Reuse before create — check the design-artifact registry FIRST.** Before creating any new mock, concept, or Claude Design brief, read the project's design-artifact registry for an existing mock of this surface/element/state (the approved/locked-surface registry AND the pending-mock/handoffs registry, wherever the project keeps them). A mock that already exists — approved *or* pending approval — is reused: an approved mock is the acceptance reference to build against; a pending mock is brought for approval, not re-created. Never conflate "not built in code" with "not mocked": a surface can be fully mocked and simply not yet coded. Producing a second mock for a surface that already has one is a parallel-system violation that burns an approval round and risks contradicting the locked design; if an existing mock is stale versus a newer decision, reconcile it in place (update + re-approve), never silently recreate it.

**A NEW multi-stage flow is researched stage-by-stage BEFORE you design it — never invented from memory.** When the deliverable is a user flow the user has not already approved — onboarding, signup, checkout, an account/setup sequence, any ordered set of screens — research how each stage is done in industry-standard comparable products before mocking: the stage SEQUENCE, each screen's COMPOSITION (which fields/actions belong on it, and which never share a screen — e.g. payment details are never collected on the same screen as name/email/password), and WHERE resource-provisioning / payment / verification / consent steps sit in the order. Build each stage to that researched standard and carry the patterns + sources into the brief (captured standard patterns to start from — verify freshness, then extend: [references/flow-stage-patterns.md](references/flow-stage-patterns.md)). Do not design flow composition, screen order, or field placement from your own head — that is how invented, non-standard flows ship (a blocking multi-step wizard where the market uses progressive setup; a card field beside the signup credentials). This is the flow-level instance of "reuse before create": the standard flow is the prior art you reuse, not a blank canvas. Scale the pass to stakes — a full stage-by-stage sweep for a new flow, a quick comparable-check for one added screen; a small addition to an already-approved flow using approved primitives needs no new sweep.

Read the product intent, user stories, current screenshots, relevant pages, shared shell, components, tokens, and two or three analogous in-product surfaces. Inspect both the visible surface and the data/actions that make it truthful.

For greenfield work, obtain equivalent brand, audience, content, and task evidence. If essential product choices remain open, surface them as product decisions rather than hiding them in visual styling.

### 2. Write the design brief

Define:

- the primary user and the job they must complete;
- the information hierarchy and density;
- a one-sentence visual thesis and interaction thesis;
- required controls, content, and empty/loading/error/success/permission states;
- named desktop and mobile viewports;
- existing tokens/components that remain authoritative;
- brief-specific forbidden patterns;
- what the designer may decide versus what must remain exact.

Use the templates in [references/process-and-prompts.md](references/process-and-prompts.md) for a Claude Design prompt, implementation handoff, or visual critique.

For dashboards and product workflows, `product-ui-design-taste` supplies the product design read, domain/signature pass, visual-meaning ledger, data/state rules, and hard rendered-quality gate. A product concept without that pass is not ready for Claude Design.

### 3. Explore before implementation

If the user has not approved a direction and the change is meaningfully visual, create three materially different concepts. Vary composition, hierarchy, density, interaction model, and visual thesis—not merely color or type.

Show the concepts or a self-contained Claude Design brief, record the selected direction, and stop until approval when the user's rules require it. A small addition using an already approved primitive may proceed only when the governing project rule explicitly permits that exception.

### 4. Implement the approved source of truth

Once approved:

- reuse current components and tokens before creating new ones;
- add missing primitives at their source rather than inlining leaf values;
- preserve source-to-screen behavior, authorization, accessibility, and interaction contracts;
- separate structure, craft/polish, and responsive passes;
- do not redesign unapproved neighboring surfaces.

### 5. Verify rendered output

Render at named desktop and mobile viewports. Compare screenshots against the approved artifact and inspect the real output, not a success status.

Run at most three visual-critic cycles. Each cycle must name the largest remaining mismatch, make a scoped change, and show monotonic improvement. Stop if a cycle does not improve the declared criterion.

Verify keyboard flow, focus, contrast, reduced motion, overflow, long labels, realistic data density, empty/loading/error/success/disabled/permission states, and touch targets where applicable. Functional tests must prove the controls still act on the intended source of truth.

### 6. Close the design-skill loop

Before finalizing, check whether the director selected the wrong specialist, a specialist produced or missed a proven failure, or the rendered critique exposed a reusable gap. If so, load `skill-evolution-loop` and patch the correct owner in the same task: project authority for project-specific decisions, the specialist skill for reusable craft/workflow guidance, this director for routing failures, or the verifier for false completion. Add a fail-state, regression mutation, and counterexample; then validate and forward-test the changed skill. Do not merely report the lesson. If no qualifying gap occurred, report `Skill-loop findings: none`.

## Anti-slop rules

Anti-slop is not a universal blacklist or a substitute for art direction.

- Start from a specific user, scene, and content hierarchy; do not start from component trends.
- For a major concept, make one justified, memorable design move. For a small/local change, inherit the approved product move without inventing a competing flourish. Do not decorate every section.
- Prefer real assets, real copy, and realistic states over generic gradients, card mosaics, fake metrics, and decorative chrome.
- Product applications need regulated emphasis: a calm, legible background with expression concentrated where task, state, or domain warrants it; density follows the job, and behavior remains predictable under stress.
- Marketing surfaces may be expressive, but each section must have a distinct job and the page must maintain one coherent visual thesis.
- Treat existing tokens and components as authority unless the approved design explicitly changes the system.
- If two specialist skills disagree, resolve the choice from the surface, user, and approved brief; do not blend both defaults.
- A NEW multi-stage flow (onboarding/signup/checkout/wizard) was mocked from memory instead of researched stage-by-stage to industry standard — an invented screen sequence, an off-pattern screen composition, or a field placed where no comparable product places it (payment collected on the signup-credentials screen). Research the stages first; the standard flow is prior art, not a blank canvas.

## Completion contract

Report:

1. the design register and selected authority stack;
2. the approved artifact or explicit approval checkpoint;
3. the surfaces and states reached;
4. rendered evidence at named viewports when code changed;
5. remaining mismatches or surfaces not reached;
6. the mutation that should break each material UI test.
7. skill-loop findings and any skill/routing improvement made.

Do not call visible work complete from compilation, a generated file, or a tool status alone.

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
