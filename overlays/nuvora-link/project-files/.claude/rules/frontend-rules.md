---
paths:
  - "apps/web/**"
---
# Frontend delivery

Any visible change requires a Claude Design mock/reference and explicit approval before production code. Load the frontend design director and its routed product-UI specialist first. Figma is not an active authority.

Extend existing design tokens and components before creating new primitives. Raw visual literals belong only in token sources. Preserve role and organization-scoped UX while enforcing authorization server-side. Do not introduce tenant onboarding or generalized SaaS administration. Render and verify loading, empty, error, populated, disabled, keyboard/focus, reduced-motion, and named breakpoint states against the approved reference.

Retired dialer, softphone, phone-number, and provider call-history entry points must remain absent. Removing a visible retired surface still follows approval before code.

Killer mutation: implement before approval, inline a tokenized value, hide an unauthorized action only in the client, omit an error state, or restore a retired navigation entry.
