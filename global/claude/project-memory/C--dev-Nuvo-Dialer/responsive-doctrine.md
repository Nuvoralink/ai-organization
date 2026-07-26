---
name: responsive-doctrine
description: "Amin's 2026-07-02 responsive directive — mobile implementations are bad because agents dimension-fiddle instead of redesigning layout modes per range; the doctrine + gate + verifier system built in response"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dacc601b-7d2d-4bb9-8e59-1c3225651b36
---

Amin (2026-07-02): dialer responsive/mobile "really crap — can't align, keeps missing things...
keeps messing around with height and width when trying to fix something when most of the time the
right answer is REDESIGNING for mobile or tablet view."

**Why:** no generation-side responsive doctrine existed — agents built desktop-first, squeezed it
down, and repaired breakpoint bugs with px nudges (symptom) instead of switching layout composition
(root). Detection also had holes: ui-verifier lacked overflow/overlap/tap-target/clipping/mode
assertions.

**Status: MERGED to dialer main 2026-07-02 (PR #165, `ecdca5a`)** after adversarial review (ACCEPT;
1 should-fix — calibration notes overstated "CSS rules carry the real current signal" when all rules
scan 0, reworded to clean-0-baseline + RESPONSIVE-DEBT-001 as the count authority; 1 nit — R5 dead
branch collapsed). Follow-ups DONE same day: bootstrap-skill template sync (frontend-rules +
ui-verifier templates + rules README now carry `{{RESPONSIVE_DOC}}` + the assertion battery) and the
CoachAI echo (PR #116 — frontend-rules.mdc blocking section + ui-verifier battery, adapted to
Tailwind breakpoints + wide/ultra; no mechanical gate there yet, noted explicitly). REMAINING: the
remediation phase only (per-surface mobile redesigns, mockup-first, Amin approves each surface's
contract; cockpit > comms > settings > admin).

**How to apply (the system, landed via PR #165):**
- **Modes, not scaling:** every surface declares a responsive CONTRACT — a named layout MODE per
  range (390/768/1024/1440 verification points), observable via `data-layout-mode`; crossing a
  breakpoint switches composition (pane→tabs, table→cards, modal→sheet, sidebar→drawer...), never
  shrinks. Authority: `docs/design-system/responsive-design.md`.
- **The dimension-fiddling BAN + 4-rung repair ladder** (blocking rule in frontend-rules): a
  breakpoint bug is fixed by (1) MODE check → (2) INTRINSIC sizing (fr/minmax/clamp/aspect-ratio)
  → (3) CONTENT contract (min-w-0+truncate, priority hiding) → (4) token micro-adjust — in that
  order, rung named in every fix. Forbidden first moves: px nudges, overflow-hidden masking,
  transform:scale, negative margins.
- **`check:responsive` WARN gate** (R1 bare grid-cols/flex-row w/o variants; R2 fixed heights on
  layout containers; R3 vh-not-dvh; R4 fixed w+h px pairs; R5 truncate w/o min-w-0) in
  check:layout + PostToolUse; WARN→ERROR per-rule as debt burns down.
- **ui-verifier upgraded** with exact preview_eval assertions (horizontal overflow, sibling
  bounding-box overlap, ≥44px tap targets, clipped text, MODE match) — findings name the ladder
  rung, never a px prescription.
- **Process:** mocks ship all 4 breakpoint states + the contract table; briefs carry it VERBATIM;
  mobile-first build order; desktop-only surfaces must be DECLARED (e.g. wallboard TV).
- **RESPONSIVE-DEBT-001** (BUG_BACKLOG) = the measured damage inventory AND the gate's count
  authority (docs reference it, never restate numbers); remediation is per-surface mockup-first work
  Amin approves surface-by-surface (suggested order cockpit > comms > settings > admin).
  Authenticated surfaces still unmeasured (no credentials at inventory time).
- **Remediation ledger (Amin directive 2026-07-02):** every remediation slice APPENDS each issue it
  finds to `docs/design-system/responsive-remediation-log.md` — measured evidence, root cause, fix
  (+ ladder rung), *how it should have been done*, and the codified home (gate/rule/agent-file) that
  enforces it; an entry with no codified home is an unrouted lesson. Wired into responsive-design.md
  §6 + DOCUMENTATION_INDEX. Seeded with 5 entries (port-drift/EACCES-excluded-port, preview_start
  false-green, auth sub-44 tap targets, resize-preset override, filemap-tracked-only).
