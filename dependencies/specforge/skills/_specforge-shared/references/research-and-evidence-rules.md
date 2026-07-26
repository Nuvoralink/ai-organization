# Research and Evidence Rules

Use this file before drafting any app planning document.

## Purpose

Make documentation evidence-backed. Codex must not produce generic advice, stale practices, invented standards, or unsupported claims.

## Research trigger

Before each major document section, identify:

- App type.
- Platform.
- Stack.
- Data sensitivity.
- Regulatory or domain risk.
- AI or automation risk.
- Repo evidence available.

Then research or use the baked-in source map.

## Source priority

Use this order:

1. Repo evidence and user-confirmed requirements for app-specific facts.
2. Official standards and official project documentation.
3. Official vendor or platform documentation.
4. Primary project docs for open-source libraries.
5. Reputable security or engineering references only when official sources are absent or incomplete.

Do not use random blog posts when official docs exist.

## Research ledger

Create or update `docs/app-plan/auditability/research-ledger.md`.

Each source entry must include:

- Source ID.
- Title.
- Owner or publisher.
- Version, publication date, or last updated date when available.
- URL.
- Access status: researched online, baked-in fallback, or repo-derived.
- Why this source matters.
- Decisions or requirements affected.
- Limits or uncertainty.

## Per-document source basis

Every generated document must include a `Sources and basis` section with:

- User-confirmed inputs used.
- Repo-derived evidence used.
- Standards or official sources used.
- Assumptions used.
- Sources rejected or not available, if relevant.

## Standard-backed requirement format

When a standard affects a requirement, write it like this:

- Requirement ID: SEC-AUTH-001
- Requirement: All protected objects must enforce object-level authorization on the server.
- Source basis: OWASP ASVS or OWASP API Security guidance, plus repo or app context.
- Applies to: endpoint list or feature list.
- Verification: integration tests and negative access-control tests.

## Repo evidence format

When deriving docs from code, record:

- File path.
- Symbol, route, model, migration, command, or config key.
- Confidence: high, medium, low.
- Risk if wrong.
- Whether docs were updated.

## No-internet fallback

If current internet research is unavailable:

- State that online research was unavailable.
- Use `best-practice-source-map.md` as the baseline.
- Do not claim the baseline is the newest version unless the source map explicitly says so.
- Tell the user which sources should be verified later.

## Claims to avoid

Avoid these unless supported by evidence:

- `latest`.
- `current standard`.
- `industry best practice`.
- `secure by default`.
- `compliant`.
- `enterprise-grade`.
- `production-ready`.

Use exact requirements instead.

