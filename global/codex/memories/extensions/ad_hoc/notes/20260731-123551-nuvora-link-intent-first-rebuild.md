# Nuvora Link intent-first audit and repair rule

The user explained that Nuvora Link was originally built while they were learning to code and before the current engineering guardrails existed. Expect broad architectural, security, correctness, and maintainability defects.

For Nuvora Link audits and fixes:

- Treat the current code as evidence of historical product intent, not as an architecture that must be preserved.
- Recover the intended product outcome from product docs, journeys, persisted contracts, and user-visible behavior before proposing a fix.
- Map the complete relevant pipeline and identify the earliest wrong authority or architectural decision.
- Propose the durable product-first architecture, compare it with at least one real alternative, then implement the root fix.
- Do not patch around the current structure merely because it exists.
- Replace or retire superseded paths and prove the final user-visible or system-visible outcome.
