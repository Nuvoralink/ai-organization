# Daily Operations Journal (Agentic Mode Template)

This file lives at `docs/marketing-plan/operations/YYYY-MM-DD.md` and is written automatically by every agentic daily loop.

---

# Operations Journal — 2026-05-20

**Loop type:** Light (daily)
**Run start:** 2026-05-20 09:00 UTC
**Run end:** 2026-05-20 09:42 UTC
**Wall time:** 42 minutes
**Cost (LLM tokens):** ~85,000 input / ~12,000 output / ~$0.31 estimated
**MCP calls:** 18 (GA4: 4, Meta Ads: 6, Klaviyo: 4, LinkedIn: 4)

## What was done

1. **Telemetry pulled (GA4):** Yesterday's site sessions, conversion rate, traffic sources.
   - Session count: 247 (-12% WoW).
   - Conversion rate: 2.8% (stable).
   - Top source: Direct (42%), Organic search (28%), Founder LinkedIn (18%).

2. **Ad performance pulled (Meta):** Yesterday's spend, CPM, CTR, CPA.
   - Total spend: $128.
   - Best CPA: $14.20 (CMP-MOB-101 ASA branded).
   - Worst CPA: $47.10 (CMP-AD-042 retargeting — flagged for review).

3. **Email lifecycle health (Klaviyo):**
   - Welcome flow: 24 sends, 8 clicks, 1 trial activation.
   - Trial-end flow: 12 sends, 3 conversions.
   - Bounce rate: 0.8% (healthy).
   - Spam complaint rate: 0% (healthy).

4. **Cold email deliverability check:**
   - Yesterday's sends: 80 across 2 inboxes.
   - Reply rate: 4.8% (above 3.43% baseline).
   - Bounce rate: 1.2% (healthy).

5. **Founder LinkedIn engagement triage:**
   - Posts yesterday: 1.
   - Comments to reply: 12 surfaced.
   - DMs received: 4 — 2 prospect-type (queued for response review).

6. **Anomaly check:**
   - CPA on CMP-AD-042 up 50% week-over-week → ⚠️ FLAGGED (see below).

7. **Content drafts generated for tomorrow:**
   - 1 LinkedIn carousel: "How we A/B tested our pricing page" (8 slides).
   - 1 X thread: "Three signals that our ICP was wrong" (7 tweets).
   - 1 ad creative variant brief: ASSET-AD-051 (refresh of fatigued creative).

## What was queued for approval

| ID | Type | Channel | Status |
|---|---|---|---|
| APR-2026-05-20-001 | LinkedIn post | Founder organic | PENDING |
| APR-2026-05-20-002 | Ad creative variant | Meta Reels | PENDING |
| APR-2026-05-20-003 | Cold email batch (50) | Apollo | PENDING |
| APR-2026-05-20-004 | Newsletter send | Klaviyo | PENDING |

## What was blocked

1. **Auto-spend increase on CMP-MOB-101 ASA** — proposed +$200/day based on ROAS signal.
   - **Blocked because:** monthly spend cap not yet set; founder approval required for budget changes >10%.
   - **Action:** logged for human review at weekly checkpoint.

2. **Auto-pause CMP-AD-042 retargeting** — CPA up 50% WoW.
   - **Blocked because:** kill criteria (kill at 100% sustained, currently 50%) not yet met.
   - **Action:** anomaly flagged; surfaced to founder for decision.

## Anomalies surfaced

### Anomaly 1: CMP-AD-042 CPA up 50% WoW
- **Threshold:** 50% (matched).
- **Current CPA:** $47.10 (target $30).
- **Trend:** sustained 3 days.
- **Likely cause:** Creative fatigue (CPM-r rising from $4.20 → $6.80; CTR falling 1.8% → 1.1%).
- **Recommended action:** kill creative; rotate to ASSET-AD-051 (already in approval queue).
- **Status:** AWAITING FOUNDER DECISION.

## What's on tomorrow's queue

- Refresh competitive-intel snapshot (weekly check on 3 competitors).
- Generate weekly content batch (5 LinkedIn + 14 X posts).
- Update OKR progress dashboard.
- Light retention cohort check.

## Cost summary (running monthly total)

- LLM tokens this month: ~2.4M input / ~340K output.
- Estimated LLM cost: ~$8.50.
- Banana image generations this month: 47 ($14).
- MCP calls this month: ~540.

## Health flags

- ✅ Deliverability (cold email + lifecycle): healthy.
- ✅ Brand SEO trend: stable.
- ⚠️ Meta retargeting: fatigue forming; rotation queued.
- ✅ Founder cadence: 5 posts last week (target 5-7 — on track).
- ✅ Approval queue depth: 4 pending (healthy; threshold is 20).

---

## What this template demonstrates

- **Daily journal is auto-written.** No human needs to write it.
- **Anomalies surface explicitly.** No surprise spend / no surprise content shipped.
- **Approval queue depth tracked.** If exceeds 20, agentic mode pauses new generations.
- **All MCP calls accounted for** (rate-limit visibility).
- **Cost summary on every journal** (no surprise bills).
- **Health flags at a glance.**

This is what "AI runs marketing department independently" actually looks like in practice: heavy human oversight + safety guardrails + transparent accounting.
