---
name: subtle-scrollbars
description: "No raw OS-default UI (scrollbars, native-select dropdown popups) — use our themed/custom design-system controls; recurring user call-out (3x)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 217d7e0f-4357-4e96-8416-ae26c504eeeb
---

Amin dislikes the raw/default OS scrollbar (the chunky gray one) and has called it out twice ("why do you always add this ugly scroll and i have to call you out on it"). Every scroll container must use a **subtle, thin, themed** scrollbar: `scrollbar-width: thin` + a low-contrast pill thumb on a **transparent track**, themed via a `--scroll-thumb` token (not a raw color at the leaf).

**Why:** it's recurring frustration, and against the glass design a default scrollbar reads as "ugly/unfinished." A wired global default beats vigilance — the doctrine-loop fix is to make the nice scrollbar the *only* thing that can render, not a thing to remember.

**How to apply:** it is now wired **globally** in `frontend/public/explorations/_design.css` — `--scroll-thumb`/`--scroll-thumb-hover` tokens (light + dark theme blocks) + a BASE block (`* { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) transparent }` and `::-webkit-scrollbar*` with a padding-box pill thumb). So **every** exploration scroller inherits it automatically — never override it with an uglier one, and never ship a raw `overflow:auto` expecting the default. The **real app** must carry the same in its global stylesheet / the `ScrollArea` primitive. Codified in `docs/design-system/layout-and-ia.md` §1 (the ScrollArea spec). This is scroll *appearance*; distinct from the scroll *ownership* rule (shell owns scroll, pages don't) in [[design-system-locked]]. Verify via `preview_eval` computed styles, not screenshots ([[browser-preview-verification]] — screenshots hang here). Same "wire the default, don't narrate/remember" spirit as [[no-internal-narrative-in-ui]].

**Generalized (2026-06-23, 3rd instance — the field-mapping dropdown):** same class as the scrollbar — a **native `<select>`'s dropdown popup is OS-rendered and can't carry our tokens OR our scrollbar**, so it renders as the basic OS dropdown (with the OS scrollbar inside it). For any styled / long / grouped / scrollable dropdown use the **Combobox / DropdownMenu** primitive (a custom listbox: token-styled panel + our `::-webkit-scrollbar` + ARIA `listbox` + keyboard nav), **not** a bare native `<select>`. The general principle: **never ship a raw OS-default control where our design system has (or should have) a styled primitive** — scrollbars, select popups, date pickers, etc. The DS already has `Select`/`Combobox`/`DropdownMenu` (real app); mocks must replicate the custom listbox, not use a native `<select>`. Codified in `docs/design-system/primitives.md`.
