---
name: comms-surfaces-architecture
description: "The settled architecture for ALL dialing/SMS surfaces — one engine, one unified home, three entry points, two moments (Amin-articulated 2026-06-28)"
metadata: 
  node_type: memory
  type: project
  originSessionId: c6cb6c0f-fc79-4576-b5c4-e28042c86ce8
---

The governing model for the dialer's call/SMS surfaces, articulated by Amin 2026-06-28. **CAPTURED in the authority docs 2026-06-28** so future implementations don't drift: decision-log rows **BUX-019** (the architecture) + **INT-008** (the extension), **ADR-BUX-019-comms-surfaces-architecture.md**, **BUX-015 amended** in place, **locked-surfaces.md** Manual-dialer row re-scoped (⚠ "do NOT build the standalone manual-dialer page"), and **doc-31** UX-DO-036…039 / UX-DONT-020 + a §5e checklist.

**ONE engine → ONE unified home → THREE entry points → TWO moments.**

- **The engine** = dial + SMS + WebRTC/Telnyx + lead-keyed conversations (ADR-CONV-001) + call/SMS/VM history. The system of record for ALL comms activity, regardless of how a call/text was initiated.

- **The unified home** = the **Communications workspace** (3-pane: left inbox/triage · center per-lead unified timeline · right context+dialer). EVERY call dialed + SMS sent/received from ANY entry point lands and lives here. It **subsumes the unbuilt s13 Conversations inbox**. It is NOT the manual dialer and does NOT replace the manual-dial dialpad.

- **Three entry points** (all write to the engine, all surface in the home):
  1. **Power Dialer cockpit** (s15, locked) — queue-driven; for users who bring leads INTO our workspace (HubSpot-connectable or CSV export).
  2. **Manual Dialer — pop-out companion** (build NOW) — compact always-on-top dial+SMS window beside their CRM; for the **CRM-resident agent** (non-connectable CRM, can't export a list, hates tab-switching). Reuses the locked manual-dial dialpad + SmsComposer. Killer no-extension UX = clipboard paste-to-dial. Mock = `manual-popout.html`.
  3. **Manual Dialer — browser extension** (LATER, Phase-2 / INT-001/INT-006) — click-to-dial ON their CRM page; the MightyCall blueprint done better (WebRTC = no desktop-app + no macOS `tel:` break; local-presence NUM-006). Same engine + same "get out of the way, leave them in their CRM" principle. See [[mightycall-cti-overlay-insight]].

- **Two moments** (why both pop-out AND home exist):
  - **While working (outbound burst)** → pop-out / extension. Fast, pain-free, get out of the way.
  - **Later (follow-up + INBOUND)** → the home. Check what happened to a lead AND **answer when the lead replies to an SMS**. The home is the inbound + conversation-management surface, not just a passive record.

**The bridge (a design requirement):** when a lead replies to an SMS fired from the pop-out, the agent (heads-down in their CRM) must (a) be NOTIFIED (web-push) and (b) reach the home thread to answer in ONE move. Pop-out gets a quiet "N replies" indicator → opens the home; pop-out stays outbound-light and HANDS OFF (never tries to be the answer surface). Home's **Unread/Unanswered** inbox filters = "leads who replied, need an answer"; inbound appears LIVE (never manual-refresh — MGR-001 honesty).

**ARC-006 throughout:** the pop-out/extension show only what the user types/pastes + OUR OWN history + local-time/caller-ID cues — never a CRM lead profile/score/"cleared to call" (we don't have their CRM data; the CRM is their system of record). CMP-012 confirm-to-override calling-hours on manual; compliance gates run server-side at dial time regardless of entry point.

**Build status:** the unified-home + finished-NavRail desktop mock is **LOCKED 2026-06-28** (`frontend/public/explorations/communications-workspace.html`; locked-surfaces.md + primitives.md §6). The **nav-bleed fix** shipped to the live shared shell (NavRail.css transparent-rest→frosted-drawer + AppShell 64px slot + `--space-9/11` tokens) — PR #112 merged to main (`5651068`). Nav behavior locked: **hover = frosted overlay drawer; PINNED = docks + reflows content (never hides it)**; crash-safe (position never toggles; reflow on pin-click not hover). Pop-out companion still in design; extension = Phase-2 (INT-008).
**⚠ DELIVERY GAP (user-flagged 2026-07-13):** the **communicator DOCK — the two persistent bottom-right launchers (Dial keypad → compact manual-dial popover reusing the LOCKED manual-dial dialpad so the calling-hours gate rides the dial; Messages speech-bubble + unread badge → composer into the lead-keyed thread) on EVERY page — is APPROVED but NOT BUILT.** Verified against `frontend/src/components/WorkspaceLayout.tsx` (the shell wrapping every authenticated page): it renders NavRail + Outlet + TabBar + MoreSheet — NO dock/Dial/SMS launcher exists anywhere in `frontend/src` (grep: the 24 "dock" hits are the nav-rail pin-dock + the tablet "docked call bar", none a CommunicatorDock). It was the back half of comms "step 3" (Conversations inbox + dock) — step 3 paused; the **Conversations page (`pages/comms/CommunicationsPage`) later shipped, the dock did NOT come with it** (half-delivered step-3). This is a "decided+approved but never delivered" gap the sprint-close **functionality-parity sweep** (never run on s1.3) is built to catch. **Owed: its own slice** — mockup-first refresh in the CURRENT shell (design system moved since the 2026-06-16 approval), then wire into WorkspaceLayout. Sequencing vs the call-detail slice = user's call.
**SEQUENCING (user-decided 2026-06-28): MOBILE responsive design system comes BEFORE the React build** — the nav is structurally different on mobile (tab bar/drawer, not a hover-expand rail) + the 3-pane collapses to a stack, so build React responsive in ONE pass (no desktop-then-retrofit). The React build (finished NavRail IA + pin→shell-reflow wiring + comm workspace + a `--call-go` success-action token) waits for the mobile design. Relates to [[dialer-workspace-ux-research]], [[sprint-1-3-active]].
**Gotcha:** the `s15-cockpit-layout-fix` branch carries large uncommitted FE3c (shift-activity) WIP from another lane — committed the lock via an ISOLATED WORKTREE off main, never touching it (orchestrator dirty-tree rule). The s15 tree still shows redundant copies of the merged design-system files; they reconcile when s15 next syncs with main.
