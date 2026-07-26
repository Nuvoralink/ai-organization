---
name: marketforge-ad-creative-brief
description: Build creative briefs for 5-10 concepts per ad set with refresh cadence. Format hierarchy (9:16 vertical priority). UGC discipline. AI-disclosure compliance. Use as Phase 5 step 4, in parallel with paid-search/social/mobile.
---

# MarketForge Ad Creative Brief

Apply V3 §4.2 (Meta — creative is the new targeting, half-true caveat), §9.3 (AI for ad creative variants).

## Global quality rules

- 5-10 distinct creative concepts per ad set; refresh 2-4x/month.
- 9:16 vertical priority for cold prospecting.
- UGC briefs beat AI-only ad creative in 2026 (per `ai-saturation-watch.md`).
- AI variants OK at T2+ (Pencil, Creatify, Persado, Arcads cost $0.10-2/variant); always with human creative direction.
- AI-disclosure required (Meta March 2026) on AI-generated content.

## Purpose

Per campaign / ad set:
1. 5-10 creative concept briefs (distinct angles, not 5 variations of one).
2. Format hierarchy per platform.
3. UGC creator briefs (for TikTok / IG Reels / Meta Reels primary).
4. AI variant strategy (when justified).
5. Refresh cadence.

## Inputs
- `paid-search.md` / `paid-social.md` / `paid-mobile.md` (the campaign).
- `messaging-architecture.md`, `awareness-stages.md`, `voice-of-customer.md` (VOC quotes for hooks).
- `visual-direction.md` if available.
- `banana-bridge.md` for image generation guidance.

## Outputs
- `docs/marketing-plan/05-paid/ad-creative-briefs/[campaign]-CON-[NNN].md` per concept.
- DEC-300 to DEC-329 (creative briefs decisions)

Note: DEC-300+ collides with content-strategy. Adjust to DEC-310-329 for creative briefs.

## Per-concept brief template

```markdown
# Creative Concept: CON-[NNN] — [Working title]

## Campaign context
- Channel: [Meta / TikTok / LinkedIn / Reddit / X / Pinterest / etc.]
- Campaign: [CMP-NNN]
- Awareness stage: [from awareness-stages.md]
- Audience: [targeting summary]

## The concept (one-paragraph thesis)
[What does this ad do? What's the hook? What angle on the product / problem / customer does it take?]

## The hook (first 1-3 seconds)
- Visual hook: [what's on screen at 0:00-0:03]
- Text hook (if applicable): [opening line]
- Voice/audio hook: [opening line / sound]

## The message (mid-frame, 0:03-0:15)
- Specific outcome / proof point
- VOC verbatim if applicable: "[quote]"
- The "I had this exact problem" moment

## The CTA (end frame, 0:15-0:30)
- Specific stage-matched CTA
- Where they go (LP URL with UTMs)

## Format spec
- Primary format: 9:16 (TikTok / Meta Reels / IG Reels)
- Cut-downs: 1:1, 4:5, 16:9 if budget supports
- Duration: 15s / 30s / 60s — specify
- Captions: required (most muted)
- Branding visible: where + when

## Production type
- UGC (creator-shot): [if so, creator brief follows]
- Founder-recorded: [if so, founder script follows]
- Studio-produced: [budget + agency]
- AI-generated variants: [if so, source brief + variation parameters]
- Screen-recording (product demo): [if so, screen-flow script]
- Image (static ad): [if so, banana brief]

## UGC creator brief (if applicable)
- Creator profile: [follower count, demographic match, vibe]
- Hook spec: "Show [specific moment] in first 2 seconds"
- Message spec: [what they should say in their words]
- B-roll spec: [product shots]
- Call-out spec: [where to mention the product name]
- Length: [seconds]
- Format: 9:16 vertical, captions burned in
- Deliverables: 1 master + 3 hook variants
- FTC disclosure: #ad / "Paid partnership"

## Founder-recorded script (if applicable)
[Word-by-word script, captioned-friendly, 30 sec.]

## Banana brief (if static / AI image needed)
[Per banana-bridge.md — subject, composition, lighting, lens, mood, brand alignment, anti-pattern, dimensions.]

## Anti-patterns for this concept
- NOT [generic startup-laptop shot]
- NOT [stock-photo-handshake]
- NOT [AI-smooth-face]
- NOT [over-polished testimonial cadence]
- NOT [misleading "results" implication]

## AI-disclosure status
- AI-generated content present: [yes/no]
- Will be tagged per Meta March 2026 policy: [yes/no]
- Faces: [real / illustrated / AI-generated — if AI-generated faces, refused unless meets disclosure rules]

## Verification before launch
- Brand voice match: [pass/fail per brand-strategy.md voice]
- Awareness-stage match: [pass/fail]
- AI-cadence test: [pass/fail per anti-slop rubric]
- Legal review (regulated domain): [pass/N/A]
- VisualForge token consistency (if VF present): [pass/fail]

## Performance hypothesis
- Expected: [CTR, CPC, CPA range based on baselines]
- Kill if: [criterion]
```

## Per-campaign concept set rules

- 5-10 distinct concepts (different angles, not variations).
- Each concept: 3-5 variants (hook, length, format).
- Total variants per ad set: 20-40 typical.
- Refresh: 2-4x/month for active campaigns.
- Top performers: build derivatives.
- Bottom performers: kill within 14 days.

## Format hierarchy decision (cite from paid-social.md)

[Reference paid-social.md format hierarchy table.]

## AI variant generation (T2+)

When budget supports:
- Pencil ($0.10-1/variant) for image variants.
- Creatify ($0.5-2/variant) for video.
- Persado for copy variants.
- Arcads for full ad mocks.

Discipline: AI provides variants under human creative direction. Brief comes from this skill; AI generates options; human selects.

## Decision cards
[DEC-310 to DEC-329]

## What we are intentionally NOT doing
- 5 variations of one concept (vs 5 concepts).
- AI-only creative without human direction.
- Stock-photo-handshake / generic-startup-laptop / smooth-AI-face slop.
- Misleading implication of results we can't substantiate.
- AI-generated customer / executive faces presented as real.

## Sources and basis
V3 §4.2 (Meta creative), §9.3 (AI ad creative variants), `ai-saturation-watch.md`.
```

## Sources and basis
V3 §4.2, §9.3.
