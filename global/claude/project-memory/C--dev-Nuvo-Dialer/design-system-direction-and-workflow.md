---
name: design-system-direction-and-workflow
description: "Locked dialer UI direction (Calm-led + cockpit atmosphere, Plus Jakarta Sans) and how to run the VisualForge design build (incremental, human-gated, mockups-first)."
metadata: 
  node_type: memory
  type: project
  originSessionId: c5eaca53-3c6c-476e-9d83-7bbf8f484115
---

Locked UI design direction for the Nuvora Dialer, chosen via live coded mockups (2026-06-09):

- **Register: "Calm-led with cockpit atmosphere."** A legible Dialpad-style card (solid-feeling surfaces, feather-light layered shadows, generous space, sentence-case labels) on a soft **cyan→purple ambient background**, with a faint frost + an accent **connect-glow** on live elements. Full glass ("Glass Cockpit") is reserved for hero / active-call moments (login, active-call focus) — NOT the all-day dense UI (perf + legibility cost).
- **Font: Plus Jakarta Sans** (user chose over Inter — "less bold, saves space"). NOTE for honesty: Dialpad's *actual* product font is the system stack (SF Pro / Segoe; Inter is its near-twin) — the "easy on the eye" lever was the **treatment**, not the family.
- **Dialpad easy-on-eye recipe (verified from the Dialtone token repo):** crisp near-black text `#1C1C1C` (NOT washed-out gray), 8–12px radii, 3-layer soft shadows at 3–8% black, ONE accent used sparingly, generous 8px-grid spacing.
- **Accent: provisional indigo** (`oklch(0.54 0.16 262)` light / `0.77 0.16 266` dark) — deliberately NOT Dialpad's purple `#7C52FF` (don't clone). **Open question:** user may prefer the full-glass **cyan** accent for more pop — final hue still TBD.
- **Light-primary + dark parity.** Dark = tinted charcoal (NOT near-black) + the cyan→purple atmosphere + frost (user specifically loved the dark frost).
- OKLCH throughout. **Everything tokenized by family; zero hardcoded raw values is the bar** (build-failing guardrail to be enforced — today's `check-ui-guardrails.mjs` only catches inline hex, not px/font/etc.).

**Mockups live at** `frontend/public/explorations/*.html`, served by the Vite dev server (`preview_start` name `frontend`, port 5173). Winner = `hybrid-calm-led.html`; shared tokens + chrome in `_design.css`; full-page proofs `dashboard.html` (manager wallboard) + `softphone.html`. These are mockup-level — the **production 3-tier Tailwind-wired token system is the next step** (greenlight pending).

**Workflow the user wants:** full VisualForge build (`${DEPENDENCY:visualforge|backslash}`), **incremental + human-gated** — never lock look/feel solo. Aesthetic decisions → build a few coded mockups, user reacts (they paste screenshots), confirm, then codify. **Tailwind approved.** The `preview_screenshot` MCP tool is broken in this env (times out on JPEG capture) — rely on the user's pasted screenshots + computed-style verification via `preview_eval`.

**Why:** user (Amin) is design-opinionated, dislikes generic AI output, and references Dialpad as the "easy on the eye" north star. Related: [[voice-agent-phase5-strategy]].
