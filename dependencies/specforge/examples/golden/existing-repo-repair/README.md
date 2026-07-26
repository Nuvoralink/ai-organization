# Golden Example: Existing Repo Repair

This fixture shows the expected quality bar for a repo documentation repair.

Scenario: an existing app stores support tickets in `tickets` but old docs say ticket status is derived from audit log events. The repair updates documentation authority so future agents do not patch UI labels while leaving the wrong source of truth in place.

Validation:

```bash
python skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir examples/golden/existing-repo-repair/docs/app-plan --profile focused --final --strict --existing-repo
```
