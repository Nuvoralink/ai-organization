---
name: visualforge-system-pages
description: System / edge pages — 404, 500, 503 maintenance, 429 rate-limited, offline, account-suspended, plan-limit-reached, browser-deprecated, region-blocked. Uniform brand presence, recovery affordance, support escalation.
---

# System Pages

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `state-page-patterns.md`.
- Use `opinionated-decision-template.md`.
- Every system page: clear status, blame-free copy, recovery affordance, support path, brand presence, accessibility.
- No "Oops!" — see content design rules.
- **Owns** (per `state-page-patterns.md`): 404 / 500 / maintenance / offline / suspended / rate-limited / browser-deprecated page layouts, illustration, copy. Cite the shared reference instead of restating patterns 3, 4, 5, 6, 7.
- Maintain `decision-log.md`.

## Purpose

System pages are where most products lose users. A bad 404 is a goodbye message. A maintenance page that just says "We'll be back soon" without ETA or status link is a trust failure. These pages need design, not boilerplate.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Design full inventory of system pages.
- **Retrofit:** Inventory existing; produce ideal; drift entry.

## Inputs

- Brand identity (voice + visual presence in liminal moments).
- Content design (voice for errors).
- IA (navigation back affordances).
- Personas (escalation paths per persona).
- Status page provider if any (Statuspage, Instatus, Better Stack).

## Output files

- `docs/design-system/04-interaction/system-pages.md` — overview + decisions.
- `docs/design-system/06-screens/SCR-SYS-[NNN]-[slug].md` — one per system page.
- Decision-log entries (DEC-765 to DEC-784, overflow DEC-785 to DEC-789) per `../_visualforge-shared/references/decision-id-allocation.md`.

## System page inventory

- `SCR-SYS-001` 404 Not Found
- `SCR-SYS-002` 500 / 502 / 503 — server unavailable
- `SCR-SYS-003` Maintenance (planned downtime)
- `SCR-SYS-004` Rate limited (429)
- `SCR-SYS-005` Offline (no network)
- `SCR-SYS-006` Account suspended
- `SCR-SYS-007` Plan limit reached (free tier hits paywall)
- `SCR-SYS-008` Region blocked / unavailable in jurisdiction
- `SCR-SYS-009` Browser deprecated / unsupported
- `SCR-SYS-010` Permission denied (403, in-app)
- `SCR-SYS-011` Empty workspace / project not found
- `SCR-SYS-012` Maintenance — read-only mode
- `SCR-SYS-013` Service degradation banner (partial)

Skip any not applicable; justify in decision log.

## Per-page common structure

Every system page has:

- **Status / category icon** — large but not garish, semantic color (state.danger / warning / info).
- **Headline** — concise, accurate ("Page not found" — never "Oops" or "Page not found 😱").
- **Body** — what happened (in plain language, no error codes alone), why if known, what to try.
- **Primary recovery affordance** — clearest path forward (Go home, retry, contact support, upgrade).
- **Secondary action** — secondary path (back, view status, sign in as different user).
- **Status link** — if status page exists.
- **Support link** — context-aware (don't bury support behind 3 clicks on a 500 page).
- **Brand presence** — logo, voice, visual identity remains. No naked white page with stack trace.

## Per-page specs

### 404 Not Found
- **Triggered by:** unknown route or missing resource.
- **Don't say "404"** alone — also explain ("Page not found").
- **Suggest:** search box, primary nav links, recent visits.
- **Brand opportunity:** small one — a tasteful illustration or moment-of-personality, never undermining clarity.
- **Crawler note:** server response is HTTP 404 (not 200 with "not found" body — bad for SEO).

### 500 / 502 / 503
- **Status server-side:** match HTTP code; do not return 200.
- **Copy:** "Something on our end isn't working. We've been notified."
- **Recovery:** retry button, status link, support link.
- **Auto-retry** for transient: retry with exponential backoff (3 attempts), show progress.
- **Sentry / error tracking** identifier (a short trace ID) for support reference.

### Maintenance (planned)
- **ETA visible:** "Back at HH:MM TZ (in X minutes)" — countdown timer.
- **Status link** to status page.
- **What's affected:** scope (all features / specific features).
- **Workarounds:** if any data is cached / read-only mode available.

### Rate limited (429)
- **Friendly framing:** "You're going fast — give us a moment."
- **Wait time visible** if known: "Try again in N seconds" with countdown.
- **No-retry CTA** during wait window.
- **Distinguish soft (recovers in seconds) from hard (escalates to plan limit).**

### Offline
- **In-app modal or banner** preferred over full takeover.
- **Cached content visible** if available.
- **Pending changes indicator:** "Will sync when reconnected."
- **Auto-recovery** on reconnect.

### Account suspended
- **Clear reason** within legal limits.
- **Appeal path:** explicit support link with context.
- **Data access:** can the user still download their data? Honor GDPR even when suspended.
- **Sensitive copy** — sober, factual, never sarcastic.

### Plan limit / paywall
- **Soft paywall first** (preview limited access) before hard.
- **Clear upgrade CTA + comparison:** what unlocks.
- **Continue free option** when meaningful.
- **Trust signals:** money-back, easy cancel.

### Region blocked
- **Honest reason** if shareable (regulatory, sanctions, language-only coverage).
- **Alternatives** if any (waitlist, VPN policy, contact for enterprise).

### Browser deprecated
- **List supported browsers** with versions.
- **Most-likely path:** "Update your browser" link to browser updater pages.
- **Continue at risk** option when feasible (with degraded UI warning).

### In-app permission denied (403)
- **Inline state preferred** over full page when contextual.
- **Action:** "Request access" from owner — captures contact, sends notification.
- **Owner names if shareable.**

### Service degradation banner
- **Top-of-page banner** with status.
- **Dismissible per session.**
- **Severity color coding:** info / warning / critical.
- **Link to status page.**

## Accessibility

- Status icon + label (never icon alone).
- Headline as proper `<h1>`.
- Focus moves to headline on page load for screen readers.
- Primary CTA reachable via tab from initial focus.
- High-contrast variants work.

## Decision cards

- DEC-766 System page inventory.
- DEC-767 Voice and tone for system pages.
- DEC-768 Status page provider (or absence).
- DEC-769 Auto-retry strategy.
- DEC-770 Account suspension copy + appeal.
- DEC-771 Paywall pattern (soft vs hard).
- DEC-772 Browser deprecation policy + browser support window.

## Anti-slop system page rules

- "Oops! Something went wrong" — fails.
- 200 OK response with "not found" body — fails SEO.
- Maintenance with no ETA — fails trust.
- Suspension with no appeal path — fails.
- Paywall hard at first interaction without preview — fails conversion.

## Quality gate

- Every applicable system page in inventory has a spec.
- HTTP codes correct.
- Recovery affordance + support path on every page.
- Brand presence preserved.
- Accessibility verified.

## Sources and basis

Per-page rationale tied to brand voice, status-page integration, and HTTP semantics.
