---
name: marketforge-ad-creative-production
description: Produce ad creative variants via banana + UGC briefs + founder-recorded specs. 9:16 vertical priority. AI-disclosure compliance. Use as Phase 10 step 2.
---

# MarketForge Ad Creative Production

Read `banana-bridge.md` and `ad-creative-brief.md` (the brief authored upstream).

## Global quality rules

- 5-10 concepts × 3-5 variants per concept = 20-40 variants per ad set typical.
- 9:16 vertical priority.
- AI-disclosure on AI-generated content (Meta March 2026).
- Founder / customer / employee real faces for human subjects.

## Purpose

1. Generate visual assets per `ad-creative-brief.md` concepts.
2. Coordinate UGC creator briefs (when applicable).
3. Manage approval queue (agentic mode).
4. File output to correct paths.

## Inputs
- `ad-creative-brief.md` (the concepts + briefs).
- `visual-direction.md`.
- `paid-search.md` / `paid-social.md` / `paid-mobile.md` (campaign context).

## Outputs
- `docs/marketing-plan/10-visual-assets/ad-creative/[campaign]/CON-[NNN]/V[N].png` (or relevant extension)
- `docs/marketing-plan/10-visual-assets/ad-creative/[campaign]/CON-[NNN]/script.md` (for video)
- DEC-710 to DEC-719 (per-concept production decisions)

## Process

```markdown
# Ad Creative Production: CON-[NNN]

## Brief (from ad-creative-brief.md)
[Excerpt the relevant brief]

## Production type
- [UGC / Founder / Studio / AI variants / Screen-recording / Image]

## Banana brief (if image / AI variant)
[Per banana-bridge.md format — subject, composition, lighting, lens, mood, brand alignment, anti-pattern, dimensions]

## UGC creator brief (if UGC)
[Per ad-creative-brief.md UGC section]

## Founder script (if founder)
[Word-by-word script, 30 sec]

## Variants requested
- V1: [variation parameter]
- V2: ...
- V3: ...

## Files generated
- Path 1: docs/marketing-plan/10-visual-assets/ad-creative/[campaign]/CON-[NNN]/V1.png
- Path 2: ...

## Approval status (agentic mode)
- Approval queue: APR-YYYY-MM-DD-NNN
- Approved: yes / no / pending

## Performance hypothesis
- Expected CTR / CPC / CPA range.
- Kill if: [criterion].

## Decision cards
[DEC-710+]
```

## When invoked
- Reads brief from `ad-creative-brief.md`.
- For each concept: invokes banana for image variants OR produces UGC creator brief OR produces founder script.
- For agentic mode: routes to approval queue.

## What we are intentionally NOT doing
- Generating without brief from upstream subskill.
- AI-faces of real people.
- Skipping AI-disclosure compliance.

## Sources and basis
V3 §4.2, §9.3. `banana-bridge.md`.
