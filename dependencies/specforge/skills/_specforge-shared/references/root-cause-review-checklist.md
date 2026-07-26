# Root-Cause and No-Shortcut Review Checklist

Use this checklist during quality review and existing repo documentation updates.

## Root-cause checks

For each stale doc, missing doc, contradiction, vague requirement, or risky recommendation, confirm:

- The symptom is described.
- Evidence is cited from user input, repo path, standard, or assumption.
- The likely cause is identified.
- The deeper root cause is identified when possible.
- The proposed fix addresses the root cause, not only the symptom.
- The fix updates related docs, IDs, contracts, tests, rules, and guardrails.
- A verification method exists.
- A recurrence prevention step exists.

## Shortcut red flags

Flag and revise when the output says or implies:

- Use whatever is easiest.
- Add a placeholder for now.
- Skip tests because this is documentation.
- Defer security until implementation.
- Defer privacy until launch.
- Add an admin role without precise permissions.
- Store extra data because it might be useful.
- Use a custom auth or payment system without strong justification.
- Make broad architecture claims without failure modes or reversal triggers.
- Mark compliance as done without qualified review when review is needed.
- Claim production readiness without monitoring, rollback, alerts, backups, and quality gates.

## Reviewer required output

When shortcuts are found, write:

- Finding ID
- Affected doc
- Shortcut pattern
- Root cause
- Required correction
- Correction applied or remaining gap
- Verification method
