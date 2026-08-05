# Nuvora Link dialer retirement

The user confirmed that the built-in dialer in Nuvora Link is retired and can be fully removed.

For future Nuvora Link work:

- Do not preserve, repair, extend, or harden the dialer as a product capability.
- Treat dialer UI, routes, provider integrations, jobs, schema, configuration, docs, tests, and now-orphaned shared helpers as one connected retirement slice.
- Remove or migrate every dependent and verify repo-wide that no active dialer path, billing/provider side effect, secret requirement, or visible entry point remains.
- Preserve only non-dialer capabilities whose real product journeys still require them, and make any retained shared component's non-dialer purpose explicit.
