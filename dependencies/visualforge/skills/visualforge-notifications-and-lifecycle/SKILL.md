---
name: visualforge-notifications-and-lifecycle
description: Notification system across email, push, in-app, and SMS — design system for transactional and lifecycle messaging, channel coordination, frequency caps, preference center, accessibility, and deliverability rules.
---

# Notifications and Lifecycle Messaging

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `state-page-patterns.md`.
- Use `opinionated-decision-template.md`.
- No "we'll figure out emails later" — emails are a primary touchpoint, designed in advance.
- Every notification has channel, trigger, audience, frequency cap, opt-out path, accessibility contract, and dark-mode treatment.
- **Owns** (per `state-page-patterns.md`): channel choice, preference center, transactional vs marketing classification, send-time discipline. Cite the shared reference instead of restating patterns 2, 4, 5, 6, 7.
- Maintain `decision-log.md`.

## Purpose

Notifications are a parallel design surface that most products under-invest in. They have their own constraints (email = restricted CSS, push = 178 chars, SMS = no styling, in-app = full design system), need coordination so users don't get the same message four times, and carry legal weight (CAN-SPAM, GDPR, CASL).

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Design notification system from trigger inventory.
- **Retrofit:** Inventory existing emails / push templates (in code, in ESP, in fixtures). Map to ideal. Drift entry.

## Required research pass

```text
Research current best practices for notification design as of 2026: email HTML constraints (cross-client compatibility — Gmail, Apple Mail, Outlook), email-safe CSS, dark-mode email design, MJML / Maizzle / React Email frameworks, push notification design (iOS rich notifications, Android channels), notification preference centers, frequency capping, GDPR / CAN-SPAM / CASL legal requirements. Capture sources.
```

## Inputs

- All Specforge or VisualForge product/persona/feature inputs.
- Brand identity (voice, color, type).
- Content design (microcopy, tone).
- Auth flows (verify, reset notifications).
- Frontend contract (sending platform if specified).

## Output files

- `docs/design-system/04-interaction/notifications-and-lifecycle.md` — channel philosophy, frequency caps, coordination matrix, preference center spec.
- `docs/design-system/notifications/templates/email/[name].md` — per-email template spec (subject, preview text, body, variants).
- `docs/design-system/notifications/templates/push/[name].md` — per-push template spec.
- `docs/design-system/notifications/templates/in-app/[name].md` — per-in-app notification.
- `docs/design-system/notifications/templates/sms/[name].md` — per-SMS template (if SMS used).
- `docs/design-system/notifications/preference-center.md` — preference center page spec.
- Decision-log entries (DEC-790 to DEC-824, overflow DEC-825 to DEC-829) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Sections

### 1. Channel philosophy

For each channel, decide the role:

| Channel | Role | Latency | Costliness | Failure cost |
|---|---|---|---|---|
| In-app banner / toast | Real-time during session | < 1s | free | low |
| In-app inbox | Asynchronous, durable | persistent | free | low |
| Push (iOS / Android web) | Interrupt-driven, time-sensitive | seconds | free | medium |
| Email | Default for non-urgent | minutes | low | low–medium |
| SMS | Critical only (2FA, urgent alerts) | seconds | per-message | high (annoyance, cost) |

### 2. Notification inventory

For every product event that can trigger a notification, document:

- Event name + trigger condition.
- Audience (which users get it; permission rules).
- Channels used (one or more).
- Default frequency cap.
- Default opt-out availability (some, like 2FA codes, cannot be opt-outable).
- Legal classification (transactional / promotional / marketing — different opt-out rules).

### 3. Channel coordination

Prevent duplication: if a user gets an in-app toast and email for the same event within X minutes, that's a coordination failure. Document:

- Coordination policy per event class (e.g., "transactional emails always send; in-app surfaces if user is online; push only if user is offline > N minutes").
- Suppression rules between channels.
- Digest policy (some events batch into a daily/weekly digest instead of firing individually).

### 4. Email design system

Email has its own constraint layer.

**CSS constraints:**
- No flexbox / grid (Gmail strips them).
- Inline styles required for most clients.
- Tables for layout (yes, even in 2026, for cross-client).
- Max width 600px standard.
- Dark mode: `@media (prefers-color-scheme: dark)` works in Apple Mail and recent Gmail; use `meta name="color-scheme"` and inverted brand assets.
- Limited web fonts; fallback to system stack.

**Token subset for email:**
Define a small subset of design tokens that work in email (email-safe colors, type, spacing):

- `email.color.bg.primary` (light + dark variants).
- `email.color.text.primary` / `text.secondary`.
- `email.color.accent`.
- `email.color.divider`.
- `email.type.heading.lg` / `md` / `sm` (specific sizes, line-heights, fallback stack).
- `email.type.body`.
- `email.button.bg` / `border` / `padding`.
- `email.spacing.section` / `block`.

These mirror the product design tokens but resolve to email-safe values.

**Component patterns:**
- Header (logo + optional nav links).
- Hero block (illustration / photo + headline + body).
- Body block (text + optional CTA).
- Button (table-based for cross-client).
- Card / row.
- Divider.
- Footer (legal text, unsubscribe link, address line, social).

**Per-template structure:**

For each email template, document:

```markdown
## Email — [Name] (e.g., "Welcome", "Password Reset", "Weekly Digest")

- **Trigger:** [event]
- **Audience:** [users]
- **Classification:** transactional | promotional | marketing
- **Subject line(s):**
  - Variant A: "[subject]"
  - Variant B: "[subject]" (if A/B testing)
- **Preview text:** "[first 80–100 chars shown in inbox preview]"
- **Sender identity:** [From name + From address + Reply-to]
- **Body structure:**
  1. Header
  2. Greeting (personalized? "Hi [first_name]" requires fallback)
  3. Hero / main content
  4. Primary CTA
  5. Secondary content (optional)
  6. Footer
- **Data fields used:** [from data inventory]
- **Localization:** which languages supported
- **Dark mode:** [auto-handled / manual variant]
- **Plain text alternative:** [required for all transactional]
- **Tracking pixel:** [yes / no / opt-in only]
- **Legal:** unsubscribe link required? (yes for promotional, no for transactional)
- **Test plan:** Litmus / Email on Acid coverage list
```

### 5. Push notification design

- **Title:** ≤ 30 chars usable, hard cap at platform max.
- **Body:** ≤ 178 chars (iOS expanded), ≤ 110 chars (Android base).
- **Rich media:** image / video (iOS), optional.
- **Actions:** up to 4 inline actions (iOS notification service extension).
- **Categories / channels:** Android channels (a11y per-channel volume / priority control), iOS notification categories.
- **Sound:** default vs custom; respect Do Not Disturb.
- **Time-sensitive vs default priority:** iOS Time Sensitive Notifications, Android Priority levels.
- **Web push (PWA):** subset of features; permission flow design.
- **Test on lock screen, banner, notification center.**

### 6. In-app notification design

- **Toast / snackbar:** transient (4–6s), one at a time, auto-dismiss, optional action.
- **Banner:** persistent until dismissed, single banner at top of viewport.
- **Inline alert:** in-content, related to a specific surface.
- **Bell / inbox:** persistent unread state with grouping, mark all read, archive.
- **Modal:** reserved for critical interrupts (account locked, data loss imminent).

Reference micro-interactions subskill for entry / exit motion.

### 7. SMS design (if used)

- **Use cases:** 2FA codes, critical security alerts, time-critical operational. Never marketing without explicit opt-in.
- **Length:** 160 chars per segment; design for 1 segment when possible.
- **Sender ID:** short code, long code, or alpha sender per region; lock per region.
- **Opt-out:** STOP keyword handling required.
- **Format:** plain text only. No formatting. Include sender identity at start.

### 8. Preference center

Critical — single page where users control all notifications.

- **Layout:** grouped by event class, with per-channel toggles per event group.
- **Defaults:** transactional on (legally required), promotional off until consent (GDPR).
- **Frequency options:** per group, when applicable (immediate / daily digest / weekly digest / off).
- **Email-specific:** unsubscribe link in every email lands here pre-filtered to relevant group.
- **Audit log:** preference changes timestamped + auditable.
- **Mobile-friendly:** thumb-reachable toggles.

### 9. Accessibility

- **Email:** alt text on all images, semantic headings, sufficient contrast in light AND dark mode, descriptive link text not "click here", keyboard-navigable, screen-reader friendly tables (avoid layout-only tables when possible; if used, mark `role="presentation"`).
- **Push:** title and body must be self-explanatory without rich media (image is decorative supplement).
- **In-app toasts:** `aria-live="polite"` for non-urgent, `assertive` only for critical. Always pair visual color with icon and text.
- **SMS:** clarity over cleverness — screen readers will read literally.

### 10. Sending platform decision

- Email: Postmark / Resend / SendGrid / Loops / Customer.io.
- Push: native APNs/FCM, OneSignal, Pusher Beams, Knock.
- SMS: Twilio / Plivo / MessageBird.
- Coordination layer: Knock, Courier, custom.

Pick with rationale. Document handoff to backend / DevOps.

### 11. Decision cards

- DEC-791 Channel philosophy.
- DEC-792 Notification inventory.
- DEC-793 Coordination policy.
- DEC-794 Email design system tokens.
- DEC-795 Push design.
- DEC-796 In-app notification patterns.
- DEC-797 SMS adoption (or rejection).
- DEC-798 Preference center.
- DEC-799 Sending platform stack.

## Anti-slop notification rules

- "Send users an email" without subject, preview, body, CTA, opt-out — fails.
- Marketing emails without legal opt-out / unsubscribe / address line — fails legal review.
- Push without character budget and platform-channel decisions — fails.
- Identical content across channels without coordination — fails.
- "We'll add a preference center later" — fails. Build it in initial scope.

## Quality gate

- Notification inventory complete (every triggerable event).
- Channel coordination policy explicit.
- Email design system with token subset and per-template specs.
- Push, in-app, SMS design.
- Preference center designed.
- Accessibility per channel.
- Sending platform decided.

## Sources and basis

Per-decision tied to product trigger inventory, brand voice, legal regime, and current notification research.
