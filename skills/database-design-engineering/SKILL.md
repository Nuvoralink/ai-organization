---
name: database-design-engineering
description: Use when designing, reviewing, or changing database schemas, migrations, indexes, relationships, constraints, query patterns, data integrity rules, multi-tenant data models, database reliability, SLI/SLOs for data stores, backup/restore, or persistence boundaries.
---

# Database Design Engineering

Treat the database as a product contract and integrity boundary, not just storage.

## Core Rules

- Model source-of-truth data explicitly; do not recover structure from prose downstream.
- Use constraints, foreign keys, uniqueness, and indexes to enforce real invariants.
- Design migrations for compatibility, backfill, rollout, and rollback risk.
- Keep tenant and ownership boundaries queryable and enforceable.
- Avoid over-fetching and unbounded queries.
- Keep read models and derived data rebuildable or clearly authoritative.

## Use Reference

Read:

- `references/database-design-engineering.md` for detailed schema, migration, and query guidance.
- `references/database-reliability.md` for database SLI/SLOs, backups, recovery, replication, failure modes, and operational resilience.

## Verification

Check migrations, generated clients/types, realistic data fixtures, query plans for risky paths, and consumer compatibility.
Before relying on this skill, run `node scripts/check-reference-links.mjs`; every local Markdown
reference must resolve from this skill root. A missing reference is a blocking skill defect, not an
optional deep-dive.
