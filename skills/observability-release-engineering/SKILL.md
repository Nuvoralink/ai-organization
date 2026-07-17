---
name: observability-release-engineering
description: Use when planning, implementing, or reviewing reliability, observability, monitoring, telemetry, logs, metrics, traces, alerts, SLOs, incident readiness, deployment pipelines, CI/CD, release readiness, rollbacks, launch checklists, or production operations.
---

# Observability Release Engineering

Ship changes with visibility, rollback paths, and operational confidence.

## Core Workflow

- Define what success, failure, and degraded behavior look like before shipping.
- Add logs, metrics, traces, and alerts at product-critical boundaries.
- Keep sensitive data out of telemetry.
- Make deployments repeatable and environment-aware.
- Prefer small releases with verification gates and rollback paths.
- Treat launch readiness as product, engineering, support, and observability together.

## Use References

- Observability and monitoring: `references/observability-monitoring.md`
- Reliability engineering, SLOs, incident readiness, and production resilience: `references/reliability-engineering.md`
- Sentry workflows: `references/openai-sentry.md`
- Deployment and release engineering: `references/deployment-release-engineering.md`
- CI/CD automation: `references/ci-cd-and-automation.md`
- Shipping and launch readiness: `references/shipping-and-launch.md`

## Output

Include release risks, instrumentation points, validation steps, rollback options, and post-release monitoring.
