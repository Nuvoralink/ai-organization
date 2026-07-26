# Agentic Operations Protocol

MarketForge's continuous-operations mode. Use when the user wants the marketing system to keep running between human sessions — daily content production, ad performance triage, lifecycle iteration, attribution refresh, anomaly surfacing.

## Activation

Three ways to activate:

1. **Explicit invocation:** `$marketforge agentic=on cadence=daily`
2. **Scheduled task (cron):** Recurring loop registered via `scheduled-tasks` MCP.
3. **Trigger event:** Inbound webhook (e.g., new lead, support ticket, review posted).

## Three loop frequencies

### Light loop (daily)
- Wall time: 15-60 min.
- Reads: yesterday's analytics, ad performance, inbound replies, support tickets, social mentions, reviews posted.
- Decides: anomaly check, kill-criterion check, content calendar gates, lifecycle trigger events.
- Produces: today's content drafts (1-2 social posts, 1-2 ad creative variants if refresh due, 0-1 blog drafts if scheduled).
- Surfaces: anomalies, kill-criterion triggers, items needing approval.
- Files: `docs/marketing-plan/operations/YYYY-MM-DD.md` operations journal.

### Medium loop (weekly)
- Wall time: 1-2 hours.
- Reads: week's analytics, cohort retention update, channel performance refresh, attribution triangulation.
- Decides: week's content + creative queue, weekly performance review, channel-by-channel kill/scale check.
- Produces: next week's content calendar, refreshed ad creative briefs, cohort retention review, weekly attribution report.
- Surfaces: weekly performance summary, weekly approval queue, weekly anomalies.
- Files: `docs/marketing-plan/operations/weekly/YYYY-WW.md`.

### Heavy loop (monthly)
- Wall time: 4-8 hours.
- Reads: monthly all-channel performance, MMM refresh (if T3+), cohort LTV update, attribution triangulation, competitive-intel refresh, AI-saturation watch refresh.
- Decides: channel review, budget re-allocation proposal, brand-vs-performance check, OKR progress check, mid-quarter checkpoint (every other month).
- Produces: monthly performance dashboard, budget re-allocation proposal, refreshed channel scoring, monthly POV piece for content if scheduled, original-research piece if quarterly.
- Surfaces: monthly performance review, channel-mix proposal, OKR progress, deferred decisions needing user input.
- Files: `docs/marketing-plan/operations/monthly/YYYY-MM.md`.

### Quarterly heavy (every 3 months)
- Full re-run of strategy phase (`marketforge-channel-strategy`, `marketforge-portfolio-construction`, `marketforge-brand-vs-performance`, `marketforge-okr-quarterly-planning`).
- Quarterly retrospective: what worked, what didn't, what to kill/scale.
- Refresh of ICP and personas if VOC signals shifted.
- Refresh of positioning if competitive landscape shifted.
- Files: `docs/marketing-plan/operations/quarterly/YYYY-QN.md`.

## Required tools / MCPs

Agentic mode functions partially even with no tools, but is dramatically more capable when MCPs are wired. Expected integration points:

### Analytics (read)
- GA4 MCP (or analytics-mcp).
- Plausible.
- Mixpanel.
- PostHog.
- Amplitude.

**Used for:** daily session count, conversion rate, traffic by source, event firing health.

### Ad platforms (read + write-with-approval)
- Meta Marketing API MCP.
- Google Ads API MCP.
- LinkedIn Marketing API MCP.
- TikTok Ads API MCP.
- Apple Search Ads / AppsFlyer / Adjust MCP.

**Used for:** daily ad performance pulls; weekly creative refresh; monthly budget re-allocation. Writes require approval.

### ESP / lifecycle (read + send-with-approval)
- Klaviyo MCP.
- Customer.io MCP.
- HubSpot MCP.
- Loops MCP.
- ConvertKit / Kit MCP.

**Used for:** flow performance pulls; new flow drafts; campaign sends with approval.

### CRM (read + update-with-approval)
- HubSpot MCP.
- Salesforce MCP.
- Apollo MCP.
- Clay MCP.

**Used for:** ICP enrichment; signal-based outbound trigger; pipeline tracking.

### Social (post-with-approval)
- LinkedIn MCP.
- X/Twitter MCP.
- Buffer / Hootsuite MCP (multi-platform).

**Used for:** scheduled organic posts after approval; engagement triage (reply queue).

### SEO + GEO (read)
- Ahrefs MCP.
- Semrush MCP.
- Google Search Console MCP.
- Profound MCP / Otterly / Peec AI.

**Used for:** ranking refresh; citation share refresh; GEO competitive intel.

### Browser (read)
- Browser MCP (Claude Preview / Chrome).

**Used for:** competitive scrapes; screenshot captures; review mining.

### Image generation
- banana-claude:banana.

**Used for:** ad creative variants; social imagery; OG cards; email banners.

### Web search
- WebSearch tool.

**Used for:** current research; news-cycle PR opportunity scanning.

### Scheduled tasks
- scheduled-tasks MCP.

**Used for:** registering recurring loops.

## Safety guardrails (always-on)

These are non-negotiable in agentic mode:

### Never execute without approval (default)
- Push live ad spend changes (campaign budget, targeting, bid changes).
- Send cold email batches.
- Post to public social accounts.
- Publish website copy changes.
- Modify product pricing.
- Send transactional emails to customers.
- Trigger paid PR distribution.

### Pause on anomaly
If any of the following exceed thresholds, pause agentic actions and surface to user:

- CPA up 50% week-over-week on any active paid channel.
- ROAS down 30% week-over-week.
- Spam complaint rate >0.1% on any email send.
- Bounce rate >5% on cold email sequence.
- Negative review surge (>3x baseline in a week).
- Cancellation surge (SaaS) or refund surge (DTC).
- Brand-search volume drop >25% in a week (likely indexing or PR issue).
- Channel health metric (deliverability, ad account status) degrading.

### Refuse to produce
- Fake reviews / testimonials.
- AI-generated customer or executive faces presented as real.
- Deceptive scarcity / urgency.
- Defamatory comparison content.
- Content targeting protected categories in regulated verticals (housing, employment, credit).
- Content targeting minors without COPPA compliance.
- Compliance-sensitive claims without prior legal review (medical, financial advice, supplements).

### Daily journal
Every agentic loop writes a journal entry:

- What was done (specific artifacts produced).
- What was queued for approval (with one-line description each).
- What was blocked (with rationale).
- What anomalies were surfaced.
- What's on tomorrow's queue.

Path: `docs/marketing-plan/operations/YYYY-MM-DD.md`.

## Approval queue mechanics

When an agentic action requires approval, it's added to `docs/marketing-plan/operations/approval-queue.md`:

```markdown
# Approval Queue

## Pending

### APR-2026-05-20-001
- **Type:** Social post (LinkedIn — founder account)
- **Generated:** 2026-05-20 09:14
- **Content preview:** "Last week we shipped a feature that took 47 customer interviews to design correctly. Here's what 6 of them told us about why our old approach was wrong..."
- **Asset path:** docs/marketing-plan/operations/drafts/2026-05-20-li-001.md
- **Status:** PENDING
- **Auto-expire:** 2026-05-22 (48h SLA before auto-archive as unactioned)

### APR-2026-05-20-002
- **Type:** Ad creative variant (Meta Reels 9:16)
- **Generated:** 2026-05-20 09:18
- **Brief:** ASSET-AD-042 — UGC-style hands using product in coffee shop
- **Image path:** docs/marketing-plan/operations/drafts/asset-ad-042.png
- **Status:** PENDING

## Recently approved

(rolling 7-day archive)

## Recently rejected

(rolling 7-day archive)
```

The user approves/rejects via:

- Editing the file (change `Status: PENDING` to `APPROVED` or `REJECTED`).
- Or invoking `$marketforge approve APR-2026-05-20-001` / `$marketforge reject APR-2026-05-20-001 reason="off-voice"`.

The next agentic loop reads the queue, executes the approved items via the relevant MCP, and archives.

## Failure modes and recovery

### Tool/MCP unavailable
- Log unavailability.
- Fall back to queue-for-later or draft-only output.
- Surface in daily journal.
- Retry on next loop.

### Anomaly threshold breached
- Pause downstream actions immediately.
- Surface to user with anomaly details + recommended actions.
- Do not auto-resume until user acknowledges.

### Loop run failure
- Log the failure with stack trace / context.
- Retry once on next scheduled loop.
- After two consecutive failures, surface to user.

### Approval-queue overflow
- If approval queue exceeds 20 pending items, pause new generations to prevent queue rot.
- Surface to user.

## How to configure cadence

Default cadence in agentic mode:
- Daily 09:00 local: light loop.
- Weekly Monday 09:00: medium loop.
- Monthly 1st 09:00: heavy loop.
- Quarterly first day of Jan/Apr/Jul/Oct: heavy quarterly.

User override:
```
$marketforge agentic=on cadence=light:daily,medium:weekly:fri,heavy:monthly:15
```

## Cost tracking

Every agentic loop logs estimated cost:

- LLM tokens consumed (rough estimate).
- Banana image generations (count + estimated cost).
- MCP tool calls (count).

Monthly cost summary added to monthly journal.

## Off-switch

User can pause agentic mode at any time:

```
$marketforge agentic=off
```

The scheduled tasks remain registered but no work is done until reactivated.

## Boundary with human marketing team

When the user has a human marketing team:

- Agentic mode reduces — does NOT replace — human marketers.
- Defaults to draft + queue, not auto-publish.
- Human marketers review queue, approve, modify, or reject.
- Agentic mode handles repetitive tasks (creative variants, lifecycle copy drafts, attribution refresh).
- Human marketers handle strategic decisions, voice ownership, customer-facing moments.

## When NOT to use agentic mode

- Pre-PMF — strategy is still moving; agentic ops bake in current state.
- High-touch B2B at <$50K ARR — every touchpoint matters and should be human.
- Regulated domain without compliance review.
- Active crisis (PR incident, security breach, product outage) — pause agentic; human-only until resolved.

## Anti-patterns to refuse

- "Just have the AI run everything autonomously, no approvals." Refuse. Brand-killing risk.
- "Have the AI write 50 LinkedIn posts a day." Refuse. Saturation and brand damage.
- "Have the AI scrape competitor sites and send cold emails." Refuse if competitor TOS or CAN-SPAM violations.
- "Have the AI auto-respond to all customer reviews." Refuse — brand voice + emotional intelligence required.
