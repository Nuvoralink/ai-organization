---
name: marketforge-cold-calling
description: Build cold calling program when it fits (local service B2B, $10K+ ACV B2B with operations buyers, <200-account ABM). Script structure + objection handling. Use as Phase 6 step 4.
---

# MarketForge Cold Calling

Apply V3 §5.3 (Cold calling — unfashionable but still works in specific segments).

## Global quality rules

- Cold calling is unfashionable. Don't recommend unless the segment justifies.
- Justified for: local service B2B (HVAC, MSP, accounting), B2B SaaS at $10K+ ACV with ops buyers, ABM motions targeting <200 accounts.
- Pickup rates 1-3%; conversation-to-meeting 10-20% of pickups.
- Mail-before-call increases connect rate 30-50% (per ANA/DMA + practitioner data).

## Purpose

1. Segment justification (is cold calling worth it?).
2. Call list source + signal triggers.
3. Script structure (open, qualify, value prop, soft-CTA).
4. Objection handling library.
5. Voicemail strategy.
6. Compliance (TCPA — though TCPA is primarily SMS; B2B calls have different rules).

## Inputs
- `marketing-brief.md` (ACV; segment).
- `icp-and-personas/`.
- `direct-mail-abm.md` (mail-first sequences).

## Outputs
- `docs/marketing-plan/06-outbound/cold-calling.md`
- DEC-400 to DEC-409

## Structure

```markdown
# Cold Calling Strategy

## Segment fit check
[Does this product / business model justify cold calling?]
- Local service B2B (HVAC, MSP, accounting, legal SMB): YES
- B2B SaaS at $10K+ ACV with ops buyers: YES (often combined with email + LI)
- ABM 1:few targeting <200 accounts: YES
- DTC ecom: NO (consumer cold calling = TCPA exposure)
- B2B SaaS at $20-500/mo: NO (uneconomic)
- Marketplace / creator: NO

If segment fit fails → recommend skipping cold calling; reallocate budget.

## Call list

### Sources
- Apollo (B2B numbers verified).
- ZoomInfo (more accurate but expensive).
- Crunchbase (for funding-event triggers).
- LinkedIn Sales Nav (identify; verify number elsewhere).

### Signal triggers (preferred targeting)
- Recent funding (in market for tools).
- Recent hire of decision-maker (new exec = ready to evaluate).
- Tech stack change.
- Specific job posting indicating expansion.

## Script structure

### Opening (5-10 seconds)
- Identify yourself with name + company.
- Permission-based opener: "Did I catch you at an OK time?" — increases listen rate.
- Specific reason for the call (NOT "to introduce" — specific value claim).

### Pattern interrupt
- One sentence that breaks the cold-call cadence.
- E.g., "I'll be honest — this is a cold call. I'm not going to read a script. I have 30 seconds to see if there's a reason to talk further, or I'll get off your line."

### Qualify (60-90 sec)
- 1-2 questions confirming fit.
- NOT "do you have problems with X?" (everyone says no).
- INSTEAD "When you think about [specific operational situation], how does [pain] show up for you?"

### Value prop (60 sec)
- Specific outcome with named comparable customer.
- Specific number (saved hours, reduced cost).
- Tie back to their stated context.

### Soft-CTA
- NOT "want to book a demo?"
- INSTEAD "Worth 15 minutes to dig deeper? I'll send a calendar link if you want."

## Objection-handling library

For each common objection:

### "I'm busy"
- "I figured. Mind if I send a 1-paragraph email with the specific thing I called about, so you can react when convenient?"

### "We're not looking"
- "Got it. Just so I don't waste your time later — what would have to change for you to look?"

### "Send me info"
- "Sure. What part is most relevant — [option A] or [option B]?" (Forces them to clarify.)

### "We already use [Competitor]"
- "Nice. What works well about it? And what's the thing that bugs you?" (Most have a complaint; that's the opening.)

### "How did you get my number?"
- Honest answer (Apollo / ZoomInfo / publicly available); apologize if they're irritated; offer to remove.

### "Stop calling me / put me on do-not-call"
- Honor immediately. Add to do-not-call list. Apologize.

## Voicemail strategy

### Voicemail option A: Brief
- "Hi [name], this is [you] from [company] — calling because [specific signal]. I'll follow up by email. Number's [###] if you want to call back."

### Voicemail option B: Don't leave one
- Some practitioners argue voicemails reduce callback rates (suspicion). Test.

## Multi-channel discipline

Cold calling alone is the weakest version of this play. Strongest:

- Day -2: LinkedIn engagement on a post.
- Day -1: Email with one specific value prop.
- Day 0: Cold call referencing the email.
- Day +1: Follow-up email referencing the call.
- Day +3: LinkedIn DM if no response.

## Volume + cadence

- 50-100 calls/day per SDR (when call list is high-quality).
- 5-15% pickup rate.
- 1-3 conversations per day per SDR.
- 0.5-1 meeting booked per SDR per day at good performance.

## Compliance

- TCPA: primarily SMS but covers some auto-dialed calls. B2B calls to direct lines generally OK; consumer cell numbers without consent are exposure.
- Do-not-call list: honor immediately; maintain internal DNC list.
- Recording: state-by-state laws; disclose if recording.

## Anti-patterns

- Cold calling consumer numbers (TCPA exposure).
- Auto-dialer / robocaller on consumer numbers (TCPA per-call statutory damages).
- "Power dialer" without quality conversation prep.
- Skipping multi-channel context.
- Recommending cold calling for products where pickup rate is <0.5% (e.g., highly technical product to busy executives in tech companies).
- Cold calling without permission-based opener.

## Decision cards
[DEC-400 to DEC-409]

## Kill criteria
- 30-60 days per SDR ramp; pickup rate <1% or conversation-to-meeting <5% of pickups sustained → re-evaluate list / script.

## What we are intentionally NOT doing
- Cold calling segments where it doesn't fit (DTC, low-ACV SaaS, etc.).
- Auto-dialing consumer numbers (TCPA exposure).
- Skipping the multi-channel sequence.
- Treating cold calling as standalone (call without email-or-LI context is weaker).

## Sources and basis
V3 §5.3 (Cold calling).
```

## Sources and basis
V3 §5.3.
