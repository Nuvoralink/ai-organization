# AGENTS.md

This repository contains the public SpecForge Core Codex plugin and skill pack.

## Contributor rules

- Keep the Core edition useful without requiring paid services.
- Do not add secrets, API keys, access tokens, customer data, or private repo data.
- Do not weaken the anti-slop, evidence, review, or validation rules to make generation faster.
- Keep skills focused. Prefer one focused skill over one large skill that does too much.
- Preserve public compatibility with Codex plugin structure.
- Run the package verifier before publishing.

## Required checks

```bash
python scripts/verify_package.py
python scripts/quality_selftest.py
python skills/_specforge-shared/scripts/validate_app_docs.py --help
python skills/_specforge-shared/scripts/validate_implementation_artifacts.py --help
```

## Writing rules

- Use clear, specific instructions.
- Prefer testable requirements over broad advice.
- Mark assumptions clearly.
- Do not claim compliance, security, or production readiness without verification steps and review triggers.
