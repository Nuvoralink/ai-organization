# Operations runbook

## First machine or clean rebuild

1. Clone this private repository and the product repositories you are authorized to use.
2. Copy `registries/project-roots.example.json` to the ignored `registries/project-roots.local.json`; enter local checkout paths only.
3. Run `npm test` and `npm run control:validate`.
4. Run `npm run control:install -- --dry-run` and review every planned target.
5. Run `npm run control:install`, then `npm run control:check`.
6. Install each required project overlay with its explicit `--root`, then run the matching overlay check.

A bootstrap is complete only when tests, canonical validation, installed parity, and the selected project overlay checks all exit zero.

Run `gitleaks git --redact` as the independent history-aware secret scan before publication. Any false positive must be suppressed by its exact historical fingerprint in `.gitleaksignore`; whole paths and rules must not be exempted.

## Normal change flow

1. Edit canonical content in this repository or capture a declared project orchestration path after reviewing the source diff.
2. Run the narrow test for the changed authority, then `npm test` and `npm run control:validate`.
3. Dry-run the install. A dirty managed target, local-only managed file, collision, secret-shaped value, or machine-specific path is a stop condition.
4. Install, run parity, open the affected generated files, and use an isolated branch/PR for every product-repository update.

Do not hand-edit a generated destination and leave the change there. Promote the change to canonical source, reinstall it, and prove parity in the same task.

## Recovery and rollback

Each successful install records an install ID in its lock and writes a pre-change snapshot beside that lock. To roll back the most recent eligible global install:

```powershell
npm run control:rollback
```

To select an exact install:

```powershell
npm run control:rollback -- --install-id <install-id>
```

For a project overlay, use `node scripts/project-overlay.mjs rollback <project> --root <path> --install-id <install-id>`. Rollback refuses to overwrite a target that changed after installation; reconcile that dirty file deliberately instead of forcing recovery over it.

## Drift response

- `missing`: reinstall the declared mapping.
- `drift`: inspect the diff; either promote a legitimate change through canonical capture or restore from canonical install.
- `local-only`: classify it. Add an explicit safe mapping only when it is orchestration; otherwise move/remove it from the managed root.
- `unclassified-local-only`: a non-allowlisted file exists in a dedicated managed root. Investigate without opening a secret-bearing file.
- `absolute-path`, `secret-shaped-content`, or `forbidden-tracked-path`: stop publication and remove the unsafe canonical content.
- `unexpected-link-target`: do not follow or replace the link automatically. Verify ownership and use an explicitly approved retirement migration.

## Human gates

Local validation, branches, commits, pushes, and PR creation are agent-authorized inside task scope. Deployment, production mutation/configuration, migrations, destructive or billed actions, external contact, secrets, visible-design approval, and unresolved product/material-architecture decisions require the user. Conditional agent merge is never used for a broad control-plane change or any change with a deploy effect.

## Sensitive-state boundary

Never point capture at a home directory or product tree. The manifests select individual orchestration files and safe directories. Secrets, environment files, histories, logs, telemetry, caches, credentials, customer/provider data, recordings, transcripts, and application source remain outside this repository and its automation reports.
