# Lessons Applied

SpecForge uses lessons from AI-assisted app builds only as pattern evidence, not as a rulebook for every project.

## Applied patterns

- Keep one source of truth for user-visible claims.
- Define who owns each decision before validators and UI depend on it.
- Use bounded remediation instead of silent patching.
- Prove high-risk claims from source to final surface.
- Treat docs as a source-of-truth system with active, historical, generated, marketing, backlog, and retired classes.
- Keep root-cause analysis bounded by a named risk or data-flow boundary.

## Generalization rule

SpecForge must not copy product-specific examples from past projects. It should ask whether the current app has AI, dashboards, workflow status, payments, roles, sensitive data, exports, integrations, or other high-risk claims. Then it should choose the smallest assurance tier that protects that app.
