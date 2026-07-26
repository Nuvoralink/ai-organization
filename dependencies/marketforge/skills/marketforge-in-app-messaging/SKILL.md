---
name: marketforge-in-app-messaging
description: Build in-app messaging for SaaS (Pendo / Intercom / Userflow) and mobile (Braze / CleverTap). Behavioral trigger > blast. Drives activation + feature adoption. Use as Phase 8 step 4.
---

# MarketForge In-App Messaging

Apply V3 §7.3.

## Global quality rules

- In-app messaging drives activation when triggered by behavior at the right moment — NOT broadcast blasts.
- For SaaS web: Pendo, Intercom, Userflow.
- For mobile: Braze, CleverTap, Customer.io mobile.
- Coordinate with email + push to avoid channel fatigue.

## Purpose

1. Trigger map (which behaviors → which messages).
2. Format selection (tooltip, modal, banner, slide-in, full-screen).
3. Frequency capping (per user / day / message-type).
4. Coordination with email + push.
5. Platform selection.

## Inputs
- `onboarding-activation.md` (aha-moment + activation steps).
- `email-lifecycle.md` (coordination).
- `messaging-architecture.md`.

## Outputs
- `docs/marketing-plan/08-lifecycle/in-app-messaging.md`
- DEC-535 to DEC-540

## Structure

```markdown
# In-App Messaging Strategy

## Trigger map

For each trigger:
- Behavior event
- Message format
- Frequency cap
- Coordination (suppress if email-sent same day?)
- Success metric

### Examples
- First login → onboarding tour modal (modal, once per user).
- 3 days post-signup without activation → "Try [feature]" tooltip.
- Achieved aha moment → celebration modal + next-step suggestion.
- Approached usage limit → upgrade modal (cap: 1/week).
- Feature released → new-feature announcement (cap: 1/feature; segment to relevant users).
- Inactive 7 days → re-engagement modal at next login.

## Format selection

| Format | Use |
|---|---|
| Tooltip / spotlight | Feature discovery, micro-onboarding |
| Modal | High-attention moment (announcement, upgrade) |
| Banner | Persistent info (trial expiring, payment failing) |
| Slide-in / drawer | Secondary actions, in-context help |
| Full-screen | Major moment (welcome, milestone) — use rarely |
| Inline (in-context) | Embedded in feature flow |

## Frequency capping

- Per user per day: max 2 marketing messages.
- Per user per session: max 1 modal.
- Per message-type: cap N times before suppression (don't re-show modals user dismissed).
- Coordination: if email-sent same topic same day, suppress in-app.

## Platforms

| Platform | Best for |
|---|---|
| Pendo | SaaS; analytics + in-app; mid-large |
| Intercom | SaaS + customer messaging; popular at startup-stage |
| Userflow | SaaS onboarding; cheaper |
| Appcues | SaaS onboarding; established |
| Braze | Mobile + cross-channel; enterprise |
| CleverTap | Mobile-first; growth markets |

## KPIs

- Activation rate (in-app driven).
- Feature adoption rate.
- Conversion from upgrade prompts.
- Dismissal rate (high dismissal = too aggressive).

## Decision cards
[DEC-535 to DEC-540]

## Anti-patterns

- Broadcast messages without trigger.
- Modal-on-modal overlap.
- High-frequency capping that ignores user behavior.
- Feature announcements to all users regardless of relevance.
- Long copy in tooltips (defeats the purpose).

## What we are intentionally NOT doing
- Broadcast blasts.
- Uncapped frequency.
- Aggressive upgrade prompts that feel like obstacles.

## Sources and basis
V3 §7.3.
```

## Sources and basis
V3 §7.3.
