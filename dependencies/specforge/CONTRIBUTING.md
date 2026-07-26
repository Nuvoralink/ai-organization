# Contributing to SpecForge Core

Contributions are welcome.

## What belongs in Core

Core should include:

- Skill instructions
- Shared references
- Validation scripts
- Documentation templates
- Public examples
- Safer defaults
- Better anti-slop checks

Core should not include:

- Private API keys
- Paid-only secrets
- Customer data
- Closed-source templates copied from private clients
- Claims of guaranteed compliance or security

## Before opening a pull request

Run:

```bash
python scripts/verify_package.py
python skills/_specforge-shared/scripts/validate_app_docs.py --help
python skills/_specforge-shared/scripts/validate_implementation_artifacts.py --help
```

Check:

- Every skill has `SKILL.md`.
- Every `SKILL.md` has front matter with `name` and `description`.
- Shared references exist.
- The plugin manifest exists.
- No placeholder product claims are introduced.
- No OpenAI marketplace or install claim is made without matching current docs.

## Skill writing rules

- Keep each skill focused.
- State when the skill should and should not be used.
- Define clear inputs and outputs.
- Require evidence labels for important claims.
- Require assumptions when evidence is missing.
- Require validation or review for high-risk docs.
- Avoid long generic advice.

## Pull request description

Use this format:

```text
What changed:

Why it changed:

Risk:

Validation run:

Screenshots or examples, if relevant:
```
