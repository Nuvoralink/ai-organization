---
name: visualforge-auth-flows
description: Authentication flow design — sign in, sign up, forgot password, password reset, email verification, magic link, MFA challenge/enrollment/recovery, SSO callback, session expiry, account locked, account deletion. Password-manager-friendly and WCAG 2.2 AAA-compliant.
---

# Auth Flows

Shared references at `../_visualforge-shared/references/`. Use them when needed.

## Global quality rules

- Read `anti-slop-design-rubric.md`, `design-decision-quality-protocol.md`, `state-page-patterns.md`.
- Use `opinionated-decision-template.md`.
- Every auth screen passes WCAG 2.2 Accessible Authentication (3.3.8, 3.3.9 AAA): no paste-blocking, password manager friendly, no cognitive-test-only authentication.
- Sensitive — no secrets in URL, no client-side logging.
- **Owns** (per `state-page-patterns.md`): sign-in / sign-up flow shapes, MFA, SSO, password rules, magic-link issuance, session lifetime, in-context re-auth (pattern 1), token-gated link expiry (pattern 2). Cite the shared reference instead of restating patterns 1, 2, 3, 5, 6, 7.
- Maintain `decision-log.md`.

## Purpose

Auth is the first impression and the most common failure point. Bad auth design causes drop-off, support tickets, and security failures. This subskill specifies every auth surface explicitly.

## Mode-aware behavior

- **Greenfield / Specforge-enhanced:** Design full auth surface from chosen auth provider + product role model.
- **Retrofit:** Inventory existing auth screens; produce ideal; drift entry.

## Required research pass

```text
Research current auth UX as of 2026: WCAG 2.2 Accessible Authentication (3.3.8, 3.3.9), passkey design conventions (WebAuthn, Apple / Google passkey UX), magic link UX, MFA factor selection, SSO button conventions per provider (Google, Microsoft, Apple, GitHub), account recovery patterns, account deletion / data export design (GDPR Article 17 / 20). Capture sources.
```

## Inputs

- Product brief — accessibility level (likely AAA for auth even when rest is AA).
- Personas — auth context, device, accessibility profile.
- Auth provider stack (from Specforge or user input): Auth0, Clerk, Stytch, Supabase Auth, Cognito, Firebase, NextAuth, custom.
- Brand identity and content design.

## Output files

- `docs/design-system/04-interaction/auth-flows.md` — narrative + decision cards.
- `docs/design-system/06-screens/SCR-AUTH-[NNN]-[slug].md` — one file per auth screen.
- Decision-log entries (DEC-730 to DEC-759, overflow DEC-760 to DEC-764) per `../_visualforge-shared/references/decision-id-allocation.md`.

## Auth screen inventory

Every product needs most of these:

- `SCR-AUTH-001` Sign in (primary)
- `SCR-AUTH-002` Sign up
- `SCR-AUTH-003` Forgot password (request reset)
- `SCR-AUTH-004` Reset password (with valid token)
- `SCR-AUTH-005` Reset password — invalid / expired token
- `SCR-AUTH-006` Verify email — pending
- `SCR-AUTH-007` Verify email — confirmation success
- `SCR-AUTH-008` Verify email — invalid / expired token
- `SCR-AUTH-009` Magic link sent (check your email)
- `SCR-AUTH-010` Magic link landing (signed in)
- `SCR-AUTH-011` MFA enroll — choose factor
- `SCR-AUTH-012` MFA enroll — TOTP setup (QR + key)
- `SCR-AUTH-013` MFA enroll — SMS setup
- `SCR-AUTH-014` MFA enroll — passkey setup
- `SCR-AUTH-015` MFA challenge
- `SCR-AUTH-016` MFA recovery — use backup code
- `SCR-AUTH-017` MFA recovery — alternate channel
- `SCR-AUTH-018` SSO callback (loading + error)
- `SCR-AUTH-019` Account locked — too many attempts
- `SCR-AUTH-020` Account suspended
- `SCR-AUTH-021` Session expired — re-auth
- `SCR-AUTH-022` Change password (in account settings)
- `SCR-AUTH-023` Change email — request + verify new email
- `SCR-AUTH-024` Delete account — request + confirm
- `SCR-AUTH-025` Data export — request + ready notification

Skip any not applicable; justify in decision log.

## Per-screen design rules

### Sign in
- **Layout:** centered card 400px max-width.
- **Identifier first:** email field, autocomplete `username`, autofocus.
- **Password field:** type=password, autocomplete `current-password`, show/hide toggle.
- **No paste-blocking ever** (WCAG 3.3.8).
- **Primary CTA:** "Sign in".
- **SSO buttons:** above or below password — pick consistently. Provider buttons per provider design guidelines (Google, Microsoft, Apple, GitHub).
- **Forgot password link:** under password field.
- **Sign up link:** below CTA.
- **Error handling:** generic "Incorrect email or password" — never disclose which field failed.
- **Rate limiting:** soft (CAPTCHA after N attempts) before hard lock.
- **Persistence:** "Remember me" if used; otherwise default to session-length cookie.

### Sign up
- **Fields:** minimum viable — typically email + password, or email-only if magic link.
- **Password rules:** display live as user types; do not block paste; allow ≥ 8 chars per NIST 2025 guidance.
- **Password strength meter:** zxcvbn-style; show estimated time-to-crack rather than arbitrary "weak / medium / strong".
- **Email validation:** format real-time, deliverability check on blur.
- **Terms / privacy:** checkbox not pre-checked, link to docs.
- **Email-already-exists:** redirect to sign-in with pre-filled email; do not confirm or deny existence to prevent enumeration.

### Forgot password
- **Single field:** email.
- **Confirmation independent of result:** "If an account exists with that email, we've sent reset instructions" — do not confirm or deny existence (prevents enumeration).
- **Token TTL:** 15–30 minutes typical.
- **Token single-use:** invalidate after use.

### Reset password
- **New password + confirm:** both visible if needed; allow show/hide.
- **Strength meter.**
- **On success:** auto-sign-in OR redirect to sign-in with pre-filled email.

### Verify email
- **Pending state:** clear instruction to check inbox/spam.
- **Resend option:** rate-limited (60s cool-down).
- **Success state:** confirm + auto-redirect.

### Magic link
- **Single field:** email.
- **Confirmation copy:** "Check your inbox for a sign-in link from [sender]".
- **Link TTL:** 10–15 minutes.
- **One-time use** preferred.
- **Same-device hint:** if link opened on different device, may require additional confirmation.

### MFA enroll
- **Factor choice screen:** Passkey (recommended), TOTP authenticator app, SMS (last resort), backup codes.
- **Per factor:** clear setup instructions + verify step.
- **Backup codes:** generated set, user must save before continuing; "I've saved them" checkbox required.
- **Skip option:** if optional, allow skip with friction (clear "You can enable later").

### MFA challenge
- **Per factor input:** 6-digit numeric for TOTP/SMS, biometric prompt for passkey.
- **Auto-submit on full input** for code entry.
- **Resend / try another factor** option.
- **Failure recovery:** clear path to backup code or contact support.

### Passkey
- **WebAuthn flow with platform-specific UI.**
- **Fallback to password** when device unsupported.
- **Per-passkey naming and management** in account settings.

### SSO callback
- **Loading state:** "Signing you in…" with subtle spinner.
- **Error states:** provider error, scope-denied error, account-not-linked error, suspended error.
- **Account linking:** when SSO email matches existing local account, prompt to link.

### Account locked
- **Clarity:** lock duration + unlock path (wait, contact support, identity verification).
- **No timer-only design** — give users a reachable action.

### Session expired
- **In-context modal** preferred over full redirect (preserves work).
- **Re-auth with minimal friction** — sometimes biometric alone.
- **Preserve unsaved work** across re-auth.

### Account deletion
- **Soft delete preferred** with restoration window (30–90 days).
- **Hard delete:** requires typed confirmation of account email or account name, plus current password or fresh MFA, plus explicit consequences list.
- **Data export available before deletion** (GDPR Article 20).
- **Confirmation email** sent post-deletion with restoration link.

### Data export
- **Request:** clear scope of what's included.
- **Format:** JSON + CSV pairs typical, or per data type.
- **Delivery:** in-app download link + email notification when ready.
- **Expiry:** download link expires 7 days.

## Accessibility (auth is AAA-target)

- **No paste blocking** (3.3.8).
- **No cognitive-test-only** (3.3.8): CAPTCHA must have alternative (audio, low-friction challenge, hardware-token bypass).
- **Redundant entry prevention** (3.3.7): pre-fill email across flow steps.
- **Visible password by default for re-typed confirms** with manager-friendly approach.
- **Screen reader announces success / error** via aria-live.
- **Keyboard-only full flow** verified.

## Decision cards

- DEC-731 Auth provider stack.
- DEC-732 Auth factor matrix (which factors offered).
- DEC-733 Passkey adoption.
- DEC-734 Magic link adoption.
- DEC-735 SSO provider list.
- DEC-736 Password policy.
- DEC-737 Account lockout policy.
- DEC-738 Session expiry + re-auth strategy.
- DEC-739 Account deletion policy.
- DEC-740 Data export policy.

## Anti-slop auth rules

- Paste-blocking on password field — fails AAA.
- Confirming or denying email existence — security failure.
- Auto-locking with no recovery affordance — fails.
- Password rules hidden until error — fails.
- CAPTCHA without alternative — fails.
- "We'll add MFA later" without spec — fails.

## Quality gate

- Every applicable auth screen in inventory has a per-screen spec.
- Accessibility AAA passes for auth.
- Provider stack + factor matrix locked.
- Account deletion + data export designed.
- Session expiry handled in-context.

## Sources and basis

Per-decision tied to NIST password guidance, WCAG 2.2 AAA, provider design guidelines, and GDPR.
