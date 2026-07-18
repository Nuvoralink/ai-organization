---
name: api-interface-design
description: Use when designing, reviewing, or changing APIs, service interfaces, DTOs, SDK contracts, request/response shapes, versioning, pagination, errors, compatibility, rate limiting, quotas, metering contracts, or interface boundaries. Combines API-and-interface-design with API-design-first guidance for stable product contracts.
---

# API Interface Design

Design APIs and interfaces from the consumer outcome backward, then make the implementation fit the contract.

## Core Rules

- Start from use cases, not current database shape.
- Keep contracts explicit, typed, documented, and backward compatible when possible.
- Prefer additive changes for live products.
- Validate input at boundaries and normalize machine-consumed output before persistence or downstream use.
- Use consistent error envelopes, status codes, pagination, filtering, and idempotency semantics.
- Keep routes/controllers thin; move business rules into services/helpers.
- Do not parse narrative text when a structured field belongs in the API.
- For APIs that accept external or user-supplied structured data, define malformed-structure behavior, duplicate-key/header behavior, alias/mapping behavior, limits, unsupported formats, and privacy redaction as part of the contract.
- If the contract claims idempotency, define whether it covers sequential retry, concurrent duplicate trigger, provider replay, or all of them, and name the durable key/lock/claim/provider event that enforces it.
- When route paths, callback URLs, public exports, or job endpoint names change, update examples and docs from the actual route/file inventory or build output, not memory.

## Use References

- For API and interface stability, read `references/api-and-interface-design.md`.
- For API-first workflow and contract-first implementation, read `references/api-design-first.md`.
- For metering, quota, and billing-facing API contracts, read `references/ai-metering-billing.md`.

## Verification

Check source-of-truth tests, consumer tests, negative paths, realistic messy adapter fixtures, sequential and concurrent idempotency proof where relevant, compatibility with existing clients, actual route inventory, and documented examples.
