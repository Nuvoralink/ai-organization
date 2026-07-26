# Assurance Generalization Audit

## Purpose

This audit explains how the lessons from a specific AI-heavy build were generalized so SpecForge does not force one application's architecture onto unrelated projects.

## What changed

- Renamed the trust extension to assurance architecture.
- Replaced AI-first language with decision-owner language.
- Made assurance docs proportional by tier instead of mandatory for every app.
- Replaced `AI owns meaning, code validates` as a universal rule with a context-aware decision boundary.
- Kept the stricter AI boundary only for runtime AI, generated content, semantic classification, recommendations, or agentic tool use.
- Replaced bounded repair with bounded remediation so deterministic apps can use recompute, re-fetch, cache invalidation, human review, or fail-closed behavior.
- Replaced source-to-UI wording with source-to-surface wording so exports, APIs, reports, notifications, dashboards, and integrations are covered.
- Added validator support for `--assurance` so simple apps are not forced to produce filler docs.

## What stayed

The reusable lessons stayed because they map to common engineering and product risks:

- source-of-truth ownership;
- decision matrices before validators;
- evidence and provenance for high-risk claims;
- no UI or export truth invention;
- role-specific controls;
- documentation authority lifecycle;
- blast-radius and root-cause review;
- validation ladders and golden fixtures for high-risk paths.

## What was intentionally not imported

- Domain-specific examples, prompt names, workflow names, model choices, or business logic from the source app.
- Product-specific prompt names, material layers, model choices, or business workflows.
- Any rule that only made sense for one app's domain.

## Safety guard

When a lesson is not relevant to the current app, SpecForge must mark it `not-applicable-with-reason` or fold the useful part into an existing doc. It should not create a new document just to satisfy a pattern.
