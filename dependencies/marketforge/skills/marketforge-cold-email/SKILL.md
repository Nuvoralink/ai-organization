---
name: marketforge-cold-email
description: Build cold email system. Deliverability stack (SPF/DKIM/DMARC, separate domain, warmup, verification). Signal-based personalization > template-fill AI. CAN-SPAM / GDPR / UK PECR compliance. Use as Phase 6 step 1.
---

# MarketForge Cold Email

Apply V3 §5.1 (Cold email). Apply `ai-saturation-watch.md`.

## Global quality rules

- Average B2B reply rate dropped 8.5% (2019) → 6.8% (2023) → ~3.43% (2026) per Instantly 2026 + Belkins 16.5M-email analysis.
- Signal-based personalization (real trigger events) = 15-30% reply rates; superficial template-fill AI = 3-4%.
- Deliverability stack is non-negotiable. SPF + DKIM + DMARC properly configured; separate sending domain; warmup 4-6 weeks; verification; <2% bounce; <0.1% spam complaint.
- AI personalization saturation: "Hi {firstName}, noticed {company} just {recentPost}" is detected as AI in seconds (per `ai-saturation-watch.md` Cycle 1).
- CAN-SPAM: US allows unsolicited B2B with opt-out + physical address. GDPR: EU requires legitimate-interest justification + easy opt-out. UK PECR: similar. Get legal counsel.

## Purpose

1. Deliverability stack design + ongoing health monitoring.
2. Target list build (per ICP + signal triggers).
3. Sequence design (initial + follow-ups; signal-based personalization).
4. Sending stack selection (Instantly / Smartlead / Apollo).
5. Reply triage + response handling.
6. Compliance (CAN-SPAM / GDPR / UK PECR / state laws).

## Inputs
- `icp-and-personas/` (target list + signal triggers).
- `messaging-architecture.md` (voice + propositions).
- `channel-strategy.md` (cold email selected as harvest channel).
- `competitive-intel.md` (positioning differentiation in copy).

## Outputs
- `docs/marketing-plan/06-outbound/cold-email-system.md`
- DEC-360 to DEC-379

## Structure

```markdown
# Cold Email System

## Deliverability stack (non-negotiable)

### Domains
- **Primary brand domain:** [brand.com] — for transactional + customer email
- **Cold-sending domain 1:** [trybrand.com] — for cold outbound (separate to protect primary)
- **Cold-sending domain 2:** [getbrand.com] — for additional cold volume
- **Inboxes per domain:** 2-4 (rotation)
- **Total cold-sending capacity:** ~200-400 sends/day across all inboxes after warmup

### Authentication
- **SPF:** properly configured + tested
- **DKIM:** signed with verified key
- **DMARC:** p=quarantine or p=reject; reporting to legitimate address
- **MTA-STS, BIMI:** if Gmail Microsoft requirements increase

### Warmup
- **Duration:** 4-6 weeks before any production sending
- **Tools:** Mailwarm, Warmup Inbox, built-in warmup in Smartlead / Instantly
- **Goal:** organic-looking send history; positive engagement signals

### Verification
- **Pre-send:** every email verified (NeverBounce, ZeroBounce)
- **Bounce rate target:** <2% sustained
- **Spam complaint target:** <0.1% (Gmail's threshold for sender reputation hit)

### Ongoing monitoring
- Daily: bounce rate, spam complaint rate, delivery rate.
- Weekly: inbox-placement testing (GlockApps / MailGenius).
- Monthly: domain reputation (Google Postmaster Tools / Microsoft SNDS).

## Target list build

### List sources
- Apollo: B2B contact database.
- Clay: enrichment + workflow.
- Hunter / Findymail / Snov.io: email finding.
- ZoomInfo: enterprise (T3+).
- LinkedIn Sales Navigator: identifier source.

### Targeting criteria (per ICP)
[Specific firmographic + behavioral + role filters from ICP definition.]

### Signal-based targeting (the productive approach)
- Funding event in last 90 days.
- Recent hire in target role.
- Tech stack change (added or dropped specific tool).
- LinkedIn post about specific pain.
- Job posting indicating expansion / pain.
- Recent news / press / podcast appearance.

Tools: Clay (signal aggregator), Apollo (signal triggers), Crystal Knows (personality).

## Sequence design

### Open: signal-based first line
NOT: "Hi {firstName}, noticed {company} recently {recentEvent}..." (AI-detected)

YES: Real signal-based personalization with specific implication:
"Saw [Company] just hired a Director of Demand Gen. If you're rebuilding the stack, [Product] handles [specific aspect] without the multi-tool maintenance. Worth a 15-min look?"

### Body: 50-80 words max
- One specific value claim.
- One proof point (number + source if shareable).
- One soft CTA (NOT "book a demo" first touch).

### CTA: soft for touch 1, harder for touch 3+
- Touch 1: "Worth a quick chat?" or "Want me to send the 1-pager?"
- Touch 2: "Did the [previous email] land?"
- Touch 3-4: "Specific question — happy to answer in writing"
- Touch 5: "Last note from me on this — closing the loop"

### Sequence cadence
- Touch 1: Day 0
- Touch 2: Day 3
- Touch 3: Day 7
- Touch 4: Day 12 (optional)
- Touch 5: Day 21 (close-the-loop)

## AI in cold email — what works, what doesn't

### Works (🤖🤖 automatable)
- Signal aggregation (Clay + Apollo).
- Lookalike list expansion.
- Variant generation under human curation.
- Reply triage / category routing.
- Deliverability monitoring.

### Doesn't work (slop-producing)
- AI writing entire emails based on template + variables.
- AI "research" sentences that don't deliver insight.
- "Hi {firstName}, noticed {company} just {recentPost}" — saturated, detected.

## Sending stack

| Tool | When |
|---|---|
| Instantly | Most SMB cold email; intuitive |
| Smartlead | Multi-domain rotation; more advanced |
| Apollo | Data + sending in one (compromises deliverability on shared infra) |
| Lemlist | Sequences with personalization hooks |
| Mailshake | Older but stable |

## Compliance

### US (CAN-SPAM)
- Sender identification clear (sender domain, physical address).
- Subject not deceptive.
- Opt-out mechanism + honored within 10 business days.
- Honest "From" / "To" / "Subject."

### EU (GDPR)
- Legitimate-interest justification documented.
- Easy opt-out (one-click).
- Data minimization (only necessary info processed).
- Right to deletion honored.

### UK (PECR)
- Similar to GDPR for B2B; consumer requires consent.

### State laws (US)
- California CCPA / CPRA.
- Maryland, Virginia, Colorado, Connecticut, Utah additional rules.

## Reply handling

### Categories
- **Interested → meeting request:** book ASAP; CRM update.
- **Interested → asking question:** answer; nudge to meeting.
- **Not now → follow up later:** add to nurture (90-day re-touch).
- **Wrong person:** ask for intro.
- **Wrong fit:** disqualify + politely close.
- **Negative:** opt-out immediately; analyze for pattern.
- **Bounce / OOO:** retry after OOO end or remove.

## Kill criteria (per kill-criteria-by-channel.md)
- 4-6 weeks after warmup; reply rate <1% with deliverability verified → kill or restructure (different list / different angle / different sequence).

## Anti-patterns

- AI hyper-personalization at scale (saturation collapse).
- No deliverability verification before sending.
- Sending from primary brand domain (reputation risk).
- Skipping warmup ("we'll just go for it").
- Spamming the same list with multiple sequences.
- Bidding on competitor names from sales rep emails (creates legal exposure).
- Ignoring CAN-SPAM physical address requirement.

## Decision cards
[DEC-360 to DEC-379]

## What we are intentionally NOT doing
- AI-generated bulk personalization (saturated).
- Sending without deliverability infrastructure.
- Cold email to consumers (CAN-SPAM B2C / GDPR violation in most cases).
- Buying lists from grey-market data providers (likely GDPR violation + low quality).

## Sources and basis
V3 §5.1 (Cold email).
Instantly 2026 benchmark, Belkins 16.5M-email analysis — evidence B.
Newmail / Sendr / Salesforge 2026 signal-based research — evidence D with corroboration.
```

## When to delegate
- `marketing-skills:cold-email` for sequence drafts.

## Sources and basis
V3 §5.1.
