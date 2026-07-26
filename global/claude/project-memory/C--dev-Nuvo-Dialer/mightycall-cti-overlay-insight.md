---
name: mightycall-cti-overlay-insight
description: "Why agents love MightyCall's extension (the loved feature is a THIN CRM-agnostic click-to-dial overlay, not deep integration) + the CRM-resident persona + how we'd build it better"
metadata: 
  node_type: memory
  type: project
  originSessionId: c6cb6c0f-fc79-4576-b5c4-e28042c86ce8
---

Cited research 2026-06-28 (agent feedback from a real MightyCall user at "Virtual Space Staffing Inc.", CRM = "mobilePlanet"/"Planet", unresolvable to a named product → proves the point).

**The loved thing is THIN, not deep.** MightyCall's extension = a ~12KB Chrome content script that only detects phone numbers on any web page and makes them click-to-dial; the call runs in a SEPARATE background desktop app. It does NOT inject a CRM panel, is NOT record-aware, and has NO integration with "Planet." The praised "it takes me back to my CRM to set the disposition" is **emergent, not a feature** — the dialer is deliberately invisible (number-decorator + background app), so the agent never leaves their CRM tab; call ends → they're still on the same record → they disposition THERE. One-line model: **get the agent to the call, then get out of the way and leave them in their CRM.**

**Why she prefers it over Kixie (cited multiple times):** Kixie's PowerCall bundles dispositions INSIDE its own floating window → disconnected from / double-entered into the CRM record. MightyCall never makes her enter a second tool. **Kixie traps you in its window; MightyCall hands you back to your record.** = exactly the ARC-006 north star (dialer informs/acts, CRM owns the record) — see [[dialer-not-crm-design-boundary]].

**Two access modes into one engine (the persona split):** (1) **CRM-resident agent** (staffing/ATS — lives in Planet/Bullhorn) wants the dialer INVISIBLE → served by a CTI-overlay extension + INT-001 write-back. (2) **Standalone-workspace agent** (our no-CRM ICP) wants the dialer to BE their workspace with the AI-draft disposition (DLR-013/AI-001) → served by the unified Communications workspace (the manual-dialer+SMS+history mock, see [[dialer-workspace-ux-research]]). NOT in conflict.

**We beat MightyCall on 4 axes:** softphone is WebRTC IN the overlay (no desktop-app install) vs their separate app; Telnyx Call Control / WebRTC (no OS `tel:` dependency) vs their click-to-call CURRENTLY BROKEN on macOS 26; we have local-presence (NUM-006) vs their manual caller-ID pick; a thin in-page call bar vs their zero in-page UI.

**Build risk = the Kixie/DOM-injection failure mode** (scraping a CRM DOM breaks on their frontend changes). Mitigate: number-regex over RENDERED TEXT not CSS selectors + MutationObserver re-decorate on SPA re-render + graceful manual-dial fallback when detection finds nothing.

**Status:** Phase-2 integrations surface, NOT built now. **CAPTURED 2026-06-28** as decision-log **INT-008** (the extension = entry point 3) + **ADR-BUX-019** (the comms surfaces architecture) + doc-31 UX-DO-038/UX-DONT-020 (the disposition-loop). See [[comms-surfaces-architecture]] for the full one-engine/one-home/three-entry-points model.

**Why:** the single most-praised competitor feature among the target agents; the CRM-agnostic core is cheap (no per-CRM connectors for ~90% of the value) and we'd ship it better than MightyCall day one.
**How to apply:** keep the Communications workspace as the HOME; treat the extension as a companion second access path, never a replacement. Honor the "get out of the way, leave them in their CRM" principle — never trap the agent in our window to re-enter what their CRM owns.
