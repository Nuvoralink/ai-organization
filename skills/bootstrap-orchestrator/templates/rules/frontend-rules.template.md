---
paths:
  - "{{FRONTEND_DIR}}/**/*"
---
<!-- TEMPLATE: frontend rule. GENERATE ONLY FOR PRODUCTS WITH A FRONTEND. Save as {{RULES_DIR}}/frontend-rules.md (or .mdc). FILL/prune. -->

# {{PROJECT}} Frontend Rules

Purpose: keep the frontend consistent, reusable, testable, and predictable for both humans and AI agents.

Before any non-trivial frontend change, read {{FRONTEND_BLAST_RADIUS_DOC}} (when populated) to identify connected pages, shared primitives, registry entries, hooks, API helpers, and visual smokes that must be inspected with the visible surface.

## Visible frontend changes are mockup-first + approval-gated (blocking)
Anything that shows up in the frontend is mocked in Claude Design → shown to the user → approved → THEN coded. The order is fixed and blocking; Figma is not the active workflow. Pure infrastructure with no visible surface (tokens, build config, types, data plumbing) is exempt until it changes something visible. {{LOCKED_SURFACES_CLAUSE}} <!-- FILL if the project has locked surfaces: "Some surfaces are user-approved and locked in {{LOCKED_SURFACES_DOC}}; the approved mock is the acceptance reference — deviating from it is a bug, and a visible change is mockup-first + re-approval." -->

Before creating, changing, mocking, prompting, or critiquing a visible surface, load the user-level `frontend-design-director` skill and declare its design register and specialist stack. A Claude Design prompt, visual brief, image mockup, or reference counts as design work. Route landing/marketing surfaces to the marketing taste lens and product dashboards/workflows to the product-UI stack; never force landing-page rules onto application UI or stack contradictory design skills. *Fail-state:* a visual deliverable bypassed the director because it was “only a prompt/mock,” or implementation began before approval.

## UI copy serves the user's task — never internal narrative (blocking)
Every word on a user-facing surface serves the user's immediate task. Never render internal narrative into the product: design rationale, authority-boundary reasoning, how/why-it-was-built exposition, mechanic narration, or roadmap/teaser text ("coming soon", "— later"). Those live in the brief/docs/chat, not on the user's screen. Mockups are held to the same bar. This is the copy-discipline sibling of the centralization copy gate.

## Show what serves the task — never plumbing in the name of "honesty" (blocking)
Every element must be actionable, decision-driving, or explain a real current state the user is experiencing. A value that is none of those is noise — dressing it as "transparency" doesn't make it belong. If it's always the same / always-green / platform-or-carrier-handled and the user can't change it, it's plumbing — hide it; put the detail on the surface that owns the action and link to it.

## Layout, scroll & IA — pages compose, never reinvent
Authority: {{LAYOUT_IA_DOC}}.
- **The app shell owns scrolling, not pages.** The shell defines the one full-height frame + the single main scroll container; page/feature code never sets `height: 100vh/svh/dvh`, `overflow: auto/scroll`, or `position: fixed` for layout — the layout gate flags it.
- **Every page header carries the ONE shared header surface** (token background + hairline + blur + sticky). A transparent hand-rolled header that bleeds content under it is a bug — the header-surface gate flags it.
- **No info dumping.** Tiered model: Tier 1 visible (identity + primary fact + primary action), Tier 2 demoted (summarized), Tier 3 disclosed (tab/accordion/drawer/route). Never a wall of equal-weight fields.
- **Same object → same structure everywhere.** One shared composite per object, not reinvented per page.

## Responsive is layout-mode redesign — never dimension-fiddling (blocking)
Full standard: {{RESPONSIVE_DOC}} <!-- FILL: the project's responsive-design doc (sibling of the layout/IA doc — that owns scroll/IA, this owns responsive composition). Generate it from the dialer's docs/design-system/responsive-design.md shape: §1 breakpoint scale (ONE token source), §2 layout-mode contracts + a worked example, §3 adaptation-pattern catalog, §4 ban + repair ladder, §5 intrinsic-first rules, §6 process + gate, §7 canonical offenders as the project accumulates them. -->
- **Every visible surface declares a responsive CONTRACT** — a per-band layout **MODE** (phone · tablet · laptop · desktop at {{BREAKPOINTS}}) and what STRUCTURALLY changes between bands. A surface is **not "the desktop layout, smaller"** — crossing a breakpoint switches **composition** (multi-pane → tabs/drawer/sheet; table → cards; nav rail → bottom tab bar; modal → sheet), it never merely shrinks. The surface root carries a `data-layout-mode="…"` attribute so the rendered verifier can assert the mode actually switched. A visible change is **mockup-first** and the mock ships **all breakpoint states + the contract table** (a mock without its phone state is incomplete). The dispatch brief carries the contract **verbatim**, never paraphrased.
- **The dimension-fiddling BAN.** When a surface breaks at a breakpoint (misalignment, overlap, overflow, clipped content), these are FORBIDDEN as a first response: nudging px heights/widths/margins until it "fits"; `overflow:hidden` to clip the symptom; `transform: scale()`; negative margins; `z-index`/`!important` stacking; a hardcoded per-breakpoint px dimension. The REQUIRED response is the **repair ladder**, in order, and every fix **names the rung**: **(1) MODE** — is this band in the right layout mode per the contract? (most "alignment bugs" are a desktop composition squeezed into a phone — the fix is a mode switch = a mockup-first redesign for that band); **(2) INTRINSIC** — replace fixed sizing with `fr`/`minmax(0,…)`/`auto`/`clamp()`/`aspect-ratio`/`gap`/content-height; **(3) CONTENT CONTRACT** — `min-width:0` + truncate/line-clamp with a stated contract, priority-based hiding with an affordance to reach the hidden content; **(4) token micro-adjust** — last, and only via tokens. *Fail-state:* a breakpoint bug "fixed" by editing dimensions in page code without naming the rung — the same class returns on the next content change or viewport, because the layout is still the wrong mode wearing adjusted dimensions.
- **Intrinsic-first hard rules:** no fixed heights on layout containers in page code (heights emerge from content; exceptions live in primitives); flex/grid children carrying text get `min-width:0` (grid tracks `minmax(0,…)`) + a truncation contract; **`dvh` never `vh`**; `env(safe-area-inset-*)` on fixed/sticky edges; touch targets **≥44×44** px on phone/tablet; `16px` inputs on phone (iOS zoom); media = `aspect-ratio`+`object-fit`+fluid width, never a fixed w+h pair; display type via `clamp()` from the token source; **mobile-first** build order (author the phone band first, layer larger bands up) — a desktop-only surface must be **declared** in the contract, not assumed.
- **Responsive inputs are independent authorities.** A panel whose width changes by band never measures its own rendered width to choose that band (self-referential oscillation); observe the stable host/container. If the host width is initially unknown, withhold the dependent composition until a pre-paint layout measurement exists—do not mount a convenient desktop band and flip after paint. The rendered proof records the FIRST mounted mode plus a bounded stability window.
- **Process:** the `ui-verifier` lens runs before merge on any visible change (overflow / overlap / tap-targets / clipping / mode-attribute at every breakpoint — the lens the static gates can't provide); where the project wires a mechanical responsive gate, it backstops the un-adapted-layout + fixed-dimension shapes at edit time (WARN-only until clean, per-rule promotion).

*Fail-state:* a surface was made responsive by shrinking the desktop layout and nudging dimensions until it fit, instead of composing a distinct layout mode per band; or a visible responsive change was coded without an all-breakpoint mock + approval; or a breakpoint bug was patched with a px nudge and no named ladder rung.

## API usage
Don't call `axios`/`fetch` directly from components; no raw endpoint strings in components. New API access goes through the frontend API module (which routes through the endpoint registry). Explicit request/response typing.

## Primitives + testids
Reuse shared primitives before creating new ones (buttons, badges, cards, page headers, loading/empty/error states, form controls, toasts). {{PRIMITIVES_SPEC_CLAUSE}} Every primary + hotkey-bound action has a stable `data-testid` (kebab-case-action); the testid-passthrough gate enforces that hand-rolled primitives forward a consumer's `data-testid`.

## State handling + real-time correctness
Always handle loading / success / empty / error / retry. Never leave the user in an ambiguous "—". Real-time surfaces reconnect and show an honest "stale — reconnecting" rather than silently freezing (a frozen counter that lies is worse than one that admits it). Honesty states are the rare real-outage case, not the default reached for instead of building it to work.

## Auth, a11y, dead code
- Frontend gating is UX only — never proof of authorization; privileged/scoped behavior is enforced server-side. Derive role/plan UI from typed user state, not scattered string comparisons.
- Semantic elements; real `<button>`/`<a>`; `:focus-visible`; `prefers-reduced-motion` honored; keyboard-reachable (users live on the keyboard).
- **Before adding an interactive control, name the state/action its value drives.** If the value flows nowhere yet (backend not wired), render it READ-ONLY or OMIT it — never a live-looking no-op. (A control whose value flows nowhere needs data-flow analysis the static gates can't do — it's a build-time self-check + a dispatch-brief checklist item.)

## Test harness — one shared render helper per heavily-mounted surface
When many test files mount the SAME surface (a page, app shell, cockpit), do NOT hand-roll the provider/context stack per file. Centralize it in ONE shared render helper (`renderX(opts?)` + an `XProviders` component) that owns the provider stack; each suite routes its render through it and keeps only its own per-case overrides. **Provide new page-level context deps as REAL context** (`<Ctx.Provider value={testValue}>` — export the context object if it's module-private, a zero-runtime change) — NOT a `vi.mock('…Context')` repeated in every file. A `vi.mock` is hoisted per-file and can't be centralized, so mocking the context re-creates the cascade it's meant to kill: the day the surface gains a new context dependency, every file that hand-rolled the stack breaks at once and takes the identical patch. **Scope line:** the helper owns the STACK only — leave each suite's own hook/SDK/api `vi.mock`s (hoisted per-file, vary meaningfully per suite; unifying them flattens real differences). Name the helper `renderX.tsx` (not `*.test.tsx`) so the runner + intent gate skip it. *Fail-state:* a new test for a heavily-mounted surface hand-rolls the provider tree (or a page-level-context `vi.mock`) inline instead of routing through the shared helper.

Browser/source-to-screen harness configuration has one authority for host/port/origin and derives the server command plus request boundary from it. Locked-reference proof must boot the CURRENT approved design through its real runtime and assert visible, non-zero geometry anchors; a hidden raw template, retired mock path, or copied parallel reference is not evidence. Expected modes/geometry come from an independent contract table or approved artifact, never solely from importing the production classifier whose drift the test is meant to catch.

## Frontend definition of done
Blast-radius doc checked (+ updated if a relation exposed); primitives reused; no API logic in presentation; testids for key actions; loading/empty/error considered; explicit types; UI reflects backend truth (invents no client-only assumptions); real-time surfaces handle reconnect/stale/missed-event.
