---
name: marketforge-cold-linkedin-outreach
description: Build cold LinkedIn outreach system. Connection + content-engagement-first cadence; rate-limited (~100/week safe). Sales Navigator config. Use as Phase 6 step 2.
---

# MarketForge Cold LinkedIn Outreach

Apply V3 §5.2 (Cold LinkedIn outreach).

## Global quality rules

- Less saturated than cold email but rate-limited (~100 connection requests/week safely).
- Best when paired with content engagement (comment thoughtfully on prospect's recent post BEFORE connect).
- Sales Navigator ($99-149/user/mo) provides the targeting + InMail volume.
- AI-bulk LinkedIn DM is now saturated (per `ai-saturation-watch.md`).

## Purpose

1. Target list build (Sales Navigator + signal triggers).
2. Engagement cadence (comment → connect → DM).
3. Connection request copy.
4. DM sequence after connection.
5. Volume management (rate limits + reply triage).

## Inputs
- `icp-and-personas/` (target individuals).
- `messaging-architecture.md`.
- `founder-content.md` if founder content is active (creates DM-friendly inbound).

## Outputs
- `docs/marketing-plan/06-outbound/cold-linkedin.md`
- DEC-380 to DEC-389

## Structure

```markdown
# Cold LinkedIn Outreach

## Target list (Sales Navigator)

### Saved searches
- Role: [specific title patterns]
- Function: [departments]
- Seniority: [VP / Director / Manager / IC]
- Company size: [employee count]
- Geography: [if applicable]
- Industry: [verticals]
- Signal filters:
  - Recently changed jobs (last 90 days)
  - Hired in role recently
  - Posted in last 30 days
  - Mentions specific competitor / pain in profile

### Refresh cadence
- Daily: review new matches.
- Weekly: 50-80 new targets identified.

## Engagement cadence (the key discipline)

### Day -7 to -3: Soft engagement
- Like 2-3 of their recent posts (genuine; not first thing).
- Comment thoughtfully on 1 post (substantive, not "Great post!").

### Day 0: Connection request
- Optional note (10-12 words max — long notes trigger spam detection).
- Reference shared context: "Saw your post on [topic] — would value adding to my network."
- NO pitch in the connection request.

### Day +3 (after acceptance): First DM
- NOT a pitch.
- Reference what attracted you to connect: "Thanks for the connect. Your [specific point] from [post] resonated — we just hit a similar problem at [scale]."
- Build rapport. Maybe ask a question.

### Day +10-14: Soft pitch (if relevant)
- Tied to the conversation thread.
- Specific value claim.
- Soft CTA (call vs. demo vs. resource).

### Day +21+: Nurture if no response
- Tag for future content engagement.
- Add to LinkedIn-friendly newsletter list (with permission).

## Connection request copy (10-12 words)

Templates (avoid AI cadence):
- "Saw your [topic] post — would value adding to my network."
- "Your work on [project] caught my attention. Open to connecting?"
- "Working on similar [topic] at [company]. Connect?"

## Sales Navigator config

- $99-149/user/month
- Settings: 100 connection requests/week max (LinkedIn unwritten limit; varies by account age).
- Lead/Account list saved searches.
- TeamLink for warm-intro discovery.
- Notes per prospect.

## Volume rules

- 100 connection requests / week MAX per account.
- 50-80 connection requests / week for new accounts (<6 months).
- Multiple-inbox strategy: not recommended on LinkedIn (creates terms-of-service issues).
- One account per real person.

## Anti-patterns

- AI-bulk DMs (saturated; detected; account-ban risk).
- Mass-pitch in connection request (low accept rate; spam flag).
- LinkedIn automation tools that scrape + auto-message (TOS violation; account ban).
- Buying connection / network growth (TOS violation).
- Sending the same DM template to 200 people (detected).

## Compliance

- LinkedIn TOS: no automation that simulates human behavior at scale.
- LinkedIn Connection limit: ~30K total connections per account.

## Decision cards
[DEC-380 to DEC-389]

## Kill criteria
- 6-8 weeks; connection acceptance <20% on relevant ICP targeting → re-evaluate ICP or copy.
- 6-8 weeks; no meeting per 100 accepted connections → re-evaluate sequence + DM cadence.

## What we are intentionally NOT doing
- LinkedIn automation tools (TOS violation, account ban risk).
- AI-bulk DMs.
- Buying followers / connections.
- Connection requests with pitches in them.

## Sources and basis
V3 §5.2.
```

## When to delegate
- `marketing-skills:cold-email` for related cold-outreach patterns.

## Sources and basis
V3 §5.2.
