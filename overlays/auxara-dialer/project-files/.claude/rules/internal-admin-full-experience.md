---
description: Internal admin should inherit full agency-owner product access plus admin tools
paths:
  - "backend/src/**/*admin*"
  - "backend/src/**/*auth*"
  - "frontend/src/**/*admin*"
  - "frontend/src/**/*auth*"
  - "docs/app-plan/**/*"
---

# Internal Admin = Full Agency Owner Plus Admin

- Treat `INTERNAL_ADMIN` as having the full product experience of an agency owner, not a reduced admin-only shell.
- Internal admin should see the same primary product surfaces as a **tenant owner** (the dialer's surfaces, per `docs/app-plan/product/04-user-flows-and-screen-map.md` §"Screen inventory"): **Wallboard / Dashboard**, the **Softphone** (to validate dialing end-to-end), **Conversations inbox**, **Number pool + Number health**, **Campaigns / Lists**, **Team & Custom roles builder**, **10DLC dashboard**, **Compliance config**, **Audit log**, and **Billing / Account**. (These replace the CoachAI surface list this rule was carried over from — the dialer has no `Sessions / Team coaching / Feedbacks / Materials` pages; coaching is the separate CoachAI product.)
- Internal admin keeps all admin-only tools and settings on top of that owner experience.
- Do not create separate placeholder admin variants of product pages when the real owner-facing surface already exists.
- If a page is available to an agency owner and useful for validating production wiring, internal admin should be able to reach it directly.
- The admin page should expose clear links to the live product surfaces so internal admin can verify working flows from one place.
