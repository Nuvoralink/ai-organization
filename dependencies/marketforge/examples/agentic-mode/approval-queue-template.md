# Approval Queue (Agentic Mode Template)

In agentic mode, every action that publishes externally goes through this queue. Human approves before MarketForge invokes the relevant MCP to execute.

This file lives at `docs/marketing-plan/operations/approval-queue.md` during agentic runs.

## Pending

### APR-2026-05-20-001
- **Type:** Social post (LinkedIn — founder account)
- **Generated:** 2026-05-20 09:14
- **Channel:** LinkedIn organic
- **Content preview:** "Last week we shipped a feature that took 47 customer interviews to design correctly. Here's what 6 of them told us about why our old approach was wrong..."
- **Asset path:** docs/marketing-plan/operations/drafts/2026-05-20-li-001.md
- **Source DEC:** DEC-410 (LinkedIn cadence), DEC-478 (founder content topic spine)
- **Status:** PENDING
- **Auto-expire:** 2026-05-22 09:14 (48h SLA before auto-archive as unactioned)

### APR-2026-05-20-002
- **Type:** Ad creative variant (Meta Reels 9:16)
- **Generated:** 2026-05-20 09:18
- **Channel:** Paid social (Meta)
- **Brief:** ASSET-AD-042 — UGC-style hands using product in coffee shop
- **Image path:** docs/marketing-plan/operations/drafts/asset-ad-042.png
- **Source DEC:** DEC-282 (Meta creative concept set)
- **Status:** PENDING

### APR-2026-05-20-003
- **Type:** Cold email batch (50 recipients)
- **Generated:** 2026-05-20 09:25
- **Channel:** Cold email
- **Sequence:** SEQ-031 (signal-based: recent funding announcement)
- **Recipient list:** docs/marketing-plan/operations/drafts/cold-email-batch-2026-05-20.csv
- **Source DEC:** DEC-361 (signal-based personalization), DEC-365 (deliverability stack)
- **Status:** PENDING

### APR-2026-05-20-004
- **Type:** Email lifecycle send (newsletter)
- **Generated:** 2026-05-20 10:00
- **Channel:** Email lifecycle (Klaviyo)
- **Audience:** Newsletter subscribers (1,420 engaged in last 30 days)
- **Subject line variants:**
  - A: "How we found the right ICP in 47 interviews"
  - B: "47 customer interviews. Here's what we got wrong."
- **Body draft:** docs/marketing-plan/operations/drafts/newsletter-2026-05-20.md
- **Source DEC:** DEC-501 (newsletter cadence)
- **Status:** PENDING

## Recently approved (rolling 7-day archive)

### APR-2026-05-19-007 — APPROVED 2026-05-19 14:23
- Type: LinkedIn post
- Approved by: Founder
- Executed: 2026-05-19 15:00 (scheduled)
- Outcome: 247 engagements, 3 inbound DMs, 1 trial signup attributed.

## Recently rejected (rolling 7-day archive)

### APR-2026-05-19-005 — REJECTED 2026-05-19 12:11
- Type: Ad creative variant
- Reason: "Off brand voice — too aggressive for our audience."
- Action: Brief revised; new variant in next batch.

## How to approve / reject

### Via file edit
Change `Status: PENDING` to `Status: APPROVED` or `Status: REJECTED [reason]`.

### Via command
```
$marketforge approve APR-2026-05-20-001
$marketforge reject APR-2026-05-20-002 reason="off-voice"
```

### Bulk
```
$marketforge approve-all-of-type=social-post
$marketforge reject-all-batch=2026-05-20
```

## Queue health rules

- Queue exceeds 20 pending items → MarketForge pauses new generations.
- Items past 48h SLA auto-archive as unactioned (logged for review).
- Approval queue file is read by next agentic loop; approved items execute.

## Approval auditing

Every approval / rejection logged with:
- Timestamp
- Approver identity
- Reason (for rejections)
- Final outcome (for approvals)

Audit file: `docs/marketing-plan/operations/approval-audit.md` (append-only).
