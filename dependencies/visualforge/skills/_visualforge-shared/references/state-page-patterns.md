# State Page Patterns

Shared patterns for the three "state-page" subskills:

- `visualforge-auth-flows` (sign in / sign up / MFA / SSO / magic link / re-auth / account deletion / data export).
- `visualforge-system-pages` (404 / 500 / maintenance / offline / suspended / rate-limited / browser-deprecated).
- `visualforge-notifications-and-lifecycle` (email / push / in-app / SMS notifications, preference center, transactional vs marketing).

These three subskills share common patterns. Without a shared reference, each subskill restates the same patterns slightly differently, the validator allows the drift, and downstream cross-references rot. This reference is the single source of truth for the shared patterns; each subskill **cites** them and adds only what's unique to its domain.

Use this reference per VF-FIND-040.

---

## Shared pattern 1 — In-context re-auth

When a user session is valid for general browsing but a sensitive action requires fresh authentication (changing email, deleting account, exporting data, MFA enrollment, payment method change).

- **Trigger:** the sensitive action surface.
- **Pattern:** in-context modal or inline form, **not** a full-page redirect to `/sign-in`. Preserves in-progress work.
- **Evidence:** server-side fresh-auth timestamp (last successful credential challenge ≤ N minutes ago, where N is the policy).
- **Auth methods accepted:** passkey / TOTP / password — match the strongest method the account has enrolled.
- **Failure:** explicit "Couldn't verify — try again" with retry. After M failed attempts, account-lock policy from `auth-flows`.
- **HTTP method discipline (per VF-FIND-030):** the re-auth confirmation endpoint is `POST`, not `GET`. Email-client prefetchers and link safety scans must not be able to consume the credential challenge.
- **Owner:** `visualforge-auth-flows`.

## Shared pattern 2 — Token-gated link expiry

Magic links, password-reset links, invite links, email verification links, share-token URLs.

- **Token lifetime:** declared per token type in `auth-flows.md` (typical: invites 7 days, password-resets 1 hour, magic-links 15 min, share-tokens product-dependent).
- **Single-use:** every token is single-use by default; double-redemption returns the "already-used" page, not the success page.
- **Expiry UI:** explicit "This link expired" screen with a clear next action (request new link, sign in, contact support).
- **Revoked-account behavior:** if the underlying account was deleted or suspended after the token was issued, surface the appropriate state page (deleted / suspended), not a generic 500.
- **Multi-tab / replay:** opening the link in a second tab while the first is mid-flow shows the right state, never silently overwrites.
- **Token consume on POST not GET:** prefetchers must not burn tokens (cross-references VF-FIND-030).
- **Owner:** `visualforge-auth-flows`. Cross-cited by `system-pages` (the expiry page itself) and `notifications-and-lifecycle` (the email or push that contains the link).

## Shared pattern 3 — Session-state edge cases

Per VF-FIND-009, every state-page subskill enumerates how its surfaces behave when:

- Session expired mid-action.
- Role revoked mid-session.
- Resource deleted mid-session.
- Resource archived mid-session.
- Multi-tab session conflict.
- Token-gated link expired.
- Rate-limited mid-action.
- Plan-state change mid-session.

The IA subskill owns the canonical map (`03-structure/information-architecture.md` §"Session-state edge case map"). Each state-page subskill confirms its surfaces honor the map.

## Shared pattern 4 — Notification ↔ system-state coordination

Lifecycle notifications (email / push / in-app) and system-page states must agree.

- **Account-deleted state:** the deletion-confirmation email, the deletion-complete state page, and the post-deletion sign-in attempt all read consistently.
- **Suspended state:** the suspension-notification (email + in-app on next login attempt), the suspension landing page, and the support-contact CTA all link to the same recovery path.
- **Rate-limited state:** the rate-limit error UI in-product, the rate-limit-email (when sent), and the public 429 page (when surfaced) cite the same reset window.
- **Maintenance state:** scheduled-maintenance notification (sent in advance), the maintenance landing page, and the in-product banner all use the same window and copy.
- **Owner:** `visualforge-notifications-and-lifecycle` for the messaging side; `visualforge-system-pages` for the visible page; `visualforge-content-design` owns the canonical copy strings (per VF-FIND-029 shared content map).

## Shared pattern 5 — Recovery copy and CTA discipline

Per the dark-pattern ban in `anti-slop-design-rubric.md`:

- **Cancellation must be as easy as signup** (FTC click-to-cancel guidance). Specifically: no extra confirmation steps beyond what signup required, no win-back gauntlet, no hidden "downgrade instead" path that buries cancel.
- **Recovery CTAs are honest** — "Try again" goes to a real retry, not a marketing upsell page. "Contact support" goes to a real channel, not a help-doc dead-end.
- **No fake urgency** in lifecycle emails. "Your subscription expires in 3 days" is honest only when the date is real and computed from persisted state, not a marketing template variable.
- **Spec-bound copy** (per VF-FIND-028) is flagged in the screen spec with `(spec-bound)` annotation so test authors and copy-editors know not to drift it. Examples: "Paid access is not granted by this return page" on a billing-success placeholder; PIPEDA / GDPR consent strings; cancellation-confirmation language.

## Shared pattern 6 — Honest unavailable / unknown / disabled states

When the system cannot honestly tell the user the answer:

- **Unknown provider state** (payment processor timed out, push delivery status pending) — first-class state, not silently treated as success or failure. Surface "Status pending — we'll update you when confirmed" with a way to refresh.
- **Disabled state** (feature off for this plan, off for this region, off for this user role) — explicit "This isn't available on [plan / region / role]" with the path to change it. Never silently hide.
- **Failed state** (provider returned a permanent failure) — clear failure copy, clear next action, no data loss.

These states are first-class per `failure-isolation-by-layer.md` and must appear in every state-page subskill's spec.

## Shared pattern 7 — Critical vs degraded path classification

Per `failure-isolation-by-layer.md` and VF-FIND-030, every state-page subskill identifies which of its operations are **critical** (failure breaks the user-visible outcome) vs **degraded** (failure is acceptable; user proceeds).

- **Critical:** session validation, role check, persistence write, redirect to success page.
- **Degraded:** analytics events, marketing-funnel pings, optional integrations, side-effect notifications.

Degraded operations must not be awaited inline in the critical path. Failure of a degraded operation must not cause a 500 the user sees.

## Per-subskill ownership

| Subskill | Owns (uniquely) | Cites this reference for |
|---|---|---|
| `visualforge-auth-flows` | Sign-in / sign-up flow shapes, MFA enrollment, SSO config, password rules, magic-link issuance, session lifetime policy | Patterns 1, 2, 3, 5, 6, 7 |
| `visualforge-system-pages` | 404 / 500 / maintenance / offline / suspended / rate-limited / browser-deprecated page layouts, illustration, copy patterns | Patterns 3, 4, 5, 6, 7 |
| `visualforge-notifications-and-lifecycle` | Channel choice (email / push / in-app / SMS), preference center, transactional vs marketing classification, send-time discipline | Patterns 2, 4, 5, 6, 7 |

Each subskill links to this reference for shared patterns and does not restate them. If a subskill needs to extend a pattern, it does so as a "Domain extension" subsection that cites the canonical pattern here.

## Validator enforcement (proposed)

A new validator check `check_state_page_cross_cites` (proposed per VF-FIND-040) warns when:

- `auth-flows.md`, `system-pages.md`, or `notifications-and-lifecycle.md` describe re-auth, token-gated links, session-edge-cases, recovery copy, unavailable states, or critical/degraded classification **without citing this reference**.
- Two of those files describe the same pattern with different numeric values (e.g., different magic-link lifetimes).

Paired-condition fixture: one file violates the cross-cite rule and asserts the check fires; one complies and asserts it does not. Sabotage-testing the check by no-op'ing it must fail only the violating fixture.
