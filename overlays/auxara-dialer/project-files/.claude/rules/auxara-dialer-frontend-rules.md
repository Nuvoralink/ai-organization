---
paths:
  - "frontend/**/*"
---
# Auxara Dialer Frontend Rules

Purpose: keep the frontend consistent, reusable, testable, and predictable for both humans and AI agents.

Before any non-trivial frontend change, read `frontend/docs/FRONTEND_BLAST_RADIUS.md` (when populated) and use it to identify connected pages, shared primitives, registry entries, hooks, API helpers, visual smokes, and guardrails that must be inspected with the visible surface. The most critical frontend surfaces in this product are:
- the **booker softphone / call card** (highest interaction frequency, hotkey-driven)
- the **manager wallboard** (real-time KPIs over WebSocket)
- the **tenant admin** (number pool, 10DLC vetting, RBAC, billing)
- the **internal admin** (cross-tenant visibility + ops tools)

## Reuse before create — the design-artifact registry is the FIRST input to any visible frontend work (blocking)

Before planning, mocking, prompting, or building ANY visible surface, element, or state, read the design-artifact registry FIRST and reuse what already exists — do not recreate a mock that already exists:
- **`docs/design-system/locked-surfaces.md`** — the APPROVED + LOCKED surface mocks (the acceptance reference to build against).
- **`docs/design-system/handoffs/`** (`mock-handoff.packages.json` indexes the M-packages) — the PENDING delta mocks awaiting founder approval; each M-package is a real, produced mock. A pending mock IS a mock — bring it for approval, don't re-mock it.
- **`frontend/public/explorations/`** — the coded exploration mocks the two registries above point at.

The registry is the source of truth for the question "does a mock exist for this surface, and is it approved or pending." **Never conflate "not built in React" with "not mocked":** a surface can be fully mocked (locked or pending) and simply not yet coded — that is a build task *against an existing mock*, not a re-mock. Producing a second mock for a surface that already has one is a parallel-system violation (`reuse before create`), burns an approval round, and risks contradicting the locked design. If an existing mock is stale versus a newer decision, RECONCILE it (update + re-approve in place), never silently recreate it.

*Fail-state:* a plan or a mock-production task recreated — or set out to recreate — a surface/element/state that already had a locked or pending mock in the registry, because the registry was never read as the first input (Sprint-1.4 mock-reuse loophole, 2026-07-21).

## Design decisions consult the UX benchmarks (blocking)

Before mocking or changing **any** dialer surface (power cockpit / softphone, manual dialer, wallboard, admin), read `docs/app-plan/product/31-dialer-ux-design-benchmarks.md` and run the relevant §5 per-surface checklist. That doc distills what 14 incumbents (Kixie, Dialpad, GoHighLevel, Convoso, Orum, Nooks, PhoneBurner, Aircall, CloudTalk, JustCall, MightyCall, …) do well **and the layout choices that caused real user complaints** — into `UX-DO-*` patterns to adopt and `UX-DONT-*` anti-patterns to avoid, each cited to the product + review evidence.

- The **mockup-first rationale** shown to the user for approval MUST name the `UX-DO-*` patterns the design adopts and confirm no `UX-DONT-*` anti-pattern is present (e.g. "search-first hero `UX-DO-001`, not a keypad hero `UX-DONT-001`").
- `31` governs *how* a surface is laid out; the authority boundary (`authority-boundary.md`, ARC-006) governs *what data* it may show. A UX pattern never overrides the boundary.
- `31` is the UX sibling of `30-competitive-benchmarks.md` (feature/test `BENCH-*`). When a layout choice maps to a feature benchmark, cite both.
- New review/teardown lessons get added to `31` **with cited evidence** per its §6 anti-staling rule — don't let the design evidence rot back into tribal memory.

*Fail-state:* a dialer surface was designed without consulting `31`, and it reproduced an incumbent's complaint-causing layout (a keypad-hero manual dialer, a contact name you can't see, dispositions that never reach analytics, a buried/silent caller-ID) that a `UX-DONT-*` row would have caught.

## UI copy serves the user's task — never internal narrative (blocking)

Every word on a user-facing dialer surface (label, button, footer, badge, empty state, tooltip,
generated copy) must serve the user's *immediate task*. **Never render internal narrative into the
product:** design rationale, the ARC-006 authority-boundary reasoning, how/why-it-was-built
exposition, mechanic narration ("pasted · sections + bold kept", "you scroll at your own pace ·
auto-scroll: off"), or roadmap/teaser text ("AI auto-suggest — later", "coming soon"). Those are
*our* internal decisions — they belong in the brief, the docs, or the chat, **not on the booker's
screen.** The booker sees the objection + rebuttal, the script, the call state — nothing about how we
built it or what we'll ship next.

- **Don't narrate the absence or immutability of a control — the control's absence IS the message
  (Amin 2026-07-22).** If a setting can't be changed, do NOT show a toggle AND do NOT say "can't be
  turned off" / "always on — automatic" / "this is enforced" — that reassurance narrates our internal
  authority decision (ARC-006 Tier-1a) instead of doing the user's job. The rule the user actually
  reads from the UI: **a control shown ⇒ "I can change this"; a control absent ⇒ "this is a given."**
  So express immutability by *omitting the control*, not by captioning it. State only the task-relevant
  fact the user must ACT on ("Blocks power dialing and texts; manual calls warn first"), never the
  meta-fact that it's unchangeable. Same for its inverse: don't show a control for something that
  isn't actually adjustable (a fake/no-op toggle implies tweakability that doesn't exist).
- **Mockups are held to the same bar:** a mock *is* the real surface. Keep review/explanation text
  out of the rendered chrome — put it in a separate caption or in the chat, never as in-UI copy.
  Entitlement states (active / hidden / locked) get a terse label, not a paragraph explaining them.
- **A mock of an EXISTING surface is grounded in the actual CODE, not the aspirational handoff (Amin
  2026-07-22, the M07 booking miss).** When the surface already exists in React, read the real
  component before speccing its mock — an M-package/handoff spec often describes a richer design that
  was *never built*, and trusting it over the code invents UI "that is just not there" (M07's mock drew
  a resolution-chain panel + appointment ledger + inline slot grid; the real `CallCard.tsx BookPane` is
  one button → `Calendly.initPopupWidget`). The handoff is a *lead*; the shipped component + the app's
  real integration pattern (here: the auxara.io site's own `[data-calendly]` popup) are the truth. A
  "current-state" mock shows what the app does today + the minimal grounded delta — never invented
  capability.
- This is the copy-discipline sibling of ARC-005 (`check:ui-source-of-truth` — copy comes from the
  registry) and the agent-product-intent rule ("prefer value over output volume"): registry-sourced
  AND task-serving, not narration.

*Fail-state:* a shipped or mocked surface carries a label / footer / note that explains a decision,
names a future phase, narrates the mechanic, **or narrates a control's absence/immutability
("can't be turned off", "always on — automatic", "this is enforced")** instead of just doing the
user's job (the "tenant-authored · you pull it (no auto-pop)" + "AI auto-suggest — later" battlecard
footer, 2026-06-16, and the DNC "CAN'T BE TURNED OFF" banner, 2026-07-22, are the canonical offenders).
The `check:ui-narrative` gate's pattern families must include this control-absence-narration shape.

## Show what serves the task — never carrier/platform plumbing in the name of "honesty" (blocking)

Every element on a user-facing surface — a field, badge, section, tab, stat — must earn its place by
being **actionable** (the user can do something with it), **decision-driving** (it changes a choice they
make), or **explanatory** (it accounts for a real, current state they're experiencing). A value that is
none of those is **noise**, and dressing it as "transparency" or "honesty" does not make it belong on
the page. Showing everything is an info-dump, not honesty.

Run the test on every element before it ships:
- **Can the user act on it?** (configure, fix, decide) — no → it probably doesn't belong on this surface.
- **Is it always the same / always green / platform-or-carrier-handled?** (STIR/SHAKEN attestation,
  "encryption: on", "you're on HTTPS", infra/registration status the user can't change) — yes → it's
  plumbing; **hide it**.
- **Does it explain something the user is seeing?** (a spam flag, a degraded state, a real failure) —
  yes → keep it; *that* is the genuine honesty case (a real, current, user-affecting state — never a
  permanently-green constant).
- **Where is it actually actionable?** Put the detail on the surface that owns the action (settings /
  compliance / admin) and **link** to it — never repeat a tenant/platform-level constant on every
  object's page.

Canonical offender (2026-06-30): the Number Detail "Capabilities & compliance" tab showed a per-number
STIR/SHAKEN attestation grid (always "A", platform-signed, no user override) + a 10DLC Brand/Campaign
grid (a tenant-level constant repeated on all ~120 numbers) — pure plumbing, justified as transparency.
Dialpad/RingCentral surface none of it. Cut to a single actionable line (`SMS not enabled — set up
10DLC →`), with the rest living once on the tenant 10DLC dashboard.

This is the **data** sibling of "UI copy serves the user's task — never internal narrative" (copy) and
the global "Honesty without usefulness is pointless" (claims): honesty = surfacing a real, current,
actionable state the user needs — never padding a page with non-actionable infrastructure to look
thorough.

*Fail-state:* a surface carries a field / section / tab of carrier or platform plumbing the user can't
act on — an always-"A" attestation badge, a tenant-level constant repeated per object, an "encryption
on" reassurance — justified as "transparency/honesty," instead of only what serves the user's task.

## Locked surfaces — match the approved mock, don't redesign it (blocking)

Some surfaces are **user-approved and locked** in `docs/design-system/locked-surfaces.md` — read that registry for the current locked set (it is the source of truth; do not rely on a list restated here, which drifts stale). When you implement or change a locked surface:

- The approved exploration mock is the **acceptance reference** — reproduce its layout/IA, its authority-boundary data set (what the lead shows), and its depth/glass token usage. Deviating from it is a bug, not a design choice.
- A visible change to a locked surface is **mockup-first + re-approval** (update the mock, show the user, get sign-off, *then* code) and must pass the doc-31 §5 per-surface checklist + the ARC-006 authority boundary.
- The in-file `🔒 LOCKED` banner names the surface and points back to the registry.
- **On a REVERSAL of a locked premise, grep the OLD premise repo-wide — not just its primary home.** When a change reverses a settled visual/structural premise (header opaque→transparent, nav overlay→dock, a control moving surfaces), the code + the primary authority prose get updated but the OLD premise's *describing adjectives* survive as stale echoes in quick-ref tables, gate strings, code comments, and `*.test.*` intent-headers — latent seeds an agent later "fixes" back to the old premise. Grep the OLD adjective ("solid bar", "opaque", the prior token recipe) across `docs/` + `.claude/rules/` + code comments + test headers and correct every echo in the same change (Gate 10). *(Origin: PR #192 header frost-pane reversal — the drift-auditor found ~13 stale-echo sites the cleanup grep missed.)*

*Fail-state:* a later pass silently redesigned a locked surface — reintroduced CRM data the boundary removed, brought back the keypad-hero manual dialer, or dropped the cockpit's 2-column layout — without a fresh mockup + approval.

## Responsive is layout-mode redesign — never dimension-fiddling (blocking)

Full standard: `docs/design-system/responsive-design.md` (the sibling of `layout-and-ia.md` — that owns
scroll/IA, this owns responsive composition). The always-loaded enforcement summary:

- **Every visible surface declares a responsive CONTRACT** — a per-band layout **MODE** (phone `≤767` ·
  tablet `768–1023` · laptop `1024–1439` · desktop `≥1440`) and what STRUCTURALLY changes between them.
  A surface is **not "the desktop layout, smaller"** — crossing a breakpoint switches **composition**
  (multi-pane → tabs/drawer/sheet; table → cards; rail → bottom tab bar; modal → sheet), it never merely
  shrinks. The surface root carries a `data-layout-mode="…"` attribute so the rendered verifier can
  assert the mode switched. A visible change is **mockup-first** and the mock ships **all four
  breakpoint states + the contract table** (a mock without its 390 state is incomplete). The brief
  carries the contract **verbatim**, never paraphrased.

- **The dimension-fiddling BAN.** When a surface breaks at a breakpoint (misalignment, overlap,
  overflow, clipped content), these are FORBIDDEN as a first response: nudging px heights/widths/margins
  until it "fits"; `overflow:hidden` to clip the symptom; `transform: scale()`; negative margins;
  `z-index`/`!important` stacking; a hardcoded per-breakpoint px dimension. The REQUIRED response is the
  **repair ladder**, in order, and every fix **names the rung**: **(1) MODE** — is this band in the right
  layout mode per the contract? (most "alignment bugs" are a desktop composition squeezed into a phone —
  the fix is a mode switch = a mockup-first redesign for that band); **(2) INTRINSIC** — replace fixed
  sizing with `fr`/`minmax(0,…)`/`auto`/`clamp()`/`aspect-ratio`/`gap`/content-height; **(3) CONTENT
  CONTRACT** — `min-width:0` + truncate/line-clamp with a stated contract, priority-based hiding with an
  affordance to reach it; **(4) token micro-adjust** — last, and only via tokens.
  *Fail-state:* a breakpoint bug was "fixed" by editing heights/widths/margins in page code without
  naming the ladder rung — the same class of bug returns on the next content change or the next viewport,
  because the layout is still the wrong mode wearing adjusted dimensions.

- **Intrinsic-first hard rules:** no fixed heights on layout containers in page code (heights emerge
  from content; exceptions live in primitives); flex/grid children carrying text get `min-width:0`
  (grid tracks `minmax(0,…)`) + a truncation contract; **`dvh` never `vh`**; `env(safe-area-inset-*)` on
  fixed/sticky edges; touch targets **≥44×44** px on phone/tablet (`--tap-min`/`--tap-comfortable`);
  `16px` inputs on phone (`--input-font-mobile` — iOS zoom); media = `aspect-ratio`+`object-fit`+fluid
  width, never a fixed w+h pair; display type via `clamp()` from the token source (Gate 11);
  **mobile-first** build order (author 390 first, layer `md:`/`lg:`/`xl:` up) — a desktop-only surface
  must be **declared** in the contract, not assumed.

- **Process:** `ui-verifier` runs before merge on any visible change (overflow / overlap / tap-targets /
  clipping / mode-attribute at 390/768/1024/1440 — the lens the static gates can't provide, per the
  2026-06-28 FIX-A invisible-at-tablet incident); `check:responsive` (WARN, in `check:layout`) backstops
  the un-adapted-layout + dimension shapes mechanically at edit time.

*Fail-state:* a surface was made responsive by shrinking the desktop layout and nudging dimensions until
it fit, instead of composing a distinct layout mode per band; or a visible responsive change was coded
without an all-breakpoint mock + approval; or a breakpoint bug was patched with a px nudge and no named
ladder rung.

## Call teardown routes through the ONE shared gate — never a raw local hangup (blocking)

The local WebRTC `hangup()` tears down ONLY the local media leg. It never reaches the webhook-driven
bridge orchestrator, so the PROSPECT's server leg keeps ringing/connected after the booker "ended" the
call — an abandoned live party (ARC-006/TCPA compliance bug, not a UX bug). The class shipped 5+ times
(comms endCall, cockpit reset/endShift, then end/vmDrop — journey L13) before it was gated.

- **The shared `CallProvider` owns the TWO teardown primitives** — pick by whether the dropper stays on
  the call to disposition: `teardownActiveCall()` (server-cancel BOTH legs via `api.calls.cancel` — the
  teardown authority — + local hangup + CLEAR the shared `activeCallId`) for droppers that leave to IDLE
  (cockpit reset / endShift / skip / defer / callNow via `endActiveCall`, comms endCall, Companion
  endCall); `cancelActiveLegs()` (the same leg drop, KEEP `activeCallId`) for droppers that go to
  WRAP_UP to disposition (cockpit end / vmDrop / cancel — `saveDispositionThenAdvance` needs the id;
  clearing it silently breaks dispositioning).
- **Page/feature code never calls the raw `hangup` primitive as a call-drop action.** The raw primitive
  belongs to the gate's owners (`frontend/src/context/CallProvider.tsx`, `frontend/src/hooks/useWebRTC.ts`).
  Every NEW drop-the-call handler routes through one of the two primitives — never a divergent second
  teardown (replace, don't layer).
- **When a slice adds or touches ANY consumer of the shared CallProvider, enumerate EVERY call-drop
  handler on that surface** (end, cancel, vmDrop, reset, endShift, skip/defer/callNow, endCall, unmount
  cleanup) and verify each routes through the gate — the per-handler migration missed end/vmDrop; only
  the grep-all-droppers sweep caught them.
- `check:call-drop-gate` (WARN-only; in `gates:all` + the PostToolUse hook) flags a raw `hangup(` in
  pages/components with no server-cancel in the enclosing function; escape hatch
  `// call-drop-gate-ok: <reason>`. It cannot see a hangup passed as a REFERENCE (`onClick={hangup}`) —
  reviewers own that (the auditors' Learned-classes rows).

*Fail-state:* a new "end/drop the call" handler shipped calling the local `hangup()` (or no teardown at
all) without the server-side cancel — the prospect's leg kept ringing after the booker ended the call —
or a WRAP_UP dropper routed through the id-clearing primitive and silently broke dispositioning.

## 1. Page, component, hook boundaries

- Pages orchestrate data, layout, routing, and top-level state.
- Components should stay presentational when possible.
- Reusable stateful logic (call state, WebRTC connection, hotkey bindings, wallboard live state) belongs in hooks.
- Pure formatting and transformation logic belongs in helpers, not components.
- Avoid putting API details directly into pages or presentational components.

## Layout, scroll & information architecture — pages compose, never reinvent

Authority: `docs/design-system/layout-and-ia.md` (centralized, ARC-005). The CoachAI failure this prevents: every page handled scrolling its own way, and info density drifted (one card dumped everything; the next ad-hoc-tabbed the same thing).

- **The app shell owns scrolling, not pages.** `AppShell` defines the one `100dvh` frame + the single main scroll container; inner scrollers are `ScrollArea`. Page/feature code never sets `height: 100vh/svh/dvh`, `overflow: auto/scroll`, or `position: fixed` for layout — the `check:layout` gate flags it. Pick one named scroll pattern (document / fixed-header-scroll-body / split-pane / locked-cockpit); never invent one.
- **Every page header carries the ONE shared surface.** A page header — the `PageHeader` primitive OR a rich page header (the cockpit's call-state topbar, the comms workspace header) — carries the shared `.app-header` class (`frontend/src/design-system/app-header.css`). That surface is a **FROST PANE, not a paint layer** (2026-07-06, user-approved): `background: transparent` + sticky + backdrop-blur — the shell's ambient canvas flows through the header, and the blur frosts content scrolling under the title. The bug is an **ad-hoc hand-rolled header treatment** (a page inventing its own fill/border/blur recipe instead of referencing the one source) — the `check:header-surface` gate flags a page-level `*__header`/`*__topbar` class that carries neither `app-header` (co-applied in JSX) nor a deliberate `background`. Never re-declare a header surface per page — and never re-add an opaque fill to `.app-header` itself (the earlier "solid bar" slab covered the ambient glow on every page; removed per user approval).
- **No info dumping.** Every surface uses the tiered model — Tier 1 visible (identity + primary fact + primary action), Tier 2 demoted (summarized), Tier 3 disclosed (tab / accordion / drawer / route). Never a wall of equal-weight fields.
- **Same object → same structure, everywhere.** A number / lead / call is one shared composite (`<NumberDetail>`, `<LeadCard>`) with the same sections/tabs on every surface — not reinvented per page. Use the card-vs-sections-vs-tabs-vs-disclosure-vs-route rubric in the doc.
- Compose `AppShell` / `ScrollArea` / `PageHeader` (built) / `Section` (to build) + `Card` / `Tabs` / `Accordion` / `DescriptionList` / `EmptyState` (built). Don't hand-roll page layout.

## 2. API usage

- Do not call `axios` (or `fetch`) directly from components.
- Do not add raw endpoint strings inside components.
- New API access should go through frontend API modules.
- Keep request and response typing explicit. The booker softphone in particular consumes high-frequency events; loose typing here is dangerous.

## 3. UI primitives and design consistency

Reuse existing UI primitives before creating new ones.

Prefer shared primitives for:
- buttons
- badges (lifecycle state, number health, vetting state)
- cards (lead card, call card, wallboard KPI card)
- page headers
- loading / empty / error states
- form controls
- hotkey hints / keyboard shortcut chips
- toast notifications (call connected, dispatched, error)

Do not repeatedly handcraft the same Tailwind patterns across multiple pages.

**Locked primitive spec — read before building or changing ANY primitive: `docs/design-system/primitives.md`.** It locks the look (tactile / glow / frost buttons; the raised / recessed / refined-flat depth system) and the implementation patterns; its anti-patterns table lists mistakes that each caused a real bug. Hard rules (these are bugs, not preferences):
- **Selection controls (radio / checkbox / switch):** a real native `<input>`, **inclusively hidden** (`opacity:0`, positioned over the visual — NEVER `display:none`, which removes it from the a11y tree), with an **inline SVG** visual — NEVER a CSS `border-radius` box (rasterizes oval at fractional zoom) and NEVER a `background-image` check (vanishes in forced-colors). Size in `em`; colors from tokens; `:checked` drives the SVG; `:focus-visible` outline; a `@media (forced-colors: active)` block.
- **No hardcoded geometry (Gate 11):** `aspect-ratio` not matched `width`+`height`; `em` / ratios / `transform`-centering / `calc(100% - …)` not magic px offsets.
- **Buttons:** tactile everyday; **glow = the one live action only**; **frost = hero / login only**.
- Every interactive primitive: a real native element (**tabs are `<button role="tab">`, not `<span>`**), `:focus-visible`, `forced-colors` support, and a `data-testid`.

## 4. Stable selectors and testability

- Every primary user action should have a stable `data-testid`. The booker softphone has dozens — every hotkey-bound action needs one.
- Important forms, panels, and state containers should also have stable selectors.
- Prefer semantic, stable selector names such as:
  - `data-testid="softphone-dial-button"`
  - `data-testid="call-card-disposition-dropdown"`
  - `data-testid="wallboard-live-dials-counter"`
  - `data-testid="number-pool-buy-button"`
- Do not rely on brittle text-only selectors for critical flows.

## 5. State handling

For user-visible async flows, always consider:
- loading state
- success state
- empty state
- error state
- retry path if failure is recoverable

Do not leave users in ambiguous states. The booker softphone never shows "—" for status; it shows `idle / dialing / ringing / connected / wrap-up`.

## 6. Auth and permissions on the frontend

- Frontend gating is for UX, not security.
- Do not assume hidden UI equals authorization.
- Any privileged or scoped behavior must still be enforced on the backend.
- When showing role- or plan-based UI (Owner vs Manager vs Agent vs Compliance Viewer), derive from typed user state rather than scattered string comparisons.

## 7. Accessibility and UX basics

- Use semantic elements where practical.
- Buttons should be buttons, links should be links.
- Ensure labels, disabled states, and error messages are clear.
- Avoid interaction patterns that only work with a mouse — bookers live on the keyboard.
- Preserve clear focus and loading behavior for important workflows.
- Respect `prefers-reduced-motion` for wallboard animations and call-state transitions.

## 8. Real-time correctness

- The wallboard, live call state, and softphone status are real-time over WebSocket. Reconnect logic, dropped-event detection, and stale-state warnings are not optional.
- A wallboard counter that silently freezes is worse than a wallboard counter that shows "stale — reconnecting" — pick the latter.
- The softphone must show the WebRTC connection state honestly. "Bad mic / weak network" UX nudges (per the pre-shift hardware check — REQ-BUX-008 / decision-log BUX-011) must keep working through reconnects.

## 9. Dead code and compatibility

- Do not leave misleading UI for disabled features (e.g. parallel-dialer toggle when parallel isn't shipped yet).
- If a compatibility bridge exists, make it explicit and temporary.
- Remove stale no-op props, fake controls, and abandoned states once they are no longer needed.
- **Before adding a new interactive control, name the state/action its value drives.** If the value flows nowhere yet (the backend channel isn't wired), render it READ-ONLY or OMIT it — never ship a live-looking no-op. *(The "Calling from" caller-ID picker, 2026-06-30, was the 2nd instance of this class — no-plumbing-in-UI was authored for the 1st; the mechanical `check:ui-*` gates can't see "a control whose value flows nowhere" — that needs data-flow analysis — so it's a build-time self-check + a dispatch-brief checklist item.)*

## 10. Frontend definition of done

Before finishing a frontend change, confirm:
- checked `frontend/docs/FRONTEND_BLAST_RADIUS.md` (when populated) for connected surfaces and did not only patch the noticed page
- updated the blast-radius doc if the work exposed a missing relation
- reused existing primitives where possible
- no direct API logic leaked into presentation
- selectors exist for key actions (especially hotkey-bound ones)
- loading, empty, and error states were considered
- types are explicit for the changed flow
- UI reflects backend truth rather than inventing client-only assumptions
- real-time surfaces handle reconnect / stale-event / missed-event cases
