---
name: no-internal-narrative-in-ui
description: Amin feedback — never put internal narrative/rationale/roadmap into product UI or mocks; be terse in chat too. Show new UI in real cockpit context.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5f48ed2f-a00c-4f0f-bfad-14d3755b1a76
---

**Amin, 2026-06-16 (on the battlecards mock):** I kept leaking internal decisions onto the product surface — a footer "tenant-authored · you pull it (no auto-pop)", a "AI auto-suggest — later" teaser, "pasted · sections + bold kept", "you scroll at your own pace · auto-scroll: off". A real booker doesn't need our design rationale, authority-boundary reasoning, or roadmap on their screen. "only write things that are necessary and to the point. we dont have to write every freaking thing we talk about or are part of internal decisions."

**Why:** internal narrative is clutter that buys the user nothing — it's exposition of *our* choices, not their task. It makes the product look unfinished/talkative and wastes attention mid-call.

**How to apply:**
- UI copy = the user's immediate task ONLY (the objection + rebuttal, the script, the call state). No design rationale, no "tenant-authored / no auto-pop", no "later"/"coming soon", no mechanic narration ("you scroll at your own pace").
- Mocks are the real surface — keep review/explanation OUT of the rendered chrome; put it in a caption or the chat. Terse state labels only.
- Same discipline in CHAT: be terse, don't narrate every internal step/decision. (Wired as a global rule: [[CLAUDE.md]] "UI copy serves the user's task — never internal narrative".)
- New UI must be shown **in its real context** (e.g. the battlecard popover open inside the actual softphone cockpit, not an isolated panel), and in relation to the softphone + manual dialer.

*Fail-state:* a surface (shipped or mocked) carries a label/footer/note explaining a decision, naming a future phase, or narrating the mechanic instead of just doing the user's job.
