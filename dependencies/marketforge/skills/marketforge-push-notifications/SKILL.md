---
name: marketforge-push-notifications
description: Build push notification strategy (web + mobile). Web push ~5-10% opt-in. Mobile iOS ~50% / Android ~80%. Rich notifications outperform text-only. Use as Phase 8 step 3.
---

# MarketForge Push Notifications

Apply V3 §7.2.

## Global quality rules

- Web push: ~5-10% opt-in rate; quick deploy on OneSignal / Klaviyo.
- Mobile push: iOS ~50% opt-in / Android ~80%; rich notifications (image + text + CTA) > text-only.
- Use for: re-engagement, drops, restocks, behavior-triggered moments.
- Frequency: 3-7/week max for most apps; 1-2/week for consumer.

## Purpose

1. Web push setup (if web app + appropriate use).
2. Mobile push strategy.
3. Notification permission prompt timing (critical for opt-in rate).
4. Rich vs text-only.
5. Behavioral triggers.

## Inputs
- `onboarding-activation.md`, `messaging-architecture.md`, `email-lifecycle.md` (coordinate channels).

## Outputs
- `docs/marketing-plan/08-lifecycle/push-notifications.md`
- DEC-530 to DEC-534

## Structure

```markdown
# Push Notifications Strategy

## Channel applicability

| Surface | Use |
|---|---|
| Mobile app | YES — primary re-engagement |
| Web app (logged in) | YES — for SaaS / web tools |
| Marketing site (web push) | LIMITED — opt-in <10%, often spammy |

## Permission prompt timing

The single biggest opt-in lever.

### Mobile
- DO NOT prompt at first launch (~50% deny).
- Prompt at value moment (post-onboarding, after first achievement, after high-engagement session).
- Pre-prompt: explain value before triggering OS-level prompt.

### Web
- Don't prompt immediately.
- Prompt after engagement signal (read full article, used core feature, second visit).
- Use a custom UI before triggering browser-level (gives second-chance signal).

## Trigger types

### Behavioral (highest leverage)
- User reached aha moment but didn't repeat → "Try [next feature]"
- User abandoned task → "You left [task] unfinished"
- User hit usage limit → "[Action] to unlock more"

### Re-engagement (when inactive)
- 3-day, 7-day, 14-day inactive.
- Specific reason to return (new content, new feature, friend activity).

### Time-based (DTC / consumer)
- Drop launches.
- Restocks.
- Sale starts.

### Transactional (DTC / mobile)
- Order shipped.
- Order delivered.
- Refund processed.

## Rich vs text-only

Rich (image + title + body + CTA): 2-3x engagement vs text-only.

### Rich notification template
- Image: relevant product / feature screenshot.
- Title: 50 chars max.
- Body: 100-150 chars.
- CTA: deep link to specific surface.

## Cadence

- Behavioral triggers: as warranted (relevance unlimited).
- Marketing / promo: max 1-2/week (more = uninstall).
- Re-engagement: max 1/week per user.

## Compliance

- iOS / Android permission systems (handled by OS).
- For consumer in EU: GDPR (push is communication — explicit consent).
- For health / financial info in notifications: PII / sensitive-data caution.

## Platform

| Platform | Use |
|---|---|
| OneSignal | Free tier + paid; multi-platform |
| Klaviyo (push) | DTC + integrated with email |
| Braze | Enterprise mobile lifecycle |
| CleverTap | Enterprise mobile lifecycle |
| Firebase Cloud Messaging | DIY mobile dev |
| Apple Push Notification service | iOS DIY |

## KPIs
- Direct opens (notification → app open).
- Conversion from open (action completed).
- Uninstall rate (must monitor; spike = over-pushing).
- Retention lift on notified vs non-notified cohorts.

## Decision cards
[DEC-530 to DEC-534]

## Anti-patterns

- Permission prompt at first launch (denies your future channel).
- Marketing blast every day (uninstall spike).
- Generic "Open the app" without specific reason.
- Sensitive PII in notifications (lock screen exposure).
- No deep link (notification → home screen vs notification → relevant surface).

## What we are intentionally NOT doing
- Prompting permission at first launch.
- Daily marketing blasts.
- Generic notifications without behavioral relevance.

## Sources and basis
V3 §7.2.
```

## Sources and basis
V3 §7.2.
