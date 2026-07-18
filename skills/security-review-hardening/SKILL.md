---
name: security-review-hardening
description: Use when reviewing, auditing, or hardening security across web apps, APIs, auth, RBAC, AI systems, rate limits, quotas, token metering, GraphQL, CI/CD, dependencies, supply chain, static analysis, Semgrep, CodeQL, insecure defaults, variant analysis, or Trail of Bits-style security review workflows.
---

# Security Review Hardening

Use a security-review mindset: least privilege, explicit validation, fail closed, clear trust boundaries, and evidence-backed findings.

## Core Review Areas

- Authentication, authorization, RBAC, tenancy, and object-level access control.
- Input validation, output encoding, file handling, and injection surfaces.
- Secrets, tokens, credentials, key rotation, and logging hygiene.
- Dependency, build, CI/CD, and supply-chain risks.
- AI-specific risks: prompt injection, unsafe tool use, untrusted model output, data leakage, and policy bypass.
- GraphQL/API exposure, over-broad queries, introspection, and resolver authorization.
- Insecure defaults, fail-open behavior, missing rate limits, and privilege escalation.

## Use References

- General hardening: `references/security-and-hardening.md`
- Trail of Bits workflow: `references/audit-prep-assistant.md`, `references/secure-workflow-guide.md`
- OpenAI security workflow: `references/openai-security-best-practices.md`, `references/openai-security-threat-model.md`, `references/openai-security-ownership-map.md`
- Supply chain: `references/supply-chain-risk-auditor.md`
- Static analysis: `references/semgrep.md`, `references/codeql.md`
- Variant and insecure-default hunting: `references/variant-analysis.md`, `references/insecure-defaults.md`
- AI/web/GraphQL/CI security: `references/ai-security.md`, `references/graphql-security.md`, `references/cicd-devsecops.md`, `references/vibe-security-skill.md`
- AI/token metering abuse controls, tenant quotas, and billing guardrails: `references/ai-metering-billing.md`

## Reference integrity (blocking)

Every local Markdown path named by this skill or one of its bundled references must resolve inside
this skill package before the reference is used. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check_reference_integrity.ps1
```

Do not silently skip, guess, or search for an absent checklist/template. Either make the selected
reference self-contained or add the real local resource and rerun the check.

- Fail-state: a reviewer follows a bundled workflow to a missing checklist, workflow, example, or
  template and silently performs a narrower audit.
- Regression mutation: add a Markdown link under `references/` whose target is a deliberately absent
  `.md` sentinel; the integrity command must exit nonzero and name the source file and target.
- Counterexample: external `https://` links and in-document `#anchors` are not local package files and
  remain allowed.
- Validation: after restoring the mutation, the integrity command and the canonical skill validator
  must both exit zero.

## Output

Lead with exploitable or high-impact findings. For each issue, include impact, attack path or failure mode, affected files, and a durable fix. Avoid speculative noise.
