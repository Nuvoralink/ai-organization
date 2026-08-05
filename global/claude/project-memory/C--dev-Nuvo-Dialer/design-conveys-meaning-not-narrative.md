---
name: design-conveys-meaning-not-narrative
description: "Amin's design principle — convey meaning through UI/UX/icons/structure, not narration; text is last resort, always short and to the point."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f84ef064-f973-4ea9-af20-ed154b252235
  modified: 2026-08-04T07:17:50.677Z
---

Amin (2026-08-03, reviewing the onboarding mock): **"you're assuming every single decision needs to
be narrated to the user, that's not true. we need to convey meaning by using good UI, UX, icons, and
just structuring the screen in a way that conveys the meaning. text narrative should be the last
resort, and even then it should be short, concise and to the point, you shouldn't be telling a story
to the user."**

**Why:** narration is a crutch for weak design. A well-structured screen — hierarchy, grouping,
iconography, state via color/shape, sensible defaults, affordance placement — tells the user what to
do and what a thing means *without* a sentence explaining it. Explanatory subtitles/helper paragraphs
that restate what the UI already shows are clutter, and they read as talking down to the user. (The
trigger: a number-pick screen subtitled "This is your company's caller ID. We found a few in your area
— pick one or search another area code." — every word of which the screen already conveys.)

**How to apply (default for every visible surface / mock):**
- Lead with structure + icons + state, not prose. Ask "can layout / an icon / a default / a badge
  convey this?" before writing a sentence. If yes, do that and write no text.
- Headings: short, purposeful (a label, not a statement-of-intent). Kill explanatory subtitle
  paragraphs — if the screen needs a paragraph to be understood, the design is the problem.
- When text is genuinely required (a legal acknowledgment, a real constraint the UI can't show like
  "US texts ~1–2 wks"), make it a terse fact — a few words, no story, no reassurance-speak, no
  "we found / here's how / this lets you…" framing.
- This SUPERSEDES my habit of narrating decisions in-UI. It extends [[no-internal-narrative-in-ui]]
  (that bans internal/roadmap narration; this bans *explanatory* narration too) and pairs with
  [[mockup-quality-bar]]. It's a design-taste bar, not just a copy rule — fix it in the design first.

*Fail-state:* a surface/mock carries a sentence that explains what its own structure/icons already
convey, or reads like it's telling the user a story instead of just doing their task.
