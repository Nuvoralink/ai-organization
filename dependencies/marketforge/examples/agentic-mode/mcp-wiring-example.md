# MCP Wiring Examples for Agentic Mode

When activating MarketForge `agentic=on`, these MCPs must be wired into the Claude environment. This file documents the expected integration points + sample configurations.

## Required MCPs (minimum viable agentic)

### 1. scheduled-tasks MCP

Registers the recurring loops.

```yaml
# Example scheduled-task setup
- id: marketforge-daily-light
  cron: "0 9 * * *"  # 09:00 local every day
  prompt: "$marketforge agentic-loop=light"
  
- id: marketforge-weekly-medium
  cron: "0 9 * * 1"  # 09:00 Monday
  prompt: "$marketforge agentic-loop=medium"
  
- id: marketforge-monthly-heavy
  cron: "0 9 1 * *"  # 09:00 on 1st of month
  prompt: "$marketforge agentic-loop=heavy"
  
- id: marketforge-quarterly-strategy
  cron: "0 9 1 1,4,7,10 *"  # 09:00 on 1st of Jan/Apr/Jul/Oct
  prompt: "$marketforge agentic-loop=quarterly"
```

### 2. At least one analytics MCP

For daily telemetry. Options:
- GA4 MCP
- Plausible MCP
- Mixpanel MCP
- PostHog MCP
- Amplitude MCP

### 3. banana-claude:banana

For all image generation. Already installed in this user's environment.

## Optional MCPs (expand agentic capability)

### Ad platforms (write-with-approval)

- Meta Marketing API MCP
- Google Ads API MCP
- LinkedIn Marketing API MCP
- TikTok Ads API MCP
- Apple Search Ads MCP

### ESP / lifecycle (send-with-approval)

- Klaviyo MCP
- Customer.io MCP
- HubSpot MCP
- Loops MCP

### CRM (read + update-with-approval)

- HubSpot MCP
- Salesforce MCP
- Apollo MCP
- Clay MCP

### Social (post-with-approval)

- LinkedIn MCP
- X/Twitter MCP
- Buffer / Hootsuite MCP

### SEO / GEO (read)

- Ahrefs MCP
- Semrush MCP
- Google Search Console MCP
- Profound MCP / Otterly / Peec AI

### Browser (read)

- Browser MCP (Claude Preview / Chrome)

## Activation pre-flight check

Before MarketForge enables agentic mode, it verifies:

1. **scheduled-tasks MCP present** — otherwise the loops can't register.
2. **At least one analytics MCP present** — otherwise no telemetry.
3. **banana-claude:banana present** — otherwise image generation falls back.
4. **Approval queue file template exists** — to receive approvable items.

If any required MCP is missing:

```
ERROR: Cannot activate agentic mode.

Missing MCPs:
  - scheduled-tasks MCP (required)
  - No analytics MCP detected (required: GA4, Plausible, Mixpanel, PostHog, or Amplitude)

Install required MCPs first, then re-invoke:
  $marketforge agentic=on
```

## Per-action MCP routing

When an approved item enters the execution phase:

| Action type | MCP used | Endpoint |
|---|---|---|
| LinkedIn post | LinkedIn MCP | `linkedin.posts.create` |
| X/Twitter post | X MCP | `twitter.tweets.create` |
| Meta ad creative push | Meta Marketing API MCP | `meta.ads.create` |
| Klaviyo campaign send | Klaviyo MCP | `klaviyo.campaigns.send` |
| Cold email batch | Custom (Instantly / Smartlead API) | provider-specific |
| Newsletter send | Beehiiv / ConvertKit / Klaviyo MCP | provider-specific |
| Image generation | banana-claude:banana | (skill call) |

## Cost visibility

Each MCP call is logged with:
- Timestamp
- Endpoint
- Token / API-credit cost
- Outcome (success / rate-limited / failed)

Daily journal aggregates per-MCP cost. Monthly journal rolls up.

## Failure modes

### MCP unavailable mid-loop
- Log failure.
- Skip that step.
- Queue retry for next loop.
- Surface anomaly in daily journal.

### Rate-limited
- Exponential backoff (2s, 4s, 8s).
- Max 3 retries.
- After 3, log + skip.

### Authentication expired
- Log + STOP loop.
- Surface to user immediately.
- Do not auto-renew (security concern).

## Privacy / security guardrails

When agentic mode is active:

- **No PII in journals.** Customer emails, phone numbers, payment data redacted before logging.
- **No secrets in approval queue.** API keys, OAuth tokens stay in MCP config.
- **Audit log immutable.** Every approval / rejection / execution logged with append-only writes.
- **MCP credentials scope-limited.** Each MCP has scope-limited tokens (e.g., LinkedIn MCP can post but not modify settings).

## Disabling agentic mode

```
$marketforge agentic=off
```

This:
- Pauses all scheduled tasks (but keeps them registered for easy re-enable).
- Stops accepting approval-queue actions.
- Preserves all journals and decision logs.

```
$marketforge agentic=uninstall
```

Removes scheduled tasks entirely. Use when fully sunsetting agentic mode.
