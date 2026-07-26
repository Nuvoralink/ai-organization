# Golden Example: Greenfield Focused Package

This fixture shows the expected quality bar for a focused SpecForge package.

Scenario: a small team is planning **FieldLog**, a web app for field technicians to capture job notes, photos, follow-up tasks, and manager review comments.

This is not a full product package. It demonstrates how a targeted package should still provide source labels, requirements, decisions, risks, implementation traceability, and validation proof without generating unrelated filler documents.

Validation:

```bash
python skills/_specforge-shared/scripts/validate_app_docs.py --docs-dir examples/golden/greenfield-focused/docs/app-plan --profile focused --final --strict
```
