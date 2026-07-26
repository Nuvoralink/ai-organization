# Publishing Checklist

Before making the GitHub repo public:

- Add final public homepage, repository, website, privacy, and terms URLs to `.codex-plugin/plugin.json`.
- Choose the final repo name.
- Confirm the license is correct.
- Run `python scripts/verify_package.py`.
- Run `python scripts/quality_selftest.py`.
- Run `python skills/_specforge-shared/scripts/validate_app_docs.py --help`.
- Run `python skills/_specforge-shared/scripts/validate_implementation_artifacts.py --help`.
- Confirm no private files are included.
- Confirm no API keys or tokens are included.
- Add screenshots or examples if you want a stronger landing page.
- Create the first GitHub release.

Suggested repo description:

```text
Codex plugin and skill pack for evidence-backed app documentation, architecture, security, threat modeling, and AI development guardrails.
```

Suggested topics:

```text
codex, openai, ai-agents, developer-tools, documentation, product-requirements, architecture, threat-modeling, security, ai-guardrails
```
