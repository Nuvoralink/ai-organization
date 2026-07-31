---
paths:
  - "apps/**"
  - "packages/**"
  - "scripts/**"
  - "docs/**"
  - "package.json"
---
# Centralization and retirement

Search repo-wide before creating. One domain decision, registry value, route contract, time window, metric definition, side-effect owner, and lifecycle state has one authority. Extend that authority and repoint all consumers; never layer a new path over the old one.

When replacing or retiring anything, enumerate all producers, feeders, consumers, docs, tests, config, dependencies, jobs, migrations, and UI entry points before editing. Remove or explicitly demote every superseded path and run a final old-name sweep.

Product truth stays in project-owned ADRs, governance, schema, and source; orchestration files route to it without copying it.

Killer mutation: add a duplicate helper/registry/scheduler, leave one old consumer, preserve a compatibility path with no named retirement condition, or copy product specifications into the overlay.
