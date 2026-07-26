# Security Policy

## Supported versions

Only the latest public release of SpecForge Core is supported.

## Reporting a vulnerability

Open a private security advisory on GitHub, or contact the maintainer listed in the repository profile.

Do not post exploit details publicly before the issue is triaged.

## Scope

In scope:

- Unsafe skill instructions that could expose secrets.
- Instructions that weaken security review.
- Validator issues that allow obviously unsafe docs to pass.
- Repo-audit behavior that may leak private data into public docs.

Out of scope:

- Claims that generated app docs guarantee security.
- Vulnerabilities in third-party tools not bundled with SpecForge.
- Misuse caused by ignoring the generated warnings, review triggers, or validation failures.

## Security design principle

SpecForge should create reviewable security documentation. It must not claim that documentation alone makes an app secure.
