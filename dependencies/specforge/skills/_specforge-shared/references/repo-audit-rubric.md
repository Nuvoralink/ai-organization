# Existing Repo Documentation Audit Rubric

Use this when the user asks to read a repo, update docs, fix docs, generate docs from code, or align documentation with an existing project.

## Hard rules

- Do not change product code unless the user explicitly asks for code changes.
- Do not run destructive commands.
- Do not install dependencies unless required and approved by the user or allowed by repo instructions.
- Do not run migrations against production or shared environments.
- Do not read or print secrets. If secrets are discovered, report the file path and remediation category without exposing the value.
- Prefer updating existing docs over creating duplicates.
- If code and docs disagree, trust code for current behavior and record the conflict.

## First pass files to inspect

- `README.md`
- `AGENTS.md`, `AGENTS.override.md`, `.agents.md`, or team instruction files
- `docs/`
- `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
- `pyproject.toml`, `requirements.txt`, `poetry.lock`, `Pipfile`
- `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `.csproj`
- `Dockerfile`, `docker-compose.yml`, `compose.yml`
- `.github/workflows/`, `.gitlab-ci.yml`, `buildkite`, `circleci`, `azure-pipelines.yml`
- `.env.example`, config templates, sample secrets files
- `src/`, `app/`, `pages/`, `routes/`, `api/`, `server/`, `services/`
- `db/`, `migrations/`, `schema.prisma`, `supabase/`, `drizzle/`, `models/`
- `tests/`, `__tests__/`, `e2e/`, `cypress/`, `playwright/`

## Repo evidence matrix

Create a matrix with:

- Fact
- Evidence path
- Evidence type: file, script, config, test, route, schema, migration, generated client, docs
- Confidence
- Related doc
- Requirement ID or affected section
- Needs update: yes or no
- Risk if wrong
- Last verified date

## Documentation remediation rules

1. Inventory existing docs.
2. Identify canonical docs and duplicate docs.
3. Preserve useful existing wording.
4. Add missing sections using the App Documentation Specification.
5. Remove or mark stale claims only when code evidence is clear.
6. Add `Last verified from code` notes with date and evidence paths.
7. Link docs together through the docs index.
8. Create `docs/app-plan/auditability/documentation-audit.md`.
9. Run the validation script if available.

Focused repo-audit packages should use descriptive lowercase kebab-case
filenames such as `auditability/documentation-audit.md`, `auditability/decision-log.md`, and
`auditability/research-ledger.md`. Numbered SpecForge filenames are legacy aliases only.

If an in-scope security, privacy, threat-model, architecture, API, runbook, or
quality doc is missing, create or update the actual document. Do not only write
an audit recommendation that says a later user or agent should create it. If a
living document already owns the area, update and route that living document
instead of creating a duplicate authority.

## Suggested safe commands

Use commands only when available and appropriate:

```bash
pwd
find . -maxdepth 3 -type f | sed 's#^./##' | sort | head -300
git status --short
git ls-files | sort | head -500
rg -n "TODO|FIXME|deprecated|auth|login|permission|role|secret|token|api|route|schema|migration|payment|admin|webhook|rate limit|retention|delete" .
```

Do not run commands that expose secret values. Avoid `cat .env` and similar commands.


## Stale-doc detection rules

Treat a doc as stale when:

- It names commands that are missing from package or build files.
- It describes routes, screens, APIs, schemas, roles, or deployment steps not present in code.
- It omits auth, data, or integration behavior visible in code.
- It references old frameworks, old package managers, old CI providers, or old deployment targets.
- It contradicts tests, migrations, env templates, or generated contract files.

When stale docs are found, update the doc if the current behavior is clear. If not clear, record the uncertainty in `auditability/documentation-audit.md`.

