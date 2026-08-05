# Onboarding / signup flow — industry-standard stage patterns

Reference for the `frontend-design-director` "Ground the problem" mandate: when designing a NEW
multi-stage user flow, match these researched patterns instead of inventing the sequence or screen
composition. Verify freshness against current products before relying on a specific vendor claim —
telephony/SaaS trial terms shift. Evidence tiers: **[V]** = a product's own page was read; **[I]** =
secondary/snippet.

## Canonical stage sequence (B2B SaaS free trial with resource provisioning)

1. **Account creation — credentials ONLY.** Email+password OR SSO-first (Google/Microsoft/Apple) with
   email fallback; sometimes first/last name. **No company, no card.** (HubSpot [I]; SSO-first is the
   modern default.)
2. **Email verification — its own screen.** 6-digit code or magic link; provider (Gmail/Outlook)
   shortcuts. (Twilio, Telnyx [V].)
3. **Personalization survey (1 screen, skippable).** Role / team size / use-case → branches the flow
   and sets safe defaults. (Notion, Canva, Asana [V].)
4. **Workspace / company (1 screen, progressive).** Company/workspace name, timezone. (Slack, Telnyx.)
5. **Invite teammates — DEFER** to after first value (offer it in the getting-started checklist, never
   a blocking modal before value — Slack's insistent invite modal is the cautionary case). [I]
6. **Getting-started checklist (first value).** In-app, dismissible, progress; drives the first real
   action (import leads, connect CRM, first call). Not a forced tour. (Aircall, Kixie, Notion [V].)

Steps 3–6 are progressive/skippable — **not** a blocking wizard. Steps 1–2 are always isolated from
anything money-related.

## The card / payment step — timing and placement (the high-error area)

**Credentials and card are NEVER on the same screen.** The card is always a **dedicated screen,
standard Stripe Elements, in a later step.** Best practice: "don't ask for card as a customer walks
in — account first, payment subsequent" (gr4vy, Stripe [I]).

Three real patterns:
- **(a) No card until conversion** — modern PLG default, highest volume. (Twilio, Aircall, Kixie,
  Canva, Asana, Slack [V for Twilio/Aircall].)
- **(b) Card at a dedicated step after signup (reverse trial)** — Notion, RingCentral [V Notion].
- **(c) Card-for-verification at signup — authorize, DON'T charge.** Highest conversion + cuts fraud.
  **OpenPhone/Quo:** *"credit card required for identity verification and spam prevention," not charged
  during the trial* [V].

**Telephony specifically:** toll-fraud forces a gate — either card-for-verification (OpenPhone/Quo),
KYC + escalating limits (Telnyx), or a caged no-card trial (Twilio: 1 number, calls only to verified
numbers). If a product provisions a real phone number in-trial, **place the card at the "claim your
number / activate calling" moment — its own screen, a Stripe SetupIntent (authorize, not charge),
framed as verification not billing** ("verify to activate your number · not charged during trial").
The number is the toll-fraud-exposed resource, so gating provisioning with verification feels *earned*,
not extractive. Never on the credentials screen, never bundled with a Terms checkbox.

## DO
- Card is its own dedicated step; two-step (details → card) recovers abandoners. (chargebee [V, advisory])
- Card-for-verification = authorize-don't-charge, framed as anti-fraud, for telephony. (Quo [V])
- Email verification is a discrete step with provider shortcuts. (Twilio [V])
- Progressive getting-started checklist over a forced tour. (Aircall [V])
- Number provisioning = area-code/city search + choose (not silent auto-assign). (OpenPhone/Quo [V])

## DON'T
- **Card on the credentials screen** — no product does this; best practice forbids it. (gr4vy [I])
- One long single-page form mixing account + company + payment — raises abandonment; multi-step + a
  progress bar instead. (zuko [I])
- Block the flow to force teammate invites before first value. (Slack modal [I])

*Source note: triangulated from product help-docs (Quo, Aircall, Twilio, Telnyx) + practitioner
teardowns (Elena Verna reverse-trials, HubSpot, gr4vy/Stripe form guidance). The telephony card/number
placement is [V]; intermediate survey/workspace stages are more [I]. Re-verify a vendor specific before
citing it as settled.*
