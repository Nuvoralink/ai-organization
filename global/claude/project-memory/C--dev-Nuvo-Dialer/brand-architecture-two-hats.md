---
name: brand-architecture-two-hats
description: "Amin's two-brand structure — Nuvora Link (service business, ex-VSS) vs Auxara (AI studio + SaaS products umbrella); URL/positioning plan proposed 2026-07-03"
metadata: 
  node_type: memory
  type: user
  originSessionId: 49a07808-39a5-4fe5-8fc7-26cf526a2319
---

Business history: Amin ran **Virtual Space Staffing (VSS)** in Canada — appointment setting for insurance agents. After moving to Dubai he opened **Nuvora Link — FZCO**, which continued VSS's work (same Canadian clients; LinkedIn company renamed VSS → Nuvora Link). nuvoralink.com + his LinkedIn currently all point at the appointment-setting business.

The two hats (SETTLED by Amin 2026-07-03):
- **Hat 1 — Nuvora Link** (nuvoralink.com): the appointment-setting/staffing SERVICE business. Keep unchanged; it's the legal entity + cash flow.
- **Hat 2 — Auxara** (auxara.io): the AI studio + products umbrella. Main page = AI-systems studio positioning ("AI System Architect" is his personal title); Dialer + Coach are flagship products/portfolio proof; consulting/custom-AI-systems clients come through here.
- Products stay on subdomains: dialer.auxara.io (already live), coach.auxara.io — NOT separate domains (auxadial.io/auxacoach.io were available @$38/yr but recommended against: fragments SEO/trust/maintenance pre-traction). auxara.com is taken.
- Legally: Auxara = a brand/trade name of Nuvora Link FZCO (no separate entity until revenue justifies).
- Coach naming (Amin's call 2026-07-03): **dual-name** — internally it stays **Nuvora Coach** living at **coach.nuvoralink.com** (his own team uses it as part of the service business), but ALL outside/public copy calls it **Auxara Coach** (the productized version under the Auxara umbrella). Dialer is Auxara Dialer everywhere.
- Dogfooding narrative: Nuvora Link (the agency) is the first customer of Auxara Dialer — sales story for both hats.

Copy direction for auxara.io (Amin feedback 2026-07-03): the page hook must be **problem→solution oriented** — lead with the visitor's operational bottleneck and why they should contact us. He REJECTED "We use everything we sell" and "Our first client was ourselves" as section hooks (too founder/self-focused). Products appear only as PROOF ("Judge us by what's running in production"), founder compressed to a one-line strip. Final CTA promise = a straight diagnostic answer in 30 minutes, not a pitch.

**Dialer marketing identity (Amin 2026-07-03):** compliance is NEVER the selling point — it's table stakes ("something we should have in the first place to operate"). The identity is **momentum/flow**: next lead always loaded, context at "hello," script + objection cards on screen, one-keystroke AI wrap-up, calls+texts one thread — "built for talk time, not admin time." Compliance appears once, demoted, as "handled silently." Naming: Auxadial/Auxacoach floated and recommended AGAINST (keep Auxara Dialer / Auxara Coach — house-brand equity).

**Real Coach screenshots tried + reverted (2026-07-04):** captured real screenshots from the live coach.nuvoralink.com/sample-review (via a standalone headless Chromium, since neither the browser MCP nor a Dialer demo login was usable) and wired them into coach.html + index.html's Coach card. Amin rejected on sight: the Coach app's light/white UI clashes with the site's dark glass/iris motif. Reverted via `git revert` (commit 8aebe45) — coach.html + index.html + the `--shot-matte` token/`--shot` CSS modifiers are back to the hand-built dark-glass mockups (which stay the pattern for BOTH products). Lesson: don't drop a light-mode product screenshot into this site without a matting/treatment plan approved first — the dark glass hand-built mockup IS the site's illustration style, by design.

**Sales-line quality bar (Amin 2026-07-03):** every example script/objection/coaching line on Auxara marketing surfaces must be PROPER appointment-setting technique — a booker NEVER opens a price conversation on a booking call (Amin caught "Can I give you the range?" as a horrible line). Correct moves: lower the stakes of the appointment ("nothing gets decided on this call"), alternative-choice close, one close per frame (no duplicate closes). Pressure-test example lines as if a real booker will say them.

**No brand mixing on auxara.io (Amin, same day, sharper):** the Auxara site must NOT reference the appointment-setting/calling-operation business at all — not in the founder bio ("runs a North American calling operation" removed), not in proof copy ("appointment-setting business" / "our floor" reframed to anonymous production language), and the footer sibling link to nuvoralink.com was dropped. Only the legal line "Auxara is a brand of Nuvora Link FZCO, Dubai" remains. The cross-link direction that survives is nuvoralink.com → Auxara (the "runs on Auxara Dialer" credit), one-way.

Auxara Web design system (2026-07-03): lives at `${WORKSPACE:dev|backslash}\Auxara Website\design-system\` (git repo, seed of the future auxara.io site) — `tokens.css` single source + `cards/*.html` + `build.mjs` → `dist/`. Pushed via DesignSync to claude.ai design-system project **"Auxara Web"** (projectId `2f06b769-9cab-4fe1-ab68-64e9d856c48c`) — Amin selects it in Claude Design when generating the auxara.io skeleton. DNA = dialer's locked direction (iris hue 274, neutrals 266, Plus Jakarta Sans + JetBrains Mono, same radius/motion) at marketing scale (clamp display type, --section-y rhythm, mono eyebrows, dark-primary + tokenized light variant). Deliberate kinship — settled over a fresh identity so product screenshots look native.
